/**
 * Utility to extrude and position 2D CAD pattern pieces into a 3D mesh space.
 */

export function convertPiecesTo3DMesh(pieces = [], measurements = {}) {
  // Map pattern pieces to parametric avatar body zones
  return pieces.map((piece) => {
    const isFront = piece.name.toLowerCase().includes('front');
    const isBack = piece.name.toLowerCase().includes('back');

    // Calculate simulated tension percentage based on ease measurements
    let strainLevel = 0.2; // 0.0 (loose) to 1.0 (high tension)
    if (measurements.waist < 28) strainLevel = 0.8; // High strain warning
    else if (measurements.waist > 38) strainLevel = 0.1;

    return {
      id: piece.id,
      name: piece.name,
      position: {
        x: 0,
        y: isFront ? 0.5 : -0.5,
        z: isFront ? 0.15 : -0.15,
      },
      rotation: {
        x: 0,
        y: isBack ? Math.PI : 0,
        z: 0,
      },
      strainLevel,
    };
  });
}
