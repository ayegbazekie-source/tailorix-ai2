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

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

import AdvancedTailorDrawer from './AdvancedTailorDrawer';
import TailorRulerOverlay from './TailorRulerOverlay';
import DraftingToolboxDrawer from './DraftingToolboxDrawer';
import CuttingSheetItem from './CuttingSheetItem';
import {
  TAILOR_RULERS_CATALOG,
  TAILOR_RULER_LIST,
  snapPointToActiveRuler,
  getRulerPrimaryEdgeWorldPoints,
  constrainChalkToRulerDirection,
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
    if (tab === 'drafting' && location.pathname !== '/cad') {
      navigate('/cad');
    } else if (tab === 'cutting' && location.pathname !== '/studio') {
      navigate('/studio');
    }
  };

  // -------------------------------------------------------------------------
  // 2. Sketchbook Tools State
  // Tools: 'pen' | 'chalk' | 'marker' | 'dart_marker' | 'scissors' | 'tape_measure' | 'piece_move' | 'eraser'
  // -------------------------------------------------------------------------
  const [activeTool, setActiveTool] = useState('chalk');
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);
  const [brushOpacity, setBrushOpacity] = useState(0.85);
  const [isToolsCollapsed, setIsToolsCollapsed] = useState(false);

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

  // Advanced Overlay Instruments
  const [symmetryEnabled, setSymmetryEnabled] = useState(false); // Mirror Tool
  const [symmetryAxisX, setSymmetryAxisX] = useState(500); // Vertical mirror line (Freely Moveable Workspace Axis)
  const [isDraggingMirrorAxis, setIsDraggingMirrorAxis] = useState(false);

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
  const [tapeMeasure, setTapeMeasure] = useState({
    start: null,
    end: null,
    active: false,
    savedDist: null,
  });

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
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Piece Move dragging state
  const [isMovingPiece, setIsMovingPiece] = useState(false);
  const movingPieceRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, layerId: null });

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

  // -------------------------------------------------------------------------
  // 6. Clean Blank Workspace on Load (Strict User Requirement)
  // No hardcoded or auto-imported bodice pieces. The layer section is empty
  // and stays collapsed until the user explicitly requests it or adds elements.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Keep canvas pristine and empty on initial load
    setLayers([]);
    setActiveLayerId(null);
    setActiveRulers([]);
    setSelectedRulerId(null);
    setCuttingSheets([]);
    setSelectedCuttingSheetId(null);
    setShowLayerPanel(false);
  }, []);

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

  // Helper to ensure an active writable layer exists before drawing (creates Layer 1 on blank board, or links to cutting sheet)
  const ensureActiveLayer = (pointerCoords = null) => {
    // 1. If pointer is physically inside an existing cutting sheet, activate that sheet and its layer!
    if (pointerCoords) {
      const hitSheet = cuttingSheets.find((s) => {
        const effW = s.isMirrored ? s.width * 2 : s.width;
        return (
          pointerCoords.x >= s.x &&
          pointerCoords.x <= s.x + effW &&
          pointerCoords.y >= s.y &&
          pointerCoords.y <= s.y + s.height
        );
      });
      if (hitSheet) {
        if (selectedCuttingSheetId !== hitSheet.id) setSelectedCuttingSheetId(hitSheet.id);
        const sheetLayer = layers.find((l) => l.sheetId === hitSheet.id || l.id === hitSheet.layerId);
        if (sheetLayer) {
          if (activeLayerId !== sheetLayer.id) setActiveLayerId(sheetLayer.id);
          return sheetLayer;
        }
      }
    }

    // 2. If a cutting sheet is actively selected, ensure its layer is active
    if (selectedCuttingSheetId) {
      const sheet = cuttingSheets.find((s) => s.id === selectedCuttingSheetId);
      if (sheet) {
        const sheetLayer = layers.find((l) => l.sheetId === sheet.id || l.id === sheet.layerId);
        if (sheetLayer) {
          if (activeLayerId !== sheetLayer.id) setActiveLayerId(sheetLayer.id);
          return sheetLayer;
        }
      }
    }

    // 3. Fallback to active layer or create Layer 1
    let current = layers.find((l) => l.id === activeLayerId);
    if (!current) {
      if (layers.length > 0) {
        current = layers[0];
        setActiveLayerId(current.id);
      } else {
        const newLayer = {
          id: `layer-${Date.now()}`,
          name: 'Layer 1',
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
        return newLayer;
      }
    }
    return current;
  };

  const toggleLayerVisibility = (id) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const toggleLayerLock = (id) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  const deleteLayer = (id) => {
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

  const deleteElement = (layerId, elementId) => {
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

  const handleNudgeElement = (layerId, elementId, dx, dy) => {
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          elements: l.elements.map((el) => {
            if (el.id !== elementId) return el;
            if (el.tool === 'dart_marker' && el.apex) {
              return {
                ...el,
                apex: { x: el.apex.x + dx, y: el.apex.y + dy },
                legs: el.legs ? el.legs.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) : [],
              };
            }
            if (!el.points) return el;
            const shifted = el.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
            return {
              ...el,
              points: shifted,
              pathData: renderPointsToPath(shifted),
            };
          }),
        };
      })
    );
  };

  const moveLayerOrder = (id, direction) => {
    const index = layers.findIndex((l) => l.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

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
    const newPiece = {
      id: `cut_piece_${Date.now()}_${layer.id}`,
      layerId: layer.id,
      name: layer.name,
      bodiceType: layer.bodiceType,
      svgPath: layer.piece?.svgPath || layer.piece?.path || 'M 0 0 L 160 0 L 180 220 L 20 220 Z',
      seamAllowancePath: layer.piece?.seamAllowancePath || null,
      seamAllowance: layer.piece?.seamAllowance ?? 0.5,
      grainline: layer.piece?.grainline || { label: 'WARP GRAIN' },
      bounds: layer.piece?.bounds || { width: 180, height: 240 },
      x: 100 + (cuttingTablePieces.length % 3) * 220,
      y: 80 + Math.floor(cuttingTablePieces.length / 3) * 260,
      rotation: 0,
      cutComplete: false,
    };

    setCuttingTablePieces((prev) => [...prev, newPiece]);
    setSelectedCuttingPieceId(newPiece.id);
    setShowPatternOverlay(false);
  };

  // -------------------------------------------------------------------------
  // Cutting Sheet Management (Spawning, Duplicating, Mirroring & Seam Allowances)
  // -------------------------------------------------------------------------
  const addCuttingSheet = (config = {}) => {
    const defaultW = config.width || 360;
    const defaultH = config.height || 480;
    // Align on 20px drafting grid
    const sheetCount = cuttingSheets.length;
    const gridX = config.x !== undefined ? config.x : Math.round((120 + (sheetCount % 4) * 60) / 20) * 20;
    const gridY = config.y !== undefined ? config.y : Math.round((80 + (sheetCount % 4) * 40) / 20) * 20;
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
      isMirrored: config.isMirrored !== undefined ? config.isMirrored : false,
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

      const dx = updates.x !== undefined ? updates.x - current.x : 0;
      const dy = updates.y !== undefined ? updates.y - current.y : 0;

      // If sheet moved, also shift any vector strokes on its layer so drawn lines stay pinned to the sheet!
      if (dx !== 0 || dy !== 0) {
        setLayers((prevLayers) =>
          prevLayers.map((l) => {
            if (l.sheetId === sheetId || l.id === current.layerId || l.id === `layer_sheet_${sheetId}`) {
              return {
                ...l,
                elements: l.elements.map((el) => {
                  if (el.tool === 'dart_marker' && el.apex && el.legs) {
                    return {
                      ...el,
                      apex: { x: Math.round(el.apex.x + dx), y: Math.round(el.apex.y + dy) },
                      legs: el.legs.map((pt) => ({
                        x: Math.round(pt.x + dx),
                        y: Math.round(pt.y + dy),
                      })),
                    };
                  }
                  if (!el.points) return el;
                  const shiftedPoints = el.points.map((pt) => ({
                    x: Math.round(pt.x + dx),
                    y: Math.round(pt.y + dy),
                  }));
                  return {
                    ...el,
                    points: shiftedPoints,
                    pathData: renderPointsToPath(shiftedPoints),
                  };
                }),
              };
            }
            return l;
          })
        );
      }

      // If sheet renamed, update layer name too
      if (updates.name && current.layerId) {
        setLayers((prevLayers) =>
          prevLayers.map((l) =>
            l.id === current.layerId || l.sheetId === sheetId
              ? { ...l, name: `Sheet: ${updates.name}` }
              : l
          )
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

    // Duplicate strokes from original layer shifted by +40, +40
    const origLayer = layers.find((l) => l.id === target.layerId || l.sheetId === id);
    const duplicatedElements = (origLayer?.elements || []).map((el) => {
      const shifted = (el.points || []).map((pt) => ({ x: pt.x + 40, y: pt.y + 40 }));
      return {
        ...el,
        id: `stroke_dup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        points: shifted,
        pathData: renderPointsToPath(shifted),
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
    setCuttingSheets((prev) => prev.filter((s) => s.id !== id));
    if (target?.layerId) {
      setLayers((prev) => prev.filter((l) => l.id !== target.layerId && l.sheetId !== id));
    }
    if (selectedCuttingSheetId === id) {
      setSelectedCuttingSheetId(null);
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

    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, elements: [...l.elements, seamStroke] } : l))
    );
    setUndoStack((prev) => [...prev, { layerId, element: seamStroke }]);
  };

  // Wheel zoom handler: Smooth zoom up to 4x (400% magnification) anchored to cursor
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 1.12 : 0.89;
    const nextZoom = Math.max(0.25, Math.min(4.0, Math.round(zoom * zoomDelta * 100) / 100));
    if (nextZoom === zoom) return;

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

  const handleSnapSeamEdge = (points, rulerName = 'Ruler Edge') => {
    if (!points || points.length < 2) return;
    const currentLayer = ensureActiveLayer();
    if (!currentLayer || currentLayer.locked || !currentLayer.visible) return;

    const seamStroke = {
      id: `stroke_ruler_snap_${Date.now()}`,
      tool: activeTool === 'scissors' ? 'scissors' : 'pen',
      points: points.map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })),
      color: activeTool === 'chalk' ? '#facc15' : brushColor,
      size: Math.max(2, brushSize),
      opacity: 1.0,
      visible: true,
      isRulerLine: true,
      rulerName: rulerName,
      symmetry: symmetryEnabled,
      symmetryAxisX: symmetryAxisX,
      label: `Snapped ${rulerName}`,
    };

    setLayers((prev) =>
      prev.map((l) =>
        l.id === currentLayer.id ? { ...l, elements: [...l.elements, seamStroke] } : l
      )
    );
    setUndoStack((prev) => [...prev, { layerId: currentLayer.id, element: seamStroke }]);
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
    // If middle click or space key pressed, initiate pan
    if (e.button === 1 || e.spaceKey) {
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

      // If a specific line element from a sheet sub-layer is selected, move that specific line!
      if (selectedElementId) {
        const selLayer = layers.find((l) => l.elements.some((el) => el.id === selectedElementId));
        const selEl = selLayer?.elements.find((el) => el.id === selectedElementId);
        if (selEl) {
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

      // If clicked inside or on any cutting sheet, move the FULL cutting sheet!
      // (Lines drawn on the sheet remain permanently locked to it)
      const clickedSheet = cuttingSheets.find((s) => {
        const effW = s.isMirrored ? s.width * 2 : s.width;
        return x >= s.x && x <= s.x + effW && y >= s.y && y <= s.y + s.height;
      });
      if (clickedSheet) {
        setSelectedCuttingSheetId(clickedSheet.id);
        if (clickedSheet.layerId) setActiveLayerId(clickedSheet.layerId);
        movingPieceRef.current = {
          startX: screenX,
          startY: screenY,
          initialX: clickedSheet.x,
          initialY: clickedSheet.y,
          sheetId: clickedSheet.id,
        };
        return;
      }

      const activePieceLayer = layers.find((l) => l.id === activeLayerId) || layers[0];
      if (activePieceLayer) {
        // If this layer is linked to a cutting sheet, move the full sheet, NOT isolated lines!
        const sheetForLayer = cuttingSheets.find(
          (s) => s.id === activePieceLayer.sheetId || s.layerId === activePieceLayer.id || `layer_sheet_${s.id}` === activePieceLayer.id
        );
        if (sheetForLayer) {
          setSelectedCuttingSheetId(sheetForLayer.id);
          movingPieceRef.current = {
            startX: screenX,
            startY: screenY,
            initialX: sheetForLayer.x,
            initialY: sheetForLayer.y,
            sheetId: sheetForLayer.id,
          };
          return;
        }

        movingPieceRef.current = {
          startX: screenX,
          startY: screenY,
          initialX: activePieceLayer.offsetX,
          initialY: activePieceLayer.offsetY,
          layerId: activePieceLayer.id,
        };
      }
      return;
    }

    // Ensure a writable layer exists (creates Layer 1 if board is blank, or activates cutting sheet layer)
    const currentLayer = ensureActiveLayer({ x, y });
    if (!currentLayer || currentLayer.locked || !currentLayer.visible) return;

    // TOOL: DART MARKER
    if (activeTool === 'dart_marker') {
      // Place an anatomical dart apex with triangular legs
      const dartStroke = {
        id: `dart_${Date.now()}`,
        tool: 'dart_marker',
        apex: { x, y },
        legs: [
          { x: x - 14, y: y + 54 },
          { x: x, y: y },
          { x: x + 14, y: y + 54 },
        ],
        color: brushColor,
        size: 2,
      };

      setLayers((prev) =>
        prev.map((l) =>
          l.id === currentLayer.id ? { ...l, elements: [...l.elements, dartStroke] } : l
        )
      );
      setUndoStack((prev) => [...prev, { layerId: currentLayer.id, element: dartStroke }]);
      return;
    }

    // TOOL: TECH PEN, CHALK, SCISSORS ✂️, SEAM ALLOWANCE (BROKEN LINES), ERASER
    let startX = x;
    let startY = y;

    // Track starting point for ruler direction projection
    if (activeTool === 'chalk') {
      chalkStartRef.current = { x, y };
    }

    // Ruler edge snapping (Chalk, scissors, seam allowance)
    if (snappingEnabled && ['chalk', 'scissors', 'seam_allowance'].includes(activeTool)) {
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

    // Bold Concave Lens activation for Seam Allowance, Dart Marker, or Chalk with Ruler
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
    } else if (activeTool === 'chalk') {
      const targetRuler = activeRulers.find((r) => r.locked) || activeRulers.find((r) => r.id === selectedRulerId) || activeRulers[0];
      if (targetRuler) {
        setLensState({
          visible: true,
          x: startX,
          y: startY,
          screenX,
          screenY,
          tool: 'chalk',
          angle: Math.round(targetRuler.rotation || 0),
          label: `Straight Chalk Line (${Math.round(targetRuler.rotation || 0)}°)`,
        });
      }
    }

    const isSeam = activeTool === 'seam_allowance';
    const newStroke = {
      id: `stroke_${Date.now()}`,
      tool: activeTool,
      isSeamAllowance: isSeam,
      dashed: isSeam,
      points: [{ x: startX, y: startY }],
      color: isSeam ? '#38bdf8' : activeTool === 'eraser' ? '#090d16' : brushColor,
      size: isSeam ? 2.5 : brushSize,
      opacity: brushOpacity,
      symmetry: symmetryEnabled,
      symmetryAxisX: symmetryAxisX,
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
      setTapeMeasure((prev) => ({ ...prev, end: { x, y } }));
      return;
    }

    // Handle Piece Move
    if (isMovingPiece) {
      // Individual Sub-Layer Line Movement
      if (movingPieceRef.current.elementId) {
        const { elementId, layerId, startX, startY, initialPoints, initialApex, initialLegs } = movingPieceRef.current;
        const dx = (screenX - startX) / zoom;
        const dy = (screenY - startY) / zoom;
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
                    apex: { x: Math.round(initialApex.x + dx), y: Math.round(initialApex.y + dy) },
                    legs: initialLegs.map((pt) => ({ x: Math.round(pt.x + dx), y: Math.round(pt.y + dy) })),
                  };
                }
                if (initialPoints) {
                  const shifted = initialPoints.map((pt) => ({ x: Math.round(pt.x + dx), y: Math.round(pt.y + dy) }));
                  return {
                    ...el,
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

    // Dart Marker hover reticle lens
    if (activeTool === 'dart_marker') {
      setLensState({
        visible: true,
        x: Math.round(x),
        y: Math.round(y),
        screenX,
        screenY,
        tool: 'dart_marker',
        angle: 0,
        label: 'Dart Apex Reticle (Click to Place)',
      });
    }

    // Handle Active Stroke with Steady Stroke Stabilization & Edge Snapping
    if (isPointerDown && currentStroke) {
      let targetX = x;
      let targetY = y;

      // 1. Chalk with Ruler: Strict Straight Line Direction Constraint & Collision Avoidance
      if (currentStroke.tool === 'chalk' && activeRulers.length > 0) {
        const targetRuler = activeRulers.find((r) => r.locked) || activeRulers.find((r) => r.id === selectedRulerId) || activeRulers[0];
        if (targetRuler) {
          const startPt = chalkStartRef.current || { x: currentStroke.points[0]?.x || x, y: currentStroke.points[0]?.y || y };
          const constrained = constrainChalkToRulerDirection(x, y, startPt.x, startPt.y, targetRuler);
          targetX = constrained.x;
          targetY = constrained.y;

          // Bold Concave Lens showing exact drawing point and ruler direction
          setLensState({
            visible: true,
            x: targetX,
            y: targetY,
            screenX,
            screenY,
            tool: 'chalk',
            angle: constrained.angle,
            label: `Straight Chalk Line (${constrained.angle}°)`,
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

        // Bold Concave Lens for Seam Allowance tool
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

      setCurrentStroke((prev) => {
        if (!prev) return prev;
        const lastPt = prev.points[prev.points.length - 1];
        const dist = Math.hypot(strokeX - lastPt.x, strokeY - lastPt.y);
        // Instant 1.0px sampling for Pen handwriting so loops, curves, and letters don't lag or stick
        const decimateThreshold = prev.tool === 'pen' ? 1.0 : (steadyStrokeEnabled ? 2.5 : ((prev.tool === 'chalk' || prev.tool === 'scissors') ? 12 : 4));
        if (dist >= decimateThreshold) {
          return { ...prev, points: [...prev.points, { x: strokeX, y: strokeY }] };
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
    if (activeTool !== 'dart_marker') {
      setLensState(null);
    }
    movingPieceRef.current = { startX: 0, startY: 0, initialX: 0, initialY: 0, layerId: null, pieceId: null, sheetId: null };

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
      const firstPt = currentStroke.points[0];
      const targetLayer = ensureActiveLayer(firstPt);

      if (currentStroke.tool === 'eraser') {
        const eraserRadius = Math.max(14, currentStroke.size * 2);
        const eraserPts = currentStroke.points;
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

      const strokeToCommit = {
        ...currentStroke,
        visible: true,
        pathData: renderPointsToPath(currentStroke.points),
      };
      // Commit stroke to active layer
      setLayers((prev) =>
        prev.map((l) =>
          l.id === targetLayer.id ? { ...l, elements: [...l.elements, strokeToCommit] } : l
        )
      );
      setUndoStack((prev) => [...prev, { layerId: targetLayer.id, element: strokeToCommit }]);
      setRedoStack([]);
      setCurrentStroke(null);
    }
  };

  // -------------------------------------------------------------------------
  // 11. Undo / Redo Actions
  // -------------------------------------------------------------------------
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, lastAction]);

    setLayers((prev) =>
      prev.map((l) =>
        l.id === lastAction.layerId
          ? { ...l, elements: l.elements.filter((el) => el.id !== lastAction.element.id) }
          : l
      )
    );
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, nextAction]);

    setLayers((prev) =>
      prev.map((l) =>
        l.id === nextAction.layerId ? { ...l, elements: [...l.elements, nextAction.element] } : l
      )
    );
  };

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

  // Finger Zooming & Fluid Touch Handling (Allows pinch zoom on piece_move or board, prevents board movement when writing with pen)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchZoomRef.current = {
        startDist: dist,
        startZoom: zoom,
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
      const ratio = dist / touchZoomRef.current.startDist;
      const newZoom = Math.min(4.0, Math.max(0.25, Math.round(touchZoomRef.current.startZoom * ratio * 100) / 100));
      setZoom(newZoom);
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
    <div className="flex flex-col h-screen bg-[#090d16] text-slate-100 font-sans select-none overflow-hidden relative">
      {/* ========================================================================= */}
      {/* 1. SUB-NAVIGATION HEADER: Pattern Drafting Board FIRST, Cutting Table SECOND */}
      {/* ========================================================================= */}
      <header className="h-13 px-4 sm:px-6 bg-[#0d1322] border-b border-slate-800/90 flex items-center justify-between z-30 shrink-0 shadow-md">
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Garment Project Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-gold-sm">
              TX
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xs font-bold text-slate-200 tracking-tight leading-none">
                Bespoke Drafting Board
              </h1>
              <span className="text-[10px] text-amber-500 font-mono tracking-wider uppercase">
                Pattern & Cutting Studio
              </span>
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
          {/* CUTTING TABLE SPECIFIC ACTIONS */}
          {activeSubTab === 'cutting' && (
            <div className="flex items-center gap-2">
              {/* Fabric Preset Selector */}
              <div className="hidden lg:flex items-center gap-1.5 bg-[#060912] border border-slate-800 px-2 py-1 rounded-lg text-xs">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <select
                  value={fabricPresetId}
                  onChange={(e) => {
                    setFabricPresetId(e.target.value);
                    setFabricTexture(null);
                  }}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  {FABRIC_PRESETS.map((fp) => (
                    <option key={fp.id} value={fp.id} className="bg-slate-900 text-slate-200">
                      {fp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Fabric Texture File */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#060912] hover:bg-slate-800/80 text-xs font-semibold text-amber-400 rounded-lg cursor-pointer border border-amber-500/30 transition-all shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Fabric</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFabricUpload}
                  className="hidden"
                />
              </label>

              {/* Import Drafted Bodice Button */}
              <button
                onClick={() => setShowPatternOverlay(!showPatternOverlay)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/50 transition-all shadow-xs"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Import Drafted Bodice</span>
              </button>
            </div>
          )}

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
            </div>
          )}

          {/* Undo / Redo */}
          <div className="flex items-center bg-[#060912] border border-slate-800 rounded-lg p-0.5 text-slate-400">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800 rounded transition-all disabled:opacity-30"
              title="Undo Stroke"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 hover:text-slate-100 hover:bg-slate-800 rounded transition-all disabled:opacity-30"
              title="Redo Stroke"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Layer Panel Toggle */}
          <button
            onClick={() => setShowLayerPanel((v) => !v)}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
              showLayerPanel
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-[#060912] border-slate-800 text-slate-300 hover:bg-slate-800/60'
            }`}
            title="Toggle Autodesk SketchBook Layer Stack"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Layers</span>
          </button>

          {/* Advanced Tailor Options Drawer Trigger */}
          <button
            onClick={() => setShowAdvancedDrawer(true)}
            className="px-2.5 py-1.5 bg-[#060912] hover:bg-slate-800 border border-slate-800 text-amber-400 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
            title="Open Advanced Tailor Options (DXF export, node coordinates, exact seam offsets)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Advanced</span>
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
      {/* 2. MAIN WORKSPACE FRAME                                                   */}
      {/* ========================================================================= */}
      <div className="relative flex-1 flex overflow-hidden" ref={containerRef}>
        {/* ======================================================================= */}
        {/* SKETCHBOOK TOOLS SIDEBAR (Collapsible Floating Panel)                   */}
        {/* ======================================================================= */}
        {isToolsCollapsed ? (
          <div className="absolute top-4 left-4 z-40 bg-[#0d1322]/95 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl w-13 text-slate-100 flex flex-col items-center gap-2">
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
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
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
          <div className="absolute top-4 left-4 z-40 bg-[#0d1322]/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl w-60 max-h-[85vh] overflow-y-auto text-slate-100 flex flex-col gap-3">
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
                title="Eraser: Remove strokes and annotations"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Eraser</span>
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

              {/* Mirror Tool (Symmetry) */}
              <div className="space-y-1.5">
                <button
                  onClick={() => setSymmetryEnabled(!symmetryEnabled)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all border ${
                    symmetryEnabled
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-gold-sm'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Mirror Tool: Replicates drawing strokes symmetrically across the centerline. Can be moved freely to any position."
                >
                  <span className="flex items-center gap-1.5">
                    <FlipHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mirror Tool (Symmetry)</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800">
                    {symmetryEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Moveable Mirror Position Controls */}
                {symmetryEnabled && (
                  <div className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Move className="w-3 h-3" />
                        <span>Move Mirror Axis</span>
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

                    <div className="text-[9px] text-amber-300/80 leading-tight">
                      💡 You can also drag the golden axis line or handle directly on the workspace to position freely.
                    </div>
                  </div>
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
          <div className="absolute top-4 right-4 z-40 bg-[#0d1322]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-2xl w-84 max-w-[92vw] max-h-[75vh] overflow-y-auto text-slate-100 flex flex-col gap-3">
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
                          {/* Sheet Sub-Layer Expand / Collapse Toggle */}
                          {isSheetLayer ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandSheetLayer(layer.id);
                              }}
                              className="p-1 hover:bg-slate-700/80 rounded text-amber-400 shrink-0 transition-transform"
                              title={isExpanded ? 'Collapse Sub-layers' : 'Expand Sub-layers (Drawn lines on sheet)'}
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          ) : (
                            <span className="w-2" />
                          )}

                          {/* Checkbox for Layer Merging */}
                          <input
                            type="checkbox"
                            checked={isSelectedForMerge}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelectLayerForMerge(layer.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer shrink-0"
                            title="Select this layer to merge"
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
                              <span
                                onDoubleClick={() => startRenameLayer(layer)}
                                className="truncate text-xs font-bold text-slate-200 block"
                                title="Double-click to rename layer"
                              >
                                {layer.name}
                              </span>
                              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/80">
                                {isSheetLayer
                                  ? `Sheet Layer • (${layerElements.length} lines/sub-layers)`
                                  : layer.isGroup
                                  ? `Merged Group (${layer.mergedCount} layers)`
                                  : `${layer.bodiceType} • (${layerElements.length} strokes)`}
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

                          {/* Piece Move Shortcut */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLayerId(layer.id);
                              setSelectedElementId(null);
                              setActiveTool('piece_move');
                            }}
                            className="p-1 hover:text-amber-300 text-slate-400 rounded"
                            title="Move this Bodice / Sheet Piece"
                          >
                            <Move className="w-3.5 h-3.5" />
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

                      {/* SUB-LAYERS FOR CUT SHEET: Individual Lines drawn with rulers/curves */}
                      {isSheetLayer && isExpanded && (
                        <div className="ml-5 pl-2 border-l-2 border-amber-500/30 space-y-1 py-1">
                          {layerElements.length === 0 ? (
                            <div className="text-[10px] text-slate-500 italic py-1 px-2">
                              No lines drawn on this sheet yet. Use ruler, curve, or pen to draft.
                            </div>
                          ) : (
                            layerElements.map((el, elIdx) => {
                              const isElSelected = selectedElementId === el.id;
                              const lineName =
                                el.label ||
                                (el.rulerName ? `Snapped: ${el.rulerName}` : el.tool === 'dart_marker' ? 'Dart Marker' : el.isRulerLine ? `Ruler Line ${elIdx + 1}` : `Line ${elIdx + 1}`);

                              return (
                                <div
                                  key={el.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElementId(isElSelected ? null : el.id);
                                    setActiveLayerId(layer.id);
                                    if (!isElSelected) setActiveTool('piece_move');
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
                                    {isElSelected && (
                                      <span className="text-[9px] font-mono px-1 rounded bg-amber-500 text-slate-950 font-bold">
                                        MOVABLE
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {/* Nudge Line Movement Controls */}
                                    <button
                                      onClick={() => handleNudgeElement(layer.id, el.id, -5, 0)}
                                      className="p-1 hover:text-amber-300 text-slate-500 rounded"
                                      title="Nudge Line Left 5px"
                                    >
                                      <ArrowLeft className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => handleNudgeElement(layer.id, el.id, 5, 0)}
                                      className="p-1 hover:text-amber-300 text-slate-500 rounded"
                                      title="Nudge Line Right 5px"
                                    >
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => handleNudgeElement(layer.id, el.id, 0, -5)}
                                      className="p-1 hover:text-amber-300 text-slate-500 rounded"
                                      title="Nudge Line Up 5px"
                                    >
                                      <ArrowUp className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={() => handleNudgeElement(layer.id, el.id, 0, 5)}
                                      className="p-1 hover:text-amber-300 text-slate-500 rounded"
                                      title="Nudge Line Down 5px"
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

                                    {/* Delete Individual Line */}
                                    <button
                                      onClick={() => deleteElement(layer.id, el.id)}
                                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded"
                                      title="Delete This Line"
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

          {/* SVG Vector Drawing & Bodice Placement Plane */}
          <svg
            ref={canvasSvgRef}
            className="w-full h-full absolute inset-0 z-10"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <defs>
              {/* Grid Mat for Pattern Drafting Board */}
              <pattern id="draftingGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>
              <pattern id="majorGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#draftingGrid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1.5" />
              </pattern>
            </defs>

            {/* Grid for Pattern Drafting Board (Canvas Background) */}
            {activeSubTab === 'drafting' && (
              <rect width="4000" height="3000" fill="url(#majorGrid)" />
            )}

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

            {/* Center Mirror Symmetry Line if active (Freely Moveable Workspace Axis) */}
            {symmetryEnabled && (
              <g id="symmetry-mirror-axis">
                {/* Wide transparent interactive hit target for easy drag & move anywhere across workspace */}
                <line
                  x1={symmetryAxisX}
                  y1="0"
                  x2={symmetryAxisX}
                  y2="3200"
                  stroke="transparent"
                  strokeWidth="32"
                  className="cursor-ew-resize pointer-events-auto"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingMirrorAxis(true);
                  }}
                  title={`Drag to shift Mirror Axis (X: ${symmetryAxisX}px)`}
                />
                {/* Visual dashed golden mirror axis line */}
                <line
                  x1={symmetryAxisX}
                  y1="0"
                  x2={symmetryAxisX}
                  y2="3200"
                  stroke={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                  strokeWidth={isDraggingMirrorAxis ? 3 : 2}
                  strokeDasharray="6 4"
                  className="pointer-events-none"
                />

                {/* Top Draggable Handle Pill */}
                <g
                  className="cursor-ew-resize pointer-events-auto select-none"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingMirrorAxis(true);
                  }}
                >
                  <rect
                    x={symmetryAxisX - 95}
                    y="14"
                    width="190"
                    height="28"
                    rx="14"
                    fill="#090d16"
                    stroke={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                    strokeWidth="2"
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.5))"
                  />
                  <circle cx={symmetryAxisX - 78} cy="28" r="4" fill={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'} />
                  <text
                    x={symmetryAxisX + 6}
                    y="32"
                    fill={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ⇄ MIRROR AXIS ({symmetryAxisX}px)
                  </text>
                </g>

                {/* Mid-canvas floating circle handle */}
                <g
                  className="cursor-ew-resize pointer-events-auto select-none"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingMirrorAxis(true);
                  }}
                >
                  <circle
                    cx={symmetryAxisX}
                    cy="280"
                    r="15"
                    fill="#090d16"
                    stroke={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                    strokeWidth="2"
                  />
                  <text
                    x={symmetryAxisX}
                    y="284"
                    fill={isDraggingMirrorAxis ? '#38bdf8' : '#facc15'}
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ⇄
                  </text>
                </g>
              </g>
            )}

            {/* RENDER ALL VISIBLE LAYERS (Pattern Drafting Board) */}
            {activeSubTab === 'drafting' &&
              layers.map((layer) => {
                if (!layer.visible) return null;
                const isCurrentActive = layer.id === activeLayerId;

                // Identify if this layer belongs to an active Cutting Sheet with Mirror enabled
                const matchingSheet = cuttingSheets.find(
                  (s) => s.id === layer.sheetId || s.layerId === layer.id || `layer_sheet_${s.id}` === layer.id
                );
                const isSheetMirrored = matchingSheet?.isMirrored;
                const sheetFoldX = matchingSheet ? matchingSheet.x + matchingSheet.width : null;

                return (
                  <g
                    key={layer.id}
                    id={`layer-group-${layer.id}`}
                    transform={`translate(${layer.offsetX}, ${layer.offsetY}) rotate(${layer.rotation})`}
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
                      const isSheetLayer = Boolean(
                        layer.sheetId ||
                        cuttingSheets.some(
                          (s) => s.layerId === layer.id || s.id === layer.sheetId || `layer_sheet_${s.id}` === layer.id
                        )
                      );

                      if (el.pathData) {
                        return (
                          <g key={el.id}>
                            {/* Selected Halo Outline */}
                            {isSelected && (
                              <path
                                d={el.pathData}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth={Math.max(6, el.size + 4)}
                                strokeOpacity={0.6}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                            <path
                              d={el.pathData}
                              fill="none"
                              stroke={isSelected ? '#fbbf24' : el.color}
                              strokeWidth={el.size}
                              strokeDasharray={el.dashed ? '6 4' : 'none'}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              cursor={isSheetLayer ? 'pointer' : 'default'}
                              onClick={(e) => {
                                if (isSheetLayer) {
                                  e.stopPropagation();
                                  setSelectedElementId(el.id);
                                  setActiveLayerId(layer.id);
                                }
                              }}
                            />
                            {/* Cutting Sheet Mirrored Reflection */}
                            {isSheetMirrored && sheetFoldX != null && el.points && (
                              <path
                                d={renderPointsToPath(
                                  el.points.map((pt) => ({
                                    x: 2 * sheetFoldX - pt.x - layer.offsetX,
                                    y: pt.y - layer.offsetY,
                                  }))
                                )}
                                fill="none"
                                stroke={el.color}
                                strokeWidth={el.size}
                                strokeDasharray={el.dashed ? '6 4' : 'none'}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.88}
                              />
                            )}
                          </g>
                        );
                      }

                      if (el.tool === 'dart_marker') {
                        return (
                          <g key={el.id}>
                            {/* Selected Halo for Dart */}
                            {isSelected && (
                              <circle
                                cx={el.apex.x - layer.offsetX}
                                cy={el.apex.y - layer.offsetY}
                                r="10"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="2.5"
                                strokeDasharray="3 3"
                              />
                            )}
                            {/* Primary Dart */}
                            <g
                              stroke={isSelected ? '#fbbf24' : el.color}
                              strokeWidth={el.size}
                              cursor={isSheetLayer ? 'pointer' : 'default'}
                              onClick={(e) => {
                                if (isSheetLayer) {
                                  e.stopPropagation();
                                  setSelectedElementId(el.id);
                                  setActiveLayerId(layer.id);
                                }
                              }}
                            >
                              <circle cx={el.apex.x - layer.offsetX} cy={el.apex.y - layer.offsetY} r="4" fill={el.color} />
                              <polyline
                                points={el.legs
                                  .map((pt) => `${pt.x - layer.offsetX},${pt.y - layer.offsetY}`)
                                  .join(' ')}
                                fill="none"
                                strokeDasharray="4 3"
                              />
                              <text
                                x={el.apex.x - layer.offsetX + 8}
                                y={el.apex.y - layer.offsetY + 4}
                                fill={el.color}
                                fontSize="10"
                                fontFamily="monospace"
                              >
                                DART APEX
                              </text>
                            </g>

                            {/* Cutting Sheet Mirrored Flipped Dart */}
                            {isSheetMirrored && sheetFoldX != null && (
                              <g stroke={el.color} strokeWidth={el.size} opacity={0.88}>
                                <circle
                                  cx={2 * sheetFoldX - el.apex.x - layer.offsetX}
                                  cy={el.apex.y - layer.offsetY}
                                  r="4"
                                  fill={el.color}
                                />
                                <polyline
                                  points={el.legs
                                    .map((pt) => `${2 * sheetFoldX - pt.x - layer.offsetX},${pt.y - layer.offsetY}`)
                                    .join(' ')}
                                  fill="none"
                                  strokeDasharray="4 3"
                                />
                                <text
                                  x={2 * sheetFoldX - el.apex.x - layer.offsetX - 8}
                                  y={el.apex.y - layer.offsetY + 4}
                                  fill={el.color}
                                  fontSize="10"
                                  fontFamily="monospace"
                                  textAnchor="end"
                                >
                                  DART APEX 🪞
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      }

                      // Freehand chalk/pen/scissors stroke
                      const pathStr = renderPointsToPath(
                        el.points.map((pt) => ({
                          x: pt.x - layer.offsetX,
                          y: pt.y - layer.offsetY,
                        }))
                      );

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
                          {/* Original Stroke on Sheet */}
                          <path
                            d={pathStr}
                            fill="none"
                            stroke={isSelected ? '#fbbf24' : el.color}
                            strokeWidth={el.size}
                            strokeOpacity={el.opacity}
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

                          {/* Global Workspace Symmetry Stroke (if enabled on stroke creation) */}
                          {el.symmetry && (
                            <path
                              d={renderPointsToPath(
                                el.points.map((pt) => ({
                                  x: el.symmetryAxisX * 2 - pt.x - layer.offsetX,
                                  y: pt.y - layer.offsetY,
                                }))
                              )}
                              fill="none"
                              stroke={el.color}
                              strokeWidth={el.size}
                              strokeOpacity={el.opacity}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray={el.tool === 'scissors' || el.dashed ? '6 4' : 'none'}
                            />
                          )}

                          {/* Cutting Sheet Mirrored Flipped Reflection across sheet center fold */}
                          {isSheetMirrored && sheetFoldX != null && (
                            <path
                              d={renderPointsToPath(
                                el.points.map((pt) => ({
                                  x: 2 * sheetFoldX - pt.x - layer.offsetX,
                                  y: pt.y - layer.offsetY,
                                }))
                              )}
                              fill="none"
                              stroke={el.color}
                              strokeWidth={el.size}
                              strokeOpacity={el.opacity}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray={el.tool === 'scissors' || el.dashed ? '6 4' : 'none'}
                            />
                          )}
                        </g>
                      );
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
                        <g transform={`translate(${midX}, ${midY - 12})`}>
                          <rect
                            x="-50"
                            y="-14"
                            width="100"
                            height="22"
                            rx="6"
                            fill="#0d1322"
                            fillOpacity="0.9"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                          />
                          <text
                            x="0"
                            y="1"
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
                const layer = ensureActiveLayer();
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

        {/* Magnetic Edge Snapping Visual Ping Indicator */}
        {activeSnapPoint && activeSnapPoint.snapped && (
          <div
            className="pointer-events-none fixed z-50 flex items-center gap-1.5 transition-all duration-75 select-none"
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
            onClick={() => setZoom((prev) => Math.max(0.25, Math.round((prev - 0.25) * 100) / 100))}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded-xl transition-all"
            title="Zoom Out (Min 25%)"
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

          {/* 100% Reset / Fit */}
          <button
            onClick={() => setZoom(1.0)}
            className={`px-2 py-1 text-[11px] font-mono font-bold rounded-xl transition-all border ${
              zoom === 1.0
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/50'
            }`}
            title="Reset Zoom to 100% (1:1 CAD scale)"
          >
            100%
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
        {/* BOLD CONCAVE OPTICAL MAGNIFIER LENS HUD (Seam Allowance, Dart, Chalk)  */}
        {/* ======================================================================= */}
        {lensState && lensState.visible && (
          <div
            className="fixed pointer-events-none z-50 select-none transition-all duration-75 ease-out"
            style={{
              left: `${Math.min(window.innerWidth - 180, Math.max(20, (lensState.screenX || 200) + 40))}px`,
              top: `${Math.min(window.innerHeight - 200, Math.max(70, (lensState.screenY || 200) - 150))}px`,
            }}
          >
            {/* Bold Concave Optical Glass Lens Circle */}
            <div className="relative w-36 h-36 rounded-full border-4 border-amber-400/90 shadow-[0_0_32px_rgba(245,158,11,0.5),inset_0_0_24px_rgba(0,0,0,0.95)] flex items-center justify-center overflow-hidden bg-slate-950/90 backdrop-blur-md">
              {/* Concave Glass Reflection & Depth Gradient */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 45% 45%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 30%, rgba(15,23,42,0.65) 65%, rgba(2,6,23,0.98) 100%)',
                }}
              />

              {/* Optical Millimeter Tick Ring */}
              <div className="absolute inset-1.5 rounded-full border border-dashed border-amber-400/40 opacity-70" />
              <div className="absolute inset-4 rounded-full border border-slate-700/60" />
              <div className="absolute inset-8 rounded-full border border-slate-800/80" />

              {/* High-Precision Crosshair Reticle Lines */}
              <div className="absolute w-full h-[1px] bg-amber-400/50" />
              <div className="absolute h-full w-[1px] bg-amber-400/50" />

              {/* Directional Alignment Compass Needle / Arrow */}
              <div
                className="absolute w-full h-full flex items-center justify-center transition-transform duration-75"
                style={{ transform: `rotate(${lensState.angle || 0}deg)` }}
              >
                <div className="w-1 h-14 bg-gradient-to-t from-transparent via-amber-400 to-amber-300 rounded-full shadow-[0_0_8px_#f59e0b] -translate-y-4" />
                <div className="absolute top-2 text-[8px] font-mono font-black text-amber-300 bg-slate-950/90 px-1 rounded border border-amber-400/60 shadow">
                  ▲
                </div>
              </div>

              {/* Central Glowing Reticle Pip */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="w-3 h-3 rounded-full border-2 border-amber-300 bg-amber-400/40 shadow-[0_0_10px_#f59e0b] animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>

              {/* Broken Line Preview for Seam Allowance */}
              {lensState.tool === 'seam_allowance' && (
                <div className="absolute bottom-3 text-[9px] font-mono font-bold text-sky-300 tracking-widest bg-slate-950/90 px-2 py-0.5 rounded border border-sky-400/50 shadow">
                  - - - 5/8" - - -
                </div>
              )}
            </div>

            {/* Attached Precision Readout Badge */}
            <div className="mt-2 bg-[#090e1a]/95 backdrop-blur-md border border-amber-400/60 rounded-xl px-3 py-1.5 shadow-2xl text-center min-w-[150px]">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{lensState.label || 'OPTICAL LENS'}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-300 flex items-center justify-center gap-2 mt-0.5">
                <span>X: {Math.round(lensState.x)}</span>
                <span className="text-slate-600">|</span>
                <span>Y: {Math.round(lensState.y)}</span>
                {lensState.angle !== undefined && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span className="text-amber-400 font-bold">{lensState.angle}°</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* PERSISTENT ZOOM-SAFE FLOATING TOGGLES DOCK                              */}
        {/* Always visible on screen so sheet & ruler options are never hidden away */}
        {/* ======================================================================= */}
        <div className="fixed top-4 right-4 z-40 flex items-center gap-2 select-none">
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

                        {/* Mirror Symmetry Toggle */}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Book-Fold Mirror:</span>
                          <button
                            onClick={() => handleUpdateCuttingSheet(sheet.id, { isMirrored: !sheet.isMirrored })}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all ${
                              sheet.isMirrored
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-gold-sm'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {sheet.isMirrored ? 'MIRROR: ON' : 'MIRROR: OFF'}
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
