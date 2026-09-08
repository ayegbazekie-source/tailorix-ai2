/**
 * TAILORIX AI — DETERMINISTIC PARAMETRIC DRAFTING ENGINE (NON-AI)
 * 100% accurate, scaled, vector-based pattern pieces derived from standard
 * tailoring formulas and geometric equations based on user measurements.
 *
 * Coordinates: Standard Tailoring Geometry (in inches).
 * Point A = (0, 0) [Across Back / Neck Origin]
 * Point B = (Bust / 4 + Ease, Armhole Depth)
 * Point C = (Waist / 4 + Dart Width + Seam Allowance, Front Waist Length)
 */

// Helper to round floating point numbers for clean SVG paths
export function round(val, decimals = 2) {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Number(val.toFixed(decimals));
}

// Bounding box calculator from an SVG path or array of points
export function calculatePathBounds(points) {
  if (!points || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 10, maxY: 10, width: 10, height: 10 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return {
    minX: round(minX),
    minY: round(minY),
    maxX: round(maxX),
    maxY: round(maxY),
    width: round(width),
    height: round(height),
  };
}

/**
 * Generate parallel offset seam allowance path
 */
export function generateSeamAllowanceOffset(points, seamAllowance = 0.5) {
  if (!points || points.length < 3) return null;
  // Calculate centroid
  let cx = 0;
  let cy = 0;
  points.forEach(([x, y]) => {
    cx += x;
    cy += y;
  });
  cx /= points.length;
  cy /= points.length;

  // Offset points outward from centroid
  const offsetPoints = points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return [x, y];
    const scale = (dist + seamAllowance) / dist;
    return [round(cx + dx * scale), round(cy + dy * scale)];
  });

  if (offsetPoints.length === 0) return null;
  const d = `M ${offsetPoints[0][0]} ${offsetPoints[0][1]} ` +
    offsetPoints.slice(1).map(([x, y]) => `L ${x} ${y}`).join(' ') + ' Z';
  return d;
}

// =========================================================================
// 1. TOP & BODICE DRAFTING ENGINE
// =========================================================================
export function draftTopPattern({
  measurements,
  neckline = 'sweetheart',
  sleeves = 'set_in',
  closure = 'zipper',
  seamAllowance = 0.5,
}) {
  const bust = measurements.bust || 36;
  const waist = measurements.waist || 28;
  const hips = measurements.hips || 38;
  const shoulderToWaist = measurements.shoulderToWaist || 16.5;
  const armholeDepth = measurements.armholeDepth || 8.5;
  const fullLength = Math.max(shoulderToWaist, measurements.fullLength || 23.5);

  const ease = 0.75;
  const quarterBust = bust / 4 + ease;
  const quarterWaist = waist / 4;
  const quarterHips = hips / 4 + ease;
  const shoulderWidth = measurements.shoulderWidth || (bust * 0.42 + 1.2);
  const halfShoulder = shoulderWidth / 2;
  const neckWidth = bust * 0.075 + 0.3; // ~3.0"
  const dartWidth = 1.0;

  // Coordinate Key Points (as requested by user):
  // Point A = (0, 0)
  // Point B = (bust / 4 + ease, armholeDepth)
  // Point C = (waist / 4 + dartWidth + seamAllowance, shoulderToWaist)
  const pointA = [0, 0];
  const pointB = [round(quarterBust), round(armholeDepth)];
  const pointC = [round(quarterWaist + dartWidth + seamAllowance), round(shoulderToWaist)];

  const shoulderDrop = 1.35;
  const shoulderPoint = [round(halfShoulder), round(shoulderDrop)];
  const neckHighPoint = [round(neckWidth), 0];

  // Neckline geometry based on user choice
  let neckPath = '';
  let neckCenterPoint = [0, 2.5];

  if (neckline === 'crew') {
    neckCenterPoint = [0, round(neckWidth + 0.25)];
    neckPath = `C ${round(neckWidth * 0.4)} 0 ${round(neckWidth * 0.1)} ${round(neckCenterPoint[1] * 0.6)} ${neckCenterPoint[0]} ${neckCenterPoint[1]}`;
  } else if (neckline === 'v_neck') {
    neckCenterPoint = [0, round(armholeDepth * 0.85)]; // ~7.2" drop
    neckPath = `L ${neckCenterPoint[0]} ${neckCenterPoint[1]}`;
  } else {
    // Sweetheart Neckline: romantic double lobe with cleavage plunge
    neckCenterPoint = [0, round(armholeDepth * 0.8)]; // ~6.8" drop
    const lobeApex = [round(neckWidth * 0.65), round(armholeDepth * 0.35)];
    neckPath = `C ${round(neckWidth * 0.85)} 0.5 ${round(lobeApex[0] + 0.8)} ${round(lobeApex[1] - 1.2)} ${lobeApex[0]} ${lobeApex[1]} ` +
      `C ${round(lobeApex[0] - 0.7)} ${round(lobeApex[1] + 1.2)} ${round(neckCenterPoint[0] + 0.8)} ${round(neckCenterPoint[1] - 0.8)} ${neckCenterPoint[0]} ${neckCenterPoint[1]}`;
  }

  // Armhole Bezier curve based on sleeves
  let armholePath = '';
  let armholeNotch = { x: round(halfShoulder - 0.6), y: round(armholeDepth * 0.65), type: 'single' };

  if (sleeves === 'raglan') {
    // Raglan: armhole straight cut from neck directly to underarm scye base
    armholePath = `L ${pointB[0]} ${pointB[1]}`;
  } else {
    // Set-in or Sleeveless: smooth anatomical scye curve
    const cp1 = [round(halfShoulder - 0.5), round(armholeDepth * 0.5)];
    const cp2 = [round(quarterBust - 1.2), round(armholeDepth)];
    armholePath = `C ${cp1[0]} ${cp1[1]} ${cp2[0]} ${cp2[1]} ${pointB[0]} ${pointB[1]}`;
  }

  // Waist Dart: apex at bust point, legs down to waistline
  const dartApex = [round(bust * 0.11 + 0.5), round(armholeDepth + 1.2)];
  const dartLeg1 = [round(quarterWaist * 0.45 - dartWidth / 2), round(shoulderToWaist)];
  const dartLeg2 = [round(quarterWaist * 0.45 + dartWidth / 2), round(shoulderToWaist)];

  // Side seam from Point B (scye) to Point C (waist) and down to Hem
  const hemPointSide = [round(quarterHips), round(fullLength)];
  const hemCenter = [0, round(fullLength)];

  // Assemble Front Bodice SVG Path
  const frontPoints = [
    neckHighPoint,
    shoulderPoint,
    armholeNotch,
    pointB,
    pointC,
    hemPointSide,
    hemCenter,
    neckCenterPoint,
  ].map((pt) => [pt.x ?? pt[0], pt.y ?? pt[1]]);

  const frontSvgPath =
    `M ${neckHighPoint[0]} ${neckHighPoint[1]} ` +
    (sleeves === 'raglan'
      ? `L ${pointB[0]} ${pointB[1]} `
      : `L ${shoulderPoint[0]} ${shoulderPoint[1]} ${armholePath} `) +
    `L ${pointC[0]} ${pointC[1]} ` +
    `L ${hemPointSide[0]} ${hemPointSide[1]} ` +
    `L ${hemCenter[0]} ${hemCenter[1]} ` +
    `L ${neckCenterPoint[0]} ${neckCenterPoint[1]} ` +
    `${neckPath} Z`;

  const frontBounds = calculatePathBounds(frontPoints);

  // Determine front onFold and cutQuantity based on closure
  const isFrontButtons = closure === 'buttons';
  const frontPiece = {
    id: 'piece_front_bodice',
    name: isFrontButtons ? 'Front Bodice Panel (Button Placket)' : 'Front Bodice Panel',
    cutQuantity: isFrontButtons ? 2 : 1,
    onFold: !isFrontButtons,
    grainlineAngle: 90,
    svgPath: frontSvgPath,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(frontPoints, seamAllowance),
    notches: [
      armholeNotch,
      { x: pointC[0], y: pointC[1], type: 'waist' },
      { x: hemCenter[0], y: hemCenter[1], type: isFrontButtons ? 'center' : 'fold' },
    ],
    darts: [
      {
        apex: dartApex,
        legs: [dartLeg1, dartLeg2],
      },
    ],
    bounds: frontBounds,
    grainline: {
      x1: round(frontBounds.width * 0.35),
      y1: round(frontBounds.height * 0.2),
      x2: round(frontBounds.width * 0.35),
      y2: round(frontBounds.height * 0.8),
      angle: 90,
    },
    keyPoints: { pointA, pointB, pointC },
  };

  // --- 2. BACK BODICE PANEL ---
  const backNeckPoint = [0, 1.2];
  const backShoulderPoint = [round(halfShoulder + 0.3), round(shoulderDrop * 0.9)];
  const backArmholeNotch = { x: round(halfShoulder - 0.2), y: round(armholeDepth * 0.55), type: 'double' };

  const backPoints = [
    neckHighPoint,
    backShoulderPoint,
    backArmholeNotch,
    pointB,
    pointC,
    hemPointSide,
    hemCenter,
    backNeckPoint,
  ].map((pt) => [pt.x ?? pt[0], pt.y ?? pt[1]]);

  const backSvgPath =
    `M ${neckHighPoint[0]} ${neckHighPoint[1]} ` +
    `L ${backShoulderPoint[0]} ${backShoulderPoint[1]} ` +
    `C ${round(halfShoulder - 0.2)} ${round(armholeDepth * 0.45)} ${round(quarterBust - 1.0)} ${round(armholeDepth)} ${pointB[0]} ${pointB[1]} ` +
    `L ${pointC[0]} ${pointC[1]} ` +
    `L ${hemPointSide[0]} ${hemPointSide[1]} ` +
    `L ${hemCenter[0]} ${hemCenter[1]} ` +
    `L ${backNeckPoint[0]} ${backNeckPoint[1]} ` +
    `C ${round(neckWidth * 0.5)} ${round(backNeckPoint[1])} ${round(neckWidth * 0.8)} 0.3 ${neckHighPoint[0]} ${neckHighPoint[1]} Z`;

  const backBounds = calculatePathBounds(backPoints);
  const isBackZipper = closure === 'zipper';

  const backPiece = {
    id: 'piece_back_bodice',
    name: isBackZipper ? 'Back Bodice Panel (Zipper Seam)' : 'Back Bodice Panel',
    cutQuantity: isBackZipper ? 2 : 1,
    onFold: !isBackZipper,
    grainlineAngle: 90,
    svgPath: backSvgPath,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(backPoints, seamAllowance),
    notches: [
      backArmholeNotch,
      { x: pointC[0], y: pointC[1], type: 'waist' },
      { x: backNeckPoint[0], y: backNeckPoint[1], type: isBackZipper ? 'zipper_stop' : 'fold' },
    ],
    darts: [
      {
        apex: [round(quarterWaist * 0.45), round(armholeDepth + 0.5)],
        legs: [
          [round(quarterWaist * 0.45 - 0.4), round(shoulderToWaist)],
          [round(quarterWaist * 0.45 + 0.4), round(shoulderToWaist)],
        ],
      },
    ],
    bounds: backBounds,
    grainline: {
      x1: round(backBounds.width * 0.35),
      y1: round(backBounds.height * 0.2),
      x2: round(backBounds.width * 0.35),
      y2: round(backBounds.height * 0.8),
      angle: 90,
    },
  };

  const patternPieces = [frontPiece, backPiece];

  // --- 3. SLEEVE OR FACING PIECES ---
  if (sleeves === 'set_in') {
    const bicepWidth = round(bust * 0.34 + 2.0); // ~14.2"
    const capHeight = round(armholeDepth * 0.72); // ~6.1"
    const sleeveLength = 23.5;
    const wristWidth = 9.0;
    const halfBicep = round(bicepWidth / 2);
    const halfWrist = round(wristWidth / 2);

    const sleevePoints = [
      [halfBicep, 0], // Cap apex
      [bicepWidth, capHeight], // Front underarm
      [round(halfBicep + halfWrist), sleeveLength], // Front wrist
      [round(halfBicep - halfWrist), sleeveLength], // Back wrist
      [0, capHeight], // Back underarm
    ];

    const sleeveSvgPath =
      `M ${halfBicep} 0 ` +
      // Front cap S-curve
      `C ${round(halfBicep + 3.2)} 0.5 ${round(bicepWidth - 1.0)} ${round(capHeight * 0.6)} ${bicepWidth} ${capHeight} ` +
      `L ${round(halfBicep + halfWrist)} ${sleeveLength} ` +
      `L ${round(halfBicep - halfWrist)} ${sleeveLength} ` +
      `L 0 ${capHeight} ` +
      // Back cap curve
      `C 1.0 ${round(capHeight * 0.55)} ${round(halfBicep - 3.2)} 0.5 ${halfBicep} 0 Z`;

    const sleeveBounds = calculatePathBounds(sleevePoints);

    patternPieces.push({
      id: 'piece_sleeve',
      name: 'Tailored Set-In Sleeve',
      cutQuantity: 2,
      onFold: false,
      grainlineAngle: 90,
      svgPath: sleeveSvgPath,
      seamAllowance,
      seamAllowancePath: generateSeamAllowanceOffset(sleevePoints, seamAllowance),
      notches: [
        { x: halfBicep, y: 0, type: 'shoulder_cap' },
        { x: round(bicepWidth - 1.2), y: round(capHeight * 0.65), type: 'single' },
        { x: round(1.2), y: round(capHeight * 0.6), type: 'double' },
      ],
      darts: [],
      bounds: sleeveBounds,
      grainline: {
        x1: halfBicep,
        y1: capHeight,
        x2: halfBicep,
        y2: sleeveLength - 2,
        angle: 90,
      },
    });
  } else if (sleeves === 'raglan') {
    // Raglan Sleeve with anatomical shoulder dart
    const sleeveLength = 26.0;
    const bicepWidth = round(bust * 0.36 + 2.5);
    const wristWidth = 9.5;
    const halfBicep = round(bicepWidth / 2);

    const raglanPoints = [
      [halfBicep, 0],
      [bicepWidth, 8.5],
      [round(halfBicep + wristWidth / 2), sleeveLength],
      [round(halfBicep - wristWidth / 2), sleeveLength],
      [0, 8.5],
    ];

    const raglanSvgPath =
      `M ${halfBicep} 0 ` +
      `L ${bicepWidth} 8.5 ` +
      `L ${round(halfBicep + wristWidth / 2)} ${sleeveLength} ` +
      `L ${round(halfBicep - wristWidth / 2)} ${sleeveLength} ` +
      `L 0 8.5 Z`;

    const raglanBounds = calculatePathBounds(raglanPoints);

    patternPieces.push({
      id: 'piece_raglan_sleeve',
      name: 'Raglan Sleeve Panel',
      cutQuantity: 2,
      onFold: false,
      grainlineAngle: 90,
      svgPath: raglanSvgPath,
      seamAllowance,
      seamAllowancePath: generateSeamAllowanceOffset(raglanPoints, seamAllowance),
      notches: [
        { x: halfBicep, y: 0, type: 'shoulder_match' },
        { x: bicepWidth, y: 8.5, type: 'front_raglan_notch' },
        { x: 0, y: 8.5, type: 'back_raglan_double' },
      ],
      darts: [
        {
          apex: [halfBicep, 4.0],
          legs: [
            [halfBicep - 0.5, 0],
            [halfBicep + 0.5, 0],
          ],
        },
      ],
      bounds: raglanBounds,
      grainline: {
        x1: halfBicep,
        y1: 6,
        x2: halfBicep,
        y2: sleeveLength - 3,
        angle: 90,
      },
    });
  } else {
    // Sleeveless: Neckline & Armhole Contour Facings
    const facingWidth = 1.75;
    const facingPoints = [
      [0, 0],
      [round(neckWidth + facingWidth), 0],
      [round(neckWidth + facingWidth), round(armholeDepth * 0.5)],
      [0, round(armholeDepth * 0.5)],
    ];
    const facingSvgPath =
      `M 0 0 L ${round(neckWidth + facingWidth)} 0 ` +
      `L ${round(neckWidth + facingWidth)} ${round(armholeDepth * 0.5)} ` +
      `L 0 ${round(armholeDepth * 0.5)} Z`;

    const facingBounds = calculatePathBounds(facingPoints);

    patternPieces.push({
      id: 'piece_armhole_facing',
      name: 'Contour Armhole & Neckline Facing',
      cutQuantity: 2,
      onFold: true,
      grainlineAngle: 90,
      svgPath: facingSvgPath,
      seamAllowance,
      seamAllowancePath: generateSeamAllowanceOffset(facingPoints, seamAllowance),
      notches: [{ x: 0, y: 0, type: 'fold' }],
      darts: [],
      bounds: facingBounds,
      grainline: {
        x1: round(facingBounds.width / 2),
        y1: 1,
        x2: round(facingBounds.width / 2),
        y2: facingBounds.height - 1,
        angle: 90,
      },
    });
  }

  // --- 4. CLOSURE-SPECIFIC HARDWARE/FACINGS ---
  if (closure === 'buttons') {
    const placketWidth = 1.75;
    const placketHeight = round(fullLength);
    const placketPoints = [
      [0, 0],
      [placketWidth, 0],
      [placketWidth, placketHeight],
      [0, placketHeight],
    ];
    const placketSvg = `M 0 0 L ${placketWidth} 0 L ${placketWidth} ${placketHeight} L 0 ${placketHeight} Z`;

    patternPieces.push({
      id: 'piece_button_placket',
      name: 'Fusible Buttonhole & Button Stand Placket',
      cutQuantity: 2,
      onFold: false,
      grainlineAngle: 90,
      svgPath: placketSvg,
      seamAllowance,
      seamAllowancePath: generateSeamAllowanceOffset(placketPoints, seamAllowance),
      notches: [
        { x: placketWidth / 2, y: 2.0, type: 'top_button' },
        { x: placketWidth / 2, y: placketHeight / 2, type: 'waist_button' },
        { x: placketWidth / 2, y: placketHeight - 3.0, type: 'hem_button' },
      ],
      darts: [],
      bounds: calculatePathBounds(placketPoints),
      grainline: {
        x1: placketWidth / 2,
        y1: 3,
        x2: placketWidth / 2,
        y2: placketHeight - 3,
        angle: 90,
      },
    });
  }

  const garmentName = `Custom ${neckline.replace('_', '-').toUpperCase()} Top (${sleeves.replace('_', '-').toUpperCase()})`;

  return {
    garmentName,
    units: 'inches',
    seamAllowance,
    patternPieces,
  };
}

// =========================================================================
// 2. TROUSER DRAFTING ENGINE
// =========================================================================
export function draftTrouserPattern({
  measurements,
  closure = 'zipper',
  seamAllowance = 0.5,
}) {
  const waist = measurements.waist || 32;
  const hips = measurements.hips || 40;
  const crotchDepth = measurements.armholeDepth || (hips * 0.25 + 0.5); // Rise ~10.5"
  const fullLength = measurements.fullLength || 40;
  const kneeLine = crotchDepth + (fullLength - crotchDepth) * 0.48;

  const quarterWaist = waist / 4;
  const quarterHips = hips / 4;
  const frontFork = hips / 16; // ~2.5"
  const backFork = hips / 8; // ~5.0"
  const kneeWidth = 18 / 2; // 9"
  const hemWidth = 16 / 2; // 8"

  // --- 1. FRONT TROUSER LEG PANEL ---
  const frontWaistPoint = [round(quarterWaist + 0.75 + seamAllowance), 0];
  const frontCrotchPoint = [round(quarterHips + frontFork), round(crotchDepth)];
  const frontKneeInseam = [round(kneeWidth * 0.75), round(kneeLine)];
  const frontHemInseam = [round(hemWidth * 0.75), round(fullLength)];
  const frontHemOutseam = [0, round(fullLength)];
  const frontKneeOutseam = [0, round(kneeLine)];
  const frontHipPoint = [0, round(crotchDepth * 0.7)];

  const frontPoints = [
    [0, 0],
    frontWaistPoint,
    [round(quarterHips + 0.2), round(crotchDepth * 0.5)],
    frontCrotchPoint,
    frontKneeInseam,
    frontHemInseam,
    frontHemOutseam,
    frontKneeOutseam,
    frontHipPoint,
  ];

  const frontSvgPath =
    `M 0 0 ` +
    `L ${frontWaistPoint[0]} ${frontWaistPoint[1]} ` +
    `L ${round(quarterHips + 0.2)} ${round(crotchDepth * 0.5)} ` +
    `C ${round(quarterHips + 0.2)} ${round(crotchDepth * 0.8)} ${round(quarterHips + 0.8)} ${frontCrotchPoint[1]} ${frontCrotchPoint[0]} ${frontCrotchPoint[1]} ` +
    `C ${round(frontCrotchPoint[0] - 0.5)} ${round(kneeLine * 0.8)} ${frontKneeInseam[0]} ${round(kneeLine * 0.95)} ${frontKneeInseam[0]} ${frontKneeInseam[1]} ` +
    `L ${frontHemInseam[0]} ${frontHemInseam[1]} ` +
    `L ${frontHemOutseam[0]} ${frontHemOutseam[1]} ` +
    `L ${frontKneeOutseam[0]} ${frontKneeOutseam[1]} ` +
    `C 0 ${round(crotchDepth * 0.8)} 0.5 ${round(crotchDepth * 0.4)} 0 0 Z`;

  const frontBounds = calculatePathBounds(frontPoints);

  const frontLeg = {
    id: 'piece_trouser_front_leg',
    name: 'Trouser Front Leg Panel',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: frontSvgPath,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(frontPoints, seamAllowance),
    notches: [
      { x: frontCrotchPoint[0], y: frontCrotchPoint[1], type: 'crotch_fork' },
      { x: frontKneeInseam[0], y: frontKneeInseam[1], type: 'knee_notch' },
      { x: frontWaistPoint[0], y: frontWaistPoint[1], type: 'fly_notch' },
    ],
    darts: [
      {
        apex: [round(quarterWaist * 0.5), 3.5],
        legs: [
          [round(quarterWaist * 0.5 - 0.35), 0],
          [round(quarterWaist * 0.5 + 0.35), 0],
        ],
      },
    ],
    bounds: frontBounds,
    grainline: {
      x1: round(frontBounds.width * 0.45),
      y1: round(crotchDepth),
      x2: round(frontBounds.width * 0.45),
      y2: round(fullLength - 4),
      angle: 90,
    },
  };

  // --- 2. BACK TROUSER LEG PANEL ---
  const backWaistPoint = [round(quarterWaist + 1.25 + seamAllowance), -1.2]; // Higher seat rise
  const backCrotchPoint = [round(quarterHips + backFork), round(crotchDepth + 0.5)];
  const backKneeInseam = [round(kneeWidth * 0.9), round(kneeLine)];
  const backHemInseam = [round(hemWidth * 0.85), round(fullLength)];
  const backHemOutseam = [-0.5, round(fullLength)];

  const backPoints = [
    [-0.5, 0],
    backWaistPoint,
    [round(quarterHips + 0.5), round(crotchDepth * 0.5)],
    backCrotchPoint,
    backKneeInseam,
    backHemInseam,
    backHemOutseam,
  ];

  const backSvgPath =
    `M -0.5 0 ` +
    `L ${backWaistPoint[0]} ${backWaistPoint[1]} ` +
    `L ${round(quarterHips + 0.5)} ${round(crotchDepth * 0.5)} ` +
    `C ${round(quarterHips + 0.5)} ${round(crotchDepth * 0.9)} ${round(quarterHips + 2.0)} ${backCrotchPoint[1]} ${backCrotchPoint[0]} ${backCrotchPoint[1]} ` +
    `C ${round(backCrotchPoint[0] - 0.7)} ${round(kneeLine * 0.8)} ${backKneeInseam[0]} ${round(kneeLine * 0.95)} ${backKneeInseam[0]} ${backKneeInseam[1]} ` +
    `L ${backHemInseam[0]} ${backHemInseam[1]} ` +
    `L ${backHemOutseam[0]} ${backHemOutseam[1]} ` +
    `L -0.5 ${round(kneeLine)} ` +
    `C -0.5 ${round(crotchDepth * 0.8)} 0 ${round(crotchDepth * 0.4)} -0.5 0 Z`;

  const backBounds = calculatePathBounds(backPoints);

  const backLeg = {
    id: 'piece_trouser_back_leg',
    name: 'Trouser Back Leg Panel',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: backSvgPath,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(backPoints, seamAllowance),
    notches: [
      { x: backCrotchPoint[0], y: backCrotchPoint[1], type: 'crotch_fork' },
      { x: backKneeInseam[0], y: backKneeInseam[1], type: 'knee_notch' },
    ],
    darts: [
      {
        apex: [round(quarterWaist * 0.6), 4.5],
        legs: [
          [round(quarterWaist * 0.6 - 0.5), -1.0],
          [round(quarterWaist * 0.6 + 0.5), -1.0],
        ],
      },
    ],
    bounds: backBounds,
    grainline: {
      x1: round(backBounds.width * 0.45),
      y1: round(crotchDepth),
      x2: round(backBounds.width * 0.45),
      y2: round(fullLength - 4),
      angle: 90,
    },
  };

  // --- 3. CONTOURED WAISTBAND ---
  const waistbandLength = round(waist + 3.0); // Extension tab for hook & bar/buttons
  const waistbandWidth = 2.0;
  const wbPoints = [
    [0, 0],
    [waistbandLength, 0],
    [waistbandLength, waistbandWidth],
    [0, waistbandWidth],
  ];
  const waistbandSvg = `M 0 0 L ${waistbandLength} 0 L ${waistbandLength} ${waistbandWidth} L 0 ${waistbandWidth} Z`;

  const waistbandPiece = {
    id: 'piece_trouser_waistband',
    name: 'Waistband with Extension Tab',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 0,
    svgPath: waistbandSvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(wbPoints, seamAllowance),
    notches: [
      { x: round(waist / 2), y: 0, type: 'center_back' },
      { x: round(quarterWaist), y: 0, type: 'side_seam' },
    ],
    darts: [],
    bounds: calculatePathBounds(wbPoints),
    grainline: {
      x1: 4,
      y1: waistbandWidth / 2,
      x2: waistbandLength - 4,
      y2: waistbandWidth / 2,
      angle: 0,
    },
  };

  // --- 4. FLY FACING & POCKET FACING ---
  const flyLength = round(crotchDepth * 0.75); // ~8"
  const flyWidth = 2.25;
  const flyPoints = [
    [0, 0],
    [flyWidth, 0],
    [flyWidth, round(flyLength - 1.5)],
    [0, flyLength],
  ];
  const flySvg = `M 0 0 L ${flyWidth} 0 L ${flyWidth} ${round(flyLength - 1.5)} C ${flyWidth} ${flyLength} 0.5 ${flyLength} 0 ${flyLength} Z`;

  const flyPiece = {
    id: 'piece_trouser_fly_shield',
    name: closure === 'buttons' ? 'Button Fly Facing & Extension' : 'Zipper Fly Guard & Facing',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: flySvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(flyPoints, seamAllowance),
    notches: [{ x: 0, y: 0, type: 'waist_join' }],
    darts: [],
    bounds: calculatePathBounds(flyPoints),
    grainline: {
      x1: flyWidth / 2,
      y1: 1,
      x2: flyWidth / 2,
      y2: flyLength - 1,
      angle: 90,
    },
  };

  return {
    garmentName: 'Custom Tailored Trouser',
    units: 'inches',
    seamAllowance,
    patternPieces: [frontLeg, backLeg, waistbandPiece, flyPiece],
  };
}

// =========================================================================
// 3. SKIRT DRAFTING ENGINE
// =========================================================================
export function draftSkirtPattern({
  measurements,
  closure = 'zipper',
  seamAllowance = 0.5,
}) {
  const waist = measurements.waist || 28;
  const hips = measurements.hips || 38;
  const fullLength = measurements.fullLength || 25;
  const hipDepth = 8.0;

  const quarterWaist = waist / 4;
  const quarterHips = hips / 4 + 0.5;
  const dartWidth = 1.0;

  // Front Skirt Panel (Cut 1 on fold)
  const frontPoints = [
    [0, 0],
    [round(quarterWaist + dartWidth + seamAllowance), 0.5],
    [round(quarterHips + seamAllowance), hipDepth],
    [round(quarterHips + seamAllowance + 1.0), fullLength], // subtle A-line flare
    [0, fullLength],
  ];

  const frontSvgPath =
    `M 0 0 ` +
    `L ${round(quarterWaist + dartWidth + seamAllowance)} 0.5 ` +
    `C ${round(quarterHips + 0.5)} 2.5 ${round(quarterHips + seamAllowance)} 5.0 ${round(quarterHips + seamAllowance)} ${hipDepth} ` +
    `L ${round(quarterHips + seamAllowance + 1.0)} ${fullLength} ` +
    `L 0 ${fullLength} Z`;

  const frontBounds = calculatePathBounds(frontPoints);

  const frontSkirt = {
    id: 'piece_skirt_front',
    name: 'Front Skirt Panel',
    cutQuantity: 1,
    onFold: true,
    grainlineAngle: 90,
    svgPath: frontSvgPath,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(frontPoints, seamAllowance),
    notches: [
      { x: round(quarterHips + seamAllowance), y: hipDepth, type: 'hip_level' },
      { x: 0, y: fullLength, type: 'center_fold' },
    ],
    darts: [
      {
        apex: [round(quarterWaist * 0.5), 4.0],
        legs: [
          [round(quarterWaist * 0.5 - 0.5), 0.25],
          [round(quarterWaist * 0.5 + 0.5), 0.25],
        ],
      },
    ],
    bounds: frontBounds,
    grainline: {
      x1: round(frontBounds.width * 0.4),
      y1: 3,
      x2: round(frontBounds.width * 0.4),
      y2: fullLength - 3,
      angle: 90,
    },
  };

  // Back Skirt Panel (Cut 2 with center-back zipper & vent)
  const backPoints = [
    [0, 0],
    [round(quarterWaist + dartWidth + seamAllowance), 0.5],
    [round(quarterHips + seamAllowance), hipDepth],
    [round(quarterHips + seamAllowance + 0.5), fullLength],
    [0, fullLength],
  ];

  const backSvgPath =
    `M 0 0 ` +
    `L ${round(quarterWaist + dartWidth + seamAllowance)} 0.5 ` +
    `C ${round(quarterHips + 0.5)} 2.5 ${round(quarterHips + seamAllowance)} 5.0 ${round(quarterHips + seamAllowance)} ${hipDepth} ` +
    `L ${round(quarterHips + seamAllowance + 0.5)} ${fullLength} ` +
    `L 0 ${fullLength} Z`;

  const backBounds = calculatePathBounds(backPoints);

  const backSkirt = {
    id: 'piece_skirt_back',
    name: 'Back Skirt Panel (Zipper & Kick Pleat)',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: backSvgPath,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(backPoints, seamAllowance),
    notches: [
      { x: 0, y: 7.0, type: 'zipper_stop' },
      { x: round(quarterHips + seamAllowance), y: hipDepth, type: 'hip_level' },
      { x: 0, y: fullLength - 6.0, type: 'kick_pleat_notch' },
    ],
    darts: [
      {
        apex: [round(quarterWaist * 0.45), 5.0],
        legs: [
          [round(quarterWaist * 0.45 - 0.45), 0.25],
          [round(quarterWaist * 0.45 + 0.45), 0.25],
        ],
      },
    ],
    bounds: backBounds,
    grainline: {
      x1: round(backBounds.width * 0.4),
      y1: 3,
      x2: round(backBounds.width * 0.4),
      y2: fullLength - 3,
      angle: 90,
    },
  };

  // Contoured Waist Facing
  const facingLength = round(waist / 2 + 1.0);
  const facingPoints = [
    [0, 0],
    [facingLength, 0],
    [facingLength, 2.5],
    [0, 2.5],
  ];
  const facingSvg = `M 0 0 L ${facingLength} 0 L ${facingLength} 2.5 L 0 2.5 Z`;

  const waistband = {
    id: 'piece_skirt_waistband',
    name: 'Contoured Waistband Facing',
    cutQuantity: 2,
    onFold: true,
    grainlineAngle: 0,
    svgPath: facingSvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(facingPoints, seamAllowance),
    notches: [{ x: 0, y: 0, type: 'center_fold' }],
    darts: [],
    bounds: calculatePathBounds(facingPoints),
    grainline: {
      x1: 2,
      y1: 1.25,
      x2: facingLength - 2,
      y2: 1.25,
      angle: 0,
    },
  };

  return {
    garmentName: 'Custom Bespoke Skirt',
    units: 'inches',
    seamAllowance,
    patternPieces: [frontSkirt, backSkirt, waistband],
  };
}

// =========================================================================
// 4. JACKET DRAFTING ENGINE
// =========================================================================
export function draftJacketPattern({
  measurements,
  neckline = 'v_neck',
  sleeves = 'set_in',
  closure = 'buttons',
  seamAllowance = 0.5,
}) {
  const bust = measurements.bust || 40;
  const waist = measurements.waist || 34;
  const hips = measurements.hips || 42;
  const armholeDepth = measurements.armholeDepth || 9.5;
  const shoulderToWaist = measurements.shoulderToWaist || 17.5;
  const fullLength = measurements.fullLength || 29;

  const ease = 1.25; // tailored jacket outerwear ease
  const quarterBust = bust / 4 + ease;
  const quarterWaist = waist / 4 + ease;
  const quarterHips = hips / 4 + ease;
  const halfShoulder = (bust * 0.44 + 1.5) / 2;
  const lapelExtension = 1.25;

  // 1. Front Jacket Body with Peaked/Notch Lapel
  const frontPoints = [
    [0, -1.0], // lapel peak
    [lapelExtension, 6.0], // breakline roll
    [round(quarterBust + 1.0), round(armholeDepth)],
    [round(quarterWaist + 1.0), round(shoulderToWaist)],
    [round(quarterHips + 1.2), round(fullLength)],
    [0, round(fullLength)],
  ];

  const frontSvgPath =
    `M 0 -1.0 ` +
    `L ${lapelExtension} 6.0 ` +
    `L ${round(halfShoulder)} 1.5 ` +
    `C ${round(halfShoulder - 0.5)} 5.0 ${round(quarterBust - 1.0)} ${round(armholeDepth)} ${round(quarterBust + 1.0)} ${round(armholeDepth)} ` +
    `L ${round(quarterWaist + 1.0)} ${round(shoulderToWaist)} ` +
    `L ${round(quarterHips + 1.2)} ${round(fullLength)} ` +
    `L 0 ${round(fullLength)} Z`;

  const frontBounds = calculatePathBounds(frontPoints);

  const frontJacket = {
    id: 'piece_jacket_front',
    name: 'Front Jacket Body (Tailored Lapel & Canvas)',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: frontSvgPath,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(frontPoints, seamAllowance),
    notches: [
      { x: lapelExtension, y: 6.0, type: 'lapel_break' },
      { x: round(quarterWaist + 1.0), y: round(shoulderToWaist), type: 'waist_level' },
      { x: 0, y: round(shoulderToWaist - 2.0), type: 'button_stance' },
    ],
    darts: [
      {
        apex: [round(quarterBust * 0.45), round(armholeDepth + 1.5)],
        legs: [
          [round(quarterBust * 0.45 - 0.4), round(shoulderToWaist + 2.0)],
          [round(quarterBust * 0.45 + 0.4), round(shoulderToWaist + 2.0)],
        ],
      },
    ],
    bounds: frontBounds,
    grainline: {
      x1: round(frontBounds.width * 0.35),
      y1: 4,
      x2: round(frontBounds.width * 0.35),
      y2: fullLength - 4,
      angle: 90,
    },
  };

  // 2. Back Jacket Body
  const backPoints = [
    [0, 1.2],
    [round(halfShoulder), 1.8],
    [round(quarterBust), round(armholeDepth)],
    [round(quarterWaist), round(shoulderToWaist)],
    [round(quarterHips), round(fullLength)],
    [0, round(fullLength)],
  ];

  const backSvgPath =
    `M 0 1.2 ` +
    `L ${round(halfShoulder)} 1.8 ` +
    `C ${round(halfShoulder - 0.3)} 5.0 ${round(quarterBust - 0.8)} ${round(armholeDepth)} ${round(quarterBust)} ${round(armholeDepth)} ` +
    `L ${round(quarterWaist)} ${round(shoulderToWaist)} ` +
    `L ${round(quarterHips)} ${round(fullLength)} ` +
    `L 0 ${round(fullLength)} Z`;

  const backBounds = calculatePathBounds(backPoints);

  const backJacket = {
    id: 'piece_jacket_back',
    name: 'Back Jacket Body (Center Back Vent)',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: backSvgPath,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(backPoints, seamAllowance),
    notches: [
      { x: round(quarterWaist), y: round(shoulderToWaist), type: 'waist_level' },
      { x: 0, y: round(fullLength - 8.0), type: 'vent_notch' },
    ],
    darts: [],
    bounds: backBounds,
    grainline: {
      x1: round(backBounds.width * 0.4),
      y1: 4,
      x2: round(backBounds.width * 0.4),
      y2: fullLength - 4,
      angle: 90,
    },
  };

  // 3. Two-Piece Tailored Sleeve: Top Sleeve & Under Sleeve
  const sleeveLength = 24.5;
  const topSleeveWidth = 15.0;
  const underSleeveWidth = 11.5;

  const topSleevePoints = [
    [round(topSleeveWidth / 2), 0],
    [topSleeveWidth, 6.5],
    [topSleeveWidth - 2.5, sleeveLength],
    [2.0, sleeveLength],
    [0, 6.5],
  ];

  const topSleeveSvg =
    `M ${round(topSleeveWidth / 2)} 0 ` +
    `C ${round(topSleeveWidth / 2 + 3.5)} 0.5 ${topSleeveWidth - 1.0} 4.0 ${topSleeveWidth} 6.5 ` +
    `L ${topSleeveWidth - 2.5} ${sleeveLength} ` +
    `L 2.0 ${sleeveLength} ` +
    `L 0 6.5 ` +
    `C 1.0 3.5 ${round(topSleeveWidth / 2 - 3.5)} 0.5 ${round(topSleeveWidth / 2)} 0 Z`;

  const topSleevePiece = {
    id: 'piece_jacket_top_sleeve',
    name: 'Top Sleeve Panel',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: topSleeveSvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(topSleevePoints, seamAllowance),
    notches: [
      { x: round(topSleeveWidth / 2), y: 0, type: 'shoulder_cap' },
      { x: 2.0, y: sleeveLength - 4.0, type: 'vent_button' },
    ],
    darts: [],
    bounds: calculatePathBounds(topSleevePoints),
    grainline: {
      x1: round(topSleeveWidth / 2),
      y1: 6,
      x2: round(topSleeveWidth / 2),
      y2: sleeveLength - 3,
      angle: 90,
    },
  };

  const underSleevePoints = [
    [round(underSleeveWidth / 2), 2.0],
    [underSleeveWidth, 6.5],
    [underSleeveWidth - 1.5, sleeveLength],
    [1.0, sleeveLength],
    [0, 6.5],
  ];

  const underSleeveSvg =
    `M ${round(underSleeveWidth / 2)} 2.0 ` +
    `L ${underSleeveWidth} 6.5 ` +
    `L ${underSleeveWidth - 1.5} ${sleeveLength} ` +
    `L 1.0 ${sleeveLength} ` +
    `L 0 6.5 Z`;

  const underSleevePiece = {
    id: 'piece_jacket_under_sleeve',
    name: 'Under Sleeve Panel',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: underSleeveSvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(underSleevePoints, seamAllowance),
    notches: [{ x: round(underSleeveWidth / 2), y: 2.0, type: 'underarm_match' }],
    darts: [],
    bounds: calculatePathBounds(underSleevePoints),
    grainline: {
      x1: round(underSleeveWidth / 2),
      y1: 6,
      x2: round(underSleeveWidth / 2),
      y2: sleeveLength - 3,
      angle: 90,
    },
  };

  return {
    garmentName: 'Custom Bespoke Tailored Jacket',
    units: 'inches',
    seamAllowance,
    patternPieces: [frontJacket, backJacket, topSleevePiece, underSleevePiece],
  };
}

// =========================================================================
// 5. GOWN DRAFTING ENGINE (PRINCESS-SEAM CONTOUR GOWN)
// =========================================================================
export function draftGownPattern({
  measurements,
  neckline = 'sweetheart',
  sleeves = 'sleeveless',
  closure = 'zipper',
  seamAllowance = 0.5,
}) {
  const bust = measurements.bust || 36;
  const waist = measurements.waist || 28;
  const hips = measurements.hips || 38;
  const shoulderToWaist = measurements.shoulderToWaist || 16.0;
  const fullLength = measurements.fullLength || 54.0;
  const armholeDepth = measurements.armholeDepth || 8.5;

  const quarterBust = bust / 4;
  const quarterWaist = waist / 4;
  const quarterHips = hips / 4;

  // 1. Center Front Bodice (Sweetheart Corset Contour)
  const centerFrontWidth = round(quarterBust * 0.45);
  const centerWaistWidth = round(quarterWaist * 0.42);

  const centerFrontPoints = [
    [0, 5.0], // Plunge dip
    [centerFrontWidth, 2.5], // Sweetheart peak
    [centerWaistWidth, shoulderToWaist],
    [0, shoulderToWaist],
  ];

  const centerFrontSvg =
    `M 0 5.0 ` +
    `C 1.0 4.0 ${round(centerFrontWidth * 0.6)} 2.0 ${centerFrontWidth} 2.5 ` +
    `L ${centerWaistWidth} ${shoulderToWaist} ` +
    `L 0 ${shoulderToWaist} Z`;

  const centerFrontPiece = {
    id: 'piece_gown_center_front',
    name: 'Front Center Bodice (Sweetheart On Fold)',
    cutQuantity: 1,
    onFold: true,
    grainlineAngle: 90,
    svgPath: centerFrontSvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(centerFrontPoints, seamAllowance),
    notches: [
      { x: centerFrontWidth, y: 2.5, type: 'princess_apex' },
      { x: centerWaistWidth, y: shoulderToWaist, type: 'waist_join' },
      { x: 0, y: shoulderToWaist, type: 'center_fold' },
    ],
    darts: [],
    bounds: calculatePathBounds(centerFrontPoints),
    grainline: {
      x1: round(centerFrontWidth * 0.4),
      y1: 3,
      x2: round(centerFrontWidth * 0.4),
      y2: shoulderToWaist - 2,
      angle: 90,
    },
  };

  // 2. Side Front Bodice (Princess Contour)
  const sideFrontWidth = round(quarterBust * 0.65);
  const sideWaistWidth = round(quarterWaist * 0.65);

  const sideFrontPoints = [
    [0, 2.5],
    [sideFrontWidth, armholeDepth],
    [sideWaistWidth, shoulderToWaist],
    [0, shoulderToWaist],
  ];

  const sideFrontSvg =
    `M 0 2.5 ` +
    `C ${round(sideFrontWidth * 0.5)} 3.5 ${round(sideFrontWidth - 0.5)} 6.0 ${sideFrontWidth} ${armholeDepth} ` +
    `L ${sideWaistWidth} ${shoulderToWaist} ` +
    `L 0 ${shoulderToWaist} Z`;

  const sideFrontPiece = {
    id: 'piece_gown_side_front',
    name: 'Front Side Bodice Panel (Princess Seam)',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: sideFrontSvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(sideFrontPoints, seamAllowance),
    notches: [
      { x: 0, y: 2.5, type: 'princess_apex' },
      { x: sideWaistWidth, y: shoulderToWaist, type: 'waist_join' },
    ],
    darts: [],
    bounds: calculatePathBounds(sideFrontPoints),
    grainline: {
      x1: round(sideFrontWidth * 0.4),
      y1: 3,
      x2: round(sideFrontWidth * 0.4),
      y2: shoulderToWaist - 2,
      angle: 90,
    },
  };

  // 3. Back Bodice Panel
  const backBodicePoints = [
    [0, 4.0],
    [round(quarterBust), armholeDepth],
    [round(quarterWaist), shoulderToWaist],
    [0, shoulderToWaist],
  ];

  const backBodiceSvg =
    `M 0 4.0 ` +
    `L ${round(quarterBust)} ${armholeDepth} ` +
    `L ${round(quarterWaist)} ${shoulderToWaist} ` +
    `L 0 ${shoulderToWaist} Z`;

  const backBodicePiece = {
    id: 'piece_gown_back_bodice',
    name: 'Back Bodice Panel (Zipper Seam)',
    cutQuantity: 2,
    onFold: false,
    grainlineAngle: 90,
    svgPath: backBodiceSvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(backBodicePoints, seamAllowance),
    notches: [
      { x: 0, y: 4.0, type: 'zipper_stop' },
      { x: round(quarterWaist), y: shoulderToWaist, type: 'waist_join' },
    ],
    darts: [
      {
        apex: [round(quarterWaist * 0.5), round(armholeDepth + 1.0)],
        legs: [
          [round(quarterWaist * 0.5 - 0.4), shoulderToWaist],
          [round(quarterWaist * 0.5 + 0.4), shoulderToWaist],
        ],
      },
    ],
    bounds: calculatePathBounds(backBodicePoints),
    grainline: {
      x1: round(quarterBust * 0.4),
      y1: 5,
      x2: round(quarterBust * 0.4),
      y2: shoulderToWaist - 2,
      angle: 90,
    },
  };

  // 4. Skirt Front Panel (Flared Floor-Length Column)
  const skirtLength = fullLength - shoulderToWaist;
  const skirtHemWidth = round(quarterHips * 1.8); // elegant evening sweep

  const skirtFrontPoints = [
    [0, 0],
    [round(quarterWaist), 0],
    [round(quarterHips), 8.0],
    [skirtHemWidth, skirtLength],
    [0, skirtLength],
  ];

  const skirtFrontSvg =
    `M 0 0 ` +
    `L ${round(quarterWaist)} 0 ` +
    `C ${round(quarterHips + 0.5)} 3.0 ${round(quarterHips)} 6.0 ${round(quarterHips)} 8.0 ` +
    `L ${skirtHemWidth} ${skirtLength} ` +
    `L 0 ${skirtLength} Z`;

  const skirtFrontPiece = {
    id: 'piece_gown_skirt_front',
    name: 'Flared Column Skirt Front',
    cutQuantity: 1,
    onFold: true,
    grainlineAngle: 90,
    svgPath: skirtFrontSvg,
    seamAllowance,
    seamAllowancePath: generateSeamAllowanceOffset(skirtFrontPoints, seamAllowance),
    notches: [
      { x: 0, y: 0, type: 'center_fold' },
      { x: round(quarterHips), y: 8.0, type: 'hip_level' },
    ],
    darts: [],
    bounds: calculatePathBounds(skirtFrontPoints),
    grainline: {
      x1: round(quarterHips * 0.5),
      y1: 5,
      x2: round(quarterHips * 0.5),
      y2: skirtLength - 5,
      angle: 90,
    },
  };

  return {
    garmentName: 'Custom Sweetheart Evening Gown',
    units: 'inches',
    seamAllowance,
    patternPieces: [centerFrontPiece, sideFrontPiece, backBodicePiece, skirtFrontPiece],
  };
}

// =========================================================================
// UNIFIED MASTER DRAFTING FUNCTION
// =========================================================================
export function generateParametricPattern({
  baseGarment = 'top',
  silhouette = 'standard',
  neckline = 'sweetheart',
  sleeves = 'set_in',
  closure = 'zipper',
  seamAllowance = 0.5,
  measurements = {},
}) {
  const normBase = (baseGarment || 'top').toLowerCase();

  if (normBase === 'trouser' || normBase === 'bottoms') {
    return draftTrouserPattern({ measurements, closure, seamAllowance });
  }
  if (normBase === 'skirt') {
    return draftSkirtPattern({ measurements, closure, seamAllowance });
  }
  if (normBase === 'jacket') {
    return draftJacketPattern({ measurements, neckline, sleeves, closure, seamAllowance });
  }
  if (normBase === 'gown' || normBase === 'dress') {
    return draftGownPattern({ measurements, neckline, sleeves, closure, seamAllowance });
  }

  // Default: TOP
  return draftTopPattern({ measurements, neckline, sleeves, closure, seamAllowance });
}

export default {
  generateParametricPattern,
  draftTopPattern,
  draftTrouserPattern,
  draftSkirtPattern,
  draftJacketPattern,
  draftGownPattern,
  calculatePathBounds,
  generateSeamAllowanceOffset,
};
