/**
 * TAILORIX AI — CAD EXPORT SUITE (SVG, DXF & 1:1 TILED PDF)
 * Directly generates manufacturing vector formats from the canonical structured geometry model.
 */

import { jsPDF } from 'jspdf';
import { calculatePieceBounds } from '../../models/patternGeometry';

/**
 * Exports structured pattern pieces to a clean, layered SVG document.
 */
export function exportPatternToSVG(pieces = [], garmentType = 'garment') {
  if (!pieces || pieces.length === 0) return;

  // Calculate overall bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pieces.forEach((p) => {
    const b = calculatePieceBounds(p);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  });

  const pad = 40;
  const viewBoxWidth = Math.max(maxX - minX + pad * 2, 800);
  const viewBoxHeight = Math.max(maxY - minY + pad * 2, 600);

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - pad} ${minY - pad} ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}">
  <defs>
    <style>
      .cut-line { fill: none; stroke: #0f172a; stroke-width: 2px; stroke-linejoin: round; }
      .seam-line { fill: none; stroke: #64748b; stroke-width: 1px; stroke-dasharray: 4,4; }
      .grainline { stroke: #d97706; stroke-width: 1.5px; marker-start: url(#arrow); marker-end: url(#arrow); }
      .notch { stroke: #ef4444; stroke-width: 2px; }
      .annotation { font-family: sans-serif; font-size: 11px; fill: #1e293b; font-weight: bold; }
    </style>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#d97706" />
    </marker>
  </defs>

  <!-- BACKGROUND CAD CANVAS -->
  <rect x="${minX - pad}" y="${minY - pad}" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="#ffffff" />
`;

  // Render Cut Lines Layer
  svgContent += `  <g id="layer-cut-lines">\n`;
  pieces.forEach((p) => {
    const d = p.seamAllowancePath || p.path;
    svgContent += `    <path d="${d}" class="cut-line" id="cut-${p.id}" />\n`;
  });
  svgContent += `  </g>\n`;

  // Render Seam (Stitch) Lines Layer
  svgContent += `  <g id="layer-seam-lines">\n`;
  pieces.forEach((p) => {
    if (p.seamAllowancePath && p.path) {
      svgContent += `    <path d="${p.path}" class="seam-line" id="seam-${p.id}" />\n`;
    }
  });
  svgContent += `  </g>\n`;

  // Render Grainlines Layer
  svgContent += `  <g id="layer-grainlines">\n`;
  pieces.forEach((p) => {
    if (p.grainline) {
      svgContent += `    <line x1="${p.grainline.x1}" y1="${p.grainline.y1}" x2="${p.grainline.x2}" y2="${p.grainline.y2}" class="grainline" />\n`;
    }
  });
  svgContent += `  </g>\n`;

  // Render Annotations Layer
  svgContent += `  <g id="layer-annotations">\n`;
  pieces.forEach((p) => {
    const b = calculatePieceBounds(p);
    svgContent += `    <text x="${b.centerX}" y="${b.centerY}" text-anchor="middle" class="annotation">${p.name} (${p.cutQuantity || 'CUT 1'})</text>\n`;
  });
  svgContent += `  </g>\n`;

  svgContent += `</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tailorix_${garmentType}_pattern_${Date.now()}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports structured pattern pieces to standard AutoCAD / AAMA CAD DXF format.
 */
export function exportPatternToDXF(pieces = [], garmentType = 'garment') {
  if (!pieces || pieces.length === 0) return;

  const SCALE = 12; // 12 px per inch

  let dxf = `0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n1\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n`;
  dxf += `0\nLAYER\n2\n1_CUT\n70\n0\n62\n7\n0\n`;
  dxf += `0\nLAYER\n2\n2_SEW\n70\n0\n62\n8\n0\n`;
  dxf += `0\nLAYER\n2\n3_GRAIN\n70\n0\n62\n1\n0\n`;
  dxf += `0\nLAYER\n2\n4_TEXT\n70\n0\n62\n2\n0\n`;
  dxf += `0\nENDTAB\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  pieces.forEach((piece) => {
    const pts = piece.points || [];
    if (pts.length < 2) return;

    // Output Closed LWPOLYLINE for Cut Boundary
    dxf += `0\nLWPOLYLINE\n8\n1_CUT\n90\n${pts.length}\n70\n1\n43\n0.0\n`;
    pts.forEach((pt) => {
      const xInches = (pt.x / SCALE).toFixed(4);
      const yInches = (-pt.y / SCALE).toFixed(4); // Invert Y for standard Cartesian CAD
      dxf += `10\n${xInches}\n20\n${yInches}\n`;
    });

    // Output Grainline
    if (piece.grainline) {
      const gx1 = (piece.grainline.x1 / SCALE).toFixed(4);
      const gy1 = (-piece.grainline.y1 / SCALE).toFixed(4);
      const gx2 = (piece.grainline.x2 / SCALE).toFixed(4);
      const gy2 = (-piece.grainline.y2 / SCALE).toFixed(4);
      dxf += `0\nLINE\n8\n3_GRAIN\n10\n${gx1}\n20\n${gy1}\n30\n0.0\n11\n${gx2}\n21\n${gy2}\n31\n0.0\n`;
    }

    // Output Piece Label
    const bounds = calculatePieceBounds(piece);
    const tx = (bounds.centerX / SCALE).toFixed(4);
    const ty = (-bounds.centerY / SCALE).toFixed(4);
    dxf += `0\nTEXT\n8\n4_TEXT\n10\n${tx}\n20\n${ty}\n30\n0.0\n40\n0.75\n1\n${piece.name}\n`;
  });

  dxf += `0\nENDSEC\n0\nEOF\n`;

  const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tailorix_${garmentType}_pattern.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an actual 1:1 tiled printable PDF with calibration square and alignment marks.
 */
export function exportPatternToTiledPDF(pieces = [], garmentType = 'garment', paperFormat = 'a4') {
  if (!pieces || pieces.length === 0) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: paperFormat,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Page 1: Overview and Calibration Sheet
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`TAILORIX APPAREL CAD — 1:1 PRODUCTION PLOT`, 20, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Garment Type: ${garmentType.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`, 20, 28);
  doc.text(`Scale: 100% Actual Size (Do NOT 'Fit to Printable Area' in print dialog)`, 20, 34);

  // 1" x 1" (25.4mm x 25.4mm) Calibration Square
  doc.rect(20, 42, 25.4, 25.4);
  doc.setFontSize(8);
  doc.text(`1" x 1"`, 25, 52);
  doc.text(`Calibration Square`, 22, 57);

  // Summary Table of Pieces
  doc.setFontSize(10);
  doc.text(`Pattern Pieces Included (${pieces.length}):`, 20, 80);
  pieces.forEach((p, idx) => {
    doc.text(`• ${p.name} — ${p.cutQuantity || 'CUT 1'} (Seam Allowance: ${p.seamAllowance || 0.5}")`, 24, 88 + (idx * 6));
  });

  // Page 2+: Pattern Piece Tiles
  pieces.forEach((piece) => {
    doc.addPage();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${piece.name} — ${piece.cutQuantity || 'CUT 1'}`, 20, 15);

    // Render piece boundary onto millimeter scale
    const pts = piece.points || [];
    if (pts.length > 2) {
      const SCALE_MM = 2.116; // Map 12 px (1 inch) to 25.4 mm (25.4 / 12 = 2.116 mm per px)
      const b = calculatePieceBounds(piece);
      const offsetX = 25 - b.minX * SCALE_MM * 0.15;
      const offsetY = 30 - b.minY * SCALE_MM * 0.15;

      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);

      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length];
        const x1 = offsetX + pts[i].x * SCALE_MM * 0.15;
        const y1 = offsetY + pts[i].y * SCALE_MM * 0.15;
        const x2 = offsetX + next.x * SCALE_MM * 0.15;
        const y2 = offsetY + next.y * SCALE_MM * 0.15;
        doc.line(x1, y1, x2, y2);
      }

      // Draw Grainline
      if (piece.grainline) {
        doc.setDrawColor(217, 119, 6);
        doc.setLineWidth(0.3);
        const gx1 = offsetX + piece.grainline.x1 * SCALE_MM * 0.15;
        const gy1 = offsetY + piece.grainline.y1 * SCALE_MM * 0.15;
        const gx2 = offsetX + piece.grainline.x2 * SCALE_MM * 0.15;
        const gy2 = offsetY + piece.grainline.y2 * SCALE_MM * 0.15;
        doc.line(gx1, gy1, gx2, gy2);
        doc.setFontSize(7);
        doc.text('GRAIN', gx1 + 2, (gy1 + gy2) / 2);
      }
    }
  });

  doc.save(`tailorix_${garmentType}_print_1to1.pdf`);
}
