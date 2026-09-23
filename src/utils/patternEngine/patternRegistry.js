/**
 * TAILORIX AI — MASTER PATTERN DISPATCHER & REGISTRY
 * Dispatches garment specifications and measurements to the appropriate deterministic pattern engine.
 * Applies true geometric seam offsets, calculates piece bounding boxes, and validates output.
 * 
 * CRITICAL RULE:
 * Never silently defaults unknown or unsupported garments to trousers.
 */

import { draftTrouserPattern } from './trouserBlockEngine';
import { draftShirtPattern } from './shirtBlockEngine';
import { draftKnitPattern } from './knitEngine';
import { draftJacketPattern } from './jacketBlockEngine';
import { draftSkirtDressPattern } from './skirtDressEngine';
import { applySeamAllowanceToPiece } from './geometricSeamOffset';
import { calculatePieceBounds } from '../../models/patternGeometry';
import { resolvePatternEngine } from '../../services/deconstruct/constructionResolver';
import { validatePatternPieces } from './patternValidator';
import { checkPatternGenerationGate } from '../../services/ai/aiRiskEvaluator';
import { logger } from '../deconstructLogger';

export function generatePattern(garmentSpec = {}, measurements = {}, parameters = {}, units = 'in') {
  // Pattern Generation Gate Check
  const gateCheck = checkPatternGenerationGate(garmentSpec, parameters);
  if (!gateCheck.allowed && !parameters.forceBypass && garmentSpec.status !== 'approved') {
    logger.router('Pattern generation gate blocked:', gateCheck.reason);
    return {
      status: gateCheck.status || 'needs_clarification',
      code: gateCheck.code,
      garmentType: garmentSpec.garmentType || 'unknown',
      reason: gateCheck.reason,
      risk: gateCheck.risk,
      candidates: gateCheck.candidates || ['shirt', 'trouser', 'jeans', 'jacket', 'dress', 'skirt'],
      requiredFields: gateCheck.requiredFields || ['identity.garmentType'],
      pieces: [],
      timestamp: Date.now(),
    };
  }

  // Resolve pattern engine and construction directives
  const resolution = resolvePatternEngine(garmentSpec);

  if (resolution.status === 'needs_clarification') {
    logger.router('Garment resolution requested clarification:', resolution.reason);
    return {
      status: 'needs_clarification',
      garmentType: 'unknown',
      reason: resolution.reason,
      candidates: resolution.candidates || ['shirt', 'trouser', 'jeans', 'jacket', 'dress', 'skirt'],
      requiredFields: resolution.requiredFields || ['identity.garmentType'],
      pieces: [],
      timestamp: Date.now(),
    };
  }

  if (resolution.status === 'validation_error') {
    logger.router('Garment specification failed validation:', resolution.errors);
    return {
      status: 'validation_error',
      garmentType: garmentSpec.garmentType || 'invalid',
      reason: resolution.reason,
      errors: resolution.errors,
      warnings: resolution.warnings,
      pieces: [],
      timestamp: Date.now(),
    };
  }

  if (resolution.status === 'unsupported') {
    logger.router('Garment type is unsupported:', resolution.reason);
    return {
      status: 'unsupported',
      garmentType: garmentSpec.garmentType || 'unsupported',
      reason: resolution.reason,
      candidates: resolution.candidates,
      pieces: [],
      timestamp: Date.now(),
    };
  }

  logger.reasoning(`Construction resolved: ${resolution.engine} + ${resolution.construction}`);
  logger.router(`Pattern engine dispatched: ${resolution.engine}`);

  const mergedParams = {
    ...resolution.parameters,
    ...parameters,
  };

  let result;
  switch (resolution.engine) {
    case 'shirtBlockEngine':
      result = draftShirtPattern(measurements, mergedParams, garmentSpec);
      break;

    case 'trouserBlockEngine':
      result = draftTrouserPattern(measurements, mergedParams, garmentSpec);
      break;

    case 'knitEngine':
      result = draftKnitPattern(measurements, mergedParams, garmentSpec);
      break;

    case 'jacketBlockEngine':
      result = draftJacketPattern(measurements, mergedParams, garmentSpec);
      break;

    case 'skirtDressEngine':
      result = draftSkirtDressPattern(measurements, mergedParams, garmentSpec);
      break;

    default:
      return {
        status: 'unsupported',
        garmentType: garmentSpec.garmentType,
        reason: `Engine "${resolution.engine}" has no direct executor.`,
        pieces: [],
        timestamp: Date.now(),
      };
  }

  // Post-process pieces: apply geometric seam allowances and bounds
  const rawPieces = result.pieces || [];
  logger.pattern(`Pattern pieces generated: ${rawPieces.length}`);

  const processedPieces = rawPieces.map((piece) => {
    const withOffset = applySeamAllowanceToPiece(piece, 12);
    const bounds = calculatePieceBounds(withOffset);
    return {
      ...withOffset,
      outline: withOffset.points || piece.points || [],
      boundingWidth: bounds.width,
      boundingHeight: bounds.height,
      bounds,
      units,
    };
  });

  // Level 2 Geometric Pattern Validation
  const patternValidation = validatePatternPieces(processedPieces);
  logger.validator(`Pattern geometry validation status: ${patternValidation.summary.status}`);

  return {
    status: 'success',
    engine: resolution.engine,
    garmentType: result.garmentType || garmentSpec.garmentType,
    garmentFamily: resolution.reasoning?.blockFamily || 'apparel',
    resolution,
    validation: patternValidation,
    pieces: processedPieces,
    timestamp: Date.now(),
  };
}
