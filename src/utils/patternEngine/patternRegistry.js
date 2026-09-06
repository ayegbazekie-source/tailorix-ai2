/**
 * TAILORIX AI — MASTER PATTERN DISPATCHER & REGISTRY
 * Dispatches garment specifications and measurements to the appropriate deterministic pattern engine.
 * Applies true geometric seam offsets and calculates piece bounding boxes.
 */

import { draftTrouserPattern } from './trouserBlockEngine';
import { draftShirtPattern } from './shirtBlockEngine';
import { draftKnitPattern } from './knitEngine';
import { draftJacketPattern } from './jacketBlockEngine';
import { draftSkirtDressPattern } from './skirtDressEngine';
import { applySeamAllowanceToPiece } from './geometricSeamOffset';
import { calculatePieceBounds } from '../../models/patternGeometry';
import { getGarmentType } from '../../models/garmentTaxonomy';

export function generatePattern(garmentSpec = {}, measurements = {}, parameters = {}, units = 'in') {
  const gType = getGarmentType(garmentSpec.garmentType || garmentSpec.category || 'trouser');
  const typeId = gType.id;

  let result;

  switch (typeId) {
    case 'trouser':
    case 'jeans':
    case 'shorts':
      result = draftTrouserPattern(measurements, parameters, garmentSpec);
      break;

    case 'shirt':
    case 'blouse':
      result = draftShirtPattern(measurements, parameters, garmentSpec);
      break;

    case 'polo':
    case 't_shirt':
      result = draftKnitPattern(measurements, parameters, garmentSpec);
      break;

    case 'jacket':
    case 'blazer':
    case 'coat':
    case 'vest':
      result = draftJacketPattern(measurements, parameters, garmentSpec);
      break;

    case 'skirt':
    case 'dress':
    case 'gown':
    case 'jumpsuit':
      result = draftSkirtDressPattern(measurements, parameters, garmentSpec);
      break;

    default:
      result = draftTrouserPattern(measurements, parameters, garmentSpec);
      break;
  }

  // Post-process pieces: apply geometric seam allowances and bounds
  const processedPieces = (result.pieces || []).map((piece) => {
    // Apply offset
    const withOffset = applySeamAllowanceToPiece(piece, 12);
    // Attach bounds
    const bounds = calculatePieceBounds(withOffset);
    return {
      ...withOffset,
      bounds,
      units,
    };
  });

  return {
    garmentType: typeId,
    garmentFamily: gType.family,
    pieces: processedPieces,
    timestamp: Date.now(),
  };
}
