/**
 * TAILORIX AI — CAD TOOL RAIL
 * Left-side tool palette for precision vector selection, freehand cut sheet creation,
 * broken seam allowance toggles, edge-snapping, and the unanchored 8-ruler toolbox.
 * Compact dark graphite aesthetic with champagne gold active indicators.
 */

import React, { useState } from 'react';
import {
  MousePointer,
  Move,
  Ruler,
  Scissors,
  Grid,
  Magnet,
  Layers,
  Square,
  Compass,
  Maximize2,
  Lock,
  Unlock,
  Sparkles,
  RotateCw,
  Minus,
  Check
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

export default function CADToolRail({
  activeTool: propActiveTool,
  setActiveTool: propSetActiveTool,
  showGrid: propShowGrid,
  setShowGrid: propSetShowGrid,
  snapToGrid: propSnapToGrid,
  setSnapToGrid: propSetSnapToGrid,
  showSeamAllowance: propShowSeamAllowance,
  setShowSeamAllowance: propSetShowSeamAllowance,
  showGrainlines: propShowGrainlines,
  setShowGrainlines: propSetShowGrainlines,
}) {
  const canvasCtx = useCanvas();

  // State fallbacks between Context and Props
  const activeTool = propActiveTool !== undefined ? propActiveTool : (canvasCtx.activeTool || 'select');
  const setActiveTool = propSetActiveTool || canvasCtx.setActiveTool || (() => {});

  const showGrid = propShowGrid !== undefined ? propShowGrid : true;
  const setShowGrid = propSetShowGrid || (() => {});

  const snapToGrid = propSnapToGrid !== undefined ? propSnapToGrid : (canvasCtx.snapGuideActive ?? true);
  const setSnapToGrid = propSetSnapToGrid || canvasCtx.setSnapGuideActive || (() => {});

  const showSeamAllowance = propShowSeamAllowance !== undefined ? propShowSeamAllowance : (canvasCtx.showSeamAllowance ?? true);
  const setShowSeamAllowance = propSetShowSeamAllowance || canvasCtx.setShowSeamAllowance || (() => {});

  // Stroke Dash Style: 'solid' vs 'dashed' (seam allowance broken line: [6, 4])
  const strokeDashStyle = canvasCtx.strokeDashStyle || 'solid';
  const setStrokeDashStyle = canvasCtx.setStrokeDashStyle || (() => {});
  const isDashedSeamAllowance = canvasCtx.isDashedSeamAllowance || strokeDashStyle === 'dashed';
  const setIsDashedSeamAllowance = canvasCtx.setIsDashedSeamAllowance || (() => {});

  // 8-Ruler Toolbox
  const rulers = canvasCtx.rulers || [];
  const toggleRuler = canvasCtx.toggleRuler || (() => {});
  const globalRulerMovement = canvasCtx.globalRulerMovement ?? true;
  const setGlobalRulerMovement = canvasCtx.setGlobalRulerMovement || (() => {});

  // Flyout drawer for 8 rulers
  const [showRulerMenu, setShowRulerMenu] = useState(false);

  const primaryTools = [
    { id: 'select', label: 'Select & Move Piece', icon: MousePointer },
    { id: 'draw_cut_sheet', label: 'Draw Cut Sheet (Click & drag custom trace area)', icon: Square },
    { id: 'node', label: 'Drag & Adjust Points', icon: Move },
    { id: 'tape', label: 'Digital Tape Measure', icon: Ruler },
    { id: 'pan', label: 'Pan Canvas Board', icon: Maximize2 },
  ];

  // Toggle solid vs broken/dashed seam allowance line style
  const handleToggleSeamLineStyle = () => {
    const nextDashed = !isDashedSeamAllowance;
    setIsDashedSeamAllowance(nextDashed);
    setStrokeDashStyle(nextDashed ? 'dashed' : 'solid');
  };

  return (
    <div className="w-12 bg-[#141517] border-r border-[#222427] flex flex-col items-center py-3 justify-between shadow-sm z-30 shrink-0 select-none relative">
      {/* 1. Primary Drafting & Cut-Sheet Tools */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        {primaryTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative ${
                isActive
                  ? 'bg-[#C5A059]/20 border border-[#C5A059]/50 text-[#E5C07B] shadow-gold-sm ring-1 ring-[#C5A059]/30'
                  : 'text-[#8A8B93] hover:bg-[#1E2023] hover:text-[#EDEDF0] border border-transparent'
              }`}
              title={tool.label}
              id={`rail-tool-${tool.id}`}
            >
              <Icon className="w-4 h-4" />
              {tool.id === 'draw_cut_sheet' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Unanchored 8-Ruler Toolbox & Seam Allowance Toggles */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1 border-t border-[#222427] pt-2">
        {/* 8-Ruler Toolbox Flyout Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowRulerMenu((v) => !v)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              showRulerMenu || rulers.some((r) => r.isVisible)
                ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-sm'
                : 'text-[#8A8B93] hover:bg-[#1E2023] hover:text-[#EDEDF0] border border-transparent'
            }`}
            title="8-Piece Tailor's Ruler Toolbox (Unanchored Curves & L-Square)"
            id="rail-btn-8-rulers"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* 8-Ruler Quick Flyout Panel */}
          {showRulerMenu && (
            <div
              className="absolute left-12 top-0 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-50 text-slate-100 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150"
              id="rail-ruler-flyout"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  8 Rulers & Curves
                </span>
                <span className="text-[9px] font-mono text-slate-400">UNANCHORED</span>
              </div>

              {/* Global Movement Toggle for Rulers */}
              <div className="flex items-center justify-between p-2 mb-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Global Move
                </span>
                <button
                  onClick={() => setGlobalRulerMovement(!globalRulerMovement)}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase font-mono transition-colors ${
                    globalRulerMovement
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                  title="Toggle unanchored movement across the entire canvas"
                >
                  {globalRulerMovement ? 'FREE MOVE' : 'LOCKED'}
                </button>
              </div>

              {/* Rulers Toggle Grid */}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {rulers.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggleRuler(r.id)}
                    className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-between ${
                      r.isVisible
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{r.shortName || r.name}</span>
                    {r.isVisible && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seam Allowance Line Style Toggle (Solid vs Broken/Dashed: "6 4") */}
        <button
          onClick={handleToggleSeamLineStyle}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isDashedSeamAllowance
              ? 'bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-sm'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title={`Seam Allowance Line: ${isDashedSeamAllowance ? 'Broken / Dashed (6 4)' : 'Solid Line'}`}
          id="rail-btn-line-style"
        >
          {isDashedSeamAllowance ? (
            <span className="font-mono text-[9px] font-bold border-b-2 border-dashed border-amber-400 px-0.5">
              - -
            </span>
          ) : (
            <Minus className="w-4 h-4" />
          )}
        </button>

        {/* Extra Sewing Edge Seam Allowance Toggle */}
        <button
          onClick={() => setShowSeamAllowance(!showSeamAllowance)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            showSeamAllowance
              ? 'bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E5C07B]'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title="Toggle Extra Sewing Edge (+0.5 in)"
        >
          <Scissors className="w-4 h-4" />
        </button>

        {/* Fabric Grainlines Toggle */}
        <button
          onClick={() => propSetShowGrainlines && propSetShowGrainlines(!propShowGrainlines)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            propShowGrainlines
              ? 'bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E5C07B]'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title="Toggle Fabric Direction Lines"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Drafting Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            showGrid
              ? 'bg-[#1E2023] text-[#EDEDF0] border border-[#2D2E32]'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title="Toggle Drafting Grid"
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Magnetic Edge-Snapping Toggle */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            snapToGrid
              ? 'bg-[#C5A059]/20 border border-[#C5A059]/40 text-[#E5C07B]'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title="Toggle Magnetic Edge-Snapping to Rulers & Grid"
        >
          <Magnet className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
