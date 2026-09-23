/**
 * TAILORIX AI — CONSTRUCTION RESOLVER & GARMENT TYPE RESOLVER
 * 
 * Maps normalized specifications deterministically to existing pattern block engines.
 * 
 * CRITICAL RULE:
 * There must NEVER be behavior where an unknown garment silently becomes a trouser pattern.
 * When garment type is unknown, uncertain, or unsupported, this resolver returns a
 * structured clarification/validation state.
 */

import { reasonGarmentConstruction } from './garmentReasoning';
import { validateGarmentSpecification } from './garmentValidation';

export const ENGINE_NAMES = {
  SHIRT: 'shirtBlockEngine',
  TROUSER: 'trouserBlockEngine',
  JACKET: 'jacketBlockEngine',
  SKIRT_DRESS: 'skirtDressEngine',
  KNIT: 'knitEngine',
};

/**
 * Resolves a normalized GarmentSpecification to the appropriate pattern engine.
 */
export function resolvePatternEngine(specification = {}) {
  // 1. Pre-validation
  const validation = validateGarmentSpecification(specification);
  if (!validation.valid) {
    const isUnknownType = validation.errors.some(
      (e) => e.code === 'UNKNOWN_GARMENT_TYPE' || e.code === 'UNSUPPORTED_GARMENT_TYPE'
    );
    if (isUnknownType) {
      return {
        status: 'needs_clarification',
        reason: 'Garment type could not be resolved from reference image or input specification.',
        candidates: ['shirt', 'trouser', 'jeans', 'jacket', 'dress', 'skirt', 'polo', 't_shirt'],
        requiredFields: ['identity.garmentType'],
        errors: validation.errors,
      };
    }

    return {
      status: 'validation_error',
      reason: 'Specification contains structural contradictions or invalid configurations.',
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const gType = (specification.identity?.garmentType || specification.garmentType || '').toLowerCase();
  const reasoning = reasonGarmentConstruction(specification);

  // 2. Deterministic routing to existing pattern engines
  switch (gType) {
    case 'shirt':
    case 'blouse':
      return {
        status: 'resolved',
        engine: ENGINE_NAMES.SHIRT,
        construction: reasoning.sleeveConstruction === 'raglan_split' ? 'raglanSleeve' : 'setInSleeve',
        dispatcherTarget: 'draftShirtPattern',
        reasoning,
        parameters: {
          sleeveType: specification.sleeve?.type || 'set-in',
          seamAllowance: reasoning.seamAllowanceDefault,
          silhouette: specification.silhouette?.primary || specification.silhouette || 'tailored_fit',
        },
      };

    case 'trouser':
      return {
        status: 'resolved',
        engine: ENGINE_NAMES.TROUSER,
        construction: reasoning.waistbandConstruction === 'split_back_curtain' ? 'tailoredTrouserCurtain' : 'standardTrouser',
        dispatcherTarget: 'draftTrouserPattern',
        reasoning,
        parameters: {
          isJeans: false,
          isShorts: false,
          seamAllowance: reasoning.seamAllowanceDefault,
          silhouette: specification.silhouette?.primary || specification.silhouette || 'classic',
        },
      };

    case 'jeans':
      return {
        status: 'resolved',
        engine: ENGINE_NAMES.TROUSER,
        construction: 'fivePocketJeans',
        dispatcherTarget: 'draftTrouserPattern',
        reasoning,
        parameters: {
          isJeans: true,
          isShorts: false,
          seamAllowance: reasoning.seamAllowanceDefault,
          silhouette: specification.silhouette?.primary || specification.silhouette || 'straight',
        },
      };

    case 'shorts':
      return {
        status: 'resolved',
        engine: ENGINE_NAMES.TROUSER,
        construction: 'tailoredShorts',
        dispatcherTarget: 'draftTrouserPattern',
        reasoning,
        parameters: {
          isShorts: true,
          isJeans: false,
          seamAllowance: reasoning.seamAllowanceDefault,
          silhouette: specification.silhouette?.primary || specification.silhouette || 'tailored_bermuda',
        },
      };

    case 'jacket':
    case 'blazer':
    case 'coat':
    case 'vest':
      return {
        status: 'resolved',
        engine: ENGINE_NAMES.JACKET,
        construction: reasoning.collarConstruction || 'tailoredJacketNotchLapel',
        dispatcherTarget: 'draftJacketPattern',
        reasoning,
        parameters: {
          seamAllowance: reasoning.seamAllowanceDefault,
          silhouette: specification.silhouette?.primary || specification.silhouette || 'single_breasted',
        },
      };

    case 'polo':
    case 't_shirt':
      return {
        status: 'resolved',
        engine: ENGINE_NAMES.KNIT,
        construction: gType === 'polo' ? 'knitPoloPlacket' : 'standardCrewNeck',
        dispatcherTarget: 'draftKnitPattern',
        reasoning,
        parameters: {
          seamAllowance: reasoning.seamAllowanceDefault, // 0.375" for knits
          silhouette: specification.silhouette?.primary || specification.silhouette || (gType === 'polo' ? 'athletic_fit' : 'standard_crew'),
        },
      };

    case 'skirt':
    case 'dress':
    case 'gown':
    case 'jumpsuit':
      return {
        status: 'resolved',
        engine: ENGINE_NAMES.SKIRT_DRESS,
        construction: gType === 'skirt' ? 'tailoredSkirtDarts' : 'fittedSheathGown',
        dispatcherTarget: 'draftSkirtDressPattern',
        reasoning,
        parameters: {
          seamAllowance: reasoning.seamAllowanceDefault,
          silhouette: specification.silhouette?.primary || specification.silhouette || (gType === 'gown' ? 'column_sheath' : 'pencil'),
        },
      };

    default:
      // Absolutely forbidden to silently fallback to trousers
      return {
        status: 'unsupported',
        reason: `Garment type "${gType}" has no registered pattern block engine.`,
        candidates: ['shirt', 'trouser', 'jeans', 'jacket', 'dress', 'skirt', 'polo', 't_shirt'],
        requiredFields: ['identity.garmentType'],
      };
  }
}
