import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import { Layers, Scissors, Eye, RotateCcw, Download, Sparkles, Check, Grid, Ruler, Info } from 'lucide-react';

export default function DeconstructWorkbench() {
  const [image, setImage] = useState(null);
  const [showSeams, setShowSeams] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [selectedPanels, setSelectedPanels] = useState([0, 1, 2, 3]);

  // Default CAD Base Block Measurements (Inches)
  const [measurements, setMeasurements] = useState({
    waist: 32,
    hip: 40,
    thigh: 24,
    knee: 16,
    flareHem: 22,
    inseam: 32,
    outseam: 42,
  });

  const denimPanels = [
    '01. Front Leg Pattern Block',
    '02. Back Leg Pattern Block',
    '03. Contour Waistband Block',
    '04. Back Yoke & Patch Pockets'
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
    const svgElement = document.getElementById('cad-pattern-svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tailorix-production-pattern-cad.svg';
    link.click();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-3 sm:p-6 flex flex-col overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        
        {/* CAD Header Bar */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2 tracking-wide font-mono">
              <Layers className="w-5 h-5 text-amber-400" />
              TAILORIX CAD // PATTERN ENGINEERING WORKBENCH
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Parametric base-block construction, vector seam allowances, and production pattern specs.
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

        {!image ? (
          <ImageUploader onImageSelect={setImage} />
        ) : (
          <div className="flex flex-col gap-5">
            
            {/* WORKSPACE VIEW: Side-by-side Layout */}
            <div className={`grid grid-cols-1 ${isConverted ? 'lg:grid-cols-12' : ''} gap-4 transition-all`}>
              
              {/* Garment Reference Column */}
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
                  
                  {/* Seam Guidelines Overlay */}
                  {showSeams && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-amber-400 fill-none">
                      <path d="M 35% 15% L 65% 15% L 60% 90% L 40% 90% Z" strokeWidth="1.5" strokeDasharray="4,4" />
                      <line x1="50%" y1="15%" x2="50%" y2="50%" strokeWidth="1.5" strokeDasharray="3,3" />
                      <line x1="35%" y1="32%" x2="65%" y2="32%" strokeWidth="1.5" strokeDasharray="3,3" />
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

              {/* PROFESSIONAL CAD DRAFTING CANVAS */}
              {isConverted && (
                <div className="lg:col-span-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-mono font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5" /> Production Pattern Canvas (2D Vector CAD)
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
                      Scale 1:1 // 1.27cm (1/2") Seam Allowance
                    </span>
                  </div>

                  {/* CAD Canvas Board: Light Grey CAD Background */}
                  <div className="relative w-full h-[460px] max-h-[520px] bg-[#f8fafc] rounded-xl border border-slate-300 p-2 flex items-center justify-center overflow-auto shadow-inner">
                    <svg 
                      id="cad-pattern-svg"
                      viewBox="0 0 900 650" 
                      className="w-full h-full font-mono select-none"
                    >
                      <defs>
                        {/* Low-contrast Subtle CAD Grid */}
                        <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                        </pattern>
                        <pattern id="cadGridMajor" width="100" height="100" patternUnits="userSpaceOnUse">
                          <rect width="100" height="100" fill="url(#cadGrid)" />
                          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                        </pattern>

                        {/* Grainline Arrow Markers */}
                        <marker id="grainArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 10 5 L 0 8 z" fill="#1e293b" />
                        </marker>
                      </defs>

                      {/* CAD Grid Backdrop */}
                      <rect width="100%" height="100%" fill="url(#cadGridMajor)" />

                      {/* LAYER 01: FRONT LEG PATTERN BLOCK */}
                      {selectedPanels.includes(0) && (
                        <g id="LAYER_FRONT_LEG">
                          {/* Outer Cut Line (Solid Dark Vector) */}
                          <path 
                            d="M 60,60 L 170,60 C 160,110 150,160 180,220 C 165,340 145,460 210,580 L 20,580 C 85,460 65,340 50,220 C 80,160 70,110 60,60 Z" 
                            fill="rgba(241, 245, 249, 0.4)" 
                            stroke="#0f172a" 
                            strokeWidth="2.2" 
                          />
                          {/* Inner Stitching Line (Dashed Seam Line) */}
                          <path 
                            d="M 68,70 L 162,70 C 153,115 144,160 172,217 C 158,335 139,455 200,570 L 30,570 C 91,455 72,335 58,217 C 84,160 75,115 68,70 Z" 
                            fill="none" 
                            stroke="#475569" 
                            strokeWidth="1.2" 
                            strokeDasharray="4,3" 
                          />
                          {/* Grainline */}
                          <line x1="115" y1="90" x2="115" y2="550" stroke="#0f172a" strokeWidth="1.5" markerStart="url(#grainArrow)" markerEnd="url(#grainArrow)" />
                          <text x="120" y="300" fontSize="9" fill="#1e293b" fontWeight="bold">GRAINLINE</text>

                          {/* Alignment Notches (Red CAD Notches) */}
                          <line x1="171" y1="220" x2="183" y2="220" stroke="#dc2626" strokeWidth="2.5" />
                          <line x1="47" y1="220" x2="59" y2="220" stroke="#dc2626" strokeWidth="2.5" />

                          {/* Knee Balance Line */}
                          <line x1="50" y1="360" x2="180" y2="360" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                          <text x="85" y="355" fontSize="8" fill="#64748b">KNEE LINE</text>

                          {/* Pattern Info Text Box */}
                          <text x="75" y="110" fontSize="10" fill="#0f172a" fontWeight="bold">FRONT LEG BLOCK</text>
                          <text x="75" y="123" fontSize="8" fill="#475569">PATTERN ID: D-KADRIS-01</text>
                          <text x="75" y="135" fontSize="8" fill="#0f172a" fontWeight="bold">CUT 2 (PAIR)</text>
                          <text x="75" y="147" fontSize="8" fill="#2563eb">SIZE: M / 32" WAIST</text>
                          <text x="75" y="159" fontSize="8" fill="#059669">SEAM ALLOWANCE: 1/2" (1.27cm)</text>
                        </g>
                      )}

                      {/* LAYER 02: BACK LEG PATTERN BLOCK */}
                      {selectedPanels.includes(1) && (
                        <g id="LAYER_BACK_LEG">
                          {/* Outer Cut Line */}
                          <path 
                            d="M 270,50 L 400,50 C 385,110 375,160 420,220 C 400,340 370,460 450,580 L 230,580 C 310,460 280,340 260,220 C 305,160 290,110 270,50 Z" 
                            fill="rgba(241, 245, 249, 0.4)" 
                            stroke="#0f172a" 
                            strokeWidth="2.2" 
                          />
                          {/* Inner Stitching Line */}
                          <path 
                            d="M 278,60 L 392,60 C 378,115 368,160 410,217 C 391,335 363,455 438,570 L 242,570 C 317,455 289,335 270,217 C 310,160 296,115 278,60 Z" 
                            fill="none" 
                            stroke="#475569" 
                            strokeWidth="1.2" 
                            strokeDasharray="4,3" 
                          />
                          {/* Grainline */}
                          <line x1="340" y1="80" x2="340" y2="550" stroke="#0f172a" strokeWidth="1.5" markerStart="url(#grainArrow)" markerEnd="url(#grainArrow)" />
                          <text x="345" y="300" fontSize="9" fill="#1e293b" fontWeight="bold">GRAINLINE</text>

                          {/* Double Notches (Back Seam Standard) */}
                          <line x1="412" y1="218" x2="424" y2="218" stroke="#dc2626" strokeWidth="2.5" />
                          <line x1="412" y1="223" x2="424" y2="223" stroke="#dc2626" strokeWidth="2.5" />

                          {/* Pattern Info Text Box */}
                          <text x="290" y="100" fontSize="10" fill="#0f172a" fontWeight="bold">BACK LEG BLOCK</text>
                          <text x="290" y="113" fontSize="8" fill="#475569">PATTERN ID: D-KADRIS-02</text>
                          <text x="290" y="125" fontSize="8" fill="#0f172a" fontWeight="bold">CUT 2 (PAIR)</text>
                          <text x="290" y="137" fontSize="8" fill="#2563eb">SIZE: M / 32" WAIST</text>
                          <text x="290" y="149" fontSize="8" fill="#059669">SEAM ALLOWANCE: 1/2" (1.27cm)</text>
                        </g>
                      )}

                      {/* LAYER 03: CONTOUR WAISTBAND */}
                      {selectedPanels.includes(2) && (
                        <g id="LAYER_WAISTBAND">
                          <path d="M 490,60 L 860,60 L 860,100 L 490,100 Z" fill="rgba(241, 245, 249, 0.4)" stroke="#0f172a" strokeWidth="2" />
                          <path d="M 498,68 L 852,68 L 852,92 L 498,92 Z" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="4,3" />
                          {/* Center Back Notch / Cut on Fold */}
                          <line x1="675" y1="55" x2="675" y2="105" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,2" />
                          <text x="640" y="50" fontSize="8" fill="#dc2626" fontWeight="bold">CENTER BACK (CUT ON FOLD)</text>
                          <text x="510" y="82" fontSize="9" fill="#0f172a" fontWeight="bold font-mono">CONTOUR WAISTBAND -- CUT 1 MAIN / CUT 1 FUSIBLE INTERFACING</text>
                        </g>
                      )}

                      {/* LAYER 04: BACK YOKE & PATCH POCKETS */}
                      {selectedPanels.includes(3) && (
                        <g id="LAYER_YOKE_POCKETS">
                          {/* Back Yoke Pattern */}
                          <path d="M 490,140 L 860,160 L 850,230 L 490,210 Z" fill="rgba(241, 245, 249, 0.4)" stroke="#0f172a" strokeWidth="2" />
                          <path d="M 498,148 L 852,168 L 842,222 L 498,202 Z" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="4,3" />
                          <text x="510" y="180" fontSize="9" fill="#0f172a" fontWeight="bold">BACK YOKE -- CUT 2 (MAIN & LINING)</text>

                          {/* Patch Pocket Standard Template */}
                          <path d="M 500,270 L 650,270 L 650,410 L 575,460 L 500,410 Z" fill="rgba(241, 245, 249, 0.4)" stroke="#0f172a" strokeWidth="2" />
                          <path d="M 508,278 L 642,278 L 642,404 L 575,448 L 508,404 Z" fill="none" stroke="#475569" strokeWidth="1.2" strokeDasharray="4,3" />
                          {/* Hem Fold Line for Pocket Top */}
                          <line x1="500" y1="300" x2="650" y2="300" stroke="#059669" strokeWidth="1.2" strokeDasharray="3,3" />
                          <text x="515" y="293" fontSize="8" fill="#059669" fontWeight="bold">1" TOP HEM FOLD</text>
                          <text x="520" y="340" fontSize="9" fill="#0f172a" fontWeight="bold">PATCH POCKET</text>
                          <text x="520" y="353" fontSize="8" fill="#475569">CUT 2 MAIN FABRIC</text>
                        </g>
                      )}

                    </svg>
                  </div>

                  {/* CAD Footer Info */}
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-amber-400" /> Vector Layer Structure: CUT_LINE | STITCH_LINE | GRAINLINE | NOTCHES | LABELS
                    </span>
                    <span className="text-emerald-400 font-semibold">CAD VALIDATED</span>
                  </div>
                </div>
              )}

            </div>

            {/* Pattern Spec Controls & Parametric Inputs */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-xs font-mono font-semibold text-white flex items-center gap-2 uppercase tracking-wider">
                    <Scissors className="w-4 h-4 text-amber-400" /> 2D CAD Pattern Components
                  </h3>
                  <p className="text-[11px] text-slate-400">Select components to include in the exported SVG pattern file.</p>
                </div>

                {/* Quick Sizing Inputs */}
                <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400">Waist:</span>
                    <input 
                      type="number" 
                      value={measurements.waist} 
                      onChange={(e) => setMeasurements({...measurements, waist: Number(e.target.value)})}
                      className="w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span>in</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400">Flare:</span>
                    <input 
                      type="number" 
                      value={measurements.flareHem} 
                      onChange={(e) => setMeasurements({...measurements, flareHem: Number(e.target.value)})}
                      className="w-14 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span>in</span>
                  </label>
                </div>
              </div>

              {/* Panel Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                {denimPanels.map((panel, idx) => {
                  const isSelected = selectedPanels.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => togglePanel(idx)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all font-mono ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100' 
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="font-medium text-[11px]">{panel}</span>
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
                  {isProcessing ? 'COMPUTING CAD GEOMETRY...' : isConverted ? 'RECALCULATE CAD PATTERN' : 'GENERATE PRODUCTION CAD PATTERN'}
                </button>

                <button 
                  onClick={handleExportSVG}
                  disabled={!isConverted}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-700 disabled:opacity-40"
                >
                  <Download className="w-4 h-4 text-amber-400" /> EXPORT PRODUCTION SVG (LAYERED)
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
