/**
 * TAILORIX AI — CAD TOOL RAIL
 * Left-side tool palette for precision vector selection, node editing, tape measure, and view toggles.
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
    { id: 'select', label: 'Select Object', icon: MousePointer },
    { id: 'node', label: 'Edit Nodes / Vertices', icon: Move },
    { id: 'tape', label: 'Digital Tape Measure', icon: Ruler },
    { id: 'pan', label: 'Pan Canvas', icon: Move },
  ];

  return (
    <div className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-3 justify-between shadow-sm z-10 shrink-0">
      {/* Primary Drafting Tools */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        {primaryTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={tool.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Canvas View Toggles */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1 border-t border-slate-200 pt-3">
        <button
          onClick={() => setShowSeamAllowance(!showSeamAllowance)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            showSeamAllowance ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-50'
          }`}
          title="Toggle Seam Allowance Cut Lines"
        >
          <Scissors className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowGrainlines(!showGrainlines)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            showGrainlines ? 'bg-slate-100 text-amber-700 font-bold' : 'text-slate-400 hover:bg-slate-50'
          }`}
          title="Toggle Grainline Vectors"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            showGrid ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-50'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
            snapToGrid ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-400 hover:bg-slate-50'
          }`}
          title="Toggle Snap to Grid (0.25in)"
        >
          <Magnet className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
