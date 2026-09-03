import React from 'react';
import { Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PanelBreakdownCard({ result }) {
  const navigate = useNavigate();

  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* Pattern Panels List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Required Pattern Panels ({result.panels?.length || 0})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.panels?.map((panel, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-200 text-sm">{panel.name}</span>
                <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Cut x{panel.quantity || 1}
                </span>
              </div>
              <p className="text-slate-400 text-xs">Grainline: {panel.grainline || 'Straight'}</p>
              {panel.cut_on_fold && (
                <span className="text-[10px] text-emerald-400 font-medium">Cut on Fold</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Seam & Construction Logic */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-amber-400 mb-3">Seams & Finishes</h3>
        <ul className="space-y-2 text-xs text-slate-300">
          {result.seams?.map((seam, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>{seam}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Port to Studio Canvas CTA */}
      <button
        onClick={() => navigate('/studio')}
        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-2"
      >
        <span>Open in Studio Canvas to Draft</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
