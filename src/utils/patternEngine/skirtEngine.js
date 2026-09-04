/**
 * Tailorix Skirt Pattern Engine
 * Standard 2-Dart Base Block with A-Line & Sweep Expansion Math
 */

export function draftSkirtPattern(measurements, parameters) {
  const {
    waist = 28,
    hip = 38,
    hipDepth = 8,
    skirtLength = 26,
  } = measurements;

  const {
    style = 'a_line', // 'straight', 'a_line', 'flared'
    flareExtension = 3.5, // Sweep addition in inches
  } = parameters;

  const SCALE = 12;

  // --- DRAFTING FORMULAS ---
  // Front: 1 Dart (0.625" intake), Back: 2 Darts (1.25" total intake)
  const frontWaistArc = (waist / 4) + 0.625;
  const frontHipArc = (hip / 4) + 0.25; // +0.25" ease
  
  const backWaistArc = (waist / 4) + 1.25;
  const backHipArc = (hip / 4) + 0.25;

  const sweepAddition = style === 'straight' ? 0 : style === 'a_line' ? flareExtension : flareExtension * 1.8;

  // --- 1. FRONT SKIRT BLOCK ---
  const fX = 40;
  const fY = 40;

  const frontPath = `
    M ${fX * SCALE},${fY * SCALE}
    H ${(fX + frontWaistArc) * SCALE}
    C ${(fX + frontWaistArc + 0.5) * SCALE},${(fY + 3) * SCALE} ${(fX + frontHipArc) * SCALE},${(fY + hipDepth - 1) * SCALE} ${(fX + frontHipArc) * SCALE},${(fY + hipDepth) * SCALE}
    L ${(fX + frontHipArc + sweepAddition) * SCALE},${(fY + skirtLength) * SCALE}
    H ${fX * SCALE}
    Z
  `;

  // --- 2. BACK SKIRT BLOCK ---
  const bX = 320;
  const bY = 40;

  const backPath = `
    M ${bX * SCALE},${bY * SCALE}
    H ${(bX + backWaistArc) * SCALE}
    C ${(bX + backWaistArc + 0.5) * SCALE},${(bY + 3) * SCALE} ${(bX + backHipArc) * SCALE},${(bY + hipDepth - 1) * SCALE} ${(bX + backHipArc) * SCALE},${(bY + hipDepth) * SCALE}
    L ${(bX + backHipArc + sweepAddition) * SCALE},${(bY + skirtLength) * SCALE}
    H ${bX * SCALE}
    Z
  `;

  return {
    pieces: [
      {
        id: 'FRONT_SKIRT',
        name: `FRONT SKIRT (${style.toUpperCase()})`,
        cutQuantity: 'CUT 1 ON FOLD',
        path: frontPath,
        grainline: { x1: (fX + 3) * SCALE, y1: (fY + 4) * SCALE, x2: (fX + 3) * SCALE, y2: (fY + skirtLength - 3) * SCALE }
      },
      {
        id: 'BACK_SKIRT',
        name: `BACK SKIRT (${style.toUpperCase()})`,
        cutQuantity: 'CUT 2 (PAIR)',
        path: backPath,
        grainline: { x1: (bX + 4) * SCALE, y1: (bY + 4) * SCALE, x2: (bX + 4) * SCALE, y2: (bY + skirtLength - 3) * SCALE }
      }
    ]
  };
}
