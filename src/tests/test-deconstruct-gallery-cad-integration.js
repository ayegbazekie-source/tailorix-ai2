/**
 * TAILORIX AI — DECONSTRUCT -> PROJECT GALLERY -> DRAFTING BOARD INTEGRATION SUITE
 * End-to-end verification of taxonomy, reconstruction, blueprint cut sheets,
 * persistence, read-only protection, handoffs, and AI caching.
 */

import { generatePatternBlueprint, BLUEPRINT_VERSION } from '../models/patternBlueprint.js';
import { createReconstructionModel } from '../models/reconstructionModel.js';
import {
  createDeconstructProject,
  saveDeconstructProject,
  getSavedProjectById,
  createEditableCopyFromProject,
  SAVED_PROJECTS_STORAGE_KEY,
  ACTIVE_DECONSTRUCT_KEY,
} from '../models/deconstructProject.js';
import { sanitizeGarmentSpecification, normalizeCategory } from '../services/garmentSanitizer.ts';
import { GARMENT_TYPES, getGarmentType } from '../models/garmentTaxonomy.js';
import { aiCache } from '../services/ai/aiCache.js';

// Setup minimal localStorage mock for Node environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('================================================================');
console.log('TAILORIX AI INTEGRATION TEST SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// TEST 1: Taxonomy & Attribute Isolation with Strict Sanitizer Guard
// -------------------------------------------------------------------------
console.log('Test 1: Garment Taxonomy & Attribute Isolation with Strict Sanitizer Guard');

// Test 1a: Trouser with erroneously injected shirt fields
const dirtyTrouserSpec = {
  garmentType: 'trouser',
  silhouette: 'flared',
  inseam: 32,
  crotch_rise: 10.5,
  neckline_style: 'crew_neck', // invalid for trouser
  collar_type: 'spread',       // invalid for trouser
  sleeve_length: 25,           // invalid for trouser
};
const cleanedTrouser = sanitizeGarmentSpecification(dirtyTrouserSpec);

assert(cleanedTrouser.garmentType === 'trouser', 'Trouser retains category identity');
assert(cleanedTrouser.inseam === 32, 'Trouser retains valid inseam');
assert(cleanedTrouser.neckline_style === undefined, 'Sanitizer hard-purged neckline_style from trouser');
assert(cleanedTrouser.collar_type === undefined, 'Sanitizer hard-purged collar_type from trouser');
assert(cleanedTrouser.sleeve_length === undefined, 'Sanitizer hard-purged sleeve_length from trouser');

// Test 1b: Shirt with erroneously injected trouser fields
const dirtyShirtSpec = {
  garmentType: 'shirt',
  silhouette: 'fitted',
  collar_type: 'cutaway',
  inseam: 34,                // invalid for shirt
  crotch_rise: 11,           // invalid for shirt
  fly_zipper: true,          // invalid for shirt
  slant_pockets: true,       // invalid for shirt
};
const cleanedShirt = sanitizeGarmentSpecification(dirtyShirtSpec);

assert(cleanedShirt.garmentType === 'shirt', 'Shirt retains category identity');
assert(cleanedShirt.collar_type === 'cutaway', 'Shirt retains valid collar_type');
assert(cleanedShirt.inseam === undefined, 'Sanitizer hard-purged inseam from shirt');
assert(cleanedShirt.crotch_rise === undefined, 'Sanitizer hard-purged crotch_rise from shirt');
assert(cleanedShirt.fly_zipper === undefined, 'Sanitizer hard-purged fly_zipper from shirt');
assert(cleanedShirt.slant_pockets === undefined, 'Sanitizer hard-purged slant_pockets from shirt');

// -------------------------------------------------------------------------
// TEST 2: Pattern Blueprint Sketch Generation for Different Garments
// -------------------------------------------------------------------------
console.log('\nTest 2: Garment-Specific Pattern Blueprint Generation');

// 2a. Trouser Blueprint
const trouserSpec = { garmentType: 'trouser', silhouette: 'flared', confidence: 0.96 };
const trouserBlueprint = generatePatternBlueprint(trouserSpec);

assert(trouserBlueprint.pieces.length >= 4, `Trouser blueprint generated ${trouserBlueprint.pieces.length} pieces`);
const trouserPieceNames = trouserBlueprint.pieces.map((p) => p.name);
assert(trouserPieceNames.some((n) => n.includes('Front Leg')), 'Trouser blueprint contains Front Leg');
assert(trouserPieceNames.some((n) => n.includes('Back Leg')), 'Trouser blueprint contains Back Leg');
assert(trouserPieceNames.some((n) => n.includes('Waistband')), 'Trouser blueprint contains Waistband');
assert(!trouserPieceNames.some((n) => n.includes('Collar')), 'Trouser blueprint has NO collar');
assert(!trouserPieceNames.some((n) => n.includes('Sleeve')), 'Trouser blueprint has NO sleeve');

// 2b. Shirt Blueprint
const shirtSpec = { garmentType: 'shirt', silhouette: 'fitted', confidence: 0.95 };
const shirtBlueprint = generatePatternBlueprint(shirtSpec);

assert(shirtBlueprint.pieces.length >= 5, `Shirt blueprint generated ${shirtBlueprint.pieces.length} pieces`);
const shirtPieceNames = shirtBlueprint.pieces.map((p) => p.name);
assert(shirtPieceNames.some((n) => n.includes('Front Bodice')), 'Shirt blueprint contains Front Bodice');
assert(shirtPieceNames.some((n) => n.includes('Back Bodice')), 'Shirt blueprint contains Back Bodice');
assert(shirtPieceNames.some((n) => n.includes('Sleeve')), 'Shirt blueprint contains Set-In Sleeve');
assert(shirtPieceNames.some((n) => n.includes('Collar Leaf')), 'Shirt blueprint contains Collar Leaf');
assert(shirtPieceNames.some((n) => n.includes('Cuff')), 'Shirt blueprint contains Barrel Cuff');
assert(!shirtPieceNames.some((n) => n.includes('Leg')), 'Shirt blueprint has NO leg pieces');
assert(!shirtPieceNames.some((n) => n.includes('Fly')), 'Shirt blueprint has NO fly facing');

// 2c. Dress Blueprint
const dressSpec = { garmentType: 'dress', silhouette: 'fitted', confidence: 0.94 };
const dressBlueprint = generatePatternBlueprint(dressSpec);
const dressPieceNames = dressBlueprint.pieces.map((p) => p.name);
assert(dressPieceNames.some((n) => n.includes('Bodice Panel')), 'Dress blueprint contains Bodice Panel');
assert(!dressPieceNames.some((n) => n.includes('Crotch')), 'Dress blueprint has NO crotch piece');

// -------------------------------------------------------------------------
// TEST 3: DeconstructProject Model & Storage Persistence
// -------------------------------------------------------------------------
console.log('\nTest 3: DeconstructProject Model & Persistence');

const projectData = {
  title: 'Bespoke Flared Trouser',
  garmentType: 'trouser',
  silhouette: 'flared',
  confidence: 0.97,
  sourceImage: 'data:image/jpeg;base64,mockImagePayload123',
  patternBlueprint: trouserBlueprint,
  patternPieces: trouserBlueprint.pieces,
};

const createdProject = createDeconstructProject(projectData);

assert(createdProject.id.startsWith('proj_deconstruct_'), 'Project ID has standard proj_deconstruct_ prefix');
assert(createdProject.isDeconstructProject === true, 'Project is marked isDeconstructProject: true');
assert(createdProject.isReadOnlyReference === true, 'Project is marked isReadOnlyReference: true by default');
assert(createdProject.patternPieces.length === trouserBlueprint.pieces.length, 'Project includes all pattern pieces');

// Persist project
const saveOk = saveDeconstructProject(createdProject);
assert(saveOk === true, 'saveDeconstructProject returned success');

// Verify retrieval from mock storage
const retrievedProject = getSavedProjectById(createdProject.id);
assert(retrievedProject !== null, 'getSavedProjectById successfully retrieved project');
assert(retrievedProject.id === createdProject.id, 'Retrieved project ID matches');
assert(retrievedProject.title === 'Bespoke Flared Trouser', 'Retrieved project title matches');
assert(retrievedProject.patternPieces.length >= 4, 'Retrieved project preserved pattern pieces');

// -------------------------------------------------------------------------
// TEST 4: Read-Only Reference Protection & Editable Copy Generation
// -------------------------------------------------------------------------
console.log('\nTest 4: Read-Only Reference Protection & Editable Copy');

const editableCopy = createEditableCopyFromProject(retrievedProject);

assert(editableCopy.id !== retrievedProject.id, 'Editable copy received a new unique ID');
assert(editableCopy.id.startsWith('proj_editable_'), 'Editable copy ID starts with proj_editable_');
assert(editableCopy.isReadOnlyReference === false, 'Editable copy is marked isReadOnlyReference: false');
assert(editableCopy.isEditableCopy === true, 'Editable copy is marked isEditableCopy: true');
assert(editableCopy.originalProjectId === retrievedProject.id, 'Editable copy references originalProjectId');

// Verify original project in storage remains unchanged and locked
const originalAfterCopy = getSavedProjectById(retrievedProject.id);
assert(originalAfterCopy.isReadOnlyReference === true, 'Original project in storage remains strictly READ-ONLY');
assert(originalAfterCopy.id === retrievedProject.id, 'Original project ID unchanged');

// -------------------------------------------------------------------------
// TEST 5: Cutting Table & Studio Handoff Payload Formulation
// -------------------------------------------------------------------------
console.log('\nTest 5: Cutting Table Handoff Payload Formulation');

const cuttingPayload = {
  source: 'deconstruct',
  garmentType: createdProject.garmentTaxonomy.garmentType,
  fabricCanvasUrl: createdProject.fabricName || 'selvedge_denim',
  patternPieces: createdProject.patternPieces.map((p, idx) => ({
    id: p.id || `piece_${idx + 1}`,
    name: p.name,
    svgPath: p.outline,
    cutQuantity: p.cutQuantity || 2,
    grainline: p.grainline,
    bounds: p.bounds,
    onFold: p.onFold,
  })),
};

assert(cuttingPayload.patternPieces.length >= 4, 'Cutting payload contains all pieces');
assert(cuttingPayload.patternPieces[0].svgPath !== undefined, 'Cutting payload piece has svgPath geometry');
assert(cuttingPayload.patternPieces[0].cutQuantity > 0, 'Cutting payload piece has valid cut quantity');

// -------------------------------------------------------------------------
// TEST 6: AI Cache Determinism, Hits & Invalidation
// -------------------------------------------------------------------------
console.log('\nTest 6: AI Cache Deterministic Keys, Hits & Invalidation');

aiCache.clear();
const testReq = {
  taskType: 'garment_analysis',
  projectId: 'test_project_1',
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  images: [{ id: 'img1', role: 'front', data: 'data:image/jpeg;base64,abcdef1234567890abcdef1234567890abcdef1234567890' }],
  userInstruction: 'Analyze trouser silhouette and construction',
};

const cacheKey = aiCache.generateKey(testReq);
assert(typeof cacheKey === 'string' && cacheKey.length > 20, 'Deterministic cache key generated');

const initialGet = aiCache.get(testReq);
assert(initialGet === null, 'Initial cache get is MISS (null)');

const mockAiResponse = {
  status: 'success',
  garmentType: 'trouser',
  silhouette: 'flared',
  confidence: 0.98,
};
aiCache.set(testReq, mockAiResponse);

const cachedGet = aiCache.get(testReq);
assert(cachedGet !== null, 'Subsequent cache get is HIT');
assert(cachedGet.garmentType === 'trouser', 'Cached data accurately retrieved');

// Test project invalidation upon user correction
aiCache.invalidateProject('test_project_1');
const postInvalidateGet = aiCache.get(testReq);
assert(postInvalidateGet === null, 'Cache entry properly invalidated on project mutation');

// -------------------------------------------------------------------------
// Summary
// -------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
