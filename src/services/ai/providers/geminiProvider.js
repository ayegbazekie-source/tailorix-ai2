/**
 * TAILORIX AI — GEMINI AI PROVIDER
 * Stage 2.5 Multi-Modal Perception Provider
 * 
 * Specializes in high-fidelity garment deconstruction, anatomy parsing,
 * multi-view silhouette analysis, and fabric behavior reasoning.
 * 
 * CRITICAL RULE:
 * Gemini never produces final SVG or touches pattern geometry coordinates.
 * It outputs structured GarmentSpecification drafts for Tailorix to engineer.
 */

import { AIProvider } from '../AIProvider';
import { supabase } from '../../supabaseClient';
import { prepareMultiImagePayload } from '../../../utils/imagePreparation';
import { MockAIProvider } from '../mockAIProvider';
import { logger } from '../../../utils/deconstructLogger';
import { AI_ERROR_CODES, IMAGE_ROLES } from '../aiTypes';

export class GeminiProvider extends AIProvider {
  constructor(config = {}) {
    super('GeminiProvider');
    this.model = config.model || 'gemini-3.8-flash';
    this.mockFallback = new MockAIProvider();
  }

  /**
   * Performs multi-modal visual garment deconstruction.
   *
   * @param {Array|string|File} input - Single image or array of images with roles
   * @param {Object} options - Analysis options, mode, existingSpecification, userCorrections
   * @returns {Promise<Object>} Structured garment perception
   */
  async analyzeGarment(input, options = {}) {
    logger.spec('GeminiProvider: preparing multi-perspective imagery for visual perception...');

    // Normalize images into structured payloads with roles
    const rawList = Array.isArray(input) ? input : [input];
    const preparedImages = await prepareMultiImagePayload(rawList, {
      defaultRole: IMAGE_ROLES.FRONT,
      maxDimension: 2048,
    });

    if (!preparedImages || preparedImages.length === 0) {
      return {
        success: false,
        status: 'error',
        code: AI_ERROR_CODES.NO_IMAGE_PROVIDED || 'NO_IMAGE_PROVIDED',
        message: 'No valid image data available for Gemini visual perception.',
        retryable: false,
      };
    }

    // Call server-side Edge Function with provider: 'gemini'
    try {
      logger.spec(`GeminiProvider: dispatching ${preparedImages.length} image(s) to Edge Gateway (gemini)...`);

      const { data, error } = await supabase.functions.invoke('deconstruct-garment', {
        body: {
          provider: 'gemini',
          model: this.model,
          taskType: options.taskType || 'full_garment_analysis',
          images: preparedImages,
          options: {
            mode: options.mode || 'full',
            targetField: options.targetField,
            specificQuestion: options.specificQuestion,
            model: this.model,
          },
          existingSpecification: options.existingSpecification || options.garmentSpecification,
          userCorrections: options.userCorrections,
        },
      });

      if (data && data.success && data.specification) {
        logger.spec('GeminiProvider: successfully received structured garment deconstruction from edge.');
        return {
          success: true,
          provider: 'gemini',
          model: this.model,
          specification: data.specification,
          observations: data.observations || [],
          confidence: data.confidence ?? 0.95,
          uncertainties: data.uncertainties || [],
          assumptions: data.assumptions || [],
          questionsForUser: data.questionsForUser || [],
          sourceImages: preparedImages.map((img) => img.id),
        };
      }

      if (data && data.status === 'error') {
        logger.spec('GeminiProvider: Edge gateway returned structured error:', data.code, data.message);
        if (options.strictErrors) {
          return {
            success: false,
            status: 'error',
            code: data.code || AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
            message: data.message || 'Gemini visual perception could not be completed.',
            retryable: Boolean(data.retryable),
          };
        }
      }

      if (error) {
        logger.spec('GeminiProvider: Supabase function invoke error:', error.message);
        if (options.strictErrors) {
          return {
            success: false,
            status: 'error',
            code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
            message: error.message || 'Failed to communicate with the AI gateway for Gemini.',
            retryable: true,
          };
        }
      }
    } catch (invokeErr) {
      logger.spec('GeminiProvider: Network or gateway exception:', invokeErr.message);
      if (options.strictErrors) {
        return {
          success: false,
          status: 'error',
          code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: invokeErr.message || 'Network error connecting to Gemini provider.',
          retryable: true,
        };
      }
    }

    // Graceful developer fallback when edge function or keys are unconfigured in dev
    if (import.meta.env.DEV && !options.disallowDevFallback) {
      logger.spec('GeminiProvider: Activating deterministic dev test provider.');
      const fallbackResult = await this.mockFallback.analyzeGarment(preparedImages, options);
      return {
        ...fallbackResult,
        provider: 'gemini_dev_fallback',
        model: this.model,
      };
    }

    return {
      success: false,
      status: 'error',
      code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
      message: 'Gemini visual perception service is currently unavailable. Please verify Edge Function and GEMINI_API_KEY.',
      retryable: true,
    };
  }
}
