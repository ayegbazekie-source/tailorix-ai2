/**
 * TAILORIX AI — DYNAMIC APPAREL MEASUREMENT DOCK
 * Bottom drawer exposing parametric body measurements tailored specifically
 * to the active garment family. Compact expandable dark graphite dock.
 */

import React, { useState } from 'react';
import { Sliders, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { getMeasurementsForGarment, fromCanonical, toCanonical } from '../../models/measurementDefinitions';

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
    <div className="bg-[#141517] border-t border-[#222427] shadow-panel z-10 shrink-0 select-none">
      {/* Dock Bar Header (Compact) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-[#18191B] text-xs font-medium text-[#EDEDF0] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
          <span className="font-semibold text-xs">Parametric Dimensions ({schema.length})</span>
          <span className="text-[11px] text-[#8A8B93] hidden sm:inline">
            • Real-time vector re-computation
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResetMeasurements();
            }}
            className="text-[11px] text-[#8A8B93] hover:text-[#C5A059] flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-[#202225]"
            title="Reset to industry standard proportions"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Standard Proportions</span>
          </button>
          <div className="w-6 h-6 rounded-lg bg-[#1D1E21] border border-[#2A2B2E] flex items-center justify-center text-[#8A8B93]">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Expandable Measurement Input Grid */}
      {isOpen && (
        <div className="p-3 sm:p-4 bg-[#111214] border-t border-[#202225] max-h-56 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {schema.map((item) => {
              const k = item.id || item.key;
              const defValInInches = item.defaultVal ?? item.default ?? 30;
              const canonicalInches = measurements[k] ?? defValInInches;

              // Convert canonical inches to active display unit
              const displayVal = fromCanonical(canonicalInches, units);
              const displayMin = fromCanonical(item.min, units);
              const displayMax = fromCanonical(item.max, units);
              const displayStd = fromCanonical(defValInInches, units);

              return (
                <div key={k} className="bg-[#18191B] p-2.5 rounded-xl border border-[#28292D] hover:border-[#383A40] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-[#8A8B93] truncate" title={item.label}>
                      {item.label}
                    </label>
                    <span className="text-[10px] font-mono text-[#C5A059] uppercase">{units}</span>
                  </div>
                  <input
                    type="number"
                    step={units === 'cm' ? '0.5' : '0.25'}
                    min={displayMin}
                    max={displayMax}
                    value={displayVal}
                    onChange={(e) => {
                      const inputNum = parseFloat(e.target.value);
                      if (!isNaN(inputNum)) {
                        const newCanonicalInches = toCanonical(inputNum, units);
                        onChangeMeasurement(k, newCanonicalInches);
                      }
                    }}
                    className="w-full text-xs font-mono font-bold px-2 py-1 bg-[#121315] border border-[#28292D] rounded-lg text-[#F5F5F7] focus:outline-none focus:border-[#C5A059]/60"
                  />
                  <div className="text-[9px] text-[#6A6C75] mt-1 font-mono">
                    Std: {displayStd} ({displayMin}–{displayMax})
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
