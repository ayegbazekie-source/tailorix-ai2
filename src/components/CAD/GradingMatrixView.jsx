/**
 * TAILORIX AI — POINT-SPECIFIC GRADING MATRIX VIEW
 * Dedicated interface for inspecting and controlling multi-size grading rules and nested overlays.
 */

import React from 'react';
import {
  SIZE_SPECTRUM,
  SIZE_PALETTE,
  SIZE_GRADE_MULTIPLIERS,
} from '../../utils/patternEngine/pointGradingEngine';
import { SlidersHorizontal, CheckSquare, Square, Layers } from 'lucide-react';

export default function GradingMatrixView({
  pieces = [],
  selectedPieceId = null,
  activeSizes = ['S', 'M', 'L', 'XL'],
  onToggleSize = () => {},
  gradedLayers = [],
}) {
  const selectedPiece = pieces.find((p) => p.id === selectedPieceId) || pieces[0];

  return (
    <div className="w-full h-full bg-[#f8fafc] p-6 flex flex-col gap-5 overflow-y-auto">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Apparel Sizing & Point Grading Matrix</h2>
          <p className="text-xs text-slate-500">
            Point-specific vertex translation rules applied across the sizing spectrum (Base Size: M).
          </p>
        </div>

        {/* Size Selection Chips */}
        <div className="flex items-center gap-2">
          {SIZE_SPECTRUM.map((size) => {
            const isActive = activeSizes.includes(size);
            const color = SIZE_PALETTE[size];
            return (
              <button
                key={size}
                onClick={() => onToggleSize(size)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white border-slate-300 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                ></span>
                <span>{size}</span>
                {size === 'M' && <span className="text-[9px] font-normal text-slate-400">(Base)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Nested Visualizer & Rule Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">
        {/* Nested Vector Visualizer */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-bold text-slate-800">
              Nested Grade Overlay: {selectedPiece?.name || 'Pattern Piece'}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Active Sizes: {activeSizes.join(', ')}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <svg viewBox="0 0 600 500" className="w-full h-full max-h-[480px]">
              {/* Render Graded Layers for Selected Piece */}
              {gradedLayers.map((layer) => {
                const p = layer.pieces.find((item) => item.id.startsWith(selectedPiece?.id));
                if (!p) return null;

                const isBase = layer.sizeKey === 'M';
                return (
                  <g key={layer.sizeKey}>
                    <path
                      d={p.path}
                      fill="none"
                      stroke={layer.color}
                      strokeWidth={isBase ? '2.5' : '1.5'}
                      strokeDasharray={isBase ? 'none' : '3,3'}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Color Key */}
          <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100">
            {activeSizes.map((size) => (
              <div key={size} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SIZE_PALETTE[size] }}
                ></span>
                <span className="font-semibold">{size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vertex Grading Rules Table */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <h3 className="font-bold text-xs text-slate-800 pb-2 border-b border-slate-100">
            Vertex Grade Rules ({selectedPiece?.name})
          </h3>

          <div className="flex-1 overflow-y-auto mt-2 space-y-2">
            {selectedPiece?.points && selectedPiece.points.length > 0 ? (
              selectedPiece.points.map((pt, idx) => (
                <div key={pt.id || idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>Vertex {idx + 1}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{pt.type}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{pt.label || 'Boundary Node'}</div>
                  <div className="flex justify-between text-[11px] font-mono mt-1.5 text-slate-700 bg-white p-1 rounded border border-slate-100">
                    <span>ΔX: {pt.gradeRule?.dx ? `${pt.gradeRule.dx}"` : '0.00"'}</span>
                    <span>ΔY: {pt.gradeRule?.dy ? `${pt.gradeRule.dy}"` : '0.00"'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No piece selected or points defined.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
