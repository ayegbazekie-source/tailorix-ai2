/**
 * TAILORIX AI — CANONICAL GARMENT SPECIFICATION MODEL
 * 
 * Central contract between Deconstruct Intelligence and Pattern Engines.
 * Represents normalized garment identity, silhouette, fit, anatomy, construction components,
 * confidence/uncertainty tracking, and structural vs sculptural separation.
 */

import { getGarmentType, GARMENT_TYPES } from './garmentTaxonomy';

export const SPEC_VERSION = '1.0.0';

export const CONFIDENCE_STATES = {
  CONFIRMED: 'confirmed',
  INFERRED: 'inferred',
  ESTIMATED: 'estimated',
  UNCERTAIN: 'uncertain',
  UNKNOWN: 'unknown',
};

export const SPEC_STATUS = {
  DRAFT: 'draft',
  NEEDS_REVIEW: 'needs_review',
  APPROVED: 'approved',
  GENERATING: 'generating',
  GENERATED: 'generated',
  ERROR: 'error',
};

/**
 * Creates a normalized value with explicit confidence and state tracking.
 */
export function createConfidenceValue(value = null, confidence = 1.0, state = CONFIDENCE_STATES.CONFIRMED, source = 'manual') {
  return {
    value,
    confidence: typeof confidence === 'number' ? confidence : 0.0,
    state,
    source,
  };
}

/**
 * Component factory functions providing strongly typed structures for pattern construction.
 */
export function createSleeveComponent(options = {}) {
  return {
    id: options.id || `sleeve_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'set-in', // 'set-in' | 'raglan' | 'kimono' | 'drop-shoulder' | 'sleeveless' | 'two-piece' | 'cap'
    length: options.length || 'full', // 'sleeveless' | 'cap' | 'short' | 'three-quarter' | 'full'
    opening: options.opening || 'standard',
    cuff: options.cuff || null,
    cuffType: options.cuffType || 'none', // 'barrel' | 'french' | 'rib' | 'band' | 'none'
    construction: options.construction || 'one-piece', // 'one-piece' | 'two-piece' | 'raglan_split' | 'gusseted'
    confidence: options.confidence || createConfidenceValue(options.type || 'set-in', 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

export function createCollarComponent(options = {}) {
  return {
    id: options.id || `collar_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'none', // 'spread' | 'notch_lapel' | 'peak_lapel' | 'shawl' | 'band' | 'mandarin' | 'flat_knit' | 'none'
    stand: options.stand ?? 1.25, // inches
    fall: options.fall ?? 1.75,   // inches
    shape: options.shape || 'standard',
    isRemovable: options.isRemovable || false,
    confidence: options.confidence || createConfidenceValue(options.type || 'none', 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

export function createNecklineComponent(options = {}) {
  if (options === null || options.type === null || options.type === 'none') {
    return null;
  }
  const type = options.type !== undefined ? options.type : 'crew';
  return {
    type,
    depth: options.depth ?? 3.0, // inches below hollow of neck
    width: options.width ?? 6.0, // inches across shoulder point to point
    shape: options.shape || 'curved',
    confidence: options.confidence || createConfidenceValue(type, 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

export function createCuffComponent(options = {}) {
  return {
    id: options.id || `cuff_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'barrel', // 'barrel' | 'french' | 'mitered' | 'rib_band' | 'turn_up' | 'elastic'
    height: options.height ?? 2.5,
    buttonCount: options.buttonCount ?? 1,
    parentPiece: options.parentPiece || 'SLEEVE',
    confidence: options.confidence || createConfidenceValue(options.type || 'barrel', 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

export function createPocketComponent(options = {}) {
  return {
    id: options.id || `pocket_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'patch', // 'patch' | 'welt' | 'slant' | 'on_seam' | 'coin' | 'flap' | 'jetted'
    placement: options.placement || 'chest_left', // 'chest_left' | 'waist_front' | 'back_hip' | 'side_seam'
    orientation: options.orientation || 'horizontal', // 'horizontal' | 'slanted' | 'vertical'
    opening: options.opening ?? 5.5, // inches width
    construction: options.construction || 'lined', // 'unlined' | 'lined' | 'bagged' | 'applied'
    dimensions: options.dimensions || { width: 5.5, height: 6.0 },
    parentPanel: options.parentPanel || 'FRONT_BODICE',
    confidence: options.confidence || createConfidenceValue(options.type || 'patch', 0.85, CONFIDENCE_STATES.INFERRED),
  };
}

export function createDartComponent(options = {}) {
  return {
    id: options.id || `dart_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'waist', // 'bust' | 'waist' | 'shoulder' | 'french' | 'elbow' | 'fish_eye'
    placement: options.placement || 'front_waist',
    parentPanel: options.parentPanel || 'FRONT_BODICE',
    intake: options.intake ?? 1.0, // inches width taken in
    length: options.length ?? 6.0,
    apexOffset: options.apexOffset ?? 1.0,
    confidence: options.confidence || createConfidenceValue(options.type || 'waist', 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

export function createPleatComponent(options = {}) {
  return {
    id: options.id || `pleat_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'knife', // 'knife' | 'box' | 'inverted' | 'accordion' | 'cartridge'
    placement: options.placement || 'front_waist',
    depth: options.depth ?? 1.0,
    direction: options.direction || 'toward_center',
    count: options.count ?? 1,
    confidence: options.confidence || createConfidenceValue(options.type || 'knife', 0.85, CONFIDENCE_STATES.INFERRED),
  };
}

export function createGatherComponent(options = {}) {
  return {
    id: options.id || `gather_${Math.random().toString(36).substring(2, 7)}`,
    location: options.location || 'waist',
    ratio: options.ratio ?? 2.0, // 2:1 gather ratio
    parentPanel: options.parentPanel || 'SKIRT',
    confidence: options.confidence || createConfidenceValue(options.location || 'waist', 0.85, CONFIDENCE_STATES.INFERRED),
  };
}

export function createYokeComponent(options = {}) {
  return {
    id: options.id || `yoke_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'shirt_back', // 'shirt_back' | 'split_back' | 'jeans_back' | 'front_western'
    depth: options.depth ?? 4.0,
    shape: options.shape || 'straight', // 'straight' | 'chevron' | 'curved'
    cutOnFold: options.cutOnFold ?? false,
    confidence: options.confidence || createConfidenceValue(options.type || 'shirt_back', 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

export function createPanelComponent(options = {}) {
  return {
    id: options.id || `panel_${Math.random().toString(36).substring(2, 7)}`,
    name: options.name || 'Body Panel',
    type: options.type || 'main', // 'main' | 'side_body' | 'princess_panel' | 'godet' | 'gusset'
    parentPiece: options.parentPiece || 'FRONT_BODICE',
    confidence: options.confidence || createConfidenceValue(options.name || 'Body Panel', 0.95, CONFIDENCE_STATES.CONFIRMED),
  };
}

export function createWaistbandComponent(options = {}) {
  return {
    id: options.id || `waistband_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'straight', // 'straight' | 'contour' | 'elastic' | 'drawstring' | 'faced' | 'curtain'
    height: options.height ?? 1.5,
    overlap: options.overlap ?? 1.5,
    interfacing: options.interfacing || 'medium_fusible',
    confidence: options.confidence || createConfidenceValue(options.type || 'straight', 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

export function createClosureComponent(options = {}) {
  return {
    id: options.id || `closure_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'buttons', // 'buttons' | 'zipper' | 'snaps' | 'hooks' | 'ties' | 'pullover'
    placement: options.placement || 'center_front', // 'center_front' | 'center_back' | 'side' | 'fly'
    count: options.count ?? 7,
    length: options.length ?? null,
    confidence: options.confidence || createConfidenceValue(options.type || 'buttons', 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

export function createHemComponent(options = {}) {
  return {
    id: options.id || `hem_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'topstitched', // 'blind' | 'topstitched' | 'rolled' | 'faced' | 'banded' | 'raw'
    depth: options.depth ?? 1.0, // inches
    stitchType: options.stitchType || 'single_needle',
    confidence: options.confidence || createConfidenceValue(options.type || 'topstitched', 0.85, CONFIDENCE_STATES.INFERRED),
  };
}

export function createSeamComponent(options = {}) {
  return {
    id: options.id || `seam_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type || 'plain', // 'plain' | 'french' | 'flat_felled' | 'overlocked' | 'bound' | 'princess'
    location: options.location || 'side', // 'side' | 'shoulder' | 'armhole' | 'inseam' | 'outseam' | 'center_back'
    connects: options.connects || [], // ['FRONT_BODICE', 'BACK_BODICE']
    affectsPattern: options.affectsPattern ?? true,
    allowance: options.allowance ?? 0.5,
    confidence: options.confidence || createConfidenceValue(options.type || 'plain', 0.9, CONFIDENCE_STATES.INFERRED),
  };
}

/**
 * Creates the canonical, strongly structured GarmentSpecification object.
 * Unknown information remains explicitly unknown/null rather than being guessed.
 */
export function createGarmentSpecification(initial = {}) {
  const rawType = initial.garmentType || initial.identity?.garmentType || initial.category;
  const isExplicitlyUnknown = rawType === 'unknown' || rawType === null || rawType === undefined;

  let gType = null;
  if (!isExplicitlyUnknown) {
    gType = getGarmentType(rawType);
  }

  const specId = initial.id || `spec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const garmentTypeId = gType ? gType.id : 'unknown';
  const garmentFamily = gType ? gType.family : 'unknown';

  const defaultSilhouette = gType ? gType.defaultSilhouette : 'classic';

  const isBottom = garmentFamily === 'bottoms';

  return {
    version: SPEC_VERSION,
    id: specId,

    // 1. Identity
    identity: {
      garmentType: garmentTypeId,
      garmentSubtype: initial.identity?.garmentSubtype || initial.garmentSubtype || null,
      category: garmentFamily,
      genderTarget: initial.identity?.genderTarget || initial.genderTarget || 'unisex',
      constructionType: initial.identity?.constructionType || initial.constructionType || 'tailored_woven',
    },

    // 2. Silhouette
    silhouette: {
      primary: initial.silhouette?.primary || initial.silhouette || defaultSilhouette,
      secondary: initial.silhouette?.secondary || null,
      length: initial.silhouette?.length || 'standard',
      hemShape: initial.silhouette?.hemShape || 'straight',
      volume: initial.silhouette?.volume || 'moderate',
    },

    // 3. Fit & Ease
    fit: {
      fitType: initial.fit?.fitType || 'regular', // 'fitted' | 'semi-fitted' | 'regular' | 'relaxed' | 'oversized'
      ease: initial.fit?.ease ?? 4.0, // inches total ease
      easeValues: initial.fit?.easeValues || {
        chest: 4.0,
        waist: 2.0,
        hip: 3.0,
        bicep: 2.5,
      },
    },

    // 4. Neckline
    neckline: initial.neckline !== undefined
      ? (initial.neckline && typeof initial.neckline === 'object'
          ? createNecklineComponent(initial.neckline)
          : (initial.neckline ? createNecklineComponent({ type: initial.neckline }) : null))
      : (isBottom ? null : createNecklineComponent({ type: 'crew' })),

    // 5. Collar
    collar: initial.collar !== undefined
      ? (initial.collar && typeof initial.collar === 'object'
          ? createCollarComponent(initial.collar)
          : (initial.collar ? createCollarComponent({ type: initial.collar }) : null))
      : (isBottom ? null : createCollarComponent({ type: garmentTypeId === 'shirt' ? 'spread' : 'none' })),

    // 6. Sleeve
    sleeve: initial.sleeve !== undefined
      ? (initial.sleeve && typeof initial.sleeve === 'object'
          ? createSleeveComponent(initial.sleeve)
          : (initial.sleeve ? createSleeveComponent({ type: initial.sleeve }) : null))
      : (isBottom ? null : createSleeveComponent({
          type: garmentFamily === 'tops' || garmentFamily === 'outerwear' ? 'set-in' : 'sleeveless',
          length: 'full',
        })),

    // 7. Body Construction
    body: {
      frontConstruction: initial.body?.frontConstruction || 'two_piece_darted',
      backConstruction: initial.body?.backConstruction || 'two_piece_yoke',
      sideConstruction: initial.body?.sideConstruction || 'side_seamed',
    },

    // 8. Collections of Structural Components
    seams: Array.isArray(initial.seams) ? initial.seams : [],
    darts: Array.isArray(initial.darts) ? initial.darts : [],
    panels: Array.isArray(initial.panels)
      ? initial.panels
      : (gType?.supportedPieces || []).map((pId) => createPanelComponent({ id: pId, name: pId.replace(/_/g, ' ') })),
    yokes: Array.isArray(initial.yokes)
      ? initial.yokes
      : (garmentTypeId === 'shirt' ? [createYokeComponent({ type: 'shirt_back' })] : garmentTypeId === 'jeans' ? [createYokeComponent({ type: 'jeans_back' })] : []),
    pleats: Array.isArray(initial.pleats) ? initial.pleats : [],
    gathers: Array.isArray(initial.gathers) ? initial.gathers : [],
    pockets: Array.isArray(initial.pockets)
      ? initial.pockets.map((p) => typeof p === 'string' ? createPocketComponent({ type: p }) : createPocketComponent(p))
      : (garmentTypeId === 'trouser' ? [createPocketComponent({ type: 'slant', placement: 'front' })] : []),
    closures: Array.isArray(initial.closures)
      ? initial.closures.map((c) => typeof c === 'string' ? createClosureComponent({ type: c }) : createClosureComponent(c))
      : [createClosureComponent({ type: garmentFamily === 'bottoms' ? 'zipper' : 'buttons' })],
    waistband: initial.waistband
      ? (typeof initial.waistband === 'object' ? createWaistbandComponent(initial.waistband) : createWaistbandComponent({ type: initial.waistband }))
      : (garmentFamily === 'bottoms' ? createWaistbandComponent({ type: 'straight' }) : null),
    cuffs: Array.isArray(initial.cuffs)
      ? initial.cuffs
      : (garmentTypeId === 'shirt' ? [createCuffComponent({ type: 'barrel' })] : []),
    hems: Array.isArray(initial.hems)
      ? initial.hems
      : [createHemComponent({ type: garmentFamily === 'bottoms' ? 'blind' : 'topstitched' })],

    // 9. Material / Fabric Properties
    material: {
      category: initial.material?.category || 'woven', // 'woven' | 'knit' | 'leather' | 'specialty'
      substrate: initial.material?.substrate || 'cotton_twill',
      stretch: initial.material?.stretch || 'none', // 'none' | 'comfort_stretch' | 'high_stretch'
      stretchPercent: initial.material?.stretchPercent ?? 0,
      weight: initial.material?.weight || 'medium', // 'light' | 'medium' | 'heavy'
      drape: initial.material?.drape || 'moderate', // 'fluid' | 'moderate' | 'crisp' | 'rigid'
      rigidity: initial.material?.rigidity ?? 0.3,
    },

    // 10. Construction & Manufacturing Details
    constructionDetails: {
      topstitching: initial.constructionDetails?.topstitching || 'single_needle_edge',
      seamTypes: initial.constructionDetails?.seamTypes || ['plain_serged'],
      reinforcement: initial.constructionDetails?.reinforcement || ['pocket_bartacks'],
      interfacing: initial.constructionDetails?.interfacing || 'medium_fusible_weft',
      lining: initial.constructionDetails?.lining || (garmentFamily === 'outerwear' ? 'full_lining' : 'unlined'),
      hardware: initial.constructionDetails?.hardware || [],
    },

    // 11. Measurements & Anchors
    measurements: initial.measurements || {},
    grading: initial.grading || { baseSize: 'M', sizes: ['S', 'M', 'L', 'XL'] },
    crotch: initial.crotch || null,

    // 12. Separation: Structural Base vs Sculptural Components
    structuralBase: initial.structuralBase || {
      foundationType: garmentTypeId,
      blocks: [],
      easeTarget: 'functional',
    },
    sculpturalComponents: Array.isArray(initial.sculpturalComponents) ? initial.sculpturalComponents : [],

    // 13. Confidence, Uncertainties & Assumptions
    confidence: typeof initial.confidence === 'object' && initial.confidence !== null
      ? initial.confidence
      : {
          overall: typeof initial.confidence === 'number' ? initial.confidence : (isExplicitlyUnknown ? 0.2 : 0.95),
          identity: isExplicitlyUnknown ? 0.2 : 0.95,
          silhouette: 0.9,
          components: 0.85,
        },
    uncertainties: Array.isArray(initial.uncertainties) ? initial.uncertainties : [],
    assumptions: Array.isArray(initial.assumptions) ? initial.assumptions : [],

    // 14. Origin & Metadata
    source: {
      type: initial.source?.type || initial.source || 'user_init',
      references: initial.source?.references || (initial.referenceImage ? [initial.referenceImage] : []),
    },

    // 15. Lifecycle & Approval Gate State
    status: initial.status || (isExplicitlyUnknown ? SPEC_STATUS.NEEDS_REVIEW : SPEC_STATUS.DRAFT),
    userCorrections: initial.userCorrections || {},

    // Backward-compatibility properties for existing components
    name: initial.name || (gType ? gType.name : 'Unknown Garment Project'),
    garmentType: garmentTypeId,
    garmentFamily,
    referenceImage: initial.referenceImage || null,
    detectedFeatures: initial.detectedFeatures || [],
    suggestedMeasurements: initial.suggestedMeasurements || {},
  };
}
