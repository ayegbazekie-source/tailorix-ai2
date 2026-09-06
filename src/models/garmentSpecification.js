/**
 * TAILORIX AI — CENTRAL GARMENT SPECIFICATION MODEL
 * Single source of truth defining garment attributes, construction details, and detected features.
 */

import { getGarmentType, GARMENT_TYPES } from './garmentTaxonomy';

export function createGarmentSpecification(initial = {}) {
  const garmentTypeObj = getGarmentType(initial.garmentType || initial.category || 'trouser');

  return {
    id: initial.id || `spec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    garmentType: garmentTypeObj.id,
    garmentFamily: garmentTypeObj.family,
    name: initial.name || garmentTypeObj.name,
    silhouette: initial.silhouette || garmentTypeObj.defaultSilhouette,
    confidence: typeof initial.confidence === 'number' ? initial.confidence : 1.0,
    constructionType: initial.constructionType || 'tailored_woven',
    
    // Components and Features
    panels: initial.panels || garmentTypeObj.supportedPieces.map((pId) => ({
      id: pId,
      name: pId.replace(/_/g, ' '),
      quantity: pId.includes('LEG') || pId.includes('SLEEVE') ? 2 : 1,
      cutOnFold: pId.includes('YOKE') || pId.includes('COLLAR') || pId.includes('BACK'),
      grainline: 'lengthwise',
    })),
    
    closure: initial.closure || (garmentTypeObj.family === 'bottoms' ? 'front_zipper_fly' : 'front_button_placket'),
    neckline: initial.neckline || 'standard',
    collar: initial.collar || (garmentTypeObj.id === 'shirt' ? 'spread_collar' : garmentTypeObj.id === 'polo' ? 'rib_collar' : 'none'),
    sleeve: initial.sleeve || (garmentTypeObj.family === 'tops' || garmentTypeObj.family === 'outerwear' ? 'set_in_long' : 'none'),
    cuff: initial.cuff || (garmentTypeObj.id === 'shirt' ? 'barrel_2_button' : 'none'),
    pockets: initial.pockets || (garmentTypeObj.id === 'trouser' ? ['slant_front_pockets', 'welt_back_pocket'] : []),
    waistband: initial.waistband || (garmentTypeObj.family === 'bottoms' ? 'straight_curved_interlined' : 'none'),
    fly: initial.fly || (garmentTypeObj.id === 'trouser' || garmentTypeObj.id === 'jeans' ? 'standard_zip_fly' : 'none'),
    yoke: initial.yoke || (garmentTypeObj.id === 'shirt' ? 'split_yoke' : garmentTypeObj.id === 'jeans' ? 'back_v_yoke' : 'none'),
    lining: initial.lining || (garmentTypeObj.family === 'outerwear' ? 'full_lining' : 'unlined'),
    hem: initial.hem || (garmentTypeObj.family === 'bottoms' ? 'blind_stitch_1.5in' : 'twin_needle_0.75in'),

    // Reference and AI Analysis
    referenceImage: initial.referenceImage || null,
    detectedFeatures: initial.detectedFeatures || [],
    analysisMetadata: initial.analysisMetadata || {
      analyzedAt: new Date().toISOString(),
      source: initial.source || 'user_init',
      aiModel: initial.aiModel || 'rule_engine',
    },

    // Suggested measurement overrides from vision/reference
    suggestedMeasurements: initial.suggestedMeasurements || {},
  };
}

/**
 * Validates whether a specification object conforms to the required fields.
 */
export function validateGarmentSpecification(spec) {
  if (!spec || typeof spec !== 'object') {
    return { valid: false, errors: ['Specification is empty or not an object.'] };
  }

  const errors = [];
  if (!spec.garmentType) errors.push('garmentType is required.');
  if (!spec.garmentFamily) errors.push('garmentFamily is required.');
  if (!Array.isArray(spec.panels)) errors.push('panels must be an array.');

  return {
    valid: errors.length === 0,
    errors,
  };
}
