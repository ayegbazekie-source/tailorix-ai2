import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import { Layers, Scissors, Eye, RotateCcw, Download, Sparkles } from 'lucide-react';

export default function DeconstructWorkbench() {
  const [image, setImage] = useState(null);
  const [showSeams, setShowSeams] = useState(true);
  const [opacity, setOpacity] = useState(80);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-6 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Deconstruction Workbench
            </h2>
            <p className="text-xs text-slate-400">Analyze garment construction, trace panel boundaries, and extract pattern blocks.</p>
          </div>
          {image && (
            <button 
              onClick={() => setImage(null)} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:text-amber-400 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Image
            </button>
          )}
        </div>

        {!image ? (
          <ImageUploader onImageSelect={setImage} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            
            {/* Interactive Image & Panel Overlay Display */}
            <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between relative overflow-hidden min-h-[400px]">
              <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950">
                <img 
                  src={image} 
                  alt="Garment Analysis" 
                  className="max-h-[60vh] object-contain rounded-lg transition-opacity"
                  style={{ opacity: opacity / 100 }}
                />
                
                {/* Visual SVG Seam Overlay Simulation */}
                {showSeams && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-amber-400 stroke-2 fill-none stroke-dasharray-4">
                    <rect x="25%" y="20%" width="50%" height="60%" rx="12" strokeDasharray="6 6" />
                    <line x1="25%" y1="45%" x2="75%" y2="45%" strokeDasharray="4 4" />
                    <line x1="50%" y1="20%" x2="50%" y2="80%" strokeDasharray="4 4" />
                  </svg>
                )}
              </div>

              {/* Quick Controls */}
              <div className="mt-4 flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowSeams(!showSeams)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      showSeams ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Seam Guidelines
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Opacity</span>
                  <input 
                    type="range" 
                    min="20" 
                    max="100" 
                    value={opacity} 
                    onChange={(e) => setOpacity(e.target.value)}
                    className="w-24 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Deconstruction Tools Panel */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-400" /> Detected Panels
                </h3>

                <div className="space-y-2 mb-6">
                  {['Front Bodice / Yoke', 'Sleeve Panels (Left/Right)', 'Collar Block', 'Pocket Flaps & Welt'].map((panel, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{panel}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Ready</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-4 h-4" /> Convert to Vector Pattern
                </button>
                <button className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Export Panel Data
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

