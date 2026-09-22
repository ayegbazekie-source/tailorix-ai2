/**
 * TAILORIX AI — BESPOKE ATELIER BIG CUTTING TABLE
 * An authentic, large-scale atelier cutting table workspace with:
 * - Centered industrial cutting table with continuous dispersion rack & self-healing grid
 * - Freehand zooming (mouse wheel & pinch zoom with cursor anchor) & unrestricted panning
 * - Streamlined toolset: Scissors (✂️) & Pen (✍️) plus Mirror Tool (🪞)
 * - Fixed ink pen tool for freehand handwriting (black ink on white sheets, white ink on dark fabric/table)
 * - Layer adjustment & scaling strictly constrained to cutting table boundaries
 * - Full Undo / Redo history tracking all cutting, writing, layer/fabric import, and yardage expansions
 * - Flat Layer Section (no sub-layers) for quick editing, visibility toggles, and selection
 * - Book-Fold Unfolding Sheet option (mirror view flipped) with automatic fabric width validation & expansion prompt
 * - Precision color contour detection for scissors: broken lines (seam allowance) are protected, solid lines only
 */

import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Scissors,
  PenTool,
  FlipHorizontal,
  RotateCw,
  RotateCcw,
  Layers,
  Upload,
  Plus,
  Minus,
  Check,
  Move,
  Maximize2,
  Minimize2,
  Trash2,
  Download,
  BookOpen,
  Sparkles,
  ArrowRight,
  Folder,
  Eye,
  EyeOff,
  Palette,
  Lock,
  Unlock,
  RefreshCw,
  X,
  ChevronDown,
  Info,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  AlertTriangle,
  CheckCircle2,
  Hand,
  Pipette,
  Sliders,
  SlidersHorizontal,
  Save,
  Copy,
  Ruler,
} from 'lucide-react';
import { SLOPER_BLOCK_TEMPLATES } from '../../templates/presetLibrary';

// Luxury Flat Fabric Presets
export const FLAT_FABRIC_PRESETS = [
  {
    id: 'selvedge_denim',
    name: '14.5oz Raw Selvedge Denim',
    baseColor: '#1a2f55',
    textureCss: 'repeating-linear-gradient(45deg, #132442, #132442 2px, #1c3561 2px, #1c3561 4px)',
    grainLabel: 'Warp Twill (Right-Hand)',
  },
  {
    id: 'mulberry_silk',
    name: '22 Momme Mulberry Silk Satin',
    baseColor: '#2d3748',
    textureCss: 'radial-gradient(ellipse at 50% 25%, rgba(255,255,255,0.18), transparent 60%), linear-gradient(135deg, #1f2733 0%, #111620 100%)',
    grainLabel: 'Warp Filament Grain',
  },
  {
    id: 'savile_wool',
    name: 'Savile Row 340 GSM Wool Flannel',
    baseColor: '#383e4a',
    textureCss: 'repeating-linear-gradient(60deg, #2b303a, #2b303a 3px, #3d4452 3px, #3d4452 6px)',
    grainLabel: 'Worsted Suiting Warp',
  },
  {
    id: 'irish_linen',
    name: 'Natural Pure Irish Linen',
    baseColor: '#5c544a',
    textureCss: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px), linear-gradient(to bottom, #4a443b, #38332c)',
    grainLabel: 'Natural Flax Slub Warp',
  },
  {
    id: 'crisp_poplin',
    name: '120s 2-Ply Cotton Poplin',
    baseColor: '#172033',
    textureCss: 'linear-gradient(to right, #1e293b, #0f172a)',
    grainLabel: 'Compact Combed Cotton Grain',
  },
  {
    id: 'burgundy_velvet',
    name: 'Imperial Italian Cotton Velvet',
    baseColor: '#4a1525',
    textureCss: 'radial-gradient(circle at 40% 40%, #5e1b2f, #330d19)',
    grainLabel: 'Pile Direction (Down-Nap)',
  },
];

// Helper: Calculate contained and centered geometry for fabric inside the green rack
export const calculateContainedFabricGeometry = (widthInches, lengthInches, tableW = 2200, tableH = 1200) => {
  const rackXMin = 60;
  const rackXMax = tableW - 60;
  const rackYMin = 84;
  const rackYMax = tableH - 60;
  const usableW = rackXMax - rackXMin; // 2080
  const usableH = rackYMax - rackYMin; // 1056

  const safeW = Math.max(12, widthInches || 54);
  const safeL = Math.max(12, lengthInches || 90);

  const scaleByW = usableW / safeW;
  const scaleByH = usableH / safeL;
  const scalePxPerInch = Math.min(scaleByW, scaleByH);

  const pixelW = Math.round(safeW * scalePxPerInch);
  const pixelH = Math.round(safeL * scalePxPerInch);

  const x = Math.round(rackXMin + (usableW - pixelW) / 2);
  const y = Math.round(rackYMin + (usableH - pixelH) / 2);

  return { x, y, scalePxPerInch, pixelW, pixelH };
};

const BigCuttingTable = forwardRef(function BigCuttingTable({
  layers = [],
  cuttingSheets = [],
  isFabricMoveEnabled = false,
  onToggleFabricMove,
  onUpdateCuttingSheet,
  onRemoveCuttingSheet,
  onNavigateToDrafting,
  onHistoryChange,
}, ref) {
  // -------------------------------------------------------------------------
  // 1. Table Dimensions & Physical Limits (Stationary Industrial Cutting Table)
  // -------------------------------------------------------------------------
  const TABLE_WIDTH = 2200;
  const TABLE_HEIGHT = 1200;
  const TABLE_PADDING_X = 24;
  const TABLE_PADDING_Y_TOP = 64; // Below the dispersion rack bar
  const TABLE_PADDING_Y_BOTTOM = 24;

  const containerRef = useRef(null);
  const tableBenchRef = useRef(null);
  const twoFingerStartRef = useRef(null);
  const [tableZoom, setTableZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 0.5;
    }
    return 0.75;
  });
  const [tablePanOffset, setTablePanOffset] = useState({ x: 0, y: 0 });
  const [isTablePanning, setIsTablePanning] = useState(false);
  const tablePanStartRef = useRef({ x: 0, y: 0 });
  const [availableWidth, setAvailableWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [activeDrawerTab, setActiveDrawerTab] = useState('layers'); // 'layers' | 'tools'

  // Responsive tracking of available canvas width for toolbar adaptations
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setAvailableWidth(containerRef.current.clientWidth || window.innerWidth);
      } else {
        setAvailableWidth(window.innerWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Tape Measure state on Cutting Table with 10-second auto-dismiss and manual clear
  const [tableTapeMeasure, setTableTapeMeasure] = useState({
    start: null,
    end: null,
    active: false,
  });
  const tableTapeTimerRef = useRef(null);

  const triggerTableTapeTimer = useCallback(() => {
    if (tableTapeTimerRef.current) clearTimeout(tableTapeTimerRef.current);
    tableTapeTimerRef.current = setTimeout(() => {
      setTableTapeMeasure({ start: null, end: null, active: false });
    }, 10000);
  }, []);

  // -------------------------------------------------------------------------
  // 2. Tools: Scissors (✂️), Pen (✍️), and Move (Movable Tool)
  // 'scissors' | 'pen' | 'move' | 'select' | 'pan' | 'tape_measure'
  // -------------------------------------------------------------------------
  const [activeTool, setActiveTool] = useState('scissors');
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Synchronize external isFabricMoveEnabled toggle from parent workspace header
  useEffect(() => {
    if (isFabricMoveEnabled && activeTool !== 'move') {
      setActiveTool('move');
    } else if (!isFabricMoveEnabled && activeTool === 'move') {
      setActiveTool('select');
    }
  }, [isFabricMoveEnabled]);

  // Requirement 4: Tool Unselect Toggle Logic
  const handleToolSelect = useCallback((toolName) => {
    if (activeTool === toolName) {
      setActiveTool('select'); // Default back to selection
      setIsDrawingMode(false);
      setIsEyedropperActive(false);
      if (toolName === 'move' && onToggleFabricMove) {
        onToggleFabricMove(false);
      }
    } else {
      setActiveTool(toolName);
      setIsDrawingMode(toolName === 'pen');
      if (toolName !== 'scissors') {
        setIsEyedropperActive(false);
      }
      if (toolName === 'move' && onToggleFabricMove) {
        onToggleFabricMove(true);
      }
    }
  }, [activeTool, onToggleFabricMove]);

  // Tap-and-hold state for moving imported bodice parts around freely
  const [tapHoldPatternId, setTapHoldPatternId] = useState(null);
  const tapHoldTimerRef = useRef(null);

  // Fabric Adjuster Tool Modal / Control State
  const [showFabricAdjuster, setShowFabricAdjuster] = useState(false);

  // Fabric Adjuster: Adjust Fabric Width (in inches) — strictly contained inside green rack
  const handleAdjustFabricWidth = (delta) => {
    pushState(`Adjust Fabric Width ${delta > 0 ? '+' : ''}${delta}"`);
    setFabricConfig((prev) => {
      const nextW = Math.max(24, Math.min(130, prev.widthInches + delta));
      const geom = calculateContainedFabricGeometry(nextW, prev.lengthInches, TABLE_WIDTH, TABLE_HEIGHT);
      return { ...prev, widthInches: nextW, ...geom };
    });
    setCuttingToast({
      message: `Fabric Width adjusted to ${Math.max(24, Math.min(130, fabricConfig.widthInches + delta))}"`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 2200);
  };

  // Fabric Adjuster: Adjust Fabric Length (in inches / yards) — strictly contained inside green rack
  const handleAdjustFabricLength = (delta) => {
    pushState(`Adjust Fabric Length ${delta > 0 ? '+' : ''}${delta}"`);
    setFabricConfig((prev) => {
      const nextL = Math.max(36, Math.min(360, prev.lengthInches + delta));
      const geom = calculateContainedFabricGeometry(prev.widthInches, nextL, TABLE_WIDTH, TABLE_HEIGHT);
      return { ...prev, lengthInches: nextL, ...geom };
    });
    const nextTotalL = Math.max(36, Math.min(360, fabricConfig.lengthInches + delta));
    setCuttingToast({
      message: `Fabric Length adjusted to ${(nextTotalL / 36).toFixed(1)} Yds (${nextTotalL}")`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 2200);
  };

  // Requirement 6: Scissors Target Cut Color & Eyedropper Manual Selection
  const [targetCutColor, setTargetCutColor] = useState('#38bdf8');
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);

  // Pen tool has fixed color settings:
  // White ink on cutting table/dark fabric; black ink when writing on white sheets
  const [penInkMode, setPenInkMode] = useState('auto'); // 'auto' | 'black' | 'white'
  const [handwritingStrokes, setHandwritingStrokes] = useState([]);
  const [currentPenStroke, setCurrentPenStroke] = useState(null);

  // -------------------------------------------------------------------------
  // 3. Flat Fabric on the Big Table (Contained + Centered in Rack)
  // -------------------------------------------------------------------------
  const [fabricConfig, setFabricConfig] = useState(() => {
    const initGeom = calculateContainedFabricGeometry(54, 90, 2200, 1200);
    const base = {
      id: 'fabric_bolt_1',
      name: '14.5oz Raw Selvedge Denim',
      presetId: 'selvedge_denim',
      customImageUrl: null,
      x: initGeom.x,
      y: initGeom.y,
      widthInches: 54, // 54 inches wide
      lengthInches: 90, // 2.5 yards (90 inches) long
      scalePxPerInch: initGeom.scalePxPerInch, // Computed to fit inside rack without overflow
      grainLabel: 'Warp Twill Grain (Selvedge to Selvedge)',
      visible: false, // Default to FALSE so initial table is a clean green cutting rack
      rotation: 0,
      locked: false,
    };
    try {
      const saved = sessionStorage.getItem('tailorix_session_fabric_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const geom = calculateContainedFabricGeometry(parsed.widthInches || 54, parsed.lengthInches || 90, 2200, 1200);
        return { ...base, ...parsed, ...geom };
      }
    } catch {}
    return base;
  });

  const [selectedFabric, setSelectedFabric] = useState(false);

  // Imported sheets on the cutting table (clean initial state: empty)
  const [importedSheetIds, setImportedSheetIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tailorix_session_imported_sheet_ids');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('tailorix_session_imported_sheet_ids', JSON.stringify(importedSheetIds));
    } catch {}
  }, [importedSheetIds]);

  useEffect(() => {
    try {
      sessionStorage.setItem('tailorix_session_fabric_config', JSON.stringify(fabricConfig));
    } catch {}
  }, [fabricConfig]);

  const [isDraggingFabric, setIsDraggingFabric] = useState(false);
  const fabricDragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });
  const fileInputRef = useRef(null);

  // Unified Object Transformation (Move & Rotate) State
  const [activeTransform, setActiveTransform] = useState(null);
  const activeTransformRef = useRef(null);
  activeTransformRef.current = activeTransform;

  // -------------------------------------------------------------------------
  // 4. Imported Traced Patterns & Bodice Layers
  // Constrained to table boundaries; supports Fold/Unfold (mirror view)
  // -------------------------------------------------------------------------
  const [tracedPatterns, setTracedPatterns] = useState([]);
  const [selectedPatternId, setSelectedPatternId] = useState(null);
  const [isDraggingPattern, setIsDraggingPattern] = useState(false);
  const patternDragRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  // Resize handling
  const [isResizingPattern, setIsResizingPattern] = useState(false);
  const resizeRef = useRef({ startX: 0, startY: 0, initialW: 0, initialH: 0 });

  // -------------------------------------------------------------------------
  // 5. Cut-Out Fabric Parts (Excised by Scissors)
  // -------------------------------------------------------------------------
  const [cutOutPieces, setCutOutPieces] = useState([]);
  const [selectedCutPieceId, setSelectedCutPieceId] = useState(null);
  const [isDraggingCutPiece, setIsDraggingCutPiece] = useState(false);
  const cutPieceDragRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  // Cutting Animation & Feedback
  const [cuttingAnimPieceId, setCuttingAnimPieceId] = useState(null);
  const [cuttingToast, setCuttingToast] = useState(null);

  // -------------------------------------------------------------------------
  // 6. Scissors Contour Color Detection & Manual Selection
  // Broken lines (seam allowance) must NOT be cut. Only complete solid lines cut!
  // -------------------------------------------------------------------------
  const [selectedCutColor, setSelectedCutColor] = useState(null);

  // -------------------------------------------------------------------------
  // 7. Fabric Width Insufficient for Unfolding Prompt Modal
  // -------------------------------------------------------------------------
  const [unfoldFabricPrompt, setUnfoldFabricPrompt] = useState(null);

  // -------------------------------------------------------------------------
  // 8. Drawers & Layer Section
  // Flat layer section (no sub-layers) for quick editing & selection
  // -------------------------------------------------------------------------
  const [showLayerSection, setShowLayerSection] = useState(false);
  const [showReadyMadeDrawer, setShowReadyMadeDrawer] = useState(false);
  const [readyMadeOutlines, setReadyMadeOutlines] = useState([]);
  const [savedCutFabrics, setSavedCutFabrics] = useState(() => {
    try {
      const stored = localStorage.getItem('tailorix_ready_made_cut_fabrics');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [readyMadeActiveTab, setReadyMadeActiveTab] = useState('cut_fabrics'); // 'cut_fabrics' | 'slopers'
  const [copiedFabricPatterns, setCopiedFabricPatterns] = useState([]);

  // Cutting Sheets state on the Green Rack workbench
  const [selectedCuttingSheetId, setSelectedCuttingSheetId] = useState(null);
  const [draggingSheetId, setDraggingSheetId] = useState(null);
  const sheetDragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const [rotatingSheetId, setRotatingSheetId] = useState(null);
  const sheetRotateRef = useRef({ centerX: 0, centerY: 0, startAngle: 0, initialRotation: 0 });

  // Fabric rotation state
  const [isRotatingFabric, setIsRotatingFabric] = useState(false);
  const fabricRotateRef = useRef({ centerX: 0, centerY: 0, startAngle: 0, initialRotation: 0 });

  // Traced pattern rotation state
  const [rotatingPatternId, setRotatingPatternId] = useState(null);
  const patternRotateRef = useRef({ centerX: 0, centerY: 0, startAngle: 0, initialRotation: 0 });

  // -------------------------------------------------------------------------
  // 9. UNDO / REDO HISTORY STACK
  // Tracks cutting, writing, layer import, fabric change, yards & width changes
  // -------------------------------------------------------------------------
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Keep fresh refs to prevent stale closures in undo/redo and imperative handlers
  const historyRef = useRef(history);
  historyRef.current = history;
  const redoStackRef = useRef(redoStack);
  redoStackRef.current = redoStack;
  const fabricConfigRef = useRef(fabricConfig);
  fabricConfigRef.current = fabricConfig;
  const tracedPatternsRef = useRef(tracedPatterns);
  tracedPatternsRef.current = tracedPatterns;
  const cutOutPiecesRef = useRef(cutOutPieces);
  cutOutPiecesRef.current = cutOutPieces;
  const handwritingStrokesRef = useRef(handwritingStrokes);
  handwritingStrokesRef.current = handwritingStrokes;

  // Helper to record history before mutating state
  const pushState = useCallback((actionDesc = 'Action') => {
    setHistory((prev) => {
      const snapshot = {
        actionDesc,
        fabricConfig: JSON.parse(JSON.stringify(fabricConfigRef.current)),
        tracedPatterns: JSON.parse(JSON.stringify(tracedPatternsRef.current)),
        cutOutPieces: JSON.parse(JSON.stringify(cutOutPiecesRef.current)),
        handwritingStrokes: JSON.parse(JSON.stringify(handwritingStrokesRef.current)),
      };
      return [...prev.slice(-35), snapshot];
    });
    setRedoStack([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const previousSnapshot = historyRef.current[historyRef.current.length - 1];
    const currentSnapshot = {
      actionDesc: 'Current State',
      fabricConfig: JSON.parse(JSON.stringify(fabricConfigRef.current)),
      tracedPatterns: JSON.parse(JSON.stringify(tracedPatternsRef.current)),
      cutOutPieces: JSON.parse(JSON.stringify(cutOutPiecesRef.current)),
      handwritingStrokes: JSON.parse(JSON.stringify(handwritingStrokesRef.current)),
    };

    setRedoStack((prev) => [...prev, currentSnapshot]);
    setHistory((prev) => prev.slice(0, -1));

    setFabricConfig(previousSnapshot.fabricConfig);
    setTracedPatterns(previousSnapshot.tracedPatterns);
    setCutOutPieces(previousSnapshot.cutOutPieces);
    setHandwritingStrokes(previousSnapshot.handwritingStrokes);

    setCuttingToast({
      message: `↶ Undid: ${previousSnapshot.actionDesc}`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 2500);
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const nextSnapshot = redoStackRef.current[redoStackRef.current.length - 1];
    const currentSnapshot = {
      actionDesc: 'Current State',
      fabricConfig: JSON.parse(JSON.stringify(fabricConfigRef.current)),
      tracedPatterns: JSON.parse(JSON.stringify(tracedPatternsRef.current)),
      cutOutPieces: JSON.parse(JSON.stringify(cutOutPiecesRef.current)),
      handwritingStrokes: JSON.parse(JSON.stringify(handwritingStrokesRef.current)),
    };

    setHistory((prev) => [...prev, currentSnapshot]);
    setRedoStack((prev) => prev.slice(0, -1));

    setFabricConfig(nextSnapshot.fabricConfig);
    setTracedPatterns(nextSnapshot.tracedPatterns);
    setCutOutPieces(nextSnapshot.cutOutPieces);
    setHandwritingStrokes(nextSnapshot.handwritingStrokes);

    setCuttingToast({
      message: `↷ Redid: ${nextSnapshot.actionDesc}`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 2500);
  }, []);

  // Toggle move mode (Requirement: movement of fabric only happens when Move toggle button is turned on at the header)
  const toggleMoveMode = useCallback(() => {
    setActiveTool((curr) => {
      const next = curr === 'move' ? 'select' : 'move';
      onToggleFabricMove?.(next === 'move');
      setCuttingToast({
        message: next === 'move'
          ? 'Move Fabric mode ON: Drag fabric freely across the table'
          : 'Move Fabric mode OFF: Fabric is strictly stationary',
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 2500);
      return next;
    });
  }, [onToggleFabricMove]);

  // Toggle fabric visibility (Requirement: green rack represents the table where users can cut sheets on, fabric can be hidden)
  const toggleFabricVisibility = useCallback(() => {
    pushState('Toggle Fabric Visibility');
    setFabricConfig((prev) => {
      const nextVis = !prev.visible;
      setCuttingToast({
        message: nextVis
          ? 'Fabric overlayer visible'
          : 'Fabric hidden: Green rack table active to cut sheets directly',
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 2500);
      return { ...prev, visible: nextVis };
    });
  }, [pushState]);

  // Import / Remove Cutting Sheets onto Cutting Table Rack
  const handleImportSheetToTable = useCallback((sheetId) => {
    if (!sheetId) return;
    const sheet = cuttingSheets.find((s) => s.id === sheetId);
    if (!sheet) return;

    setImportedSheetIds((prev) => {
      if (prev.includes(sheetId)) return prev;
      return [...prev, sheetId];
    });
    setSelectedCuttingSheetId(sheetId);
    setSelectedFabric(false);
    setSelectedPatternId(null);
    setCuttingToast({
      message: `✓ Imported "${sheet.name}" onto cutting table rack`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 2500);
  }, [cuttingSheets]);

  const handleRemoveSheetFromTable = useCallback((sheetId) => {
    setImportedSheetIds((prev) => prev.filter((id) => id !== sheetId));
    if (selectedCuttingSheetId === sheetId) {
      setSelectedCuttingSheetId(null);
    }
  }, [selectedCuttingSheetId]);

  // Sync undo/redo, move toggle, and layers availability with parent workspace
  useEffect(() => {
    onHistoryChange?.({
      canUndo: history.length > 0,
      canRedo: redoStack.length > 0,
      showLayers: showLayerSection,
      isMoveEnabled: activeTool === 'move' || isFabricMoveEnabled,
      isFabricVisible: fabricConfig.visible,
      tableZoom,
      fabricConfig,
      showFabricAdjuster,
    });
  }, [
    history.length,
    redoStack.length,
    showLayerSection,
    activeTool,
    isFabricMoveEnabled,
    fabricConfig,
    tableZoom,
    showFabricAdjuster,
    onHistoryChange,
  ]);

  // Cutting Sheet Excision on Green Rack
  const handleCutSheet = useCallback((sheet) => {
    if (!sheet) return;
    pushState(`Cut Sheet ${sheet.name}`);

    try {
      const existing = JSON.parse(localStorage.getItem('tailorix_saved_projects') || '[]');
      const newSavedItem = {
        id: `project_sheet_${Date.now()}`,
        name: sheet.name || 'Excised Cutting Sheet',
        category: sheet.type ? sheet.type.replace('_', ' ') : 'Cutting Sheet Pattern',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dimensions: `${sheet.width}" × ${sheet.height}"`,
        svgPath: sheet.svgPath || `M 0,0 L ${sheet.width},0 L ${sheet.width},${sheet.height} L 0,${sheet.height} Z`,
        status: 'Excised & Ready',
        source: 'Green Rack Cutting Table',
        isSheet: true,
      };
      localStorage.setItem('tailorix_saved_projects', JSON.stringify([newSavedItem, ...existing]));
    } catch (e) {
      console.error('Failed to save cut sheet', e);
    }

    setCuttingToast({
      message: `✂️ "${sheet.name}" excised on green rack and saved to Project Gallery!`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 3500);
  }, [pushState]);

  // Requirement: Movement of fabric only happens when Move toggle button is turned on in the header
  const shiftFabricOnTable = useCallback((direction, stepDistance = 20) => {
    const isMoveActive = activeTool === 'move' || isFabricMoveEnabled;
    if (!isMoveActive) {
      setCuttingToast({
        message: 'Fabric is stationary. Turn on the "Move Fabric" toggle in the header to allow moving fabric.',
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 2500);
      return;
    }
    pushState(`Shift Fabric ${direction}`);
    setFabricConfig((prev) => {
      let newX = prev.x;
      let newY = prev.y;
      const curPixelW = prev.widthInches * prev.scalePxPerInch;
      const curPixelH = prev.lengthInches * prev.scalePxPerInch;
      const minX = 60;
      const maxX = Math.max(minX, TABLE_WIDTH - 60 - curPixelW);
      const minY = 84;
      const maxY = Math.max(minY, TABLE_HEIGHT - 60 - curPixelH);

      switch (direction) {
        case 'left':
          newX = Math.max(minX, prev.x - stepDistance);
          break;
        case 'right':
          newX = Math.min(maxX, prev.x + stepDistance);
          break;
        case 'up':
          newY = Math.max(minY, prev.y - stepDistance);
          break;
        case 'down':
          newY = Math.min(maxY, prev.y + stepDistance);
          break;
        default:
          break;
      }
      return { ...prev, x: newX, y: newY };
    });
    setCuttingToast({
      message: `↔ Fabric shifted ${direction} by ${stepDistance}px`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 2000);
  }, [activeTool, isFabricMoveEnabled, pushState, TABLE_WIDTH, TABLE_HEIGHT]);

  // Keyboard shortcut listener (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // -------------------------------------------------------------------------
  // 10. Center and Fit Table Inside Viewport (Baseline Zoom & Minimum Clamp)
  // Mobile: Clamped to 50% (0.5) baseline zoom
  // Desktop: Clamped to desktop full-rack layout baseline scale (min 0.5)
  // Panning allowed ONLY when zoomed beyond baseline.
  // -------------------------------------------------------------------------
  const [effectiveRackSize, setEffectiveRackSize] = useState({ width: TABLE_WIDTH, height: TABLE_HEIGHT });

  const getMinZoom = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 0.5; // Requirement 10: mobile baseline/minimum is 50% = 0.5
    }
    if (!containerRef.current) return 0.5;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return 0.5;
    if (clientWidth < 768) {
      return 0.5;
    }
    const scaleX = (clientWidth - 48) / TABLE_WIDTH;
    const scaleY = (clientHeight - 88) / TABLE_HEIGHT;
    const desktopBaseline = Math.round(Math.min(scaleX, scaleY) * 100) / 100;
    return Math.max(0.5, Math.min(1.0, desktopBaseline));
  }, [TABLE_WIDTH, TABLE_HEIGHT]);

  const updateEffectiveRackSize = useCallback(() => {
    const isMobile = (containerRef.current?.clientWidth || window.innerWidth) < 768;
    if (!isMobile) {
      setEffectiveRackSize({ width: TABLE_WIDTH, height: TABLE_HEIGHT });
      return;
    }
    const availW = Math.max(260, (containerRef.current?.clientWidth || window.innerWidth) - 16);
    const availH = Math.max(280, (containerRef.current?.clientHeight || (window.innerHeight - 56)) - 16);
    const rackAspect = availW > availH ? (TABLE_WIDTH / TABLE_HEIGHT) : Math.max(0.68, Math.min(0.88, availW / availH));
    let fitW = availW;
    let fitH = Math.min(availH, Math.round(fitW / rackAspect));
    if (fitH > availH) {
      fitH = availH;
      fitW = Math.round(fitH * rackAspect);
    }
    const unscaledW = Math.round(fitW / 0.5);
    const unscaledH = Math.round(fitH / 0.5);
    setEffectiveRackSize({ width: unscaledW, height: unscaledH });
  }, [TABLE_WIDTH, TABLE_HEIGHT]);

  const applyTableZoom = useCallback((newZoomOrUpdater) => {
    const minZ = getMinZoom();
    setTableZoom((prevZoom) => {
      const targetZoom = typeof newZoomOrUpdater === 'function' ? newZoomOrUpdater(prevZoom) : newZoomOrUpdater;
      const clamped = Math.max(minZ, Math.min(2.5, Math.round(targetZoom * 100) / 100));
      if (clamped <= minZ + 0.005) {
        setTablePanOffset({ x: 0, y: 0 });
      }
      return clamped;
    });
  }, [getMinZoom]);

  const centerAndFitTable = useCallback(() => {
    const isMobile = (containerRef.current?.clientWidth || window.innerWidth) < 768;
    let logicalW = TABLE_WIDTH;
    let logicalH = TABLE_HEIGHT;

    if (isMobile) {
      const availW = Math.max(260, (containerRef.current?.clientWidth || window.innerWidth) - 16);
      const availH = Math.max(280, (containerRef.current?.clientHeight || (window.innerHeight - 56)) - 16);
      const rackAspect = availW > availH ? (TABLE_WIDTH / TABLE_HEIGHT) : Math.max(0.68, Math.min(0.88, availW / availH));
      let fitW = availW;
      let fitH = Math.min(availH, Math.round(fitW / rackAspect));
      if (fitH > availH) {
        fitH = availH;
        fitW = Math.round(fitH * rackAspect);
      }
      logicalW = Math.round(fitW / 0.5);
      logicalH = Math.round(fitH / 0.5);
    }

    setEffectiveRackSize({ width: logicalW, height: logicalH });
    const minZ = getMinZoom();
    setTableZoom(minZ);
    setTablePanOffset({ x: 0, y: 0 });
    setFabricConfig((prev) => {
      const geom = calculateContainedFabricGeometry(prev.widthInches, prev.lengthInches, logicalW, logicalH);
      return { ...prev, ...geom };
    });
  }, [getMinZoom, calculateContainedFabricGeometry, TABLE_WIDTH, TABLE_HEIGHT]);

  useEffect(() => {
    centerAndFitTable();
    let ro = null;
    let timeoutId = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          centerAndFitTable();
        }, 100);
      });
      ro.observe(containerRef.current);
    }
    const handleResize = () => centerAndFitTable();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [centerAndFitTable]);

  // Touch gesture listener on cutting container for 2-finger pinch-to-zoom & pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let touchStartData = null;

    const onTouchStart = (e) => {
      if (e.touches && e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStartData = {
          dist: Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY),
          zoom: tableZoom,
          midX: (t1.clientX + t2.clientX) / 2,
          midY: (t1.clientY + t2.clientY) / 2,
          panX: tablePanOffset.x,
          panY: tablePanOffset.y,
        };
      }
    };

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length === 2 && touchStartData) {
        if (e.cancelable) e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const ratio = dist / (touchStartData.dist || 1);
        const minZ = getMinZoom();
        const nextZoom = Math.min(2.5, Math.max(minZ, Math.round(touchStartData.zoom * ratio * 100) / 100));

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const dx = midX - touchStartData.midX;
        const dy = midY - touchStartData.midY;

        setTableZoom(nextZoom);
        if (nextZoom <= minZ + 0.005) {
          setTablePanOffset({ x: 0, y: 0 });
        } else {
          setTablePanOffset({
            x: Math.round(touchStartData.panX + dx),
            y: Math.round(touchStartData.panY + dy),
          });
        }
      }
    };

    const onTouchEnd = (e) => {
      if (!e.touches || e.touches.length < 2) {
        touchStartData = null;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [tableZoom, tablePanOffset, getMinZoom]);

  // Transform client screen coordinates to table world coordinates
  const getTableWorldCoords = useCallback((clientX, clientY) => {
    if (!tableBenchRef.current) return { x: 0, y: 0 };
    const rect = tableBenchRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / tableZoom,
      y: (clientY - rect.top) / tableZoom,
    };
  }, [tableZoom]);

  // Zooming via Wheel & Trackpad Pan (Enforces MIN_ZOOM and pan stability at baseline)
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const handleWheelZoom = (e) => {
      e.preventDefault();
      const minZ = getMinZoom();
      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        setTableZoom((prevZoom) => {
          const nextZ = Math.max(minZ, Math.min(2.5, Math.round(prevZoom * zoomFactor * 100) / 100));
          if (nextZ <= minZ + 0.005) {
            setTablePanOffset({ x: 0, y: 0 });
          }
          return nextZ;
        });
      } else {
        // Panning is only permitted when zoomed in beyond baseline!
        setTableZoom((curZoom) => {
          if (curZoom > minZ + 0.005) {
            setTablePanOffset((prev) => ({
              x: Math.round(prev.x - e.deltaX),
              y: Math.round(prev.y - e.deltaY),
            }));
          }
          return curZoom;
        });
      }
    };

    node.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => node.removeEventListener('wheel', handleWheelZoom);
  }, [getMinZoom]);

  // Touch Pinch-Zoom & Two-Finger Pan (Enforces MIN_ZOOM and pan stability at baseline)
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    let initialDist = null;
    let initialZoom = 1;
    let initialCenter = null;
    let initialPan = { x: 0, y: 0 };

    const handleTouchStart = (e) => {
      if (e.touches && e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        initialDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        initialZoom = tableZoom;
        initialCenter = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
        initialPan = { ...tablePanOffset };
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length === 2 && initialDist && initialCenter) {
        e.preventDefault();
        const minZ = getMinZoom();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const scale = currentDist / initialDist;
        const targetZoom = Math.max(minZ, Math.min(2.5, Math.round(initialZoom * scale * 100) / 100));
        setTableZoom(targetZoom);

        if (targetZoom <= minZ + 0.005) {
          setTablePanOffset({ x: 0, y: 0 });
        } else {
          const curCenter = {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2,
          };
          setTablePanOffset({
            x: Math.round(initialPan.x + (curCenter.x - initialCenter.x)),
            y: Math.round(initialPan.y + (curCenter.y - initialCenter.y)),
          });
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (!e.touches || e.touches.length < 2) {
        initialDist = null;
        initialCenter = null;
      }
    };

    node.addEventListener('touchstart', handleTouchStart, { passive: false });
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    node.addEventListener('touchend', handleTouchEnd);
    return () => {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
      node.removeEventListener('touchend', handleTouchEnd);
    };
  }, [tableZoom, tablePanOffset, getMinZoom]);

  // Detect whether a layer / pattern is situated on the fabric
  const isPatternOverFabric = useCallback((pat) => {
    if (!pat || !fabricConfig.visible) return false;
    const pW = pat.isUnfolded ? pat.width * 2 : pat.width;
    const pH = pat.height;
    const fW = fabricConfig.widthInches * fabricConfig.scalePxPerInch;
    const fH = fabricConfig.lengthInches * fabricConfig.scalePxPerInch;

    const overlapX = Math.max(0, Math.min(pat.x + pW, fabricConfig.x + fW) - Math.max(pat.x, fabricConfig.x));
    const overlapY = Math.max(0, Math.min(pat.y + pH, fabricConfig.y + fH) - Math.max(pat.y, fabricConfig.y));
    return overlapX > 30 && overlapY > 30;
  }, [fabricConfig]);

  // Copy sketch pattern lines onto the imported fabric before cutting
  const handleCopyPatternToFabric = useCallback((pattern) => {
    if (!pattern) return;

    const newCopied = {
      id: `copied_${pattern.id}_${Date.now()}`,
      sourcePatternId: pattern.id,
      name: pattern.name,
      contourColor: pattern.contourColor || '#38bdf8',
      svgPath: pattern.svgPath,
      x: pattern.x,
      y: pattern.y,
      width: pattern.width,
      height: pattern.height,
      rotation: pattern.rotation || 0,
      isUnfolded: Boolean(pattern.isUnfolded),
      timestamp: Date.now(),
    };

    setCopiedFabricPatterns((prev) => {
      const filtered = prev.filter((p) => p.sourcePatternId !== pattern.id);
      return [...filtered, newCopied];
    });

    setCuttingToast({
      message: `✓ Copied sketch pattern lines of "${pattern.name}" onto ${fabricConfig.name}! You can now make the layer invisible before cutting.`,
      action: {
        label: 'Make Layer Invisible',
        onClick: () => {
          setTracedPatterns((prev) =>
            prev.map((p) => (p.id === pattern.id ? { ...p, visible: false } : p))
          );
          setCuttingToast({
            message: `Layer "${pattern.name}" is now invisible. Copied lines remain on fabric ready for Cut Out.`,
            timestamp: Date.now(),
          });
          setTimeout(() => setCuttingToast(null), 3500);
        },
      },
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 6500);
  }, [fabricConfig.name]);

  // Load custom ready-made outlines
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tailorix_ready_made_outlines');
      if (stored) setReadyMadeOutlines(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to parse ready-made outlines', e);
    }
  }, []);

  // Strict: No auto-import of template bodices to cutting table; table starts clean and imports come ONLY from the user's layers section.

  // -------------------------------------------------------------------------
  // 11. Stroke Analysis & Strict Layer Validation (Rule 7 & User Constraints)
  // - No auto-drawn bodice can be imported into table.
  // - If no layer detected, show 'no layer detected' popup.
  // - Single drawn lines, dots, darts, or seam allowances CANNOT be imported.
  // - ONLY joint lines that form the bodice or parts layers can be imported.
  // -------------------------------------------------------------------------
  const isBrokenLineStroke = (stroke) => {
    if (!stroke) return false;
    return Boolean(
      stroke.dashed ||
      stroke.isSeamAllowance ||
      stroke.tool === 'seam_allowance' ||
      (stroke.strokeDasharray && stroke.strokeDasharray !== 'none' && stroke.strokeDasharray !== '0') ||
      (stroke.label && stroke.label.toLowerCase().includes('seam'))
    );
  };

  const isDartElement = (el) => {
    if (!el) return false;
    return Boolean(
      el.tool === 'dart' ||
      el.type === 'dart' ||
      (el.label && el.label.toLowerCase().includes('dart'))
    );
  };

  const isDotElement = (el) => {
    if (!el) return false;
    if (el.points && el.points.length === 1) return true;
    if (el.type === 'dot' || el.type === 'circle') return true;
    if (el.width && el.width < 12 && el.height && el.height < 12) return true;
    return false;
  };

  // Helper to normalize color hex codes for comparison
  const normalizeColorHex = (c) => {
    if (!c || typeof c !== 'string') return '';
    let str = c.trim().toLowerCase();
    if (str.startsWith('#') && str.length === 4) {
      str = `#${str[1]}${str[1]}${str[2]}${str[2]}${str[3]}${str[3]}`;
    }
    return str;
  };

  const validateLayerForImport = useCallback((layer) => {
    if (!layer) {
      return { valid: false, reason: 'No layer detected' };
    }

    // Cutting sheet pattern piece with verified geometry
    if (layer.patternPiece || layer.sheetId) {
      const pieceColor = layer.patternPiece?.color || layer.patternPiece?.strokeColor || '#38bdf8';
      return {
        valid: true,
        dominantColor: pieceColor,
        solidStrokes: [],
        svgPath: layer.patternPiece?.svgPath || layer.svgPath,
      };
    }

    const rawElements = layer.elements || layer.strokes || [];
    if (rawElements.length === 0) {
      return { valid: false, reason: 'No layer detected: Layer has no drawn content.' };
    }

    // Filter out seam allowance (broken lines), darts, and isolated dots
    const solidStrokes = rawElements.filter(
      (el) => !isBrokenLineStroke(el) && !isDartElement(el) && !isDotElement(el)
    );

    // Rejection: Only seam allowances, darts, or dots were drawn
    if (solidStrokes.length === 0) {
      return {
        valid: false,
        reason: 'Cannot import: Only joint lines that form a bodice or parts layer can be imported. Single dots, darts, or seam allowances cannot be imported.',
      };
    }

    // Rejection: A single open unjoined line (e.g., 2 points segment, not forming a jointed piece)
    if (solidStrokes.length === 1) {
      const single = solidStrokes[0];
      const pts = single.points || [];
      const isClosed =
        pts.length >= 3 &&
        Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) < 30;
      if (!isClosed && pts.length <= 3) {
        return {
          valid: false,
          reason: 'Cannot import: A single drawn line cannot be imported. Only joint lines that form a bodice or parts layer can be imported.',
        };
      }
    }

    // Check that elements form joint lines with sufficient vertices/connections
    let totalPoints = 0;
    solidStrokes.forEach((s) => {
      totalPoints += s.points?.length || 2;
    });

    if (totalPoints < 4 && solidStrokes.length < 2) {
      return {
        valid: false,
        reason: 'Cannot import: Only joint lines that form a bodice or parts layer can be imported.',
      };
    }

    // Extract dominant color of the joint lines used to draw this pattern
    const colorCounts = {};
    solidStrokes.forEach((s) => {
      const col = s.color || s.stroke || '#38bdf8';
      colorCounts[col] = (colorCounts[col] || 0) + (s.points?.length || 1);
    });
    const detectedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
    const dominantColor = detectedColors[0] || layer.contourColor || '#38bdf8';

    // Construct SVG path directly from the points of the user's joint lines
    const allPts = [];
    solidStrokes.forEach((s) => {
      if (s.points && Array.isArray(s.points)) allPts.push(...s.points);
    });

    let generatedSvgPath = '';
    if (allPts.length >= 3) {
      const minX = Math.min(...allPts.map((p) => p.x));
      const minY = Math.min(...allPts.map((p) => p.y));
      const normPts = allPts.map((p) => ({ x: p.x - minX, y: p.y - minY }));
      generatedSvgPath =
        `M ${normPts[0].x} ${normPts[0].y} ` +
        normPts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') +
        ' Z';
    } else {
      generatedSvgPath = 'M 20 0 L 160 0 L 170 120 L 155 240 L 15 240 Z';
    }

    return {
      valid: true,
      dominantColor,
      detectedColors,
      solidStrokes,
      svgPath: generatedSvgPath,
    };
  }, []);

  const analyzeLayerStrokes = useCallback((layerOrPattern) => {
    const rawStrokes = layerOrPattern?.elements || layerOrPattern?.strokes || [];
    const solidStrokes = [];
    const brokenStrokes = [];
    const solidColorCounts = {};

    rawStrokes.forEach((st) => {
      if (isBrokenLineStroke(st)) {
        brokenStrokes.push(st);
      } else {
        solidStrokes.push(st);
        const col = st.color || '#38bdf8';
        solidColorCounts[col] = (solidColorCounts[col] || 0) + (st.points?.length || 1);
      }
    });

    const detectedSolidColors = Object.keys(solidColorCounts);
    let dominantColor = detectedSolidColors[0] || layerOrPattern?.contourColor || '#38bdf8';

    let contourSvgPath = layerOrPattern?.svgPath || layerOrPattern?.piece?.svgPath;

    if (!contourSvgPath && solidStrokes.length > 0) {
      const allPoints = [];
      solidStrokes.forEach((s) => {
        if (s.points && Array.isArray(s.points)) allPoints.push(...s.points);
      });
      if (allPoints.length >= 3) {
        const minX = Math.min(...allPoints.map((p) => p.x));
        const minY = Math.min(...allPoints.map((p) => p.y));
        const normPts = allPoints.map((p) => ({ x: p.x - minX, y: p.y - minY }));
        contourSvgPath =
          `M ${normPts[0].x} ${normPts[0].y} ` +
          normPts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') +
          ' Z';
      }
    }

    return {
      dominantColor,
      detectedSolidColors: detectedSolidColors.length > 0 ? detectedSolidColors : [dominantColor],
      solidStrokesCount: solidStrokes.length,
      brokenStrokesCount: brokenStrokes.length,
      isConverged: solidStrokes.length > 0,
      contourSvgPath: contourSvgPath || 'M 20 0 L 160 0 L 170 140 L 150 260 L 15 260 Z',
      rawStrokes,
    };
  }, []);

  // -------------------------------------------------------------------------
  // 12. Fabric Bolt Expansion & Shift Helpers
  // -------------------------------------------------------------------------
  const handleExpandFabric = (deltaW, deltaL) => {
    pushState(deltaL !== 0 ? `${deltaL > 0 ? 'Add' : 'Subtract'} Fabric Yardage` : `${deltaW > 0 ? 'Widen' : 'Narrow'} Fabric Bolt`);
    setFabricConfig((prev) => {
      const nextW = Math.max(36, Math.min(100, prev.widthInches + deltaW));
      const nextL = Math.max(36, Math.min(250, prev.lengthInches + deltaL));
      const geom = calculateContainedFabricGeometry(nextW, nextL, TABLE_WIDTH, TABLE_HEIGHT);
      return {
        ...prev,
        widthInches: nextW,
        lengthInches: nextL,
        ...geom,
      };
    });
  };

  const handleSelectPresetFabric = (preset) => {
    pushState(`Change Fabric to ${preset.name}`);
    setFabricConfig((prev) => {
      const geom = calculateContainedFabricGeometry(prev.widthInches, prev.lengthInches, TABLE_WIDTH, TABLE_HEIGHT);
      return {
        ...prev,
        presetId: preset.id,
        customImageUrl: null,
        name: preset.name,
        grainLabel: preset.grainLabel,
        ...geom,
      };
    });
  };

  const handleUploadCustomFabric = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      pushState('Upload Custom Flat Fabric');
      setFabricConfig((prev) => {
        const geom = calculateContainedFabricGeometry(prev.widthInches, prev.lengthInches, TABLE_WIDTH, TABLE_HEIGHT);
        return {
          ...prev,
          customImageUrl: e.target.result,
          name: file.name.replace(/\.[^/.]+$/, '') || 'Custom Fabric Bolt',
          grainLabel: 'Custom Uploaded Fabric Grain',
          ...geom,
        };
      });
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------------------
  // 13. Import Drafted Bodice Layer onto Fabric
  // Constrained strictly to Table Limits & User Validation Constraints
  // -------------------------------------------------------------------------
  const handleTraceBodiceOntoFabric = (layer) => {
    if (!layer) {
      setCuttingToast({
        message: 'No layer detected: Please draft a pattern on the Pattern Drafting Board first.',
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 3500);
      return;
    }

    // Validate: Only joint lines forming bodice/parts layer can be imported
    const validation = validateLayerForImport(layer);
    if (!validation.valid) {
      setCuttingToast({
        message: `⚠️ ${validation.reason}`,
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 4500);
      return;
    }

    pushState(`Import Bodice Layer: ${layer.name}`);

    const initialW = 230;
    const initialH = 320;
    const col = tracedPatterns.length % 3;
    const row = Math.floor(tracedPatterns.length / 3);

    // Ensure within table boundaries
    const targetX = Math.max(TABLE_PADDING_X, Math.min(TABLE_WIDTH - TABLE_PADDING_X - initialW, fabricConfig.x + 40 + col * 260));
    const targetY = Math.max(TABLE_PADDING_Y_TOP, Math.min(TABLE_HEIGHT - TABLE_PADDING_Y_BOTTOM - initialH, fabricConfig.y + 60 + row * 340));

    const newPattern = {
      id: `traced_${Date.now()}_${layer.id}`,
      layerId: layer.id,
      name: layer.name || `Bodice Layer ${tracedPatterns.length + 1}`,
      bodiceType: layer.bodiceType || 'Bespoke Bodice Sloper',
      svgPath: validation.svgPath,
      contourColor: validation.dominantColor, // Exact color used to draw the joint lines of the sketch pattern
      detectedSolidColors: validation.detectedColors || [validation.dominantColor],
      isConverged: true,
      x: targetX,
      y: targetY,
      width: initialW,
      height: initialH,
      rotation: 0,
      isUnfolded: false,
      isCutOut: false,
      seamAllowance: 0.625,
      visible: true,
      strokes: layer.elements || layer.strokes || [],
    };

    setTracedPatterns((prev) => [...prev, newPattern]);
    setSelectedPatternId(newPattern.id);
    setSelectedCutColor(validation.dominantColor);
    setTargetCutColor(validation.dominantColor);
    setShowLayerSection(false);

    setCuttingToast({
      message: `✓ Imported "${newPattern.name}" (${validation.dominantColor} joint lines) onto table`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 3000);
  };

  const handleImportReadyMadeOutline = (outline) => {
    // Disabled auto-drawn template bodices per prompt instruction
    setCuttingToast({
      message: 'Notice: Pre-made templates disabled. Only genuine layers drafted from the Pattern Drafting Board can be imported.',
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 3500);
  };

  // -------------------------------------------------------------------------
  // 14. Unfolding (Mirror View Flipped) with Fabric Width Validation (Rule 6)
  // Allows user to view the complete bodice and cut in either state!
  // If fabric width is insufficient, prompts user to increase width and expands table to fit.
  // -------------------------------------------------------------------------
  const handleToggleUnfoldPattern = (patternId) => {
    const pattern = tracedPatterns.find((p) => p.id === patternId);
    if (!pattern) return;

    if (pattern.isUnfolded) {
      // Fold back to half bodice view
      pushState(`Fold Bodice ${pattern.name} in Half`);
      setTracedPatterns((prev) =>
        prev.map((p) => (p.id === patternId ? { ...p, isUnfolded: false } : p))
      );
      setCuttingToast({
        message: `📁 "${pattern.name}" folded to half view (Cut-on-Fold)`,
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 3000);
      return;
    }

    // Unfolding: Requires double width (mirror view)
    const unfoldedWidthPx = pattern.width * 2;
    const requiredFabricWidthInches = Math.ceil(unfoldedWidthPx / fabricConfig.scalePxPerInch);
    const fabricPixelW = fabricConfig.widthInches * fabricConfig.scalePxPerInch;

    // Check if current fabric width is sufficient
    const isFabricWidthSufficient =
      fabricConfig.widthInches >= requiredFabricWidthInches &&
      pattern.x + unfoldedWidthPx <= fabricConfig.x + fabricPixelW + 40;

    if (!isFabricWidthSufficient) {
      // Prompt user to expand fabric width to fit
      const suggestedWidth = Math.max(requiredFabricWidthInches + 6, fabricConfig.widthInches + 12);
      setUnfoldFabricPrompt({
        patternId: pattern.id,
        patternName: pattern.name,
        currentWidthInches: fabricConfig.widthInches,
        requiredWidthInches: requiredFabricWidthInches,
        suggestedWidth,
      });
      return;
    }

    // Sufficient width: execute unfold immediately
    executeUnfold(patternId);
  };

  const executeUnfold = (patternId) => {
    pushState(`Unfold Bodice Mirror View`);
    setTracedPatterns((prev) =>
      prev.map((p) => {
        if (p.id !== patternId) return p;
        // Clamp position so unfolded width stays strictly inside table boundary
        const unfoldedW = p.width * 2;
        const clampedX = Math.min(TABLE_WIDTH - TABLE_PADDING_X - unfoldedW, p.x);
        return {
          ...p,
          isUnfolded: true,
          x: Math.max(TABLE_PADDING_X, clampedX),
        };
      })
    );

    setCuttingToast({
      message: `🪞 Complete full bodice unfolded (Mirror view active). Ready to cut!`,
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 3500);
  };

  const handleConfirmExpandAndUnfold = () => {
    if (!unfoldFabricPrompt) return;
    const { patternId, suggestedWidth } = unfoldFabricPrompt;

    pushState(`Expand Fabric to ${suggestedWidth}" & Unfold Bodice`);
    setFabricConfig((prev) => ({
      ...prev,
      widthInches: suggestedWidth,
    }));

    executeUnfold(patternId);
    setUnfoldFabricPrompt(null);
  };

  // -------------------------------------------------------------------------
  // 15. Scissors Cutting Execution (Rule 7)
  // Only cut when complete solid drawn line color is detected!
  // Broken lines (seam allowance) are never cut.
  // -------------------------------------------------------------------------
  const handleExecuteCutOut = (pattern) => {
    if (!pattern || pattern.isCutOut) return;

    // Color Matching Check: If the color used to draw the sketch pattern is different from what's selected, DO NOT cut out!
    const activeSelectedColor = selectedCutColor || targetCutColor;
    const patternDrawColor = pattern.contourColor || '#38bdf8';

    if (normalizeColorHex(activeSelectedColor) !== normalizeColorHex(patternDrawColor)) {
      setCuttingToast({
        message: `⚠️ Color Mismatch: Cannot cut out. Selected cut color (${activeSelectedColor}) does not match the color used to draw the pattern joint lines (${patternDrawColor}). Select the matching color to cut.`,
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 4500);
      return;
    }

    pushState(`Cut Bodice: ${pattern.name}`);
    setCuttingAnimPieceId(pattern.id);

    // Atelier scissor snip audio synthesis
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      // audio context not allowed
    }

    setTimeout(() => {
      // Mark pattern as cut out
      setTracedPatterns((prev) =>
        prev.map((p) => (p.id === pattern.id ? { ...p, isCutOut: true } : p))
      );

      // Create excised fabric piece (folded or full unfolded)
      const cutPiece = {
        id: `cut_piece_${Date.now()}`,
        name: `${pattern.name} (${pattern.isUnfolded ? 'Full Bodice' : 'Half Folded'})`,
        patternId: pattern.id,
        svgPath: pattern.svgPath,
        fabricName: fabricConfig.name,
        fabricPresetId: fabricConfig.presetId,
        customImageUrl: fabricConfig.customImageUrl,
        x: pattern.x + 35,
        y: pattern.y + 25,
        width: pattern.width,
        height: pattern.height,
        rotation: pattern.rotation,
        isUnfolded: pattern.isUnfolded,
        timestamp: Date.now(),
        contourColor: patternDrawColor,
        visible: true,
      };

      setCutOutPieces((prev) => [...prev, cutPiece]);
      setSelectedCutPieceId(cutPiece.id);
      setCuttingAnimPieceId(null);

      // Action Complete Toast: NO auto-save to gallery; NO "Open Gallery" button
      setCuttingToast({
        message: `✂️ "${pattern.name}" excised cleanly from ${fabricConfig.name}!`,
        action: {
          label: 'Save to Ready-Made Outlines',
          onClick: () => handleSaveCutFabricToReadyMadeOutlines(cutPiece),
        },
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 5000);
    }, 400);
  };

  // Save Cut-Out Fabric Piece specifically to Ready-Made Outlines (User Requirement)
  const handleSaveCutFabricToReadyMadeOutlines = useCallback((item) => {
    const targetItem = item || (selectedCutPieceId ? cutOutPieces.find((c) => c.id === selectedCutPieceId) : (cutOutPieces.length > 0 ? cutOutPieces[cutOutPieces.length - 1] : null));
    if (!targetItem) {
      setCuttingToast({
        message: 'Please select an excised cut fabric piece to save.',
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 3000);
      return;
    }

    const newFabricEntry = {
      id: `cut_fab_${Date.now()}`,
      title: targetItem.name || 'Cut-Out Fabric Piece',
      name: targetItem.name || 'Cut-Out Fabric Piece',
      category: 'Excised Fabric Piece',
      fabricName: targetItem.fabricName || fabricConfig.name,
      fabricPresetId: targetItem.fabricPresetId || fabricConfig.presetId,
      customImageUrl: targetItem.customImageUrl || fabricConfig.customImageUrl,
      svgPath: targetItem.svgPath,
      contourColor: targetItem.contourColor || '#38bdf8',
      isUnfolded: Boolean(targetItem.isUnfolded),
      widthInches: Math.round((targetItem.isUnfolded ? targetItem.width * 2 : targetItem.width) / fabricConfig.scalePxPerInch),
      heightInches: Math.round(targetItem.height / fabricConfig.scalePxPerInch),
      width: targetItem.width,
      height: targetItem.height,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
    };

    setSavedCutFabrics((prev) => {
      const updated = [newFabricEntry, ...prev.filter((p) => p.id !== newFabricEntry.id)];
      try {
        localStorage.setItem('tailorix_ready_made_cut_fabrics', JSON.stringify(updated));
        // Also ensure ready-made outlines repository has it listed
        const existingOutlines = JSON.parse(localStorage.getItem('tailorix_ready_made_outlines') || '[]');
        localStorage.setItem('tailorix_ready_made_outlines', JSON.stringify([newFabricEntry, ...existingOutlines]));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    setCuttingToast({
      message: `✓ Saved excised fabric "${newFabricEntry.name}" to Ready-Made Outlines!`,
      action: {
        label: 'Open Ready-Made Outlines',
        onClick: () => {
          setReadyMadeActiveTab('cut_fabrics');
          setShowReadyMadeDrawer(true);
        },
      },
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 4500);
  }, [selectedCutPieceId, cutOutPieces, fabricConfig]);

  // User-Prompted Manual Save to Project Gallery (Only Cut Sheets are saved to Project Gallery per user requirement)
  const handleManualSaveToGallery = useCallback((item) => {
    // If target is an excised fabric piece, route to Ready-Made Outlines!
    const targetCutPiece = (item && item.fabricName) || (selectedCutPieceId ? cutOutPieces.find((c) => c.id === selectedCutPieceId) : null);
    if (targetCutPiece) {
      handleSaveCutFabricToReadyMadeOutlines(targetCutPiece);
      return;
    }

    // Only cut-out sheets are saved to the project gallery!
    const targetSheet = (item && (item.isSheet || item.sheetId)) || (cuttingSheets.length > 0 ? cuttingSheets[0] : null);
    if (targetSheet) {
      try {
        const existingProjects = JSON.parse(
          localStorage.getItem('tailorix_saved_projects') || '[]'
        );
        const newEntry = {
          id: `saved_sheet_${Date.now()}`,
          title: targetSheet.name || 'Drafted Cutting Sheet',
          name: targetSheet.name || 'Drafted Cutting Sheet',
          category: 'Cut Sheet',
          svgPath: targetSheet.svgPath || '',
          widthInches: Math.round(targetSheet.width / 14),
          heightInches: Math.round(targetSheet.height / 14),
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          tags: ['Cutting Sheet', 'Saved from Table'],
        };
        localStorage.setItem('tailorix_saved_projects', JSON.stringify([newEntry, ...existingProjects]));
        setCuttingToast({
          message: `✓ Saved cut sheet "${newEntry.title}" to Project Gallery!`,
          timestamp: Date.now(),
        });
        setTimeout(() => setCuttingToast(null), 3000);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    setCuttingToast({
      message: 'Notice: Cut-out fabrics are saved to Ready-Made Outlines. Only cut sheets are saved to Project Gallery.',
      timestamp: Date.now(),
    });
    setTimeout(() => setCuttingToast(null), 3500);
  }, [selectedCutPieceId, cutOutPieces, cuttingSheets, handleSaveCutFabricToReadyMadeOutlines]);

  // -------------------------------------------------------------------------
  // 16. Freehand Writing & Table Mouse Handlers (Rule 2)
  // Mirroring pattern drafting board freehand capabilities
  // Allows writing freely on table, rack, fabric, or sheets!
  // Fixed ink color: Black on white sheets, white on table/fabric.
  // -------------------------------------------------------------------------
  const isPointOverWhiteSheet = (x, y) => {
    return cuttingSheets.some((sheet) => {
      const effW = sheet.isMirrored ? sheet.width * 2 : sheet.width;
      return x >= sheet.x && x <= sheet.x + effW && y >= sheet.y && y <= sheet.y + sheet.height;
    });
  };

  const handleTableMouseDown = (e) => {
    // Tape Measure mode on Cutting Table
    if (activeTool === 'tape_measure') {
      const coords = getTableWorldCoords(e.clientX, e.clientY);
      triggerTableTapeTimer();
      if (!tableTapeMeasure.start || (tableTapeMeasure.start && !tableTapeMeasure.active)) {
        setTableTapeMeasure({ start: coords, end: coords, active: true });
      } else if (tableTapeMeasure.start && tableTapeMeasure.active) {
        setTableTapeMeasure({ start: tableTapeMeasure.start, end: coords, active: false });
      }
      return;
    }

    // Panning table with middle click or space key
    if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
      setIsTablePanning(true);
      tablePanStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startPanX: tablePanOffset.x,
        startPanY: tablePanOffset.y,
      };
      return;
    }

    // Eyedropper mode sampling
    if (isEyedropperActive) {
      const coords = getTableWorldCoords(e.clientX, e.clientY);
      const patternUnderCursor = tracedPatterns.find((p) => {
        const effW = p.isUnfolded ? p.width * 2 : p.width;
        return coords.x >= p.x && coords.x <= p.x + effW && coords.y >= p.y && coords.y <= p.y + p.height;
      });

      if (patternUnderCursor) {
        const color = patternUnderCursor.contourColor || '#38bdf8';
        setTargetCutColor(color);
        setSelectedCutColor(color);
        setCuttingToast({
          message: `🎯 Eyedropper sampled color: ${color} from ${patternUnderCursor.name}`,
          timestamp: Date.now(),
        });
        setTimeout(() => setCuttingToast(null), 2500);
      }
      setIsEyedropperActive(false);
      return;
    }

    if (activeTool === 'pen') {
      const coords = getTableWorldCoords(e.clientX, e.clientY);

      // Smart ink determination: black on white sheets, white on table/fabric
      let inkColor = '#ffffff';
      if (penInkMode === 'black') {
        inkColor = '#0f172a';
      } else if (penInkMode === 'white') {
        inkColor = '#ffffff';
      } else {
        inkColor = isPointOverWhiteSheet(coords.x, coords.y) ? '#0f172a' : '#ffffff';
      }

      // Zoom-calibrated stroke size
      const calibratedSize = Math.max(1.5, Math.round((2.4 / Math.max(0.4, tableZoom)) * 10) / 10);

      setCurrentPenStroke({
        id: `pen_stroke_${Date.now()}`,
        tool: 'pen',
        color: inkColor,
        size: calibratedSize,
        points: [{ x: coords.x, y: coords.y }],
        label: `Pen Note ${handwritingStrokes.length + 1}`,
        visible: true,
      });
    }
  };

  // Start dragging the fabric bolt anywhere within the stationary table
  // (Strict rule: Fabric only moves when Move toggle is ON in the header and fabric is unlocked)
  const handleStartDragFabric = useCallback((clientX, clientY) => {
    const isMoveActive = activeTool === 'move' || isFabricMoveEnabled;
    if (!isMoveActive) {
      setCuttingToast({
        message: 'Fabric is stationary. Turn on the "Move Objects" toggle in the header to allow moving fabric.',
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 2500);
      return;
    }
    if (fabricConfig.locked) {
      setCuttingToast({
        message: 'Fabric is locked. Unlock it in the inspector to move or rotate.',
        timestamp: Date.now(),
      });
      setTimeout(() => setCuttingToast(null), 2500);
      return;
    }
    setIsDraggingFabric(true);
    fabricDragStartRef.current = {
      clientX,
      clientY,
      startX: fabricConfig.x,
      startY: fabricConfig.y,
    };
  }, [activeTool, isFabricMoveEnabled, fabricConfig.x, fabricConfig.y, fabricConfig.locked]);

  // Free Rotation handler for Fabric
  const handleStartRotateFabric = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (fabricConfig.locked) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const fabricEl = document.getElementById('cutting-table-fabric-bolt');
    if (!fabricEl) return;
    const rect = fabricEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    fabricRotateRef.current = {
      centerX,
      centerY,
      startAngle,
      initialRotation: fabricConfig.rotation || 0,
    };
    setIsRotatingFabric(true);
  }, [fabricConfig.locked, fabricConfig.rotation]);

  // Free Rotation handler for Cutting Sheet
  const handleStartRotateSheet = useCallback((e, sheet) => {
    e.stopPropagation();
    e.preventDefault();
    if (sheet.locked) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const sheetEl = document.getElementById(`cutting-table-sheet-${sheet.id}`);
    if (!sheetEl) return;
    const rect = sheetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    sheetRotateRef.current = {
      centerX,
      centerY,
      startAngle,
      initialRotation: sheet.rotation || 0,
    };
    setRotatingSheetId(sheet.id);
  }, []);

  // Free Rotation handler for Pattern
  const handleStartRotatePattern = useCallback((e, pat) => {
    e.stopPropagation();
    e.preventDefault();
    if (pat.locked) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (!tableBenchRef.current) return;
    const benchRect = tableBenchRef.current.getBoundingClientRect();
    const effW = pat.isUnfolded ? pat.width * 2 : pat.width;
    const centerX = benchRect.left + (pat.x + effW / 2) * tableZoom;
    const centerY = benchRect.top + (pat.y + pat.height / 2) * tableZoom;

    const startAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    patternRotateRef.current = {
      centerX,
      centerY,
      startAngle,
      initialRotation: pat.rotation || 0,
    };
    setRotatingPatternId(pat.id);
  }, [tableZoom]);

  // Dragging Cutting Sheets on Green Rack (Allowed when Move mode is active)
  useEffect(() => {
    if (!draggingSheetId) return;

    const handleWindowSheetMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = (clientX - sheetDragRef.current.startX) / tableZoom;
      const dy = (clientY - sheetDragRef.current.startY) / tableZoom;

      const nextX = Math.max(
        TABLE_PADDING_X,
        Math.min(TABLE_WIDTH - TABLE_PADDING_X - 100, Math.round(sheetDragRef.current.initialX + dx))
      );
      const nextY = Math.max(
        TABLE_PADDING_Y_TOP,
        Math.min(TABLE_HEIGHT - TABLE_PADDING_Y_BOTTOM - 100, Math.round(sheetDragRef.current.initialY + dy))
      );

      onUpdateCuttingSheet?.(draggingSheetId, { x: nextX, y: nextY });
    };

    const handleWindowSheetUp = () => {
      setDraggingSheetId(null);
      pushState('Move Cutting Sheet');
    };

    window.addEventListener('mousemove', handleWindowSheetMove);
    window.addEventListener('mouseup', handleWindowSheetUp);
    window.addEventListener('touchmove', handleWindowSheetMove, { passive: false });
    window.addEventListener('touchend', handleWindowSheetUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowSheetMove);
      window.removeEventListener('mouseup', handleWindowSheetUp);
      window.removeEventListener('touchmove', handleWindowSheetMove);
      window.removeEventListener('touchend', handleWindowSheetUp);
    };
  }, [draggingSheetId, tableZoom, onUpdateCuttingSheet, pushState, TABLE_PADDING_X, TABLE_PADDING_Y_TOP, TABLE_WIDTH, TABLE_HEIGHT]);

  // Continuous Free Rotation of Cutting Sheet
  useEffect(() => {
    if (!rotatingSheetId) return;

    const handleWindowRotateMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const { centerX, centerY, startAngle, initialRotation } = sheetRotateRef.current;
      const currentAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
      const delta = currentAngle - startAngle;
      let newRotation = Math.round((initialRotation + delta) % 360);
      if (newRotation < 0) newRotation += 360;

      onUpdateCuttingSheet?.(rotatingSheetId, { rotation: newRotation });
    };

    const handleWindowRotateUp = () => {
      setRotatingSheetId(null);
      pushState('Rotate Cutting Sheet');
    };

    window.addEventListener('mousemove', handleWindowRotateMove);
    window.addEventListener('mouseup', handleWindowRotateUp);
    window.addEventListener('touchmove', handleWindowRotateMove, { passive: false });
    window.addEventListener('touchend', handleWindowRotateUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowRotateMove);
      window.removeEventListener('mouseup', handleWindowRotateUp);
      window.removeEventListener('touchmove', handleWindowRotateMove);
      window.removeEventListener('touchend', handleWindowRotateUp);
    };
  }, [rotatingSheetId, onUpdateCuttingSheet, pushState]);

  // Continuous Free Rotation of Fabric Bolt
  useEffect(() => {
    if (!isRotatingFabric) return;

    const handleFabricRotateMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const { centerX, centerY, startAngle, initialRotation } = fabricRotateRef.current;
      const currentAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
      const delta = currentAngle - startAngle;
      let newRotation = Math.round((initialRotation + delta) % 360);
      if (newRotation < 0) newRotation += 360;

      setFabricConfig((prev) => ({ ...prev, rotation: newRotation }));
    };

    const handleFabricRotateUp = () => {
      setIsRotatingFabric(false);
      pushState('Rotate Fabric');
    };

    window.addEventListener('mousemove', handleFabricRotateMove);
    window.addEventListener('mouseup', handleFabricRotateUp);
    window.addEventListener('touchmove', handleFabricRotateMove, { passive: false });
    window.addEventListener('touchend', handleFabricRotateUp);

    return () => {
      window.removeEventListener('mousemove', handleFabricRotateMove);
      window.removeEventListener('mouseup', handleFabricRotateUp);
      window.removeEventListener('touchmove', handleFabricRotateMove);
      window.removeEventListener('touchend', handleFabricRotateUp);
    };
  }, [isRotatingFabric, pushState]);

  // Continuous Free Rotation of Traced Pattern
  useEffect(() => {
    if (!rotatingPatternId) return;

    const handlePatternRotateMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const { centerX, centerY, startAngle, initialRotation } = patternRotateRef.current;
      const currentAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
      const delta = currentAngle - startAngle;
      let newRotation = Math.round((initialRotation + delta) % 360);
      if (newRotation < 0) newRotation += 360;

      setTracedPatterns((prev) =>
        prev.map((p) => (p.id === rotatingPatternId ? { ...p, rotation: newRotation } : p))
      );
    };

    const handlePatternRotateUp = () => {
      setRotatingPatternId(null);
      pushState('Rotate Pattern');
    };

    window.addEventListener('mousemove', handlePatternRotateMove);
    window.addEventListener('mouseup', handlePatternRotateUp);
    window.addEventListener('touchmove', handlePatternRotateMove, { passive: false });
    window.addEventListener('touchend', handlePatternRotateUp);

    return () => {
      window.removeEventListener('mousemove', handlePatternRotateMove);
      window.removeEventListener('mouseup', handlePatternRotateUp);
      window.removeEventListener('touchmove', handlePatternRotateMove);
      window.removeEventListener('touchend', handlePatternRotateUp);
    };
  }, [rotatingPatternId, pushState]);

  // Dragging Pattern Layer (Unified Window Listener)
  useEffect(() => {
    if (!isDraggingPattern || !selectedPatternId) return;

    const handleWindowPatternMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = (clientX - patternDragRef.current.x) / tableZoom;
      const dy = (clientY - patternDragRef.current.y) / tableZoom;

      setTracedPatterns((prev) =>
        prev.map((p) => {
          if (p.id !== selectedPatternId || p.locked) return p;
          const effW = p.isUnfolded ? p.width * 2 : p.width;
          const minX = TABLE_PADDING_X;
          const maxX = TABLE_WIDTH - TABLE_PADDING_X - effW;
          const minY = TABLE_PADDING_Y_TOP;
          const maxY = TABLE_HEIGHT - TABLE_PADDING_Y_BOTTOM - p.height;

          const clampedX = Math.max(minX, Math.min(maxX, Math.round(patternDragRef.current.initialX + dx)));
          const clampedY = Math.max(minY, Math.min(maxY, Math.round(patternDragRef.current.initialY + dy)));

          return { ...p, x: clampedX, y: clampedY };
        })
      );
    };

    const handleWindowPatternUp = () => {
      setIsDraggingPattern(false);
      pushState('Move Pattern');
    };

    window.addEventListener('mousemove', handleWindowPatternMove);
    window.addEventListener('mouseup', handleWindowPatternUp);
    window.addEventListener('touchmove', handleWindowPatternMove, { passive: false });
    window.addEventListener('touchend', handleWindowPatternUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowPatternMove);
      window.removeEventListener('mouseup', handleWindowPatternUp);
      window.removeEventListener('touchmove', handleWindowPatternMove);
      window.removeEventListener('touchend', handleWindowPatternUp);
    };
  }, [isDraggingPattern, selectedPatternId, tableZoom, pushState, TABLE_PADDING_X, TABLE_PADDING_Y_TOP, TABLE_WIDTH, TABLE_HEIGHT]);

  useEffect(() => {
    if (!isDraggingFabric) return;

    const handleWindowMouseMove = (e) => {
      const dx = (e.clientX - fabricDragStartRef.current.clientX) / tableZoom;
      const dy = (e.clientY - fabricDragStartRef.current.clientY) / tableZoom;

      const fPixelW = fabricConfig.widthInches * fabricConfig.scalePxPerInch;
      const fPixelH = fabricConfig.lengthInches * fabricConfig.scalePxPerInch;

      const minX = TABLE_PADDING_X;
      const maxX = Math.max(minX + 50, TABLE_WIDTH - TABLE_PADDING_X - fPixelW);
      const minY = TABLE_PADDING_Y_TOP;
      const maxY = Math.max(minY + 50, TABLE_HEIGHT - TABLE_PADDING_Y_BOTTOM - fPixelH);

      const nextX = Math.max(minX, Math.min(maxX, fabricDragStartRef.current.startX + dx));
      const nextY = Math.max(minY, Math.min(maxY, fabricDragStartRef.current.startY + dy));

      setFabricConfig((prev) => ({
        ...prev,
        x: Math.round(nextX),
        y: Math.round(nextY),
      }));
    };

    const handleWindowMouseUp = () => {
      setIsDraggingFabric(false);
      pushState('Move Fabric');
    };

    const handleWindowTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        handleWindowMouseMove(e.touches[0]);
      }
    };

    const handleWindowTouchEnd = () => {
      setIsDraggingFabric(false);
      pushState('Move Fabric');
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove);
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isDraggingFabric, tableZoom, fabricConfig.widthInches, fabricConfig.lengthInches, fabricConfig.scalePxPerInch, TABLE_WIDTH, TABLE_HEIGHT, TABLE_PADDING_X, TABLE_PADDING_Y_TOP, TABLE_PADDING_Y_BOTTOM]);

  const handleTableMouseMove = (e) => {
    // Panning table with mouse (middle click or space+left click)
    if (isTablePanning) {
      const minZ = getMinZoom();
      if (tableZoom > minZ + 0.005) {
        const dx = e.clientX - tablePanStartRef.current.clientX;
        const dy = e.clientY - tablePanStartRef.current.clientY;
        setTablePanOffset({
          x: Math.round(tablePanStartRef.current.startPanX + dx),
          y: Math.round(tablePanStartRef.current.startPanY + dy),
        });
      }
      return;
    }

    const coords = getTableWorldCoords(e.clientX, e.clientY);

    // Freehand pen drawing
    if (currentPenStroke) {
      setCurrentPenStroke((prev) => ({
        ...prev,
        points: [...prev.points, { x: coords.x, y: coords.y }],
      }));
      return;
    }

    // Dragging Pattern Layer (Strictly Constrained to Table Limits - Rule 4)
    if (isDraggingPattern && selectedPatternId) {
      const dx = (e.clientX - patternDragRef.current.x) / tableZoom;
      const dy = (e.clientY - patternDragRef.current.y) / tableZoom;

      setTracedPatterns((prev) =>
        prev.map((p) => {
          if (p.id !== selectedPatternId) return p;
          const effW = p.isUnfolded ? p.width * 2 : p.width;
          const minX = TABLE_PADDING_X;
          const maxX = TABLE_WIDTH - TABLE_PADDING_X - effW;
          const minY = TABLE_PADDING_Y_TOP;
          const maxY = TABLE_HEIGHT - TABLE_PADDING_Y_BOTTOM - p.height;

          const clampedX = Math.max(minX, Math.min(maxX, patternDragRef.current.initialX + dx));
          const clampedY = Math.max(minY, Math.min(maxY, patternDragRef.current.initialY + dy));

          return { ...p, x: clampedX, y: clampedY };
        })
      );
      return;
    }

    // Resizing Pattern Layer (Constrained to Table Limits - Rule 4)
    if (isResizingPattern && selectedPatternId) {
      const dx = (e.clientX - resizeRef.current.startX) / tableZoom;
      const dy = (e.clientY - resizeRef.current.startY) / tableZoom;

      setTracedPatterns((prev) =>
        prev.map((p) => {
          if (p.id !== selectedPatternId) return p;
          const maxAllowedW = p.isUnfolded
            ? (TABLE_WIDTH - TABLE_PADDING_X - p.x) / 2
            : TABLE_WIDTH - TABLE_PADDING_X - p.x;
          const maxAllowedH = TABLE_HEIGHT - TABLE_PADDING_Y_BOTTOM - p.y;

          const newW = Math.max(90, Math.min(maxAllowedW, resizeRef.current.initialW + dx));
          const newH = Math.max(120, Math.min(maxAllowedH, resizeRef.current.initialH + dy));

          return { ...p, width: Math.round(newW), height: Math.round(newH) };
        })
      );
      return;
    }

    // Dragging Cut Piece
    if (isDraggingCutPiece && selectedCutPieceId) {
      const dx = (e.clientX - cutPieceDragRef.current.x) / tableZoom;
      const dy = (e.clientY - cutPieceDragRef.current.y) / tableZoom;

      setCutOutPieces((prev) =>
        prev.map((p) =>
          p.id === selectedCutPieceId
            ? {
                ...p,
                x: Math.max(TABLE_PADDING_X, Math.min(TABLE_WIDTH - TABLE_PADDING_X - p.width, cutPieceDragRef.current.initialX + dx)),
                y: Math.max(TABLE_PADDING_Y_TOP, Math.min(TABLE_HEIGHT - TABLE_PADDING_Y_BOTTOM - p.height, cutPieceDragRef.current.initialY + dy)),
              }
            : p
        )
      );
    }
  };

  const handleTableMouseUp = () => {
    setIsTablePanning(false);
    setIsDraggingFabric(false);
    setIsDraggingPattern(false);
    setIsResizingPattern(false);
    setIsDraggingCutPiece(false);

    if (currentPenStroke) {
      pushState('Pen Handwriting Note');
      setHandwritingStrokes((prev) => [...prev, currentPenStroke]);
      setCurrentPenStroke(null);
    }
  };

  // Stylus/Finger Pen Event Handlers (Pinch zoom & pan are handled by dedicated container listener)
  const handleTableTouchStart = (e) => {
    if (e.touches && e.touches.length >= 2) {
      if (currentPenStroke) {
        setCurrentPenStroke(null);
      }
      return;
    }

    if (e.touches && e.touches.length === 1 && activeTool === 'pen') {
      const touch = e.touches[0];
      const coords = getTableWorldCoords(touch.clientX, touch.clientY);

      let inkColor = '#ffffff';
      if (penInkMode === 'black') {
        inkColor = '#0f172a';
      } else if (penInkMode === 'white') {
        inkColor = '#ffffff';
      } else {
        inkColor = isPointOverWhiteSheet(coords.x, coords.y) ? '#0f172a' : '#ffffff';
      }

      const calibratedSize = Math.max(1.5, Math.round((2.4 / Math.max(0.4, tableZoom)) * 10) / 10);

      setCurrentPenStroke({
        id: `pen_stroke_${Date.now()}`,
        tool: 'pen',
        color: inkColor,
        size: calibratedSize,
        points: [{ x: coords.x, y: coords.y }],
        label: `Pen Note ${handwritingStrokes.length + 1}`,
        visible: true,
      });
    }
  };

  const handleTableTouchMove = (e) => {
    if (e.touches && e.touches.length >= 2) return;

    if (e.touches && e.touches.length === 1 && currentPenStroke) {
      const touch = e.touches[0];
      const coords = getTableWorldCoords(touch.clientX, touch.clientY);

      setCurrentPenStroke((prev) => ({
        ...prev,
        points: [...prev.points, { x: coords.x, y: coords.y }],
      }));
    }
  };

  const handleTableTouchEnd = () => {
    if (currentPenStroke) {
      pushState('Pen Handwriting Note');
      setHandwritingStrokes((prev) => [...prev, currentPenStroke]);
      setCurrentPenStroke(null);
    }
  };

  // Convert points array to SVG path
  const pointsToPath = (pts) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const activePreset = FLAT_FABRIC_PRESETS.find((f) => f.id === fabricConfig.presetId) || FLAT_FABRIC_PRESETS[0];
  const fabricPixelW = fabricConfig.widthInches * fabricConfig.scalePxPerInch;
  const fabricPixelH = fabricConfig.lengthInches * fabricConfig.scalePxPerInch;
  const activeSelectedPattern = tracedPatterns.find((p) => p.id === selectedPatternId);

  // Available solid colors for scissors cutting
  const availableSolidColors = useMemo(() => {
    if (!activeSelectedPattern) return ['#38bdf8', '#f59e0b', '#ffffff', '#10b981'];
    const analysis = analyzeLayerStrokes(activeSelectedPattern);
    return analysis.detectedSolidColors.length > 0
      ? analysis.detectedSolidColors
      : [activeSelectedPattern.contourColor || '#38bdf8'];
  }, [activeSelectedPattern, analyzeLayerStrokes]);

  // Expose imperative controls to parent workspace header
  useImperativeHandle(ref, () => ({
    handleUndo,
    handleRedo,
    toggleLayers: () => setShowLayerSection((prev) => !prev),
    toggleMoveMode,
    toggleFabricVisibility,
    importSheet: (sheetId) => handleImportSheetToTable(sheetId),
    importLayer: (layer) => handleTraceBodiceOntoFabric(layer),
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
    showLayerSection,
    isMoveEnabled: activeTool === 'move' || isFabricMoveEnabled,
    isFabricVisible: fabricConfig.visible,
    applyTableZoom,
    centerAndFitTable,
    tableZoom,
    handleAdjustFabricWidth,
    handleAdjustFabricLength,
    shiftFabricOnTable,
    handleSelectPresetFabric,
    fabricConfig,
    setFabricConfig,
    FLAT_FABRIC_PRESETS,
    handleUploadCustomFabric,
    handleManualSaveToGallery,
    availableSolidColors,
    targetCutColor,
    setTargetCutColor,
    handleExecuteCutOut,
    penInkMode,
    setPenInkMode,
    activeTool,
    setActiveTool,
    showFabricAdjuster,
    setShowFabricAdjuster,
  }), [
    handleUndo,
    handleRedo,
    toggleMoveMode,
    toggleFabricVisibility,
    handleImportSheetToTable,
    handleTraceBodiceOntoFabric,
    history.length,
    redoStack.length,
    showLayerSection,
    activeTool,
    isFabricMoveEnabled,
    fabricConfig,
    applyTableZoom,
    centerAndFitTable,
    tableZoom,
    shiftFabricOnTable,
    availableSolidColors,
    targetCutColor,
    handleExecuteCutOut,
    penInkMode,
    showFabricAdjuster,
  ]);

  return (
    <div className="w-full h-full bg-[#080a0f] text-slate-100 flex flex-col relative overflow-hidden select-none font-sans">
      {/* ======================================================================= */}
      {/* 1. TOP CUTTING TABLE MASTER CONTROL BAR (Desktop only, mobile controlled via Workspace Header) */}
      {/* ======================================================================= */}
      <div className="hidden md:flex h-12 bg-[#10131a] border-b border-slate-800/90 px-3 sm:px-4 items-center justify-between z-30 shrink-0">
        {/* Left: Icon Badge (Global Undo/Redo/Layers are in top workspace header) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold" title="Cutting Table Active">
              <Scissors className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline">Cutting Table</span>
          </div>
        </div>

        {/* Center: Scissors, Pen, Move, and Measure Tools */}
        <div className="flex items-center gap-1 bg-[#090b10] p-1 rounded-xl border border-slate-800 shadow-inner">
          {/* Scissors Tool */}
          <button
            onClick={() => handleToolSelect('scissors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTool === 'scissors'
                ? 'bg-amber-500 text-slate-950 shadow-gold-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={activeTool === 'scissors' ? 'Click to unselect Scissors' : 'Scissors: Precision pattern excision and cut sheet cutting'}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Scissors</span>
          </button>

          {/* Pen Tool (Handwriting Notes) */}
          <button
            onClick={() => handleToolSelect('pen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTool === 'pen'
                ? 'bg-amber-500 text-slate-950 shadow-gold-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={activeTool === 'pen' ? 'Click to unselect Pen' : 'Pen: Freehand writing notes'}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Pen</span>
          </button>

          {/* Tape Measure Tool */}
          <button
            onClick={() => handleToolSelect('tape_measure')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTool === 'tape_measure'
                ? 'bg-amber-500 text-slate-950 shadow-gold-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={activeTool === 'tape_measure' ? 'Click to unselect Tape Measure' : 'Tape Measure: Measure distances on fabric and cutting table (10s auto-dismiss or click to clear)'}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Measure</span>
          </button>

          {/* Movable Tool (Toggle button: ONLY when active can fabric be moved) */}
          <button
            onClick={() => handleToolSelect('move')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTool === 'move'
                ? 'bg-amber-500 text-slate-950 shadow-gold-sm ring-1 ring-amber-300'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={
              activeTool === 'move'
                ? 'Move toggle is ON: Fabric and parts can be moved. Click to turn off.'
                : 'Move toggle is OFF: Turn on to allow moving fabric and sheets on the table'
            }
          >
            <Move className="w-3.5 h-3.5" />
            <span>Move</span>
            {activeTool === 'move' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Manual Save to Gallery Button & View Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Manual Save to Gallery at will */}
          <button
            onClick={() => handleManualSaveToGallery()}
            className="px-2.5 py-1.5 rounded-xl bg-[#181b24] hover:bg-[#222632] border border-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
            title="Save selected piece or project to Project Gallery at will"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Save</span>
          </button>

          {/* Return to Drafting Board */}
          {onNavigateToDrafting && (
            <button
              onClick={onNavigateToDrafting}
              className="px-2 py-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 text-xs font-medium flex items-center gap-1 transition-all shrink-0"
              title="Return to Pattern Drafting Board"
            >
              <span className="hidden lg:inline">Drafting</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. SUB-TOOLBAR: Fabric Management, Zoom & Scissors Color Selection (Desktop) */}
      {/* ======================================================================= */}
      <div className="hidden md:flex min-h-10 py-1 bg-[#13161f] border-b border-slate-800/70 px-3 sm:px-4 items-center justify-between gap-3 text-xs z-20 shrink-0 overflow-x-auto select-none no-scrollbar">
        {/* Left: Fabric Upload & Expand Yardage/Width (Rule 5) */}
        <div className="flex items-center gap-2">
          {/* Upload Flat Fabric */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold flex items-center gap-1.5 transition-all"
            title="Upload custom flat fabric image (JPG/PNG/WebP)"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Upload Fabric</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleUploadCustomFabric(e.target.files?.[0])}
          />

          {/* Fabric Preset Selector */}
          <div className="flex items-center gap-1 bg-[#0d1016] border border-slate-800 px-2 py-0.5 rounded-lg">
            <Palette className="w-3 h-3 text-slate-400" />
            <select
              value={fabricConfig.presetId}
              onChange={(e) => {
                const p = FLAT_FABRIC_PRESETS.find((fp) => fp.id === e.target.value);
                if (p) handleSelectPresetFabric(p);
              }}
              className="bg-transparent text-slate-200 text-[11px] font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              {FLAT_FABRIC_PRESETS.map((fp) => (
                <option key={fp.id} value={fp.id} className="bg-slate-900 text-slate-200">
                  {fp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hide / Show Fabric Toggle (Per User: fabric can be made hidden so user can cut sheets on the green rack) */}
          <button
            onClick={() => {
              setFabricConfig((prev) => {
                const nextVis = !prev.visible;
                setCuttingToast({
                  message: nextVis
                    ? 'Fabric overlayer is now visible.'
                    : 'Fabric overlayer hidden. You can now cut sheets directly on the green rack.',
                  timestamp: Date.now(),
                });
                setTimeout(() => setCuttingToast(null), 3000);
                return { ...prev, visible: nextVis };
              });
            }}
            className={`px-2.5 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all ${
              fabricConfig.visible
                ? 'bg-[#0d1016] hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
            }`}
            title={fabricConfig.visible ? 'Hide fabric overlayer to cut sheets on the green rack' : 'Show fabric overlayer'}
          >
            {fabricConfig.visible ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{fabricConfig.visible ? 'Hide Fabric' : 'Show Fabric'}</span>
          </button>

          {/* Shift Fabric on Table button with Move icon (Hold to drag freely on table) */}
          <button
            onClick={() => {
              if (activeTool !== 'move') {
                setActiveTool('move');
                setCuttingToast({
                  message: 'Move tool ON: Click and drag fabric or parts to freely shift them on the table.',
                  timestamp: Date.now(),
                });
                setTimeout(() => setCuttingToast(null), 3000);
              } else {
                setActiveTool('select');
                setCuttingToast({
                  message: 'Move tool OFF: Fabric is now stationary.',
                  timestamp: Date.now(),
                });
                setTimeout(() => setCuttingToast(null), 2000);
              }
            }}
            onMouseDown={(e) => {
              setActiveTool('move');
              handleStartDragFabric(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              setActiveTool('move');
              if (e.touches && e.touches[0]) {
                handleStartDragFabric(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            className={`px-2.5 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all cursor-grab active:cursor-grabbing ${
              activeTool === 'move'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-gold-sm ring-1 ring-amber-300'
                : 'bg-[#0d1016] hover:bg-slate-800 text-amber-300 border-slate-800'
            }`}
            title="Shift fabric on table: Click to enable move or click and hold to drag fabric freely within the table"
          >
            <Move className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Shift Fabric on Table</span>
          </button>

          {/* Fabric Adjuster Tool (Replaces table extension: increases or decreases width or length of fabric) */}
          <div className="relative">
            <button
              onClick={() => setShowFabricAdjuster(!showFabricAdjuster)}
              className={`px-2.5 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all ${
                showFabricAdjuster
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-gold-sm'
                  : 'bg-[#0d1016] hover:bg-slate-800 text-amber-300 border-slate-800'
              }`}
              title="Fabric Adjuster Tool: Increase or decrease the width or length of the fabric bolt"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Fabric Adjuster</span>
              <span className="text-[10px] font-mono text-slate-400 hidden xl:inline">
                ({fabricConfig.widthInches}" × {(fabricConfig.lengthInches / 36).toFixed(1)}Yd)
              </span>
            </button>

            {/* Fabric Adjuster Popover / Inline Quick Controls */}
            {showFabricAdjuster && (
              <div className="absolute top-10 left-0 z-40 bg-[#10141e] border-2 border-amber-500/80 rounded-2xl p-3 shadow-2xl w-72 text-slate-200 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 uppercase">Fabric Adjuster</span>
                  </div>
                  <button
                    onClick={() => setShowFabricAdjuster(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Width Controls */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>Fabric Width:</span>
                    <span className="text-cyan-400 font-mono font-bold">{fabricConfig.widthInches} inches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustFabricWidth(-6)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                      title="Decrease width by 6 inches"
                    >
                      -6"
                    </button>
                    <button
                      onClick={() => handleAdjustFabricWidth(-2)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                      title="Decrease width by 2 inches"
                    >
                      -2"
                    </button>
                    <input
                      type="range"
                      min="24"
                      max="120"
                      step="2"
                      value={fabricConfig.widthInches}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFabricConfig((p) => ({ ...p, widthInches: val }));
                      }}
                      className="flex-1 accent-amber-500 cursor-pointer"
                    />
                    <button
                      onClick={() => handleAdjustFabricWidth(2)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300"
                      title="Increase width by 2 inches"
                    >
                      +2"
                    </button>
                    <button
                      onClick={() => handleAdjustFabricWidth(6)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300"
                      title="Increase width by 6 inches"
                    >
                      +6"
                    </button>
                  </div>
                </div>

                {/* Length Controls */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-300">
                    <span>Fabric Length:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {(fabricConfig.lengthInches / 36).toFixed(1)} Yds ({fabricConfig.lengthInches}")
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdjustFabricLength(-36)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                      title="Subtract 1 Yard"
                    >
                      -1 Yd
                    </button>
                    <button
                      onClick={() => handleAdjustFabricLength(-18)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                      title="Subtract 0.5 Yard"
                    >
                      -½ Yd
                    </button>
                    <input
                      type="range"
                      min="36"
                      max="360"
                      step="18"
                      value={fabricConfig.lengthInches}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFabricConfig((p) => ({ ...p, lengthInches: val }));
                      }}
                      className="flex-1 accent-amber-500 cursor-pointer"
                    />
                    <button
                      onClick={() => handleAdjustFabricLength(18)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300"
                      title="Add 0.5 Yard"
                    >
                      +½ Yd
                    </button>
                    <button
                      onClick={() => handleAdjustFabricLength(36)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300"
                      title="Add 1 Yard"
                    >
                      +1 Yd
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shift Fabric on Table Motion Controls (Requirement 7) */}
          <div className="flex items-center gap-1 bg-[#0d1016] border border-slate-800 px-1.5 py-0.5 rounded-lg text-slate-300">
            <span className="text-[10px] uppercase font-bold text-amber-400 mr-1 hidden xl:inline">Shift:</span>
            <button
              onClick={() => shiftFabricOnTable('left', 20)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono"
              title="Shift Fabric Left (20px)"
            >
              ◀
            </button>
            <button
              onClick={() => shiftFabricOnTable('up', 20)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono"
              title="Shift Fabric Up (20px)"
            >
              ▲
            </button>
            <button
              onClick={() => shiftFabricOnTable('down', 20)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono"
              title="Shift Fabric Down (20px)"
            >
              ▼
            </button>
            <button
              onClick={() => shiftFabricOnTable('right', 20)}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono"
              title="Shift Fabric Right (20px)"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Center: Object Editing Panel (Mirror Tool Relocated) & Scissors Color Selection */}
        <div className="flex items-center gap-2">
          {/* Object Editing Panel for Selected Pattern */}
          {activeSelectedPattern && (
            <div className="flex items-center gap-1.5 bg-[#0c0f16] border border-cyan-500/40 px-2 py-0.5 rounded-xl text-xs shadow-md animate-in fade-in">
              <span className="text-cyan-300 font-bold max-w-[100px] truncate text-[11px]">
                {activeSelectedPattern.name}
              </span>

              {/* Copy Pattern to Fabric Button (User requirement) */}
              <button
                onClick={() => handleCopyPatternToFabric(activeSelectedPattern)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                title="Copy imported layer sketch pattern lines onto fabric before cutting"
              >
                <Copy className="w-3 h-3 text-amber-400" />
                <span>Copy to Fabric</span>
              </button>

              {/* Toggle Layer Visibility (User requirement) */}
              <button
                onClick={() => {
                  setTracedPatterns((prev) =>
                    prev.map((p) => (p.id === activeSelectedPattern.id ? { ...p, visible: !p.visible } : p))
                  );
                }}
                className="px-1.5 py-0.5 rounded-lg text-[11px] font-bold border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1"
                title="Make layer invisible / visible"
              >
                {activeSelectedPattern.visible !== false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{activeSelectedPattern.visible !== false ? 'Hide Layer' : 'Show Layer'}</span>
              </button>

              {/* Relocated Mirror Tool Button */}
              <button
                onClick={() => handleToggleUnfoldPattern(activeSelectedPattern.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1 ${
                  activeSelectedPattern.isUnfolded
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                }`}
                title="Mirror Tool: Flip layer horizontally / unfold complete bilateral bodice"
              >
                <FlipHorizontal className="w-3 h-3" />
                <span>{activeSelectedPattern.isUnfolded ? 'Fold Bodice' : 'Mirror'}</span>
              </button>
            </div>
          )}

          {/* Scissors Color Selection & Line Detection Bar (Requirement 6) */}
          {activeTool === 'scissors' && (
            <div className="flex items-center gap-2 bg-[#0c0f16] border border-amber-500/50 px-2.5 py-0.5 rounded-xl text-xs shadow-lg animate-in fade-in">
              <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                <Scissors className="w-3 h-3" />
                <span>Cut Color:</span>
              </span>

              {/* Automatic Detection Swatches */}
              <div className="flex items-center gap-1">
                {availableSolidColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedCutColor(color);
                      setTargetCutColor(color);
                    }}
                    style={{ backgroundColor: color }}
                    className={`w-3.5 h-3.5 rounded-full border transition-all ${
                      (selectedCutColor === color || targetCutColor === color)
                        ? 'ring-2 ring-amber-400 scale-125 border-white shadow'
                        : 'border-slate-600 opacity-75 hover:opacity-100'
                    }`}
                    title={`Select detected solid line color ${color}`}
                  />
                ))}
              </div>

              {/* Action Cut Button */}
              {activeSelectedPattern && (
                <button
                  onClick={() => handleExecuteCutOut(activeSelectedPattern)}
                  className="ml-1 px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-gold-sm transition-all"
                >
                  <Scissors className="w-3 h-3" />
                  <span>Cut Bodice</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Pen Ink Indicator & Freehand Zooming Controls (Rule 1 & 3) */}
        <div className="flex items-center gap-2">
          {/* Pen Ink Mode (Fixed ink: white or black ink on white sheets) */}
          {activeTool === 'pen' && (
            <div className="flex items-center gap-1 bg-[#090c12] border border-slate-800 px-2 py-0.5 rounded-lg text-[10px] text-slate-300">
              <span className="text-slate-400 font-medium">Ink:</span>
              <button
                onClick={() => setPenInkMode('auto')}
                className={`px-1.5 py-0.2 rounded font-bold ${
                  penInkMode === 'auto' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
                title="Auto ink: Black on white sheets, white on fabric"
              >
                Auto
              </button>
              <button
                onClick={() => setPenInkMode('black')}
                className={`px-1.5 py-0.2 rounded font-bold ${
                  penInkMode === 'black' ? 'bg-slate-950 text-white border border-slate-600' : 'text-slate-400'
                }`}
                title="Force Black ink"
              >
                Black
              </button>
              <button
                onClick={() => setPenInkMode('white')}
                className={`px-1.5 py-0.2 rounded font-bold ${
                  penInkMode === 'white' ? 'bg-white text-slate-950' : 'text-slate-400'
                }`}
                title="Force White ink"
              >
                White
              </button>
            </div>
          )}

          {/* Freehand Zoom in/out buttons & Fit (Enforces MIN_ZOOM clamp & auto pan reset at baseline) */}
          <div className="flex items-center gap-1 bg-[#090b10] border border-slate-800 px-1 py-0.5 rounded-lg">
            <button
              onClick={() => applyTableZoom((z) => z - 0.1)}
              disabled={tableZoom <= getMinZoom() + 0.005}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom Out (Clamped to Baseline)"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] text-slate-300 w-9 text-center">
              {Math.round(tableZoom * 100)}%
            </span>
            <button
              onClick={() => applyTableZoom((z) => z + 0.1)}
              disabled={tableZoom >= 2.5}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={centerAndFitTable}
              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 hover:text-white font-medium ml-1"
              title="Center & Fit Table in Viewport"
            >
              Center Table
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Fabric Adjuster (Positioned directly under header, between header and rack) */}
      {showFabricAdjuster && (
        <div className="md:hidden relative z-30 w-full max-h-[38vh] overflow-y-auto bg-[#10141e] border-b border-amber-500/80 p-3 text-slate-200 space-y-3 shrink-0">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Fabric Adjuster</span>
            </div>
            <button
              onClick={() => setShowFabricAdjuster(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Width Controls */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span>Fabric Width:</span>
              <span className="text-cyan-400 font-mono font-bold">{fabricConfig.widthInches} inches</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAdjustFabricWidth(-6)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                -6"
              </button>
              <button
                onClick={() => handleAdjustFabricWidth(-2)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                -2"
              </button>
              <input
                type="range"
                min="24"
                max="120"
                step="2"
                value={fabricConfig.widthInches}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFabricConfig((p) => ({ ...p, widthInches: val }));
                }}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <button
                onClick={() => handleAdjustFabricWidth(2)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300"
              >
                +2"
              </button>
              <button
                onClick={() => handleAdjustFabricWidth(6)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300"
              >
                +6"
              </button>
            </div>
          </div>

          {/* Length Controls */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span>Fabric Length:</span>
              <span className="text-amber-400 font-mono font-bold">
                {fabricConfig.lengthInches} in ({(fabricConfig.lengthInches / 36).toFixed(1)} Yd)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAdjustFabricLength(-36)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                -1 Yd
              </button>
              <button
                onClick={() => handleAdjustFabricLength(-18)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                -½ Yd
              </button>
              <input
                type="range"
                min="36"
                max="360"
                step="6"
                value={fabricConfig.lengthInches}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFabricConfig((p) => ({ ...p, lengthInches: val }));
                }}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <button
                onClick={() => handleAdjustFabricLength(18)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300"
              >
                +½ Yd
              </button>
              <button
                onClick={() => handleAdjustFabricLength(36)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300"
              >
                +1 Yd
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 3. MAIN WORKSPACE: INDUSTRIAL CUTTING TABLE (True Full-Screen Canvas)   */}
      {/* ======================================================================= */}
      <div
        ref={containerRef}
        className={`flex-1 w-full h-full relative overflow-hidden bg-[#07090e] flex items-center justify-center p-0 ${
          activeTool === 'pen' ? 'cursor-crosshair' : 'cursor-default'
        }`}
        onMouseDown={handleTableMouseDown}
        onMouseMove={handleTableMouseMove}
        onMouseUp={handleTableMouseUp}
        onTouchStart={handleTableTouchStart}
        onTouchMove={handleTableTouchMove}
        onTouchEnd={handleTableTouchEnd}
      >
        {/* Stationary Centered Cutting Table Space */}
        <div
          ref={tableBenchRef}
          className="relative transition-transform duration-75 ease-out flex-shrink-0"
          style={{
            transform: `translate(${tablePanOffset.x}px, ${tablePanOffset.y}px) scale(${tableZoom})`,
            transformOrigin: 'center center',
            width: `${effectiveRackSize.width}px`,
            height: `${effectiveRackSize.height}px`,
          }}
        >
          {/* Physical Cutting Table Bench */}
          <div
            className="w-full h-full rounded-2xl border-8 border-[#3d2b1c] shadow-[0_30px_70px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col"
            style={{
              backgroundColor: '#182921', // Classic self-healing green atelier cutting mat
              backgroundImage: (tableZoom <= 0.5 || availableWidth < 768) ? `
                linear-gradient(to right, rgba(255,255,255,0.038) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.038) 1px, transparent 1px),
                linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)
              ` : `
                linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px),
                linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
            }}
          >
            {/* Table Measurement Rulers */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-[#21352b] border-b border-white/20 flex items-center justify-between px-4 text-[10px] font-mono text-emerald-200/70 select-none pointer-events-none">
              <span>0" (0cm)</span>
              <span>20" (50cm)</span>
              <span>40" (100cm)</span>
              <span>60" (150cm)</span>
              <span>80" (200cm)</span>
              <span>100" (254cm)</span>
              <span>120" (305cm)</span>
              <span>140" (355cm)</span>
              <span>160" (406cm)</span>
              <span>180" (457cm)</span>
              <span className="font-bold text-amber-300">MASTER ATELIER CUTTING MAT — 8FT WORKBENCH</span>
            </div>

            <div className="absolute top-6 bottom-0 left-0 w-6 bg-[#21352b] border-r border-white/20 flex flex-col justify-between py-3 text-[10px] font-mono text-emerald-200/70 select-none pointer-events-none items-center">
              <span>0"</span>
              <span>12"</span>
              <span>24"</span>
              <span>36"</span>
              <span>48"</span>
              <span>60"</span>
            </div>

            {/* Dispersion Rack at Table Head (Compact, centered, elegant atelier dispenser) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-lg h-10 bg-gradient-to-b from-[#252b34] via-[#1a1d22] to-[#0f1115] rounded-xl border border-slate-700/80 shadow-lg flex items-center justify-between px-3.5 z-10 select-none">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-[9px] font-bold text-amber-400">
                  ⊚
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-100 block leading-tight">
                    Fabric Dispenser Rack
                  </span>
                  <span className="text-[9px] text-amber-400/90 font-mono">
                    {fabricConfig.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                <span className="bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700 text-[10px]">
                  {(fabricConfig.lengthInches / 36).toFixed(1)} Yds ({fabricConfig.lengthInches}") × {fabricConfig.widthInches}"
                </span>
                <button
                  onClick={() => handleExpandFabric(0, 36)}
                  className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] transition-all flex items-center gap-1 shadow-gold-sm"
                  title="Feed additional 1 Yard of fabric onto cutting table"
                >
                  <Plus className="w-3 h-3" />
                  <span>Feed +1 Yd</span>
                </button>
              </div>
            </div>

            {/* 1. Green Rack Status Banner (Shown when Fabric Overlayer is Hidden) */}
            {!fabricConfig.visible && (
              <div className="absolute top-16 left-8 z-10 bg-emerald-950/90 backdrop-blur-md px-4 py-2 rounded-xl border-2 border-emerald-500/80 text-emerald-200 flex items-center gap-3 text-xs shadow-xl select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-amber-300">Green Rack Table Active</span>
                <span className="text-[11px] text-slate-200 font-mono">
                  • Fabric Overlayer Hidden • You can cut sheets directly on the green rack
                </span>
                <button
                  onClick={() => setFabricConfig((p) => ({ ...p, visible: true }))}
                  className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] ml-2 transition-transform active:scale-95"
                >
                  Show Fabric
                </button>
              </div>
            )}

            {/* 2. Paper Cutting Sheets on the Green Rack (Only imported sheets are shown) */}
            {cuttingSheets
              .filter((sheet) => (importedSheetIds || []).includes(sheet.id))
              .map((sheet) => {
                const isSelected = selectedCuttingSheetId === sheet.id;
                const effW = sheet.isMirrored ? sheet.width * 2 : sheet.width;
                const sheetLayer = layers.find(
                  (l) => l.sheetId === sheet.id || l.id === sheet.layerId || l.id === `layer_sheet_${sheet.id}`
                );

                return (
                  <div
                    key={sheet.id}
                    id={`cutting-table-sheet-${sheet.id}`}
                    className={`absolute rounded-xl border-2 transition-shadow select-none ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-2xl z-20'
                        : 'border-slate-400/80 shadow-lg z-10'
                    } ${activeTool === 'move' ? 'cursor-move' : activeTool === 'scissors' ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      left: `${sheet.x ?? 80}px`,
                      top: `${sheet.y ?? 120}px`,
                      width: `${effW}px`,
                      height: `${sheet.height}px`,
                      backgroundColor: sheet.color || '#ffffff',
                      opacity: sheet.opacity || 0.95,
                      transform: `rotate(${sheet.rotation || 0}deg)`,
                      transformOrigin: 'center center',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCuttingSheetId(sheet.id);
                      if (activeTool === 'scissors') {
                        handleCutSheet(sheet);
                      }
                    }}
                    onMouseDown={(e) => {
                      if (activeTool === 'move' || isFabricMoveEnabled) {
                        if (sheet.locked) return;
                        e.stopPropagation();
                        setSelectedCuttingSheetId(sheet.id);
                        setDraggingSheetId(sheet.id);
                        sheetDragRef.current = {
                          startX: e.clientX,
                          startY: e.clientY,
                          initialX: sheet.x ?? 80,
                          initialY: sheet.y ?? 120,
                        };
                      }
                    }}
                    onTouchStart={(e) => {
                      if (activeTool === 'move' || isFabricMoveEnabled) {
                        if (sheet.locked) return;
                        if (e.touches && e.touches[0]) {
                          e.stopPropagation();
                          setSelectedCuttingSheetId(sheet.id);
                          setDraggingSheetId(sheet.id);
                          sheetDragRef.current = {
                            startX: e.touches[0].clientX,
                            startY: e.touches[0].clientY,
                            initialX: sheet.x ?? 80,
                            initialY: sheet.y ?? 120,
                          };
                        }
                      }
                    }}
                  >
                    {/* Rotation Handle for Cutting Sheet (When Move Tool Active) */}
                    {isSelected && (activeTool === 'move' || isFabricMoveEnabled) && !sheet.locked && (
                      <div
                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-30 pointer-events-auto"
                        onMouseDown={(e) => handleStartRotateSheet(e, sheet)}
                        onTouchStart={(e) => handleStartRotateSheet(e, sheet)}
                        title="Drag to rotate cutting sheet"
                      >
                        <div className="w-5 h-5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center shadow-md border-2 border-white">
                          <RotateCw className="w-3 h-3 text-slate-950 font-bold" />
                        </div>
                        <div className="w-0.5 h-2 bg-sky-400" />
                      </div>
                    )}

                    {/* Grid Pattern on the sheet */}
                    <div
                      className="w-full h-full rounded-xl pointer-events-none relative overflow-hidden"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
                        `,
                        backgroundSize: '24px 24px',
                      }}
                    >
                      {/* Sheet Header Banner */}
                      <div className="p-2 bg-slate-900/85 backdrop-blur-sm border-b border-slate-700/60 text-slate-100 flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-amber-300 truncate max-w-[140px]">{sheet.name}</span>
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1 rounded">
                            Green Rack Sheet
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCutSheet(sheet);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                            title="Cut sheet on green rack and save to Project Gallery"
                          >
                            <Scissors className="w-3 h-3" />
                            <span>Cut Sheet</span>
                          </button>
                        </div>
                      </div>

                      {/* Vector Strokes from matching Layer */}
                      {sheetLayer && sheetLayer.elements && sheetLayer.elements.length > 0 && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                          {sheetLayer.elements.map((el) => {
                            if (!el.points || el.points.length === 0) return null;
                            const relPts = el.points.map((pt) => ({
                              x: pt.x - (sheet.x ?? 80),
                              y: pt.y - (sheet.y ?? 120),
                            }));
                            return (
                              <path
                                key={el.id}
                                d={pointsToPath(relPts)}
                                fill="none"
                                stroke={el.color || '#38bdf8'}
                                strokeWidth={el.size || 2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray={el.tool === 'scissors' || el.dashed ? '6 4' : 'none'}
                              />
                            );
                          })}
                        </svg>
                      )}

                      {/* Center fold line if sheet is mirrored */}
                      {sheet.isMirrored && (
                        <div className="absolute top-9 bottom-0 left-1/2 w-0 border-l border-dashed border-sky-600/80 pointer-events-none flex items-center justify-center">
                          <span className="bg-sky-900/90 text-sky-200 text-[8px] font-mono font-bold px-1 rounded -rotate-90">
                            FOLD LINE
                          </span>
                        </div>
                      )}

                      {/* Dimensions watermark */}
                      <div className="absolute bottom-2 left-3 pointer-events-none select-none text-[10px] font-mono font-bold text-slate-700/80">
                        {sheet.width}" × {sheet.height}" {sheet.isMirrored ? '(Mirrored Full View)' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Visible Flat Fabric Bolt (Expandable & Freely Shiftable on Table) */}
            {fabricConfig.visible && (
              <div
                id="cutting-table-fabric-bolt"
                className={`absolute rounded-lg border-2 border-dashed border-amber-400/60 shadow-[0_15px_35px_rgba(0,0,0,0.65)] transition-shadow duration-75 group ${
                  (activeTool === 'move' || isFabricMoveEnabled) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                }`}
                style={{
                  left: `${fabricConfig.x}px`,
                  top: `${fabricConfig.y}px`,
                  width: `${fabricPixelW}px`,
                  height: `${fabricPixelH}px`,
                  backgroundColor: activePreset.baseColor,
                  backgroundImage: fabricConfig.customImageUrl
                    ? `url(${fabricConfig.customImageUrl})`
                    : activePreset.textureCss,
                  backgroundSize: fabricConfig.customImageUrl ? 'cover' : 'auto',
                  transform: `rotate(${fabricConfig.rotation || 0}deg)`,
                  transformOrigin: 'center center',
                }}
                onMouseDown={(e) => {
                  if (activeTool !== 'move' && !isFabricMoveEnabled) {
                    // Fabric is stationary unless Move Fabric toggle is ON
                    return;
                  }
                  e.stopPropagation();
                  e.preventDefault();
                  handleStartDragFabric(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  if (activeTool !== 'move' && !isFabricMoveEnabled) {
                    // Fabric is stationary unless Move Fabric toggle is ON
                    return;
                  }
                  if (e.touches && e.touches[0]) {
                    e.stopPropagation();
                    handleStartDragFabric(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
              >
                {/* Rotation Handle for Fabric Bolt (When Move Tool Active) */}
                {(activeTool === 'move' || isFabricMoveEnabled) && !fabricConfig.locked && (
                  <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-30 pointer-events-auto"
                    onMouseDown={handleStartRotateFabric}
                    onTouchStart={handleStartRotateFabric}
                    title="Drag to rotate fabric bolt"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white">
                      <RotateCw className="w-3.5 h-3.5 text-slate-950 font-bold" />
                    </div>
                    <div className="w-0.5 h-2 bg-amber-400" />
                  </div>
                )}

                {/* Fabric Header & Grainline Watermark */}
                <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none select-none">
                  <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg border border-white/15 text-slate-100 flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-amber-300">{fabricConfig.name}</span>
                    <span className="font-mono text-[10px] text-slate-300">
                      ({fabricConfig.widthInches}" W × {(fabricConfig.lengthInches / 36).toFixed(1)} Yds L)
                    </span>
                  </div>

                  <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg border border-white/15 text-slate-300 flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-amber-400 font-bold">GRAIN:</span>
                    <span>{fabricConfig.grainLabel}</span>
                    <span className="text-emerald-400 font-bold">↕ WARP</span>
                  </div>
                </div>

                {/* Selvedge Edge Lines */}
                <div className="absolute top-0 bottom-0 left-0 w-3 bg-white/10 border-r border-dashed border-white/30 flex items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-mono text-white/50 -rotate-90 whitespace-nowrap">
                    SELVEDGE
                  </span>
                </div>
                <div className="absolute top-0 bottom-0 right-0 w-3 bg-white/10 border-l border-dashed border-white/30 flex items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-mono text-white/50 rotate-90 whitespace-nowrap">
                    SELVEDGE
                  </span>
                </div>

                {/* Copied Sketch Patterns on Fabric (Chalk Lines copied from layers before cutting) */}
                {copiedFabricPatterns.map((cp) => (
                  <div
                    key={cp.id}
                    className="absolute pointer-events-none select-none"
                    style={{
                      left: `${Math.max(0, cp.x - fabricConfig.x)}px`,
                      top: `${Math.max(0, cp.y - fabricConfig.y)}px`,
                      width: `${cp.isUnfolded ? cp.width * 2 : cp.width}px`,
                      height: `${cp.height}px`,
                    }}
                  >
                    <svg
                      viewBox={`0 0 ${cp.isUnfolded ? cp.width * 2 : cp.width} ${cp.height}`}
                      className="w-full h-full overflow-visible"
                    >
                      <path
                        d={cp.svgPath}
                        fill="rgba(255, 255, 255, 0.08)"
                        stroke={cp.contourColor || '#fcd34d'}
                        strokeWidth="2.5"
                        strokeDasharray="6 3"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {cp.isUnfolded && (
                        <g transform={`translate(${cp.width * 2}, 0) scale(-1, 1)`}>
                          <path
                            d={cp.svgPath}
                            fill="rgba(255, 255, 255, 0.08)"
                            stroke={cp.contourColor || '#fcd34d'}
                            strokeWidth="2.5"
                            strokeDasharray="6 3"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                        </g>
                      )}
                    </svg>
                    <div className="absolute -top-5 left-1 bg-black/80 backdrop-blur px-2 py-0.5 rounded border border-amber-400/60 text-[9px] font-mono text-amber-300 shadow">
                      Chalk Line: {cp.name}
                    </div>
                  </div>
                ))}

                {/* Shift Fabric Grip Handle: Click-and-hold to freely move fabric across table (Per User Request) */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleStartDragFabric(e.clientX, e.clientY);
                  }}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      e.stopPropagation();
                      handleStartDragFabric(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  className={`fabric-handle absolute bottom-3 right-4 px-3.5 py-1.5 rounded-xl border ${
                    isDraggingFabric
                      ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400 shadow-gold scale-105'
                      : (activeTool === 'move' || isFabricMoveEnabled)
                        ? 'bg-slate-950/90 hover:bg-slate-900 border-amber-400/70 text-amber-400 hover:text-amber-300'
                        : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-300'
                  } flex items-center gap-1.5 text-xs font-bold shadow-2xl cursor-grab active:cursor-grabbing pointer-events-auto transition-all select-none`}
                  title={(activeTool === 'move' || isFabricMoveEnabled) ? "Click and hold to freely shift fabric anywhere within the cutting table" : "Fabric is stationary. Turn on Move Fabric in the header to enable movement"}
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Shift Fabric on Table</span>
                </button>
              </div>
            )}

            {/* SVG OVERLAY: Traced Patterns, Excised Bodices & Freehand Writing */}
            <svg className="w-full h-full absolute inset-0 pointer-events-none z-10">
              <defs>
                {/* Pattern textures for cut fabric pieces */}
                {cutOutPieces.map((piece) => (
                  <pattern
                    key={`pat_${piece.id}`}
                    id={`pattern_fill_${piece.id}`}
                    patternUnits="userSpaceOnUse"
                    width={fabricPixelW}
                    height={fabricPixelH}
                    x={fabricConfig.x}
                    y={fabricConfig.y}
                  >
                    <rect width={fabricPixelW} height={fabricPixelH} fill={activePreset.baseColor} />
                    {fabricConfig.customImageUrl && (
                      <image
                        href={fabricConfig.customImageUrl}
                        width={fabricPixelW}
                        height={fabricPixelH}
                        preserveAspectRatio="none"
                      />
                    )}
                  </pattern>
                ))}
              </defs>

              {/* Freehand Handwriting Notes on Table, Rack, Fabric or Sheets (Rule 2) */}
              {handwritingStrokes
                .filter((st) => st.visible !== false)
                .map((st) => (
                  <path
                    key={st.id}
                    d={pointsToPath(st.points)}
                    fill="none"
                    stroke={st.color}
                    strokeWidth={st.size}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.92}
                  />
                ))}

              {/* Current In-Progress Pen Stroke */}
              {currentPenStroke && (
                <path
                  d={pointsToPath(currentPenStroke.points)}
                  fill="none"
                  stroke={currentPenStroke.color}
                  strokeWidth={currentPenStroke.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.95}
                />
              )}

              {/* ------------------------------------------------------------- */}
              {/* TRACED BODICE PATTERNS (Folded or Unfolded Mirror View)       */}
              {/* ------------------------------------------------------------- */}
              {tracedPatterns
                .filter((pat) => pat.visible !== false)
                .map((pat) => {
                  const isSelected = selectedPatternId === pat.id;
                  const isCutting = cuttingAnimPieceId === pat.id;
                  const effW = pat.isUnfolded ? pat.width * 2 : pat.width;
                  const isMovableActive = activeTool === 'move' || tapHoldPatternId === pat.id;

                  return (
                    <g
                      key={pat.id}
                      transform={`translate(${pat.x}, ${pat.y}) rotate(${pat.rotation || 0}, ${effW / 2}, ${pat.height / 2})`}
                      className="pointer-events-auto cursor-grab active:cursor-grabbing"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPatternId(pat.id);
                        if (activeTool === 'scissors') {
                          handleExecuteCutOut(pat);
                        }
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setSelectedPatternId(pat.id);
                        patternDragRef.current = {
                          x: e.clientX,
                          y: e.clientY,
                          initialX: pat.x,
                          initialY: pat.y,
                        };

                        if (activeTool === 'move' || isFabricMoveEnabled) {
                          if (!pat.locked) {
                            setIsDraggingPattern(true);
                            setTapHoldPatternId(pat.id);
                          }
                        }
                      }}
                      onPointerUp={() => {
                        setIsDraggingPattern(false);
                        setTapHoldPatternId(null);
                      }}
                    >
                      {/* Rotation Handle for Pattern (When Move Tool Active) */}
                      {isSelected && (activeTool === 'move' || isFabricMoveEnabled) && !pat.locked && (
                        <g className="cursor-grab active:cursor-grabbing pointer-events-auto">
                          <line
                            x1={effW / 2}
                            y1={0}
                            x2={effW / 2}
                            y2={-20}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={effW / 2}
                            cy={-20}
                            r={7}
                            fill="#0284c7"
                            stroke="#ffffff"
                            strokeWidth="2"
                            onPointerDown={(e) => handleStartRotatePattern(e, pat)}
                            title="Drag to rotate pattern"
                          />
                        </g>
                      )}
                      {/* Negative area if already cut out */}
                      {pat.isCutOut && (
                        <g>
                          <path
                            d={pat.svgPath}
                            fill="#090c12"
                            fillOpacity={0.88}
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                          />
                          {pat.isUnfolded && (
                            <g transform={`translate(${pat.width * 2}, 0) scale(-1, 1)`}>
                              <path
                                d={pat.svgPath}
                                fill="#090c12"
                                fillOpacity={0.88}
                                stroke="#f59e0b"
                                strokeWidth="2"
                                strokeDasharray="6 4"
                              />
                            </g>
                          )}
                        </g>
                      )}

                      {/* Uncut Traced Bodice Pattern Outline */}
                      {!pat.isCutOut && (
                        <>
                          {/* Primary Half Bodice */}
                          <path
                            d={pat.svgPath}
                            fill={isSelected ? '#38bdf8' : '#ffffff'}
                            fillOpacity={isSelected ? 0.24 : 0.12}
                            stroke={pat.contourColor || '#facc15'}
                            strokeWidth={isSelected ? 2.8 : 2}
                            strokeLinejoin="round"
                            className={isCutting ? 'animate-pulse' : ''}
                          />

                          {/* Secondary Mirrored Half Bodice when Unfolded (Rule 6) */}
                          {pat.isUnfolded && (
                            <g transform={`translate(${pat.width * 2}, 0) scale(-1, 1)`}>
                              <path
                                d={pat.svgPath}
                                fill={isSelected ? '#38bdf8' : '#ffffff'}
                                fillOpacity={isSelected ? 0.24 : 0.12}
                                stroke={pat.contourColor || '#facc15'}
                                strokeWidth={isSelected ? 2.8 : 2}
                                strokeLinejoin="round"
                                className={isCutting ? 'animate-pulse' : ''}
                              />
                            </g>
                          )}

                          {/* Center Fold / Mirror Line if Unfolded */}
                          {pat.isUnfolded && (
                            <g>
                              <line
                                x1={pat.width}
                                y1={0}
                                x2={pat.width}
                                y2={pat.height}
                                stroke="#38bdf8"
                                strokeWidth="1.75"
                                strokeDasharray="6 4"
                              />
                              <text
                                x={pat.width + 6}
                                y={20}
                                fill="#38bdf8"
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                CENTER FOLD / MIRROR AXIS
                              </text>
                            </g>
                          )}

                          {/* Broken Seam Allowance Lines (Protected from Cut - Rule 7) */}
                          {pat.strokes
                            ?.filter((st) => isBrokenLineStroke(st))
                            .map((st, idx) => (
                              <path
                                key={`broken_${idx}`}
                                d={pointsToPath(st.points)}
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="1.5"
                                strokeDasharray="5 3"
                                opacity={0.75}
                              />
                            ))}

                          {/* Interactive Solid Contour Lines (Clickable to pick color for scissors - Rule 7) */}
                          {pat.strokes
                            ?.filter((st) => !isBrokenLineStroke(st))
                            .map((st, idx) => (
                              <path
                                key={`solid_${idx}`}
                                d={pointsToPath(st.points)}
                                fill="none"
                                stroke={st.color || pat.contourColor}
                                strokeWidth="3"
                                className="cursor-pointer hover:stroke-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (st.color) setSelectedCutColor(st.color);
                                }}
                              />
                            ))}

                          {/* Interactive Header Badge with Fold/Unfold Toggle */}
                          <g transform="translate(10, 10)">
                            <rect
                              x="0"
                              y="0"
                              width={Math.min(effW - 20, 230)}
                              height="44"
                              rx="6"
                              fill="#0d121c"
                              fillOpacity="0.92"
                              stroke={isSelected ? '#facc15' : '#38bdf8'}
                              strokeWidth="1.4"
                            />
                            <text x="10" y="18" fill="#ffffff" fontSize="11" fontWeight="bold">
                              {pat.name}
                            </text>
                            <text x="10" y="32" fill="#38bdf8" fontSize="9" fontFamily="monospace">
                              {pat.isUnfolded ? '🪞 Complete Unfolded View' : '📁 Folded in Half (Cut-on-Fold)'}
                            </text>

                            {/* Unfold/Fold Toggle Button inside Badge (Rule 6) */}
                            <g
                              transform={`translate(${Math.min(effW - 40, 210)}, 14)`}
                              className="cursor-pointer hover:scale-110 transition-transform"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleUnfoldPattern(pat.id);
                              }}
                            >
                              <circle cx="0" cy="0" r="10" fill={pat.isUnfolded ? '#06b6d4' : '#f59e0b'} />
                              <text x="-5" y="4" fontSize="10">
                                🪞
                              </text>
                            </g>
                          </g>

                          {/* Scissors Direct Cut Prompt Button */}
                          <g
                            transform={`translate(${effW - 25}, 25)`}
                            className="cursor-pointer hover:scale-110 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteCutOut(pat);
                            }}
                          >
                            <circle cx="0" cy="0" r="14" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                            <text x="-7" y="5" fontSize="13">
                              ✂️
                            </text>
                          </g>

                          {/* Resize Corner Handle (Constrained to Table Limits - Rule 4) */}
                          {isSelected && (
                            <g
                              transform={`translate(${effW - 12}, ${pat.height - 12})`}
                              className="cursor-se-resize pointer-events-auto"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsResizingPattern(true);
                                resizeRef.current = {
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  initialW: pat.width,
                                  initialH: pat.height,
                                };
                              }}
                            >
                              <rect x="0" y="0" width="12" height="12" rx="2" fill="#facc15" stroke="#000" strokeWidth="1" />
                            </g>
                          )}
                        </>
                      )}
                    </g>
                  );
                })}

              {/* ------------------------------------------------------------- */}
              {/* EXCISED CUT-OUT FABRIC PIECES (Folded or Full Mirrored)       */}
              {/* ------------------------------------------------------------- */}
              {cutOutPieces
                .filter((p) => p.visible !== false)
                .map((piece) => {
                  const isSelected = selectedCutPieceId === piece.id;

                  return (
                    <g
                      key={piece.id}
                      transform={`translate(${piece.x}, ${piece.y}) rotate(${piece.rotation || 0}, ${piece.width / 2}, ${piece.height / 2})`}
                      className="pointer-events-auto cursor-move group"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCutPieceId(piece.id);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedCutPieceId(piece.id);
                        if (activeTool === 'move' || isFabricMoveEnabled) {
                          if (piece.locked) return;
                          setIsDraggingCutPiece(true);
                          cutPieceDragRef.current = {
                            x: e.clientX,
                            y: e.clientY,
                            initialX: piece.x,
                            initialY: piece.y,
                          };
                        }
                      }}
                    >
                      {/* Primary Cut Piece */}
                      <path
                        d={piece.svgPath}
                        fill={`url(#pattern_fill_${piece.id})`}
                        stroke={isSelected ? '#facc15' : '#ffffff'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        strokeLinejoin="round"
                      />

                      {/* Mirrored Second Half if Full Bodice Cut */}
                      {piece.isUnfolded && (
                        <g transform={`translate(${piece.width * 2}, 0) scale(-1, 1)`}>
                          <path
                            d={piece.svgPath}
                            fill={`url(#pattern_fill_${piece.id})`}
                            stroke={isSelected ? '#facc15' : '#ffffff'}
                            strokeWidth={isSelected ? 3 : 1.5}
                            strokeLinejoin="round"
                          />
                        </g>
                      )}

                      {/* Floating Info Badge */}
                      <rect
                        x="15"
                        y="15"
                        width="190"
                        height="44"
                        rx="6"
                        fill="#0c111a"
                        fillOpacity="0.9"
                        stroke="#10b981"
                        strokeWidth="1.2"
                      />
                      <text x="24" y="31" fill="#10b981" fontSize="10" fontWeight="bold">
                        ✓ EXCISED FABRIC PIECE
                      </text>
                      <text x="24" y="46" fill="#ffffff" fontSize="10" fontWeight="bold">
                        {piece.name}
                      </text>
                    </g>
                  );
                })}

              {/* Tape Measure Overlay on Cutting Table without instructional text */}
              {tableTapeMeasure.start && (
                <g id="table-tape-measure-overlay">
                  <circle
                    cx={tableTapeMeasure.start.x}
                    cy={tableTapeMeasure.start.y}
                    r="5"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {tableTapeMeasure.end && (
                    <>
                      <line
                        x1={tableTapeMeasure.start.x}
                        y1={tableTapeMeasure.start.y}
                        x2={tableTapeMeasure.end.x}
                        y2={tableTapeMeasure.end.y}
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                      />
                      <circle
                        cx={tableTapeMeasure.end.x}
                        cy={tableTapeMeasure.end.y}
                        r="5"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {(() => {
                        const midX = (tableTapeMeasure.start.x + tableTapeMeasure.end.x) / 2;
                        const midY = (tableTapeMeasure.start.y + tableTapeMeasure.end.y) / 2;
                        const distInches = (Math.hypot(tableTapeMeasure.end.x - tableTapeMeasure.start.x, tableTapeMeasure.end.y - tableTapeMeasure.start.y) / 20).toFixed(1);
                        const distCm = (parseFloat(distInches) * 2.54).toFixed(1);
                        return (
                          <g
                            transform={`translate(${midX}, ${midY - 14})`}
                            className="cursor-pointer"
                            onClick={() => setTableTapeMeasure({ start: null, end: null, active: false })}
                          >
                            <rect
                              x="-52"
                              y="-12"
                              width="104"
                              height="24"
                              rx="6"
                              fill="#0d1322"
                              fillOpacity="0.94"
                              stroke="#f59e0b"
                              strokeWidth="1.5"
                            />
                            <text
                              x="0"
                              y="4"
                              fill="#fbbf24"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                              fontFamily="monospace"
                            >
                              {distInches}" ({distCm}cm)
                            </text>
                          </g>
                        );
                      })()}
                    </>
                  )}
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CUTTING TOAST NOTIFICATION                                            */}
        {/* ===================================================================== */}
        {/* Interactive Toast Notifications (No 'Open Gallery' button) */}
        {cuttingToast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d1322]/95 backdrop-blur-xl border-2 border-emerald-500/80 px-5 py-3 rounded-2xl shadow-2xl text-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold block text-emerald-300">
                Cutting Table Action Complete
              </span>
              <span className="text-[11px] text-slate-300">{cuttingToast.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* 4. MODAL: INSUFFICIENT FABRIC WIDTH FOR UNFOLDING PROMPT (Rule 6)        */}
      {/* ======================================================================= */}
      {unfoldFabricPrompt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#121620] border-2 border-amber-500/60 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Insufficient Fabric Width for Complete Bodice
                </h3>
                <p className="text-xs text-slate-400">
                  Unfolding mirror view requires additional fabric bolt width
                </p>
              </div>
            </div>

            <div className="bg-[#0b0e15] p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Current Fabric Width:</span>
                <span className="font-mono text-slate-100 font-bold">{unfoldFabricPrompt.currentWidthInches}" W</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Required Width (Complete Bodice):</span>
                <span className="font-mono text-amber-400 font-bold">{unfoldFabricPrompt.requiredWidthInches}" W</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                The mirror tool operates only when the imported fabric width is sufficient. Expand the fabric width to expand the table and fit the complete bodice seamlessly.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setUnfoldFabricPrompt(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExpandAndUnfold}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-gold-sm transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Expand to {unfoldFabricPrompt.suggestedWidth}" & Unfold</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 5. FLAT LAYER SECTION DRAWER (Rule 5: Flat Layers, No Sub-Layers)       */}
      {/* ======================================================================= */}
      {showLayerSection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#11141c] border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl text-slate-100">
            <div>
              {/* Header with Undo / Redo buttons */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Cutting Table Layers</h3>
                    <p className="text-[11px] text-slate-400">
                      Flat layers: quick editing, selection, folding & cutting
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowLayerSection(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-1.5 mb-4 bg-[#090b10] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveDrawerTab('layers')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeDrawerTab === 'layers'
                      ? 'bg-amber-500 text-slate-950 shadow-gold-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Layers & Sheets</span>
                </button>
                <button
                  onClick={() => setActiveDrawerTab('tools')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeDrawerTab === 'tools'
                      ? 'bg-amber-500 text-slate-950 shadow-gold-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Cutting Tools & Fabric</span>
                </button>
              </div>

              {activeDrawerTab === 'layers' && (
                <>
                  {/* Flat Layer List (No Sub-Layers) */}
                  <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
                {/* 1. Fabric Bolt Layer */}
                <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() =>
                        setFabricConfig((prev) => ({ ...prev, visible: !prev.visible }))
                      }
                      className="text-slate-400 hover:text-white"
                    >
                      {fabricConfig.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                    </button>
                    <div>
                      <span className="font-bold text-slate-100 block">{fabricConfig.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">
                        Bolt: {fabricConfig.widthInches}" W × {(fabricConfig.lengthInches / 36).toFixed(1)} Yds L
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExpandFabric(12, 0)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded text-[10px] font-bold"
                      title="Add 12 inches width"
                    >
                      +12" W
                    </button>
                    <button
                      onClick={() => handleExpandFabric(0, 36)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded text-[10px] font-bold"
                      title="Add 1 yard length"
                    >
                      +1 Yd L
                    </button>
                  </div>
                </div>

                {/* 2. Paper Cutting Sheets on Green Rack (Only imported sheets) */}
                {cuttingSheets
                  .filter((sheet) => (importedSheetIds || []).includes(sheet.id))
                  .map((sheet) => (
                  <div
                    key={sheet.id}
                    onClick={() => setSelectedCuttingSheetId(sheet.id)}
                    className={`bg-slate-900/80 border p-3 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${
                      selectedCuttingSheetId === sheet.id
                        ? 'border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.15)] bg-slate-900'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                        📄
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 block">{sheet.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Sheet on Green Rack • {sheet.width}" × {sheet.height}" {sheet.isMirrored ? '(Mirrored)' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Move Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCuttingSheetId(sheet.id);
                          setActiveTool('move');
                          setShowLayerSection(false);
                          setCuttingToast({
                            message: `Move tool active: Drag "${sheet.name}" to position it on the green rack`,
                            timestamp: Date.now(),
                          });
                          setTimeout(() => setCuttingToast(null), 3000);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                        title="Move sheet on table"
                      >
                        <Move className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove from Table */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSheetFromTable(sheet.id);
                        }}
                        className="px-2 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-bold rounded text-[10px] border border-rose-800"
                        title="Remove sheet from table"
                      >
                        Remove
                      </button>

                      {/* Cut Sheet with Scissors */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCutSheet(sheet);
                        }}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] flex items-center gap-1 shadow"
                        title="Cut sheet on green rack"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Cut</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* 3. Bodice Pattern Layers (Flat) with Rotate, Move, and Copy to Fabric */}
                {tracedPatterns.map((pat) => (
                  <div
                    key={pat.id}
                    onClick={() => setSelectedPatternId(pat.id)}
                    className={`bg-slate-800/70 border p-3 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer ${
                      selectedPatternId === pat.id
                        ? 'border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.15)] bg-slate-800'
                        : 'border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTracedPatterns((prev) =>
                            prev.map((p) => (p.id === pat.id ? { ...p, visible: !p.visible } : p))
                          );
                        }}
                        className="text-slate-400 hover:text-white"
                        title={pat.visible !== false ? 'Make layer invisible' : 'Make layer visible'}
                      >
                        {pat.visible !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                      </button>
                      <div>
                        <span className="font-bold text-slate-100 block">{pat.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {pat.isUnfolded ? '🪞 Complete Unfolded' : '📁 Folded Half'} • {pat.isCutOut ? 'Excised' : 'Uncut'} • Color: {pat.contourColor}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Copy sketch pattern lines to fabric */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPatternToFabric(pat);
                        }}
                        className="p-1 rounded bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-sky-300"
                        title="Copy sketch pattern lines onto fabric before cutting"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Rotate Icon inside layer box */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pushState(`Rotate Layer ${pat.name}`);
                          setTracedPatterns((prev) =>
                            prev.map((p) => (p.id === pat.id ? { ...p, rotation: ((p.rotation || 0) + 15) % 360 } : p))
                          );
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                        title="Rotate bodice part (+15°)"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Icon inside layer box (activates movable tool on cutting table) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatternId(pat.id);
                          setActiveTool('move');
                          setShowLayerSection(false);
                          setCuttingToast({
                            message: `Movable tool active: Tap and hold "${pat.name}" to move it around freely on the table`,
                            timestamp: Date.now(),
                          });
                          setTimeout(() => setCuttingToast(null), 3000);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                        title="Move tool: Tap and hold to move freely on cutting table"
                      >
                        <Move className="w-3.5 h-3.5" />
                      </button>

                      {/* Unfold / Fold Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleUnfoldPattern(pat.id);
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                          pat.isUnfolded
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        title="Fold or Unfold (Mirror view)"
                      >
                        {pat.isUnfolded ? 'Fold' : 'Unfold'}
                      </button>

                      {/* Cut with Scissors */}
                      {!pat.isCutOut && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExecuteCutOut(pat);
                          }}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] shadow"
                        >
                          Cut
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pushState(`Delete Layer ${pat.name}`);
                          setTracedPatterns((prev) => prev.filter((p) => p.id !== pat.id));
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900"
                        title="Delete layer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* 3. Freehand Handwriting Layers (Flat) */}
                {handwritingStrokes.map((st, idx) => (
                  <div
                    key={st.id}
                    className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <PenTool className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-semibold text-slate-200">
                        {st.label || `Handwritten Note #${idx + 1}`}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-slate-600 inline-block"
                        style={{ backgroundColor: st.color }}
                      />
                    </div>

                    <button
                      onClick={() => {
                        pushState('Delete Handwriting Note');
                        setHandwritingStrokes((prev) => prev.filter((s) => s.id !== st.id));
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Delete stroke"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* 4. Excised Cut Pieces (Flat) */}
                {cutOutPieces.map((piece) => (
                  <div
                    key={piece.id}
                    className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <span className="font-bold text-slate-100 block">{piece.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Excised Fabric</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        pushState(`Delete Cut Piece ${piece.name}`);
                        setCutOutPieces((prev) => prev.filter((p) => p.id !== piece.id));
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Delete cut piece"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Import from Drafting Board Layers (With Rotate & Move inside each layer box) */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block mb-2">
                  Drafted Layers Available for Import:
                </span>
                {layers.length === 0 ? (
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-amber-400 font-semibold">
                    No layer detected on drafting board.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {layers.map((l) => (
                      <div
                        key={l.id}
                        className="w-full p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-200 text-xs flex items-center justify-between transition-all"
                      >
                        <div className="truncate flex-1 pr-2">
                          <span className="font-bold block truncate text-slate-100">{l.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {l.elements?.length || 0} line elements
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Rotate Icon inside layer box */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pushState(`Rotate Layer ${l.name}`);
                              l.rotation = ((l.rotation || 0) + 15) % 360;
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                            title="Rotate layer (+15°)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Icon inside layer box (Imports and sets Move tool) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTraceBodiceOntoFabric(l);
                              setActiveTool('move');
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400"
                            title="Import & activate movable tool"
                          >
                            <Move className="w-3.5 h-3.5" />
                          </button>

                          {/* Import Button */}
                          <button
                            onClick={() => handleTraceBodiceOntoFabric(l)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shadow"
                          >
                            Import
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drafted Cutting Sheets Available for Import onto Table */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-300 block mb-2">
                  Drafted Cutting Sheets Available for Import:
                </span>
                {cuttingSheets.filter((s) => !(importedSheetIds || []).includes(s.id)).length === 0 ? (
                  <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400 font-medium">
                    {cuttingSheets.length === 0
                      ? 'No cutting sheets drafted yet.'
                      : 'All drafted cutting sheets are imported to table.'}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {cuttingSheets
                      .filter((s) => !(importedSheetIds || []).includes(s.id))
                      .map((sheet) => (
                        <div
                          key={sheet.id}
                          className="w-full p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-200 text-xs flex items-center justify-between"
                        >
                          <div className="truncate flex-1 pr-2">
                            <span className="font-bold block truncate text-slate-100">{sheet.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {sheet.width}" × {sheet.height}" {sheet.isMirrored ? '(Mirrored)' : ''}
                            </span>
                          </div>
                          <button
                            onClick={() => handleImportSheetToTable(sheet.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow flex items-center gap-1"
                          >
                            <span>Import to Table</span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeDrawerTab === 'tools' && (
            <div className="space-y-4 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
              {/* 1. Fabric Selection & Visibility */}
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Fabric Bolt</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Fabric Preset:</span>
                    <div className="flex items-center gap-1 bg-[#0d1016] border border-slate-800 px-2 py-1 rounded-lg">
                      <Palette className="w-3 h-3 text-slate-400" />
                      <select
                        value={fabricConfig.presetId}
                        onChange={(e) => {
                          const p = FLAT_FABRIC_PRESETS.find((fp) => fp.id === e.target.value);
                          if (p) handleSelectPresetFabric(p);
                        }}
                        className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
                      >
                        {FLAT_FABRIC_PRESETS.map((fp) => (
                          <option key={fp.id} value={fp.id} className="bg-slate-900 text-slate-200">
                            {fp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold flex items-center justify-center gap-1.5 text-xs transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Fabric</span>
                    </button>
                    <button
                      onClick={() => setFabricConfig((p) => ({ ...p, visible: !p.visible }))}
                      className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all ${
                        fabricConfig.visible
                          ? 'bg-[#0d1016] text-slate-300 border-slate-800'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      }`}
                    >
                      {fabricConfig.visible ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{fabricConfig.visible ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Fabric Adjuster */}
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Fabric Dimensions</span>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Width:</span>
                      <span className="text-amber-400 font-mono font-bold">{fabricConfig.widthInches}"</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdjustFabricWidth(-2)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                      >
                        -2"
                      </button>
                      <input
                        type="range"
                        min="36"
                        max="72"
                        step="2"
                        value={fabricConfig.widthInches}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setFabricConfig((p) => ({ ...p, widthInches: val }));
                        }}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <button
                        onClick={() => handleAdjustFabricWidth(2)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400"
                      >
                        +2"
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Length:</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {(fabricConfig.lengthInches / 36).toFixed(1)} Yds ({fabricConfig.lengthInches}")
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdjustFabricLength(-18)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                      >
                        -½ Yd
                      </button>
                      <input
                        type="range"
                        min="36"
                        max="360"
                        step="18"
                        value={fabricConfig.lengthInches}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setFabricConfig((p) => ({ ...p, lengthInches: val }));
                        }}
                        className="flex-1 accent-amber-500 cursor-pointer"
                      />
                      <button
                        onClick={() => handleAdjustFabricLength(18)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300"
                      >
                        +½ Yd
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Shift Fabric Nudge Controls */}
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Shift Fabric Position</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => shiftFabricOnTable('left', 20)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold"
                    title="Shift Left"
                  >
                    ◀ Left
                  </button>
                  <button
                    onClick={() => shiftFabricOnTable('up', 20)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold"
                    title="Shift Up"
                  >
                    ▲ Up
                  </button>
                  <button
                    onClick={() => shiftFabricOnTable('down', 20)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold"
                    title="Shift Down"
                  >
                    ▼ Down
                  </button>
                  <button
                    onClick={() => shiftFabricOnTable('right', 20)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold"
                    title="Shift Right"
                  >
                    ▶ Right
                  </button>
                </div>
              </div>

              {/* 4. Selected Pattern Controls */}
              {activeSelectedPattern && (
                <div className="bg-slate-900/80 border border-cyan-500/40 p-3.5 rounded-2xl">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">
                    Selected: {activeSelectedPattern.name}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCopyPatternToFabric(activeSelectedPattern)}
                      className="py-1.5 px-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy to Fabric</span>
                    </button>
                    <button
                      onClick={() => handleToggleUnfoldPattern(activeSelectedPattern.id)}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        activeSelectedPattern.isUnfolded
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span>{activeSelectedPattern.isUnfolded ? 'Fold' : 'Mirror / Unfold'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 5. Scissors Cutting Color & Action */}
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Scissors Cut Color</span>
                <div className="flex items-center gap-2 mb-3">
                  {availableSolidColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedCutColor(color);
                        setTargetCutColor(color);
                      }}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        (selectedCutColor === color || targetCutColor === color)
                          ? 'ring-2 ring-amber-400 scale-110 border-white shadow'
                          : 'border-slate-600 opacity-75 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
                {activeSelectedPattern && (
                  <button
                    onClick={() => handleExecuteCutOut(activeSelectedPattern)}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-gold-sm"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Cut Selected Bodice</span>
                  </button>
                )}
              </div>

              {/* 6. Pen Ink Selection */}
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Pen Tool Ink</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPenInkMode('auto')}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      penInkMode === 'auto' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setPenInkMode('black')}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      penInkMode === 'black' ? 'bg-slate-950 text-white border border-slate-600' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Black
                  </button>
                  <button
                    onClick={() => setPenInkMode('white')}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      penInkMode === 'white' ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    White
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">All actions recorded in Undo history</span>
              <button
                onClick={() => setShowLayerSection(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 6. READY-MADE OUTLINES DRAWER                                           */}
      {/* ======================================================================= */}
      {showReadyMadeDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#11141c] border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl text-slate-100">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Ready-Made Outlines</h3>
                    <p className="text-[11px] text-slate-400">
                      Standard sloper blocks ready for cutting
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReadyMadeDrawer(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {SLOPER_BLOCK_TEMPLATES.map((block) => (
                  <div
                    key={block.id}
                    className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 p-3.5 rounded-xl transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-100">{block.name}</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {block.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">{block.description}</p>
                    <button
                      onClick={() => handleImportReadyMadeOutline(block)}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Place on Cutting Table</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <a
                href="/templates"
                className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>View Full Template Library</span>
                <ArrowRight className="w-3 h-3" />
              </a>
              <button
                onClick={() => setShowReadyMadeDrawer(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default BigCuttingTable;
