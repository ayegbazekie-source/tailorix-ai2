/**
 * TAILORIX AI — SAVED PROJECTS GALLERY
 * Access and manage user-saved parametric pattern drafts and CAD blueprints.
 * Styled in dark graphite with champagne accents.
 */

import React, { useState, useEffect } from 'react';
import { Folder, Trash2, ExternalLink, Plus, Layers, ArrowRight } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);

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
                Access, review, and re-export your saved parametric pattern drafts and CAD specifications.
              </p>
            </div>
          </div>

          <a
            href="/deconstruct"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#D4AF37] text-[#101112] rounded-xl text-xs font-semibold transition-all shadow-gold-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Pattern Draft</span>
          </a>
        </div>

        {/* Project List */}
        {projects.length === 0 ? (
          <div className="bg-[#141517] border border-[#222427] rounded-2xl p-12 text-center flex flex-col items-center shadow-panel">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1B1E] border border-[#28292D] flex items-center justify-center text-[#6A6C75] mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#F5F5F7]">No Saved Projects Found</h3>
            <p className="text-xs text-[#8A8B93] mt-1 max-w-sm">
              Save pattern specifications directly from the CAD Workbench or Deconstruct Pipeline to review or re-export them here.
            </p>
            <a
              href="/cad"
              className="mt-4 px-4 py-2 bg-[#1A1B1E] hover:bg-[#222428] border border-[#2A2B2E] text-[#EDEDF0] hover:text-[#C5A059] text-xs font-semibold rounded-xl transition-all"
            >
              Open CAD Workspace
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-[#141517] border border-[#222427] p-5 rounded-2xl flex flex-col justify-between shadow-panel hover:border-[#383A40] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] bg-[#C5A059]/10 text-[#E5C07B] border border-[#C5A059]/20 px-2 py-0.5 rounded-md font-bold uppercase">
                      {proj.category || 'Garment'}
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
                    {proj.title || proj.name || 'Untitled Draft'}
                  </h3>
                  <p className="text-[11px] text-[#8A8B93] mb-4 font-mono">
                    Saved: {proj.timestamp ? new Date(proj.timestamp).toLocaleDateString() : proj.date || 'Recent'}
                  </p>
                </div>

                <a
                  href={`/deconstruct?project=${proj.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-[#18191C] hover:bg-[#202226] text-[#EDEDF0] hover:text-[#C5A059] rounded-xl text-xs font-semibold transition-all border border-[#26272B]"
                >
                  <span>Open in Workbench</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
