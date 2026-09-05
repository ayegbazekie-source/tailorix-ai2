import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid, Eye, Move } from 'lucide-react';
import { generateSeamAllowancePath } from '../../utils/patternEngine/seamOffset';

export default function CADCanvasInteractive({ cadData, selectedPanels, seamAllowance = 0.5, onNodeUpdate }) {
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

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col relative overflow-hidden font-mono select-none">
      <div className="flex items-center justify-between mb-2 px-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Move className="w-3.5 h-3.5" /> Interactive Node Manipulator
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

      <div
        className="relative w-full h-[480px] bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center cursor-crosshair"
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

            {cadData.pieces.map((piece, index) => {
              if (!selectedPanels.includes(index)) return null;

              const outerCutPath = piece.points
                ? generateSeamAllowancePath(piece.points, seamAllowance)
                : piece.path;

              return (
                <g key={piece.id}>
                  {/* Outer Cut Line */}
                  <path d={outerCutPath} fill="rgba(245, 158, 11, 0.04)" stroke="#f59e0b" strokeWidth="2" />

                  {/* Inner Sew Line */}
                  {showInnerStitchLine && (
                    <path d={piece.path} fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4,3" />
                  )}

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
          </svg>
        </div>
      </div>
    </div>
  );
}
