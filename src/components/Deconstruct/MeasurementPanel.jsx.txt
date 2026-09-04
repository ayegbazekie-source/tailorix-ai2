import React from 'react';
import { Sliders, Ruler } from 'lucide-react';

export default function MeasurementPanel({ category, measurements, setMeasurements, parameters, setParameters }) {
  const handleChange = (field, value) => {
    setMeasurements((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleParamChange = (field, value) => {
    setParameters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 font-mono text-slate-100">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
        <Ruler className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
          {category} Spec Adjustments (Inches)
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(category === 'trouser' || category === 'shorts') && (
          <>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">WAIST</label>
              <input type="number" step="0.5" value={measurements.waist || 32} onChange={(e) => handleChange('waist', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">HIP</label>
              <input type="number" step="0.5" value={measurements.hip || 40} onChange={(e) => handleChange('hip', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">CROTCH DEPTH</label>
              <input type="number" step="0.25" value={measurements.crotchDepth || 10.5} onChange={(e) => handleChange('crotchDepth', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">INSEAM</label>
              <input type="number" step="0.5" value={measurements.inseam || 32} onChange={(e) => handleChange('inseam', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">KNEE WIDTH</label>
              <input type="number" step="0.5" value={measurements.kneeWidth || 16} onChange={(e) => handleChange('kneeWidth', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">HEM BOTTOM</label>
              <input type="number" step="0.5" value={measurements.hemWidth || 22} onChange={(e) => handleChange('hemWidth', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
          </>
        )}

        {category === 'shirt' && (
          <>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">CHEST / BUST</label>
              <input type="number" step="0.5" value={measurements.bustChest || 38} onChange={(e) => handleChange('bustChest', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">SHOULDER</label>
              <input type="number" step="0.5" value={measurements.shoulderWidth || 17} onChange={(e) => handleChange('shoulderWidth', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">SHIRT LENGTH</label>
              <input type="number" step="0.5" value={measurements.shirtLength || 28} onChange={(e) => handleChange('shirtLength', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">SLEEVE LENGTH</label>
              <input type="number" step="0.5" value={measurements.sleeveLength || 24} onChange={(e) => handleChange('sleeveLength', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-none" />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-amber-400" /> SEAM ALLOWANCE:
        </span>
        <select value={parameters.seamAllowance || 0.5} onChange={(e) => handleParamChange('seamAllowance', parseFloat(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 outline-none">
          <option value={0.25}>0.25 in (6mm)</option>
          <option value={0.5}>0.50 in (12mm)</option>
          <option value={0.75}>0.75 in (19mm)</option>
          <option value={1.0}>1.00 in (25mm)</option>
        </select>
      </div>
    </div>
  );
}
