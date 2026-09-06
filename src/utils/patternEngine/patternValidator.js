/**
 * TAILORIX AI — PATTERN VALIDATION ENGINE
 * Inspects structured pattern pieces for production compliance, geometric integrity,
 * and manufacturing completeness.
 */

export function validatePatternPieces(pieces = []) {
  const issues = [];

  if (!Array.isArray(pieces) || pieces.length === 0) {
    return [
      {
        id: 'no_pieces',
        type: 'error',
        pieceId: null,
        message: 'Pattern project contains zero pattern pieces.',
      },
    ];
  }

  pieces.forEach((piece) => {
    const pId = piece.id || 'unknown';
    const pName = piece.name || 'Unnamed Piece';

    // 1. Point Count Validation
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

    // 2. Duplicate / Zero-Length Segments
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

    // 3. Grainline Validation
    if (!piece.grainline || typeof piece.grainline.x1 !== 'number') {
      issues.push({
        id: `grain_${pId}`,
        type: 'warning',
        pieceId: pId,
        pieceName: pName,
        message: `Missing grainline orientation indicator on "${pName}".`,
      });
    }

    // 4. Cut Quantity Specification
    if (!piece.cutQuantity || piece.cutQuantity.trim() === '') {
      issues.push({
        id: `cut_qty_${pId}`,
        type: 'info',
        pieceId: pId,
        pieceName: pName,
        message: `Cut quantity annotation not specified for "${pName}". Defaulting to Cut 1.`,
      });
    }

    // 5. Seam Allowance Check
    if (typeof piece.seamAllowance !== 'number' || piece.seamAllowance <= 0) {
      issues.push({
        id: `sa_${pId}`,
        type: 'info',
        pieceId: pId,
        pieceName: pName,
        message: `No seam allowance defined for "${pName}". Raw cut edge equals stitch line.`,
      });
    }

    // 6. Notches Check on complex pieces (legs, bodices, sleeves)
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
      status: hasErrors ? 'Invalid (Action Required)' : hasWarnings ? 'Compliant with Warnings' : 'Production Ready',
    },
  };
}
