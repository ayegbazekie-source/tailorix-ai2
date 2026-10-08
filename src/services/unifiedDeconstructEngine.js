/**
 * TAILORIX AI — UNIFIED DECONSTRUCT ENGINE
 * 
 * Harmonizes visual deconstruction, CAD technical flats, and structural
 * pattern blueprint generation across all garment categories.
 * 
 * Enforces strict garment taxonomy:
 * DRESS ≠ TROUSER ≠ SHIRT ≠ HOODIE ≠ JACKET ≠ SKIRT
 * Each garment strictly produces its own anatomical silhouettes, bodice, and parts.
 */

import { generateLineArtCloneSketch } from '../models/reconstructionModel.js';
import { generatePatternBlueprint } from '../models/patternBlueprint.js';

export function buildHarmonizedDeconstructModel({ spec = {}, reconstruction = null, options = {} } = {}) {
  // If called from inside generatePatternBlueprint without external blueprint, return null to avoid recursion
  if (options?.skipHarmonized || spec?._inBlueprintDrafting) {
    return null;
  }

  const rawType = String(
    spec.identity?.garmentType ||
    spec.garmentType ||
    spec.category ||
    reconstruction?.garmentType ||
    reconstruction?.identity?.garmentType ||
    'trouser'
  ).toLowerCase().trim();

  let garmentType = 'trouser';
  let category = 'bottoms';
  let isBottom = true;
  let isDress = false;
  let isShirt = false;
  let isJacket = false;
  let isHoodie = false;
  let isSkirt = false;

  if (rawType.includes('dress_shirt') || rawType.includes('dress shirt') || rawType.includes('button_down') || rawType.includes('oxford_shirt')) {
    garmentType = 'shirt';
    category = 'tops';
    isShirt = true;
    isBottom = false;
  } else if (rawType.includes('shirt_dress') || rawType.includes('shirt dress') || rawType.includes('slip_dress') || rawType.includes('wrap_dress')) {
    garmentType = 'dress';
    category = 'dresses';
    isDress = true;
    isBottom = false;
  } else if (rawType.includes('dress_pant') || rawType.includes('dress pant') || rawType.includes('dress_trouser') || rawType.includes('dress trouser')) {
    garmentType = 'trouser';
    category = 'bottoms';
    isBottom = true;
  } else if (rawType.includes('hoodie') || rawType.includes('sweatshirt')) {
    garmentType = 'hoodie';
    category = 'hoodies_sweatshirts';
    isHoodie = true;
    isBottom = false;
  } else if (rawType.includes('dress') || rawType.includes('gown')) {
    garmentType = 'dress';
    category = 'dresses';
    isDress = true;
    isBottom = false;
  } else if (rawType.includes('shirt') || rawType.includes('blouse') || rawType.includes('polo')) {
    garmentType = 'shirt';
    category = 'tops';
    isShirt = true;
    isBottom = false;
  } else if (rawType.includes('jacket') || rawType.includes('blazer') || rawType.includes('coat')) {
    garmentType = 'jacket';
    category = 'outerwear';
    isJacket = true;
    isBottom = false;
  } else if (rawType.includes('skirt')) {
    garmentType = 'skirt';
    category = 'skirts';
    isSkirt = true;
    isBottom = false;
  } else if (rawType.includes('jean') || rawType.includes('denim')) {
    garmentType = 'jeans';
    category = 'bottoms';
    isBottom = true;
  } else if (rawType.includes('short')) {
    garmentType = 'shorts';
    category = 'bottoms';
    isBottom = true;
  } else if (rawType.includes('trouser') || rawType.includes('pant') || rawType.includes('slack')) {
    garmentType = 'trouser';
    category = 'bottoms';
    isBottom = true;
  }

  const rawSilhouette = String(
    spec.silhouette?.primary ||
    spec.silhouette ||
    reconstruction?.silhouette ||
    (isDress ? 'a_line' : isJacket ? 'single_breasted' : isShirt ? 'tailored_fit' : isHoodie ? 'relaxed_fleece' : isSkirt ? 'pencil' : 'straight')
  ).toLowerCase().trim();

  // Generate authoritative technical flat line-art sketch
  let technicalFlat;
  try {
    technicalFlat = generateLineArtCloneSketch({
      garmentType,
      garmentFamily: category,
      silhouette: rawSilhouette,
      spec,
      isBottom,
      isDress,
      isShirt,
      isJacket,
      isHoodie,
      isSkirt,
    });
  } catch (err) {
    console.warn('[unifiedDeconstructEngine] Error generating technical flat:', err);
    technicalFlat = {
      style: 'technical_line_art_sketch',
      garmentSpecific: true,
      backgroundColor: '#FFFFFF',
      whatTailorixSees: `Tailorix reconstructed this bespoke ${garmentType} visual clone.`,
      silhouetteType: rawSilhouette,
      garmentCategory: category,
      garmentType,
      front: { outlinePath: '', seams: [], darts: [], details: [] },
      back: { outlinePath: '', seams: [], darts: [], details: [] },
    };
  }

  // Generate pattern blueprint pieces avoiding recursive call
  let blueprint = null;
  try {
    const draftSpec = {
      ...spec,
      garmentType,
      category,
      silhouette: { primary: rawSilhouette },
      _inBlueprintDrafting: true,
    };
    blueprint = generatePatternBlueprint(draftSpec, technicalFlat, { skipHarmonized: true });
  } catch (err) {
    console.warn('[unifiedDeconstructEngine] Error generating pattern blueprint:', err);
  }

  const pieces = blueprint?.pieces || [];

  return {
    garmentType,
    category,
    silhouette: rawSilhouette,
    technicalFlat,
    blueprint: {
      pieces,
      cutSheet: blueprint?.cutSheet || {
        width: 1800,
        height: 950,
        fabricWidthInches: 60,
        yardage: isDress ? 3.2 : isJacket ? 2.8 : isBottom ? 2.2 : 1.8,
        unit: 'inches',
      },
    },
  };
}

export default {
  buildHarmonizedDeconstructModel,
};
