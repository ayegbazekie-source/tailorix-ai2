/**
 * TAILORIX AI — MARKER NESTING & FABRIC YIELD ENGINE
 * Arranges validated structured pattern pieces along specified fabric widths (45", 54", 60")
 * respecting grainlines, quantity multiples, and cutting buffer allowances.
 */

import { calculatePieceBounds } from '../models/patternGeometry';

export function calculateOptimizedMarker(pieces = [], options = {}) {
  const fabricWidthInches = options.fabricWidthInches || 60;
  const bufferInches = options.bufferInches || 0.75; // 3/4" buffer between pieces
  const scale = 12; // 12 px per inch

  if (!Array.isArray(pieces) || pieces.length === 0) {
    return {
      placedPieces: [],
      fabricWidthInches,
      totalLengthInches: 0,
      totalYards: 0,
      totalMeters: 0,
      efficiency: 0,
    };
  }

  // Expand pieces based on cut quantity
  const cutQueue = [];
  pieces.forEach((piece) => {
    const qtyMatch = (piece.cutQuantity || '1').match(/\d+/);
    const count = qtyMatch ? parseInt(qtyMatch[0], 10) : 1;
    const bounds = calculatePieceBounds(piece);
    const widthIn = bounds.width / scale;
    const heightIn = bounds.height / scale;

    for (let i = 0; i < count; i++) {
      cutQueue.push({
        id: `${piece.id}_instance_${i + 1}`,
        sourcePieceId: piece.id,
        name: piece.name,
        widthIn,
        heightIn,
        widthPx: bounds.width,
        heightPx: bounds.height,
        grainline: piece.grainline,
        color: piece.color || '#f59e0b',
        instanceNumber: i + 1,
        totalInstances: count,
      });
    }
  });

  // Sort pieces by height descending (First Fit Decreasing Height heuristic)
  cutQueue.sort((a, b) => b.heightIn - a.heightIn);

  let currentX = bufferInches;
  let currentY = bufferInches;
  let rowHeight = 0;
  let maxFabricLength = 0;
  let totalAreaUsed = 0;

  const placedPieces = cutQueue.map((item) => {
    // Check if item fits in current row
    if (currentX + item.widthIn + bufferInches > fabricWidthInches) {
      // Start next row
      currentX = bufferInches;
      currentY += rowHeight + bufferInches;
      rowHeight = 0;
    }

    const placed = {
      ...item,
      x: currentX,
      y: currentY,
    };

    currentX += item.widthIn + bufferInches;
    rowHeight = Math.max(rowHeight, item.heightIn);
    maxFabricLength = Math.max(maxFabricLength, currentY + item.heightIn + bufferInches);
    totalAreaUsed += item.widthIn * item.heightIn;

    return placed;
  });

  const totalFabricArea = fabricWidthInches * maxFabricLength;
  const efficiency = totalFabricArea > 0
    ? Math.min(Math.round((totalAreaUsed / totalFabricArea) * 100), 100)
    : 0;

  const totalYards = (maxFabricLength / 36).toFixed(2);
  const totalMeters = (maxFabricLength * 0.0254).toFixed(2);

  return {
    placedPieces,
    fabricWidthInches,
    totalLengthInches: Number(maxFabricLength.toFixed(2)),
    totalYards: Number(totalYards),
    totalMeters: Number(totalMeters),
    efficiency,
  };
}
