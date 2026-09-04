import React from 'react';
import { Check, Layers, Tag } from 'lucide-react';

export default function PatternPieceList({ pieces = [], selectedPanels = [], togglePanel }) {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 font-mono">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4" /> Pattern Pieces ({pieces.length})
        </span>
        <span className="text-[10px] text-slate-400">SELECT TO VIEW</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {pieces.map((piece, idx) => {
          const isSelected = selectedPanels.includes(idx);
          return (
            <div
              key={piece.id || idx}
              onClick={() => togglePanel(idx)}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500/50 text-slate-100 shadow-md shadow-amber-500/5'
                  : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[11px] text-slate-200">{piece.name}</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-400/70" /> {piece.cutQuantity}
                </span>
              </div>
              
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-amber-500 border-amber-400 text-slate-950'
                    : 'border-slate-700 bg-slate-900'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
