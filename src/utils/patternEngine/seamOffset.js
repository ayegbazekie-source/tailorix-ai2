/**
 * Utility to calculate parallel offset vectors for seam allowance cut paths.
 */

export function generateSeamAllowancePath(points = [], seamAllowanceInches = 0.5) {
  if (!points || points.length < 3) return '';

  // Conversion scale factor matching CAD viewport coordinates (e.g., 10px per inch)
  const SCALE = 12;
  const offsetDistance = seamAllowanceInches * SCALE;

  const offsetPoints = [];

  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    // Direction vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    // Normal vectors (outward perpendiculars)
    const len1 = Math.hypot(v1.x, v1.y) || 1;
    const len2 = Math.hypot(v2.x, v2.y) || 1;

    const n1 = { x: -v1.y / len1, y: v1.x / len1 };
    const n2 = { x: -v2.y / len2, y: v2.x / len2 };

    // Average outward normal for vertex offset
    const bisector = { x: n1.x + n2.x, y: n1.y + n2.y };
    const bisectorLen = Math.hypot(bisector.x, bisector.y) || 1;

    const normBisector = {
      x: bisector.x / bisectorLen,
      y: bisector.y / bisectorLen,
    };

    offsetPoints.push({
      x: curr.x + normBisector.x * offsetDistance,
      y: curr.y + normBisector.y * offsetDistance,
    });
  }

  // Construct SVG Path String
  return offsetPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}` : `${acc} L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
  }, '') + ' Z';
}
