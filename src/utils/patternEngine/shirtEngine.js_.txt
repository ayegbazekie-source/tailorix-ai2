/**
 * Tailorix Shirt & Blouse Pattern Engine
 */

export function draftShirtPattern(measurements, parameters) {
  const {
    bustChest = 38,
    neckCircumference = 15.5,
    shoulderWidth = 17,
    shirtLength = 28,
    sleeveLength = 24,
  } = measurements;

  const SCALE = 12;

  // --- DRAFTING FORMULAS ---
  const neckWidth = neckCircumference / 6;
  const neckDepthFront = (neckCircumference / 6) + 0.5;
  const scyeDepth = (bustChest / 8) + 4.5; // Armhole depth line
  const chestQuarter = (bustChest / 4) + 1.5; // +1.5" wearing ease
  const shoulderHalf = shoulderWidth / 2;

  // Front Bodice Path
  const fX = 40;
  const fY = 40;

  const frontBodicePath = `
    M ${fX * SCALE},${fY * SCALE}
    A ${(neckWidth) * SCALE} ${(neckDepthFront) * SCALE} 0 0 0 ${(fX + neckWidth) * SCALE},${(fY + neckDepthFront) * SCALE}
    L ${(fX + shoulderHalf) * SCALE},${(fY + neckDepthFront + 1.5) * SCALE}
    C ${(fX + shoulderHalf) * SCALE},${(fY + scyeDepth - 1) * SCALE} ${(fX + chestQuarter - 1) * SCALE},${(fY + scyeDepth) * SCALE} ${(fX + chestQuarter) * SCALE},${(fY + scyeDepth) * SCALE}
    L ${(fX + chestQuarter) * SCALE},${(fY + shirtLength) * SCALE}
    H ${fX * SCALE}
    Z
  `;

  // Sleeve Cap Path
  const sleeveCapHeight = scyeDepth * 0.75;
  const bicepWidth = (bustChest / 3) + 2;
  const slX = 350;
  const slY = 40;

  const sleevePath = `
    M ${slX * SCALE},${(slY + sleeveCapHeight) * SCALE}
    C ${(slX + bicepWidth * 0.25) * SCALE},${slY * SCALE} ${(slX + bicepWidth * 0.75) * SCALE},${slY * SCALE} ${(slX + bicepWidth) * SCALE},${(slY + sleeveCapHeight) * SCALE}
    L ${(slX + bicepWidth - 1.5) * SCALE},${(slY + sleeveLength) * SCALE}
    H ${(slX + 1.5) * SCALE}
    Z
  `;

  return {
    pieces: [
      {
        id: 'FRONT_BODICE',
        name: 'SHIRT FRONT BODICE',
        cutQuantity: 'CUT 2 (LEFT & RIGHT)',
        path: frontBodicePath,
        grainline: { x1: (fX + 2) * SCALE, y1: (fY + 5) * SCALE, x2: (fX + 2) * SCALE, y2: (fY + shirtLength - 2) * SCALE }
      },
      {
        id: 'SLEEVE',
        name: 'SET-IN SLEEVE',
        cutQuantity: 'CUT 2 (PAIR)',
        path: sleevePath,
        grainline: { x1: (slX + bicepWidth / 2) * SCALE, y1: (slY + 2) * SCALE, x2: (slX + bicepWidth / 2) * SCALE, y2: (slY + sleeveLength - 2) * SCALE }
      }
    ]
  };
}
