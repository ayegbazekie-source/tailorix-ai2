/**
 * TAILORIX AI — PRODUCTION JACKET & BLAZER BLOCK ENGINE
 * Tailored outerwear drafting: Front Jacket with Lapel, Side Body Panel,
 * Back Panel with Vent, Two-Piece Sleeve (Top & Under), and Collar.
 */

import { createPatternPiece, createPoint } from '../../models/patternGeometry';

export function draftJacketPattern(measurements = {}, parameters = {}, garmentSpec = {}) {
  const {
    bustChest = 40,
    waist = 35,
    shoulderWidth = 18.25,
    jacketLength = 30,
    sleeveLength = 25.25,
    lapelWidth = 3.25,
  } = measurements;

  const {
    seamAllowance = 0.5,
  } = parameters;

  const SCALE = 12;

  // Outerwear ease (+5" chest ease)
  const chestTotal = bustChest + 5.0;
  const frontWidth = (chestTotal * 0.32);
  const sideWidth = (chestTotal * 0.18);
  const backWidth = (chestTotal * 0.25);
  const scyeDepth = (bustChest / 8) + 5.5;

  // --- 1. FRONT JACKET PANEL ---
  const fx0 = 40;
  const fy0 = 40;

  const frontPoints = [
    createPoint(fx0 * SCALE, (fy0 + 8) * SCALE, 'corner', { label: 'Lapel Peak Point' }),
    createPoint((fx0 + lapelWidth) * SCALE, (fy0 + 7) * SCALE, 'corner', { label: 'Gorge Notch' }),
    createPoint((fx0 + 3.5) * SCALE, fy0 * SCALE, 'smooth', {
      label: 'Collar Neck Step',
      cp1: { x: (fx0 + 2) * SCALE, y: (fy0 + 3) * SCALE },
      cp2: { x: (fx0 + 3) * SCALE, y: (fy0 + 1) * SCALE },
    }),
    createPoint((fx0 + shoulderWidth * 0.5) * SCALE, (fy0 + 2.5) * SCALE, 'corner', { label: 'Shoulder Point' }),
    createPoint((fx0 + frontWidth) * SCALE, (fy0 + scyeDepth) * SCALE, 'smooth', {
      label: 'Front Scye Curve',
      cp1: { x: (fx0 + shoulderWidth * 0.5 - 0.75) * SCALE, y: (fy0 + scyeDepth * 0.6) * SCALE },
      cp2: { x: (fx0 + frontWidth - 1) * SCALE, y: (fy0 + scyeDepth) * SCALE },
      notch: 'v_notch',
    }),
    createPoint((fx0 + frontWidth - 0.5) * SCALE, (fy0 + jacketLength) * SCALE, 'corner', { label: 'Side Hem' }),
    createPoint((fx0 + 1.5) * SCALE, (fy0 + jacketLength + 0.5) * SCALE, 'smooth', {
      label: 'Curved Front Hem Quarters',
      cp1: { x: (fx0 + frontWidth * 0.3) * SCALE, y: (fy0 + jacketLength + 0.5) * SCALE },
      cp2: { x: (fx0 + 1.5) * SCALE, y: (fy0 + jacketLength) * SCALE },
    }),
    createPoint(fx0 * SCALE, (fy0 + 16) * SCALE, 'corner', { label: 'Bottom Button Stance' }),
  ];

  const frontJacketPiece = createPatternPiece({
    id: 'JACKET_FRONT_PANEL',
    name: 'JACKET FOREPART (FRONT)',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: frontPoints,
    seamAllowance,
    grainline: {
      x1: (fx0 + 3) * SCALE,
      y1: (fy0 + 4) * SCALE,
      x2: (fx0 + 3) * SCALE,
      y2: (fy0 + jacketLength - 3) * SCALE,
      label: 'FRONT GRAINLINE',
    },
    internalLines: [
      {
        type: 'line',
        x1: (fx0 + 3.5) * SCALE,
        y1: fy0 * SCALE,
        x2: fx0 * SCALE,
        y2: (fy0 + 12) * SCALE,
        label: 'Roll / Break Line',
      },
      {
        type: 'line',
        x1: (fx0 + 4) * SCALE,
        y1: (fy0 + 9) * SCALE,
        x2: (fx0 + 8.5) * SCALE,
        y2: (fy0 + 8.75) * SCALE,
        label: 'Barchetta Welt Pocket (4.5")',
      },
    ],
  });

  // --- 2. SIDE BODY PANEL (SIDE FOREPART) ---
  const sx0 = 220;
  const sy0 = 40;

  const sidePoints = [
    createPoint(sx0 * SCALE, (sy0 + scyeDepth) * SCALE, 'corner', { label: 'Side Scye Front' }),
    createPoint((sx0 + sideWidth) * SCALE, (sy0 + scyeDepth) * SCALE, 'corner', { label: 'Side Scye Back' }),
    createPoint((sx0 + sideWidth) * SCALE, (sy0 + jacketLength) * SCALE, 'corner', { label: 'Side Back Hem' }),
    createPoint(sx0 * SCALE, (sy0 + jacketLength) * SCALE, 'corner', { label: 'Side Front Hem' }),
  ];

  const sidePanelPiece = createPatternPiece({
    id: 'JACKET_SIDE_PANEL',
    name: 'JACKET SIDE BODY PANEL',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: sidePoints,
    seamAllowance,
    grainline: {
      x1: (sx0 + sideWidth * 0.5) * SCALE,
      y1: (sy0 + scyeDepth + 2) * SCALE,
      x2: (sx0 + sideWidth * 0.5) * SCALE,
      y2: (sy0 + jacketLength - 2) * SCALE,
      label: 'GRAINLINE',
    },
  });

  // --- 3. BACK JACKET PANEL ---
  const bx0 = 340;
  const by0 = 40;

  const backPoints = [
    createPoint(bx0 * SCALE, by0 * SCALE, 'corner', { label: 'Center Back Neck' }),
    createPoint((bx0 + 3.25) * SCALE, (by0 + 0.75) * SCALE, 'corner', { label: 'Back Shoulder' }),
    createPoint((bx0 + backWidth) * SCALE, (by0 + 2.5) * SCALE, 'corner', { label: 'Shoulder Point' }),
    createPoint((bx0 + backWidth) * SCALE, (by0 + scyeDepth) * SCALE, 'smooth', {
      label: 'Back Scye Base',
      cp1: { x: (bx0 + backWidth - 0.5) * SCALE, y: (by0 + scyeDepth * 0.6) * SCALE },
      cp2: { x: (bx0 + backWidth) * SCALE, y: (by0 + scyeDepth) * SCALE },
      notch: 'v_notch',
    }),
    createPoint((bx0 + backWidth) * SCALE, (by0 + jacketLength) * SCALE, 'corner', { label: 'Back Side Hem' }),
    createPoint(bx0 * SCALE, (by0 + jacketLength) * SCALE, 'corner', { label: 'Center Back Hem' }),
  ];

  const backPanelPiece = createPatternPiece({
    id: 'JACKET_BACK_PANEL',
    name: 'JACKET BACK PANEL',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: backPoints,
    seamAllowance,
    grainline: {
      x1: (bx0 + 2) * SCALE,
      y1: (by0 + 2) * SCALE,
      x2: (bx0 + 2) * SCALE,
      y2: (by0 + jacketLength - 3) * SCALE,
      label: 'CENTER BACK GRAIN',
    },
    internalLines: [
      {
        type: 'line',
        x1: bx0 * SCALE,
        y1: (by0 + jacketLength - 9) * SCALE,
        x2: (bx0 + 1.5) * SCALE,
        y2: (by0 + jacketLength - 9) * SCALE,
        label: 'Vent Overlap Mark (9")',
      },
    ],
  });

  // --- 4. TOP SLEEVE (TWO-PIECE) ---
  const slx0 = 460;
  const sly0 = 40;
  const topSleeveWidth = 10.5;

  const topSleevePoints = [
    createPoint(slx0 * SCALE, (sly0 + 4) * SCALE, 'corner', { label: 'Top Underarm Front' }),
    createPoint((slx0 + topSleeveWidth * 0.5) * SCALE, sly0 * SCALE, 'smooth', {
      label: 'Top Sleeve Crown',
      cp1: { x: (slx0 + topSleeveWidth * 0.2) * SCALE, y: sly0 * SCALE },
      cp2: { x: (slx0 + topSleeveWidth * 0.4) * SCALE, y: sly0 * SCALE },
      notch: 'v_notch',
    }),
    createPoint((slx0 + topSleeveWidth) * SCALE, (sly0 + 4) * SCALE, 'corner', { label: 'Top Underarm Back' }),
    createPoint((slx0 + topSleeveWidth - 1.5) * SCALE, (sly0 + sleeveLength) * SCALE, 'corner', { label: 'Top Cuff Back' }),
    createPoint(slx0 * SCALE, (sly0 + sleeveLength) * SCALE, 'corner', { label: 'Top Cuff Front' }),
  ];

  const topSleevePiece = createPatternPiece({
    id: 'JACKET_TOP_SLEEVE',
    name: 'JACKET TOP SLEEVE',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: topSleevePoints,
    seamAllowance,
    grainline: {
      x1: (slx0 + topSleeveWidth * 0.5) * SCALE,
      y1: (sly0 + 2) * SCALE,
      x2: (slx0 + topSleeveWidth * 0.5) * SCALE,
      y2: (sly0 + sleeveLength - 2) * SCALE,
      label: 'GRAINLINE',
    },
  });

  // --- 5. UNDER SLEEVE ---
  const ux0 = 460;
  const uy0 = (sly0 + sleeveLength + 4);
  const underWidth = 7.5;

  const underSleevePoints = [
    createPoint(ux0 * SCALE, (uy0 + 3.5) * SCALE, 'corner', { label: 'Under Crown Front' }),
    createPoint((ux0 + underWidth * 0.5) * SCALE, (uy0 + 1.5) * SCALE, 'smooth', {
      label: 'Under Crown Dip',
      cp1: { x: (ux0 + underWidth * 0.2) * SCALE, y: (uy0 + 1.5) * SCALE },
      cp2: { x: (ux0 + underWidth * 0.4) * SCALE, y: (uy0 + 1.5) * SCALE },
    }),
    createPoint((ux0 + underWidth) * SCALE, (uy0 + 3.5) * SCALE, 'corner', { label: 'Under Crown Back' }),
    createPoint((ux0 + underWidth - 1) * SCALE, (uy0 + sleeveLength - 2) * SCALE, 'corner', { label: 'Under Cuff Back' }),
    createPoint(ux0 * SCALE, (uy0 + sleeveLength - 2) * SCALE, 'corner', { label: 'Under Cuff Front' }),
  ];

  const underSleevePiece = createPatternPiece({
    id: 'JACKET_UNDER_SLEEVE',
    name: 'JACKET UNDER SLEEVE',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: underSleevePoints,
    seamAllowance,
    grainline: {
      x1: (ux0 + underWidth * 0.5) * SCALE,
      y1: (uy0 + 2) * SCALE,
      x2: (ux0 + underWidth * 0.5) * SCALE,
      y2: (uy0 + sleeveLength - 4) * SCALE,
      label: 'GRAINLINE',
    },
  });

  return {
    garmentType: garmentSpec.garmentType || 'jacket',
    pieces: [frontJacketPiece, sidePanelPiece, backPanelPiece, topSleevePiece, underSleevePiece],
  };
}
