/**
 * TAILORIX AI — LEVEL 1: GARMENT SPECIFICATION VALIDATOR
 * 
 * Inspects a GarmentSpecification BEFORE pattern geometry computation.
 * Enforces structural compatibility, detects conflicting components, impossible combinations,
 * and unsupported configurations.
 * 
 * Never silently repairs contradictory specifications; returns structured, actionable errors.
 */

import { GARMENT_TYPES } from '../../models/garmentTaxonomy';

export function validateGarmentSpecification(spec) {
  if (!spec || typeof spec !== 'object') {
    return {
      valid: false,
      errors: [
        {
          path: 'root',
          code: 'SPEC_NULL_OR_INVALID',
          message: 'Garment specification is null, undefined, or not an object.',
        },
      ],
      warnings: [],
    };
  }

  const errors = [];
  const warnings = [];

  const gType = spec.identity?.garmentType || spec.garmentType;
  const gFamily = spec.identity?.category || spec.garmentFamily;

  // 1. Identity & Garment Type Support
  if (!gType || gType === 'unknown') {
    errors.push({
      path: 'identity.garmentType',
      code: 'UNKNOWN_GARMENT_TYPE',
      message: 'Garment type could not be resolved or is explicitly unknown.',
      candidates: ['shirt', 'trouser', 'jeans', 'jacket', 'dress', 'skirt', 'polo', 't_shirt'],
    });
  } else {
    const isSupported = Object.values(GARMENT_TYPES).some((t) => t.id === gType);
    if (!isSupported) {
      errors.push({
        path: 'identity.garmentType',
        code: 'UNSUPPORTED_GARMENT_TYPE',
        message: `Garment type "${gType}" is not supported by available pattern engines.`,
      });
    }
  }

  // 2. Anatomy & Family Compatibility (Contradiction Checks)
  const isBottom = gFamily === 'bottoms' || ['trouser', 'jeans', 'shorts', 'skirt'].includes(gType);
  const isTop = gFamily === 'tops' || ['shirt', 'blouse', 'polo', 't_shirt'].includes(gType);
  const isOuterwear = gFamily === 'outerwear' || ['jacket', 'blazer', 'coat', 'vest'].includes(gType);
  const isDress = gFamily === 'dresses_skirts' || ['dress', 'gown', 'skirt'].includes(gType);

  // Bottoms cannot possess necklines, collars, or upper sleeves
  if (isBottom && gType !== 'skirt') {
    if (spec.neckline && spec.neckline.type && spec.neckline.type !== 'none') {
      errors.push({
        path: 'neckline.type',
        code: 'INVALID_COMPONENT_FOR_GARMENT',
        message: `Neckline configuration ("${spec.neckline.type}") is not valid for bottom garments (${gType}).`,
      });
    }

    if (spec.collar && spec.collar.type && spec.collar.type !== 'none') {
      errors.push({
        path: 'collar.type',
        code: 'INVALID_COMPONENT_FOR_GARMENT',
        message: `Collar configuration ("${spec.collar.type}") is not valid for bottom garments (${gType}).`,
      });
    }

    if (spec.sleeve && spec.sleeve.type && spec.sleeve.type !== 'none' && spec.sleeve.type !== 'sleeveless') {
      errors.push({
        path: 'sleeve.type',
        code: 'INVALID_COMPONENT_FOR_GARMENT',
        message: `Sleeves ("${spec.sleeve.type}") cannot be attached directly to a trouser or shorts block.`,
      });
    }
  }

  // Tops require neckline or collar
  if (isTop || isOuterwear) {
    const hasCollar = spec.collar && spec.collar.type && spec.collar.type !== 'none';
    const hasNeckline = spec.neckline && spec.neckline.type && spec.neckline.type !== 'none';
    if (!hasCollar && !hasNeckline) {
      warnings.push({
        path: 'neckline',
        code: 'MISSING_NECK_FINISH',
        message: `Upper garment "${gType}" has neither a collar nor a defined neckline shape. Defaulting to standard crew curve.`,
      });
    }
  }

  // 3. Sleeve & Armhole Compatibility
  if (spec.sleeve) {
    const sType = spec.sleeve.type;
    const sConst = spec.sleeve.construction;

    if (sType === 'raglan' && isOuterwear && gType === 'jacket') {
      warnings.push({
        path: 'sleeve.type',
        code: 'NON_STANDARD_CONSTRUCTION',
        message: 'Raglan sleeve on structured tailored jacket requires split shoulder darting or gusseted armhole.',
      });
    }

    if (sType === 'two-piece' && (gType === 't_shirt' || gType === 'polo')) {
      warnings.push({
        path: 'sleeve.type',
        code: 'OVERCOMPLEX_SLEEVE_FOR_KNIT',
        message: 'Two-piece tailored sleeve is uncharacteristic for jersey knits; standard one-piece set-in is recommended.',
      });
    }

    // Impossible combination: sleeveless with cuffs
    const isSleeveless = sType === 'sleeveless' || spec.sleeve.length === 'sleeveless' || sType === 'none';
    const hasCuffs = (Array.isArray(spec.cuffs) && spec.cuffs.length > 0) || (spec.sleeve.cuffType && spec.sleeve.cuffType !== 'none');
    if (isSleeveless && hasCuffs) {
      errors.push({
        path: 'cuffs',
        code: 'IMPOSSIBLE_SLEEVE_CUFF_COMBINATION',
        message: 'Sleeveless garment configuration cannot contain sleeve cuffs or cuff extensions.',
      });
    }
  } else if (Array.isArray(spec.cuffs) && spec.cuffs.length > 0) {
    errors.push({
      path: 'cuffs',
      code: 'IMPOSSIBLE_SLEEVE_CUFF_COMBINATION',
      message: 'Garment has no sleeve definition but defines cuffs.',
    });
  }

  // Contradictory input: crotch definition on tops / upper garments
  if (spec.crotch && (isTop || isOuterwear || gType === 'shirt' || gType === 'jacket' || gType === 'polo' || gType === 't_shirt')) {
    errors.push({
      path: 'crotch',
      code: 'CONTRADICTORY_MEASUREMENT_ANCHOR',
      message: `Crotch depth and dimensions cannot be defined on upper-body garments (${gType}).`,
    });
  }

  // 4. Pocket Placement Compatibility
  if (Array.isArray(spec.pockets)) {
    spec.pockets.forEach((p, idx) => {
      if (isBottom && p.placement && (p.placement.includes('chest') || p.placement.includes('breast'))) {
        errors.push({
          path: `pockets[${idx}].placement`,
          code: 'INVALID_POCKET_PLACEMENT',
          message: `Pocket #${idx + 1} (${p.type}) is placed at "${p.placement}", which does not exist on bottom garments.`,
        });
      }
    });
  }

  // 5. Waistband Compatibility
  if (spec.waistband && (isTop || isOuterwear) && gType !== 'jacket') {
    if (spec.waistband.type && spec.waistband.type !== 'none') {
      warnings.push({
        path: 'waistband.type',
        code: 'UNUSUAL_WAISTBAND_FOR_TOP',
        message: `Waistband defined on upper garment "${gType}"; verify if blouson elastic hem or peplum is intended.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      status: errors.length === 0 ? 'VALID_FOR_CONSTRUCTION' : 'VALIDATION_FAILED',
    },
  };
}
