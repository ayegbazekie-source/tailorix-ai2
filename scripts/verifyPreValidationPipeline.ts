/**
 * TAILORIX AI — MANDATORY PRE-VALIDATION & CAD VECTOR STYLE VERIFICATION SUITE
 */

import { preValidateReconstructionPipeline } from '../src/services/deconstruct/preValidationEngine';
import { CAD_STYLE_CONFIG, extractDartApexCoords, isTopstitchingDetail } from '../src/utils/cadStyleConfig';
import { getMasterTechnicalFlat, getMasterPatternBlueprintPieces } from '../src/utils/masterFashionCadEngine';

async function runVerification() {
  console.log('========================================================================');
  console.log('TAILORIX AI — PRE-VALIDATION & CAD VECTOR STYLE VERIFICATION');
  console.log('========================================================================\n');

  // Test 1: Standardized CAD Style Configuration Spec Check
  console.log('>>> [TEST 1] Verifying High-End CAD Style Configuration...');
  if (CAD_STYLE_CONFIG.outerSilhouette.strokeWidth !== 2.5) {
    throw new Error(`Expected outerSilhouette strokeWidth to be 2.5, got ${CAD_STYLE_CONFIG.outerSilhouette.strokeWidth}`);
  }
  if (CAD_STYLE_CONFIG.outerSilhouette.stroke !== '#0B0F19') {
    throw new Error(`Expected outerSilhouette stroke to be #0B0F19, got ${CAD_STYLE_CONFIG.outerSilhouette.stroke}`);
  }
  if (CAD_STYLE_CONFIG.primarySeam.strokeWidth !== 1.5) {
    throw new Error(`Expected primarySeam strokeWidth to be 1.5, got ${CAD_STYLE_CONFIG.primarySeam.strokeWidth}`);
  }
  if (CAD_STYLE_CONFIG.topstitching.strokeWidth !== 1.0) {
    throw new Error(`Expected topstitching strokeWidth to be 1.0, got ${CAD_STYLE_CONFIG.topstitching.strokeWidth}`);
  }
  if (CAD_STYLE_CONFIG.topstitching.strokeDasharray !== '4 2.5') {
    throw new Error(`Expected topstitching strokeDasharray to be '4 2.5', got ${CAD_STYLE_CONFIG.topstitching.strokeDasharray}`);
  }
  if (CAD_STYLE_CONFIG.dart.strokeWidth !== 1.2 || CAD_STYLE_CONFIG.dart.apexCircle.r !== 2.4) {
    throw new Error(`Dart style configuration mismatch: strokeWidth=${CAD_STYLE_CONFIG.dart.strokeWidth}, apexRadius=${CAD_STYLE_CONFIG.dart.apexCircle.r}`);
  }
  console.log(' PASS: CAD Style Configuration strictly matches high-end garment engineering specs.\n');

  // Test 2: Dart Apex Coordinate Extraction & Topstitching Helper
  console.log('>>> [TEST 2] Testing Dart Apex Extraction & Topstitching Helper...');
  const testDartPath = 'M 200 120 L 200 240';
  const apex = extractDartApexCoords(testDartPath);
  if (apex.x !== 200 || apex.y !== 240) {
    throw new Error(`Expected apex at (200, 240), got (${apex.x}, ${apex.y})`);
  }
  if (!isTopstitchingDetail({ label: 'Topstitched Hem' })) {
    throw new Error('isTopstitchingDetail failed to identify Topstitched Hem');
  }
  console.log(' PASS: Dart apex coordinate parsing and topstitching detection verified.\n');

  // Test 3: Mandatory Pre-Validation across 5 Garment Taxonomies
  const testGarments = [
    { type: 'trouser', silhouette: 'relaxed_taper' },
    { type: 'shirt', silhouette: 'tailored_fit' },
    { type: 'dress', silhouette: 'a_line' },
    { type: 'jacket', silhouette: 'single_breasted' },
    { type: 'hoodie', silhouette: 'relaxed_fleece' },
  ];

  console.log('>>> [TEST 3] Running Mandatory Pre-Validation Pipeline across 5 Taxonomies...');
  for (const g of testGarments) {
    const flat = getMasterTechnicalFlat(g.type, g.silhouette);
    const pieces = getMasterPatternBlueprintPieces(g.type, g.silhouette);

    const cert = preValidateReconstructionPipeline({
      sourceImageMetadata: {
        id: `img_${g.type}_01`,
        garmentType: g.type,
        silhouette: g.silhouette,
        aspectRatio: 1.33,
      },
      technicalFlat: flat,
      blueprintGeometry: { pieces, garmentType: g.type, silhouette: g.silhouette },
      specification: { garmentType: g.type, silhouette: g.silhouette },
    });

    console.log(`[PRE-VALIDATION] Garment: ${g.type.toUpperCase()}`);
    console.log(`  - Overall Consistency: ${cert.overallConsistency}%`);
    console.log(`  - Silhouette Consistency: ${cert.silhouetteConsistency}%`);
    console.log(`  - Panel Consistency: ${cert.panelConsistency}%`);
    console.log(`  - Verified Panels: ${cert.panelCount}`);
    console.log(`  - Total Checks: ${cert.totalChecksCount} (Passed: ${cert.passedChecksCount})`);

    if (cert.overallConsistency !== 100) {
      throw new Error(`Expected 100% overall consistency for ${g.type}, got ${cert.overallConsistency}%`);
    }
    if (cert.silhouetteConsistency !== 100) {
      throw new Error(`Expected 100% silhouette consistency for ${g.type}, got ${cert.silhouetteConsistency}%`);
    }
    if (cert.panelConsistency !== 100) {
      throw new Error(`Expected 100% panel consistency for ${g.type}, got ${cert.panelConsistency}%`);
    }
    if (!cert.isValid || cert.status !== 'PASSED') {
      throw new Error(`Pre-validation status failed for ${g.type}: status=${cert.status}`);
    }
  }

  console.log('\n PASS: All 5 garment taxonomies passed 100% Silhouette & Panel Consistency pre-validation.');
  console.log('========================================================================');
  console.log('ALL PRE-VALIDATION & VECTOR-STYLE VERIFICATION CHECKS PASSED');
  console.log('========================================================================');
}

runVerification().catch((err) => {
  console.error('FATAL: Verification failed:', err);
  process.exit(1);
});
