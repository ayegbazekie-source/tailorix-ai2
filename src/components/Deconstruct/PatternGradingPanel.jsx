import React from 'react';
import { Layers, Sliders, CheckSquare, Square } from 'lucide-react';
import { SIZE_COLORS } from '../../utils/patternEngine/gradingEngine';

export default function PatternGradingPanel({ activeSizes, setActiveSizes }) {
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const toggleSize = (size) => {
    if (activeSizes.includes(size)) {
      if (activeSizes.length > 1) {
        setActiveSizes(activeSizes.filter((s) => s !== size));
      }
    } else {
      setActiveSizes([...activeSizes, size]);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 font-mono text-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Multi-Size Grading Matrix
          </h3>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
          NESTED OVERLAY
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {availableSizes.map((size) => {
          const isSelected = activeSizes.includes(size);
          const color = SIZE_COLORS[size];

          return (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                isSelected
                  ? 'bg-slate-950 border-slate-700 text-white shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>SIZE {size}</span>
              {isSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-amber-400 ml-1" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-600 ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
