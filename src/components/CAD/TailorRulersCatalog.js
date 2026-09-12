/**
 * TAILORIX AI — COMPLETE TAILOR'S PATTERN DRAFTING TOOLBOX
 * 8 Physical Tailoring Rulers & Curves Vector Catalog with Edge Snapping
 * 
 * Includes:
 *  1. Straight Grading Ruler (18" & 36")
 *  2. Sleeve & Armhole Curve (Slender Curve)
 *  3. Multi-Functional L-Square / Tailor Curve (Blue Grid)
 *  4. All-in-One Patternmaker Curve (Wide Grid)
 *  5. Vary Form Curve / Hip Curve (Solid White)
 *  6. Teardrop / Armhole Template
 *  7. French Curve (Spiral / Hook Tail)
 *  8. Mini Grading Curve
 */

// Utility: Sample points along a cubic Bézier curve
function sampleCubicBezier(p0, p1, p2, p3, steps = 30) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
    const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
    points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }
  return points;
}

// Utility: Sample linear segment
function sampleLine(p0, p1, steps = 15) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: Math.round((p0.x + (p1.x - p0.x) * t) * 10) / 10,
      y: Math.round((p0.y + (p1.y - p0.y) * t) * 10) / 10,
    });
  }
  return points;
}

export const TAILOR_RULERS_CATALOG = {
  straightRuler: {
    id: 'straightRuler',
    name: 'Straight Grading Ruler',
    subtitle: '18" & 36" Calibrated Grid',
    category: 'Straight & Grid',
    description: 'Clear acrylic grading ruler with 1/8" and 1/4" parallel grids, center zero, and dual-edge measurement ticks for straight seams and seam allowances.',
    width: 540,
    height: 60,
    lengthOptions: [18, 36],
    defaultLength: 18,
    acrylicTheme: 'clear_red_grid',
    outerPath: 'M 0 0 L 540 0 L 540 60 L 0 60 Z',
    getOuterPath: (length = 18) => {
      const w = length === 36 ? 840 : 540;
      return `M 0 0 L ${w} 0 L ${w} 60 L 0 60 Z`;
    },
    getEdgePoints: (length = 18) => {
      const w = length === 36 ? 840 : 540;
      // Top active edge + bottom active edge
      const topEdge = sampleLine({ x: 0, y: 0 }, { x: w, y: 0 }, 50);
      const bottomEdge = sampleLine({ x: w, y: 60 }, { x: 0, y: 60 }, 50);
      return [...topEdge, ...bottomEdge];
    },
    primarySnapEdge: (length = 18) => {
      const w = length === 36 ? 840 : 540;
      return sampleLine({ x: 0, y: 0 }, { x: w, y: 0 }, 60);
    },
  },

  sleeveCurve: {
    id: 'sleeveCurve',
    name: 'Sleeve & Armhole Curve',
    subtitle: 'Slender Grading Curve',
    category: 'Sleeves & Armholes',
    description: 'Long, slender curved grading ruler with parallel grid lines for drafting sleeve crowns, armhole arches, and deep scoop necklines.',
    width: 560,
    height: 240,
    acrylicTheme: 'clear_blue_grid',
    outerPath: 'M 15 15 C 90 15, 170 30, 270 70 C 370 110, 460 170, 545 230 L 530 240 C 440 180, 345 125, 250 90 C 160 55, 80 40, 15 40 Z',
    getEdgePoints: () => {
      const p1 = sampleCubicBezier({ x: 15, y: 15 }, { x: 170, y: 30 }, { x: 370, y: 110 }, { x: 545, y: 230 }, 60);
      const p2 = sampleLine({ x: 545, y: 230 }, { x: 530, y: 240 }, 5);
      const p3 = sampleCubicBezier({ x: 530, y: 240 }, { x: 345, y: 125 }, { x: 160, y: 55 }, { x: 15, y: 40 }, 50);
      const p4 = sampleLine({ x: 15, y: 40 }, { x: 15, y: 15 }, 5);
      return [...p1, ...p2, ...p3, ...p4];
    },
    primarySnapEdge: () => {
      return sampleCubicBezier({ x: 15, y: 15 }, { x: 170, y: 30 }, { x: 370, y: 110 }, { x: 545, y: 230 }, 60);
    },
  },

  lSquareCurve: {
    id: 'lSquareCurve',
    name: 'Multi-Functional L-Square',
    subtitle: 'Tailor Curve (Blue Grid)',
    category: 'Perpendicular & Curves',
    description: '90-degree right angle tailor square combined with sweeping hip, crotch, and lapel curves with precision centimeter/inch grading matrix.',
    width: 440,
    height: 380,
    acrylicTheme: 'clear_blue_grid',
    outerPath: 'M 10 10 L 420 10 L 420 65 L 75 65 C 75 140, 120 230, 240 310 C 290 345, 340 365, 410 375 L 395 385 C 315 375, 260 345, 205 305 C 90 220, 45 125, 45 10 L 10 10 Z',
    getEdgePoints: () => {
      const top = sampleLine({ x: 10, y: 10 }, { x: 420, y: 10 }, 35);
      const right = sampleLine({ x: 420, y: 10 }, { x: 420, y: 65 }, 8);
      const innerCorner = sampleLine({ x: 420, y: 65 }, { x: 75, y: 65 }, 25);
      const curve1 = sampleCubicBezier({ x: 75, y: 65 }, { x: 120, y: 230 }, { x: 290, y: 345 }, { x: 410, y: 375 }, 40);
      const end = sampleLine({ x: 410, y: 375 }, { x: 395, y: 385 }, 5);
      const curve2 = sampleCubicBezier({ x: 395, y: 385 }, { x: 260, y: 345 }, { x: 90, y: 220 }, { x: 45, y: 10 }, 40);
      const left = sampleLine({ x: 45, y: 10 }, { x: 10, y: 10 }, 5);
      return [...top, ...right, ...innerCorner, ...curve1, ...end, ...curve2, ...left];
    },
    primarySnapEdge: () => {
      // Sweeping crotch/hip contour edge
      return sampleCubicBezier({ x: 75, y: 65 }, { x: 120, y: 230 }, { x: 290, y: 345 }, { x: 410, y: 375 }, 50);
    },
  },

  patternmakerCurve: {
    id: 'patternmakerCurve',
    name: 'All-in-One Patternmaker Curve',
    subtitle: 'Wide Grid with Sizing Cutouts',
    category: 'Grading & Layout',
    description: 'Comprehensive broad curve featuring parallel grading lines, 5 circular sizing pivot holes, neckline sweeps, and shoulder slope guides.',
    width: 480,
    height: 230,
    acrylicTheme: 'clear_red_grid',
    outerPath: 'M 20 20 L 440 20 C 470 60, 460 140, 390 195 C 320 240, 200 230, 110 185 C 40 150, 15 80, 20 20 Z',
    cutouts: [
      { cx: 120, cy: 70, r: 12 },
      { cx: 160, cy: 70, r: 10 },
      { cx: 195, cy: 70, r: 8 },
      { cx: 225, cy: 70, r: 6 },
      { cx: 250, cy: 70, r: 5 },
    ],
    getEdgePoints: () => {
      const top = sampleLine({ x: 20, y: 20 }, { x: 440, y: 20 }, 30);
      const curve = sampleCubicBezier({ x: 440, y: 20 }, { x: 470, y: 140 }, { x: 320, y: 240 }, { x: 110, y: 185 }, 45);
      const side = sampleCubicBezier({ x: 110, y: 185 }, { x: 40, y: 150 }, { x: 15, y: 80 }, { x: 20, y: 20 }, 25);
      return [...top, ...curve, ...side];
    },
    primarySnapEdge: () => {
      return sampleCubicBezier({ x: 440, y: 20 }, { x: 470, y: 140 }, { x: 320, y: 240 }, { x: 110, y: 185 }, 50);
    },
  },

  varyFormHipCurve: {
    id: 'varyFormHipCurve',
    name: 'Vary Form Hip Curve',
    subtitle: 'Side Seams & Hemlines (White)',
    category: 'Side Seams & Hips',
    description: 'Long, gentle sweep ruler engineered specifically for trouser outseams, hip curves, jacket side seams, flared skirts, and lapel rolls.',
    width: 560,
    height: 110,
    acrylicTheme: 'solid_white',
    outerPath: 'M 15 15 C 120 22, 240 38, 360 62 C 430 78, 500 95, 545 105 L 540 115 C 470 102, 390 82, 300 58 C 190 32, 90 20, 15 25 Z',
    getEdgePoints: () => {
      const topCurve = sampleCubicBezier({ x: 15, y: 15 }, { x: 240, y: 38 }, { x: 430, y: 78 }, { x: 545, y: 105 }, 55);
      const right = sampleLine({ x: 545, y: 105 }, { x: 540, y: 115 }, 4);
      const bottomCurve = sampleCubicBezier({ x: 540, y: 115 }, { x: 390, y: 82 }, { x: 190, y: 32 }, { x: 15, y: 25 }, 55);
      const left = sampleLine({ x: 15, y: 25 }, { x: 15, y: 15 }, 4);
      return [...topCurve, ...right, ...bottomCurve, ...left];
    },
    primarySnapEdge: () => {
      return sampleCubicBezier({ x: 15, y: 15 }, { x: 240, y: 38 }, { x: 430, y: 78 }, { x: 545, y: 105 }, 60);
    },
  },

  teardropArmhole: {
    id: 'teardropArmhole',
    name: 'Teardrop Armhole Template',
    subtitle: 'Drop Curve & Pocket Contour',
    category: 'Armholes & Pockets',
    description: 'Compact drop-shaped curve with inner concentric cutouts for armhole depths, pocket curves, and sleeve cap crown curves.',
    width: 320,
    height: 240,
    acrylicTheme: 'clear_blue_grid',
    outerPath: 'M 160 15 C 240 15, 305 65, 305 135 C 305 190, 240 230, 160 230 C 80 230, 15 190, 15 135 C 15 65, 80 15, 160 15 Z',
    innerSlotPath: 'M 160 45 C 215 45, 260 85, 260 135 C 260 175, 215 200, 160 200 C 105 200, 60 175, 60 135 C 60 85, 105 45, 160 45 Z',
    getEdgePoints: () => {
      const arc1 = sampleCubicBezier({ x: 160, y: 15 }, { x: 305, y: 35 }, { x: 305, y: 165 }, { x: 160, y: 230 }, 45);
      const arc2 = sampleCubicBezier({ x: 160, y: 230 }, { x: 15, y: 165 }, { x: 15, y: 35 }, { x: 160, y: 15 }, 45);
      return [...arc1, ...arc2];
    },
    primarySnapEdge: () => {
      return sampleCubicBezier({ x: 160, y: 15 }, { x: 305, y: 35 }, { x: 305, y: 165 }, { x: 160, y: 230 }, 50);
    },
  },

  frenchCurve: {
    id: 'frenchCurve',
    name: 'Classic French Curve',
    subtitle: 'Spiral Hook Tail with Sizing Holes',
    category: 'Collars & Tight Arches',
    description: 'Classic hook-shaped French curve with sizing hole cutouts for tight necklines, curved collars, lapels, and intimate armhole notches.',
    width: 380,
    height: 260,
    acrylicTheme: 'clear_acrylic',
    outerPath: 'M 35 220 C 15 150, 45 75, 110 35 C 180 -5, 280 15, 335 75 C 375 120, 365 185, 310 220 C 255 255, 185 240, 145 195 C 115 155, 130 110, 175 90 C 215 75, 260 100, 255 130 C 250 155, 220 170, 195 160 L 190 175 C 230 190, 280 165, 285 125 C 290 85, 230 50, 175 68 C 115 88, 90 145, 125 200 C 170 260, 255 275, 330 235 C 395 195, 400 115, 350 60 C 285 -10, 170 -15, 90 30 C 20 75, -10 165, 15 240 Z',
    cutouts: [
      { cx: 80, cy: 120, r: 14 },
      { cx: 115, cy: 85, r: 10 },
      { cx: 155, cy: 60, r: 7 },
      { cx: 210, cy: 45, r: 5 },
    ],
    getEdgePoints: () => {
      const c1 = sampleCubicBezier({ x: 35, y: 220 }, { x: 45, y: 75 }, { x: 180, y: -5 }, { x: 335, y: 75 }, 45);
      const c2 = sampleCubicBezier({ x: 335, y: 75 }, { x: 375, y: 185 }, { x: 255, y: 255 }, { x: 145, y: 195 }, 40);
      const c3 = sampleCubicBezier({ x: 145, y: 195 }, { x: 115, y: 155 }, { x: 130, y: 110 }, { x: 175, y: 90 }, 30);
      const c4 = sampleCubicBezier({ x: 175, y: 90 }, { x: 260, y: 100 }, { x: 250, y: 155 }, { x: 195, y: 160 }, 25);
      return [...c1, ...c2, ...c3, ...c4];
    },
    primarySnapEdge: () => {
      // The classic outer spiral contour
      return sampleCubicBezier({ x: 35, y: 220 }, { x: 45, y: 75 }, { x: 180, y: -5 }, { x: 335, y: 75 }, 60);
    },
  },

  miniGradingCurve: {
    id: 'miniGradingCurve',
    name: 'Mini Grading Curve',
    subtitle: 'Cuffs, Collars & Details',
    category: 'Detail Work',
    description: 'Compact multi-radius curve designed for childrenswear, doll patterns, collar tips, cuff curves, and delicate lingerie seams.',
    width: 280,
    height: 140,
    acrylicTheme: 'clear_red_grid',
    outerPath: 'M 15 15 L 250 15 C 275 45, 270 95, 220 125 C 170 150, 95 135, 45 100 C 15 75, 10 40, 15 15 Z',
    cutouts: [
      { cx: 80, cy: 50, r: 8 },
      { cx: 115, cy: 50, r: 6 },
      { cx: 145, cy: 50, r: 4 },
    ],
    getEdgePoints: () => {
      const top = sampleLine({ x: 15, y: 15 }, { x: 250, y: 15 }, 25);
      const sweep = sampleCubicBezier({ x: 250, y: 15 }, { x: 275, y: 95 }, { x: 170, y: 150 }, { x: 45, y: 100 }, 40);
      const side = sampleCubicBezier({ x: 45, y: 100 }, { x: 15, y: 75 }, { x: 10, y: 40 }, { x: 15, y: 15 }, 20);
      return [...top, ...sweep, ...side];
    },
    primarySnapEdge: () => {
      return sampleCubicBezier({ x: 250, y: 15 }, { x: 275, y: 95 }, { x: 170, y: 150 }, { x: 45, y: 100 }, 45);
    },
  },
};

export const TAILOR_RULER_LIST = Object.values(TAILOR_RULERS_CATALOG).map((tool) => ({
  ...tool,
  path: tool.outerPath || (typeof tool.getOuterPath === 'function' ? tool.getOuterPath(18) : ''),
}));

export function getRulerPath(tool) {
  if (!tool) return '';
  if (typeof tool.getOuterPath === 'function') {
    return tool.getOuterPath(tool.defaultLength || 18);
  }
  return tool.outerPath || tool.path || '';
}

/**
 * Constrains chalk drawing to strictly follow the orientation/tangent direction of an active ruler
 * and prevents penetrating across or into the physical ruler body.
 */
export function constrainChalkToRulerDirection(rawX, rawY, startX, startY, ruler) {
  if (!ruler) {
    return { x: rawX, y: rawY, angle: 0, isConstrained: false };
  }

  const rad = ((ruler.rotation || 0) * Math.PI) / 180;
  const dirX = Math.cos(rad);
  const dirY = Math.sin(rad);

  // Vector from stroke start to current pointer
  const dx = rawX - startX;
  const dy = rawY - startY;

  // Project along ruler direction vector
  const proj = dx * dirX + dy * dirY;

  let constrainedX = startX + proj * dirX;
  let constrainedY = startY + proj * dirY;

  // Verify non-intersection with ruler body:
  // Convert start point and constrained point to ruler local space
  const localStart = worldToRulerLocal(startX, startY, ruler);
  const localCurrent = worldToRulerLocal(constrainedX, constrainedY, ruler);

  const catalog = TAILOR_RULERS_CATALOG[ruler.type];
  const rw = catalog?.width || 400;
  const rh = catalog?.height || 60;

  // If start point was on one side of the ruler (e.g. above/outside top edge or below/outside bottom edge)
  // ensure the chalk line never crosses into, over, or under the ruler
  let clampedLocalY = localCurrent.y;
  if (localStart.y < 0) {
    // Started above ruler: keep strictly above
    clampedLocalY = Math.min(-2, localCurrent.y);
  } else if (localStart.y > rh) {
    // Started below ruler: keep strictly below
    clampedLocalY = Math.max(rh + 2, localCurrent.y);
  } else {
    // If started inside or directly on edge, clamp to nearest outside edge
    clampedLocalY = localStart.y < rh / 2 ? -2 : rh + 2;
  }

  // If the clamped local Y differs, convert back to world coordinates
  if (clampedLocalY !== localCurrent.y) {
    const safeWorld = rulerLocalToWorld(localCurrent.x, clampedLocalY, ruler);
    constrainedX = safeWorld.x;
    constrainedY = safeWorld.y;
  }

  return {
    x: Math.round(constrainedX * 10) / 10,
    y: Math.round(constrainedY * 10) / 10,
    angle: Math.round(ruler.rotation || 0),
    isConstrained: true,
  };
}

/**
 * Mathematical Projection: project point (px, py) onto line segment [p1, p2]
 */
function projectPointOntoSegment(px, py, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return { x: p1.x, y: p1.y, distSq: (px - p1.x) ** 2 + (py - p1.y) ** 2 };
  }
  const t = Math.max(0, Math.min(1, ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq));
  const projX = p1.x + t * dx;
  const projY = p1.y + t * dy;
  const distSq = (px - projX) ** 2 + (py - projY) ** 2;
  return { x: projX, y: projY, distSq };
}

/**
 * Project a point in local ruler coordinates onto the ruler's edge polyline
 */
export function projectPointOntoRulerEdge(localX, localY, edgePoints) {
  if (!edgePoints || edgePoints.length < 2) {
    return { x: localX, y: localY, dist: Infinity };
  }

  let minDistSq = Infinity;
  let bestProj = { x: localX, y: localY };

  for (let i = 0; i < edgePoints.length - 1; i++) {
    const p1 = edgePoints[i];
    const p2 = edgePoints[i + 1];
    const { x, y, distSq } = projectPointOntoSegment(localX, localY, p1, p2);
    if (distSq < minDistSq) {
      minDistSq = distSq;
      bestProj = { x, y };
    }
  }

  // Also test closing segment if loop
  const pFirst = edgePoints[0];
  const pLast = edgePoints[edgePoints.length - 1];
  const { x, y, distSq } = projectPointOntoSegment(localX, localY, pLast, pFirst);
  if (distSq < minDistSq) {
    minDistSq = distSq;
    bestProj = { x, y };
  }

  return { x: bestProj.x, y: bestProj.y, dist: Math.sqrt(minDistSq) };
}

/**
 * Coordinate Transformation: Canvas World Space -> Ruler Local Space
 */
export function worldToRulerLocal(wx, wy, ruler) {
  const dx = wx - ruler.x;
  const dy = wy - ruler.y;
  const rad = (-ruler.rotation * Math.PI) / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
  const scale = ruler.scale || 1;
  const sx = rx / scale;
  const sy = ry / scale;
  const lx = ruler.flipX ? -sx : sx;
  const ly = ruler.flipY ? -sy : sy;
  return { x: lx, y: ly };
}

/**
 * Coordinate Transformation: Ruler Local Space -> Canvas World Space
 */
export function rulerLocalToWorld(lx, ly, ruler) {
  const fx = ruler.flipX ? -lx : lx;
  const fy = ruler.flipY ? -ly : ly;
  const scale = ruler.scale || 1;
  const sx = fx * scale;
  const sy = fy * scale;
  const rad = (ruler.rotation * Math.PI) / 180;
  const rx = sx * Math.cos(rad) - sy * Math.sin(rad);
  const ry = sx * Math.sin(rad) + sy * Math.cos(rad);
  const wx = rx + ruler.x;
  const wy = ry + ruler.y;
  return { x: wx, y: wy };
}

/**
 * Magnetic Snapping & Clamping Engine:
 * When drawing with Pen, Chalk, or Scissors:
 *  - Checks distance from pointer (worldX, worldY) to ruler edges
 *  - If within threshold (default 24px), snaps pointer onto nearest edge
 *  - Returns { snapped: boolean, x, y, distance, localPoint }
 */
export function snapPointToActiveRuler(worldX, worldY, ruler, snapThreshold = 26) {
  if (!ruler) return null;

  const catalogEntry = TAILOR_RULERS_CATALOG[ruler.type];
  if (!catalogEntry) return null;

  const edgePoints = catalogEntry.getEdgePoints
    ? catalogEntry.getEdgePoints(ruler.lengthOption || catalogEntry.defaultLength)
    : [];

  if (edgePoints.length === 0) return null;

  const local = worldToRulerLocal(worldX, worldY, ruler);
  const proj = projectPointOntoRulerEdge(local.x, local.y, edgePoints);

  const effectiveThreshold = snapThreshold / (ruler.scale || 1);

  if (proj.dist <= effectiveThreshold) {
    // Project snapped local coordinates back to world space
    const worldSnapped = rulerLocalToWorld(proj.x, proj.y, ruler);
    return {
      snapped: true,
      x: Math.round(worldSnapped.x * 10) / 10,
      y: Math.round(worldSnapped.y * 10) / 10,
      distance: proj.dist * (ruler.scale || 1),
      rulerId: ruler.id,
      rulerName: catalogEntry.name,
    };
  }

  return null;
}

/**
 * Get all world coordinates along the active ruler's primary curve edge.
 * Used for "Snap Seam Edge" button to instantly drop a clean vector stroke into the layer.
 */
export function getRulerPrimaryEdgeWorldPoints(ruler) {
  if (!ruler) return [];
  const catalogEntry = TAILOR_RULERS_CATALOG[ruler.type];
  if (!catalogEntry || !catalogEntry.primarySnapEdge) return [];

  const localEdge = catalogEntry.primarySnapEdge(ruler.lengthOption || catalogEntry.defaultLength);
  return localEdge.map((pt) => rulerLocalToWorld(pt.x, pt.y, ruler));
}
