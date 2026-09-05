import React, { useState, useEffect } from 'react';
import { Folder, Trash2, ExternalLink, Plus } from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('tailorix_saved_projects');
    if (saved) {
      try { setProjects(JSON.parse(saved)); } catch (e) { setProjects([]); }
    }
  }, []);

  const deleteProject = (id) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem('tailorix_saved_projects', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-mono">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
              <Folder className="w-6 h-6 text-amber-400" />
              SAVED PROJECTS GALLERY
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Access and manage your saved parametric pattern drafts and CAD specifications.
            </p>
          </div>

          <a 
            href="/deconstruct"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-all"
          >
            <Plus className="w-4 h-4" /> New Draft
          </a>
        </div>

        {/* Project List */}
        {projects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center">
            <Folder className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-300">No Saved Projects Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Save pattern specifications directly from the Workbench to review or re-export them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div key={proj.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] bg-slate-950 text-amber-400 border border-slate-800 px-2 py-0.5 rounded-md font-bold uppercase">
                      {proj.category}
                    </span>
                    <button 
                      onClick={() => deleteProject(proj.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{proj.title || 'Untitled Draft'}</h3>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Saved: {new Date(proj.timestamp).toLocaleDateString()}
                  </p>
                </div>

                <a 
                  href="/deconstruct"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  Open in Workbench <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
