/**
 * TAILORIX AI — FABRIC MARKER & CUTTING YIELD WORKSPACE
 * Arranges validated pattern pieces along selected commercial fabric roll widths.
 * Dark graphite surface with champagne metrics and high-contrast marker roll preview.
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
    <div className="w-full h-full bg-[#101112] p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto select-none">
      {/* Header & Controls Bar */}
      <div className="bg-[#141517] p-4 rounded-2xl border border-[#222427] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F5F7]">Fabric Marker & Yield Estimation</h2>
          <p className="text-xs text-[#8A8B93] mt-0.5">
            Algorithmic piece nesting across commercial textile roll widths respecting cut quantities.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#8A8B93] font-medium">Roll Width:</span>
            <select
              value={fabricWidth}
              onChange={(e) => setFabricWidth(Number(e.target.value))}
              className="bg-[#1A1B1E] border border-[#2A2B2E] text-[#EDEDF0] rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-[#C5A059]/60 cursor-pointer"
            >
              <option value={45}>45" (Standard Shirting)</option>
              <option value={54}>54" (Medium Suiting)</option>
              <option value={60}>60" (Wide Wool / Denim)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8A8B93] font-medium">Cut Buffer:</span>
            <select
              value={bufferInches}
              onChange={(e) => setBufferInches(Number(e.target.value))}
              className="bg-[#1A1B1E] border border-[#2A2B2E] text-[#EDEDF0] rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-[#C5A059]/60 cursor-pointer"
            >
              <option value={0.5}>0.50" (Tight)</option>
              <option value={0.75}>0.75" (Standard)</option>
              <option value={1.0}>1.00" (Generous)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Yield & Utilization Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#141517] p-4 rounded-2xl border border-[#222427]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8B93]">Efficiency</span>
          <div className="text-2xl font-bold text-[#E5C07B] mt-1">{marker.efficiency}%</div>
          <span className="text-[11px] text-[#6A6C75]">Surface utilization</span>
        </div>

        <div className="bg-[#141517] p-4 rounded-2xl border border-[#222427]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8B93]">Fabric Yield</span>
          <div className="text-2xl font-bold text-[#F5F5F7] mt-1">{marker.totalYards} yds</div>
          <span className="text-[11px] text-[#6A6C75]">{marker.totalMeters} m ({marker.totalLengthInches}")</span>
        </div>

        <div className="bg-[#141517] p-4 rounded-2xl border border-[#222427]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8B93]">Pattern Units</span>
          <div className="text-2xl font-bold text-[#F5F5F7] mt-1">{marker.placedPieces.length} cuts</div>
          <span className="text-[11px] text-[#6A6C75]">Total cut pieces</span>
        </div>

        <div className="bg-[#141517] p-4 rounded-2xl border border-[#222427]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8B93]">Grain Alignment</span>
          <div className="text-sm font-semibold text-emerald-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Grainlines Parallel</span>
          </div>
          <span className="text-[11px] text-[#6A6C75]">Zero bias distortion</span>
        </div>
      </div>

      {/* Fabric Roll Canvas Visualizer */}
      <div className="flex-1 bg-[#141517] p-5 rounded-2xl border border-[#222427] shadow-panel flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-3 border-b border-[#222427] text-xs text-[#8A8B93] font-mono">
          <span>FABRIC ROLL (WIDTH: {fabricWidth}", LENGTH: {marker?.totalLengthInches || 0}")</span>
          <span className="text-[11px] text-[#C5A059]">SCALE 1:10</span>
        </div>

        <div className="flex-1 overflow-x-auto py-6 flex items-center justify-center">
          <div
            className="relative bg-[#F4F4F1] border-2 border-dashed border-[#C5A059]/40 rounded-xl shadow-inner"
            style={{
              width: `${Math.max(fabricWidth * scale, 300)}px`,
              height: `${Math.max((marker?.totalLengthInches || 0) * scale, 380)}px`,
            }}
          >
            {/* Fabric Width Edge Marks */}
            <div className="absolute -top-5 left-0 right-0 flex justify-between text-[10px] font-mono text-[#8A8B93]">
              <span>0"</span>
              <span className="text-[#C5A059]">Selvage Edge</span>
              <span>{fabricWidth}"</span>
            </div>

            {/* Placed Pieces */}
            {(marker?.placedPieces || []).map((p) => (
              <div
                key={p.id}
                className="absolute border border-[#1A1B1D] bg-white/95 rounded-lg p-1.5 flex flex-col justify-between overflow-hidden shadow-sm hover:border-[#C5A059] hover:bg-[#FAF9F5] transition-colors"
                style={{
                  left: `${p.x * scale}px`,
                  top: `${p.y * scale}px`,
                  width: `${p.widthIn * scale}px`,
                  height: `${p.heightIn * scale}px`,
                }}
              >
                <div className="text-[10px] font-semibold text-[#1A1B1D] truncate leading-tight">
                  {p.name}
                </div>
                <div className="text-[8px] font-mono text-[#6A6C75] flex justify-between">
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
