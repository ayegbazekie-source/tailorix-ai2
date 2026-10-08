/**
 * TAILORIX AI — GARMENT TAXONOMY
 * Comprehensive, extensible classification layer for apparel pattern drafting and CAD.
 */

export const GARMENT_FAMILIES = {
  BOTTOMS: 'bottoms',
  TOPS: 'tops',
  HOODIES: 'hoodies_sweatshirts',
  OUTERWEAR: 'outerwear',
  DRESSES: 'dresses',
  SKIRTS: 'skirts',
  DRESSES_SKIRTS: 'dresses',
  ONE_PIECE: 'one_piece',
  CUSTOM: 'custom',
};

export const GARMENT_TYPES = {
  // Bottoms
  TROUSER: {
    id: 'trouser',
    family: GARMENT_FAMILIES.BOTTOMS,
    name: 'Tailored Trousers',
    description: 'Classic bespoke trousers with front/back crease, waistband, fly, and slant pockets.',
    silhouettes: ['classic', 'slim_tapered', 'wide_leg', 'relaxed'],
    defaultSilhouette: 'classic',
    supportedPieces: ['FRONT_LEG', 'BACK_LEG', 'WAISTBAND', 'FLY_FACING', 'POCKET_FACING'],
    defaultSeamAllowance: 0.5,
  },
  JEANS: {
    id: 'jeans',
    family: GARMENT_FAMILIES.BOTTOMS,
    name: 'Denim Jeans (5-Pocket)',
    description: 'Western 5-pocket denim jeans with back yoke, coin pocket, and curved waistband.',
    silhouettes: ['straight', 'slim', 'relaxed_bootcut'],
    defaultSilhouette: 'straight',
    supportedPieces: ['FRONT_LEG', 'BACK_LEG', 'BACK_YOKE', 'WAISTBAND', 'COIN_POCKET', 'FRONT_POCKET_BAG'],
    defaultSeamAllowance: 0.5,
  },
  SHORTS: {
    id: 'shorts',
    family: GARMENT_FAMILIES.BOTTOMS,
    name: 'Tailored Shorts / Bermudas',
    description: 'Casual or tailored knee/above-knee shorts with clean hems.',
    silhouettes: ['tailored_bermuda', 'casual_chino', 'athletic'],
    defaultSilhouette: 'tailored_bermuda',
    supportedPieces: ['FRONT_LEG', 'BACK_LEG', 'WAISTBAND'],
    defaultSeamAllowance: 0.5,
  },

  // Tops
  SHIRT: {
    id: 'shirt',
    family: GARMENT_FAMILIES.TOPS,
    name: 'Dress / Oxford Shirt',
    description: 'Classic woven dress shirt with split yoke, two-piece collar, cuffs, and front placket.',
    silhouettes: ['tailored_fit', 'classic_fit', 'relaxed'],
    defaultSilhouette: 'tailored_fit',
    supportedPieces: ['FRONT_BODICE', 'BACK_BODICE', 'YOKE', 'SLEEVE', 'COLLAR_LEAF', 'COLLAR_STAND', 'CUFF'],
    defaultSeamAllowance: 0.5,
  },
  BLOUSE: {
    id: 'blouse',
    family: GARMENT_FAMILIES.TOPS,
    name: 'Women\'s Tailored Blouse',
    description: 'Fitted woven blouse with bust darts, contoured waist, and soft collar or neckband.',
    silhouettes: ['fitted_darted', 'flowy_peplum', 'classic'],
    defaultSilhouette: 'fitted_darted',
    supportedPieces: ['FRONT_BODICE', 'BACK_BODICE', 'SLEEVE', 'COLLAR'],
    defaultSeamAllowance: 0.5,
  },
  POLO: {
    id: 'polo',
    family: GARMENT_FAMILIES.TOPS,
    name: 'Polo Shirt',
    description: 'Knit polo shirt with ribbed flat collar, set-in sleeve with rib band, and two-button front placket.',
    silhouettes: ['athletic_fit', 'classic_fit'],
    defaultSilhouette: 'classic_fit',
    supportedPieces: ['FRONT_BODY', 'BACK_BODY', 'SLEEVE', 'KNIT_COLLAR', 'PLACKET'],
    defaultSeamAllowance: 0.375, // 3/8" for knits/serger
  },
  T_SHIRT: {
    id: 't_shirt',
    family: GARMENT_FAMILIES.TOPS,
    name: 'Crew / V-Neck T-Shirt',
    description: 'Casual knit T-shirt with rib neckband and twin-needle hem allowances.',
    silhouettes: ['standard_crew', 'oversized_box', 'slim_fit'],
    defaultSilhouette: 'standard_crew',
    supportedPieces: ['FRONT_BODY', 'BACK_BODY', 'SLEEVE', 'NECKBAND'],
    defaultSeamAllowance: 0.375,
  },
  HOODIE: {
    id: 'hoodie',
    family: GARMENT_FAMILIES.HOODIES,
    name: 'Pullover / Zip Hoodie',
    description: 'Casual knit hoodie with contoured hood panels, kangaroo pocket, set-in/raglan sleeves, and rib knit cuffs/hem.',
    silhouettes: ['relaxed_drop_shoulder', 'athletic_fitted', 'oversized_box'],
    defaultSilhouette: 'relaxed_drop_shoulder',
    supportedPieces: ['FRONT_BODY', 'BACK_BODY', 'SLEEVE', 'HOOD_SIDE', 'KANGAROO_POCKET', 'RIB_HEM', 'RIB_CUFF'],
    defaultSeamAllowance: 0.375,
  },
  SWEATSHIRT: {
    id: 'sweatshirt',
    family: GARMENT_FAMILIES.HOODIES,
    name: 'Crewneck Sweatshirt',
    description: 'Knit sweatshirt with rib collar neckband, set-in sleeves, and rib cuffs/hem.',
    silhouettes: ['classic_crew', 'relaxed_oversized'],
    defaultSilhouette: 'classic_crew',
    supportedPieces: ['FRONT_BODY', 'BACK_BODY', 'SLEEVE', 'RIB_COLLAR', 'RIB_HEM', 'RIB_CUFF'],
    defaultSeamAllowance: 0.375,
  },

  // Outerwear
  JACKET: {
    id: 'jacket',
    family: GARMENT_FAMILIES.OUTERWEAR,
    name: 'Tailored Suit Jacket',
    description: 'Single or double-breasted structured jacket with notched/peaked lapel and two-piece sleeve.',
    silhouettes: ['single_breasted', 'double_breasted', 'unstructured_blazer'],
    defaultSilhouette: 'single_breasted',
    supportedPieces: ['FRONT_JACKET', 'BACK_JACKET', 'SIDE_BODY', 'TOP_SLEEVE', 'UNDER_SLEEVE', 'COLLAR', 'LAPEL_FACING'],
    defaultSeamAllowance: 0.5,
  },
  BLAZER: {
    id: 'blazer',
    family: GARMENT_FAMILIES.OUTERWEAR,
    name: 'Casual / Unstructured Blazer',
    description: 'Soft tailored casual blazer with patch pockets and soft shoulder construction.',
    silhouettes: ['soft_tailored', 'boxy_casual'],
    defaultSilhouette: 'soft_tailored',
    supportedPieces: ['FRONT_JACKET', 'BACK_JACKET', 'TOP_SLEEVE', 'UNDER_SLEEVE', 'COLLAR', 'PATCH_POCKET'],
    defaultSeamAllowance: 0.5,
  },
  COAT: {
    id: 'coat',
    family: GARMENT_FAMILIES.OUTERWEAR,
    name: 'Wool Overcoat / Trench',
    description: 'Full-length or knee-length outerwear designed to fit over tailored layers.',
    silhouettes: ['chesterfield', 'trench', 'car_coat'],
    defaultSilhouette: 'chesterfield',
    supportedPieces: ['FRONT_COAT', 'BACK_COAT', 'TOP_SLEEVE', 'UNDER_SLEEVE', 'COLLAR', 'FACING'],
    defaultSeamAllowance: 0.625, // 5/8"
  },
  VEST: {
    id: 'vest',
    family: GARMENT_FAMILIES.OUTERWEAR,
    name: 'Tailored Waistcoat / Vest',
    description: 'Fitted waistcoat with point hem, welt pockets, and cinch back belt.',
    silhouettes: ['five_button_classic', 'shawl_lapel_formal', 'casual_workwear'],
    defaultSilhouette: 'five_button_classic',
    supportedPieces: ['FRONT_VEST', 'BACK_VEST', 'WELT_FACING'],
    defaultSeamAllowance: 0.5,
  },

  // Dresses & Skirts
  SKIRT: {
    id: 'skirt',
    family: GARMENT_FAMILIES.SKIRTS,
    name: 'Tailored Skirt',
    description: 'Woven skirt block with waist darts, contour waistband, and rear vent.',
    silhouettes: ['pencil', 'a_line', 'straight', 'flared'],
    defaultSilhouette: 'pencil',
    supportedPieces: ['FRONT_SKIRT', 'BACK_SKIRT', 'WAISTBAND'],
    defaultSeamAllowance: 0.5,
  },
  DRESS: {
    id: 'dress',
    family: GARMENT_FAMILIES.DRESSES,
    name: 'Day / Sheath Dress',
    description: 'Fitted sheath or shirt-dress with bodice darts, defined waist, and integrated skirt.',
    silhouettes: ['sheath_fitted', 'fit_and_flare', 'shift'],
    defaultSilhouette: 'sheath_fitted',
    supportedPieces: ['BODICE_FRONT', 'BODICE_BACK', 'SKIRT_FRONT', 'SKIRT_BACK', 'SLEEVE'],
    defaultSeamAllowance: 0.5,
  },
  GOWN: {
    id: 'gown',
    family: GARMENT_FAMILIES.DRESSES,
    name: 'Evening / Formal Gown',
    description: 'Full-length evening dress with structured bodice, French darts, and flowing skirt.',
    silhouettes: ['mermaid', 'column_sheath', 'ballgown', 'bias_cut'],
    defaultSilhouette: 'column_sheath',
    supportedPieces: ['BODICE_FRONT', 'BODICE_BACK', 'GOWN_SKIRT_FRONT', 'GOWN_SKIRT_BACK'],
    defaultSeamAllowance: 0.5,
  },

  // One Piece & Custom
  JUMPSUIT: {
    id: 'jumpsuit',
    family: GARMENT_FAMILIES.ONE_PIECE,
    name: 'Tailored Jumpsuit',
    description: 'Integrated bodice and trouser block with elastic or belted waist.',
    silhouettes: ['tailored_utilitarian', 'evening_wide_leg'],
    defaultSilhouette: 'tailored_utilitarian',
    supportedPieces: ['BODICE_FRONT', 'BODICE_BACK', 'TROUSER_FRONT', 'TROUSER_BACK', 'SLEEVE', 'COLLAR'],
    defaultSeamAllowance: 0.5,
  },
  CUSTOM: {
    id: 'custom',
    family: GARMENT_FAMILIES.CUSTOM,
    name: 'Custom / Freeform Pattern',
    description: 'User-defined bespoke pattern geometry and custom panel layouts.',
    silhouettes: ['freeform'],
    defaultSilhouette: 'freeform',
    supportedPieces: ['PANEL_1', 'PANEL_2'],
    defaultSeamAllowance: 0.5,
  },
};

export const GARMENT_TAXONOMY = GARMENT_TYPES;

/**
 * Normalizes any category or string input into an authoritative GARMENT_TYPES definition.
 * If fallback option is explicitly false, returns null for unmapped inputs.
 */
export function getGarmentType(input, options = {}) {
  const allowFallback = options.fallback !== false;
  if (!input) return allowFallback ? GARMENT_TYPES.TROUSER : null;
  const key = String(input).trim().toLowerCase().replace(/[\s-]/g, '_');

  if (key === 'unknown' || key === 'undefined' || key === 'none' || key === 'uncertain') {
    return null;
  }

  // Direct match
  for (const g of Object.values(GARMENT_TYPES)) {
    if (g.id === key) return g;
  }

  // Alias lookup
  const aliases = {
    trousers: GARMENT_TYPES.TROUSER,
    pants: GARMENT_TYPES.TROUSER,
    slacks: GARMENT_TYPES.TROUSER,
    dress_pants: GARMENT_TYPES.TROUSER,
    dress_pant: GARMENT_TYPES.TROUSER,
    dress_trousers: GARMENT_TYPES.TROUSER,
    dress_trouser: GARMENT_TYPES.TROUSER,
    dress_shirt: GARMENT_TYPES.SHIRT,
    shirt_dress: GARMENT_TYPES.DRESS,
    jean: GARMENT_TYPES.JEANS,
    denim: GARMENT_TYPES.JEANS,
    bermuda: GARMENT_TYPES.SHORTS,
    bermudas: GARMENT_TYPES.SHORTS,
    shirts: GARMENT_TYPES.SHIRT,
    oxford: GARMENT_TYPES.SHIRT,
    top: GARMENT_TYPES.SHIRT,
    hoody: GARMENT_TYPES.HOODIE,
    hoodies: GARMENT_TYPES.HOODIE,
    sweatshirts: GARMENT_TYPES.SWEATSHIRT,
    pullover: GARMENT_TYPES.HOODIE,
    tee: GARMENT_TYPES.T_SHIRT,
    tshirt: GARMENT_TYPES.T_SHIRT,
    t_shirt: GARMENT_TYPES.T_SHIRT,
    poloshirt: GARMENT_TYPES.POLO,
    jackets: GARMENT_TYPES.JACKET,
    suit: GARMENT_TYPES.JACKET,
    suit_jacket: GARMENT_TYPES.JACKET,
    blazers: GARMENT_TYPES.BLAZER,
    overcoat: GARMENT_TYPES.COAT,
    trench: GARMENT_TYPES.COAT,
    waistcoat: GARMENT_TYPES.VEST,
    skirts: GARMENT_TYPES.SKIRT,
    dresses: GARMENT_TYPES.DRESS,
    gowns: GARMENT_TYPES.GOWN,
    evening_gown: GARMENT_TYPES.GOWN,
    romper: GARMENT_TYPES.JUMPSUIT,
  };

  if (aliases[key]) return aliases[key];

  // Compound phrase disambiguation
  if (key.includes('dress_shirt') || key.includes('dressshirt')) return GARMENT_TYPES.SHIRT;
  if (key.includes('shirt_dress') || key.includes('shirtdress')) return GARMENT_TYPES.DRESS;
  if (key.includes('dress_pant') || key.includes('dresspant') || key.includes('dress_trouser') || key.includes('dresstrouser')) return GARMENT_TYPES.TROUSER;

  // Substring / composite phrase matching
  if (key.includes('hoodie') || key.includes('hoody')) return GARMENT_TYPES.HOODIE;
  if (key.includes('sweatshirt')) return GARMENT_TYPES.SWEATSHIRT;
  if (key.includes('trouser') || key.includes('pant') || key.includes('slack') || key.includes('chino')) return GARMENT_TYPES.TROUSER;
  if (key.includes('jean') || key.includes('denim')) return GARMENT_TYPES.JEANS;
  if (key.includes('short') || key.includes('bermuda')) return GARMENT_TYPES.SHORTS;
  if (key.includes('skirt')) return GARMENT_TYPES.SKIRT;
  if (key.includes('shirt') || key.includes('blouse') || key.includes('oxford')) return GARMENT_TYPES.SHIRT;
  if (key.includes('polo')) return GARMENT_TYPES.POLO;
  if (key.includes('jacket') || key.includes('blazer') || key.includes('coat') || key.includes('suit')) return GARMENT_TYPES.JACKET;
  if (key.includes('gown')) return GARMENT_TYPES.GOWN;
  if (key.includes('dress')) return GARMENT_TYPES.DRESS;

  return allowFallback ? GARMENT_TYPES.TROUSER : null;
}
