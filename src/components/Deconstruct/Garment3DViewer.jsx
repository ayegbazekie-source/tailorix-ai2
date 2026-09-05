import React, { useState, useMemo } from 'react';
import { Box, Activity, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { convertPiecesTo3DMesh } from '../../utils/meshEngine';

export default function Garment3DViewer({ cadData, measurements }) {
  const [activeView, setActiveView] = useState('3d_strain'); // '3d_mesh' | '3d_strain'

  const meshes = useMemo(() => {
    return convertPiecesTo3DMesh(cadData.pieces, measurements);
  }, [cadData, measurements]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 font-mono text-slate-100 flex flex-col gap-3">
      {/* Viewport Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            3D Digital Twin Simulation
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('3d_strain')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              activeView === '3d_strain'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Strain Map
          </button>
          <button
            onClick={() => setActiveView('3d_mesh')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
              activeView === '3d_mesh'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Textured Mesh
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport Container */}
      <div className="relative w-full h-[360px] bg-[#070a12] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
        {/* Wireframe Avatar Simulation Graphic */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center relative animate-pulse">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Activity className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs font-bold text-slate-200">3D PARAMETRIC FIT MESH</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Live Tension Mapping across {meshes.length} Pattern Pieces
            </p>
          </div>
        </div>

        {/* Legend / Strain Indicators Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 p-2 rounded-xl text-[10px] flex items-center gap-3 backdrop-blur-sm">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-400">Optimal Ease</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-400">Moderate Fit</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-slate-400">High Strain</span>
          </div>
        </div>
      </div>

      {/* Mesh Strain Diagnostic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {meshes.map((m) => (
          <div key={m.id} className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex flex-col">
            <span className="text-[10px] text-slate-400 truncate">{m.name}</span>
            <span
              className={`text-xs font-bold mt-1 ${
                m.strainLevel > 0.7
                  ? 'text-rose-400'
                  : m.strainLevel > 0.4
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {m.strainLevel > 0.7 ? 'HIGH TENSION' : m.strainLevel > 0.4 ? 'BALANCED' : 'OPTIMAL'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
