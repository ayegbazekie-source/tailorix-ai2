import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid, Eye, Move, Ruler, Trash2 } from 'lucide-react';
import { generateSeamAllowancePath } from '../../utils/patternEngine/seamOffset';

export default function CADCanvasInteractive({
  cadData,
  selectedPanels = [],
  seamAllowance = 0.5,
  onNodeUpdate,
  activeCroqui,
  tapePoints = [],
  setTapePoints,
  notchType = 'v_notch',
}) {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showInnerStitchLine, setShowInnerStitchLine] = useState(true);
  const [activeNode, setActiveNode] = useState(null); // { pieceId, pointIndex }

  const handleMouseDownNode = (pieceId, pointIndex, e) => {
    e.stopPropagation();
    setActiveNode({ pieceId, pointIndex });
  };

  const handleMouseMoveCanvas = (e) => {
    if (!activeNode) return;
    const svg = document.getElementById('cad-pattern-svg-interactive');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);

    if (onNodeUpdate) {
      onNodeUpdate(activeNode.pieceId, activeNode.pointIndex, { x, y });
    }
  };

  const handleMouseUpCanvas = () => {
    setActiveNode(null);
  };

  const handleCanvasClick = (e) => {
    // If not dragging a node, allow placing tape measure points
    if (activeNode || !setTapePoints) return;
    const svg = document.getElementById('cad-pattern-svg-interactive');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);

    setTapePoints((prev) => {
      if (prev.length >= 2) return [{ x, y }];
      return [...prev, { x, y }];
    });
  };

  // Tape distance in approximate inches (assuming standard 10px = 1 inch scale in our sloper layout)
  const tapeDistanceInches =
    tapePoints.length === 2
      ? (
          Math.hypot(tapePoints[1].x - tapePoints[0].x, tapePoints[1].y - tapePoints[0].y) / 10
        ).toFixed(2)
      : null;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col relative overflow-hidden font-mono select-none">
      <div className="flex items-center justify-between mb-2 px-1 text-[11px] flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Move className="w-3.5 h-3.5" /> Interactive Vector Viewport
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
            SEAM: +{seamAllowance}"
          </span>
          {tapeDistanceInches && (
            <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Ruler className="w-3 h-3" /> TAPE: {tapeDistanceInches}"
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {tapePoints.length > 0 && setTapePoints && (
            <button
              onClick={() => setTapePoints([])}
              className="p-1.5 rounded-lg border bg-slate-950 border-slate-800 text-rose-400 hover:bg-rose-500/10 text-[10px] flex items-center gap-1 transition-all"
              title="Clear Tape Measure"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Tape</span>
            </button>
          )}

          <button
            onClick={() => setShowInnerStitchLine(!showInnerStitchLine)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
              showInnerStitchLine
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle Inner Stitching Line"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stitch Lines</span>
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border ${
              showGrid
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoom(1)}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className="relative w-full h-[480px] bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onMouseLeave={handleMouseUpCanvas}
      >
        <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.05s linear' }} className="w-full h-full">
          <svg id="cad-pattern-svg-interactive" viewBox="0 0 900 650" className="w-full h-full">
            <defs>
              <pattern id="cadGridInt" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
              <pattern id="cadGridMajorInt" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#cadGridInt)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1.2" />
              </pattern>
            </defs>

            {showGrid && <rect width="100%" height="100%" fill="url(#cadGridMajorInt)" />}

            {/* Background Croqui Silhouette Underlay */}
            {activeCroqui?.path && (
              <g id="croqui-underlay" opacity="0.3">
                <path
                  d={activeCroqui.path}
                  fill="rgba(245, 158, 11, 0.05)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <text x="30" y="40" fill="#f59e0b" fontSize="11" fontWeight="bold">
                  CROQUI: {activeCroqui.name}
                </text>
              </g>
            )}

            {/* CAD Pattern Pieces */}
            {cadData?.pieces?.map((piece, index) => {
              if (selectedPanels.length > 0 && !selectedPanels.includes(index)) return null;

              const outerCutPath = piece.points
                ? generateSeamAllowancePath(piece.points, seamAllowance)
                : piece.path;

              // Calculate bounding anchor for piece label
              const firstPt = piece.points?.[0] || { x: 50 + index * 260, y: 50 };
              const labelX = firstPt.x;
              const labelY = Math.max(firstPt.y - 12, 30);

              return (
                <g key={piece.id || index} id={`piece-group-${piece.id}`}>
                  {/* Outer Cut Line with Seam Allowance */}
                  <path
                    d={outerCutPath}
                    fill="rgba(245, 158, 11, 0.04)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />

                  {/* Inner Sew / Stitch Line */}
                  {showInnerStitchLine && (
                    <path
                      d={piece.path}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="4,3"
                    />
                  )}

                  {/* Grainline with Direction Arrows */}
                  {piece.grainline && (
                    <g className="grainline">
                      <line
                        x1={piece.grainline.x1}
                        y1={piece.grainline.y1}
                        x2={piece.grainline.x2}
                        y2={piece.grainline.y2}
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="5,4"
                      />
                      {/* Grainline arrowheads */}
                      <circle cx={piece.grainline.x1} cy={piece.grainline.y1} r="2.5" fill="#38bdf8" />
                      <circle cx={piece.grainline.x2} cy={piece.grainline.y2} r="2.5" fill="#38bdf8" />
                      <text
                        x={(piece.grainline.x1 + piece.grainline.x2) / 2 + 5}
                        y={(piece.grainline.y1 + piece.grainline.y2) / 2}
                        fill="#38bdf8"
                        fontSize="9"
                        letterSpacing="1"
                      >
                        GRAIN
                      </text>
                    </g>
                  )}

                  {/* Piece Identification and Cut Quantity Label */}
                  <text
                    x={labelX}
                    y={labelY}
                    fontSize="11"
                    fill="#f8fafc"
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    {piece.name}
                  </text>
                  <text
                    x={labelX}
                    y={labelY + 13}
                    fontSize="9"
                    fill="#94a3b8"
                  >
                    CUT: {piece.cutQuantity || '1X'}
                  </text>

                  {/* Interactive Control Handles / Vertex Nodes */}
                  {piece.points &&
                    piece.points.map((pt, pIdx) => {
                      const isActive =
                        activeNode?.pieceId === piece.id && activeNode?.pointIndex === pIdx;
                      return (
                        <circle
                          key={pIdx}
                          cx={pt.x}
                          cy={pt.y}
                          r={isActive ? 6 : 4}
                          className={`cursor-pointer transition-all ${
                            isActive
                              ? 'fill-amber-400 stroke-white stroke-2'
                              : 'fill-sky-400 hover:fill-amber-400 stroke-slate-900 stroke-1'
                          }`}
                          onMouseDown={(e) => handleMouseDownNode(piece.id, pIdx, e)}
                        />
                      );
                    })}
                </g>
              );
            })}

            {/* Precision Tape Measure Overlay */}
            {tapePoints?.length === 2 && (
              <g id="tape-measure-line">
                <line
                  x1={tapePoints[0].x}
                  y1={tapePoints[0].y}
                  x2={tapePoints[1].x}
                  y2={tapePoints[1].y}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                />
                <circle cx={tapePoints[0].x} cy={tapePoints[0].y} r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                <circle cx={tapePoints[1].x} cy={tapePoints[1].y} r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                <rect
                  x={(tapePoints[0].x + tapePoints[1].x) / 2 - 30}
                  y={(tapePoints[0].y + tapePoints[1].y) / 2 - 16}
                  width="60"
                  height="20"
                  rx="4"
                  fill="#064e3b"
                  stroke="#10b981"
                  strokeWidth="1"
                />
                <text
                  x={(tapePoints[0].x + tapePoints[1].x) / 2}
                  y={(tapePoints[0].y + tapePoints[1].y) / 2 - 2}
                  fill="#6ee7b7"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {tapeDistanceInches}"
                </text>
              </g>
            )}

            {tapePoints?.length === 1 && (
              <g id="tape-measure-point">
                <circle cx={tapePoints[0].x} cy={tapePoints[0].y} r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                <text
                  x={tapePoints[0].x + 8}
                  y={tapePoints[0].y - 6}
                  fill="#10b981"
                  fontSize="10"
                  fontWeight="bold"
                >
                  Click 2nd point to measure
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
