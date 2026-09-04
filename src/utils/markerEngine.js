/**
 * Layout engine for estimating fabric yield and arranging pattern pieces.
 */

export function calculateFabricMarker(pieces = [], fabricWidthInches = 60) {
  const GAP = 1.0; // Safety gap between pieces in inches
  let currentX = GAP;
  let currentY = GAP;
  let rowMaxHeight = 0;
  let totalFabricLength = 0;

  const placedPieces = pieces.map((piece) => {
    // Rough bounding box estimation based on pattern coordinates
    const width = 18;  // Estimated bounding box width in inches
    const height = 34; // Estimated bounding box height in inches

    // Shift to next row if piece exceeds fabric width
    if (currentX + width > fabricWidthInches) {
      currentX = GAP;
      currentY += rowMaxHeight + GAP;
      rowMaxHeight = 0;
    }

    const position = { x: currentX, y: currentY, width, height };
    
    currentX += width + GAP;
    rowMaxHeight = Math.max(rowMaxHeight, height);
    totalFabricLength = Math.max(totalFabricLength, currentY + height + GAP);

    return {
      ...piece,
      markerPosition: position,
    };
  });

  const totalSquareInchesUsed = placedPieces.reduce(
    (acc, p) => acc + p.markerPosition.width * p.markerPosition.height,
    0
  );
  const totalSquareInchesFabric = fabricWidthInches * totalFabricLength;
  const efficiency = totalSquareInchesFabric > 0 
    ? Math.min(Math.round((totalSquareInchesUsed / totalSquareInchesFabric) * 100), 100)
    : 0;

  const requiredYards = (totalFabricLength / 36).toFixed(2);
  const requiredMeters = (totalFabricLength * 0.0254).toFixed(2);

  return {
    placedPieces,
    fabricWidthInches,
    totalFabricLengthInches: totalFabricLength,
    requiredYards,
    requiredMeters,
    efficiency,
  };
}
