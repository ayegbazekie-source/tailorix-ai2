import React, { useState } from 'react';
import { BookOpen, UserCheck, Scissors, Check } from 'lucide-react';
import { CROQUI_TEMPLATES, SLOPER_BLOCK_TEMPLATES } from '../../templates/presetLibrary';

export default function TemplateLibraryDrawer({ onSelectCroqui, onApplySloper, activeCroquiId }) {
  const [tab, setTab] = useState('slopers'); // 'slopers' | 'croquis'

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 font-mono text-slate-100 flex flex-col gap-3">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Template & Croqui Presets
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => setTab('slopers')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              tab === 'slopers' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Master Slopers
          </button>
          <button
            onClick={() => setTab('croquis')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              tab === 'croquis' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Digital Croquis
          </button>
        </div>
      </div>

      {/* Sloper Blocks List */}
      {tab === 'slopers' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SLOPER_BLOCK_TEMPLATES.map((sloper) => (
            <div
              key={sloper.id}
              onClick={() => onApplySloper(sloper)}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-amber-400 uppercase font-bold">{sloper.category}</span>
                  <Scissors className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-white leading-snug">
                  {sloper.name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sloper.description}
                </p>
              </div>
              <button className="mt-3 w-full py-1 bg-slate-900 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 rounded-lg text-[10px] font-bold transition-all border border-slate-800 group-hover:border-amber-400">
                Load Sloper Spec
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Croquis List */}
      {tab === 'croquis' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CROQUI_TEMPLATES.map((croqui) => {
            const isSelected = activeCroquiId === croqui.id;
            return (
              <div
                key={croqui.id}
                onClick={() => onSelectCroqui(croqui)}
                className={`bg-slate-950 border p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/5'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <UserCheck className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{croqui.name}</h4>
                    <span className="text-[10px] text-slate-500 uppercase">{croqui.gender} Silhouette</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="p-1 bg-amber-500 text-slate-950 rounded-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
