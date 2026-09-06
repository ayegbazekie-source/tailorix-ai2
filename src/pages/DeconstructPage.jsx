/**
 * TAILORIX AI — MASTER GARMENT CAD & DECONSTRUCT PAGE
 * Direct entry point to the unified authoritative apparel workbench.
 */

import React from 'react';
import DeconstructWorkbench from '../components/Deconstruct/DeconstructWorkbench';

export default function DeconstructPage() {
  return (
    <div className="w-full h-full bg-[#f8fafc] text-slate-900">
      <DeconstructWorkbench />
    </div>
  );
}
