import React, { useState } from 'react';
import { BookOpen, User, Scissors, Download, Eye } from 'lucide-react';
import { CROQUI_TEMPLATES, SLOPER_BLOCK_TEMPLATES } from '../templates/presetLibrary';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('slopers');

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f8fafc] text-slate-900 p-6 sm:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-slate-900">
              <BookOpen className="w-6 h-6 text-amber-500" />
              Template & Croqui Library
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Standard tailoring slopers, master blocks, and proportional croquis for CAD drafting.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('slopers')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'slopers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Master Slopers
            </button>
            <button
              onClick={() => setActiveTab('croquis')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'croquis' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Digital Croquis
            </button>
          </div>
        </div>

        {/* Sloper Blocks View */}
        {activeTab === 'slopers' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SLOPER_BLOCK_TEMPLATES.map((block) => (
              <div key={block.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-amber-400/80 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">{block.category}</span>
                    <Scissors className="w-4 h-4 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{block.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{block.description}</p>
                  
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1 text-slate-700 font-mono">
                    {Object.entries(block.measurements).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="capitalize text-slate-500">{k}:</span>
                        <span className="font-bold">{v}"</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a 
                  href="/deconstruct"
                  className="mt-5 w-full py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold text-center block hover:bg-amber-400 transition-all shadow-xs"
                >
                  Load in CAD Workbench
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Croquis View */}
        {activeTab === 'croquis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CROQUI_TEMPLATES.map((croqui) => (
              <div key={croqui.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="space-y-2">
                  <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">{croqui.gender} Silhouette</span>
                  <h3 className="text-base font-bold text-slate-900">{croqui.name}</h3>
                  <a 
                    href="/deconstruct"
                    className="inline-block px-4 py-2 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
                  >
                    Use in Workbench
                  </a>
                </div>
                <div className="w-20 h-32 bg-slate-50 rounded-xl border border-slate-100 p-2 flex items-center justify-center">
                  <User className="w-10 h-10 text-amber-500/70" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
