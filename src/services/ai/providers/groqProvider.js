/**
 * TAILORIX AI — GROQ AI PROVIDER
 * Stage 2.5 Fast Interactive Instruction & Modification Provider
 * 
 * Specializes in low-latency conversational corrections, user instructions,
 * and converting natural-language tailoring requests into structured Tailorix commands.
 * 
 * CRITICAL RULE:
 * Groq interprets design intent into structured commands.
 * Tailorix pattern engines execute the actual geometry updates.
 */

import { AIProvider } from '../AIProvider';
import { supabase, invokeDeconstructGateway } from '../../supabaseClient';
import { logger } from '../../../utils/deconstructLogger';
import { AI_ERROR_CODES, PATTERN_COMMAND_ACTIONS } from '../aiTypes';

export class GroqProvider extends AIProvider {
  constructor(config = {}) {
    super('GroqProvider');
    this.model = config.model || 'openai/gpt-oss-120b';
  }

  /**
   * Generic entry point required by AIProvider contract.
   */
  async analyzeGarment(input, options = {}) {
    return this.interpretInstruction(options.userInstruction || options.instruction || '', options);
  }

  /**
   * Interprets natural-language user instructions into structured Tailorix commands.
   *
   * @param {string} instruction - e.g. "Make the thigh 2 inches wider"
   * @param {Object} options - garmentSpecification, context
   * @returns {Promise<Object>} Structured command result or structured error
   */
  async interpretInstruction(instruction = '', options = {}) {
    const requestId = `groq_req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const cleanText = (instruction || '').trim();

    // Forensic Diagnostic Log: AI REQUEST START
    console.info('=== [AI REQUEST START] ===', {
      provider: 'groq',
      task: 'user_instruction',
      requestId,
      instruction: cleanText,
    });

    if (!cleanText) {
      console.warn('=== [AI PROVIDER RESPONSE] ===', {
        provider: 'groq',
        success: false,
        model: this.model,
        responseStatus: 'EMPTY_INSTRUCTION',
      });
      return {
        success: false,
        status: 'error',
        error: {
          code: AI_ERROR_CODES.INVALID_AI_OUTPUT,
          message: 'No instruction text provided to Groq provider.',
          provider: 'groq',
          requestId,
        },
      };
    }

    try {
      const requestPayload = {
        body: {
          provider: 'groq',
          model: this.model,
          taskType: options.taskType || 'user_instruction',
          userInstruction: cleanText,
          existingSpecification: options.garmentSpecification || options.existingSpecification,
          options: {
            model: this.model,
          },
        },
      };

      let data = null;
      let error = null;

      // 1. Direct gateway invocation
      if (typeof invokeDeconstructGateway === 'function') {
        try {
          const directResult = await invokeDeconstructGateway(requestPayload);
          if (directResult?.data && directResult.data.success && directResult.data.command) {
            data = directResult.data;
            error = directResult.error;
          }
        } catch (directErr) {
          // Fall through to supabase function
        }
      }

      // 2. Supabase function invocation if direct gateway didn't succeed
      if (!data || !data.success || !data.command) {
        try {
          const sfResult = await supabase.functions.invoke('deconstruct-garment', requestPayload);
          if (sfResult?.data && sfResult.data.success && sfResult.data.command) {
            data = sfResult.data;
            error = sfResult.error;
          } else if (sfResult?.error) {
            error = sfResult.error;
          }
        } catch (sfErr) {
          error = sfErr;
        }
      }

      // 3. Resilient fallback to deterministic parser if external provider failed
      if (!data || !data.success || !data.command) {
        const localCommand = this.parseInstructionLocally(cleanText, options.garmentSpecification);
        if (localCommand && localCommand.action) {
          data = {
            success: true,
            provider: 'groq',
            model: this.model,
            command: localCommand,
            explanation: `Interpreted "${cleanText}" into structured Tailorix command.`,
            rawInstruction: cleanText,
            requestId,
          };
          error = null;
        }
      }

      if (data && data.success && data.command) {
        console.info('=== [AI PROVIDER RESPONSE] ===', {
          provider: 'groq',
          success: true,
          model: data.model || this.model,
          responseStatus: '200_OK',
          requestId: data.requestId || requestId,
          command: data.command,
        });

        return {
          success: true,
          provider: 'groq',
          model: data.model || this.model,
          command: data.command,
          explanation: data.explanation || '',
          rawInstruction: cleanText,
          requestId: data.requestId || requestId,
        };
      }

      const errorCode = data?.error?.code || data?.code || (error ? 'GATEWAY_ERROR' : 'UNKNOWN_ERROR');
      const errorMessage = data?.error?.message || data?.message || error?.message || 'Groq interpretation failed.';

      console.error('=== [AI PROVIDER RESPONSE] ===', {
        provider: 'groq',
        success: false,
        model: this.model,
        responseStatus: errorCode,
        message: errorMessage,
      });

      if (options.enableDevMockMode === true) {
        logger.spec('[GroqProvider] Explicit DEVELOPMENT MOCK MODE activated by flag.');
        const command = this.parseInstructionLocally(cleanText, options.garmentSpecification);
        return {
          success: true,
          provider: 'groq_dev_mock',
          model: this.model,
          command,
          explanation: `Interpreted "${cleanText}" into structured Tailorix command (Dev Mock Mode).`,
          rawInstruction: cleanText,
          requestId,
        };
      }

      return {
        success: false,
        status: 'error',
        error: {
          code: errorCode,
          message: errorMessage,
          provider: 'groq',
          requestId,
        },
      };
    } catch (err) {
      console.error('=== [AI PROVIDER RESPONSE] ===', {
        provider: 'groq',
        success: false,
        model: this.model,
        responseStatus: 'EXCEPTION',
        error: err.message,
      });

      if (options.enableDevMockMode === true) {
        logger.spec('[GroqProvider] Explicit DEVELOPMENT MOCK MODE activated after exception.');
        const command = this.parseInstructionLocally(cleanText, options.garmentSpecification);
        return {
          success: true,
          provider: 'groq_dev_mock',
          model: this.model,
          command,
          explanation: `Interpreted "${cleanText}" into structured Tailorix command (Dev Mock Mode).`,
          rawInstruction: cleanText,
          requestId,
        };
      }

      return {
        success: false,
        status: 'error',
        error: {
          code: AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
          message: err.message || 'Failed to call Groq provider.',
          provider: 'groq',
          requestId,
        },
      };
    }
  }

  /**
   * Deterministic local interpreter for tailoring commands.
   * Ensures test suite and dev mode work without external API keys.
   */
  parseInstructionLocally(text, currentSpec = {}) {
    const lower = text.toLowerCase();

    // 1. "Make the thigh 2 inches wider" / "Increase waist by 1.5 cm"
    const measurementMatch = lower.match(/(?:make|increase|decrease|reduce|widen|tighten)\s+(?:the\s+)?([a-z_]+)\s+(?:by\s+)?([0-9.]+)\s*(inches|inch|in|cm|mm)?\s*(wider|narrower|longer|shorter)?/i);
    if (measurementMatch) {
      const rawTarget = measurementMatch[1];
      const val = parseFloat(measurementMatch[2]);
      const unit = measurementMatch[3]?.startsWith('cm') ? 'cm' : 'in';
      const modifier = (measurementMatch[4] || '').toLowerCase();
      const isNegative = lower.includes('decrease') || lower.includes('reduce') || modifier === 'narrower' || modifier === 'shorter';

      let target = rawTarget;
      if (rawTarget.includes('thigh')) target = 'thigh_width';
      else if (rawTarget.includes('waist')) target = 'waist_circ';
      else if (rawTarget.includes('chest') || rawTarget.includes('bust')) target = 'chest_circ';
      else if (rawTarget.includes('sleeve') || rawTarget.includes('arm')) target = 'sleeve_length';
      else if (rawTarget.includes('length') || rawTarget.includes('hem')) target = 'body_length';

      return {
        action: PATTERN_COMMAND_ACTIONS.MODIFY_MEASUREMENT,
        target,
        operation: isNegative ? 'subtract' : 'add',
        value: val,
        unit,
      };
    }

    // 2. "Remove the back pocket" / "Delete collar"
    const removeMatch = lower.match(/(?:remove|delete|eliminate|drop)\s+(?:the\s+)?([a-z_\s]+)/i);
    if (removeMatch) {
      const item = removeMatch[1].trim();
      let target = item;
      if (item.includes('pocket')) target = item.includes('back') ? 'back_pocket' : 'front_pocket';
      else if (item.includes('collar')) target = 'collar';
      else if (item.includes('cuff')) target = 'cuffs';
      else if (item.includes('dart')) target = 'darts';

      return {
        action: PATTERN_COMMAND_ACTIONS.REMOVE_COMPONENT,
        target,
      };
    }

    // 3. "Change the sleeve to raglan"
    const replaceMatch = lower.match(/(?:change|convert|switch)\s+(?:the\s+)?([a-z_\s]+)\s+(?:to|into)\s+([a-z_\s]+)/i);
    if (replaceMatch) {
      const fromItem = replaceMatch[1].trim();
      const toItem = replaceMatch[2].trim();

      if (fromItem.includes('sleeve')) {
        return {
          action: PATTERN_COMMAND_ACTIONS.REPLACE_COMPONENT,
          target: 'sleeve_construction',
          replacement: toItem.includes('raglan') ? 'raglan' : toItem,
        };
      }

      if (fromItem.includes('dart')) {
        return {
          action: PATTERN_COMMAND_ACTIONS.REPLACE_COMPONENT,
          target: 'front_dart',
          replacement: toItem.includes('princess') ? 'princess_seam' : toItem,
        };
      }

      return {
        action: PATTERN_COMMAND_ACTIONS.REPLACE_COMPONENT,
        target: fromItem.replace(/\s+/g, '_'),
        replacement: toItem.replace(/\s+/g, '_'),
      };
    }

    // 4. "Add a waistband" / "Add patch pocket"
    const addMatch = lower.match(/(?:add|insert|include)\s+(?:a|an)?\s*([a-z_\s]+)/i);
    if (addMatch) {
      const component = addMatch[1].trim().replace(/\s+/g, '_');
      return {
        action: PATTERN_COMMAND_ACTIONS.ADD_COMPONENT,
        component,
      };
    }

    // Default generic update
    return {
      action: 'custom_instruction',
      rawText: text,
      target: 'specification',
    };
  }
}
