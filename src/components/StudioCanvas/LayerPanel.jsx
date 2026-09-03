import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus, X } from 'lucide-react';
import { useCanvas } from '../../context/CanvasContext';

export default function LayerPanel({ isOpen, onClose }) {
  const { 
    layers, 
    activeLayerId, 
    setActiveLayerId, 
    toggleLayerVisibility, 
    toggleLayerLock 
  } = useCanvas();

  if (!isOpen) return null;

  return (
    <div className="absolute top-20 right-4 z-40 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl text-slate-100">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
        <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
          Canvas Layers
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {layers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => setActiveLayerId(layer.id)}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
              activeLayerId === layer.id
                ? 'bg-slate-800/90 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-xs font-medium truncate max-w-[120px]">
              {layer.name}
            </span>

            <div className="flex items-center gap-2">
              {/* Eye Toggle Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className="text-slate-400 hover:text-amber-400 p-1"
                title={layer.visible ? 'Hide Layer' : 'Show Layer'}
              >
                {layer.visible ? (
                  <Eye className="w-4 h-4 text-emerald-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-600" />
                )}
              </button>

              {/* Lock Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                className="text-slate-400 hover:text-amber-400 p-1"
                title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {layer.locked ? (
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
