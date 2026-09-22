import React, { useState } from 'react';
import { X, Sliders, Download, Check, ShieldAlert, Cpu, Sparkles, ChevronRight } from 'lucide-react';

export default function AdvancedTailorDrawer({
  isOpen,
  onClose,
  selectedPiece,
  onUpdateSeamAllowance,
  onExportDXF,
  units = 'in'
}) {
  const [dxfStandard, setDxfStandard] = useState('ASTM_AAMA');
  const [notchDepth, setNotchDepth] = useState('0.25');
  const [cornerType, setCornerType] = useState('mitered');
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    if (onExportDXF) {
      onExportDXF({
        standard: dxfStandard,
        notchDepth: parseFloat(notchDepth),
        cornerType
      });
    }
    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#131417] border-l border-[#26282E] h-full flex flex-col shadow-2xl text-slate-100 select-none animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#23252A] flex items-center justify-between bg-[#16171B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-medium">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Advanced Tailor Options
              </h3>
              <p className="text-[11px] text-slate-400">
                Precision DXF export, seam offset & node coordinates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 drawer-scroll-effect p-4 space-y-5 text-xs touch-pan-y">
          
          {/* Section 1: Industrial CAD / DXF Export Configuration */}
          <div className="bg-[#181A1E] border border-[#26282E] rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-amber-400" />
                AutoCAD / AAMA DXF Export
              </span>
              <span className="text-[10px] font-mono text-amber-400/90 uppercase px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                Plotter Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Export standard 2D vector CAD drawings compatible with Gerber Accumark, Lectra Modaris, Optitex, and industrial CNC fabric cutters.
            </p>

            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Standard Protocol</label>
                <select
                  value={dxfStandard}
                  onChange={(e) => setDxfStandard(e.target.value)}
                  className="w-full bg-[#121316] border border-[#2B2D33] text-slate-200 rounded-xl px-3 py-2 text-xs focus:border-amber-400 focus:outline-hidden"
                >
                  <option value="ASTM_AAMA">AAMA / ASTM D6673 (Apparel Standard)</option>
                  <option value="AUTOCAD_R14">AutoCAD Release 14 DXF (Generic CNC)</option>
                  <option value="LECTRA_IBA">Lectra IBA Plotter Format</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-medium">Notch Slit Depth</label>
                  <select
                    value={notchDepth}
                    onChange={(e) => setNotchDepth(e.target.value)}
                    className="w-full bg-[#121316] border border-[#2B2D33] text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:border-amber-400 focus:outline-hidden font-mono"
                  >
                    <option value="0.125">1/8" (3mm slit)</option>
                    <option value="0.25">1/4" (6mm standard)</option>
                    <option value="0.375">3/8" (10mm deep)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1 font-medium">Corner Join Rule</label>
                  <select
                    value={cornerType}
                    onChange={(e) => setCornerType(e.target.value)}
                    className="w-full bg-[#121316] border border-[#2B2D33] text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:border-amber-400 focus:outline-hidden"
                  >
                    <option value="mitered">Mitered (Sharp)</option>
                    <option value="rounded">Rounded Edge</option>
                    <option value="cutback">Cutback / Chamfer</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {exportedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950" />
                    <span>DXF Generated & Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Production DXF (.dxf)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Seam Offset Settings */}
          <div className="bg-[#181A1E] border border-[#26282E] rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Exact Seam Offset Tuning</span>
              <span className="text-[10px] font-mono text-slate-400">
                Current: {selectedPiece?.seamAllowance ?? 0.5}"
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fine-tune the extra sewing edge allowance for delicate fabrics, French seams, or heavy wool outerwear.
            </p>

            {selectedPiece ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.0625"
                    value={selectedPiece.seamAllowance ?? 0.5}
                    onChange={(e) => onUpdateSeamAllowance && onUpdateSeamAllowance(selectedPiece.id, parseFloat(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <span className="font-mono font-bold text-amber-400 w-14 text-right">
                    {selectedPiece.seamAllowance ?? 0.5}"
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[0.25, 0.375, 0.5, 0.625].map((val) => (
                    <button
                      key={val}
                      onClick={() => onUpdateSeamAllowance && onUpdateSeamAllowance(selectedPiece.id, val)}
                      className={`py-1 rounded-lg font-mono text-[10px] transition-colors border ${
                        selectedPiece.seamAllowance === val
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-[#121316] border-[#2A2C32] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val === 0.25 ? '1/4"' : val === 0.375 ? '3/8"' : val === 0.5 ? '1/2"' : '5/8"'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic py-2">
                Click a pattern piece on the canvas to adjust its individual seam allowance.
              </div>
            )}
          </div>

          {/* Section 3: Raw Node Coordinate Inspector */}
          <div className="bg-[#181A1E] border border-[#26282E] rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Raw Node Coordinates & Vertices
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {selectedPiece?.points?.length || 0} Nodes
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mathematical coordinates representing the polygon geometry in 1:1 vector space.
            </p>

            {selectedPiece?.points && selectedPiece.points.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                {selectedPiece.points.map((pt, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#121316] border border-[#282A30] rounded-xl flex items-center justify-between text-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-[#1B1D22] border border-slate-700/60 flex items-center justify-center text-[10px] text-amber-400 font-bold">
                        {idx + 1}
                      </span>
                      <span className="capitalize text-[10px] text-slate-400">
                        {pt.type || 'Vertex'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>X: <strong className="text-slate-100">{Math.round(pt.x)}</strong></span>
                      <span>Y: <strong className="text-slate-100">{Math.round(pt.y)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic py-2">
                No active vertex nodes to inspect. Select a pattern piece to view coordinates.
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-[#23252A] bg-[#16171B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1F2127] hover:bg-[#272930] text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Advanced Options
          </button>
        </div>

      </div>
    </div>
  );
}
