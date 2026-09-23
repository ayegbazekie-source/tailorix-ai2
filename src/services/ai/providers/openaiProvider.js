/**
 * TAILORIX AI — OPENAI AI PROVIDER (OPTIONAL FUTURE PROVIDER)
 * Stage 2.5 Provider Interface
 * 
 * Implements the standard AIProvider contract for OpenAI Vision / Reasoning.
 * Remains completely optional — Tailorix does not require an OpenAI key to function.
 * All communication passes through the server-side edge function.
 */

import { AIProvider } from '../AIProvider';
import { supabase } from '../../supabaseClient';
import { prepareMultiImagePayload } from '../../../utils/imagePreparation';
import { MockAIProvider } from '../mockAIProvider';
import { logger } from '../../../utils/deconstructLogger';
import { AI_ERROR_CODES, IMAGE_ROLES } from '../aiTypes';

export class OpenAIProvider extends AIProvider {
  constructor(config = {}) {
    super('OpenAIProvider');
    this.model = config.model || 'gpt-4o';
    this.mockFallback = new MockAIProvider();
  }

  /**
   * Analyzes reference images using OpenAI Vision via server-side gateway.
   */
  async analyzeGarment(input, options = {}) {
    logger.spec('OpenAIProvider: preparing imagery for deconstruct analysis...');

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
        message: 'No valid image data provided for OpenAI analysis.',
        retryable: false,
      };
    }

    try {
      logger.spec(`OpenAIProvider: dispatching ${preparedImages.length} image(s) to Edge Function "deconstruct-garment"...`);

      const { data, error } = await supabase.functions.invoke('deconstruct-garment', {
        body: {
          provider: 'openai',
          images: preparedImages,
          options: {
            mode: options.mode || 'full',
            targetField: options.targetField,
            specificQuestion: options.specificQuestion,
            model: this.model,
          },
          existingSpecification: options.existingSpecification,
          userCorrections: options.userCorrections,
        },
      });

      if (data && data.success && data.specification) {
        logger.spec('OpenAIProvider: received structured specification from Edge Function.');
        return {
          success: true,
          provider: 'openai',
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
        logger.spec('OpenAIProvider: Edge function returned structured error:', data.code, data.message);
        if (options.strictErrors) {
          return {
            success: false,
            status: 'error',
            code: data.code || AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
            message: data.message || 'Garment analysis could not be completed.',
            retryable: Boolean(data.retryable),
          };
        }
      }

      if (error) {
        logger.spec('OpenAIProvider: Supabase function invoke error:', error.message);
        if (options.strictErrors) {
          return {
            success: false,
            status: 'error',
            code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
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
          code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: invokeErr.message || 'Unable to reach the edge function.',
          retryable: true,
        };
      }
    }

    // Graceful fallback in development when OpenAI key is not configured
    if (import.meta.env.DEV && !options.disallowDevFallback) {
      logger.spec('OpenAIProvider: Activating deterministic dev test provider.');
      const fallbackResult = await this.mockFallback.analyzeGarment(preparedImages || input, options);
      return {
        ...fallbackResult,
        provider: 'openai_dev_fallback',
        model: this.model,
      };
    }

    return {
      success: false,
      status: 'error',
      code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
      message: 'The OpenAI deconstruction service is currently unconfigured or unavailable.',
      retryable: true,
    };
  }
}
