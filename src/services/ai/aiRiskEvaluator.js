/**
 * TAILORIX AI — DETERMINISTIC RISK & CONFIDENCE EVALUATOR
 * Stage 2.5 Safety & Integrity Engine
 * 
 * Evaluates visual perception evidence, component ambiguity, contradictions,
 * and structural complexity before allowing pattern generation.
 * 
 * CRITICAL RULE:
 * Never invent missing construction details.
 * Never default an unknown garment to a trouser engine.
 */

import { RISK_LEVELS, RECOMMENDED_ACTIONS, AI_ERROR_CODES } from './aiTypes';

/**
 * Deterministically evaluates analysis risk for a GarmentSpecification.
 *
 * @param {Object} garmentSpec - Canonical GarmentSpecification
 * @param {Object} options - Evaluation options, images list, metadata
 * @returns {Object} Risk evaluation result
 */
export function evaluateAnalysisRisk(garmentSpec = {}, options = {}) {
  const reasons = [];
  const missingEvidence = [];
  let riskScore = 0; // 0 = lowest risk, 100 = critical risk

  if (!garmentSpec || typeof garmentSpec !== 'object') {
    return {
      level: RISK_LEVELS.HIGH,
      reasons: ['No garment specification provided for risk evaluation.'],
      missingEvidence: ['Garment reference imagery', 'Garment identity'],
      requiresUserConfirmation: true,
      recommendedAction: RECOMMENDED_ACTIONS.REQUEST_IMAGES,
    };
  }

  const identity = garmentSpec.identity || {};
  const garmentType = (identity.garmentType || garmentSpec.garmentType || 'unknown').toLowerCase();
  const overallConfidence = garmentSpec.confidence?.overall ?? (typeof garmentSpec.confidence === 'number' ? garmentSpec.confidence : 0.85);
  const uncertainties = Array.isArray(garmentSpec.uncertainties) ? garmentSpec.uncertainties : [];
  const images = options.images || garmentSpec.sourceImages || [];
  const imageRoles = Array.isArray(images)
    ? images.map((img) => (typeof img === 'object' ? img.role || 'unknown' : 'unknown'))
    : [];

  // 1. Garment Type Confidence & Unknown State
  if (garmentType === 'unknown' || garmentType === 'unresolved' || garmentType === '') {
    riskScore += 60;
    reasons.push('Garment classification is unresolved or unknown.');
    missingEvidence.push('Clear full-body front reference image');
  } else if (garmentSpec.confidence?.identity !== undefined && garmentSpec.confidence.identity < 0.6) {
    riskScore += 35;
    reasons.push(`Garment classification confidence is low (${(garmentSpec.confidence.identity * 100).toFixed(0)}%).`);
  }

  // 2. Component Ambiguity and Uncertainties
  const criticalFields = ['identity.garmentType', 'sleeve.type', 'waistband', 'body.frontConstruction'];
  const criticalUncertainties = uncertainties.filter((u) => criticalFields.includes(u.field) || u.confidence < 0.5);

  if (criticalUncertainties.length > 0) {
    riskScore += criticalUncertainties.length * 20;
    criticalUncertainties.forEach((u) => {
      reasons.push(`Critical component uncertainty: ${u.field} (${u.reason || 'low visual confidence'})`);
    });
  }

  // 3. Image Coverage Evaluation
  const hasBackView = imageRoles.includes('back');
  const hasDetailView = imageRoles.includes('detail') || imageRoles.includes('closeup') || imageRoles.includes('construction');

  // If complex garments like tailored jackets or jeans lack back view
  if (['jacket', 'jeans', 'trouser'].includes(garmentType) && !hasBackView && images.length === 1) {
    riskScore += 15;
    reasons.push(`Single perspective detected for structured ${garmentType}; rear vent/yoke construction inferred.`);
    missingEvidence.push('Rear perspective image for vent/yoke confirmation');
  }

  // 4. Contradictions Check
  // Contradiction: Lower-body garment (trouser/skirt) claiming necklines or collars
  const isLowerBody = ['trouser', 'jeans', 'skirt', 'shorts'].includes(garmentType);
  if (isLowerBody) {
    if (garmentSpec.neckline && garmentSpec.neckline.type && garmentSpec.neckline.type !== 'none') {
      riskScore += 50;
      reasons.push(`Contradictory anatomy: lower-body garment (${garmentType}) has upper-body neckline (${garmentSpec.neckline.type}).`);
    }
    if (garmentSpec.collar && garmentSpec.collar.type && garmentSpec.collar.type !== 'none') {
      riskScore += 50;
      reasons.push(`Contradictory anatomy: lower-body garment (${garmentType}) has collar (${garmentSpec.collar.type}).`);
    }
    if (garmentSpec.sleeve && garmentSpec.sleeve.type && !['sleeveless', 'none'].includes(garmentSpec.sleeve.type)) {
      riskScore += 50;
      reasons.push(`Contradictory anatomy: lower-body garment (${garmentType}) has sleeve components.`);
    }
  }

  // Contradiction: Upper-body garment (shirt/jacket) claiming trouser waistband/fly features inappropriately
  const isUpperBody = ['shirt', 'jacket', 'coat', 't_shirt', 'polo'].includes(garmentType);
  if (isUpperBody && garmentSpec.waistband && garmentSpec.waistband.type === 'contour_fly') {
    riskScore += 40;
    reasons.push(`Contradictory anatomy: upper-body garment (${garmentType}) specifies trouser fly construction.`);
  }

  // 5. Sculptural vs Structural Complexity
  const sculpturalComponents = garmentSpec.sculpturalComponents || [];
  if (sculpturalComponents.length > 0) {
    // Sculptural elements require clear distinction from anatomical base
    const hasUncalibratedVolume = sculpturalComponents.some((sc) => !sc.volumeMultiplier && !sc.placement);
    if (hasUncalibratedVolume) {
      riskScore += 20;
      reasons.push('Sculptural overlay lacks explicit anatomical anchor or volume multiplier.');
      missingEvidence.push('Detailed view of architectural seam anchors');
    }
  }

  // 6. User Corrections (Master Tailor Authority)
  // If the user has applied corrections, each confirmed correction mitigates risk
  const userCorrections = garmentSpec.userCorrections || options.userCorrections || {};
  const confirmedCount = Object.keys(userCorrections).length;
  if (confirmedCount > 0) {
    // User established truth lowers algorithmic risk score
    riskScore = Math.max(0, riskScore - confirmedCount * 25);
    reasons.push(`${confirmedCount} authoritative human correction(s) applied.`);
  }

  // 7. Overall confidence penalty if still low
  if (overallConfidence < 0.6) {
    riskScore += 25;
    reasons.push(`Overall visual confidence is low (${(overallConfidence * 100).toFixed(0)}%).`);
  }

  // Determine Level and Action
  let level = RISK_LEVELS.LOW;
  let recommendedAction = RECOMMENDED_ACTIONS.CONTINUE;
  let requiresUserConfirmation = false;

  if (riskScore >= 45 || garmentType === 'unknown') {
    level = RISK_LEVELS.HIGH;
    requiresUserConfirmation = true;
    recommendedAction = garmentType === 'unknown' ? RECOMMENDED_ACTIONS.CLARIFY : RECOMMENDED_ACTIONS.REQUEST_IMAGES;
  } else if (riskScore >= 20 || criticalUncertainties.length > 0) {
    level = RISK_LEVELS.MEDIUM;
    requiresUserConfirmation = true;
    recommendedAction = RECOMMENDED_ACTIONS.CLARIFY;
  } else {
    level = RISK_LEVELS.LOW;
    requiresUserConfirmation = false;
    recommendedAction = RECOMMENDED_ACTIONS.CONTINUE;
  }

  return {
    level,
    reasons,
    missingEvidence,
    requiresUserConfirmation,
    recommendedAction,
    riskScore,
    garmentType,
  };
}

/**
 * Validates whether pattern generation can safely proceed.
 * Enforces GarmentSpecification validation + risk evaluation + required-field validation.
 * 
 * CRITICAL RULE:
 * Never silently defaults unknown garments to trouser.
 * 
 * @param {Object} garmentSpec
 * @param {Object} options
 * @returns {Object} { allowed: boolean, reason?: string, status?: string, code?: string }
 */
export function checkPatternGenerationGate(garmentSpec, options = {}) {
  if (!garmentSpec) {
    return {
      allowed: false,
      code: AI_ERROR_CODES.PATTERN_GENERATION_BLOCKED,
      status: 'blocked',
      reason: 'No garment specification provided.',
    };
  }

  const garmentType = garmentSpec.identity?.garmentType || garmentSpec.garmentType;

  // Unknown garment safety check
  if (!garmentType || garmentType === 'unknown' || garmentType === 'unresolved') {
    return {
      allowed: false,
      code: AI_ERROR_CODES.PATTERN_GENERATION_BLOCKED,
      status: 'needs_clarification',
      reason: 'Garment type is unresolved. Master tailor clarification is required before drafting.',
      requiredFields: ['identity.garmentType'],
      candidates: ['shirt', 'trouser', 'jeans', 'jacket', 'dress', 'skirt'],
    };
  }

  const risk = evaluateAnalysisRisk(garmentSpec, options);

  // If high risk and user has not explicitly approved
  if (risk.level === RISK_LEVELS.HIGH && garmentSpec.status !== 'approved' && !options.forceBypass) {
    return {
      allowed: false,
      code: AI_ERROR_CODES.PATTERN_GENERATION_BLOCKED,
      status: 'needs_clarification',
      reason: `Pattern generation blocked due to critical risk: ${risk.reasons.join('; ')}`,
      risk,
    };
  }

  return {
    allowed: true,
    risk,
    status: 'ready',
  };
}
