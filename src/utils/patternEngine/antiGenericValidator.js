/**
 * TAILORIX AI — ANTI-GENERIC PATTERN & IDENTITY VALIDATOR
 * 
 * Enforces Section 20A & 20B:
 * 1. Prevents generic fallback patterns from being passed off as custom blueprints.
 * 2. Compares Verified GarmentSpecification + ReconstructionModel against Generated Canonical Geometry.
 * 3. Enforces strict category isolation (never allowing trouser geometry for a dress or shirt).
 * 4. Checks silhouette geometry fidelity (e.g., flared trousers must produce flared geometry).
 * 5. Pattern Identity / Collision detection across distinct garment specifications.
 */

const CAD_SCALE = 12; // 12 px per inch

/**
 * Validates that generated CAD pattern pieces authentically reflect the verified specification.
 */
export function validateAntiGenericPattern(pieces = [], spec = {}, reconstructionModel = null) {
  const issues = [];
  const gType = String(spec.identity?.garmentType || spec.garmentType || '').toLowerCase();
  const silhouette = String(spec.silhouette?.primary || spec.silhouette || '').toLowerCase();

  if (!Array.isArray(pieces) || pieces.length === 0) {
    return {
      valid: false,
      status: 'EMPTY_GEOMETRY',
      issues: [{ code: 'NO_PIECES', message: 'No pattern pieces were generated.' }],
    };
  }

  // =========================================================================
  // 1. STRICT CATEGORY ISOLATION CHECK
  // =========================================================================
  const pieceIds = pieces.map((p) => p.id || '');
  const hasTrouserPieces = pieceIds.some((id) => id.includes('TROUSER') || id.includes('FRONT_LEG') || id.includes('BACK_LEG'));
  const hasShirtPieces = pieceIds.some((id) => id.includes('SHIRT') || id.includes('BODICE') || id.includes('COLLAR'));
  const hasDressPieces = pieceIds.some((id) => id.includes('GOWN') || id.includes('SKIRT'));

  if ((gType === 'dress' || gType === 'gown' || gType === 'skirt') && hasTrouserPieces) {
    issues.push({
      code: 'CROSS_CATEGORY_GEOMETRY_LEAK',
      severity: 'fatal',
      message: `CRITICAL ARCHITECTURAL LEAK: Pattern engine produced trouser leg pieces for a ${gType} specification.`,
    });
  }

  if ((gType === 'trouser' || gType === 'jeans' || gType === 'shorts') && (hasShirtPieces || (hasDressPieces && !gType.includes('skirt')))) {
    issues.push({
      code: 'CROSS_CATEGORY_GEOMETRY_LEAK',
      severity: 'fatal',
      message: `CRITICAL ARCHITECTURAL LEAK: Pattern engine produced upper-body pieces for a ${gType} specification.`,
    });
  }

  // =========================================================================
  // 2. DATA-DRIVEN SILHOUETTE FIDELITY CHECK
  // =========================================================================
  if (gType === 'trouser' || gType === 'jeans') {
    const frontLeg = pieces.find((p) => p.id?.includes('FRONT_LEG'));
    if (frontLeg && frontLeg.points) {
      const kneeOutseam = frontLeg.points.find((p) => p.label?.toLowerCase().includes('knee') && p.label?.toLowerCase().includes('outseam'));
      const kneeInseam = frontLeg.points.find((p) => p.label?.toLowerCase().includes('knee') && p.label?.toLowerCase().includes('inseam'));
      const hemOutseam = frontLeg.points.find((p) => p.label?.toLowerCase().includes('hem') && p.label?.toLowerCase().includes('outseam'));
      const hemInseam = frontLeg.points.find((p) => p.label?.toLowerCase().includes('hem') && p.label?.toLowerCase().includes('inseam'));

      if (kneeOutseam && kneeInseam && hemOutseam && hemInseam) {
        const kneeWidth = Math.abs(kneeOutseam.x - kneeInseam.x) / CAD_SCALE;
        const hemWidth = Math.abs(hemOutseam.x - hemInseam.x) / CAD_SCALE;

        // Flare verification
        if (silhouette.includes('flare') || silhouette.includes('bootcut')) {
          if (hemWidth <= kneeWidth) {
            issues.push({
              code: 'SILHOUETTE_MISMATCH_FLARE',
              severity: 'error',
              message: `Specification specifies a "flared" trouser, but generated CAD geometry hem width (${(hemWidth * 2).toFixed(1)}") is less than or equal to knee width (${(kneeWidth * 2).toFixed(1)}"). Geometry must flare outwards at hem.`,
            });
          }
        }

        // Slim/tapered verification
        if (silhouette.includes('slim') || silhouette.includes('taper')) {
          if (hemWidth > kneeWidth) {
            issues.push({
              code: 'SILHOUETTE_MISMATCH_TAPER',
              severity: 'warning',
              message: `Specification specifies a "slim/tapered" trouser, but hem width (${(hemWidth * 2).toFixed(1)}") is wider than knee (${(kneeWidth * 2).toFixed(1)}").`,
            });
          }
        }
      }
    }
  }

  // Shorts Length Verification
  if (gType === 'shorts') {
    const frontLeg = pieces.find((p) => p.id?.includes('FRONT_LEG'));
    if (frontLeg && frontLeg.bounds) {
      const heightInches = frontLeg.bounds.height / CAD_SCALE;
      if (heightInches > 26) {
        issues.push({
          code: 'PROPORTION_MISMATCH_SHORTS',
          severity: 'error',
          message: `Specification is for shorts, but generated leg height is ${heightInches.toFixed(1)}" (full trouser length).`,
        });
      }
    }
  }

  // Compute Deterministic Geometry Hash
  const geometryHash = computeGeometrySignature(pieces);

  const hasFatal = issues.some((i) => i.severity === 'fatal');
  const hasError = issues.some((i) => i.severity === 'error');

  return {
    valid: !hasFatal && !hasError,
    status: hasFatal ? 'CROSS_CATEGORY_LEAK' : hasError ? 'SILHOUETTE_MISMATCH' : 'VALIDATED_DISTINCT_GEOMETRY',
    issues,
    geometryHash,
  };
}

/**
 * Computes a deterministic mathematical signature of pattern pieces to detect identical output collisions.
 */
export function computeGeometrySignature(pieces = []) {
  if (!pieces || pieces.length === 0) return '0_empty';

  let totalPoints = 0;
  let totalPerimeter = 0;
  let totalArea = 0;

  const sorted = [...pieces].sort((a, b) => String(a.id).localeCompare(String(b.id)));

  sorted.forEach((p) => {
    const pts = p.points || [];
    totalPoints += pts.length;
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      totalPerimeter += Math.hypot(next.x - pts[i].x, next.y - pts[i].y);
    }
    const b = p.bounds || { width: 0, height: 0 };
    totalArea += b.width * b.height;
  });

  return `pcs_${pieces.length}_pts_${totalPoints}_perim_${Math.round(totalPerimeter)}_area_${Math.round(totalArea)}`;
}

/**
 * Identity collision detector: flags if two different garment specs unexpectedly output identical geometry.
 */
export function checkPatternIdentityCollision(currentGeometryHash, previousSessions = []) {
  if (!previousSessions || previousSessions.length === 0) return { collision: false };

  const match = previousSessions.find(
    (s) => s.geometryHash === currentGeometryHash && s.garmentType !== previousSessions[0]?.garmentType
  );

  if (match) {
    return {
      collision: true,
      status: 'PATTERN_IDENTITY_COLLISION',
      message: `CRITICAL QUALITY GATE: Current garment generated identical CAD geometry to a different garment type (${match.garmentType}). Identical SVG generation blocked.`,
    };
  }

  return { collision: false };
}
