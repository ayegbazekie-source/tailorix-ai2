/**
 * TAILORIX AI — MASTER APPAREL CAD & DECONSTRUCT WORKBENCH
 * Unified, professional garment technology workspace.
 * Integrates:
 * - Garment Specification Model & Taxonomy
 * - AI / Heuristic Garment Deconstruction
 * - Parametric Measurement Architecture
 * - Deterministic Structured 2D CAD Geometry Engine
 * - Interactive Node Editing, Seam Allowance Offsetting, Grainlines, and Notches
 * - Point-Specific Multi-Size Grading Nesting
 * - Algorithmic Fabric Marker & Yield Estimation
 * - 3D Mannequin Fit & Strain Simulation
 * - Production Vector Exports (SVG, AAMA DXF, 1:1 Tiled PDF)
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import CADHeaderBar from '../CAD/CADHeaderBar';
import CADToolRail from '../CAD/CADToolRail';
import ProfessionalCADCanvas from '../CAD/ProfessionalCADCanvas';
import CADPropertiesPanel from '../CAD/CADPropertiesPanel';
import CADMeasurementBar from '../CAD/CADMeasurementBar';
import GradingMatrixView from '../CAD/GradingMatrixView';
import FabricMarkerView from '../CAD/FabricMarkerView';
import Garment3DSimulationView from '../CAD/Garment3DSimulationView';
import ImageUploader from './ImageUploader';

import { createGarmentSpecification } from '../../models/garmentSpecification';
import { getDefaultMeasurementsForGarment } from '../../models/measurementDefinitions';
import { generatePattern } from '../../utils/patternEngine/patternRegistry';
import { generatePointGradedPattern } from '../../utils/patternEngine/pointGradingEngine';
import { exportPatternToSVG, exportPatternToDXF, exportPatternToTiledPDF } from '../../utils/patternEngine/cadExportEngine';
import { analyzeGarmentImage } from '../../services/garmentAnalyzer';
import { renderPieceToSvgPath, calculatePieceBounds } from '../../models/patternGeometry';
import { applySeamAllowanceToPiece } from '../../utils/patternEngine/geometricSeamOffset';
import { SLOPER_BLOCK_TEMPLATES } from '../../templates/presetLibrary';

import { Sparkles, Upload, X, Check, Image as ImageIcon, Sliders } from 'lucide-react';

export default function DeconstructWorkbench({ initialImage = null }) {
  // --- Master Garment Specification State ---
  const [garmentSpec, setGarmentSpec] = useState(() =>
    createGarmentSpecification({
      name: 'Tailored Trouser Project',
      garmentType: 'trouser',
      silhouette: 'classic',
    })
  );

  // --- Dynamic Measurements State ---
  const [units, setUnits] = useState('in'); // 'in' | 'cm'
  const [measurements, setMeasurements] = useState(() =>
    getDefaultMeasurementsForGarment('trouser')
  );

  // --- Workspace Views & CAD Tool State ---
  const [activeViewMode, setActiveViewMode] = useState('cad'); // 'cad' | 'grading' | 'marker' | '3d'
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'node' | 'tape' | 'pan'
  const [selectedPieceId, setSelectedPieceId] = useState('TROUSER_FRONT_LEG');

  // Canvas Toggles
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showSeamAllowance, setShowSeamAllowance] = useState(true);
  const [showGrainlines, setShowGrainlines] = useState(true);

  // AI Deconstruction & Reference Modal State
  const [referenceImage, setReferenceImage] = useState(initialImage);
  const [showDeconstructModal, setShowDeconstructModal] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Grading State
  const [activeSizes, setActiveSizes] = useState(['S', 'M', 'L', 'XL']);

  // Custom node overrides (pieceId -> pointIndex -> {x, y})
  const [nodeOverrides, setNodeOverrides] = useState({});
  // Custom seam allowance overrides (pieceId -> number)
  const [seamAllowanceOverrides, setSeamAllowanceOverrides] = useState({});
  // Custom pieces and deleted piece ids
  const [customPieces, setCustomPieces] = useState([]);
  const [deletedPieceIds, setDeletedPieceIds] = useState(new Set());

  // Deep-link loader for templates and saved projects from query parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const templateId = params.get('template');
      const projectId = params.get('project');

      if (templateId) {
        const found = SLOPER_BLOCK_TEMPLATES.find((t) => t.id === templateId);
        if (found) {
          const type = found.category === 'bodice' ? 'shirt' : found.category;
          setGarmentSpec((prev) => ({
            ...prev,
            name: found.name,
            garmentType: type,
          }));
          const defs = getDefaultMeasurementsForGarment(type);
          setMeasurements({ ...defs, ...found.measurements });
          setSelectedPieceId(null);
        }
      } else if (projectId) {
        const saved = JSON.parse(localStorage.getItem('tailorix_saved_projects') || '[]');
        const found = saved.find((p) => p.id === projectId);
        if (found) {
          if (found.spec) setGarmentSpec(found.spec);
          if (found.measurements) setMeasurements(found.measurements);
          if (found.units) setUnits(found.units);
          setSelectedPieceId(null);
        }
      }
    } catch (e) {
      console.warn('Could not parse URL params for project/template load:', e);
    }
  }, []);

  // --- Deterministic Pattern Generation ---
  const basePattern = useMemo(() => {
    try {
      const generated = generatePattern(garmentSpec, measurements, {
        seamAllowance: 0.5,
        silhouette: garmentSpec.silhouette,
      }, units);

      // Apply custom seam allowance adjustments
      generated.pieces = generated.pieces.map((piece) => {
        const customSA = seamAllowanceOverrides[piece.id];
        if (customSA !== undefined && customSA !== piece.seamAllowance) {
          return applySeamAllowanceToPiece({ ...piece, seamAllowance: customSA }, customSA);
        }
        return piece;
      });

      // Apply interactive point overrides and re-compute path, bounds, and seam allowance
      if (Object.keys(nodeOverrides).length > 0) {
        generated.pieces = generated.pieces.map((piece) => {
          if (nodeOverrides[piece.id]) {
            const updatedPoints = piece.points.map((pt, idx) => {
              if (nodeOverrides[piece.id][idx]) {
                return { ...pt, ...nodeOverrides[piece.id][idx] };
              }
              return pt;
            });
            let updatedPiece = { ...piece, points: updatedPoints };
            updatedPiece.path = renderPieceToSvgPath(updatedPiece);
            updatedPiece.bounds = calculatePieceBounds(updatedPiece);
            const sa = updatedPiece.seamAllowance ?? 0.5;
            return applySeamAllowanceToPiece(updatedPiece, sa);
          }
          return piece;
        });
      }

      return generated;
    } catch (err) {
      console.error('Pattern Generation Error:', err);
      return { pieces: [] };
    }
  }, [garmentSpec, measurements, units, nodeOverrides, seamAllowanceOverrides]);

  // Combine generated pieces (minus deleted ones) with custom cloned pieces
  const pieces = useMemo(() => {
    const fromBase = (basePattern.pieces || []).filter((p) => !deletedPieceIds.has(p.id));
    return [...fromBase, ...customPieces];
  }, [basePattern.pieces, deletedPieceIds, customPieces]);

  // Ensure selectedPieceId is valid and not pointing to a stale piece from another garment
  useEffect(() => {
    if (pieces.length > 0) {
      const exists = pieces.some((p) => p.id === selectedPieceId);
      if (!exists) {
        setSelectedPieceId(pieces[0].id);
      }
    }
  }, [pieces, selectedPieceId]);

  // Graded multi-size layers
  const gradedLayers = useMemo(() => {
    return generatePointGradedPattern(pieces, activeSizes);
  }, [pieces, activeSizes]);

  // Handle Garment Type Change
  const handleGarmentTypeChange = (newType) => {
    setGarmentSpec((prev) => ({
      ...prev,
      garmentType: newType,
      name: `${newType.charAt(0).toUpperCase() + newType.slice(1)} Project`,
    }));
    const newMeasurements = getDefaultMeasurementsForGarment(newType);
    setMeasurements(newMeasurements);
    setNodeOverrides({});
    setSeamAllowanceOverrides({});
    setCustomPieces([]);
    setDeletedPieceIds(new Set());
    setSelectedPieceId(null);
  };

  // Measurement Change
  const handleMeasurementChange = (key, value) => {
    setMeasurements((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetMeasurements = () => {
    setMeasurements(getDefaultMeasurementsForGarment(garmentSpec.garmentType));
    setNodeOverrides({});
    setSeamAllowanceOverrides({});
  };

  // Seam Allowance Update for Piece
  const handleUpdatePieceSeamAllowance = (pieceId, newSA) => {
    setSeamAllowanceOverrides((prev) => ({
      ...prev,
      [pieceId]: newSA,
    }));
  };

  // Duplicate Pattern Piece
  const handleDuplicatePiece = (pieceId) => {
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece) return;
    const cloneId = `${piece.id}_COPY_${Date.now()}`;
    const offset = 25;
    const clonedPoints = (piece.points || []).map((pt) => ({
      ...pt,
      x: pt.x + offset,
      y: pt.y + offset,
    }));
    let clonedPiece = {
      ...piece,
      id: cloneId,
      name: `${piece.name} (Copy)`,
      points: clonedPoints,
    };
    clonedPiece.path = renderPieceToSvgPath(clonedPiece);
    clonedPiece.bounds = calculatePieceBounds(clonedPiece);
    clonedPiece = applySeamAllowanceToPiece(clonedPiece, clonedPiece.seamAllowance || 0.5);

    setCustomPieces((prev) => [...prev, clonedPiece]);
    setSelectedPieceId(cloneId);
  };

  // Delete Pattern Piece
  const handleDeletePiece = (pieceId) => {
    setDeletedPieceIds((prev) => new Set([...prev, pieceId]));
    setCustomPieces((prev) => prev.filter((p) => p.id !== pieceId));
    const remaining = pieces.filter((p) => p.id !== pieceId);
    if (remaining.length > 0) {
      setSelectedPieceId(remaining[0].id);
    } else {
      setSelectedPieceId(null);
    }
  };

  // Save Project to Local Storage
  const handleSaveProject = () => {
    const projectRecord = {
      id: `proj_${Date.now()}`,
      name: garmentSpec.name || `${garmentSpec.garmentType.toUpperCase()} Draft`,
      category: garmentSpec.garmentType,
      date: new Date().toLocaleDateString(),
      updatedAt: new Date().toISOString(),
      measurements,
      units,
      piecesCount: pieces.length,
      spec: garmentSpec,
    };
    try {
      const existing = JSON.parse(localStorage.getItem('tailorix_saved_projects') || '[]');
      const updated = [projectRecord, ...existing.filter((p) => p.name !== projectRecord.name)];
      localStorage.setItem('tailorix_saved_projects', JSON.stringify(updated));
      alert(`Project "${projectRecord.name}" successfully saved to your projects gallery!`);
    } catch (e) {
      console.error('Failed to save project:', e);
    }
  };

  // Interactive Node Drag Update
  const handleUpdatePiece = useCallback((updatedPiece) => {
    if (!updatedPiece) return;
    setNodeOverrides((prev) => {
      const pieceMap = { ...(prev[updatedPiece.id] || {}) };
      updatedPiece.points.forEach((pt, idx) => {
        pieceMap[idx] = { x: pt.x, y: pt.y };
      });
      return {
        ...prev,
        [updatedPiece.id]: pieceMap,
      };
    });
  }, []);

  // AI Feature Deconstruction Handler
  const handleRunAIDeconstruction = async (imgData) => {
    setIsAnalyzingImage(true);
    try {
      const result = await analyzeGarmentImage(imgData);
      setAnalysisResult(result);
      if (result.garmentType && result.garmentType !== garmentSpec.garmentType) {
        handleGarmentTypeChange(result.garmentType);
      }
    } catch (err) {
      console.warn('Garment Deconstruction:', err);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const applyAIDeconstruction = () => {
    if (!analysisResult) return;
    setGarmentSpec((prev) => ({
      ...prev,
      ...analysisResult,
    }));
    setShowDeconstructModal(false);
  };

  // Toggle Sizing for Grading
  const handleToggleSize = (size) => {
    setActiveSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Exports
  const handleExportSVG = () => exportPatternToSVG(pieces, garmentSpec.garmentType);
  const handleExportDXF = () => exportPatternToDXF(pieces, garmentSpec.garmentType);
  const handleExportPDF = () => exportPatternToTiledPDF(pieces, garmentSpec.garmentType);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-52px)] bg-[#101112] text-[#F5F5F7] overflow-hidden font-sans select-none">
      {/* 1. Master Application Header */}
      <CADHeaderBar
        garmentType={garmentSpec.garmentType}
        onChangeGarmentType={handleGarmentTypeChange}
        units={units}
        onToggleUnits={() => setUnits((u) => (u === 'in' ? 'cm' : 'in'))}
        activeViewMode={activeViewMode}
        onChangeViewMode={setActiveViewMode}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        onSaveProject={handleSaveProject}
        onExportSVG={handleExportSVG}
        onExportDXF={handleExportDXF}
        onExportPDF={handleExportPDF}
      />

      {/* 2. Primary Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left CAD Tool Rail (Active when in CAD Canvas mode) */}
        {activeViewMode === 'cad' && (
          <CADToolRail
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            snapToGrid={snapToGrid}
            setSnapToGrid={setSnapToGrid}
            showSeamAllowance={showSeamAllowance}
            setShowSeamAllowance={setShowSeamAllowance}
            showGrainlines={showGrainlines}
            setShowGrainlines={setShowGrainlines}
          />
        )}

        {/* Central Workspace Canvas Area */}
        <main className="flex-1 relative flex flex-col overflow-hidden p-2 sm:p-3 bg-[#101112]">
          {/* Quick AI Reference Trigger Button */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setShowDeconstructModal(true)}
              className="bg-[#161719]/90 backdrop-blur-md border border-[#2D2E32] text-[#EDEDF0] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-floating hover:bg-[#1E2024] hover:border-[#3A3C42] flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{referenceImage ? 'Reference Image' : 'Deconstruct Reference'}</span>
            </button>
          </div>

          {/* Render Active Workspace View (Wrapped in rounded canvas frame) */}
          <div className="flex-1 w-full h-full rounded-2xl overflow-hidden border border-[#222427] relative">
            {activeViewMode === 'cad' && (
              <ProfessionalCADCanvas
                pieces={pieces}
                selectedPieceId={selectedPieceId}
                onSelectPiece={setSelectedPieceId}
                onUpdatePiece={handleUpdatePiece}
                activeTool={activeTool}
                showSeamAllowance={showSeamAllowance}
                showGrainlines={showGrainlines}
                showNotches={true}
                showGrid={showGrid}
                snapToGrid={snapToGrid}
                activeSizes={activeSizes}
                gradedLayers={gradedLayers}
              />
            )}

            {activeViewMode === 'grading' && (
              <GradingMatrixView
                pieces={pieces}
                selectedPieceId={selectedPieceId}
                activeSizes={activeSizes}
                onToggleSize={handleToggleSize}
                gradedLayers={gradedLayers}
              />
            )}

            {activeViewMode === 'marker' && (
              <FabricMarkerView pieces={pieces} units={units} />
            )}

            {activeViewMode === '3d' && (
              <Garment3DSimulationView
                pieces={pieces}
                garmentType={garmentSpec.garmentType}
                measurements={measurements}
              />
            )}
          </div>
        </main>

        {/* Right CAD Properties & Inspection Panel */}
        {activeViewMode === 'cad' && (
          <CADPropertiesPanel
            pieces={pieces}
            selectedPieceId={selectedPieceId}
            onSelectPiece={setSelectedPieceId}
            onUpdatePieceSeamAllowance={handleUpdatePieceSeamAllowance}
            onDuplicatePiece={handleDuplicatePiece}
            onDeletePiece={handleDeletePiece}
            units={units}
          />
        )}
      </div>

      {/* 3. Parametric Measurement Dock Bar */}
      <CADMeasurementBar
        garmentType={garmentSpec.garmentType}
        measurements={measurements}
        onChangeMeasurement={handleMeasurementChange}
        onResetMeasurements={handleResetMeasurements}
        units={units}
      />

      {/* AI Garment Deconstruction & Analysis Modal */}
      {showDeconstructModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0B0C]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161719] rounded-2xl border border-[#2D2E32] shadow-floating max-w-xl w-full p-5 sm:p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#232427] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E5C07B]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#F5F5F7]">AI Garment Deconstruction</h3>
                  <p className="text-xs text-[#8A8B93]">Reverse-engineer garment image or sketch into CAD pattern pieces.</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeconstructModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-[#222427] flex items-center justify-center text-[#8A8B93] hover:text-[#EDEDF0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Upload Area */}
            <div className="p-4 border-2 border-dashed border-[#2D2E32] rounded-2xl bg-[#121315] flex flex-col items-center justify-center">
              {referenceImage ? (
                <div className="relative w-full flex flex-col items-center justify-center">
                  <img src={referenceImage} alt="Reference" className="max-h-60 rounded-xl object-contain shadow-md" />
                  <button
                    onClick={() => {
                      setReferenceImage(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-2 right-2 bg-[#101112]/90 hover:bg-[#101112] text-white rounded-full p-1.5 shadow"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <ImageUploader
                  onImageSelect={(img) => {
                    setReferenceImage(img);
                    handleRunAIDeconstruction(img);
                  }}
                />
              )}
            </div>

            {/* Analysis Diagnostics */}
            {isAnalyzingImage && (
              <div className="text-center py-4 text-xs text-[#E5C07B] font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping"></span>
                <span>Extracting garment features & silhouette parameters...</span>
              </div>
            )}

            {analysisResult && !isAnalyzingImage && (
              <div className="p-3 bg-[#18191B] rounded-xl border border-[#28292D] text-xs space-y-2">
                <div className="font-semibold text-[#EDEDF0]">Extracted Features:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#8A8B93]">
                  <div>Garment Type: <span className="font-semibold text-[#EDEDF0] uppercase">{analysisResult.garmentType}</span></div>
                  <div>Silhouette: <span className="font-semibold text-[#EDEDF0]">{analysisResult.silhouette}</span></div>
                  <div>Confidence: <span className="font-semibold text-emerald-400">{Math.round((analysisResult.confidence || 0.85) * 100)}%</span></div>
                  <div>Closure: <span className="font-semibold text-[#EDEDF0]">{analysisResult.closures?.type || 'Standard'}</span></div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#232427]">
              <button
                onClick={() => setShowDeconstructModal(false)}
                className="px-4 py-2 text-xs font-medium text-[#8A8B93] hover:text-[#EDEDF0] hover:bg-[#1E2023] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyAIDeconstruction}
                disabled={!analysisResult}
                className="px-4 py-2 text-xs font-semibold bg-[#C5A059] hover:bg-[#D4AF37] disabled:opacity-40 text-[#101112] rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to CAD Model</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
