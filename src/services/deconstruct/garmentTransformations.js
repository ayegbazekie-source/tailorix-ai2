/**
 * TAILORIX AI — DESIGN TRANSFORMATIONS ENGINE
 * 
 * Applies design modifications to a GarmentSpecification, validates the resulting
 * state, and re-resolves the construction instructions.
 * 
 * NEVER patches SVG geometry directly. The specification remains the single source of truth.
 */

import { validateGarmentSpecification } from './garmentValidation';
import { resolvePatternEngine } from './constructionResolver';
import {
  createSleeveComponent,
  createPocketComponent,
  createWaistbandComponent,
  createYokeComponent,
  createDartComponent,
  createPanelComponent,
  createConfidenceValue,
  CONFIDENCE_STATES,
} from '../../models/garmentSpecification';

/**
 * Applies a structured design transformation to a specification.
 * 
 * @param {Object} spec - Canonical GarmentSpecification
 * @param {Object} transformation - { type, value, payload }
 * @returns {Object} { success, spec, resolution, validation, error }
 */
export function applyGarmentTransformation(spec, transformation = {}) {
  if (!spec || typeof spec !== 'object') {
    return { success: false, error: 'Invalid specification supplied.' };
  }

  const { type, value, payload = {} } = transformation;

  // Deep clone specification to ensure immutability during transformation
  const updatedSpec = JSON.parse(JSON.stringify(spec));

  switch (type) {
    // 1. Sleeve transformations
    case 'CONVERT_SLEEVE_TO_RAGLAN':
    case 'SET_SLEEVE_TYPE': {
      const targetType = type === 'CONVERT_SLEEVE_TO_RAGLAN' ? 'raglan' : (value || 'set-in');
      updatedSpec.sleeve = createSleeveComponent({
        ...(updatedSpec.sleeve || {}),
        type: targetType,
        construction: targetType === 'raglan' ? 'raglan_split' : 'one-piece',
        confidence: createConfidenceValue(targetType, 1.0, CONFIDENCE_STATES.CONFIRMED, 'user_transformation'),
      });
      break;
    }

    case 'SHORTEN_SLEEVE': {
      const currentLength = updatedSpec.sleeve?.length || 'full';
      const newLength = currentLength === 'full' ? 'three-quarter' : 'short';
      if (updatedSpec.sleeve) {
        updatedSpec.sleeve.length = newLength;
      }
      break;
    }

    // 2. Fit and Ease transformations
    case 'ADD_EASE':
    case 'ADJUST_EASE': {
      const delta = typeof value === 'number' ? value : 2.0; // default 2 inches
      updatedSpec.fit = updatedSpec.fit || { fitType: 'regular', ease: 4.0, easeValues: {} };
      updatedSpec.fit.ease = (updatedSpec.fit.ease || 4.0) + delta;
      if (updatedSpec.fit.easeValues) {
        for (const k of Object.keys(updatedSpec.fit.easeValues)) {
          updatedSpec.fit.easeValues[k] += delta;
        }
      }
      break;
    }

    case 'CONVERT_SILHOUETTE_FITTED_TO_RELAXED': {
      updatedSpec.silhouette = updatedSpec.silhouette || {};
      updatedSpec.silhouette.primary = 'relaxed';
      updatedSpec.fit = updatedSpec.fit || {};
      updatedSpec.fit.fitType = 'relaxed';
      updatedSpec.fit.ease = 6.0;
      break;
    }

    case 'CONVERT_SILHOUETTE_RELAXED_TO_FITTED': {
      updatedSpec.silhouette = updatedSpec.silhouette || {};
      updatedSpec.silhouette.primary = 'fitted';
      updatedSpec.fit = updatedSpec.fit || {};
      updatedSpec.fit.fitType = 'fitted';
      updatedSpec.fit.ease = 2.0;
      break;
    }

    // 3. Darts & Seams
    case 'REMOVE_WAIST_DART': {
      updatedSpec.darts = (updatedSpec.darts || []).filter((d) => d.type !== 'waist');
      break;
    }

    case 'ADD_DART': {
      const dartType = value || 'waist';
      updatedSpec.darts = updatedSpec.darts || [];
      updatedSpec.darts.push(createDartComponent({ type: dartType }));
      break;
    }

    case 'CONVERT_DART_TO_PRINCESS_SEAM': {
      // Darts are absorbed into vertical princess panel seams
      updatedSpec.darts = (updatedSpec.darts || []).filter((d) => d.type !== 'waist' && d.type !== 'bust');
      updatedSpec.panels = updatedSpec.panels || [];
      updatedSpec.panels.push(createPanelComponent({ id: 'SIDE_FRONT_PRINCESS', name: 'Side Front Princess Panel' }));
      updatedSpec.panels.push(createPanelComponent({ id: 'SIDE_BACK_PRINCESS', name: 'Side Back Princess Panel' }));
      break;
    }

    // 4. Pockets
    case 'ADD_POCKET': {
      const pocketType = value || 'slant';
      const placement = payload.placement || 'front_waist';
      updatedSpec.pockets = updatedSpec.pockets || [];
      updatedSpec.pockets.push(createPocketComponent({ type: pocketType, placement }));
      break;
    }

    case 'REMOVE_POCKET': {
      const pocketId = payload.pocketId;
      if (pocketId && Array.isArray(updatedSpec.pockets)) {
        updatedSpec.pockets = updatedSpec.pockets.filter((p) => p.id !== pocketId);
      }
      break;
    }

    // 5. Neckline & Collar
    case 'CHANGE_NECKLINE': {
      const necklineType = value || 'v-neck';
      updatedSpec.neckline = {
        ...(updatedSpec.neckline || {}),
        type: necklineType,
        confidence: createConfidenceValue(necklineType, 1.0, CONFIDENCE_STATES.CONFIRMED, 'user_transformation'),
      };
      break;
    }

    // 6. Waistband
    case 'ADD_WAISTBAND': {
      const wbType = value || 'contour';
      updatedSpec.waistband = createWaistbandComponent({ type: wbType });
      break;
    }

    case 'REMOVE_WAISTBAND': {
      updatedSpec.waistband = null;
      break;
    }

    // 7. Yokes & Panels
    case 'ADD_YOKE': {
      const yokeType = value || 'shirt_back';
      updatedSpec.yokes = updatedSpec.yokes || [];
      updatedSpec.yokes.push(createYokeComponent({ type: yokeType }));
      break;
    }

    case 'ADD_PANEL': {
      const panelName = value || 'Accent Contrast Panel';
      updatedSpec.panels = updatedSpec.panels || [];
      updatedSpec.panels.push(createPanelComponent({ name: panelName }));
      break;
    }

    // 8. Length & Hem
    case 'INCREASE_GARMENT_LENGTH': {
      const deltaLength = typeof value === 'number' ? value : 2.0;
      if (updatedSpec.suggestedMeasurements) {
        if (updatedSpec.suggestedMeasurements.shirtLength) updatedSpec.suggestedMeasurements.shirtLength += deltaLength;
        if (updatedSpec.suggestedMeasurements.jacketLength) updatedSpec.suggestedMeasurements.jacketLength += deltaLength;
        if (updatedSpec.suggestedMeasurements.skirtLength) updatedSpec.suggestedMeasurements.skirtLength += deltaLength;
        if (updatedSpec.suggestedMeasurements.inseam) updatedSpec.suggestedMeasurements.inseam += deltaLength;
      }
      break;
    }

    case 'CHANGE_HEM_SHAPE': {
      updatedSpec.silhouette = updatedSpec.silhouette || {};
      updatedSpec.silhouette.hemShape = value || 'curved_shirt_tail';
      break;
    }

    default:
      console.warn(`[TAILORIX TRANSFORMATIONS] Unknown transformation type: ${type}`);
      break;
  }

  // Record transformation history
  updatedSpec.assumptions = updatedSpec.assumptions || [];
  updatedSpec.assumptions.push(`Applied transformation "${type}" at ${new Date().toISOString()}`);

  // Validate the resulting specification
  const validation = validateGarmentSpecification(updatedSpec);

  // Re-resolve construction
  const resolution = resolvePatternEngine(updatedSpec);

  return {
    success: validation.valid && resolution.status === 'resolved',
    spec: updatedSpec,
    validation,
    resolution,
    error: !validation.valid ? validation.errors[0]?.message : (resolution.status !== 'resolved' ? resolution.reason : null),
  };
}
