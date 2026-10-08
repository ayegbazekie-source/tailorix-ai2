/**
 * TAILORIX AI — GEMINI AI PROVIDER
 * Multi-Modal Perception Provider
 * 
 * Specializes in high-fidelity garment deconstruction, anatomy parsing,
 * multi-view silhouette analysis, and fabric behavior reasoning.
 * 
 * CRITICAL RULES:
 * 1. Gemini never produces final SVG or touches pattern geometry coordinates.
 * 2. It outputs structured GarmentSpecification drafts for Tailorix to engineer.
 * 3. Never silently return mock fallback data when AI fails. Return structured error.
 */

import { AIProvider } from '../AIProvider';
import { supabase, invokeDeconstructGateway } from '../../supabaseClient';
import { prepareMultiImagePayload } from '../../../utils/imagePreparation';
import { MockAIProvider } from '../mockAIProvider';
import { logger } from '../../../utils/deconstructLogger';
import { AI_ERROR_CODES, IMAGE_ROLES } from '../aiTypes';
import { deconstructDebugStore } from '../deconstructDebugStore';

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
   * @returns {Promise<Object>} Structured garment perception or structured error
   */
  async analyzeGarment(input, options = {}) {
    const requestId = `gemini_req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Normalize images into structured payloads with roles
    const rawList = Array.isArray(input) ? input : [input];
    const preparedImages = await prepareMultiImagePayload(rawList, {
      defaultRole: IMAGE_ROLES.FRONT,
      maxDimension: 2048,
    });

    const imageRoles = preparedImages.map((img) => img.role || 'front');

    // Forensic Diagnostic Log: AI REQUEST START
    console.info('=== [AI REQUEST START] ===', {
      provider: 'gemini',
      task: options.taskType || 'full_garment_analysis',
      imageCount: preparedImages.length,
      imageRoles,
      requestId,
    });

    deconstructDebugStore.recordRequest({
      provider: 'gemini',
      task: options.taskType || 'full_garment_analysis',
      imageCount: preparedImages.length,
      imageRoles,
      mode: options.mode || 'full',
      requestId,
    });

    if (!preparedImages || preparedImages.length === 0) {
      console.warn('=== [AI PROVIDER RESPONSE] ===', {
        provider: 'gemini',
        success: false,
        model: this.model,
        responseStatus: 'NO_IMAGE_PROVIDED',
      });
      return {
        success: false,
        status: 'error',
        error: {
          code: AI_ERROR_CODES.NO_IMAGE_PROVIDED || 'NO_IMAGE_PROVIDED',
          message: 'No valid image data available for Gemini visual perception.',
          provider: 'gemini',
          requestId,
        },
      };
    }

    try {
      const requestPayload = {
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
      };

      let data = null;
      let error = null;

      // 1. Direct gateway invocation
      if (typeof invokeDeconstructGateway === 'function') {
        try {
          const directResult = await invokeDeconstructGateway(requestPayload);
          if (directResult?.data && directResult.data.success && directResult.data.specification) {
            data = directResult.data;
            error = directResult.error;
          }
        } catch (directErr) {
          // Fall through
        }
      }

      // 2. Supabase function invocation if direct gateway didn't succeed
      if (!data || !data.success || !data.specification) {
        try {
          const sfResult = await supabase.functions.invoke('deconstruct-garment', requestPayload);
          if (sfResult?.data && sfResult.data.success && sfResult.data.specification) {
            data = sfResult.data;
            error = sfResult.error;
          } else if (sfResult?.error) {
            error = sfResult.error;
          }
        } catch (sfErr) {
          error = sfErr;
        }
      }

      if (data && data.success && data.specification) {
        // Ensure authoritative human corrections are retained on specification
        if (options.userCorrections) {
          data.specification.userCorrections = {
            ...(data.specification.userCorrections || {}),
            ...options.userCorrections,
          };
        }

        const isMock = Boolean(data.isDevMock);
        console.info('=== [AI PROVIDER RESPONSE] ===', {
          provider: isMock ? 'gemini_dev_mock' : 'gemini',
          success: true,
          model: data.model || this.model,
          responseStatus: isMock ? 'DEV_MOCK' : '200_OK',
          requestId: data.requestId || requestId,
          detectedGarmentType: data.specification?.identity?.garmentType || data.specification?.garmentType,
        });

        deconstructDebugStore.recordAiResponse({
          provider: isMock ? 'gemini_dev_mock' : 'gemini',
          success: true,
          model: data.model || this.model,
          status: isMock ? 'DEV_MOCK' : '200_OK',
          httpStatus: 200,
          responseSource: isMock ? 'mock' : 'gemini',
          fallbackUsed: isMock,
          requestId: data.requestId || requestId,
          raw: data,
        });

        return {
          success: true,
          provider: isMock ? 'gemini_dev_mock' : 'gemini',
          model: data.model || this.model,
          specification: data.specification,
          reconstruction: data.reconstruction || data.reconstructionLineArt || data.specification?.reconstruction || null,
          patternBlueprint: data.patternBlueprint || data.specification?.patternBlueprint || null,
          observations: data.observations || [],
          confidence: data.confidence ?? 0.95,
          uncertainties: data.uncertainties || [],
          assumptions: data.assumptions || [],
          questionsForUser: data.questionsForUser || [],
          sourceImages: preparedImages.map((img) => img.id),
          requestId: data.requestId || requestId,
        };
      }

      // If gateway returned a structured error
      const errorCode = data?.error?.code || data?.code || (error ? 'GATEWAY_ERROR' : 'PROVIDER_UNAVAILABLE');
      const errorMessage = data?.error?.message || data?.message || error?.message || 'Gemini upstream provider is unavailable.';
      const httpStatus = errorCode.startsWith('HTTP_') ? parseInt(errorCode.replace('HTTP_', ''), 10) : 503;

      console.error('=== [AI PROVIDER RESPONSE] ===', {
        provider: 'gemini',
        success: false,
        model: this.model,
        responseStatus: errorCode,
        httpStatus,
        message: errorMessage,
      });

      deconstructDebugStore.recordAiResponse({
        provider: 'gemini',
        success: false,
        model: this.model,
        status: errorCode,
        error: errorMessage,
        httpStatus,
        responseSource: 'none',
        fallbackUsed: false,
        requestId,
      });

      // Explicit Development Mock Mode ONLY if explicitly enabled
      if (options.enableDevMockMode === true) {
        logger.spec('[GeminiProvider] Explicit DEVELOPMENT MOCK MODE activated by flag.');
        const fallbackResult = await this.mockFallback.analyzeGarment(preparedImages, options);
        return {
          ...fallbackResult,
          provider: 'gemini_dev_mock',
          model: this.model,
          responseSource: 'mock',
          fallbackUsed: true,
        };
      }

      return {
        success: false,
        status: 'provider_unavailable',
        provider: 'gemini',
        requestId,
        error: {
          code: errorCode,
          message: errorMessage,
          status: httpStatus,
        },
      };
    } catch (invokeErr) {
      console.error('=== [AI PROVIDER RESPONSE] ===', {
        provider: 'gemini',
        success: false,
        model: this.model,
        responseStatus: 'EXCEPTION',
        error: invokeErr.message,
      });

      deconstructDebugStore.recordAiResponse({
        provider: 'gemini',
        success: false,
        model: this.model,
        status: 'EXCEPTION',
        error: invokeErr.message,
        httpStatus: 503,
        responseSource: 'none',
        fallbackUsed: false,
        requestId,
      });

      if (options.enableDevMockMode === true) {
        logger.spec('[GeminiProvider] Explicit DEVELOPMENT MOCK MODE activated after exception.');
        const fallbackResult = await this.mockFallback.analyzeGarment(preparedImages, options);
        return {
          ...fallbackResult,
          provider: 'gemini_dev_mock',
          model: this.model,
          responseSource: 'mock',
          fallbackUsed: true,
        };
      }

      return {
        success: false,
        status: 'provider_unavailable',
        provider: 'gemini',
        requestId,
        error: {
          code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: invokeErr.message || 'Network error connecting to Gemini provider.',
          status: 503,
        },
      };
    }
  }
}
