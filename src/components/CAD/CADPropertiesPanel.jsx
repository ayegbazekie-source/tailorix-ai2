/**
 * TAILORIX AI — CAD PROPERTIES & PIECE INSPECTOR PANEL
 * Right-side panel displaying piece list, seam allowance tuning, piece metadata,
 * and pattern validation diagnostics.
 */

import React, { useState } from 'react';
import { Layers, ShieldCheck, AlertTriangle, Info, Sliders, Scissors, Copy, Trash2 } from 'lucide-react';
import { validatePatternPieces } from '../../utils/patternEngine/patternValidator';

export default function CADPropertiesPanel({
  pieces = [],
  selectedPieceId = null,
  onSelectPiece = () => {},
  onUpdatePieceSeamAllowance = () => {},
  onDuplicatePiece = () => {},
  onDeletePiece = () => {},
  units = 'in',
}) {
  const [activeTab, setActiveTab] = useState('pieces'); // 'pieces' | 'inspector' | 'validation'

  const selectedPiece = pieces.find((p) => p.id === selectedPieceId);
  const validationReport = validatePatternPieces(pieces);

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shadow-sm z-10 shrink-0">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pieces')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'pieces'
              ? 'border-amber-500 text-slate-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Pieces ({pieces.length})
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
            activeTab === 'inspector'
              ? 'border-amber-500 text-slate-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Inspector
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex-1 py-2.5 text-center border-b-2 flex items-center justify-center gap-1 transition-colors ${
            activeTab === 'validation'
              ? 'border-amber-500 text-slate-900 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Audit</span>
          {validationReport.summary.errors > 0 ? (
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          ) : validationReport.summary.warnings > 0 ? (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900">{piece.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {piece.category || 'Shell'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{piece.cutQuantity}</span>
                  <span>SA: {piece.seamAllowance ?? 0.5}"</span>
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
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Piece Name
                </label>
                <input
                  type="text"
                  value={selectedPiece.name}
                  readOnly
                  className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <span className="block px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700">
                    {selectedPiece.category}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Cut Instruction
                  </label>
                  <span className="block px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700">
                    {selectedPiece.cutQuantity}
                  </span>
                </div>
              </div>

              {/* Seam Allowance Control */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Seam Allowance ({units})
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {selectedPiece.seamAllowance ?? 0.5}"
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.125"
                  value={selectedPiece.seamAllowance ?? 0.5}
                  onChange={(e) => onUpdatePieceSeamAllowance(selectedPiece.id, parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>0"</span>
                  <span>0.5" (Standard)</span>
                  <span>1.0"</span>
                  <span>1.5"</span>
                </div>
              </div>

              {/* Geometry Dimensions */}
              {selectedPiece.bounds && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="font-bold text-slate-700">Geometry Properties</div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bounding Width:</span>
                    <span className="font-mono font-semibold">{(selectedPiece.bounds.width / 12).toFixed(2)}"</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bounding Height:</span>
                    <span className="font-mono font-semibold">{(selectedPiece.bounds.height / 12).toFixed(2)}"</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Boundary Vertices:</span>
                    <span className="font-mono font-semibold">{selectedPiece.points?.length || 0} nodes</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => onDuplicatePiece(selectedPiece.id)}
                  className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => onDeletePiece(selectedPiece.id)}
                  className="py-1.5 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium flex items-center justify-center"
                  title="Delete piece"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              Select a pattern piece from the canvas or list to inspect and modify properties.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Manufacturing Compliance & Audit */}
      {activeTab === 'validation' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{validationReport.summary.status}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {validationReport.summary.errors} errors, {validationReport.summary.warnings} warnings
            </div>
          </div>

          <div className="space-y-2">
            {validationReport.issues.length === 0 ? (
              <div className="text-center py-6 text-emerald-600 text-xs font-medium">
                ✓ All pattern pieces pass manufacturing checks.
              </div>
            ) : (
              validationReport.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-2.5 rounded-lg border text-xs text-left ${
                    issue.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-900'
                      : issue.type === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : 'border-sky-200 bg-sky-50 text-sky-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    {issue.type === 'error' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-amber-600" />
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
