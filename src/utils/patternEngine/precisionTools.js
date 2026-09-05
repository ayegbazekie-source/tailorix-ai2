/**
 * Utility functions for digital measuring tape and assembly notch markers.
 */

// Calculate Euclidean distance and deltas between two points
export function calculateTapeDistance(p1, p2, scaleInchesPerPx = 0.1) {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const pxDistance = Math.hypot(dx, dy);

  const inches = pxDistance * scaleInchesPerPx;
  const cm = inches * 2.54;

  return {
    pxDistance,
    inches: inches.toFixed(2),
    cm: cm.toFixed(2),
    deltaX: (dx * scaleInchesPerPx).toFixed(2),
    deltaY: (dy * scaleInchesPerPx).toFixed(2),
  };
}

// Generate notch mark SVG paths along edge segments
export function generateNotchPath(p1, p2, notchType = 'v_notch', depthPx = 6) {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // Edge direction vector
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;

  // Outward normal vector
  const nx = -dy / len;
  const ny = dx / len;

  if (notchType === 'v_notch') {
    // V-Notch geometry
    const tipX = midX + nx * depthPx;
    const tipY = midY + ny * depthPx;
    const base1X = midX - (dx / len) * (depthPx / 2);
    const base1Y = midY - (dy / len) * (depthPx / 2);
    const base2X = midX + (dx / len) * (depthPx / 2);
    const base2Y = midY + (dy / len) * (depthPx / 2);

    return `M ${base1X} ${base1Y} L ${tipX} ${tipY} L ${base2X} ${base2Y}`;
  } else {
    // T-Notch (single slit line)
    const tipX = midX + nx * depthPx;
    const tipY = midY + ny * depthPx;
    return `M ${midX} ${midY} L ${tipX} ${tipY}`;
  }
}
