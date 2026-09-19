import React, { useState, useRef } from 'react';
import {
  Move,
  Lock,
  Unlock,
  Copy,
  Sliders,
  Trash2,
  Scissors,
  Check,
  Palette,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Edit3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const FABRIC_COLOR_PRESETS = [
  { label: 'Muslin White', value: '#ffffff', textColor: '#0f172a' },
  { label: 'Linen Parchment', value: '#fefce8', textColor: '#0f172a' },
  { label: 'Kraft Pattern Paper', value: '#fef3c7', textColor: '#78350f' },
  { label: 'Tracing Blueprint', value: '#e0f2fe', textColor: '#0369a1' },
  { label: 'Mint Poplin', value: '#ecfdf5', textColor: '#065f46' },
  { label: 'Chiffon Rose', value: '#ffe4e6', textColor: '#9f1239' },
  { label: 'Charcoal Canvas', value: '#1e293b', textColor: '#f8fafc' },
];

// High-contrast chalk colors guaranteed to show visibly on light and dark cutting sheets
const HIGH_CONTRAST_CHALKS = [
  { name: "Tailor's French Blue", hex: '#0284c7', desc: 'High visibility on white & kraft sheets' },
  { name: 'Charcoal Lead', hex: '#0f172a', desc: 'Crisp dark line on light muslin' },
  { name: 'Basting Crimson', hex: '#e11d48', desc: 'Vivid red tailor mark' },
  { name: 'Wax Yellow', hex: '#ca8a04', desc: 'Traditional tailor wax chalk' },
  { name: 'Tailor Chalk White', hex: '#ffffff', desc: 'High contrast on dark sheets' },
  { name: 'Bespoke Emerald', hex: '#059669', desc: 'Precision green alignment line' },
];

export default function CuttingSheetItem({
  sheet,
  isSelected,
  zoom = 1,
  panOffset = { x: 0, y: 0 },
  activeChalkColor = '#0284c7',
  onSelect,
  onUpdate,
  onDuplicate,
  onRemove,
  onSetChalkColor,
  onAddSeamAllowanceStroke,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChalkPicker, setShowChalkPicker] = useState(false);
  const [showSeamAllowanceMenu, setShowSeamAllowanceMenu] = useState(false);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
  const carouselRef = useRef(null);

  const handleCarouselScroll = (direction) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -150 : 150,
        behavior: 'smooth',
      });
    }
  };

  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, initialW: 0, initialH: 0 });

  const effectiveWidth = sheet.isMirrored ? sheet.width * 2 : sheet.width;
  const effectiveHeight = sheet.height;

  // Defensive updater that works with both (id, updates) and (updates) signatures
  const emitUpdate = (updates) => {
    onUpdate?.(sheet.id, updates);
  };

  // ---------------------------------------------------------------------------
  // Movement & Repositioning: Free drag across workspace
  // ---------------------------------------------------------------------------
  const handleStartDrag = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (sheet.locked) return;
    e.stopPropagation();
    onSelect?.(sheet.id);

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0,
      y: e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0,
      initialX: sheet.x,
      initialY: sheet.y,
    };

    const onPointerMove = (moveEv) => {
      moveEv.preventDefault();
      const clientX = moveEv.clientX ?? (moveEv.touches && moveEv.touches[0]?.clientX);
      const clientY = moveEv.clientY ?? (moveEv.touches && moveEv.touches[0]?.clientY);
      if (clientX == null || clientY == null) return;

      const dx = (clientX - dragStartRef.current.x) / zoom;
      const dy = (clientY - dragStartRef.current.y) / zoom;

      emitUpdate({
        x: Math.round(dragStartRef.current.initialX + dx),
        y: Math.round(dragStartRef.current.initialY + dy),
      });
    };

    const onPointerUp = () => {
      setIsDragging(false);
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

  // Directional nudge handler (20px per step)
  const handleNudge = (dx, dy) => {
    if (sheet.locked) return;
    emitUpdate({
      x: sheet.x + dx,
      y: sheet.y + dy,
    });
  };

  // ---------------------------------------------------------------------------
  // Resizing: East, South, and South-East Handles
  // ---------------------------------------------------------------------------
  const handleResizePointerDown = (e, handleType) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (sheet.locked) return;
    e.stopPropagation();
    setIsResizing(true);

    resizeStartRef.current = {
      x: e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0,
      y: e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0,
      initialW: sheet.width,
      initialH: sheet.height,
    };

    const onResizeMove = (moveEv) => {
      moveEv.preventDefault();
      const clientX = moveEv.clientX ?? (moveEv.touches && moveEv.touches[0]?.clientX);
      const clientY = moveEv.clientY ?? (moveEv.touches && moveEv.touches[0]?.clientY);
      if (clientX == null || clientY == null) return;

      const dx = (clientX - resizeStartRef.current.x) / zoom;
      const dy = (clientY - resizeStartRef.current.y) / zoom;

      let newW = resizeStartRef.current.initialW;
      let newH = resizeStartRef.current.initialH;

      if (handleType.includes('e')) {
        newW = Math.max(80, Math.round(resizeStartRef.current.initialW + (sheet.isMirrored ? dx / 2 : dx)));
      }
      if (handleType.includes('s')) {
        newH = Math.max(80, Math.round(resizeStartRef.current.initialH + dy));
      }

      emitUpdate({ width: newW, height: newH });
    };

    const onResizeUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', onResizeUp);
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
      window.removeEventListener('touchmove', onResizeMove);
      window.removeEventListener('touchend', onResizeUp);
    };

    window.addEventListener('pointermove', onResizeMove, { passive: false });
    window.addEventListener('pointerup', onResizeUp);
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
    window.addEventListener('touchmove', onResizeMove, { passive: false });
    window.addEventListener('touchend', onResizeUp);
  };

  // ---------------------------------------------------------------------------
  // Broken Seam Allowance Outline Generator
  // ---------------------------------------------------------------------------
  const handleApplySeamAllowance = (allowanceInches = 0.625) => {
    setShowSeamAllowanceMenu(false);
    const offsetPx = Math.round(allowanceInches * 20); // 20px per inch standard
    const w = effectiveWidth;
    const h = effectiveHeight;
    const sx = sheet.x;
    const sy = sheet.y;

    const seamPoints = [
      { x: sx - offsetPx, y: sy - offsetPx },
      { x: sx + w + offsetPx, y: sy - offsetPx },
      { x: sx + w + offsetPx, y: sy + h + offsetPx },
      { x: sx - offsetPx, y: sy + h + offsetPx },
      { x: sx - offsetPx, y: sy - offsetPx },
    ];

    onAddSeamAllowanceStroke?.(seamPoints, `Seam Allowance (${allowanceInches}")`);
    emitUpdate({ hasSeamAllowance: true, seamAllowanceInches: allowanceInches });
  };

  // Change sheet color & ensure independent toggle (does NOT mutate chalk color)
  const handleSelectSheetColor = (hex) => {
    setShowColorPicker(false);
    emitUpdate({ color: hex });
  };

  // Change chalk color & ensure independent toggle (does NOT mutate sheet color)
  const handleSelectChalkColor = (hex) => {
    setShowChalkPicker(false);
    emitUpdate({ chalkColor: hex });
    onSetChalkColor?.(hex);
  };

  const screenX = sheet.x * zoom + panOffset.x;
  const screenY = sheet.y * zoom + panOffset.y;
  const isNearTop = screenY < 75;
  // Viewport clamping: ensures the toggle button/bar is NEVER hidden away when sheet is zoomed or scrolled
  const headerTopOffset = screenY < 55 ? Math.max(0, 55 - screenY) : -46;
  const headerLeftOffset = screenX < 16 ? Math.max(0, 16 - screenX) : 0;

  return (
    <div
      className="absolute select-none pointer-events-none"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `${effectiveWidth * zoom}px`,
        height: `${effectiveHeight * zoom}px`,
      }}
      id={`cutting-sheet-overlay-${sheet.id}`}
    >
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE FLOATING HEADER (Collapsible Toggles for Clear Workspace)  */}
      {/* ========================================================================= */}
      {!isControlsExpanded ? (
        /* Sleek Collapsed Badge: Compact & Unobtrusive to keep workspace clear for drawing */
        <div
          className="absolute z-40 pointer-events-auto flex items-center gap-1.5 bg-[#090d16]/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-amber-500/60 shadow-2xl text-slate-100 ring-1 ring-white/10 select-none whitespace-nowrap"
          style={{ top: `${headerTopOffset}px`, left: `${headerLeftOffset}px` }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(sheet.id);
          }}
        >
          {/* Move Drag Handle */}
          <button
            onPointerDown={handleStartDrag}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-xs ${
              sheet.locked
                ? 'bg-slate-800/80 text-slate-400 cursor-not-allowed'
                : isDragging
                ? 'bg-amber-400 text-slate-950 cursor-grabbing ring-2 ring-amber-300'
                : 'bg-amber-500/20 hover:bg-amber-400 hover:text-slate-950 text-amber-300 cursor-grab border border-amber-500/40'
            }`}
            title={sheet.locked ? 'Sheet Locked' : 'Drag to Move Sheet Anywhere Across Workspace'}
          >
            <Move className={`w-3 h-3 ${isDragging ? 'animate-bounce' : ''}`} />
            <span>{isDragging ? 'MOVING...' : 'MOVE'}</span>
          </button>

          {/* Title & Dimension Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/90 rounded-lg text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            <span className="truncate max-w-[100px]">{sheet.name}</span>
            <span className="text-slate-400 font-mono text-[9px]">
              {(effectiveWidth / 20).toFixed(1)}" × {(effectiveHeight / 20).toFixed(1)}"
            </span>
          </div>

          {/* Visual Mini Previews & Direct Inline Toggles: Sheet Color & Chalk Color */}
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-900/90 rounded-lg border border-slate-700/80 relative">
            {/* Direct Sheet Color Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker((prev) => !prev);
                setShowChalkPicker(false);
              }}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity p-0.5 rounded cursor-pointer"
              title="Toggle Sheet Color (Click to change)"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/70 shadow-xs shrink-0 ring-1 ring-black/40"
                style={{ backgroundColor: sheet.color || '#ffffff' }}
              />
              <span className="text-[9px] font-bold text-slate-300">Sheet</span>
            </button>

            <span className="text-slate-600 text-[10px]">•</span>

            {/* Direct Chalk Color Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowChalkPicker((prev) => !prev);
                setShowColorPicker(false);
              }}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity p-0.5 rounded cursor-pointer"
              title="Toggle Chalk Color (Click to change)"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/90 shadow-xs shrink-0 ring-1 ring-black/40"
                style={{ backgroundColor: sheet.chalkColor || activeChalkColor || '#facc15' }}
              />
              <span className="text-[9px] font-bold text-amber-300">Chalk</span>
            </button>

            {/* Inline Sheet Color Picker Popover from Collapsed Badge */}
            {showColorPicker && (
              <div
                className="absolute top-8 left-0 z-50 p-2 bg-slate-900/98 backdrop-blur-md rounded-xl border border-amber-500/50 shadow-2xl w-48 flex flex-col gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Sheet Color (Independent):
                </span>
                <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                  {FABRIC_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleSelectSheetColor(preset.value)}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg text-left text-[11px] font-medium transition-colors ${
                        sheet.color === preset.value ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0"
                        style={{ backgroundColor: preset.value }}
                      />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Chalk Color Picker Popover from Collapsed Badge */}
            {showChalkPicker && (
              <div
                className="absolute top-8 left-0 z-50 p-2 bg-slate-900/98 backdrop-blur-md rounded-xl border border-amber-500/50 shadow-2xl w-52 flex flex-col gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Chalk Color (Independent):
                </span>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {HIGH_CONTRAST_CHALKS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleSelectChalkColor(c.hex)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left text-[10px] font-bold transition-all ${
                        (sheet.chalkColor || activeChalkColor) === c.hex
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-200'
                      }`}
                      title={c.desc}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Expand Controls Button */}
          <button
            onClick={() => setIsControlsExpanded(true)}
            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-400 hover:text-slate-950 text-amber-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-amber-500/40 shadow-xs"
            title="Expand Cutting Sheet Controls (Fabric Color, Chalk Color, Mirror, Seam Allowance, Micro-Nudge)"
          >
            <Sliders className="w-3 h-3" />
            <span>Controls</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Lock / Unlock */}
          <button
            onClick={() => emitUpdate({ locked: !sheet.locked })}
            className={`p-1 rounded-lg transition-colors ${
              sheet.locked
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={sheet.locked ? 'Unlock Sheet' : 'Lock Sheet position'}
          >
            {sheet.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>

          {/* Delete Sheet */}
          <button
            onClick={() => onRemove?.(sheet.id)}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Remove Cutting Sheet"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* Full Expanded Toolbar with Carousel Slide Track & Viewport-Safe Clamping */
        <div
          className="absolute z-40 pointer-events-auto flex items-center bg-[#090d16]/98 backdrop-blur-md px-1.5 py-1.5 rounded-2xl border border-amber-500/80 shadow-2xl text-slate-100 ring-1 ring-white/10 select-none max-w-[min(540px,calc(100vw-36px))]"
          style={{ top: `${headerTopOffset}px`, left: `${headerLeftOffset}px` }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(sheet.id);
          }}
        >
          {/* Carousel Slide Left Chevron */}
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

          {/* Drag / Move Handle */}
          <button
            onPointerDown={handleStartDrag}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all shadow-xs ${
              sheet.locked
                ? 'bg-slate-800/80 text-slate-400 cursor-not-allowed'
                : isDragging
                ? 'bg-amber-400 text-slate-950 cursor-grabbing ring-2 ring-amber-300'
                : 'bg-amber-500/20 hover:bg-amber-400 hover:text-slate-950 text-amber-300 cursor-grab border border-amber-500/40'
            }`}
            title={
              sheet.locked
                ? 'Sheet Locked on Board'
                : 'Drag to Shift Sheet Position Freely Across Workspace'
            }
          >
            <Move className={`w-3.5 h-3.5 ${isDragging ? 'animate-bounce' : ''}`} />
            <span>{isDragging ? 'MOVING...' : 'MOVE'}</span>
          </button>

          {/* Micro-Nudge Directional Controls */}
          {!sheet.locked && (
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => handleNudge(-20, 0)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded"
                title="Shift Left 20px"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleNudge(0, -20)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded"
                title="Shift Up 20px"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleNudge(0, 20)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded"
                title="Shift Down 20px"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleNudge(20, 0)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded"
                title="Shift Right 20px"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Title & Dimension Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/90 rounded-lg text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            <span className="truncate max-w-[110px]">{sheet.name}</span>
            <span className="text-slate-400 font-mono text-[9px]">
              {(effectiveWidth / 20).toFixed(1)}" × {(effectiveHeight / 20).toFixed(1)}"
            </span>
          </div>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          {/* Sheet Fabric Color Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowChalkPicker(false);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1 border border-slate-700/60"
              title="Change Cutting Sheet Color (Muslin, Linen, Kraft, Blueprint)"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs"
                style={{ backgroundColor: sheet.color || '#ffffff' }}
              />
              <span className="text-[10px] font-semibold hidden md:inline">Sheet Color</span>
            </button>

            {showColorPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-9 left-0 z-50 p-2.5 bg-slate-900/98 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl w-48 flex flex-col gap-1.5"
              >
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Sheet Fabric / Paper:
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {FABRIC_COLOR_PRESETS.map((preset) => {
                    const isSelected = (sheet.color || '#ffffff').toLowerCase() === preset.value.toLowerCase();
                    return (
                      <button
                        key={preset.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSheetColor(preset.value);
                        }}
                        className={`flex items-center justify-between px-2 py-1 rounded-lg text-left text-[11px] font-medium transition-colors ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/50'
                            : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0"
                            style={{ backgroundColor: preset.value }}
                          />
                          <span>{preset.label}</span>
                        </div>
                        {isSelected && <span className="text-[10px] text-amber-400">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* High-Contrast Chalk Color Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowChalkPicker(!showChalkPicker);
                setShowColorPicker(false);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1 border border-slate-700/60"
              title="Select Chalk Drawing Color: Guarantees visible contrast on this cutting sheet"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <div
                className="w-3 h-3 rounded-full border border-white/60 shadow-xs"
                style={{ backgroundColor: activeChalkColor }}
              />
              <span className="text-[10px] font-bold hidden md:inline">Chalk Color</span>
            </button>

            {showChalkPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-9 left-0 z-50 p-2.5 bg-slate-900/98 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl w-56 flex flex-col gap-2"
              >
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Tailor's Chalk Color:
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {HIGH_CONTRAST_CHALKS.map((c) => {
                    const isSelected = activeChalkColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectChalkColor(c.hex);
                        }}
                        className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border text-left text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : 'border-slate-800 hover:bg-slate-800 text-slate-200'
                        }`}
                        title={c.desc}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="truncate">{c.name}</span>
                        </div>
                        {isSelected && <span className="text-[9px] text-amber-400 shrink-0">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Seam Allowance Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSeamAllowanceMenu(!showSeamAllowanceMenu)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                sheet.hasSeamAllowance
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Broken Seam Allowance Outline"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Seam</span>
            </button>

            {showSeamAllowanceMenu && (
              <div className="absolute top-9 right-0 z-50 p-2 bg-slate-900/98 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl w-52 flex flex-col gap-1 text-xs">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider mb-1 flex items-center gap-1">
                  <Scissors className="w-3 h-3" />
                  <span>Broken Seam Allowance</span>
                </span>
                {[
                  { label: '1/4" (0.6 cm) - Collar / Neck', val: 0.25 },
                  { label: '3/8" (1.0 cm) - Knits & Facings', val: 0.375 },
                  { label: '1/2" (1.2 cm) - Standard Bodice', val: 0.5 },
                  { label: '5/8" (1.5 cm) - Commercial Standard', val: 0.625 },
                  { label: '1" (2.5 cm) - Wide Hem', val: 1.0 },
                ].map((s) => (
                  <button
                    key={s.val}
                    onClick={() => handleApplySeamAllowance(s.val)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 text-[11px] font-medium transition-colors flex items-center justify-between"
                  >
                    <span>{s.label}</span>
                    <span className="text-amber-400 font-mono text-[10px] font-bold">Dashed</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Duplicate Sheet */}
          <button
            onClick={() => onDuplicate?.(sheet.id)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
            title="Duplicate Cutting Sheet"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Lock / Unlock */}
          <button
            onClick={() => emitUpdate({ locked: !sheet.locked })}
            className={`p-1 rounded-lg transition-colors ${
              sheet.locked
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={sheet.locked ? 'Unlock Sheet: Click to shift position freely' : 'Lock Sheet position'}
          >
            {sheet.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {/* Delete Sheet */}
          <button
            onClick={() => onRemove?.(sheet.id)}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors shrink-0"
            title="Remove Cutting Sheet"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carousel Slide Right Chevron */}
        <button
          onClick={() => handleCarouselScroll('right')}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors shrink-0"
          title="Scroll Controls Right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    )}

      {/* ========================================================================= */}
      {/* 2. SHEET BOUNDARY OUTLINE (Selection Highlight Indicator)                  */}
      {/* ========================================================================= */}
      <div
        className={`w-full h-full rounded-b-xl border-2 pointer-events-none transition-all ${
          isSelected
            ? 'border-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.3)]'
            : 'border-transparent'
        }`}
      />

      {/* ========================================================================= */}
      {/* 3. RESIZE HANDLES (Right Edge, Bottom Edge, Bottom-Right Corner)          */}
      {/* ========================================================================= */}
      {!sheet.locked && isSelected && (
        <>
          {/* East (Right Edge) Resize Handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'e')}
            className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-9 bg-amber-400 border border-slate-950 rounded-full cursor-ew-resize hover:scale-125 transition-transform z-40 shadow-lg pointer-events-auto flex items-center justify-center"
            title="Drag to resize sheet width"
          >
            <div className="w-0.5 h-3 bg-slate-950 rounded-full" />
          </div>

          {/* South (Bottom Edge) Resize Handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 's')}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-4 bg-amber-400 border border-slate-950 rounded-full cursor-ns-resize hover:scale-125 transition-transform z-40 shadow-lg pointer-events-auto flex items-center justify-center"
            title="Drag to resize sheet height"
          >
            <div className="h-0.5 w-3 bg-slate-950 rounded-full" />
          </div>

          {/* South-East (Bottom-Right Corner) Resize Handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-amber-400 border-2 border-slate-950 rounded-full cursor-nwse-resize hover:scale-125 transition-transform z-40 shadow-xl pointer-events-auto flex items-center justify-center"
            title="Drag to resize sheet width and height freely"
          >
            <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
          </div>
        </>
      )}
    </div>
  );
}
