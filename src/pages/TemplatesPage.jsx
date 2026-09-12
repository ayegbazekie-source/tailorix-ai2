/**
 * TAILORIX AI — TEMPLATES & CROQUIS LIBRARY
 * Bespoke tailoring slopers, master blocks, and anatomical croquis.
 * Styled in dark graphite with champagne accents.
 */

import React, { useState } from 'react';
import { BookOpen, User, Scissors, ArrowRight } from 'lucide-react';
import { CROQUI_TEMPLATES, SLOPER_BLOCK_TEMPLATES } from '../templates/presetLibrary';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('slopers');

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#101112] text-[#F5F5F7] p-4 sm:p-8 font-sans select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222427] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E5C07B]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-[#F5F5F7]">
                Ready-Made Outlines & Templates
              </h1>
              <p className="text-xs text-[#8A8B93] mt-0.5">
                Standard tailoring outlines, block patterns, and digital croquis for fashion drafting.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-[#141517] p-1 rounded-xl border border-[#26272A] text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('slopers')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'slopers'
                  ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                  : 'text-[#8A8B93] hover:text-[#EDEDF0]'
              }`}
            >
              Ready-Made Outlines
            </button>
            <button
              onClick={() => setActiveTab('croquis')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'croquis'
                  ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                  : 'text-[#8A8B93] hover:text-[#EDEDF0]'
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
              <div
                key={block.id}
                className="bg-[#141517] border border-[#222427] p-5 rounded-2xl flex flex-col justify-between shadow-panel hover:border-[#383A40] transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md border border-[#C5A059]/20">
                      {block.category}
                    </span>
                    <Scissors className="w-4 h-4 text-[#6A6C75] group-hover:text-[#C5A059] transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#F5F5F7] mb-1">{block.name}</h3>
                  <p className="text-xs text-[#8A8B93] mb-4 leading-relaxed">{block.description}</p>

                  <div className="bg-[#101112] p-3 rounded-xl border border-[#222427] text-[11px] space-y-1.5 text-[#EDEDF0] font-mono">
                    {Object.entries(block.measurements).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="capitalize text-[#8A8B93]">{k}:</span>
                        <span className="font-medium text-[#C5A059]">{v}"</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href={`/deconstruct?template=${block.id}`}
                  className="mt-5 w-full py-2.5 bg-[#C5A059] hover:bg-[#D4AF37] text-[#101112] rounded-xl text-xs font-semibold text-center block transition-all shadow-gold-sm flex items-center justify-center gap-1.5"
                >
                  <span>Load into Drafting Board</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Croquis View */}
        {activeTab === 'croquis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CROQUI_TEMPLATES.map((croqui) => (
              <div
                key={croqui.id}
                className="bg-[#141517] border border-[#222427] p-5 rounded-2xl flex items-center justify-between shadow-panel hover:border-[#383A40] transition-all"
              >
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md border border-[#C5A059]/20">
                    {croqui.gender} Silhouette
                  </span>
                  <h3 className="text-sm font-semibold text-[#F5F5F7]">{croqui.name}</h3>
                  <a
                    href="/deconstruct"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#18191C] hover:bg-[#222428] text-[#EDEDF0] hover:text-[#C5A059] rounded-xl text-xs font-semibold transition-all border border-[#282A2E]"
                  >
                    <span>Use in Drafting Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="w-24 h-36 bg-[#101112] rounded-xl border border-[#222427] p-3 flex items-center justify-center">
                  <User className="w-12 h-12 text-[#C5A059]/40" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
