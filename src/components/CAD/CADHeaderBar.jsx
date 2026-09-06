/**
 * TAILORIX AI — CAD HEADER & WORKSPACE CONTROL BAR
 * Top application bar featuring Garment Specification selector, Workspace Mode switcher,
 * Units toggle, Undo/Redo, and Production Vector Export triggers.
 */

import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  RotateCw,
  Box,
  Layers,
  FileText,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { GARMENT_TAXONOMY } from '../../models/garmentTaxonomy';

export default function CADHeaderBar({
  garmentType,
  onChangeGarmentType = () => {},
  units,
  onToggleUnits = () => {},
  activeViewMode,
  onChangeViewMode = () => {},
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {},
  onExportSVG = () => {},
  onExportDXF = () => {},
  onExportPDF = () => {},
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const viewModes = [
    { id: 'cad', label: 'CAD Canvas', icon: Layers },
    { id: 'grading', label: 'Grading Nest', icon: SlidersHorizontal },
    { id: 'marker', label: 'Fabric Marker', icon: FileText },
    { id: '3d', label: '3D Simulation', icon: Box },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-xs z-20 shrink-0">
      {/* Brand & Garment Taxonomy Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-sm">
            TX
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 hidden sm:inline">
            TAILORIX <span className="text-amber-600 font-semibold">CAD</span>
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Garment Selector */}
        <select
          value={garmentType}
          onChange={(e) => onChangeGarmentType(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
        >
          {Object.entries(GARMENT_TAXONOMY).map(([key, item]) => (
            <option key={key} value={item.id}>
              {item.displayName || item.name}
            </option>
          ))}
        </select>
      </div>

      {/* Primary Workspace View Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-0.5">
        {viewModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeViewMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onChangeViewMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls & Export Trigger */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-1 mr-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Units Toggle */}
        <button
          onClick={onToggleUnits}
          className="text-xs font-mono font-bold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 uppercase"
          title="Toggle Inches / Metric"
        >
          {units}
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs font-medium"
              onClick={() => setShowExportMenu(false)}
            >
              <button
                onClick={onExportSVG}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
              >
                <span>Production SVG</span>
                <span className="text-[10px] text-slate-400 font-mono">.svg</span>
              </button>
              <button
                onClick={onExportDXF}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
              >
                <span>AutoCAD / AAMA DXF</span>
                <span className="text-[10px] text-slate-400 font-mono">.dxf</span>
              </button>
              <button
                onClick={onExportPDF}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
              >
                <span>Tiled 1:1 Print PDF</span>
                <span className="text-[10px] text-slate-400 font-mono">.pdf</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
