/**
 * TAILORIX AI — FULL GARMENT ANALYSIS PROMPT
 * Instructs the AI to perform a comprehensive visual deconstruction across all garment aspects.
 */

export function buildGarmentAnalysisPrompt(options: {
  mode?: string;
  existingSpecification?: any;
  userCorrections?: Record<string, any>;
  imageMetadata?: Array<{ id: string; role: string }>;
} = {}) {
  const imagesContext = options.imageMetadata?.length
    ? `Reference images provided:\n${options.imageMetadata.map((img) => `- ID "${img.id}": Role "${img.role}"`).join('\n')}`
    : 'Reference images provided for garment deconstruction.';

  const correctionsContext = options.userCorrections && Object.keys(options.userCorrections).length > 0
    ? `\nAUTHORITATIVE USER CORRECTIONS (These must NOT be overwritten; treat as ground truth):\n${JSON.stringify(options.userCorrections, null, 2)}`
    : '';

  const priorSpecContext = options.existingSpecification
    ? `\nPRE-EXISTING DRAFT SPECIFICATION:\n${JSON.stringify(options.existingSpecification, null, 2)}`
    : '';

  return `${imagesContext}
${correctionsContext}
${priorSpecContext}

Analyze the provided garment imagery and output a complete, structured apparel analysis JSON.

Key Requirements:
1. GARMENT IDENTITY:
   - Identify garmentType (e.g. "shirt", "trouser", "jeans", "jacket", "dress", "skirt", "polo", "t_shirt", "gown", "coat"). If uncertain, set to "unknown" or choose the closest candidate with low confidence (< 0.6) and state="uncertain".
   - Identify silhouette: fitted, semi-fitted, regular, relaxed, oversized, straight, A-line, flared, tapered, boxy, bodycon, cocoon, asymmetric.
   - Identify length: cropped, waist, hip, tunic, knee, midi, maxi, floor.

2. SLEEVE & SHOULDER:
   - Type: "set-in", "raglan", "kimono", "dolman", "two-piece", "drop-shoulder", "sleeveless", "cap".
   - Construction: "one-piece", "two-piece", "raglan_split", "gusseted".
   - Length: "sleeveless", "cap", "short", "elbow", "three-quarter", "full".
   - Look specifically for diagonal raglan seamlines from neck to underarm. If partially hidden, mark confidence appropriately.

3. NECKLINE & COLLAR:
   - Neckline: crew, v-neck, square, boat, scoop, sweetheart, halter, high-neck, collared.
   - Collar: spread, notch_lapel, peak_lapel, shawl, mandarin, band, flat_knit, stand, none.

4. SEAMS, DARTS & PANELS:
   - Detect visible seamlines: center_front, center_back, princess_seam, yoke_seam, waist_seam, side_seam.
   - Darts: bust, waist, french, shoulder, none.
   - Pockets: patch, welt, slash, cargo, five_pocket_jeans, chest, flap, hidden.

5. WAISTBAND & CLOSURES:
   - Waistband: straight, contour, elastic, drawstring, none, faced.
   - Closures: buttons, zipper, invisible_zipper, snaps, hooks, ties, none.

6. MATERIAL & FABRIC ESTIMATION:
   - Category: woven, knit, denim, leather, specialty.
   - Weight: light, medium, heavy.
   - Drape: fluid, moderate, crisp, rigid.
   - Stretch: none, low, medium, high (state: "estimated").

7. STRUCTURAL BASE vs SCULPTURAL COMPONENTS:
   - Separate normal body-foundation lines from exaggerated volume, oversized architectural flares, boning channels, or heavy gathers.

8. OBSERVATIONS & EVIDENCE:
   - For every key component, provide: field, value, confidence (0.0 to 1.0), state ("confirmed" | "inferred" | "estimated" | "uncertain" | "unknown"), evidence (visual citation), and sourceImages (IDs of images where visible).

9. QUESTIONS FOR USER:
   - If any critical construction field (garment type, sleeve type, major seams) is ambiguous or occluded, generate a targeted question with options.

JSON Output Format:
{
  "analysisVersion": "2.0.0",
  "garmentType": string,
  "confidence": number,
  "specification": {
    "identity": {
      "garmentType": string,
      "garmentSubtype": string | null,
      "category": "tops" | "bottoms" | "outerwear" | "dresses" | "specialty",
      "genderTarget": "menswear" | "womenswear" | "unisex",
      "constructionType": string
    },
    "silhouette": {
      "primary": string,
      "length": string,
      "hemShape": "straight" | "curved" | "asymmetric" | "stepped",
      "volume": "fitted" | "moderate" | "exaggerated"
    },
    "fit": {
      "fitType": "fitted" | "semi-fitted" | "regular" | "relaxed" | "oversized",
      "ease": number
    },
    "neckline": {
      "type": string | null,
      "depth": number,
      "width": number,
      "shape": string
    },
    "collar": {
      "type": string | null,
      "stand": number,
      "fall": number,
      "shape": string
    },
    "sleeve": {
      "type": string | null,
      "length": string,
      "construction": string,
      "cuffType": string
    },
    "body": {
      "frontConstruction": string,
      "backConstruction": string,
      "sideConstruction": string
    },
    "waistband": {
      "type": string | null
    },
    "pockets": [
      {
        "type": string,
        "placement": string,
        "orientation": string
      }
    ],
    "closures": [
      {
        "type": string,
        "placement": string
      }
    ],
    "material": {
      "category": "woven" | "knit" | "denim" | "leather",
      "substrate": string,
      "stretch": string,
      "weight": string,
      "drape": string
    },
    "structuralBase": {
      "foundationType": string
    },
    "sculpturalComponents": [
      {
        "name": string,
        "type": string,
        "volume": string
      }
    ]
  },
  "observations": [
    {
      "field": string,
      "value": any,
      "confidence": number,
      "state": "confirmed" | "inferred" | "estimated" | "uncertain" | "unknown",
      "evidence": string,
      "sourceImages": string[]
    }
  ],
  "uncertainties": [
    {
      "field": string,
      "state": "uncertain" | "unknown",
      "confidence": number,
      "reason": string,
      "candidates": string[]
    }
  ],
  "assumptions": [
    {
      "field": string,
      "assumption": string,
      "reason": string
    }
  ],
  "questionsForUser": [
    {
      "field": string,
      "question": string,
      "options": string[],
      "reason": string
    }
  ],
  "sourceImages": string[]
}`;
}
