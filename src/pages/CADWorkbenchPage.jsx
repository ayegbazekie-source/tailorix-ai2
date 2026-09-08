/**
 * TAILORIX AI — CAD WORKBENCH PAGE
 * Parametric grading, node-level vertex manipulation, fabric yield nesting, and 3D simulation.
 */

import React from 'react';
import AutodeskSketchCADPlayground from '../components/StudioCanvas/AutodeskSketchCADPlayground';

export default function CADWorkbenchPage() {
  return (
    <div className="w-full h-full bg-[#101112] text-slate-100 overflow-hidden">
      <AutodeskSketchCADPlayground defaultMode="cad" />
    </div>
  );
}

