/**
 * TAILORIX AI — STRUCTURED PATTERN GEOMETRY MODEL
 * Canonical computational geometry model for apparel CAD.
 * Pattern pieces are defined by structured vertices, line/bezier segments, notches, grainlines,
 * and internal construction lines. SVG paths are rendered strictly FROM this model.
 */

/**
 * Creates a structured geometric point.
 */
export function createPoint(x, y, type = 'corner', options = {}) {
  return {
    id: options.id || `pt_${Math.random().toString(36).substring(2, 8)}`,
    x: Number(x),
    y: Number(y),
    type, // 'corner' | 'smooth' | 'control'
    handleIn: options.handleIn || null,   // { x, y } relative or absolute
    handleOut: options.handleOut || null, // { x, y }
    gradeRule: options.gradeRule || null, // { dx: { S, M, L, XL }, dy: { S, M, L, XL } }
    notch: options.notch || null,         // 'v_notch' | 't_notch' | null
    label: options.label || '',
  };
}

/**
 * Creates a structured segment between vertices.
 */
export function createSegment(type, p0, p1, options = {}) {
  return {
    id: options.id || `seg_${Math.random().toString(36).substring(2, 8)}`,
    type, // 'line' | 'bezier'
    p0: { x: p0.x, y: p0.y },
    p1: { x: p1.x, y: p1.y },
    cp1: options.cp1 ? { x: options.cp1.x, y: options.cp1.y } : null,
    cp2: options.cp2 ? { x: options.cp2.x, y: options.cp2.y } : null,
    seamType: options.seamType || 'cut', // 'cut' | 'sew' | 'fold' | 'hem'
  };
}

/**
 * Creates a structured pattern piece.
 */
export function createPatternPiece(options = {}) {
  const points = options.points || [];
  const segments = options.segments || generateSegmentsFromPoints(points);

  const piece = {
    id: options.id || `piece_${Math.random().toString(36).substring(2, 8)}`,
    name: options.name || 'UNTITLED PIECE',
    category: options.category || 'main',
    cutQuantity: options.cutQuantity || 'CUT 2 (PAIR)',
    mirror: options.mirror ?? true,
    onFold: options.onFold ?? false,
    foldAxis: options.foldAxis || null, // 'left' | 'center_back' | 'center_front'

    // Core Geometry
    points,
    segments,
    closed: options.closed ?? true,

    // Internal Lines & Details
    internalLines: options.internalLines || [], // Array of [{ type: 'line', x1, y1, x2, y2, label }]
    darts: options.darts || [],                 // Array of [{ apex: {x,y}, left: {x,y}, right: {x,y} }]
    notches: options.notches || [],             // Array of [{ x, y, angle, type }]
    grainline: options.grainline || null,       // { x1, y1, x2, y2, angle: 90, label: 'GRAIN' }
    drillHoles: options.drillHoles || [],       // Array of [{ x, y, radius: 2 }]

    // Seam & Manufacturing Specs
    seamAllowance: options.seamAllowance ?? 0.5, // inches
    seamAllowancePath: null,                    // dynamically calculated
    material: options.material || 'SELF',       // 'SELF' | 'LINING' | 'INTERFACING'
    size: options.size || 'M',
    units: options.units || 'in',

    // Annotations & UI State
    annotations: options.annotations || [],
    locked: options.locked ?? false,
    visible: options.visible ?? true,
    color: options.color || '#f59e0b',
  };

  // Generate initial SVG path from structured geometry
  piece.path = renderPieceToSvgPath(piece);
  return piece;
}

/**
 * Builds linear segments connecting a series of points sequentially.
 */
export function generateSegmentsFromPoints(points) {
  if (!points || points.length < 2) return [];
  const segments = [];
  for (let i = 0; i < points.length; i++) {
    const nextIdx = (i + 1) % points.length;
    segments.push(createSegment('line', points[i], points[nextIdx]));
  }
  return segments;
}

/**
 * Renders structured geometry (points and segments) to an exact SVG Path string.
 */
export function renderPieceToSvgPath(piece) {
  if (!piece) return '';

  // If piece has structured segments
  if (Array.isArray(piece.segments) && piece.segments.length > 0) {
    let d = '';
    piece.segments.forEach((seg, index) => {
      if (index === 0) {
        d += `M ${seg.p0.x.toFixed(2)} ${seg.p0.y.toFixed(2)} `;
      }
      if (seg.type === 'bezier' && seg.cp1 && seg.cp2) {
        d += `C ${seg.cp1.x.toFixed(2)} ${seg.cp1.y.toFixed(2)}, ${seg.cp2.x.toFixed(2)} ${seg.cp2.y.toFixed(2)}, ${seg.p1.x.toFixed(2)} ${seg.p1.y.toFixed(2)} `;
      } else if (seg.type === 'bezier' && seg.cp1) {
        d += `Q ${seg.cp1.x.toFixed(2)} ${seg.cp1.y.toFixed(2)}, ${seg.p1.x.toFixed(2)} ${seg.p1.y.toFixed(2)} `;
      } else {
        d += `L ${seg.p1.x.toFixed(2)} ${seg.p1.y.toFixed(2)} `;
      }
    });
    if (piece.closed !== false) d += 'Z';
    return d.trim();
  }

  // If piece only has points array
  if (Array.isArray(piece.points) && piece.points.length > 0) {
    const pts = piece.points;
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      const pt = pts[i];
      if (pt.type === 'bezier' && pt.cp1 && pt.cp2) {
        d += ` C ${pt.cp1.x.toFixed(2)} ${pt.cp1.y.toFixed(2)}, ${pt.cp2.x.toFixed(2)} ${pt.cp2.y.toFixed(2)}, ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
      } else {
        d += ` L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
      }
    }
    if (piece.closed !== false) d += ' Z';
    return d;
  }

  return piece.path || '';
}

/**
 * Calculates the exact 2D bounding box of a structured piece.
 */
export function calculatePieceBounds(piece) {
  if (piece?.bounds && typeof piece.bounds.width === 'number' && typeof piece.bounds.height === 'number') {
    const minX = piece.bounds.minX ?? 0;
    const minY = piece.bounds.minY ?? 0;
    const width = Math.max(piece.bounds.width, 1);
    const height = Math.max(piece.bounds.height, 1);
    return {
      minX,
      minY,
      maxX: minX + width,
      maxY: minY + height,
      width,
      height,
      centerX: minX + width / 2,
      centerY: minY + height / 2,
    };
  }

  const points = piece?.points || [];
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100, centerX: 50, centerY: 50 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach((pt) => {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;

    // Check bezier control points if present
    if (pt.cp1) {
      if (pt.cp1.x < minX) minX = pt.cp1.x;
      if (pt.cp1.y < minY) minY = pt.cp1.y;
      if (pt.cp1.x > maxX) maxX = pt.cp1.x;
      if (pt.cp1.y > maxY) maxY = pt.cp1.y;
    }
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Updates a point in a piece and re-synchronizes the segments and SVG path string.
 */
export function updatePiecePoint(piece, pointIndex, newCoords) {
  if (!piece || !piece.points || !piece.points[pointIndex]) return piece;

  const updatedPoints = piece.points.map((pt, idx) => {
    if (idx === pointIndex) {
      return {
        ...pt,
        x: Number(newCoords.x),
        y: Number(newCoords.y),
      };
    }
    return pt;
  });

  // Re-synchronize segments if linear
  const updatedSegments = (piece.segments || []).map((seg, idx) => {
    const p0 = updatedPoints[idx] || seg.p0;
    const p1 = updatedPoints[(idx + 1) % updatedPoints.length] || seg.p1;
    return {
      ...seg,
      p0: { x: p0.x, y: p0.y },
      p1: { x: p1.x, y: p1.y },
    };
  });

  const updatedPiece = {
    ...piece,
    points: updatedPoints,
    segments: updatedSegments.length > 0 ? updatedSegments : generateSegmentsFromPoints(updatedPoints),
  };

  updatedPiece.path = renderPieceToSvgPath(updatedPiece);
  return updatedPiece;
}
