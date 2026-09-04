import React from 'react';
import { Download, FileCode, Printer, RefreshCw } from 'lucide-react';
import { exportToSVG, exportToDXF } from '../../utils/exportUtils';
import { generateTiledPrintPDF } from '../../utils/pdfPrintEngine';

export default function CADToolbar({
  selectedCategory,
  setSelectedCategory,
  cadData,
  resetMeasurements,
}) {
  const categories = ['trouser', 'shirt', 'skirt', 'jacket', 'gown'];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 font-mono flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Category Selectors */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all border whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/10'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Export & Print Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <button
          onClick={resetMeasurements}
          className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-amber-400 transition-all text-xs flex items-center gap-1"
          title="Reset Measurements to Default"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={() => generateTiledPrintPDF(cadData, selectedCategory, 'A4')}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Tiled</span>
        </button>

        <button
          onClick={() => exportToSVG(cadData, selectedCategory)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>SVG</span>
        </button>

        <button
          onClick={() => exportToDXF(cadData, selectedCategory)}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>DXF</span>
        </button>
      </div>
    </div>
  );
}
