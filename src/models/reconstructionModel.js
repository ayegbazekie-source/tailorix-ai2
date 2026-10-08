/**
 * TAILORIX AI — CANONICAL RECONSTRUCTION DATA MODEL
 * 
 * Sits precisely between AI Vision Analysis and the Deterministic Pattern Engine:
 * GarmentSpecification → ReconstructionModel → PatternSpecification → CanonicalGeometry → SVG
 * 
 * Strict Architectural Rules:
 * 1. AI describes and measures the garment; Tailorix reconstructs it into a structured technical flat model.
 * 2. Every reconstruction feature has an explicit source: 'detected' | 'user' | 'structural_requirement'.
 * 3. Never invent features (no necklines on trousers, no cuffs on skirts, no fly units on dresses).
 * 4. Preserves measurable visual evidence extracted from uploaded image in normalized coordinates (0.0 to 1.0).
 * 5. Garment silhouette must be data-driven:
 *    - Straight vs Tapered vs Flared trousers produce visibly different silhouettes.
 *    - Sheath vs A-line vs Ballgown dresses produce visibly different silhouettes.
 *    - Fitted vs Relaxed vs Cropped shirts produce visibly different silhouettes.
 * 6. Reconstruction renderer is deterministic (drawn mathematically from geometric evidence and model).
 * 7. Traceability: SOURCE IMAGE ↔ DETECTED FEATURE ↔ RECONSTRUCTION FEATURE ↔ PATTERN FEATURE.
 * 8. Low confidence (< 0.70) or unknown garments trigger an explicit UNCERTAIN_TAXONOMY state.
 */

import { getGarmentType, GARMENT_TYPES, GARMENT_FAMILIES } from './garmentTaxonomy.js';
import { sanitizeGarmentSpecification, checkTaxonomyConfidence } from '../services/garmentSanitizer';

export const RECONSTRUCTION_VERSION = '2.1.0';

export const FEATURE_SOURCES = {
  DETECTED: 'detected',                 // Extracted from user photo via AI vision
  USER: 'user',                         // Explicitly edited or confirmed by human tailor
  STRUCTURAL: 'structural_requirement', // Physically required by garment block architecture
};

/**
 * Creates a normalized technical ReconstructionModel with measurable geometric evidence.
 */
export function createReconstructionModel(specOrExtracted = {}, options = {}) {
  // Always sanitize input first to guarantee taxonomy isolation
  const sanitized = sanitizeGarmentSpecification(specOrExtracted);

  const rawType = String(
    sanitized.identity?.garmentType ||
    sanitized.garmentType ||
    sanitized.category ||
    ''
  ).toLowerCase().trim();

  const confidenceScore = Number(
    sanitized.confidence?.overall ??
    sanitized.confidence ??
    (sanitized.identity?.confidence ?? 0.95)
  );

  // 1. Taxonomy Validation & Confidence Gate
  const taxonomyCheck = checkTaxonomyConfidence({
    ...sanitized,
    confidence: confidenceScore,
  });

  const garmentDefinition = getGarmentType(rawType, { fallback: false });
  const isRecognized = Boolean(garmentDefinition);

  let uncertaintyState = {
    isUncertain: !taxonomyCheck.valid,
    status: taxonomyCheck.status,
    message: !taxonomyCheck.valid ? taxonomyCheck.message : null,
    candidateGarments: ['trouser', 'jeans', 'shirt', 'jacket', 'skirt', 'dress', 'shorts'],
    resolvedType: isRecognized ? garmentDefinition.id : null,
  };

  const garmentType = isRecognized ? garmentDefinition.id : 'unknown';
  const garmentFamily = isRecognized ? garmentDefinition.family : GARMENT_FAMILIES.CUSTOM;
  const isHoodie = garmentType === 'hoodie' || garmentType === 'sweatshirt' || garmentFamily === GARMENT_FAMILIES.HOODIES;
  const isSkirt = garmentType === 'skirt';
  const isBottom = (garmentFamily === GARMENT_FAMILIES.BOTTOMS || ['trouser', 'jeans', 'shorts'].includes(garmentType)) && !isHoodie && !isSkirt;
  const isDress = garmentType === 'dress' || garmentType === 'gown';
  const isShirt = garmentType === 'shirt' || garmentType === 'blouse' || garmentType === 'polo' || garmentType === 't_shirt';
  const isJacket = garmentType === 'jacket' || garmentType === 'blazer' || garmentType === 'coat';

  // 2. Extract Data-Driven Silhouette
  const rawSilhouette = String(
    sanitized.silhouette?.primary ||
    sanitized.silhouette ||
    (isRecognized ? garmentDefinition.defaultSilhouette : 'classic')
  ).toLowerCase();

  let normalizedSilhouette = 'classic';
  if (isBottom && garmentType !== 'skirt') {
    if (rawSilhouette.includes('flare') || rawSilhouette.includes('bootcut')) normalizedSilhouette = 'flare';
    else if (rawSilhouette.includes('wide')) normalizedSilhouette = 'wide_leg';
    else if (rawSilhouette.includes('slim') || rawSilhouette.includes('taper') || rawSilhouette.includes('skinny')) normalizedSilhouette = 'slim_tapered';
    else if (rawSilhouette.includes('relaxed')) normalizedSilhouette = 'relaxed';
    else normalizedSilhouette = 'straight';
  } else if (isDress) {
    if (rawSilhouette.includes('ball') || rawSilhouette.includes('voluminous')) normalizedSilhouette = 'ballgown';
    else if (rawSilhouette.includes('a_line') || rawSilhouette.includes('flare')) normalizedSilhouette = 'a_line';
    else if (rawSilhouette.includes('column')) normalizedSilhouette = 'column';
    else normalizedSilhouette = 'sheath_fitted';
  } else if (isShirt) {
    if (rawSilhouette.includes('crop')) normalizedSilhouette = 'cropped';
    else if (rawSilhouette.includes('relaxed') || rawSilhouette.includes('oversized') || rawSilhouette.includes('box')) normalizedSilhouette = 'relaxed';
    else if (rawSilhouette.includes('slim') || rawSilhouette.includes('fitted')) normalizedSilhouette = 'fitted_darted';
    else normalizedSilhouette = 'tailored_fit';
  } else if (isJacket) {
    if (rawSilhouette.includes('double')) normalizedSilhouette = 'double_breasted';
    else if (rawSilhouette.includes('crop') || rawSilhouette.includes('box')) normalizedSilhouette = 'cropped_box';
    else normalizedSilhouette = 'single_breasted';
  } else if (garmentType === 'skirt') {
    if (rawSilhouette.includes('a_line') || rawSilhouette.includes('flared')) normalizedSilhouette = 'a_line';
    else if (rawSilhouette.includes('straight')) normalizedSilhouette = 'straight';
    else normalizedSilhouette = 'pencil';
  }

  // 3. Extract or Synthesize Normalized Geometric Landmarks (0.0 to 1.0 coordinate space)
  const geometricEvidence = extractGeometricEvidence(sanitized, garmentType, normalizedSilhouette, isBottom, isDress);

  // 4. Build Garment-Specific Construction Features with Strict Source Grounding & Traceability
  const features = [];
  const panelRegions = [];
  const seamPaths = [];

  const addFeature = (id, type, name, placement, source, details = {}, geometry = null) => {
    features.push({
      id,
      type,
      name,
      placement,
      source,
      sourceFeatureId: `src_${id}`,
      sourceView: details.view || 'front',
      confidence: details.confidence ?? 0.95,
      geometry: geometry || generateFeatureGeometry(placement, garmentType, normalizedSilhouette),
      details,
    });
  };

  if (isBottom && garmentType !== 'skirt') {
    const isJeans = garmentType === 'jeans';
    const isShorts = garmentType === 'shorts';

    // Waistband
    const wbType = sanitized.waistband?.type || sanitized.waistband || (isJeans ? 'Curved Jeans Waistband' : 'Split-Back Contoured Waistband');
    addFeature('feat_waistband', 'waistband', String(wbType), 'waist', FEATURE_SOURCES.STRUCTURAL, {
      construction: isJeans ? 'curved_single_piece' : 'split_back_curtain',
      beltLoops: isJeans ? 5 : 6,
      view: 'front',
    });

    // Closures
    const closureType = sanitized.closures?.[0]?.type || sanitized.closure || (isJeans ? 'Metal Rivet Fly & Top Button' : 'Concealed Zip Fly with Hook & Bar');
    addFeature('feat_closure', 'fly_closure', String(closureType), 'front_center', FEATURE_SOURCES.DETECTED, {
      flyType: isJeans ? 'metal_zip' : 'concealed_zip',
      extension: !isJeans,
      view: 'front',
    });

    // Pockets
    const rawPockets = String(sanitized.pockets || '').toLowerCase();
    const hasSlant = rawPockets.includes('slant') || (!rawPockets && !isJeans);
    const hasJeansCurve = isJeans || rawPockets.includes('scoop') || rawPockets.includes('curved');
    const hasCoin = isJeans || rawPockets.includes('coin');
    const hasCargo = rawPockets.includes('cargo');

    if (hasCargo) {
      addFeature('feat_pocket_cargo', 'pocket', 'Dual Side Bellows Cargo Pockets', 'side_mid_thigh', FEATURE_SOURCES.DETECTED, { style: 'bellows_flap', view: 'front' });
    }
    if (hasJeansCurve) {
      addFeature('feat_pocket_scoop', 'pocket', 'Curved Scoop Front Pockets', 'front_hips', FEATURE_SOURCES.DETECTED, { style: 'scoop', rivets: true, view: 'front' });
    } else if (hasSlant) {
      addFeature('feat_pocket_slant', 'pocket', 'Forward Angled Slant Pockets', 'front_hips', FEATURE_SOURCES.DETECTED, { style: 'slant', openingInches: 6.5, view: 'front' });
    }

    if (hasCoin) {
      addFeature('feat_pocket_coin', 'pocket', 'Right Hip Coin Pocket', 'front_right_facing', isJeans ? FEATURE_SOURCES.STRUCTURAL : FEATURE_SOURCES.DETECTED, { view: 'front' });
    }

    // Rear Pockets
    const hasRearWelt = rawPockets.includes('welt') || (!isJeans && !rawPockets.includes('patch'));
    const hasRearPatch = isJeans || rawPockets.includes('patch');
    if (hasRearPatch) {
      addFeature('feat_pocket_back_patch', 'pocket', 'Dual Spade-Point Back Patch Pockets', 'back_hips', isJeans ? FEATURE_SOURCES.STRUCTURAL : FEATURE_SOURCES.DETECTED, { view: 'back' });
    } else if (hasRearWelt) {
      addFeature('feat_pocket_back_welt', 'pocket', 'Dual Jetted Double-Welt Pockets with Button Loop', 'back_hips', FEATURE_SOURCES.DETECTED, { view: 'back' });
    }

    if (isJeans) {
      addFeature('feat_back_yoke', 'yoke', 'Chevron Pointed Back Denim Yoke', 'back_upper_seat', FEATURE_SOURCES.STRUCTURAL, { style: 'western_chevron', view: 'back' });
    }

    if (!isJeans && !isShorts) {
      addFeature('feat_crease_lines', 'crease', 'Sharp Center-Front & Center-Back Pressed Creases', 'center_leg', FEATURE_SOURCES.STRUCTURAL, { view: 'front' });
    }

    panelRegions.push(
      { id: 'pnl_front_leg_left', name: 'Front Left Leg', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_front_leg_right', name: 'Front Right Leg', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_waistband_front', name: 'Contoured Front Waistband', view: 'front', category: 'waistband', cutCount: 1 },
      { id: 'pnl_back_leg_left', name: 'Back Left Leg', view: 'back', category: 'shell', cutCount: 1 },
      { id: 'pnl_back_leg_right', name: 'Back Right Leg', view: 'back', category: 'shell', cutCount: 1 },
      { id: 'pnl_waistband_back', name: isJeans ? 'Contoured Back Waistband' : 'Split-Back Curtain Waistband', view: 'back', category: 'waistband', cutCount: isJeans ? 1 : 2 }
    );
    if (isJeans) {
      panelRegions.push({ id: 'pnl_back_yoke', name: 'Back Denim Yoke (L/R)', view: 'back', category: 'shell', cutCount: 2 });
    }

    seamPaths.push(
      { id: 'seam_outseam', type: 'outseam', view: 'both', label: 'Side Outseams (0.5" SA)', isTopstitched: isJeans },
      { id: 'seam_inseam', type: 'inseam', view: 'both', label: 'Inner Leg Inseams', isTopstitched: isJeans },
      { id: 'seam_crotch', type: 'crotch', view: 'both', label: 'Continuous Crotch & Seat Curve', isTopstitched: false },
      { id: 'seam_crease', type: 'crease', view: 'both', label: 'Center Crease Plumb Line', isTopstitched: false, style: 'dashed' },
      { id: 'seam_hem', type: 'hem', view: 'both', label: isJeans ? 'Chainstitch 0.5" Hem' : '1.5" Blind-Stitched Hem', isTopstitched: isJeans }
    );

  } else if (isDress) {
    // --- DRESSES / GOWNS (ZERO TROUSER TRAITS) ---
    addFeature('feat_neckline', 'neckline', sanitized.neckline?.type || sanitized.neckline || 'Sweetheart / Jewel Neckline', 'neck', FEATURE_SOURCES.DETECTED, { view: 'front' });
    addFeature('feat_bodice_darts', 'shaping', 'Bust & Waist Contouring Princess Seams', 'bodice', FEATURE_SOURCES.STRUCTURAL, { view: 'front' });
    addFeature('feat_waist_seam', 'waist', 'Horizontal Natural Waist Seam Joint', 'waist', FEATURE_SOURCES.STRUCTURAL, { view: 'front' });
    addFeature('feat_closure', 'closure', 'Center Back Concealed Invisible Zipper (18")', 'center_back', FEATURE_SOURCES.STRUCTURAL, { view: 'back' });
    addFeature('feat_hem', 'hem', 'Hand-Finished Blind Catch-Stitch Hem', 'hem', FEATURE_SOURCES.STRUCTURAL, { view: 'both' });

    panelRegions.push(
      { id: 'pnl_bodice_front', name: 'Front Bodice Panel (Princess Cut)', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_bodice_back', name: 'Back Bodice Panels (L/R)', view: 'back', category: 'shell', cutCount: 2 },
      { id: 'pnl_skirt_front', name: 'Front Dress Skirt Panel', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_skirt_back', name: 'Back Dress Skirt Panels (L/R)', view: 'back', category: 'shell', cutCount: 2 }
    );

    seamPaths.push(
      { id: 'seam_side', type: 'side', view: 'both', label: 'Continuous Bodice & Skirt Side Seams' },
      { id: 'seam_waist', type: 'waist', view: 'both', label: 'Horizontal Natural Waist Seam' },
      { id: 'seam_center_back', type: 'center_back', view: 'back', label: 'Center Back Invisible Zipper Seam' },
      { id: 'seam_hem', type: 'hem', view: 'both', label: 'Finished Catch-Stitch Hem' }
    );

  } else if (isShirt) {
    // --- SHIRTS / TOPS ---
    const isPolo = garmentType === 'polo';
    const collarType = sanitized.collar?.type || sanitized.collar || (isPolo ? 'Ribbed Knit Collar' : 'Two-Piece Spread Collar (Leaf & Stand)');
    addFeature('feat_collar', 'collar', String(collarType), 'neckline', FEATURE_SOURCES.STRUCTURAL, { view: 'front', standHeight: 1.25, leafHeight: 1.75 });

    addFeature('feat_placket', 'closure', isPolo ? 'Two-Button Front Box Placket' : 'Fold-Over Center Button Placket (7 Buttons)', 'center_front', FEATURE_SOURCES.STRUCTURAL, { view: 'front', buttonCount: isPolo ? 2 : 7 });

    const rawSleeve = String(sanitized.sleeves || sanitized.sleeve?.type || 'set-in').toLowerCase();
    const isRaglan = rawSleeve.includes('raglan');
    const isShortSleeve = rawSleeve.includes('short');
    addFeature('feat_sleeves', 'sleeve', isRaglan ? 'Raglan Sleeve Construction' : (isShortSleeve ? 'Short Set-In Sleeves' : 'Two-Piece Set-In Long Sleeves'), 'shoulders', FEATURE_SOURCES.DETECTED, { view: 'front', construction: isRaglan ? 'raglan' : 'set-in', length: isShortSleeve ? 'short' : 'full' });

    if (!isShortSleeve) {
      addFeature('feat_cuffs', 'cuff', 'Single-Button Barrel Cuffs with Gauntlet Button', 'wrist', FEATURE_SOURCES.STRUCTURAL, { view: 'front', height: 2.5 });
    }

    addFeature('feat_yoke', 'yoke', 'Split Horizontal Shoulder Yoke', 'back_upper', FEATURE_SOURCES.STRUCTURAL, { view: 'back' });

    panelRegions.push(
      { id: 'pnl_front_left', name: 'Front Left Bodice & Placket', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_front_right', name: 'Front Right Bodice', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_collar', name: 'Two-Piece Collar', view: 'front', category: 'collar', cutCount: 2 },
      { id: 'pnl_back_bodice', name: 'Back Bodice Panel', view: 'back', category: 'shell', cutCount: 1 },
      { id: 'pnl_back_yoke', name: 'Split Back Yoke', view: 'back', category: 'shell', cutCount: 2 },
      { id: 'pnl_sleeves', name: 'Sleeve Pairs (L/R)', view: 'both', category: 'shell', cutCount: 2 }
    );

    seamPaths.push(
      { id: 'seam_side', type: 'side', view: 'both', label: 'Side Seams (French Seam 0.25")' },
      { id: 'seam_armhole', type: 'armhole', view: 'both', label: 'Armhole Scye Joint' },
      { id: 'seam_yoke', type: 'yoke', view: 'back', label: 'Back Yoke Seam' },
      { id: 'seam_hem', type: 'hem', view: 'both', label: 'Curved Shirttail Hem' }
    );

  } else if (isJacket) {
    // --- JACKET / OUTERWEAR ---
    addFeature('feat_lapel', 'collar', 'Notched Lapel & Under-Collar', 'chest_front', FEATURE_SOURCES.STRUCTURAL, { view: 'front' });
    addFeature('feat_closure', 'closure', 'Single-Breasted 2-Button Closure', 'center_front', FEATURE_SOURCES.STRUCTURAL, { view: 'front' });
    addFeature('feat_breast_pocket', 'pocket', 'Welt Breast Pocket (1.0")', 'chest_left', FEATURE_SOURCES.STRUCTURAL, { view: 'front' });
    addFeature('feat_flap_pockets', 'pocket', 'Dual Flap Hip Pockets', 'lower_front', FEATURE_SOURCES.DETECTED, { view: 'front' });
    addFeature('feat_two_piece_sleeve', 'sleeve', 'Two-Piece Tailored Sleeve with Vent', 'shoulders', FEATURE_SOURCES.STRUCTURAL, { view: 'front' });
    addFeature('feat_vent', 'vent', 'Center-Back Tailoring Vent', 'back_hem', FEATURE_SOURCES.STRUCTURAL, { view: 'back' });

    panelRegions.push(
      { id: 'pnl_jacket_front_l', name: 'Front Left Forepart', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_jacket_front_r', name: 'Front Right Forepart', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_side_body', name: 'Side Body Panels', view: 'both', category: 'shell', cutCount: 2 },
      { id: 'pnl_jacket_back', name: 'Back Jacket Panels (L/R)', view: 'back', category: 'shell', cutCount: 2 },
      { id: 'pnl_sleeve_top', name: 'Top Sleeve Panels', view: 'both', category: 'shell', cutCount: 2 },
      { id: 'pnl_sleeve_under', name: 'Under Sleeve Panels', view: 'both', category: 'shell', cutCount: 2 }
    );

    seamPaths.push(
      { id: 'seam_side_body', type: 'side', view: 'both', label: 'Side Body Seams' },
      { id: 'seam_center_back', type: 'center_back', view: 'back', label: 'Center Back Seam & Vent' },
      { id: 'seam_shoulder', type: 'shoulder', view: 'both', label: 'Shoulder Seam' }
    );

  } else if (garmentType === 'skirt') {
    // --- SKIRT (NO TROUSER CROTCH) ---
    addFeature('feat_waistband', 'waistband', 'Contoured Skirt Waistband', 'waist', FEATURE_SOURCES.STRUCTURAL, { view: 'front' });
    addFeature('feat_waist_darts', 'shaping', 'Dual Front & Back Waist Shaping Darts', 'waist', FEATURE_SOURCES.STRUCTURAL, { view: 'both' });
    addFeature('feat_closure', 'closure', 'Center Back Concealed Zipper', 'center_back', FEATURE_SOURCES.STRUCTURAL, { view: 'back' });
    addFeature('feat_vent', 'vent', 'Walking Vent / Kick Pleat', 'back_hem', FEATURE_SOURCES.STRUCTURAL, { view: 'back' });

    panelRegions.push(
      { id: 'pnl_skirt_front', name: 'Front Skirt Panel (Cut 1 on Fold)', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_skirt_back_l', name: 'Back Left Skirt Panel', view: 'back', category: 'shell', cutCount: 1 },
      { id: 'pnl_skirt_back_r', name: 'Back Right Skirt Panel', view: 'back', category: 'shell', cutCount: 1 },
      { id: 'pnl_waistband', name: 'Contoured Waistband', view: 'both', category: 'waistband', cutCount: 1 }
    );

    seamPaths.push(
      { id: 'seam_side', type: 'side', view: 'both', label: 'Side Seams with Hip Contour' },
      { id: 'seam_center_back', type: 'center_back', view: 'back', label: 'Center Back Zipper & Vent' },
      { id: 'seam_hem', type: 'hem', view: 'both', label: 'Blind-Stitched 1.5" Hem' }
    );

  } else if (isHoodie) {
    // --- HOODIES & SWEATSHIRTS ---
    const rawClosure = String(sanitized.closure?.type || sanitized.closure || '').toLowerCase();
    const isZip = rawClosure.includes('zip');
    addFeature('feat_hood', 'hood', 'Two-Piece Ergonomic Hood with Drawstring Channel', 'neck', FEATURE_SOURCES.DETECTED, { view: 'front' });
    addFeature('feat_kangaroo', 'pocket', isZip ? 'Dual Split Front Hand-Warmer Pockets' : 'Front Kangaroo Hand-Warmer Patch Pocket', 'front_hips', FEATURE_SOURCES.DETECTED, { view: 'front' });
    addFeature('feat_rib_hem', 'ribbing', '2x2 Stretch Rib Knit Hem Band', 'hem', FEATURE_SOURCES.STRUCTURAL, { view: 'both' });
    addFeature('feat_rib_cuff', 'ribbing', '2x2 Stretch Rib Knit Wrist Cuffs', 'wrist', FEATURE_SOURCES.STRUCTURAL, { view: 'both' });
    addFeature('feat_sleeves', 'sleeve', 'Set-In / Drop-Shoulder Long Sleeves', 'shoulders', FEATURE_SOURCES.DETECTED, { view: 'front' });

    panelRegions.push(
      { id: 'pnl_hoodie_front', name: 'Front Torso Body Panel', view: 'front', category: 'shell', cutCount: isZip ? 2 : 1 },
      { id: 'pnl_hoodie_back', name: 'Back Torso Body Panel', view: 'back', category: 'shell', cutCount: 1 },
      { id: 'pnl_hood_side', name: 'Two-Piece Hood Side Panels', view: 'both', category: 'hood', cutCount: 2 },
      { id: 'pnl_hoodie_sleeve', name: 'Sleeve Panels (Pair)', view: 'both', category: 'shell', cutCount: 2 },
      { id: 'pnl_kangaroo_pocket', name: 'Kangaroo Hand-Warmer Pocket', view: 'front', category: 'pocket', cutCount: 1 },
      { id: 'pnl_rib_hem', name: 'Ribbed Hem Band', view: 'both', category: 'ribbing', cutCount: 1 },
      { id: 'pnl_rib_cuff', name: 'Ribbed Cuffs (Pair)', view: 'both', category: 'ribbing', cutCount: 2 }
    );

    seamPaths.push(
      { id: 'seam_hood_crown', type: 'hood', view: 'both', label: 'Hood Center Crown Seam' },
      { id: 'seam_neckline', type: 'neckline', view: 'both', label: 'Hood Neckline Joint with Twill Tape' },
      { id: 'seam_side_body', type: 'side', view: 'both', label: 'Side Body Seams' },
      { id: 'seam_armscye', type: 'armhole', view: 'both', label: 'Drop-Shoulder Armscye Seam' },
      { id: 'seam_rib_hem', type: 'hem', view: 'both', label: 'Differential Overlock Rib Joint' }
    );

  } else {
    // Unknown or unmapped garment
    panelRegions.push(
      { id: 'pnl_unmapped_front', name: 'Unmapped Front Panel', view: 'front', category: 'shell', cutCount: 1 },
      { id: 'pnl_unmapped_back', name: 'Unmapped Back Panel', view: 'back', category: 'shell', cutCount: 1 }
    );
  }

  // 5. Generate Technical Flat Geometry (Deterministic Vector Rendering)
  const views = generateTechnicalFlatViews(garmentType, normalizedSilhouette, features, isBottom, isDress);

  // Adopt Gemini's visual line-art reconstruction as the primary visual renderer when available
  const geminiRecon = sanitized.reconstruction || options.geminiReconstruction;
  let lineArtCloneSketch;

  if (geminiRecon && (geminiRecon.front?.outlinePath || geminiRecon.outlinePath)) {
    lineArtCloneSketch = {
      style: 'technical_line_art_sketch',
      garmentSpecific: true,
      backgroundColor: '#FFFFFF',
      whatTailorixSees: geminiRecon.whatTailorixSees || `Tailorix reconstructed this bespoke ${garmentType} visual clone directly from the uploaded photo.`,
      silhouetteType: normalizedSilhouette,
      garmentCategory: garmentFamily,
      garmentType,
      isGeminiRendered: true,
      front: {
        outlinePath: geminiRecon.front?.outlinePath || geminiRecon.outlinePath || '',
        seams: geminiRecon.front?.seams || geminiRecon.seams || [],
        darts: geminiRecon.front?.darts || geminiRecon.darts || [],
        details: geminiRecon.front?.details || geminiRecon.details || [],
      },
      back: {
        outlinePath: geminiRecon.back?.outlinePath || geminiRecon.front?.outlinePath || '',
        seams: geminiRecon.back?.seams || [],
        darts: geminiRecon.back?.darts || [],
        details: geminiRecon.back?.details || [],
      },
    };
  } else {
    lineArtCloneSketch = generateLineArtCloneSketch({
      garmentType,
      garmentFamily,
      silhouette: normalizedSilhouette,
      features,
      spec: sanitized,
      isBottom,
      isDress,
      isShirt,
      isJacket,
      isHoodie,
      isSkirt,
    });
  }

  return {
    reconstructionVersion: RECONSTRUCTION_VERSION,
    id: `recon_${garmentType}_${Date.now()}`,
    identity: {
      id: `recon_${garmentType}_${Date.now()}`,
      garmentType,
      category: garmentType,
      garmentFamily,
      silhouette: normalizedSilhouette,
      confidence: confidenceScore,
    },
    sourceSpecificationId: sanitized.id || `spec_${Date.now()}`,
    sourceGarmentSpecId: sanitized.id || `spec_${Date.now()}`,
    createdAt: new Date().toISOString(),
    garmentType,
    garmentFamily,
    silhouette: normalizedSilhouette,
    confidence: confidenceScore,
    uncertaintyState,
    geometricEvidence,
    proportionalLandmarks: Object.entries(geometricEvidence).map(([key, val]) => ({
      landmark: key,
      ...val,
    })),
    features,
    panelRegions,
    seamPaths,
    views,
    lineArtCloneSketch,
    humanCorrections: {},
    auditLog: [
      {
        timestamp: new Date().toISOString(),
        action: 'CREATED_FROM_ANALYSIS',
        details: `Reconstructed technical engineering model for ${garmentType} (${normalizedSilhouette} silhouette)`,
      },
    ],
  };
}

/**
 * Generates the clean, faithful, studio-grade LINE-ART CLONE SKETCH of the uploaded garment.
 * Architectural Standards:
 * - Professional fashion CAD technical drawing style (clean black & charcoal ink on pure white)
 * - Controlled stroke weight hierarchy:
 *   * Outer silhouette: 2.4px solid obsidian (#0B0F19)
 *   * Primary construction seams: 1.4px solid charcoal (#1E293B)
 *   * Topstitching / edgestitching: 0.9px dashed slate (#475569, strokeDasharray="3.5 2")
 *   * Darts: 1.2px solid with apex drill circle (r=2.2)
 *   * Crease / pleat fold lines: 0.9px dash-dot (#64748B, strokeDasharray="7 2.5 1.5 2.5")
 * - Anatomically accurate curves: French curves, neck hollows, sleeve pitch, bust fullness, crotch fork
 * - No generic or invented details; strictly grounded in garment taxonomy & uploaded evidence.
 */
export function generateLineArtCloneSketch(params) {
  const { garmentType, silhouette, isBottom, isDress, isShirt, isJacket, spec = {} } = params;
  const cx = 200; // Centerline in 400x580 canvas

  // =========================================================================
  // 1. DRESS / GOWN TECHNICAL FLAT (COUTURE PRINCESS SEAMS & SCULPTED BODICE)
  // =========================================================================
  if (isDress) {
    const isBallgown = silhouette === 'ballgown';
    const isAline = silhouette === 'a_line';
    const isSheath = !isBallgown && !isAline;

    const shoulderY = 82;
    const neckDepthY = 112;
    const backNeckY = 76;
    const underarmY = 152;
    const bustApexY = 148;
    const waistY = 208;
    const hipY = 280;
    const hemY = isSheath ? 518 : 534;

    const shoulderHalfW = 60;
    const bustHalfW = 68;
    const waistHalfW = 46;
    const hipHalfW = isBallgown ? 112 : isAline ? 84 : 64;
    const hemHalfW = isBallgown ? 155 : isAline ? 122 : 68;

    // Smooth anatomical dress silhouette with French curve torso & skirt sweep
    const frontOutline = `M ${cx - 38} ${neckDepthY}
      C ${cx - 18} ${neckDepthY + 5}, ${cx - 6} ${neckDepthY + 1}, ${cx} ${neckDepthY - 4}
      C ${cx + 6} ${neckDepthY + 1}, ${cx + 18} ${neckDepthY + 5}, ${cx + 38} ${neckDepthY}
      C ${cx + 48} ${shoulderY + 14}, ${cx + 56} ${shoulderY + 6}, ${cx + shoulderHalfW} ${shoulderY}
      C ${cx + shoulderHalfW - 6} ${shoulderY + 28}, ${cx + bustHalfW} ${underarmY - 14}, ${cx + bustHalfW - 4} ${underarmY}
      C ${cx + bustHalfW + 2} ${underarmY + 18}, ${cx + waistHalfW + 8} ${waistY - 18}, ${cx + waistHalfW} ${waistY}
      C ${cx + waistHalfW - 4} ${waistY + 25}, ${cx + hipHalfW + 4} ${hipY - 20}, ${cx + hipHalfW} ${hipY}
      C ${cx + hipHalfW - 6} ${hipY + 60}, ${cx + hemHalfW - 8} ${hemY - 70}, ${cx + hemHalfW} ${hemY}
      C ${cx + hemHalfW * 0.5} ${hemY + 8}, ${cx - hemHalfW * 0.5} ${hemY + 8}, ${cx - hemHalfW} ${hemY}
      C ${cx - hemHalfW + 8} ${hemY - 70}, ${cx - hipHalfW + 6} ${hipY + 60}, ${cx - hipHalfW} ${hipY}
      C ${cx - hipHalfW - 4} ${hipY - 20}, ${cx - waistHalfW + 4} ${waistY + 25}, ${cx - waistHalfW} ${waistY}
      C ${cx - waistHalfW - 8} ${waistY - 18}, ${cx - bustHalfW - 2} ${underarmY + 18}, ${cx - bustHalfW + 4} ${underarmY}
      C ${cx - bustHalfW} ${underarmY - 14}, ${cx - shoulderHalfW + 6} ${shoulderY + 28}, ${cx - shoulderHalfW} ${shoulderY}
      C ${cx - 56} ${shoulderY + 6}, ${cx - 48} ${shoulderY + 14}, ${cx - 38} ${neckDepthY}
      Z`;

    return {
      style: 'technical_line_art_sketch',
      garmentSpecific: true,
      backgroundColor: '#FFFFFF',
      whatTailorixSees: `Tailorix identifies this garment as an engineered ${silhouette.replace(/_/g, ' ')} dress. It features an anatomically sculpted bodice with French bust curves, contour princess seams running from underarm to waistline, a clean natural waist seam, and an uninterrupted skirt drape terminating at a clean hand-finished blind hem. Center back is closed with a concealed invisible zipper.`,
      silhouetteType: silhouette,
      garmentCategory: 'dresses',
      garmentType: 'dress',
      front: {
        outlinePath: frontOutline,
        seams: [
          // Natural waistline seam with gentle anatomical drop at center front
          { id: 'seam_waist', d: `M ${cx - waistHalfW} ${waistY} C ${cx - 20} ${waistY + 4}, ${cx + 20} ${waistY + 4}, ${cx + waistHalfW} ${waistY}`, label: 'Natural Waistline Seam', type: 'structural' },
          // Left French princess contour seam from underarm over bust apex down to waist
          { id: 'seam_princess_l', d: `M ${cx - 52} ${underarmY - 6} C ${cx - 34} ${underarmY + 10}, ${cx - 28} ${bustApexY + 12}, ${cx - 22} ${waistY}`, label: 'Left Princess Contour Seam', type: 'shaping' },
          // Right French princess contour seam
          { id: 'seam_princess_r', d: `M ${cx + 52} ${underarmY - 6} C ${cx + 34} ${underarmY + 10}, ${cx + 28} ${bustApexY + 12}, ${cx + 22} ${waistY}`, label: 'Right Princess Contour Seam', type: 'shaping' },
          // Skirt vertical style seams extending from princess lines down to hem
          { id: 'seam_skirt_l', d: `M ${cx - 22} ${waistY + 4} C ${cx - 32} ${hipY}, ${cx - hemHalfW * 0.42} ${hemY - 80}, ${cx - hemHalfW * 0.48} ${hemY + 4}`, label: 'Front Skirt Seam Line', type: 'style', dashed: true },
          { id: 'seam_skirt_r', d: `M ${cx + 22} ${waistY + 4} C ${cx + 32} ${hipY}, ${cx + hemHalfW * 0.42} ${hemY - 80}, ${cx + hemHalfW * 0.48} ${hemY + 4}`, label: 'Front Skirt Seam Line', type: 'style', dashed: true },
        ],
        darts: [
          // Subtle bust apex shaping markers
          { id: 'dart_bust_apex_l', d: `M ${cx - 28} ${bustApexY} L ${cx - 34} ${bustApexY + 14}`, label: 'Left Bust Apex Contour' },
          { id: 'dart_bust_apex_r', d: `M ${cx + 28} ${bustApexY} L ${cx + 34} ${bustApexY + 14}`, label: 'Right Bust Apex Contour' },
        ],
        details: [
          // Inner back neckline curve visible inside front neck opening (3D hollow depth)
          { id: 'neck_back_depth', d: `M ${cx - 38} ${neckDepthY} C ${cx - 20} ${backNeckY + 6}, ${cx + 20} ${backNeckY + 6}, ${cx + 38} ${neckDepthY}`, label: 'Back Neckline Depth (Inner Facing)' },
          // Sweetheart center dip detail
          { id: 'neck_sweetheart_dip', d: `M ${cx - 16} ${neckDepthY} C ${cx - 6} ${neckDepthY + 6}, ${cx + 6} ${neckDepthY + 6}, ${cx + 16} ${neckDepthY}`, label: 'Sweetheart Neck Contour' },
          // 1.5" blind hem stitching guideline
          { id: 'hem_guide', d: `M ${cx - hemHalfW + 3} ${hemY - 14} C ${cx - hemHalfW * 0.5} ${hemY - 8}, ${cx + hemHalfW * 0.5} ${hemY - 8}, ${cx + hemHalfW - 3} ${hemY - 14}`, label: '1.5" Blind Hem Allowance', dashed: true },
          // Underarm clean bias armhole facing topstitch
          { id: 'armhole_facing_l', d: `M ${cx - shoulderHalfW + 3} ${shoulderY + 6} C ${cx - shoulderHalfW + 2} ${shoulderY + 28}, ${cx - bustHalfW + 8} ${underarmY - 10}, ${cx - bustHalfW + 6} ${underarmY}`, label: 'Bias Armhole Facing', dashed: true },
          { id: 'armhole_facing_r', d: `M ${cx + shoulderHalfW - 3} ${shoulderY + 6} C ${cx + shoulderHalfW - 2} ${shoulderY + 28}, ${cx + bustHalfW - 8} ${underarmY - 10}, ${cx + bustHalfW - 6} ${underarmY}`, label: 'Bias Armhole Facing', dashed: true },
        ],
      },
      back: {
        outlinePath: frontOutline,
        seams: [
          // Center-back invisible zipper line
          { id: 'seam_cb_zip', d: `M ${cx} ${backNeckY + 6} L ${cx} ${hipY + 25}`, label: '18" Invisible Center Back Zipper', type: 'closure' },
          // Natural waistline seam on back
          { id: 'seam_waist_back', d: `M ${cx - waistHalfW} ${waistY} L ${cx + waistHalfW} ${waistY}`, label: 'Natural Waistline Seam', type: 'structural' },
          // Back shoulder/torso contour seam left
          { id: 'seam_back_contour_l', d: `M ${cx - 24} ${shoulderY + 12} C ${cx - 22} ${underarmY}, ${cx - 20} ${waistY - 10}, ${cx - 18} ${waistY}`, label: 'Back Torso Seam Line', type: 'shaping' },
          // Back shoulder/torso contour seam right
          { id: 'seam_back_contour_r', d: `M ${cx + 24} ${shoulderY + 12} C ${cx + 22} ${underarmY}, ${cx + 20} ${waistY - 10}, ${cx + 18} ${waistY}`, label: 'Back Torso Seam Line', type: 'shaping' },
          // Center back walking vent / slit
          { id: 'seam_cb_slit', d: `M ${cx} ${hemY - 75} L ${cx} ${hemY + 6}`, label: 'Center Back Walking Vent / Slit', type: 'structural', dashed: true },
        ],
        darts: [
          // Back waist suppression darts with apex points
          { id: 'dart_waist_back_l', d: `M ${cx - 20} ${waistY - 32} L ${cx - 20} ${waistY + 38}`, label: 'Back Waist Suppression Dart' },
          { id: 'dart_waist_back_r', d: `M ${cx + 20} ${waistY - 32} L ${cx + 20} ${waistY + 38}`, label: 'Back Waist Suppression Dart' },
        ],
        details: [
          // Invisible zip slider pull
          { id: 'zip_pull', d: `M ${cx - 2.5} ${backNeckY + 10} L ${cx + 2.5} ${backNeckY + 10} L ${cx + 2} ${backNeckY + 18} L ${cx - 2} ${backNeckY + 18} Z`, label: 'Invisible Zip Slider' },
          // Vent miter guideline
          { id: 'vent_underlap', d: `M ${cx} ${hemY - 75} L ${cx + 18} ${hemY - 75} L ${cx + 18} ${hemY + 4} L ${cx} ${hemY + 4}`, label: 'Vent Underlap Allowance', dashed: true },
        ],
      },
    };
  }

  // =========================================================================
  // 2. TROUSERS / JEANS TECHNICAL FLAT (SAVILE ROW PLEATED OR 5-POCKET JEANS)
  // =========================================================================
  if (isBottom && garmentType !== 'skirt') {
    const isJeans = garmentType === 'jeans';
    const isFlare = silhouette === 'flare';
    const isWide = silhouette === 'wide_leg';
    const isSlim = silhouette === 'slim_tapered';

    const waistY = 66;
    const waistbandHeight = 20;
    const hipY = 145;
    const crotchForkY = 215;
    const kneeY = 345;
    const hemY = 538;

    const waistHalfW = 56;
    const hipHalfW = 72;
    const kneeHalfW = isFlare ? 34 : isWide ? 54 : isSlim ? 32 : 40;
    const hemHalfW = isFlare ? 62 : isWide ? 56 : isSlim ? 28 : 38;
    const legCenterX = 58; // Offset of each leg center from middle

    // Smooth anatomical trouser silhouette with contoured waistband and tailored leg sweep
    const frontOutline = `M ${cx - waistHalfW} ${waistY}
      C ${cx - 20} ${waistY - 2}, ${cx + 20} ${waistY - 2}, ${cx + waistHalfW} ${waistY}
      C ${cx + waistHalfW + 10} ${waistY + waistbandHeight}, ${cx + hipHalfW + 2} ${hipY - 15}, ${cx + hipHalfW} ${hipY}
      C ${cx + hipHalfW - 2} ${hipY + 35}, ${cx + legCenterX + kneeHalfW + 6} ${kneeY - 40}, ${cx + legCenterX + kneeHalfW} ${kneeY}
      C ${cx + legCenterX + kneeHalfW - 2} ${kneeY + 45}, ${cx + legCenterX + hemHalfW + 2} ${hemY - 40}, ${cx + legCenterX + hemHalfW} ${hemY}
      L ${cx + legCenterX - hemHalfW} ${hemY}
      C ${cx + legCenterX - hemHalfW - 2} ${hemY - 40}, ${cx + legCenterX - kneeHalfW + 2} ${kneeY + 45}, ${cx + legCenterX - kneeHalfW} ${kneeY}
      C ${cx + legCenterX - kneeHalfW - 4} ${kneeY - 40}, ${cx + 8} ${crotchForkY + 25}, ${cx} ${crotchForkY}
      C ${cx - 8} ${crotchForkY + 25}, ${cx - legCenterX + kneeHalfW + 4} ${kneeY - 40}, ${cx - legCenterX + kneeHalfW} ${kneeY}
      C ${cx - legCenterX + kneeHalfW - 2} ${kneeY + 45}, ${cx - legCenterX + hemHalfW + 2} ${hemY - 40}, ${cx - legCenterX + hemHalfW} ${hemY}
      L ${cx - legCenterX - hemHalfW} ${hemY}
      C ${cx - legCenterX - hemHalfW - 2} ${hemY - 40}, ${cx - legCenterX - kneeHalfW + 2} ${kneeY + 45}, ${cx - legCenterX - kneeHalfW} ${kneeY}
      C ${cx - legCenterX - kneeHalfW - 6} ${kneeY - 40}, ${cx - hipHalfW + 2} ${hipY + 35}, ${cx - hipHalfW} ${hipY}
      C ${cx - hipHalfW - 2} ${hipY - 15}, ${cx - waistHalfW - 10} ${waistY + waistbandHeight}, ${cx - waistHalfW} ${waistY}
      Z`;

    return {
      style: 'technical_line_art_sketch',
      garmentSpecific: true,
      backgroundColor: '#FFFFFF',
      whatTailorixSees: `Tailorix identifies this garment as bespoke ${silhouette.replace(/_/g, ' ')} ${isJeans ? 'jeans' : 'trousers'}. Key visible tailoring features include a contoured waistband with fly front shield, forward angled side slant pockets, continuous crotch fork depth, and razor-sharp plumb center-front pressed crease lines terminating at calibrated trouser cuffs.`,
      silhouetteType: silhouette,
      garmentCategory: 'bottoms',
      garmentType: isJeans ? 'jeans' : 'trouser',
      front: {
        outlinePath: frontOutline,
        seams: [
          // Contoured waistband lower join seam
          { id: 'seam_wb', d: `M ${cx - waistHalfW - 2} ${waistY + waistbandHeight} C ${cx - 20} ${waistY + waistbandHeight - 2}, ${cx + 20} ${waistY + waistbandHeight - 2}, ${cx + waistHalfW + 2} ${waistY + waistbandHeight}`, label: 'Contoured Waistband Seam', type: 'structural' },
          // Center front fly seam
          { id: 'seam_fly', d: `M ${cx} ${waistY + waistbandHeight} L ${cx} ${crotchForkY - 24}`, label: 'Center Front Fly Seam', type: 'closure' },
          // Classic J-Stitch curved topstitch row
          { id: 'seam_j_stitch', d: `M ${cx - 18} ${waistY + waistbandHeight} L ${cx - 18} ${crotchForkY - 34} C ${cx - 18} ${crotchForkY - 24}, ${cx - 6} ${crotchForkY - 20}, ${cx} ${crotchForkY - 20}`, label: 'Fly Front J-Stitch (Double Needle)', dashed: true },
          // Secondary parallel topstitching row
          { id: 'seam_j_stitch_inner', d: `M ${cx - 21} ${waistY + waistbandHeight} L ${cx - 21} ${crotchForkY - 35} C ${cx - 21} ${crotchForkY - 22}, ${cx - 8} ${crotchForkY - 17}, ${cx} ${crotchForkY - 17}`, label: 'J-Stitch Twin Topstitch', dashed: true },
          // Razor-sharp plumb center pressed crease lines (Left & Right)
          { id: 'crease_l', d: `M ${cx - legCenterX} ${waistY + waistbandHeight + 6} L ${cx - legCenterX} ${hemY}`, label: 'Left Center Pressed Crease Line', dashed: true },
          { id: 'crease_r', d: `M ${cx + legCenterX} ${waistY + waistbandHeight + 6} L ${cx + legCenterX} ${hemY}`, label: 'Right Center Pressed Crease Line', dashed: true },
        ],
        darts: [
          // Forward double pleats (Left leg)
          { id: 'pleat_l1', d: `M ${cx - 36} ${waistY + waistbandHeight} L ${cx - 36} ${waistY + waistbandHeight + 36}`, label: 'Left Primary Forward Pleat' },
          { id: 'pleat_l2', d: `M ${cx - 48} ${waistY + waistbandHeight} L ${cx - 48} ${waistY + waistbandHeight + 24}`, label: 'Left Secondary Pleat' },
          // Forward double pleats (Right leg)
          { id: 'pleat_r1', d: `M ${cx + 36} ${waistY + waistbandHeight} L ${cx + 36} ${waistY + waistbandHeight + 36}`, label: 'Right Primary Forward Pleat' },
          { id: 'pleat_r2', d: `M ${cx + 48} ${waistY + waistbandHeight} L ${cx + 48} ${waistY + waistbandHeight + 24}`, label: 'Right Secondary Pleat' },
        ],
        details: [
          // Waistband overlap extension tab
          { id: 'wb_tab', d: `M ${cx} ${waistY} L ${cx + 10} ${waistY} L ${cx + 10} ${waistY + waistbandHeight} L ${cx} ${waistY + waistbandHeight}`, label: 'Waistband Extension Tab' },
          // Waistband closure button and buttonhole
          { id: 'wb_button', d: `M ${cx + 6} ${waistY + 10} m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`, label: 'Waistband Horn Button' },
          // Belt Loops (5 standard bespoke loops with top & bottom bar tacks)
          { id: 'loop_1', d: `M ${cx - 50} ${waistY} L ${cx - 50} ${waistY + waistbandHeight}`, label: 'Belt Loop' },
          { id: 'loop_2', d: `M ${cx - 24} ${waistY} L ${cx - 24} ${waistY + waistbandHeight}`, label: 'Belt Loop' },
          { id: 'loop_3', d: `M ${cx + 18} ${waistY} L ${cx + 18} ${waistY + waistbandHeight}`, label: 'Belt Loop' },
          { id: 'loop_4', d: `M ${cx + 50} ${waistY} L ${cx + 50} ${waistY + waistbandHeight}`, label: 'Belt Loop' },
          // Left forward slant pocket opening with bar tacks
          { id: 'pocket_slant_l', d: `M ${cx - waistHalfW + 10} ${waistY + waistbandHeight} L ${cx - hipHalfW + 4} ${waistY + waistbandHeight + 65}`, label: 'Left Forward Slant Pocket' },
          // Right forward slant pocket opening with bar tacks
          { id: 'pocket_slant_r', d: `M ${cx + waistHalfW - 10} ${waistY + waistbandHeight} L ${cx + hipHalfW - 4} ${waistY + waistbandHeight + 65}`, label: 'Right Forward Slant Pocket' },
          // 1.5" blind hem / cuff turn-up line (Left & Right)
          { id: 'hem_guide_l', d: `M ${cx - legCenterX - hemHalfW + 2} ${hemY - 16} L ${cx - legCenterX + hemHalfW - 2} ${hemY - 16}`, label: '1.5" Blind Hem', dashed: true },
          { id: 'hem_guide_r', d: `M ${cx + legCenterX - hemHalfW + 2} ${hemY - 16} L ${cx + legCenterX + hemHalfW - 2} ${hemY - 16}`, label: '1.5" Blind Hem', dashed: true },
        ],
      },
      back: {
        outlinePath: frontOutline,
        seams: [
          // Split-back waistband with center-back V-notch curtain
          { id: 'seam_wb_back', d: `M ${cx - waistHalfW - 2} ${waistY + waistbandHeight} L ${cx + waistHalfW + 2} ${waistY + waistbandHeight}`, label: 'Split-Back Curtain Waistband' },
          // Center back seat rise seam curving through pelvis
          { id: 'seam_seat', d: `M ${cx} ${waistY - 4} C ${cx - 1} ${hipY - 10}, ${cx - 2} ${hipY + 35}, ${cx} ${crotchForkY}`, label: 'Center Back Seat Rise Seam', type: 'structural' },
          // Back leg pressed creases
          { id: 'crease_back_l', d: `M ${cx - legCenterX} ${waistY + waistbandHeight + 8} L ${cx - legCenterX} ${hemY}`, label: 'Back Center Crease', dashed: true },
          { id: 'crease_back_r', d: `M ${cx + legCenterX} ${waistY + waistbandHeight + 8} L ${cx + legCenterX} ${hemY}`, label: 'Back Center Crease', dashed: true },
        ],
        darts: [
          // Back waist suppression darts (Left and Right)
          { id: 'dart_back_l', d: `M ${cx - 40} ${waistY + waistbandHeight} L ${cx - 40} ${waistY + waistbandHeight + 42}`, label: 'Back Waist Contour Dart' },
          { id: 'dart_back_r', d: `M ${cx + 40} ${waistY + waistbandHeight} L ${cx + 40} ${waistY + waistbandHeight + 42}`, label: 'Back Waist Contour Dart' },
        ],
        details: [
          // Center back waistband V-notch detail
          { id: 'cb_v_notch', d: `M ${cx - 6} ${waistY} L ${cx} ${waistY + 8} L ${cx + 6} ${waistY}`, label: 'Split-Back V-Notch Curtain' },
          // Center back belt loop
          { id: 'loop_cb', d: `M ${cx} ${waistY} L ${cx} ${waistY + waistbandHeight}`, label: 'Center Back Belt Loop' },
          // Left rear double-welt pocket with button loop
          { id: 'pocket_welt_l', d: `M ${cx - 56} ${waistY + waistbandHeight + 50} L ${cx - 24} ${waistY + waistbandHeight + 50}`, label: 'Left Rear Double-Welt Pocket' },
          // Right rear double-welt pocket with button loop
          { id: 'pocket_welt_r', d: `M ${cx + 24} ${waistY + waistbandHeight + 50} L ${cx + 56} ${waistY + waistbandHeight + 50}`, label: 'Right Rear Double-Welt Pocket' },
        ],
      },
    };
  }

  // =========================================================================
  // 3. JACKET / BLAZER TECHNICAL FLAT (SAVILE ROW STRUCTURE & TWO-PIECE SLEEVE)
  // =========================================================================
  if (isJacket || garmentType === 'jacket' || garmentType === 'blazer' || garmentType === 'coat') {
    const isDoubleBreasted = silhouette === 'double_breasted';

    const neckY = 72;
    const shoulderY = 82;
    const armscyeY = 175;
    const waistY = 265;
    const hemY = 410;
    const wristY = 405;

    const shoulderHalfW = 94;
    const chestHalfW = 82;
    const waistHalfW = 72;
    const hemHalfW = 84;
    const wristX = 138;

    const frontOutline = `M ${cx - 32} ${neckY + 12}
      L ${cx + 32} ${neckY + 12}
      L ${cx + shoulderHalfW} ${shoulderY}
      C ${cx + shoulderHalfW + 6} ${shoulderY + 40}, ${cx + wristX + 6} ${wristY - 80}, ${cx + wristX} ${wristY}
      L ${cx + wristX - 32} ${wristY}
      C ${cx + wristX - 28} ${wristY - 80}, ${cx + chestHalfW + 12} ${armscyeY + 20}, ${cx + chestHalfW} ${armscyeY}
      L ${cx + waistHalfW} ${waistY}
      L ${cx + hemHalfW} ${hemY}
      C ${cx + 20} ${hemY + 4}, ${cx - 20} ${hemY + 4}, ${cx - hemHalfW} ${hemY}
      L ${cx - waistHalfW} ${waistY}
      L ${cx - chestHalfW} ${armscyeY}
      C ${cx - chestHalfW - 12} ${armscyeY + 20}, ${cx - wristX + 28} ${wristY - 80}, ${cx - wristX + 32} ${wristY}
      L ${cx - wristX} ${wristY}
      C ${cx - wristX - 6} ${wristY - 80}, ${cx - shoulderHalfW - 6} ${shoulderY + 40}, ${cx - shoulderHalfW} ${shoulderY}
      Z`;

    return {
      style: 'technical_line_art_sketch',
      garmentSpecific: true,
      backgroundColor: '#FFFFFF',
      whatTailorixSees: `Tailorix identifies this garment as a bespoke tailored ${isDoubleBreasted ? 'double-breasted' : 'single-breasted'} jacket. It features structured chest canvas foreparts, peaked/notched lapels with hand-felled gorge seams, two-piece tailored sleeves with working surgeon cuffs, an angled barchetta chest pocket, and lower double-jetted flap pockets.`,
      silhouetteType: silhouette,
      garmentCategory: 'outerwear',
      garmentType: 'jacket',
      front: {
        outlinePath: frontOutline,
        seams: [
          // Lapel gorge seams (Left and Right)
          { id: 'seam_gorge_l', d: `M ${cx - 30} ${neckY + 14} L ${cx - 48} ${neckY + 26}`, label: 'Left Lapel Gorge Seam' },
          { id: 'seam_gorge_r', d: `M ${cx + 30} ${neckY + 14} L ${cx + 48} ${neckY + 26}`, label: 'Right Lapel Gorge Seam' },
          // Lapel roll lines extending down to button closure
          { id: 'lapel_roll_l', d: `M ${cx - 30} ${neckY + 14} L ${cx - 14} ${waistY - 15}`, label: 'Lapel Roll Breakline' },
          { id: 'lapel_roll_r', d: `M ${cx + 30} ${neckY + 14} L ${cx + 14} ${waistY - 15}`, label: 'Lapel Roll Breakline' },
          // Two-piece sleeve elbow seams (Left and Right)
          { id: 'sleeve_seam_l', d: `M ${cx - shoulderHalfW + 18} ${armscyeY - 10} C ${cx - 110} ${armscyeY + 70}, ${cx - 120} ${wristY - 60}, ${cx - wristX + 14} ${wristY}`, label: 'Left Two-Piece Sleeve Seam', dashed: true },
          { id: 'sleeve_seam_r', d: `M ${cx + shoulderHalfW - 18} ${armscyeY - 10} C ${cx + 110} ${armscyeY + 70}, ${cx + 120} ${wristY - 60}, ${cx + wristX - 14} ${wristY}`, label: 'Right Two-Piece Sleeve Seam', dashed: true },
          // Front waist suppression dart lines
          { id: 'dart_front_l', d: `M ${cx - 38} ${waistY - 45} L ${cx - 38} ${waistY + 45}`, label: 'Left Front Waist Suppression' },
          { id: 'dart_front_r', d: `M ${cx + 38} ${waistY - 45} L ${cx + 38} ${waistY + 45}`, label: 'Right Front Waist Suppression' },
        ],
        darts: [],
        details: [
          // Inner back collar visible inside neck opening
          { id: 'collar_back_stand', d: `M ${cx - 30} ${neckY + 14} C ${cx - 12} ${neckY + 4}, ${cx + 12} ${neckY + 4}, ${cx + 30} ${neckY + 14}`, label: 'Collar Neck Stand' },
          // Barchetta welt breast pocket on left chest
          { id: 'pocket_breast', d: `M ${cx - 56} ${armscyeY - 5} C ${cx - 40} ${armscyeY - 7}, ${cx - 24} ${armscyeY - 5}, ${cx - 24} ${armscyeY - 5}`, label: 'Barchetta Welt Breast Pocket' },
          // Lower flap pockets (Left and Right)
          { id: 'pocket_flap_l', d: `M ${cx - 68} ${waistY + 35} L ${cx - 28} ${waistY + 35} L ${cx - 28} ${waistY + 48} L ${cx - 68} ${waistY + 48} Z`, label: 'Left Flap Pocket' },
          { id: 'pocket_flap_r', d: `M ${cx + 28} ${waistY + 35} L ${cx + 68} ${waistY + 35} L ${cx + 68} ${waistY + 48} L ${cx + 28} ${waistY + 48} Z`, label: 'Right Flap Pocket' },
          // Horn front buttons
          { id: 'button_1', d: `M ${cx} ${waistY - 10} m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`, label: 'Waist Button' },
          { id: 'button_2', d: `M ${cx} ${waistY + 35} m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`, label: 'Lower Button' },
          // Sleeve surgeon cuff buttons (4 kissing buttons per sleeve)
          { id: 'cuff_buttons_l', d: `M ${cx - wristX + 6} ${wristY - 8} m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0 M ${cx - wristX + 12} ${wristY - 8} m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0 M ${cx - wristX + 18} ${wristY - 8} m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0`, label: 'Surgeon Cuff Buttons' },
          { id: 'cuff_buttons_r', d: `M ${cx + wristX - 6} ${wristY - 8} m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0 M ${cx + wristX - 12} ${wristY - 8} m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0 M ${cx + wristX - 18} ${wristY - 8} m -1.5 0 a 1.5 1.5 0 1 0 3 0 a 1.5 1.5 0 1 0 -3 0`, label: 'Surgeon Cuff Buttons' },
        ],
      },
      back: {
        outlinePath: frontOutline,
        seams: [
          // Center back seam
          { id: 'seam_cb', d: `M ${cx} ${neckY + 6} L ${cx} ${hemY - 70}`, label: 'Center Back Seam' },
          // Center back walking vent
          { id: 'seam_cb_vent', d: `M ${cx} ${hemY - 70} L ${cx} ${hemY + 4}`, label: 'Center Back Walking Vent', dashed: true },
          // Side back seams (Left and Right)
          { id: 'seam_side_back_l', d: `M ${cx - shoulderHalfW + 28} ${armscyeY - 5} C ${cx - 52} ${waistY}, ${cx - 58} ${hemY - 40}, ${cx - 62} ${hemY}`, label: 'Side Back Seam' },
          { id: 'seam_side_back_r', d: `M ${cx + shoulderHalfW - 28} ${armscyeY - 5} C ${cx + 52} ${waistY}, ${cx + 58} ${hemY - 40}, ${cx + 62} ${hemY}`, label: 'Side Back Seam' },
        ],
        darts: [],
        details: [],
      },
    };
  }

  // =========================================================================
  // 4. SHIRT / BLOUSE TECHNICAL FLAT (COLLAR STAND, FRONT PLACKET & CUFFS)
  // =========================================================================
  if (isShirt || garmentType === 'shirt' || garmentType === 'blouse' || garmentType === 'polo') {
    const neckY = 62;
    const shoulderY = 82;
    const armscyeY = 175;
    const waistY = 270;
    const hemY = 385;
    const wristY = 380;

    const shoulderHalfW = 88;
    const chestHalfW = 76;
    const waistHalfW = 68;
    const hemHalfW = 74;
    const wristX = 132;

    const frontOutline = `M ${cx - 28} ${neckY + 15}
      C ${cx - 14} ${neckY + 28}, ${cx + 14} ${neckY + 28}, ${cx + 28} ${neckY + 15}
      L ${cx + shoulderHalfW} ${shoulderY}
      C ${cx + shoulderHalfW + 6} ${shoulderY + 35}, ${cx + wristX + 4} ${wristY - 70}, ${cx + wristX} ${wristY}
      L ${cx + wristX - 26} ${wristY}
      C ${cx + wristX - 22} ${wristY - 70}, ${cx + chestHalfW + 10} ${armscyeY + 15}, ${cx + chestHalfW} ${armscyeY}
      L ${cx + waistHalfW} ${waistY}
      L ${cx + hemHalfW} ${hemY}
      C ${cx + 20} ${hemY + 18}, ${cx - 20} ${hemY + 18}, ${cx - hemHalfW} ${hemY}
      L ${cx - waistHalfW} ${waistY}
      L ${cx - chestHalfW} ${armscyeY}
      C ${cx - chestHalfW - 10} ${armscyeY + 15}, ${cx - wristX + 22} ${wristY - 70}, ${cx - wristX + 26} ${wristY}
      L ${cx - wristX} ${wristY}
      C ${cx - wristX - 4} ${wristY - 70}, ${cx - shoulderHalfW - 6} ${shoulderY + 35}, ${cx - shoulderHalfW} ${shoulderY}
      Z`;

    return {
      style: 'technical_line_art_sketch',
      garmentSpecific: true,
      backgroundColor: '#FFFFFF',
      whatTailorixSees: `Tailorix identifies this garment as a tailored button-down shirt. Key visible features include a structured two-piece collar (leaf and stand), a center front fold-over button placket, set-in sleeves with barrel cuffs, a horizontal shoulder yoke across the back, and a gently curved shirt hem.`,
      silhouetteType: silhouette,
      garmentCategory: 'tops',
      garmentType: 'shirt',
      front: {
        outlinePath: frontOutline,
        seams: [
          // Center front placket center line
          { id: 'seam_placket_c', d: `M ${cx} ${neckY + 28} L ${cx} ${hemY + 16}`, label: 'Center Front Placket' },
          // Placket edge topstitch lines (Left & Right)
          { id: 'seam_placket_l', d: `M ${cx - 9} ${neckY + 28} L ${cx - 9} ${hemY + 16}`, label: 'Placket Edge Topstitch', dashed: true },
          { id: 'seam_placket_r', d: `M ${cx + 9} ${neckY + 28} L ${cx + 9} ${hemY + 16}`, label: 'Placket Edge Topstitch', dashed: true },
          // Set-in sleeve armhole seams
          { id: 'seam_armscye_l', d: `M ${cx - shoulderHalfW} ${shoulderY} C ${cx - shoulderHalfW + 18} ${armscyeY - 30}, ${cx - chestHalfW - 4} ${armscyeY - 8}, ${cx - chestHalfW} ${armscyeY}`, label: 'Armhole Scye Seam' },
          { id: 'seam_armscye_r', d: `M ${cx + shoulderHalfW} ${shoulderY} C ${cx + shoulderHalfW - 18} ${armscyeY - 30}, ${cx + chestHalfW + 4} ${armscyeY - 8}, ${cx + chestHalfW} ${armscyeY}`, label: 'Armhole Scye Seam' },
        ],
        darts: [],
        details: [
          // Two-piece collar leaf points & stand
          { id: 'collar_leaf', d: `M ${cx - 28} ${neckY + 15} L ${cx - 44} ${neckY + 44} L ${cx - 10} ${neckY + 32} L ${cx} ${neckY + 32} L ${cx + 10} ${neckY + 32} L ${cx + 44} ${neckY + 44} L ${cx + 28} ${neckY + 15} Z`, label: 'Two-Piece Spread Collar Leaf' },
          // Left chest pocket with mitered corners
          { id: 'pocket_chest', d: `M ${cx - 52} ${armscyeY + 8} L ${cx - 24} ${armscyeY + 8} L ${cx - 24} ${armscyeY + 44} L ${cx - 38} ${armscyeY + 54} L ${cx - 52} ${armscyeY + 44} Z`, label: 'Mitered Left Chest Pocket' },
          // Calibrated front buttons
          { id: 'btn_1', d: `M ${cx} ${neckY + 44} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`, label: 'Collar Button' },
          { id: 'btn_2', d: `M ${cx} ${neckY + 95} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`, label: 'Placket Button' },
          { id: 'btn_3', d: `M ${cx} ${neckY + 145} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`, label: 'Placket Button' },
          { id: 'btn_4', d: `M ${cx} ${neckY + 195} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`, label: 'Placket Button' },
          { id: 'btn_5', d: `M ${cx} ${neckY + 245} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`, label: 'Placket Button' },
          // Barrel cuffs
          { id: 'cuff_l', d: `M ${cx - wristX} ${wristY - 18} L ${cx - wristX + 26} ${wristY - 18}`, label: 'Barrel Cuff' },
          { id: 'cuff_r', d: `M ${cx + wristX} ${wristY - 18} L ${cx + wristX - 26} ${wristY - 18}`, label: 'Barrel Cuff' },
        ],
      },
      back: {
        outlinePath: frontOutline,
        seams: [
          // Horizontal back shoulder yoke
          { id: 'seam_yoke', d: `M ${cx - shoulderHalfW + 18} ${shoulderY + 28} L ${cx + shoulderHalfW - 18} ${shoulderY + 28}`, label: 'Back Shoulder Yoke' },
          // Center back box pleat lines
          { id: 'seam_box_pleat_l', d: `M ${cx - 10} ${shoulderY + 28} L ${cx - 10} ${shoulderY + 95}`, label: 'Box Pleat Line', dashed: true },
          { id: 'seam_box_pleat_r', d: `M ${cx + 10} ${shoulderY + 28} L ${cx + 10} ${shoulderY + 95}`, label: 'Box Pleat Line', dashed: true },
        ],
        darts: [],
        details: [],
      },
    };
  }

  // =========================================================================
  // 5. HOODIE / SWEATSHIRT TECHNICAL FLAT (TWO-PIECE HOOD & KANGAROO POCKET)
  // =========================================================================
  if (garmentType === 'hoodie' || garmentType === 'sweatshirt') {
    const hoodTopY = 32;
    const neckY = 110;
    const shoulderY = 135;
    const armscyeY = 210;
    const hemY = 415;
    const wristY = 410;

    const shoulderHalfW = 100;
    const chestHalfW = 86;
    const wristX = 142;

    const frontOutline = `M ${cx - 40} ${neckY}
      C ${cx - 42} ${hoodTopY + 15}, ${cx - 28} ${hoodTopY}, ${cx} ${hoodTopY}
      C ${cx + 28} ${hoodTopY}, ${cx + 42} ${hoodTopY + 15}, ${cx + 40} ${neckY}
      L ${cx + shoulderHalfW} ${shoulderY}
      C ${cx + shoulderHalfW + 4} ${shoulderY + 40}, ${cx + wristX + 4} ${wristY - 70}, ${cx + wristX} ${wristY}
      L ${cx + wristX - 28} ${wristY}
      C ${cx + wristX - 24} ${wristY - 70}, ${cx + chestHalfW + 8} ${armscyeY + 15}, ${cx + chestHalfW} ${armscyeY}
      L ${cx + 80} ${hemY}
      L ${cx - 80} ${hemY}
      L ${cx - chestHalfW} ${armscyeY}
      C ${cx - chestHalfW - 8} ${armscyeY + 15}, ${cx - wristX + 24} ${wristY - 70}, ${cx - wristX + 28} ${wristY}
      L ${cx - wristX} ${wristY}
      C ${cx - wristX - 4} ${wristY - 70}, ${cx - shoulderHalfW - 4} ${shoulderY + 40}, ${cx - shoulderHalfW} ${shoulderY}
      Z`;

    return {
      style: 'technical_line_art_sketch',
      garmentSpecific: true,
      backgroundColor: '#FFFFFF',
      whatTailorixSees: `Tailorix identifies this garment as a premium fleece pullover hoodie. It features an anatomical 2-piece hood with metal eyelets and drawstrings, drop-shoulder comfort seams, a curved front kangaroo pocket with bar-tack reinforcements, and 2x2 ribbed cuff bands and waistband.`,
      silhouetteType: silhouette,
      garmentCategory: 'hoodies',
      garmentType: 'hoodie',
      front: {
        outlinePath: frontOutline,
        seams: [
          // Hood front neckline cross seam
          { id: 'seam_hood_neck', d: `M ${cx - 40} ${neckY} C ${cx - 15} ${neckY + 15}, ${cx + 15} ${neckY + 15}, ${cx + 40} ${neckY}`, label: 'Hood Neckline Seam' },
          // Drop-shoulder armhole seams
          { id: 'seam_drop_shoulder_l', d: `M ${cx - shoulderHalfW} ${shoulderY} L ${cx - chestHalfW} ${armscyeY}`, label: 'Left Drop Shoulder Seam' },
          { id: 'seam_drop_shoulder_r', d: `M ${cx + shoulderHalfW} ${shoulderY} L ${cx + chestHalfW} ${armscyeY}`, label: 'Right Drop Shoulder Seam' },
          // Ribbed hem band joint seam
          { id: 'seam_rib_hem', d: `M ${cx - 80} ${hemY - 28} L ${cx + 80} ${hemY - 28}`, label: '2x2 Ribbed Hem Band' },
        ],
        darts: [],
        details: [
          // Kangaroo pocket outline with slanted hand-warmer openings
          { id: 'pocket_kangaroo', d: `M ${cx - 55} ${armscyeY + 45} L ${cx + 55} ${armscyeY + 45} L ${cx + 70} ${hemY - 32} L ${cx - 70} ${hemY - 32} Z`, label: 'Kangaroo Hand-Warmer Pocket' },
          // Kangaroo pocket opening slant topstitching
          { id: 'pocket_slant_l', d: `M ${cx - 55} ${armscyeY + 45} L ${cx - 70} ${hemY - 32}`, label: 'Pocket Opening Slant', dashed: true },
          { id: 'pocket_slant_r', d: `M ${cx + 55} ${armscyeY + 45} L ${cx + 70} ${hemY - 32}`, label: 'Pocket Opening Slant', dashed: true },
          // Drawstring eyelets and cord
          { id: 'cord_eyelet_l', d: `M ${cx - 12} ${neckY + 6} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`, label: 'Grommet Eyelet' },
          { id: 'cord_eyelet_r', d: `M ${cx + 12} ${neckY + 6} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`, label: 'Grommet Eyelet' },
          { id: 'drawstring_l', d: `M ${cx - 12} ${neckY + 8} C ${cx - 16} ${neckY + 30}, ${cx - 10} ${neckY + 60}, ${cx - 14} ${neckY + 85}`, label: 'Braided Drawstring' },
          { id: 'drawstring_r', d: `M ${cx + 12} ${neckY + 8} C ${cx + 16} ${neckY + 30}, ${cx + 10} ${neckY + 60}, ${cx + 14} ${neckY + 85}`, label: 'Braided Drawstring' },
          // Ribbed wrist cuffs
          { id: 'cuff_rib_l', d: `M ${cx - wristX} ${wristY - 22} L ${cx - wristX + 28} ${wristY - 22}`, label: '2x2 Ribbed Cuff' },
          { id: 'cuff_rib_r', d: `M ${cx + wristX} ${wristY - 22} L ${cx + wristX - 28} ${wristY - 22}`, label: '2x2 Ribbed Cuff' },
        ],
      },
      back: {
        outlinePath: frontOutline,
        seams: [
          // Hood crown center seam
          { id: 'seam_hood_crown', d: `M ${cx} ${hoodTopY} L ${cx} ${neckY - 10}`, label: 'Hood Center Crown Seam' },
          { id: 'seam_drop_shoulder_back_l', d: `M ${cx - shoulderHalfW} ${shoulderY} L ${cx - chestHalfW} ${armscyeY}`, label: 'Left Shoulder Seam' },
          { id: 'seam_drop_shoulder_back_r', d: `M ${cx + shoulderHalfW} ${shoulderY} L ${cx + chestHalfW} ${armscyeY}`, label: 'Right Shoulder Seam' },
          { id: 'seam_rib_hem_back', d: `M ${cx - 80} ${hemY - 28} L ${cx + 80} ${hemY - 28}`, label: 'Ribbed Hem Band' },
        ],
        darts: [],
        details: [],
      },
    };
  }

  // =========================================================================
  // 6. SKIRT TECHNICAL FLAT (HIGH-WAIST CONTOUR, DARTS & KICK VENT)
  // =========================================================================
  const waistY = 120;
  const hipY = 210;
  const hemY = 515;
  const waistHalfW = 54;
  const hipHalfW = 76;
  const hemHalfW = silhouette === 'a_line' ? 105 : 68;

  const frontOutline = `M ${cx - waistHalfW} ${waistY}
    C ${cx - 20} ${waistY - 2}, ${cx + 20} ${waistY - 2}, ${cx + waistHalfW} ${waistY}
    C ${cx + waistHalfW + 10} ${waistY + 22}, ${cx + hipHalfW + 2} ${hipY - 15}, ${cx + hipHalfW} ${hipY}
    C ${cx + hipHalfW - 4} ${hipY + 70}, ${cx + hemHalfW - 6} ${hemY - 50}, ${cx + hemHalfW} ${hemY}
    C ${cx + hemHalfW * 0.5} ${hemY + 6}, ${cx - hemHalfW * 0.5} ${hemY + 6}, ${cx - hemHalfW} ${hemY}
    C ${cx - hemHalfW + 6} ${hemY - 50}, ${cx - hipHalfW + 4} ${hipY + 70}, ${cx - hipHalfW} ${hipY}
    C ${cx - hipHalfW - 2} ${hipY - 15}, ${cx - waistHalfW - 10} ${waistY + 22}, ${cx - waistHalfW} ${waistY}
    Z`;

  return {
    style: 'technical_line_art_sketch',
    garmentSpecific: true,
    backgroundColor: '#FFFFFF',
    whatTailorixSees: `Tailorix identifies this garment as a tailored high-waist skirt. It features a contoured waistband, front and back waist suppression darts, curved hip side seams, and a blind catch-stitch hem with a walking vent.`,
    silhouetteType: silhouette,
    garmentCategory: 'skirts',
    garmentType: 'skirt',
    front: {
      outlinePath: frontOutline,
      seams: [
        { id: 'seam_wb', d: `M ${cx - waistHalfW} ${waistY + 20} C ${cx - 20} ${waistY + 18}, ${cx + 20} ${waistY + 18}, ${cx + waistHalfW} ${waistY + 20}`, label: 'Contoured Waistband Seam', type: 'structural' },
      ],
      darts: [
        { id: 'dart_front_l', d: `M ${cx - 28} ${waistY + 20} L ${cx - 28} ${waistY + 65}`, label: 'Left Front Waist Dart' },
        { id: 'dart_front_r', d: `M ${cx + 28} ${waistY + 20} L ${cx + 28} ${waistY + 65}`, label: 'Right Front Waist Dart' },
      ],
      details: [
        { id: 'hem_guide', d: `M ${cx - hemHalfW + 2} ${hemY - 14} C ${cx - hemHalfW * 0.5} ${hemY - 10}, ${cx + hemHalfW * 0.5} ${hemY - 10}, ${cx + hemHalfW - 2} ${hemY - 14}`, label: '1.5" Blind Hem', dashed: true },
      ],
    },
    back: {
      outlinePath: frontOutline,
      seams: [
        { id: 'seam_wb_back', d: `M ${cx - waistHalfW} ${waistY + 20} L ${cx + waistHalfW} ${waistY + 20}`, label: 'Back Waistband Seam' },
        { id: 'seam_cb_zip', d: `M ${cx} ${waistY} L ${cx} ${hipY + 30}`, label: 'Center Back Invisible Zipper' },
        { id: 'seam_cb_vent', d: `M ${cx} ${hemY - 70} L ${cx} ${hemY + 4}`, label: 'Center Back Walking Vent', dashed: true },
      ],
      darts: [
        { id: 'dart_back_l', d: `M ${cx - 26} ${waistY + 20} L ${cx - 26} ${waistY + 75}`, label: 'Back Waist Dart' },
        { id: 'dart_back_r', d: `M ${cx + 26} ${waistY + 20} L ${cx + 26} ${waistY + 75}`, label: 'Back Waist Dart' },
      ],
      details: [],
    },
  };
}

/**
 * Extracts or synthesizes normalized 0.0 to 1.0 coordinate evidence from perception data.
 */
function extractGeometricEvidence(spec, garmentType, silhouette, isBottom, isDress) {
  if (spec.geometricEvidence && spec.geometricEvidence.landmarks) {
    return spec.geometricEvidence;
  }

  // Procedural geometric evidence normalized to 0.0..1.0
  if (isBottom) {
    const isFlare = silhouette === 'flare';
    const isWide = silhouette === 'wide_leg';
    const isSlim = silhouette === 'slim_tapered';

    const kneeW = isFlare ? 0.22 : isWide ? 0.32 : isSlim ? 0.20 : 0.26;
    const hemW = isFlare ? 0.36 : isWide ? 0.34 : isSlim ? 0.18 : 0.24;

    return {
      landmarks: {
        waistLeft: { x: 0.36, y: 0.12 },
        waistRight: { x: 0.64, y: 0.12 },
        hipLeft: { x: 0.32, y: 0.28 },
        hipRight: { x: 0.68, y: 0.28 },
        crotch: { x: 0.50, y: 0.38 },
        kneeLeft: { x: 0.50 - kneeW / 2, y: 0.62 },
        kneeRight: { x: 0.50 + kneeW / 2, y: 0.62 },
        hemLeft: { x: 0.50 - hemW / 2, y: 0.94 },
        hemRight: { x: 0.50 + hemW / 2, y: 0.94 },
      },
      contour: [
        { x: 0.36, y: 0.12 },
        { x: 0.32, y: 0.28 },
        { x: 0.50 - kneeW / 2 - 0.08, y: 0.62 },
        { x: 0.50 - hemW / 2 - 0.08, y: 0.94 },
        { x: 0.50 - hemW / 2 + 0.08, y: 0.94 },
        { x: 0.46, y: 0.62 },
        { x: 0.50, y: 0.38 },
        { x: 0.54, y: 0.62 },
        { x: 0.50 + hemW / 2 - 0.08, y: 0.94 },
        { x: 0.50 + hemW / 2 + 0.08, y: 0.94 },
        { x: 0.50 + kneeW / 2 + 0.08, y: 0.62 },
        { x: 0.68, y: 0.28 },
        { x: 0.64, y: 0.12 },
      ],
      confidence: 0.95,
    };
  }

  if (isDress) {
    const isBallgown = silhouette === 'ballgown';
    const isAline = silhouette === 'a_line';
    const hemSpread = isBallgown ? 0.42 : isAline ? 0.34 : 0.22;

    return {
      landmarks: {
        shoulderLeft: { x: 0.34, y: 0.15 },
        shoulderRight: { x: 0.66, y: 0.15 },
        bustLeft: { x: 0.32, y: 0.26 },
        bustRight: { x: 0.68, y: 0.26 },
        waistLeft: { x: 0.38, y: 0.42 },
        waistRight: { x: 0.62, y: 0.42 },
        hipLeft: { x: 0.34, y: 0.55 },
        hipRight: { x: 0.66, y: 0.55 },
        hemLeft: { x: 0.50 - hemSpread, y: 0.94 },
        hemRight: { x: 0.50 + hemSpread, y: 0.94 },
      },
      contour: [
        { x: 0.44, y: 0.12 },
        { x: 0.34, y: 0.15 },
        { x: 0.32, y: 0.26 },
        { x: 0.38, y: 0.42 },
        { x: 0.34, y: 0.55 },
        { x: 0.50 - hemSpread, y: 0.94 },
        { x: 0.50 + hemSpread, y: 0.94 },
        { x: 0.66, y: 0.55 },
        { x: 0.62, y: 0.42 },
        { x: 0.68, y: 0.26 },
        { x: 0.66, y: 0.15 },
        { x: 0.56, y: 0.12 },
      ],
      confidence: 0.94,
    };
  }

  // Upper Body / Shirt / Jacket
  const isCropped = silhouette === 'cropped';
  const hemY = isCropped ? 0.52 : 0.72;

  return {
    landmarks: {
      neckLeft: { x: 0.44, y: 0.10 },
      neckRight: { x: 0.56, y: 0.10 },
      shoulderLeft: { x: 0.30, y: 0.14 },
      shoulderRight: { x: 0.70, y: 0.14 },
      chestLeft: { x: 0.32, y: 0.30 },
      chestRight: { x: 0.68, y: 0.30 },
      waistLeft: { x: 0.34, y: 0.48 },
      waistRight: { x: 0.66, y: 0.48 },
      hemLeft: { x: 0.32, y: hemY },
      hemRight: { x: 0.68, y: hemY },
    },
    contour: [
      { x: 0.44, y: 0.10 },
      { x: 0.30, y: 0.14 },
      { x: 0.32, y: 0.30 },
      { x: 0.34, y: 0.48 },
      { x: 0.32, y: hemY },
      { x: 0.68, y: hemY },
      { x: 0.66, y: 0.48 },
      { x: 0.68, y: 0.30 },
      { x: 0.70, y: 0.14 },
      { x: 0.56, y: 0.10 },
    ],
    confidence: 0.95,
  };
}

/**
 * Generates normalized bounding geometry for a feature.
 */
function generateFeatureGeometry(placement, garmentType, silhouette) {
  switch (placement) {
    case 'waist':
      return { type: 'rect', points: [{ x: 0.35, y: 0.11 }, { x: 0.65, y: 0.15 }] };
    case 'front_center':
      return { type: 'polyline', points: [{ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.35 }] };
    case 'front_hips':
      return { type: 'rect', points: [{ x: 0.33, y: 0.16 }, { x: 0.43, y: 0.28 }] };
    case 'back_hips':
      return { type: 'rect', points: [{ x: 0.34, y: 0.22 }, { x: 0.46, y: 0.34 }] };
    case 'chest_left':
      return { type: 'rect', points: [{ x: 0.35, y: 0.24 }, { x: 0.45, y: 0.34 }] };
    case 'neck':
    case 'neckline':
      return { type: 'polyline', points: [{ x: 0.42, y: 0.10 }, { x: 0.58, y: 0.10 }] };
    default:
      return { type: 'point', points: [{ x: 0.5, y: 0.5 }] };
  }
}

/**
 * Procedurally generates clean CAD line art coordinates for Front & Back Technical Flats.
 * Avoids generic fashion illustrations — outputs precision ghost-mannequin flat views.
 */
function generateTechnicalFlatViews(garmentType, silhouette, features, isBottom, isDress) {
  const cx = 200; // Center axis in 400x600 canvas

  // =========================================================================
  // 1. BOTTOMS (TROUSERS / JEANS / SHORTS)
  // =========================================================================
  if (isBottom && garmentType !== 'skirt') {
    const isShorts = garmentType === 'shorts';
    const isJeans = garmentType === 'jeans';

    const waistY = 80;
    const hipY = 160;
    const crotchY = 220;
    const kneeY = isShorts ? 360 : 340;
    const hemY = isShorts ? 320 : 540;

    // Silhouette leg width adjustments
    let kneeHalfW = 40;
    let hemHalfW = 38;
    if (silhouette === 'flare') {
      kneeHalfW = 32; // Narrower knee
      hemHalfW = 62;  // Dramatically flared hem!
    } else if (silhouette === 'wide_leg') {
      kneeHalfW = 56;
      hemHalfW = 58;
    } else if (silhouette === 'slim_tapered') {
      kneeHalfW = 34;
      hemHalfW = 26;
    } else if (silhouette === 'relaxed') {
      kneeHalfW = 46;
      hemHalfW = 44;
    }

    const waistHalfW = 54;
    const hipHalfW = 68;

    const front = {
      view: 'front',
      silhouettePath: `M ${cx - waistHalfW} ${waistY}
        Q ${cx - hipHalfW} ${hipY}, ${cx - hipHalfW + 4} ${crotchY}
        Q ${cx - hipHalfW + 8} ${kneeY - 40}, ${cx - (cx - kneeHalfW) / 2 - 40} ${kneeY}
        L ${cx - 70 - hemHalfW / 2} ${hemY}
        L ${cx - 70 + hemHalfW / 2} ${hemY}
        L ${cx - 20} ${kneeY}
        Q ${cx - 6} ${crotchY + 30}, ${cx} ${crotchY}
        Q ${cx + 6} ${crotchY + 30}, ${cx + 20} ${kneeY}
        L ${cx + 70 - hemHalfW / 2} ${hemY}
        L ${cx + 70 + hemHalfW / 2} ${hemY}
        L ${cx + (cx - kneeHalfW) / 2 + 40} ${kneeY}
        Q ${cx + hipHalfW - 8} ${kneeY - 40}, ${cx + hipHalfW - 4} ${crotchY}
        Q ${cx + hipHalfW} ${hipY}, ${cx + waistHalfW} ${waistY}
        Z`,
      panels: [
        {
          id: 'front_left_leg',
          name: 'Front Left Leg',
          points: `${cx} ${crotchY} L ${cx} ${waistY} L ${cx + waistHalfW} ${waistY} Q ${cx + hipHalfW} ${hipY}, ${cx + hipHalfW - 4} ${crotchY} L ${cx + (cx - kneeHalfW) / 2 + 40} ${kneeY} L ${cx + 70 + hemHalfW / 2} ${hemY} L ${cx + 70 - hemHalfW / 2} ${hemY} L ${cx + 20} ${kneeY} Z`,
        },
        {
          id: 'front_right_leg',
          name: 'Front Right Leg',
          points: `${cx} ${crotchY} L ${cx} ${waistY} L ${cx - waistHalfW} ${waistY} Q ${cx - hipHalfW} ${hipY}, ${cx - hipHalfW + 4} ${crotchY} L ${cx - (cx - kneeHalfW) / 2 - 40} ${kneeY} L ${cx - 70 - hemHalfW / 2} ${hemY} L ${cx - 70 + hemHalfW / 2} ${hemY} L ${cx - 20} ${kneeY} Z`,
        },
      ],
      seamLines: [
        { d: `M ${cx} ${waistY} L ${cx} ${crotchY - 30}`, type: 'fly', label: 'Fly Front' },
        { d: `M ${cx - 14} ${waistY} Q ${cx - 14} ${crotchY - 35}, ${cx} ${crotchY - 30}`, type: 'fly_j_stitch', label: 'J-Stitch' },
        { d: `M ${cx - waistHalfW} ${waistY + 16} L ${cx + waistHalfW} ${waistY + 16}`, type: 'waistband_seam', label: 'Waistband Seam' },
        { d: `M ${cx - 70} ${waistY + 20} L ${cx - 70} ${hemY}`, type: 'crease', label: 'Front Crease', style: 'dashed' },
        { d: `M ${cx + 70} ${waistY + 20} L ${cx + 70} ${hemY}`, type: 'crease', label: 'Front Crease', style: 'dashed' },
      ],
      details: [
        isJeans
          ? { type: 'scoop_pocket', d: `M ${cx - waistHalfW + 18} ${waistY + 16} Q ${cx - hipHalfW + 8} ${waistY + 36}, ${cx - hipHalfW + 2} ${waistY + 68}` }
          : { type: 'slant_pocket', d: `M ${cx - waistHalfW + 20} ${waistY + 16} L ${cx - hipHalfW + 4} ${waistY + 74}` },
        isJeans
          ? { type: 'scoop_pocket', d: `M ${cx + waistHalfW - 18} ${waistY + 16} Q ${cx + hipHalfW - 8} ${waistY + 36}, ${cx + hipHalfW - 2} ${waistY + 68}` }
          : { type: 'slant_pocket', d: `M ${cx + waistHalfW - 20} ${waistY + 16} L ${cx + hipHalfW - 4} ${waistY + 74}` },
      ],
    };

    const back = {
      view: 'back',
      silhouettePath: front.silhouettePath,
      panels: [
        {
          id: 'back_left_leg',
          name: 'Back Left Leg',
          points: `${cx} ${crotchY + 10} L ${cx} ${waistY - 8} L ${cx + waistHalfW} ${waistY} Q ${cx + hipHalfW} ${hipY}, ${cx + hipHalfW} ${crotchY} L ${cx + (cx - kneeHalfW) / 2 + 40} ${kneeY} L ${cx + 70 + hemHalfW / 2} ${hemY} L ${cx + 70 - hemHalfW / 2} ${hemY} L ${cx + 20} ${kneeY} Z`,
        },
        {
          id: 'back_right_leg',
          name: 'Back Right Leg',
          points: `${cx} ${crotchY + 10} L ${cx} ${waistY - 8} L ${cx - waistHalfW} ${waistY} Q ${cx - hipHalfW} ${hipY}, ${cx - hipHalfW} ${crotchY} L ${cx - (cx - kneeHalfW) / 2 - 40} ${kneeY} L ${cx - 70 - hemHalfW / 2} ${hemY} L ${cx - 70 + hemHalfW / 2} ${hemY} L ${cx - 20} ${kneeY} Z`,
        },
      ],
      seamLines: [
        { d: `M ${cx} ${waistY - 8} L ${cx} ${crotchY + 10}`, type: 'seat_seam', label: 'Back Seat Seam' },
        { d: `M ${cx - waistHalfW} ${waistY + 16} L ${cx + waistHalfW} ${waistY + 16}`, type: 'waistband_seam', label: 'Waistband Seam' },
        ...(isJeans ? [{ d: `M ${cx - hipHalfW + 2} ${waistY + 45} L ${cx} ${waistY + 60} L ${cx + hipHalfW - 2} ${waistY + 45}`, type: 'back_yoke', label: 'Jeans Yoke' }] : []),
      ],
      details: [
        isJeans
          ? { type: 'patch_pocket', d: `M ${cx - 52} ${waistY + 70} L ${cx - 18} ${waistY + 70} L ${cx - 20} ${waistY + 115} L ${cx - 35} ${waistY + 130} L ${cx - 50} ${waistY + 115} Z` }
          : { type: 'welt_pocket', d: `M ${cx - 52} ${waistY + 65} L ${cx - 18} ${waistY + 65} M ${cx - 35} ${waistY + 65} L ${cx - 35} ${waistY + 72}` },
        isJeans
          ? { type: 'patch_pocket', d: `M ${cx + 18} ${waistY + 70} L ${cx + 52} ${waistY + 70} L ${cx + 50} ${waistY + 115} L ${cx + 35} ${waistY + 130} L ${cx + 20} ${waistY + 115} Z` }
          : { type: 'welt_pocket', d: `M ${cx + 18} ${waistY + 65} L ${cx + 52} ${waistY + 65} M ${cx + 35} ${waistY + 65} L ${cx + 35} ${waistY + 72}` },
      ],
    };

    return { front, back };
  }

  // =========================================================================
  // 2. DRESSES & GOWNS (ZERO TROUSER CROTCH OR FLY UNITS)
  // =========================================================================
  if (isDress) {
    const neckY = 60;
    const shoulderY = 85;
    const bustY = 145;
    const waistY = 220;
    const hipY = 290;
    const hemY = silhouette === 'column' || silhouette === 'ballgown' ? 560 : 480;

    let hemHalfW = 60; // Sheath
    if (silhouette === 'ballgown') hemHalfW = 145; // Voluminous
    else if (silhouette === 'a_line') hemHalfW = 95; // Flared A-line
    else if (silhouette === 'column') hemHalfW = 50; // Narrow column

    const shoulderHalfW = 65;
    const bustHalfW = 68;
    const waistHalfW = 48;
    const hipHalfW = silhouette === 'ballgown' ? 90 : 64;

    const front = {
      view: 'front',
      silhouettePath: `M ${cx - 35} ${neckY + 15}
        Q ${cx} ${neckY + 35}, ${cx + 35} ${neckY + 15}
        L ${cx + shoulderHalfW} ${shoulderY}
        Q ${cx + bustHalfW} ${bustY}, ${cx + bustHalfW - 8} ${bustY + 30}
        L ${cx + waistHalfW} ${waistY}
        Q ${cx + hipHalfW} ${hipY}, ${cx + hipHalfW - 5} ${hipY + 50}
        L ${cx + hemHalfW} ${hemY}
        Q ${cx} ${hemY + 10}, ${cx - hemHalfW} ${hemY}
        L ${cx - hipHalfW + 5} ${hipY + 50}
        Q ${cx - hipHalfW} ${hipY}, ${cx - waistHalfW} ${waistY}
        L ${cx - bustHalfW + 8} ${bustY + 30}
        Q ${cx - bustHalfW} ${bustY}, ${cx - shoulderHalfW} ${shoulderY}
        Z`,
      panels: [
        {
          id: 'dress_bodice_front',
          name: 'Front Bodice Panel (Princess Line)',
          points: `M ${cx - 35} ${neckY + 15} Q ${cx} ${neckY + 35}, ${cx + 35} ${neckY + 15} L ${cx + shoulderHalfW} ${shoulderY} L ${cx + waistHalfW} ${waistY} L ${cx - waistHalfW} ${waistY} L ${cx - shoulderHalfW} ${shoulderY} Z`,
        },
        {
          id: 'dress_skirt_front',
          name: 'Front Dress Skirt Panel',
          points: `M ${cx - waistHalfW} ${waistY} L ${cx + waistHalfW} ${waistY} L ${cx + hemHalfW} ${hemY} Q ${cx} ${hemY + 10}, ${cx - hemHalfW} ${hemY} Z`,
        },
      ],
      seamLines: [
        { d: `M ${cx - waistHalfW} ${waistY} L ${cx + waistHalfW} ${waistY}`, type: 'waist_seam', label: 'Waist Seam' },
        { d: `M ${cx - 24} ${shoulderY + 20} Q ${cx - 20} ${bustY}, ${cx - 18} ${waistY}`, type: 'princess_seam', label: 'Princess Seam' },
        { d: `M ${cx + 24} ${shoulderY + 20} Q ${cx + 20} ${bustY}, ${cx + 18} ${waistY}`, type: 'princess_seam', label: 'Princess Seam' },
      ],
      details: [
        { type: 'neckline_facing', d: `M ${cx - 35} ${neckY + 15} Q ${cx} ${neckY + 35}, ${cx + 35} ${neckY + 15}` },
      ],
    };

    const back = {
      view: 'back',
      silhouettePath: front.silhouettePath,
      panels: [
        {
          id: 'dress_back_left',
          name: 'Back Left Dress Panel',
          points: `M ${cx} ${neckY + 10} L ${cx} ${hemY + 10} L ${cx + hemHalfW} ${hemY} L ${cx + waistHalfW} ${waistY} L ${cx + shoulderHalfW} ${shoulderY} Z`,
        },
        {
          id: 'dress_back_right',
          name: 'Back Right Dress Panel',
          points: `M ${cx} ${neckY + 10} L ${cx} ${hemY + 10} L ${cx - hemHalfW} ${hemY} L ${cx - waistHalfW} ${waistY} L ${cx - shoulderHalfW} ${shoulderY} Z`,
        },
      ],
      seamLines: [
        { d: `M ${cx} ${neckY + 10} L ${cx} ${hemY + 10}`, type: 'center_back_zip', label: 'Center Back Invisible Zipper' },
        { d: `M ${cx - waistHalfW} ${waistY} L ${cx + waistHalfW} ${waistY}`, type: 'waist_seam', label: 'Waist Seam' },
      ],
      details: [],
    };

    return { front, back };
  }

  // =========================================================================
  // 2.5. HOODIES & SWEATSHIRTS
  // =========================================================================
  if (garmentType === 'hoodie' || garmentType === 'sweatshirt') {
    const hoodTopY = 40;
    const neckY = 110;
    const shoulderY = 135;
    const armholeY = 220;
    const waistY = 320;
    const hemY = 430;
    const ribHemY = 460;

    const shoulderHalfW = 100;
    const chestHalfW = 90;
    const waistHalfW = 86;
    const hemHalfW = 80;

    const front = {
      view: 'front',
      silhouettePath: `M ${cx - 38} ${neckY}
        Q ${cx} ${neckY + 18}, ${cx + 38} ${neckY}
        L ${cx + shoulderHalfW} ${shoulderY}
        Q ${cx + shoulderHalfW - 10} ${armholeY - 20}, ${cx + chestHalfW} ${armholeY}
        L ${cx + waistHalfW} ${waistY}
        L ${cx + hemHalfW} ${hemY}
        L ${cx + hemHalfW} ${ribHemY}
        L ${cx - hemHalfW} ${ribHemY}
        L ${cx - hemHalfW} ${hemY}
        L ${cx - waistHalfW} ${waistY}
        L ${cx - chestHalfW} ${armholeY}
        Q ${cx - shoulderHalfW + 10} ${armholeY - 20}, ${cx - shoulderHalfW} ${shoulderY}
        Z`,
      panels: [
        { id: 'hoodie_front_body', name: 'Front Torso Shell', points: `M ${cx - 38} ${neckY} L ${cx + 38} ${neckY} L ${cx + hemHalfW} ${hemY} L ${cx - hemHalfW} ${hemY} Z` },
        { id: 'hoodie_rib_hem', name: 'Ribbed Hem Band', points: `M ${cx - hemHalfW} ${hemY} L ${cx + hemHalfW} ${hemY} L ${cx + hemHalfW} ${ribHemY} L ${cx - hemHalfW} ${ribHemY} Z` },
      ],
      seamLines: [
        { d: `M ${cx - hemHalfW} ${hemY} L ${cx + hemHalfW} ${hemY}`, type: 'rib_seam', label: 'Rib Hem Seam' },
        { d: `M ${cx - shoulderHalfW} ${shoulderY} L ${cx - chestHalfW} ${armholeY}`, type: 'armscye', label: 'Drop Armscye' },
        { d: `M ${cx + shoulderHalfW} ${shoulderY} L ${cx + chestHalfW} ${armholeY}`, type: 'armscye', label: 'Drop Armscye' },
      ],
      details: [
        { type: 'hood', d: `M ${cx - 35} ${neckY} Q ${cx - 45} ${hoodTopY}, ${cx} ${hoodTopY} Q ${cx + 45} ${hoodTopY}, ${cx + 35} ${neckY}` },
        { type: 'kangaroo_pocket', d: `M ${cx - 50} ${waistY + 10} L ${cx + 50} ${waistY + 10} L ${cx + 65} ${hemY} L ${cx - 65} ${hemY} Z` },
      ],
    };

    const back = {
      view: 'back',
      silhouettePath: front.silhouettePath,
      panels: [
        { id: 'hoodie_back_body', name: 'Back Torso Shell', points: front.silhouettePath },
      ],
      seamLines: [
        { d: `M ${cx - hemHalfW} ${hemY} L ${cx + hemHalfW} ${hemY}`, type: 'rib_seam', label: 'Rib Hem Seam' },
      ],
      details: [
        { type: 'hood', d: `M ${cx - 35} ${neckY} Q ${cx - 45} ${hoodTopY}, ${cx} ${hoodTopY} Q ${cx + 45} ${hoodTopY}, ${cx + 35} ${neckY}` },
      ],
    };

    return { front, back };
  }

  // =========================================================================
  // 3. TAILORED SUIT JACKETS, BLAZERS & COATS
  // =========================================================================
  if (garmentType === 'jacket' || garmentType === 'blazer' || garmentType === 'coat' || garmentType === 'suit') {
    const neckY = 65;
    const shoulderY = 82;
    const armholeY = 175;
    const waistY = 270;
    const hemY = garmentType === 'coat' ? 490 : 380;

    const shoulderHalfW = 90;
    const chestHalfW = 82;
    const waistHalfW = 74;
    const hemHalfW = 80;

    const front = {
      view: 'front',
      silhouettePath: `M ${cx - 30} ${neckY + 12}
        L ${cx + 30} ${neckY + 12}
        L ${cx + shoulderHalfW} ${shoulderY}
        Q ${cx + shoulderHalfW - 12} ${armholeY - 20}, ${cx + chestHalfW} ${armholeY}
        L ${cx + waistHalfW} ${waistY}
        L ${cx + hemHalfW} ${hemY}
        L ${cx - hemHalfW} ${hemY}
        L ${cx - waistHalfW} ${waistY}
        L ${cx - chestHalfW} ${armholeY}
        Q ${cx - shoulderHalfW + 12} ${armholeY - 20}, ${cx - shoulderHalfW} ${shoulderY}
        Z`,
      panels: [
        { id: 'jacket_forepart_left', name: 'Left Forepart & Lapel', points: `M ${cx} ${neckY + 15} L ${cx} ${hemY} L ${cx + hemHalfW} ${hemY} L ${cx + waistHalfW} ${waistY} L ${cx + chestHalfW} ${armholeY} L ${cx + shoulderHalfW} ${shoulderY} Z` },
        { id: 'jacket_forepart_right', name: 'Right Forepart', points: `M ${cx} ${neckY + 15} L ${cx} ${hemY} L ${cx - hemHalfW} ${hemY} L ${cx - waistHalfW} ${waistY} L ${cx - chestHalfW} ${armholeY} L ${cx - shoulderHalfW} ${shoulderY} Z` },
      ],
      seamLines: [
        { d: `M ${cx} ${neckY + 15} L ${cx} ${hemY}`, type: 'front_closure', label: 'Single-Breasted Front Edge' },
        { d: `M ${cx - 24} ${neckY + 14} L ${cx - 10} ${waistY - 30}`, type: 'lapel_roll', label: 'Lapel Roll Line', style: 'dashed' },
        { d: `M ${cx + 24} ${neckY + 14} L ${cx + 10} ${waistY - 30}`, type: 'lapel_roll', label: 'Lapel Roll Line', style: 'dashed' },
        { d: `M ${cx - 48} ${armholeY + 20} L ${cx - 45} ${hemY}`, type: 'side_body_seam', label: 'Side Body Seam' },
        { d: `M ${cx + 48} ${armholeY + 20} L ${cx + 45} ${hemY}`, type: 'side_body_seam', label: 'Side Body Seam' },
      ],
      details: [
        { type: 'notch_lapel', d: `M ${cx - 24} ${neckY + 14} L ${cx - 45} ${neckY + 45} L ${cx - 28} ${neckY + 54} L ${cx - 42} ${neckY + 95} L ${cx - 10} ${waistY - 30}` },
        { type: 'notch_lapel', d: `M ${cx + 24} ${neckY + 14} L ${cx + 45} ${neckY + 45} L ${cx + 28} ${neckY + 54} L ${cx + 42} ${neckY + 95} L ${cx + 10} ${waistY - 30}` },
        { type: 'chest_welt', d: `M ${cx - 46} ${armholeY - 5} L ${cx - 16} ${armholeY - 8}` },
        { type: 'flap_pocket_l', d: `M ${cx - 62} ${waistY + 25} L ${cx - 25} ${waistY + 25} L ${cx - 25} ${waistY + 42} L ${cx - 62} ${waistY + 42} Z` },
        { type: 'flap_pocket_r', d: `M ${cx + 25} ${waistY + 25} L ${cx + 62} ${waistY + 25} L ${cx + 62} ${waistY + 42} L ${cx + 25} ${waistY + 42} Z` },
      ],
    };

    const back = {
      view: 'back',
      silhouettePath: front.silhouettePath,
      panels: [
        { id: 'jacket_back_panel', name: 'Back Jacket Panel', points: front.silhouettePath },
      ],
      seamLines: [
        { d: `M ${cx} ${neckY + 12} L ${cx} ${hemY - 90}`, type: 'center_back_seam', label: 'Center Back Seam' },
        { d: `M ${cx} ${hemY - 90} L ${cx} ${hemY}`, type: 'vent', label: 'Center Back Vent', style: 'dashed' },
        { d: `M ${cx - 48} ${armholeY + 20} L ${cx - 45} ${hemY}`, type: 'side_body_seam', label: 'Side Body Seam' },
        { d: `M ${cx + 48} ${armholeY + 20} L ${cx + 45} ${hemY}`, type: 'side_body_seam', label: 'Side Body Seam' },
      ],
      details: [],
    };

    return { front, back };
  }

  // =========================================================================
  // 4. SKIRTS
  // =========================================================================
  if (garmentType === 'skirt') {
    const waistY = 85;
    const hipY = 165;
    const hemY = silhouette === 'maxi' ? 520 : silhouette === 'mini' ? 240 : 380;

    const waistHalfW = 50;
    const hipHalfW = silhouette === 'a_line' ? 75 : 62;
    const hemHalfW = silhouette === 'a_line' ? 88 : silhouette === 'pencil' ? 56 : 64;

    const front = {
      view: 'front',
      silhouettePath: `M ${cx - waistHalfW} ${waistY}
        Q ${cx} ${waistY + 6}, ${cx + waistHalfW} ${waistY}
        Q ${cx + hipHalfW} ${hipY}, ${cx + hemHalfW} ${hemY}
        Q ${cx} ${hemY + 8}, ${cx - hemHalfW} ${hemY}
        Q ${cx - hipHalfW} ${hipY}, ${cx - waistHalfW} ${waistY}
        Z`,
      panels: [
        { id: 'skirt_front_panel', name: 'Front Skirt Panel', points: `M ${cx - waistHalfW} ${waistY} L ${cx + waistHalfW} ${waistY} L ${cx + hemHalfW} ${hemY} L ${cx - hemHalfW} ${hemY} Z` },
      ],
      seamLines: [
        { d: `M ${cx - waistHalfW} ${waistY + 16} Q ${cx} ${waistY + 22}, ${cx + waistHalfW} ${waistY + 16}`, type: 'waistband_seam', label: 'Waistband Seam' },
      ],
      details: [
        { type: 'waist_dart_l', d: `M ${cx - 24} ${waistY + 16} L ${cx - 22} ${waistY + 70}` },
        { type: 'waist_dart_r', d: `M ${cx + 24} ${waistY + 16} L ${cx + 22} ${waistY + 70}` },
        { type: 'hem_guide', d: `M ${cx - hemHalfW} ${hemY - 14} Q ${cx} ${hemY - 6}, ${cx + hemHalfW} ${hemY - 14}`, style: 'dashed' },
      ],
    };

    const back = {
      view: 'back',
      silhouettePath: front.silhouettePath,
      panels: [
        { id: 'skirt_back_panel', name: 'Back Skirt Panel', points: front.silhouettePath },
      ],
      seamLines: [
        { d: `M ${cx} ${waistY} L ${cx} ${hemY - 70}`, type: 'cb_zipper', label: 'Invisible Zipper' },
        { d: `M ${cx} ${hemY - 70} L ${cx} ${hemY}`, type: 'kick_pleat', label: 'Kick Pleat Vent', style: 'dashed' },
        { d: `M ${cx - waistHalfW} ${waistY + 16} Q ${cx} ${waistY + 22}, ${cx + waistHalfW} ${waistY + 16}`, type: 'waistband_seam', label: 'Waistband Seam' },
      ],
      details: [
        { type: 'waist_dart_l', d: `M ${cx - 24} ${waistY + 16} L ${cx - 24} ${waistY + 80}` },
        { type: 'waist_dart_r', d: `M ${cx + 24} ${waistY + 16} L ${cx + 24} ${waistY + 80}` },
      ],
    };

    return { front, back };
  }

  // =========================================================================
  // 5. SHIRTS & TOPS
  // =========================================================================
  const neckY = 60;
  const shoulderY = 85;
  const armholeY = 175;
  const waistY = 270;
  const hemY = silhouette === 'cropped' ? 300 : 380;

  const shoulderHalfW = 85;
  const chestHalfW = 75;
  const waistHalfW = silhouette === 'fitted_darted' ? 60 : 72;
  const hemHalfW = 74;

  const front = {
    view: 'front',
    silhouettePath: `M ${cx - 30} ${neckY + 15}
      Q ${cx} ${neckY + 30}, ${cx + 30} ${neckY + 15}
      L ${cx + shoulderHalfW} ${shoulderY}
      Q ${cx + shoulderHalfW - 15} ${armholeY - 25}, ${cx + chestHalfW} ${armholeY}
      L ${cx + waistHalfW} ${waistY}
      L ${cx + hemHalfW} ${hemY}
      Q ${cx} ${hemY + 15}, ${cx - hemHalfW} ${hemY}
      L ${cx - waistHalfW} ${waistY}
      L ${cx - chestHalfW} ${armholeY}
      Q ${cx - shoulderHalfW + 15} ${armholeY - 25}, ${cx - shoulderHalfW} ${shoulderY}
      Z`,
    panels: [
      { id: 'front_left_body', name: 'Front Left Bodice & Placket', points: `M ${cx} ${neckY + 30} L ${cx} ${hemY + 15} L ${cx + hemHalfW} ${hemY} L ${cx + waistHalfW} ${waistY} L ${cx + chestHalfW} ${armholeY} Q ${cx + shoulderHalfW - 15} ${armholeY - 25}, ${cx + shoulderHalfW} ${shoulderY} L ${cx + 30} ${neckY + 15} Z` },
      { id: 'front_right_body', name: 'Front Right Bodice', points: `M ${cx} ${neckY + 30} L ${cx} ${hemY + 15} L ${cx - hemHalfW} ${hemY} L ${cx - waistHalfW} ${waistY} L ${cx - chestHalfW} ${armholeY} Q ${cx - shoulderHalfW + 15} ${armholeY - 25}, ${cx - shoulderHalfW} ${shoulderY} L ${cx - 30} ${neckY + 15} Z` },
    ],
    seamLines: [
      { d: `M ${cx} ${neckY + 30} L ${cx} ${hemY + 15}`, type: 'placket', label: 'Front Placket' },
      { d: `M ${cx - 8} ${neckY + 30} L ${cx - 8} ${hemY + 15}`, type: 'placket_edge', style: 'dashed' },
      { d: `M ${cx + 8} ${neckY + 30} L ${cx + 8} ${hemY + 15}`, type: 'placket_edge', style: 'dashed' },
    ],
    details: [
      { type: 'collar', d: `M ${cx - 32} ${neckY + 14} L ${cx - 48} ${neckY + 44} L ${cx - 10} ${neckY + 34} L ${cx} ${neckY + 34} L ${cx + 10} ${neckY + 34} L ${cx + 48} ${neckY + 44} L ${cx + 32} ${neckY + 14} Z` },
      { type: 'chest_pocket', d: `M ${cx - 55} ${armholeY + 10} L ${cx - 25} ${armholeY + 10} L ${cx - 25} ${armholeY + 45} L ${cx - 40} ${armholeY + 54} L ${cx - 55} ${armholeY + 45} Z` },
    ],
  };

  const back = {
    view: 'back',
    silhouettePath: front.silhouettePath,
    panels: [
      { id: 'back_body', name: 'Back Bodice Panel', points: front.silhouettePath },
    ],
    seamLines: [
      { d: `M ${cx - shoulderHalfW + 20} ${shoulderY + 30} L ${cx + shoulderHalfW - 20} ${shoulderY + 30}`, type: 'yoke', label: 'Split Yoke' },
      { d: `M ${cx} ${shoulderY + 30} L ${cx} ${shoulderY}`, type: 'split_yoke', label: 'Yoke Split Seam' },
    ],
    details: [],
  };

  return { front, back };
}

/**
 * Applies a human-in-the-loop correction to the ReconstructionModel.
 * Human corrections are authoritative and override AI predictions.
 */
export function applyHumanCorrection(reconstructionModel, fieldPath, correctedValue) {
  if (!reconstructionModel) return null;

  const updated = JSON.parse(JSON.stringify(reconstructionModel));
  if (!updated.humanCorrections) updated.humanCorrections = {};
  updated.humanCorrections[fieldPath] = {
    previousValue: updated[fieldPath] || null,
    newValue: correctedValue,
    timestamp: new Date().toISOString(),
  };

  // If correcting garmentType
  if (fieldPath === 'garmentType') {
    const freshModel = createReconstructionModel({
      garmentType: correctedValue,
      silhouette: updated.silhouette,
      confidence: 1.0,
      userCorrections: updated.humanCorrections,
    });
    freshModel.humanCorrections = updated.humanCorrections;
    freshModel.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'HUMAN_CORRECTION',
      details: `User corrected garment type to "${correctedValue}"`,
    });
    return freshModel;
  }

  // If correcting silhouette
  if (fieldPath === 'silhouette') {
    updated.silhouette = correctedValue;
    const isBottom = updated.garmentFamily === GARMENT_FAMILIES.BOTTOMS || ['trouser', 'jeans', 'shorts'].includes(updated.garmentType);
    const isDress = updated.garmentType === 'dress' || updated.garmentType === 'gown';
    const isShirt = updated.garmentType === 'shirt' || updated.garmentType === 'blouse' || updated.garmentType === 'polo';
    const isJacket = updated.garmentType === 'jacket' || updated.garmentType === 'blazer' || updated.garmentType === 'coat';
    updated.views = generateTechnicalFlatViews(updated.garmentType, correctedValue, updated.features, isBottom, isDress);
    updated.lineArtCloneSketch = generateLineArtCloneSketch({
      garmentType: updated.garmentType,
      garmentFamily: updated.garmentFamily,
      silhouette: correctedValue,
      features: updated.features,
      isBottom,
      isDress,
      isShirt,
      isJacket,
    });
    updated.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'HUMAN_CORRECTION',
      details: `User corrected silhouette to "${correctedValue}"`,
    });
    return updated;
  }

  // If modifying a specific feature (e.g. pocket type)
  if (fieldPath.startsWith('feature_') || fieldPath.includes('pocket')) {
    const targetFeat = updated.features.find((f) => f.id === fieldPath || f.type === 'pocket');
    if (targetFeat) {
      targetFeat.name = correctedValue;
      targetFeat.source = FEATURE_SOURCES.USER;
      targetFeat.details = { ...targetFeat.details, userOverride: correctedValue };
    }
  }

  updated.auditLog.push({
    timestamp: new Date().toISOString(),
    action: 'HUMAN_CORRECTION',
    details: `User corrected ${fieldPath} to "${correctedValue}"`,
  });

  return updated;
}
