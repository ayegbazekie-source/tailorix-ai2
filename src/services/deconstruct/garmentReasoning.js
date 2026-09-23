/**
 * TAILORIX AI — GARMENT REASONING ENGINE
 * 
 * Deterministically interprets a normalized GarmentSpecification and determines
 * the precise tailoring instructions, seam allowances, structural foundation,
 * and assembly logic required.
 * 
 * Never produces SVG directly; outputs structured construction directives.
 */

export function reasonGarmentConstruction(spec = {}) {
  const gType = spec.identity?.garmentType || spec.garmentType;
  const silhouette = spec.silhouette?.primary || spec.silhouette || 'classic';
  const sleeveType = spec.sleeve?.type || 'set-in';
  const collarType = spec.collar?.type || 'none';
  const waistbandType = spec.waistband?.type || 'straight';
  const materialType = spec.material?.category || 'woven';

  const instructions = {
    garmentType: gType,
    silhouette,
    blockFamily: spec.identity?.category || spec.garmentFamily,
    sleeveConstruction: 'none',
    collarConstruction: 'none',
    bodyDarts: [],
    seamAllowanceDefault: 0.5,
    specializedTechniques: [],
  };

  // 1. Sleeve reasoning
  if (['shirt', 'blouse', 'polo', 't_shirt', 'jacket', 'blazer', 'coat', 'dress', 'gown'].includes(gType)) {
    if (sleeveType === 'raglan') {
      instructions.sleeveConstruction = 'raglan_split';
      instructions.specializedTechniques.push('raglan_diagonal_armhole_slash');
    } else if (sleeveType === 'two-piece') {
      instructions.sleeveConstruction = 'two_piece_tailored';
      instructions.specializedTechniques.push('underarm_pitch_alignment');
    } else if (sleeveType === 'kimono') {
      instructions.sleeveConstruction = 'kimono_integrated';
    } else if (sleeveType === 'sleeveless') {
      instructions.sleeveConstruction = 'clean_bias_facing';
    } else {
      instructions.sleeveConstruction = 'set_in_standard';
    }
  }

  // 2. Collar reasoning
  if (collarType === 'spread' || collarType === 'semi_spread') {
    instructions.collarConstruction = 'two_piece_stand_and_leaf';
  } else if (collarType === 'notch_lapel' || collarType === 'peak_lapel') {
    instructions.collarConstruction = 'tailored_roll_collar_with_gorge';
    instructions.specializedTechniques.push('lapel_pad_stitching', 'bridle_stay_tape');
  } else if (collarType === 'flat_knit') {
    instructions.collarConstruction = 'rib_knit_attached_collar';
  } else {
    instructions.collarConstruction = 'none';
  }

  // 3. Bottoms reasoning (Trousers / Jeans)
  if (gType === 'jeans') {
    instructions.waistbandConstruction = 'contour_chainstitch';
    instructions.specializedTechniques.push('flat_felled_inseams', 'back_v_yoke_shaping', 'rivet_reinforcements');
  } else if (gType === 'trouser') {
    instructions.waistbandConstruction = waistbandType === 'curtain' ? 'split_back_curtain' : 'standard_interfaced';
    instructions.specializedTechniques.push('front_crease_alignment', 'slant_quarter_pocket_facing');
  }

  // 4. Knit reasoning
  if (materialType === 'knit' || gType === 'polo' || gType === 't_shirt') {
    instructions.seamAllowanceDefault = 0.375; // 3/8" standard serger allowance
    instructions.specializedTechniques.push('differential_feed_stretching', 'twin_needle_hemming');
  }

  // 5. Dress / Gown reasoning
  if (gType === 'gown' || gType === 'dress') {
    if (spec.sculpturalComponents?.length > 0) {
      instructions.specializedTechniques.push('volumetric_overlay_isolation');
    }
  }

  return instructions;
}
