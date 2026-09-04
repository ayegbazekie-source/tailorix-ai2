import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Grid } from 'lucide-react';

export default function CADCanvas({ cadData, selectedPanels }) {
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-2 px-1 font-mono text-[11px]">
        <span className="text-amber-400 font-bold uppercase tracking-wider">
          Interactive Pattern Canvas
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg border ${showGrid ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:text-amber-400">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[480px] bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
        <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }} className="w-full h-full">
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
              return (
                <g key={piece.id}>
                  <path d={piece.path} fill="rgba(245, 158, 11, 0.05)" stroke="#f59e0b" strokeWidth="2" strokeDasharray="none" />
                  {piece.grainline && (
                    <line x1={piece.grainline.x1} y1={piece.grainline.y1} x2={piece.grainline.x2} y2={piece.grainline.y2} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" />
                  )}
                  <text x={piece.grainline?.x1 ? piece.grainline.x1 + 10 : 60} y={100} fontSize="11" fill="#f8fafc" fontWeight="bold">
                    {piece.name}
                  </text>
                  <text x={piece.grainline?.x1 ? piece.grainline.x1 + 10 : 60} y={118} fontSize="9" fill="#94a3b8">
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
