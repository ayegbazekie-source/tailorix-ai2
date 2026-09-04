/**
 * Tailorix Gown & Dress Pattern Engine
 */

export function draftGownPattern(measurements, parameters) {
  const {
    bust = 36,
    waist = 28,
    hip = 38,
    shoulderToWaist = 16.5,
    fullGownLength = 58,
  } = measurements;

  const {
    silhouette = 'mermaid', // 'a_line', 'ballgown', 'mermaid', 'sheath'
    hemSweep = 28, // Hem flare extension
  } = parameters;

  const SCALE = 12;

  // --- DRAFTING FORMULAS ---
  const bustQuarter = (bust / 4) + 0.5;
  const waistQuarter = (waist / 4) + 0.75; // Includes waist dart
  const hipQuarter = (hip / 4) + 0.25;
  
  const kneeY = shoulderToWaist + 19; // Standard knee line
  const skirtLength = fullGownLength - shoulderToWaist;

  // Mermaid contour adjustment
  const kneeTightening = silhouette === 'mermaid' ? 1.5 : 0;

  // --- 1. FULL FRONT GOWN BLOCK ---
  const fX = 40;
  const fY = 40;

  const frontGownPath = `
    M ${fX * SCALE},${fY * SCALE}
    C ${(fX + 2.5) * SCALE},${fY * SCALE} ${(fX + 3) * SCALE},${(fY + 2.5) * SCALE} ${(fX + 3) * SCALE},${(fY + 3) * SCALE}
    L ${(fX + 7.5) * SCALE},${(fY + 2) * SCALE}
    C ${(fX + 7.5) * SCALE},${(fY + 6) * SCALE} ${(fX + bustQuarter - 0.5) * SCALE},${(fY + 7.5) * SCALE} ${(fX + bustQuarter) * SCALE},${(fY + 8) * SCALE}
    C ${(fX + bustQuarter) * SCALE},${(fY + 12) * SCALE} ${(fX + waistQuarter + 0.5) * SCALE},${(fY + shoulderToWaist - 2) * SCALE} ${(fX + waistQuarter) * SCALE},${(fY + shoulderToWaist) * SCALE}
    C ${(fX + hipQuarter + 0.5) * SCALE},${(fY + shoulderToWaist + 8) * SCALE} ${(fX + hipQuarter) * SCALE},${(fY + shoulderToWaist + 9) * SCALE} ${(fX + hipQuarter) * SCALE},${(fY + shoulderToWaist + 9) * SCALE}
    L ${(fX + hipQuarter - kneeTightening) * SCALE},${(fY + kneeY) * SCALE}
    L ${(fX + hipQuarter + hemSweep) * SCALE},${(fY + fullGownLength) * SCALE}
    H ${fX * SCALE}
    Z
  `;

  return {
    pieces: [
      {
        id: 'FRONT_GOWN',
        name: `FULL FRONT GOWN PANELS (${silhouette.toUpperCase()})`,
        cutQuantity: 'CUT 1 ON FOLD',
        path: frontGownPath,
        grainline: { x1: (fX + 2) * SCALE, y1: (fY + 5) * SCALE, x2: (fX + 2) * SCALE, y2: (fY + fullGownLength - 5) * SCALE }
      }
    ]
  };
}
