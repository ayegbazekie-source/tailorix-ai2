/**
 * TAILORIX AI — BENCHMARK GARMENT SAMPLES FOR DECONSTRUCT PIPELINE
 * Provides instant high-fidelity test garments for tailors and designers.
 */

export const DECONSTRUCT_BENCHMARK_SAMPLES = [
  {
    id: 'sample_gown',
    name: 'Fitted Princess-Seam Sweetheart Midi Gown',
    category: 'gown',
    silhouette: 'column_sheath',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
    description: 'Strapless column evening gown with sweetheart neckline, contour princess seams, and internal corset boning.',
    confidence: 0.98,
    specs: {
      silhouette: 'Fitted Column Sheath with French Darts',
      neckline: 'Sweetheart Neckline with Corset Contour',
      sleeves: 'Sleeveless with Clean Bias Underarm Facings',
      closure: '18" Invisible Center-Back Zipper with Hook & Eye',
      interfacing: 'Lightweight Fusible Weft-Insertion on Bodice & Facings',
      boning: '6-Channel Spiral Steel Boning (Princess & Side Seams)',
      lining: 'Full Silk Crepe de Chine Interior Lining',
      seamAllowance: '0.5" (1.27 cm) Main Seams, 1.5" (3.8 cm) Blind Hem, 0.25" Neckline',
      constructionSequence: [
        'Staystitch sweetheart neckline and armholes 1/8" inside seamline.',
        'Interface front bodice, back bodice, side front panels, and facings.',
        'Stitch front and back contour bust and waist shaping darts; press toward center.',
        'Join front center bodice to side front panels along princess seams; clip curves.',
        'Stitch boning casing channels along princess and side seams; insert spiral steel boning.',
        'Join shoulder or strap seams (if applicable) and press open.',
        'Assemble skirt front and skirt back panels; join bodice to skirt at natural waistline.',
        'Insert 18" invisible zipper into center-back seam using specialized invisible zipper foot.',
        'Construct interior lining bodice and assemble identically to shell.',
        'Join lining to shell at sweetheart neckline; understitch lining to prevent rolling.',
        'Join side seams continuously through shell and lining; press allowances open.',
        'Level finished hemline on dress form and finish with 1.5" blind catch-stitch.'
      ]
    },
    defaultFabric: 'silk_satin'
  },
  {
    id: 'sample_blazer',
    name: 'Savile Row Double-Breasted Tailored Blazer',
    category: 'jacket',
    silhouette: 'single_breasted',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
    description: 'Structured bespoke jacket with floating horsehair canvas chest piece, peaked lapels, and two-piece sleeves.',
    confidence: 0.97,
    specs: {
      silhouette: 'Structured Tailored Waist with English Shoulder',
      neckline: '3.25" Peaked Lapel with Lapel Buttonhole',
      sleeves: 'Two-Piece Tailored Sleeve with Four Working Surgeon Cuffs',
      closure: 'Double-Breasted 6x2 Horn Buttons with Internal Anchor Button',
      interfacing: 'Floating Horsehair Canvas Chest Piece with Collar Pad-Stitching',
      boning: 'None (Tailored Wool Canvas & Shoulder Pads)',
      lining: 'Full Bemberg Cupro Twill Lining with Interior Welt Pockets',
      seamAllowance: '0.5" (1.27 cm) Construction Seams, 1.5" (3.8 cm) Sleeve & Jacket Hems',
      constructionSequence: [
        'Pad-stitch undercollar to hair canvas with chevron roll tension.',
        'Tape front jacket edges and lapel breakline with linen stay tape.',
        'Pad-stitch floating horsehair canvas chest piece to front jacket panels.',
        'Construct barchetta welt breast pocket and lower flap pockets.',
        'Join center back seam and side back panels; press seams open.',
        'Join jacket front to jacket back at shoulder and side seams.',
        'Attach collar assembly to neckline with hand-felled gorge seam.',
        'Construct two-piece sleeves; assemble surgeon cuffs and vent miters.',
        'Insert sleeves into armholes with tailored wool sleeve head and shoulder pads.',
        'Assemble and insert full Cupro lining; fell lining at armholes and hem.',
        'Hand-sew keyhole buttonholes and cross-stitch horn buttons with thread shanks.',
        'Final artisan steam shaping over tailor’s ham and chest press.'
      ]
    },
    defaultFabric: 'wool_tweed'
  },
  {
    id: 'sample_trouser',
    name: 'Pleated High-Rise Savile Row Trousers',
    category: 'trouser',
    silhouette: 'classic',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
    description: 'High-waisted tailored trousers with forward double pleats, slanted pockets, and split waistband curtain.',
    confidence: 0.96,
    specs: {
      silhouette: 'High-Rise Relaxed Taper with Deep Front Creases',
      neckline: 'Split-Back Contoured Waistband with Center Back V-Notch',
      sleeves: 'N/A',
      closure: 'Extended Waistband Tab with French Fly, Hook & Bar, and Brass Zipper',
      interfacing: 'Non-Stretch Waistband Buckram & Pocket Stay Canvas',
      boning: 'None',
      lining: 'Front Knee Lining (Acetate Anti-Friction)',
      seamAllowance: '0.5" (1.27 cm) Outseam & Inseam, 1.75" (4.4 cm) Blind Hem Allowance',
      constructionSequence: [
        'Overlock or Hong Kong finish all raw leg panel edges.',
        'Fold and press front double pleats; baste securely along waist edge.',
        'Construct slant front side pockets with pocket bag stays.',
        'Construct double-welt back pockets with button tab closures.',
        'Stitch front knee lining to front trouser leg panels.',
        'Join front leg fly extensions and install brass zipper fly unit.',
        'Stitch outseams and inseams; press seam allowances flat and open.',
        'Join front and back crotch seam, reinforcing curved crotch point.',
        'Attach waistband curtain lining and interface waistband extension.',
        'Install heavy-duty metal hook & bar closure at waistband front.',
        'Press sharp center-front and center-back vertical crease lines.',
        'Turn up 1.75" hem with catch-stitch and tailor’s hem tape.'
      ]
    },
    defaultFabric: 'linen'
  },
  {
    id: 'sample_shirt',
    name: 'Bespoke French-Cuff Oxford Dress Shirt',
    category: 'shirt',
    silhouette: 'tailored_fit',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
    description: 'Crisp woven dress shirt with split back yoke, two-piece collar stand, and French double cuffs.',
    confidence: 0.99,
    specs: {
      silhouette: 'Tailored Fit with Curved Hem & Side Gussets',
      neckline: 'Semi-Spread Collar with Removable Bone Stays',
      sleeves: 'Two-Piece Set-In Long Sleeve with Gauntlet Placket & French Cuffs',
      closure: 'Front French Placket with 7 Mother-of-Pearl Buttons',
      interfacing: 'Crisp Woven Cotton Fusible on Collar, Stand, and Cuffs',
      boning: 'Removable Brass/Celluloid Collar Stays',
      lining: 'Unlined (Single-Needle French Seams Throughout)',
      seamAllowance: '0.375" (0.95 cm) Seams for French Seaming, 0.25" on Collar & Cuffs',
      constructionSequence: [
        'Fuse woven interfacing to upper collar leaf, collar stand, and French cuffs.',
        'Stitch collar leaf with point-turning technique; topstitch edge 1/16".',
        'Sandwich collar leaf between inner and outer collar stand; topstitch stand.',
        'Construct front button plackets with French clean-finish fold.',
        'Attach split back yoke to back bodice using burrito method for clean seams.',
        'Attach yoke to front bodice shoulders with enclosed shoulder seams.',
        'Attach collar stand assembly to shirt neckline; understitch and edge-stitch.',
        'Construct sleeve gauntlet plackets and pleats at wrist edge.',
        'Set sleeves into armholes flat; stitch and fell armhole seams.',
        'Stitch continuous underarm and side seams using 1/4" French seams.',
        'Attach French double cuffs; edge-stitch circumference.',
        'Stitch pentagonal side-seam gusset reinforcements and hem with narrow rolled hem.'
      ]
    },
    defaultFabric: 'poplin'
  }
];
