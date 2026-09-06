/**
 * TAILORIX AI — SKIRT, DRESS & GOWN PATTERN ENGINE
 * Parametric geometry engine generating Skirt front/back with darts, waistband,
 * and Evening Gown / Sheath Dress bodice + skirt components.
 */

import { createPatternPiece, createPoint } from '../../models/patternGeometry';

export function draftSkirtDressPattern(measurements = {}, parameters = {}, garmentSpec = {}) {
  const isGown = garmentSpec.garmentType === 'gown' || garmentSpec.garmentType === 'dress';

  const {
    waist = 28,
    hip = 38,
    skirtLength = isGown ? 44 : 25,
    hipDepth = 8,
    bustChest = 36,
  } = measurements;

  const {
    seamAllowance = 0.5,
    silhouette = garmentSpec.silhouette || (isGown ? 'column_sheath' : 'pencil'),
  } = parameters;

  const SCALE = 12;

  // Hip adjustments based on silhouette
  let hemWidthDelta = 0;
  if (silhouette === 'pencil') hemWidthDelta = -1.25;
  else if (silhouette === 'a_line' || silhouette === 'fit_and_flare') hemWidthDelta = 3.5;
  else if (silhouette === 'ballgown') hemWidthDelta = 8.0;

  const quarterWaistFront = (waist / 4) + 0.75; // +0.75" front dart
  const quarterWaistBack = (waist / 4) + 1.0;   // +1.0" back dart
  const quarterHip = (hip / 4) + 0.5;

  // --- 1. FRONT SKIRT BLOCK ---
  const fx0 = 40;
  const fy0 = 40;

  const frontPoints = [
    createPoint(fx0 * SCALE, (fy0 + 0.5) * SCALE, 'corner', { label: 'Center Front Waist' }),
    createPoint((fx0 + quarterWaistFront) * SCALE, fy0 * SCALE, 'corner', { label: 'Front Waist Side' }),
    createPoint((fx0 + quarterHip) * SCALE, (fy0 + hipDepth) * SCALE, 'smooth', {
      label: 'Full Hip Curve',
      cp1: { x: (fx0 + quarterWaistFront + 0.5) * SCALE, y: (fy0 + hipDepth * 0.4) * SCALE },
      cp2: { x: (fx0 + quarterHip) * SCALE, y: (fy0 + hipDepth * 0.8) * SCALE },
    }),
    createPoint((fx0 + quarterHip + hemWidthDelta) * SCALE, (fy0 + skirtLength) * SCALE, 'corner', { label: 'Side Hem' }),
    createPoint(fx0 * SCALE, (fy0 + skirtLength) * SCALE, 'corner', { label: 'Center Front Hem' }),
  ];

  const frontSkirtPiece = createPatternPiece({
    id: isGown ? 'GOWN_FRONT_SKIRT' : 'SKIRT_FRONT',
    name: isGown ? 'GOWN SKIRT FRONT' : 'SKIRT FRONT PANEL',
    category: 'shell',
    cutQuantity: 'CUT 1 ON FOLD',
    onFold: true,
    points: frontPoints,
    seamAllowance,
    grainline: {
      x1: (fx0 + 2) * SCALE,
      y1: (fy0 + 2) * SCALE,
      x2: (fx0 + 2) * SCALE,
      y2: (fy0 + skirtLength - 2) * SCALE,
      label: 'CENTER FRONT FOLD',
    },
    darts: [
      {
        apex: { x: (fx0 + quarterWaistFront * 0.5) * SCALE, y: (fy0 + 4) * SCALE },
        left: { x: (fx0 + quarterWaistFront * 0.5 - 0.375) * SCALE, y: fy0 * SCALE },
        right: { x: (fx0 + quarterWaistFront * 0.5 + 0.375) * SCALE, y: fy0 * SCALE },
      },
    ],
  });

  // --- 2. BACK SKIRT BLOCK ---
  const bx0 = 260;
  const by0 = 40;

  const backPoints = [
    createPoint(bx0 * SCALE, (by0 + 0.5) * SCALE, 'corner', { label: 'Center Back Waist' }),
    createPoint((bx0 + quarterWaistBack) * SCALE, by0 * SCALE, 'corner', { label: 'Back Waist Side' }),
    createPoint((bx0 + quarterHip) * SCALE, (by0 + hipDepth) * SCALE, 'smooth', {
      label: 'Back Full Hip Curve',
      cp1: { x: (bx0 + quarterWaistBack + 0.5) * SCALE, y: (by0 + hipDepth * 0.4) * SCALE },
      cp2: { x: (bx0 + quarterHip) * SCALE, y: (by0 + hipDepth * 0.8) * SCALE },
    }),
    createPoint((bx0 + quarterHip + hemWidthDelta) * SCALE, (by0 + skirtLength) * SCALE, 'corner', { label: 'Back Side Hem' }),
    createPoint(bx0 * SCALE, (by0 + skirtLength) * SCALE, 'corner', { label: 'Center Back Hem' }),
  ];

  const backSkirtPiece = createPatternPiece({
    id: isGown ? 'GOWN_BACK_SKIRT' : 'SKIRT_BACK',
    name: isGown ? 'GOWN SKIRT BACK' : 'SKIRT BACK PANEL',
    category: 'shell',
    cutQuantity: 'CUT 2 (PAIR)',
    points: backPoints,
    seamAllowance,
    grainline: {
      x1: (bx0 + 2) * SCALE,
      y1: (by0 + 2) * SCALE,
      x2: (bx0 + 2) * SCALE,
      y2: (by0 + skirtLength - 2) * SCALE,
      label: 'CENTER BACK GRAIN',
    },
    darts: [
      {
        apex: { x: (bx0 + quarterWaistBack * 0.5) * SCALE, y: (by0 + 5.5) * SCALE },
        left: { x: (bx0 + quarterWaistBack * 0.5 - 0.5) * SCALE, y: by0 * SCALE },
        right: { x: (bx0 + quarterWaistBack * 0.5 + 0.5) * SCALE, y: by0 * SCALE },
      },
    ],
    internalLines: [
      {
        type: 'line',
        x1: bx0 * SCALE,
        y1: (by0 + skirtLength - 6) * SCALE,
        x2: (bx0 + 1.5) * SCALE,
        y2: (by0 + skirtLength - 6) * SCALE,
        label: 'Kick Pleat / Walking Vent',
      },
    ],
  });

  // --- 3. CONTOURED WAISTBAND (FOR SKIRT) ---
  const wx0 = 40;
  const wy0 = (fy0 + skirtLength + 6);
  const wbLength = waist + 1.5;
  const wbHeight = 1.75;

  const waistbandPiece = createPatternPiece({
    id: 'SKIRT_WAISTBAND',
    name: 'CONTOUR SKIRT WAISTBAND',
    category: 'trim',
    cutQuantity: 'CUT 1 + 1 FUSIBLE',
    points: [
      createPoint(wx0 * SCALE, wy0 * SCALE, 'corner'),
      createPoint((wx0 + wbLength) * SCALE, wy0 * SCALE, 'corner'),
      createPoint((wx0 + wbLength) * SCALE, (wy0 + wbHeight) * SCALE, 'corner'),
      createPoint(wx0 * SCALE, (wy0 + wbHeight) * SCALE, 'corner'),
    ],
    seamAllowance,
    grainline: {
      x1: (wx0 + 2) * SCALE,
      y1: (wy0 + wbHeight / 2) * SCALE,
      x2: (wx0 + wbLength - 2) * SCALE,
      y2: (wy0 + wbHeight / 2) * SCALE,
      label: 'LENGTHWISE GRAIN',
    },
  });

  // If Gown / Dress, also generate structured Bodice components
  if (isGown) {
    const bodiceHeight = 15;
    const quarterBust = (bustChest / 4) + 0.5;

    const gx0 = 460;
    const gy0 = 40;

    const gownBodiceFront = createPatternPiece({
      id: 'GOWN_BODICE_FRONT',
      name: 'GOWN CORSET BODICE (FRONT)',
      category: 'shell',
      cutQuantity: 'CUT 1 ON FOLD',
      onFold: true,
      points: [
        createPoint(gx0 * SCALE, (gy0 + 3) * SCALE, 'smooth', {
          label: 'Sweetheart Center Neck',
          cp1: { x: (gx0 + 2) * SCALE, y: gy0 * SCALE },
          cp2: { x: (gx0 + quarterBust * 0.5) * SCALE, y: gy0 * SCALE },
        }),
        createPoint((gx0 + quarterBust) * SCALE, (gy0 + 4) * SCALE, 'corner', { label: 'Underarm Side' }),
        createPoint((gx0 + quarterWaistFront) * SCALE, (gy0 + bodiceHeight) * SCALE, 'corner', { label: 'Waist Side' }),
        createPoint(gx0 * SCALE, (gy0 + bodiceHeight) * SCALE, 'corner', { label: 'Waist Center Front' }),
      ],
      seamAllowance,
      grainline: {
        x1: (gx0 + 2) * SCALE,
        y1: (gy0 + 2) * SCALE,
        x2: (gx0 + 2) * SCALE,
        y2: (gy0 + bodiceHeight - 2) * SCALE,
        label: 'CENTER FRONT FOLD',
      },
      darts: [
        {
          apex: { x: (gx0 + quarterBust * 0.6) * SCALE, y: (gy0 + 7) * SCALE },
          left: { x: (gx0 + quarterWaistFront * 0.5 - 0.5) * SCALE, y: (gy0 + bodiceHeight) * SCALE },
          right: { x: (gx0 + quarterWaistFront * 0.5 + 0.5) * SCALE, y: (gy0 + bodiceHeight) * SCALE },
        },
      ],
    });

    return {
      garmentType: garmentSpec.garmentType || 'gown',
      pieces: [frontSkirtPiece, backSkirtPiece, gownBodiceFront],
    };
  }

  return {
    garmentType: garmentSpec.garmentType || 'skirt',
    pieces: [frontSkirtPiece, backSkirtPiece, waistbandPiece],
  };
}
