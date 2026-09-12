import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  X,
  Maximize2,
  Sliders,
  Check,
  Zap,
  Move,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  PenTool,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Ruler as RulerIcon,
} from 'lucide-react';
import { TAILOR_RULERS_CATALOG, getRulerPrimaryEdgeWorldPoints } from './TailorRulersCatalog';

export default function TailorRulerOverlay({
  ruler,
  isSelected,
  onSelect,
  onSelectRuler,
  onUpdate,
  onUpdateRuler,
  onRemove,
  onRemoveRuler,
  onSnapEdge,
  onSnapSeamEdge,
  zoom = 1,
  panOffset = { x: 0, y: 0 },
  activeSnapPoint = null,
  tapeMeasureDistance = null,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const [traceLengthMode, setTraceLengthMode] = useState('full'); // 'full' | 'tape' | number (inches)
  const carouselRef = useRef(null);

  // Move mode is active if explicitly set or if the ruler is not locked
  const isMove = ruler.isMoveMode !== undefined ? ruler.isMoveMode : !ruler.locked;

  const dragStartRef = useRef({ x: 0, y: 0, initialRulerX: 0, initialRulerY: 0 });
  const rotateStartRef = useRef({ startAngle: 0, initialRotation: 0 });

  const updateRuler = (id, updates) => {
    if (typeof onUpdateRuler === 'function') {
      onUpdateRuler(id, updates);
    } else if (typeof onUpdate === 'function') {
      onUpdate(updates);
    }
  };

  const removeRuler = (id) => {
    if (typeof onRemoveRuler === 'function') {
      onRemoveRuler(id);
    } else if (typeof onRemove === 'function') {
      onRemove();
    }
  };

  const selectRuler = (id) => {
    if (typeof onSelectRuler === 'function') {
      onSelectRuler(id);
    } else if (typeof onSelect === 'function') {
      onSelect(id);
    }
  };

  const snapSeamEdge = (points, name) => {
    if (typeof onSnapSeamEdge === 'function') {
      onSnapSeamEdge(points, name);
    } else if (typeof onSnapEdge === 'function') {
      onSnapEdge(points, name);
    }
  };

  const catalog = TAILOR_RULERS_CATALOG[ruler.type] || TAILOR_RULERS_CATALOG.straightRuler;
  const isStraight = ruler.type === 'straightRuler';
  const rulerLength = ruler.lengthOption || catalog.defaultLength || 18;
  const pathD = catalog.getOuterPath ? catalog.getOuterPath(rulerLength) : catalog.outerPath;
  const width = isStraight ? (rulerLength === 36 ? 840 : 540) : catalog.width;
  const height = isStraight ? 60 : catalog.height;

  // Toggle Move Mode: when Move is ON, position is unlocked and free dragging is enabled.
  // When Move is OFF, ruler is locked in place for tracing straight lines/curves.
  const handleToggleMoveMode = (e) => {
    e?.stopPropagation();
    const nextMove = !isMove;
    updateRuler(ruler.id, {
      isMoveMode: nextMove,
      locked: !nextMove,
    });
  };

  // Translation Drag Engine with Pointer Capture
  const handleStartDrag = (e, forceMove = false) => {
    if (e.button !== undefined && e.button !== 0) return;
    // If not in move mode and locked, clicking body does not drag (allows tracing)
    if (!forceMove && !isMove && ruler.locked) return;

    if (forceMove && (!isMove || ruler.locked)) {
      updateRuler(ruler.id, { isMoveMode: true, locked: false });
    }

    e.stopPropagation();
    selectRuler(ruler.id);
    setIsDragging(true);

    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      initialRulerX: ruler.x,
      initialRulerY: ruler.y,
    };

    const target = e.currentTarget;
    if (target.setPointerCapture && e.pointerId !== undefined) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    const onPointerMove = (moveEv) => {
      moveEv.preventDefault();
      const currentClientX = moveEv.clientX ?? (moveEv.touches && moveEv.touches[0]?.clientX);
      const currentClientY = moveEv.clientY ?? (moveEv.touches && moveEv.touches[0]?.clientY);
      if (currentClientX == null || currentClientY == null) return;

      const dx = (currentClientX - dragStartRef.current.x) / zoom;
      const dy = (currentClientY - dragStartRef.current.y) / zoom;

      updateRuler(ruler.id, {
        x: Math.round(dragStartRef.current.initialRulerX + dx),
        y: Math.round(dragStartRef.current.initialRulerY + dy),
      });
    };

    const onPointerUp = (upEv) => {
      setIsDragging(false);
      if (target.releasePointerCapture && upEv.pointerId !== undefined) {
        try {
          target.releasePointerCapture(upEv.pointerId);
        } catch (err) {}
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  // Nudge Position buttons for exact alignment
  const handleNudge = (dx, dy) => {
    updateRuler(ruler.id, {
      x: Math.round(ruler.x + dx),
      y: Math.round(ruler.y + dy),
    });
  };

  // Dedicated Rotation Handle Drag
  const handleRotatePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (ruler.locked && !isMove) return;
    e.stopPropagation();
    setIsRotating(true);

    const centerX = ruler.x * zoom + panOffset.x;
    const centerY = ruler.y * zoom + panOffset.y;
    const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    rotateStartRef.current = {
      startAngle: initialAngle,
      initialRotation: ruler.rotation || 0,
    };

    const onRotateMove = (moveEv) => {
      const currentAngle = Math.atan2(moveEv.clientY - centerY, moveEv.clientX - centerX) * (180 / Math.PI);
      const angleDiff = currentAngle - rotateStartRef.current.startAngle;
      let newRot = Math.round((rotateStartRef.current.initialRotation + angleDiff + 360) % 360);
      updateRuler(ruler.id, { rotation: newRot });
    };

    const onRotateUp = () => {
      setIsRotating(false);
      window.removeEventListener('pointermove', onRotateMove);
      window.removeEventListener('pointerup', onRotateUp);
      window.removeEventListener('mousemove', onRotateMove);
      window.removeEventListener('mouseup', onRotateUp);
    };

    window.addEventListener('pointermove', onRotateMove);
    window.addEventListener('pointerup', onRotateUp);
    window.addEventListener('mousemove', onRotateMove);
    window.addEventListener('mouseup', onRotateUp);
  };

  // Flip Actions
  const handleFlipHorizontal = (e) => {
    e.stopPropagation();
    updateRuler(ruler.id, { flipX: !ruler.flipX });
  };

  const handleFlipVertical = (e) => {
    e.stopPropagation();
    updateRuler(ruler.id, { flipY: !ruler.flipY });
  };

  // Rotation Presets
  const stepRotation = (delta) => {
    const newRot = Math.round(((ruler.rotation || 0) + delta + 360) % 360);
    updateRuler(ruler.id, { rotation: newRot });
  };

  // Scale / Size Adjustment
  const currentScale = ruler.scale || 1.0;
  const handleAdjustScale = (delta) => {
    const next = Math.max(0.25, Math.min(2.5, Math.round((currentScale + delta) * 20) / 20));
    updateRuler(ruler.id, { scale: next });
  };

  const handleSetScale = (val) => {
    updateRuler(ruler.id, { scale: val });
  };

  // Carousel Slide Handler
  const handleCarouselScroll = (direction) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -150 : 150,
        behavior: 'smooth',
      });
    }
  };

  // Trace Straight Edge or Curve Line directly into the active pattern layer
  const handleTraceRulerEdge = (e) => {
    e?.stopPropagation();
    let points = getRulerPrimaryEdgeWorldPoints(ruler);
    if (!points || points.length < 2) return;

    // Determine trace length in inches
    let targetLengthInches = null;
    if (traceLengthMode === 'tape' && tapeMeasureDistance && tapeMeasureDistance > 0) {
      targetLengthInches = tapeMeasureDistance;
    } else if (typeof traceLengthMode === 'number') {
      targetLengthInches = traceLengthMode;
    }

    if (targetLengthInches && targetLengthInches > 0) {
      // 20px = 1 inch calibrated in workspace
      const targetDistPx = targetLengthInches * 20 * (ruler.scale || 1);
      const trimmed = [points[0]];
      let accumulated = 0;
      for (let i = 1; i < points.length; i++) {
        const step = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
        if (accumulated + step >= targetDistPx) {
          const remain = targetDistPx - accumulated;
          const ratio = step > 0 ? remain / step : 0;
          trimmed.push({
            x: points[i - 1].x + (points[i].x - points[i - 1].x) * ratio,
            y: points[i - 1].y + (points[i].y - points[i - 1].y) * ratio,
          });
          break;
        }
        accumulated += step;
        trimmed.push(points[i]);
      }
      if (trimmed.length >= 2) points = trimmed;
    }

    const labelSuffix = targetLengthInches ? ` (${targetLengthInches.toFixed(1)}")` : '';
    snapSeamEdge(points, `${catalog.name}${labelSuffix}`);
  };

  // Visual Theme Styling: Acrylic Tailor polycarbonate with fine grids
  const isBlueGrid = catalog.acrylicTheme === 'clear_blue_grid';
  const isRedGrid = catalog.acrylicTheme === 'clear_red_grid';
  const isSolidWhite = catalog.acrylicTheme === 'solid_white';

  const gridColor = isBlueGrid ? 'rgba(56, 189, 248, 0.45)' : isRedGrid ? 'rgba(244, 63, 94, 0.45)' : 'rgba(255, 255, 255, 0.3)';
  const strokeColor = isBlueGrid ? '#38bdf8' : isRedGrid ? '#f43f5e' : isSolidWhite ? '#f8fafc' : '#fbbf24';
  const fillColor = isSolidWhite ? 'rgba(248, 250, 252, 0.28)' : 'rgba(241, 245, 249, 0.16)';

  // Effective visual scale on screen: if lockScreenScale is ON, ruler maintains comfortable fixed viewport scale
  const effectiveZoomScale = ruler.lockScreenScale ? (ruler.scale || 1) : (ruler.scale || 1) * zoom;

  // Viewport position coordinates for safe screen clamping
  const screenX = ruler.x * zoom + panOffset.x;
  const screenY = ruler.y * zoom + panOffset.y;
  const isNearTop = screenY < 80;

  return (
    <div
      className={`absolute select-none pointer-events-auto transition-shadow duration-150 ${
        isSelected ? 'z-40' : 'z-30'
      }`}
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: `translate(-50%, -50%) rotate(${ruler.rotation || 0}deg) scale(${
          effectiveZoomScale * (ruler.flipX ? -1 : 1)
        }, ${effectiveZoomScale * (ruler.flipY ? -1 : 1)})`,
        transformOrigin: 'center center',
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectRuler(ruler.id);
      }}
      onDoubleClick={() => {
        updateRuler(ruler.id, { isMoveMode: true, locked: false });
      }}
      id={`tailor-ruler-${ruler.id}`}
    >
      {/* ========================================================================= */}
      {/* 1. ATTACHED QUICK ACTION BAR (Pinned above/below ruler with Carousel Slide) */}
      {/* ========================================================================= */}
      {isSelected && (
        !isControlsExpanded ? (
          /* Sleek Collapsed Badge: Compact & Unobtrusive to keep workspace clear */
          <div
            className={`absolute ${isNearTop ? 'top-full mt-3' : '-top-12'} left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-[#090d16]/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/60 shadow-xl text-slate-100 ring-1 ring-white/10 select-none whitespace-nowrap`}
            style={{
              transform: `scale(${ruler.flipX ? -1 : 1}, ${ruler.flipY ? -1 : 1})`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/90 rounded-full text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              <span className="truncate max-w-[120px]">{catalog.name}</span>
              <span className="text-slate-400 font-mono text-[9px]">{Math.round(ruler.rotation || 0)}°</span>
            </div>

            <button
              onClick={() => setIsControlsExpanded(true)}
              className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-400 hover:text-slate-950 text-amber-300 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 border border-amber-500/40"
              title="Expand Ruler Controls (Rotate, Nudge, Move Mode, Lock, Trace, Scale/Size)"
            >
              <Sliders className="w-3 h-3" />
              <span>Controls</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            <button
              onClick={handleToggleMoveMode}
              className={`p-1 rounded-full text-[10px] transition-all ${
                isMove ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title={isMove ? 'Move Mode Active (Drag to reposition)' : 'Click to enable Move Mode'}
            >
              <Move className="w-3 h-3" />
            </button>

            <button
              onClick={() => removeRuler(ruler.id)}
              className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-full transition-all"
              title="Remove Ruler from Canvas"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          /* Full Expanded Toolbar with Carousel Slide Track & Viewport-Safe Clamping */
          <div
            className={`absolute ${isNearTop ? 'top-full mt-3' : '-top-16'} left-1/2 -translate-x-1/2 z-50 flex items-center bg-[#090d16]/98 backdrop-blur-md px-1.5 py-1.5 rounded-2xl border border-amber-500/80 shadow-2xl text-slate-100 ring-1 ring-white/10 select-none max-w-[min(520px,calc(100vw-36px))]`}
            style={{
              transform: `scale(${ruler.flipX ? -1 : 1}, ${ruler.flipY ? -1 : 1})`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Carousel Slide: Scroll Left Button */}
            <button
              onClick={() => handleCarouselScroll('left')}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors shrink-0"
              title="Scroll Controls Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Scrollable Carousel Track */}
            <div
              ref={carouselRef}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Collapse Button (Preserved exactly as requested) */}
              <button
                onClick={() => setIsControlsExpanded(false)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-700 shrink-0"
                title="Collapse Controls (Reclaim Drawing Space)"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide</span>
              </button>

              {/* Tool Title Badge */}
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/90 rounded-lg text-[10px] font-bold text-amber-300 uppercase tracking-wider shrink-0">
                <span className="truncate max-w-[110px]">{catalog.name}</span>
                <span className="text-slate-400 font-mono text-[9px]">{Math.round(ruler.rotation || 0)}°</span>
              </div>

              {/* Move Mode Toggle Button */}
              <button
                onClick={handleToggleMoveMode}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1.5 shadow-sm shrink-0 ${
                  isMove
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
                title="Toggle Free Movement: When ON, drag freely anywhere across workspace. When OFF, ruler is locked for straight tracing."
              >
                <Move className={`w-3.5 h-3.5 ${isMove ? 'animate-bounce' : ''}`} />
                <span>{isMove ? 'MOVE ON' : 'MOVE OFF'}</span>
              </button>

              {/* Micro-Nudge Directional Controls */}
              {isMove && (
                <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={() => handleNudge(-10, 0)}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                    title="Nudge Left 10px"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleNudge(0, -10)}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                    title="Nudge Up 10px"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleNudge(0, 10)}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                    title="Nudge Down 10px"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleNudge(10, 0)}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                    title="Nudge Right 10px"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Quick Rotation Buttons */}
              <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => stepRotation(-15)}
                  className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                  title="Rotate -15° Counter-Clockwise"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => stepRotation(15)}
                  className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                  title="Rotate +15° Clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateRuler(ruler.id, { rotation: 0 })}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                    ruler.rotation === 0 ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Set Horizontal (0°)"
                >
                  0°
                </button>
                <button
                  onClick={() => updateRuler(ruler.id, { rotation: 90 })}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                    ruler.rotation === 90 ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Set Vertical (90°)"
                >
                  90°
                </button>
              </div>

              {/* Flip Horizontal & Vertical */}
              <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={handleFlipHorizontal}
                  className={`p-1 rounded transition-all ${
                    ruler.flipX ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-amber-400'
                  }`}
                  title="Flip Horizontal (Mirror Curve Across Center)"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleFlipVertical}
                  className={`p-1 rounded transition-all ${
                    ruler.flipY ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-amber-400'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* RULER / CURVE SIZE & SCALE ADJUSTMENT CONTROLS */}
              <div className="flex items-center gap-1 bg-slate-900 border border-amber-500/40 rounded-lg px-2 py-1 shrink-0">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Size:</span>
                <button
                  onClick={() => handleAdjustScale(-0.15)}
                  className="p-0.5 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                  title="Reduce Ruler Size (-15%)"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] font-bold text-slate-200 min-w-[32px] text-center">
                  {Math.round(currentScale * 100)}%
                </span>
                <button
                  onClick={() => handleAdjustScale(0.15)}
                  className="p-0.5 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                  title="Increase Ruler Size (+15%)"
                >
                  <Plus className="w-3 h-3" />
                </button>

                {/* Quick scale presets */}
                <div className="flex items-center gap-0.5 ml-1 border-l border-slate-700 pl-1">
                  {[0.5, 0.75, 1.0, 1.5].map((sVal) => (
                    <button
                      key={sVal}
                      onClick={() => handleSetScale(sVal)}
                      className={`px-1 py-0.5 rounded text-[8px] font-mono font-bold ${
                        Math.abs(currentScale - sVal) < 0.05
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {Math.round(sVal * 100)}%
                    </button>
                  ))}
                </div>

                {/* Independent Zoom / Lock Screen Scale Toggle */}
                <button
                  onClick={() => updateRuler(ruler.id, { lockScreenScale: !ruler.lockScreenScale })}
                  className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                    ruler.lockScreenScale
                      ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={
                    ruler.lockScreenScale
                      ? 'Screen Scale Locked: Ruler keeps comfortable viewport size regardless of board zoom'
                      : 'Click to Lock Screen Scale: Prevents ruler from blowing up or over-filling screen when board zooms in x2!'
                  }
                >
                  {ruler.lockScreenScale ? 'Fixed Zoom 🔒' : 'Adapt Zoom'}
                </button>
              </div>

              {/* TRACE LINE WITH DESIRED SIZE & MEASURING TAPE KEY */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-amber-600/15 border border-amber-500/70 rounded-lg p-1 shrink-0">
                {/* Primary Trace Line Button */}
                <button
                  onClick={handleTraceRulerEdge}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-[10px] rounded-md shadow-gold-sm transition-all flex items-center gap-1"
                  title="Trace Line: Automatically draws straight line or curve edge of chosen size directly onto active sheet/board layer"
                >
                  <PenTool className="w-3 h-3" />
                  <span>Trace Line</span>
                </button>

                {/* Trace Size Selector */}
                <div className="flex items-center gap-0.5 bg-slate-900/90 rounded px-1 py-0.5 border border-amber-500/30">
                  <button
                    onClick={() => setTraceLengthMode('full')}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                      traceLengthMode === 'full'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Trace entire ruler length"
                  >
                    Full
                  </button>

                  {/* Tape Measure Key Option (if tape measured a distance) */}
                  {tapeMeasureDistance && (
                    <button
                      onClick={() => setTraceLengthMode('tape')}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 transition-all ${
                        traceLengthMode === 'tape'
                          ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                          : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40'
                      }`}
                      title={`Trace exact Tape Measure distance (${tapeMeasureDistance.toFixed(1)}")`}
                    >
                      <RulerIcon className="w-2.5 h-2.5" />
                      <span>{tapeMeasureDistance.toFixed(1)}"</span>
                    </button>
                  )}

                  {/* Standard Inch Presets */}
                  {[6, 12, 18, 24].map((inVal) => (
                    <button
                      key={inVal}
                      onClick={() => setTraceLengthMode(inVal)}
                      className={`px-1 py-0.5 rounded text-[8px] font-mono font-bold ${
                        traceLengthMode === inVal
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={`Trace exactly ${inVal} inches along edge`}
                    >
                      {inVal}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Lock / Unlock Position */}
              <button
                onClick={() =>
                  updateRuler(ruler.id, {
                    locked: !ruler.locked,
                    isMoveMode: ruler.locked, // if unlocking, turn Move Mode ON
                  })
                }
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  ruler.locked
                    ? 'bg-amber-500 text-slate-950 font-black shadow-gold-sm border border-amber-300'
                    : 'hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/60'
                }`}
                title={
                  ruler.locked
                    ? 'Unlock Ruler: Click to enable movement and repositioning'
                    : 'Lock Ruler Position: Freezes in place so you can trace straight lines along edge'
                }
              >
                {ruler.locked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                    <span>LOCKED</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    <span>LOCK</span>
                  </>
                )}
              </button>

              {/* Close Ruler */}
              <button
                onClick={() => removeRuler(ruler.id)}
                className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all shrink-0"
                title="Remove Ruler from Canvas"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Carousel Slide: Scroll Right Button */}
            <button
              onClick={() => handleCarouselScroll('right')}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors shrink-0"
              title="Scroll Controls Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 2. RULER VECTOR CANVAS BODY                                               */}
      {/* ========================================================================= */}
      <div
        className={`relative touch-none ${
          !isMove && ruler.locked
            ? 'cursor-default'
            : isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab'
        } ${isMove ? 'ring-2 ring-amber-400/80 rounded-lg' : ''}`}
        onPointerDown={(e) => handleStartDrag(e, false)}
      >
        {/* Status Indicator Banner */}
        {ruler.locked && !isMove ? (
          <div className="absolute top-2 left-3 z-40 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/95 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-md pointer-events-none border border-amber-300 backdrop-blur-xs select-none">
            <Lock className="w-2.5 h-2.5 stroke-[3]" />
            <span>Position Locked • Trace Straight Lines Along Edge</span>
          </div>
        ) : isMove ? (
          <div className="absolute top-2 left-3 z-40 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-md pointer-events-none border border-amber-300 select-none">
            <Move className="w-2.5 h-2.5 stroke-[3]" />
            <span>Move Mode Active • Drag Freely Anywhere</span>
          </div>
        ) : null}

        {/* Floating Center Move Disc (Prominent Tactile Drag Handle) */}
        {(isMove || isSelected) && (
          <div
            onPointerDown={(e) => handleStartDrag(e, true)}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full border-2 text-amber-300 flex items-center justify-center cursor-move shadow-2xl hover:scale-110 active:scale-95 transition-transform ${
              isMove
                ? 'bg-slate-950/95 border-amber-400 ring-4 ring-amber-400/30'
                : 'bg-slate-900/90 border-slate-600 hover:border-amber-400 opacity-75 hover:opacity-100'
            }`}
            title="Drag to Move Ruler Freely Across Workspace"
          >
            <Move className="w-5 h-5 text-amber-300" />
          </div>
        )}

        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible drop-shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
        >
          <defs>
            {/* Fine Grading Grid Pattern */}
            <pattern
              id={`ruler-grid-${ruler.id}`}
              width="15"
              height="15"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 15 0 L 0 0 0 15"
                fill="none"
                stroke={gridColor}
                strokeWidth="0.75"
              />
              <path
                d="M 7.5 0 L 7.5 15 M 0 7.5 L 15 7.5"
                fill="none"
                stroke={gridColor}
                strokeWidth="0.4"
                strokeDasharray="1 2"
              />
            </pattern>

            {/* Subtle Gradient for Tailor Acrylic Sheen */}
            <linearGradient id={`acrylic-sheen-${ruler.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="40%" stopColor="#e2e8f0" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Primary Ruler Acrylic Body */}
          <path
            d={pathD}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={isSelected ? 2.5 : 1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Acrylic Gloss Sheen Layer */}
          <path d={pathD} fill={`url(#acrylic-sheen-${ruler.id})`} pointerEvents="none" />

          {/* Fine Precision Grading Grid Overlay */}
          <path d={pathD} fill={`url(#ruler-grid-${ruler.id})`} pointerEvents="none" />

          {/* Ruler Identification Typography Badge */}
          <text
            x={isStraight ? 40 : 50}
            y={isStraight ? 34 : 45}
            fill={strokeColor}
            fontSize={isStraight ? '12' : '14'}
            fontWeight="bold"
            fontFamily="sans-serif"
            letterSpacing="1"
            pointerEvents="none"
          >
            {catalog.name.toUpperCase()} {isStraight ? `(${rulerLength}")` : ''}
          </text>
        </svg>

        {/* Free-Hand Rotation Circular Grip Handle */}
        {isSelected && (
          <div
            onPointerDown={handleRotatePointerDown}
            className="absolute -bottom-7 right-4 z-40 flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-amber-400/80 rounded-xl text-amber-300 text-[10px] font-bold cursor-ew-resize shadow-xl hover:bg-slate-800 transition-colors"
            title="Drag to Rotate Ruler"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>ROTATE {Math.round(ruler.rotation || 0)}°</span>
          </div>
        )}
      </div>
    </div>
  );
}
