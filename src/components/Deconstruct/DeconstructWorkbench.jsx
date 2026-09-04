import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import { Layers, Scissors, Eye, RotateCcw, Download, Sparkles, Check, Grid, Ruler } from 'lucide-react';

export default function DeconstructWorkbench() {
  const [image, setImage] = useState(null);
  const [showSeams, setShowSeams] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [selectedPanels, setSelectedPanels] = useState([0, 1, 2, 3]);

  const denimPanels = [
    'Front Leg Block (Flared Knee)',
    'Back Leg Block (Calf & Seat)',
    'Contour Waistband',
    'Back Yoke & Pocket Templates'
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
    }, 1200);
  };

  const handleExportSVG = () => {
    const svgElement = document.getElementById('pattern-blueprint-svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tailorix-pattern-blueprint.svg';
    link.click();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-3 sm:p-6 flex flex-col overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header Title */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Deconstruction & Pattern Engineering
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Extract pattern panel blocks, seam allowances, and vector draft blueprints from photos.
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
              <RotateCcw className="w-3.5 h-3.5" /> Reset Image
            </button>
          )}
        </div>

        {!image ? (
          <ImageUploader onImageSelect={setImage} />
        ) : (
          <div className="flex flex-col gap-5">
            
            {/* WORKSPACE VIEW */}
            <div className={`grid grid-cols-1 ${isConverted ? 'lg:grid-cols-2' : ''} gap-4 transition-all`}>
              
              {/* Garment Reference Card */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Grid className="w-3.5 h-3.5 text-amber-400" /> Source Photo Reference
                  </span>
                  {isConverted && <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">Captured Garment</span>}
                </div>

                <div className="relative w-full h-[360px] max-h-[400px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 p-2">
                  <img 
                    src={image} 
                    alt="Garment Analysis" 
                    className="max-h-full max-w-full object-contain rounded-lg transition-opacity"
                    style={{ opacity: opacity / 100 }}
                  />
                  
                  {/* Seam Overlay */}
                  {showSeams && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-amber-400 fill-none">
                      <path d="M 35% 20% L 65% 20% L 60% 90% L 40% 90% Z" strokeWidth="2" strokeDasharray="5,5" />
                      <line x1="50%" y1="20%" x2="50%" y2="50%" strokeWidth="2" strokeDasharray="4,4" />
                      <line x1="35%" y1="35%" x2="65%" y2="35%" strokeWidth="1.5" strokeDasharray="3,3" />
                    </svg>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => setShowSeams(!showSeams)}
                    className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                      showSeams ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showSeams ? 'Hide Seams' : 'Show Seams'}
                  </button>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Opacity</span>
                    <input 
                      type="range" 
                      min="30" 
                      max="100" 
                      value={opacity} 
                      onChange={(e) => setOpacity(e.target.value)}
                      className="w-20 accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* TECHNICAL DRAFTING BLUEPRINT */}
              {isConverted && (
                <div className="bg-slate-900/80 rounded-2xl border border-amber-500/30 p-3 flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5" /> Pattern Engineering Blueprint
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono">1:1 Scale Draft Grid</span>
                  </div>

                  {/* Drafting Canvas */}
                  <div className="relative w-full h-[360px] max-h-[400px] bg-white rounded-xl border border-slate-300 p-2 flex items-center justify-center overflow-hidden shadow-inner">
                    <svg 
                      id="pattern-blueprint-svg"
                      viewBox="0 0 500 500" 
                      className="w-full h-full font-mono select-none"
                    >
                      <defs>
                        {/* 10px Sub-grid */}
                        <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                        </pattern>
                        {/* 50px Main Grid */}
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                          <rect width="50" height="50" fill="url(#smallGrid)" />
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#CBD5E1" strokeWidth="1" />
                        </pattern>
                        {/* Grainline Arrow Markers */}
                        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0F172A" />
                        </marker>
                      </defs>

                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* FRONT TROUSER LEG BLOCK */}
                      {selectedPanels.includes(0) && (
                        <g>
                          {/* Seam Allowance Boundary (Dashed) */}
                          <path 
                            d="M 45,55 L 145,55 L 135,160 L 155,385 L 35,385 L 55,160 Z" 
                            fill="none" 
                            stroke="#94A3B8" 
                            strokeWidth="1" 
                            strokeDasharray="3,3" 
                          />
                          {/* Main Stitching Cut Line */}
                          <path 
                            d="M 50,60 L 140,60 L 130,160 L 150,380 L 40,380 L 60,160 Z" 
                            fill="rgba(245, 158, 11, 0.05)" 
                            stroke="#0F172A" 
                            strokeWidth="2" 
                          />
                          {/* Grainline */}
                          <line x1="95" y1="80" x2="95" y2="360" stroke="#0F172A" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                          <text x="100" y="210" fontSize="8" fill="#475569" fontWeight="bold">GRAINLINE</text>

                          {/* Notches */}
                          <line x1="130" y1="160" x2="136" y2="160" stroke="#DC2626" strokeWidth="2" />
                          <line x1="60" y1="160" x2="54" y2="160" stroke="#DC2626" strokeWidth="2" />

                          {/* Labels & Measurements */}
                          <text x="65" y="80" fontSize="9" fill="#0F172A" fontWeight="bold">FRONT LEG BLOCK</text>
                          <text x="65" y="92" fontSize="7" fill="#64748B">CUT 2 (PAIR)</text>
                          
                          <text x="70" y="52" fontSize="7" fill="#2563EB" fontWeight="bold">WAIST: 15.5"</text>
                          <text x="75" y="392" fontSize="7" fill="#2563EB" fontWeight="bold">HEM FLARE: 11"</text>
                        </g>
                      )}

                      {/* BACK TROUSER LEG BLOCK */}
                      {selectedPanels.includes(1) && (
                        <g>
                          {/* Seam Allowance Boundary */}
                          <path 
                            d="M 235,45 L 345,45 L 325,160 L 365,385 L 215,385 L 245,160 Z" 
                            fill="none" 
                            stroke="#94A3B8" 
                            strokeWidth="1" 
                            strokeDasharray="3,3" 
                          />
                          {/* Main Stitch Line */}
                          <path 
                            d="M 240,50 L 340,50 L 320,160 L 360,380 L 220,380 L 250,160 Z" 
                            fill="rgba(56, 189, 248, 0.05)" 
                            stroke="#0F172A" 
                            strokeWidth="2" 
                          />
                          {/* Grainline */}
                          <line x1="290" y1="75" x2="290" y2="360" stroke="#0F172A" strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                          <text x="295" y="210" fontSize="8" fill="#475569" fontWeight="bold">GRAINLINE</text>

                          {/* Double Notches for Back Seam */}
                          <line x1="320" y1="158" x2="326" y2="158" stroke="#DC2626" strokeWidth="2" />
                          <line x1="320" y1="162" x2="326" y2="162" stroke="#DC2626" strokeWidth="2" />

                          {/* Labels & Measurements */}
                          <text x="260" y="75" fontSize="9" fill="#0F172A" fontWeight="bold">BACK LEG BLOCK</text>
                          <text x="260" y="87" fontSize="7" fill="#64748B">CUT 2 (PAIR)</text>

                          <text x="265" y="42" fontSize="7" fill="#2563EB" fontWeight="bold">SEAT: 18.25"</text>
                          <text x="265" y="392" fontSize="7" fill="#2563EB" fontWeight="bold">HEM FLARE: 14"</text>
                        </g>
                      )}

                      {/* CONTOUR WAISTBAND BLOCK */}
                      {selectedPanels.includes(2) && (
                        <g>
                          <rect x="50" y="415" width="310" height="25" rx="1" fill="rgba(245, 158, 11, 0.1)" stroke="#0F172A" strokeWidth="2" />
                          <line x1="205" y1="415" x2="205" y2="440" stroke="#DC2626" strokeWidth="1.5" strokeDasharray="2,2" />
                          <text x="140" y="431" fontSize="8" fill="#0F172A" fontWeight="bold">CONTOUR WAISTBAND (CUT 1 ON FOLD)</text>
                        </g>
                      )}

                      {/* BACK YOKE & POCKET BLOCK */}
                      {selectedPanels.includes(3) && (
                        <g>
                          {/* Yoke */}
                          <path d="M 380,60 L 470,70 L 465,110 L 380,100 Z" fill="rgba(16, 185, 129, 0.1)" stroke="#0F172A" strokeWidth="2" />
                          <text x="390" y="88" fontSize="7" fill="#0F172A" fontWeight="bold">BACK YOKE</text>

                          {/* Pocket Template */}
                          <path d="M 390,140 L 460,140 L 460,200 L 425,225 L 390,200 Z" fill="rgba(16, 185, 129, 0.05)" stroke="#0F172A" strokeWidth="2" />
                          <text x="400" y="170" fontSize="7" fill="#0F172A" fontWeight="bold">PATCH POCKET</text>
                        </g>
                      )}

                    </svg>
                  </div>

                  <p className="mt-2 text-[10px] text-slate-400 text-center">
                    Technical draft includes grainlines, notch alignments, and 1/2" seam allowances.
                  </p>
                </div>
              )}

            </div>

            {/* Panel Selector Controls */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4">
              <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Scissors className="w-4 h-4 text-amber-400" /> Pattern Engineering Panels
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {denimPanels.map((panel, idx) => {
                  const isSelected = selectedPanels.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => togglePanel(idx)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="font-medium text-[11px] sm:text-xs">{panel}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
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
                  {isProcessing ? 'Engineering Pattern Vector...' : isConverted ? 'Regenerate Blueprint' : 'Convert to Vector Blueprint'}
                </button>

                <button 
                  onClick={handleExportSVG}
                  disabled={!isConverted}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-700 disabled:opacity-40"
                >
                  <Download className="w-4 h-4" /> Export Blueprint SVG
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
                      }
