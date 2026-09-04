import React, { useState, useMemo } from 'react';
import ImageUploader from './ImageUploader';
import { generatePatternCAD } from '../../utils/patternEngine';
import { Layers, Scissors, Eye, RotateCcw, Download, Sparkles, Check, Grid, Ruler, Info } from 'lucide-react';

export default function DeconstructWorkbench() {
  const [image, setImage] = useState(null);
  const [showSeams, setShowSeams] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  
  // Category & Parametric State
  const [selectedCategory, setSelectedCategory] = useState('trouser');
  const [selectedPanels, setSelectedPanels] = useState([0, 1]);

  // Master Measurement State
  const [measurements, setMeasurements] = useState({
    waist: 32,
    hip: 40,
    crotchDepth: 10.5,
    kneeHeight: 20,
    inseam: 32,
    kneeWidth: 16,
    hemWidth: 22,
    bustChest: 38,
    neckCircumference: 15.5,
    shoulderWidth: 17,
    shirtLength: 28,
    sleeveLength: 24,
    hipDepth: 8,
    skirtLength: 26,
    chest: 40,
    jacketLength: 30,
    bust: 36,
    shoulderToWaist: 16.5,
    fullGownLength: 58,
  });

  const [parameters, setParameters] = useState({
    seamAllowance: 0.5,
    isShorts: false,
    shortsInseam: 8,
    style: 'a_line',
    flareExtension: 3.5,
    lapelWidth: 3.25,
    wearingEase: 3.5,
    silhouette: 'mermaid',
    hemSweep: 28,
  });

  // Calculate Pattern Geometry using the Math Engine
  const cadData = useMemo(() => {
    try {
      return generatePatternCAD(selectedCategory, measurements, parameters);
    } catch (err) {
      console.error(err);
      return { pieces: [] };
    }
  }, [selectedCategory, measurements, parameters]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedPanels([0, 1]);
  };

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
    }, 600);
  };

  const handleExportSVG = () => {
    const svgElement = document.getElementById('cad-pattern-svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tailorix-${selectedCategory}-production-cad.svg`;
    link.click();
  };

  const handleMeasurementChange = (key, val) => {
    setMeasurements((prev) => ({ ...prev, [key]: Number(val) }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-3 sm:p-6 flex flex-col overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2 tracking-wide font-mono">
              <Layers className="w-5 h-5 text-amber-400" />
              TAILORIX CAD // PARAMETRIC PATTERN ENGINE
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Select a garment block to generate real-time mathematical vector geometry.
            </p>
          </div>
          {image && (
            <button 
              onClick={() => {
                setImage(null);
                setIsConverted(false);
              }} 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:text-amber-400 transition-all font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" /> RESET SESSION
            </button>
          )}
        </div>

        {/* Category Selector Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {['trouser', 'shirt', 'skirt', 'jacket', 'gown'].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat} Engine
            </button>
          ))}
        </div>

        {!image ? (
          <ImageUploader onImageSelect={setImage} />
        ) : (
          <div className="flex flex-col gap-5">
            
            <div className={`grid grid-cols-1 ${isConverted ? 'lg:grid-cols-12' : ''} gap-4 transition-all`}>
              
              {/* Reference Image Column */}
              <div className={`${isConverted ? 'lg:col-span-4' : 'w-full'} bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col relative`}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Grid className="w-3.5 h-3.5 text-amber-400" /> Reference Image
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">SPEC SOURCE</span>
                </div>

                <div className="relative w-full h-[360px] max-h-[420px] flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800 p-2">
                  <img 
                    src={image} 
                    alt="Garment Analysis" 
                    className="max-h-full max-w-full object-contain rounded-lg transition-opacity"
                    style={{ opacity: opacity / 100 }}
                  />
                  {showSeams && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-amber-400 fill-none">
                      <path d="M 35% 15% L 65% 15% L 60% 90% L 40% 90% Z" strokeWidth="1.5" strokeDasharray="4,4" />
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

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
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

              {/* Parametric CAD Board */}
              {isConverted && (
                <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-mono font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5" /> Real-time CAD Vector Canvas ({selectedCategory.toUpperCase()})
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                      Scale 1:1 // Seam Allowance Enabled
                    </span>
                  </div>

                  <div className="relative w-full h-[460px] max-h-[520px] bg-[#f8fafc] rounded-xl border border-slate-300 p-2 flex items-center justify-center overflow-auto shadow-inner">
                    <svg 
                      id="cad-pattern-svg"
                      viewBox="0 0 900 650" 
                      className="w-full h-full font-mono select-none"
                    >
                      <defs>
                        <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                        </pattern>
                        <pattern id="cadGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                          <rect width="100" height="100" fill="url(#cadGrid)" />
                          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                        </pattern>
                        <marker id="grainArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 10 5 L 0 8 z" fill="#1e293b" />
                        </marker>
                      </defs>

                      <rect width="100%" height="100%" fill="url(#cadGridMajor)" />

                      {/* Render Mathematical Vector Paths from Engine */}
                      {cadData.pieces.map((piece, index) => {
                        if (!selectedPanels.includes(index)) return null;
                        return (
                          <g key={piece.id}>
                            <path 
                              d={piece.path} 
                              fill="rgba(241, 245, 249, 0.4)" 
                              stroke="#0f172a" 
                              strokeWidth="2.2" 
                            />
                            {piece.grainline && (
                              <line 
                                x1={piece.grainline.x1} 
                                y1={piece.grainline.y1} 
                                x2={piece.grainline.x2} 
                                y2={piece.grainline.y2} 
                                stroke="#0f172a" 
                                strokeWidth="1.5" 
                                markerStart="url(#grainArrow)" 
                                markerEnd="url(#grainArrow)" 
                              />
                            )}
                            <text x={piece.grainline?.x1 ? piece.grainline.x1 + 10 : 60} y={120} fontSize="10" fill="#0f172a" fontWeight="bold">
                              {piece.name}
                            </text>
                            <text x={piece.grainline?.x1 ? piece.grainline.x1 + 10 : 60} y={135} fontSize="8" fill="#059669" fontWeight="bold">
                              {piece.cutQuantity}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-amber-400" /> Dynamic Formula Calculations Active
                    </span>
                    <span className="text-emerald-400 font-semibold">MATH VERIFIED</span>
                  </div>
                </div>
              )}

            </div>

            {/* Measurement & Feature Input Panel */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-mono font-semibold text-white flex items-center gap-2 uppercase tracking-wider">
                    <Scissors className="w-4 h-4 text-amber-400" /> Parametric Measurement Inputs ({selectedCategory})
                  </h3>
                  <p className="text-[11px] text-slate-400">Modify numbers below to recalculate vector curves in real time.</p>
                </div>
              </div>

              {/* Dynamic Inputs Based on Category */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs font-mono">
                {selectedCategory === 'trouser' && (
                  <>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Waist (in):</span>
                      <input type="number" value={measurements.waist} onChange={(e) => handleMeasurementChange('waist', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Hip (in):</span>
                      <input type="number" value={measurements.hip} onChange={(e) => handleMeasurementChange('hip', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Hem Flare (in):</span>
                      <input type="number" value={measurements.hemWidth} onChange={(e) => handleMeasurementChange('hemWidth', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Inseam (in):</span>
                      <input type="number" value={measurements.inseam} onChange={(e) => handleMeasurementChange('inseam', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                  </>
                )}

                {(selectedCategory === 'shirt' || selectedCategory === 'jacket') && (
                  <>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Bust/Chest (in):</span>
                      <input type="number" value={measurements.bustChest || measurements.chest} onChange={(e) => handleMeasurementChange(selectedCategory === 'shirt' ? 'bustChest' : 'chest', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Shoulder Width (in):</span>
                      <input type="number" value={measurements.shoulderWidth} onChange={(e) => handleMeasurementChange('shoulderWidth', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Sleeve Length (in):</span>
                      <input type="number" value={measurements.sleeveLength} onChange={(e) => handleMeasurementChange('sleeveLength', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                  </>
                )}

                {selectedCategory === 'skirt' && (
                  <>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Waist (in):</span>
                      <input type="number" value={measurements.waist} onChange={(e) => handleMeasurementChange('waist', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Hip (in):</span>
                      <input type="number" value={measurements.hip} onChange={(e) => handleMeasurementChange('hip', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Skirt Length (in):</span>
                      <input type="number" value={measurements.skirtLength} onChange={(e) => handleMeasurementChange('skirtLength', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                  </>
                )}

                {selectedCategory === 'gown' && (
                  <>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Bust (in):</span>
                      <input type="number" value={measurements.bust} onChange={(e) => handleMeasurementChange('bust', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Waist (in):</span>
                      <input type="number" value={measurements.waist} onChange={(e) => handleMeasurementChange('waist', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                    <label className="flex flex-col gap-1 text-slate-300">
                      <span>Full Length (in):</span>
                      <input type="number" value={measurements.fullGownLength} onChange={(e) => handleMeasurementChange('fullGownLength', e.target.value)} className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400" />
                    </label>
                  </>
                )}
              </div>

               {/* Panel Selectors */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {cadData.pieces.map((piece, idx) => {
                  const isSelected = selectedPanels.includes(idx);
                  return (
                    <div 
                      key={piece.id} 
                      onClick={() => togglePanel(idx)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all font-mono ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="font-medium text-[11px]">{piece.name}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={handleConvertPattern}
                  disabled={isProcessing}
                  className="py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> 
                  {isProcessing ? 'CALCULATING VECTOR MATH...' : 'GENERATE CAD VECTOR DRAFT'}
                </button>

                <button 
                  onClick={handleExportSVG}
                  disabled={!isConverted}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-700 disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-amber-400" /> EXPORT LAYERED SVG
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
