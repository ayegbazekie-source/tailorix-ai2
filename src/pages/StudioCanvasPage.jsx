/**
 * TAILORIX AI — STUDIO CANVAS PAGE
 * Feature A: The main interactive cutting board, drafting playground, and pre-sewing digital workplace.
 * Directly receives pattern piece objects exported from the Garment Deconstruct analyzer tool.
 */

import React from 'react';
import AutodeskSketchCADPlayground from '../components/StudioCanvas/AutodeskSketchCADPlayground';

export default function StudioCanvasPage() {
  return (
    <div className="w-full h-full bg-[#101112] text-slate-100 overflow-hidden">
      <AutodeskSketchCADPlayground defaultMode="sketch" />
    </div>
  );
}


