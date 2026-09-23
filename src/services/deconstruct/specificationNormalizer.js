/**
 * TAILORIX AI — SPECIFICATION NORMALIZER
 * 
 * Ingests raw AI vision outputs, benchmark blueprints, legacy specifications,
 * and user mapping inputs, producing a normalized, canonical GarmentSpecification.
 * Preserves uncertainties and avoids false certainty.
 */

import {
  createGarmentSpecification,
  createConfidenceValue,
  CONFIDENCE_STATES,
  SPEC_STATUS,
  createSleeveComponent,
  createCollarComponent,
  createNecklineComponent,
  createPocketComponent,
  createWaistbandComponent,
  createClosureComponent,
} from '../../models/garmentSpecification';
import { getGarmentType } from '../../models/garmentTaxonomy';

export function normalizeSpecification(rawInput = {}) {
  if (!rawInput || typeof rawInput !== 'object') {
    return createGarmentSpecification({
      garmentType: 'unknown',
      confidence: 0.0,
      status: SPEC_STATUS.NEEDS_REVIEW,
      uncertainties: [{ field: 'identity.garmentType', state: CONFIDENCE_STATES.UNKNOWN, reason: 'Empty or invalid input' }],
    });
  }

  // 1. Identify garment type
  const rawType = (
    rawInput.garmentType ||
    rawInput.identity?.garmentType ||
    rawInput.detectedType ||
    rawInput.category ||
    rawInput.type ||
    ''
  ).trim().toLowerCase();

  const isUnknown = !rawType || rawType === 'unknown' || rawType === 'undefined';
  const gType = isUnknown ? null : getGarmentType(rawType);
  const resolvedGarmentType = gType ? gType.id : (isUnknown ? 'unknown' : rawType);
  const resolvedFamily = gType ? gType.family : 'unknown';

  // 2. Track uncertainties explicitly
  const uncertainties = Array.isArray(rawInput.uncertainties) ? [...rawInput.uncertainties] : [];

  if (isUnknown) {
    uncertainties.push({
      field: 'identity.garmentType',
      state: CONFIDENCE_STATES.UNKNOWN,
      confidence: 0.0,
      reason: 'Garment type could not be resolved from reference or input.',
      candidates: ['shirt', 'trouser', 'jeans', 'jacket', 'dress', 'skirt', 'polo', 't_shirt'],
    });
  }

  // 3. Normalize sleeve
  let sleeveObj = null;
  const rawSleeve = rawInput.sleeve || rawInput.sleeves;
  if (typeof rawSleeve === 'string') {
    const sLower = rawSleeve.toLowerCase();
    let sType = 'set-in';
    let sLength = 'full';
    let sConstruction = 'one-piece';

    if (sLower.includes('raglan')) {
      sType = 'raglan';
      sConstruction = 'raglan_split';
    } else if (sLower.includes('kimono')) {
      sType = 'kimono';
    } else if (sLower.includes('two-piece') || sLower.includes('two_piece') || sLower.includes('tailored')) {
      sType = 'two-piece';
      sConstruction = 'two-piece';
    } else if (sLower.includes('sleeveless') || sLower.includes('none')) {
      sType = 'sleeveless';
      sLength = 'sleeveless';
    }

    if (sLower.includes('short')) sLength = 'short';
    else if (sLower.includes('three-quarter') || sLower.includes('3/4')) sLength = 'three-quarter';

    sleeveObj = createSleeveComponent({
      type: sType,
      length: sLength,
      construction: sConstruction,
      confidence: createConfidenceValue(sType, rawInput.confidence || 0.88, CONFIDENCE_STATES.INFERRED, 'vision'),
    });
  } else if (rawSleeve && typeof rawSleeve === 'object') {
    sleeveObj = createSleeveComponent(rawSleeve);
  }

  // 4. Normalize collar
  let collarObj = null;
  const rawCollar = rawInput.collar;
  if (typeof rawCollar === 'string') {
    const cLower = rawCollar.toLowerCase();
    let cType = 'none';
    if (cLower.includes('notch') || cLower.includes('lapel')) cType = 'notch_lapel';
    else if (cLower.includes('peak')) cType = 'peak_lapel';
    else if (cLower.includes('spread') || cLower.includes('shirt')) cType = 'spread';
    else if (cLower.includes('mandarin') || cLower.includes('band')) cType = 'band';
    else if (cLower.includes('rib') || cLower.includes('polo')) cType = 'flat_knit';

    collarObj = createCollarComponent({
      type: cType,
      confidence: createConfidenceValue(cType, 0.88, CONFIDENCE_STATES.INFERRED),
    });
  } else if (rawCollar && typeof rawCollar === 'object') {
    collarObj = createCollarComponent(rawCollar);
  }

  // 5. Normalize neckline
  let necklineObj = null;
  const rawNeck = rawInput.neckline;
  if (typeof rawNeck === 'string') {
    const nLower = rawNeck.toLowerCase();
    let nType = 'crew';
    if (nLower.includes('v-neck') || nLower.includes('v neck')) nType = 'v-neck';
    else if (nLower.includes('boat') || nLower.includes('bateau')) nType = 'boat';
    else if (nLower.includes('sweetheart')) nType = 'sweetheart';
    else if (nLower.includes('scoop')) nType = 'scoop';
    else if (nLower.includes('square')) nType = 'square';
    else if (nLower.includes('none') || resolvedFamily === 'bottoms') nType = null;

    necklineObj = createNecklineComponent({
      type: nType,
      confidence: createConfidenceValue(nType, 0.88, CONFIDENCE_STATES.INFERRED),
    });
  } else if (rawNeck && typeof rawNeck === 'object') {
    necklineObj = createNecklineComponent(rawNeck);
  }

  // 6. Normalize pockets
  const pockets = [];
  const rawPockets = rawInput.pockets || rawInput.specs?.pockets;
  if (Array.isArray(rawPockets)) {
    rawPockets.forEach((p) => {
      if (typeof p === 'string') {
        const pLower = p.toLowerCase();
        let pType = 'patch';
        let placement = 'front';
        if (pLower.includes('slant')) { pType = 'slant'; placement = 'front_waist'; }
        else if (pLower.includes('welt') || pLower.includes('jetted')) { pType = 'welt'; placement = 'back_hip'; }
        else if (pLower.includes('coin')) { pType = 'coin'; placement = 'front_pocket'; }
        pockets.push(createPocketComponent({ type: pType, placement }));
      } else if (p && typeof p === 'object') {
        pockets.push(createPocketComponent(p));
      }
    });
  }

  // 7. Normalize waistband
  let waistbandObj = null;
  const rawWaistband = rawInput.waistband || rawInput.specs?.waistband;
  if (typeof rawWaistband === 'string') {
    const wLower = rawWaistband.toLowerCase();
    let wType = 'straight';
    if (wLower.includes('contour')) wType = 'contour';
    else if (wLower.includes('elastic')) wType = 'elastic';
    else if (wLower.includes('curtain')) wType = 'curtain';
    waistbandObj = createWaistbandComponent({ type: wType });
  } else if (rawWaistband && typeof rawWaistband === 'object') {
    waistbandObj = createWaistbandComponent(rawWaistband);
  }

  // 8. Separate Structural Base vs Sculptural Components
  const sculpturalComponents = Array.isArray(rawInput.sculpturalComponents) ? [...rawInput.sculpturalComponents] : [];
  if (Array.isArray(rawInput.detectedFeatures)) {
    rawInput.detectedFeatures.forEach((feat) => {
      if (typeof feat === 'string') {
        const fLower = feat.toLowerCase();
        if (fLower.includes('exaggerated') || fLower.includes('oversized pleat') || fLower.includes('sculptural') || fLower.includes('architectural panel')) {
          sculpturalComponents.push({
            id: `sculpt_${Math.random().toString(36).substring(2, 7)}`,
            name: feat,
            type: 'volumetric_extension',
            confidence: createConfidenceValue(feat, 0.8, CONFIDENCE_STATES.INFERRED),
          });
        }
      }
    });
  }

  // 9. Build canonical specification
  const canonical = createGarmentSpecification({
    id: rawInput.id,
    name: rawInput.name || (gType ? gType.name : 'Unknown Garment Project'),
    garmentType: resolvedGarmentType,
    garmentFamily: resolvedFamily,
    silhouette: rawInput.silhouette?.primary || rawInput.silhouette || (gType ? gType.defaultSilhouette : 'classic'),
    fit: rawInput.fit || { fitType: 'regular', ease: 4.0 },
    neckline: necklineObj,
    collar: collarObj,
    sleeve: sleeveObj,
    pockets: pockets.length > 0 ? pockets : undefined,
    waistband: waistbandObj,
    sculpturalComponents,
    uncertainties,
    measurements: rawInput.measurements || rawInput.suggestedMeasurements || {},
    confidence: typeof rawInput.confidence === 'number'
      ? { overall: rawInput.confidence, identity: isUnknown ? 0.2 : rawInput.confidence }
      : (rawInput.confidence || { overall: isUnknown ? 0.2 : 0.94 }),
    source: rawInput.source || 'normalization_pipeline',
    referenceImage: rawInput.referenceImage || rawInput.image || null,
    status: isUnknown ? SPEC_STATUS.NEEDS_REVIEW : (rawInput.status || SPEC_STATUS.DRAFT),
    userCorrections: rawInput.userCorrections || {},
  });

  return canonical;
}
