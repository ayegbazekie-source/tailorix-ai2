/**
 * TAILORIX AI — MULTI-PROVIDER AI ROUTER
 * Stage 2.5 Intelligent Provider Selection
 * 
 * Routes requests according to TASK + EVIDENCE + RISK.
 * Provider-agnostic: does not hard-code "complex = OpenAI".
 * 
 * Default Routing Rules:
 * - Visual Perception (full, construction, fabric, detail, verification) -> Gemini
 * - Fast Interactive Text (instructions, corrections, pattern modifications) -> Groq
 * - Clarification -> Gemini if visual imagery present, Groq if text/conversational
 * - Visual Interpretation -> Evaluates capability (flags if image generation unsupported)
 * - OpenAI -> Optional future provider (never mandatory)
 */

import { AI_TASK_TYPES, AI_PROVIDERS, AI_ERROR_CODES } from './aiTypes';

export class AIRouter {
  constructor(config = {}) {
    this.defaultVisionProvider = config.defaultVisionProvider || AI_PROVIDERS.GEMINI;
    this.defaultTextProvider = config.defaultTextProvider || AI_PROVIDERS.GROQ;
    this.fallbackVisionProvider = config.fallbackVisionProvider || AI_PROVIDERS.MOCK;
    this.fallbackTextProvider = config.fallbackTextProvider || AI_PROVIDERS.MOCK;
  }

  /**
   * Resolves the target AI provider based on Task, Evidence, and Risk.
   * 
   * @param {Object} request
   * @param {string} request.taskType - Taxonomy task type
   * @param {Array} request.images - Visual evidence
   * @param {string} request.userInstruction - Text instruction
   * @param {Object} request.garmentSpecification - Current spec
   * @param {Object} options - Router options
   * @returns {Object} Resolution with provider, fallback, model, and reasoning
   */
  resolveProvider(request = {}, options = {}) {
    const {
      taskType = AI_TASK_TYPES.FULL_GARMENT_ANALYSIS,
      images = [],
      userInstruction = '',
      options: reqOptions = {},
    } = request;

    // Check if explicit override is requested by server/admin options
    if (reqOptions.forceProvider) {
      return {
        providerName: reqOptions.forceProvider,
        fallbackProviderName: this.fallbackVisionProvider,
        model: reqOptions.model || 'default',
        reason: `Explicit provider override configured: ${reqOptions.forceProvider}`,
        isCapable: true,
      };
    }

    const hasImages = Array.isArray(images) && images.length > 0;

    switch (taskType) {
      // 1. Visual Perception Tasks -> Gemini Primary
      case AI_TASK_TYPES.FULL_GARMENT_ANALYSIS:
      case AI_TASK_TYPES.CONSTRUCTION_ANALYSIS:
      case AI_TASK_TYPES.FABRIC_ANALYSIS:
      case AI_TASK_TYPES.DETAIL_VERIFICATION:
      case AI_TASK_TYPES.GARMENT_VERIFICATION:
        return {
          providerName: this.defaultVisionProvider,
          fallbackProviderName: this.fallbackVisionProvider,
          model: reqOptions.model || 'gemini-3.8-flash',
          reason: `Visual perception task (${taskType}) routed to primary multi-modal vision provider: ${this.defaultVisionProvider}`,
          isCapable: true,
        };

      // 2. Fast Interactive Interpretation Tasks -> Groq Primary
      case AI_TASK_TYPES.USER_INSTRUCTION:
      case AI_TASK_TYPES.PATTERN_MODIFICATION_COMMAND:
        return {
          providerName: this.defaultTextProvider,
          fallbackProviderName: this.fallbackTextProvider,
          model: reqOptions.model || 'llama-3.3-70b-versatile',
          reason: `Interactive natural-language instruction task (${taskType}) routed to fast inference provider: ${this.defaultTextProvider}`,
          isCapable: true,
        };

      // 3. Clarification Tasks -> Evidence-dependent
      case AI_TASK_TYPES.CLARIFICATION:
        if (hasImages) {
          return {
            providerName: this.defaultVisionProvider,
            fallbackProviderName: this.fallbackVisionProvider,
            model: reqOptions.model || 'gemini-3.8-flash',
            reason: 'Clarification query involves visual evidence; routed to vision provider.',
            isCapable: true,
          };
        }
        return {
          providerName: this.defaultTextProvider,
          fallbackProviderName: this.fallbackTextProvider,
          model: reqOptions.model || 'llama-3.3-70b-versatile',
          reason: 'Clarification query is conversational/text-only; routed to fast text provider.',
          isCapable: true,
        };

      // 4. Visual Interpretation (Illustrations / Flats)
      case AI_TASK_TYPES.VISUAL_INTERPRETATION: {
        // Image generation requires an actual image-generation model (e.g. gemini-3.1-flash-lite-image)
        const supportsImageGen = reqOptions.enableImageGeneration === true;
        if (!supportsImageGen) {
          return {
            providerName: null,
            fallbackProviderName: null,
            model: null,
            reason: 'Configured model environment does not support image generation output.',
            isCapable: false,
            code: AI_ERROR_CODES.UNSUPPORTED_CAPABILITY,
            unsupportedReason: 'Visual illustration rendering requires an image-generation capable endpoint.',
          };
        }
        return {
          providerName: this.defaultVisionProvider,
          fallbackProviderName: null,
          model: 'gemini-3.1-flash-lite-image',
          reason: 'Visual interpretation routed to multi-modal generative vision provider.',
          isCapable: true,
        };
      }

      default:
        // Default safe fallback based on evidence
        if (hasImages) {
          return {
            providerName: this.defaultVisionProvider,
            fallbackProviderName: this.fallbackVisionProvider,
            model: 'gemini-3.8-flash',
            reason: `Generic task with images routed to vision provider: ${this.defaultVisionProvider}`,
            isCapable: true,
          };
        }
        return {
          providerName: this.defaultTextProvider,
          fallbackProviderName: this.fallbackTextProvider,
          model: 'llama-3.3-70b-versatile',
          reason: `Generic text task routed to text provider: ${this.defaultTextProvider}`,
          isCapable: true,
        };
    }
  }
}

export const aiRouter = new AIRouter();
