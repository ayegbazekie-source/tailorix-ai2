/**
 * TAILORIX AI — STAGE 1 AUTOMATED BENCHMARK SUITE
 * 
 * Verifies that the Deconstruct Intelligence Core executes deterministically
 * across the 10 benchmark scenarios specified in Stage 1 requirements:
 * 
 * 1. Classic dress shirt -> routes to shirtBlockEngine, collar stand & yoke present
 * 2. Tailored trouser -> routes to trouserBlockEngine, front/back leg & waistband present
 * 3. Tailored/Denim jacket -> routes to jacketBlockEngine, structured pieces
 * 4. Raglan sleeve shirt -> routes to shirtBlockEngine + raglan sleeve construction
 * 5. Sweetheart gown with boning -> routes to skirtDressEngine + corset foundation
 * 6. Polo shirt -> routes to knitEngine, collar placket & knit body
 * 7. Unknown garment -> returns needs_clarification, DOES NOT default to trouser
 * 8. Impossible garment (sleeveless + cuff) -> fails validation
 * 9. Contradictory input (crotch depth on shirt, or neckline on trouser) -> flags contradiction
 * 10. Human override test: AI infers trouser -> human overrides to jacket -> regenerates jacket pieces
 */

import { generatePattern } from '../utils/patternEngine/patternRegistry';
import { validateGarmentSpecification } from '../services/deconstruct/garmentValidation';
import { resolvePatternEngine } from '../services/deconstruct/constructionResolver';
import { normalizeSpecification } from '../services/deconstruct/specificationNormalizer';
import { applyGarmentTransformation } from '../services/deconstruct/garmentTransformations';
import { getDefaultMeasurementsForGarment } from '../models/measurementDefinitions';
import { createGarmentSpecification, CONFIDENCE_STATES, createConfidenceValue } from '../models/garmentSpecification';

export function runStage1Benchmarks() {
  const results = [];

  function assert(scenarioNum, name, condition, details = '') {
    results.push({
      scenario: scenarioNum,
      name,
      passed: Boolean(condition),
      details,
    });
    const badge = condition ? '✅ PASS' : '❌ FAIL';
    console.log(`[STAGE 1 BENCHMARK] Scenario ${scenarioNum}: ${name} -> ${badge} ${details ? `(${details})` : ''}`);
  }

  console.log('====================================================');
  console.log('TAILORIX AI — STAGE 1 DECONSTRUCT CORE BENCHMARKS');
  console.log('====================================================');

  // Scenario 1: Classic dress shirt
  try {
    const shirtSpec = createGarmentSpecification({
      garmentType: 'shirt',
      silhouette: 'tailored_fit',
      collar: { type: 'spread' },
      sleeve: { type: 'set-in' },
      yoke: { type: 'split' },
    });
    const measurements = getDefaultMeasurementsForGarment('shirt');
    const result = generatePattern(shirtSpec, measurements);
    const pieceIds = result.pieces.map((p) => p.id);
    const hasCollar = pieceIds.some((id) => id.includes('COLLAR'));
    const hasYoke = pieceIds.some((id) => id.includes('YOKE'));
    assert(
      1,
      'Classic dress shirt routes to shirtBlockEngine with collar & yoke',
      result.status === 'success' && result.resolution.engine === 'shirtBlockEngine' && hasCollar && hasYoke && result.pieces.length >= 5,
      `Engine: ${result.resolution?.engine}, Pieces: ${result.pieces.length}`
    );
  } catch (e) {
    assert(1, 'Classic dress shirt', false, e.message);
  }

  // Scenario 2: Tailored trouser
  try {
    const trouserSpec = createGarmentSpecification({
      garmentType: 'trouser',
      silhouette: 'classic',
      waistband: { type: 'contoured' },
    });
    const measurements = getDefaultMeasurementsForGarment('trouser');
    const result = generatePattern(trouserSpec, measurements);
    const pieceIds = result.pieces.map((p) => p.id);
    const hasFrontLeg = pieceIds.includes('TROUSER_FRONT_LEG');
    const hasBackLeg = pieceIds.includes('TROUSER_BACK_LEG');
    const hasWaistband = pieceIds.includes('TROUSER_WAISTBAND');
    assert(
      2,
      'Tailored trouser routes to trouserBlockEngine with front/back leg and waistband',
      result.status === 'success' && result.resolution.engine === 'trouserBlockEngine' && hasFrontLeg && hasBackLeg && hasWaistband,
      `Engine: ${result.resolution?.engine}, Pieces: ${result.pieces.length}`
    );
  } catch (e) {
    assert(2, 'Tailored trouser', false, e.message);
  }

  // Scenario 3: Denim / Tailored jacket with collar
  try {
    const jacketSpec = createGarmentSpecification({
      garmentType: 'jacket',
      silhouette: 'single_breasted',
      collar: { type: 'notch_lapel' },
    });
    const measurements = getDefaultMeasurementsForGarment('jacket');
    const result = generatePattern(jacketSpec, measurements);
    assert(
      3,
      'Tailored jacket routes to jacketBlockEngine',
      result.status === 'success' && result.resolution.engine === 'jacketBlockEngine' && result.pieces.length >= 4,
      `Engine: ${result.resolution?.engine}, Pieces: ${result.pieces.length}`
    );
  } catch (e) {
    assert(3, 'Tailored jacket', false, e.message);
  }

  // Scenario 4: Raglan sleeve shirt
  try {
    const raglanSpec = createGarmentSpecification({
      garmentType: 'shirt',
      sleeve: { type: 'raglan' },
    });
    const measurements = getDefaultMeasurementsForGarment('shirt');
    const result = generatePattern(raglanSpec, measurements);
    const raglanSleeve = result.pieces.find((p) => p.id === 'SHIRT_RAGLAN_SLEEVE');
    assert(
      4,
      'Raglan sleeve shirt routes to shirtBlockEngine and compiles raglan sleeve piece',
      result.status === 'success' && result.resolution.engine === 'shirtBlockEngine' && Boolean(raglanSleeve),
      `Piece ID: ${raglanSleeve?.id}`
    );
  } catch (e) {
    assert(4, 'Raglan sleeve shirt', false, e.message);
  }

  // Scenario 5: Sweetheart gown with boning
  try {
    const gownSpec = createGarmentSpecification({
      garmentType: 'gown',
      silhouette: 'column_sheath',
      neckline: { type: 'sweetheart' },
      boning: { channels: 6 },
    });
    const measurements = getDefaultMeasurementsForGarment('dress');
    const result = generatePattern(gownSpec, measurements);
    assert(
      5,
      'Sweetheart gown routes to skirtDressEngine',
      result.status === 'success' && result.resolution.engine === 'skirtDressEngine' && result.pieces.length >= 3,
      `Engine: ${result.resolution?.engine}, Pieces: ${result.pieces.length}`
    );
  } catch (e) {
    assert(5, 'Sweetheart gown', false, e.message);
  }

  // Scenario 6: Polo shirt
  try {
    const poloSpec = createGarmentSpecification({
      garmentType: 'polo',
      closure: { type: 'placket' },
    });
    const measurements = getDefaultMeasurementsForGarment('shirt');
    const result = generatePattern(poloSpec, measurements);
    assert(
      6,
      'Polo shirt routes to knitEngine',
      result.status === 'success' && result.resolution.engine === 'knitEngine' && result.pieces.length >= 3,
      `Engine: ${result.resolution?.engine}, Pieces: ${result.pieces.length}`
    );
  } catch (e) {
    assert(6, 'Polo shirt', false, e.message);
  }

  // Scenario 7: Unknown garment (NEVER default to trouser)
  try {
    const unknownSpec = {
      garmentType: 'unidentified_chrysalis_cloak',
      identity: { garmentType: 'unidentified_chrysalis_cloak' },
    };
    const result = generatePattern(unknownSpec);
    assert(
      7,
      'Unknown garment returns needs_clarification or unsupported (NEVER defaults to trouser)',
      (result.status === 'needs_clarification' || result.status === 'unsupported') && result.garmentType !== 'trouser' && result.pieces.length === 0,
      `Status: ${result.status}, Candidates: ${(result.candidates || []).join(', ')}`
    );
  } catch (e) {
    assert(7, 'Unknown garment', false, e.message);
  }

  // Scenario 8: Impossible garment (sleeveless + cuff) fails validation
  try {
    const impossibleSpec = createGarmentSpecification({
      garmentType: 'shirt',
      sleeve: { type: 'sleeveless' },
      cuffs: [{ type: 'french' }],
    });
    const validation = validateGarmentSpecification(impossibleSpec);
    const hasSleeveCuffError = validation.errors.some((err) => err.path.includes('cuffs') || err.message.includes('Sleeveless'));
    assert(
      8,
      'Impossible garment (sleeveless with cuffs) fails validation',
      !validation.valid && hasSleeveCuffError,
      `Errors: ${validation.errors.map((e) => e.message).join('; ')}`
    );
  } catch (e) {
    assert(8, 'Impossible garment', false, e.message);
  }

  // Scenario 9: Contradictory input (crotch depth on shirt) flags contradiction
  try {
    const contradictorySpec = createGarmentSpecification({
      garmentType: 'shirt',
      crotch: { depth: 10.5 },
    });
    const validation = validateGarmentSpecification(contradictorySpec);
    const hasCrotchError = validation.errors.some((err) => err.path.includes('crotch'));
    assert(
      9,
      'Contradictory input (crotch depth defined on upper-body shirt) flags contradiction',
      !validation.valid && hasCrotchError,
      `Errors: ${validation.errors.map((e) => e.message).join('; ')}`
    );
  } catch (e) {
    assert(9, 'Contradictory input', false, e.message);
  }

  // Scenario 10: Human override test: AI infers trouser -> human overrides to jacket -> regenerates jacket pieces
  try {
    // 1. Initial AI spec (trouser)
    const initialSpec = normalizeSpecification({
      garmentType: 'trouser',
      confidence: 0.72,
    });
    const initialResolution = resolvePatternEngine(initialSpec);

    // 2. Human override to jacket
    const overriddenSpec = {
      ...initialSpec,
      garmentType: 'jacket',
      identity: {
        ...initialSpec.identity,
        garmentType: 'jacket',
        category: 'tailored_outerwear',
      },
      confidence: createConfidenceValue('jacket', 1.0, CONFIDENCE_STATES.CONFIRMED, 'human_override'),
    };
    const overriddenResolution = resolvePatternEngine(overriddenSpec);
    const measurements = getDefaultMeasurementsForGarment('jacket');
    const result = generatePattern(overriddenSpec, measurements);

    assert(
      10,
      'Human override: AI infers trouser -> human overrides to jacket -> regenerates jacket pieces',
      initialResolution.engine === 'trouserBlockEngine' &&
      overriddenResolution.engine === 'jacketBlockEngine' &&
      result.status === 'success' &&
      result.pieces.length >= 4,
      `Initial engine: ${initialResolution.engine} -> Overridden engine: ${overriddenResolution.engine}`
    );
  } catch (e) {
    assert(10, 'Human override test', false, e.message);
  }

  const allPassed = results.every((r) => r.passed);
  console.log('====================================================');
  console.log(`STAGE 1 BENCHMARK SUMMARY: ${results.filter((r) => r.passed).length}/10 PASSED (${allPassed ? 'ALL SYSTEMS OPERATIONAL' : 'FAILURES DETECTED'})`);
  console.log('====================================================');

  return {
    allPassed,
    results,
    summary: `${results.filter((r) => r.passed).length}/${results.length} passed`,
  };
}
