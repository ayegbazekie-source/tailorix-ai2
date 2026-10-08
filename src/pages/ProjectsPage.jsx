/**
 * TAILORIX AI — SAVED PROJECTS GALLERY
 * Access and manage user-saved parametric pattern drafts, Deconstruct blueprints, and CAD cutouts.
 * Styled in dark graphite with champagne accents.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Trash2,
  ExternalLink,
  Plus,
  Layers,
  Scissors,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Edit3,
  Camera,
  Eye,
} from 'lucide-react';
import { ACTIVE_DECONSTRUCT_KEY } from '../models/deconstructProject';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'deconstruct' | 'cut_outs' | 'blueprints'

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

  const isDeconstruct = (p) =>
    Boolean(p.isDeconstructProject || p.category === 'Deconstruct Pattern' || p.patternBlueprint);

  const filteredProjects = projects.filter((p) => {
    if (activeFilter === 'deconstruct') return isDeconstruct(p);
    if (activeFilter === 'cut_outs') return (p.isCutOut || p.category?.includes('Cut')) && !isDeconstruct(p);
    if (activeFilter === 'blueprints') return !p.isCutOut && !p.category?.includes('Cut') && !isDeconstruct(p);
    return true;
  });

  const deconstructCount = projects.filter(isDeconstruct).length;
  const cutOutCount = projects.filter((p) => (p.isCutOut || p.category?.includes('Cut')) && !isDeconstruct(p)).length;
  const blueprintCount = projects.filter((p) => !p.isCutOut && !p.category?.includes('Cut') && !isDeconstruct(p)).length;

  const handleOpenInDraftingBoard = (proj) => {
    try {
      localStorage.setItem(ACTIVE_DECONSTRUCT_KEY, JSON.stringify(proj));
    } catch (e) {}
    navigate('/cad', { state: { deconstructProject: proj } });
  };

  const handleOpenOnCuttingTable = (proj) => {
    const pieces = proj.patternPieces || proj.patternBlueprint?.pieces || proj.pieces || [];
    const payload = {
      source: 'deconstruct',
      garmentType: proj.garmentTaxonomy?.garmentType || proj.garmentCategory || proj.category || 'trouser',
      fabricCanvasUrl: proj.fabricName || 'selvedge_denim',
      patternPieces: pieces.map((p, idx) => ({
        id: p.id || `piece_${idx + 1}`,
        name: p.name,
        svgPath: p.outline || p.svgPath || p.path,
        path: p.outline || p.svgPath || p.path,
        cutQuantity: p.cutQuantity || 2,
        cutQuantityLabel: p.cutQuantityLabel,
        grainline: p.grainline,
        bounds: p.bounds,
        onFold: p.onFold,
      })),
    };
    try {
      localStorage.setItem('tailorix_studio_payload', JSON.stringify(payload));
    } catch (e) {}
    navigate('/studio', { state: { importedPayload: payload } });
  };

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
                Review, manage, and import saved Deconstruct pattern blueprints, CAD slopers, and cut-out bundles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => navigate('/deconstruct')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#C5A059] hover:bg-[#D4AF37] text-slate-950 rounded-xl text-xs font-bold transition-all shadow-gold-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Deconstruct</span>
            </button>
            <a
              href="/cad"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#1A1B1E] hover:bg-[#222428] border border-[#2A2B2E] text-[#EDEDF0] hover:text-[#C5A059] rounded-xl text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Blank CAD Draft</span>
            </a>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-[#141517] p-1 rounded-xl border border-[#222427] w-fit text-xs font-semibold">
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
            onClick={() => setActiveFilter('deconstruct')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'deconstruct'
                ? 'bg-[#C5A059]/20 border border-[#C5A059]/50 text-[#E5C07B] shadow-gold-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            <span>Deconstruct Blueprints ({deconstructCount})</span>
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
            Standard Slopers ({blueprintCount})
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
              Save pattern specifications directly from Deconstruct, Drafting Board, or Cutting Table to manage them here.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => navigate('/deconstruct')}
                className="px-4 py-2 bg-[#C5A059] hover:bg-[#D4AF37] text-slate-950 text-xs font-bold rounded-xl transition-all shadow-gold-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deconstruct a Garment Photo</span>
              </button>
              <a
                href="/cad"
                className="px-4 py-2 bg-[#1A1B1E] hover:bg-[#222428] border border-[#2A2B2E] text-[#EDEDF0] hover:text-[#C5A059] text-xs font-semibold rounded-xl transition-all"
              >
                Open Drafting Board
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((proj) => {
              const isDecon = isDeconstruct(proj);
              const isCut = proj.isCutOut || proj.category?.includes('Cut');
              const pieces = proj.patternPieces || proj.patternBlueprint?.pieces || proj.pieces || [];
              const thumbImg = proj.sourceImages?.[0]?.data || null;

              return (
                <div
                  key={proj.id}
                  className={`bg-[#141517] border p-5 rounded-2xl flex flex-col justify-between shadow-panel transition-all ${
                    isDecon
                      ? 'border-[#C5A059]/40 hover:border-[#C5A059]/80 shadow-[0_0_15px_rgba(197,160,89,0.08)]'
                      : isCut
                      ? 'border-amber-500/30 hover:border-amber-500/50'
                      : 'border-[#222427] hover:border-[#383A40]'
                  }`}
                >
                  <div>
                    {/* Top badges */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${
                          isDecon
                            ? 'bg-[#C5A059]/15 text-[#E5C07B] border-[#C5A059]/30 flex items-center gap-1'
                            : isCut
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 flex items-center gap-1'
                            : 'bg-[#C5A059]/10 text-[#E5C07B] border-[#C5A059]/20'
                        }`}
                      >
                        {isDecon && <Sparkles className="w-2.5 h-2.5 text-[#C5A059]" />}
                        {isCut && <Scissors className="w-2.5 h-2.5" />}
                        <span>{isDecon ? 'Deconstruct Pattern' : (proj.category || 'Garment')}</span>
                      </span>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        className="text-[#6A6C75] hover:text-rose-400 p-1 rounded-lg hover:bg-[#1C1D20] transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-sm font-semibold text-[#F5F5F7] mb-1 truncate">
                      {proj.title || proj.name || 'Untitled Project'}
                    </h3>
                    <p className="text-[11px] text-[#8A8B93] mb-3 font-mono">
                      Saved: {proj.timestamp ? new Date(proj.timestamp).toLocaleDateString() : proj.date || 'Recent'}
                    </p>

                    {/* Rich Metadata for Deconstruct Projects */}
                    {isDecon && (
                      <div className="mb-4 bg-[#101112] p-3 rounded-xl border border-[#222427] text-[11px] space-y-2">
                        {thumbImg && (
                          <div className="w-full h-24 bg-[#0C0D0E] rounded-lg overflow-hidden flex items-center justify-center border border-[#1E2024] mb-2">
                            <img src={thumbImg} alt="Source" className="h-full w-auto object-contain" />
                          </div>
                        )}
                        <div className="flex items-center justify-between text-zinc-400">
                          <span>Garment Taxonomy:</span>
                          <span className="text-[#EDEDF0] font-semibold capitalize">
                            {proj.garmentTaxonomy?.silhouette || ''} {proj.garmentTaxonomy?.garmentType || proj.garmentCategory || 'Trouser'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-400">
                          <span>Blueprint Panels:</span>
                          <span className="text-emerald-400 font-bold">{pieces.length} Distinct Pieces</span>
                        </div>
                        {proj.confidence && (
                          <div className="flex items-center justify-between text-zinc-400">
                            <span>Perception Confidence:</span>
                            <span className="text-[#C5A059] font-mono font-bold">{Math.round(proj.confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Information for Cut Fabric Bundles */}
                    {isCut && pieces.length > 0 && (
                      <div className="mb-4 bg-[#101112] p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Fabric Base:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[130px]">{proj.fabricName || 'Selvedge Denim'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Total Cut Parts:</span>
                          <span className="text-amber-400 font-bold">{pieces.length} pieces</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-[#222427]">
                    {isDecon ? (
                      <>
                        <button
                          onClick={() => handleOpenInDraftingBoard(proj)}
                          className="w-full py-2 bg-[#C5A059] hover:bg-[#D4AF37] text-slate-950 font-bold rounded-xl text-xs transition-all shadow-gold-sm flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Open in Drafting Board</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => navigate(`/deconstruct?project=${proj.id}`)}
                            className="py-1.5 bg-[#18191C] hover:bg-[#202226] text-zinc-300 hover:text-[#C5A059] rounded-xl text-[11px] font-semibold border border-[#28292D] flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-[#C5A059]" />
                            <span>Review</span>
                          </button>
                          <button
                            onClick={() => handleOpenOnCuttingTable(proj)}
                            className="py-1.5 bg-[#18191C] hover:bg-[#202226] text-zinc-300 hover:text-amber-300 rounded-xl text-[11px] font-semibold border border-[#28292D] flex items-center justify-center gap-1"
                          >
                            <Scissors className="w-3 h-3 text-amber-400" />
                            <span>Cut Table</span>
                          </button>
                        </div>
                      </>
                    ) : isCut ? (
                      <button
                        onClick={() => handleOpenOnCuttingTable(proj)}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-gold-sm"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Open on Cutting Table</span>
                      </button>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

