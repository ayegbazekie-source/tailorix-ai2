import React from 'react';
import {
  X,
  Compass,
  Ruler,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Magnet,
  Maximize2,
  Info,
  Move,
  Lock,
  Unlock,
  PenTool,
  RotateCw,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Target,
} from 'lucide-react';
import { TAILOR_RULER_LIST, TAILOR_RULERS_CATALOG, getRulerPrimaryEdgeWorldPoints } from './TailorRulersCatalog';

export default function DraftingToolboxDrawer({
  isOpen,
  onClose = () => {},
  activeRulers = [],
  onToggleRuler = () => {},
  onSelectRuler = () => {},
  selectedRulerId = null,
  onUpdateRuler = () => {},
  onSnapSeamEdge = () => {},
  onClearAllRulers = () => {},
  zoom = 1,
  panOffset = { x: 0, y: 0 },
  snappingEnabled = true,
  onToggleSnapping = () => {},
  snapThreshold = 26,
  onChangeSnapThreshold = () => {},
}) {
  if (!isOpen) return null;

  const handleSelectRulerSafe = (id) => {
    if (typeof onSelectRuler === 'function') {
      onSelectRuler(id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#090d16]/98 border-l border-amber-500/30 shadow-2xl flex flex-col h-full text-slate-100 animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Tailor's Physical Ruler Toolbox</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                  8 Calibrated Vector Curves
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Move, rotate, lock in place, and trace straight seam lines & curves
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Ruler Controls */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSnapping}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                snappingEnabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
              title="Magnetic Ruler Snapping: Snaps chalk and pen strokes along ruler edges"
            >
              <Magnet className={`w-3.5 h-3.5 ${snappingEnabled ? 'text-amber-400 animate-pulse' : ''}`} />
              <span>Edge Snapping: {snappingEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {activeRulers.length > 0 && (
            <button
              onClick={onClearAllRulers}
              className="px-2.5 py-1.5 rounded-lg font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove All ({activeRulers.length})</span>
            </button>
          )}
        </div>

        {/* Visual 8-Ruler Icon Grid: Select by visual shape without reading titles */}
        <div className="p-3 border-b border-slate-800/90 bg-slate-950/80">
          <div className="grid grid-cols-4 gap-2.5">
            {TAILOR_RULER_LIST.map((tool) => {
              const activeInstance = activeRulers.find((r) => r.type === tool.id);
              const isPlaced = Boolean(activeInstance);
              const isSelected = isPlaced && activeInstance.id === selectedRulerId;
              const pathD = tool.outerPath || tool.path || (tool.getOuterPath ? tool.getOuterPath(18) : '');

              return (
                <button
                  key={`icon-grid-${tool.id}`}
                  onClick={() => {
                    if (isPlaced) {
                      handleSelectRulerSafe(activeInstance.id);
                    } else {
                      onToggleRuler(tool.id);
                    }
                  }}
                  className={`group flex flex-col items-center justify-between p-2 rounded-xl border transition-all relative overflow-hidden h-24 ${
                    isSelected
                      ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/60'
                      : isPlaced
                      ? 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800'
                  }`}
                  title={`${tool.name} - Tap to select without reading titles`}
                >
                  {/* Status Indicator Pip */}
                  {isPlaced && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse z-10" />
                  )}

                  {/* Prominent Ruler Vector Silhouette Icon */}
                  <div className="w-full flex-1 flex items-center justify-center p-1 relative">
                    <svg
                      viewBox={`0 0 ${tool.width || 400} ${tool.height || 100}`}
                      className="w-full h-12 filter drop-shadow-md transition-transform group-hover:scale-110"
                    >
                      <path
                        d={pathD}
                        fill={
                          tool.acrylicTheme === 'solid_white'
                            ? '#f8fafc'
                            : tool.acrylicTheme === 'clear_blue_grid'
                            ? '#38bdf8'
                            : '#f59e0b'
                        }
                        fillOpacity={isPlaced ? 0.75 : 0.45}
                        stroke={
                          tool.acrylicTheme === 'solid_white'
                            ? '#ffffff'
                            : tool.acrylicTheme === 'clear_blue_grid'
                            ? '#bae6fd'
                            : '#fde047'
                        }
                        strokeWidth="8"
                      />
                      {tool.cutouts &&
                        tool.cutouts.map((c, i) => (
                          <circle
                            key={i}
                            cx={c.cx}
                            cy={c.cy}
                            r={c.r * 1.6}
                            fill="#090d16"
                            stroke="#facc15"
                            strokeWidth="2.5"
                          />
                        ))}
                    </svg>
                  </div>

                  {/* Concise Visual Tag */}
                  <span
                    className={`text-[10px] font-bold tracking-tight truncate w-full text-center px-1 rounded py-0.5 ${
                      isSelected
                        ? 'text-amber-300 font-extrabold bg-amber-500/30'
                        : isPlaced
                        ? 'text-amber-400 bg-amber-500/15'
                        : 'text-slate-300 group-hover:text-white bg-slate-800/80'
                    }`}
                  >
                    {tool.name.replace(' Tailor Ruler', '').replace(' Ruler', '')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ruler Catalog List */}
        <div className="flex-1 drawer-scroll-effect p-3.5 space-y-3 touch-pan-y">
          {TAILOR_RULER_LIST.map((tool) => {
            const activeInstance = activeRulers.find((r) => r.type === tool.id);
            const isPlaced = Boolean(activeInstance);
            const isSelected = isPlaced && activeInstance.id === selectedRulerId;
            const isMoveMode = isPlaced ? (activeInstance.isMoveMode !== undefined ? activeInstance.isMoveMode : !activeInstance.locked) : false;
            const pathD = tool.outerPath || tool.path || (tool.getOuterPath ? tool.getOuterPath(18) : '');

            return (
              <div
                key={tool.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-gold-sm ring-1 ring-amber-500/30'
                    : isPlaced
                    ? 'bg-slate-900/70 border-amber-500/30'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Visual SVG Mini Thumbnail */}
                  <div
                    className="w-18 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer p-1.5 hover:border-amber-500/50 transition-colors"
                    onClick={() => {
                      if (isPlaced) handleSelectRulerSafe(activeInstance.id);
                      else onToggleRuler(tool.id);
                    }}
                    title="Click to place or select ruler"
                  >
                    <svg viewBox={`0 0 ${tool.width} ${tool.height}`} className="w-full h-full">
                      <path
                        d={pathD}
                        fill={
                          tool.acrylicTheme === 'solid_white'
                            ? '#f8fafc'
                            : tool.acrylicTheme === 'clear_blue_grid'
                            ? '#0284c7'
                            : '#f59e0b'
                        }
                        fillOpacity="0.35"
                        stroke={
                          tool.acrylicTheme === 'solid_white'
                            ? '#f8fafc'
                            : tool.acrylicTheme === 'clear_blue_grid'
                            ? '#38bdf8'
                            : '#fbbf24'
                        }
                        strokeWidth="6"
                      />
                      {tool.cutouts &&
                        tool.cutouts.map((c, i) => (
                          <circle key={i} cx={c.cx} cy={c.cy} r={c.r * 1.5} fill="#090d16" stroke="#facc15" strokeWidth="2" />
                        ))}
                    </svg>
                  </div>

                  {/* Info Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-100 truncate">{tool.name}</h3>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                        {tool.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-300 font-medium">{tool.subtitle}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>

                    {/* Primary Actions */}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <button
                        onClick={() => onToggleRuler(tool.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isPlaced
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-gold-sm'
                        }`}
                      >
                        {isPlaced ? (
                          <>
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Place on Canvas</span>
                          </>
                        )}
                      </button>

                      {isPlaced && (
                        <>
                          <button
                            onClick={() => handleSelectRulerSafe(activeInstance.id)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>{isSelected ? 'Focused' : 'Focus'}</span>
                          </button>

                          {/* Move Mode Toggle */}
                          <button
                            onClick={() => {
                              const nextMove = !isMoveMode;
                              onUpdateRuler?.(activeInstance.id, {
                                isMoveMode: nextMove,
                                locked: !nextMove,
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm ${
                              isMoveMode
                                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                            }`}
                            title="Toggle Free Movement: When ON, drag freely anywhere on canvas. When OFF, ruler is locked for tracing."
                          >
                            <Move className={`w-3.5 h-3.5 ${isMoveMode ? 'animate-bounce' : ''}`} />
                            <span>{isMoveMode ? 'Move ON (Drag)' : 'Move OFF'}</span>
                          </button>

                          {/* Lock / Unlock Toggle */}
                          <button
                            onClick={() => {
                              const nextLocked = !activeInstance.locked;
                              onUpdateRuler?.(activeInstance.id, {
                                locked: nextLocked,
                                isMoveMode: !nextLocked,
                              });
                            }}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                              activeInstance.locked
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title={activeInstance.locked ? 'Unlock ruler position' : 'Lock ruler position'}
                          >
                            {activeInstance.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Trace Straight Line */}
                          <button
                            onClick={() => {
                              const points = getRulerPrimaryEdgeWorldPoints(activeInstance);
                              if (points && points.length > 1) {
                                onSnapSeamEdge?.(points, tool.name);
                              }
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-gold-sm transition-colors"
                            title="Trace Straight Edge onto Active Pattern Layer"
                          >
                            <PenTool className="w-3 h-3" />
                            <span>Trace Line</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Extended Movement & Rotation Controls (When Ruler is placed) */}
                    {isPlaced && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
                        {/* 1. Flexible Movement Across Workspace */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                            <Move className="w-3 h-3 text-amber-400" />
                            <span>Move Position:</span>
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Directional Nudges */}
                            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                              <button
                                onClick={() =>
                                  onUpdateRuler?.(activeInstance.id, {
                                    x: (activeInstance.x || 0) - 20,
                                  })
                                }
                                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                                title="Move Left 20px"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateRuler?.(activeInstance.id, {
                                    y: (activeInstance.y || 0) - 20,
                                  })
                                }
                                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                                title="Move Up 20px"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateRuler?.(activeInstance.id, {
                                    y: (activeInstance.y || 0) + 20,
                                  })
                                }
                                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                                title="Move Down 20px"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  onUpdateRuler?.(activeInstance.id, {
                                    x: (activeInstance.x || 0) + 20,
                                  })
                                }
                                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded"
                                title="Move Right 20px"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Center in Workspace */}
                            <button
                              onClick={() => {
                                const cx = Math.round((-panOffset.x + (typeof window !== 'undefined' ? window.innerWidth / 2 : 500)) / zoom);
                                const cy = Math.round((-panOffset.y + (typeof window !== 'undefined' ? window.innerHeight / 2 : 300)) / zoom);
                                onUpdateRuler?.(activeInstance.id, { x: cx, y: cy });
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1"
                              title="Center Ruler in Current Screen View"
                            >
                              <Target className="w-3 h-3 text-sky-400" />
                              <span>Center</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. Flexible Rotation Controls */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="uppercase font-bold text-slate-400 flex items-center gap-1">
                              <Compass className="w-3 h-3 text-amber-400" />
                              <span>Rotation Angle:</span>
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              {Math.round(activeInstance.rotation || 0)}°
                            </span>
                          </div>

                          {/* Quick Angle Presets */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                onUpdateRuler?.(activeInstance.id, {
                                  rotation: ((activeInstance.rotation || 0) - 15 + 360) % 360,
                                })
                              }
                              className="flex-1 py-0.5 px-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded text-[10px] font-mono font-bold border border-slate-800"
                              title="Rotate -15°"
                            >
                              -15°
                            </button>
                            <button
                              onClick={() =>
                                onUpdateRuler?.(activeInstance.id, {
                                  rotation: ((activeInstance.rotation || 0) + 15) % 360,
                                })
                              }
                              className="flex-1 py-0.5 px-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded text-[10px] font-mono font-bold border border-slate-800"
                              title="Rotate +15°"
                            >
                              +15°
                            </button>
                            <button
                              onClick={() => onUpdateRuler?.(activeInstance.id, { rotation: 0 })}
                              className={`flex-1 py-0.5 px-1 rounded text-[10px] font-mono font-bold border transition-all ${
                                (activeInstance.rotation || 0) === 0
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                              }`}
                              title="0° Horizontal Straight"
                            >
                              0° Horiz
                            </button>
                            <button
                              onClick={() => onUpdateRuler?.(activeInstance.id, { rotation: 90 })}
                              className={`flex-1 py-0.5 px-1 rounded text-[10px] font-mono font-bold border transition-all ${
                                (activeInstance.rotation || 0) === 90
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                              }`}
                              title="90° Vertical Grainline"
                            >
                              90° Grain
                            </button>
                            <button
                              onClick={() => onUpdateRuler?.(activeInstance.id, { rotation: 45 })}
                              className={`flex-1 py-0.5 px-1 rounded text-[10px] font-mono font-bold border transition-all ${
                                (activeInstance.rotation || 0) === 45
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                              }`}
                              title="45° True Bias"
                            >
                              45° Bias
                            </button>
                          </div>

                          {/* Continuous Angle Slider */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="1"
                              value={Math.round(activeInstance.rotation || 0)}
                              onChange={(e) =>
                                onUpdateRuler?.(activeInstance.id, {
                                  rotation: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer Tip */}
        <div className="p-3.5 border-t border-slate-800/90 bg-slate-950 text-xs text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-snug">
            <strong className="text-slate-200">Move & Trace:</strong> Turn <strong className="text-amber-400">Move ON</strong> to drag rulers freely anywhere across your workspace. Turn <strong className="text-amber-400">Move OFF</strong> to lock the ruler firmly in position and trace straight lines or curves along its edge.
          </p>
        </div>
      </div>
    </div>
  );
}
