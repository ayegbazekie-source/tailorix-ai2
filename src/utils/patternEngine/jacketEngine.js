/**
 * Tailorix Tailored Jacket Pattern Engine
 */

export function draftJacketPattern(measurements, parameters) {
  const {
    chest = 40,
    waist = 34,
    shoulderWidth = 18,
    jacketLength = 30,
    sleeveLength = 25,
  } = measurements;

  const {
    lapelWidth = 3.25,
    wearingEase = 3.5, // Built-in outerwear ease
  } = parameters;

  const SCALE = 12;

  // --- DRAFTING FORMULAS ---
  const chestQuarter = (chest + wearingEase) / 4;
  const waistQuarter = (waist + wearingEase) / 4;
  const scyeDepth = (chest / 8) + 5.5; // Lowered armhole for jackets
  const shoulderHalf = (shoulderWidth / 2) + 0.25;

  // --- 1. FRONT JACKET BODY WITH LAPEL EXTENSION ---
  const fX = 40;
  const fY = 40;
  const lapelBreakY = fY + 10; // Button point height

  const frontJacketPath = `
    M ${fX * SCALE},${fY * SCALE}
    L ${(fX + lapelWidth) * SCALE},${(fY - 1) * SCALE}
    L ${(fX + lapelWidth + 2) * SCALE},${lapelBreakY * SCALE}
    L ${(fX + chestQuarter) * SCALE},${(fY + scyeDepth) * SCALE}
    C ${(fX + chestQuarter) * SCALE},${(fY + scyeDepth + 4) * SCALE} ${(fX + waistQuarter) * SCALE},${(fY + 18) * SCALE} ${(fX + waistQuarter) * SCALE},${(fY + 20) * SCALE}
    L ${(fX + chestQuarter + 0.5) * SCALE},${(fY + jacketLength) * SCALE}
    H ${fX * SCALE}
    Z
  `;

  // --- 2. TWO-PIECE SLEEVE (TOP SLEEVE BLOCK) ---
  const slX = 360;
  const slY = 40;
  const bicepWidth = (chest / 3) + 3;

  const topSleevePath = `
    M ${slX * SCALE},${(slY + scyeDepth * 0.7) * SCALE}
    C ${(slX + bicepWidth * 0.3) * SCALE},${slY * SCALE} ${(slX + bicepWidth * 0.8) * SCALE},${slY * SCALE} ${(slX + bicepWidth) * SCALE},${(slY + scyeDepth * 0.7) * SCALE}
    C ${(slX + bicepWidth - 0.5) * SCALE},${(slY + 14) * SCALE} ${(slX + bicepWidth - 1) * SCALE},${(slY + 20) * SCALE} ${(slX + bicepWidth - 1.5) * SCALE},${(slY + sleeveLength) * SCALE}
    H ${(slX + 1.5) * SCALE}
    C ${(slX + 0.5) * SCALE},${(slY + 20) * SCALE} ${slX * SCALE},${(slY + 14) * SCALE} ${slX * SCALE},${(slY + scyeDepth * 0.7) * SCALE}
    Z
  `;

  return {
    pieces: [
      {
        id: 'FRONT_JACKET',
        name: 'JACKET FRONT (WITH LAPEL)',
        cutQuantity: 'CUT 2 MAIN / CUT 2 FACING',
        path: frontJacketPath,
        grainline: { x1: (fX + 5) * SCALE, y1: (fY + 6) * SCALE, x2: (fX + 5) * SCALE, y2: (fY + jacketLength - 3) * SCALE }
      },
      {
        id: 'TOP_SLEEVE',
        name: 'OUTER TWO-PIECE SLEEVE',
        cutQuantity: 'CUT 2 (PAIR)',
        path: topSleevePath,
        grainline: { x1: (slX + bicepWidth / 2) * SCALE, y1: (slY + 3) * SCALE, x2: (slX + bicepWidth / 2) * SCALE, y2: (slY + sleeveLength - 3) * SCALE }
      }
    ]
  };
}
