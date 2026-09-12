import React, { createContext, useContext, useState, useCallback } from 'react';

// Default 8-Piece Tailor's Ruler Set
export const DEFAULT_RULERS = [
  {
    id: 'l_square',
    name: 'Multi-Functional L-Square',
    shortName: 'L-Square',
    type: 'l_square',
    position: { x: 80, y: 100 },
    rotation: 0,
    isLocked: false,
    isVisible: false,
    width: 240,
    height: 160,
    description: '90° perpendicular reference for grainline and cross-grain drafting'
  },
  {
    id: 'grading_ruler',
    name: 'Straight Grading Ruler',
    shortName: 'Grading Ruler',
    type: 'grading_ruler',
    position: { x: 140, y: 120 },
    rotation: 0,
    isLocked: false,
    isVisible: false,
    width: 320,
    height: 44,
    length: 18,
    description: 'Calibrated 18" grid ruler for seam allowances and parallel offsets'
  },
  {
    id: 'hip_curve',
    name: 'Vary Form Hip Curve',
    shortName: 'Hip Curve',
    type: 'hip_curve',
    position: { x: 200, y: 140 },
    rotation: 0,
    isLocked: false,
    isVisible: false,
    width: 280,
    height: 90,
    description: 'Gradual contour curve for hip flare, side seams, and lapels'
  },
  {
    id: 'armhole_french_curve',
    name: 'Armhole French Curve',
    shortName: 'French Curve',
    type: 'armhole_french_curve',
    position: { x: 240, y: 160 },
    rotation: 0,
    isLocked: false,
    isVisible: false,
    width: 220,
    height: 150,
    description: 'Deep sweeping curve for armholes, crotch seams, and sleeve caps'
  },
  {
    id: 'neck_curve',
    name: 'Anatomical Neck Curve',
    shortName: 'Neck Curve',
    type: 'neck_curve',
    position: { x: 280, y: 180 },
    rotation: 0,
    isLocked: false,
    isVisible: false,
    width: 200,
    height: 90,
    description: 'Anatomical contour for front and back neckline drops'
  },
  {
    id: 'tape_ruler',
    name: 'Tailor Tape Measure',
    shortName: 'Tape Ruler',
    type: 'tape_ruler',
    position: { x: 320, y: 200 },
    rotation: 0,
    isLocked: false,
    isVisible: false,
    width: 360,
    height: 36,
    length: 60,
    description: 'Flexible calibrated measuring tape with 1/16" increments'
  },
  {
    id: 'straight_edge',
    name: '36-Inch Straight Edge',
    shortName: 'Straight Edge',
    type: 'straight_edge',
    position: { x: 360, y: 220 },
    rotation: 0,
    isLocked: false,
    isVisible: false,
    width: 440,
    height: 48,
    length: 36,
    description: 'Heavy 36" rigid edge for long straight hems and fold alignment'
  },
  {
    id: 'curve_bevel',
    name: 'Bevel Styling Curve',
    shortName: 'Curve Bevel',
    type: 'curve_bevel',
    position: { x: 400, y: 240 },
    rotation: 0,
    isLocked: false,
    isVisible: false,
    width: 260,
    height: 110,
    description: '45° angle guide with compound curved beveled edge'
  }
];

const CanvasContext = createContext(null);

export const CanvasProvider = ({ children }) => {
  // -------------------------------------------------------------
  // 1. Tool State
  // -------------------------------------------------------------
  // 'select' | 'chalk' | 'pen' | 'denim' | 'watercolor' | 'shears' | 'draw_cut_sheet' | 'tape_measure'
  const [activeTool, setActiveTool] = useState('chalk');
  const [brushType, setBrushType] = useState('chalk');
  const [brushColor, setBrushColor] = useState('#FFFFFF'); // White chalk default
  const [brushWidth, setBrushWidth] = useState(4);

  // -------------------------------------------------------------
  // 2. Layer Drawer Management (Defaults to COLLAPSED / false)
  // -------------------------------------------------------------
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

  // Clean initial layer stack (NO auto-imported bodice pieces)
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);

  // Add new Layer
  const addLayer = useCallback((customName, type = 'drawing') => {
    const newId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newName = customName || `Layer ${layers.length + 1}`;
    const newLayer = {
      id: newId,
      name: newName,
      visible: true,
      locked: false,
      opacity: 1.0,
      type: type,
      elements: []
    };
    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newId);
    return newLayer;
  }, [layers.length]);

  // Delete layer
  const deleteLayer = useCallback((layerId) => {
    setLayers((prev) => {
      const filtered = prev.filter((l) => l.id !== layerId);
      if (activeLayerId === layerId) {
        setActiveLayerId(filtered[filtered.length - 1]?.id || null);
      }
      return filtered;
    });
  }, [activeLayerId]);

  // Toggle Layer Visibility
  const toggleLayerVisibility = useCallback((layerId) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  }, []);

  // Toggle Layer Lock
  const toggleLayerLock = useCallback((layerId) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
      )
    );
  }, []);

  // -------------------------------------------------------------
  // 3. Dynamic Cutting Sheets Management
  // -------------------------------------------------------------
  // Initial state is strictly empty: []
  const [sheets, setSheets] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState(null);

  const addSheet = useCallback((sheetConfig = {}) => {
    const newId = `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const defaultSheet = {
      id: newId,
      name: sheetConfig.name || `Cutting Sheet ${sheets.length + 1}`,
      x: sheetConfig.x ?? (80 + (sheets.length % 4) * 40),
      y: sheetConfig.y ?? (100 + (sheets.length % 3) * 40),
      width: sheetConfig.width ?? 320,
      height: sheetConfig.height ?? 420,
      opacity: sheetConfig.opacity ?? 0.85, // 0.1 to 1.0
      isLocked: sheetConfig.isLocked ?? false,
      isMirrored: sheetConfig.isMirrored ?? false, // Side-by-side horizontal mirror
      color: sheetConfig.color || '#FFFFFF',
      type: sheetConfig.type || 'custom',
      scale: sheetConfig.scale ?? 1.0,
      notes: sheetConfig.notes || ''
    };
    setSheets((prev) => [...prev, defaultSheet]);
    setSelectedSheetId(newId);
    return defaultSheet;
  }, [sheets.length]);

  const updateSheet = useCallback((id, updates) => {
    setSheets((prev) =>
      prev.map((sheet) => (sheet.id === id ? { ...sheet, ...updates } : sheet))
    );
  }, []);

  const removeSheet = useCallback((id) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
    if (selectedSheetId === id) {
      setSelectedSheetId(null);
    }
  }, [selectedSheetId]);

  const duplicateSheet = useCallback((id) => {
    const target = sheets.find((s) => s.id === id);
    if (!target) return;
    const duplicated = {
      ...target,
      id: `sheet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${target.name} (Copy)`,
      x: target.x + 30,
      y: target.y + 30,
      isLocked: false
    };
    setSheets((prev) => [...prev, duplicated]);
    setSelectedSheetId(duplicated.id);
  }, [sheets]);

  const toggleSheetLock = useCallback((id) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isLocked: !s.isLocked } : s))
    );
  }, []);

  const toggleSheetMirror = useCallback((id) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isMirrored: !s.isMirrored } : s))
    );
  }, []);

  const setSheetOpacity = useCallback((id, opacity) => {
    const clamped = Math.max(0.1, Math.min(1.0, opacity));
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, opacity: clamped } : s))
    );
  }, []);

  // -------------------------------------------------------------
  // 4. Seam Allowance & Line Stroke Styles
  // -------------------------------------------------------------
  // 'solid' | 'dashed'
  const [strokeDashStyle, setStrokeDashStyle] = useState('solid');
  const [isDashedSeamAllowance, setIsDashedSeamAllowance] = useState(false);
  const [showSeamAllowance, setShowSeamAllowance] = useState(true);
  const seamAllowanceDash = '6 4'; // SVG strokeDasharray

  // -------------------------------------------------------------
  // 5. Canvas Zoom (1.0 to 4.0 -> Up to 400% Zoom)
  // -------------------------------------------------------------
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(4.0, Number((prev + 0.25).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  // -------------------------------------------------------------
  // 6. Unanchored 8-Ruler Toolbox System
  // -------------------------------------------------------------
  const [rulers, setRulers] = useState(DEFAULT_RULERS);
  const [activeRulerId, setActiveRulerId] = useState(null);
  const [globalRulerMovement, setGlobalRulerMovement] = useState(true); // Allows unanchored translation
  const [snapGuideActive, setSnapGuideActive] = useState(true);

  // Backward compatibility properties
  const [rulerLength, setRulerLength] = useState(18);
  const [activeRulerType, setActiveRulerType] = useState(null);

  const toggleRuler = useCallback((id, forceVisible = null) => {
    setRulers((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextVisible = forceVisible !== null ? forceVisible : !r.isVisible;
          return { ...r, isVisible: nextVisible };
        }
        return r;
      })
    );
    setActiveRulerId((prev) => (prev === id ? null : id));
  }, []);

  const updateRuler = useCallback((id, updates) => {
    setRulers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const toggleRulerLock = useCallback((id) => {
    setRulers((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isLocked: !r.isLocked } : r))
    );
  }, []);

  const closeAllRulers = useCallback(() => {
    setRulers((prev) => prev.map((r) => ({ ...r, isVisible: false })));
    setActiveRulerId(null);
  }, []);

  // -------------------------------------------------------------
  // 7. Fabric & Canvas Background Settings
  // -------------------------------------------------------------
  const [fabricWidth, setFabricWidth] = useState(58);
  const [fabricLength, setFabricLength] = useState(3.0);
  const [cutSheetColor, setCutSheetColor] = useState('#1E293B');
  const [foldStyle, setFoldStyle] = useState('lengthwise_fold');
  const [infraredGuideActive, setInfraredGuideActive] = useState(true);
  const [showAdvancedDrawer, setShowAdvancedDrawer] = useState(false);

  return (
    <CanvasContext.Provider
      value={{
        // Tools & Brushes
        activeTool, setActiveTool,
        brushType, setBrushType,
        brushColor, setBrushColor,
        brushWidth, setBrushWidth,

        // Layer Panel
        isLayerPanelOpen, setIsLayerPanelOpen,
        layers, setLayers,
        activeLayerId, setActiveLayerId,
        addLayer, deleteLayer,
        toggleLayerVisibility, toggleLayerLock,

        // Cutting Sheets Management
        sheets, setSheets,
        selectedSheetId, setSelectedSheetId,
        addSheet, updateSheet, removeSheet,
        duplicateSheet, toggleSheetLock, toggleSheetMirror,
        setSheetOpacity,

        // Line Styles & Seam Allowance
        strokeDashStyle, setStrokeDashStyle,
        isDashedSeamAllowance, setIsDashedSeamAllowance,
        showSeamAllowance, setShowSeamAllowance,
        seamAllowanceDash,

        // Zoom (Up to 400%)
        zoomLevel, setZoomLevel,
        zoomIn, zoomOut, resetZoom,

        // Unanchored 8-Ruler System
        rulers, setRulers,
        activeRulerId, setActiveRulerId,
        globalRulerMovement, setGlobalRulerMovement,
        snapGuideActive, setSnapGuideActive,
        toggleRuler, updateRuler, toggleRulerLock, closeAllRulers,
        rulerLength, setRulerLength,
        activeRulerType, setActiveRulerType,

        // Fabric & Workboard Environment
        fabricWidth, setFabricWidth,
        fabricLength, setFabricLength,
        cutSheetColor, setCutSheetColor,
        foldStyle, setFoldStyle,
        infraredGuideActive, setInfraredGuideActive,
        showAdvancedDrawer, setShowAdvancedDrawer
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  return context || {};
};
