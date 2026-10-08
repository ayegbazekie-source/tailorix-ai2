/**
 * TAILORIX AI — STANDARDIZED PROFESSIONAL CAD & TECHNICAL FLAT VECTOR STYLE CONFIGURATION
 * 
 * Defines high-end garment engineering drawing specifications aligned with
 * industrial CAD suites (Lectra Modaris, Gerber AccuMark, CLO 3D, Optitex)
 * and Savile Row bespoke atelier technical packs.
 */

export const CAD_STYLE_CONFIG = {
  // 1. Outer Silhouette Perimeter (The cut edge / pattern perimeter)
  outerSilhouette: {
    stroke: '#0B0F19',          // Solid Obsidian Ink
    strokeWidth: 2.5,           // 2.5px confident cutline
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
    activeGlow: 'rgba(11, 15, 25, 0.15)',
  },

  // 2. Primary Construction Seams (Joining seams, armscye, inseams, princess seams)
  primarySeam: {
    stroke: '#1E293B',          // Deep Structural Charcoal
    strokeWidth: 1.5,           // 1.5px solid engineering stroke
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
    selectedStroke: '#C5A059',  // Gold atelier highlight
    hoverStroke: '#B45309',
    selectedGlowWidth: 6.0,
    selectedGlowOpacity: 0.25,
  },

  // 3. Topstitching & Edgestitching (1/16" & 1/4" single/double needle runs)
  topstitching: {
    stroke: '#475569',          // Technical Slate
    strokeWidth: 1.0,           // 1.0px fine gauge
    strokeDasharray: '4 2.5',   // Standardized 4px dash, 2.5px gap
    strokeLinecap: 'round',
    fill: 'none',
  },

  // 4. Darts & Contour Shaping (Suppression lines with precision apex drill circles)
  dart: {
    stroke: '#334155',          // Structural Dart Charcoal
    strokeWidth: 1.2,           // 1.2px precise leg stroke
    strokeLinecap: 'round',
    fill: 'none',
    apexCircle: {
      r: 2.4,                   // 2.4px radius precision drill hole indicator
      fill: '#B45309',          // Amber center fill
      stroke: '#0F172A',        // Dark perimeter ring
      strokeWidth: 1.0,
    },
    foldScoreline: {
      stroke: '#64748B',
      strokeWidth: 0.9,
      strokeDasharray: '6 3',
    },
  },

  // 5. Crease Lines & Pleat Scorelines (Pressed center creases, knife/box pleats)
  creaseAndPleat: {
    stroke: '#64748B',          // Muted Slate Scoreline
    strokeWidth: 0.9,
    strokeDasharray: '8 2.5 1.5 2.5', // Industry-standard dash-dot-dash fold line
    strokeLinecap: 'round',
    fill: 'none',
  },

  // 6. Center Front / Center Back / Fold Lines (Place-on-fold guidelines)
  centerFold: {
    stroke: '#0F172A',
    strokeWidth: 1.4,
    strokeDasharray: '8 3',
    bracketStroke: '#0F172A',
    bracketWidth: 1.5,
    arrowFill: '#0F172A',
  },

  // 7. Grainlines (Lengthwise warp grain indicator)
  grainline: {
    stroke: '#B45309',          // Engineering Amber
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    arrowFill: '#B45309',
    arrowWidth: 7,
    arrowLength: 9,
    labelColor: '#B45309',
    fontSize: 7.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: '0.8px',
  },

  // 8. Balance Notches (Perpendicular alignment tick marks)
  balanceNotch: {
    singleStroke: '#DC2626',    // Crimson Precision Ticks
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    tickLength: 10,
    doubleGap: 4,
  },

  // 9. Seam Allowance Guide Line (Inset 0.5" / 1.27cm seam guide)
  seamAllowanceGuide: {
    stroke: '#475569',
    strokeWidth: 1.1,
    strokeDasharray: '4 2.5',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
    insetRatio: 0.93,
  },

  // 10. Plumb Line & Dimension Indicators
  dimensionLine: {
    stroke: '#94A3B8',
    strokeWidth: 0.8,
    strokeDasharray: '3 3',
    tickSize: 8,
    textColor: '#64748B',
    fontSize: 7.0,
    fontFamily: 'monospace',
  },

  // 11. Canvas Foundation & Technical Paper
  canvas: {
    paperColor: '#FFFFFF',
    vellumColor: '#FAF8F5',
    gridStroke: '#E2E8F0',
    gridWidth: 0.6,
    gridSize: 20,
    rulerColor: '#94A3B8',
  },
};

/**
 * Extracts the coordinate of a dart's apex from its SVG path string (e.g. "M ... Q ... L x y" or "M x1 y1 L x2 y2").
 * @param {string} pathD - SVG path definition
 * @param {number} defaultX - Fallback center X
 * @param {number} defaultY - Fallback center Y
 * @returns {{x: number, y: number}}
 */
export function extractDartApexCoords(pathD = '', defaultX = 200, defaultY = 200) {
  if (!pathD) return { x: defaultX, y: defaultY };
  
  // Find all coordinates in path
  const matches = [...pathD.matchAll(/([MLCQSZ])\s*([\d.-]+)[\s,]+([\d.-]+)/gi)];
  if (matches.length > 0) {
    // Usually the middle or end point of a dart path is the apex
    const last = matches[matches.length - 1];
    return {
      x: parseFloat(last[2]) || defaultX,
      y: parseFloat(last[3]) || defaultY,
    };
  }

  const numPairs = [...pathD.matchAll(/([\d.-]+)[\s,]+([\d.-]+)/g)];
  if (numPairs.length > 0) {
    const last = numPairs[numPairs.length - 1];
    return {
      x: parseFloat(last[1]) || defaultX,
      y: parseFloat(last[2]) || defaultY,
    };
  }

  return { x: defaultX, y: defaultY };
}

/**
 * Checks if a seam or detail object represents topstitching or edgestitching.
 */
export function isTopstitchingDetail(item = {}) {
  const label = String(item.label || item.type || item.name || '').toLowerCase();
  return (
    item.dashed ||
    item.style === 'dashed' ||
    label.includes('stitch') ||
    label.includes('hem') ||
    label.includes('topstitch') ||
    label.includes('edge') ||
    label.includes('guide')
  );
}

/**
 * Generates an SVG definition string containing standard CAD gradients, filters, and markers.
 */
export function generateStandardCadSvgDefs(idPrefix = 'cad') {
  return `
    <defs>
      <!-- Standardized High-End Atelier Shading Gradient -->
      <linearGradient id="${idPrefix}_fabricShade" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor="#F9FAFB" />
        <stop offset="85%" stopColor="#EFF2F7" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>

      <!-- Soft Ink Shadow Filter -->
      <filter id="${idPrefix}_inkShadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.08" />
      </filter>

      <!-- Precision Grainline Bidirectional Arrow Markers -->
      <marker id="${idPrefix}_arrow_start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <polygon points="5,0 10,10 0,10" fill="#B45309" />
      </marker>
      <marker id="${idPrefix}_arrow_end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <polygon points="5,0 10,10 0,10" fill="#B45309" />
      </marker>
    </defs>
  `;
}
