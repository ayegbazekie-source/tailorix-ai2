/**
 * TAILORIX AI — EXPORT UTILITIES
 * Wraps canonical CAD export engine using structured geometry.
 */

import { exportPatternToSVG, exportPatternToDXF } from './patternEngine/cadExportEngine';

export function exportToSVG(cadData, category = 'garment') {
  if (!cadData) return;
  const pieces = cadData.pieces || (Array.isArray(cadData) ? cadData : []);
  exportPatternToSVG(pieces, category);
}

export function exportToDXF(cadData, category = 'garment') {
  if (!cadData) return;
  const pieces = cadData.pieces || (Array.isArray(cadData) ? cadData : []);
  exportPatternToDXF(pieces, category);
}
