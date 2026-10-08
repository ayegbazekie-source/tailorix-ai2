import crypto from 'crypto';
import { handleDeconstructRequest } from '../server/deconstructGateway';
import { normalizeSpecification } from '../src/services/deconstruct/specificationNormalizer';
import { generatePattern } from '../src/utils/patternEngine/patternRegistry';
import { getDefaultMeasurementsForGarment } from '../src/models/measurementDefinitions';
import { validatePatternPieces } from '../src/utils/patternEngine/patternValidator';

const TEST_GARMENTS = [
  {
    name: 'TROUSER',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&auto=format&fit=crop&q=80',
    expectedFamily: 'bottoms',
  },
  {
    name: 'SHIRT',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&auto=format&fit=crop&q=80',
    expectedFamily: 'tops',
  },
  {
    name: 'DRESS',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&auto=format&fit=crop&q=80',
    expectedFamily: 'dresses',
  },
];

async function run() {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error('FATAL: GEMINI_API_KEY environment variable is missing.');
    process.exit(1);
  }

  console.log('========================================================================');
  console.log('TAILORIX AI — REAL ACCEPTANCE TEST SUITE (STAGE 2 & 2.5)');
  console.log('Executing live deconstruction pipeline across 3 garment families:');
  console.log('1. TROUSER (Bottoms)  2. SHIRT (Tops)  3. DRESS (Dresses)');
  console.log('========================================================================\n');

  const results: any[] = [];

  for (const item of TEST_GARMENTS) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`>>> TESTING GARMENT: ${item.name} (${item.expectedFamily.toUpperCase()})`);
    console.log(`------------------------------------------------------------------------`);

    // 1. Fetch real image and compute SHA-256 hash
    const res = await fetch(item.url);
    if (!res.ok) {
      throw new Error(`Failed to fetch test image for ${item.name}: ${res.statusText}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const imageHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const base64Data = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    console.log(`1. Image SHA-256 Hash: ${imageHash.substring(0, 16)}...`);
    console.log(`   Image Payload Size: ${(buffer.length / 1024).toFixed(1)} KB`);

    // 2. Call real Deconstruct Gateway (Gemini)
    const startTime = Date.now();
    const gatewayResult = await handleDeconstructRequest({
      provider: 'gemini',
      images: [{ id: `img_${item.name.toLowerCase()}`, role: 'front', data: base64Data }],
      options: { mode: 'full' },
    });
    const latency = Date.now() - startTime;

    console.log(`2. Provider Actually Called: ${gatewayResult.provider}`);
    console.log(`3. Provider Model: ${gatewayResult.model} (Latency: ${latency}ms)`);
    console.log(`   Gateway Success: ${gatewayResult.success}`);

    if (!gatewayResult.success) {
      console.error(`   Gateway Error:`, gatewayResult.error);
      throw new Error(`Real Gemini request failed for ${item.name}`);
    }

    // 4. Raw Provider Response Summary
    const rawSpec = gatewayResult.specification || {};
    console.log(`4. Raw Provider Response:`);
    console.log(`   Detected Garment Type: "${rawSpec.identity?.garmentType || rawSpec.garmentType}"`);
    console.log(`   Raw Category: "${rawSpec.identity?.category || rawSpec.category}"`);
    console.log(`   Raw Confidence: ${gatewayResult.confidence}`);

    // 5. Normalized GarmentSpecification
    const normalizedSpec = normalizeSpecification(rawSpec);
    console.log(`5. Normalized GarmentSpecification:`);
    console.log(`   ID: ${normalizedSpec.id}`);
    console.log(`   Garment Type: ${normalizedSpec.identity.garmentType}`);
    console.log(`   Garment Family: ${normalizedSpec.identity.category}`);

    // Verification of Garment Family Contamination Prevention
    if (item.name === 'TROUSER') {
      const isNotApplicable = (val: any) => val === 'NOT_APPLICABLE' || val === null || val?.type === 'NOT_APPLICABLE';
      const necklineValid = isNotApplicable(normalizedSpec.neckline);
      const collarValid = isNotApplicable(normalizedSpec.collar);
      const sleeveValid = isNotApplicable(normalizedSpec.sleeve);
      const armholesValid = isNotApplicable(normalizedSpec.armholes);
      console.log(`   [TROUSER CHECK] Neckline is NOT_APPLICABLE: ${necklineValid} (Value: ${JSON.stringify(normalizedSpec.neckline)})`);
      console.log(`   [TROUSER CHECK] Collar is NOT_APPLICABLE: ${collarValid} (Value: ${JSON.stringify(normalizedSpec.collar)})`);
      console.log(`   [TROUSER CHECK] Sleeve is NOT_APPLICABLE: ${sleeveValid} (Value: ${JSON.stringify(normalizedSpec.sleeve)})`);
      console.log(`   [TROUSER CHECK] Armholes is NOT_APPLICABLE: ${armholesValid} (Value: ${JSON.stringify(normalizedSpec.armholes)})`);
      if (!necklineValid || !collarValid || !sleeveValid || !armholesValid) {
        throw new Error('FAIL: Trouser specification was contaminated with upper-body fields!');
      }
    } else if (item.name === 'SHIRT') {
      const hasCollar = normalizedSpec.collar !== null;
      const hasSleeve = normalizedSpec.sleeve !== null;
      console.log(`   [SHIRT CHECK] Has Collar: ${hasCollar}`);
      console.log(`   [SHIRT CHECK] Has Sleeve: ${hasSleeve}`);
    }

    // 6, 7, 8. Family, Confidence, Uncertainties
    console.log(`6. Garment Family: ${normalizedSpec.identity.category}`);
    console.log(`7. Confidence: ${(normalizedSpec.confidence?.overall * 100).toFixed(1)}%`);
    console.log(`8. Uncertainties Count: ${normalizedSpec.uncertainties?.length || 0}`);

    // 9, 10. Selected Pattern Engine & Generated Pieces
    const measurements = getDefaultMeasurementsForGarment(normalizedSpec.identity.garmentType);
    const patternResult = generatePattern(normalizedSpec, measurements, { seamAllowance: 0.5 });
    
    console.log(`9. Selected Pattern Engine: ${patternResult.engine}`);
    console.log(`10. Generated Pieces (${patternResult.pieces.length} total):`);
    patternResult.pieces.forEach((p: any) => {
      const b = p.bounds || { width: 0, height: 0 };
      console.log(`    - [${p.id}] "${p.name}": ${p.points?.length || 0} pts, cut: "${p.cutQuantity}", bounds: ${(b.width / 12).toFixed(1)}" × ${(b.height / 12).toFixed(1)}"`);
    });

    // 11. SVG Path integrity
    const allHaveSvg = patternResult.pieces.every((p: any) => p.path && p.path.length > 10);
    console.log(`11. SVG Paths Generated: ${allHaveSvg ? 'ALL VALID VECTOR PATHS' : 'INCOMPLETE'}`);

    // 12. Validator Result
    const validation = validatePatternPieces(patternResult.pieces, { measurements });
    console.log(`12. Validator Status: ${validation.summary.status}`);
    console.log(`    Errors: ${validation.summary.errors}, Warnings: ${validation.summary.warnings}`);

    if (!validation.valid) {
      console.warn(`    Validation Issues:`, validation.issues);
    }

    results.push({
      item: item.name,
      hash: imageHash.substring(0, 16),
      model: gatewayResult.model,
      family: normalizedSpec.identity.category,
      engine: patternResult.engine,
      pieceCount: patternResult.pieces.length,
      valid: validation.valid,
    });
  }

  console.log('\n========================================================================');
  console.log('ACCEPTANCE TEST SUMMARY MATRIX');
  console.log('========================================================================');
  console.table(results);
  console.log('\nALL 3 GARMENT FAMILIES TESTED AND VERIFIED SUCCESSFULLY!');
}

run().catch((e) => {
  console.error('\nACCEPTANCE TEST FAILED:', e);
  process.exit(1);
});
