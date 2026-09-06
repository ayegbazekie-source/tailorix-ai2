/**
 * TAILORIX AI — KNIT APPAREL ENGINE (POLO & T-SHIRT)
 * Specialized drafting for jersey/pique knit garments with negative ease / reduced knit seam allowance.
 */

import { createPatternPiece, createPoint } from '../../models/patternGeometry';

export function draftKnitPattern(measurements = {}, parameters = {}, garmentSpec = {}) {
  const isPolo = garmentSpec.garmentType === 'polo';

  const {
    bustChest = 38,
    neckCircumference = 15.5,
    shoulderWidth = 17,
    shirtLength = 27.5,
    sleeveLength = isPolo ? 9.5 : 8.5,
    bicepWidth = 13.5,
  } = measurements;

  const {
    seamAllowance = 0.375, // 3/8" standard for serged knits
  } = parameters;

  const SCALE = 12;

  // Knit Ease: Zero or slight positive ease for jersey (+1" total ease)
  const quarterChest = (bustChest + 1.5) / 4;
  const scyeDepth = (bustChest / 8) + 4.0;
  const halfShoulder = shoulderWidth / 2;
  const neckWidth = neckCircumference / 6;
  const neckDepthFront = isPolo ? (neckCircumference / 6) + 0.25 : (neckCircumference / 6) + 0.75;
  const neckDepthBack = 1.0;

  // --- 1. KNIT FRONT BODY ---
  const fx0 = 40;
  const fy0 = 40;

  const frontPoints = [
    createPoint(fx0 * SCALE, (fy0 + neckDepthFront) * SCALE, 'corner', { label: 'Center Front Neck' }),
    createPoint((fx0 + neckWidth) * SCALE, fy0 * SCALE, 'smooth', {
      label: 'High Shoulder Point',
      cp1: { x: (fx0 + neckWidth * 0.4) * SCALE, y: (fy0 + neckDepthFront) * SCALE },
      cp2: { x: (fx0 + neckWidth) * SCALE, y: (fy0 + 0.2) * SCALE },
    }),
    createPoint((fx0 + halfShoulder) * SCALE, (fy0 + 1.75) * SCALE, 'corner', { label: 'Shoulder Tip' }),
    createPoint((fx0 + quarterChest) * SCALE, (fy0 + scyeDepth) * SCALE, 'smooth', {
      label: 'Armhole Base',
      cp1: { x: (fx0 + halfShoulder - 0.5) * SCALE, y: (fy0 + scyeDepth * 0.6) * SCALE },
      cp2: { x: (fx0 + quarterChest - 0.75) * SCALE, y: (fy0 + scyeDepth) * SCALE },
      notch: 'v_notch',
    }),
    createPoint((fx0 + quarterChest) * SCALE, (fy0 + shirtLength) * SCALE, 'corner', { label: 'Side Hem' }),
    createPoint(fx0 * SCALE, (fy0 + shirtLength) * SCALE, 'corner', { label: 'Center Front Hem' }),
  ];

  const frontBodyPiece = createPatternPiece({
    id: isPolo ? 'POLO_FRONT_BODY' : 'TSHIRT_FRONT_BODY',
    name: isPolo ? 'POLO FRONT BODY' : 'T-SHIRT FRONT BODY',
    category: 'shell',
    cutQuantity: 'CUT 1 ON FOLD',
    onFold: true,
    points: frontPoints,
    seamAllowance,
    grainline: {
      x1: (fx0 + 2) * SCALE,
      y1: (fy0 + 3) * SCALE,
      x2: (fx0 + 2) * SCALE,
      y2: (fy0 + shirtLength - 3) * SCALE,
      label: 'CENTER FRONT FOLD',
    },
    notches: [
      { x: (fx0 + quarterChest) * SCALE, y: (fy0 + scyeDepth) * SCALE, label: 'Scye Notch' },
    ],
    internalLines: isPolo ? [
      {
        type: 'line',
        x1: fx0 * SCALE,
        y1: (fy0 + neckDepthFront) * SCALE,
        x2: fx0 * SCALE,
        y2: (fy0 + neckDepthFront + 6.5) * SCALE,
        label: 'Polo Placket Slash Line (6.5")',
      }
    ] : [],
  });

  // --- 2. KNIT BACK BODY ---
  const bx0 = 240;
  const by0 = 40;

  const backPoints = [
    createPoint(bx0 * SCALE, (by0 + neckDepthBack) * SCALE, 'corner', { label: 'Center Back Neck' }),
    createPoint((bx0 + neckWidth) * SCALE, by0 * SCALE, 'smooth', {
      label: 'High Shoulder Back',
      cp1: { x: (bx0 + neckWidth * 0.5) * SCALE, y: (by0 + neckDepthBack) * SCALE },
      cp2: { x: (bx0 + neckWidth) * SCALE, y: (by0 + 0.2) * SCALE },
    }),
    createPoint((bx0 + halfShoulder) * SCALE, (by0 + 1.75) * SCALE, 'corner', { label: 'Back Shoulder Tip' }),
    createPoint((bx0 + quarterChest) * SCALE, (by0 + scyeDepth) * SCALE, 'smooth', {
      label: 'Back Armhole Scye Base',
      cp1: { x: (bx0 + halfShoulder - 0.25) * SCALE, y: (by0 + scyeDepth * 0.6) * SCALE },
      cp2: { x: (bx0 + quarterChest - 0.5) * SCALE, y: (by0 + scyeDepth) * SCALE },
      notch: 'v_notch',
    }),
    createPoint((bx0 + quarterChest) * SCALE, (by0 + shirtLength) * SCALE, 'corner', { label: 'Back Side Hem' }),
    createPoint(bx0 * SCALE, (by0 + shirtLength) * SCALE, 'corner', { label: 'Center Back Hem' }),
  ];

  const backBodyPiece = createPatternPiece({
    id: isPolo ? 'POLO_BACK_BODY' : 'TSHIRT_BACK_BODY',
    name: isPolo ? 'POLO BACK BODY' : 'T-SHIRT BACK BODY',
    category: 'shell',
    cutQuantity: 'CUT 1 ON FOLD',
    onFold: true,
    points: backPoints,
    seamAllowance,
    grainline: {
      x1: (bx0 + 2) * SCALE,
      y1: (by0 + 3) * SCALE,
      x2: (bx0 + 2) * SCALE,
      y2: (by0 + shirtLength - 3) * SCALE,
      label: 'CENTER BACK FOLD',
    },
  });

  // --- 3. KNIT SHORT SLEEVE ---
  const slx0 = 420;
  const sly0 = 40;
  const capHeight = scyeDepth * 0.65;
  const bicep = Math.max(bicepWidth + 1.5, 12);
  const hemSleeve = bicep - 1.5;

  const sleevePoints = [
    createPoint(slx0 * SCALE, (sly0 + capHeight) * SCALE, 'corner', { label: 'Underarm Front' }),
    createPoint((slx0 + bicep * 0.5) * SCALE, sly0 * SCALE, 'smooth', {
      label: 'Sleeve Cap Crown',
      cp1: { x: (slx0 + bicep * 0.2) * SCALE, y: sly0 * SCALE },
      cp2: { x: (slx0 + bicep * 0.4) * SCALE, y: sly0 * SCALE },
      notch: 'v_notch',
    }),
    createPoint((slx0 + bicep) * SCALE, (sly0 + capHeight) * SCALE, 'corner', { label: 'Underarm Back' }),
    createPoint((slx0 + bicep * 0.5 + hemSleeve * 0.5) * SCALE, (sly0 + sleeveLength) * SCALE, 'corner', { label: 'Sleeve Hem Out' }),
    createPoint((slx0 + bicep * 0.5 - hemSleeve * 0.5) * SCALE, (sly0 + sleeveLength) * SCALE, 'corner', { label: 'Sleeve Hem In' }),
  ];

  const sleevePiece = createPatternPiece({
    id: 'KNIT_SLEEVE',
    name: isPolo ? 'POLO SHORT SLEEVE' : 'T-SHIRT SHORT SLEEVE',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: sleevePoints,
    seamAllowance,
    grainline: {
      x1: (slx0 + bicep * 0.5) * SCALE,
      y1: (sly0 + 1) * SCALE,
      x2: (slx0 + bicep * 0.5) * SCALE,
      y2: (sly0 + sleeveLength - 1) * SCALE,
      label: 'GRAINLINE',
    },
    notches: [
      { x: (slx0 + bicep * 0.5) * SCALE, y: sly0 * SCALE, label: 'Crown Match' },
    ],
  });

  // --- 4. COLLAR / RIB NECKBAND ---
  const clx0 = 420;
  const cly0 = (sly0 + sleeveLength + 5);
  const bandLength = (neckCircumference * 0.85); // 15% negative stretch ease for rib
  const bandHeight = isPolo ? 2.75 : 1.25;

  const bandPoints = [
    createPoint(clx0 * SCALE, cly0 * SCALE, 'corner'),
    createPoint((clx0 + bandLength) * SCALE, cly0 * SCALE, 'corner'),
    createPoint((clx0 + bandLength) * SCALE, (cly0 + bandHeight) * SCALE, 'corner'),
    createPoint(clx0 * SCALE, (cly0 + bandHeight) * SCALE, 'corner'),
  ];

  const collarPiece = createPatternPiece({
    id: isPolo ? 'POLO_FLAT_KNIT_COLLAR' : 'TSHIRT_RIB_NECKBAND',
    name: isPolo ? 'POLO RIBBED COLLAR' : 'T-SHIRT 1X1 RIB NECKBAND',
    category: 'trim',
    cutQuantity: 'CUT 1',
    points: bandPoints,
    seamAllowance,
    grainline: {
      x1: (clx0 + 1) * SCALE,
      y1: (cly0 + bandHeight / 2) * SCALE,
      x2: (clx0 + bandLength - 1) * SCALE,
      y2: (cly0 + bandHeight / 2) * SCALE,
      label: 'CROSSWISE STRETCH',
    },
  });

  return {
    garmentType: garmentSpec.garmentType || 'polo',
    pieces: [frontBodyPiece, backBodyPiece, sleevePiece, collarPiece],
  };
}
