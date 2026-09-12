import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Scissors,
  Ruler,
  RotateCw,
  FlipHorizontal,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Move,
  Grid,
  Check,
  Compass,
  Square,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';
import Toolbar from './Toolbar';
import LayerPanel from './LayerPanel';
import AdvancedTailorDrawer from '../CAD/AdvancedTailorDrawer';

// Fabric Weave Texture Presets
const FABRIC_TEXTURES = {
  slate_mat: {
    name: 'Self-Healing Cutting Mat',
    background: '#1E293B',
    gridColor: 'rgba(255, 255, 255, 0.08)',
  },
  raw_denim: {
    name: 'Raw Indigo Denim',
    background: '#172554',
    gridColor: 'rgba(255, 255, 255, 0.05)',
  },
  linen_weave: {
    name: 'Natural Flax Linen',
    background: '#334155',
    gridColor: 'rgba(255, 255, 255, 0.07)',
  }
};

export default function CanvasWorkspace({ onOpenLayers }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Undo / Redo history stacks
  const historyRef = useRef([]);
  const historyStepRef = useRef(-1);
  const isUpdatingRef = useRef(false);

  // Context State
  const {
    activeTool,
    setActiveTool,
    brushType,
    brushColor,
    brushWidth,
    cutSheetColor,
    infraredGuideActive,
    showAdvancedDrawer,
    setShowAdvancedDrawer,

    // Layer Panel
    isLayerPanelOpen,
    setIsLayerPanelOpen,
    layers,
    activeLayerId,
    ensureActiveLayer,

    // Dynamic Cutting Sheets
    sheets,
    selectedSheetId,
    setSelectedSheetId,
    addSheet,
    updateSheet,
    removeSheet,
    duplicateSheet,
    toggleSheetLock,
    toggleSheetMirror,
    setSheetOpacity,

    // Seam Allowance & Line Styles
    strokeDashStyle,
    setStrokeDashStyle,
    isDashedSeamAllowance,
    setIsDashedSeamAllowance,
    showSeamAllowance,
    seamAllowanceDash,

    // Zoom
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,

    // 8-Ruler Toolbox
    rulers,
    activeRulerId,
    setActiveRulerId,
    toggleRuler,
    updateRuler,
    toggleRulerLock,
    globalRulerMovement,
    snapGuideActive,
  } = useCanvas();

  // -------------------------------------------------------------
  // 'Draw Cut Sheet' Tool Drag Creation State
  // -------------------------------------------------------------
  const [isDrawingSheet, setIsDrawingSheet] = useState(false);
  const [sheetStartPos, setSheetStartPos] = useState({ x: 0, y: 0 });
  const [sheetCurrentPos, setSheetCurrentPos] = useState({ x: 0, y: 0 });

  // Dragging Sheet State
  const [draggingSheetId, setDraggingSheetId] = useState(null);
  const [sheetDragOffset, setSheetDragOffset] = useState({ x: 0, y: 0 });

  // Resizing Sheet State
  const [resizingSheetId, setResizingSheetId] = useState(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Dragging Ruler State
  const [draggingRulerId, setDraggingRulerId] = useState(null);
  const [rulerDragOffset, setRulerDragOffset] = useState({ x: 0, y: 0 });

  // Ruler Toolbox Drawer toggle
  const [showRulerPalette, setShowRulerPalette] = useState(false);

  // Save history snapshot for Undo/Redo
  const saveState = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || isUpdatingRef.current) return;

    try {
      const json = JSON.stringify(canvas.toJSON());
      if (historyStepRef.current < historyRef.current.length - 1) {
        historyRef.current = historyRef.current.slice(0, historyStepRef.current + 1);
      }
      historyRef.current.push(json);
      historyStepRef.current = historyRef.current.length - 1;
    } catch (e) {
      console.warn('History save issue:', e);
    }
  }, []);

  const handleUndo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current <= 0) return;

    isUpdatingRef.current = true;
    historyStepRef.current -= 1;
    const previousState = historyRef.current[historyStepRef.current];

    canvas.loadFromJSON(previousState, () => {
      canvas.renderAll();
      isUpdatingRef.current = false;
    });
  }, []);

  const handleRedo = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || historyStepRef.current >= historyRef.current.length - 1) return;

    isUpdatingRef.current = true;
    historyStepRef.current += 1;
    const nextState = historyRef.current[historyStepRef.current];

    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      isUpdatingRef.current = false;
    });
  }, []);

  const handleClear = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.clear();
    saveState();
  }, [saveState]);

  // -------------------------------------------------------------
  // Initialize Fabric.js Canvas (EMPTY - ZERO PRE-LOADED PIECES)
  // -------------------------------------------------------------
  useEffect(() => {
    let canvasInstance = null;

    import('fabric')
      .then((fabricModule) => {
        const Fabric = fabricModule.fabric || fabricModule;
        if (!canvasRef.current || !Fabric?.Canvas) return;

        // Clean Canvas Board with transparent background so fabric grid & sheets show through
        canvasInstance = new Fabric.Canvas(canvasRef.current, {
          width: window.innerWidth,
          height: window.innerHeight - 64,
          backgroundColor: 'transparent',
          isDrawingMode: true,
          selection: activeTool === 'select',
        });

        fabricCanvasRef.current = canvasInstance;

        // Configure Drawing Brush with steady line stabilization
        if (canvasInstance.freeDrawingBrush) {
          canvasInstance.freeDrawingBrush.color = brushColor || '#FFFFFF';
          canvasInstance.freeDrawingBrush.width = brushWidth || 4;
          canvasInstance.freeDrawingBrush.decimate = 8;
        }

        saveState();

        canvasInstance.on('object:added', () => saveState());
        canvasInstance.on('object:modified', () => saveState());

        setIsReady(true);
      })
      .catch((err) => {
        console.warn('Fabric.js loading error:', err);
      });

    const handleMouseMove = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.setWidth(window.innerWidth);
        fabricCanvasRef.current.setHeight(window.innerHeight - 64);
        fabricCanvasRef.current.renderAll();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (canvasInstance) {
        canvasInstance.dispose();
      }
    };
  }, []);

  // Update Brush parameters and Drawing Mode
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const isDrawing =
      activeTool === 'chalk' ||
      activeTool === 'pen' ||
      activeTool === 'denim' ||
      activeTool === 'watercolor' ||
      activeTool === 'shears';

    canvas.isDrawingMode = isDrawing;
    canvas.selection = activeTool === 'select';

    if (canvas.freeDrawingBrush && isDrawing) {
      if (activeTool === 'chalk') {
        canvas.freeDrawingBrush.color = brushColor || '#FFFFFF';
        canvas.freeDrawingBrush.width = 4;
        canvas.freeDrawingBrush.decimate = 8;
        // Broken seam allowance dash support
        if (strokeDashStyle === 'dashed' || isDashedSeamAllowance) {
          canvas.freeDrawingBrush.strokeDashArray = [6, 4];
        } else {
          canvas.freeDrawingBrush.strokeDashArray = null;
        }
      } else if (activeTool === 'pen') {
        canvas.freeDrawingBrush.color = brushColor || '#1E293B';
        canvas.freeDrawingBrush.width = 2;
        canvas.freeDrawingBrush.decimate = 4;
        if (strokeDashStyle === 'dashed' || isDashedSeamAllowance) {
          canvas.freeDrawingBrush.strokeDashArray = [6, 4];
        } else {
          canvas.freeDrawingBrush.strokeDashArray = null;
        }
      } else if (activeTool === 'denim') {
        canvas.freeDrawingBrush.color = brushColor || '#1E3A8A';
        canvas.freeDrawingBrush.width = 16;
        canvas.freeDrawingBrush.decimate = 10;
        canvas.freeDrawingBrush.strokeDashArray = null;
      } else if (activeTool === 'watercolor') {
        canvas.freeDrawingBrush.color = brushColor || '#F5D0B5';
        canvas.freeDrawingBrush.width = 24;
        canvas.freeDrawingBrush.decimate = 12;
        canvas.freeDrawingBrush.strokeDashArray = null;
      } else if (activeTool === 'shears') {
        // Shears cutting stroke: dashed cutting line
        canvas.freeDrawingBrush.color = '#F43F5E';
        canvas.freeDrawingBrush.width = 3;
        canvas.freeDrawingBrush.decimate = 6;
        canvas.freeDrawingBrush.strokeDashArray = [6, 4];
      }
    }
  }, [activeTool, brushColor, brushWidth, brushType, strokeDashStyle, isDashedSeamAllowance]);

  // -------------------------------------------------------------
  // Stamp Rulers onto Active Canvas (Broken/Dashed Seam Allowance)
  // -------------------------------------------------------------
  const stampRulerPath = useCallback(
    (ruler) => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      import('fabric').then((fabricModule) => {
        const Fabric = fabricModule.fabric || fabricModule;
        const rad = ((ruler.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        const strokeColor = brushColor || '#FACC15';
        const isDashed = strokeDashStyle === 'dashed' || isDashedSeamAllowance;
        const dashArray = isDashed ? [6, 4] : null;

        if (
          ruler.type === 'grading_ruler' ||
          ruler.type === 'straight_edge' ||
          ruler.type === 'tape_ruler'
        ) {
          // Stamp straight line with dashed or solid stroke
          const len = ruler.width || 320;
          const x2 = ruler.position.x + len * cos;
          const y2 = ruler.position.y + len * sin;

          const line = new Fabric.Line([ruler.position.x, ruler.position.y, x2, y2], {
            stroke: strokeColor,
            strokeWidth: isDashed ? 2 : 2.5,
            strokeDashArray: dashArray,
            selectable: true,
          });

          canvas.add(line);
        } else if (ruler.type === 'l_square') {
          // Stamp 90° Corner
          const w = ruler.width || 240;
          const h = ruler.height || 160;
          // Leg 1: along rotation angle
          const x2 = ruler.position.x + w * cos;
          const y2 = ruler.position.y + w * sin;
          // Leg 2: perpendicular 90°
          const x3 = ruler.position.x - h * sin;
          const y3 = ruler.position.y + h * cos;

          const pathStr = `M ${x2} ${y2} L ${ruler.position.x} ${ruler.position.y} L ${x3} ${y3}`;
          const corner = new Fabric.Path(pathStr, {
            stroke: strokeColor,
            strokeWidth: 2,
            fill: '',
            strokeDashArray: dashArray,
            selectable: true,
          });
          canvas.add(corner);
        } else if (ruler.type === 'hip_curve') {
          // Vary Form Hip Curve
          const pathStr = `M ${ruler.position.x} ${ruler.position.y} C ${ruler.position.x + 80 * cos - 15 * sin} ${ruler.position.y + 80 * sin + 15 * cos}, ${ruler.position.x + 180 * cos - 40 * sin} ${ruler.position.y + 180 * sin + 40 * cos}, ${ruler.position.x + 280 * cos - 80 * sin} ${ruler.position.y + 280 * sin + 80 * cos}`;
          const curve = new Fabric.Path(pathStr, {
            stroke: strokeColor,
            strokeWidth: 2,
            fill: '',
            strokeDashArray: dashArray,
            selectable: true,
          });
          canvas.add(curve);
        } else if (ruler.type === 'armhole_french_curve') {
          // French Curve Armhole sweep
          const pathStr = `M ${ruler.position.x} ${ruler.position.y} C ${ruler.position.x + 40 * cos - 60 * sin} ${ruler.position.y + 40 * sin + 60 * cos}, ${ruler.position.x + 100 * cos - 130 * sin} ${ruler.position.y + 100 * sin + 130 * cos}, ${ruler.position.x + 160 * cos - 160 * sin} ${ruler.position.y + 160 * sin + 160 * cos}`;
          const curve = new Fabric.Path(pathStr, {
            stroke: strokeColor,
            strokeWidth: 2.5,
            fill: '',
            strokeDashArray: dashArray,
            selectable: true,
          });
          canvas.add(curve);
        } else if (ruler.type === 'neck_curve') {
          // Anatomical Neckline Drop Curve
          const pathStr = `M ${ruler.position.x} ${ruler.position.y} Q ${ruler.position.x + 70 * cos - 80 * sin} ${ruler.position.y + 70 * sin + 80 * cos} ${ruler.position.x + 160 * cos - 10 * sin} ${ruler.position.y + 160 * sin + 10 * cos}`;
          const curve = new Fabric.Path(pathStr, {
            stroke: strokeColor,
            strokeWidth: 2.5,
            fill: '',
            strokeDashArray: dashArray,
            selectable: true,
          });
          canvas.add(curve);
        } else {
          // Curve Bevel & others
          const pathStr = `M ${ruler.position.x} ${ruler.position.y} Q ${ruler.position.x + 80 * cos - 30 * sin} ${ruler.position.y + 80 * sin + 30 * cos} ${ruler.position.x + 180 * cos - 80 * sin} ${ruler.position.y + 180 * sin + 80 * cos}`;
          const curve = new Fabric.Path(pathStr, {
            stroke: strokeColor,
            strokeWidth: 2,
            fill: '',
            strokeDashArray: dashArray,
            selectable: true,
          });
          canvas.add(curve);
        }

        canvas.renderAll();
        saveState();
      });
    },
    [brushColor, strokeDashStyle, isDashedSeamAllowance, saveState]
  );

  // -------------------------------------------------------------
  // 'Draw Cut Sheet' Drag Events
  // -------------------------------------------------------------
  const handleBoardMouseDown = (e) => {
    if (activeTool !== 'draw_cut_sheet') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Viewport relative coordinates accounting for zoom
    const startX = (e.clientX - rect.left) / zoomLevel;
    const startY = (e.clientY - rect.top) / zoomLevel;

    setIsDrawingSheet(true);
    setSheetStartPos({ x: startX, y: startY });
    setSheetCurrentPos({ x: startX, y: startY });
  };

  const handleBoardMouseMove = (e) => {
    if (!isDrawingSheet) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const curX = (e.clientX - rect.left) / zoomLevel;
    const curY = (e.clientY - rect.top) / zoomLevel;
    setSheetCurrentPos({ x: curX, y: curY });
  };

  const handleBoardMouseUp = () => {
    if (!isDrawingSheet) return;
    setIsDrawingSheet(false);

    const x = Math.min(sheetStartPos.x, sheetCurrentPos.x);
    const y = Math.min(sheetStartPos.y, sheetCurrentPos.y);
    const w = Math.abs(sheetCurrentPos.x - sheetStartPos.x);
    const h = Math.abs(sheetCurrentPos.y - sheetStartPos.y);

    // Minimum size threshold to create a cutting sheet (e.g. 40x40 px)
    if (w >= 40 && h >= 40) {
      addSheet({
        name: `Custom Trace Sheet ${sheets.length + 1}`,
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(w),
        height: Math.round(h),
        opacity: 0.85,
        isLocked: false,
        isMirrored: false,
        color: '#FFFFFF',
      });
    }
  };

  // -------------------------------------------------------------
  // Cutting Sheet Dragging & Resizing Handlers
  // -------------------------------------------------------------
  const startDragSheet = (e, sheet) => {
    if (sheet.isLocked) return;
    e.stopPropagation();
    setSelectedSheetId(sheet.id);
    setDraggingSheetId(sheet.id);
    setSheetDragOffset({
      x: e.clientX / zoomLevel - sheet.x,
      y: e.clientY / zoomLevel - sheet.y,
    });
  };

  const startResizeSheet = (e, sheet) => {
    if (sheet.isLocked) return;
    e.stopPropagation();
    setResizingSheetId(sheet.id);
    setResizeStart({
      x: e.clientX / zoomLevel,
      y: e.clientY / zoomLevel,
      w: sheet.width,
      h: sheet.height,
    });
  };

  // Ruler Drag Handlers
  const startDragRuler = (e, ruler) => {
    if (ruler.isLocked) return;
    e.stopPropagation();
    setActiveRulerId(ruler.id);
    setDraggingRulerId(ruler.id);
    setRulerDragOffset({
      x: e.clientX / zoomLevel - ruler.position.x,
      y: e.clientY / zoomLevel - ruler.position.y,
    });
  };

  // Global mouse move and up for dragging sheets, rulers, resizing
  useEffect(() => {
    const onWindowMouseMove = (e) => {
      // 1. Dragging Sheet
      if (draggingSheetId) {
        const newX = Math.max(0, Math.round(e.clientX / zoomLevel - sheetDragOffset.x));
        const newY = Math.max(0, Math.round(e.clientY / zoomLevel - sheetDragOffset.y));
        updateSheet(draggingSheetId, { x: newX, y: newY });
      }

      // 2. Resizing Sheet
      if (resizingSheetId) {
        const deltaX = e.clientX / zoomLevel - resizeStart.x;
        const deltaY = e.clientY / zoomLevel - resizeStart.y;
        const newW = Math.max(80, Math.round(resizeStart.w + deltaX));
        const newH = Math.max(80, Math.round(resizeStart.h + deltaY));
        updateSheet(resizingSheetId, { width: newW, height: newH });
      }

      // 3. Dragging Ruler
      if (draggingRulerId) {
        const newX = Math.max(0, Math.round(e.clientX / zoomLevel - rulerDragOffset.x));
        const newY = Math.max(0, Math.round(e.clientY / zoomLevel - rulerDragOffset.y));
        updateRuler(draggingRulerId, { position: { x: newX, y: newY } });
      }
    };

    const onWindowMouseUp = () => {
      if (draggingSheetId) setDraggingSheetId(null);
      if (resizingSheetId) setResizingSheetId(null);
      if (draggingRulerId) setDraggingRulerId(null);
    };

    if (draggingSheetId || resizingSheetId || draggingRulerId) {
      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
      return () => {
        window.removeEventListener('mousemove', onWindowMouseMove);
        window.removeEventListener('mouseup', onWindowMouseUp);
      };
    }
  }, [
    draggingSheetId,
    resizingSheetId,
    draggingRulerId,
    sheetDragOffset,
    resizeStart,
    rulerDragOffset,
    zoomLevel,
    updateSheet,
    updateRuler,
  ]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleBoardMouseDown}
      onMouseMove={handleBoardMouseMove}
      onMouseUp={handleBoardMouseUp}
      className={`relative w-full h-[calc(100vh-64px)] bg-slate-950 overflow-hidden select-none ${
        activeTool === 'draw_cut_sheet' ? 'cursor-crosshair' : 'cursor-default'
      }`}
      id="tailorix-studio-workspace"
    >
      {/* 1. Top Creative Floating Toolbar */}
      <Toolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onOpenLayers={() => setIsLayerPanelOpen((v) => !v)}
      />

      {/* 2. Scalable Viewport Canvas Board (Supports up to 400% zoom) */}
      <div
        className="w-full h-full relative transition-transform duration-75 origin-top-left"
        style={{
          transform: `scale(${zoomLevel})`,
          width: `${100 / zoomLevel}%`,
          height: `${100 / zoomLevel}%`,
        }}
      >
        {/* Underlying Fabric Cutting Mat Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${FABRIC_TEXTURES.slate_mat.gridColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${FABRIC_TEXTURES.slate_mat.gridColor} 1px, transparent 1px),
              linear-gradient(to right, rgba(255, 255, 255, 0.03) 5px, transparent 5px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 5px, transparent 5px)
            `,
            backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
          }}
        />

        {/* ----------------------------------------------------------- */}
        {/* 3. Dynamic White Rectangular Cutting Sheets                 */}
        {/* ----------------------------------------------------------- */}
        {sheets.map((sheet) => {
          const isSelected = selectedSheetId === sheet.id;
          const displayWidth = sheet.isMirrored ? sheet.width * 2 : sheet.width;

          return (
            <div
              key={sheet.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSheetId(sheet.id);
              }}
              className={`absolute rounded-xl shadow-2xl transition-shadow flex flex-col ${
                isSelected
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-amber-500/10'
                  : 'border border-slate-700/60 hover:border-slate-500/80'
              }`}
              style={{
                left: `${sheet.x}px`,
                top: `${sheet.y}px`,
                width: `${displayWidth}px`,
                height: `${sheet.height}px`,
                backgroundColor: `rgba(255, 255, 255, ${sheet.opacity})`,
                zIndex: isSelected ? 15 : 10,
              }}
              id={`cut-sheet-${sheet.id}`}
            >
              {/* Sheet Control Header Bar */}
              <div
                onMouseDown={(e) => startDragSheet(e, sheet)}
                className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-t-xl border-b border-slate-700/80 text-slate-200 cursor-move"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider truncate text-amber-300">
                    {sheet.name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {Math.round(sheet.width / 10)}" × {Math.round(sheet.height / 10)}"
                  </span>
                  {sheet.isMirrored && (
                    <span className="text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1 rounded uppercase">
                      Unfolded Mirror
                    </span>
                  )}
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Opacity Slider Control (0.1 to 1.0) */}
                  <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700/50">
                    <Sliders className="w-3 h-3 text-slate-400" />
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={sheet.opacity}
                      onChange={(e) => setSheetOpacity(sheet.id, parseFloat(e.target.value))}
                      className="w-14 h-1 accent-amber-400 cursor-pointer"
                      title={`Sheet Fabric Opacity: ${Math.round(sheet.opacity * 100)}%`}
                    />
                    <span className="text-[9px] font-mono text-amber-300 w-6 text-right">
                      {Math.round(sheet.opacity * 100)}%
                    </span>
                  </div>

                  {/* Mirror / Unfolded Wide View Toggle */}
                  <button
                    onClick={() => toggleSheetMirror(sheet.id)}
                    className={`p-1 rounded-lg transition-colors ${
                      sheet.isMirrored
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Toggle Side-by-Side Horizontal Mirror (Unfolded wide view for trace-cutting)"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {/* Duplicate Sheet */}
                  <button
                    onClick={() => duplicateSheet(sheet.id)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Duplicate Cutting Sheet"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Lock / Unlock Coordinates */}
                  <button
                    onClick={() => toggleSheetLock(sheet.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    title={sheet.isLocked ? 'Unlock Sheet Movement' : 'Lock Sheet Coordinates'}
                  >
                    {sheet.isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Delete Sheet */}
                  <button
                    onClick={() => removeSheet(sheet.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Cutting Sheet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sheet Interior Fabric Trace Area */}
              <div className="flex-1 relative overflow-hidden flex">
                {sheet.isMirrored ? (
                  <>
                    {/* Left Panel (Face Side) */}
                    <div className="flex-1 border-r border-dashed border-sky-400/80 relative flex items-center justify-center p-3">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                        LEFT PANEL (FACE)
                      </span>
                      {/* Seam Allowance Perimeter Indicator (6 4 dash) */}
                      <div
                        className="absolute inset-2 border-2 border-dashed border-slate-400/40 rounded-lg pointer-events-none"
                        style={{ strokeDasharray: seamAllowanceDash }}
                      />
                    </div>

                    {/* Center Fold / Mirror Line */}
                    <div className="w-0 relative flex flex-col items-center justify-center">
                      <div className="absolute top-2 -translate-x-1/2 bg-sky-500 text-slate-950 font-bold text-[8px] px-1 py-0.5 rounded font-mono uppercase tracking-widest z-10 shadow">
                        FOLD
                      </div>
                    </div>

                    {/* Right Panel (Mirrored Pair Side) */}
                    <div className="flex-1 relative flex items-center justify-center p-3">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                        RIGHT PANEL (MIRROR)
                      </span>
                      {/* Seam Allowance Perimeter Indicator */}
                      <div
                        className="absolute inset-2 border-2 border-dashed border-slate-400/40 rounded-lg pointer-events-none"
                        style={{ strokeDasharray: seamAllowanceDash }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full relative flex items-center justify-center p-3">
                    <span className="text-[10px] font-bold text-slate-500/70 uppercase tracking-widest font-mono">
                      FABRIC TRACE CUT SHEET AREA
                    </span>
                    {/* Broken Seam Allowance dashed boundary */}
                    <div
                      className="absolute inset-2.5 border-2 border-dashed border-slate-400/30 rounded-lg pointer-events-none"
                      style={{ strokeDasharray: seamAllowanceDash }}
                    />
                  </div>
                )}

                {/* Bottom-Right Resize Handle */}
                {!sheet.isLocked && (
                  <div
                    onMouseDown={(e) => startResizeSheet(e, sheet)}
                    className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors z-20"
                    title="Drag to resize cutting sheet"
                  >
                    <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-current" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Drag-Creation Rect for 'Draw Cut Sheet' Tool */}
        {isDrawingSheet && (
          <div
            className="absolute border-2 border-dashed border-amber-400 bg-amber-400/10 rounded-xl pointer-events-none z-30 flex items-center justify-center"
            style={{
              left: `${Math.min(sheetStartPos.x, sheetCurrentPos.x)}px`,
              top: `${Math.min(sheetStartPos.y, sheetCurrentPos.y)}px`,
              width: `${Math.abs(sheetCurrentPos.x - sheetStartPos.x)}px`,
              height: `${Math.abs(sheetCurrentPos.y - sheetStartPos.y)}px`,
            }}
          >
            <span className="bg-amber-400 text-slate-950 text-[10px] font-bold font-mono px-2 py-0.5 rounded shadow">
              {Math.round(Math.abs(sheetCurrentPos.x - sheetStartPos.x) / 10)}" ×{' '}
              {Math.round(Math.abs(sheetCurrentPos.y - sheetStartPos.y) / 10)}"
            </span>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* 4. Fabric.js Vector Drawing Canvas                          */}
        {/* ----------------------------------------------------------- */}
        <canvas ref={canvasRef} className="w-full h-full touch-none" />

        {/* ----------------------------------------------------------- */}
        {/* 5. Unanchored 8-Ruler Toolbox System (Interactive Overlays) */}
        {/* ----------------------------------------------------------- */}
        {rulers
          .filter((r) => r.isVisible)
          .map((ruler) => (
            <div
              key={ruler.id}
              onMouseDown={(e) => startDragRuler(e, ruler)}
              className="absolute z-40 p-2.5 bg-slate-900/95 backdrop-blur-md border border-amber-400/70 rounded-2xl shadow-2xl cursor-move text-slate-100 flex flex-col gap-2 ring-1 ring-amber-400/30"
              style={{
                left: `${ruler.position.x}px`,
                top: `${ruler.position.y}px`,
                transform: `rotate(${ruler.rotation || 0}deg)`,
                transformOrigin: 'top left',
              }}
              id={`ruler-${ruler.id}`}
            >
              {/* Ruler Top Bar */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    {ruler.shortName || ruler.name}
                  </span>
                </div>

                {/* Rotation & Lock Controls */}
                <div
                  className="flex items-center gap-1 text-[10px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      updateRuler(ruler.id, {
                        rotation: ((ruler.rotation || 0) - 15 + 360) % 360,
                      })
                    }
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono"
                    title="Rotate -15°"
                  >
                    -15°
                  </button>
                  <button
                    onClick={() =>
                      updateRuler(ruler.id, {
                        rotation: ((ruler.rotation || 0) + 15) % 360,
                      })
                    }
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono"
                    title="Rotate +15°"
                  >
                    +15°
                  </button>
                  <button
                    onClick={() => toggleRulerLock(ruler.id)}
                    className="p-1 hover:bg-slate-800 rounded transition-colors"
                    title={ruler.isLocked ? 'Unlock Ruler' : 'Lock Ruler Position'}
                  >
                    {ruler.isLocked ? (
                      <Lock className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Unlock className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => toggleRuler(ruler.id, false)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                    title="Close Ruler"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Ruler Body Visualization */}
              {ruler.type === 'l_square' && (
                <svg className="w-64 h-32 bg-slate-950/60 rounded-xl border border-amber-500/20" viewBox="0 0 240 120">
                  <path d="M 10 10 L 230 10 M 10 10 L 10 110" stroke="#FACC15" strokeWidth="4" />
                  <rect x="10" y="10" width="16" height="16" fill="none" stroke="#FACC15" strokeWidth="1" />
                  <text x="110" y="30" fill="#FDE047" fontSize="10" fontFamily="monospace">90° L-SQUARE</text>
                </svg>
              )}

              {ruler.type === 'hip_curve' && (
                <svg className="w-64 h-24 bg-slate-950/60 rounded-xl border border-purple-500/20" viewBox="0 0 240 90">
                  <path d="M 10 15 C 70 30, 150 55, 230 80" stroke="#C084FC" strokeWidth="3" fill="none" />
                  <text x="80" y="45" fill="#E9D5FF" fontSize="10" fontFamily="sans-serif">HIP FLARE CURVE</text>
                </svg>
              )}

              {ruler.type === 'armhole_french_curve' && (
                <svg className="w-64 h-24 bg-slate-950/60 rounded-xl border border-sky-500/20" viewBox="0 0 240 90">
                  <path d="M 15 15 C 45 45, 95 80, 160 75 S 220 20, 230 15" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
                  <text x="70" y="55" fill="#7DD3FC" fontSize="9" fontFamily="sans-serif">ARMHOLE SWEEP</text>
                </svg>
              )}

              {ruler.type === 'neck_curve' && (
                <svg className="w-64 h-20 bg-slate-950/60 rounded-xl border border-teal-500/20" viewBox="0 0 240 75">
                  <path d="M 15 15 Q 110 70, 225 15" fill="none" stroke="#2DD4BF" strokeWidth="3" />
                  <text x="75" y="45" fill="#99F6E4" fontSize="9" fontFamily="sans-serif">ANATOMICAL NECK</text>
                </svg>
              )}

              {(ruler.type === 'grading_ruler' || ruler.type === 'straight_edge' || ruler.type === 'tape_ruler') && (
                <div className="w-72 h-8 bg-amber-500/10 border border-amber-500/30 rounded flex items-end justify-between px-2 text-[8px] font-mono text-amber-300">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="h-3.5 w-px bg-amber-400" />
                      <span>{i * 2}"</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Edge Snap Action Button */}
              <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-[9px] font-mono text-slate-400">
                  {ruler.rotation}° | {ruler.isLocked ? 'LOCKED' : 'DRAG TO POSITION'}
                </span>
                <button
                  onClick={() => stampRulerPath(ruler)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold shadow uppercase tracking-wider transition-colors"
                >
                  Snap Seam Line
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 6. Floating Zoom Controls Widget (Up to 400% Zoom)          */}
      {/* ----------------------------------------------------------- */}
      <div
        className="absolute bottom-4 left-4 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5 ring-1 ring-white/10 select-none text-slate-200"
        id="studio-zoom-widget"
      >
        <button
          onClick={zoomOut}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          title="Zoom Out (-25%)"
          id="btn-zoom-out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={resetZoom}
          className="px-2 py-1 bg-slate-800/90 hover:bg-slate-800 rounded-xl text-xs font-mono font-bold text-amber-300 transition-colors"
          title="Reset Zoom to 100%"
          id="btn-zoom-reset"
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <button
          onClick={zoomIn}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          title="Zoom In (+25% up to 400%)"
          id="btn-zoom-in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Max 400% zoom pill indicator */}
        <span className="text-[9px] font-mono text-slate-500 px-1 border-l border-slate-800">
          MAX 4X
        </span>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 7. Floating 8-Ruler Toolbox Trigger Button & Drawer         */}
      {/* ----------------------------------------------------------- */}
      <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setShowRulerPalette((v) => !v)}
          className={`px-3 py-2 rounded-2xl backdrop-blur-md border shadow-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all select-none ${
            showRulerPalette
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
              : 'bg-slate-900/95 text-slate-300 border-slate-700/80 hover:text-white hover:bg-slate-800'
          }`}
          id="btn-ruler-toolbox"
        >
          <Ruler className="w-4 h-4" />
          <span>8-Ruler Toolbox</span>
          <span className="text-[10px] font-mono bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded">
            {rulers.filter((r) => r.isVisible).length} Active
          </span>
        </button>

        {/* 8-Ruler Selector Popover Drawer */}
        {showRulerPalette && (
          <div
            className="absolute bottom-12 right-0 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl text-slate-100 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150"
            id="ruler-palette-drawer"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Tailor's 8-Ruler Suite
              </span>
              <span className="text-[9px] font-mono text-slate-400">UNANCHORED CAD</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {rulers.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggleRuler(r.id)}
                  className={`p-2 rounded-xl border text-left text-[11px] font-bold transition-all truncate flex items-center justify-between ${
                    r.isVisible
                      ? 'bg-amber-500/20 border-amber-400/80 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={r.description}
                >
                  <span className="truncate">{r.shortName || r.name}</span>
                  {r.isVisible && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                </button>
              ))}
            </div>

            <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
              Drag anywhere to unanchor. Rotate via +/-15° handles or click 'Snap Seam Line' to deposit parametric vector paths.
            </p>
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 8. Layer Drawer Panel (Controlled by isLayerPanelOpen)      */}
      {/* ----------------------------------------------------------- */}
      <LayerPanel
        isOpen={isLayerPanelOpen}
        onClose={() => setIsLayerPanelOpen(false)}
      />

      {/* Advanced Tailor Options Drawer */}
      <AdvancedTailorDrawer
        isOpen={showAdvancedDrawer}
        onClose={() => setShowAdvancedDrawer(false)}
        units="in"
      />
    </div>
  );
}
