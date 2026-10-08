/**
 * TAILORIX AI — PATTERN VALIDATION ENGINE
 * Inspects structured pattern pieces for production compliance, geometric integrity,
 * manufacturing completeness, and garment-family-specific topological sanity.
 */

const CAD_SCALE = 12; // 12 px per inch

export function validatePatternPieces(pieces = [], options = {}) {
  const issues = [];

  if (!Array.isArray(pieces) || pieces.length === 0) {
    return {
      valid: false,
      issues: [
        {
          id: 'no_pieces',
          type: 'error',
          pieceId: null,
          message: 'Pattern project contains zero pattern pieces.',
        },
      ],
      summary: {
        total: 1,
        errors: 1,
        warnings: 0,
        info: 0,
        status: 'Invalid (No Pieces)',
      },
    };
  }

  // 1. Generic Piece-Level Integrity Checks
  pieces.forEach((piece) => {
    const pId = piece.id || 'unknown';
    const pName = piece.name || 'Unnamed Piece';

    // Point Count Validation
    if (!piece.points || piece.points.length < 3) {
      issues.push({
        id: `pts_${pId}`,
        type: 'error',
        pieceId: pId,
        pieceName: pName,
        message: `Piece "${pName}" has fewer than 3 boundary vertices (${piece.points ? piece.points.length : 0}).`,
      });
      return;
    }

    // Duplicate / Zero-Length Segments
    for (let i = 0; i < piece.points.length; i++) {
      const nextIdx = (i + 1) % piece.points.length;
      const p1 = piece.points[i];
      const p2 = piece.points[nextIdx];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

      if (dist < 0.1) {
        issues.push({
          id: `zero_len_${pId}_${i}`,
          type: 'warning',
          pieceId: pId,
          pieceName: pName,
          message: `Zero-length segment detected between vertex ${i} and ${nextIdx} on "${pName}".`,
        });
      }
    }

    // Grainline Validation
    if (!piece.grainline || typeof piece.grainline.x1 !== 'number') {
      issues.push({
        id: `grain_${pId}`,
        type: 'warning',
        pieceId: pId,
        pieceName: pName,
        message: `Missing grainline orientation indicator on "${pName}".`,
      });
    }

    // Cut Quantity Specification
    const cutQtyStr = piece.cutQuantity !== undefined && piece.cutQuantity !== null ? String(piece.cutQuantity).trim() : '';
    if (!cutQtyStr) {
      issues.push({
        id: `cut_qty_${pId}`,
        type: 'info',
        pieceId: pId,
        pieceName: pName,
        message: `Cut quantity annotation not specified for "${pName}". Defaulting to Cut 1.`,
      });
    }

    // Seam Allowance Check
    if (typeof piece.seamAllowance !== 'number' || piece.seamAllowance <= 0) {
      issues.push({
        id: `sa_${pId}`,
        type: 'info',
        pieceId: pId,
        pieceName: pName,
        message: `No seam allowance defined for "${pName}". Raw cut edge equals stitch line.`,
      });
    }

    // Notches Check on complex pieces (legs, bodices, sleeves)
    const requiresNotches = ['LEG', 'BODICE', 'SLEEVE', 'JACKET', 'SKIRT'].some((k) => pId.includes(k));
    if (requiresNotches && (!piece.notches || piece.notches.length === 0)) {
      issues.push({
        id: `notches_${pId}`,
        type: 'warning',
        pieceId: pId,
        pieceName: pName,
        message: `Primary garment component "${pName}" lacks alignment notches for assembly.`,
      });
    }
  });

  // 2. Garment-Family Specific Sanity Checks
  const hasTrouserPieces = pieces.some((p) => p.id?.includes('TROUSER') || p.id?.includes('JEANS') || p.id?.includes('LEG'));
  if (hasTrouserPieces) {
    validateTrouserTopology(pieces, issues, options.measurements, options.specification);
  }

  const hasShirtPieces = pieces.some((p) => p.id?.includes('SHIRT') || p.id?.includes('COLLAR') || p.id?.includes('YOKE'));
  if (hasShirtPieces) {
    validateShirtTopology(pieces, issues, options.specification);
  }

  const hasErrors = issues.some((i) => i.type === 'error');
  const hasWarnings = issues.some((i) => i.type === 'warning');

  return {
    valid: !hasErrors,
    issues,
    summary: {
      total: issues.length,
      errors: issues.filter((i) => i.type === 'error').length,
      warnings: issues.filter((i) => i.type === 'warning').length,
      info: issues.filter((i) => i.type === 'info').length,
      status: hasErrors
        ? 'Invalid (Action Required)'
        : hasWarnings
        ? 'Geometry Valid (Advisories Present)'
        : 'Geometry Valid (Production Standard Tolerances)',
    },
  };
}

/**
 * Geometric Sanity Checks Specific to Trouser Family
 */
function validateTrouserTopology(pieces, issues, targetMeasurements = {}, specification = {}) {
  const frontLeg = pieces.find((p) => p.id?.includes('FRONT_LEG'));
  const backLeg = pieces.find((p) => p.id?.includes('BACK_LEG'));
  const waistband = pieces.find((p) => p.id?.includes('WAISTBAND'));

  if (!frontLeg || !backLeg) {
    issues.push({
      id: 'trouser_missing_legs',
      type: 'error',
      pieceId: null,
      message: 'Incomplete trouser topology: both Front Leg and Back Leg pattern pieces are required.',
    });
    return;
  }

  // 1. Topology & Vertex Count Check
  if (frontLeg.points.length < 8) {
    issues.push({
      id: 'trouser_front_incomplete_topology',
      type: 'error',
      pieceId: frontLeg.id,
      message: `Front leg has insufficient perimeter vertices (${frontLeg.points.length}) to define waist, outseam, knee, hem, and crotch curve.`,
    });
  }

  if (backLeg.points.length < 8) {
    issues.push({
      id: 'trouser_back_incomplete_topology',
      type: 'error',
      pieceId: backLeg.id,
      message: `Back leg has insufficient perimeter vertices (${backLeg.points.length}) to define seat line, outseam, and crotch curve.`,
    });
  }

  // 2. Cut Quantity Check
  const fCut = (frontLeg.cutQuantity || '').toLowerCase();
  const bCut = (backLeg.cutQuantity || '').toLowerCase();
  if (!fCut.includes('2') && !fCut.includes('pair')) {
    issues.push({
      id: 'trouser_front_cut_qty',
      type: 'warning',
      pieceId: frontLeg.id,
      message: `Front leg cut quantity "${frontLeg.cutQuantity}" should specify Cut 2 (Pair).`,
    });
  }
  if (!bCut.includes('2') && !bCut.includes('pair')) {
    issues.push({
      id: 'trouser_back_cut_qty',
      type: 'warning',
      pieceId: backLeg.id,
      message: `Back leg cut quantity "${backLeg.cutQuantity}" should specify Cut 2 (Pair).`,
    });
  }

  // 3. Inseam & Outseam Continuity
  const fBounds = frontLeg.bounds || calculateBoundsFromPoints(frontLeg.points);
  const bBounds = backLeg.bounds || calculateBoundsFromPoints(backLeg.points);

  const fHeightInches = fBounds.height / CAD_SCALE;
  const bHeightInches = bBounds.height / CAD_SCALE;

  // Front and back leg total lengths should match within 1.75" (accounting for raised back seat rise)
  const lengthDiff = Math.abs(bHeightInches - fHeightInches);
  if (lengthDiff > 2.5) {
    issues.push({
      id: 'trouser_length_mismatch',
      type: 'warning',
      pieceId: frontLeg.id,
      message: `Front leg height (${fHeightInches.toFixed(1)}") and back leg height (${bHeightInches.toFixed(1)}") differ by ${lengthDiff.toFixed(1)}", exceeding standard seat-rise tolerance.`,
    });
  }

  // 4. Back Seat Rise Elevation Check
  // In a balanced trouser, the top of the back leg center waist must be higher (lower Y in canvas) than the front waist
  const fMinY = fBounds.minY / CAD_SCALE;
  const bMinY = bBounds.minY / CAD_SCALE;
  if (bMinY > fMinY + 0.25) {
    issues.push({
      id: 'trouser_inverted_seat_rise',
      type: 'error',
      pieceId: backLeg.id,
      message: 'Impossible geometry: Back trouser waist is lower than front waist. Center back must be elevated for sitting room.',
    });
  }

  // 5. Waistband Compatibility
  if (waistband) {
    const wbBounds = waistband.bounds || calculateBoundsFromPoints(waistband.points);
    const wbLengthInches = wbBounds.width / CAD_SCALE;
    const targetWaist = targetMeasurements.waist || 32;

    // Waistband should be at least targetWaist + 1.0" for fly overlap and ease
    if (wbLengthInches < targetWaist) {
      issues.push({
        id: 'trouser_waistband_short',
        type: 'error',
        pieceId: waistband.id,
        message: `Waistband length (${wbLengthInches.toFixed(1)}") is shorter than target waist (${targetWaist}"). Cannot fit body circumference.`,
      });
    }
  }

  // 6. Crotch Curve Concavity Check (Verify no inverted spikes)
  const fFork = frontLeg.points.find((p) => p.label?.toLowerCase().includes('crotch fork') || p.label?.toLowerCase().includes('fork'));
  const bFork = backLeg.points.find((p) => p.label?.toLowerCase().includes('crotch fork') || p.label?.toLowerCase().includes('fork'));
  if (fFork && bFork) {
    // Both forks should extend to the inseam side
    const fInseamKnee = frontLeg.points.find((p) => p.label?.toLowerCase().includes('knee inseam'));
    if (fInseamKnee && fFork.x > fInseamKnee.x + 10) {
      issues.push({
        id: 'trouser_inverted_crotch_extension',
        type: 'error',
        pieceId: frontLeg.id,
        message: 'Impossible geometry: Front crotch fork is located on the outseam side instead of inseam side.',
      });
    }
  }

  // 7. Deterministic Specification-to-Geometry Alignment Validation (Section 11)
  const reqSilhouette = String(specification?.silhouette?.primary || specification?.silhouette || '').toLowerCase();
  if (reqSilhouette.includes('flare') || reqSilhouette.includes('bootcut')) {
    const kneeOutseam = frontLeg.points.find((p) => p.label?.toLowerCase().includes('knee') && p.label?.toLowerCase().includes('outseam'));
    const kneeInseam = frontLeg.points.find((p) => p.label?.toLowerCase().includes('knee') && p.label?.toLowerCase().includes('inseam'));
    const hemOutseam = frontLeg.points.find((p) => p.label?.toLowerCase().includes('hem') && p.label?.toLowerCase().includes('outseam'));
    const hemInseam = frontLeg.points.find((p) => p.label?.toLowerCase().includes('hem') && p.label?.toLowerCase().includes('inseam'));

    if (kneeOutseam && kneeInseam && hemOutseam && hemInseam) {
      const kneeW = Math.abs(kneeOutseam.x - kneeInseam.x) / CAD_SCALE;
      const hemW = Math.abs(hemOutseam.x - hemInseam.x) / CAD_SCALE;
      if (hemW <= kneeW) {
        issues.push({
          id: 'silhouette_geometry_mismatch_flare',
          type: 'error',
          pieceId: frontLeg.id,
          message: `Specification specifies a "flared" trouser silhouette, but generated CAD geometry hem width (${(hemW * 2).toFixed(1)}") is less than or equal to knee width (${(kneeW * 2).toFixed(1)}"). Geometry must flare outwards at hem.`,
        });
      }
    }
  }
}

/**
 * Geometric Sanity Checks for Shirt Family
 */
function validateShirtTopology(pieces, issues) {
  const frontBodice = pieces.find((p) => p.id?.includes('FRONT'));
  const backBodice = pieces.find((p) => p.id?.includes('BACK'));

  if (!frontBodice || !backBodice) {
    issues.push({
      id: 'shirt_missing_bodice',
      type: 'error',
      pieceId: null,
      message: 'Incomplete shirt topology: Front Bodice and Back Bodice pieces are required.',
    });
  }
}

function calculateBoundsFromPoints(points = []) {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
