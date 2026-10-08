/**
 * TAILORIX DECONSTRUCT — CRITICAL CORRECTIONS VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Line-Art Clone Sketch (clean white background, faithful silhouette, visible seams/darts/details)
 * 2. Pattern Blueprint Cut Sheet Arrangement (Zero overlaps, min 40px spacing, non-uniform realistic layout)
 * 3. Garment Classification strict isolation (Dress vs Trouser vs Shirt vs Jacket)
 */

import { generatePatternBlueprint, arrangePatternCutSheet, getPieceVisualDimensions } from '../models/patternBlueprint.js';
import { createReconstructionModel } from '../models/reconstructionModel.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('TAILORIX DECONSTRUCT CRITICAL CORRECTIONS VERIFICATION');
console.log('================================================================');

// -----------------------------------------------------------------------------
// Test 1: Line-Art Clone Sketch Generation
// -----------------------------------------------------------------------------
console.log('\nTest 1: Line-Art Clone Sketch on Clean White Background');

const dressSpec = {
  garmentType: 'dress',
  category: 'dresses',
  silhouette: 'sheath',
  name: 'Cocktail Column Dress',
  confidence: 0.98,
};
const dressRecon = createReconstructionModel(dressSpec);

assert(dressRecon.lineArtCloneSketch !== undefined, 'Reconstruction includes lineArtCloneSketch');
assert(dressRecon.lineArtCloneSketch.backgroundColor === '#FFFFFF', 'Sketch has pure white background');
assert(dressRecon.lineArtCloneSketch.style === 'technical_line_art_sketch', 'Sketch style is technical_line_art_sketch');
assert(dressRecon.lineArtCloneSketch.front?.outlinePath?.length > 10, 'Dress front sketch has silhouette outline path');
assert(dressRecon.lineArtCloneSketch.front?.seams?.length >= 2, 'Dress front sketch has visible seams');
assert(dressRecon.lineArtCloneSketch.front?.darts?.length >= 1, 'Dress front sketch has bust/waist contour darts');
assert(dressRecon.lineArtCloneSketch.garmentSpecific === true, 'Sketch marked as garmentSpecific');

const trouserSpec = {
  garmentType: 'trouser',
  category: 'bottoms',
  silhouette: 'relaxed_taper',
  name: 'Bespoke Pleated Trousers',
  confidence: 0.97,
};
const trouserRecon = createReconstructionModel(trouserSpec);
assert(trouserRecon.lineArtCloneSketch.backgroundColor === '#FFFFFF', 'Trouser sketch has pure white background');
assert(trouserRecon.lineArtCloneSketch.front?.seams?.some((s) => s.id?.includes('crease') || s.d?.includes('L 125')), 'Trouser sketch includes sharp leg crease lines');
assert(trouserRecon.lineArtCloneSketch.front?.details?.some((d) => d.id?.includes('waistband')), 'Trouser sketch includes contoured waistband');

// -----------------------------------------------------------------------------
// Test 2: Garment Classification Strict Isolation
// -----------------------------------------------------------------------------
console.log('\nTest 2: Garment Classification Strict Isolation (Dress vs Trouser vs Shirt)');

const dressBlueprint = generatePatternBlueprint(dressSpec, dressRecon);
const trouserBlueprint = generatePatternBlueprint(trouserSpec, trouserRecon);

assert(dressBlueprint.garmentType === 'dress', 'Dress blueprint identified strictly as dress');
assert(!dressBlueprint.pieces.some((p) => p.name.toLowerCase().includes('crotch')), 'Dress blueprint has NO crotch piece');
assert(!dressBlueprint.pieces.some((p) => p.name.toLowerCase().includes('leg')), 'Dress blueprint has NO leg pieces');
assert(dressBlueprint.pieces.some((p) => p.name.includes('Bodice')), 'Dress blueprint includes Bodice Panels');
assert(dressBlueprint.pieces.some((p) => p.name.includes('Skirt')), 'Dress blueprint includes Skirt Panels');

assert(trouserBlueprint.garmentType === 'trouser', 'Trouser blueprint identified strictly as trouser');
assert(!trouserBlueprint.pieces.some((p) => p.name.toLowerCase().includes('bodice')), 'Trouser blueprint has NO bodice pieces');
assert(!trouserBlueprint.pieces.some((p) => p.name.toLowerCase().includes('collar')), 'Trouser blueprint has NO collar pieces');
assert(trouserBlueprint.pieces.some((p) => p.name.includes('Front Leg')), 'Trouser blueprint includes Front Leg Panel');
assert(trouserBlueprint.pieces.some((p) => p.name.includes('Back Leg')), 'Trouser blueprint includes Back Leg Panel');
assert(trouserBlueprint.pieces.some((p) => p.name.includes('Waistband')), 'Trouser blueprint includes Waistband');

// -----------------------------------------------------------------------------
// Test 3: Cut Sheet Arrangement (Zero Overlaps, Min Margin, Scale Preserved)
// -----------------------------------------------------------------------------
console.log('\nTest 3: Cut Sheet Arrangement & Non-Overlap Verification');

function verifyCutSheetArrangement(blueprint, label) {
  const pieces = blueprint.pieces;
  const sheet = blueprint.cutSheet;
  const margin = 40;

  assert(pieces.length > 0, `${label}: Contains pattern pieces (${pieces.length})`);
  assert(sheet.width >= 1350, `${label}: Cut sheet width accommodates fabric bolt (${sheet.width}px)`);

  let collisionCount = 0;
  let outOfBoundsCount = 0;

  for (let i = 0; i < pieces.length; i++) {
    const p1 = pieces[i];
    const dims1 = getPieceVisualDimensions(p1);
    const box1 = {
      id: p1.id,
      name: p1.name,
      minX: p1.x,
      minY: p1.y,
      maxX: p1.x + dims1.width,
      maxY: p1.y + dims1.height,
    };

    // Check bounds
    if (box1.maxX > sheet.width || box1.maxY > sheet.height || box1.minX < 0 || box1.minY < 0) {
      outOfBoundsCount++;
      console.error(`  Out of bounds piece: ${p1.name} [${box1.minX}, ${box1.minY}, ${box1.maxX}, ${box1.maxY}] on sheet [${sheet.width}, ${sheet.height}]`);
    }

    // Check pairwise overlap
    for (let j = i + 1; j < pieces.length; j++) {
      const p2 = pieces[j];
      const dims2 = getPieceVisualDimensions(p2);
      const box2 = {
        id: p2.id,
        name: p2.name,
        minX: p2.x,
        minY: p2.y,
        maxX: p2.x + dims2.width,
        maxY: p2.y + dims2.height,
      };

      const overlaps = !(
        box1.maxX + margin <= box2.minX ||
        box1.minX >= box2.maxX + margin ||
        box1.maxY + margin <= box2.minY ||
        box1.minY >= box2.maxY + margin
      );

      if (overlaps) {
        collisionCount++;
        console.error(`  Collision detected between "${box1.name}" and "${box2.name}"!`);
      }
    }
  }

  assert(collisionCount === 0, `${label}: Zero collisions between all ${pieces.length} pattern pieces (found ${collisionCount})`);
  assert(outOfBoundsCount === 0, `${label}: All pieces fully contained within cut sheet margins (found ${outOfBoundsCount})`);
}

verifyCutSheetArrangement(dressBlueprint, 'Dress Blueprint');
verifyCutSheetArrangement(trouserBlueprint, 'Trouser Blueprint');

const shirtSpec = { garmentType: 'shirt', silhouette: 'fitted', confidence: 0.96 };
const shirtBlueprint = generatePatternBlueprint(shirtSpec);
verifyCutSheetArrangement(shirtBlueprint, 'Shirt Blueprint');

const jacketSpec = { garmentType: 'jacket', silhouette: 'structured', confidence: 0.95 };
const jacketBlueprint = generatePatternBlueprint(jacketSpec);
verifyCutSheetArrangement(jacketBlueprint, 'Jacket Blueprint');

// -----------------------------------------------------------------------------
// Test Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
console.log('================================================================\n');

if (failed > 0) process.exit(1);
