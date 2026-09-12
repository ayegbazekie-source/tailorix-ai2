/**
 * TAILORIX AI — CAD PROPERTIES & PIECE INSPECTOR PANEL
 * Right-side panel displaying piece inventory, seam allowance tuning, piece geometry,
 * and pattern validation diagnostics. Refined dark graphite surface.
 */

import React, { useState } from 'react';
import { Layers, ShieldCheck, AlertTriangle, Info, Sliders, Scissors, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { validatePatternPieces } from '../../utils/patternEngine/patternValidator';

export default function CADPropertiesPanel({
  pieces = [],
  selectedPieceId = null,
  onSelectPiece = () => {},
  onUpdatePieceSeamAllowance = () => {},
  onDuplicatePiece = () => {},
  onDeletePiece = () => {},
  units = 'in',
  onOpenAdvancedOptions = () => {},
}) {
  const [activeTab, setActiveTab] = useState('pieces'); // 'pieces' | 'inspector' | 'validation'

  const selectedPiece = pieces.find((p) => p.id === selectedPieceId);
  const validationReport = validatePatternPieces(pieces);

  return (
    <div className="w-80 bg-[#141517] border-l border-[#222427] flex flex-col h-full shadow-panel z-10 shrink-0 select-none">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#222427] bg-[#121315] text-xs font-semibold p-1 gap-1">
        <button
          onClick={() => setActiveTab('pieces')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            activeTab === 'pieces'
              ? 'bg-[#1C1D20] text-[#E5C07B] border border-[#2E3034] shadow-xs'
              : 'text-[#8A8B93] hover:text-[#EDEDF0] hover:bg-[#18191B]'
          }`}
        >
          Pieces ({pieces.length})
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            activeTab === 'inspector'
              ? 'bg-[#1C1D20] text-[#E5C07B] border border-[#2E3034] shadow-xs'
              : 'text-[#8A8B93] hover:text-[#EDEDF0] hover:bg-[#18191B]'
          }`}
        >
          Inspector
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'validation'
              ? 'bg-[#1C1D20] text-[#E5C07B] border border-[#2E3034] shadow-xs'
              : 'text-[#8A8B93] hover:text-[#EDEDF0] hover:bg-[#18191B]'
          }`}
        >
          <span>Audit</span>
          {validationReport.summary.errors > 0 ? (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          ) : validationReport.summary.warnings > 0 ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          )}
        </button>
      </div>

      {/* Tab 1: Pattern Pieces Inventory */}
      {activeTab === 'pieces' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {pieces.map((piece) => {
            const isSelected = piece.id === selectedPieceId;
            return (
              <div
                key={piece.id}
                onClick={() => onSelectPiece(piece.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#C5A059]/60 bg-[#1C1D1A] shadow-gold-sm'
                    : 'border-[#242629] bg-[#18191B] hover:border-[#33353A] hover:bg-[#1B1D1F]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-xs ${isSelected ? 'text-[#F5F5F7]' : 'text-[#EDEDF0]'}`}>
                    {piece.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#202225] border border-[#2A2C30] text-[#8A8B93]">
                    {piece.category || 'Shell'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8A8B93] mt-1.5">
                  <span>{piece.cutQuantity}</span>
                  <span className="font-mono text-[#C5A059]">Edge: +{piece.seamAllowance ?? 0.5}"</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Selected Piece Inspector */}
      {activeTab === 'inspector' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedPiece ? (
            <>
              <div>
                <label className="text-[11px] font-semibold text-[#8A8B93] block mb-1">
                  Piece Identifier
                </label>
                <input
                  type="text"
                  value={selectedPiece.name}
                  readOnly
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-[#18191B] border border-[#28292D] rounded-lg text-[#EDEDF0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-[#8A8B93] block mb-1">
                    Layer
                  </label>
                  <span className="block px-2.5 py-1.5 bg-[#18191B] border border-[#28292D] rounded-lg font-mono text-[#EDEDF0]">
                    {selectedPiece.category}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#8A8B93] block mb-1">
                    Cutting
                  </label>
                  <span className="block px-2.5 py-1.5 bg-[#18191B] border border-[#28292D] rounded-lg font-mono text-[#EDEDF0] truncate">
                    {selectedPiece.cutQuantity}
                  </span>
                </div>
              </div>

              {/* Seam Allowance Control */}
              <div className="bg-[#18191B] p-3 rounded-xl border border-[#28292D]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#8A8B93]">
                    Extra Sewing Edge ({units})
                  </label>
                  <span className="text-xs font-mono font-bold text-[#C5A059]">
                    +{selectedPiece.seamAllowance ?? 0.5}"
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.125"
                  value={selectedPiece.seamAllowance ?? 0.5}
                  onChange={(e) => onUpdatePieceSeamAllowance(selectedPiece.id, parseFloat(e.target.value))}
                  className="w-full accent-[#C5A059] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#6A6C75] font-mono mt-1">
                  <span>0"</span>
                  <span>0.5" (Std)</span>
                  <span>1.0"</span>
                  <span>1.5"</span>
                </div>
              </div>

              {/* Geometry Dimensions */}
              {selectedPiece.bounds && (
                <div className="p-3 bg-[#18191B] border border-[#28292D] rounded-xl text-xs space-y-2">
                  <div className="font-semibold text-[#EDEDF0]">Dimensions & Nodes</div>
                  <div className="flex justify-between text-[#8A8B93]">
                    <span>Bounding Width:</span>
                    <span className="font-mono font-semibold text-[#EDEDF0]">{(selectedPiece.bounds.width / 12).toFixed(2)}"</span>
                  </div>
                  <div className="flex justify-between text-[#8A8B93]">
                    <span>Bounding Height:</span>
                    <span className="font-mono font-semibold text-[#EDEDF0]">{(selectedPiece.bounds.height / 12).toFixed(2)}"</span>
                  </div>
                  <div className="flex justify-between text-[#8A8B93]">
                    <span>Points / Nodes:</span>
                    <span className="font-mono font-semibold text-[#EDEDF0]">{selectedPiece.points?.length || 0} vertices</span>
                  </div>
                </div>
              )}

              {/* Advanced Tailor Options Button */}
              <button
                onClick={onOpenAdvancedOptions}
                className="w-full py-2 px-3 bg-[#1A1C20] hover:bg-[#222429] border border-[#2D2F36] hover:border-amber-500/40 text-amber-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Advanced Tailor Options...</span>
              </button>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => onDuplicatePiece(selectedPiece.id)}
                  className="flex-1 py-1.5 px-2 bg-[#1E2023] hover:bg-[#25282C] border border-[#2D2F33] text-[#EDEDF0] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => onDeletePiece(selectedPiece.id)}
                  className="py-1.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-medium flex items-center justify-center transition-colors"
                  title="Delete piece"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-[#6A6C75] text-xs">
              Select a pattern piece from the canvas to inspect and modify dimensions.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Manufacturing Compliance & Audit */}
      {activeTab === 'validation' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="p-3 bg-[#18191B] border border-[#28292D] rounded-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#EDEDF0]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{validationReport.summary.status}</span>
            </div>
            <div className="text-[11px] text-[#8A8B93] mt-1">
              {validationReport.summary.errors} errors, {validationReport.summary.warnings} warnings detected
            </div>
          </div>

          <div className="space-y-2">
            {validationReport.issues.length === 0 ? (
              <div className="text-center py-8 text-emerald-400 text-xs font-medium flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 opacity-80" />
                <span>All pattern pieces pass industrial CAD checks.</span>
              </div>
            ) : (
              validationReport.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-2.5 rounded-xl border text-xs text-left ${
                    issue.type === 'error'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : issue.type === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    {issue.type === 'error' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="capitalize">{issue.type}</span>
                  </div>
                  <div>{issue.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
