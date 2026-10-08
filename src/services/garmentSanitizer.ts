/**
 * TAILORIX AI — STRICT GARMENT SANITIZER & TAXONOMY GUARD
 * 
 * Enforces absolute category boundary separation and eliminates cross-category attribute leakage.
 * 
 * Strict Hard Purge Rules:
 * 1. If category is NOT lower-body (trouser, jeans, shorts):
 *    - HARD PURGE: crotch_rise, inseam, outseam, fly_type, fly_zipper, belt_loops,
 *      waistband_curtain, slant_pockets, center_leg_crease, and trouser assembly steps.
 * 2. If category is NOT upper-body / one-piece (shirt, blouse, dress, gown, jacket, blazer, coat, vest):
 *    - HARD PURGE: neckline_style, collar_type, armhole_depth, sleeve_length, bust_darts,
 *      neckline, collar, sleeves, armholes.
 * 3. Never invent features or allow static defaults to leak across garment families.
 * 4. Stop automatic pattern generation if confidence < 0.70 and raise UNCERTAIN_TAXONOMY.
 */

export const GARMENT_CATEGORIES = {
  TROUSERS: 'trouser',
  JEANS: 'jeans',
  SHORTS: 'shorts',
  SKIRT: 'skirt',
  DRESS: 'dress',
  GOWN: 'gown',
  SHIRT: 'shirt',
  BLOUSE: 'blouse',
  JACKET: 'jacket',
  BLAZER: 'blazer',
  COAT: 'coat',
  VEST: 'vest',
  JUMPSUIT: 'jumpsuit',
  POLO: 'polo',
  T_SHIRT: 't_shirt',
  HOODIE: 'hoodie',
  SWEATSHIRT: 'sweatshirt',
  UNKNOWN: 'unknown',
};

export const LOWER_BODY_CATEGORIES = new Set(['trouser', 'trousers', 'jeans', 'jean', 'shorts', 'short']);
export const SKIRT_CATEGORIES = new Set(['skirt', 'skirts']);
export const UPPER_BODY_CATEGORIES = new Set([
  'shirt', 'shirts', 'blouse', 'blouses', 'jacket', 'jackets', 'blazer', 'blazers',
  'coat', 'coats', 'vest', 'vests', 'polo', 't_shirt', 'tee', 'hoodie', 'sweatshirt',
]);
export const ONE_PIECE_CATEGORIES = new Set(['dress', 'dresses', 'gown', 'gowns', 'jumpsuit', 'romper']);

/**
 * Normalizes any raw category string into an authoritative canonical category.
 */
export function normalizeCategory(raw) {
  if (!raw) return GARMENT_CATEGORIES.UNKNOWN;
  const s = String(raw).toLowerCase().replace(/[\s-_]/g, '');

  // 1. Compound terms disambiguation (CRITICAL: prevent "dress shirt" from becoming a dress or "dress pants" from becoming a dress)
  if (s.includes('dressshirt') || s.includes('oxfordshirt') || s.includes('buttonupshirt') || s.includes('buttondownshirt')) {
    return GARMENT_CATEGORIES.SHIRT;
  }
  if (s.includes('shirtdress') || s.includes('chemisier') || s.includes('slipdress') || s.includes('wrapdress') || s.includes('maxidress') || s.includes('mididress') || s.includes('minidress') || s.includes('sundress') || s.includes('ballgown') || s.includes('eveninggown')) {
    return GARMENT_CATEGORIES.DRESS;
  }
  if (s.includes('dresspant') || s.includes('dresspants') || s.includes('dresstrouser') || s.includes('dresstrousers') || s.includes('dressslack') || s.includes('dressslacks')) {
    return GARMENT_CATEGORIES.TROUSERS;
  }
  if (s.includes('pantsuit') || s.includes('trousersuit')) {
    return GARMENT_CATEGORIES.JACKET;
  }

  // 2. Hoodies & Sweatshirts
  if (s.includes('hoodie') || s.includes('hoody') || s.includes('pulloverfleece')) {
    return GARMENT_CATEGORIES.HOODIE;
  }
  if (s.includes('sweatshirt')) {
    return GARMENT_CATEGORIES.SWEATSHIRT;
  }

  // 3. Lower Body (Trousers, Jeans, Shorts)
  if (s.includes('trouser') || s.includes('pant') || s.includes('slack') || s.includes('chino') || s.includes('culotte')) {
    return GARMENT_CATEGORIES.TROUSERS;
  }
  if (s.includes('jean') || s.includes('denim')) {
    return GARMENT_CATEGORIES.JEANS;
  }
  if (s.includes('short') || s.includes('bermuda')) {
    return GARMENT_CATEGORIES.SHORTS;
  }

  // 4. Skirt (Waist-down non-bifurcated)
  if (s.includes('skirt')) {
    return GARMENT_CATEGORIES.SKIRT;
  }

  // 5. Outerwear (Jackets, Blazers, Coats, Suits)
  if (s.includes('blazer')) {
    return GARMENT_CATEGORIES.BLAZER;
  }
  if (s.includes('jacket') || s.includes('suit') || s.includes('tuxedo')) {
    return GARMENT_CATEGORIES.JACKET;
  }
  if (s.includes('coat') || s.includes('trench') || s.includes('overcoat') || s.includes('parka')) {
    return GARMENT_CATEGORIES.COAT;
  }
  if (s.includes('vest') || s.includes('waistcoat')) {
    return GARMENT_CATEGORIES.VEST;
  }

  // 6. Tops (Shirts, Blouses, Polos, Tees)
  if (s.includes('polo')) {
    return GARMENT_CATEGORIES.POLO;
  }
  if (s.includes('blouse')) {
    return GARMENT_CATEGORIES.BLOUSE;
  }
  if (s.includes('tee') || s.includes('tshirt') || s.includes('t_shirt')) {
    return GARMENT_CATEGORIES.T_SHIRT;
  }
  if (s.includes('shirt') || s.includes('oxford') || s.includes('flannel')) {
    return GARMENT_CATEGORIES.SHIRT;
  }

  // 7. Dresses & Gowns (One-piece sculpted bodice and skirt)
  if (s.includes('gown')) {
    return GARMENT_CATEGORIES.GOWN;
  }
  if (s.includes('dress') || s.includes('frock')) {
    return GARMENT_CATEGORIES.DRESS;
  }

  // 8. One-piece overalls / jumpsuits
  if (s.includes('jumpsuit') || s.includes('overall') || s.includes('romper') || s.includes('bodysuit')) {
    return GARMENT_CATEGORIES.JUMPSUIT;
  }

  return GARMENT_CATEGORIES.UNKNOWN;
}

/**
 * Hard-purges invalid cross-category attributes from a specification.
 */
export function sanitizeGarmentSpecification(rawSpec = {}) {
  const spec = JSON.parse(JSON.stringify(rawSpec));
  const rawCat = spec.identity?.garmentType || spec.garmentType || spec.category || '';
  const category = normalizeCategory(rawCat);

  const isLowerBody = LOWER_BODY_CATEGORIES.has(category);
  const isSkirt = SKIRT_CATEGORIES.has(category);
  const isUpperBody = UPPER_BODY_CATEGORIES.has(category);
  const isOnePiece = ONE_PIECE_CATEGORIES.has(category);

  // Set normalized category
  if (spec.identity) {
    spec.identity.garmentType = category;
  } else {
    spec.garmentType = category;
  }

  // =========================================================================
  // RULE 1: HARD PURGE TROUSER TRAITS FROM NON-TROUSERS
  // =========================================================================
  if (!isLowerBody) {
    // Purge top-level trouser fields
    delete spec.crotch_rise;
    delete spec.crotchDepth;
    delete spec.inseam;
    delete spec.outseam;
    delete spec.fly_type;
    delete spec.fly_zipper;
    delete spec.belt_loops;
    delete spec.waistband_curtain;
    delete spec.slant_pockets;
    delete spec.center_leg_crease;
    delete spec.thigh_width;
    delete spec.knee_width;

    // Purge from measurements
    if (spec.measurements) {
      delete spec.measurements.crotchDepth;
      delete spec.measurements.inseam;
      delete spec.measurements.outseam;
      delete spec.measurements.thigh;
      delete spec.measurements.kneeWidth;
      delete spec.measurements.hemWidth;
    }

    // Purge from constructionDetails
    if (spec.constructionDetails) {
      delete spec.constructionDetails.flyType;
      delete spec.constructionDetails.waistbandCurtain;
      delete spec.constructionDetails.legCrease;
      delete spec.constructionDetails.kneeLining;
    }

    // Purge trouser construction steps
    const seq = spec.constructionSequence || spec.constructionDetails?.sequence || [];
    if (Array.isArray(seq)) {
      const filteredSeq = seq.filter((step) => {
        const lower = String(step).toLowerCase();
        return !lower.includes('fly unit') &&
          !lower.includes('crotch curve') &&
          !lower.includes('outseam') &&
          !lower.includes('inseam') &&
          !lower.includes('crease lines') &&
          !lower.includes('trouser') &&
          !lower.includes('slant pocket');
      });

      // If all steps were filtered out because they were trouser steps, supply category-appropriate defaults
      if (filteredSeq.length === 0) {
        if (isOnePiece) {
          spec.constructionSequence = [
            'Interface neckline facing, bodice front, and back facings.',
            'Stitch bust and waist contour shaping darts; press toward center.',
            'Join bodice shoulder and side seams; finish seam allowances.',
            'Assemble skirt panels and join bodice to skirt at natural waist seam.',
            'Insert concealed invisible zipper into center-back seam.',
            'Attach neckline facing with understitching to prevent rolling.',
            'Level hemline and finish with artisan catch-stitch.',
          ];
        } else if (category === GARMENT_CATEGORIES.HOODIE || category === GARMENT_CATEGORIES.SWEATSHIRT) {
          spec.constructionSequence = [
            'Fuse pocket facing and hood opening edge stays.',
            'Construct and topstitch front kangaroo pocket to front torso panel.',
            'Assemble 2-piece hood panels and stitch center crown contour seam.',
            'Join front and back shoulder seams with stay tape reinforcement.',
            'Attach hood unit to neckline with clean-finish interior twill tape.',
            'Set sleeves flat into front and back armholes matching notches.',
            'Join underarm sleeve seams and side body seams in a continuous pass.',
            'Attach stretch rib knit cuffs to sleeve hems with differential feed.',
            'Attach stretch rib knit waistband to bottom hem edge.',
          ];
        } else if (isUpperBody) {
          spec.constructionSequence = [
            'Fuse collar, collar stand, and front placket interfacings.',
            'Construct front button placket and stay stitching.',
            'Join back yoke to back bodice panel with enclosed clean seam.',
            'Join shoulder seams and stitch side seams.',
            'Assemble and mount two-piece collar unit into neckline.',
            'Set sleeves into armholes with ease distribution.',
            'Construct sleeve plackets and attach cuffs; finish hem.',
          ];
        } else if (isSkirt) {
          spec.constructionSequence = [
            'Interface contoured waistband.',
            'Stitch front and back waist shaping darts; press to center.',
            'Join side seams and press seam allowances open.',
            'Insert concealed invisible zipper in center-back seam.',
            'Attach waistband unit with interior facing.',
            'Turn and finish bottom hemline.',
          ];
        }
      } else {
        spec.constructionSequence = filteredSeq;
      }
    }
  }

  // =========================================================================
  // RULE 2: HARD PURGE UPPER-BODY TRAITS FROM LOWER-BODY & SKIRTS
  // =========================================================================
  if (isLowerBody || isSkirt) {
    spec.neckline = 'NOT_APPLICABLE';
    spec.collar = 'NOT_APPLICABLE';
    spec.sleeve = 'NOT_APPLICABLE';
    spec.sleeves = 'NOT_APPLICABLE';
    spec.armholes = 'NOT_APPLICABLE';
    spec.bustDarts = 'NOT_APPLICABLE';

    delete spec.neckline_style;
    delete spec.collar_type;
    delete spec.armhole_depth;
    delete spec.sleeve_length;
    delete spec.bust_darts;

    if (spec.measurements) {
      delete spec.measurements.bust;
      delete spec.measurements.bustChest;
      delete spec.measurements.neckCircumference;
      delete spec.measurements.shoulderWidth;
      delete spec.measurements.sleeveLength;
      delete spec.measurements.bicepWidth;
      delete spec.measurements.wristCircumference;
    }

    if (spec.constructionDetails) {
      delete spec.constructionDetails.collarStand;
      delete spec.constructionDetails.sleevePlacket;
      delete spec.constructionDetails.cuffHeight;
      delete spec.constructionDetails.yoke;
      spec.constructionDetails.boning = 'NOT_APPLICABLE';
    }
  }

  // =========================================================================
  // RULE 3: SKIRT SPECIFIC PURGES (Skirts are neither upper body nor trousers)
  // =========================================================================
  if (isSkirt) {
    delete spec.crotchDepth;
    delete spec.crotch_rise;
    delete spec.inseam;
    delete spec.fly_type;
    delete spec.center_leg_crease;
    if (spec.measurements) {
      delete spec.measurements.crotchDepth;
      delete spec.measurements.inseam;
      delete spec.measurements.thigh;
    }
  }

  return spec;
}

/**
 * Checks category classification confidence against threshold (0.70).
 * If low or unknown, flags UNCERTAIN_TAXONOMY.
 */
export function checkTaxonomyConfidence(specOrResult = {}) {
  const confidence = Number(
    specOrResult.confidence?.overall ??
    specOrResult.confidence ??
    specOrResult.identity?.confidence ??
    1.0
  );

  const rawCat = specOrResult.identity?.garmentType || specOrResult.garmentType || specOrResult.category || '';
  const normalized = normalizeCategory(rawCat);

  const isLowConfidence = confidence < 0.70;
  const isUnknown = normalized === GARMENT_CATEGORIES.UNKNOWN;

  if (isLowConfidence || isUnknown) {
    return {
      status: 'UNCERTAIN_TAXONOMY',
      valid: false,
      confidence,
      resolvedCategory: normalized,
      message: `Garment classification confidence is low (${Math.round(confidence * 100)}%). Clarification required before pattern compilation.`,
      question: 'Garment type uncertain. Is this a trouser, skirt, dress, shirt, or jacket?',
      candidates: ['trouser', 'jeans', 'shorts', 'skirt', 'dress', 'shirt', 'jacket'],
    };
  }

  return {
    status: 'CONFIRMED_TAXONOMY',
    valid: true,
    confidence,
    category: normalized,
  };
}
