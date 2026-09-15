/**
 * TAILORIX AI — TEMPLATES & CROQUIS LIBRARY
 * Bespoke tailoring slopers, master blocks, and anatomical croquis.
 * Styled in dark graphite with champagne accents.
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, User, Scissors, ArrowRight, Layers, Trash2, ExternalLink } from 'lucide-react';
import { CROQUI_TEMPLATES, SLOPER_BLOCK_TEMPLATES } from '../templates/presetLibrary';

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('slopers');
  const [savedOutlines, setSavedOutlines] = useState([]);
  const [savedCutFabrics, setSavedCutFabrics] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tailorix_ready_made_outlines');
      if (stored) {
        setSavedOutlines(JSON.parse(stored));
      }
      const storedFabrics = localStorage.getItem('tailorix_ready_made_cut_fabrics');
      if (storedFabrics) {
        setSavedCutFabrics(JSON.parse(storedFabrics));
      }
    } catch (e) {
      console.warn('Failed to load saved outlines', e);
    }
  }, []);

  const handleDeleteSavedOutline = (id) => {
    const updated = savedOutlines.filter((o) => o.id !== id);
    setSavedOutlines(updated);
    try {
      localStorage.setItem('tailorix_ready_made_outlines', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleDeleteCutFabric = (id) => {
    const updated = savedCutFabrics.filter((f) => f.id !== id);
    setSavedCutFabrics(updated);
    try {
      localStorage.setItem('tailorix_ready_made_cut_fabrics', JSON.stringify(updated));
    } catch (e) {}
  };

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
                Standard tailoring outlines, block patterns, and custom cut-out sheets for drafting and the cutting table.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap bg-[#141517] p-1 rounded-xl border border-[#26272A] text-xs font-semibold self-start sm:self-auto gap-1">
            <button
              onClick={() => setActiveTab('slopers')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'slopers'
                  ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                  : 'text-[#8A8B93] hover:text-[#EDEDF0]'
              }`}
            >
              Ready-Made Outlines ({SLOPER_BLOCK_TEMPLATES.length})
            </button>
            <button
              onClick={() => setActiveTab('cut_fabrics')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'cut_fabrics'
                  ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                  : 'text-[#8A8B93] hover:text-[#EDEDF0]'
              }`}
            >
              Cut-Out Fabrics ({savedCutFabrics.length})
            </button>
            <button
              onClick={() => setActiveTab('saved_outlines')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'saved_outlines'
                  ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                  : 'text-[#8A8B93] hover:text-[#EDEDF0]'
              }`}
            >
              Saved Sheet Outlines ({savedOutlines.length})
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

                <div className="mt-5 pt-3 border-t border-[#222427] space-y-2">
                  <a
                    href={`/studio?template=${block.id}`}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs text-center block transition-all shadow-gold-sm flex items-center justify-center gap-1.5"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Load onto Cutting Table</span>
                  </a>
                  <a
                    href={`/cad?template=${block.id}`}
                    className="w-full py-2 bg-[#18191C] hover:bg-[#202226] text-[#EDEDF0] hover:text-[#C5A059] rounded-xl text-xs font-semibold text-center block transition-all border border-[#26272B] flex items-center justify-center gap-1.5"
                  >
                    <span>Load into Drafting Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Saved Cut Fabrics Section (Per User Requirement) */}
        {activeTab === 'cut_fabrics' && (
          <div>
            {savedCutFabrics.length === 0 ? (
              <div className="bg-[#141517] border border-[#222427] rounded-2xl p-12 text-center flex flex-col items-center shadow-panel">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1B1E] border border-[#28292D] flex items-center justify-center text-[#6A6C75] mb-3">
                  <Scissors className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-[#F5F5F7]">No Saved Cut-Out Fabrics Yet</h3>
                <p className="text-xs text-[#8A8B93] mt-1 max-w-sm">
                  Excised fabric pieces are specifically preserved here in Ready-Made Outlines rather than the Project Gallery. Cut a bodice part on the Cutting Table to save it here!
                </p>
                <a
                  href="/cad"
                  className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-gold-sm flex items-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Open Atelier Cutting Table</span>
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {savedCutFabrics.map((fabric) => (
                  <div
                    key={fabric.id}
                    className="bg-[#141517] border border-[#222427] p-5 rounded-2xl flex flex-col justify-between shadow-panel hover:border-amber-500/50 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold uppercase">
                          {fabric.fabricName || 'Excised Cut Fabric'}
                        </span>
                        <button
                          onClick={() => handleDeleteCutFabric(fabric.id)}
                          className="text-[#6A6C75] hover:text-rose-400 p-1 rounded-lg transition-colors"
                          title="Delete Cut Fabric"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-sm font-semibold text-[#F5F5F7] mb-1">
                        {fabric.title || fabric.name}
                      </h3>
                      <p className="text-xs text-[#8A8B93] mb-3">
                        Excised clean piece from {fabric.fabricName || 'Cutting Table Fabric'}
                      </p>

                      <div className="bg-[#101112] p-2.5 rounded-xl border border-[#222427] text-[11px] font-mono space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">View:</span>
                          <span className="text-amber-400 font-bold">{fabric.isUnfolded ? 'Unfolded Bilateral' : 'Single / Half'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dimensions:</span>
                          <span>{fabric.widthInches || 18}" × {fabric.heightInches || 24}"</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Saved Date:</span>
                          <span className="text-slate-400">{fabric.date || 'Recent'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#222427] space-y-2">
                      <a
                        href={`/cad`}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs text-center block transition-all shadow-gold-sm flex items-center justify-center gap-1.5"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Place Back on Cutting Table</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Saved Cut-Outs & Bodice Outlines */}
        {activeTab === 'saved_outlines' && (
          <div>
            {savedOutlines.length === 0 ? (
              <div className="bg-[#141517] border border-[#222427] rounded-2xl p-12 text-center flex flex-col items-center shadow-panel">
                <div className="w-12 h-12 rounded-2xl bg-[#1A1B1E] border border-[#28292D] flex items-center justify-center text-[#6A6C75] mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#F5F5F7]">No Saved Bodice Outlines Yet</h3>
                <p className="text-xs text-[#8A8B93] mt-1 max-w-sm">
                  Save drafted bodice outlines and cut-out sheets from the Cutting Table or Drafting Board to review, re-cut, or re-draft them here.
                </p>
                <a
                  href="/studio"
                  className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-gold-sm flex items-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Open Atelier Cutting Table</span>
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {savedOutlines.map((outline) => (
                  <div
                    key={outline.id}
                    className="bg-[#141517] border border-[#222427] p-5 rounded-2xl flex flex-col justify-between shadow-panel hover:border-[#383A40] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] bg-[#C5A059]/15 text-[#E5C07B] border border-[#C5A059]/30 px-2 py-0.5 rounded-md font-bold uppercase">
                          {outline.category || 'Bodice Outline'}
                        </span>
                        <button
                          onClick={() => handleDeleteSavedOutline(outline.id)}
                          className="text-[#6A6C75] hover:text-rose-400 p-1 rounded-lg transition-colors"
                          title="Delete Saved Outline"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-sm font-semibold text-[#F5F5F7] mb-1">
                        {outline.name}
                      </h3>
                      <p className="text-xs text-[#8A8B93] mb-3">
                        {outline.description || 'Custom drafted garment contour'}
                      </p>

                      <div className="bg-[#101112] p-2.5 rounded-xl border border-[#222427] text-[11px] font-mono space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Contours:</span>
                          <span className="text-amber-400 font-bold">{outline.contourColor || '#38bdf8'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Dimensions:</span>
                          <span>{outline.width || 18}" × {outline.height || 24}"</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#222427] space-y-2">
                      <a
                        href={`/studio?outline=${outline.id}`}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs text-center block transition-all shadow-gold-sm flex items-center justify-center gap-1.5"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Load on Cutting Table</span>
                      </a>
                      <a
                        href={`/cad?outline=${outline.id}`}
                        className="w-full py-2 bg-[#18191C] hover:bg-[#202226] text-[#EDEDF0] hover:text-[#C5A059] rounded-xl text-xs font-semibold text-center block transition-all border border-[#26272B] flex items-center justify-center gap-1.5"
                      >
                        <span>Load on Drafting Board</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                    href="/cad"
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

