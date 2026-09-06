/**
 * TAILORIX AI — PDF PRINT ENGINE
 * Generates true 1:1 tiled printable PDF documents from canonical structured geometry.
 */

import { exportPatternToTiledPDF } from './patternEngine/cadExportEngine';

export function generateTiledPrintPDF(cadData, category = 'garment', pageSize = 'A4') {
  if (!cadData) return;
  const pieces = cadData.pieces || (Array.isArray(cadData) ? cadData : []);
  exportPatternToTiledPDF(pieces, category, pageSize.toLowerCase());
}
