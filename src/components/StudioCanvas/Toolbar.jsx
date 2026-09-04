import React from 'react';
import { 
  Pencil, 
  Ruler, 
  Scissors, 
  MoveHorizontal, 
  Undo2, 
  Redo2, 
  Trash2,
  Palette
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

export default function Toolbar({ onUndo, onRedo, onClear }) {
  const { 
    activeTool, setActiveTool, 
    brushColor, setBrushColor, 
    activeRulerType, setActiveRulerType
  } = useCanvas();

  const colors = [
    { name: 'White Chalk', hex: '#FFFFFF' },
    { name: 'Yellow Chalk', hex: '#FACC15' },
    { name: 'Blue Chalk', hex: '#38BDF8' },
    { name: 'Red Pen', hex: '#F87171' }
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-2xl flex items-center gap-2 max-w-[95vw] overflow-x-auto ring-1 ring-white/5">
      
      {/* Drawing Tool & Color Selection */}
      <div className="flex items-center gap-1.5 border-r border-slate-800/80 pr-2">
        <button
          onClick={() => setActiveTool('chalk')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'chalk' ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Tailor Chalk Freehand"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 ml-0.5">
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => {
                setBrushColor(c.hex);
                setActiveTool('chalk');
              }}
              className={`w-4 h-4 rounded-full border border-slate-700/80 transition-all ${
                brushColor === c.hex ? 'scale-125 ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Rulers */}
      <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
        <button
          onClick={() => {
            const nextRuler = activeRulerType === 'straight' ? null : 'straight';
            setActiveRulerType(nextRuler);
            setActiveTool(nextRuler ? 'straight_ruler' : 'chalk');
          }}
          className={`p-2 rounded-xl transition-all ${
            activeRulerType === 'straight' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="Straight Ruler Guide"
        >
          <MoveHorizontal className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const nextRuler = activeRulerType === 'french_curve' ? null : 'french_curve';
            setActiveRulerType(nextRuler);
            setActiveTool(nextRuler ? 'french_curve' : 'chalk');
          }}
          className={`p-2 rounded-xl transition-all ${
            activeRulerType === 'french_curve' ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
          title="French Curve"
        >
          <Ruler className="w-4 h-4 rotate-45" />
        </button>
      </div>

      {/* History Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onClear}
          className="p-2 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          title="Clear Canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
