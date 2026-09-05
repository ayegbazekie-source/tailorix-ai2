import React, { useState } from 'react';
import { BookOpen, User, Scissors, Download, Eye } from 'lucide-react';
import { CROQUI_TEMPLATES, SLOPER_BLOCK_TEMPLATES } from '../templates/presetLibrary';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('slopers');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
              <BookOpen className="w-6 h-6 text-amber-400" />
              TEMPLATE & CROQUI LIBRARY
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Standard tailoring slopers, master blocks, and proportional croquis for CAD drafting.
            </p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('slopers')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'slopers' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Master Slopers
            </button>
            <button
              onClick={() => setActiveTab('croquis')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'croquis' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Digital Croquis
            </button>
          </div>
        </div>

        {/* Sloper Blocks View */}
        {activeTab === 'slopers' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SLOPER_BLOCK_TEMPLATES.map((block) => (
              <div key={block.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-amber-500/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-amber-400 font-bold uppercase">{block.category}</span>
                    <Scissors className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{block.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">{block.description}</p>
                  
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] space-y-1 text-slate-300">
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
                  className="mt-5 w-full py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold text-center block hover:bg-amber-400 transition-all"
                >
                  Load in Workbench
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Croquis View */}
        {activeTab === 'croquis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CROQUI_TEMPLATES.map((croqui) => (
              <div key={croqui.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div className="space-y-2">
                  <span className="text-xs text-amber-400 font-bold uppercase">{croqui.gender} Silhouette</span>
                  <h3 className="text-base font-bold text-white">{croqui.name}</h3>
                  <a 
                    href="/deconstruct"
                    className="inline-block px-4 py-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                  >
                    Use as Guide
                  </a>
                </div>
                <div className="w-20 h-32 bg-slate-950 rounded-xl border border-slate-800 p-2 flex items-center justify-center">
                  <User className="w-10 h-10 text-amber-400/60" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
