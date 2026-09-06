/**
 * TAILORIX AI — PRODUCTION SHIRT BLOCK ENGINE
 * Parametric geometry engine generating Front Bodice, Back Bodice, Split Yoke,
 * Set-in Sleeve, Two-Piece Collar (Leaf & Stand), and Cuffs.
 */

import { createPatternPiece, createPoint } from '../../models/patternGeometry';

export function draftShirtPattern(measurements = {}, parameters = {}, garmentSpec = {}) {
  const {
    bustChest = 38,
    neckCircumference = 15.5,
    shoulderWidth = 17.5,
    shirtLength = 29,
    sleeveLength = 24.5,
    bicepWidth = 14,
    wristCircumference = 7.5,
  } = measurements;

  const {
    seamAllowance = 0.5,
    silhouette = garmentSpec.silhouette || 'tailored_fit',
  } = parameters;

  const SCALE = 12;

  // Ease allowances based on silhouette
  const chestEase = silhouette === 'slim' ? 3.0 : silhouette === 'relaxed' ? 6.0 : 4.5;
  const quarterChest = (bustChest + chestEase) / 4;
  const scyeDepth = (bustChest / 8) + 4.75;
  const halfShoulder = (shoulderWidth / 2) + 0.25;
  const neckWidth = neckCircumference / 6;
  const neckDepthFront = (neckCircumference / 6) + 0.75;

  // --- 1. FRONT BODICE ---
  const fx0 = 40;
  const fy0 = 40;

  const frontPoints = [
    createPoint(fx0 * SCALE, fy0 * SCALE, 'corner', { label: 'Center Front Neck' }),
    createPoint((fx0 + neckWidth) * SCALE, (fy0 + 1) * SCALE, 'smooth', {
      label: 'High Shoulder Neck',
      cp1: { x: (fx0 + neckWidth * 0.3) * SCALE, y: (fy0 + 0.2) * SCALE },
      cp2: { x: (fx0 + neckWidth * 0.7) * SCALE, y: (fy0 + 0.5) * SCALE },
      gradeRule: { dx: 0.125, dy: -0.125 },
    }),
    createPoint((fx0 + halfShoulder) * SCALE, (fy0 + 2.5) * SCALE, 'corner', {
      label: 'Shoulder Point',
      gradeRule: { dx: 0.25, dy: -0.125 },
    }),
    createPoint((fx0 + quarterChest) * SCALE, (fy0 + scyeDepth) * SCALE, 'smooth', {
      label: 'Front Armhole Scye Base',
      cp1: { x: (fx0 + halfShoulder - 0.75) * SCALE, y: (fy0 + scyeDepth * 0.6) * SCALE },
      cp2: { x: (fx0 + quarterChest - 1) * SCALE, y: (fy0 + scyeDepth) * SCALE },
      gradeRule: { dx: 0.375, dy: 0.125 },
      notch: 'v_notch',
    }),
    createPoint((fx0 + quarterChest - 0.5) * SCALE, (fy0 + shirtLength) * SCALE, 'corner', {
      label: 'Side Hem',
      gradeRule: { dx: 0.375, dy: 0.5 },
    }),
    createPoint((fx0 + quarterChest * 0.5) * SCALE, (fy0 + shirtLength + 1.25) * SCALE, 'smooth', {
      label: 'Shirt Tail Curved Hem',
      cp1: { x: (fx0 + quarterChest * 0.8) * SCALE, y: (fy0 + shirtLength + 0.8) * SCALE },
      cp2: { x: (fx0 + quarterChest * 0.3) * SCALE, y: (fy0 + shirtLength + 1.25) * SCALE },
    }),
    createPoint(fx0 * SCALE, (fy0 + shirtLength) * SCALE, 'corner', { label: 'Center Front Hem' }),
  ];

  const frontBodicePiece = createPatternPiece({
    id: 'SHIRT_FRONT_BODICE',
    name: 'SHIRT FRONT BODICE',
    category: 'shell',
    cutQuantity: 'CUT 2 (LEFT & RIGHT)',
    points: frontPoints,
    seamAllowance,
    grainline: {
      x1: (fx0 + 2) * SCALE,
      y1: (fy0 + 4) * SCALE,
      x2: (fx0 + 2) * SCALE,
      y2: (fy0 + shirtLength - 4) * SCALE,
      label: 'CENTER FRONT GRAIN',
    },
    notches: [
      { x: (fx0 + quarterChest) * SCALE, y: (fy0 + scyeDepth) * SCALE, label: 'Single Scye Notch' },
    ],
    internalLines: [
      {
        type: 'line',
        x1: (fx0 + 1.5) * SCALE,
        y1: fy0 * SCALE,
        x2: (fx0 + 1.5) * SCALE,
        y2: (fy0 + shirtLength) * SCALE,
        label: 'Front Placket Fold Line',
      },
    ],
  });

  // --- 2. BACK BODICE ---
  const bx0 = 240;
  const by0 = 40;
  const yokeHeight = 3.5;

  const backPoints = [
    createPoint(bx0 * SCALE, (by0 + yokeHeight) * SCALE, 'corner', { label: 'Center Back Yoke Seam' }),
    createPoint((bx0 + quarterChest) * SCALE, (by0 + yokeHeight) * SCALE, 'corner', {
      label: 'Back Yoke Armhole Edge',
      gradeRule: { dx: 0.375, dy: 0 },
    }),
    createPoint((bx0 + quarterChest) * SCALE, (by0 + scyeDepth) * SCALE, 'smooth', {
      label: 'Back Armhole Scye Base',
      cp1: { x: (bx0 + quarterChest - 0.25) * SCALE, y: (by0 + scyeDepth * 0.7) * SCALE },
      cp2: { x: (bx0 + quarterChest) * SCALE, y: (by0 + scyeDepth) * SCALE },
      notch: 'v_notch',
    }),
    createPoint((bx0 + quarterChest - 0.5) * SCALE, (by0 + shirtLength) * SCALE, 'corner', {
      label: 'Back Side Hem',
    }),
    createPoint((bx0 + quarterChest * 0.5) * SCALE, (by0 + shirtLength + 1.5) * SCALE, 'smooth', {
      label: 'Back Curved Shirt Tail',
      cp1: { x: (bx0 + quarterChest * 0.8) * SCALE, y: (by0 + shirtLength + 1.0) * SCALE },
      cp2: { x: (bx0 + quarterChest * 0.3) * SCALE, y: (by0 + shirtLength + 1.5) * SCALE },
    }),
    createPoint(bx0 * SCALE, (by0 + shirtLength) * SCALE, 'corner', { label: 'Center Back Hem' }),
  ];

  const backBodicePiece = createPatternPiece({
    id: 'SHIRT_BACK_BODICE',
    name: 'SHIRT BACK BODICE',
    category: 'shell',
    cutQuantity: 'CUT 1 ON FOLD',
    onFold: true,
    points: backPoints,
    seamAllowance,
    grainline: {
      x1: (bx0 + 2) * SCALE,
      y1: (by0 + yokeHeight + 2) * SCALE,
      x2: (bx0 + 2) * SCALE,
      y2: (by0 + shirtLength - 4) * SCALE,
      label: 'CENTER BACK FOLD',
    },
    notches: [
      { x: (bx0 + quarterChest) * SCALE, y: (by0 + scyeDepth) * SCALE, label: 'Double Scye Notch' },
    ],
  });

  // --- 3. SPLIT BACK YOKE ---
  const yx0 = 420;
  const yy0 = 40;

  const yokePoints = [
    createPoint(yx0 * SCALE, yy0 * SCALE, 'corner', { label: 'Center Back Neck' }),
    createPoint((yx0 + neckWidth + 0.25) * SCALE, (yy0 + 0.75) * SCALE, 'smooth', {
      cp1: { x: (yx0 + neckWidth * 0.4) * SCALE, y: yy0 * SCALE },
      cp2: { x: (yx0 + neckWidth * 0.8) * SCALE, y: (yy0 + 0.5) * SCALE },
    }),
    createPoint((yx0 + halfShoulder + 0.25) * SCALE, (yy0 + 2.25) * SCALE, 'corner', { label: 'Yoke Shoulder Tip' }),
    createPoint((yx0 + quarterChest) * SCALE, (yy0 + yokeHeight) * SCALE, 'corner', { label: 'Yoke Armhole Corner' }),
    createPoint(yx0 * SCALE, (yy0 + yokeHeight) * SCALE, 'corner', { label: 'Yoke Center Back Base' }),
  ];

  const yokePiece = createPatternPiece({
    id: 'SHIRT_YOKE',
    name: 'SHIRT SPLIT YOKE',
    category: 'shell',
    cutQuantity: 'CUT 2 (SELF) + 2 (FACING)',
    points: yokePoints,
    seamAllowance,
    grainline: {
      x1: (yx0 + halfShoulder / 2) * SCALE,
      y1: (yy0 + 0.5) * SCALE,
      x2: (yx0 + halfShoulder / 2) * SCALE,
      y2: (yy0 + yokeHeight - 0.5) * SCALE,
      label: 'CROSS / BIAS GRAIN',
    },
  });

  // --- 4. SET-IN SLEEVE ---
  const slx0 = 40;
  const sly0 = (fy0 + shirtLength + 6);
  const actualBicep = Math.max(bicepWidth + 3, 14); // +3" ease
  const capHeight = scyeDepth * 0.72;
  const cuffWidth = (wristCircumference + 2.5) / 2;

  const sleevePoints = [
    createPoint(slx0 * SCALE, (sly0 + capHeight) * SCALE, 'corner', { label: 'Underarm Front' }),
    createPoint((slx0 + actualBicep * 0.5) * SCALE, sly0 * SCALE, 'smooth', {
      label: 'Sleeve Cap Crown',
      cp1: { x: (slx0 + actualBicep * 0.2) * SCALE, y: sly0 * SCALE },
      cp2: { x: (slx0 + actualBicep * 0.4) * SCALE, y: sly0 * SCALE },
      notch: 'v_notch',
    }),
    createPoint((slx0 + actualBicep) * SCALE, (sly0 + capHeight) * SCALE, 'corner', {
      label: 'Underarm Back',
      cp1: { x: (slx0 + actualBicep * 0.75) * SCALE, y: sly0 * SCALE },
      cp2: { x: (slx0 + actualBicep * 0.95) * SCALE, y: (sly0 + capHeight * 0.6) * SCALE },
    }),
    createPoint((slx0 + actualBicep * 0.5 + cuffWidth) * SCALE, (sly0 + sleeveLength) * SCALE, 'corner', { label: 'Back Cuff Hem' }),
    createPoint((slx0 + actualBicep * 0.5 - cuffWidth) * SCALE, (sly0 + sleeveLength) * SCALE, 'corner', { label: 'Front Cuff Hem' }),
  ];

  const sleevePiece = createPatternPiece({
    id: 'SHIRT_SLEEVE',
    name: 'SET-IN SHIRT SLEEVE',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: sleevePoints,
    seamAllowance,
    grainline: {
      x1: (slx0 + actualBicep * 0.5) * SCALE,
      y1: (sly0 + 2) * SCALE,
      x2: (slx0 + actualBicep * 0.5) * SCALE,
      y2: (sly0 + sleeveLength - 2) * SCALE,
      label: 'SLEEVE GRAINLINE',
    },
    notches: [
      { x: (slx0 + actualBicep * 0.5) * SCALE, y: sly0 * SCALE, label: 'Crown Match to Shoulder' },
    ],
  });

  // --- 5. TWO-PIECE COLLAR (LEAF & STAND) ---
  const clx0 = 260;
  const cly0 = sly0;
  const collarHalf = (neckCircumference + 1.0) / 2;

  const collarLeafPoints = [
    createPoint(clx0 * SCALE, cly0 * SCALE, 'corner', { label: 'Center Back Leaf' }),
    createPoint((clx0 + collarHalf + 0.75) * SCALE, (cly0 - 0.75) * SCALE, 'corner', { label: 'Collar Point' }),
    createPoint((clx0 + collarHalf) * SCALE, (cly0 + 2.5) * SCALE, 'corner', { label: 'Collar Leaf Roll Base' }),
    createPoint(clx0 * SCALE, (cly0 + 2.5) * SCALE, 'corner', { label: 'Center Back Roll' }),
  ];

  const collarLeafPiece = createPatternPiece({
    id: 'SHIRT_COLLAR_LEAF',
    name: 'SHIRT COLLAR LEAF',
    category: 'trim',
    cutQuantity: 'CUT 2 (1 SELF, 1 UNDERCOLLAR) + 1 FUSIBLE',
    points: collarLeafPoints,
    onFold: true,
    seamAllowance,
    grainline: {
      x1: (clx0 + 1) * SCALE,
      y1: (cly0 + 1.25) * SCALE,
      x2: (clx0 + collarHalf - 1) * SCALE,
      y2: (cly0 + 1.25) * SCALE,
      label: 'COLLAR GRAIN',
    },
  });

  const collarStandPoints = [
    createPoint(clx0 * SCALE, (cly0 + 4) * SCALE, 'corner', { label: 'Center Back Stand' }),
    createPoint((clx0 + collarHalf + 0.75) * SCALE, (cly0 + 4.25) * SCALE, 'smooth', {
      label: 'Stand Button Extension',
      cp1: { x: (clx0 + collarHalf) * SCALE, y: (cly0 + 4) * SCALE },
      cp2: { x: (clx0 + collarHalf + 0.75) * SCALE, y: (cly0 + 4.1) * SCALE },
    }),
    createPoint((clx0 + collarHalf) * SCALE, (cly0 + 5.5) * SCALE, 'corner', { label: 'Stand Front Curve' }),
    createPoint(clx0 * SCALE, (cly0 + 5.5) * SCALE, 'corner', { label: 'Stand Center Base' }),
  ];

  const collarStandPiece = createPatternPiece({
    id: 'SHIRT_COLLAR_STAND',
    name: 'SHIRT COLLAR STAND',
    category: 'trim',
    cutQuantity: 'CUT 2 + 1 FUSIBLE',
    points: collarStandPoints,
    onFold: true,
    seamAllowance,
    grainline: {
      x1: (clx0 + 1) * SCALE,
      y1: (cly0 + 4.75) * SCALE,
      x2: (clx0 + collarHalf - 1) * SCALE,
      y2: (cly0 + 4.75) * SCALE,
      label: 'LENGTHWISE GRAIN',
    },
  });

  // --- 6. SHIRT CUFF ---
  const cfx0 = 420;
  const cfy0 = sly0;
  const cuffHeight = 2.5;
  const cuffTotalLength = wristCircumference + 2.5;

  const cuffPoints = [
    createPoint(cfx0 * SCALE, cfy0 * SCALE, 'corner'),
    createPoint((cfx0 + cuffTotalLength) * SCALE, cfy0 * SCALE, 'corner'),
    createPoint((cfx0 + cuffTotalLength) * SCALE, (cfy0 + cuffHeight) * SCALE, 'corner'),
    createPoint(cfx0 * SCALE, (cfy0 + cuffHeight) * SCALE, 'corner'),
  ];

  const cuffPiece = createPatternPiece({
    id: 'SHIRT_CUFF',
    name: 'BARREL SHIRT CUFF',
    category: 'trim',
    cutQuantity: 'CUT 4 (2 PAIR) + 2 FUSIBLE',
    points: cuffPoints,
    seamAllowance,
    grainline: {
      x1: (cfx0 + 1) * SCALE,
      y1: (cfy0 + cuffHeight / 2) * SCALE,
      x2: (cfx0 + cuffTotalLength - 1) * SCALE,
      y2: (cfy0 + cuffHeight / 2) * SCALE,
      label: 'LENGTHWISE GRAIN',
    },
  });

  return {
    garmentType: garmentSpec.garmentType || 'shirt',
    pieces: [
      frontBodicePiece,
      backBodicePiece,
      yokePiece,
      sleevePiece,
      collarLeafPiece,
      collarStandPiece,
      cuffPiece,
    ],
  };
}
