/**
 * TAILORIX AI — POINT-SPECIFIC GRADING ENGINE
 * Applies point-specific X/Y grade rules across individual vertices rather than
 * naive uniform radial scaling.
 */

import { renderPieceToSvgPath } from '../../models/patternGeometry';

export const SIZE_SPECTRUM = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const SIZE_PALETTE = {
  XS: '#38bdf8', // Light Sky Blue
  S: '#0ea5e9',  // Ocean Blue
  M: '#f59e0b',  // Amber (Base Size)
  L: '#10b981',  // Emerald Green
  XL: '#a855f7', // Purple
  XXL: '#f43f5e',// Crimson
};

export const SIZE_GRADE_MULTIPLIERS = {
  XS: -2,
  S: -1,
  M: 0, // Base
  L: 1,
  XL: 2,
  XXL: 3,
};

/**
 * Calculates graded pattern pieces across selected sizes using vertex-specific grade rules.
 */
export function generatePointGradedPattern(pieces = [], activeSizes = ['S', 'M', 'L', 'XL'], scaleFactor = 12) {
  if (!Array.isArray(pieces)) return [];

  return activeSizes.map((sizeKey) => {
    const multiplier = SIZE_GRADE_MULTIPLIERS[sizeKey] ?? 0;
    const color = SIZE_PALETTE[sizeKey] || '#94a3b8';

    const gradedPieces = pieces.map((piece) => {
      if (!piece.points || piece.points.length === 0) return piece;

      // Grade individual vertices
      const gradedPoints = piece.points.map((pt, idx) => {
        let dx = 0;
        let dy = 0;

        if (pt.gradeRule) {
          dx = (pt.gradeRule.dx || 0) * multiplier * scaleFactor;
          dy = (pt.gradeRule.dy || 0) * multiplier * scaleFactor;
        } else {
          // Default heuristic grading if no specific rule on vertex:
          // X shifts based on horizontal position from center, Y shifts down for length
          const xSign = pt.x > 200 ? 1 : -1;
          dx = xSign * 0.25 * multiplier * scaleFactor;
          dy = 0.25 * multiplier * scaleFactor;
        }

        return {
          ...pt,
          id: `${pt.id}_${sizeKey}`,
          x: pt.x + dx,
          y: pt.y + dy,
          cp1: pt.cp1 ? { x: pt.cp1.x + dx, y: pt.cp1.y + dy } : null,
          cp2: pt.cp2 ? { x: pt.cp2.x + dx, y: pt.cp2.y + dy } : null,
        };
      });

      const gradedPiece = {
        ...piece,
        id: `${piece.id}_${sizeKey}`,
        size: sizeKey,
        points: gradedPoints,
        color,
      };

      // Re-render SVG path from graded points
      gradedPiece.path = renderPieceToSvgPath(gradedPiece);
      return gradedPiece;
    });

    return {
      sizeKey,
      multiplier,
      color,
      pieces: gradedPieces,
    };
  });
}
