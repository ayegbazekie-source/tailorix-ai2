/**
 * TAILORIX AI — PRODUCTION TROUSER BLOCK ENGINE
 * Parametric geometry engine generating Front Leg, Back Leg, Waistband, Fly, and Pocket components.
 * 
 * Strict CAD / Apparel Engineering Rules:
 * - Deterministic parametric geometry based on classical tailoring draft (Aldrich / Gilewska / Rundschau).
 * - Closed, clockwise topological perimeters.
 * - Continuous, smooth concave crotch curves calculated with precise bezier control points.
 * - Exact front/back balance: matching inseam and outseam lengths, proper back rise seat extension.
 * - Grainline positioned along the vertical crease line.
 * - Accurate cut quantities, seam allowances, and assembly alignment notches.
 */

import { createPatternPiece, createPoint, createSegment } from '../../models/patternGeometry';

// Internal CAD Scale Factor: 12 canvas coordinate units per canonical inch.
const CAD_SCALE = 12;

export function draftTrouserPattern(measurements = {}, parameters = {}, garmentSpec = {}) {
  const {
    waist = 32,
    hip = 40,
    thigh,
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

  // Thigh parametric compensation
  const standardThigh = hip * 0.575;
  const effectiveThigh = thigh || standardThigh;
  const thighDelta = effectiveThigh - standardThigh;

  // Silhouette width adjustments
  let kneeAdj = 0;
  let hemAdj = 0;
  const silLower = String(silhouette || '').toLowerCase();
  if (silLower.includes('flare') || silLower.includes('bootcut')) {
    kneeAdj = -1.0;
    hemAdj = 6.0; // Noticeable flare: narrower knee, wider hem
  } else if (silLower.includes('wide')) {
    kneeAdj = 3.0;
    hemAdj = 5.0;
  } else if (silLower.includes('skinny')) {
    kneeAdj = -2.5;
    hemAdj = -3.5;
  } else if (silLower.includes('slim') || silLower.includes('taper')) {
    kneeAdj = -1.5;
    hemAdj = -2.0;
  } else if (silLower.includes('relaxed')) {
    kneeAdj = 1.5;
    hemAdj = 1.5;
  } else if (silLower.includes('barrel')) {
    kneeAdj = 3.5;
    hemAdj = -1.0;
  }

  const effectiveKneeWidth = Math.max(kneeWidth + kneeAdj, 12);
  const effectiveHemWidth = Math.max(hemWidth + hemAdj, 12);
  const actualInseam = isShorts ? shortsInseam : inseam;
  const totalLength = crotchDepth + actualInseam;
  const effectiveKneeHeight = Math.min(kneeHeight, totalLength - 4);

  // =========================================================================
  // 1. FRONT LEG BLOCK
  // =========================================================================
  // Front leg proportions:
  // - Front waist = (waist / 4) + 0.25" ease
  // - Front hip = (hip / 4) - 0.25"
  // - Front crotch extension = (hip / 16) + (thighDelta * 0.25)
  const frontWaist = (waist / 4) + 0.25;
  const frontHip = (hip / 4) - 0.25;
  const frontCrotchExt = (hip / 16) + (thighDelta * 0.25);

  // Front layout origin (in inches)
  const fcx = 16.0; // Crease / grainline center axis
  const ftopY = 4.0; // Waistline reference Y

  // Front Key Coordinate Calculations (in inches)
  // 1. CF Waist: slightly dipped and angled 3/8" toward center
  const cf_waist_x = fcx - (frontHip * 0.45) + 0.375;
  const cf_waist_y = ftopY + 0.25;

  // 2. Side Waist
  const side_waist_x = cf_waist_x + frontWaist;
  const side_waist_y = ftopY;

  // 3. Outseam High Hip (crest of pelvis)
  const hip_level_y = ftopY + (crotchDepth * 0.65);
  const hip_outseam_x = fcx + (frontHip * 0.55) + 0.35;

  // 4. Outseam at Crotch Level
  const crotch_level_y = ftopY + crotchDepth;
  const crotch_outseam_x = fcx + (frontHip * 0.55);

  // 5. Outseam at Knee
  const knee_level_y = ftopY + effectiveKneeHeight;
  const knee_outseam_x = fcx + (effectiveKneeWidth / 4);

  // 6. Outseam at Hem
  const hem_level_y = ftopY + totalLength;
  const hem_outseam_x = fcx + (effectiveHemWidth / 4);

  // 7. Hem at Crease Line
  const hem_crease_x = fcx;
  const hem_crease_y = hem_level_y;

  // 8. Inseam at Hem
  const hem_inseam_x = fcx - (effectiveHemWidth / 4);
  const hem_inseam_y = hem_level_y;

  // 9. Inseam at Knee
  const knee_inseam_x = fcx - (effectiveKneeWidth / 4);
  const knee_inseam_y = knee_level_y;

  // 10. Front Crotch Fork Tip (Inseam side)
  const crotch_fork_x = fcx - (frontHip * 0.45) - frontCrotchExt;
  const crotch_fork_y = crotch_level_y + 0.125;

  // 11. Center Front at Hip / Base of Fly (where crotch curve flattens into vertical rise)
  const cf_hip_x = fcx - (frontHip * 0.45);
  const cf_hip_y = hip_level_y;

  // Convert Front Vertices to CAD Points with true Bezier curves
  const f_waist_center = createPoint(cf_waist_x * CAD_SCALE, cf_waist_y * CAD_SCALE, 'corner', {
    label: 'Center Front Waist',
    gradeRule: { dx: 0, dy: -0.25 },
  });

  const f_waist_side = createPoint(side_waist_x * CAD_SCALE, side_waist_y * CAD_SCALE, 'corner', {
    label: 'Front Side Waist',
    gradeRule: { dx: 0.5, dy: -0.25 },
  });

  const f_hip_side = createPoint(hip_outseam_x * CAD_SCALE, hip_level_y * CAD_SCALE, 'smooth', {
    label: 'Front High Hip Outseam',
    cp1: { x: (side_waist_x + 0.25) * CAD_SCALE, y: (ftopY + 3.0) * CAD_SCALE },
    cp2: { x: hip_outseam_x * CAD_SCALE, y: (hip_level_y - 1.5) * CAD_SCALE },
    gradeRule: { dx: 0.5, dy: 0 },
  });

  const f_crotch_side = createPoint(crotch_outseam_x * CAD_SCALE, crotch_level_y * CAD_SCALE, 'corner', {
    label: 'Front Outseam at Crotch Line',
    gradeRule: { dx: 0.5, dy: 0.25 },
  });

  const f_knee_side = createPoint(knee_outseam_x * CAD_SCALE, knee_level_y * CAD_SCALE, 'corner', {
    label: 'Front Knee Outseam',
    gradeRule: { dx: 0.25, dy: 0.5 },
    notch: 'v_notch',
  });

  const f_hem_side = createPoint(hem_outseam_x * CAD_SCALE, hem_level_y * CAD_SCALE, 'corner', {
    label: 'Front Hem Outseam',
    gradeRule: { dx: 0.25, dy: 1.0 },
  });

  const f_hem_crease = createPoint(hem_crease_x * CAD_SCALE, hem_crease_y * CAD_SCALE, 'corner', {
    label: 'Front Hem Crease',
    gradeRule: { dx: 0, dy: 1.0 },
  });

  const f_hem_inseam = createPoint(hem_inseam_x * CAD_SCALE, hem_inseam_y * CAD_SCALE, 'corner', {
    label: 'Front Hem Inseam',
    gradeRule: { dx: -0.25, dy: 1.0 },
  });

  const f_knee_inseam = createPoint(knee_inseam_x * CAD_SCALE, knee_level_y * CAD_SCALE, 'corner', {
    label: 'Front Knee Inseam',
    gradeRule: { dx: -0.25, dy: 0.5 },
    notch: 'v_notch',
  });

  const f_crotch_fork = createPoint(crotch_fork_x * CAD_SCALE, crotch_fork_y * CAD_SCALE, 'smooth', {
    label: 'Front Crotch Fork Tip',
    // Inseam curve into crotch fork
    cp1: { x: (knee_inseam_x - 0.25) * CAD_SCALE, y: (crotch_level_y + 3.0) * CAD_SCALE },
    cp2: { x: (crotch_fork_x + 0.25) * CAD_SCALE, y: (crotch_fork_y + 0.5) * CAD_SCALE },
    gradeRule: { dx: -0.75, dy: 0.25 },
    notch: 'v_notch',
  });

  const f_crotch_curve = createPoint(cf_hip_x * CAD_SCALE, cf_hip_y * CAD_SCALE, 'smooth', {
    label: 'Front Crotch Arc to Fly Base',
    // Concave crotch curve from fork tip up to fly base
    cp1: { x: (crotch_fork_x + frontCrotchExt * 0.55) * CAD_SCALE, y: (crotch_fork_y) * CAD_SCALE },
    cp2: { x: (cf_hip_x) * CAD_SCALE, y: (crotch_level_y - 1.25) * CAD_SCALE },
    gradeRule: { dx: 0, dy: 0 },
  });

  // Ordered clockwise perimeter for Front Leg
  const frontPoints = [
    f_waist_center,
    f_waist_side,
    f_hip_side,
    f_crotch_side,
    f_knee_side,
    f_hem_side,
    f_hem_crease,
    f_hem_inseam,
    f_knee_inseam,
    f_crotch_fork,
    f_crotch_curve,
  ];

  const frontPiece = createPatternPiece({
    id: 'TROUSER_FRONT_LEG',
    name: isShorts ? 'SHORTS FRONT LEG' : isJeans ? 'JEANS FRONT LEG' : 'TROUSER FRONT LEG',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: frontPoints,
    seamAllowance,
    grainline: {
      x1: fcx * CAD_SCALE,
      y1: (ftopY + 1.5) * CAD_SCALE,
      x2: fcx * CAD_SCALE,
      y2: (hem_level_y - 2.0) * CAD_SCALE,
      label: 'GRAINLINE / CREASE LINE',
    },
    notches: [
      { x: crotch_fork_x * CAD_SCALE, y: crotch_fork_y * CAD_SCALE, label: 'Crotch Fork' },
      { x: knee_outseam_x * CAD_SCALE, y: knee_level_y * CAD_SCALE, label: 'Knee Outseam' },
      { x: knee_inseam_x * CAD_SCALE, y: knee_level_y * CAD_SCALE, label: 'Knee Inseam' },
      { x: cf_hip_x * CAD_SCALE, y: cf_hip_y * CAD_SCALE, label: 'Fly Notch' },
    ],
    internalLines: [
      {
        type: 'line',
        x1: fcx * CAD_SCALE,
        y1: ftopY * CAD_SCALE,
        x2: fcx * CAD_SCALE,
        y2: hem_level_y * CAD_SCALE,
        label: 'Pressed Crease Line',
      },
      {
        type: 'line',
        x1: crotch_fork_x * CAD_SCALE,
        y1: crotch_level_y * CAD_SCALE,
        x2: crotch_outseam_x * CAD_SCALE,
        y2: crotch_level_y * CAD_SCALE,
        label: 'Crotch Level Reference',
      },
      {
        type: 'line',
        x1: knee_inseam_x * CAD_SCALE,
        y1: knee_level_y * CAD_SCALE,
        x2: knee_outseam_x * CAD_SCALE,
        y2: knee_level_y * CAD_SCALE,
        label: 'Knee Line Reference',
      },
    ],
  });

  // =========================================================================
  // 2. BACK LEG BLOCK
  // =========================================================================
  // Back leg proportions:
  // - Back waist = (waist / 4) + 0.75" back dart + 0.5" ease = (waist / 4) + 1.25"
  // - Back hip = (hip / 4) + 0.75"
  // - Back crotch extension = (hip / 8) + (thighDelta * 0.25) [~2x front extension]
  // - Center Back Waist angled inward 1.5" and raised 1.25" for gluteal seat angle
  const backWaist = (waist / 4) + 1.25;
  const backHip = (hip / 4) + 0.75;
  const backCrotchExt = (hip / 8) + (thighDelta * 0.25);

  // Back layout origin (in inches)
  const bcx = 42.0; // Back crease line
  const btopY = 4.0;

  // Back Key Coordinate Calculations (in inches)
  // 1. Center Back High Waist
  const cb_waist_x = bcx - (backHip * 0.35) - 1.25;
  const cb_waist_y = btopY - 1.25; // Raised 1.25" above front waist

  // 2. Back Side Waist
  const b_side_waist_x = bcx + (backWaist * 0.65);
  const b_side_waist_y = btopY; // Levels with front side waist

  // 3. Back High Hip Outseam
  const b_hip_outseam_x = bcx + (backHip * 0.60) + 0.65;
  const b_hip_level_y = btopY + (crotchDepth * 0.65) + 0.5;

  // 4. Back Outseam at Crotch Level
  const b_crotch_outseam_x = bcx + (backHip * 0.60);
  const b_crotch_level_y = btopY + crotchDepth + 0.5;

  // 5. Back Knee Outseam (+0.5" wider than front for balance)
  const b_knee_outseam_x = bcx + (effectiveKneeWidth / 4) + 0.5;
  const b_knee_level_y = btopY + effectiveKneeHeight;

  // 6. Back Hem Outseam (+0.5" wider than front)
  const b_hem_outseam_x = bcx + (effectiveHemWidth / 4) + 0.5;
  const b_hem_level_y = btopY + totalLength;

  // 7. Back Hem Crease
  const b_hem_crease_x = bcx;
  const b_hem_crease_y = b_hem_level_y;

  // 8. Back Hem Inseam (-0.5" wider than front)
  const b_hem_inseam_x = bcx - (effectiveHemWidth / 4) - 0.5;
  const b_hem_inseam_y = b_hem_level_y;

  // 9. Back Knee Inseam (-0.5" wider than front)
  const b_knee_inseam_x = bcx - (effectiveKneeWidth / 4) - 0.5;

  // 10. Back Crotch Fork Tip (Inseam side, lowered 0.5" for stretch/stride balance)
  const b_crotch_fork_x = bcx - (backHip * 0.35) - backCrotchExt;
  const b_crotch_fork_y = b_crotch_level_y + 0.5;

  // 11. Center Back Seat Point
  const cb_seat_x = bcx - (backHip * 0.35);
  const cb_seat_y = b_hip_level_y + 0.5;

  // Convert Back Vertices to CAD Points
  const b_waist_center = createPoint(cb_waist_x * CAD_SCALE, cb_waist_y * CAD_SCALE, 'corner', {
    label: 'Center Back High Waist',
    gradeRule: { dx: -0.25, dy: -0.5 },
  });

  const b_waist_side = createPoint(b_side_waist_x * CAD_SCALE, b_side_waist_y * CAD_SCALE, 'corner', {
    label: 'Back Side Waist',
    gradeRule: { dx: 0.5, dy: -0.25 },
  });

  const b_hip_side = createPoint(b_hip_outseam_x * CAD_SCALE, b_hip_level_y * CAD_SCALE, 'smooth', {
    label: 'Back High Hip Outseam',
    cp1: { x: (b_side_waist_x + 0.5) * CAD_SCALE, y: (btopY + 3.0) * CAD_SCALE },
    cp2: { x: b_hip_outseam_x * CAD_SCALE, y: (b_hip_level_y - 1.5) * CAD_SCALE },
    gradeRule: { dx: 0.5, dy: 0 },
  });

  const b_crotch_side = createPoint(b_crotch_outseam_x * CAD_SCALE, b_crotch_level_y * CAD_SCALE, 'corner', {
    label: 'Back Outseam at Crotch Line',
    gradeRule: { dx: 0.5, dy: 0.25 },
  });

  const b_knee_side = createPoint(b_knee_outseam_x * CAD_SCALE, b_knee_level_y * CAD_SCALE, 'corner', {
    label: 'Back Knee Outseam',
    gradeRule: { dx: 0.25, dy: 0.5 },
    notch: 'v_notch',
  });

  const b_hem_side = createPoint(b_hem_outseam_x * CAD_SCALE, b_hem_level_y * CAD_SCALE, 'corner', {
    label: 'Back Hem Outseam',
    gradeRule: { dx: 0.25, dy: 1.0 },
  });

  const b_hem_crease = createPoint(b_hem_crease_x * CAD_SCALE, b_hem_crease_y * CAD_SCALE, 'corner', {
    label: 'Back Hem Crease',
    gradeRule: { dx: 0, dy: 1.0 },
  });

  const b_hem_inseam = createPoint(b_hem_inseam_x * CAD_SCALE, b_hem_inseam_y * CAD_SCALE, 'corner', {
    label: 'Back Hem Inseam',
    gradeRule: { dx: -0.25, dy: 1.0 },
  });

  const b_knee_inseam = createPoint(b_knee_inseam_x * CAD_SCALE, b_knee_level_y * CAD_SCALE, 'corner', {
    label: 'Back Knee Inseam',
    gradeRule: { dx: -0.25, dy: 0.5 },
    notch: 'v_notch',
  });

  const b_crotch_fork = createPoint(b_crotch_fork_x * CAD_SCALE, b_crotch_fork_y * CAD_SCALE, 'smooth', {
    label: 'Back Crotch Fork Tip',
    cp1: { x: (b_knee_inseam_x - 0.5) * CAD_SCALE, y: (b_crotch_level_y + 3.0) * CAD_SCALE },
    cp2: { x: (b_crotch_fork_x + 0.5) * CAD_SCALE, y: (b_crotch_fork_y + 0.75) * CAD_SCALE },
    gradeRule: { dx: -1.0, dy: 0.25 },
    notch: 'v_notch',
  });

  const b_seat_curve = createPoint(cb_seat_x * CAD_SCALE, cb_seat_y * CAD_SCALE, 'smooth', {
    label: 'Back Crotch Concave Arc to Seat Line',
    cp1: { x: (b_crotch_fork_x + backCrotchExt * 0.5) * CAD_SCALE, y: (b_crotch_fork_y) * CAD_SCALE },
    cp2: { x: (cb_seat_x - 0.25) * CAD_SCALE, y: (b_crotch_level_y - 1.5) * CAD_SCALE },
    gradeRule: { dx: 0, dy: 0 },
  });

  // Ordered clockwise perimeter for Back Leg
  const backPoints = [
    b_waist_center,
    b_waist_side,
    b_hip_side,
    b_crotch_side,
    b_knee_side,
    b_hem_side,
    b_hem_crease,
    b_hem_inseam,
    b_knee_inseam,
    b_crotch_fork,
    b_seat_curve,
  ];

  // Back waist dart calculation (0.75" intake, 3.5" length)
  const dartCenterX = (cb_waist_x + b_side_waist_x) * 0.5;
  const dartCenterY = (cb_waist_y + b_side_waist_y) * 0.5;

  const backPiece = createPatternPiece({
    id: 'TROUSER_BACK_LEG',
    name: isShorts ? 'SHORTS BACK LEG' : isJeans ? 'JEANS BACK LEG' : 'TROUSER BACK LEG',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: backPoints,
    seamAllowance,
    grainline: {
      x1: bcx * CAD_SCALE,
      y1: (btopY + 1.5) * CAD_SCALE,
      x2: bcx * CAD_SCALE,
      y2: (b_hem_level_y - 2.0) * CAD_SCALE,
      label: 'GRAINLINE / CREASE LINE',
    },
    darts: [
      {
        apex: { x: dartCenterX * CAD_SCALE, y: (dartCenterY + 3.5) * CAD_SCALE },
        left: { x: (dartCenterX - 0.375) * CAD_SCALE, y: dartCenterY * CAD_SCALE },
        right: { x: (dartCenterX + 0.375) * CAD_SCALE, y: dartCenterY * CAD_SCALE },
      },
    ],
    notches: [
      { x: b_crotch_fork_x * CAD_SCALE, y: b_crotch_fork_y * CAD_SCALE, label: 'Back Crotch Fork' },
      { x: b_knee_outseam_x * CAD_SCALE, y: b_knee_level_y * CAD_SCALE, label: 'Back Knee Outseam' },
      { x: b_knee_inseam_x * CAD_SCALE, y: b_knee_level_y * CAD_SCALE, label: 'Back Knee Inseam' },
    ],
    internalLines: [
      {
        type: 'line',
        x1: bcx * CAD_SCALE,
        y1: btopY * CAD_SCALE,
        x2: bcx * CAD_SCALE,
        y2: b_hem_level_y * CAD_SCALE,
        label: 'Pressed Crease Line',
      },
      {
        type: 'line',
        x1: b_crotch_fork_x * CAD_SCALE,
        y1: b_crotch_level_y * CAD_SCALE,
        x2: b_crotch_outseam_x * CAD_SCALE,
        y2: b_crotch_level_y * CAD_SCALE,
        label: 'Crotch Line Reference',
      },
      {
        type: 'line',
        x1: b_knee_inseam_x * CAD_SCALE,
        y1: b_knee_level_y * CAD_SCALE,
        x2: b_knee_outseam_x * CAD_SCALE,
        y2: b_knee_level_y * CAD_SCALE,
        label: 'Knee Line Reference',
      },
    ],
  });

  // =========================================================================
  // 3. WAISTBAND
  // =========================================================================
  // Total waistband length = waist + 2.5" (1.5" fly extension + 1.0" seam allowances)
  const wbLength = waist + 2.5;
  const wbHeight = 1.75;
  const wx0 = 8.0;
  const wy0 = totalLength + 8.0;

  const waistbandPoints = [
    createPoint(wx0 * CAD_SCALE, wy0 * CAD_SCALE, 'corner'),
    createPoint((wx0 + wbLength) * CAD_SCALE, wy0 * CAD_SCALE, 'corner'),
    createPoint((wx0 + wbLength) * CAD_SCALE, (wy0 + wbHeight) * CAD_SCALE, 'corner'),
    createPoint(wx0 * CAD_SCALE, (wy0 + wbHeight) * CAD_SCALE, 'corner'),
  ];

  const waistbandPiece = createPatternPiece({
    id: 'TROUSER_WAISTBAND',
    name: 'CONTOURED WAISTBAND',
    category: 'trim',
    cutQuantity: 'CUT 1 (SELF) + 1 (FUSIBLE)',
    points: waistbandPoints,
    seamAllowance,
    grainline: {
      x1: (wx0 + 2.0) * CAD_SCALE,
      y1: (wy0 + wbHeight / 2) * CAD_SCALE,
      x2: (wx0 + wbLength - 2.0) * CAD_SCALE,
      y2: (wy0 + wbHeight / 2) * CAD_SCALE,
      label: 'CROSSWISE GRAIN',
    },
    notches: [
      { x: (wx0 + 1.5) * CAD_SCALE, y: wy0 * CAD_SCALE, label: 'Fly Extension' },
      { x: (wx0 + 1.5 + frontWaist) * CAD_SCALE, y: wy0 * CAD_SCALE, label: 'Side Seam Match' },
      { x: (wx0 + 1.5 + frontWaist + backWaist - 0.75) * CAD_SCALE, y: wy0 * CAD_SCALE, label: 'Center Back' },
    ],
  });

  // =========================================================================
  // 4. FLY SHIELD & FACING
  // =========================================================================
  const flyLength = 7.5;
  const flyWidth = 2.0;
  const flx0 = 48.0;
  const fly0 = wy0;

  const flyPoints = [
    createPoint(flx0 * CAD_SCALE, fly0 * CAD_SCALE, 'corner'),
    createPoint((flx0 + flyWidth) * CAD_SCALE, fly0 * CAD_SCALE, 'corner'),
    createPoint((flx0 + flyWidth) * CAD_SCALE, (fly0 + flyLength - 1.5) * CAD_SCALE, 'smooth', {
      cp1: { x: (flx0 + flyWidth) * CAD_SCALE, y: (fly0 + flyLength) * CAD_SCALE },
      cp2: { x: (flx0 + 0.5) * CAD_SCALE, y: (fly0 + flyLength) * CAD_SCALE },
    }),
    createPoint(flx0 * CAD_SCALE, (fly0 + flyLength) * CAD_SCALE, 'corner'),
  ];

  const flyPiece = createPatternPiece({
    id: 'TROUSER_FLY_FACING',
    name: 'FLY SHIELD & FACING',
    category: 'lining',
    cutQuantity: 'CUT 2',
    points: flyPoints,
    seamAllowance,
    grainline: {
      x1: (flx0 + flyWidth / 2) * CAD_SCALE,
      y1: (fly0 + 1.0) * CAD_SCALE,
      x2: (flx0 + flyWidth / 2) * CAD_SCALE,
      y2: (fly0 + flyLength - 1.0) * CAD_SCALE,
      label: 'LENGTHWISE GRAIN',
    },
  });

  // =========================================================================
  // 5. SLANT POCKET BAG & FACING
  // =========================================================================
  const pocketWidth = 6.5;
  const pocketDepth = 11.0;
  const pkx0 = 54.0;
  const pky0 = wy0;

  const pocketPoints = [
    createPoint(pkx0 * CAD_SCALE, pky0 * CAD_SCALE, 'corner'),
    createPoint((pkx0 + pocketWidth) * CAD_SCALE, pky0 * CAD_SCALE, 'corner'),
    createPoint((pkx0 + pocketWidth) * CAD_SCALE, (pky0 + pocketDepth - 2.5) * CAD_SCALE, 'smooth', {
      cp1: { x: (pkx0 + pocketWidth) * CAD_SCALE, y: (pky0 + pocketDepth) * CAD_SCALE },
      cp2: { x: (pkx0 + 1.5) * CAD_SCALE, y: (pky0 + pocketDepth) * CAD_SCALE },
    }),
    createPoint(pkx0 * CAD_SCALE, (pky0 + pocketDepth) * CAD_SCALE, 'corner'),
  ];

  const pocketPiece = createPatternPiece({
    id: 'POCKET_FACING',
    name: 'FRONT POCKET BAG & FACING',
    category: 'lining',
    cutQuantity: 'CUT 2 (PAIR)',
    points: pocketPoints,
    seamAllowance,
    grainline: {
      x1: (pkx0 + pocketWidth / 2) * CAD_SCALE,
      y1: (pky0 + 1.0) * CAD_SCALE,
      x2: (pkx0 + pocketWidth / 2) * CAD_SCALE,
      y2: (pky0 + pocketDepth - 1.0) * CAD_SCALE,
      label: 'GRAIN',
    },
  });

  const pieces = [frontPiece, backPiece, waistbandPiece, flyPiece, pocketPiece];

  return {
    garmentType: garmentSpec.garmentType || 'trouser',
    pieces,
  };
}
