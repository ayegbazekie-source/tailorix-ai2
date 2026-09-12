/**
 * TAILORIX AI — UNIFIED AUTODESK SKETCHBOOK CAD & STUDIO PLAYGROUND
 * Merges the CAD Workbench, Cutting Table, and Studio Canvas into a single,
 * high-craft interactive drawing playground modeled after Autodesk SketchBook.
 *
 * Features:
 * - Autodesk SketchBook Floating Tool Puck (Quick Menu: Brushes, Color Palette, Size, Opacity, Rulers, Symmetry)
 * - Multi-Layer Stack Panel (Chalk / Sketches, CAD Pieces, Notches / Grainlines, Fabric Mat)
 * - Drawing Suite: Technical Pen, Tailor's Chalk, Copic Fabric Marker, Rotary Shears, Eraser
 * - Real-Time Symmetry Mirror Mode & French Curve / Precision Ruler Guides
 * - Interactive Digital Cutting Table: Fabric Swatches, Piece Layout, Free Rotation, Flips, Fold Placement
 * - Real-Time Fabric Consumption & Efficiency Yield Calculator
 * - Integrated CAD Workbench Views: CAD Node Drafting, Sizing Grading Matrix, Fabric Marker, 3D Fit Simulation
 * - Full Vector & Blueprint Export Suite (SVG, DXF, 1:1 Tiled PDF, PNG Sketch Snapshot)
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Scissors,
  Ruler,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Pencil,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Download,
  Upload,
  Palette,
  Eye,
  EyeOff,
  Compass,
  Sparkles,
  RefreshCw,
  Sliders,
  Move,
  Info,
  ChevronDown,
  X,
  Lock,
  Unlock,
  Box,
  SlidersHorizontal,
  FileSpreadsheet,
  Undo2,
  Redo2,
  Camera,
  Circle,
  Square,
  HelpCircle,
} from 'lucide-react';

import { DECONSTRUCT_BENCHMARK_SAMPLES } from '../../data/deconstructSamples';
import { generatePattern } from '../../utils/patternEngine/patternRegistry';
import { getDefaultMeasurementsForGarment } from '../../models/measurementDefinitions';
import { exportPatternToSVG, exportPatternToDXF, exportPatternToTiledPDF } from '../../utils/patternEngine/cadExportEngine';
import { calculatePieceBounds } from '../../models/patternGeometry';

// CAD Modular Views
import ProfessionalCADCanvas from '../CAD/ProfessionalCADCanvas';
import GradingMatrixView from '../CAD/GradingMatrixView';
import FabricMarkerView from '../CAD/FabricMarkerView';
import Garment3DSimulationView from '../CAD/Garment3DSimulationView';
import AdvancedTailorDrawer from '../CAD/AdvancedTailorDrawer';

// Fabric Texture Presets for Cutting Table
const FABRIC_PRESETS = [
  {
    id: 'silk_satin',
    name: 'Mulberry Silk Satin Charmeuse',
    category: 'Silk & Luxury',
    baseColor: '#334155',
    textureCss: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.12), transparent 70%), linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    grainDirection: 'warp',
    weight: '19 Momme (82 GSM)',
  },
  {
    id: 'selvedge_denim',
    name: 'Organic Raw Selvedge Denim',
    category: 'Cotton & Twill',
    baseColor: '#1e3a8a',
    textureCss: 'repeating-linear-gradient(45deg, #172554, #172554 2px, #1e3a8a 2px, #1e3a8a 4px)',
    grainDirection: 'warp',
    weight: '14.5 oz Right-Hand Twill',
  },
  {
    id: 'pure_linen',
    name: 'Natural Pure Irish Linen',
    category: 'Linen & Slub',
    baseColor: '#78716c',
    textureCss: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px), linear-gradient(to bottom, #44403c, #292524)',
    grainDirection: 'warp',
    weight: '210 GSM Medium Weight',
  },
  {
    id: 'wool_tweed',
    name: 'Savile Row Wool Flannel',
    category: 'Wool & Suiting',
    baseColor: '#475569',
    textureCss: 'repeating-linear-gradient(60deg, #334155, #334155 3px, #1e293b 3px, #1e293b 6px)',
    grainDirection: 'warp',
    weight: '340 GSM 11 oz Suiting',
  },
  {
    id: 'poplin_cotton',
    name: 'Crisp Poplin Cotton Shirting',
    category: 'Cotton & Woven',
    baseColor: '#0f172a',
    textureCss: 'linear-gradient(to right, #1e293b, #0f172a)',
    grainDirection: 'warp',
    weight: '120 GSM Plain Weave',
  },
  {
    id: 'cutting_mat',
    name: 'Self-Healing Cutting Mat (1" Grid)',
    category: 'Workbench Tool',
    baseColor: '#064e3b',
    textureCss: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, #064e3b, #022c22)',
    textureSize: '24px 24px',
    grainDirection: 'warp',
    weight: 'Heavy-Duty 3mm Vinyl',
  },
];

// Autodesk SketchBook Iconic Color Palette
const SKETCH_PALETTE = [
  { name: 'Tailor Chalk White', hex: '#ffffff' },
  { name: 'Charcoal Lead', hex: '#0f172a' },
  { name: 'Wax Yellow', hex: '#facc15' },
  { name: 'Tailor French Blue', hex: '#38bdf8' },
  { name: 'Basting Crimson', hex: '#f43f5e' },
  { name: 'Bespoke Emerald', hex: '#10b981' },
];

// Helper to generate sample pieces if no payload imported yet
function getInitialPatternSet(sampleId = 'sample_gown') {
  const sample = DECONSTRUCT_BENCHMARK_SAMPLES.find((s) => s.id === sampleId) || DECONSTRUCT_BENCHMARK_SAMPLES[0];
  const measurements = getDefaultMeasurementsForGarment(sample.category);
  const pattern = generatePattern(
    { garmentType: sample.category, silhouette: sample.specs.silhouette, name: sample.name },
    measurements,
    { seamAllowance: 0.5 }
  );

  return {
    garmentType: sample.name,
    garmentCategory: sample.category,
    fabricCanvasUrl: sample.defaultFabric || 'silk_satin',
    patternPieces: (pattern.pieces || []).map((p, idx) => ({
      id: p.id || `piece_${idx}`,
      name: p.name,
      cutQuantity: typeof p.cutQuantity === 'number' ? p.cutQuantity : (String(p.cutQuantity || '').includes('1') ? 1 : 2),
      cutQuantityLabel: typeof p.cutQuantity === 'string' ? p.cutQuantity : (p.cutQuantityLabel || (p.onFold ? 'Cut 1 on Fold' : 'Cut 2 (1 Pair)')),
      svgPath: p.path,
      isFold: Boolean(p.onFold),
      seamAllowance: p.seamAllowance ?? 0.5,
      seamAllowancePath: p.seamAllowancePath || null,
      points: p.points || [],
      bounds: p.bounds || { width: 140, height: 180, minX: 0, minY: 0 },
      grainline: p.grainline || { label: p.onFold ? 'CENTER FOLD' : 'LENGTHWISE GRAIN' },
      notches: p.notches || [],
      darts: p.darts || [],
      x: 60 + (idx % 3) * 260,
      y: 80 + Math.floor(idx / 3) * 320,
      rotation: 0,
      flipH: false,
      flipV: false,
    })),
  };
}

export default function AutodeskSketchCADPlayground({ defaultMode = 'sketch' }) {
  const location = useLocation();
  const navigate = useNavigate();

  // -------------------------------------------------------------
  // 1. Primary Workspace View Mode
  // Modes: 'sketch' | 'cad' | 'grading' | 'marker' | '3d'
  // -------------------------------------------------------------
  const [activeMode, setActiveMode] = useState(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode');
    if (modeParam && ['sketch', 'cad', 'grading', 'marker', '3d'].includes(modeParam)) {
      return modeParam;
    }
    return defaultMode;
  });

  // -------------------------------------------------------------
  // 2. Fabric Cutting Table State
  // -------------------------------------------------------------
  const [selectedFabric, setSelectedFabric] = useState(FABRIC_PRESETS[0]);
  const [fabricWidthInches, setFabricWidthInches] = useState(58);
  const [fabricLengthYards, setFabricLengthYards] = useState(3.0);
  const [grainDirection, setGrainDirection] = useState('warp');

  // -------------------------------------------------------------
  // 3. Pattern Pieces State (Directly imported or initialized)
  // -------------------------------------------------------------
  const [garmentTitle, setGarmentTitle] = useState('Bespoke Sweetheart Evening Gown');
  const [garmentCategory, setGarmentCategory] = useState('gown');
  const [pieces, setPieces] = useState([]);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [importedNotice, setImportedNotice] = useState(null);
  const [showAdvancedDrawer, setShowAdvancedDrawer] = useState(false);

  // -------------------------------------------------------------
  // 4. Autodesk SketchBook Drawing & Tool Puck State
  // -------------------------------------------------------------
  // Brushes: 'pen' | 'chalk' | 'marker' | 'shears' | 'eraser' | 'select'
  const [activeBrush, setActiveBrush] = useState('chalk');
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [brushOpacity, setBrushOpacity] = useState(0.85);

  // Sketch Guides
  const [symmetryEnabled, setSymmetryEnabled] = useState(false);
  const [symmetryAxisX, setSymmetryAxisX] = useState(480);
  const [guideRulerEnabled, setGuideRulerEnabled] = useState(false);
  const [guideRulerAngle, setGuideRulerAngle] = useState(0);

  // Floating Puck Widget
  const [showPuck, setShowPuck] = useState(true);
  const [isPuckExpanded, setIsPuckExpanded] = useState(false);
  const [puckPos, setPuckPos] = useState({ x: 24, y: 84 });
  const [isDraggingPuck, setIsDraggingPuck] = useState(false);
  const puckDragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Layer Stack State
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [layers, setLayers] = useState([
    { id: 'layer_sketch', name: 'Layer 4: Tailor Chalk & Alterations', visible: true, locked: false, opacity: 1.0 },
    { id: 'layer_pieces', name: 'Layer 3: CAD Pattern Pieces', visible: true, locked: false, opacity: 1.0 },
    { id: 'layer_details', name: 'Layer 2: Notches & Grainlines', visible: true, locked: false, opacity: 0.9 },
    { id: 'layer_fabric', name: 'Layer 1: Fabric Table & Grid Mat', visible: true, locked: false, opacity: 1.0 },
  ]);

  // Sketch Drawings (Stroke Paths)
  const [drawingStrokes, setDrawingStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Piece Dragging State
  const [draggingPieceId, setDraggingPieceId] = useState(null);
  const pieceDragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Toggles for Display Elements
  const [showSeamAllowance, setShowSeamAllowance] = useState(true);
  const [showGrainlineArrows, setShowGrainlineArrows] = useState(true);
  const [showNotches, setShowNotches] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [activeSizes, setActiveSizes] = useState(['S', 'M', 'L', 'XL']);

  // Modals & Drawers
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);

  const canvasSvgRef = useRef(null);
  const containerRef = useRef(null);

  // -------------------------------------------------------------
  // Load initial pieces or import from Garment Deconstruct
  // -------------------------------------------------------------
  useEffect(() => {
    let payload = location.state?.importedPayload;
    if (!payload) {
      try {
        const stored = localStorage.getItem('tailorix_studio_payload');
        if (stored) payload = JSON.parse(stored);
      } catch (e) {
        console.warn('Could not read stored payload', e);
      }
    }

    if (payload && payload.patternPieces?.length > 0) {
      setGarmentTitle(payload.garmentType || 'Deconstructed Garment');
      if (payload.garmentCategory) setGarmentCategory(payload.garmentCategory);

      // Match fabric if provided
      if (payload.fabricCanvasUrl) {
        const found = FABRIC_PRESETS.find((f) => f.id === payload.fabricCanvasUrl);
        if (found) setSelectedFabric(found);
      }

      setPieces(
        payload.patternPieces.map((p, idx) => ({
          ...p,
          x: p.x ?? 60 + (idx % 3) * 260,
          y: p.y ?? 80 + Math.floor(idx / 3) * 320,
          rotation: p.rotation ?? 0,
          flipH: p.flipH ?? false,
          flipV: p.flipV ?? false,
        }))
      );

      setImportedNotice(`Successfully loaded ${payload.patternPieces.length} deconstructed pattern pieces!`);
      setTimeout(() => setImportedNotice(null), 5000);
    } else {
      const initial = getInitialPatternSet('sample_gown');
      setGarmentTitle(initial.garmentType);
      setGarmentCategory(initial.garmentCategory);
      setPieces(initial.patternPieces);
    }
  }, [location.state]);

  // -------------------------------------------------------------
  // Fabric Consumption Calculation
  // -------------------------------------------------------------
  const fabricStats = useMemo(() => {
    if (pieces.length === 0) return { usedYards: 0, efficiency: 0, status: 'Empty' };

    let maxX = 0;
    let maxY = 0;
    let totalPieceArea = 0;

    pieces.forEach((p) => {
      const b = p.bounds || { width: 120, height: 160 };
      const pieceRight = p.x + b.width;
      const pieceBottom = p.y + b.height;
      if (pieceRight > maxX) maxX = pieceRight;
      if (pieceBottom > maxY) maxY = pieceBottom;
      totalPieceArea += (b.width * b.height) / 144; // sq ft approx
    });

    const usedInches = Math.max(maxY / 10, 12);
    const usedYards = Math.min(Number((usedInches / 36).toFixed(2)), fabricLengthYards);
    const totalFabricArea = (fabricWidthInches * (fabricLengthYards * 36)) / 144;
    const efficiency = Math.min(Math.round((totalPieceArea / Math.max(totalFabricArea, 1)) * 100), 94);

    return {
      usedYards,
      efficiency,
      status: efficiency > 78 ? 'Optimal Yield' : efficiency > 55 ? 'Good Layout' : 'Room for Nesting',
    };
  }, [pieces, fabricWidthInches, fabricLengthYards]);

  // -------------------------------------------------------------
  // Drawing Canvas Handlers (Autodesk SketchBook Stroke Engine)
  // -------------------------------------------------------------
  const getCanvasCoords = useCallback((e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left - panOffset.x) / zoom,
      y: (clientY - rect.top - panOffset.y) / zoom,
    };
  }, [panOffset, zoom]);

  const handlePointerDown = (e) => {
    // Check if click was on a piece or control puck
    if (activeBrush === 'select') return;

    // Check layer lock
    const sketchLayer = layers.find((l) => l.id === 'layer_sketch');
    if (sketchLayer?.locked || !sketchLayer?.visible) return;

    const coords = getCanvasCoords(e);
    const newStroke = {
      id: `stroke_${Date.now()}`,
      brush: activeBrush,
      color: brushColor,
      size: brushSize,
      opacity: activeBrush === 'marker' ? 0.35 : brushOpacity,
      points: [coords],
      symmetry: symmetryEnabled,
      symmetryAxisX,
    };

    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e) => {
    if (!currentStroke) return;
    const coords = getCanvasCoords(e);
    setCurrentStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, coords],
      };
    });
  };

  const handlePointerUp = () => {
    if (currentStroke && currentStroke.points.length > 1) {
      setUndoStack((prev) => [...prev, drawingStrokes]);
      setRedoStack([]);
      setDrawingStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (drawingStrokes.length === 0 && undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    if (last !== undefined) {
      setRedoStack((prev) => [...prev, drawingStrokes]);
      setDrawingStrokes(last);
      setUndoStack((prev) => prev.slice(0, prev.length - 1));
    } else if (drawingStrokes.length > 0) {
      setRedoStack((prev) => [...prev, drawingStrokes]);
      setDrawingStrokes((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, drawingStrokes]);
    setDrawingStrokes(next);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
  };

  const handleClearStrokes = () => {
    if (drawingStrokes.length === 0) return;
    setUndoStack((prev) => [...prev, drawingStrokes]);
    setDrawingStrokes([]);
  };

  // -------------------------------------------------------------
  // Pattern Piece Manipulation (Move, Rotate, Flip, Fold)
  // -------------------------------------------------------------
  const handlePieceMouseDown = (e, pieceId) => {
    e.stopPropagation();
    setSelectedPieceId(pieceId);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const targetPiece = pieces.find((p) => p.id === pieceId);

    if (targetPiece) {
      setDraggingPieceId(pieceId);
      pieceDragRef.current = {
        startX: clientX,
        startY: clientY,
        initialX: targetPiece.x,
        initialY: targetPiece.y,
      };
    }
  };

  const handleGlobalMouseMove = useCallback((e) => {
    if (!draggingPieceId) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = (clientX - pieceDragRef.current.startX) / zoom;
    const dy = (clientY - pieceDragRef.current.startY) / zoom;

    setPieces((prev) =>
      prev.map((p) =>
        p.id === draggingPieceId
          ? {
              ...p,
              x: Math.max(10, Math.round(pieceDragRef.current.initialX + dx)),
              y: Math.max(10, Math.round(pieceDragRef.current.initialY + dy)),
            }
          : p
      )
    );
  }, [draggingPieceId, zoom]);

  const handleGlobalMouseUp = useCallback(() => {
    setDraggingPieceId(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalMouseMove);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // Piece Action Helpers
  const handleRotatePiece = (pieceId, degrees) => {
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId ? { ...p, rotation: (p.rotation + degrees) % 360 } : p
      )
    );
  };

  const handleFlipPiece = (pieceId, axis) => {
    setPieces((prev) =>
      prev.map((p) => {
        if (p.id !== pieceId) return p;
        return axis === 'h' ? { ...p, flipH: !p.flipH } : { ...p, flipV: !p.flipV };
      })
    );
  };

  const handleToggleFold = (pieceId) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, isFold: !p.isFold } : p))
    );
  };

  // -------------------------------------------------------------
  // Export Handlers
  // -------------------------------------------------------------
  const handleExportSVG = () => {
    const svgString = exportPatternToSVG(pieces, garmentCategory);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${garmentTitle.toLowerCase().replace(/\s+/g, '_')}_cad.svg`;
    a.click();
    setShowExportModal(false);
  };

  const handleExportDXF = () => {
    const dxfString = exportPatternToDXF(pieces, garmentCategory);
    const blob = new Blob([dxfString], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${garmentTitle.toLowerCase().replace(/\s+/g, '_')}_aama.dxf`;
    a.click();
    setShowExportModal(false);
  };

  const handleExportPDF = () => {
    exportPatternToTiledPDF(pieces, garmentCategory, {
      title: garmentTitle,
      paperSize: 'letter',
    });
    setShowExportModal(false);
  };

  const handleExportPNG = () => {
    if (!canvasSvgRef.current) return;
    const svgElement = canvasSvgRef.current;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#0f172a';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${garmentTitle.toLowerCase().replace(/\s+/g, '_')}_sketch.png`;
        downloadLink.href = png;
        downloadLink.click();
      }
      setShowExportModal(false);
    };
    image.src = blobURL;
  };

  // Convert points array to smooth SVG path string
  const renderStrokeToSvgPath = (points) => {
    if (!points || points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  const selectedPiece = pieces.find((p) => p.id === selectedPieceId) || pieces[0] || null;

  return (
    <div className="w-full h-full min-h-[calc(100vh-3.5rem)] flex flex-col bg-[#090d16] text-slate-100 select-none overflow-hidden relative font-sans">
      {/* ========================================================================= */}
      {/* 1. AUTODESK SKETCHBOOK MINIMALIST TOP CHROME                             */}
      {/* ========================================================================= */}
      <header className="h-14 bg-[#0d1322] border-b border-slate-800/80 px-3 sm:px-5 flex items-center justify-between z-30 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          {/* Garment Project Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/30">
              TX
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xs font-bold text-slate-200 tracking-tight leading-none truncate max-w-[180px]">
                {garmentTitle}
              </h1>
              <span className="text-[10px] text-amber-500/90 font-mono tracking-wider uppercase">
                SketchBook CAD v3.0
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#060912] p-1 rounded-xl border border-slate-800/80 text-xs font-semibold gap-1">
            {[
              { id: 'sketch', label: 'Cutting Table', icon: Pencil },
              { id: 'cad', label: 'Pattern Drafting Board', icon: Sliders },
              { id: 'grading', label: 'Size Grading', icon: Layers },
              { id: 'marker', label: 'Cutting Layout', icon: Scissors },
              { id: '3d', label: '3D Fit', icon: Box },
            ].map((m) => {
              const Icon = m.icon;
              const isActive = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-[#060912] border border-slate-800 rounded-lg p-0.5 text-slate-400">
            <button
              onClick={handleUndo}
              title="Undo Stroke"
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800/60 rounded transition-all"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              title="Redo Stroke"
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800/60 rounded transition-all"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-[#060912] border border-slate-800 rounded-lg p-0.5 text-slate-400 text-xs font-mono">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800/60 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-bold text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800/60 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setPanOffset({ x: 40, y: 40 });
              }}
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800/60 rounded text-[10px]"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Layer Panel Button */}
          <button
            onClick={() => setShowLayerPanel((v) => !v)}
            className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
              showLayerPanel
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-[#060912] border-slate-800 text-slate-300 hover:bg-slate-800/60'
            }`}
            title="Toggle Layer Stack"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Layers</span>
          </button>

          {/* Floating Puck Toggle */}
          <button
            onClick={() => setShowPuck((v) => !v)}
            className={`p-2 rounded-lg border text-xs font-bold transition-all ${
              showPuck
                ? 'bg-slate-800 border-slate-700 text-amber-400'
                : 'bg-[#060912] border-slate-800 text-slate-400 hover:bg-slate-800/60'
            }`}
            title="Toggle SketchBook Tool Puck"
          >
            <Circle className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Advanced Tailor Options Drawer Trigger */}
          <button
            onClick={() => setShowAdvancedDrawer(true)}
            className="px-2.5 py-1.5 bg-[#060912] hover:bg-slate-800/80 border border-slate-800 text-amber-400 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
            title="Open Advanced Tailor Options (DXF export, node coordinates, exact seam offsets)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Advanced</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Notice Banner if newly imported from Garment Deconstruct */}
      {importedNotice && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold py-2 px-4 flex items-center justify-between z-40 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{importedNotice}</span>
          </div>
          <button onClick={() => setImportedNotice(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE VIEWPORT                                                */}
      {/* ========================================================================= */}
      <div className="flex-1 relative overflow-hidden flex" ref={containerRef}>
        {/* VIEW 1: SKETCH & CUTTING TABLE (AUTODESK SKETCHBOOK PLAYGROUND) */}
        {activeMode === 'sketch' && (
          <div
            className="w-full h-full relative cursor-crosshair overflow-hidden"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{
              backgroundColor: selectedFabric.baseColor,
              backgroundImage: selectedFabric.textureCss,
              backgroundSize: selectedFabric.textureSize || 'auto',
            }}
          >
            {/* Real-time fabric yardage and efficiency badge */}
            <div className="absolute top-4 left-4 z-20 bg-slate-900/85 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 text-xs text-slate-200 shadow-xl flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Fabric</span>
                <span className="font-bold text-slate-100">{selectedFabric.name.split(' ')[0]} {selectedFabric.name.split(' ')[1]}</span>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Yield</span>
                <span className="font-bold text-emerald-400 font-mono">{fabricStats.efficiency}% Efficient</span>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Bolt Used</span>
                <span className="font-bold text-amber-400 font-mono">~{fabricStats.usedYards} Yds</span>
              </div>
            </div>

            {/* Symmetry Center Guide Line if enabled */}
            {symmetryEnabled && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10 flex flex-col items-center"
                style={{ left: `${symmetryAxisX * zoom + panOffset.x}px` }}
              >
                <div className="w-px h-full bg-amber-400/60 border-l border-dashed border-amber-300"></div>
                <div className="absolute top-4 bg-amber-500 text-slate-950 font-mono text-[9px] px-1.5 py-0.5 rounded font-extrabold shadow">
                  SYMMETRY MIRROR
                </div>
              </div>
            )}

            {/* Precision French Curve Guide overlay if enabled */}
            {guideRulerEnabled && (
              <div
                className="absolute top-1/3 left-1/3 z-20 p-4 bg-slate-900/90 border-2 border-dashed border-amber-400/80 rounded-3xl shadow-2xl backdrop-blur-md cursor-move flex items-center gap-3"
                style={{ transform: `rotate(${guideRulerAngle}deg)` }}
              >
                <Compass className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-mono font-bold text-slate-200">French Curve & Grainline Guide</span>
                <button
                  onClick={() => setGuideRulerAngle((a) => (a + 15) % 360)}
                  className="px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-bold rounded"
                >
                  Rotate +15°
                </button>
              </div>
            )}

            {/* Master SVG Canvas Layer */}
            <svg
              ref={canvasSvgRef}
              className="w-full h-full absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
              }}
            >
              <defs>
                <pattern id="tableGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                </pattern>
                <linearGradient id="chalkGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Grid Background */}
              <rect width="3200" height="2400" fill="url(#tableGrid)" />

              {/* LAYER 3: CAD PATTERN PIECES */}
              {layers.find((l) => l.id === 'layer_pieces')?.visible && (
                <g id="layer-pattern-pieces" opacity={layers.find((l) => l.id === 'layer_pieces')?.opacity || 1}>
                  {pieces.map((piece) => {
                    const isSelected = selectedPieceId === piece.id;
                    const b = piece.bounds || { width: 140, height: 180, minX: 0, minY: 0 };
                    const transformStr = `translate(${piece.x}, ${piece.y}) rotate(${piece.rotation}) ${
                      piece.flipH ? 'scale(-1, 1)' : ''
                    } ${piece.flipV ? 'scale(1, -1)' : ''}`;

                    return (
                      <g
                        key={piece.id}
                        transform={transformStr}
                        className="pointer-events-auto cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handlePieceMouseDown(e, piece.id)}
                        onTouchStart={(e) => handlePieceMouseDown(e, piece.id)}
                      >
                        {/* Seam Allowance Offset Line (Dashed) */}
                        {showSeamAllowance && piece.seamAllowancePath && (
                          <path
                            d={piece.seamAllowancePath}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                        )}

                        {/* Main Pattern Cutline */}
                        <path
                          d={piece.svgPath}
                          fill={isSelected ? '#38bdf8' : '#0284c7'}
                          fillOpacity={isSelected ? 0.22 : 0.14}
                          stroke={isSelected ? '#facc15' : '#38bdf8'}
                          strokeWidth={isSelected ? 2.5 : 1.8}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />

                        {/* Grainline Arrow */}
                        {showGrainlineArrows && piece.grainline && (
                          <g stroke="#facc15" strokeWidth="1.5">
                            <line
                              x1={piece.grainline.x1 || b.width / 2}
                              y1={piece.grainline.y1 || 20}
                              x2={piece.grainline.x2 || b.width / 2}
                              y2={piece.grainline.y2 || b.height - 20}
                            />
                            <circle cx={piece.grainline.x1 || b.width / 2} cy={piece.grainline.y1 || 20} r="3" fill="#facc15" />
                            <circle cx={piece.grainline.x2 || b.width / 2} cy={piece.grainline.y2 || b.height - 20} r="3" fill="#facc15" />
                          </g>
                        )}

                        {/* Piece Name & Cut Label */}
                        <text
                          x={b.width / 2}
                          y={b.height / 2}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                          className="font-mono pointer-events-none drop-shadow"
                        >
                          {piece.name}
                        </text>
                        <text
                          x={b.width / 2}
                          y={b.height / 2 + 14}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="9"
                          fontWeight="600"
                          className="font-mono pointer-events-none"
                        >
                          {piece.cutQuantityLabel || (piece.isFold ? 'Cut 1 on Fold' : 'Cut 2 (Pair)')}
                        </text>

                        {/* Fold Badge if piece on fold */}
                        {piece.isFold && (
                          <rect
                            x={0}
                            y={0}
                            width={b.width}
                            height={4}
                            fill="#10b981"
                            rx="2"
                          />
                        )}
                      </g>
                    );
                  })}
                </g>
              )}

              {/* LAYER 4: AUTODESK SKETCHBOOK TAILOR CHALK & DRAWING STROKES */}
              {layers.find((l) => l.id === 'layer_sketch')?.visible && (
                <g id="layer-sketchbook-strokes" opacity={layers.find((l) => l.id === 'layer_sketch')?.opacity || 1}>
                  {drawingStrokes.map((s) => {
                    const pathD = renderStrokeToSvgPath(s.points);
                    return (
                      <React.Fragment key={s.id}>
                        {/* Primary Stroke */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={s.color}
                          strokeWidth={s.size}
                          strokeOpacity={s.opacity}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={s.brush === 'shears' ? '6 4' : 'none'}
                        />
                        {/* Mirrored Stroke if Symmetry was active */}
                        {s.symmetry && (
                          <path
                            d={renderStrokeToSvgPath(
                              s.points.map((pt) => ({
                                x: s.symmetryAxisX * 2 - pt.x,
                                y: pt.y,
                              }))
                            )}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={s.size}
                            strokeOpacity={s.opacity}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray={s.brush === 'shears' ? '6 4' : 'none'}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Current Active In-Progress Stroke */}
                  {currentStroke && (
                    <>
                      <path
                        d={renderStrokeToSvgPath(currentStroke.points)}
                        fill="none"
                        stroke={currentStroke.color}
                        strokeWidth={currentStroke.size}
                        strokeOpacity={currentStroke.opacity}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={currentStroke.brush === 'shears' ? '6 4' : 'none'}
                      />
                      {currentStroke.symmetry && (
                        <path
                          d={renderStrokeToSvgPath(
                            currentStroke.points.map((pt) => ({
                              x: currentStroke.symmetryAxisX * 2 - pt.x,
                              y: pt.y,
                            }))
                          )}
                          fill="none"
                          stroke={currentStroke.color}
                          strokeWidth={currentStroke.size}
                          strokeOpacity={currentStroke.opacity}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray={currentStroke.brush === 'shears' ? '6 4' : 'none'}
                        />
                      )}
                    </>
                  )}
                </g>
              )}
            </svg>
          </div>
        )}

        {/* VIEW 2: CAD NODE-LEVEL DRAFTING WORKSPACE */}
        {activeMode === 'cad' && (
          <div className="w-full h-full bg-[#f8fafc] text-slate-900 overflow-hidden flex flex-col">
            <ProfessionalCADCanvas
              pieces={pieces}
              selectedPieceId={selectedPieceId}
              onSelectPiece={setSelectedPieceId}
              onUpdatePiece={(updatedPiece) => {
                setPieces((prev) =>
                  prev.map((p) => (p.id === updatedPiece.id ? updatedPiece : p))
                );
              }}
              activeTool="select"
              showSeamAllowance={showSeamAllowance}
              showGrainlines={showGrainlineArrows}
              showNotches={showNotches}
              showGrid={true}
              activeSizes={activeSizes}
            />
          </div>
        )}

        {/* VIEW 3: APPAREL SIZING & POINT GRADING MATRIX */}
        {activeMode === 'grading' && (
          <GradingMatrixView
            pieces={pieces}
            selectedPieceId={selectedPieceId}
            activeSizes={activeSizes}
            onToggleSize={(size) => {
              setActiveSizes((prev) =>
                prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
              );
            }}
          />
        )}

        {/* VIEW 4: FABRIC MARKER & CUTTING YIELD */}
        {activeMode === 'marker' && (
          <FabricMarkerView pieces={pieces} units="in" />
        )}

        {/* VIEW 5: 3D MANNEQUIN FIT & CLOTH STRAIN SIMULATION */}
        {activeMode === '3d' && (
          <Garment3DSimulationView
            pieces={pieces}
            garmentType={garmentCategory}
            measurements={getDefaultMeasurementsForGarment(garmentCategory)}
          />
        )}

        {/* ========================================================================= */}
        {/* 3. AUTODESK SKETCHBOOK FLOATING TOOL PUCK (QUICK ACTION MENU)             */}
        {/* ========================================================================= */}
        {showPuck && activeMode === 'sketch' && (
          <div
            className="absolute z-30 transition-all select-none"
            style={{ left: `${puckPos.x}px`, top: `${puckPos.y}px` }}
          >
            {/* The Main Circular Puck */}
            <div className="relative">
              <button
                onClick={() => setIsPuckExpanded((v) => !v)}
                className="w-14 h-14 rounded-full bg-[#0d1322] border-2 border-amber-500/80 shadow-2xl flex flex-col items-center justify-center text-slate-100 hover:scale-105 active:scale-95 transition-transform group relative cursor-pointer"
                title="Autodesk SketchBook Tool Puck (Tap to open)"
              >
                {/* Active Tool Icon */}
                {activeBrush === 'pen' && <Pencil className="w-5 h-5 text-amber-400" />}
                {activeBrush === 'chalk' && <Pencil className="w-5 h-5 text-white" />}
                {activeBrush === 'marker' && <Palette className="w-5 h-5 text-sky-400" />}
                {activeBrush === 'shears' && <Scissors className="w-5 h-5 text-rose-400" />}
                {activeBrush === 'eraser' && <Trash2 className="w-5 h-5 text-slate-400" />}
                {activeBrush === 'select' && <Move className="w-5 h-5 text-emerald-400" />}

                {/* Color Dot & Size Ring */}
                <div
                  className="w-3 h-3 rounded-full border border-slate-900 absolute -bottom-1"
                  style={{ backgroundColor: brushColor }}
                />
              </button>

              {/* Expandable Radial/Card Menu */}
              {isPuckExpanded && (
                <div className="absolute top-16 left-0 bg-[#0d1322]/95 border border-slate-700/80 backdrop-blur-xl rounded-2xl p-4 shadow-2xl w-64 text-xs space-y-4 z-40 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-extrabold text-amber-400 text-xs tracking-wide uppercase font-mono">
                      SketchBook Tools
                    </span>
                    <button
                      onClick={() => setIsPuckExpanded(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Brush Selector */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5 font-bold">
                      Drawing Instruments
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'pen', label: 'Tech Pen', icon: Pencil },
                        { id: 'chalk', label: 'Chalk', icon: Pencil },
                        { id: 'marker', label: 'Marker', icon: Palette },
                        { id: 'shears', label: 'Shears', icon: Scissors },
                        { id: 'eraser', label: 'Eraser', icon: Trash2 },
                        { id: 'select', label: 'Piece Move', icon: Move },
                      ].map((b) => {
                        const Icon = b.icon;
                        const isSelected = activeBrush === b.id;
                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              setActiveBrush(b.id);
                            }}
                            className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{b.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Brush Size Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Stroke Width:</span>
                      <span className="font-mono text-amber-400 font-bold">{brushSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="36"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Color Palette Swatches */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5 font-bold">
                      Tailor Palette
                    </label>
                    <div className="flex items-center justify-between gap-1.5">
                      {SKETCH_PALETTE.map((swatch) => (
                        <button
                          key={swatch.hex}
                          onClick={() => setBrushColor(swatch.hex)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            brushColor === swatch.hex
                              ? 'border-amber-400 scale-110 shadow-md'
                              : 'border-slate-800 hover:scale-105'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Guides & Mirror Toggles */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSymmetryEnabled((v) => !v)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                        symmetryEnabled
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🪞 Mirror</span>
                    </button>
                    <button
                      onClick={() => setGuideRulerEnabled((v) => !v)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                        guideRulerEnabled
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Compass className="w-3 h-3" />
                      <span>French Curve</span>
                    </button>
                  </div>

                  {/* Clear Drawings Button */}
                  <button
                    onClick={handleClearStrokes}
                    className="w-full py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[10px] rounded-lg transition-all border border-rose-500/30 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Sketch Strokes</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. AUTODESK SKETCHBOOK LAYER STACK PANEL (SLIDE-OVER DRAWER)              */}
        {/* ========================================================================= */}
        {showLayerPanel && (
          <aside className="w-80 bg-[#0d1322]/95 border-l border-slate-800/90 backdrop-blur-xl p-4 flex flex-col justify-between z-30 shadow-2xl animate-fadeIn">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    SketchBook Layers ({layers.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowLayerPanel(false)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Layer Stack Items */}
              <div className="space-y-3">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className="bg-[#070b14] p-3 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[160px]">
                        {layer.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id ? { ...l, visible: !l.visible } : l
                              )
                            );
                          }}
                          className={`p-1 rounded ${
                            layer.visible ? 'text-slate-300' : 'text-slate-600'
                          }`}
                          title="Toggle Visibility"
                        >
                          {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setLayers((prev) =>
                              prev.map((l) =>
                                l.id === layer.id ? { ...l, locked: !l.locked } : l
                              )
                            );
                          }}
                          className={`p-1 rounded ${
                            layer.locked ? 'text-amber-400' : 'text-slate-600'
                          }`}
                          title="Toggle Lock"
                        >
                          {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Layer Opacity Slider */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500">Opacity:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={layer.opacity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setLayers((prev) =>
                            prev.map((l) => (l.id === layer.id ? { ...l, opacity: val } : l))
                          );
                        }}
                        className="w-full accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fabric Cutting Mat Selector */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-2 font-bold">
                  Cutting Board Fabric Canvas:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FABRIC_PRESETS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFabric(f)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all ${
                        selectedFabric.id === f.id
                          ? 'border-amber-500 bg-amber-500/15 font-bold text-amber-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span className="block truncate text-[11px]">{f.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Pattern Piece Quick Control Panel */}
            {selectedPiece && (
              <div className="mt-4 pt-3 border-t border-slate-800 bg-[#070b14] p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400 truncate max-w-[150px]">
                    {selectedPiece.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Rot: {selectedPiece.rotation}°
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => handleRotatePiece(selectedPiece.id, 45)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                    title="Rotate 45°"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>45°</span>
                  </button>
                  <button
                    onClick={() => handleFlipPiece(selectedPiece.id, 'h')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                    title="Flip Horizontally"
                  >
                    <FlipHorizontal className="w-3 h-3" />
                    <span>Flip H</span>
                  </button>
                  <button
                    onClick={() => handleFlipPiece(selectedPiece.id, 'v')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                    title="Flip Vertically"
                  >
                    <FlipVertical className="w-3 h-3" />
                    <span>Flip V</span>
                  </button>
                  <button
                    onClick={() => handleToggleFold(selectedPiece.id)}
                    className={`p-1.5 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 ${
                      selectedPiece.isFold
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                    title="Place On Fold"
                  >
                    <span>Fold</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. EXPORT SUITE MODAL (SVG, DXF, 1:1 TILED PDF, PNG SNAPSHOT)              */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-100">Export CAD & Pattern Suite</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select production format for industrial plotters, digital cutting tables, or workshop PDF printers.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleExportSVG}
                className="w-full p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 rounded-xl text-left flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div>
                  <span className="font-bold text-slate-200 text-xs block group-hover:text-amber-400">
                    Production SVG Document
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Precision vector cutlines, grainlines, notches, and seam offsets.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                  .SVG
                </span>
              </button>

              <button
                onClick={handleExportDXF}
                className="w-full p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 rounded-xl text-left flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div>
                  <span className="font-bold text-slate-200 text-xs block group-hover:text-amber-400">
                    AAMA DXF CAD Standard
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Standard Apparel CAD interchange for Gerber, Lectra, Optitex.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                  .DXF
                </span>
              </button>

              <button
                onClick={handleExportPDF}
                className="w-full p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 rounded-xl text-left flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div>
                  <span className="font-bold text-slate-200 text-xs block group-hover:text-amber-400">
                    1:1 Tiled PDF Pattern (US Letter / A4)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Full-scale printable pattern pages with registration alignment marks.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                  .PDF
                </span>
              </button>

              <button
                onClick={handleExportPNG}
                className="w-full p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700 rounded-xl text-left flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div>
                  <span className="font-bold text-slate-200 text-xs block group-hover:text-amber-400">
                    Autodesk SketchBook PNG Snapshot
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Raster snapshot with freehand chalk drawings, fabric canvas, and pieces.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                  .PNG
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Tailor Options Drawer */}
      <AdvancedTailorDrawer
        isOpen={showAdvancedDrawer}
        onClose={() => setShowAdvancedDrawer(false)}
        selectedPiece={selectedPiece}
        onUpdateSeamAllowance={(pieceId, sa) => {
          setPieces((prev) =>
            prev.map((p) => (p.id === pieceId ? { ...p, seamAllowance: sa } : p))
          );
        }}
        onExportDXF={handleExportDXF}
        units="in"
      />
    </div>
  );
}
