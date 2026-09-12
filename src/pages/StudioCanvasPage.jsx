import React, { useState } from 'react';
import { CanvasProvider } from '../context/CanvasContext';
import CanvasWorkspace from '../components/StudioCanvas/CanvasWorkspace';
import DraftingBoardWorkspace from '../components/CAD/DraftingBoardWorkspace';
import { Layers, Scissors } from 'lucide-react';

export default function StudioCanvasPage() {
  const [activeTab, setActiveTab] = useState('studio_canvas'); // 'studio_canvas' | 'drafting_board'

  return (
    <div className="w-full h-full bg-[#101112] text-slate-100 overflow-hidden flex flex-col">
      {/* Top Studio Mode Bar */}
      <div className="h-10 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-40 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('studio_canvas')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'studio_canvas'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-studio-canvas"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Studio Canvas & Cutting Sheets</span>
          </button>
          <button
            onClick={() => setActiveTab('drafting_board')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'drafting_board'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-drafting-board"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Full Pattern CAD Board</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          {activeTab === 'studio_canvas'
            ? 'Dynamic Cutting Sheets • 8-Ruler Toolbox • Up to 400% Zoom'
            : 'Multi-Piece Marker & Sizing Matrix'}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'studio_canvas' ? (
          <CanvasProvider>
            <CanvasWorkspace />
          </CanvasProvider>
        ) : (
          <DraftingBoardWorkspace initialTab="cutting" />
        )}
      </div>
    </div>
  );
}
