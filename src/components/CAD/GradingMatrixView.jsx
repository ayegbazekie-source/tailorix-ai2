/**
 * TAILORIX AI — POINT-SPECIFIC GRADING MATRIX VIEW
 * Dedicated interface for inspecting and controlling multi-size grading rules and nested overlays.
 * Refined dark graphite aesthetic with champagne gold accents.
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
    <div className="w-full h-full bg-[#101112] p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto select-none">
      {/* Header */}
      <div className="bg-[#141517] p-4 rounded-2xl border border-[#222427] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F5F7]">Apparel Sizing & Point Grading Matrix</h2>
          <p className="text-xs text-[#8A8B93] mt-0.5">
            Vertex translation rules applied across the grading spectrum (Base Size: M).
          </p>
        </div>

        {/* Size Selection Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SIZE_SPECTRUM.map((size) => {
            const isActive = activeSizes.includes(size);
            const color = SIZE_PALETTE[size];
            return (
              <button
                key={size}
                onClick={() => onToggleSize(size)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#1C1D20] border-[#383A40] text-[#EDEDF0] shadow-sm'
                    : 'bg-[#141517] border-[#222427] text-[#6A6C75] opacity-50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                ></span>
                <span>{size}</span>
                {size === 'M' && <span className="text-[10px] font-normal text-[#C5A059]">(Base)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Nested Visualizer & Rule Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Nested Vector Visualizer (Warm Drafting Bed) */}
        <div className="lg:col-span-2 bg-[#F3F3F0] p-5 rounded-2xl border border-[#222427] flex flex-col shadow-panel">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E2DC] text-xs">
            <span className="font-semibold text-[#1A1B1D]">
              Nested Grade Overlay: {selectedPiece?.name || 'Pattern Piece'}
            </span>
            <span className="text-[#6B6D75] font-mono text-[11px]">
              Active: {activeSizes.join(', ')}
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            <svg viewBox="0 0 600 500" className="w-full h-full max-h-[440px]">
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
          <div className="flex items-center justify-center gap-4 pt-3 border-t border-[#E2E2DC] flex-wrap">
            {activeSizes.map((size) => (
              <div key={size} className="flex items-center gap-1.5 text-xs text-[#2A2B2E]">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SIZE_PALETTE[size] }}
                ></span>
                <span className="font-semibold">{size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vertex Grading Rules Table */}
        <div className="bg-[#141517] p-4 rounded-2xl border border-[#222427] shadow-panel flex flex-col">
          <h3 className="font-semibold text-xs text-[#EDEDF0] pb-2.5 border-b border-[#222427]">
            Grade Vectors ({selectedPiece?.name})
          </h3>

          <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
            {selectedPiece?.points && selectedPiece.points.length > 0 ? (
              selectedPiece.points.map((pt, idx) => (
                <div key={pt.id || idx} className="p-2.5 bg-[#18191B] border border-[#26282B] rounded-xl text-xs">
                  <div className="flex items-center justify-between font-semibold text-[#EDEDF0]">
                    <span>Vertex {idx + 1}</span>
                    <span className="text-[10px] text-[#C5A059] uppercase font-mono">{pt.type}</span>
                  </div>
                  <div className="text-[11px] text-[#8A8B93] mt-0.5">{pt.label || 'Boundary Node'}</div>
                  <div className="flex justify-between text-[11px] font-mono mt-1.5 text-[#EDEDF0] bg-[#121315] p-1.5 rounded-lg border border-[#222427]">
                    <span>ΔX: {pt.gradeRule?.dx ? `${pt.gradeRule.dx}"` : '0.00"'}</span>
                    <span>ΔY: {pt.gradeRule?.dy ? `${pt.gradeRule.dy}"` : '0.00"'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-[#6A6C75]">
                No points defined for this piece.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
