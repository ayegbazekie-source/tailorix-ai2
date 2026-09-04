import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import { Layers, Scissors, Eye, RotateCcw, Download, Sparkles, Check } from 'lucide-react';

export default function DeconstructWorkbench() {
  const [image, setImage] = useState(null);
  const [showSeams, setShowSeams] = useState(true);
  const [opacity, setOpacity] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [selectedPanels, setSelectedPanels] = useState([0, 1, 2, 3]);

  const panelList = [
    'Cuban Collar & Lapel Block',
    'Front Button Placket & Chest Panels',
    'Short Sleeves (Left & Right)',
    'Straight-Leg Trouser Panels'
  ];

  const togglePanel = (index) => {
    if (selectedPanels.includes(index)) {
      setSelectedPanels(selectedPanels.filter((i) => i !== index));
    } else {
      setSelectedPanels([...selectedPanels, index]);
    }
  };

  const handleConvertPattern = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsConverted(true);
    }, 1500);
  };

  const handleExport = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = 'tailorix-pattern-deconstruction.png';
    link.click();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-3 sm:p-6 flex flex-col overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Deconstruction Workbench
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Analyze garment construction and extract pattern panels.
            </p>
          </div>
          {image && (
            <button 
              onClick={() => {
                setImage(null);
                setIsConverted(false);
              }} 
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:text-amber-400 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {!image ? (
          <ImageUploader onImageSelect={setImage} />
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Image Preview & Seam Overlay */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 flex flex-col relative overflow-hidden">
              <div className="relative w-full h-[50vh] max-h-[450px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800/50">
                <img 
                  src={image} 
                  alt="Garment Analysis" 
                  className="w-full h-full object-contain rounded-lg transition-opacity"
                  style={{ opacity: opacity / 100 }}
                />
                
                {/* SVG Seam Lines Overlay */}
                {showSeams && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-amber-400 fill-none">
                    {/* Upper Collar & Placket lines */}
                    <path d="M 30% 25% L 50% 35% L 70% 25%" strokeWidth="2.5" strokeDasharray="5,5" />
                    <line x1="50%" y1="35%" x2="50%" y2="65%" strokeWidth="2" strokeDasharray="4,4" />
                    {/* Shoulder Seams */}
                    <line x1="28%" y1="28%" x2="40%" y2="24%" strokeWidth="2" strokeDasharray="4,4" />
                    <line x1="72%" y1="28%" x2="60%" y2="24%" strokeWidth="2" strokeDasharray="4,4" />
                    {/* Outer Outline */}
                    <rect x="25%" y="22%" width="50%" height="45%" rx="8" strokeWidth="1.5" strokeDasharray="6,6" />
                  </svg>
                )}
              </div>

              {/* View Controls */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <button 
                  onClick={() => setShowSeams(!showSeams)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    showSeams ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showSeams ? 'Hide Seam Lines' : 'Show Seam Lines'}
                </button>

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

            {/* Detected Panels & Actions */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4">
              <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Scissors className="w-4 h-4 text-amber-400" /> Detected Pattern Panels
              </h3>

              <div className="space-y-2 mb-4">
                {panelList.map((panel, idx) => {
                  const isSelected = selectedPanels.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => togglePanel(idx)}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="font-medium">{panel}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={handleConvertPattern}
                  disabled={isProcessing}
                  className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> 
                  {isProcessing ? 'Generating Vector Patterns...' : isConverted ? 'Pattern Generated!' : 'Convert to Vector Pattern'}
                </button>

                <button 
                  onClick={handleExport}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-700"
                >
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
