/**
 * TAILORIX AI — BASE AI PROVIDER CONTRACT
 * 
 * Abstract interface for garment vision & deconstruction intelligence providers.
 * Future providers (such as OpenAIProvider) will implement this contract.
 * 
 * Tailorix AI owns pattern geometry, CAD compilation, and validation.
 * The AI Provider is responsible only for perceptual extraction:
 * - What garment is this?
 * - What components and constructions are visible?
 * - What confidence level exists for each feature?
 * - What is uncertain or requires human review?
 */

export class AIProvider {
  constructor(name = 'BaseAIProvider') {
    this.name = name;
  }

  /**
   * Analyzes an image or reference input and produces a raw perception extraction.
   * 
   * @param {string|File|Blob} input - Image data URL, file, or descriptor
   * @param {Object} options - Analysis hints, options, or metadata
   * @returns {Promise<Object>} {
   *   success: boolean,
   *   specification: Object, // Raw or canonical specification draft
   *   observations: Array<string>, // Perceptual observations
   *   confidence: Object|number,
   *   uncertainties: Array<Object>,
   *   error?: string
   * }
   */
  async analyzeGarment(input, options = {}) {
    throw new Error(`analyzeGarment() must be implemented by provider "${this.name}".`);
  }
}
