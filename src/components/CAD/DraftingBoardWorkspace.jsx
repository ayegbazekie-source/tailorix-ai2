/**
 * TAILORIX AI — UNIFIED DRAFTING BOARD WORKSPACE
 * 
 * Consolidates the Pattern Drafting Board and Cutting Table under a single unified environment.
 * Sub-Navigation Tabs:
 *  1. Pattern Drafting Board (Drafting Stage) — FIRST
 *  2. Cutting Table (Fabric & Cutting Stage) — SECOND
 * 
 * Features:
 *  - Sketchbook Tools: Tech Pen, Chalk, Marker, Dart Marker, Eraser, Scissors ✂️, Piece Move
 *  - Mirror Tool: Real-time bilateral symmetry drafting across a vertical mirror line
 *  - French Curve Overlay: Interactive draggable curved virtual ruler with armhole/neckline contour snaps
 *  - Straight Ruler Overlay: Calibrated 18" virtual ruler with angle rotation and straight seam stamping
 *  - Infrared Arrow Laser: Glowing red trajectory projection line for the Scissors ✂️ tool
 *  - Full Autodesk SketchBook Style Layer Stack: Add, delete, rename, visibility toggle, lock, reorder
 *  - Fabric Upload & Presets: Upload custom fabric images or choose luxury textile presets
 *  - Persistent "Import Drafted Bodice" Drawer: Access and drop drafted layer bodices onto the cutting table
 *  - Advanced Tailor Options Drawer integration (DXF, seam allowance, node coordinates)
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Scissors,
  PenTool,
  Edit3,
  Move,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Upload,
  Plus,
  Lock,
  Unlock,
  FlipHorizontal,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Sparkles,
  ChevronDown,
  Check,
  X,
  Target,
  Eraser,
  Info,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  RotateCcw,
  Sliders,
  Ruler,
  Palette,
  Undo2,
  Redo2,
  Copy,
  ChevronRight,
  ChevronLeft,
  Crosshair,
  Compass,
  Magnet,
  Zap,
  Square,
  GitMerge,
  MoreHorizontal,
  Minus,
  ChevronUp,
  Save,
  Shirt,
} from 'lucide-react';

import AdvancedTailorDrawer from './AdvancedTailorDrawer';
import TailorRulerOverlay from './TailorRulerOverlay';
import DraftingToolboxDrawer from './DraftingToolboxDrawer';
import CuttingSheetItem from './CuttingSheetItem';
import MagnifyingGlassLoupe from './MagnifyingGlassLoupe';
import BigCuttingTable from './BigCuttingTable';
import {
  TAILOR_RULERS_CATALOG,
  TAILOR_RULER_LIST,
  snapPointToActiveRuler,
  getRulerPrimaryEdgeWorldPoints,
  constrainChalkToRulerDirection,
  constrainDrawingToActiveRuler,
} from './TailorRulersCatalog';
import { DECONSTRUCT_BENCHMARK_SAMPLES } from '../../data/deconstructSamples';
import { generatePattern } from '../../utils/patternEngine/patternRegistry';
import { getDefaultMeasurementsForGarment } from '../../models/measurementDefinitions';
import {
  exportPatternToSVG,
  exportPatternToDXF,
  exportPatternToTiledPDF,
} from '../../utils/patternEngine/cadExportEngine';
import { calculatePieceBounds } from '../../models/patternGeometry';

// Luxury Fabric Presets for the Cutting Table
const FABRIC_PRESETS = [
  {
    id: 'silk_satin',
    name: 'Mulberry Silk Satin Charmeuse',
    category: 'Silk & Luxury',
    baseColor: '#334155',
    textureCss:
      'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.12), transparent 70%), linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    grainDirection: 'warp',
    weight: '19 Momme (82 GSM)',
  },
  {
    id: 'selvedge_denim',
    name: 'Organic Raw Selvedge Denim',
    category: 'Cotton & Twill',
    baseColor: '#1e3a8a',
    textureCss:
      'repeating-linear-gradient(45deg, #172554, #172554 2px, #1e3a8a 2px, #1e3a8a 4px)',
    grainDirection: 'warp',
    weight: '14.5 oz Right-Hand Twill',
  },
  {
    id: 'wool_tweed',
    name: 'Savile Row Wool Flannel',
    category: 'Wool & Suiting',
    baseColor: '#475569',
    textureCss:
      'repeating-linear-gradient(60deg, #334155, #334155 3px, #1e293b 3px, #1e293b 6px)',
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
    textureCss:
      'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, #064e3b, #022c22)',
    textureSize: '24px 24px',
    grainDirection: 'warp',
    weight: 'Heavy-Duty 3mm Vinyl',
  },
];

// Color Palette for Tailor's Chalk and Technical Pens
const SKETCH_PALETTE = [
  { name: 'Tailor Chalk White', hex: '#ffffff' },
  { name: 'Charcoal Lead', hex: '#0f172a' },
  { name: 'Wax Yellow', hex: '#facc15' },
  { name: 'Tailor French Blue', hex: '#38bdf8' },
  { name: 'Basting Crimson', hex: '#f43f5e' },
  { name: 'Bespoke Emerald', hex: '#10b981' },
];

export default function DraftingBoardWorkspace({ initialTab }) {
  const location = useLocation();
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // 1. Unified Sub-Navigation State: 'drafting' coming FIRST before 'cutting'
  // -------------------------------------------------------------------------
  const defaultTab = initialTab || (location.pathname === '/studio' ? 'cutting' : 'drafting');
  const [activeSubTab, setActiveSubTab] = useState(defaultTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    } else if (location.pathname === '/studio') {
      setActiveSubTab('cutting');
    } else if (location.pathname === '/cad') {
      setActiveSubTab('drafting');
    }
  }, [initialTab, location.pathname]);

  const handleSelectSubTab = (tab) => {
    setActiveSubTab(tab);
    try {
      window.history.replaceState(null, '', tab === 'cutting' ? '/studio' : '/cad');
    } catch (e) {}
  };

  // -------------------------------------------------------------------------
  // 2. Sketchbook Tools State
  // Tools: 'pen' | 'chalk' | 'marker' | 'dart_marker' | 'scissors' | 'tape_measure' | 'piece_move' | 'eraser'
  // -------------------------------------------------------------------------
  const [activeTool, setActiveTool] = useState('chalk');
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [brushOpacity, setBrushOpacity] = useState(0.85);
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  // -------------------------------------------------------------------------
  // 8-Ruler Vector Overlay & Edge Snapping Toolbox State (Autodesk Sketchbook)
  // -------------------------------------------------------------------------
  const [activeRulers, setActiveRulers] = useState([]);
  const [selectedRulerId, setSelectedRulerId] = useState(null);
  const [isToolboxDrawerOpen, setIsToolboxDrawerOpen] = useState(false);
  const [snappingEnabled, setSnappingEnabled] = useState(true);
  const [snapThreshold, setSnapThreshold] = useState(26);
  const [activeSnapPoint, setActiveSnapPoint] = useState(null);

  // -------------------------------------------------------------------------
  // Customizable Cutting Sheets for Pattern Drafting & Bodice Placement
  // -------------------------------------------------------------------------
  const [cuttingSheets, setCuttingSheets] = useState([]);
  const [selectedCuttingSheetId, setSelectedCuttingSheetId] = useState(null);
  const [sheetDrawPreview, setSheetDrawPreview] = useState(null); // { startX, startY, currentX, currentY }
  const [mobileBodiceMenuOpen, setMobileBodiceMenuOpen] = useState(false);

  // Advanced Overlay Instruments
  const [symmetryEnabled, setSymmetryEnabled] = useState(false); // Mirror Tool
  const [symmetryAxisX, setSymmetryAxisX] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return Math.round((window.innerWidth / 2 - 40) / 0.5);
    }
    return 500;
  }); // Vertical mirror line (Freely Moveable Workspace Axis)
  const [isDraggingMirrorAxis, setIsDraggingMirrorAxis] = useState(false);

  // Helper to toggle Mirror Tool and guarantee it is centered in visible viewport
  const handleToggleSymmetry = () => {
    setSymmetryEnabled((prev) => {
      const next = !prev;
      if (next && typeof window !== 'undefined') {
        const vpW = window.innerWidth;
        const currentScreenX = symmetryAxisX * zoom + panOffset.x;
        // If axis is off screen, re-center in current viewport
        if (currentScreenX < 40 || currentScreenX > vpW - 40) {
          const centeredCanvasX = Math.round((vpW / 2 - panOffset.x) / zoom);
          setSymmetryAxisX(centeredCanvasX);
        }
      }
      return next;
    });
  };

  // Steady Stroke Stabilization Configuration (Autodesk Sketchbook style)
  const STEADY_STROKE_LEVELS = {
    1: { name: 'Level 1', label: 'Subtle (12px)', radius: 12, alpha: 0.35 },
    2: { name: 'Level 2', label: 'Soft (20px)', radius: 20, alpha: 0.26 },
    3: { name: 'Level 3', label: 'Balanced (32px)', radius: 32, alpha: 0.18 },
    4: { name: 'Level 4', label: 'Strong (46px)', radius: 46, alpha: 0.12 },
    5: { name: 'Level 5', label: 'Maximum (64px)', radius: 64, alpha: 0.08 },
  };
  const [steadyStrokeEnabled, setSteadyStrokeEnabled] = useState(true);
  const [steadyStrokeLevel, setSteadyStrokeLevel] = useState(3);
  const steadyPenRef = useRef({ x: 0, y: 0 });
  const [steadyStrokeHUD, setSteadyStrokeHUD] = useState(null); // { rawX, rawY, penX, penY, radius }

  // Bold Concave Optical Magnifier Lens HUD State (for Seam Allowance, Dart Marker, and Manual Ruler Chalk)
  const [lensState, setLensState] = useState(null); 
  // { visible: boolean, x: number, y: number, screenX: number, screenY: number, tool: string, label: string, angle: number }

  // Persistent Zoom-Safe Floating Toggles Dock State
  const [showFloatingSheetToggles, setShowFloatingSheetToggles] = useState(false);
  const [showFloatingRulerToggles, setShowFloatingRulerToggles] = useState(false);

  // References for Chalk straight vector projection and 2-finger pinch zoom
  const chalkStartRef = useRef({ x: 0, y: 0 });
  const touchZoomRef = useRef(null);

  // Tape Measure Tool State (Interactive 2-point measurement)
  // Tape measure is not a layer and auto-disappears after 10 seconds of non-use
  const [tapeMeasure, setTapeMeasure] = useState({
    start: null,
    end: null,
    active: false,
    savedDist: null,
  });
  const tapeAutoHideTimerRef = useRef(null);

  // Trigger auto-hide for tape measure after 30 seconds of inactivity
  const triggerTapeAutoHideTimer = () => {
    if (tapeAutoHideTimerRef.current) {
      clearTimeout(tapeAutoHideTimerRef.current);
    }
    tapeAutoHideTimerRef.current = setTimeout(() => {
      setTapeMeasure({ start: null, end: null, active: false, savedDist: null });
    }, 30000);
  };

  // Cursor position for the Laser Guide on the Scissors tool
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPointerDown, setIsPointerDown] = useState(false);

  // -------------------------------------------------------------------------
  // 3. Dynamic Autodesk SketchBook Style Layer Management State (Blank Canvas on Startup)
  // -------------------------------------------------------------------------
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  // Board starts completely blank per user specification
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingLayerName, setEditingLayerName] = useState('');
  const [expandedSheetLayerIds, setExpandedSheetLayerIds] = useState({});
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Layer Merging & Grouping State
  const [selectedLayerIdsForMerge, setSelectedLayerIdsForMerge] = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeGroupName, setMergeGroupName] = useState('');

  // Workspace Toast Notification for immediate user feedback
  const [workspaceToast, setWorkspaceToast] = useState(null);
  const showToast = useCallback((message, type = 'info') => {
    setWorkspaceToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setWorkspaceToast((curr) => (curr && Date.now() - curr.id >= 2800 ? null : curr));
    }, 3000);
  }, []);

  // Sub-layer position auto-locking ticker (re-evaluates every second for 10s auto-lock)
  const [lockStatusTick, setLockStatusTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setLockStatusTick((t) => (t + 1) % 10000);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if a sub-layer (element) has auto-locked its position (after 10s of no movement)
  // Sub-layers can still be erased, but cannot be moved once locked
  const isElementPositionLocked = (el) => {
    if (!el) return false;
    if (el.positionLocked === true) return true;
    if (el.unlockedUntil && Date.now() < el.unlockedUntil) return false;
    const lastActivity = el.lastMovedAt || el.createdAt || 0;
    return lastActivity > 0 && Date.now() - lastActivity >= 10000;
  };

  // Tape Measure 10-second inactivity listener
  useEffect(() => {
    if (tapeMeasure.start) {
      triggerTapeAutoHideTimer();
    }
    return () => {
      if (tapeAutoHideTimerRef.current) clearTimeout(tapeAutoHideTimerRef.current);
    };
  }, [tapeMeasure.start, tapeMeasure.end, tapeMeasure.active]);

  // -------------------------------------------------------------------------
  // 4. Cutting Table State: Fabric Canvas & Drafted Pattern Overlay
  // -------------------------------------------------------------------------
  const [fabricTexture, setFabricTexture] = useState(null); // Custom image URL or data
  const [fabricPresetId, setFabricPresetId] = useState('silk_satin');
  const [fabricWidthInches, setFabricWidthInches] = useState(60);
  const [fabricLengthYards, setFabricLengthYards] = useState(3.0);
  const [showPatternOverlay, setShowPatternOverlay] = useState(false);
  const [cuttingTablePieces, setCuttingTablePieces] = useState([]); // Imported bodices placed on fabric
  const [selectedCuttingPieceId, setSelectedCuttingPieceId] = useState(null);

  // -------------------------------------------------------------------------
  // 5. Drawing & Canvas State
  // -------------------------------------------------------------------------
  const [currentStroke, setCurrentStroke] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 0.5;
    }
    return 1.0;
  });
  const [panOffset, setPanOffset] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      return { x: Math.round(w / 2 - 150), y: Math.round(h / 2 - 180) };
    }
    return { x: 40, y: 30 };
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Piece & Collective Layer Move dragging state
  const [isMovingPiece, setIsMovingPiece] = useState(false);
  const movingPieceRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, layerId: null });
  const preMoveSnapshotRef = useRef(null);
  const hasMovedRef = useRef(false);

  // Ruler/Curve dragging state
  const [isDraggingRuler, setIsDraggingRuler] = useState(false);
  const [isDraggingCurve, setIsDraggingCurve] = useState(false);
  const instrumentDragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Modals & Drawers
  const [showAdvancedDrawer, setShowAdvancedDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importedNotice, setImportedNotice] = useState(null);

  const canvasSvgRef = useRef(null);
  const containerRef = useRef(null);
  const bigCuttingTableRef = useRef(null);
  const [cuttingCanUndo, setCuttingCanUndo] = useState(false);
  const [cuttingCanRedo, setCuttingCanRedo] = useState(false);
  const [cuttingShowLayers, setCuttingShowLayers] = useState(false);
  const [isFabricMoveEnabled, setIsFabricMoveEnabled] = useState(false);
  const [isFabricVisible, setIsFabricVisible] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tailorix_session_fabric_visible');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return false; // Clean green rack by default on initial/new workspace
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('tailorix_session_fabric_visible', JSON.stringify(isFabricVisible));
    } catch {}
  }, [isFabricVisible]);

  const [mobileHeaderDrawerOpen, setMobileHeaderDrawerOpen] = useState(false);
  const [mobileZoomPopoverOpen, setMobileZoomPopoverOpen] = useState(false);
  const [cuttingTableZoom, setCuttingTableZoom] = useState(0.5);

  const handleCuttingHistoryChange = useCallback(
    ({ canUndo, canRedo, showLayers, isMoveEnabled, isFabricVisible: fVis, tableZoom }) => {
      setCuttingCanUndo((prev) => (prev !== canUndo ? canUndo : prev));
      setCuttingCanRedo((prev) => (prev !== canRedo ? canRedo : prev));
      setCuttingShowLayers((prev) => (prev !== showLayers ? showLayers : prev));
      if (isMoveEnabled !== undefined) {
        setIsFabricMoveEnabled((prev) => (prev !== isMoveEnabled ? isMoveEnabled : prev));
      }
      if (fVis !== undefined) {
        setIsFabricVisible((prev) => (prev !== fVis ? fVis : prev));
      }
      if (tableZoom !== undefined) {
        setCuttingTableZoom(tableZoom);
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // 6. Clean Blank Workspace on Load (Strict User Requirement)
  // No hardcoded or auto-imported bodice pieces. The layer section is empty
  // and stays collapsed until the user explicitly requests it or adds elements.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Keep canvas pristine and empty on initial load, unless user has active session work
    try {
      const savedLayers = sessionStorage.getItem('tailorix_session_layers');
      const savedSheets = sessionStorage.getItem('tailorix_session_sheets');
      if (savedLayers) {
        const parsed = JSON.parse(savedLayers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayers(parsed);
          setActiveLayerId(parsed[0]?.id || null);
        }
      }
      if (savedSheets) {
        const parsedSheets = JSON.parse(savedSheets);
        if (Array.isArray(parsedSheets) && parsedSheets.length > 0) {
          setCuttingSheets(parsedSheets);
          setSelectedCuttingSheetId(parsedSheets[0]?.id || null);
        }
      }
    } catch (e) {
      console.warn('Session sync fallback', e);
    }
    setActiveRulers([]);
    setSelectedRulerId(null);
    setShowLayerPanel(false);
  }, []);

  // Save session work on state update
  useEffect(() => {
    if (layers && layers.length > 0) {
      try {
        sessionStorage.setItem('tailorix_session_layers', JSON.stringify(layers));
      } catch (e) {}
    }
  }, [layers]);

  useEffect(() => {
    if (cuttingSheets && cuttingSheets.length > 0) {
      try {
        sessionStorage.setItem('tailorix_session_sheets', JSON.stringify(cuttingSheets));
      } catch (e) {}
    }
  }, [cuttingSheets]);


  const handleManualImportPhotoPattern = () => {
    try {
      let payload = location.state?.importedPayload;
      if (!payload) {
        const stored = localStorage.getItem('tailorix_studio_payload');
        if (stored) payload = JSON.parse(stored);
      }
      if (payload && payload.patternPieces && payload.patternPieces.length > 0) {
        const newLayers = payload.patternPieces.map((p, idx) => ({
          id: `layer-${p.id || idx + 1}`,
          name: p.name || `Pattern Piece ${idx + 1}`,
          bodiceType: p.name,
          visible: true,
          locked: false,
          opacity: 1.0,
          elements: [],
          piece: p,
          offsetX: p.x ?? 80 + (idx % 3) * 320,
          offsetY: p.y ?? 60 + Math.floor(idx / 3) * 360,
          rotation: p.rotation || 0,
        }));
        setLayers(newLayers);
        setActiveLayerId(newLayers[0]?.id || 'layer-1');
        setShowLayerPanel(true);
        setImportedNotice(`Imported ${payload.patternPieces.length} pattern pieces from Photo to Pattern!`);
      }
    } catch (e) {
      console.warn('Manual import error:', e);
    }
  };

  // -------------------------------------------------------------------------
  // 7. Autodesk SketchBook Layer Actions & Dynamic Creation
  // -------------------------------------------------------------------------
  const addLayer = (presetType = null) => {
    const layerCount = layers.length + 1;
    const name = presetType || `Layer ${layerCount}`;
    const newLayer = {
      id: `layer-${Date.now()}`,
      name,
      bodiceType: presetType || 'Custom Layer',
      visible: true,
      locked: false,
      opacity: 1.0,
      elements: [],
      piece: null,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    return newLayer;
  };

  // Coordinate transformations between Canonical Canvas Space and Sheet-Local Space
  const canonicalToSheetLocal = (pt, sheet) => {
    if (!pt || !sheet) return { localX: 0, localY: 0, isInside: false };
    const effW = sheet.isMirrored ? sheet.width * 2 : sheet.width;
    const rot = sheet.rotation || 0;
    const cx = sheet.x + effW / 2;
    const cy = sheet.y + sheet.height / 2;

    let x = pt.x;
    let y = pt.y;

    if (rot !== 0) {
      const rad = (-rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = x - cx;
      const dy = y - cy;
      x = cx + dx * cos - dy * sin;
      y = cy + dx * sin + dy * cos;
    }

    const localX = x - sheet.x;
    const localY = y - sheet.y;
    const isInside = localX >= 0 && localX <= effW && localY >= 0 && localY <= sheet.height;

    return { localX, localY, isInside };
  };

  const sheetLocalToCanonical = (localPt, sheet) => {
    if (!localPt || !sheet) return { x: 0, y: 0 };
    const effW = sheet.isMirrored ? sheet.width * 2 : sheet.width;
    const rot = sheet.rotation || 0;
    const cx = sheet.x + effW / 2;
    const cy = sheet.y + sheet.height / 2;

    let x = sheet.x + localPt.x;
    let y = sheet.y + localPt.y;

    if (rot !== 0) {
      const rad = (rot * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = x - cx;
      const dy = y - cy;
      x = cx + dx * cos - dy * sin;
      y = cy + dx * sin + dy * cos;
    }

    return { x, y };
  };

  // Helper to ensure an active writable layer exists before drawing
  // If pointer is inside a Cut Sheet -> bind that stroke to the Cut Sheet as owner
  // If pointer is outside Cut Sheets (on root canvas) -> bind that stroke to Root Canvas
  const ensureActiveLayer = (pointerCoords = null) => {
    // 1. If pointer coordinates provided, hit-test against cutting sheets in real canvas space
    if (pointerCoords) {
      const hitSheet = [...cuttingSheets].reverse().find((s) => {
        if (s.visible === false) return false;
        return canonicalToSheetLocal(pointerCoords, s).isInside;
      });

      if (hitSheet) {
        if (selectedCuttingSheetId !== hitSheet.id) setSelectedCuttingSheetId(hitSheet.id);
        let sheetLayer = layers.find(
          (l) => l.sheetId === hitSheet.id || l.id === hitSheet.layerId || l.id === `layer_sheet_${hitSheet.id}`
        );
        if (!sheetLayer) {
          sheetLayer = {
            id: hitSheet.layerId || `layer_sheet_${hitSheet.id}`,
            sheetId: hitSheet.id,
            name: `Sheet: ${hitSheet.name || 'Cutting Sheet'}`,
            bodiceType: 'Cutting Sheet Markings',
            visible: hitSheet.visible !== false,
            locked: Boolean(hitSheet.locked),
            opacity: 1.0,
            elements: [],
            piece: null,
            offsetX: 0,
            offsetY: 0,
            rotation: 0,
          };
          setLayers((prev) => [...prev, sheetLayer]);
        } else if (sheetLayer.locked !== Boolean(hitSheet.locked)) {
          sheetLayer.locked = Boolean(hitSheet.locked);
        }
        if (activeLayerId !== sheetLayer.id) setActiveLayerId(sheetLayer.id);
        return { ...sheetLayer, parentSheet: hitSheet, parentSheetId: hitSheet.id };
      }

      // Pointer started outside all cut sheets -> BIND DIRECTLY TO ROOT CANVAS LAYER!
      let rootLayer = layers.find((l) => l.id === activeLayerId && !l.sheetId && !l.id?.startsWith('layer_sheet_'));
      if (!rootLayer) {
        rootLayer = layers.find((l) => !l.sheetId && !l.id?.startsWith('layer_sheet_'));
      }
      if (!rootLayer) {
        rootLayer = {
          id: `layer-${Date.now()}`,
          name: 'Layer 1 (Canvas Root)',
          bodiceType: 'Custom Layer',
          visible: true,
          locked: false,
          opacity: 1.0,
          elements: [],
          piece: null,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        };
        setLayers((prev) => [...prev, rootLayer]);
      }
      if (activeLayerId !== rootLayer.id) setActiveLayerId(rootLayer.id);
      return { ...rootLayer, parentSheet: null, parentSheetId: null };
    }

    // 2. Fallback when no coordinates passed
    let current = layers.find((l) => l.id === activeLayerId);
    if (!current) {
      if (layers.length > 0) {
        current = layers[0];
        setActiveLayerId(current.id);
      } else {
        const newLayer = {
          id: `layer-${Date.now()}`,
          name: 'Layer 1 (Canvas Root)',
          bodiceType: 'Custom Layer',
          visible: true,
          locked: false,
          opacity: 1.0,
          elements: [],
          piece: null,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        };
        setLayers([newLayer]);
        setActiveLayerId(newLayer.id);
        current = newLayer;
      }
    }
    const boundSheet = current?.sheetId ? cuttingSheets.find((s) => s.id === current.sheetId) : null;
    return { ...current, parentSheet: boundSheet, parentSheetId: boundSheet?.id || null };
  };

  // Record a complete universal snapshot for Undo/Redo across all layers and sub-layers
  const pushUndoSnapshot = () => {
    setUndoStack((prev) => {
      const snapshot = {
        layers: JSON.parse(JSON.stringify(layers)),
        cuttingSheets: JSON.parse(JSON.stringify(cuttingSheets)),
        activeLayerId,
        selectedElementId,
      };
      const next = [...prev, snapshot];
      return next.length > 40 ? next.slice(next.length - 40) : next;
    });
    setRedoStack([]);
  };

  const handleToggleLayersHeader = () => {
    if (activeSubTab === 'cutting') {
      if (bigCuttingTableRef.current?.toggleLayers) {
        bigCuttingTableRef.current.toggleLayers();
      } else {
        setCuttingShowLayers((v) => !v);
      }
      return;
    }
    setShowLayerPanel((v) => !v);
  };

  const toggleLayerVisibility = (id) => {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === id);
      const nextVis = target ? !target.visible : true;
      if (target?.sheetId) {
        setCuttingSheets((sheets) =>
          sheets.map((s) => (s.id === target.sheetId ? { ...s, visible: nextVis } : s))
        );
      }
      return prev.map((l) => (l.id === id ? { ...l, visible: nextVis } : l));
    });
  };

  const toggleLayerLock = (id) => {
    setLayers((prev) => {
      const target = prev.find((l) => l.id === id);
      const nextLocked = target ? !target.locked : false;
      if (target?.sheetId) {
        setCuttingSheets((sheets) =>
          sheets.map((s) => (s.id === target.sheetId ? { ...s, locked: nextLocked } : s))
        );
      }
      return prev.map((l) => (l.id === id ? { ...l, locked: nextLocked } : l));
    });
  };

  const deleteLayer = (id) => {
    pushUndoSnapshot();
    const layerToDelete = layers.find((l) => l.id === id);
    const linkedSheetId = layerToDelete?.sheetId;

    // Automatically remove linked cutting sheet from drafting board when layer is deleted
    setCuttingSheets((prev) =>
      prev.filter(
        (s) => s.id !== linkedSheetId && s.layerId !== id && `layer_sheet_${s.id}` !== id
      )
    );
    if (selectedCuttingSheetId && (selectedCuttingSheetId === linkedSheetId || layerToDelete?.id === id)) {
      setSelectedCuttingSheetId(null);
    }

    setLayers((prev) => {
      const remaining = prev.filter((l) => l.id !== id);
      if (activeLayerId === id) {
        setActiveLayerId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    setSelectedLayerIdsForMerge((prev) => prev.filter((item) => item !== id));
  };

  const toggleExpandSheetLayer = (layerId) => {
    setExpandedSheetLayerIds((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const toggleElementVisibility = (layerId, elementId) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          elements: l.elements.map((el) =>
            el.id === elementId ? { ...el, visible: el.visible === false ? true : false } : el
          ),
        };
      })
    );
  };

  // Sub-layers can still be erased and deleted, but are not moved once auto-locked
  const deleteElement = (layerId, elementId) => {
    pushUndoSnapshot();
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          elements: l.elements.filter((el) => el.id !== elementId),
        };
      })
    );
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  // Manually lock or unlock sub-layer position
  const handleToggleElementLock = (layerId, elementId) => {
    pushUndoSnapshot();
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          elements: l.elements.map((el) => {
            if (el.id !== elementId) return el;
            const currentlyLocked = isElementPositionLocked(el);
            if (currentlyLocked) {
              return {
                ...el,
                positionLocked: false,
                lastMovedAt: Date.now(),
                unlockedUntil: Date.now() + 10000,
              };
            } else {
              return {
                ...el,
                positionLocked: true,
                unlockedUntil: 0,
              };
            }
          }),
        };
      })
    );
  };

  const handleNudgeElement = (layerId, elementId, dx, dy) => {
    const parentLayer = layers.find((l) => l.id === layerId);
    const targetEl = parentLayer?.elements?.find((el) => el.id === elementId);

    // Prevent moving if sub-layer is position-locked
    if (targetEl && isElementPositionLocked(targetEl)) {
      return;
    }

    pushUndoSnapshot();
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          elements: l.elements.map((el) => {
            if (el.id !== elementId) return el;
            const updatedTime = Date.now();
            if (el.tool === 'dart_marker' && el.apex) {
              return {
                ...el,
                lastMovedAt: updatedTime,
                apex: { x: el.apex.x + dx, y: el.apex.y + dy },
                legs: el.legs ? el.legs.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) : [],
              };
            }
            if (!el.points) return el;
            const shifted = el.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
            return {
              ...el,
              lastMovedAt: updatedTime,
              points: shifted,
              pathData: renderPointsToPath(shifted),
            };
          }),
        };
      })
    );
  };

  // Merge a specific sub-layer with its adjacent sub-layer within the same layer hierarchy
  const handleMergeSubLayer = (layerId, elementId) => {
    const parentLayer = layers.find((l) => l.id === layerId);
    if (!parentLayer || !parentLayer.elements) return;

    const elIndex = parentLayer.elements.findIndex((el) => el.id === elementId);
    if (elIndex === -1) return;

    if (parentLayer.elements.length < 2) {
      showToast('Cannot merge: Layer requires at least 2 sub-layers to combine.', 'warning');
      return;
    }

    const adjacentIndex = elIndex + 1 < parentLayer.elements.length ? elIndex + 1 : elIndex - 1;
    const currentEl = parentLayer.elements[elIndex];
    const adjacentEl = parentLayer.elements[adjacentIndex];

    const currentPoints = currentEl.points || (currentEl.apex ? [currentEl.apex, ...(currentEl.legs || [])] : []);
    const adjacentPoints = adjacentEl.points || (adjacentEl.apex ? [adjacentEl.apex, ...(adjacentEl.legs || [])] : []);

    if (currentPoints.length === 0 && adjacentPoints.length === 0) {
      showToast('Merge failed: Selected sub-layers do not contain vector stroke data.', 'error');
      return;
    }

    pushUndoSnapshot();

    const mergedPoints = [...currentPoints, ...adjacentPoints];
    const mergedElement = {
      id: `merged_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tool: currentEl.tool || adjacentEl.tool || 'pen',
      color: currentEl.color || adjacentEl.color || '#facc15',
      size: Math.max(currentEl.size || 2, adjacentEl.size || 2),
      opacity: currentEl.opacity ?? adjacentEl.opacity ?? 1.0,
      visible: true,
      points: mergedPoints,
      pathData: renderPointsToPath(mergedPoints),
      label: `Merged (${currentEl.label || 'Stroke'} + ${adjacentEl.label || 'Stroke'})`,
      createdAt: Date.now(),
      lastMovedAt: Date.now(),
      positionLocked: false,
    };

    const firstIndex = Math.min(elIndex, adjacentIndex);
    const updatedElements = parentLayer.elements.filter(
      (el) => el.id !== currentEl.id && el.id !== adjacentEl.id
    );
    updatedElements.splice(firstIndex, 0, mergedElement);

    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, elements: updatedElements } : l))
    );

    setSelectedElementId(mergedElement.id);
    showToast(`Merged sub-layer with adjacent stroke successfully.`);
  };

  const moveLayerOrder = (id, direction) => {
    const index = layers.findIndex((l) => l.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    pushUndoSnapshot();
    const newLayers = [...layers];
    const [moved] = newLayers.splice(index, 1);
    newLayers.splice(newIndex, 0, moved);
    setLayers(newLayers);
  };

  const startRenameLayer = (layer) => {
    setEditingLayerId(layer.id);
    setEditingLayerName(layer.name);
  };

  const saveRenameLayer = () => {
    if (editingLayerId && editingLayerName.trim()) {
      setLayers((prev) =>
        prev.map((l) => (l.id === editingLayerId ? { ...l, name: editingLayerName.trim() } : l))
      );
    }
    setEditingLayerId(null);
  };

  // -------------------------------------------------------------------------
  // Layer Merging & Group Naming (Fabric.js / Sketchbook Grouping Model)
  // -------------------------------------------------------------------------
  const toggleSelectLayerForMerge = (id) => {
    setSelectedLayerIdsForMerge((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllForMerge = () => {
    if (selectedLayerIdsForMerge.length === layers.length) {
      setSelectedLayerIdsForMerge([]);
    } else {
      setSelectedLayerIdsForMerge(layers.map((l) => l.id));
    }
  };

  const handleStartMerge = () => {
    if (selectedLayerIdsForMerge.length < 2) return;
    const defaultName = `Merged Group (${selectedLayerIdsForMerge.length} Layers)`;
    setMergeGroupName(defaultName);
    setShowMergeModal(true);
  };

  const handleConfirmMerge = (customName = null) => {
    if (selectedLayerIdsForMerge.length < 2) return;
    pushUndoSnapshot();
    const layersToMerge = layers.filter((l) => selectedLayerIdsForMerge.includes(l.id));
    const remainingLayers = layers.filter((l) => !selectedLayerIdsForMerge.includes(l.id));

    // Consolidate elements from all selected layers into a single vector group
    const mergedElements = layersToMerge.flatMap((l) => {
      return (l.elements || []).map((el) => ({
        ...el,
        id: `el_grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      }));
    });

    const primaryPiece = layersToMerge.find((l) => l.piece)?.piece || null;
    const chosenName = (customName || mergeGroupName).trim() || 'Merged Bodice Group';
    const mergedGroupId = `layer_group_${Date.now()}`;

    const mergedGroupLayer = {
      id: mergedGroupId,
      name: chosenName,
      bodiceType: 'Merged Vector Group',
      visible: true,
      locked: false,
      opacity: 1.0,
      elements: mergedElements,
      piece: primaryPiece,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      isGroup: true,
      mergedCount: layersToMerge.length,
    };

    setLayers([...remainingLayers, mergedGroupLayer]);
    setActiveLayerId(mergedGroupId);
    setSelectedLayerIdsForMerge([]);
    setShowMergeModal(false);
  };

  // -------------------------------------------------------------------------
  // 8. Fabric Upload Handler for Cutting Table
  // -------------------------------------------------------------------------
  const handleFabricUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFabricTexture(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Import a drafted layer bodice onto the Cutting Table
  const handleImportBodiceToCuttingTable = (layer) => {
    if (!layer) return;
    handleSelectSubTab('cutting');
    setTimeout(() => {
      if (bigCuttingTableRef.current?.importLayer) {
        bigCuttingTableRef.current.importLayer(layer);
      }
    }, 60);
  };

  // Import a cutting sheet directly onto the Cutting Table
  const handleImportSheetToCuttingTable = (sheetId) => {
    if (!sheetId) return;
    handleSelectSubTab('cutting');
    setTimeout(() => {
      if (bigCuttingTableRef.current?.importSheet) {
        bigCuttingTableRef.current.importSheet(sheetId);
      }
    }, 60);
  };

  // -------------------------------------------------------------------------
  // Cutting Sheet Management (Spawning, Duplicating, Mirroring & Seam Allowances)
  // -------------------------------------------------------------------------
  const addCuttingSheet = (config = {}) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const vpW = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vpH = typeof window !== 'undefined' ? window.innerHeight : 768;

    let defaultW = config.width || 360;
    let defaultH = config.height || 480;
    const isMirrored = config.isMirrored !== undefined ? config.isMirrored : false;

    // Mobile layout constraints: "shrink everything just to fit the screen in mobile mode including the cut sheets or automatic bodice generated"
    if (isMobile) {
      if (isMirrored) {
        // Mirrored sheet effective total width is 2 * defaultW
        // Shrink half-width to max 125px so total width is 250px (fits safely inside 360-390px mobile screens)
        defaultW = Math.min(config.width ? Math.min(config.width, 125) : 125, 125);
        defaultH = Math.min(config.height || 300, 300);
      } else {
        defaultW = Math.min(config.width || 220, 220);
        defaultH = Math.min(config.height || 300, 300);
      }
    }

    const effW = isMirrored ? defaultW * 2 : defaultW;
    const effH = defaultH;

    // Align on 20px drafting grid (or center in first screen on mobile)
    const sheetCount = cuttingSheets.length;
    let gridX = config.x !== undefined ? config.x : Math.round((120 + (sheetCount % 4) * 60) / 20) * 20;
    let gridY = config.y !== undefined ? config.y : Math.round((80 + (sheetCount % 4) * 40) / 20) * 20;

    if (isMobile) {
      // Center accurately on the mobile screen inside the first screen
      const currentZoom = Math.min(zoom, 0.65);
      if (zoom > 0.65) setZoom(0.65);
      gridX = Math.round((vpW / 2 - (effW * currentZoom) / 2 - panOffset.x) / currentZoom);
      gridY = Math.max(15, Math.round(((vpH - 150) / 2 - (effH * currentZoom) / 2 - panOffset.y) / currentZoom));
    }

    const sheetId = `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const sheetName = config.name || `Cutting Sheet ${sheetCount + 1}`;
    const layerId = `layer_sheet_${sheetId}`;

    const newSheet = {
      id: sheetId,
      name: sheetName,
      type: config.type || 'custom_rect',
      x: gridX,
      y: gridY,
      width: defaultW,
      height: defaultH,
      color: config.color || '#ffffff',
      opacity: config.opacity !== undefined ? config.opacity : 0.98,
      isMirrored: isMirrored,
      locked: false,
      hasSeamAllowance: config.hasSeamAllowance !== undefined ? config.hasSeamAllowance : true,
      seamAllowanceInches: config.seamAllowanceInches || 0.625,
      layerId: layerId,
    };

    // User requirement: "when a cutting sheet is drawn, add it as a layer where users can draw on, change the color and even the chalk color to a color that can appear on the cutting sheet visibly."
    const newLayer = {
      id: layerId,
      name: `Sheet: ${sheetName}`,
      bodiceType: 'Cutting Sheet Drafting',
      visible: true,
      locked: false,
      opacity: 1.0,
      elements: [],
      piece: null,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      isCuttingSheet: true,
      sheetId: sheetId,
    };

    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(layerId);
    setCuttingSheets((prev) => [...prev, newSheet]);
    setSelectedCuttingSheetId(newSheet.id);

    // Default to high-contrast chalk color (French Blue) if sheet is white/cream
    if (newSheet.color === '#ffffff' || newSheet.color === '#fefce8') {
      setBrushColor('#0284c7');
    }
    return newSheet;
  };

  const handleUpdateCuttingSheet = (idOrUpdates, possibleUpdates) => {
    const sheetId = typeof idOrUpdates === 'string' ? idOrUpdates : idOrUpdates?.id;
    const updates = typeof idOrUpdates === 'string' ? possibleUpdates : idOrUpdates;
    if (!sheetId || !updates) return;

    setCuttingSheets((prev) => {
      const current = prev.find((s) => s.id === sheetId);
      if (!current) return prev;

      // Rescaling child strokes proportionally if sheet dimensions change
      const scaleX = updates.width !== undefined && current.width ? updates.width / current.width : 1;
      const scaleY = updates.height !== undefined && current.height ? updates.height / current.height : 1;

      if (scaleX !== 1 || scaleY !== 1) {
        setLayers((prevLayers) =>
          prevLayers.map((l) => {
            if (l.sheetId === sheetId || l.id === current.layerId || l.id === `layer_sheet_${sheetId}`) {
              return {
                ...l,
                elements: l.elements.map((el) => {
                  if (el.tool === 'dart_marker' && el.apex && el.legs) {
                    return {
                      ...el,
                      apex: { x: Math.round(el.apex.x * scaleX * 10) / 10, y: Math.round(el.apex.y * scaleY * 10) / 10 },
                      legs: el.legs.map((pt) => ({
                        x: Math.round(pt.x * scaleX * 10) / 10,
                        y: Math.round(pt.y * scaleY * 10) / 10,
                      })),
                    };
                  }
                  if (!el.points) return el;
                  const scaledPoints = el.points.map((pt) => ({
                    x: Math.round(pt.x * scaleX * 10) / 10,
                    y: Math.round(pt.y * scaleY * 10) / 10,
                  }));
                  return {
                    ...el,
                    points: scaledPoints,
                    pathData: renderPointsToPath(scaledPoints),
                  };
                }),
              };
            }
            return l;
          })
        );
      }

      // Synchronize visibility, lock state, and name with bound layer
      if (updates.visible !== undefined || updates.locked !== undefined || updates.name) {
        setLayers((prevLayers) =>
          prevLayers.map((l) => {
            if (l.sheetId === sheetId || l.id === current.layerId || l.id === `layer_sheet_${sheetId}`) {
              return {
                ...l,
                ...(updates.visible !== undefined ? { visible: updates.visible } : {}),
                ...(updates.locked !== undefined ? { locked: Boolean(updates.locked) } : {}),
                ...(updates.name ? { name: `Sheet: ${updates.name}` } : {}),
              };
            }
            return l;
          })
        );
      }

      return prev.map((s) => (s.id === sheetId ? { ...s, ...updates } : s));
    });
  };

  const handleDuplicateCuttingSheet = (id) => {
    const target = cuttingSheets.find((s) => s.id === id);
    if (!target) return;
    const newSheetId = `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newLayerId = `layer_sheet_${newSheetId}`;
    const dup = {
      ...target,
      id: newSheetId,
      name: `${target.name} (Copy)`,
      x: target.x + 40,
      y: target.y + 40,
      locked: false,
      layerId: newLayerId,
    };

    // Duplicate strokes and dart markers with identical local coordinates
    const origLayer = layers.find((l) => l.id === target.layerId || l.sheetId === id);
    const duplicatedElements = (origLayer?.elements || []).map((el) => {
      if (el.tool === 'dart_marker' && el.apex && el.legs) {
        return {
          ...el,
          id: `dart_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sheetId: newSheetId,
        };
      }
      return {
        ...el,
        id: `stroke_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sheetId: newSheetId,
      };
    });

    const dupLayer = {
      id: newLayerId,
      name: `Sheet: ${dup.name}`,
      bodiceType: 'Cutting Sheet Drafting',
      visible: true,
      locked: false,
      opacity: 1.0,
      elements: duplicatedElements,
      piece: null,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      isCuttingSheet: true,
      sheetId: newSheetId,
    };

    setLayers((prev) => [...prev, dupLayer]);
    setActiveLayerId(newLayerId);
    setCuttingSheets((prev) => [...prev, dup]);
    setSelectedCuttingSheetId(dup.id);
  };

  const handleRemoveCuttingSheet = (id) => {
    const target = cuttingSheets.find((s) => s.id === id);
    const remainingSheets = cuttingSheets.filter((s) => s.id !== id);
    setCuttingSheets(remainingSheets);
    setLayers((prev) => {
      const remaining = prev.filter(
        (l) => l.sheetId !== id && l.id !== target?.layerId && l.id !== `layer_sheet_${id}`
      );
      if (activeLayerId && (activeLayerId === target?.layerId || activeLayerId === `layer_sheet_${id}`)) {
        // Activate previous remaining sheet layer, moving it to front
        const prevSheetLayer = remaining.find((l) => l.isCuttingSheet);
        setActiveLayerId(prevSheetLayer ? prevSheetLayer.id : (remaining.length > 0 ? remaining[0].id : null));
      }
      return remaining;
    });
    if (selectedCuttingSheetId === id) {
      const prevSheet = remainingSheets.length > 0 ? remainingSheets[remainingSheets.length - 1] : null;
      setSelectedCuttingSheetId(prevSheet ? prevSheet.id : null);
    }
  };

  // Add 5/8" Broken Seam Allowance outline to a specific layer
  const handleAddSeamAllowanceToLayer = (layerId) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    // Build broken seam allowance perimeter
    const pts = [];
    const baseW = layer.piece?.bounds?.width || 220;
    const baseH = layer.piece?.bounds?.height || 300;
    const seamOffset = 15; // ~5/8" in CAD px

    pts.push({ x: layer.offsetX - seamOffset, y: layer.offsetY - seamOffset });
    pts.push({ x: layer.offsetX + baseW + seamOffset, y: layer.offsetY - seamOffset });
    pts.push({ x: layer.offsetX + baseW + seamOffset, y: layer.offsetY + baseH + seamOffset });
    pts.push({ x: layer.offsetX - seamOffset, y: layer.offsetY + baseH + seamOffset });
    pts.push({ x: layer.offsetX - seamOffset, y: layer.offsetY - seamOffset });

    const seamStroke = {
      id: `stroke_seam_${Date.now()}`,
      tool: 'seam_allowance',
      isSeamAllowance: true,
      dashed: true,
      points: pts,
      color: '#38bdf8',
      size: 2,
      opacity: 0.95,
      pathData: renderPointsToPath(pts),
      label: '5/8" Seam Allowance',
    };

    pushUndoSnapshot();
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, elements: [...l.elements, seamStroke] } : l))
    );
  };

  // Wheel zoom handler: Smooth zoom up to 4x (400% magnification) anchored to cursor, clamped to MIN_ZOOM (0.5)
  const handleWheel = (e) => {
    e.preventDefault();
    const DRAFTING_MIN_ZOOM = 0.5;
    const zoomDelta = e.deltaY < 0 ? 1.12 : 0.89;
    const nextZoom = Math.max(DRAFTING_MIN_ZOOM, Math.min(4.0, Math.round(zoom * zoomDelta * 100) / 100));
    if (nextZoom === zoom) return;

    if (nextZoom <= DRAFTING_MIN_ZOOM) {
      setPanOffset({ x: 0, y: 0 });
    } else {
      const container = containerRef.current || canvasSvgRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const scaleRatio = nextZoom / zoom;
        const newPanX = mouseX - (mouseX - panOffset.x) * scaleRatio;
        const newPanY = mouseY - (mouseY - panOffset.y) * scaleRatio;
        setPanOffset({ x: Math.round(newPanX), y: Math.round(newPanY) });
      }
    }
    setZoom(nextZoom);
  };

  // -------------------------------------------------------------------------
  // 9. Coordinate Transformation
  // -------------------------------------------------------------------------
  const getCanvasCoords = (e) => {
    const container = containerRef.current || canvasSvgRef.current;
    if (!container) return { x: 0, y: 0, screenX: 0, screenY: 0 };
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
    return {
      x: (clientX - rect.left - panOffset.x) / zoom,
      y: (clientY - rect.top - panOffset.y) / zoom,
      screenX: clientX,
      screenY: clientY,
    };
  };

  // -------------------------------------------------------------------------
  // Magnetic Edge Snapping & Constraining Engine (Autodesk Sketchbook Style)
  // -------------------------------------------------------------------------
  const getConstrainedCoords = (rawX, rawY) => {
    if (!snappingEnabled || activeRulers.length === 0) {
      return { x: rawX, y: rawY, snapped: false, snapInfo: null };
    }

    // Prioritize selected ruler first, then other active rulers
    const sortedRulers = [...activeRulers].sort((a, b) => {
      if (a.id === selectedRulerId) return -1;
      if (b.id === selectedRulerId) return 1;
      return 0;
    });

    for (const ruler of sortedRulers) {
      const snap = snapPointToActiveRuler(rawX, rawY, ruler, snapThreshold);
      if (snap && snap.snapped) {
        return { x: snap.x, y: snap.y, snapped: true, snapInfo: snap };
      }
    }

    return { x: rawX, y: rawY, snapped: false, snapInfo: null };
  };

  const handleToggleRuler = (toolId) => {
    const existing = activeRulers.find((r) => r.type === toolId);
    if (existing) {
      setActiveRulers((prev) => prev.filter((r) => r.type !== toolId));
      if (selectedRulerId === existing.id) {
        const remaining = activeRulers.filter((r) => r.type !== toolId);
        setSelectedRulerId(remaining.length > 0 ? remaining[0].id : null);
      }
    } else {
      const newId = `ruler_${toolId}_${Date.now()}`;
      const catalogEntry = TAILOR_RULERS_CATALOG[toolId];
      const viewCenterX = Math.round((-panOffset.x + (typeof window !== 'undefined' ? window.innerWidth / 2 : 500)) / zoom);
      const viewCenterY = Math.round((-panOffset.y + (typeof window !== 'undefined' ? window.innerHeight / 2 : 300)) / zoom);

      const newRuler = {
        id: newId,
        type: toolId,
        x: viewCenterX || 480,
        y: viewCenterY || 240,
        rotation: 0,
        scale: 1,
        flipX: false,
        flipY: false,
        locked: false,
        isMoveMode: true,
        lengthOption: catalogEntry?.defaultLength || 18,
      };

      setActiveRulers((prev) => [...prev, newRuler]);
      setSelectedRulerId(newId);
    }
  };

  const handleUpdateRuler = (rulerId, updates) => {
    setActiveRulers((prev) =>
      prev.map((r) => (r.id === rulerId ? { ...r, ...updates } : r))
    );
  };

  const handleRemoveRuler = (rulerId) => {
    setActiveRulers((prev) => prev.filter((r) => r.id !== rulerId));
    if (selectedRulerId === rulerId) {
      const remaining = activeRulers.filter((r) => r.id !== rulerId);
      setSelectedRulerId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleClearAllRulers = () => {
    setActiveRulers([]);
    setSelectedRulerId(null);
    setActiveSnapPoint(null);
  };

  // Apply Zoom Action with centered viewport preservation (recalculating viewport transform together)
  const applyDraftingZoom = (newZoomOrUpdater) => {
    setZoom((prevZoom) => {
      const target = typeof newZoomOrUpdater === 'function' ? newZoomOrUpdater(prevZoom) : newZoomOrUpdater;
      const clamped = Math.max(0.5, Math.min(4.0, Math.round(target * 100) / 100));

      const container = containerRef.current || (typeof window !== 'undefined' ? window : null);
      const viewW = container?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 400);
      const viewH = container?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
      const centerX = viewW / 2;
      const centerY = viewH / 2;

      if (clamped <= 0.505) {
        const activeSheet = cuttingSheets.find((s) => s.id === selectedCuttingSheetId) || cuttingSheets[0];
        const sheetCenterX = activeSheet ? (activeSheet.x + (activeSheet.isMirrored ? activeSheet.width * 2 : activeSheet.width) / 2) : 300;
        const sheetCenterY = activeSheet ? (activeSheet.y + activeSheet.height / 2) : 320;
        setPanOffset({
          x: Math.round(centerX - sheetCenterX * clamped),
          y: Math.round(centerY - sheetCenterY * clamped),
        });
      } else {
        const scaleRatio = clamped / prevZoom;
        setPanOffset((prevPan) => ({
          x: Math.round(centerX - (centerX - prevPan.x) * scaleRatio),
          y: Math.round(centerY - (centerY - prevPan.y) * scaleRatio),
        }));
      }

      return clamped;
    });
  };

  // Reset Zoom Action: Restores centered baseline (0.5 on mobile, 1.0 on desktop)
  const handleResetZoom = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetZoom = isMobile ? 0.5 : 1.0;
    const viewW = containerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 400);
    const viewH = containerRef.current?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    const activeSheet = cuttingSheets.find((s) => s.id === selectedCuttingSheetId) || cuttingSheets[0];
    const sheetCenterX = activeSheet ? (activeSheet.x + (activeSheet.isMirrored ? activeSheet.width * 2 : activeSheet.width) / 2) : 300;
    const sheetCenterY = activeSheet ? (activeSheet.y + activeSheet.height / 2) : 320;

    setZoom(targetZoom);
    setPanOffset({
      x: Math.round(viewW / 2 - sheetCenterX * targetZoom),
      y: Math.round(viewH / 2 - sheetCenterY * targetZoom),
    });
    setCurrentStroke(null);
    setActiveSnapPoint(null);
    setSteadyStrokeHUD(null);
    if (!['dart_marker', 'magnifier', 'eraser', 'seam_allowance'].includes(activeTool)) {
      setLensState(null);
    }
  };

  const handleSnapSeamEdge = (points, rulerName = 'Ruler Edge') => {
    if (!points || points.length < 2) return;
    const currentLayer = ensureActiveLayer(points[0]);
    if (!currentLayer || currentLayer.locked || !currentLayer.visible) return;

    // Check if points lie on a cutting sheet
    const hitSheet = cuttingSheets.find((s) => {
      const effW = s.isMirrored ? s.width * 2 : s.width;
      return (
        points[0].x >= s.x &&
        points[0].x <= s.x + effW &&
        points[0].y >= s.y &&
        points[0].y <= s.y + s.height
      );
    });
    if (hitSheet && hitSheet.locked) return;

    const strokeColor = hitSheet?.chalkColor || (activeTool === 'chalk' ? brushColor || '#facc15' : brushColor);

    const baseId = `stroke_ruler_snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const originalPoints = points.map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }));
    const seamStroke = {
      id: baseId,
      tool: activeTool === 'scissors' ? 'scissors' : 'pen',
      points: originalPoints,
      color: strokeColor,
      size: Math.max(2, brushSize),
      opacity: 1.0,
      visible: true,
      isRulerLine: true,
      rulerName: rulerName,
      label: `Snapped ${rulerName}`,
      createdAt: Date.now(),
      lastMovedAt: Date.now(),
      positionLocked: false,
    };

    const elementsToAdd = [seamStroke];

    if (symmetryEnabled && typeof symmetryAxisX === 'number') {
      const mirroredPoints = originalPoints.map((p) => ({
        x: Math.round((2 * symmetryAxisX - p.x) * 10) / 10,
        y: p.y,
      }));
      elementsToAdd.push({
        ...seamStroke,
        id: `${baseId}_mirror`,
        points: mirroredPoints,
        isMirroredCopy: true,
        sourceStrokeId: baseId,
      });
    }

    pushUndoSnapshot();
    setLayers((prev) =>
      prev.map((l) =>
        l.id === currentLayer.id ? { ...l, elements: [...l.elements, ...elementsToAdd] } : l
      )
    );
  };

  // Partial Eraser: Erases specific parts of a sketch instead of discarding full strokes
  const partialEraseElements = (elements, eraserPoints, eraserRadius) => {
    if (!elements || elements.length === 0 || !eraserPoints || eraserPoints.length === 0) {
      return elements;
    }
    const r2 = eraserRadius * eraserRadius;
    const newElements = [];

    for (const el of elements) {
      // Dart marker: remove only if apex point is touched by eraser
      if (el.tool === 'dart_marker') {
        const isApexErased = eraserPoints.some((ep) => {
          const dx = (el.apex?.x || 0) - ep.x;
          const dy = (el.apex?.y || 0) - ep.y;
          return dx * dx + dy * dy <= r2;
        });
        if (!isApexErased) {
          newElements.push(el);
        }
        continue;
      }

      if (!el.points || el.points.length === 0) {
        newElements.push(el);
        continue;
      }

      // Dense interpolation along stroke line so swift eraser gestures don't miss segments
      const densePoints = [];
      for (let i = 0; i < el.points.length; i++) {
        densePoints.push(el.points[i]);
        if (i < el.points.length - 1) {
          const pA = el.points[i];
          const pB = el.points[i + 1];
          const dist = Math.hypot(pB.x - pA.x, pB.y - pA.y);
          if (dist > 4) {
            const steps = Math.ceil(dist / 3);
            for (let s = 1; s < steps; s++) {
              const t = s / steps;
              densePoints.push({
                x: pA.x + (pB.x - pA.x) * t,
                y: pA.y + (pB.y - pA.y) * t,
              });
            }
          }
        }
      }

      // Mark points within eraser radius
      const pointErased = densePoints.map((pt) => {
        for (let j = 0; j < eraserPoints.length; j++) {
          const ep = eraserPoints[j];
          const dx = pt.x - ep.x;
          const dy = pt.y - ep.y;
          if (dx * dx + dy * dy <= r2) return true;
        }
        return false;
      });

      // If no point was erased, keep original element intact
      if (!pointErased.some(Boolean)) {
        newElements.push(el);
        continue;
      }

      // Slice densePoints into non-erased contiguous segments
      const segments = [];
      let currentSegment = [];
      for (let i = 0; i < densePoints.length; i++) {
        if (!pointErased[i]) {
          currentSegment.push(densePoints[i]);
        } else {
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
            currentSegment = [];
          }
        }
      }
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }

      // Add each remaining segment as a split sub-stroke
      segments.forEach((seg, sIdx) => {
        if (seg.length >= 2) {
          const simplified = [];
          for (let k = 0; k < seg.length; k++) {
            if (k === 0 || k === seg.length - 1 || k % 2 === 0) {
              simplified.push(seg[k]);
            }
          }
          newElements.push({
            ...el,
            id: `${el.id}_part_${sIdx}_${Date.now()}`,
            points: simplified,
            pathData: renderPointsToPath(simplified),
          });
        } else if (seg.length === 1) {
          newElements.push({
            ...el,
            id: `${el.id}_part_${sIdx}_${Date.now()}`,
            points: seg,
            pathData: `M ${seg[0].x} ${seg[0].y} L ${seg[0].x + 0.1} ${seg[0].y + 0.1}`,
          });
        }
      });
    }

    return newElements;
  };

  // -------------------------------------------------------------------------
  // 10. Pointer Down / Drawing / Moving
  // -------------------------------------------------------------------------
  const handlePointerDown = (e) => {
    // If middle click or space key pressed, initiate pan only when zoomed beyond baseline
    if ((e.button === 1 || e.spaceKey) && zoom > 1.0) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    const { x, y, screenX, screenY } = getCanvasCoords(e);
    setCursorPos({ x: screenX, y: screenY });

    setIsPointerDown(true);

    // TOOL: DRAW CUSTOM CUTTING SHEET
    if (activeTool === 'draw_sheet') {
      const snapX = Math.round(x / 10) * 10;
      const snapY = Math.round(y / 10) * 10;
      setSheetDrawPreview({
        startX: snapX,
        startY: snapY,
        currentX: snapX,
        currentY: snapY,
      });
      return;
    }

    // TOOL: TAPE MEASURE
    if (activeTool === 'tape_measure') {
      triggerTapeAutoHideTimer();
      if (!tapeMeasure.start || (tapeMeasure.start && !tapeMeasure.active)) {
        // Start measurement
        setTapeMeasure({ start: { x, y }, end: { x, y }, active: true, savedDist: null });
      } else if (tapeMeasure.start && tapeMeasure.active) {
        // Lock measurement
        const dx = x - tapeMeasure.start.x;
        const dy = y - tapeMeasure.start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        setTapeMeasure({ start: tapeMeasure.start, end: { x, y }, active: false, savedDist: dist });
      }
      return;
    }

    // TOOL: PIECE MOVE
    if (activeTool === 'piece_move') {
      setIsMovingPiece(true);
      if (activeSubTab === 'cutting' && selectedCuttingPieceId) {
        const piece = cuttingTablePieces.find((p) => p.id === selectedCuttingPieceId);
        if (piece) {
          preMoveSnapshotRef.current = {
            layers: JSON.parse(JSON.stringify(layers)),
            cuttingSheets: JSON.parse(JSON.stringify(cuttingSheets)),
            activeLayerId,
            selectedElementId,
          };
          hasMovedRef.current = false;
          movingPieceRef.current = {
            startX: screenX,
            startY: screenY,
            initialX: piece.x,
            initialY: piece.y,
            pieceId: piece.id,
          };
          return;
        }
      }

      // 1. Check if a specific sub-layer (element) is selected
      if (selectedElementId) {
        const selLayer = layers.find((l) => l.elements?.some((el) => el.id === selectedElementId));
        const selEl = selLayer?.elements?.find((el) => el.id === selectedElementId);
        if (selEl) {
          // The sub-layers automatically lock to position if not moved within 10 seconds
          // Sub-layers can still be erased, but not moved once locked
          if (isElementPositionLocked(selEl)) {
            // Position locked! Regulate unnecessary movement: Deselect element and fall through to collective layer move
            setSelectedElementId(null);
          } else {
            // Position unlocked (within 10s of last move): allow moving this individual line
            preMoveSnapshotRef.current = {
              layers: JSON.parse(JSON.stringify(layers)),
              cuttingSheets: JSON.parse(JSON.stringify(cuttingSheets)),
              activeLayerId,
              selectedElementId,
            };
            hasMovedRef.current = false;
            movingPieceRef.current = {
              startX: screenX,
              startY: screenY,
              elementId: selectedElementId,
              layerId: selLayer.id,
              initialPoints: selEl.points ? selEl.points.map((p) => ({ ...p })) : null,
              initialApex: selEl.apex ? { ...selEl.apex } : null,
              initialLegs: selEl.legs ? selEl.legs.map((p) => ({ ...p })) : null,
            };
            return;
          }
        }
      }

      // 2. Collective Layer Movement when selected (marked box)
      // "A layer can be moved collectively with the sub-layers when selected (marked box)."
      let markedLayerIds = selectedLayerIdsForMerge.length > 0 ? [...selectedLayerIdsForMerge] : [];

      // If user clicked directly on a cutting sheet and no boxes are marked, select that sheet's layer
      const clickedSheet = cuttingSheets.find((s) => {
        const effW = s.isMirrored ? s.width * 2 : s.width;
        return x >= s.x && x <= s.x + effW && y >= s.y && y <= s.y + s.height;
      });

      if (markedLayerIds.length === 0) {
        if (clickedSheet) {
          if (clickedSheet.locked) {
            // Locked cutting sheet: select for inspection but do NOT drag
            setSelectedCuttingSheetId(clickedSheet.id);
            setIsMovingPiece(false);
            return;
          }
          setSelectedCuttingSheetId(clickedSheet.id);
          const sheetLayerId = clickedSheet.layerId || `layer_sheet_${clickedSheet.id}`;
          markedLayerIds = [sheetLayerId];
          setActiveLayerId(sheetLayerId);
        } else {
          // Tapped on empty canvas space:
          // Deselect selected element, cutting sheet, and leave viewport and layers completely stable without moving!
          setSelectedElementId(null);
          setSelectedCuttingSheetId(null);
          setIsMovingPiece(false);
          return;
        }
      }

      const targetLayers = layers.filter((l) => markedLayerIds.includes(l.id) && !l.locked);
      if (targetLayers.length > 0) {
        preMoveSnapshotRef.current = {
          layers: JSON.parse(JSON.stringify(layers)),
          cuttingSheets: JSON.parse(JSON.stringify(cuttingSheets)),
          activeLayerId,
          selectedElementId,
        };
        hasMovedRef.current = false;

        const targetSheetIds = cuttingSheets
          .filter((s) =>
            targetLayers.some(
              (l) => l.id === s.layerId || l.sheetId === s.id || l.id === `layer_sheet_${s.id}`
            )
          )
          .map((s) => s.id);

        movingPieceRef.current = {
          startX: screenX,
          startY: screenY,
          collectiveMove: true,
          targetLayerIds: targetLayers.map((l) => l.id),
          targetSheetIds,
          initialLayers: layers.map((l) => ({
            id: l.id,
            offsetX: l.offsetX || 0,
            offsetY: l.offsetY || 0,
          })),
          initialSheets: cuttingSheets.map((s) => ({
            id: s.id,
            x: s.x,
            y: s.y,
          })),
        };
        return;
      }
      return;
    }

    // Ensure a writable layer exists (creates Layer 1 if board is blank, or activates cutting sheet layer)
    const currentLayer = ensureActiveLayer({ x, y });
    if (!currentLayer || currentLayer.locked || !currentLayer.visible) return;

    // TOOL: DART MARKER (Reduced dart size per user specification)
    if (activeTool === 'dart_marker') {
      pushUndoSnapshot();
      const baseId = `dart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const isBoundToSheet = Boolean(currentLayer.parentSheet);
      let dartApexX = x;
      let dartApexY = y;
      if (isBoundToSheet) {
        const loc = canonicalToSheetLocal({ x, y }, currentLayer.parentSheet);
        dartApexX = loc.localX;
        dartApexY = loc.localY;
      }

      const dartStroke = {
        id: baseId,
        tool: 'dart_marker',
        apex: { x: dartApexX, y: dartApexY },
        legs: [
          { x: dartApexX - 6, y: dartApexY + 20 },
          { x: dartApexX, y: dartApexY },
          { x: dartApexX + 6, y: dartApexY + 20 },
        ],
        parentSheetId: currentLayer.parentSheetId || null,
        targetLayerId: currentLayer.id,
        color: brushColor,
        size: Math.max(0.75, Math.round((0.9 / Math.max(0.6, zoom)) * 10) / 10),
        fontSize: 7,
        createdZoom: zoom,
        label: 'DART APEX',
        createdAt: Date.now(),
        lastMovedAt: Date.now(),
        positionLocked: false,
      };

      const elementsToAdd = [dartStroke];

      if (!isBoundToSheet && symmetryEnabled && typeof symmetryAxisX === 'number') {
        const mirroredApexX = Math.round((2 * symmetryAxisX - x) * 10) / 10;
        elementsToAdd.push({
          ...dartStroke,
          id: `${baseId}_mirror`,
          apex: { x: mirroredApexX, y },
          legs: dartStroke.legs.map((p) => ({
            x: Math.round((2 * symmetryAxisX - p.x) * 10) / 10,
            y: p.y,
          })),
          isMirroredCopy: true,
          sourceStrokeId: baseId,
        });
      }

      setLayers((prev) =>
        prev.map((l) =>
          l.id === currentLayer.id ? { ...l, elements: [...l.elements, ...elementsToAdd] } : l
        )
      );
      return;
    }

    // TOOL: TECH PEN, CHALK, SCISSORS ✂️, SEAM ALLOWANCE (BROKEN LINES), ERASER
    let startX = x;
    let startY = y;

    // Track starting point for ruler direction projection
    chalkStartRef.current = { x, y };

    // Active Ruler Constraint at pointer down (French Curve or Straight Ruler)
    if (activeRulers.length > 0 && ['chalk', 'pen', 'scissors', 'seam_allowance'].includes(activeTool)) {
      const targetRuler = activeRulers.find((r) => r.locked) || activeRulers.find((r) => r.id === selectedRulerId) || activeRulers[0];
      if (targetRuler) {
        const constrained = constrainDrawingToActiveRuler(x, y, x, y, targetRuler);
        startX = constrained.x;
        startY = constrained.y;
        chalkStartRef.current = { x: constrained.x, y: constrained.y };
      }
    } else if (snappingEnabled && ['chalk', 'scissors', 'seam_allowance'].includes(activeTool)) {
      const constrained = getConstrainedCoords(x, y);
      if (constrained.snapped) {
        startX = constrained.x;
        startY = constrained.y;
        setActiveSnapPoint(constrained.snapInfo);
      }
    }

    // Initialize Steady Stroke state ONLY for chalk, scissors, and seam_allowance
    // 'pen' is explicitly EXCLUDED to ensure 100% natural, lag-free handwriting fluidity
    steadyPenRef.current = { x: startX, y: startY };
    if (steadyStrokeEnabled && ['chalk', 'scissors', 'seam_allowance'].includes(activeTool)) {
      const lvl = STEADY_STROKE_LEVELS[steadyStrokeLevel] || STEADY_STROKE_LEVELS[3];
      setSteadyStrokeHUD({
        rawX: startX,
        rawY: startY,
        penX: startX,
        penY: startY,
        radius: lvl.radius,
      });
    } else {
      setSteadyStrokeHUD(null);
    }

    // Precision Focus Loupe auto-activation on pointer down
    if (activeTool === 'seam_allowance') {
      setLensState({
        visible: true,
        x: startX,
        y: startY,
        screenX,
        screenY,
        tool: 'seam_allowance',
        angle: 0,
        label: '5/8" Broken Seam Guide (Steady)',
      });
    } else if (activeTool === 'eraser') {
      setLensState({
        visible: true,
        x: startX,
        y: startY,
        screenX,
        screenY,
        tool: 'eraser',
        label: 'Surgical Eraser (Focus Loupe)',
      });
    } else if (activeTool === 'chalk' || (activeTool === 'pen' && activeRulers.length > 0)) {
      const targetRuler = activeRulers.find((r) => r.locked) || activeRulers.find((r) => r.id === selectedRulerId) || activeRulers[0];
      if (targetRuler) {
        const isCurve = targetRuler.type !== 'straightRuler';
        setLensState({
          visible: true,
          x: startX,
          y: startY,
          screenX,
          screenY,
          tool: activeTool,
          angle: Math.round(targetRuler.rotation || 0),
          label: isCurve ? `${targetRuler.name || 'French Curve'} Arc` : `Straight Ruler Edge (${Math.round(targetRuler.rotation || 0)}°)`,
        });
      }
    }

    const isPen = activeTool === 'pen';
    const isSeam = activeTool === 'seam_allowance';
    // Calibrate stroke thickness to canvas viewport zoom level so pen annotations and handwriting
    // maintain exact 1:1 physical proportion to pattern sheet when zooming out
    const calibratedStrokeSize = isSeam ? 2.5 : isPen ? Math.max(1, Math.round((brushSize / Math.max(0.5, zoom)) * 10) / 10) : brushSize;

    let strokeStartX = startX;
    let strokeStartY = startY;
    if (currentLayer.parentSheet) {
      const loc = canonicalToSheetLocal({ x: startX, y: startY }, currentLayer.parentSheet);
      strokeStartX = loc.localX;
      strokeStartY = loc.localY;
    }

    const newStroke = {
      id: `stroke_${Date.now()}`,
      tool: activeTool,
      isSeamAllowance: isSeam,
      dashed: isSeam,
      points: [{ x: strokeStartX, y: strokeStartY }],
      parentSheetId: currentLayer.parentSheetId || null,
      targetLayerId: currentLayer.id,
      color: isSeam ? '#38bdf8' : activeTool === 'eraser' ? '#090d16' : brushColor,
      size: calibratedStrokeSize,
      createdZoom: zoom,
      opacity: brushOpacity,
      symmetry: !currentLayer.parentSheetId && symmetryEnabled,
      symmetryAxisX: !currentLayer.parentSheetId ? symmetryAxisX : null,
      label: isSeam ? '5/8" Seam Allowance' : undefined,
    };

    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e) => {
    const { x, y, screenX, screenY } = getCanvasCoords(e);
    setCursorPos({ x: screenX, y: screenY });

    // Handle Pan
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    // Magnetic edge snap detection for hover HUD
    if (snappingEnabled && activeRulers.length > 0) {
      const constrained = getConstrainedCoords(x, y);
      if (constrained.snapped) {
        setActiveSnapPoint(constrained.snapInfo);
      } else {
        setActiveSnapPoint(null);
      }
    } else if (activeSnapPoint) {
      setActiveSnapPoint(null);
    }

    // Handle Active Sheet Drawing
    if (sheetDrawPreview) {
      setSheetDrawPreview((prev) => ({
        ...prev,
        currentX: Math.round(x / 10) * 10,
        currentY: Math.round(y / 10) * 10,
      }));
      return;
    }

    // Handle Mirror Tool Axis dragging (Freely moveable workspace mirror)
    if (isDraggingMirrorAxis) {
      setSymmetryAxisX(Math.max(20, Math.min(3800, Math.round(x / 5) * 5)));
      return;
    }

    // Handle Tape Measure interactive dragging
    if (activeTool === 'tape_measure' && tapeMeasure.start && tapeMeasure.active) {
      triggerTapeAutoHideTimer();
      setTapeMeasure((prev) => ({ ...prev, end: { x, y } }));
      return;
    }

    // Handle Piece & Collective Layer Move
    if (isMovingPiece) {
      hasMovedRef.current = true;

      // Collective Layer Movement (Moves layer and all its sub-layers together when marked)
      if (movingPieceRef.current.collectiveMove) {
        const { startX, startY, targetLayerIds, targetSheetIds, initialLayers, initialSheets } = movingPieceRef.current;
        const dx = (screenX - startX) / zoom;
        const dy = (screenY - startY) / zoom;

        // Move any linked cutting sheets collectively
        if (targetSheetIds && targetSheetIds.length > 0) {
          setCuttingSheets((prev) =>
            prev.map((s) => {
              if (!targetSheetIds.includes(s.id)) return s;
              const initS = initialSheets?.find((item) => item.id === s.id);
              if (!initS) return s;
              return {
                ...s,
                x: Math.round(initS.x + dx),
                y: Math.round(initS.y + dy),
              };
            })
          );
        }

        // Move target layers and their sub-layer vector paths collectively
        setLayers((prev) =>
          prev.map((l) => {
            if (!targetLayerIds.includes(l.id)) return l;
            const initL = initialLayers?.find((item) => item.id === l.id);
            const baseOffsetX = initL ? initL.offsetX : (l.offsetX || 0);
            const baseOffsetY = initL ? initL.offsetY : (l.offsetY || 0);

            return {
              ...l,
              offsetX: Math.round(baseOffsetX + dx),
              offsetY: Math.round(baseOffsetY + dy),
            };
          })
        );
        return;
      }

      // Individual Sub-Layer Line Movement (allowed only if not auto-locked)
      if (movingPieceRef.current.elementId) {
        const { elementId, layerId, startX, startY, initialPoints, initialApex, initialLegs } = movingPieceRef.current;
        const dx = (screenX - startX) / zoom;
        const dy = (screenY - startY) / zoom;
        const moveTimestamp = Date.now();
        setLayers((prev) =>
          prev.map((l) => {
            if (l.id !== layerId) return l;
            return {
              ...l,
              elements: l.elements.map((el) => {
                if (el.id !== elementId) return el;
                if (initialApex && initialLegs) {
                  return {
                    ...el,
                    lastMovedAt: moveTimestamp,
                    apex: { x: Math.round(initialApex.x + dx), y: Math.round(initialApex.y + dy) },
                    legs: initialLegs.map((pt) => ({ x: Math.round(pt.x + dx), y: Math.round(pt.y + dy) })),
                  };
                }
                if (initialPoints) {
                  const shifted = initialPoints.map((pt) => ({ x: Math.round(pt.x + dx), y: Math.round(pt.y + dy) }));
                  return {
                    ...el,
                    lastMovedAt: moveTimestamp,
                    points: shifted,
                    pathData: renderPointsToPath(shifted),
                  };
                }
                return el;
              }),
            };
          })
        );
        return;
      }

      // Full Cutting Sheet Movement (Locked lines move along with sheet)
      if (movingPieceRef.current.sheetId) {
        const dx = (screenX - movingPieceRef.current.startX) / zoom;
        const dy = (screenY - movingPieceRef.current.startY) / zoom;
        handleUpdateCuttingSheet(movingPieceRef.current.sheetId, {
          x: Math.round(movingPieceRef.current.initialX + dx),
          y: Math.round(movingPieceRef.current.initialY + dy),
        });
        return;
      }

      if (movingPieceRef.current.pieceId) {
        const dx = (screenX - movingPieceRef.current.startX) / zoom;
        const dy = (screenY - movingPieceRef.current.startY) / zoom;
        setCuttingTablePieces((prev) =>
          prev.map((p) =>
            p.id === movingPieceRef.current.pieceId
              ? {
                  ...p,
                  x: Math.round(movingPieceRef.current.initialX + dx),
                  y: Math.round(movingPieceRef.current.initialY + dy),
                }
              : p
          )
        );
        return;
      }

      if (movingPieceRef.current.layerId) {
        const dx = (screenX - movingPieceRef.current.startX) / zoom;
        const dy = (screenY - movingPieceRef.current.startY) / zoom;
        setLayers((prev) =>
          prev.map((l) =>
            l.id === movingPieceRef.current.layerId
              ? {
                  ...l,
                  offsetX: Math.round(movingPieceRef.current.initialX + dx),
                  offsetY: Math.round(movingPieceRef.current.initialY + dy),
                }
              : l
          )
        );
        return;
      }
    }

    // Auto-Activation of High-Precision Focus Loupe for precision tools on hover
    if (['dart_marker', 'magnifier', 'eraser', 'seam_allowance'].includes(activeTool) && !isPointerDown) {
      setLensState({
        visible: true,
        x: Math.round(x),
        y: Math.round(y),
        screenX,
        screenY,
        tool: activeTool,
        label:
          activeTool === 'dart_marker'
            ? 'Dart Apex Reticle (Click to Place)'
            : activeTool === 'eraser'
            ? 'Surgical Eraser (Focus Loupe)'
            : activeTool === 'seam_allowance'
            ? '5/8" Broken Seam Guide'
            : '2.5x Focus Loupe (Inspection)',
      });
    }

    // Handle Active Stroke with Steady Stroke Stabilization & Edge Snapping
    if (isPointerDown && currentStroke) {
      let targetX = x;
      let targetY = y;

      // 1. Drawing with Ruler: Strict Constraint along Straight Angle or French Curve Spline
      if (activeRulers.length > 0 && ['chalk', 'pen', 'scissors', 'seam_allowance'].includes(currentStroke.tool)) {
        const targetRuler = activeRulers.find((r) => r.locked) || activeRulers.find((r) => r.id === selectedRulerId) || activeRulers[0];
        if (targetRuler) {
          const startPt = chalkStartRef.current || { x: currentStroke.points[0]?.x || x, y: currentStroke.points[0]?.y || y };
          const constrained = constrainDrawingToActiveRuler(x, y, startPt.x, startPt.y, targetRuler);
          targetX = constrained.x;
          targetY = constrained.y;

          // High-precision Focus Loupe showing exact drawing point and ruler curve/straight orientation
          setLensState({
            visible: true,
            x: targetX,
            y: targetY,
            screenX,
            screenY,
            tool: currentStroke.tool,
            angle: constrained.angle,
            label: constrained.isCurve
              ? `${constrained.rulerName || 'French Curve'} Arc (${constrained.angle}°)`
              : `Straight Ruler Edge (${constrained.angle}°)`,
          });
        }
      } else if (snappingEnabled && ['chalk', 'scissors', 'seam_allowance'].includes(currentStroke.tool)) {
        // Ruler Edge Snapping for chalk, scissors, seam allowance
        const constrained = getConstrainedCoords(x, y);
        if (constrained.snapped) {
          targetX = constrained.x;
          targetY = constrained.y;
        }
      }

      // 2. Steady Stroke Smoothing Engine (Autodesk Sketchbook Weighted Moving Average)
      // Exclude 'pen' completely so writing alphabets and numbers is 100% fluid with no stickiness!
      let strokeX = targetX;
      let strokeY = targetY;

      if (steadyStrokeEnabled && ['chalk', 'scissors', 'seam_allowance'].includes(currentStroke.tool)) {
        const lvl = STEADY_STROKE_LEVELS[steadyStrokeLevel] || STEADY_STROKE_LEVELS[3];
        const lastPen = steadyPenRef.current;
        const smoothingFactor = lvl.alpha;

        const smoothedX = lastPen.x + (targetX - lastPen.x) * smoothingFactor;
        const smoothedY = lastPen.y + (targetY - lastPen.y) * smoothingFactor;

        steadyPenRef.current = { x: smoothedX, y: smoothedY };
        strokeX = smoothedX;
        strokeY = smoothedY;

        // Update trailing vector tether HUD
        setSteadyStrokeHUD({
          rawX: targetX,
          rawY: targetY,
          penX: strokeX,
          penY: strokeY,
          radius: lvl.radius,
        });

        // Bold Focus Loupe for Seam Allowance tool
        if (currentStroke.tool === 'seam_allowance') {
          setLensState({
            visible: true,
            x: strokeX,
            y: strokeY,
            screenX,
            screenY,
            tool: 'seam_allowance',
            angle: 0,
            label: '5/8" Broken Seam Guide (Steady)',
          });
        }
      } else {
        setSteadyStrokeHUD(null);
      }

      // Focus Loupe for surgical Eraser while dragging
      if (currentStroke.tool === 'eraser') {
        setLensState({
          visible: true,
          x: strokeX,
          y: strokeY,
          screenX,
          screenY,
          tool: 'eraser',
          label: 'Surgical Eraser (Focus Loupe)',
        });
      }

      let currentPtX = strokeX;
      let currentPtY = strokeY;
      if (currentStroke.parentSheetId) {
        const parentSheet = cuttingSheets.find((s) => s.id === currentStroke.parentSheetId);
        if (parentSheet) {
          const loc = canonicalToSheetLocal({ x: strokeX, y: strokeY }, parentSheet);
          currentPtX = loc.localX;
          currentPtY = loc.localY;
        }
      }

      setCurrentStroke((prev) => {
        if (!prev) return prev;
        const lastPt = prev.points[prev.points.length - 1];
        const dist = Math.hypot(currentPtX - lastPt.x, currentPtY - lastPt.y);
        // Instant 1.0px sampling for Pen handwriting so loops, curves, and letters don't lag or stick
        const decimateThreshold = prev.tool === 'pen' ? 1.0 : (steadyStrokeEnabled ? 2.5 : ((prev.tool === 'chalk' || prev.tool === 'scissors') ? 12 : 4));
        if (dist >= decimateThreshold) {
          return { ...prev, points: [...prev.points, { x: currentPtX, y: currentPtY }] };
        }
        return prev;
      });
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setIsMovingPiece(false);
    setIsPointerDown(false);
    setIsDraggingMirrorAxis(false);
    setSteadyStrokeHUD(null);
    if (!['dart_marker', 'magnifier', 'eraser', 'seam_allowance'].includes(activeTool)) {
      setLensState(null);
    }
    movingPieceRef.current = { startX: 0, startY: 0, initialX: 0, initialY: 0, layerId: null, pieceId: null, sheetId: null };

    // If a piece, layer, or sub-layer was moved, commit snapshot to universal undo stack
    if (hasMovedRef.current && preMoveSnapshotRef.current) {
      setUndoStack((prev) => {
        const next = [...prev, preMoveSnapshotRef.current];
        return next.length > 40 ? next.slice(next.length - 40) : next;
      });
      setRedoStack([]);
      preMoveSnapshotRef.current = null;
      hasMovedRef.current = false;
    }

    // Commit Custom Sheet Drawing
    if (sheetDrawPreview) {
      const minX = Math.min(sheetDrawPreview.startX, sheetDrawPreview.currentX);
      const minY = Math.min(sheetDrawPreview.startY, sheetDrawPreview.currentY);
      const w = Math.abs(sheetDrawPreview.currentX - sheetDrawPreview.startX);
      const h = Math.abs(sheetDrawPreview.currentY - sheetDrawPreview.startY);

      if (w >= 30 && h >= 30) {
        addCuttingSheet({
          name: `Custom Cutting Sheet ${cuttingSheets.length + 1}`,
          type: 'custom_rect',
          x: minX,
          y: minY,
          width: w,
          height: h,
          color: '#ffffff',
          opacity: 0.95,
        });
      }
      setSheetDrawPreview(null);
      return;
    }

    if (currentStroke && currentStroke.points.length > 0) {
      // Stroke's target layer was IMMUTABLY determined at pointer down
      let targetLayer = layers.find((l) => l.id === currentStroke.targetLayerId);
      if (!targetLayer) {
        targetLayer = ensureActiveLayer();
      }

      if (currentStroke.tool === 'eraser') {
        const eraserRadius = Math.max(14, currentStroke.size * 2);
        const eraserPts = currentStroke.points;
        pushUndoSnapshot();
        setLayers((prev) =>
          prev.map((l) => {
            if (l.locked || !l.visible) return l;
            return {
              ...l,
              elements: partialEraseElements(l.elements, eraserPts, eraserRadius),
            };
          })
        );
        setCurrentStroke(null);
        return;
      }

      pushUndoSnapshot();
      const baseId = currentStroke.id || `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const originalPoints = currentStroke.points.map((p) => ({
        x: Math.round(p.x * 10) / 10,
        y: Math.round(p.y * 10) / 10,
      }));

      const strokeToCommit = {
        ...currentStroke,
        id: baseId,
        visible: true,
        points: originalPoints,
        pathData: renderPointsToPath(originalPoints),
        createdAt: Date.now(),
        lastMovedAt: Date.now(),
        positionLocked: false,
      };

      const elementsToAdd = [strokeToCommit];

      // Mirror Tool deterministic copy: strictly only for Canvas root strokes
      if (
        !currentStroke.parentSheetId &&
        !targetLayer?.sheetId &&
        !targetLayer?.isCuttingSheet &&
        symmetryEnabled &&
        typeof symmetryAxisX === 'number'
      ) {
        const mirroredPoints = originalPoints.map((pt) => ({
          x: Math.round((2 * symmetryAxisX - pt.x) * 10) / 10,
          y: pt.y,
        }));

        const mirroredStroke = {
          ...currentStroke,
          id: `${baseId}_mirror`,
          visible: true,
          points: mirroredPoints,
          pathData: renderPointsToPath(mirroredPoints),
          createdAt: Date.now(),
          lastMovedAt: Date.now(),
          positionLocked: false,
          isMirroredCopy: true,
          sourceStrokeId: baseId,
        };
        elementsToAdd.push(mirroredStroke);
      }

      // Commit stroke(s) to active layer
      setLayers((prev) =>
        prev.map((l) =>
          l.id === targetLayer.id ? { ...l, elements: [...l.elements, ...elementsToAdd] } : l
        )
      );
      setRedoStack([]);
      setCurrentStroke(null);
    }
  };

  // -------------------------------------------------------------------------
  // 11. Undo / Redo Actions (Universal across all layers and sub-layers)
  // Selecting any of these toggles will undo/redo the last change across layers or sub-layers
  // -------------------------------------------------------------------------
  const handleUndo = () => {
    if (activeSubTab === 'cutting') {
      if (bigCuttingTableRef.current?.handleUndo) {
        bigCuttingTableRef.current.handleUndo();
      }
      return;
    }
    if (undoStack.length === 0) return;
    const currentSnapshot = {
      layers: JSON.parse(JSON.stringify(layers)),
      cuttingSheets: JSON.parse(JSON.stringify(cuttingSheets)),
      activeLayerId,
      selectedElementId,
    };
    const previousSnapshot = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, currentSnapshot]);

    if (previousSnapshot.layers) setLayers(previousSnapshot.layers);
    if (previousSnapshot.cuttingSheets) setCuttingSheets(previousSnapshot.cuttingSheets);
    if (previousSnapshot.activeLayerId !== undefined) setActiveLayerId(previousSnapshot.activeLayerId);
    if (previousSnapshot.selectedElementId !== undefined) setSelectedElementId(previousSnapshot.selectedElementId);
  };

  const handleRedo = () => {
    if (activeSubTab === 'cutting') {
      if (bigCuttingTableRef.current?.handleRedo) {
        bigCuttingTableRef.current.handleRedo();
      }
      return;
    }
    if (redoStack.length === 0) return;
    const currentSnapshot = {
      layers: JSON.parse(JSON.stringify(layers)),
      cuttingSheets: JSON.parse(JSON.stringify(cuttingSheets)),
      activeLayerId,
      selectedElementId,
    };
    const nextSnapshot = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, currentSnapshot]);

    if (nextSnapshot.layers) setLayers(nextSnapshot.layers);
    if (nextSnapshot.cuttingSheets) setCuttingSheets(nextSnapshot.cuttingSheets);
    if (nextSnapshot.activeLayerId !== undefined) setActiveLayerId(nextSnapshot.activeLayerId);
    if (nextSnapshot.selectedElementId !== undefined) setSelectedElementId(nextSnapshot.selectedElementId);
  };

  // Keyboard shortcut listener for universal Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, layers, cuttingSheets, activeLayerId, selectedElementId, activeSubTab]);

  // -------------------------------------------------------------------------
  // 12. Convert Stroke Points to SVG Path
  // -------------------------------------------------------------------------
  const renderPointsToPath = (points) => {
    if (!points || points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      d += ` Q ${p0.x} ${p0.y}, ${midX} ${midY}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  };

  // Active layer shortcut
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  // Current selected fabric preset
  const activeFabricPreset = FABRIC_PRESETS.find((p) => p.id === fabricPresetId) || FABRIC_PRESETS[0];

  // User Request: Seam allowance tool, when clicked forms another layer of its own,
  // supports drawing breaking lines, requires steady stroke, and shows bold concave lens.
  const activateSeamAllowanceTool = () => {
    setActiveTool('seam_allowance');
    setSteadyStrokeEnabled(true);
    const seamCount = layers.filter((l) => l.isSeamLayer || l.name?.toLowerCase().includes('seam')).length + 1;
    const newLayerId = `layer_seam_${Date.now()}`;
    const newLayer = {
      id: newLayerId,
      name: `Seam Allowance Layer ${seamCount}`,
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
      offsetX: 0,
      offsetY: 0,
      isSeamLayer: true,
      bodiceType: 'Seam Allowance',
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayerId);
    setShowLayerPanel(true);
    setLensState({
      visible: true,
      x: 300,
      y: 300,
      screenX: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
      screenY: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
      tool: 'seam_allowance',
      angle: 0,
      label: '5/8" Broken Seam Guide (Steady)',
    });
  };

  // User Request: Dart marker tool forms another layer of its own with toggles options,
  // and displays bold concave lens.
  const activateDartMarkerTool = () => {
    setActiveTool('dart_marker');
    const dartCount = layers.filter((l) => l.isDartLayer || l.name?.toLowerCase().includes('dart')).length + 1;
    const newLayerId = `layer_dart_${Date.now()}`;
    const newLayer = {
      id: newLayerId,
      name: `Dart Markers Layer ${dartCount}`,
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
      offsetX: 0,
      offsetY: 0,
      isDartLayer: true,
      bodiceType: 'Dart Marker',
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newLayerId);
    setShowLayerPanel(true);
    setLensState({
      visible: true,
      x: 300,
      y: 300,
      screenX: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
      screenY: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
      tool: 'dart_marker',
      angle: 0,
      label: 'Dart Apex Reticle (Click to Place)',
    });
  };

  // Finger Zooming & Fluid Touch Handling (Strict separation: Two-finger gestures zoom and pan viewport, single finger draws/interacts)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsPointerDown(false);
      setIsMovingPiece(false);
      setCurrentStroke(null);

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      touchZoomRef.current = {
        startDist: dist,
        startZoom: zoom,
        startMidX: midX,
        startMidY: midY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
      if (e.cancelable) e.preventDefault();
      return;
    }
    if (e.touches.length === 1) {
      touchZoomRef.current = null;
      if (e.cancelable) e.preventDefault();
      handlePointerDown(e);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchZoomRef.current) {
      if (e.cancelable) e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / (touchZoomRef.current.startDist || 1);
      const newZoom = Math.min(4.0, Math.max(0.5, Math.round(touchZoomRef.current.startZoom * ratio * 100) / 100));

      const currentMidX = (t1.clientX + t2.clientX) / 2;
      const currentMidY = (t1.clientY + t2.clientY) / 2;
      const panDx = currentMidX - touchZoomRef.current.startMidX;
      const panDy = currentMidY - touchZoomRef.current.startMidY;

      setZoom(newZoom);
      setPanOffset({
        x: Math.round(touchZoomRef.current.startPanX + panDx),
        y: Math.round(touchZoomRef.current.startPanY + panDy),
      });
      return;
    }
    if (e.touches.length === 1) {
      if (e.cancelable) e.preventDefault();
      handlePointerMove(e);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      touchZoomRef.current = null;
    }
    handlePointerUp(e);
  };

  return (
    <div className="flex flex-col h-full flex-1 bg-[#090d16] text-slate-100 font-sans select-none overflow-hidden relative">
      {/* ========================================================================= */}
      {/* 1A. MOBILE WORKSPACE HEADER (Pattern Drafting & Cutting Table)            */}
      {/* Pattern Drafting Board: [←/→] [Undo] [Redo] [Layers] [Zoom] [⋯]          */}
      {/* Cutting Table:          [←/→] [Undo] [Redo] [Layers] [Zoom] [Move] [⋯]   */}
      {/* ========================================================================= */}
      <div className="md:hidden h-13 px-2.5 bg-[#0d1322] border-b border-slate-800/90 flex items-center justify-between z-40 shrink-0 select-none shadow-md">
        {/* Left: Tab Switching Arrow button + Workspace badge */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSelectSubTab(activeSubTab === 'drafting' ? 'cutting' : 'drafting')}
            className="p-1.5 rounded-lg text-amber-400 hover:text-white hover:bg-slate-800/70 transition-all flex items-center justify-center"
            title={activeSubTab === 'drafting' ? 'Switch to Cutting Table' : 'Switch to Pattern Drafting Board'}
          >
            {activeSubTab === 'drafting' ? (
              <ArrowRight className="w-4 h-4" />
            ) : (
              <ArrowLeft className="w-4 h-4" />
            )}
          </button>
          <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-[11px] shadow-xs">
            TX
          </div>
        </div>

        {/* Center/Right: Action controls sequence */}
        <div className="flex items-center gap-1">
          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={activeSubTab === 'cutting' ? !cuttingCanUndo : undoStack.length === 0}
            className={`p-1.5 rounded-lg transition-all ${
              (activeSubTab === 'cutting' ? cuttingCanUndo : undoStack.length > 0)
                ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            onClick={handleRedo}
            disabled={activeSubTab === 'cutting' ? !cuttingCanRedo : redoStack.length === 0}
            className={`p-1.5 rounded-lg transition-all ${
              (activeSubTab === 'cutting' ? cuttingCanRedo : redoStack.length > 0)
                ? 'text-slate-200 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 opacity-40 cursor-not-allowed'
            }`}
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Layers */}
          <button
            onClick={handleToggleLayersHeader}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-bold transition-all ${
              (activeSubTab === 'cutting' ? cuttingShowLayers : showLayerPanel)
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-[#060912] border-slate-800 text-slate-300'
            }`}
            title="Toggle Layers"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-400">
              ({activeSubTab === 'cutting' ? (cuttingSheets.length + layers.length) : layers.length})
            </span>
          </button>

          {/* Zoom */}
          <div className="relative">
            <button
              onClick={() => setMobileZoomPopoverOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#060912] border border-slate-800 text-xs font-mono font-bold text-amber-300 hover:bg-slate-800 transition-all"
              title="Zoom Controls"
            >
              <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {activeSubTab === 'cutting'
                  ? `${Math.round(cuttingTableZoom * 100)}%`
                  : `${Math.round(zoom * 100)}%`}
              </span>
            </button>

            {/* Mobile Zoom Popover */}
            {mobileZoomPopoverOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-[#0d1322] border border-slate-700/90 rounded-2xl shadow-2xl p-2.5 w-48 text-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[11px] font-bold text-amber-400 uppercase">
                  <span>Zoom Level</span>
                  <button
                    onClick={() => setMobileZoomPopoverOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => {
                      if (activeSubTab === 'cutting') {
                        bigCuttingTableRef.current?.applyTableZoom?.(
                          Math.max(0.5, cuttingTableZoom - 0.1)
                        );
                      } else {
                        applyDraftingZoom((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {activeSubTab === 'cutting'
                      ? `${Math.round(cuttingTableZoom * 100)}%`
                      : `${Math.round(zoom * 100)}%`}
                  </span>
                  <button
                    onClick={() => {
                      if (activeSubTab === 'cutting') {
                        bigCuttingTableRef.current?.applyTableZoom?.(
                          Math.min(2.5, cuttingTableZoom + 0.1)
                        );
                      } else {
                        applyDraftingZoom((prev) => Math.min(4.0, Math.round((prev + 0.25) * 100) / 100));
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800 text-[10px]">
                  <button
                    onClick={() => {
                      if (activeSubTab === 'cutting') {
                        bigCuttingTableRef.current?.applyTableZoom?.(0.5);
                      } else {
                        applyDraftingZoom(0.5);
                      }
                      setMobileZoomPopoverOpen(false);
                    }}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono font-bold text-amber-300"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => {
                      if (activeSubTab === 'cutting') {
                        bigCuttingTableRef.current?.applyTableZoom?.(1.0);
                      } else {
                        applyDraftingZoom(1.0);
                      }
                      setMobileZoomPopoverOpen(false);
                    }}
                    className="py-1 rounded bg-slate-800 hover:bg-slate-700 font-mono font-bold text-slate-200"
                  >
                    100%
                  </button>
                  <button
                    onClick={() => {
                      if (activeSubTab === 'cutting') {
                        bigCuttingTableRef.current?.centerAndFitTable?.();
                      } else {
                        handleResetZoom();
                      }
                      setMobileZoomPopoverOpen(false);
                    }}
                    className="py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold"
                  >
                    Fit
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cutting Table Only: Move Tool Toggle */}
          {activeSubTab === 'cutting' && (
            <button
              onClick={() => {
                if (bigCuttingTableRef.current?.toggleMoveMode) {
                  bigCuttingTableRef.current.toggleMoveMode();
                } else {
                  setIsFabricMoveEnabled((prev) => !prev);
                }
              }}
              className={`px-2 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-all ${
                isFabricMoveEnabled
                  ? 'bg-amber-400 text-slate-950 shadow-gold-sm ring-1 ring-amber-300'
                  : 'bg-[#060912] text-slate-300 border border-slate-800'
              }`}
              title="Toggle Move Tool"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Move</span>
              <span className="text-[9px] font-mono font-black">{isFabricMoveEnabled ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Pattern Drafting Board Only: Mirror Tool Quick Toggle & Auto Bodice Generation */}
          {activeSubTab === 'drafting' && (
            <>
              {/* Mirror Tool Button in Mobile Header */}
              <button
                onClick={handleToggleSymmetry}
                className={`px-2 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-all border ${
                  symmetryEnabled
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-gold-sm font-black'
                    : 'bg-[#060912] border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Mirror Tool: Symmetrical drawing from top to bottom of screen"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden min-[380px]:inline text-[10px]">Mirror</span>
              </button>

              {/* Auto Bodice Spawner in Mobile Header */}
              <div className="relative">
                <button
                  onClick={() => setMobileBodiceMenuOpen((prev) => !prev)}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
                  title="Generate Automatic Bodice Block"
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span className="hidden min-[380px]:inline">+ Bodice</span>
                </button>
                {mobileBodiceMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 bg-[#0d1322] border border-slate-700/90 rounded-2xl shadow-2xl p-2 w-48 text-slate-200 space-y-1">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 px-1 text-[11px] font-bold text-amber-400 uppercase">
                      <span>Auto Bodice Blocks</span>
                      <button onClick={() => setMobileBodiceMenuOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        handleAddBodiceBlock('front');
                        setMobileBodiceMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span>Front Bodice</span>
                      <span className="text-[10px] text-amber-400/80 font-mono">Auto</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAddBodiceBlock('back');
                        setMobileBodiceMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span>Back Bodice</span>
                      <span className="text-[10px] text-amber-400/80 font-mono">Auto</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAddBodiceBlock('sleeve');
                        setMobileBodiceMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 transition-colors flex items-center justify-between"
                    >
                      <span>Fitted Sleeve</span>
                      <span className="text-[10px] text-amber-400/80 font-mono">Auto</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* More Options [⋯] */}
          <button
            onClick={() => setMobileHeaderDrawerOpen(true)}
            className="p-1.5 rounded-lg bg-[#060912] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            title="More Actions"
          >
            <MoreHorizontal className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Drafting / Cutting Options Drawer (Positioned correctly on screen, refined typography, and scrolling effect) */}
      {mobileHeaderDrawerOpen && (
        <div
          className="fixed top-13 md:top-0 right-0 bottom-0 left-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setMobileHeaderDrawerOpen(false)}
        >
          <div
            className="w-full max-w-[320px] sm:max-w-sm h-full bg-[#0d1322] border-l border-slate-800/90 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header (Refined, reduced boldness) */}
            <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#090d16]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  {activeSubTab === 'drafting' ? <PenTool className="w-3.5 h-3.5" /> : <Scissors className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="text-xs font-semibold tracking-wide text-slate-100 block">
                    {activeSubTab === 'drafting' ? 'Drafting Options' : 'Cutting Table Options'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeSubTab === 'drafting' ? 'Sheets, Bodices & Export' : 'Fabric, Layout & Tools'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileHeaderDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
                title="Close Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Scrollable Content with Scrolling Effect */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar scroll-smooth p-4 space-y-4 text-xs touch-pan-y relative"
            >
              {/* Active Workspace Switcher */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Workspace</span>
                <div className="grid grid-cols-2 gap-1.5 bg-[#060912] p-1 rounded-xl border border-slate-800/80">
                  <button
                    onClick={() => {
                      handleSelectSubTab('drafting');
                    }}
                    className={`py-1.5 px-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                      activeSubTab === 'drafting'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Drafting</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSelectSubTab('cutting');
                    }}
                    className={`py-1.5 px-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all ${
                      activeSubTab === 'cutting'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Cutting</span>
                  </button>
                </div>
              </div>

              {activeSubTab === 'drafting' ? (
                <>
                  {/* Mirror Tool (Symmetry) */}
                  <div className="space-y-1.5 pb-2 border-b border-slate-800">
                    <button
                      onClick={() => {
                        handleToggleSymmetry();
                        setMobileHeaderDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${
                        symmetryEnabled
                          ? 'bg-amber-400 text-slate-950 shadow-gold-sm border-amber-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <FlipHorizontal className="w-4 h-4 text-amber-400" />
                        <span>Mirror Tool (Symmetry)</span>
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${symmetryEnabled ? 'bg-black/30' : 'bg-slate-900 text-amber-400'}`}>
                        {symmetryEnabled ? 'ACTIVE (ON)' : 'TURN ON'}
                      </span>
                    </button>
                  </div>

                  {/* Bodice Cutting Sheets */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Spawn Cutting Sheets</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        onClick={() => {
                          addCuttingSheet({
                            name: 'Front Bodice Sheet',
                            type: 'bodice_front',
                            width: 360,
                            height: 480,
                            isMirrored: true,
                            color: '#ffffff',
                            opacity: 0.95,
                            hasSeamAllowance: true,
                          });
                          setMobileHeaderDrawerOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-medium flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Front Bodice Sheet</span>
                      </button>
                      <button
                        onClick={() => {
                          addCuttingSheet({
                            name: 'Back Bodice Sheet',
                            type: 'bodice_back',
                            width: 340,
                            height: 460,
                            isMirrored: true,
                            color: '#ffffff',
                            opacity: 0.95,
                            hasSeamAllowance: true,
                          });
                          setMobileHeaderDrawerOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-medium flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Back Bodice Sheet</span>
                      </button>
                      <button
                        onClick={() => {
                          addCuttingSheet({
                            name: 'Sleeve Sheet',
                            type: 'sleeve',
                            width: 280,
                            height: 460,
                            isMirrored: false,
                            color: '#ffffff',
                            opacity: 0.95,
                            hasSeamAllowance: true,
                          });
                          setMobileHeaderDrawerOpen(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-medium flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sleeve Sheet</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTool((curr) => (curr === 'draw_sheet' ? 'chalk' : 'draw_sheet'));
                          setMobileHeaderDrawerOpen(false);
                        }}
                        className={`w-full py-2 px-3 rounded-xl border font-medium flex items-center gap-2 transition-all ${
                          activeTool === 'draw_sheet'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                            : 'bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <Square className="w-3.5 h-3.5 text-amber-400" />
                        <span>Draw Custom Sheet</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTool((curr) => (curr === 'seam_allowance' ? 'chalk' : 'seam_allowance'));
                          setMobileHeaderDrawerOpen(false);
                        }}
                        className={`w-full py-2 px-3 rounded-xl border font-medium flex items-center gap-2 transition-all ${
                          activeTool === 'seam_allowance'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
                            : 'bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-sky-300'
                        }`}
                      >
                        <Scissors className="w-3.5 h-3.5 text-sky-400" />
                        <span>Seam Allowance Tool</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Cutting Sheets Management */}
                  {cuttingSheets.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Cut Sheets ({cuttingSheets.length})
                      </span>
                      <div className="space-y-2">
                        {cuttingSheets.map((sheet) => (
                          <div
                            key={sheet.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              selectedCuttingSheetId === sheet.id
                                ? 'bg-amber-500/10 border-amber-400/40'
                                : 'bg-[#060912] border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-medium text-slate-200 text-xs truncate max-w-[150px]">
                                {sheet.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateCuttingSheet(sheet.id, { isMirrored: !sheet.isMirrored })}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                                    sheet.isMirrored ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                                  }`}
                                  title="Toggle Mirror"
                                >
                                  Mirror {sheet.isMirrored ? 'ON' : 'OFF'}
                                </button>
                                <button
                                  onClick={() => handleUpdateCuttingSheet(sheet.id, { locked: !sheet.locked })}
                                  className={`p-1 rounded text-xs transition-colors ${
                                    sheet.locked ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                                  title="Toggle Lock"
                                >
                                  {sheet.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  handleDuplicateCuttingSheet(sheet.id);
                                  setMobileHeaderDrawerOpen(false);
                                }}
                                className="flex-1 py-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[10px] flex items-center justify-center gap-1 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Duplicate</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleImportSheetToCuttingTable(sheet.id);
                                  setMobileHeaderDrawerOpen(false);
                                }}
                                className="flex-1 py-1 px-2 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-medium text-[10px] flex items-center justify-center gap-1 transition-all"
                              >
                                <Scissors className="w-3 h-3 text-amber-400" />
                                <span>To Cutting</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advanced and Export Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Export & Options</span>
                    <button
                      onClick={() => {
                        setShowAdvancedDrawer(true);
                        setMobileHeaderDrawerOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 font-medium flex items-center gap-2 transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Advanced Tailor Options</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowExportModal(true);
                        setMobileHeaderDrawerOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Pattern (DXF / SVG)</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Cutting Table Controls */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Cutting Table Tools</span>
                    <button
                      onClick={() => {
                        if (bigCuttingTableRef.current?.setShowFabricAdjuster) {
                          bigCuttingTableRef.current.setShowFabricAdjuster((v) => !v);
                        }
                        setMobileHeaderDrawerOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 font-medium flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span>Fabric Width & Yardage</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Toggle Fabric Overlayer Visibility */}
                    <button
                      onClick={() => {
                        if (bigCuttingTableRef.current?.toggleFabricVisibility) {
                          bigCuttingTableRef.current.toggleFabricVisibility();
                        } else {
                          setIsFabricVisible((v) => !v);
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-2">
                        {isFabricVisible ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{isFabricVisible ? 'Hide Fabric Overlayer' : 'Show Fabric Overlayer'}</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-400/90">{isFabricVisible ? 'VISIBLE' : 'HIDDEN'}</span>
                    </button>

                    {/* Fit / Center Table */}
                    <button
                      onClick={() => {
                        bigCuttingTableRef.current?.centerAndFitTable?.();
                        setMobileHeaderDrawerOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium flex items-center gap-2 transition-all"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Center & Fit Rack to Viewport</span>
                    </button>
                  </div>

                  {/* Save to Project Gallery */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        bigCuttingTableRef.current?.handleManualSaveToGallery?.();
                        setMobileHeaderDrawerOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save to Project Gallery</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1B. DESKTOP WORKSPACE HEADER (Pattern Drafting Board & Cutting Table)     */}
      {/* ========================================================================= */}
      <header className="hidden md:flex h-13 px-4 sm:px-6 bg-[#0d1322] border-b border-slate-800/90 items-center justify-between z-40 shrink-0 shadow-md">
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Garment Project Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-gold-sm">
              TX
            </div>
          </div>

          {/* SUB-TABS: Pattern Drafting Board FIRST, Cutting Table SECOND */}
          <div className="flex items-center gap-1.5 bg-[#060912] p-1 rounded-xl border border-slate-800/90 text-xs font-semibold">
            <button
              onClick={() => handleSelectSubTab('drafting')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'drafting'
                  ? 'bg-amber-500 text-slate-950 shadow-gold-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Pattern Drafting Board</span>
            </button>

            <button
              onClick={() => handleSelectSubTab('cutting')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'cutting'
                  ? 'bg-amber-500 text-slate-950 shadow-gold-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cutting Table</span>
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Action Buttons depending on Active Sub-Tab */}
        <div className="flex items-center gap-2">
          {/* DRAFTING BOARD SPECIFIC ACTIONS: BODICE BUTTONS SPAWN CUTTING SHEETS */}
          {activeSubTab === 'drafting' && (
            <div className="flex items-center gap-1 bg-[#060912] border border-amber-500/40 rounded-xl p-1 shadow-xs">
              <button
                onClick={() =>
                  addCuttingSheet({
                    name: 'Front Bodice Sheet',
                    type: 'bodice_front',
                    width: 360,
                    height: 480,
                    isMirrored: true, // Side-by-side mirror view to represent full fabric bodice view
                    color: '#ffffff',
                    opacity: 0.95,
                    hasSeamAllowance: true,
                  })
                }
                className="px-2.5 py-1 text-xs text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg font-bold flex items-center gap-1 transition-all"
                title="Spawn Front Bodice Cutting Sheet: White rectangular sheet aligned on grid for drafting, tracing on fabric, duplicating & full side-by-side mirror view"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Front Bodice</span>
              </button>

              <button
                onClick={() =>
                  addCuttingSheet({
                    name: 'Back Bodice Sheet',
                    type: 'bodice_back',
                    width: 340,
                    height: 460,
                    isMirrored: true,
                    color: '#ffffff',
                    opacity: 0.95,
                    hasSeamAllowance: true,
                  })
                }
                className="px-2.5 py-1 text-xs text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg font-bold flex items-center gap-1 transition-all"
                title="Spawn Back Bodice Cutting Sheet: Customizable white rectangular cutting sheet"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Back Bodice</span>
              </button>

              <button
                onClick={() =>
                  addCuttingSheet({
                    name: 'Sleeve Sheet',
                    type: 'sleeve',
                    width: 280,
                    height: 460,
                    isMirrored: false,
                    color: '#ffffff',
                    opacity: 0.95,
                    hasSeamAllowance: true,
                  })
                }
                className="px-2.5 py-1 text-xs text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg font-bold flex items-center gap-1 transition-all"
                title="Spawn Sleeve Cutting Sheet"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Sleeve</span>
              </button>

              <button
                onClick={() => setActiveTool((curr) => (curr === 'draw_sheet' ? 'chalk' : 'draw_sheet'))}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activeTool === 'draw_sheet'
                    ? 'bg-amber-400 text-slate-950 shadow-gold-sm ring-1 ring-amber-300'
                    : 'text-slate-300 hover:text-amber-400 hover:bg-slate-800'
                }`}
                title="Draw Custom Cutting Sheet: Click and drag across the workspace to draw any square or rectangular sheet"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Draw Sheet</span>
              </button>

              <button
                onClick={() => setActiveTool((curr) => (curr === 'seam_allowance' ? 'chalk' : 'seam_allowance'))}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activeTool === 'seam_allowance'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                    : 'text-sky-300 hover:text-sky-200 hover:bg-slate-800'
                }`}
                title="Seam Allowance Tool: Draw broken lines for seam allowances on patterns and bodice layers"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Seam Allowance</span>
              </button>

              <div className="h-4 w-px bg-slate-800 my-auto mx-0.5" />

              {/* Mirror Tool Button in Desktop Header */}
              <button
                onClick={handleToggleSymmetry}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all border ${
                  symmetryEnabled
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-gold-sm font-black'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-800'
                }`}
                title="Mirror Tool: Symmetrical drawing line from top to bottom of screen"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Mirror Tool</span>
                <span className={`text-[9px] font-mono px-1 rounded ${symmetryEnabled ? 'bg-black/30 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400'}`}>
                  {symmetryEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}

          {/* CUTTING TABLE SPECIFIC ACTIONS IN HEADER */}
          {activeSubTab === 'cutting' && (
            <div className="flex items-center gap-1.5 bg-[#060912] border border-amber-500/40 rounded-xl p-1 shadow-xs">
              {/* Move Fabric Toggle (Requirement: movement of fabric only happens when Move toggle button is turned on at the header section) */}
              <button
                id="header-move-fabric-toggle-btn"
                onClick={() => {
                  if (bigCuttingTableRef.current?.toggleMoveMode) {
                    bigCuttingTableRef.current.toggleMoveMode();
                  } else {
                    setIsFabricMoveEnabled((prev) => !prev);
                  }
                }}
                className={`px-3 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  isFabricMoveEnabled
                    ? 'bg-amber-400 text-slate-950 shadow-gold-sm ring-2 ring-amber-300'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
                title="Toggle Move Tool: When ON, you can freely drag and rotate fabric, cutting sheets, and patterns on the rack. When OFF, objects remain strictly stationary."
              >
                <Move className={`w-3.5 h-3.5 ${isFabricMoveEnabled ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>Move Objects</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono font-black ${
                  isFabricMoveEnabled ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isFabricMoveEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Hide / Show Fabric Toggle (Requirement: green rack is table to cut sheets on, fabric can be hidden) */}
              <button
                id="header-toggle-fabric-visible-btn"
                onClick={() => {
                  if (bigCuttingTableRef.current?.toggleFabricVisibility) {
                    bigCuttingTableRef.current.toggleFabricVisibility();
                  } else {
                    setIsFabricVisible((prev) => !prev);
                  }
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  isFabricVisible
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-400'
                }`}
                title="Toggle Fabric Overlayer: Hide fabric to cut sheets directly on the green rack atelier table"
              >
                {isFabricVisible ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Hide Fabric</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-950" />
                    <span>Green Rack Active</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Undo, Redo, and Layers Section Controls (Active on both Pattern Drafting Board & Cutting Table) */}
          <div className="flex items-center gap-1 bg-[#060912] p-0.5 rounded-xl border border-slate-800/90">
            <button
              onClick={handleUndo}
              disabled={activeSubTab === 'cutting' ? !cuttingCanUndo : undoStack.length === 0}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                (activeSubTab === 'cutting' ? cuttingCanUndo : undoStack.length > 0)
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="Undo recent action (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">Undo</span>
            </button>

            <button
              onClick={handleRedo}
              disabled={activeSubTab === 'cutting' ? !cuttingCanRedo : redoStack.length === 0}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                (activeSubTab === 'cutting' ? cuttingCanRedo : redoStack.length > 0)
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed opacity-40'
              }`}
              title="Redo action (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">Redo</span>
            </button>
          </div>

          {/* Layers Section Icon */}
          <button
            onClick={handleToggleLayersHeader}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              (activeSubTab === 'cutting' ? cuttingShowLayers : showLayerPanel)
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                : 'bg-[#060912] hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Toggle Layers & Pattern Inspector"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Layers</span>
            <span className="text-[10px] text-amber-400/80 font-mono">
              ({activeSubTab === 'cutting' ? (cuttingSheets.length + layers.length) : layers.length})
            </span>
          </button>

          {/* Advanced Tailor Options Drawer Trigger */}
          <button
            onClick={() => setShowAdvancedDrawer(true)}
            className="px-2.5 py-1.5 bg-[#060912] hover:bg-slate-800 border border-slate-800 text-amber-400 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open Advanced Tailor Options (DXF export, node coordinates, exact seam offsets)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Advanced</span>
          </button>

          {/* Workspace Options Drawer Trigger (Drafting / Cutting) */}
          <button
            onClick={() => setMobileHeaderDrawerOpen(true)}
            className="px-2.5 py-1.5 bg-[#060912] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title={activeSubTab === 'drafting' ? 'Open Drafting Options' : 'Open Cutting Table Options'}
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Options</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow-gold-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Notice Banner if imported */}
      {importedNotice && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold py-1.5 px-4 flex items-center justify-between z-40 animate-fadeIn">
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
      {/* 2. MAIN WORKSPACE FRAME (DRAFTING BOARD & BIG CUTTING TABLE)             */}
      {/* ========================================================================= */}
      <div
        className="relative flex-1 w-full h-full overflow-hidden flex flex-col"
        style={{ display: activeSubTab === 'cutting' ? 'flex' : 'none' }}
      >
        <BigCuttingTable
          ref={bigCuttingTableRef}
          layers={layers}
          cuttingSheets={cuttingSheets}
          isFabricMoveEnabled={isFabricMoveEnabled}
          onToggleFabricMove={(val) => {
            if (typeof val === 'boolean') {
              setIsFabricMoveEnabled(val);
            } else if (bigCuttingTableRef.current?.toggleMoveMode) {
              bigCuttingTableRef.current.toggleMoveMode();
            } else {
              setIsFabricMoveEnabled((prev) => !prev);
            }
          }}
          onUpdateCuttingSheet={handleUpdateCuttingSheet}
          onNavigateToDrafting={() => handleSelectSubTab('drafting')}
          onHistoryChange={handleCuttingHistoryChange}
        />
      </div>

      <div
        className="relative flex-1 w-full h-full overflow-hidden"
        style={{ display: activeSubTab === 'drafting' ? 'block' : 'none' }}
      >
        {/* ======================================================================= */}
        {/* SKETCHBOOK TOOLS SIDEBAR (Collapsible Floating Panel)                   */}
        {/* ======================================================================= */}
        {isToolsCollapsed ? (
          <div className="absolute top-4 left-4 z-50 bg-[#0d1322]/95 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl w-13 max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar text-slate-100 flex flex-col items-center gap-2">
            <button
              onClick={() => setIsToolsCollapsed(false)}
              className="p-2 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-xl transition-all"
              title="Expand Tools Panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="w-full h-px bg-slate-800/80 my-0.5" />

            {/* Quick tool icons in collapsed mode */}
            <button
              onClick={() => setActiveTool('pen')}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'pen' ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Tech Pen"
            >
              <PenTool className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTool('chalk')}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'chalk' ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Tailor Chalk"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTool('scissors')}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'scissors' ? 'bg-rose-500 text-white font-black shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'text-rose-400 hover:bg-slate-800'
              }`}
              title="Scissors ✂️ (Infrared Laser Guide)"
            >
              <Scissors className="w-4 h-4" />
            </button>

            <button
              onClick={activateDartMarkerTool}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'dart_marker' ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Dart Marker (Spawns Dedicated Layer & Concave Lens Reticle)"
            >
              <Target className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTool('tape_measure')}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'tape_measure' ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Tape Measure Tool"
            >
              <Ruler className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTool('draw_sheet')}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'draw_sheet' ? 'bg-amber-400 text-slate-950 font-bold shadow-gold-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Draw Custom Cutting Sheet"
            >
              <Square className="w-4 h-4" />
            </button>

            {/* Mirror Tool Button (Collapsed Rail) */}
            <button
              onClick={handleToggleSymmetry}
              className={`p-2 rounded-xl text-xs transition-all ${
                symmetryEnabled
                  ? 'bg-amber-400 text-slate-950 font-black shadow-gold-sm ring-1 ring-amber-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Mirror Tool: Symmetrical drawing from top to bottom of screen"
            >
              <FlipHorizontal className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={activateSeamAllowanceTool}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'seam_allowance' ? 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.4)]' : 'text-sky-400 hover:bg-slate-800'
              }`}
              title="Broken Seam Allowance Lines 5/8&quot; (Spawns Dedicated Layer & Concave Lens HUD)"
            >
              <Scissors className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTool('piece_move')}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'piece_move' ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Piece Move Tool"
            >
              <Move className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'eraser' ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Eraser (Surgical Focus Loupe)"
            >
              <Eraser className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (activeTool === 'magnifier') {
                  setActiveTool('pen');
                  setLensState(null);
                } else {
                  setActiveTool('magnifier');
                  setLensState({
                    visible: true,
                    x: cursorPos.x ? (cursorPos.x - panOffset.x) / zoom : 500,
                    y: cursorPos.y ? (cursorPos.y - panOffset.y) / zoom : 400,
                    screenX: cursorPos.x || 500,
                    screenY: cursorPos.y || 400,
                    tool: 'magnifier',
                    label: '2.5x Focus Loupe',
                  });
                }
              }}
              className={`p-2 rounded-xl text-xs transition-all ${
                activeTool === 'magnifier' ? 'bg-amber-400 text-slate-950 font-bold shadow-gold-sm' : 'text-amber-400/80 hover:bg-slate-800 hover:text-amber-300'
              }`}
              title="Precision Loupe (2x/3x Focus Magnifying Glass with Reticle & Dynamic Zoom)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-full h-px bg-slate-800 my-1" />

            {/* Collapsed Drawer Trigger */}
            <button
              onClick={() => setIsToolboxDrawerOpen(true)}
              className="p-2 rounded-xl text-xs transition-all text-amber-400 hover:bg-slate-800 hover:text-amber-300 relative"
              title="Tailor's 8-Ruler Drafting Toolbox (Autodesk Sketchbook)"
            >
              <Compass className="w-4 h-4" />
              {activeRulers.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        ) : (
          <div className="absolute top-4 left-4 z-50 bg-[#0d1322]/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl w-56 sm:w-60 max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar text-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                Sketchbook Tools
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {activeTool === 'scissors' ? 'Scissors ✂️' : activeTool === 'tape_measure' ? 'Tape Measure' : activeTool.toUpperCase()}
                </span>
                <button
                  onClick={() => setIsToolsCollapsed(true)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all"
                  title="Collapse Tools Panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Prominent Drafting Toolbox Drawer Action */}
            <button
              onClick={() => setIsToolboxDrawerOpen(true)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-transparent border border-amber-500/50 text-amber-300 hover:bg-amber-500/25 shadow-gold-sm group"
              title="Open Tailor's Drafting Toolbox (8 physical rulers with edge vector snapping)"
            >
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                <span>Drafting Tools Drawer</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                {activeRulers.length > 0 ? `${activeRulers.length} Active` : '8 Rulers'}
              </span>
            </button>

            {/* Quick Edge Snapping Magnet Control */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Magnet className={`w-3.5 h-3.5 ${snappingEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
                <span>Edge Snapping</span>
              </span>
              <button
                onClick={() => setSnappingEnabled(!snappingEnabled)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all ${
                  snappingEnabled ? 'bg-amber-500 text-slate-950 shadow-gold-sm' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {snappingEnabled ? 'MAGNETIC' : 'OFF'}
              </button>
            </div>

            {/* Mirror Tool (Symmetry) - Prominently at the top of Sketchbook Tools */}
            <div className="space-y-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/40">
              <button
                onClick={handleToggleSymmetry}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all border ${
                  symmetryEnabled
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-gold-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Mirror Tool: Symmetrical drawing line from top to bottom of screen"
              >
                <span className="flex items-center gap-1.5">
                  <FlipHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mirror Tool (Symmetry)</span>
                </span>
                <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${symmetryEnabled ? 'bg-slate-900 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                  {symmetryEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Moveable Mirror Position Controls */}
              {symmetryEnabled && (
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      <span>Axis Position</span>
                    </span>
                    <span className="font-mono font-bold text-amber-300 bg-slate-900/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                      X: {symmetryAxisX}px
                    </span>
                  </div>

                  {/* Free Position Slider */}
                  <input
                    type="range"
                    min="50"
                    max="2500"
                    step="5"
                    value={symmetryAxisX}
                    onChange={(e) => setSymmetryAxisX(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-amber-400"
                    title="Slide to move mirror axis freely across workspace"
                  />

                  {/* Fine Nudge Directional Buttons */}
                  <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                    <button
                      onClick={() => setSymmetryAxisX((x) => Math.max(20, x - 50))}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-all text-center"
                      title="Shift Left 50px"
                    >
                      -50px
                    </button>
                    <button
                      onClick={() => setSymmetryAxisX((x) => Math.max(20, x - 10))}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-all text-center"
                      title="Shift Left 10px"
                    >
                      -10px
                    </button>
                    <button
                      onClick={() => setSymmetryAxisX((x) => Math.min(3800, x + 10))}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-all text-center"
                      title="Shift Right 10px"
                    >
                      +10px
                    </button>
                    <button
                      onClick={() => setSymmetryAxisX((x) => Math.min(3800, x + 50))}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-all text-center"
                      title="Shift Right 50px"
                    >
                      +50px
                    </button>
                  </div>

                  {/* Quick Alignment Presets */}
                  <div className="flex items-center gap-1 pt-1 border-t border-amber-500/20">
                    <button
                      onClick={() => {
                        const centerX = Math.round((-panOffset.x + (typeof window !== 'undefined' ? window.innerWidth / 2 : 500)) / zoom);
                        setSymmetryAxisX(Math.max(20, centerX));
                      }}
                      className="flex-1 py-1 text-center text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 rounded transition-all truncate px-1"
                      title="Align mirror axis to center of current view"
                    >
                      Center Screen
                    </button>
                    {cuttingSheets.length > 0 && (
                      <button
                        onClick={() => {
                          const targetSheet = cuttingSheets.find((s) => s.id === selectedCuttingSheetId) || cuttingSheets[0];
                          if (targetSheet) {
                            setSymmetryAxisX(Math.round(targetSheet.x + targetSheet.width / 2));
                          }
                        }}
                        className="flex-1 py-1 text-center text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 rounded transition-all truncate px-1"
                        title="Align mirror axis to center of active cutting sheet"
                      >
                        Sheet Center
                      </button>
                    )}
                    <button
                      onClick={() => setSymmetryAxisX(500)}
                      className="py-1 px-1.5 text-center text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition-all"
                      title="Reset mirror axis to default (500px)"
                    >
                      500px
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tool Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* Pen (Free handwriting tool with color selection) */}
              <button
                onClick={() => setActiveTool('pen')}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'pen'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
                title="Pen: Free handwriting on the drafting board or cut sheet with smooth flow & color selection"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Pen</span>
              </button>

              {/* Tailor Chalk */}
              <button
                onClick={() => setActiveTool('chalk')}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'chalk'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
                title="Tailor Chalk: Freehand textured drafting chalk (decimate = 14 line smoothing)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chalk</span>
              </button>

              {/* Scissors ✂️ with explicit icon & laser guide */}
              <button
                onClick={() => setActiveTool('scissors')}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium col-span-2 ${
                  activeTool === 'scissors'
                    ? 'bg-rose-500 text-white font-black shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-rose-300'
                }`}
                title="Scissors ✂️: Precision cutting tool with glowing infrared laser trajectory guide"
              >
                <Scissors className="w-4 h-4" />
                <span className="font-bold">Scissors ✂️ (Laser Guide)</span>
              </button>

              {/* Dart Marker */}
              <button
                onClick={activateDartMarkerTool}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'dart_marker'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
                title="Dart Marker: Creates dedicated layer, displays concave optical lens reticle"
              >
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Dart Marker</span>
              </button>

              {/* Tape Measure Tool */}
              <button
                onClick={() => setActiveTool('tape_measure')}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'tape_measure'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
                title="Tape Measure: Click start & end points to measure distance in inches & cm"
              >
                <Ruler className="w-3.5 h-3.5 text-amber-400" />
                <span>Tape Measure</span>
              </button>

              {/* Draw Custom Sheet */}
              <button
                onClick={() => setActiveTool('draw_sheet')}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'draw_sheet'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-gold-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
                title="Draw Custom Cutting Sheet: Click and drag across the workspace to draw any square or rectangular sheet"
              >
                <Square className="w-3.5 h-3.5 text-amber-400" />
                <span>Draw Sheet</span>
              </button>

              {/* Seam Allowance (Broken Lines) */}
              <button
                onClick={activateSeamAllowanceTool}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'seam_allowance'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-sky-300'
                }`}
                title="Seam Allowance: Creates dedicated layer, draws broken dashed lines with steady stroke and concave lens"
              >
                <Scissors className="w-3.5 h-3.5 text-sky-400" />
                <span>Seam Allow.</span>
              </button>

              {/* Piece Move */}
              <button
                onClick={() => setActiveTool('piece_move')}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'piece_move'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
                title="Piece Move: Drag and position active layer or cutting table bodice"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Piece Move</span>
              </button>

              {/* Eraser */}
              <button
                onClick={() => setActiveTool('eraser')}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'eraser'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-gold-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                }`}
                title="Eraser: Remove strokes with surgical 2.5x focus loupe"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Eraser</span>
              </button>

              {/* Precision Loupe / Magnifying Glass */}
              <button
                onClick={() => {
                  if (activeTool === 'magnifier') {
                    setActiveTool('pen');
                    setLensState(null);
                  } else {
                    setActiveTool('magnifier');
                    setLensState({
                      visible: true,
                      x: cursorPos.x ? (cursorPos.x - panOffset.x) / zoom : 500,
                      y: cursorPos.y ? (cursorPos.y - panOffset.y) / zoom : 400,
                      screenX: cursorPos.x || 500,
                      screenY: cursorPos.y || 400,
                      tool: 'magnifier',
                      label: '2.5x Focus Loupe',
                    });
                  }
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all font-medium ${
                  activeTool === 'magnifier'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-gold-sm'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-amber-300'
                }`}
                title="Precision Loupe: 2x/3x Focus Magnifier with Reticle & Dynamic Zoom anywhere on canvas"
              >
                <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Focus Loupe</span>
              </button>
            </div>

            {/* Tape Measure Active Readout */}
            {tapeMeasure.start && tapeMeasure.end && (
              <div className="p-2 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    Measurement:
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {(Math.hypot(tapeMeasure.end.x - tapeMeasure.start.x, tapeMeasure.end.y - tapeMeasure.start.y) / 20).toFixed(1)}" (
                    {((Math.hypot(tapeMeasure.end.x - tapeMeasure.start.x, tapeMeasure.end.y - tapeMeasure.start.y) / 20) * 2.54).toFixed(1)} cm)
                  </span>
                </div>
                <button
                  onClick={() => setTapeMeasure({ start: null, end: null, active: false, savedDist: null })}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Guiding Instruments & Drawing Engines (Autodesk Sketchbook Precision Suite) */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase block mb-1 flex items-center justify-between">
                <span>Precision Drafting Engines</span>
                <span className="text-[9px] text-slate-500 font-mono">Sketchbook HUD</span>
              </span>

              {/* STEADY STROKE ENGINE (Autodesk Sketchbook Weighted Moving Average Algorithm) */}
              <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Steady Stroke</span>
                  </div>
                  <button
                    onClick={() => setSteadyStrokeEnabled(!steadyStrokeEnabled)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      steadyStrokeEnabled
                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_#f59e0b]'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {steadyStrokeEnabled ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 leading-tight">
                  Weighted moving average tether eliminates hand tremor on curves.
                </div>

                {/* 5-Level Steady Stroke Selector */}
                {steadyStrokeEnabled && (
                  <div className="space-y-1 pt-1 border-t border-amber-500/20">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 font-medium">Stabilization Radius:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {STEADY_STROKE_LEVELS[steadyStrokeLevel]?.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setSteadyStrokeLevel(lvl)}
                          className={`py-1 rounded text-[10px] font-bold font-mono transition-all ${
                            steadyStrokeLevel === lvl
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                          }`}
                          title={STEADY_STROKE_LEVELS[lvl].name + ': ' + STEADY_STROKE_LEVELS[lvl].label}
                        >
                          L{lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 8-PIECE TAILOR'S RULER TOOLBOX DRAWER BUTTON */}
              <div className="space-y-1.5">
                <button
                  onClick={() => setIsToolboxDrawerOpen(true)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 shadow-sm"
                  title="Open the 8-Piece Tailor's Ruler Toolbox Drawer"
                >
                  <span className="flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-sky-400" />
                    <span>8-Ruler Toolbox Drawer</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                    {activeRulers.length} Active
                  </span>
                </button>

                {/* Magnetic Edge Snapping Toggle */}
                <button
                  onClick={() => setSnappingEnabled(!snappingEnabled)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all border ${
                    snappingEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Automatically snap chalk & pen strokes to active ruler vector edges"
                >
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Magnetic Edge Snapping</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800">
                    {snappingEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Clear All Rulers if active */}
                {activeRulers.length > 0 && (
                  <button
                    onClick={handleClearAllRulers}
                    className="w-full py-1 text-center text-[10px] font-bold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-all"
                  >
                    Clear All Active Rulers ({activeRulers.length})
                  </button>
                )}
              </div>
            </div>

            {/* Color Palette */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1.5">
                Pen & Chalk Color
              </span>
              <div className="flex items-center gap-1.5">
                {SKETCH_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setBrushColor(c.hex)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      brushColor === c.hex ? 'border-amber-400 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Brush Size Slider */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>STROKE WIDTH</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* COMPACT FLOATING LAYER PANEL (Autodesk Sketchbook Style)                */}
        {/* ======================================================================= */}
        {showLayerPanel && (
          <div className="absolute top-4 right-4 z-50 bg-[#0d1322]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl w-84 max-w-[92vw] max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar text-slate-100 flex flex-col gap-3">
            {/* Header with bold uppercase styling and explicit close button */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Pattern Layers & Bodices</span>
                <span className="text-[10px] text-slate-400 font-mono">({layers.length})</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => addLayer()}
                  className="p-1.5 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded-lg transition-all"
                  title="Add New Pattern Layer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowLayerPanel(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
                  title="Close Layer Panel (Reclaim Canvas Space)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Bodice Grouping Shortcuts */}
            <div className="flex items-center gap-1 pb-1">
              <button
                onClick={() => addLayer('Front Bodice')}
                className="flex-1 py-1 px-1.5 bg-slate-800/80 hover:bg-slate-800 hover:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-lg text-slate-300 transition-all border border-slate-700/50 text-center truncate"
                title="Add Front Bodice layer"
              >
                + Front
              </button>
              <button
                onClick={() => addLayer('Back Bodice')}
                className="flex-1 py-1 px-1.5 bg-slate-800/80 hover:bg-slate-800 hover:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-lg text-slate-300 transition-all border border-slate-700/50 text-center truncate"
                title="Add Back Bodice layer"
              >
                + Back
              </button>
              <button
                onClick={() => addLayer('Sleeve Panel')}
                className="flex-1 py-1 px-1.5 bg-slate-800/80 hover:bg-slate-800 hover:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-lg text-slate-300 transition-all border border-slate-700/50 text-center truncate"
                title="Add Sleeve layer"
              >
                + Sleeve
              </button>
            </div>

            {/* Multi-Selection & Layer Merging Toolbar */}
            {layers.length > 1 && (
              <div className="flex items-center justify-between px-1 py-1 bg-slate-900/60 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={handleSelectAllForMerge}
                  className="text-slate-400 hover:text-slate-200 font-medium"
                >
                  {selectedLayerIdsForMerge.length === layers.length ? 'Deselect All' : 'Select for Merge'}
                </button>
                {selectedLayerIdsForMerge.length >= 2 ? (
                  <button
                    onClick={handleStartMerge}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-gold-sm transition-all"
                    title="Merge selected layers into a single vector group"
                  >
                    <span>⧉ Merge Selected ({selectedLayerIdsForMerge.length})</span>
                  </button>
                ) : (
                  <span className="text-slate-500 font-mono">
                    {selectedLayerIdsForMerge.length > 0 ? `${selectedLayerIdsForMerge.length} selected` : 'Check boxes to merge'}
                  </span>
                )}
              </div>
            )}

            {/* Layer Stack Items */}
            <div className="space-y-2 pr-1">
              {layers.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center space-y-2 bg-slate-900/30">
                  <div className="text-xs font-bold text-slate-300">Drafting Board is Blank</div>
                  <div className="text-[11px] text-slate-500 leading-snug">
                    Draw with chalk/pen or use an 8-ruler to auto-create Layer 1, or click "+ Front / + Back" above.
                  </div>
                  <button
                    onClick={() => addLayer('Layer 1')}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow"
                  >
                    + Create Layer 1
                  </button>
                </div>
              ) : (
                layers.map((layer, index) => {
                  const isActive = activeLayerId === layer.id;
                  const isEditing = editingLayerId === layer.id;
                  const isSelectedForMerge = selectedLayerIdsForMerge.includes(layer.id);
                  const isSheetLayer = Boolean(
                    layer.sheetId ||
                    cuttingSheets.some(
                      (s) => s.layerId === layer.id || s.id === layer.sheetId || `layer_sheet_${s.id}` === layer.id
                    )
                  );
                  const isExpanded = Boolean(expandedSheetLayerIds[layer.id]);
                  const layerElements = layer.elements || [];

                  return (
                    <div key={layer.id} className="space-y-1">
                      <div
                        onClick={() => setActiveLayerId(layer.id)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                          isActive
                            ? 'bg-amber-500/12 border-amber-500 text-amber-300 font-semibold shadow-gold-sm'
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                          {/* Sub-Layer Expand / Collapse Toggle for any layer with elements */}
                          {layerElements.length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandSheetLayer(layer.id);
                              }}
                              className="p-1 hover:bg-slate-700/80 rounded text-amber-400 shrink-0 transition-transform"
                              title={isExpanded ? 'Collapse Sub-layers' : `Expand Sub-layers (${layerElements.length} lines/strokes)`}
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <span className="w-2" />
                          )}

                          {/* Marked Checkbox: Moves layer collectively with all sub-layers */}
                          <input
                            type="checkbox"
                            checked={isSelectedForMerge}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectLayerForMerge(layer.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer shrink-0"
                            title="Mark box: moves this layer collectively with all its sub-layers, or merges layers"
                          />

                          {/* Active indicator dot */}
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isActive ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-700'
                            }`}
                          />

                          {/* Inline Rename or Name Display */}
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingLayerName}
                              onChange={(e) => setEditingLayerName(e.target.value)}
                              onBlur={saveRenameLayer}
                              onKeyDown={(e) => e.key === 'Enter' && saveRenameLayer()}
                              autoFocus
                              className="bg-slate-900 border border-amber-400 px-1.5 py-0.5 rounded text-xs text-amber-300 focus:outline-none w-full font-bold"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span
                                  onDoubleClick={() => startRenameLayer(layer)}
                                  className="truncate text-xs font-bold text-slate-200 block"
                                  title="Double-click to rename layer"
                                >
                                  {layer.name}
                                </span>
                                {isSelectedForMerge && (
                                  <span className="text-[8px] font-mono px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-semibold tracking-wider">
                                    COLLECTIVE
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/90 block">
                                {(() => {
                                  const matchingSheet = cuttingSheets.find(
                                    (s) => s.layerId === layer.id || s.id === layer.sheetId || `layer_sheet_${s.id}` === layer.id
                                  );
                                  if (matchingSheet) {
                                    return `Sheet: ${matchingSheet.name || 'Cut Sheet'} • (${layerElements.length} elements)`;
                                  }
                                  if (layer.isGroup) {
                                    return `Merged Group (${layer.mergedCount} layers)`;
                                  }
                                  return `Root Canvas • ${layer.bodiceType || 'Vector'} (${layerElements.length} elements)`;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Layer Controls: Reorder, Move, Visibility, Lock, Delete */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          {/* Reorder Up */}
                          {index > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayerOrder(layer.id, 'up');
                              }}
                              className="p-1 hover:text-slate-200 text-slate-500 rounded"
                              title="Move Layer Up"
                            >
                              ▲
                            </button>
                          )}
                          {/* Reorder Down */}
                          {index < layers.length - 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayerOrder(layer.id, 'down');
                              }}
                              className="p-1 hover:text-slate-200 text-slate-500 rounded"
                              title="Move Layer Down"
                            >
                              ▼
                            </button>
                          )}

                          {/* Collective Layer Move Shortcut */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLayerId(layer.id);
                              setSelectedElementId(null);
                              if (!selectedLayerIdsForMerge.includes(layer.id)) {
                                setSelectedLayerIdsForMerge([layer.id]);
                              }
                              setActiveTool('piece_move');
                            }}
                            className="p-1 hover:text-amber-300 text-slate-400 rounded"
                            title="Move this Layer collectively with all sub-layers (Move Tool)"
                          >
                            <Move className="w-3.5 h-3.5" />
                          </button>

                          {/* Rotate Layer Shortcut */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLayerId(layer.id);
                              setLayers((prev) =>
                                prev.map((l) =>
                                  l.id === layer.id
                                    ? { ...l, rotation: ((l.rotation || 0) + 15) % 360 }
                                    : l
                                )
                              );
                            }}
                            className="p-1 hover:text-amber-300 text-slate-400 rounded"
                            title="Rotate this Layer (+15°)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Broken Seam Allowance Outline */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddSeamAllowanceToLayer(layer.id);
                            }}
                            className="p-1 hover:text-sky-300 text-sky-400/80 rounded"
                            title="Add 5/8&quot; Broken Line Seam Allowance to this layer"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Visibility */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerVisibility(layer.id);
                            }}
                            className="p-1 hover:text-slate-200 text-slate-400 rounded"
                            title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                          >
                            {layer.visible ? (
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </button>

                          {/* Toggle Lock */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerLock(layer.id);
                            }}
                            className="p-1 hover:text-slate-200 text-slate-400 rounded"
                            title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                          >
                            {layer.locked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </button>

                          {/* Delete Layer */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLayer(layer.id);
                            }}
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded"
                            title="Delete Layer (Automatically removes linked sheet from board)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* SUB-LAYERS: Individual Lines & Shapes drawn on the board or sheet */}
                      {isExpanded && (
                        <div className="ml-5 pl-2 border-l-2 border-amber-500/30 space-y-1 py-1">
                          {layerElements.length === 0 ? (
                            <div className="text-[10px] text-slate-500 italic py-1 px-2">
                              No lines drawn on this layer yet. Use ruler, curve, or pen to draft.
                            </div>
                          ) : (
                            layerElements.map((el, elIdx) => {
                              const isElSelected = selectedElementId === el.id;
                              const isElLocked = isElementPositionLocked(el);
                              const lastActivity = el.lastMovedAt || el.createdAt || 0;
                              const elapsedSec = Math.floor((Date.now() - lastActivity) / 1000);
                              const remainingSec = el.unlockedUntil && el.unlockedUntil > Date.now()
                                ? Math.ceil((el.unlockedUntil - Date.now()) / 1000)
                                : Math.max(0, 10 - elapsedSec);

                              const lineName =
                                el.label ||
                                (el.rulerName ? `Snapped: ${el.rulerName}` : el.tool === 'dart_marker' ? 'Dart Marker' : el.isRulerLine ? `Ruler Line ${elIdx + 1}` : `Line ${elIdx + 1}`);

                              return (
                                <div
                                  key={el.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isElLocked) {
                                      // Position locked after 10s: still selectable for inspect/erase, but movement is regulated
                                      setSelectedElementId(isElSelected ? null : el.id);
                                    } else {
                                      setSelectedElementId(isElSelected ? null : el.id);
                                      setActiveLayerId(layer.id);
                                      if (!isElSelected) setActiveTool('piece_move');
                                    }
                                  }}
                                  className={`flex items-center justify-between p-1.5 rounded-lg text-[11px] transition-all cursor-pointer border ${
                                    isElSelected
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold shadow-xs'
                                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-700"
                                      style={{ backgroundColor: el.color || '#facc15' }}
                                    />
                                    <span className="truncate font-medium">{lineName}</span>

                                    {/* Sub-layer Auto-Lock Status Badge */}
                                    {isElLocked ? (
                                      <span
                                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/80 flex items-center gap-0.5 shrink-0"
                                        title="Auto-locked after 10s non-use to prevent accidental line shifting. Erasable via Eraser tool or trash icon."
                                      >
                                        <Lock className="w-2.5 h-2.5 text-amber-400/90" />
                                        <span>Locked</span>
                                      </span>
                                    ) : (
                                      <span
                                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5 shrink-0"
                                        title={`Movable for ${remainingSec}s before position auto-locks.`}
                                      >
                                        <Unlock className="w-2.5 h-2.5 text-emerald-400" />
                                        <span>{remainingSec}s</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {/* Toggle Sub-Layer Lock/Unlock Button */}
                                    <button
                                      onClick={() => handleToggleElementLock(layer.id, el.id)}
                                      className={`p-1 rounded transition-colors ${
                                        isElLocked
                                          ? 'hover:text-amber-300 text-amber-400/80 hover:bg-slate-800'
                                          : 'hover:text-emerald-300 text-emerald-400 hover:bg-slate-800'
                                      }`}
                                      title={
                                        isElLocked
                                          ? 'Click to unlock position for 10 seconds of adjustment'
                                          : 'Click to lock position now'
                                      }
                                    >
                                      {isElLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                    </button>

                                    {/* Nudge Line Movement Controls (active only when position is unlocked) */}
                                    <button
                                      onClick={() => handleNudgeElement(layer.id, el.id, -5, 0)}
                                      disabled={isElLocked}
                                      className={`p-1 rounded ${
                                        isElLocked
                                          ? 'text-slate-600 cursor-not-allowed'
                                          : 'hover:text-amber-300 text-slate-400'
                                      }`}
                                      title={isElLocked ? 'Sub-layer position locked (10s elapsed)' : 'Nudge Line Left 5px'}
                                    >
                                      <ArrowLeft className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => handleNudgeElement(layer.id, el.id, 5, 0)}
                                      disabled={isElLocked}
                                      className={`p-1 rounded ${
                                        isElLocked
                                          ? 'text-slate-600 cursor-not-allowed'
                                          : 'hover:text-amber-300 text-slate-400'
                                      }`}
                                      title={isElLocked ? 'Sub-layer position locked (10s elapsed)' : 'Nudge Line Right 5px'}
                                    >
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => handleNudgeElement(layer.id, el.id, 0, -5)}
                                      disabled={isElLocked}
                                      className={`p-1 rounded ${
                                        isElLocked
                                          ? 'text-slate-600 cursor-not-allowed'
                                          : 'hover:text-amber-300 text-slate-400'
                                      }`}
                                      title={isElLocked ? 'Sub-layer position locked (10s elapsed)' : 'Nudge Line Up 5px'}
                                    >
                                      <ArrowUp className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => handleNudgeElement(layer.id, el.id, 0, 5)}
                                      disabled={isElLocked}
                                      className={`p-1 rounded ${
                                        isElLocked
                                          ? 'text-slate-600 cursor-not-allowed'
                                          : 'hover:text-amber-300 text-slate-400'
                                      }`}
                                      title={isElLocked ? 'Sub-layer position locked (10s elapsed)' : 'Nudge Line Down 5px'}
                                    >
                                      <ArrowDown className="w-2.5 h-2.5" />
                                    </button>

                                    {/* Line Visibility Icon */}
                                    <button
                                      onClick={() => toggleElementVisibility(layer.id, el.id)}
                                      className="p-1 hover:text-slate-200 text-slate-400 rounded"
                                      title={el.visible !== false ? 'Hide Line' : 'Show Line'}
                                    >
                                      {el.visible !== false ? (
                                        <Eye className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <EyeOff className="w-3 h-3 text-slate-600" />
                                      )}
                                    </button>

                                    {/* Merge Sub-Layer Button */}
                                    <button
                                      onClick={() => handleMergeSubLayer(layer.id, el.id)}
                                      className="p-1 hover:text-amber-300 text-slate-400 hover:bg-slate-800 rounded transition-colors"
                                      title="Merge this sub-layer line with adjacent stroke"
                                    >
                                      <GitMerge className="w-3 h-3" />
                                    </button>

                                    {/* Delete / Erase Individual Line (Always allowed per user specification) */}
                                    <button
                                      onClick={() => deleteElement(layer.id, el.id)}
                                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded"
                                      title="Erase / Delete This Sub-Layer Line"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Active Layer Info Bar */}
            {activeLayer && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-bold text-slate-300 truncate max-w-[170px]">
                  ACTIVE: {activeLayer.name}
                </span>
                <span className="font-mono text-amber-400/90">{activeLayer.elements?.length || 0} strokes</span>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* LAYER MERGING & GROUP NAMING MODAL (Autodesk Sketchbook / Fabric Group)  */}
        {/* ======================================================================= */}
        {showMergeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#0d1322] border border-amber-500/50 rounded-2xl shadow-2xl p-5 w-full max-w-md text-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Layers className="w-4 h-4" />
                  <span>Merge {selectedLayerIdsForMerge.length} Selected Layers</span>
                </div>
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed">
                Merging combines all vector chalk, ink strokes, and seam lines from the selected layers into a single, unified layer group.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-400 block">
                  Group Layer Name:
                </label>
                <input
                  type="text"
                  value={mergeGroupName}
                  onChange={(e) => setMergeGroupName(e.target.value)}
                  placeholder="e.g. Front Bodice + Dart Group"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmMerge()}
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Layers to be consolidated:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {layers
                    .filter((l) => selectedLayerIdsForMerge.includes(l.id))
                    .map((l) => (
                      <span
                        key={l.id}
                        className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]"
                      >
                        {l.name} ({l.elements?.length || 0} strokes)
                      </span>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmMerge()}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-gold-sm"
                >
                  Merge Layers
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* VIEWPORT CANVAS (DRAFTING BOARD OR CUTTING TABLE)                       */}
        {/* ======================================================================= */}
        <div
          ref={containerRef}
          className="w-full h-full relative cursor-crosshair overflow-hidden touch-none select-none"
          style={{ touchAction: 'none' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          {/* CUTTING TABLE: Fabric Background Layer */}
          {activeSubTab === 'cutting' && (
            <div
              className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
              style={{
                backgroundImage: fabricTexture ? `url(${fabricTexture})` : activeFabricPreset.textureCss,
                backgroundSize: fabricTexture ? 'cover' : activeFabricPreset.textureSize || 'auto',
                backgroundColor: activeFabricPreset.baseColor,
                opacity: 0.92,
              }}
            >
              {/* Fabric Direction Line & Dimension Watermark */}
              <div className="absolute top-4 left-64 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                  Fabric Grainline:
                </span>
                <span className="font-mono text-[11px] text-slate-200">
                  {fabricWidthInches}" Width • {fabricLengthYards} Yards Length
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Warp Thread
                </span>
              </div>
            </div>
          )}

          {/* FULL SCREEN INFINITE DRAFTING GRID (Covers 100% of Viewport on Mobile & Desktop) */}
          {activeSubTab === 'drafting' && (
            <svg
              className="w-full h-full absolute inset-0 z-0 pointer-events-none"
              style={{ width: '100%', height: '100%' }}
            >
              <defs>
                <pattern
                  id="fullscreenDraftingGridSmall"
                  width={20 * zoom}
                  height={20 * zoom}
                  patternUnits="userSpaceOnUse"
                  patternTransform={`translate(${panOffset.x}, ${panOffset.y})`}
                >
                  <path d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`} fill="none" stroke="#1e293b" strokeWidth="0.75" />
                </pattern>
                <pattern
                  id="fullscreenDraftingGridMajor"
                  width={100 * zoom}
                  height={100 * zoom}
                  patternUnits="userSpaceOnUse"
                  patternTransform={`translate(${panOffset.x}, ${panOffset.y})`}
                >
                  <rect width={100 * zoom} height={100 * zoom} fill="url(#fullscreenDraftingGridSmall)" />
                  <path d={`M ${100 * zoom} 0 L 0 0 0 ${100 * zoom}`} fill="none" stroke="#334155" strokeWidth="1.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#fullscreenDraftingGridMajor)" />
            </svg>
          )}

          {/* SVG Vector Drawing & Bodice Placement Plane */}
          <svg
            ref={canvasSvgRef}
            className="w-full h-full absolute inset-0 z-10"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              overflow: 'visible',
            }}
          >
            {/* PLAIN CUTTING SHEETS CANVAS PLANE (Solid Color, Strictly NO Grid Lines, Direct Drawing Surface) */}
            {activeSubTab === 'drafting' &&
              cuttingSheets.map((sheet) => {
                const isSelected = selectedCuttingSheetId === sheet.id;
                const effW = sheet.isMirrored ? sheet.width * 2 : sheet.width;
                const effH = sheet.height;

                return (
                  <g
                    key={sheet.id}
                    id={`cutting-sheet-surface-${sheet.id}`}
                    onClick={(e) => {
                      if (activeTool === 'piece_move' || activeTool === 'select') {
                        e.stopPropagation();
                        setSelectedCuttingSheetId(sheet.id);
                        if (sheet.layerId) setActiveLayerId(sheet.layerId);
                      }
                    }}
                  >
                    {/* Soft Drop Shadow beneath cutting sheet */}
                    <rect
                      x={sheet.x + 3}
                      y={sheet.y + 4}
                      width={effW}
                      height={effH}
                      rx="8"
                      fill="#000000"
                      fillOpacity="0.4"
                    />

                    {/* 100% PLAIN Solid Fabric / Drafting Paper Surface - No Grid Lines */}
                    <rect
                      x={sheet.x}
                      y={sheet.y}
                      width={effW}
                      height={effH}
                      rx="6"
                      fill={sheet.color || '#ffffff'}
                      fillOpacity={sheet.opacity ?? 0.98}
                      stroke={isSelected ? '#f59e0b' : '#64748b'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />

                    {/* Center Fold / Grainline if Mirrored */}
                    {sheet.isMirrored && (
                      <g>
                        <line
                          x1={sheet.x + effW / 2}
                          y1={sheet.y}
                          x2={sheet.x + effW / 2}
                          y2={sheet.y + effH}
                          stroke="#0284c7"
                          strokeWidth="1.75"
                          strokeDasharray="6 4"
                        />
                        <text
                          x={sheet.x + effW / 2}
                          y={sheet.y + 16}
                          fill="#0369a1"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          CENTER FOLD / WARP GRAINLINE
                        </text>
                      </g>
                    )}

                    {/* Broken Dashed Seam Allowance Outline */}
                    {sheet.hasSeamAllowance && (
                      <g>
                        <rect
                          x={sheet.x + 12}
                          y={sheet.y + 12}
                          width={Math.max(20, effW - 24)}
                          height={Math.max(20, effH - 24)}
                          rx="4"
                          fill="none"
                          stroke="#d97706"
                          strokeWidth="1.5"
                          strokeDasharray="6 4"
                        />
                        <text
                          x={sheet.x + effW - 14}
                          y={sheet.y + 22}
                          fill="#b45309"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          {sheet.seamAllowanceInches || 0.625}&quot; SEAM ALLOWANCE
                        </text>
                      </g>
                    )}

                    {/* Subtle Watermark Branding on Plain Surface */}
                    <text
                      x={sheet.x + effW / 2}
                      y={sheet.y + effH / 2}
                      fill={sheet.color === '#1e293b' ? '#94a3b8' : '#64748b'}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      letterSpacing="3"
                      textAnchor="middle"
                      opacity="0.3"
                    >
                      {sheet.name.toUpperCase()} (PLAIN CUTTING SHEET)
                    </text>
                  </g>
                );
              })}

            {/* Center Mirror Symmetry Line if active (Spans continuously from top to bottom of screen) */}
            {symmetryEnabled && (() => {
              const vpHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
              const vpTopY = (-panOffset.y + 24) / zoom;
              const vpMidY = (-panOffset.y + vpHeight / 2) / zoom;
              const vpBottomY = (-panOffset.y + vpHeight - 90) / zoom;

              return (
                <g id="symmetry-mirror-axis">
                  {/* Wide transparent interactive hit target spanning from top to bottom of screen */}
                  <line
                    x1={symmetryAxisX}
                    y1="-100000"
                    x2={symmetryAxisX}
                    y2="100000"
                    stroke="transparent"
                    strokeWidth="36"
                    className="cursor-ew-resize pointer-events-auto"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingMirrorAxis(true);
                    }}
                    title={`Drag to shift Mirror Axis (X: ${symmetryAxisX}px)`}
                  />
                  {/* Visual dashed golden mirror axis line from top to bottom */}
                  <line
                    x1={symmetryAxisX}
                    y1="-100000"
                    x2={symmetryAxisX}
                    y2="100000"
                    stroke={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                    strokeWidth={isDraggingMirrorAxis ? 3 : 2}
                    strokeDasharray="6 4"
                    className="pointer-events-none"
                  />

                  {/* Top Viewport Handle Pill (always positioned at the top of the visible screen) */}
                  <g
                    className="cursor-ew-resize pointer-events-auto select-none"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingMirrorAxis(true);
                    }}
                  >
                    <rect
                      x={symmetryAxisX - 95}
                      y={vpTopY}
                      width="190"
                      height="28"
                      rx="14"
                      fill="#090d16"
                      stroke={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                      strokeWidth="2"
                      filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))"
                    />
                    <circle cx={symmetryAxisX - 78} cy={vpTopY + 14} r="4" fill={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'} />
                    <text
                      x={symmetryAxisX + 6}
                      y={vpTopY + 18}
                      fill={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ⇄ MIRROR AXIS ({symmetryAxisX}px)
                    </text>
                  </g>

                  {/* Mid-canvas floating circle handle (always positioned at middle of screen) */}
                  <g
                    className="cursor-ew-resize pointer-events-auto select-none"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingMirrorAxis(true);
                    }}
                  >
                    <circle
                      cx={symmetryAxisX}
                      cy={vpMidY}
                      r="16"
                      fill="#090d16"
                      stroke={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                      strokeWidth="2"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                    />
                    <text
                      x={symmetryAxisX}
                      y={vpMidY + 4}
                      fill={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ⇄
                    </text>
                  </g>

                  {/* Bottom Viewport Handle Pill (always visible near bottom of screen) */}
                  <g
                    className="cursor-ew-resize pointer-events-auto select-none"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingMirrorAxis(true);
                    }}
                  >
                    <rect
                      x={symmetryAxisX - 60}
                      y={vpBottomY}
                      width="120"
                      height="24"
                      rx="12"
                      fill="#090d16"
                      stroke={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                      strokeWidth="2"
                      filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))"
                    />
                    <text
                      x={symmetryAxisX}
                      y={vpBottomY + 16}
                      fill={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ⇄ MIRROR
                    </text>
                  </g>
                </g>
              );
            })()}

            {/* RENDER ALL VISIBLE LAYERS (Pattern Drafting Board) */}
            {activeSubTab === 'drafting' &&
              layers.map((layer) => {
                if (!layer.visible) return null;
                const isCurrentActive = layer.id === activeLayerId;

                // Identify if this layer belongs to an active Cutting Sheet
                const matchingSheet = cuttingSheets.find(
                  (s) => s.id === layer.sheetId || s.layerId === layer.id || `layer_sheet_${s.id}` === layer.id
                );

                // If parent sheet is hidden, hide all drawings belonging to it
                if (matchingSheet && matchingSheet.visible === false) {
                  return null;
                }

                const isSheetMirrored = Boolean(matchingSheet?.isMirrored);
                const effW = matchingSheet
                  ? matchingSheet.isMirrored
                    ? matchingSheet.width * 2
                    : matchingSheet.width
                  : 0;
                const effH = matchingSheet ? matchingSheet.height : 0;
                const localFoldX = matchingSheet ? matchingSheet.width : null;

                // Group transform: sheet layer locks to sheet position and rotation; root canvas uses layer offset
                const groupTransform = matchingSheet
                  ? `translate(${matchingSheet.x}, ${matchingSheet.y}) rotate(${matchingSheet.rotation || 0}, ${effW / 2}, ${effH / 2})`
                  : `translate(${layer.offsetX || 0}, ${layer.offsetY || 0}) rotate(${layer.rotation || 0})`;

                return (
                  <g
                    key={layer.id}
                    id={`layer-group-${layer.id}`}
                    transform={groupTransform}
                    opacity={layer.opacity}
                  >
                    {/* Bodice Piece Geometry (if attached to layer) */}
                    {layer.piece && (
                      <g className="transition-all">
                        {/* Seam Allowance Offset Line (Dashed) */}
                        {layer.piece.seamAllowancePath && (
                          <path
                            d={layer.piece.seamAllowancePath}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                        )}

                        {/* Main Pattern Cutline */}
                        <path
                          d={layer.piece.svgPath || layer.piece.path}
                          fill={isCurrentActive ? '#38bdf8' : '#0284c7'}
                          fillOpacity={isCurrentActive ? 0.22 : 0.12}
                          stroke={isCurrentActive ? '#facc15' : '#38bdf8'}
                          strokeWidth={isCurrentActive ? 2.5 : 1.8}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />

                        {/* Grainline Vector Arrow */}
                        <g stroke="#facc15" strokeWidth="1.5">
                          <line x1="80" y1="20" x2="80" y2="180" />
                          <circle cx="80" cy="20" r="3" fill="#facc15" />
                          <circle cx="80" cy="180" r="3" fill="#facc15" />
                          <text
                            x="86"
                            y="100"
                            fill="#facc15"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {layer.piece.grainline?.label || 'LENGTHWISE GRAIN'}
                          </text>
                        </g>

                        {/* Bodice Name Badge */}
                        <text
                          x="20"
                          y="35"
                          fill="#ffffff"
                          fontSize="12"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {layer.name}
                        </text>
                      </g>
                    )}

                    {/* Strokes drawn on this layer */}
                    {layer.elements.map((el) => {
                      if (el.visible === false) return null;
                      const isSelected = selectedElementId === el.id;
                      const isSheetLayer = Boolean(matchingSheet);

                      if (el.tool !== 'dart_marker') {
                        // Freehand chalk/pen/scissors/ruler stroke
                        const points = el.points || [];
                        const pathStr = points.length > 0
                          ? renderPointsToPath(points)
                          : el.pathData || '';

                        return (
                          <g key={el.id}>
                            {/* Selected Halo */}
                            {isSelected && (
                              <path
                                d={pathStr}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth={Math.max(6, el.size + 4)}
                                strokeOpacity={0.6}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            {/* Stroke on Sheet / Canvas */}
                            <path
                              d={pathStr}
                              fill="none"
                              stroke={isSelected ? '#fbbf24' : el.color}
                              strokeWidth={el.size}
                              strokeOpacity={el.opacity || 1.0}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray={el.tool === 'scissors' || el.dashed ? '6 4' : 'none'}
                              cursor={isSheetLayer ? 'pointer' : 'default'}
                              onClick={(e) => {
                                if (isSheetLayer) {
                                  e.stopPropagation();
                                  setSelectedElementId(el.id);
                                  setActiveLayerId(layer.id);
                                }
                              }}
                            />

                            {/* Cutting Sheet Mirrored Reflection (if sheet has book-fold mirror active) */}
                            {isSheetMirrored && localFoldX != null && points.length > 0 && !el.isMirroredCopy && (
                              <path
                                d={renderPointsToPath(
                                  points.map((pt) => ({
                                    x: 2 * localFoldX - pt.x,
                                    y: pt.y,
                                  }))
                                )}
                                fill="none"
                                stroke={el.color}
                                strokeWidth={el.size}
                                strokeDasharray={el.tool === 'scissors' || el.dashed ? '6 4' : 'none'}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.88}
                              />
                            )}

                            {/* Root Canvas Mirrored Reflection (if symmetry is enabled) */}
                            {!matchingSheet && symmetryEnabled && typeof symmetryAxisX === 'number' && points.length > 0 && !el.isMirroredCopy && (
                              <path
                                d={renderPointsToPath(
                                  points.map((pt) => ({
                                    x: 2 * (symmetryAxisX - (layer.offsetX || 0)) - pt.x,
                                    y: pt.y,
                                  }))
                                )}
                                fill="none"
                                stroke={el.color}
                                strokeWidth={el.size}
                                strokeDasharray={el.tool === 'scissors' || el.dashed ? '6 4' : 'none'}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.88}
                              />
                            )}
                          </g>
                        );
                      }

                      if (el.tool === 'dart_marker') {
                        const dartRadius = zoom >= 1.5 ? 2.5 : zoom >= 0.8 ? 1.8 : 1.2;
                        const dartStrokeWidth = Math.min(1.4, Math.max(0.7, (el.size || 1) * Math.min(1, zoom)));
                        const apexX = el.apex.x;
                        const apexY = el.apex.y;

                        return (
                          <g key={el.id}>
                            {/* Selected Halo for Dart */}
                            {isSelected && (
                              <circle
                                cx={apexX}
                                cy={apexY}
                                r="6"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                              />
                            )}
                            {/* Primary Dart */}
                            <g
                              stroke={isSelected ? '#fbbf24' : el.color}
                              strokeWidth={dartStrokeWidth}
                              cursor={isSheetLayer ? 'pointer' : 'default'}
                              onClick={(e) => {
                                if (isSheetLayer) {
                                  e.stopPropagation();
                                  setSelectedElementId(el.id);
                                  setActiveLayerId(layer.id);
                                }
                              }}
                            >
                              <circle cx={apexX} cy={apexY} r={dartRadius} fill={el.color} />
                              <polyline
                                points={el.legs
                                  .map((pt) => `${pt.x},${pt.y}`)
                                  .join(' ')}
                                fill="none"
                                strokeDasharray="3 2"
                              />
                              {zoom >= 0.85 && (
                                <text
                                  x={apexX + 5}
                                  y={apexY + 3}
                                  fill={el.color}
                                  fontSize="7"
                                  fontFamily="monospace"
                                  opacity={0.8}
                                >
                                  DART
                                </text>
                              )}
                            </g>

                            {/* Cutting Sheet Mirrored Flipped Dart */}
                            {isSheetMirrored && localFoldX != null && (
                              <g stroke={el.color} strokeWidth={dartStrokeWidth} opacity={0.88}>
                                <circle
                                  cx={2 * localFoldX - apexX}
                                  cy={apexY}
                                  r={dartRadius}
                                  fill={el.color}
                                />
                                <polyline
                                  points={el.legs
                                    .map((pt) => `${2 * localFoldX - pt.x},${pt.y}`)
                                    .join(' ')}
                                  fill="none"
                                  strokeDasharray="3 2"
                                />
                                {zoom >= 0.85 && (
                                  <text
                                    x={2 * localFoldX - apexX - 5}
                                    y={apexY + 3}
                                    fill={el.color}
                                    fontSize="7"
                                    fontFamily="monospace"
                                    textAnchor="end"
                                    opacity={0.8}
                                  >
                                    DART 🪞
                                  </text>
                                )}
                              </g>
                            )}
                          </g>
                        );
                      }

                      return null;
                    })}
                  </g>
                );
              })}

            {/* RENDER CUTTING TABLE IMPORTED BODICES */}
            {activeSubTab === 'cutting' &&
              cuttingTablePieces.map((p) => {
                const isSelected = selectedCuttingPieceId === p.id;
                return (
                  <g
                    key={p.id}
                    transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}
                    className="cursor-move"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCuttingPieceId(p.id);
                    }}
                  >
                    {/* Seam Allowance Dash Line */}
                    <path
                      d={p.svgPath}
                      fill={isSelected ? '#38bdf8' : '#ffffff'}
                      fillOpacity={isSelected ? 0.28 : 0.18}
                      stroke={isSelected ? '#facc15' : '#38bdf8'}
                      strokeWidth={isSelected ? 2.5 : 1.8}
                      strokeLinejoin="round"
                    />

                    {/* Extra Sewing Edge (+0.5") */}
                    <rect
                      x="0"
                      y="0"
                      width={p.bounds?.width || 160}
                      height={p.bounds?.height || 220}
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />

                    <text x="12" y="24" fill="#ffffff" fontSize="12" fontWeight="bold">
                      {p.name}
                    </text>
                    <text x="12" y="40" fill="#facc15" fontSize="10" fontFamily="monospace">
                      +0.5" Extra Sewing Edge • Ready to Cut
                    </text>
                  </g>
                );
              })}

            {/* CURRENT IN-PROGRESS STROKE */}
            {currentStroke && (
              <g id="current-stroke">
                <path
                  d={renderPointsToPath(currentStroke.points)}
                  fill="none"
                  stroke={currentStroke.color}
                  strokeWidth={currentStroke.size}
                  strokeOpacity={currentStroke.opacity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={currentStroke.tool === 'scissors' ? '6 4' : 'none'}
                />
                {/* Global Workspace Mirror Reflection */}
                {currentStroke.symmetry && (
                  <path
                    d={renderPointsToPath(
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
                    strokeDasharray={currentStroke.tool === 'scissors' ? '6 4' : 'none'}
                  />
                )}
                {/* Live Cutting Sheet Mirrored Reflection */}
                {(() => {
                  const activeLayer = layers.find((l) => l.id === activeLayerId);
                  const activeSheet = cuttingSheets.find(
                    (s) =>
                      s.id === selectedCuttingSheetId ||
                      s.id === activeLayer?.sheetId ||
                      s.layerId === activeLayer?.id ||
                      `layer_sheet_${s.id}` === activeLayer?.id
                  );
                  if (activeSheet?.isMirrored) {
                    const foldX = activeSheet.x + activeSheet.width;
                    return (
                      <path
                        d={renderPointsToPath(
                          currentStroke.points.map((pt) => ({
                            x: 2 * foldX - pt.x,
                            y: pt.y,
                          }))
                        )}
                        fill="none"
                        stroke={currentStroke.color}
                        strokeWidth={currentStroke.size}
                        strokeOpacity={currentStroke.opacity * 0.9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={currentStroke.tool === 'scissors' ? '6 4' : 'none'}
                      />
                    );
                  }
                  return null;
                })()}
              </g>
            )}

            {/* IN-PROGRESS CUSTOM CUTTING SHEET DRAWING PREVIEW */}
            {sheetDrawPreview && (
              <g id="custom-sheet-draw-preview">
                <rect
                  x={Math.min(sheetDrawPreview.startX, sheetDrawPreview.currentX)}
                  y={Math.min(sheetDrawPreview.startY, sheetDrawPreview.currentY)}
                  width={Math.abs(sheetDrawPreview.currentX - sheetDrawPreview.startX)}
                  height={Math.abs(sheetDrawPreview.currentY - sheetDrawPreview.startY)}
                  fill="#ffffff"
                  fillOpacity="0.35"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  rx="4"
                />
                <text
                  x={Math.min(sheetDrawPreview.startX, sheetDrawPreview.currentX) + 10}
                  y={Math.min(sheetDrawPreview.startY, sheetDrawPreview.currentY) + 20}
                  fill="#f59e0b"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  NEW CUTTING SHEET: {Math.round(Math.abs(sheetDrawPreview.currentX - sheetDrawPreview.startX) / 20)}" × {Math.round(Math.abs(sheetDrawPreview.currentY - sheetDrawPreview.startY) / 20)}"
                </text>
              </g>
            )}

            {/* TAPE MEASURE INTERACTIVE OVERLAY */}
            {tapeMeasure.start && (
              <g id="tape-measure-overlay">
                {/* Start Point */}
                <circle
                  cx={tapeMeasure.start.x}
                  cy={tapeMeasure.start.y}
                  r="5"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Connecting Line to end or current pointer */}
                {(tapeMeasure.end || cursorPos) && (
                  <>
                    <line
                      x1={tapeMeasure.start.x}
                      y1={tapeMeasure.start.y}
                      x2={tapeMeasure.end ? tapeMeasure.end.x : cursorPos.x}
                      y2={tapeMeasure.end ? tapeMeasure.end.y : cursorPos.y}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                    />

                    {/* End Point if placed */}
                    {tapeMeasure.end && (
                      <circle
                        cx={tapeMeasure.end.x}
                        cy={tapeMeasure.end.y}
                        r="5"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    )}

                    {/* Floating measurement badge at midpoint */}
                    {(() => {
                      const endPt = tapeMeasure.end || cursorPos;
                      const midX = (tapeMeasure.start.x + endPt.x) / 2;
                      const midY = (tapeMeasure.start.y + endPt.y) / 2;
                      const distInches = (Math.hypot(endPt.x - tapeMeasure.start.x, endPt.y - tapeMeasure.start.y) / 20).toFixed(1);
                      const distCm = (parseFloat(distInches) * 2.54).toFixed(1);

                      return (
                        <g transform={`translate(${midX}, ${midY - 14})`} className="cursor-pointer" onClick={() => setTapeMeasure({ start: null, end: null, active: false, savedDist: null })}>
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
            {/* ======================================================================= */}
            {/* STEADY STROKE TRAILING VECTOR TETHER HUD (Autodesk Sketchbook Lazy Mouse)*/}
            {/* ======================================================================= */}
            {steadyStrokeHUD && isPointerDown && (
              <g id="steady-stroke-tether-hud" className="pointer-events-none select-none">
                {/* Stabilization Radius Guide Circle around raw physical cursor */}
                <circle
                  cx={steadyStrokeHUD.rawX}
                  cy={steadyStrokeHUD.rawY}
                  r={steadyStrokeHUD.radius}
                  fill="rgba(245, 158, 11, 0.05)"
                  stroke="#f59e0b"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />

                {/* Trailing Elastic Vector Tether (Leash) */}
                <line
                  x1={steadyStrokeHUD.rawX}
                  y1={steadyStrokeHUD.rawY}
                  x2={steadyStrokeHUD.penX}
                  y2={steadyStrokeHUD.penY}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />

                {/* Raw Physical Cursor Point */}
                <circle
                  cx={steadyStrokeHUD.rawX}
                  cy={steadyStrokeHUD.rawY}
                  r="3.5"
                  fill="#f59e0b"
                  stroke="#090d16"
                  strokeWidth="1.5"
                />

                {/* Virtual Smoothed Pen Tip Ring (Where the ink is being deposited) */}
                <circle
                  cx={steadyStrokeHUD.penX}
                  cy={steadyStrokeHUD.penY}
                  r="5.5"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <circle
                  cx={steadyStrokeHUD.penX}
                  cy={steadyStrokeHUD.penY}
                  r="1.5"
                  fill="#38bdf8"
                />
              </g>
            )}
          </svg>
        </div>

        {/* ======================================================================= */}
        {/* GLOWING RED INFRARED ARROW LASER FOR SCISSORS ✂️ PRECISION CUTTING TOOL  */}
        {/* ======================================================================= */}
        {activeTool === 'scissors' && (
          <div
            className="pointer-events-none fixed z-50 flex items-center gap-1 transition-transform duration-75 select-none"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {/* Glowing Red Laser Trajectory Beam projecting forward */}
            <div className="w-20 h-0.5 bg-rose-500 shadow-[0_0_14px_#f43f5e] animate-pulse" />
            <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-rose-500" />
            <span className="text-[10px] font-mono text-rose-300 bg-black/90 px-1.5 py-0.5 rounded font-bold tracking-wider shadow-lg border border-rose-500/50">
              STEADY CUT ✂️
            </span>
          </div>
        )}

        {/* ======================================================================= */}
        {/* CUSTOMIZABLE CUTTING SHEETS (Pattern Drafting, Tracing, Mirror View)     */}
        {/* ======================================================================= */}
        {activeSubTab === 'drafting' &&
          cuttingSheets.map((sheet) => (
            <CuttingSheetItem
              key={sheet.id}
              sheet={sheet}
              isSelected={selectedCuttingSheetId === sheet.id}
              zoom={zoom}
              panOffset={panOffset}
              activeChalkColor={brushColor}
              onSetChalkColor={(colorHex) => {
                setBrushColor(colorHex);
                if (activeTool !== 'pen' && activeTool !== 'chalk') {
                  setActiveTool('chalk');
                }
              }}
              onSelect={() => {
                setSelectedCuttingSheetId(sheet.id);
                if (sheet.layerId) {
                  setActiveLayerId(sheet.layerId);
                } else {
                  const sLayer = layers.find((l) => l.sheetId === sheet.id);
                  if (sLayer) setActiveLayerId(sLayer.id);
                }
              }}
              onUpdate={(idOrUpdates, possibleUpdates) => {
                const updates = possibleUpdates !== undefined ? possibleUpdates : idOrUpdates;
                handleUpdateCuttingSheet(sheet.id, updates);
              }}
              onDuplicate={() => handleDuplicateCuttingSheet(sheet.id)}
              onRemove={() => handleRemoveCuttingSheet(sheet.id)}
              onAddSeamAllowanceStroke={(points, label) => {
                const layer = ensureActiveLayer({ x: sheet.x + 10, y: sheet.y + 10 });
                const stroke = {
                  id: `stroke_seam_${Date.now()}`,
                  tool: 'seam_allowance',
                  isSeamAllowance: true,
                  dashed: true,
                  points,
                  color: '#38bdf8',
                  size: 2,
                  opacity: 0.95,
                  pathData: renderPointsToPath(points),
                  label: label || '5/8" Seam Allowance',
                  parentSheetId: sheet.id,
                  targetLayerId: layer.id,
                };
                setLayers((prev) =>
                  prev.map((l) => (l.id === layer.id ? { ...l, elements: [...l.elements, stroke] } : l))
                );
                setUndoStack((prev) => [...prev, { layerId: layer.id, element: stroke }]);
              }}
            />
          ))}

        {/* ======================================================================= */}
        {/* TAILOR'S 8-RULER VECTOR OVERLAYS (Autodesk Sketchbook Style HUD Canvas) */}
        {/* ======================================================================= */}
        {activeRulers.map((ruler) => (
          <TailorRulerOverlay
            key={ruler.id}
            ruler={ruler}
            isSelected={selectedRulerId === ruler.id}
            zoom={zoom}
            panOffset={panOffset}
            isDrawing={isPointerDown}
            onSelect={() => setSelectedRulerId(ruler.id)}
            onSelectRuler={(id) => setSelectedRulerId(id)}
            onUpdate={(updates) => handleUpdateRuler(ruler.id, updates)}
            onUpdateRuler={(id, updates) => handleUpdateRuler(id, updates)}
            onRemove={() => handleRemoveRuler(ruler.id)}
            onRemoveRuler={(id) => handleRemoveRuler(id)}
            onSnapEdge={(points) =>
              handleSnapSeamEdge(points, TAILOR_RULERS_CATALOG[ruler.type]?.name || 'Ruler Edge')
            }
            onSnapSeamEdge={(points, name) =>
              handleSnapSeamEdge(points, name || TAILOR_RULERS_CATALOG[ruler.type]?.name || 'Ruler Edge')
            }
          />
        ))}

        {/* ======================================================================= */}
        {/* TOPPING ACTIVE DRAWING STROKE LAYER (Renders ABOVE rulers)              */}
        {/* Guarantees lines drawn along rulers are 100% visible on top of ruler    */}
        {/* ======================================================================= */}
        {currentStroke && (() => {
          const strokeSheet = currentStroke.parentSheetId
            ? cuttingSheets.find((s) => s.id === currentStroke.parentSheetId)
            : null;
          const effW = strokeSheet ? (strokeSheet.isMirrored ? strokeSheet.width * 2 : strokeSheet.width) : 0;
          const effH = strokeSheet ? strokeSheet.height : 0;
          const strokeLayer = !strokeSheet && currentStroke.targetLayerId
            ? layers.find((l) => l.id === currentStroke.targetLayerId)
            : null;
          const strokeTransform = strokeSheet
            ? `translate(${strokeSheet.x}, ${strokeSheet.y}) rotate(${strokeSheet.rotation || 0}, ${effW / 2}, ${effH / 2})`
            : strokeLayer
            ? `translate(${strokeLayer.offsetX || 0}, ${strokeLayer.offsetY || 0}) rotate(${strokeLayer.rotation || 0})`
            : undefined;

          return (
            <svg
              className="w-full h-full absolute inset-0 z-20 pointer-events-none select-none"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                overflow: 'visible',
              }}
            >
              <g transform={strokeTransform}>
                <path
                  d={renderPointsToPath(currentStroke.points)}
                  fill="none"
                  stroke={currentStroke.color || '#38bdf8'}
                  strokeWidth={currentStroke.size || 2}
                  strokeOpacity={1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={currentStroke.tool === 'scissors' || currentStroke.dashed ? '6 4' : 'none'}
                />
                {/* Real-time Mirrored Stroke Reflection on sheet while drawing */}
                {strokeSheet?.isMirrored && currentStroke.points?.length > 0 && (
                  <path
                    d={renderPointsToPath(
                      currentStroke.points.map((pt) => ({
                        x: 2 * strokeSheet.width - pt.x,
                        y: pt.y,
                      }))
                    )}
                    fill="none"
                    stroke={currentStroke.color || '#38bdf8'}
                    strokeWidth={currentStroke.size || 2}
                    strokeOpacity={0.85}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={currentStroke.tool === 'scissors' || currentStroke.dashed ? '6 4' : 'none'}
                  />
                )}
                {/* Real-time Mirrored Stroke Reflection on root canvas while drawing */}
                {!strokeSheet && symmetryEnabled && typeof symmetryAxisX === 'number' && currentStroke.points?.length > 0 && (
                  <path
                    d={renderPointsToPath(
                      currentStroke.points.map((pt) => ({
                        x: 2 * (symmetryAxisX - (strokeLayer?.offsetX || 0)) - pt.x,
                        y: pt.y,
                      }))
                    )}
                    fill="none"
                    stroke={currentStroke.color || '#38bdf8'}
                    strokeWidth={currentStroke.size || 2}
                    strokeOpacity={0.85}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={currentStroke.tool === 'scissors' || currentStroke.dashed ? '6 4' : 'none'}
                  />
                )}
              </g>
            </svg>
          );
        })()}

        {/* Magnetic Edge Snapping Visual Ping Indicator */}
        {activeSnapPoint && activeSnapPoint.snapped && (
          <div
            className="pointer-events-none fixed z-30 flex items-center gap-1.5 transition-all duration-75 select-none"
            style={{
              left: `${activeSnapPoint.x * zoom + panOffset.x}px`,
              top: `${activeSnapPoint.y * zoom + panOffset.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-5 h-5 rounded-full border-2 border-amber-400 bg-amber-400/30 animate-ping absolute" />
            <div className="w-3 h-3 rounded-full bg-amber-400 border border-slate-950 shadow-[0_0_12px_#f59e0b]" />
            <span className="text-[10px] font-mono font-bold bg-slate-950/95 text-amber-300 border border-amber-500/60 px-1.5 py-0.5 rounded shadow-xl translate-x-4 -translate-y-4 whitespace-nowrap">
              SNAP 🧲: {activeSnapPoint.rulerName || 'EDGE'} ({Math.round(activeSnapPoint.distance)}px)
            </span>
          </div>
        )}

        {/* ======================================================================= */}
        {/* FLOATING CAD ZOOM & PAN HUD (Smooth 4x Zoom, Presets, Center Pan)       */}
        {/* ======================================================================= */}
        <div
          id="cad-zoom-hud"
          className="fixed bottom-5 right-5 z-40 bg-[#0d1322]/92 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 flex items-center gap-1 text-slate-200 select-none transition-all hover:border-amber-500/60"
        >
          {/* Zoom Out Button */}
          <button
            onClick={() =>
              setZoom((prev) => {
                const next = Math.max(0.5, Math.round((prev - 0.25) * 100) / 100);
                if (next <= 0.5) setPanOffset({ x: 0, y: 0 });
                return next;
              })
            }
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-xl transition-all"
            title="Zoom Out (Min 50%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Current Zoom Readout Badge */}
          <span
            className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-900/90 text-amber-400 rounded-xl border border-slate-800 min-w-[58px] text-center shadow-inner"
            title="Current Viewport Magnification"
          >
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In Button */}
          <button
            onClick={() => setZoom((prev) => Math.min(4.0, Math.round((prev + 0.25) * 100) / 100))}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-xl transition-all"
            title="Zoom In (Max 4.0x / 400%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-800 mx-0.5" />

          {/* 50% Baseline Preset */}
          <button
            onClick={() => {
              setZoom(0.5);
              setPanOffset({ x: 0, y: 0 });
            }}
            className={`px-2 py-1 text-[11px] font-mono font-bold rounded-xl transition-all border ${
              zoom <= 0.51
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-gold-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-amber-400/90 border-slate-700/50'
            }`}
            title="Baseline 50% Zoom"
          >
            50%
          </button>

          {/* 4X Ultra Zoom Preset */}
          <button
            onClick={() => setZoom(4.0)}
            className={`px-2 py-1 text-[11px] font-mono font-bold rounded-xl transition-all border ${
              zoom >= 3.99
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-gold-sm'
                : 'bg-slate-800/60 hover:bg-slate-800 text-amber-400/90 border-slate-700/50'
            }`}
            title="Quick switch to 4x Ultra Precision Zoom (400%)"
          >
            4X
          </button>

          {/* Reset Zoom & Origin (0,0) Button */}
          <button
            onClick={handleResetZoom}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold rounded-xl transition-all border ${
              zoom === 1.0 && panOffset.x === 0 && panOffset.y === 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800/60 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border-slate-700/60 hover:border-amber-400'
            }`}
            title="Reset Zoom: Restores 100% 1:1 CAD scale, resets pan coordinates to (0,0), and clears transient artifacts"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Zoom</span>
          </button>

          {/* Center Pan Button */}
          <button
            onClick={() => setPanOffset({ x: 40, y: 30 })}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
            title="Center Viewport Pan"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ======================================================================= */}
        {/* DRAFTED PATTERN OVERLAY MODAL FOR CUTTING TABLE                         */}
        {/* ======================================================================= */}
        {activeSubTab === 'cutting' && showPatternOverlay && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d1322]/95 backdrop-blur-md border border-amber-500/50 p-4 rounded-2xl shadow-2xl w-[440px] text-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Select Drafted Bodice to Overlay</span>
              </h4>
              <button
                onClick={() => setShowPatternOverlay(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Click any drafted pattern from your Pattern Drafting Board to place it onto your
              uploaded fabric surface for tracing and cutting.
            </p>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-amber-500/15 border border-slate-700/60 hover:border-amber-500/50 transition-all text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200 block">{layer.name}</span>
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      {layer.bodiceType} • Ready to Trace
                    </span>
                  </div>

                  <button
                    onClick={() => handleImportBodiceToCuttingTable(layer)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow flex items-center gap-1"
                  >
                    <span>Drop on Fabric</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* HIGH-PRECISION TRUE MAGNIFYING GLASS (2X/3X VECTOR FOCUS ZOOM LOUPE)    */}
        {/* ======================================================================= */}
        <MagnifyingGlassLoupe
          lensState={lensState}
          layers={layers}
          cuttingSheets={cuttingSheets}
          activeRulers={activeRulers}
          brushSize={brushSize}
          currentStroke={currentStroke}
          onClose={() => {
            setLensState(null);
            if (activeTool === 'magnifier') setActiveTool('pen');
          }}
        />

        {/* Workspace Toast Notification */}
        {workspaceToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d1322]/95 backdrop-blur-xl border border-amber-500/80 px-5 py-2.5 rounded-2xl shadow-2xl text-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 text-xs font-semibold pointer-events-none">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{workspaceToast.message}</span>
          </div>
        )}

        {/* ======================================================================= */}
        {/* PERSISTENT ZOOM-SAFE FLOATING TOGGLES DOCK                              */}
        {/* Always visible on screen so sheet & ruler options are never hidden away */}
        {/* ======================================================================= */}
        <div className="hidden md:flex fixed top-16 right-4 z-30 items-center gap-2 select-none">
          {/* Sheet Options Persistent Button */}
          {cuttingSheets.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowFloatingSheetToggles((prev) => !prev);
                  setShowFloatingRulerToggles(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border transition-all shadow-xl ${
                  showFloatingSheetToggles
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-gold-sm'
                    : 'bg-[#0d1322]/90 text-amber-400 hover:text-amber-300 border-amber-500/40 hover:bg-slate-800'
                }`}
                title="Sheet Toggle Options: Access mirror, rotation, color, and lock settings anytime even when zoomed"
              >
                <Layers className="w-4 h-4" />
                <span>📄 Sheet Toggles ({cuttingSheets.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFloatingSheetToggles ? 'rotate-180' : ''}`} />
              </button>

              {/* Floating Sheet Options Quick Panel */}
              {showFloatingSheetToggles && (
                <div className="absolute right-0 top-11 w-72 bg-[#0d1322]/98 backdrop-blur-xl border border-amber-500/50 rounded-2xl shadow-2xl p-3.5 text-slate-200 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Active Sheet Toggles</span>
                    </span>
                    <button
                      onClick={() => setShowFloatingSheetToggles(false)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(() => {
                    const sheet = cuttingSheets.find((s) => s.id === selectedCuttingSheetId) || cuttingSheets[0];
                    if (!sheet) return <p className="text-xs text-slate-400">No cutting sheets present.</p>;

                    return (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                          <span className="font-bold text-slate-100 truncate">{sheet.name}</span>
                          <span className="text-[10px] font-mono text-amber-400">
                            {Math.round(sheet.width)}" × {Math.round(sheet.height)}"
                          </span>
                        </div>

                        {/* Sheet Selection if multiple sheets exist */}
                        {cuttingSheets.length > 1 && (
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                            {cuttingSheets.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => setSelectedCuttingSheetId(s.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 border ${
                                  s.id === sheet.id
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {s.name}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Import Sheet to Cutting Table */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Cutting Table:</span>
                          <button
                            onClick={() => handleImportSheetToCuttingTable(sheet.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition-transform active:scale-95"
                            title="Import this cutting sheet onto the Cutting Table rack"
                          >
                            <span>Import to Table</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Rotate 90° */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Orientation:</span>
                          <button
                            onClick={() =>
                              handleUpdateCuttingSheet(sheet.id, {
                                width: sheet.height,
                                height: sheet.width,
                                rotation: ((sheet.rotation || 0) + 90) % 360,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] flex items-center gap-1"
                          >
                            <RotateCw className="w-3 h-3 text-amber-400" />
                            <span>Rotate 90°</span>
                          </button>
                        </div>

                        {/* Position Lock Toggle */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Position Lock:</span>
                          <button
                            onClick={() => handleUpdateCuttingSheet(sheet.id, { locked: !sheet.locked })}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all flex items-center gap-1 ${
                              sheet.locked
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {sheet.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>{sheet.locked ? 'LOCKED' : 'UNLOCKED'}</span>
                          </button>
                        </div>

                        {/* Grainline Toggle */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Grainline Arrow:</span>
                          <button
                            onClick={() =>
                              handleUpdateCuttingSheet(sheet.id, {
                                showGrainline: sheet.showGrainline === false ? true : false,
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                              sheet.showGrainline !== false
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {sheet.showGrainline !== false ? 'VISIBLE' : 'HIDDEN'}
                          </button>
                        </div>

                        {/* Color Picker */}
                        <div>
                          <span className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">Paper / Fabric Color:</span>
                          <div className="flex items-center gap-1.5">
                            {[
                              { label: 'White', color: '#ffffff' },
                              { label: 'Muslin', color: '#fef3c7' },
                              { label: 'Silk', color: '#e0f2fe' },
                              { label: 'Denim', color: '#1e293b' },
                              { label: 'Charcoal', color: '#0f172a' },
                            ].map((opt) => (
                              <button
                                key={opt.color}
                                onClick={() => handleUpdateCuttingSheet(sheet.id, { color: opt.color })}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                  sheet.color === opt.color ? 'scale-110 border-amber-400 shadow-md' : 'border-slate-700'
                                }`}
                                style={{ backgroundColor: opt.color }}
                                title={opt.label}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Delete Sheet */}
                        <div className="pt-2 border-t border-slate-800 flex justify-end">
                          <button
                            onClick={() => {
                              handleRemoveCuttingSheet(sheet.id);
                              setShowFloatingSheetToggles(false);
                            }}
                            className="px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete Sheet</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Ruler Options Persistent Button */}
          {activeRulers.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowFloatingRulerToggles((prev) => !prev);
                  setShowFloatingSheetToggles(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border transition-all shadow-xl ${
                  showFloatingRulerToggles
                    ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md'
                    : 'bg-[#0d1322]/90 text-sky-400 hover:text-sky-300 border-sky-500/40 hover:bg-slate-800'
                }`}
                title="Ruler Toggle Options: Access ruler lock, vector snapping, trace, flip, and angle settings anytime even when zoomed"
              >
                <Ruler className="w-4 h-4" />
                <span>📐 Ruler Toggles ({activeRulers.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFloatingRulerToggles ? 'rotate-180' : ''}`} />
              </button>

              {/* Floating Ruler Options Quick Panel */}
              {showFloatingRulerToggles && (
                <div className="absolute right-0 top-11 w-72 bg-[#0d1322]/98 backdrop-blur-xl border border-sky-500/50 rounded-2xl shadow-2xl p-3.5 text-slate-200 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Active Ruler Toggles</span>
                    </span>
                    <button
                      onClick={() => setShowFloatingRulerToggles(false)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(() => {
                    const ruler = activeRulers.find((r) => r.id === selectedRulerId) || activeRulers[0];
                    if (!ruler) return <p className="text-xs text-slate-400">No rulers placed on canvas.</p>;
                    const catalog = TAILOR_RULERS_CATALOG[ruler.type];

                    return (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                          <span className="font-bold text-slate-100 truncate">{catalog?.name || 'Tailor Ruler'}</span>
                          <span className="text-[10px] font-mono text-sky-400">
                            {Math.round(ruler.rotation || 0)}° • {Math.round((ruler.scale || 1) * 100)}%
                          </span>
                        </div>

                        {/* Ruler Selection if multiple rulers placed */}
                        {activeRulers.length > 1 && (
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                            {activeRulers.map((r) => {
                              const rCat = TAILOR_RULERS_CATALOG[r.type];
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => setSelectedRulerId(r.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 border ${
                                    r.id === ruler.id
                                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  {rCat?.name.split(' ')[0] || 'Ruler'}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Lock / Freeze Position Toggle */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Lock Position (Straight Chalk):</span>
                          <button
                            onClick={() => handleUpdateRuler(ruler.id, { locked: !ruler.locked })}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all flex items-center gap-1 ${
                              ruler.locked
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-gold-sm'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {ruler.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>{ruler.locked ? 'LOCKED' : 'UNLOCKED'}</span>
                          </button>
                        </div>

                        {/* Edge Snapping Toggle */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Magnetic Snapping:</span>
                          <button
                            onClick={() => setSnappingEnabled(!snappingEnabled)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                              snappingEnabled
                                ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {snappingEnabled ? 'MAGNET: ON' : 'MAGNET: OFF'}
                          </button>
                        </div>

                        {/* Snap Seam Edge Action */}
                        <button
                          onClick={() => {
                            const pts = getRulerPrimaryEdgeWorldPoints(ruler);
                            if (pts.length > 0) {
                              handleSnapSeamEdge(pts, catalog?.name || 'Ruler Edge');
                            }
                          }}
                          className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl shadow-gold-sm flex items-center justify-center gap-1.5 transition-all text-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Snap Seam Edge to Layer</span>
                        </button>

                        {/* Flip Horizontal & Vertical */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleUpdateRuler(ruler.id, { flippedH: !ruler.flippedH })}
                            className={`py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              ruler.flippedH ? 'bg-sky-500/20 text-sky-300 border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            Flip H {ruler.flippedH ? '✓' : ''}
                          </button>
                          <button
                            onClick={() => handleUpdateRuler(ruler.id, { flippedV: !ruler.flippedV })}
                            className={`py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              ruler.flippedV ? 'bg-sky-500/20 text-sky-300 border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            Flip V {ruler.flippedV ? '✓' : ''}
                          </button>
                        </div>

                        {/* Remove Ruler */}
                        <div className="pt-2 border-t border-slate-800 flex justify-end">
                          <button
                            onClick={() => {
                              handleRemoveRuler(ruler.id);
                              setShowFloatingRulerToggles(false);
                            }}
                            className="px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Ruler</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXPORT MODAL                                                           */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1322] border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Download className="w-4 h-4" /> Export Pattern Vectors
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Download manufacturing-ready sewing vectors from your current drafting and cutting board.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  const piecesToExport = layers.filter((l) => l.piece).map((l) => l.piece);
                  exportPatternToSVG(piecesToExport, 'drafted_garment');
                  setShowExportModal(false);
                }}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Layered Scalable Vector (SVG)</span>
                  <span className="text-[11px] text-slate-400">1:1 CAD cutlines, seam allowances, and grainlines</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">.SVG</span>
              </button>

              <button
                onClick={() => {
                  const piecesToExport = layers.filter((l) => l.piece).map((l) => l.piece);
                  exportPatternToDXF(piecesToExport, 'drafted_garment');
                  setShowExportModal(false);
                }}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 block">AutoCAD / AAMA Plotter (DXF)</span>
                  <span className="text-[11px] text-slate-400">Industry standard CNC textile cutters and laser tables</span>
                </div>
                <span className="text-xs font-mono font-bold text-sky-400">.DXF</span>
              </button>

              <button
                onClick={() => {
                  const piecesToExport = layers.filter((l) => l.piece).map((l) => l.piece);
                  exportPatternToTiledPDF(piecesToExport, 'drafted_garment', { paperSize: 'letter' });
                  setShowExportModal(false);
                }}
                className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left border border-slate-700 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 block">1:1 Printable Tiled PDF</span>
                  <span className="text-[11px] text-slate-400">US Letter / A4 home printer assembly sheets</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">.PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADVANCED TAILOR OPTIONS DRAWER                                         */}
      {/* ========================================================================= */}
      <AdvancedTailorDrawer
        isOpen={showAdvancedDrawer}
        onClose={() => setShowAdvancedDrawer(false)}
        selectedPiece={activeLayer?.piece}
        units="in"
      />

      {/* ========================================================================= */}
      {/* 5. TAILOR'S DRAFTING TOOLBOX DRAWER (8 Physical Rulers Vector Drawer)      */}
      {/* ========================================================================= */}
      <DraftingToolboxDrawer
        isOpen={isToolboxDrawerOpen}
        onClose={() => setIsToolboxDrawerOpen(false)}
        activeRulers={activeRulers}
        onToggleRuler={handleToggleRuler}
        onSelectRuler={setSelectedRulerId}
        selectedRulerId={selectedRulerId}
        onUpdateRuler={handleUpdateRuler}
        onSnapSeamEdge={handleSnapSeamEdge}
        zoom={zoom}
        panOffset={panOffset}
        snappingEnabled={snappingEnabled}
        onToggleSnapping={() => setSnappingEnabled(!snappingEnabled)}
        snapThreshold={snapThreshold}
        onChangeSnapThreshold={setSnapThreshold}
        onClearAllRulers={handleClearAllRulers}
      />
    </div>
  );
}
