import React from 'react';
import { 
  Pencil, 
  Ruler, 
  Scissors, 
  RulerHorizontal, 
  Layers, 
  Sliders, 
  Maximize2, 
  Palette,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

export default function Toolbar({ onOpenLayers, onOpenFabricSettings }) {
  const { 
    activeTool, setActiveTool, 
    brushColor, setBrushColor, 
    activeRulerType, setActiveRulerType,
    infraredGuideActive, setInfraredGuideActive
  } = useCanvas();

  const colors = [
    { name: 'White Chalk', hex: '#FFFFFF' },
    { name: 'Yellow Chalk', hex: '#FACC15' },
    { name: 'Blue Chalk', hex: '#38BDF8' },
    { name: 'Red Pen', hex: '#F87171' }
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2 shadow-2xl flex items-center gap-2 max-w-[95vw] overflow-x-auto">
      
      {/* Marking Tools */}
      <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
        <button
          onClick={() => setActiveTool('chalk')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'chalk' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Tailor Chalk (Freehand Drawing)"
        >
          <Pencil className="w-5 h-5" />
        </button>

        {/* Color Picker */}
        <div className="flex items-center gap-1 ml-1">
          {colors.map((c) => (
            <button
              key={c.hex}
              onClick={() => setBrushColor(c.hex)}
              className={`w-5 h-5 rounded-full border border-slate-700 transition-transform ${
                brushColor === c.hex ? 'scale-125 ring-2 ring-amber-400' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Snap Rulers */}
      <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
        <button
          onClick={() => {
            setActiveTool('straight_ruler');
            setActiveRulerType(activeRulerType === 'straight' ? null : 'straight');
          }}
          className={`p-2 rounded-xl transition-all ${
            activeRulerType === 'straight' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Straight Snap Ruler"
        >
          <RulerHorizontal className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setActiveTool('french_curve');
            setActiveRulerType(activeRulerType === 'french_curve' ? null : 'french_curve');
          }}
          className={`p-2 rounded-xl transition-all ${
            activeRulerType === 'french_curve' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="French Curve (Armhole & Neckline)"
        >
          <Ruler className="w-5 h-5 rotate-45" />
        </button>
      </div>

      {/* Shears with Infrared Guide */}
      <div className="flex items-center gap-1 border-r border-slate-800 pr-2">
        <button
          onClick={() => setActiveTool('shears')}
          className={`p-2 rounded-xl transition-all ${
            activeTool === 'shears' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Digital Shears (Infrared Cut Guide)"
        >
          <Scissors className="w-5 h-5" />
        </button>
      </div>

      {/* Layers & Fabric Setup Triggers */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenLayers}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Layers Stack"
        >
          <Layers className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenFabricSettings}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Cut-Sheet & Fabric Fold Settings"
        >
          <Sliders className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
