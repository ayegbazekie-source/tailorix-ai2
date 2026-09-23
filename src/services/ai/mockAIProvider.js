/**
 * TAILORIX AI — DETERMINISTIC MOCK AI PROVIDER
 * 
 * Provides robust, controlled test cases simulating computer vision & silhouette extraction.
 * Used for pipeline testing and verification before OpenAI integration.
 */

import { AIProvider } from './AIProvider';
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
} from '../../models/garmentSpecification';

export class MockAIProvider extends AIProvider {
  constructor() {
    super('MockAIProvider');
  }

  async analyzeGarment(input, options = {}) {
    // Artificial slight tick for async realism if needed
    const rawHint = [
      options.garmentType,
      options.typeHint,
      options.manualType,
      options.filename,
      typeof input === 'string' ? input : '',
      Array.isArray(input) ? input.map((i) => `${i.name || ''} ${i.role || ''} ${i.id || ''}`).join(' ') : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const sourceImages = Array.isArray(input)
      ? input.map((i, idx) => i.id || `img_${idx + 1}`)
      : ['img_ref_01'];

    // 1. Unknown / Ambiguous Garment Test Case
    if (rawHint.includes('unknown') || rawHint.includes('ambiguous') || rawHint.includes('abstract') || options.forceUnknown) {
      return {
        success: true,
        specification: createGarmentSpecification({
          garmentType: 'unknown',
          name: 'Unresolved Reference Image',
          confidence: {
            overall: 0.22,
            identity: 0.15,
          },
          status: SPEC_STATUS.NEEDS_REVIEW,
          uncertainties: options.uncertainties || [
            {
              field: 'identity.garmentType',
              state: CONFIDENCE_STATES.UNCERTAIN,
              confidence: 0.15,
              reason: 'Silhouettes are occluded or non-standard apparel geometry was detected.',
              candidates: ['shirt', 'dress', 'jacket'],
            },
          ],
        }),
        observations: [
          'Multiple intersecting lines detected without recognizable collar or waist geometry.',
          'Drape boundary ambiguous.',
        ],
        confidence: 0.22,
        uncertainties: options.uncertainties || [
          {
            field: 'identity.garmentType',
            state: CONFIDENCE_STATES.UNCERTAIN,
            confidence: 0.15,
            candidates: ['shirt', 'dress', 'jacket'],
          },
        ],
        questionsForUser: options.questionsForUser || [
          {
            field: 'identity.garmentType',
            question: 'Is this intended as a jacket or a dress foundation?',
            options: ['jacket', 'dress'],
          },
        ],
        sourceImages,
      };
    }

    // 2. Raglan Shirt Test Case
    if (rawHint.includes('raglan')) {
      const spec = createGarmentSpecification({
        name: 'Raglan Athletic Long-Sleeve Shirt',
        garmentType: 'shirt',
        silhouette: 'tailored_fit',
        sleeve: createSleeveComponent({
          type: 'raglan',
          length: 'full',
          construction: 'raglan_split',
          confidence: createConfidenceValue('raglan', 0.94, CONFIDENCE_STATES.INFERRED, 'vision_feature_extractor'),
        }),
        collar: createCollarComponent({ type: 'band' }),
        neckline: createNecklineComponent({ type: 'crew' }),
        confidence: { overall: 0.93, identity: 0.96 },
        status: SPEC_STATUS.NEEDS_REVIEW,
      });

      return {
        success: true,
        specification: spec,
        observations: [
          'Diagonal seam running from neckline down to underarm detected (Raglan construction).',
          'Two-tone contrast raglan sleeve configuration.',
        ],
        confidence: 0.93,
        uncertainties: [],
        sourceImages,
      };
    }

    // 3. Tailored Jacket Test Case
    if (rawHint.includes('jacket') || rawHint.includes('blazer') || rawHint.includes('suit')) {
      const spec = createGarmentSpecification({
        name: 'Savile Row Tailored Blazer',
        garmentType: 'jacket',
        silhouette: 'single_breasted',
        sleeve: createSleeveComponent({ type: 'two-piece', construction: 'two-piece' }),
        collar: createCollarComponent({ type: 'notch_lapel', stand: 1.5, fall: 2.5 }),
        pockets: [
          createPocketComponent({ type: 'welt', placement: 'breast_left' }),
          createPocketComponent({ type: 'flap', placement: 'front_waist' }),
        ],
        confidence: { overall: 0.95, identity: 0.96 },
        status: SPEC_STATUS.NEEDS_REVIEW,
      });

      return {
        success: true,
        specification: spec,
        observations: [
          'Notched lapel gorge line clearly visible with pressed roll line.',
          'Two-piece ergonomic sleeve curve detected.',
        ],
        confidence: 0.95,
        uncertainties: [],
        sourceImages,
      };
    }

    // 4. Jeans (5-Pocket Denim) Test Case
    if (rawHint.includes('jean') || rawHint.includes('denim')) {
      const spec = createGarmentSpecification({
        name: '5-Pocket Straight Denim Jeans',
        garmentType: 'jeans',
        silhouette: 'straight',
        waistband: createWaistbandComponent({ type: 'contour' }),
        pockets: [
          createPocketComponent({ type: 'patch', placement: 'back_hip' }),
          createPocketComponent({ type: 'coin', placement: 'front_pocket' }),
        ],
        confidence: { overall: 0.96, identity: 0.97 },
        status: SPEC_STATUS.NEEDS_REVIEW,
      });

      return {
        success: true,
        specification: spec,
        observations: [
          'Back V-yoke seam visible across sacral line.',
          'Five-pocket riveted configuration extracted.',
        ],
        confidence: 0.96,
        uncertainties: [],
        sourceImages,
      };
    }

    // 5. Fitted Dress Test Case
    if (rawHint.includes('dress') || rawHint.includes('sheath')) {
      const spec = createGarmentSpecification({
        name: 'Tailored Sheath Day Dress',
        garmentType: 'dress',
        silhouette: 'sheath_fitted',
        sleeve: createSleeveComponent({ type: 'cap', length: 'cap' }),
        neckline: createNecklineComponent({ type: 'boat' }),
        confidence: { overall: 0.94, identity: 0.95 },
        status: SPEC_STATUS.NEEDS_REVIEW,
      });

      return {
        success: true,
        specification: spec,
        observations: [
          'Fitted torso contour with integrated waist-to-hip darts.',
          'Horizontal boat neckline extending to shoulder apex.',
        ],
        confidence: 0.94,
        uncertainties: [],
        sourceImages,
      };
    }

    // 6. Gown Test Case
    if (rawHint.includes('gown') || rawHint.includes('evening')) {
      const spec = createGarmentSpecification({
        name: 'Couture Column Sweetheart Evening Gown',
        garmentType: 'gown',
        silhouette: 'column_sheath',
        neckline: createNecklineComponent({ type: 'sweetheart' }),
        sleeve: createSleeveComponent({ type: 'sleeveless', length: 'sleeveless' }),
        confidence: { overall: 0.96, identity: 0.96 },
        status: SPEC_STATUS.NEEDS_REVIEW,
      });

      return {
        success: true,
        specification: spec,
        observations: [
          'Internal corset foundation contours detected along sweetheart neckline.',
          'Full-length column skirt drape extending to floor.',
        ],
        confidence: 0.96,
        uncertainties: [],
        sourceImages,
      };
    }

    // 7. Skirt Test Case
    if (rawHint.includes('skirt')) {
      const spec = createGarmentSpecification({
        name: 'Tailored Contour Pencil Skirt',
        garmentType: 'skirt',
        silhouette: 'pencil',
        waistband: createWaistbandComponent({ type: 'contour' }),
        confidence: { overall: 0.95, identity: 0.95 },
        status: SPEC_STATUS.NEEDS_REVIEW,
      });

      return {
        success: true,
        specification: spec,
        observations: [
          'Vertical waist dart shaping front and back panels.',
          'Tapered hem with rear walking vent overlap.',
        ],
        confidence: 0.95,
        uncertainties: [],
        sourceImages,
      };
    }

    // 8. Contradictory Garment (For Testing Validation Pipeline)
    if (rawHint.includes('contradictory') || rawHint.includes('invalid_trouser_neck')) {
      const spec = createGarmentSpecification({
        name: 'Contradictory Trouser with Neckline',
        garmentType: 'trouser',
        neckline: createNecklineComponent({ type: 'boat' }),
        collar: createCollarComponent({ type: 'spread' }),
        confidence: { overall: 0.8, identity: 0.8 },
        status: SPEC_STATUS.NEEDS_REVIEW,
      });

      return {
        success: true,
        specification: spec,
        observations: [
          'Erroneous upper neckline and collar detected on trouser leg silhouette.',
        ],
        confidence: 0.8,
        uncertainties: [],
        sourceImages,
      };
    }

    // 9. Sculptural / Exaggerated Garment Test Case
    if (rawHint.includes('sculptural') || rawHint.includes('avant_garde') || rawHint.includes('exaggerated')) {
      const spec = createGarmentSpecification({
        name: 'Sculptural Asymmetric Flared Evening Gown',
        garmentType: 'gown',
        silhouette: 'column_sheath',
        structuralBase: {
          foundationType: 'gown',
          blocks: ['FITTED_CORSET_BODICE', 'COLUMN_SKIRT'],
          easeTarget: 'functional_fitted',
        },
        sculpturalComponents: [
          {
            id: 'sculpt_oversized_architectural_flange',
            name: 'Oversized Architectural Shoulder Flange',
            type: 'exaggerated_volume',
            placement: 'right_shoulder',
            volumeMultiplier: 2.8,
            confidence: createConfidenceValue('architectural_flange', 0.88, CONFIDENCE_STATES.INFERRED),
          },
          {
            id: 'sculpt_cascading_side_pleat',
            name: 'Cascading Origami Hip Pleats',
            type: 'sculptural_overlay',
            placement: 'lateral_hip',
            confidence: createConfidenceValue('origami_pleats', 0.85, CONFIDENCE_STATES.INFERRED),
          },
        ],
        confidence: { overall: 0.92, identity: 0.95 },
        status: SPEC_STATUS.NEEDS_REVIEW,
      });

      return {
        success: true,
        specification: spec,
        observations: [
          'High visual exaggeration detected: anatomical foundation separated from sculptural outer flanges.',
          'Right shoulder volume is artistic exaggeration, not body dimension.',
        ],
        confidence: 0.92,
        uncertainties: [],
        sourceImages,
      };
    }

    // Default 10: Basic Shirt (Set-In Sleeve)
    const spec = createGarmentSpecification({
      name: 'Classic Tailored Oxford Shirt',
      garmentType: 'shirt',
      silhouette: 'tailored_fit',
      sleeve: createSleeveComponent({
        type: 'set-in',
        length: 'full',
        construction: 'one-piece',
      }),
      collar: createCollarComponent({ type: 'spread' }),
      neckline: createNecklineComponent({ type: 'collared' }),
      pockets: [createPocketComponent({ type: 'patch', placement: 'chest_left' })],
      confidence: { overall: 0.96, identity: 0.97 },
      status: SPEC_STATUS.NEEDS_REVIEW,
    });

    return {
      success: true,
      specification: spec,
      observations: [
        'Classic set-in sleeve armhole seam detected.',
        'Two-piece spread collar with collar stand extracted.',
        'Left chest patch pocket identified.',
      ],
      confidence: 0.96,
      uncertainties: [],
      sourceImages,
    };
  }
}
