import React from 'react';
import DraftingBoardWorkspace from '../components/CAD/DraftingBoardWorkspace';

export default function StudioCanvasPage() {
  return (
    <div className="w-full h-full bg-[#101112] text-slate-100 overflow-hidden flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <DraftingBoardWorkspace initialTab="cutting" />
      </div>
    </div>
  );
}

