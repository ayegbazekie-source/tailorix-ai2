/**
 * TAILORIX AI — GARMENT EXTRACTION & RECONSTRUCTION ENGINE
 * 
 * Provides vector reconstruction and garment-to-pattern mapping utilities.
 * Generates clean black line-art vectors on pure white (#FFFFFF) background.
 */

import dressReplicaFlat from '../assets/images/dress_replica_flat_1790846898491.jpg';
import dressPiecesApart from '../assets/images/dress_pieces_apart_1790846926833.jpg';
import dressGhostMannequin from '../assets/images/dress_ghost_mannequin_1790848704251.jpg';
import trouserReplicaFlat from '../assets/images/trouser_replica_flat_1790846906465.jpg';
import trouserPiecesApart from '../assets/images/trouser_pieces_apart_1790846937324.jpg';
import trouserGhostMannequin from '../assets/images/trouser_ghost_mannequin_1790848716557.jpg';
import jacketReplicaFlat from '../assets/images/jacket_replica_flat_1790846916289.jpg';
import jacketPiecesApart from '../assets/images/jacket_pieces_apart_1790848921324.jpg';
import jacketGhostMannequin from '../assets/images/jacket_ghost_mannequin_1790848727611.jpg';
import { CAD_STYLE_CONFIG } from './cadStyleConfig.js';

// Preset high-fidelity reference clone sketches reflecting the exact visual quality standard
export const PRESET_CLONE_SKETCHES = {
  dress: dressReplicaFlat,
  gown: dressReplicaFlat,
  trouser: trouserReplicaFlat,
  trousers: trouserReplicaFlat,
  jeans: trouserReplicaFlat,
  pants: trouserReplicaFlat,
  slacks: trouserReplicaFlat,
  jacket: jacketReplicaFlat,
  blazer: jacketReplicaFlat,
  coat: jacketReplicaFlat,
  suit: jacketReplicaFlat,
  shirt: null,
  hoodie: null,
};

export const PRESET_GHOST_MANNEQUINS = {
  dress: dressGhostMannequin,
  gown: dressGhostMannequin,
  trouser: trouserGhostMannequin,
  trousers: trouserGhostMannequin,
  jeans: trouserGhostMannequin,
  jacket: jacketGhostMannequin,
  blazer: jacketGhostMannequin,
};

export const PRESET_SET_APART_PIECES = {
  dress: dressPiecesApart,
  gown: dressPiecesApart,
  trouser: trouserPiecesApart,
  trousers: trouserPiecesApart,
  jeans: trouserPiecesApart,
  pants: trouserPiecesApart,
  jacket: jacketPiecesApart,
  blazer: jacketPiecesApart,
  suit: jacketPiecesApart,
  coat: jacketPiecesApart,
};

/**
 * Checks if a pixel matches common human skin tone characteristics
 * in RGB space.
 */
function isSkinTone(r, g, b) {
  // Common skin tone ranges in digital photography
  const isSkinRGB =
    r > 95 &&
    g > 40 &&
    b > 20 &&
    r > g &&
    r > b &&
    r - g > 12 &&
    r - b > 15 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 15;

  return isSkinRGB;
}

/**
 * Extracts ONLY the garment (e.g. dress) from an uploaded image,
 * eliminating the model, background, head, limbs, and shadows,
 * then renders an authentic black line-art sketch on pure white (#FFFFFF).
 * 
 * @param {string} imageSrc - base64 string or image URL
 * @param {string} garmentType - 'dress' | 'trouser' | 'jacket' | etc.
 * @returns {Promise<{ sketchUrl: string, garmentBounds: object, structuralZones: object }>}
 */
export async function extractAndSketchGarment(imageSrc, garmentType = 'dress') {
  if (!imageSrc) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        const targetW = Math.min(origW, 800);
        const scale = targetW / origW;
        const targetH = Math.round(origH * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        ctx.drawImage(img, 0, 0, targetW, targetH);
        const imgData = ctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        // 1. Identify Background Color from image corners and top/bottom borders
        const cornerSamples = [];
        const samplePoints = [
          [5, 5],
          [targetW - 6, 5],
          [5, targetH - 6],
          [targetW - 6, targetH - 6],
          [Math.floor(targetW / 2), 5],
          [10, Math.floor(targetH / 2)],
          [targetW - 11, Math.floor(targetH / 2)],
        ];

        samplePoints.forEach(([sx, sy]) => {
          const idx = (sy * targetW + sx) * 4;
          cornerSamples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
        });

        const avgBg = cornerSamples.reduce(
          (acc, c) => ({ r: acc.r + c.r / cornerSamples.length, g: acc.g + c.g / cornerSamples.length, b: acc.b + c.b / cornerSamples.length }),
          { r: 0, g: 0, b: 0 }
        );

        function isBackgroundPixel(r, g, b) {
          const dist = Math.sqrt((r - avgBg.r) ** 2 + (g - avgBg.g) ** 2 + (b - avgBg.b) ** 2);
          // High luminance studio backgrounds
          const isStudioWhite = r > 235 && g > 235 && b > 235;
          const isStudioDark = r < 25 && g < 25 && b < 25;
          return dist < 35 || isStudioWhite || isStudioDark;
        }

        // 2. Build Garment Mask (Mask out background and skin tones)
        const mask = new Uint8Array(targetW * targetH);
        let minX = targetW,
          maxX = 0,
          minY = targetH,
          maxY = 0;

        // Anatomic vertical boundaries: Dress torso generally sits between y: 15% and 88%
        const isDressOrGown = garmentType.includes('dress') || garmentType.includes('gown');
        const topAnatomyExclusion = isDressOrGown ? targetH * 0.12 : targetH * 0.05; // Exclude head/face
        const bottomAnatomyExclusion = isDressOrGown ? targetH * 0.92 : targetH * 0.95; // Exclude shoes/feet

        for (let y = 0; y < targetH; y++) {
          for (let x = 0; x < targetW; x++) {
            const idx = (y * targetW + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Ignore head/face region and feet
            if (y < topAnatomyExclusion || y > bottomAnatomyExclusion) {
              mask[y * targetW + x] = 0;
              continue;
            }

            const isBg = isBackgroundPixel(r, g, b);
            const isSkin = isSkinTone(r, g, b);

            // Center torso prioritization: Dresses are located in the central 70% width of the frame
            const isHorizontalOutlier = x < targetW * 0.12 || x > targetW * 0.88;

            if (!isBg && !isSkin && !isHorizontalOutlier) {
              mask[y * targetW + x] = 1;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            } else {
              mask[y * targetW + x] = 0;
            }
          }
        }

        // Safety fallback if mask was overly strict
        if (maxX - minX < 40 || maxY - minY < 60) {
          minX = Math.round(targetW * 0.2);
          maxX = Math.round(targetW * 0.8);
          minY = Math.round(targetH * 0.15);
          maxY = Math.round(targetH * 0.85);
          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
              mask[y * targetW + x] = 1;
            }
          }
        }

        // Morphological cleaning: Remove single noise dots and fill tiny holes in the dress
        const cleanedMask = new Uint8Array(targetW * targetH);
        for (let y = 1; y < targetH - 1; y++) {
          for (let x = 1; x < targetW - 1; x++) {
            let neighborCount = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (mask[(y + dy) * targetW + (x + dx)] === 1) neighborCount++;
              }
            }
            // Retain if dense cluster
            cleanedMask[y * targetW + x] = neighborCount >= 4 ? 1 : 0;
          }
        }

        // 3. Extract Grayscale Luminance of Garment Fabric
        const gray = new Float32Array(targetW * targetH);
        for (let i = 0; i < data.length; i += 4) {
          const idx = i / 4;
          gray[idx] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }

        // 4. Output Canvas: Isolated Garment on Pure White Paper (#FFFFFF)
        const outCanvas = document.createElement('canvas');
        outCanvas.width = targetW;
        outCanvas.height = targetH;
        const outCtx = outCanvas.getContext('2d');
        const outImgData = outCtx.createImageData(targetW, targetH);
        const outData = outImgData.data;

        // Fill entire background pure white
        for (let i = 0; i < outData.length; i += 4) {
          outData[i] = 255;
          outData[i + 1] = 255;
          outData[i + 2] = 255;
          outData[i + 3] = 255;
        }

        // Sobel edge gradient for garment seams and outer silhouette
        const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

        for (let y = 2; y < targetH - 2; y++) {
          for (let x = 2; x < targetW - 2; x++) {
            const pIdx = (y * targetW + x) * 4;

            // ONLY process pixels within the extracted garment mask
            if (cleanedMask[y * targetW + x] === 1) {
              // Check if perimeter boundary pixel of the garment
              let isPerimeter = false;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (cleanedMask[(y + dy) * targetW + (x + dx)] === 0) {
                    isPerimeter = true;
                    break;
                  }
                }
                if (isPerimeter) break;
              }

              if (isPerimeter) {
                // Crisp black ink perimeter outline
                outData[pIdx] = 18;
                outData[pIdx + 1] = 20;
                outData[pIdx + 2] = 24;
                outData[pIdx + 3] = 255;
                continue;
              }

              // Internal tailoring seams & drapery lines
              let sumX = 0;
              let sumY = 0;
              let k = 0;

              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  const val = gray[(y + dy) * targetW + (x + dx)];
                  sumX += val * gx[k];
                  sumY += val * gy[k];
                  k++;
                }
              }

              const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);

              if (magnitude > 28) {
                const inkStrength = Math.min(255, (magnitude - 28) * 3.8);
                const inkTone = Math.max(22, 255 - inkStrength);
                outData[pIdx] = inkTone;
                outData[pIdx + 1] = inkTone;
                outData[pIdx + 2] = inkTone;
                outData[pIdx + 3] = 255;
              }
            }
          }
        }

        outCtx.putImageData(outImgData, 0, 0);

        // 5. Crop and Center the Extracted Dress onto standardized 3:4 drafting canvas
        const dressW = Math.max(10, maxX - minX);
        const dressH = Math.max(10, maxY - minY);
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = 600;
        cropCanvas.height = 800;
        const cropCtx = cropCanvas.getContext('2d');

        // Pure white drafting paper fill
        cropCtx.fillStyle = '#FFFFFF';
        cropCtx.fillRect(0, 0, 600, 800);

        // Fit dress into center with 40px margins
        const maxDrawW = 500;
        const maxDrawH = 700;
        const dressScale = Math.min(maxDrawW / dressW, maxDrawH / dressH);
        const drawW = dressW * dressScale;
        const drawH = dressH * dressScale;
        const drawX = (600 - drawW) / 2;
        const drawY = (800 - drawH) / 2;

        cropCtx.drawImage(outCanvas, minX, minY, dressW, dressH, drawX, drawY, drawW, drawH);

        const resultUrl = cropCanvas.toDataURL('image/png');

        resolve({
          sketchUrl: resultUrl,
          garmentBounds: { minX, minY, maxX, maxY, width: dressW, height: dressH },
          structuralZones: {
            bodice: { top: drawY, bottom: drawY + drawH * 0.42 },
            waist: { y: drawY + drawH * 0.42 },
            skirt: { top: drawY + drawH * 0.42, bottom: drawY + drawH },
          },
        });
      } catch (err) {
        console.warn('[Tailorix Garment Extractor] Extraction fallback:', err);
        resolve({
          sketchUrl: PRESET_CLONE_SKETCHES.dress,
          garmentBounds: null,
          structuralZones: null,
        });
      }
    };

    img.onerror = () => {
      resolve({
        sketchUrl: PRESET_CLONE_SKETCHES.dress,
        garmentBounds: null,
        structuralZones: null,
      });
    };

    img.src = imageSrc;
  });
}

/**
 * Legacy wrapper for backwards compatibility
 */
export async function generateCloneSketchFromImage(imageSrc, garmentType = 'dress') {
  const result = await extractAndSketchGarment(imageSrc, garmentType);
  return result?.sketchUrl || imageSrc;
}

/**
 * Structural traceability mapping between visual clone sketch elements
 * and physical pattern blueprint pieces.
 */
export function getCloneSketchPatternMapping(garmentType, extractedSpec = {}) {
  const gType = (garmentType || extractedSpec.garmentType || 'dress').toLowerCase();

  if (gType.includes('dress') || gType.includes('gown')) {
    return [
      {
        sketchFeatureId: 'neckline_sweetheart',
        sketchFeatureName: 'Sweetheart / Contour Neckline',
        patternPieceId: 'piece_dress_front_center',
        patternPieceName: 'Front Bodice Panel (Center on Fold)',
        section: 'BODICE',
        description: 'Forms the center front bodice contour and sculpted neckline curve.',
      },
      {
        sketchFeatureId: 'seam_princess_contour',
        sketchFeatureName: 'Princess Contour Seams (Left & Right)',
        patternPieceId: 'piece_dress_front_side',
        patternPieceName: 'Front Bodice Panel (Princess Side)',
        section: 'BODICE',
        description: 'Translates the bust-to-waist shaping curve into two tailored side panels.',
      },
      {
        sketchFeatureId: 'seam_cb_invisible_zip',
        sketchFeatureName: 'Center-Back Invisible Zipper Line',
        patternPieceId: 'piece_dress_back_center',
        patternPieceName: 'Back Bodice Panel (Center with Zip Allowance)',
        section: 'BODICE',
        description: 'Provides 1.0" center-back seam allowance for concealed zipper installation.',
      },
      {
        sketchFeatureId: 'seam_back_scye',
        sketchFeatureName: 'Back Scye & Lat Contour',
        patternPieceId: 'piece_dress_back_side',
        patternPieceName: 'Back Bodice Side Panel (Cut 2)',
        section: 'BODICE',
        description: 'Underarm armscye support curve providing back torso shaping.',
      },
      {
        sketchFeatureId: 'seam_natural_waist',
        sketchFeatureName: 'Natural Waistline Seam',
        patternPieceId: 'piece_dress_skirt_front',
        patternPieceName: 'Front Skirt Panel (on Fold)',
        section: 'SKIRT',
        description: 'Joins upper bodice sculpt to flowing lower-body skirt drape.',
      },
      {
        sketchFeatureId: 'seam_skirt_walking_vent',
        sketchFeatureName: 'Center Back Walking Vent / Slit',
        patternPieceId: 'piece_dress_skirt_back',
        patternPieceName: 'Back Skirt Panel (with Vent Allowance)',
        section: 'SKIRT',
        description: 'Engineers walking ease with reinforced vent overlap extensions.',
      },
      {
        sketchFeatureId: 'seam_facings',
        sketchFeatureName: 'Neckline & Armhole Clean Finishes',
        patternPieceId: 'piece_dress_facing',
        patternPieceName: 'Contoured Neckline & Armhole Facing Strips',
        section: 'FACINGS',
        description: 'Provides clean-finished bias interior facings with stay-stitch lines.',
      },
    ];
  }

  if (gType.includes('trouser') || gType.includes('pant') || gType.includes('jean')) {
    return [
      {
        sketchFeatureId: 'seam_front_crease',
        sketchFeatureName: 'Center Pressed Crease & Pleats',
        patternPieceId: 'piece_trouser_front_leg',
        patternPieceName: 'Front Trouser Leg Panel',
        section: 'LEGS',
        description: 'Establishes plumb grainline and double forward pleat suppression.',
      },
      {
        sketchFeatureId: 'seam_back_seat_rise',
        sketchFeatureName: 'Back Rise & Seat Curve',
        patternPieceId: 'piece_trouser_back_leg',
        patternPieceName: 'Back Trouser Leg Panel',
        section: 'LEGS',
        description: 'Accommodates anatomical pelvic curvature and inseam stretch compensation.',
      },
      {
        sketchFeatureId: 'seam_contoured_waistband',
        sketchFeatureName: 'Contoured Split-Back Waistband',
        patternPieceId: 'piece_trouser_waistband',
        patternPieceName: 'Split-Back Contoured Waistband Curtain',
        section: 'WAISTBAND',
        description: 'Drafted with anatomical curvature and fly extension tab.',
      },
      {
        sketchFeatureId: 'seam_fly_j_stitch',
        sketchFeatureName: 'Concealed Zipper Fly Shield',
        patternPieceId: 'piece_trouser_fly_shield',
        patternPieceName: 'Zipper Fly Guard & French Facing',
        section: 'FLY',
        description: 'Precision fly shield protecting zipper teeth from direct skin contact.',
      },
      {
        sketchFeatureId: 'seam_side_slant_pocket',
        sketchFeatureName: 'Front Slant Pocket Opening',
        patternPieceId: 'piece_trouser_pocket_facing',
        patternPieceName: 'Slant Pocket Facing & Stay Bag',
        section: 'POCKETS',
        description: 'Reinforces front pocket bearer and clean interior pocket bag.',
      },
    ];
  }

  if (gType.includes('hoodie') || gType.includes('sweatshirt')) {
    return [
      {
        sketchFeatureId: 'seam_hood_crown',
        sketchFeatureName: 'Two-Piece Hood Crown & Neckline',
        patternPieceId: 'piece_hood_side',
        patternPieceName: 'Two-Piece Hood Side Panel',
        section: 'HOOD',
        description: 'Anatomically curved hood side panels with drawstring channel allowance.',
      },
      {
        sketchFeatureId: 'seam_kangaroo_pocket',
        sketchFeatureName: 'Curved Kangaroo Hand-Warmer Pocket',
        patternPieceId: 'piece_kangaroo_pocket',
        patternPieceName: 'Front Kangaroo Pocket (Cut 1 on Fold)',
        section: 'POCKETS',
        description: 'Double-entry patch pocket with bar-tack reinforcements and clean turned hem.',
      },
      {
        sketchFeatureId: 'seam_body_front',
        sketchFeatureName: 'Front Body Torso Panel',
        patternPieceId: 'piece_hoodie_front',
        patternPieceName: 'Front Body Panel (Cut 1 on Fold)',
        section: 'BODY',
        description: 'Drop-shoulder relaxed torso panel with front neckline depth curve.',
      },
      {
        sketchFeatureId: 'seam_body_back',
        sketchFeatureName: 'Back Body Torso Panel',
        patternPieceId: 'piece_hoodie_back',
        patternPieceName: 'Back Body Panel (Cut 1 on Fold)',
        section: 'BODY',
        description: 'Straight back balance line with high neck curvature.',
      },
      {
        sketchFeatureId: 'seam_sleeve_scye',
        sketchFeatureName: 'Ergonomic Sleeve Joint',
        patternPieceId: 'piece_hoodie_sleeve',
        patternPieceName: 'Sleeve Panel (Cut 2 Self)',
        section: 'SLEEVE',
        description: 'Graduated bicep-to-wrist sleeve curve drafted for fleece comfort.',
      },
      {
        sketchFeatureId: 'seam_rib_hem',
        sketchFeatureName: '2x2 Ribbed Hem & Cuff Bands',
        patternPieceId: 'piece_rib_hem',
        patternPieceName: 'Ribbed Waistband & Sleeve Cuffs',
        section: 'RIBBING',
        description: 'Elasticized tubular rib knit providing negative ease retention.',
      },
    ];
  }

  if (gType.includes('shirt') || gType.includes('blouse') || gType.includes('polo')) {
    return [
      {
        sketchFeatureId: 'seam_collar_stand',
        sketchFeatureName: 'Two-Piece Collar Leaf & Stand',
        patternPieceId: 'piece_shirt_collar_leaf',
        patternPieceName: 'Collar Leaf & Contoured Stand (Cut 2)',
        section: 'COLLAR',
        description: 'Two-piece tailored collar with calibrated roll line curve and neckband stand.',
      },
      {
        sketchFeatureId: 'seam_front_placket',
        sketchFeatureName: 'Front Button Placket Fold',
        patternPieceId: 'piece_shirt_front_l',
        patternPieceName: 'Left & Right Front Bodice with Fold Placket',
        section: 'BODICE',
        description: 'Torso front with 1.25" center front fold-over box placket.',
      },
      {
        sketchFeatureId: 'seam_shoulder_yoke',
        sketchFeatureName: 'Back Shoulder Yoke Seam',
        patternPieceId: 'piece_shirt_yoke',
        patternPieceName: 'Split / Single Back Shoulder Yoke',
        section: 'YOKE',
        description: 'Double-ply shoulder yoke stabilizing upper back and posture balance.',
      },
      {
        sketchFeatureId: 'seam_set_in_sleeve',
        sketchFeatureName: 'Set-In Sleeve Armscye Curve',
        patternPieceId: 'piece_shirt_sleeve',
        patternPieceName: 'Set-In Sleeve with Cap Ease Notches',
        section: 'SLEEVE',
        description: 'Single-piece sleeve drafted with bell cap curve and underarm balance.',
      },
      {
        sketchFeatureId: 'seam_barrel_cuff',
        sketchFeatureName: 'Sleeve Placket & Barrel Cuffs',
        patternPieceId: 'piece_shirt_cuff',
        patternPieceName: 'Rounded Barrel Cuffs (Cut 2 Self + 2 Interfacing)',
        section: 'CUFFS',
        description: 'Curved edge 2.5" wrist cuff with buttonhole and gauntlet placket.',
      },
    ];
  }

  if (gType.includes('jacket') || gType.includes('blazer') || gType.includes('coat')) {
    return [
      {
        sketchFeatureId: 'seam_notch_lapel',
        sketchFeatureName: 'Notch Lapel Roll Line & Collar',
        patternPieceId: 'piece_jacket_collar',
        patternPieceName: 'Undercollar (Bias) & Top Collar Facing',
        section: 'COLLAR',
        description: 'Pad-stitched tailored collar with rever break line.',
      },
      {
        sketchFeatureId: 'seam_front_canvas',
        sketchFeatureName: 'Front Canvas & Chest Dart',
        patternPieceId: 'piece_jacket_front',
        patternPieceName: 'Structured Front Jacket Canvas',
        section: 'BODY',
        description: 'Front panel with waist dart suppression and chest welt pocket placement.',
      },
      {
        sketchFeatureId: 'seam_side_body',
        sketchFeatureName: 'Side Body Panel',
        patternPieceId: 'piece_jacket_side',
        patternPieceName: 'Side Body Panel (Cut 2)',
        section: 'BODY',
        description: 'Suppresses waist contour and establishes modern architectural fit.',
      },
      {
        sketchFeatureId: 'seam_two_piece_sleeve',
        sketchFeatureName: 'Two-Piece Sleeve Curve',
        patternPieceId: 'piece_jacket_sleeve_top',
        patternPieceName: 'Upper & Under Sleeve Panels (Pair)',
        section: 'SLEEVE',
        description: 'Classic bespoke two-piece sleeve with natural forward arm pitch.',
      },
      {
        sketchFeatureId: 'seam_center_back_vent',
        sketchFeatureName: 'Center Back Seam & Vent',
        patternPieceId: 'piece_jacket_back',
        patternPieceName: 'Back Panels with Overlap Vent Extension',
        section: 'BACK',
        description: 'Provides walking comfort with structured vent underlap.',
      },
    ];
  }

  return [
    {
      sketchFeatureId: 'seam_primary_body',
      sketchFeatureName: 'Primary Silhouette Contour',
      patternPieceId: 'piece_front_panel',
      patternPieceName: 'Front Master Panel',
      section: 'SHELL',
      description: 'Main shell pattern piece representing the front profile.',
    },
  ];
}

/**
 * Generates an SVG data URL for a single pattern piece, rendering authentic
 * tailoring drafting elements:
 * - Solid perimeter cutting line (2.2px #0F172A)
 * - Inward offset dashed seam allowance stitching guide (1.2px #475569, 4 2.5)
 * - Lengthwise grainline arrow with bidirectional heads & label
 * - Balance notches (crimson balance ticks)
 * - Place on Fold symbol and bracket if piece is cut on fold
 * - Internal darts with apex markers, roll lines, and placement lines
 * - Authentic pattern cutter identification stamp
 */
export function getPieceIllustrationDataUrl(piece, garmentType = 'dress') {
  if (!piece) return null;
  const b = piece.bounds || { minX: 0, minY: 0, width: 80, height: 100 };
  const pad = 24;
  const vbX = (b.minX || 0) - pad;
  const vbY = (b.minY || 0) - pad;
  const vbW = Math.max(90, (b.width || 80) + pad * 2);
  const vbH = Math.max(90, (b.height || 100) + pad * 2);

  const centerX = (b.minX || 0) + (b.width || 80) / 2;
  const centerY = (b.minY || 0) + (b.height || 100) / 2;

  const outline = piece.outline || `M 10 10 L 90 10 L 90 110 L 10 110 Z`;
  const seamAllowanceOutline = piece.seamAllowanceOutline || null;

  // 1. Lengthwise Grainline with bidirectional arrow heads
  let grainlineSvg = '';
  if (piece.grainline !== false) {
    const gl = piece.grainline || {};
    const gx1 = gl.x1 ?? (centerX - 6);
    const gy1 = gl.y1 ?? ((b.minY || 0) + 18);
    const gx2 = gl.x2 ?? (centerX - 6);
    const gy2 = gl.y2 ?? ((b.minY || 0) + (b.height || 100) - 18);
    const gMidX = (gx1 + gx2) / 2;
    const gMidY = (gy1 + gy2) / 2;

    const angle = Math.atan2(gy2 - gy1, gx2 - gx1) * (180 / Math.PI);

    grainlineSvg = `
      <g class="grainline" stroke="#B45309" stroke-width="1.6">
        <line x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}" stroke-linecap="round" />
        <!-- Top Arrowhead -->
        <polygon points="${gx1},${gy1} ${gx1 - 3.5},${gy1 + 8} ${gx1 + 3.5},${gy1 + 8}" fill="#B45309" stroke="none" />
        <!-- Bottom Arrowhead -->
        <polygon points="${gx2},${gy2} ${gx2 - 3.5},${gy2 - 8} ${gx2 + 3.5},${gy2 - 8}" fill="#B45309" stroke="none" />
      </g>
      <text x="${gMidX + 6}" y="${gMidY + 3}" fill="#B45309" font-size="7.5" font-family="monospace" font-weight="700" letter-spacing="0.8" transform="rotate(${angle - 90}, ${gMidX}, ${gMidY})">
        ${gl.label || '◄ LENGTHWISE GRAIN ►'}
      </text>
    `;
  }

  // 2. Fold Marking (Place on Fold double bracket and arrow)
  let foldSvg = '';
  if (piece.onFold) {
    const foldX = (b.minX || 10) + 3;
    const foldY1 = (b.minY || 10) + 22;
    const foldY2 = (b.minY || 10) + (b.height || 100) - 22;
    const foldMidY = (foldY1 + foldY2) / 2;

    foldSvg = `
      <g class="fold-line" stroke="#0F172A" stroke-width="1.5">
        <!-- Fold bracket line -->
        <line x1="${foldX + 10}" y1="${foldY1}" x2="${foldX + 10}" y2="${foldY2}" stroke-dasharray="6 3" />
        <!-- Top bracket arrow -->
        <line x1="${foldX + 10}" y1="${foldY1}" x2="${foldX}" y2="${foldY1}" />
        <polygon points="${foldX},${foldY1} ${foldX + 6},${foldY1 - 3.5} ${foldX + 6},${foldY1 + 3.5}" fill="#0F172A" />
        <!-- Bottom bracket arrow -->
        <line x1="${foldX + 10}" y1="${foldY2}" x2="${foldX}" y2="${foldY2}" />
        <polygon points="${foldX},${foldY2} ${foldX + 6},${foldY2 - 3.5} ${foldX + 6},${foldY2 + 3.5}" fill="#0F172A" />
        <!-- Fold Label -->
        <text x="${foldX + 15}" y="${foldMidY}" fill="#0F172A" font-size="7.5" font-family="monospace" font-weight="bold" transform="rotate(-90, ${foldX + 15}, ${foldMidY})" text-anchor="middle">
          ◄ PLACE ON FOLD ►
        </text>
      </g>
    `;
  }

  // 3. Balance Notches (Perpendicular crimson ticks)
  const notchesSvg = (piece.notches || []).map((n) => {
    const nx = n.x ?? centerX;
    const ny = n.y ?? (b.minY || 0);
    const isDouble = n.type === 'double' || (n.label || '').toLowerCase().includes('double');
    const notchStroke = CAD_STYLE_CONFIG.balanceNotch.singleStroke;
    const notchW = CAD_STYLE_CONFIG.balanceNotch.strokeWidth;
    if (isDouble) {
      return `
        <g class="notch double-notch">
          <line x1="${nx - 6}" y1="${ny - 2}" x2="${nx + 6}" y2="${ny - 2}" stroke="${notchStroke}" stroke-width="${notchW}" stroke-linecap="round" />
          <line x1="${nx - 6}" y1="${ny + 2}" x2="${nx + 6}" y2="${ny + 2}" stroke="${notchStroke}" stroke-width="${notchW}" stroke-linecap="round" />
        </g>
      `;
    }
    return `
      <g class="notch">
        <line x1="${nx - 5}" y1="${ny}" x2="${nx + 5}" y2="${ny}" stroke="${notchStroke}" stroke-width="${notchW}" stroke-linecap="round" />
        <line x1="${nx}" y1="${ny - 5}" x2="${nx}" y2="${ny + 5}" stroke="${notchStroke}" stroke-width="${notchW}" stroke-linecap="round" />
      </g>
    `;
  }).join('');

  // 4. Internal Construction Lines (Darts, pleats, roll lines, pocket placement)
  const internalLines = piece.constructionLines || piece.internalLines || [];
  const internalsSvg = internalLines.map((line) => {
    const isDart = line.type === 'dart' || (line.label || '').toLowerCase().includes('dart');
    const isFold = line.type === 'fold' || (line.label || '').toLowerCase().includes('fold');
    const isRoll = line.type === 'roll_line' || (line.label || '').toLowerCase().includes('roll');
    const isCrease = line.type === 'crease' || (line.label || '').toLowerCase().includes('crease');
    const strokeColor = isDart ? CAD_STYLE_CONFIG.dart.stroke : isRoll ? '#0284C7' : isCrease ? CAD_STYLE_CONFIG.creaseAndPleat.stroke : CAD_STYLE_CONFIG.primarySeam.stroke;
    const strokeW = isDart ? CAD_STYLE_CONFIG.dart.strokeWidth : isCrease ? CAD_STYLE_CONFIG.creaseAndPleat.strokeWidth : CAD_STYLE_CONFIG.primarySeam.strokeWidth;
    const dash = isDart ? 'none' : isFold ? CAD_STYLE_CONFIG.centerFold.strokeDasharray : isRoll ? '4 2' : isCrease ? CAD_STYLE_CONFIG.creaseAndPleat.strokeDasharray : CAD_STYLE_CONFIG.topstitching.strokeDasharray;

    // Apex circle coords for darts
    const match = line.d ? line.d.match(/L\s*([\d.-]+)\s+([\d.-]+)/) : null;
    const apexX = match ? match[1] : centerX;
    const apexY = match ? match[2] : centerY;

    return `
      <g class="internal-line">
        <path d="${line.d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" stroke-dasharray="${dash}" stroke-linecap="round" />
        ${isDart ? `<circle cx="${apexX}" cy="${apexY}" r="${CAD_STYLE_CONFIG.dart.apexCircle.r}" fill="${CAD_STYLE_CONFIG.dart.apexCircle.fill}" stroke="${CAD_STYLE_CONFIG.dart.apexCircle.stroke}" stroke-width="${CAD_STYLE_CONFIG.dart.apexCircle.strokeWidth}" />` : ''}
      </g>
    `;
  }).join('');

  // 5. Pattern Stamp Label Box
  const pieceName = (piece.name || 'Pattern Piece').toUpperCase();
  const cutLabel = (piece.cutQuantityLabel || (piece.onFold ? 'CUT 1 ON FOLD' : `CUT ${piece.cutQuantity || 2} SELF`)).toUpperCase();
  const stampY = Math.max((b.minY || 0) + 32, Math.min((b.minY || 0) + (b.height || 100) - 30, centerY));

  const stampSvg = `
    <g class="pattern-stamp" text-anchor="middle" pointer-events="none">
      <rect x="${centerX - 52}" y="${stampY - 16}" width="104" height="32" fill="#FAF8F5" fill-opacity="0.92" rx="4" stroke="#CBD5E1" stroke-width="1.0" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))" />
      <text x="${centerX}" y="${stampY - 5}" fill="#0F172A" font-size="8.0" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="0.3">
        ${pieceName.length > 22 ? pieceName.substring(0, 20) + '...' : pieceName}
      </text>
      <text x="${centerX}" y="${stampY + 5}" fill="#B45309" font-size="7.0" font-family="monospace" font-weight="700">
        ${cutLabel}
      </text>
      <text x="${centerX}" y="${stampY + 13}" fill="#64748B" font-size="6.0" font-family="system-ui, sans-serif" font-weight="600">
        0.5" (1.27 CM) SEAM ALLOWANCE
      </text>
    </g>
  `;

  // 6. Inset Seam Allowance Stitching Line
  // If piece has custom seam allowance outline, use it; otherwise scale outline slightly inward towards center
  const saLineSvg = seamAllowanceOutline
    ? `<path d="${seamAllowanceOutline}" fill="none" stroke="${CAD_STYLE_CONFIG.seamAllowanceGuide.stroke}" stroke-width="${CAD_STYLE_CONFIG.seamAllowanceGuide.strokeWidth}" stroke-dasharray="${CAD_STYLE_CONFIG.seamAllowanceGuide.strokeDasharray}" stroke-linecap="round" stroke-linejoin="round" />`
    : `<g transform="translate(${centerX * (1 - CAD_STYLE_CONFIG.seamAllowanceGuide.insetRatio)}, ${centerY * (1 - CAD_STYLE_CONFIG.seamAllowanceGuide.insetRatio)}) scale(${CAD_STYLE_CONFIG.seamAllowanceGuide.insetRatio})">
         <path d="${outline}" fill="none" stroke="${CAD_STYLE_CONFIG.seamAllowanceGuide.stroke}" stroke-width="${CAD_STYLE_CONFIG.seamAllowanceGuide.strokeWidth}" stroke-dasharray="${CAD_STYLE_CONFIG.seamAllowanceGuide.strokeDasharray}" stroke-linecap="round" stroke-linejoin="round" />
       </g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">
    <defs>
      <pattern id="grid_${piece.id || 'p'}" width="${CAD_STYLE_CONFIG.canvas.gridSize}" height="${CAD_STYLE_CONFIG.canvas.gridSize}" patternUnits="userSpaceOnUse">
        <path d="M ${CAD_STYLE_CONFIG.canvas.gridSize} 0 L 0 0 0 ${CAD_STYLE_CONFIG.canvas.gridSize}" fill="none" stroke="${CAD_STYLE_CONFIG.canvas.gridStroke}" stroke-width="${CAD_STYLE_CONFIG.canvas.gridWidth}" opacity="0.75" />
      </pattern>
      <filter id="pieceShadow_${piece.id || 'p'}" x="-3%" y="-3%" width="106%" height="106%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.07" />
      </filter>
    </defs>
    <!-- Drafting Paper Foundation -->
    <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="${CAD_STYLE_CONFIG.canvas.vellumColor}" />
    <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="url(#grid_${piece.id || 'p'})" />

    <!-- Cutting Perimeter & Seam Allowance Guide -->
    <!-- Solid Vellum Piece Base -->
    <path d="${outline}" fill="#FFFFFF" filter="url(#pieceShadow_${piece.id || 'p'})" />

    <!-- Inward Inset Seam Allowance Stitching Line (Dashed Slate 0.5" Guide) -->
    ${saLineSvg}

    <!-- Solid Outer Cutting Edge Perimeter (Bold Obsidian Standardized) -->
    <path d="${outline}" fill="none" stroke="${CAD_STYLE_CONFIG.outerSilhouette.stroke}" stroke-width="${CAD_STYLE_CONFIG.outerSilhouette.strokeWidth}" stroke-linecap="${CAD_STYLE_CONFIG.outerSilhouette.strokeLinecap}" stroke-linejoin="${CAD_STYLE_CONFIG.outerSilhouette.strokeLinejoin}" />

    <!-- Internals & Darts -->
    ${internalsSvg}

    <!-- Grainline Arrow -->
    ${grainlineSvg}

    <!-- Place on Fold -->
    ${foldSvg}

    <!-- Balance Notches -->
    ${notchesSvg}

    <!-- Pattern Cutter Stamp -->
    ${stampSvg}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
