import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid, Layers, Eye } from 'lucide-react';
import { generateSeamAllowancePath } from '../../utils/patternEngine/seamOffset';

export default function CADCanvas({ cadData, selectedPanels, seamAllowance = 0.5 }) {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showInnerStitchLine, setShowInnerStitchLine] = useState(true);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col relative overflow-hidden font-mono">
      <div className="flex items-center justify-between mb-2 px-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold uppercase tracking-wider">
            Dual-Boundary Pattern Viewport
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
            SEAM: +{seamAllowance}"
          </span>
        </div>

        <div className="flex items-center gap-1.5">
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
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setZoom(1)}
            className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[480px] bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
        <div
          style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
          className="w-full h-full"
        >
          <svg id="cad-pattern-svg" viewBox="0 0 900 650" className="w-full h-full font-mono select-none">
            <defs>
              <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
              <pattern id="cadGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#cadGrid)" />
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1.2" />
              </pattern>
            </defs>

            {showGrid && <rect width="100%" height="100%" fill="url(#cadGridMajor)" />}

            {cadData.pieces.map((piece, index) => {
              if (!selectedPanels.includes(index)) return null;

              // Generate outward cut boundary using offset utility
              const outerCutPath = piece.points
                ? generateSeamAllowancePath(piece.points, seamAllowance)
                : piece.path;

              return (
                <g key={piece.id}>
                  {/* Outer Cut Line (Fabric Cutting Boundary) */}
                  <path
                    d={outerCutPath}
                    fill="rgba(245, 158, 11, 0.04)"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />

                  {/* Inner Sew/Stitch Line (Net Seam) */}
                  {showInnerStitchLine && (
                    <path
                      d={piece.path}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="4,3"
                    />
                  )}

                  {/* Grainline Vector */}
                  {piece.grainline && (
                    <line
                      x1={piece.grainline.x1}
                      y1={piece.grainline.y1}
                      x2={piece.grainline.x2}
                      y2={piece.grainline.y2}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                  )}

                  {/* Piece Annotations */}
                  <text
                    x={piece.grainline?.x1 ? piece.grainline.x1 + 10 : 60}
                    y={100}
                    fontSize="11"
                    fill="#f8fafc"
                    fontWeight="bold"
                  >
                    {piece.name}
                  </text>
                  <text
                    x={piece.grainline?.x1 ? piece.grainline.x1 + 10 : 60}
                    y={118}
                    fontSize="9"
                    fill="#94a3b8"
                  >
                    {piece.cutQuantity}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
