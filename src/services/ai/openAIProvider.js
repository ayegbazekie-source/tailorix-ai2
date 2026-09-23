/**
 * TAILORIX AI — OPENAI VISION DECONSTRUCTION PROVIDER
 * 
 * Implements the AIProvider interface by communicating securely with the
 * server-side Supabase Edge Function ("deconstruct-garment").
 * 
 * SECURITY GUARANTEE:
 * The browser NEVER interacts directly with OpenAI API keys.
 * All credentials remain protected server-side within the Edge Function environment.
 */

import { AIProvider } from './AIProvider';
import { supabase } from '../supabaseClient';
import { prepareImageForAnalysis } from '../../utils/imagePreparation';
import { logger } from '../../utils/deconstructLogger';
import { MockAIProvider } from './mockAIProvider';

export class OpenAIProvider extends AIProvider {
  constructor() {
    super('OpenAIProvider');
    this.mockFallback = new MockAIProvider();
  }

  /**
   * Analyzes one or more garment images through the Supabase Edge Function gateway.
   * 
   * @param {string|Array<string|Object>} input - Single base64 image or array of images/descriptors
   * @param {Object} options - Analysis options (mode, existingSpecification, userCorrections, targetField, etc.)
   */
  async analyzeGarment(input, options = {}) {
    logger.spec('OpenAIProvider: preparing imagery for deconstruct analysis...');

    // 1. Normalize images with role tagging and resolution optimization
    const preparedImages = await prepareImageForAnalysis(input, options.defaultRole || 'front');

    if (preparedImages.length === 0) {
      return {
        success: false,
        status: 'error',
        code: 'NO_IMAGE_PROVIDED',
        message: 'No valid image data was supplied for garment analysis.',
        retryable: false,
      };
    }

    logger.spec(`OpenAIProvider: dispatching ${preparedImages.length} image(s) to Edge Function "deconstruct-garment"`);

    // 2. Invoke server-side Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('deconstruct-garment', {
        body: {
          images: preparedImages,
          options: {
            mode: options.mode || 'full',
            model: options.model,
            targetField: options.targetField,
            specificQuestion: options.specificQuestion,
          },
          existingSpecification: options.existingSpecification,
          userCorrections: options.userCorrections,
        },
      });

      if (!error && data && data.success && (data.specification || data.garmentType)) {
        logger.spec('OpenAIProvider: analysis received from Edge Function gateway', {
          garmentType: data.garmentType,
          uncertainties: (data.uncertainties || []).length,
          questions: (data.questionsForUser || []).length,
        });

        return {
          success: true,
          analysisVersion: data.analysisVersion || '2.0.0',
          garmentType: data.garmentType,
          specification: data.specification,
          observations: data.observations || [],
          components: data.components || {},
          confidence: data.confidence,
          uncertainties: data.uncertainties || [],
          assumptions: data.assumptions || [],
          questionsForUser: data.questionsForUser || [],
          sourceImages: data.sourceImages || preparedImages.map((img) => img.id),
          mode: data.mode || options.mode || 'full',
          provider: 'openai',
        };
      }

      // If the Edge Function returned a structured application error
      if (data && data.status === 'error') {
        logger.spec('OpenAIProvider: Edge function returned structured error:', data.code, data.message);
        if (options.strictErrors) {
          return {
            success: false,
            status: 'error',
            code: data.code || 'AI_ANALYSIS_FAILED',
            message: data.message || 'Garment analysis could not be completed.',
            retryable: Boolean(data.retryable),
          };
        }
      }

      // If Edge function error occurred
      if (error) {
        logger.spec('OpenAIProvider: Supabase function invoke error:', error.message);
        if (options.strictErrors) {
          return {
            success: false,
            status: 'error',
            code: 'EDGE_FUNCTION_ERROR',
            message: error.message || 'Failed to communicate with the deconstruct-garment edge function.',
            retryable: true,
          };
        }
      }
    } catch (invokeErr) {
      logger.spec('OpenAIProvider: network or invoke exception:', invokeErr.message);
      if (options.strictErrors) {
        return {
          success: false,
          status: 'error',
          code: 'CONNECTION_FAILED',
          message: invokeErr.message || 'Unable to reach the edge function.',
          retryable: true,
        };
      }
    }

    // 3. Graceful developer fallback when edge function is not deployed locally
    if (import.meta.env.DEV && !options.disallowDevFallback) {
      console.info('[Tailorix AI] Remote OpenAI edge function unavailable; activating deterministic dev test provider.');
      return this.mockFallback.analyzeGarment(preparedImages || input, options);
    }

    return {
      success: false,
      status: 'error',
      code: 'AI_SERVICE_UNAVAILABLE',
      message: 'The AI deconstruction service is currently unavailable. Please verify Edge Function deployment.',
      retryable: true,
    };
  }
}
