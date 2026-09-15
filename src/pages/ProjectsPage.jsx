/**
 * TAILORIX AI — SAVED PROJECTS GALLERY
 * Access and manage user-saved parametric pattern drafts and CAD blueprints.
 * Styled in dark graphite with champagne accents.
 */

import React, { useState, useEffect } from 'react';
import { Folder, Trash2, ExternalLink, Plus, Layers, Scissors, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'cut_outs' | 'blueprints'

  useEffect(() => {
    const saved = localStorage.getItem('tailorix_saved_projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        setProjects([]);
      }
    }
  }, []);

  const deleteProject = (id) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem('tailorix_saved_projects', JSON.stringify(updated));
  };

  const filteredProjects = projects.filter((p) => {
    if (activeFilter === 'cut_outs') return p.isCutOut || p.category?.includes('Cut');
    if (activeFilter === 'blueprints') return !p.isCutOut && !p.category?.includes('Cut');
    return true;
  });

  const cutOutCount = projects.filter((p) => p.isCutOut || p.category?.includes('Cut')).length;
  const blueprintCount = projects.filter((p) => !p.isCutOut && !p.category?.includes('Cut')).length;

  return (
    <div className="min-h-[calc(100vh-52px)] bg-[#101112] text-[#F5F5F7] p-4 sm:p-8 font-sans select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222427] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#E5C07B]">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-[#F5F5F7]">
                Saved Projects Gallery
              </h1>
              <p className="text-xs text-[#8A8B93] mt-0.5">
                Review, manage, and re-export your saved pattern drafts and collective fabric cut-out bundles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href="/studio"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-gold-sm"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cutting Table</span>
            </a>
            <a
              href="/cad"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1A1B1E] hover:bg-[#222428] border border-[#2A2B2E] text-[#EDEDF0] hover:text-[#C5A059] rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Draft</span>
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-[#141517] p-1 rounded-xl border border-[#222427] w-fit text-xs font-semibold">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'all'
                ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items ({projects.length})
          </button>
          <button
            onClick={() => setActiveFilter('cut_outs')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'cut_outs'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-gold-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3 h-3" />
            <span>Cut-Out Bundles ({cutOutCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('blueprints')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeFilter === 'blueprints'
                ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pattern Blueprints ({blueprintCount})
          </button>
        </div>

        {/* Project List */}
        {filteredProjects.length === 0 ? (
          <div className="bg-[#141517] border border-[#222427] rounded-2xl p-12 text-center flex flex-col items-center shadow-panel">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1B1E] border border-[#28292D] flex items-center justify-center text-[#6A6C75] mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#F5F5F7]">No Saved Items Found</h3>
            <p className="text-xs text-[#8A8B93] mt-1 max-w-sm">
              Save pattern specifications directly from the Drafting Board or excise pieces with scissors on the Cutting Table to save them collectively here.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="/studio"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-gold-sm flex items-center gap-1.5"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Go to Cutting Table</span>
              </a>
              <a
                href="/cad"
                className="px-4 py-2 bg-[#1A1B1E] hover:bg-[#222428] border border-[#2A2B2E] text-[#EDEDF0] hover:text-[#C5A059] text-xs font-semibold rounded-xl transition-all"
              >
                Open Drafting Board
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => {
              const isCut = proj.isCutOut || proj.category?.includes('Cut');
              return (
                <div
                  key={proj.id}
                  className={`bg-[#141517] border p-5 rounded-2xl flex flex-col justify-between shadow-panel transition-all ${
                    isCut ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-[#222427] hover:border-[#383A40]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${
                          isCut
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 flex items-center gap-1'
                            : 'bg-[#C5A059]/10 text-[#E5C07B] border-[#C5A059]/20'
                        }`}
                      >
                        {isCut && <Scissors className="w-2.5 h-2.5" />}
                        <span>{proj.category || (isCut ? 'Cut Fabric' : 'Garment')}</span>
                      </span>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        className="text-[#6A6C75] hover:text-rose-400 p-1 rounded-lg hover:bg-[#1C1D20] transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-[#F5F5F7] mb-1">
                      {proj.title || proj.name || 'Untitled Project'}
                    </h3>
                    <p className="text-[11px] text-[#8A8B93] mb-3 font-mono">
                      Saved: {proj.timestamp ? new Date(proj.timestamp).toLocaleDateString() : proj.date || 'Recent'}
                    </p>

                    {/* Detailed information for Cut Fabric Bundles */}
                    {isCut && proj.pieces && Array.isArray(proj.pieces) && (
                      <div className="mb-4 bg-[#101112] p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Fabric Base:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[130px]">{proj.fabricName || 'Selvedge Denim'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Total Cut Parts:</span>
                          <span className="text-amber-400 font-bold">{proj.piecesCount || proj.pieces.length} pieces</span>
                        </div>
                        <div className="pt-1 border-t border-slate-800/80 flex flex-wrap gap-1">
                          {proj.pieces.map((pc, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] bg-slate-800/80 text-amber-300/90 px-1.5 py-0.5 rounded border border-slate-700/60"
                            >
                              {pc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isCut ? (
                    <a
                      href="/studio"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-gold-sm"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Open on Cutting Table</span>
                    </a>
                  ) : (
                    <a
                      href={`/deconstruct?project=${proj.id}`}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-[#18191C] hover:bg-[#202226] text-[#EDEDF0] hover:text-[#C5A059] rounded-xl text-xs font-semibold transition-all border border-[#26272B]"
                    >
                      <span>Open in Workbench</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

