/**
 * TAILORIX AI — VERIFICATION & CLOSEUP PROMPT
 * Resolves specific uncertain fields using newly provided closeup/detail images.
 */

export function buildVerificationPrompt(options: {
  targetField?: string;
  specificQuestion?: string;
  existingSpecification?: any;
  userCorrections?: Record<string, any>;
  imageMetadata?: Array<{ id: string; role: string }>;
} = {}) {
  const target = options.targetField ? `Target field to verify: "${options.targetField}"` : 'Verify uncertain construction details.';
  const question = options.specificQuestion ? `Specific question to resolve: "${options.specificQuestion}"` : '';

  return `VERIFICATION / DETAIL ANALYSIS SESSION
${target}
${question}

The master tailor has uploaded a targeted closeup / detail image to resolve an ambiguity in the draft specification.
Review the new visual evidence alongside prior specification data.

Produce an updated JSON patch containing:
1. Updated field value with upgraded confidence and state ("confirmed" or "inferred").
2. Explicit visual evidence citing the new closeup.
3. Updated overall specification reflecting this targeted resolution.
4. Cleared uncertainties for the resolved field.`;
}
