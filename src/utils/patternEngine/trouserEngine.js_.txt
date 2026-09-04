/**
 * Tailorix Trouser & Shorts Pattern Engine
 * Calculates CAD vector paths based on standard measurement schemas and design parameters.
 */

export function draftTrouserPattern(measurements, parameters) {
  const {
    waist = 32,
    hip = 40,
    crotchDepth = 10.5,
    kneeHeight = 20,
    inseam = 32,
    kneeWidth = 16,
    hemWidth = 22, // Hem flare width
  } = measurements;

  const {
    seamAllowance = 0.5, // inches
    isShorts = false,
    shortsInseam = 8,
  } = parameters;

  // Scale factor for SVG drafting canvas (e.g., 1 inch = 12 SVG units)
  const SCALE = 12;

  // --- 1. FRONT LEG BLOCK CALCULATIONS ---
  const frontWaist = (waist / 4) + 0.5; // +0.5" ease
  const frontHip = (hip / 4) + 0.25;
  const frontCrotchExt = hip / 16; // Crotch extension formula
  const totalFrontWidth = frontHip + frontCrotchExt;
  
  const actualInseam = isShorts ? shortsInseam : inseam;
  const totalLength = crotchDepth + actualInseam;

  // Key Coordinates (Inches mapped to SVG pixels)
  const fWaistX = 50;
  const fWaistY = 50;
  
  // Front Path Construction using Smooth Bézier Curves
  const frontCutPath = `
    M ${fWaistX * SCALE},${fWaistY * SCALE}
    H ${(fWaistX + frontWaist) * SCALE}
    C ${(fWaistX + frontWaist + 0.5) * SCALE},${(fWaistY + 4) * SCALE} ${(fWaistX + frontHip) * SCALE},${(fWaistY + 7) * SCALE} ${(fWaistX + frontHip) * SCALE},${(fWaistY + crotchDepth) * SCALE}
    C ${(fWaistX + frontHip) * SCALE},${(fWaistY + crotchDepth + 2) * SCALE} ${(fWaistX + totalFrontWidth) * SCALE},${(fWaistY + crotchDepth) * SCALE} ${(fWaistX + totalFrontWidth) * SCALE},${(fWaistY + crotchDepth) * SCALE}
    L ${(fWaistX + (totalFrontWidth / 2) + (kneeWidth / 4)) * SCALE},${(fWaistY + kneeHeight) * SCALE}
    L ${(fWaistX + (totalFrontWidth / 2) + (hemWidth / 4)) * SCALE},${(fWaistY + totalLength) * SCALE}
    H ${(fWaistX + (totalFrontWidth / 2) - (hemWidth / 4)) * SCALE}
    L ${(fWaistX + (totalFrontWidth / 2) - (kneeWidth / 4)) * SCALE},${(fWaistY + kneeHeight) * SCALE}
    C ${(fWaistX + 0.5) * SCALE},${(fWaistY + crotchDepth) * SCALE} ${fWaistX * SCALE},${(fWaistY + 4) * SCALE} ${fWaistX * SCALE},${fWaistY * SCALE}
    Z
  `;

  // --- 2. BACK LEG BLOCK CALCULATIONS ---
  const backWaist = (waist / 4) + 1.25; // Includes back dart
  const backHip = (hip / 4) + 0.75;
  const backCrotchExt = hip / 8; // Deeper back crotch extension
  const totalBackWidth = backHip + backCrotchExt;

  const bWaistX = 350;
  const bWaistY = 50;

  const backCutPath = `
    M ${bWaistX * SCALE},${bWaistY * SCALE}
    H ${(bWaistX + backWaist) * SCALE}
    C ${(bWaistX + backWaist + 1) * SCALE},${(bWaistY + 4) * SCALE} ${(bWaistX + backHip) * SCALE},${(bWaistY + 7) * SCALE} ${(bWaistX + backHip) * SCALE},${(bWaistY + crotchDepth) * SCALE}
    C ${(bWaistX + backHip) * SCALE},${(bWaistY + crotchDepth + 3) * SCALE} ${(bWaistX + totalBackWidth) * SCALE},${(bWaistY + crotchDepth) * SCALE} ${(bWaistX + totalBackWidth) * SCALE},${(bWaistY + crotchDepth) * SCALE}
    L ${(bWaistX + (totalBackWidth / 2) + (kneeWidth / 4) + 0.5) * SCALE},${(bWaistY + kneeHeight) * SCALE}
    L ${(bWaistX + (totalBackWidth / 2) + (hemWidth / 4) + 0.5) * SCALE},${(bWaistY + totalLength) * SCALE}
    H ${(bWaistX + (totalBackWidth / 2) - (hemWidth / 4) - 0.5) * SCALE}
    L ${(bWaistX + (totalBackWidth / 2) - (kneeWidth / 4) - 0.5) * SCALE},${(bWaistY + kneeHeight) * SCALE}
    C ${(bWaistX - 1) * SCALE},${(bWaistY + crotchDepth) * SCALE} ${bWaistX * SCALE},${(bWaistY + 4) * SCALE} ${bWaistX * SCALE},${bWaistY * SCALE}
    Z
  `;

  return {
    pieces: [
      {
        id: 'FRONT_LEG',
        name: 'FRONT LEG BLOCK',
        cutQuantity: 'CUT 2 (PAIR)',
        path: frontCutPath,
        grainline: { x1: (fWaistX + totalFrontWidth / 2) * SCALE, y1: (fWaistY + 3) * SCALE, x2: (fWaistX + totalFrontWidth / 2) * SCALE, y2: (fWaistY + totalLength - 2) * SCALE },
        notches: [
          { x: (fWaistX + totalFrontWidth) * SCALE, y: (fWaistY + crotchDepth) * SCALE },
          { x: (fWaistX + (totalFrontWidth / 2) + (kneeWidth / 4)) * SCALE, y: (fWaistY + kneeHeight) * SCALE }
        ]
      },
      {
        id: 'BACK_LEG',
        name: 'BACK LEG BLOCK',
        cutQuantity: 'CUT 2 (PAIR)',
        path: backCutPath,
        grainline: { x1: (bWaistX + totalBackWidth / 2) * SCALE, y1: (bWaistY + 3) * SCALE, x2: (bWaistX + totalBackWidth / 2) * SCALE, y2: (bWaistY + totalLength - 2) * SCALE },
        notches: [
          { x: (bWaistX + totalBackWidth) * SCALE, y: (bWaistY + crotchDepth) * SCALE },
          { x: (bWaistX + (totalBackWidth / 2) + (kneeWidth / 4) + 0.5) * SCALE, y: (bWaistY + kneeHeight) * SCALE }
        ]
      }
    ]
  };
}
