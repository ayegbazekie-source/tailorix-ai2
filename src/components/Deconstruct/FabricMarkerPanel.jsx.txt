import React, { useState, useMemo } from 'react';
import { Maximize, Scissors, Percent, Ruler } from 'lucide-react';
import { calculateFabricMarker } from '../../utils/markerEngine';

export default function FabricMarkerPanel({ pieces = [] }) {
  const [fabricWidth, setFabricWidth] = useState(60); // Default 60 inch fabric bolt

  const marker = useMemo(() => {
    return calculateFabricMarker(pieces, fabricWidth);
  }, [pieces, fabricWidth]);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 font-mono text-slate-100">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Fabric Yield & Marker Layout
          </h3>
        </div>
        
        {/* Fabric Width Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Bolt Width:</span>
          <select 
            value={fabricWidth} 
            onChange={(e) => setFabricWidth(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-amber-400 outline-none"
          >
            <option value={45}>45 in (114 cm)</option>
            <option value={60}>60 in (152 cm)</option>
            <option value={72}>72 in (183 cm)</option>
          </select>
        </div>
      </div>

      {/* Yield Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Ruler className="w-3 h-3 text-amber-400" /> REQ. YARDAGE
          </span>
          <span className="text-sm font-bold text-white mt-0.5">
            {marker.requiredYards} yds <span className="text-[10px] font-normal text-slate-400">({marker.requiredMeters}m)</span>
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Percent className="w-3 h-3 text-emerald-400" /> EFFICIENCY
          </span>
          <span className="text-sm font-bold text-emerald-400 mt-0.5">
            {marker.efficiency}%
          </span>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Maximize className="w-3 h-3 text-sky-400" /> TOTAL LENGTH
          </span>
          <span className="text-sm font-bold text-white mt-0.5">
            {marker.totalFabricLengthInches.toFixed(1)}"
          </span>
        </div>
      </div>

      {/* Visual Marker Grid preview */}
      <div className="relative w-full h-40 bg-[#080c14] rounded-xl border border-slate-800 p-2 overflow-x-auto flex items-center">
        <div className="h-full border-r-2 border-dashed border-amber-500/40 relative flex items-center px-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest select-none">
          FABRIC FEED DIRECTION &rarr;
        </div>
      </div>
    </div>
  );
}
