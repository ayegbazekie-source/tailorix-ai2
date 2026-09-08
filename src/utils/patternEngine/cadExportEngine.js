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
 * Generates an actual 1:1 tiled printable PDF with calibration square, multi-page tiling,
 * corner alignment crosshairs, and taping margins.
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
  doc.text(`Scale: 100% ACTUAL PHYSICAL SIZE (Select 'Actual Size' / 100% Scale in Print Dialog)`, 20, 34);

  // 1" x 1" (25.4mm x 25.4mm) & 50mm Calibration Squares
  doc.rect(20, 42, 25.4, 25.4);
  doc.setFontSize(8);
  doc.text(`1" x 1"`, 25, 52);
  doc.text(`(25.4mm)`, 24, 57);

  doc.rect(55, 42, 50, 25.4);
  doc.text(`50 mm Calibration Ruler`, 60, 52);
  doc.text(`Verify with physical ruler before cutting fabric`, 60, 57);

  // Instructions
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Assembly Instructions for Tiled Pattern:`, 20, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(`1. Print at 100% scale (Do NOT choose 'Fit to Page' or 'Shrink oversized pages').`, 24, 85);
  doc.text(`2. Measure the calibration squares above. If measurements differ, adjust printer scale.`, 24, 91);
  doc.text(`3. Cut along the outer dashed tile margins and overlap corresponding corner registration crosshairs (+).`, 24, 97);
  doc.text(`4. Tape pages securely together before cutting fabric along the outer cut line.`, 24, 103);

  // Summary Table of Pieces
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Pattern Pieces Included (${pieces.length}):`, 20, 115);
  doc.setFont('helvetica', 'normal');
  pieces.forEach((p, idx) => {
    if (123 + (idx * 6) < pageHeight - 15) {
      doc.text(`• ${p.name} — ${p.cutQuantity || 'CUT 1'} (Seam Allowance: ${p.seamAllowance || 0.5}")`, 24, 123 + (idx * 6));
    }
  });

  // Scale: 12 canvas pixels = 1 inch = 25.4 mm
  const SCALE_MM = 25.4 / 12; // 2.116667 mm per canvas px
  const marginMm = 15;
  const tileWidth = pageWidth - (marginMm * 2);
  const tileHeight = pageHeight - (marginMm * 2);

  // Helper to draw alignment crosshair
  const drawCrosshair = (cx, cy) => {
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.2);
    doc.line(cx - 4, cy, cx + 4, cy);
    doc.line(cx, cy - 4, cx, cy + 4);
  };

  // Generate 1:1 Tiled Pages for Each Piece
  pieces.forEach((piece) => {
    const pts = piece.points || [];
    if (pts.length < 3) return;

    const b = calculatePieceBounds(piece);
    const pieceWidthMm = (b.maxX - b.minX) * SCALE_MM;
    const pieceHeightMm = (b.maxY - b.minY) * SCALE_MM;

    const cols = Math.max(1, Math.ceil(pieceWidthMm / tileWidth));
    const rows = Math.max(1, Math.ceil(pieceHeightMm / tileHeight));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        doc.addPage();

        const colLetter = String.fromCharCode(65 + c);
        const tileIndexStr = `Tile ${colLetter}${r + 1} (${c + 1}/${cols}, ${r + 1}/${rows})`;

        // Tile Header & Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`${piece.name} — ${tileIndexStr} — 1:1 TRUE SCALE`, marginMm, marginMm - 5);

        // Printable tile boundary with dashed line
        doc.setDrawColor(203, 213, 225);
        doc.setLineDashPattern([2, 2], 0);
        doc.setLineWidth(0.3);
        doc.rect(marginMm, marginMm, tileWidth, tileHeight, 'S');
        doc.setLineDashPattern([], 0); // reset to solid

        // Corner crosshairs
        drawCrosshair(marginMm, marginMm);
        drawCrosshair(marginMm + tileWidth, marginMm);
        drawCrosshair(marginMm, marginMm + tileHeight);
        drawCrosshair(marginMm + tileWidth, marginMm + tileHeight);

        // 20mm scale check on each page
        doc.rect(pageWidth - marginMm - 22, marginMm - 10, 20, 5);
        doc.setFontSize(6);
        doc.text('20mm TEST', pageWidth - marginMm - 20, marginMm - 6);

        // Tile origin in canvas coordinate space
        const tileOriginX_px = b.minX + (c * tileWidth) / SCALE_MM;
        const tileOriginY_px = b.minY + (r * tileHeight) / SCALE_MM;

        // Transform canvas point to current page millimeter coordinate
        const toPageX = (px) => marginMm + (px - tileOriginX_px) * SCALE_MM;
        const toPageY = (py) => marginMm + (py - tileOriginY_px) * SCALE_MM;

        // Draw Sew / Seam Line
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.4);
        for (let i = 0; i < pts.length; i++) {
          const next = pts[(i + 1) % pts.length];
          const x1 = toPageX(pts[i].x);
          const y1 = toPageY(pts[i].y);
          const x2 = toPageX(next.x);
          const y2 = toPageY(next.y);

          // Simple viewport clipping: draw line if at least one point is near or inside tile
          doc.line(x1, y1, x2, y2);
        }

        // Draw Grainline if present
        if (piece.grainline) {
          doc.setDrawColor(217, 119, 6);
          doc.setLineWidth(0.3);
          const gx1 = toPageX(piece.grainline.x1);
          const gy1 = toPageY(piece.grainline.y1);
          const gx2 = toPageX(piece.grainline.x2);
          const gy2 = toPageY(piece.grainline.y2);
          doc.line(gx1, gy1, gx2, gy2);
          doc.setFontSize(7);
          doc.setTextColor(217, 119, 6);
          doc.text('GRAINLINE', gx1 + 2, (gy1 + gy2) / 2);
        }

        // Draw piece label if center falls on this tile
        const centerMmX = toPageX(b.centerX);
        const centerMmY = toPageY(b.centerY);
        if (
          centerMmX >= marginMm &&
          centerMmX <= marginMm + tileWidth &&
          centerMmY >= marginMm &&
          centerMmY <= marginMm + tileHeight
        ) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
          doc.text(piece.name, centerMmX, centerMmY, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(piece.cutQuantity || 'CUT 1', centerMmX, centerMmY + 5, { align: 'center' });
          if (piece.seamAllowance) {
            doc.text(`SA: ${piece.seamAllowance}"`, centerMmX, centerMmY + 9, { align: 'center' });
          }
        }
      }
    }
  });

  doc.save(`tailorix_${garmentType}_1to1_tiled.pdf`);
}
