/**
 * TEST: CLONE SKETCH ACCURACY & PATTERN BLUEPRINT DRAFTING
 */

import assert from 'assert';
import { PRESET_CLONE_SKETCHES, getCloneSketchPatternMapping } from '../utils/garmentSketchEngine.js';
import { generatePatternBlueprint } from '../models/patternBlueprint.js';
import { createReconstructionModel } from '../models/reconstructionModel.js';

console.log('--- Testing Clone Sketch Accuracy & Blueprint Drafting ---');

// 1. Check presets
assert(PRESET_CLONE_SKETCHES.dress, 'Dress clone sketch preset must exist');
assert(PRESET_CLONE_SKETCHES.dress.includes('.jpg'), 'Dress clone sketch preset must be a valid image path');
console.log('✓ Dress clone sketch preset confirmed:', PRESET_CLONE_SKETCHES.dress);

// 2. Check pattern mapping for Dress
const dressMappings = getCloneSketchPatternMapping('dress', { garmentType: 'dress' });
assert(dressMappings.length >= 6, 'Dress mappings must include at least 6 structural pieces');
const pieceNames = dressMappings.map((m) => m.patternPieceName);
assert(pieceNames.some((n) => n.includes('Front Bodice Panel (Center on Fold)')), 'Must include center front bodice');
assert(pieceNames.some((n) => n.includes('Princess Side')), 'Must include princess side panels');
assert(pieceNames.some((n) => n.includes('Back Bodice Panel')), 'Must include back bodice');
assert(pieceNames.some((n) => n.includes('Front Skirt Panel')), 'Must include front skirt panel');
assert(pieceNames.some((n) => n.includes('Back Skirt Panel')), 'Must include back skirt panel');
console.log('✓ Dress clone sketch features mapped to physical pattern pieces:', dressMappings.length);

// 3. Test generatePatternBlueprint for dress
const dressSpec = {
  garmentType: 'dress',
  silhouette: 'sheath_fitted',
  neckline: 'Sweetheart Neckline',
  closure: 'Invisible Center-Back Zipper',
};
const recon = createReconstructionModel(dressSpec);
const blueprint = generatePatternBlueprint(dressSpec, recon);

assert.strictEqual(blueprint.garmentType, 'dress');
assert(blueprint.pieces.length >= 6, 'Blueprint should contain at least 6 structural dress pattern pieces');

const centerFront = blueprint.pieces.find((p) => p.id === 'piece_dress_front_center');
assert(centerFront, 'Front Center bodice must exist');
assert.strictEqual(centerFront.cutQuantityLabel, 'Cut 1 on Fold');
assert.strictEqual(centerFront.onFold, true);
assert(centerFront.grainline.label.includes('FOLD'), 'Front Center bodice grainline must mark fold');

const princessSide = blueprint.pieces.find((p) => p.id === 'piece_dress_front_side');
assert(princessSide, 'Princess side bodice must exist');
assert.strictEqual(princessSide.cutQuantity, 2);
assert(princessSide.notches.length > 0, 'Princess side bodice must have bust balance notches');

console.log('✓ Dress pattern blueprint accurately generated from dress specifications');
console.log('ALL TESTS PASSED!');
