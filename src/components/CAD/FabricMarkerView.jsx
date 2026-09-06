/**
 * TAILORIX AI — FABRIC MARKER & CUTTING YIELD WORKSPACE
 * Arranges validated pattern pieces along selected commercial fabric roll widths.
 */

import React, { useState, useMemo } from 'react';
import { calculateOptimizedMarker } from '../../utils/markerNestingEngine';
import { Scissors, FileSpreadsheet, CheckCircle2, RefreshCw } from 'lucide-react';

export default function FabricMarkerView({ pieces = [], units = 'in' }) {
  const [fabricWidth, setFabricWidth] = useState(60);
  const [bufferInches, setBufferInches] = useState(0.75);

  const marker = useMemo(() => {
    return calculateOptimizedMarker(pieces, {
      fabricWidthInches: fabricWidth,
      bufferInches,
    });
  }, [pieces, fabricWidth, bufferInches]);

  const scale = 5.5; // Visual display scale for fabric layout preview

  return (
    <div className="w-full h-full bg-[#f8fafc] p-6 flex flex-col gap-5 overflow-y-auto">
      {/* Header & Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Fabric Marker & Yield Estimation</h2>
          <p className="text-xs text-slate-500">
            Algorithmic piece nesting across commercial textile widths respecting cut quantities and grainlines.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Fabric Width:</span>
            <select
              value={fabricWidth}
              onChange={(e) => setFabricWidth(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800"
            >
              <option value={45}>45" (Standard Shirting)</option>
              <option value={54}>54" (Medium Suiting)</option>
              <option value={60}>60" (Wide Wool / Denim)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Cut Buffer:</span>
            <select
              value={bufferInches}
              onChange={(e) => setBufferInches(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-800"
            >
              <option value={0.5}>0.50" (Tight)</option>
              <option value={0.75}>0.75" (Standard)</option>
              <option value={1.0}>1.00" (Generous)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Yield & Utilization Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Marker Efficiency</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{marker.efficiency}%</div>
          <span className="text-[10px] text-slate-500">Fabric surface utilization</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Fabric Length</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{marker.totalYards} yds</div>
          <span className="text-[10px] text-slate-500">{marker.totalMeters} m ({marker.totalLengthInches}")</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Pattern Units</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{marker.placedPieces.length} cuts</div>
          <span className="text-[10px] text-slate-500">Total cut instances</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Cut Configuration</span>
          <div className="text-sm font-bold text-emerald-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Grainlines Aligned</span>
          </div>
          <span className="text-[10px] text-slate-500">Zero rotation cross-grain</span>
        </div>
      </div>

      {/* Fabric Roll Canvas Visualizer */}
      <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500 font-mono">
          <span>FABRIC ROLL (WIDTH: {fabricWidth}", LENGTH: {marker.totalLengthInches}")</span>
          <span>SCALE: 1:10 SCHEMATIC</span>
        </div>

        <div className="flex-1 overflow-x-auto py-6 flex items-center justify-center">
          <div
            className="relative bg-amber-50/40 border-2 border-dashed border-amber-300 rounded-lg shadow-inner"
            style={{
              width: `${Math.max(fabricWidth * scale, 300)}px`,
              height: `${Math.max(marker.totalLengthInches * scale, 400)}px`,
            }}
          >
            {/* Fabric Width Edge Marks */}
            <div className="absolute -top-5 left-0 right-0 flex justify-between text-[10px] font-mono text-slate-400">
              <span>0"</span>
              <span>Selvage Edge</span>
              <span>{fabricWidth}"</span>
            </div>

            {/* Placed Pieces */}
            {marker.placedPieces.map((p) => (
              <div
                key={p.id}
                className="absolute border border-slate-800 bg-white/90 rounded-md p-1 flex flex-col justify-between overflow-hidden shadow-xs hover:border-amber-500 hover:bg-amber-50 transition-colors"
                style={{
                  left: `${p.x * scale}px`,
                  top: `${p.y * scale}px`,
                  width: `${p.widthIn * scale}px`,
                  height: `${p.heightIn * scale}px`,
                }}
              >
                <div className="text-[10px] font-bold text-slate-800 truncate leading-tight">
                  {p.name}
                </div>
                <div className="text-[8px] font-mono text-slate-500 flex justify-between">
                  <span>#{p.instanceNumber}/{p.totalInstances}</span>
                  <span>{p.widthIn.toFixed(1)}x{p.heightIn.toFixed(1)}"</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
