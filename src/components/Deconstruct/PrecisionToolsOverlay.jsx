import React, { useState } from 'react';
import { Ruler, Scissors, Target, RefreshCw } from 'lucide-react';
import { calculateTapeDistance } from '../../utils/patternEngine/precisionTools';

export default function PrecisionToolsOverlay({ tapePoints, setTapePoints, notchType, setNotchType }) {
  const measurement = tapePoints.length === 2 
    ? calculateTapeDistance(tapePoints[0], tapePoints[1])
    : null;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 font-mono text-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Tape Measure Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase">
          <Ruler className="w-4 h-4" />
          <span>Tape Measure</span>
        </div>

        {measurement ? (
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-emerald-400 font-bold">{measurement.inches}" ({measurement.cm} cm)</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">ΔX: {measurement.deltaX}" ΔY: {measurement.deltaY}"</span>
            <button 
              onClick={() => setTapePoints([])}
              className="ml-1 text-slate-500 hover:text-rose-400"
              title="Clear Tape Measurement"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">
            {tapePoints.length === 1 ? 'Click second point on canvas...' : 'Click two points to measure'}
          </span>
        )}
      </div>

      {/* Notch Marker Type Switcher */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Scissors className="w-3.5 h-3.5 text-amber-400" /> Notch Type:
        </span>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => setNotchType('v_notch')}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
              notchType === 'v_notch' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            V-Notch
          </button>
          <button
            onClick={() => setNotchType('t_notch')}
            className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
              notchType === 't_notch' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            T-Slit
          </button>
        </div>
      </div>
    </div>
  );
}
