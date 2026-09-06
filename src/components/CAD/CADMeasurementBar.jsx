/**
 * TAILORIX AI — DYNAMIC APPAREL MEASUREMENT DOCK
 * Bottom drawer exposing parametric body measurements tailored specifically
 * to the active garment family (Trouser, Shirt, Knit, Jacket, Skirt).
 */

import React, { useState } from 'react';
import { Sliders, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { getMeasurementsForGarment } from '../../models/measurementDefinitions';

export default function CADMeasurementBar({
  garmentType = 'trouser',
  measurements = {},
  onChangeMeasurement = () => {},
  onResetMeasurements = () => {},
  units = 'in',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const schema = getMeasurementsForGarment(garmentType);

  return (
    <div className="bg-white border-t border-slate-200 shadow-sm z-10 shrink-0">
      {/* Dock Bar Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 text-xs font-semibold text-slate-700"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-amber-600" />
          <span>Parametric Measurements ({schema.length} parameters)</span>
          <span className="text-[11px] text-slate-400 font-normal">
            • Modifying re-computes pattern geometry in real time
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResetMeasurements();
            }}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
            title="Reset to industry standard proportions"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Standard Proportions</span>
          </button>
          {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expandable Measurement Input Grid */}
      {isOpen && (
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 max-h-56 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {schema.map((item) => {
              const k = item.id || item.key;
              const defVal = item.defaultVal ?? item.default ?? 30;
              const val = measurements[k] ?? defVal;
              return (
                <div key={k} className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 truncate" title={item.label}>
                      {item.label}
                    </label>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{units}</span>
                  </div>
                  <input
                    type="number"
                    step="0.25"
                    min={item.min}
                    max={item.max}
                    value={val}
                    onChange={(e) => onChangeMeasurement(k, parseFloat(e.target.value) || item.min)}
                    className="w-full text-xs font-mono font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="text-[9px] text-slate-400 mt-1">
                    Std: {defVal} ({item.min}–{item.max})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
