/**
 * TAILORIX AI — SPECIALIZED CONSTRUCTION ANALYSIS PROMPT
 * Deep-dives into seamlines, dart equivalents, panels, and assembly details.
 */

export function buildConstructionAnalysisPrompt(options: {
  existingSpecification?: any;
  userCorrections?: Record<string, any>;
  imageMetadata?: Array<{ id: string; role: string }>;
} = {}) {
  return `You are analyzing the technical apparel construction and assembly of this garment.
Focus specifically on:
1. Exact sleeve-to-bodice attachment (set-in armhole curve vs. diagonal raglan seamline vs. continuous kimono cut).
2. Seam architecture: princess lines, front/back yoke placement, side seams, split backs, center seamlines.
3. Shaping mechanisms: waist darts, contour darts, gathers, pleats, ease manipulation.
4. Internal foundations: interfacing, lining extensions, facings, boning channels, shoulder pads.
5. Closures and plackets: button stands, continuous lap, zipper insertion, fly front.

Do NOT output generic descriptions. Return the exact JSON structure with specific observations, visual citations (evidence), and any structural uncertainties.`;
}
