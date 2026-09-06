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

import React, { useState, useMemo, useCallback } from 'react';
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

  // History Stack for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // --- Deterministic Pattern Generation ---
  const basePattern = useMemo(() => {
    try {
      const generated = generatePattern(garmentSpec, measurements, {
        seamAllowance: 0.5,
        silhouette: garmentSpec.silhouette,
      }, units);

      // Apply any interactive point overrides
      if (Object.keys(nodeOverrides).length > 0) {
        generated.pieces = generated.pieces.map((piece) => {
          if (nodeOverrides[piece.id]) {
            const updatedPoints = piece.points.map((pt, idx) => {
              if (nodeOverrides[piece.id][idx]) {
                return { ...pt, ...nodeOverrides[piece.id][idx] };
              }
              return pt;
            });
            return { ...piece, points: updatedPoints };
          }
          return piece;
        });
      }

      return generated;
    } catch (err) {
      console.error('Pattern Generation Error:', err);
      return { pieces: [] };
    }
  }, [garmentSpec, measurements, units, nodeOverrides]);

  const pieces = basePattern.pieces || [];

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
  };

  // Seam Allowance Update for Piece
  const handleUpdatePieceSeamAllowance = (pieceId, newSA) => {
    // Re-generate or set state
    setGarmentSpec((prev) => ({ ...prev }));
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
      console.error('Garment Deconstruction Error:', err);
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
    <div className="flex flex-col w-full h-[calc(100vh-56px)] bg-[#f8fafc] text-slate-900 overflow-hidden font-sans select-none">
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
        <main className="flex-1 relative flex flex-col overflow-hidden p-3 bg-slate-100/70">
          {/* Quick AI Reference Trigger Button */}
          <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
            <button
              onClick={() => setShowDeconstructModal(true)}
              className="bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{referenceImage ? 'Reference Image Loaded' : 'AI Deconstruct & Image'}</span>
            </button>
          </div>

          {/* Render Active Workspace View */}
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
        </main>

        {/* Right CAD Properties & Inspection Panel */}
        {activeViewMode === 'cad' && (
          <CADPropertiesPanel
            pieces={pieces}
            selectedPieceId={selectedPieceId}
            onSelectPiece={setSelectedPieceId}
            onUpdatePieceSeamAllowance={handleUpdatePieceSeamAllowance}
            onDuplicatePiece={() => {}}
            onDeletePiece={() => {}}
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">AI Garment Deconstruction</h3>
                  <p className="text-xs text-slate-500">Analyze garment image or sketch to configure CAD specification.</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeconstructModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Upload Area */}
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center">
              {referenceImage ? (
                <div className="relative max-h-48 overflow-hidden rounded-lg">
                  <img src={referenceImage} alt="Reference" className="max-h-48 object-contain" />
                  <button
                    onClick={() => {
                      setReferenceImage(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-full p-1"
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
              <div className="text-center py-4 text-xs text-amber-600 font-semibold flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Extracting garment features & silhouette parameters...</span>
              </div>
            )}

            {analysisResult && !isAnalyzingImage && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Extracted Features:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>Garment Type: <span className="font-semibold text-slate-900 uppercase">{analysisResult.garmentType}</span></div>
                  <div>Silhouette: <span className="font-semibold text-slate-900">{analysisResult.silhouette}</span></div>
                  <div>Confidence: <span className="font-semibold text-emerald-600">{Math.round((analysisResult.confidence || 0.85) * 100)}%</span></div>
                  <div>Closure: <span className="font-semibold text-slate-900">{analysisResult.closures?.type || 'Standard'}</span></div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeconstructModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={applyAIDeconstruction}
                disabled={!analysisResult}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-lg shadow-xs flex items-center gap-1.5"
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
