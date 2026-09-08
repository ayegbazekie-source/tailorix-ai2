/**
 * TAILORIX AI — CAD HEADER & WORKSPACE CONTROL BAR
 * Refined dark graphite application toolbar featuring Garment Taxonomy selector,
 * Workspace Mode switcher, Units toggle, Undo/Redo, and Production Vector Export.
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
  Save,
  Check,
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
  onSaveProject = () => {},
  onExportSVG = () => {},
  onExportDXF = () => {},
  onExportPDF = () => {},
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const viewModes = [
    { id: 'cad', label: 'CAD Canvas', icon: Layers },
    { id: 'grading', label: 'Grading Nest', icon: SlidersHorizontal },
    { id: 'marker', label: 'Fabric Marker', icon: FileText },
    { id: '3d', label: '3D Fit', icon: Box },
  ];

  const handleSave = () => {
    onSaveProject();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <header className="h-12 bg-[#141517] border-b border-[#222427] px-3 sm:px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Garment Taxonomy Selector & Project Info */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[#8A8B93] hidden md:inline">Pattern:</span>
          <select
            value={garmentType}
            onChange={(e) => onChangeGarmentType(e.target.value)}
            className="bg-[#1A1B1E] border border-[#2A2C30] hover:border-[#383A40] text-[#EDEDF0] text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C5A059]/60 cursor-pointer transition-colors"
          >
            {Object.entries(GARMENT_TAXONOMY).map(([key, item]) => (
              <option key={key} value={item.id} className="bg-[#18191B] text-[#EDEDF0]">
                {item.displayName || item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Workspace View Switcher (Segmented Control) */}
      <div className="flex bg-[#1A1B1E] p-1 rounded-xl border border-[#282A2E] gap-0.5">
        {viewModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeViewMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onChangeViewMode(mode.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#C5A059]/15 border border-[#C5A059]/35 text-[#E5C07B] font-semibold shadow-gold-sm'
                  : 'text-[#9E9EA7] hover:text-[#EDEDF0] hover:bg-[#222427] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E5C07B]' : 'text-[#8A8B93]'}`} />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controls & Export Trigger */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 mr-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8A8B93] hover:text-[#EDEDF0] hover:bg-[#202225] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8A8B93] hover:text-[#EDEDF0] hover:bg-[#202225] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Units Toggle */}
        <button
          onClick={onToggleUnits}
          className="text-[11px] font-mono font-semibold px-2 py-1 rounded-md bg-[#1C1D20] hover:bg-[#25272B] border border-[#2A2B2E] text-[#C5A059] uppercase transition-colors"
          title="Toggle Inches / Metric"
        >
          {units}
        </button>

        {/* Save Draft */}
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-[#1C1D20] hover:bg-[#25272B] text-[#EDEDF0] font-medium text-xs px-2.5 py-1.5 rounded-lg border border-[#2A2B2E] hover:border-[#383A3E] transition-colors"
          title="Save project draft"
        >
          {savedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-emerald-400">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-[#8A8B93]" />
              <span className="hidden sm:inline">Save</span>
            </>
          )}
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 bg-[#C5A059] hover:bg-[#D4AF37] active:bg-[#B38F46] text-[#101112] font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 mt-1.5 w-52 bg-[#17181A] border border-[#2D2E32] rounded-xl shadow-floating py-1.5 z-50 text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setShowExportMenu(false)}
            >
              <button
                onClick={onExportSVG}
                className="w-full text-left px-3.5 py-2 hover:bg-[#202226] text-[#EDEDF0] flex items-center justify-between transition-colors"
              >
                <span>Production Vector SVG</span>
                <span className="text-[10px] text-[#C5A059] font-mono">.svg</span>
              </button>
              <button
                onClick={onExportDXF}
                className="w-full text-left px-3.5 py-2 hover:bg-[#202226] text-[#EDEDF0] flex items-center justify-between transition-colors"
              >
                <span>AutoCAD / AAMA DXF</span>
                <span className="text-[10px] text-[#8A8B93] font-mono">.dxf</span>
              </button>
              <button
                onClick={onExportPDF}
                className="w-full text-left px-3.5 py-2 hover:bg-[#202226] text-[#EDEDF0] flex items-center justify-between transition-colors"
              >
                <span>Tiled 1:1 Print Sheet</span>
                <span className="text-[10px] text-[#8A8B93] font-mono">.pdf</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
