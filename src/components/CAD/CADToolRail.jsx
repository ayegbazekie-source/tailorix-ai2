/**
 * TAILORIX AI — CAD TOOL RAIL
 * Left-side tool palette for precision vector selection, node editing, tape measure, and view toggles.
 * Compact dark graphite aesthetic with champagne gold active indicators.
 */

import React from 'react';
import { MousePointer, Move, Ruler, Scissors, Grid, Magnet, Eye, Layers } from 'lucide-react';

export default function CADToolRail({
  activeTool,
  setActiveTool,
  showGrid,
  setShowGrid,
  snapToGrid,
  setSnapToGrid,
  showSeamAllowance,
  setShowSeamAllowance,
  showGrainlines,
  setShowGrainlines,
}) {
  const primaryTools = [
    { id: 'select', label: 'Select & Move Piece', icon: MousePointer },
    { id: 'node', label: 'Edit Nodes & Curvature', icon: Move },
    { id: 'tape', label: 'Digital Tape Measure', icon: Ruler },
    { id: 'pan', label: 'Pan Canvas', icon: Move },
  ];

  return (
    <div className="w-12 bg-[#141517] border-r border-[#222427] flex flex-col items-center py-3 justify-between shadow-sm z-10 shrink-0 select-none">
      {/* Primary Drafting Tools */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        {primaryTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#E5C07B] shadow-gold-sm'
                  : 'text-[#8A8B93] hover:bg-[#1E2023] hover:text-[#EDEDF0] border border-transparent'
              }`}
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Canvas View Toggles */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1 border-t border-[#222427] pt-3">
        <button
          onClick={() => setShowSeamAllowance(!showSeamAllowance)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            showSeamAllowance
              ? 'bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E5C07B]'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title="Toggle Seam Allowance Cut Lines"
        >
          <Scissors className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowGrainlines(!showGrainlines)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            showGrainlines
              ? 'bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E5C07B]'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title="Toggle Grainline Vectors"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            showGrid
              ? 'bg-[#1E2023] text-[#EDEDF0] border border-[#2D2E32]'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title="Toggle Drafting Grid"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            snapToGrid
              ? 'bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E5C07B]'
              : 'text-[#6A6C75] hover:bg-[#1E2023] hover:text-[#8A8B93] border border-transparent'
          }`}
          title="Toggle Snap to Grid (0.25in)"
        >
          <Magnet className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
