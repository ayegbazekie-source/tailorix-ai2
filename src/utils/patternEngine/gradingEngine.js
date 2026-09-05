/**
 * Utility to calculate nested vector coordinates across multiple sizing tiers.
 */

export const STANDARD_SIZE_MODIFIERS = {
  S: { waist: -4, hip: -4, bustChest: -4, length: -1 },
  M: { waist: 0, hip: 0, bustChest: 0, length: 0 }, // Base Size
  L: { waist: 4, hip: 4, bustChest: 4, length: 1 },
  XL: { waist: 8, hip: 8, bustChest: 8, length: 2 },
  XXL: { waist: 12, hip: 12, bustChest: 12, length: 3 },
};

export const SIZE_COLORS = {
  S: '#38bdf8',   // Sky Blue
  M: '#f59e0b',   // Amber (Base)
  L: '#10b981',   // Emerald
  XL: '#a855f7',  // Purple
  XXL: '#f43f5e',  // Rose
};

export function generateNestedGrading(baseCadData, activeSizes = ['S', 'M', 'L', 'XL']) {
  if (!baseCadData || !baseCadData.pieces) return [];

  return activeSizes.map((sizeKey) => {
    const modifier = STANDARD_SIZE_MODIFIERS[sizeKey] || { waist: 0, hip: 0, bustChest: 0, length: 0 };
    
    // Scale points radially relative to piece center
    const gradedPieces = baseCadData.pieces.map((piece) => {
      if (!piece.points) return piece;

      const scaleFactor = 1 + (modifier.waist * 0.02);

      const gradedPoints = piece.points.map((pt) => ({
        x: pt.x * scaleFactor,
        y: pt.y + modifier.length * 5,
      }));

      // Reconstruct path string
      const pathStr = gradedPoints.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}` : `${acc} L ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
      }, '') + ' Z';

      return {
        ...piece,
        sizeKey,
        path: pathStr,
        points: gradedPoints,
      };
    });

    return {
      sizeKey,
      color: SIZE_COLORS[sizeKey] || '#ffffff',
      pieces: gradedPieces,
    };
  });
}
