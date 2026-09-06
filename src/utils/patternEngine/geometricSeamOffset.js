/**
 * TAILORIX AI — GEOMETRIC SEAM OFFSET ENGINE
 * Computes exact parallel offset curves and boundary polygons for pattern cut lines.
 */

import { renderPieceToSvgPath } from '../../models/patternGeometry';

/**
 * Generates an outward offset polygon for a closed sequence of 2D points.
 * @param {Array<{x: number, y: number}>} points - Closed boundary vertices
 * @param {number} offsetDistance - Offset in canvas coordinate units
 */
export function offsetPolygon(points = [], offsetDistance = 6) {
  if (!points || points.length < 3 || offsetDistance <= 0) return points;

  const n = points.length;
  const offsetPoints = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    // Outward edge vectors
    const e1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const e2 = { x: next.x - curr.x, y: next.y - curr.y };

    const len1 = Math.hypot(e1.x, e1.y) || 1;
    const len2 = Math.hypot(e2.x, e2.y) || 1;

    // Normal vectors (perpendicular pointing right/clockwise)
    const n1 = { x: -e1.y / len1, y: e1.x / len1 };
    const n2 = { x: -e2.y / len2, y: e2.x / len2 };

    // Bisector normal vector
    const bisector = { x: n1.x + n2.x, y: n1.y + n2.y };
    const bLen = Math.hypot(bisector.x, bisector.y) || 1;
    const normBisector = { x: bisector.x / bLen, y: bisector.y / bLen };

    // Dot product to check acute corner miter
    const dot = n1.x * normBisector.x + n1.y * normBisector.y;
    // Cap miter extension to 2.5x offset to prevent crazy spikes on sharp corners
    const miterScale = Math.min(Math.max(1 / (dot || 1), 1), 2.5);

    offsetPoints.push({
      id: `off_${curr.id || i}`,
      x: curr.x + normBisector.x * offsetDistance * miterScale,
      y: curr.y + normBisector.y * offsetDistance * miterScale,
      type: curr.type || 'corner',
      cp1: curr.cp1 ? {
        x: curr.cp1.x + normBisector.x * offsetDistance,
        y: curr.cp1.y + normBisector.y * offsetDistance,
      } : null,
      cp2: curr.cp2 ? {
        x: curr.cp2.x + normBisector.x * offsetDistance,
        y: curr.cp2.y + normBisector.y * offsetDistance,
      } : null,
    });
  }

  return offsetPoints;
}

/**
 * Attaches the calculated cut line (seam allowance path) to a pattern piece.
 */
export function applySeamAllowanceToPiece(piece, scaleFactor = 12) {
  if (!piece || !piece.points || piece.points.length < 3) return piece;

  const allowance = typeof piece.seamAllowance === 'number' ? piece.seamAllowance : 0.5;
  const offsetPixels = allowance * scaleFactor;

  const offsetPoints = offsetPolygon(piece.points, offsetPixels);
  
  // Format offset points as SVG path
  let d = `M ${offsetPoints[0].x.toFixed(2)} ${offsetPoints[0].y.toFixed(2)}`;
  for (let i = 1; i < offsetPoints.length; i++) {
    const pt = offsetPoints[i];
    if (pt.cp1 && pt.cp2) {
      d += ` C ${pt.cp1.x.toFixed(2)} ${pt.cp1.y.toFixed(2)}, ${pt.cp2.x.toFixed(2)} ${pt.cp2.y.toFixed(2)}, ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    } else {
      d += ` L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }
  }
  d += ' Z';

  return {
    ...piece,
    seamAllowanceOffsetPoints: offsetPoints,
    seamAllowancePath: d,
  };
}
