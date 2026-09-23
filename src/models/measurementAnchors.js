/**
 * TAILORIX AI — ANATOMICAL MEASUREMENT ANCHORS & PROPORTIONAL REASONING
 * 
 * Provides standard anatomical landmarks, anchor points, and proportional calculators.
 * Strictly separates:
 * 1. Body Measurements (actual human anthropometric values)
 * 2. Garment Measurements (body measurement + design ease)
 * 3. Visual Proportions (relative ratios from reference imagery)
 * 4. Design Exaggeration (artistic or dramatic volume offsets)
 */

export const ANATOMICAL_ANCHORS = {
  NECK: 'neck',
  SHOULDER: 'shoulder',
  BUST: 'bust',
  UNDERBUST: 'underbust',
  WAIST: 'waist',
  HIGH_HIP: 'highHip',
  HIP: 'hip',
  ARMHOLE: 'armhole',
  ELBOW: 'elbow',
  WRIST: 'wrist',
  INSEAM: 'inseam',
  OUTSEAM: 'outseam',
  KNEE: 'knee',
  ANKLE: 'ankle',
};

/**
 * Standard adult anthropometric ratios (relative to Total Height and Chest).
 * Used for proportional checks and reasoning without hardcoding unrealistic scales.
 */
export const STANDARD_PROPORTIONAL_RATIOS = {
  neckToWaistLength: 0.24,     // ~16-17 inches for 5'8" adult
  waistToHipDepth: 0.11,       // ~8 inches
  shoulderSlopeAngle: 15,      // degrees standard slope
  armLengthToHeight: 0.35,     // ~24 inches
  crotchDepthToInseam: 0.33,   // ~10-11 inches
};

/**
 * Normalizes anatomical inputs and separates human body truth from fashion exaggeration.
 */
export function resolveAnatomicalAnchors(bodyMeasurements = {}, visualObservations = {}, garmentType = 'shirt') {
  const anchors = {};

  // Standard defaults if unprovided
  const baseMeasurements = {
    bustChest: bodyMeasurements.bustChest || bodyMeasurements.bust || 38,
    waist: bodyMeasurements.waist || 32,
    hip: bodyMeasurements.hip || 40,
    shoulderWidth: bodyMeasurements.shoulderWidth || 17.5,
    neckCircumference: bodyMeasurements.neckCircumference || 15.5,
    sleeveLength: bodyMeasurements.sleeveLength || 25,
    inseam: bodyMeasurements.inseam || 32,
    crotchDepth: bodyMeasurements.crotchDepth || 10.5,
    kneeHeight: bodyMeasurements.kneeHeight || 20,
    kneeWidth: bodyMeasurements.kneeWidth || 16,
    hemWidth: bodyMeasurements.hemWidth || 18,
    skirtLength: bodyMeasurements.skirtLength || 25,
    jacketLength: bodyMeasurements.jacketLength || 29.5,
  };

  for (const [key, value] of Object.entries(baseMeasurements)) {
    const visualRatio = visualObservations[key]?.ratio ?? 1.0;
    const isExaggerated = visualRatio > 1.35 || visualRatio < 0.65;

    anchors[key] = {
      bodyMeasurement: value,
      visualProportion: visualRatio,
      designExaggeration: isExaggerated ? (visualRatio - 1.0) * value : 0,
      confidence: visualObservations[key]?.confidence ?? 0.9,
    };
  }

  return anchors;
}

/**
 * Calculates garment target dimensions by applying functional ease,
 * while isolating sculptural design exaggeration into dedicated overlays.
 */
export function calculateGarmentDimensionsWithAnchors(anchors, easeValues = {}, sculpturalComponents = []) {
  const garmentDimensions = {};

  for (const [key, anchor] of Object.entries(anchors)) {
    const functionalEase = easeValues[key] || 0;
    garmentDimensions[key] = {
      finishedGarment: anchor.bodyMeasurement + functionalEase,
      bodyMeasurement: anchor.bodyMeasurement,
      functionalEase,
      designExaggeration: anchor.designExaggeration,
    };
  }

  return garmentDimensions;
}
