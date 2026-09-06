/**
 * TAILORIX AI — MARKER ENGINE DELEGATOR
 */

import { calculateOptimizedMarker } from './markerNestingEngine';

export function calculateFabricMarker(pieces = [], fabricWidthInches = 60) {
  const result = calculateOptimizedMarker(pieces, { fabricWidthInches });
  return {
    placedPieces: result.placedPieces,
    fabricWidthInches: result.fabricWidthInches,
    totalFabricLengthInches: result.totalLengthInches,
    requiredYards: result.totalYards,
    requiredMeters: result.totalMeters,
    efficiency: result.efficiency,
  };
}
