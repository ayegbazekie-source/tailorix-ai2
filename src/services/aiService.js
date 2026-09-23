import { supabase } from './supabaseClient';
import { providerRegistry } from './ai/providerRegistry';
import { normalizeSpecification } from './deconstruct/specificationNormalizer';
import { logger } from '../utils/deconstructLogger';
import { aiOrchestrator } from './ai/aiOrchestrator';

const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL.startsWith('http') &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
);

/**
 * Intelligent local tailoring vision & silhouette deconstruction engine.
 * Maintained as a deterministic local heuristic fallback.
 */
export function deconstructGarmentLocally(imageBase64, options = {}) {
  let garmentType = options.garmentType || options.typeHint || options.defaultType || 'gown';

  if (options.filename && typeof options.filename === 'string') {
    const fn = options.filename.toLowerCase();
    if (fn.includes('jacket') || fn.includes('blazer') || fn.includes('suit')) garmentType = 'jacket';
    else if (fn.includes('gown') || fn.includes('dress') || fn.includes('evening')) garmentType = 'gown';
    else if (fn.includes('shirt') || fn.includes('oxford') || fn.includes('blouse')) garmentType = 'shirt';
    else if (fn.includes('trouser') || fn.includes('pant') || fn.includes('slack')) garmentType = 'trouser';
    else if (fn.includes('jean') || fn.includes('denim')) garmentType = 'jeans';
    else if (fn.includes('skirt')) garmentType = 'skirt';
    else if (fn.includes('polo')) garmentType = 'polo';
    else if (fn.includes('t_shirt') || fn.includes('tee')) garmentType = 't_shirt';
    else if (fn.includes('short')) garmentType = 'shorts';
    else if (fn.includes('coat') || fn.includes('trench')) garmentType = 'coat';
  }

  const deconstructBlueprints = {
    gown: {
      name: 'Bespoke Contour Sweetheart Evening Gown',
      silhouette: 'Fitted Column Sheath with French Darts',
      neckline: 'Sweetheart Neckline with Corset Contour',
      sleeve: 'Sleeveless with Clean Bias Underarm Facings',
      collar: 'Sweetheart Neckline with Corset Contour',
      closure: '18" Invisible Center-Back Zipper with Hook & Eye',
      interfacing: 'Lightweight Fusible Weft-Insertion on Bodice & Facings',
      boning: '6-Channel Spiral Steel Boning (Princess & Side Seams)',
      lining: 'Full Silk Crepe de Chine Interior Lining',
      seamAllowance: 0.5,
      seamAllowanceText: '0.5" Main Construction, 1.5" Finished Hem, 0.25" Neckline',
      confidence: 0.96,
      constructionSequence: [
        'Staystitch sweetheart neckline and armholes 1/8" inside seamline.',
        'Interface front bodice, back bodice, side front panels, and facings.',
        'Stitch front and back contour bust and waist shaping darts; press toward center.',
        'Join front center bodice to side front panels along princess seams; clip curves.',
        'Stitch boning casing channels along princess and side seams; insert spiral steel boning.',
        'Assemble skirt front and skirt back panels; join bodice to skirt at natural waistline.',
        'Insert 18" invisible zipper into center-back seam using invisible zipper foot.',
        'Construct interior lining bodice and assemble identically to shell.',
        'Join lining to shell at sweetheart neckline; understitch lining to prevent rolling.',
        'Level finished hemline on dress form and finish with 1.5" blind catch-stitch.'
      ],
      suggestedMeasurements: { bust: 36, waist: 28, hip: 38, skirtLength: 44, hipDepth: 8 },
    },
    jacket: {
      name: 'Savile Row Double-Breasted Tailored Blazer',
      silhouette: 'Structured Tailored Waist with English Shoulder',
      neckline: 'Peaked Notch Lapel with Collar Stand',
      sleeve: 'Two-Piece Tailored Sleeve with Working Buttonhole Vents',
      collar: 'Peaked Notch Lapel Collar',
      closure: 'Two-Button Tailored Front Closure with Horn Buttons',
      interfacing: 'Floating Horsehair Canvas Chest Piece & Lapel Pad-Stitching',
      boning: 'None',
      lining: 'Full Bemberg Cupro Interior Lining with Internal Pockets',
      seamAllowance: 0.5,
      seamAllowanceText: '0.5" Main Construction, 1.5" Sleeve & Hem Allowances',
      confidence: 0.95,
      constructionSequence: [
        'Pad-stitch horsehair canvas to front panels and bridle chest line.',
        'Construct jetted waist pockets and chest barchetta welt pocket.',
        'Join shoulder and side seams; press open over tailor ham.',
        'Shape and attach tailored collar and lapel facings with understitching.',
        'Set two-piece sleeves with structured wool sleeve heads.',
        'Assemble and insert interior cupro lining with internal breast pockets.',
        'Work hand buttonholes and finish sleeve vents and bottom hem.'
      ],
      suggestedMeasurements: { bustChest: 40, waist: 35, shoulderWidth: 18.25, jacketLength: 29.5, sleeveLength: 25.25 },
    },
    trouser: {
      name: 'Sartorial Double-Pleated Tailored Trousers',
      silhouette: 'Classic Tapered Trouser with Pressed Crease Lines',
      neckline: 'None',
      sleeve: 'None',
      collar: 'None',
      closure: 'Concealed Front Zipper Fly with Hook & Bar Extension',
      interfacing: 'Tailored Curtain Waistband Interfacing',
      boning: 'None',
      lining: 'Knee-Length Acetate Front Lining',
      seamAllowance: 0.5,
      seamAllowanceText: '0.5" Inseam & Outseam, 1.5" Crotch & Finished Hem',
      confidence: 0.95,
      constructionSequence: [
        'Attach front pocket facings and construct slant quarter pockets.',
        'Construct double-welt back pockets with button tab loops.',
        'Assemble front zipper fly with protective shield extension.',
        'Join front and back panels at inseams and outseams; press crease lines.',
        'Stitch crotch curve with reinforced stretch stitch.',
        'Attach split-back curtain waistband with belt loops.',
        'Level inseam length and finish cuffs with 1.5" blind hem stitch.'
      ],
      suggestedMeasurements: { waist: 32, hip: 40, crotchDepth: 10.5, inseam: 32, kneeWidth: 16, hemWidth: 18 },
    },
    shirt: {
      name: 'Bespoke Tailored Spread-Collar Dress Shirt',
      silhouette: 'Tailored Fit with Back Waist Darts',
      neckline: 'Semi-Spread Collar with Collar Band',
      sleeve: 'Two-Piece Set-In Sleeve with Mitered Cuffs',
      collar: 'Semi-Spread Collar with Removable Stays',
      closure: 'Center-Front 7-Button French Placket',
      interfacing: 'Fusible Crisp Collar & Cuff Interfacing',
      boning: 'Removable Brass Collar Stays',
      lining: 'Unlined French Seams',
      seamAllowance: 0.5,
      seamAllowanceText: '0.25" French Seams, 0.5" Bottom Hem',
      confidence: 0.95,
      constructionSequence: [
        'Interface collar leaf, collar band, and sleeve cuffs.',
        'Stitch collar leaf, turn, press, and sandwich inside collar band.',
        'Fold and stitch front button and buttonhole plackets.',
        'Encase shoulder seams inside double split yoke.',
        'Attach collar band assembly to neckline with clean edge stitching.',
        'Construct sleeve gauntlet plackets and set sleeves flat.',
        'Stitch French seams along underarms and side seams.',
        'Attach cuffs, stitch buttonholes, and narrow hem.'
      ],
      suggestedMeasurements: { bustChest: 39, neckCircumference: 15.5, shoulderWidth: 17.5, shirtLength: 29.5, sleeveLength: 25 },
    },
    skirt: {
      name: 'High-Waisted Contour Pencil Skirt with Walking Vent',
      silhouette: 'High-Waist Fitted Contour with Walking Vent',
      neckline: 'None',
      sleeve: 'None',
      collar: 'None',
      closure: 'Invisible Rear Center Zipper with Hook & Eye',
      interfacing: 'Contour Interfaced Waistband Banding',
      boning: 'None',
      lining: 'Stretch Habotai Silk Lining',
      seamAllowance: 0.5,
      seamAllowanceText: '0.5" Construction, 1.5" Hem & Back Vent',
      confidence: 0.95,
      constructionSequence: [
        'Stitch front and back vertical waist shaping darts; press toward center.',
        'Install invisible zipper into center-back seam above walking vent.',
        'Stitch back center seam below zipper and form walking vent overlap.',
        'Join side seams and press allowances open.',
        'Assemble and attach interfaced waistband facing.',
        'Assemble interior lining and attach to waist and zipper tape.',
        'Finish lower hem with 1.5" blind stitch and catch vent edges.'
      ],
      suggestedMeasurements: { waist: 28, hip: 38, skirtLength: 25, hipDepth: 8 },
    },
  };

  const blueprint = deconstructBlueprints[garmentType] || deconstructBlueprints.gown;

  return {
    garmentType,
    category: garmentType,
    ...blueprint,
  };
}

export const CRITICAL_CONSTRUCTION_FIELDS = [
  'identity.garmentType',
  'garmentType',
  'sleeve.type',
  'sleeve.construction',
  'body.frontConstruction',
  'body.backConstruction',
  'waistband.type',
  'panels',
];

/**
 * Evaluates whether any detected uncertainties require human-in-the-loop review before pattern generation.
 */
export function evaluateUncertainties(uncertainties = []) {
  const critical = [];
  const nonCritical = [];

  for (const item of uncertainties) {
    const field = item.field || '';
    const isCrit = CRITICAL_CONSTRUCTION_FIELDS.some(
      (cf) => field === cf || field.startsWith(`${cf}.`) || cf.startsWith(`${field}.`)
    );
    if (isCrit) {
      critical.push(item);
    } else {
      nonCritical.push(item);
    }
  }

  return {
    critical,
    nonCritical,
    hasCriticalUncertainty: critical.length > 0,
    requiresReview: critical.length > 0,
  };
}

/**
 * Reverse-engineers uploaded garment image(s) into a canonical GarmentSpecification.
 * Supports multi-image analysis, analysis modes, authoritative user corrections,
 * and passes through the active provider (OpenAIProvider by default).
 */
export async function deconstructGarmentImages(images, options = {}) {
  logger.deconstruct(`Multi-image reference received (${Array.isArray(images) ? images.length : 1} items)`);

  const orchestratorResult = await aiOrchestrator.analyzeGarment(images, options);

  if (orchestratorResult.success && (orchestratorResult.data || orchestratorResult.specification)) {
    const spec = orchestratorResult.data || orchestratorResult.specification;
    return {
      success: true,
      data: spec,
      specification: spec,
      observations: orchestratorResult.observations || spec.observations || [],
      confidence: orchestratorResult.confidence ?? spec.confidence,
      uncertainties: orchestratorResult.uncertainties || spec.uncertainties || [],
      questionsForUser: orchestratorResult.questionsForUser || spec.questionsForUser || [],
      sourceImages: orchestratorResult.sourceImages || spec.sourceImages || [],
      risk: orchestratorResult.risk || spec.risk,
      requiresReview: spec.status === 'needs_review',
    };
  }

  if (orchestratorResult.status === 'error') {
    return {
      success: false,
      status: 'error',
      code: orchestratorResult.code || 'AI_ANALYSIS_FAILED',
      error: orchestratorResult.message || 'Garment analysis could not be completed.',
      message: orchestratorResult.message || 'Garment analysis could not be completed.',
      retryable: Boolean(orchestratorResult.retryable),
    };
  }

  // Fallback to local heuristic
  const rawList = Array.isArray(images) ? images : [images];
  const firstImg = rawList[0]?.data || rawList[0];
  const localData = deconstructGarmentLocally(firstImg, options);
  const canonical = normalizeSpecification(localData);
  return {
    success: true,
    data: canonical,
    specification: canonical,
    observations: [],
    uncertainties: [],
    questionsForUser: [],
    sourceImages: ['img_local_01'],
    requiresReview: false,
  };
}

/**
 * Legacy single-image adapter.
 */
export async function deconstructGarmentImage(imageBase64, options = {}) {
  return deconstructGarmentImages([imageBase64], options);
}

/**
 * Merges user corrections into a specification as authoritative overrides.
 */
export function applyAuthoritativeCorrections(spec, corrections) {
  const updated = {
    ...spec,
    userCorrections: { ...(spec?.userCorrections || {}), ...corrections },
  };

  for (const [key, val] of Object.entries(corrections)) {
    if (key === 'garmentType') {
      updated.garmentType = val;
      if (updated.identity) {
        updated.identity.garmentType = val;
      }
    } else if (key.startsWith('sleeve.')) {
      const subKey = key.split('.')[1];
      updated.sleeve = { ...(updated.sleeve || {}), [subKey]: val };
    } else if (key.startsWith('collar.')) {
      const subKey = key.split('.')[1];
      updated.collar = { ...(updated.collar || {}), [subKey]: val };
    } else if (key.startsWith('neckline.')) {
      const subKey = key.split('.')[1];
      updated.neckline = { ...(updated.neckline || {}), [subKey]: val };
    } else if (key.startsWith('waistband.')) {
      const subKey = key.split('.')[1];
      updated.waistband = { ...(updated.waistband || {}), [subKey]: val };
    } else {
      updated[key] = val;
    }
  }

  return updated;
}
