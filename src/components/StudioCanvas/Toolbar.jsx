import React, { useState, useMemo } from 'react';
import {
  Pencil,
  PenTool,
  Paintbrush,
  Ruler,
  Scissors,
  MoveHorizontal,
  Undo2,
  Redo2,
  Trash2,
  Layers,
  Sliders,
  Sun,
  ChevronUp,
  ChevronDown,
  Crosshair,
  Compass,
  Square,
  Pipette,
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

export default function Toolbar({ onUndo, onRedo, onClear, onOpenLayers }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    activeTool,
    setActiveTool,
    handleToolSelect,
    brushColor,
    setBrushColor,
    targetCutColor,
    setTargetCutColor,
    isEyedropperActive,
    setIsEyedropperActive,
    fabricCanvasInstance,
    activeRulerType,
    setActiveRulerType,
    rulerLength,
    setRulerLength,
    infraredGuideActive,
    setInfraredGuideActive,
    setShowAdvancedDrawer,
    addSheet,
    addLayer,
    isDashedSeamAllowance,
    setIsDashedSeamAllowance,
    setStrokeDashStyle,
  } = useCanvas();

  // Automatic Detection of vector object stroke colors on the canvas
  const autoDetectedColors = useMemo(() => {
    if (!fabricCanvasInstance) return ['#38BDF8', '#FACC15', '#FFFFFF', '#F43F5E'];
    try {
      const objs = fabricCanvasInstance.getObjects?.() || [];
      const colors = new Set();
      objs.forEach((o) => {
        if (o.stroke && typeof o.stroke === 'string' && o.stroke !== 'transparent') {
          colors.add(o.stroke);
        }
      });
      if (colors.size > 0) return Array.from(colors);
    } catch (e) {
      // ignore
    }
    return ['#38BDF8', '#FACC15', '#FFFFFF', '#F43F5E'];
  }, [fabricCanvasInstance]);

  const colorPalettes = [
    { name: 'Chalk White', hex: '#FFFFFF', category: 'chalk' },
    { name: 'Tailor Yellow', hex: '#FACC15', category: 'chalk' },
    { name: 'Sky Chalk', hex: '#38BDF8', category: 'chalk' },
    { name: 'Charcoal Pen', hex: '#1E293B', category: 'pen' },
    { name: 'Crimson Pen', hex: '#F43F5E', category: 'pen' },
    { name: 'Raw Denim Indigo', hex: '#1E3A8A', category: 'wash' },
    { name: 'Light Denim Wash', hex: '#60A5FA', category: 'wash' },
    { name: 'Warm Skin Tone', hex: '#F5D0B5', category: 'skin' },
    { name: 'Deep Skin Tone', hex: '#8D5524', category: 'skin' },
    { name: 'Atelier Gold', hex: '#D4AF37', category: 'accent' },
  ];

  const tools = [
    { id: 'chalk', label: 'Tailor Chalk', icon: Pencil, desc: 'High-stability freehand chalk for steady lines' },
    { id: 'pen', label: 'Technical Pen', icon: PenTool, desc: 'Clean vector illustration lines' },
    { id: 'shears', label: 'Scissors ✂️', icon: Scissors, desc: 'Cutting shears with laser-guided infrared tracking' },
    { id: 'tape_measure', label: 'Tape Measure', icon: Crosshair, desc: 'Interactive 2-point measurement in inches' },
    { id: 'denim', label: 'Denim Shading', icon: Paintbrush, desc: 'Indigo wash marker for fabric textures' },
    { id: 'watercolor', label: 'Skin Tone Wash', icon: Sun, desc: 'Watercolor tint for skin & shadows' },
  ];

  const activeToolObj = tools.find((t) => t.id === activeTool) || tools[0];
  const ActiveIcon = activeToolObj.icon;

  // Render Minimized / Collapsed Floating Pill
  if (isCollapsed) {
    return (
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 ring-1 ring-white/10 select-none animate-in fade-in zoom-in-95 duration-150"
        id="studio-toolbar-collapsed"
      >
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/90 rounded-xl border border-slate-700/60 text-xs font-bold text-amber-300 uppercase tracking-wide">
          <ActiveIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>{activeToolObj.label}</span>
          <span
            className="w-3 h-3 rounded-full border border-slate-600 ml-0.5 shadow-xs"
            style={{ backgroundColor: brushColor }}
          />
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={onUndo}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          {onOpenLayers && (
            <button
              onClick={onOpenLayers}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-lg transition-colors"
              title="Layers"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm"
          title="Expand Tools Panel"
          id="btn-expand-toolbar"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>EXPAND</span>
        </button>
      </div>
    );
  }

  // Render Full Expanded Toolbar
  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800/90 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 max-w-[96vw] overflow-x-auto ring-1 ring-white/5 select-none"
      id="studio-toolbar-expanded"
    >
      {/* 0. Collapse Toolbar Toggle */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-xl transition-all flex items-center gap-1 border-r border-slate-800/80 pr-2.5"
        title="Collapse tools panel to maximize drawing real estate"
        id="btn-collapse-toolbar"
      >
        <ChevronUp className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider hidden xl:inline text-slate-400">
          HIDE
        </span>
      </button>

      {/* 1. Core Illustration & Drafting Tools */}
      <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (handleToolSelect) {
                  handleToolSelect(t.id);
                } else if (activeTool === t.id) {
                  setActiveTool('select');
                } else {
                  setActiveTool(t.id);
                }
                if (t.id === 'denim' && !brushColor.startsWith('#1e') && !brushColor.startsWith('#60')) {
                  setBrushColor('#1E3A8A');
                } else if (t.id === 'watercolor' && brushColor === '#FFFFFF') {
                  setBrushColor('#F5D0B5');
                } else if (t.id === 'chalk' && brushColor === '#1E293B') {
                  setBrushColor('#FFFFFF');
                }
              }}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive
                  ? t.id === 'shears'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30'
                    : t.id === 'tape_measure'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title={`${t.label} — ${t.desc}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] hidden lg:inline font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Top Bodice Section Buttons for Spawning Customizable Cutting Sheets */}
      <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
        <button
          onClick={() => {
            if (addSheet) addSheet({ name: 'Front Bodice Sheet', type: 'bodice_front', width: 340, height: 460, isMirrored: true });
            if (addLayer) addLayer('Front Bodice Panel', 'bodice_front');
          }}
          className="px-2 py-1 bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
          title="Spawn Front Bodice White Cutting Sheet with Fold Mirror"
        >
          <span>+ Front Bodice</span>
        </button>
        <button
          onClick={() => {
            if (addSheet) addSheet({ name: 'Back Bodice Sheet', type: 'bodice_back', width: 320, height: 440, isMirrored: true });
            if (addLayer) addLayer('Back Bodice Panel', 'bodice_back');
          }}
          className="px-2 py-1 bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
          title="Spawn Back Bodice White Cutting Sheet"
        >
          <span>+ Back Bodice</span>
        </button>
        <button
          onClick={() => {
            if (addSheet) addSheet({ name: 'Sleeve Sheet', type: 'sleeve', width: 280, height: 460, isMirrored: false });
            if (addLayer) addLayer('Fitted Sleeve', 'sleeve');
          }}
          className="px-2 py-1 bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-white rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs"
          title="Spawn Fitted Sleeve White Cutting Sheet"
        >
          <span>+ Sleeve</span>
        </button>
        <button
          onClick={() => setActiveTool('draw_cut_sheet')}
          className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border ${
            activeTool === 'draw_cut_sheet'
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-gold-sm'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="Draw Custom Cutting Sheet (Click & drag on canvas to define custom width & height)"
        >
          <Square className="w-3.5 h-3.5" />
          <span>Draw Sheet</span>
        </button>
      </div>

      {/* 3. Seam Allowance Broken Line Style Toggle */}
      <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
        <button
          onClick={() => {
            const next = !isDashedSeamAllowance;
            if (setIsDashedSeamAllowance) setIsDashedSeamAllowance(next);
            if (setStrokeDashStyle) setStrokeDashStyle(next ? 'dashed' : 'solid');
          }}
          className={`px-2 py-1 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1 transition-all border ${
            isDashedSeamAllowance
              ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-xs'
              : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Toggle Broken Lines for Seam Allowances (Dashed 6 4)"
        >
          <span className="font-black tracking-widest">- -</span>
          <span>{isDashedSeamAllowance ? 'Broken Seam' : 'Solid Line'}</span>
        </button>
      </div>

      {/* 4. Color Swatches */}
      <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
        {colorPalettes.map((c) => (
          <button
            key={c.hex}
            onClick={() => setBrushColor(c.hex)}
            className={`w-4 h-4 rounded-full border border-slate-700/80 transition-all ${
              brushColor === c.hex
                ? 'scale-125 ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 shadow-sm'
                : 'hover:scale-110'
            }`}
            style={{ backgroundColor: c.hex }}
            title={`${c.name} (${c.hex})`}
          />
        ))}
      </div>

      {/* 5. Snapping Rulers and Curves */}
      <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
        <div className="flex items-center bg-slate-950/60 rounded-xl p-0.5 border border-slate-800">
          <button
            onClick={() => {
              const next = activeRulerType === 'straight' ? null : 'straight';
              setActiveRulerType(next);
            }}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${
              activeRulerType === 'straight'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Straight Ruler Guide"
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase">{rulerLength || 18}" Ruler</span>
          </button>

          <button
            onClick={() => {
              setRulerLength((prev) => (prev === 18 ? 36 : 18));
              if (activeRulerType !== 'straight') setActiveRulerType('straight');
            }}
            className="px-1.5 py-1 text-[10px] font-mono font-bold text-amber-300 hover:text-amber-200 hover:bg-slate-800 rounded transition-colors"
            title={`Switch to ${rulerLength === 18 ? 'Long 36" Ruler' : 'Short 18" Ruler'}`}
          >
            {rulerLength === 18 ? '36" ›' : '18" ›'}
          </button>
        </div>

        <button
          onClick={() => {
            const next = activeRulerType === 'french_curve' ? null : 'french_curve';
            setActiveRulerType(next);
          }}
          className={`p-2 rounded-xl transition-all flex items-center gap-1 ${
            activeRulerType === 'french_curve'
              ? 'bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Virtual French Curve (Snap neckline & armhole contours)"
        >
          <Ruler className="w-4 h-4 rotate-45" />
          <span className="text-[11px] hidden md:inline font-semibold">French Curve</span>
        </button>

        <button
          onClick={() => {
            const next = activeRulerType === 'hip_curve' ? null : 'hip_curve';
            setActiveRulerType(next);
          }}
          className={`p-2 rounded-xl transition-all flex items-center gap-1 ${
            activeRulerType === 'hip_curve'
              ? 'bg-purple-400 text-slate-950 font-bold shadow-md shadow-purple-400/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Virtual Hip Curve (Snap side seam flare & hem curves)"
        >
          <Compass className="w-4 h-4" />
          <span className="text-[11px] hidden md:inline font-semibold">Hip Curve</span>
        </button>
      </div>

      {/* 6. Scissors Target Cut Color & Infrared Guide (Requirement 6) */}
      {activeTool === 'shears' && (
        <div className="flex items-center gap-1.5 border-r border-slate-800/80 pr-2">
          {/* Target Cut Color Selector */}
          <div className="flex items-center gap-1 bg-slate-950/70 px-2 py-1 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-medium">Cut Color:</span>
            <div className="flex items-center gap-1">
              {autoDetectedColors.map((col) => (
                <button
                  key={col}
                  onClick={() => setTargetCutColor(col)}
                  style={{ backgroundColor: col }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    targetCutColor === col
                      ? 'ring-2 ring-rose-400 scale-125 border-white shadow'
                      : 'border-slate-600 opacity-70 hover:opacity-100'
                  }`}
                  title={`Target Cut Color: ${col}`}
                />
              ))}
            </div>
            <button
              onClick={() => setIsEyedropperActive(!isEyedropperActive)}
              className={`p-1 rounded transition-colors ${
                isEyedropperActive
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
              title="Eyedropper: Click on any stroke on the canvas to extract target cut color"
            >
              <Pipette className="w-3 h-3" />
            </button>
            <input
              type="color"
              value={targetCutColor || '#F43F5E'}
              onChange={(e) => setTargetCutColor(e.target.value)}
              className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
              title="Manual Color Picker"
            />
          </div>

          <button
            onClick={() => setInfraredGuideActive((v) => !v)}
            className={`px-2 py-1 rounded-xl text-[11px] font-mono flex items-center gap-1 transition-all ${
              infraredGuideActive
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400 font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Infrared Laser Cutting Guide"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Infrared Guide</span>
          </button>
        </div>
      )}

      {/* 7. History Controls */}
      <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
        <button
          onClick={onUndo}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          className="p-2 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          title="Clear Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 8. Advanced Tailor Options Drawer Trigger */}
      <button
        onClick={() => setShowAdvancedDrawer((v) => !v)}
        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-xl transition-all flex items-center gap-1 text-xs"
        title="Open Advanced Tailor Options (DXF export, seam offsets, node coordinates)"
      >
        <Sliders className="w-4 h-4 text-amber-400/80" />
        <span className="hidden sm:inline font-mono text-[11px]">Advanced</span>
      </button>

      {/* 9. Layer Panel Trigger */}
      {onOpenLayers && (
        <button
          onClick={onOpenLayers}
          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-xl transition-all flex items-center gap-1 text-xs"
          title="Toggle Canvas Layers"
          id="btn-toggle-layers-toolbar"
        >
          <Layers className="w-4 h-4" />
          <span className="hidden sm:inline font-mono text-[11px]">Layers</span>
        </button>
      )}
    </div>
  );
}
