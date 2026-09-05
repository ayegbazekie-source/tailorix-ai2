/**
 * Ready-to-use digital tailor croquis and pre-drafted sloper templates.
 */

export const CROQUI_TEMPLATES = [
  {
    id: 'croqui_female_standard',
    name: 'Female Croqui (Standard 9-Head)',
    category: 'croqui',
    gender: 'female',
    path: 'M 450 40 C 460 40 465 55 465 70 C 465 85 455 100 450 100 C 445 100 435 85 435 70 C 435 55 440 40 450 40 Z M 435 110 L 465 110 L 485 140 L 415 140 Z M 415 140 L 485 140 L 475 220 L 425 220 Z M 425 220 L 475 220 L 460 300 L 440 300 Z M 440 300 L 460 300 L 465 480 L 452 480 Z M 440 300 L 435 480 L 448 480 Z',
  },
  {
    id: 'croqui_male_standard',
    name: 'Male Croqui (Athletic Proportions)',
    category: 'croqui',
    gender: 'male',
    path: 'M 450 35 C 462 35 468 52 468 68 C 468 84 458 98 450 98 C 442 98 432 84 432 68 C 432 52 438 35 450 35 Z M 420 110 L 480 110 L 500 155 L 400 155 Z M 400 155 L 500 155 L 480 235 L 420 235 Z M 420 235 L 480 235 L 468 310 L 432 310 Z M 432 310 L 468 310 L 472 500 L 454 500 Z M 432 310 L 428 500 L 446 500 Z',
  },
];

export const SLOPER_BLOCK_TEMPLATES = [
  {
    id: 'block_bodice_female_m',
    name: 'Standard Female Bodice Block (Size M)',
    category: 'bodice',
    measurements: { bust: 36, waist: 28, shoulderWidth: 15, shirtLength: 22 },
    description: 'Basic unadjusted fitted bodice sloper with shoulder and waist waistlines.',
  },
  {
    id: 'block_trouser_straight_m',
    name: 'Classic Straight Trouser Sloper (Size M)',
    category: 'trouser',
    measurements: { waist: 32, hip: 40, crotchDepth: 10.5, inseam: 31, hemWidth: 18 },
    description: 'Zero-ease tailored trouser foundation for drafting casual or formal trousers.',
  },
  {
    id: 'block_skirt_straight_m',
    name: 'Basic Straight Skirt Sloper (Size M)',
    category: 'skirt',
    measurements: { waist: 28, hip: 38, hipDepth: 8, skirtLength: 24 },
    description: 'Two-dart front and back fitted skirt master sloper.',
  },
];
