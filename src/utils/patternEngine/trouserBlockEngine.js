/**
 * TAILORIX AI — PRODUCTION TROUSER BLOCK ENGINE
 * Parametric geometry engine generating Front Leg, Back Leg, Waistband, Fly, and Pocket components.
 * Supports: Trousers, Jeans, and Tailored Shorts.
 */

import { createPatternPiece, createPoint, createSegment } from '../../models/patternGeometry';

export function draftTrouserPattern(measurements = {}, parameters = {}, garmentSpec = {}) {
  const {
    waist = 32,
    hip = 40,
    crotchDepth = 10.5,
    kneeHeight = 20,
    inseam = 32,
    kneeWidth = 16,
    hemWidth = 18,
  } = measurements;

  const {
    seamAllowance = 0.5,
    isShorts = garmentSpec.garmentType === 'shorts' || parameters.isShorts || false,
    shortsInseam = 9,
    isJeans = garmentSpec.garmentType === 'jeans' || parameters.isJeans || false,
    silhouette = garmentSpec.silhouette || 'classic',
  } = parameters;

  // CAD Screen Scale factor (1 inch = 12 px)
  const SCALE = 12;

  // Adjustments based on silhouette
  let kneeAdj = 0;
  let hemAdj = 0;
  if (silhouette === 'slim_tapered' || silhouette === 'slim') {
    kneeAdj = -1.5;
    hemAdj = -2.0;
  } else if (silhouette === 'wide_leg') {
    kneeAdj = 2.5;
    hemAdj = 4.0;
  }

  const effectiveKneeWidth = Math.max(kneeWidth + kneeAdj, 12);
  const effectiveHemWidth = Math.max(hemWidth + hemAdj, 12);
  const actualInseam = isShorts ? shortsInseam : inseam;
  const actualLength = crotchDepth + actualInseam;
  const effectiveKneeHeight = Math.min(kneeHeight, actualLength - 4);

  // --- 1. FRONT LEG BLOCK ---
  const frontWaist = (waist / 4) + 0.5; // +0.5" ease
  const frontHip = (hip / 4) + 0.25;
  const frontCrotchExt = hip / 16;
  const totalFrontWidth = frontHip + frontCrotchExt;
  const creaseX = totalFrontWidth * 0.48; // Center crease / grainline

  const fx0 = 40;
  const fy0 = 40;

  // Key Front Vertices (in SVG coordinates)
  const f_waist_crease = createPoint((fx0 + creaseX) * SCALE, fy0 * SCALE, 'corner', {
    label: 'Front Waist Crease',
    gradeRule: { dx: 0, dy: -0.25 },
  });
  const f_waist_side = createPoint((fx0 + frontWaist) * SCALE, fy0 * SCALE, 'corner', {
    label: 'Front Waist Side',
    gradeRule: { dx: 0.5, dy: -0.25 },
  });
  const f_hip_side = createPoint((fx0 + frontHip + 0.25) * SCALE, (fy0 + 7) * SCALE, 'smooth', {
    label: 'Front Hip High Point',
    cp1: { x: (fx0 + frontWaist + 0.5) * SCALE, y: (fy0 + 3.5) * SCALE },
    cp2: { x: (fx0 + frontHip + 0.25) * SCALE, y: (fy0 + 5.5) * SCALE },
    gradeRule: { dx: 0.5, dy: 0 },
  });
  const f_crotch_side = createPoint((fx0 + frontHip) * SCALE, (fy0 + crotchDepth) * SCALE, 'corner', {
    label: 'Front Side Crotch Level',
    gradeRule: { dx: 0.5, dy: 0.25 },
  });
  const f_knee_side = createPoint((fx0 + creaseX + effectiveKneeWidth / 4) * SCALE, (fy0 + effectiveKneeHeight) * SCALE, 'corner', {
    label: 'Front Knee Outseam',
    gradeRule: { dx: 0.25, dy: 0.5 },
    notch: 'v_notch',
  });
  const f_hem_side = createPoint((fx0 + creaseX + effectiveHemWidth / 4) * SCALE, (fy0 + actualLength) * SCALE, 'corner', {
    label: 'Front Hem Outseam',
    gradeRule: { dx: 0.25, dy: 1.0 },
  });
  const f_hem_inseam = createPoint((fx0 + creaseX - effectiveHemWidth / 4) * SCALE, (fy0 + actualLength) * SCALE, 'corner', {
    label: 'Front Hem Inseam',
    gradeRule: { dx: -0.25, dy: 1.0 },
  });
  const f_knee_inseam = createPoint((fx0 + creaseX - effectiveKneeWidth / 4) * SCALE, (fy0 + effectiveKneeHeight) * SCALE, 'corner', {
    label: 'Front Knee Inseam',
    gradeRule: { dx: -0.25, dy: 0.5 },
    notch: 'v_notch',
  });
  const f_crotch_fork = createPoint((fx0 + totalFrontWidth) * SCALE, (fy0 + crotchDepth) * SCALE, 'smooth', {
    label: 'Front Crotch Fork Tip',
    cp1: { x: (fx0 + frontHip + 0.5) * SCALE, y: (fy0 + crotchDepth - 1.5) * SCALE },
    cp2: { x: (fx0 + totalFrontWidth - 0.2) * SCALE, y: (fy0 + crotchDepth) * SCALE },
    gradeRule: { dx: 0.75, dy: 0.25 },
    notch: 'v_notch',
  });
  const f_waist_center = createPoint(fx0 * SCALE, (fy0 + 0.5) * SCALE, 'corner', {
    label: 'Front Center Waist',
    gradeRule: { dx: 0, dy: -0.25 },
  });

  const frontPoints = [
    f_waist_center,
    f_waist_side,
    f_hip_side,
    f_crotch_side,
    f_knee_side,
    f_hem_side,
    f_hem_inseam,
    f_knee_inseam,
    f_crotch_fork,
  ];

  const frontPiece = createPatternPiece({
    id: 'TROUSER_FRONT_LEG',
    name: isShorts ? 'SHORTS FRONT LEG' : isJeans ? 'JEANS FRONT LEG' : 'TROUSER FRONT LEG',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: frontPoints,
    seamAllowance,
    grainline: {
      x1: (fx0 + creaseX) * SCALE,
      y1: (fy0 + 2) * SCALE,
      x2: (fx0 + creaseX) * SCALE,
      y2: (fy0 + actualLength - 2) * SCALE,
      label: 'GRAINLINE / CREASE',
    },
    notches: [
      { x: (fx0 + totalFrontWidth) * SCALE, y: (fy0 + crotchDepth) * SCALE, label: 'Crotch Match' },
      { x: (fx0 + creaseX + effectiveKneeWidth / 4) * SCALE, y: (fy0 + effectiveKneeHeight) * SCALE, label: 'Knee' },
      { x: (fx0 + creaseX - effectiveKneeWidth / 4) * SCALE, y: (fy0 + effectiveKneeHeight) * SCALE, label: 'Knee Inseam' },
    ],
    internalLines: [
      {
        type: 'line',
        x1: (fx0 + creaseX) * SCALE,
        y1: (fy0 + 1) * SCALE,
        x2: (fx0 + creaseX) * SCALE,
        y2: (fy0 + actualLength) * SCALE,
        label: 'Crease Line',
      },
      {
        type: 'line',
        x1: fx0 * SCALE,
        y1: (fy0 + crotchDepth) * SCALE,
        x2: (fx0 + totalFrontWidth) * SCALE,
        y2: (fy0 + crotchDepth) * SCALE,
        label: 'Crotch Line',
      },
    ],
  });

  // --- 2. BACK LEG BLOCK ---
  const backWaist = (waist / 4) + 1.25; // includes 0.75" back dart + ease
  const backHip = (hip / 4) + 0.75;
  const backCrotchExt = hip / 8; // deeper back curve
  const totalBackWidth = backHip + backCrotchExt;
  const backCreaseX = totalBackWidth * 0.46;

  const bx0 = 360;
  const by0 = 40;

  const b_waist_center = createPoint(bx0 * SCALE, (by0 - 1.25) * SCALE, 'corner', {
    label: 'Back High Waist Center',
    gradeRule: { dx: -0.25, dy: -0.5 },
  });
  const b_waist_side = createPoint((bx0 + backWaist) * SCALE, by0 * SCALE, 'corner', {
    label: 'Back Waist Side',
    gradeRule: { dx: 0.5, dy: -0.25 },
  });
  const b_hip_side = createPoint((bx0 + backHip + 0.75) * SCALE, (by0 + 7.5) * SCALE, 'smooth', {
    label: 'Back Hip High Point',
    cp1: { x: (bx0 + backWaist + 0.75) * SCALE, y: (by0 + 4) * SCALE },
    cp2: { x: (bx0 + backHip + 0.75) * SCALE, y: (by0 + 6) * SCALE },
    gradeRule: { dx: 0.5, dy: 0 },
  });
  const b_crotch_side = createPoint((bx0 + backHip) * SCALE, (by0 + crotchDepth) * SCALE, 'corner', {
    label: 'Back Side Crotch Level',
    gradeRule: { dx: 0.5, dy: 0.25 },
  });
  const b_knee_side = createPoint((bx0 + backCreaseX + (effectiveKneeWidth / 4) + 0.5) * SCALE, (by0 + effectiveKneeHeight) * SCALE, 'corner', {
    label: 'Back Knee Outseam',
    gradeRule: { dx: 0.25, dy: 0.5 },
    notch: 'v_notch',
  });
  const b_hem_side = createPoint((bx0 + backCreaseX + (effectiveHemWidth / 4) + 0.5) * SCALE, (by0 + actualLength) * SCALE, 'corner', {
    label: 'Back Hem Outseam',
    gradeRule: { dx: 0.25, dy: 1.0 },
  });
  const b_hem_inseam = createPoint((bx0 + backCreaseX - (effectiveHemWidth / 4) - 0.5) * SCALE, (by0 + actualLength) * SCALE, 'corner', {
    label: 'Back Hem Inseam',
    gradeRule: { dx: -0.25, dy: 1.0 },
  });
  const b_knee_inseam = createPoint((bx0 + backCreaseX - (effectiveKneeWidth / 4) - 0.5) * SCALE, (by0 + effectiveKneeHeight) * SCALE, 'corner', {
    label: 'Back Knee Inseam',
    gradeRule: { dx: -0.25, dy: 0.5 },
    notch: 'v_notch',
  });
  const b_crotch_fork = createPoint((bx0 + totalBackWidth) * SCALE, (by0 + crotchDepth + 0.5) * SCALE, 'smooth', {
    label: 'Back Crotch Fork Tip',
    cp1: { x: (bx0 + backHip + 1.0) * SCALE, y: (by0 + crotchDepth - 2) * SCALE },
    cp2: { x: (bx0 + totalBackWidth - 0.5) * SCALE, y: (by0 + crotchDepth + 0.5) * SCALE },
    gradeRule: { dx: 1.0, dy: 0.25 },
    notch: 'v_notch',
  });

  const backPoints = [
    b_waist_center,
    b_waist_side,
    b_hip_side,
    b_crotch_side,
    b_knee_side,
    b_hem_side,
    b_hem_inseam,
    b_knee_inseam,
    b_crotch_fork,
  ];

  const backPiece = createPatternPiece({
    id: 'TROUSER_BACK_LEG',
    name: isShorts ? 'SHORTS BACK LEG' : isJeans ? 'JEANS BACK LEG' : 'TROUSER BACK LEG',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: backPoints,
    seamAllowance,
    grainline: {
      x1: (bx0 + backCreaseX) * SCALE,
      y1: (by0 + 2) * SCALE,
      x2: (bx0 + backCreaseX) * SCALE,
      y2: (by0 + actualLength - 2) * SCALE,
      label: 'GRAINLINE / CREASE',
    },
    notches: [
      { x: (bx0 + totalBackWidth) * SCALE, y: (by0 + crotchDepth + 0.5) * SCALE, label: 'Back Crotch' },
      { x: (bx0 + backCreaseX + (effectiveKneeWidth / 4) + 0.5) * SCALE, y: (by0 + effectiveKneeHeight) * SCALE, label: 'Knee Outseam' },
      { x: (bx0 + backCreaseX - (effectiveKneeWidth / 4) - 0.5) * SCALE, y: (by0 + effectiveKneeHeight) * SCALE, label: 'Knee Inseam' },
    ],
    darts: [
      {
        apex: { x: (bx0 + backWaist * 0.5) * SCALE, y: (by0 + 3.5) * SCALE },
        left: { x: (bx0 + backWaist * 0.5 - 0.375) * SCALE, y: by0 * SCALE },
        right: { x: (bx0 + backWaist * 0.5 + 0.375) * SCALE, y: by0 * SCALE },
      }
    ],
  });

  // --- 3. CONTOURED WAISTBAND ---
  const wbLength = waist + 2.5; // +2.5" for fly extension & ease
  const wbHeight = 1.75;
  const wx0 = 40;
  const wy0 = (fy0 + actualLength + 8);

  const waistbandPoints = [
    createPoint(wx0 * SCALE, wy0 * SCALE, 'corner'),
    createPoint((wx0 + wbLength) * SCALE, wy0 * SCALE, 'corner'),
    createPoint((wx0 + wbLength) * SCALE, (wy0 + wbHeight) * SCALE, 'corner'),
    createPoint(wx0 * SCALE, (wy0 + wbHeight) * SCALE, 'corner'),
  ];

  const waistbandPiece = createPatternPiece({
    id: 'TROUSER_WAISTBAND',
    name: 'CONTOURED WAISTBAND',
    category: 'trim',
    cutQuantity: 'CUT 1 (SELF) + 1 (FUSIBLE)',
    points: waistbandPoints,
    seamAllowance,
    grainline: {
      x1: (wx0 + 2) * SCALE,
      y1: (wy0 + wbHeight / 2) * SCALE,
      x2: (wx0 + wbLength - 2) * SCALE,
      y2: (wy0 + wbHeight / 2) * SCALE,
      label: 'CROSSWISE GRAIN',
    },
    notches: [
      { x: (wx0 + 1.5) * SCALE, y: wy0 * SCALE, label: 'Fly Notch' },
      { x: (wx0 + frontWaist) * SCALE, y: wy0 * SCALE, label: 'Side Seam' },
      { x: (wx0 + frontWaist + backWaist) * SCALE, y: wy0 * SCALE, label: 'Center Back' },
    ],
  });

  // --- 4. FLY FACING PIECE ---
  const flyLength = 8;
  const flyWidth = 2;
  const flx0 = 360;
  const fly0 = (by0 + actualLength + 8);

  const flyPoints = [
    createPoint(flx0 * SCALE, fly0 * SCALE, 'corner'),
    createPoint((flx0 + flyWidth) * SCALE, fly0 * SCALE, 'corner'),
    createPoint((flx0 + flyWidth) * SCALE, (fly0 + flyLength - 1.5) * SCALE, 'smooth', {
      cp1: { x: (flx0 + flyWidth) * SCALE, y: (fly0 + flyLength) * SCALE },
      cp2: { x: (flx0 + 0.5) * SCALE, y: (fly0 + flyLength) * SCALE },
    }),
    createPoint(flx0 * SCALE, (fly0 + flyLength) * SCALE, 'corner'),
  ];

  const flyPiece = createPatternPiece({
    id: 'TROUSER_FLY_FACING',
    name: 'FLY SHIELD & FACING',
    category: 'lining',
    cutQuantity: 'CUT 2',
    points: flyPoints,
    seamAllowance,
    grainline: {
      x1: (flx0 + flyWidth / 2) * SCALE,
      y1: (fly0 + 1) * SCALE,
      x2: (flx0 + flyWidth / 2) * SCALE,
      y2: (fly0 + flyLength - 1) * SCALE,
      label: 'GRAIN',
    },
  });

  // --- 5. SLANT POCKET FACING ---
  const pocketWidth = 6.5;
  const pocketDepth = 11;
  const pkx0 = 420;
  const pky0 = fly0;

  const pocketPoints = [
    createPoint(pkx0 * SCALE, pky0 * SCALE, 'corner'),
    createPoint((pkx0 + pocketWidth) * SCALE, pky0 * SCALE, 'corner'),
    createPoint((pkx0 + pocketWidth) * SCALE, (pky0 + pocketDepth - 2) * SCALE, 'smooth', {
      cp1: { x: (pkx0 + pocketWidth) * SCALE, y: (pky0 + pocketDepth) * SCALE },
      cp2: { x: (pkx0 + 1) * SCALE, y: (pky0 + pocketDepth) * SCALE },
    }),
    createPoint(pkx0 * SCALE, (pky0 + pocketDepth) * SCALE, 'corner'),
  ];

  const pocketPiece = createPatternPiece({
    id: 'POCKET_FACING',
    name: 'FRONT POCKET BAG & FACING',
    category: 'lining',
    cutQuantity: 'CUT 2 (PAIR)',
    points: pocketPoints,
    seamAllowance,
    grainline: {
      x1: (pkx0 + pocketWidth / 2) * SCALE,
      y1: (pky0 + 1) * SCALE,
      x2: (pkx0 + pocketWidth / 2) * SCALE,
      y2: (pky0 + pocketDepth - 1) * SCALE,
      label: 'GRAIN',
    },
  });

  const pieces = [frontPiece, backPiece, waistbandPiece, flyPiece, pocketPiece];

  return {
    garmentType: garmentSpec.garmentType || 'trouser',
    pieces,
  };
}
