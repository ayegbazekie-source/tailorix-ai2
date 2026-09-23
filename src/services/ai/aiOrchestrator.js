/**
 * TAILORIX AI — CENTRAL AI ORCHESTRATOR
 * Stage 2.5 Unified Multi-Provider Orchestration Layer
 * 
 * Sits between all Tailorix UI components and external AI providers.
 * Manages:
 * - Task Classification & Context Preparation
 * - Provider Resolution & Routing (Gemini for vision, Groq for interactive text)
 * - Deterministic Risk & Confidence Evaluation
 * - Request Caching & Authoritative Invalidation
 * - Exponential Retry, Timeout, and Graceful Fallback
 * - Authoritative User Correction Enforcement
 * - Deterministic Pattern Command Execution
 * 
 * CRITICAL RULE:
 * AI interprets design intent and perception.
 * Tailorix engineers pattern geometry.
 * AI NEVER produces final SVG or manipulates CAD geometry coordinates.
 */

import { providerRegistry } from './providerRegistry';
import { aiRouter } from './aiRouter';
import { aiCache } from './aiCache';
import { evaluateAnalysisRisk, checkPatternGenerationGate } from './aiRiskEvaluator';
import { normalizeSpecification } from '../deconstruct/specificationNormalizer';
import { applyAuthoritativeCorrections } from '../aiService';
import { logger } from '../../utils/deconstructLogger';
import {
  AI_TASK_TYPES,
  AI_PROVIDERS,
  AI_ERROR_CODES,
  PATTERN_COMMAND_ACTIONS,
} from './aiTypes';

class AIOrchestrator {
  constructor(config = {}) {
    this.router = aiRouter;
    this.cache = aiCache;
    this.timeoutMs = config.timeoutMs || 30000;
    this.maxRetries = config.maxRetries || 2;
    this.devLogging = config.devLogging ?? Boolean(import.meta.env.DEV);
  }

  /**
   * Internal telemetry logger for AI orchestration.
   * Never logs credentials, private user data, or heavy base64 payloads.
   */
  logTelemetry(event) {
    if (!this.devLogging) return;
    const {
      requestId,
      taskType,
      provider,
      model,
      projectId,
      riskLevel,
      latencyMs,
      status,
      fallback,
      cacheHit,
    } = event;

    logger.orchestrator(
      `[${taskType}] ${status?.toUpperCase()} | Provider: ${provider || 'none'} (${model || 'none'}) | Risk: ${riskLevel || 'n/a'} | Latency: ${latencyMs}ms | Cache: ${cacheHit ? 'HIT' : 'MISS'}${fallback ? ` | Fallback: ${fallback}` : ''} | Req: ${requestId}`
    );
  }

  /**
   * Core execution pipeline with timeout, retry, and fallback.
   */
  async executeRequest(request) {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const projectId = request.projectId || 'default';

    // 1. Check Cache
    const cachedResult = this.cache.get(request);
    if (cachedResult && !request.options?.skipCache) {
      this.logTelemetry({
        requestId,
        taskType: request.taskType,
        provider: cachedResult.provider || 'cached',
        model: cachedResult.model || 'cached',
        projectId,
        riskLevel: cachedResult.risk?.level || 'low',
        latencyMs: Date.now() - startTime,
        status: 'success',
        cacheHit: true,
      });
      return { ...cachedResult, fromCache: true };
    }

    // 2. Resolve Provider via Router
    const route = this.router.resolveProvider(request, request.options);

    if (!route.isCapable) {
      const errorResult = {
        success: false,
        status: 'error',
        code: route.code || AI_ERROR_CODES.UNSUPPORTED_CAPABILITY,
        message: route.unsupportedReason || route.reason,
        taskType: request.taskType,
        requestId,
      };
      this.logTelemetry({
        requestId,
        taskType: request.taskType,
        provider: 'none',
        model: 'none',
        projectId,
        latencyMs: Date.now() - startTime,
        status: 'unsupported',
        cacheHit: false,
      });
      return errorResult;
    }

    let primaryProvider = providerRegistry.getProvider(route.providerName);
    if (!primaryProvider) {
      primaryProvider = providerRegistry.getActiveProvider();
    }

    // 3. Attempt Execution with Retries
    let lastError = null;
    let result = null;
    let usedFallback = false;
    let executedProviderName = route.providerName;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        result = await this.invokeWithTimeout(
          primaryProvider,
          request,
          request.options?.timeoutMs || this.timeoutMs
        );

        if (result && result.success) {
          break; // Succeeded
        } else if (result && result.status === 'error' && !result.retryable) {
          break; // Fatal non-retryable error
        }
      } catch (err) {
        lastError = err;
        logger.orchestrator(`Attempt ${attempt} failed for provider "${route.providerName}":`, err.message);
        if (attempt < this.maxRetries) {
          await new Promise((r) => setTimeout(r, attempt * 500)); // Exponential backoff
        }
      }
    }

    // 4. Fallback Provider if primary failed
    if ((!result || !result.success) && route.fallbackProviderName) {
      const fallbackProvider = providerRegistry.getProvider(route.fallbackProviderName);
      if (fallbackProvider && fallbackProvider !== primaryProvider) {
        logger.orchestrator(`Activating fallback provider "${route.fallbackProviderName}"...`);
        try {
          result = await this.invokeWithTimeout(
            fallbackProvider,
            request,
            request.options?.timeoutMs || this.timeoutMs
          );
          if (result && result.success) {
            usedFallback = true;
            executedProviderName = route.fallbackProviderName;
          }
        } catch (fbErr) {
          logger.orchestrator('Fallback provider also failed:', fbErr.message);
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // 5. Handle Failure
    if (!result || !result.success) {
      const finalError = {
        success: false,
        status: 'error',
        code: result?.code || AI_ERROR_CODES.PROVIDER_UNAVAILABLE,
        message: result?.message || lastError?.message || 'AI request execution failed.',
        retryable: Boolean(result?.retryable),
        taskType: request.taskType,
        requestId,
      };

      this.logTelemetry({
        requestId,
        taskType: request.taskType,
        provider: executedProviderName,
        model: route.model,
        projectId,
        latencyMs,
        status: 'failure',
        fallback: usedFallback ? executedProviderName : null,
        cacheHit: false,
      });

      return finalError;
    }

    // 6. Post-process & Evaluate Risk for Garment Specifications
    if (result.specification || result.garmentType) {
      let rawSpec = result.specification || result;

      // Authoritative User Corrections
      const userCorrections = request.options?.userCorrections || request.garmentSpecification?.userCorrections;
      if (userCorrections && Object.keys(userCorrections).length > 0) {
        rawSpec = applyAuthoritativeCorrections(rawSpec, userCorrections);
      }

      const canonicalSpec = normalizeSpecification(rawSpec);
      if (userCorrections) {
        canonicalSpec.userCorrections = { ...(canonicalSpec.userCorrections || {}), ...userCorrections };
      }
      canonicalSpec.observations = result.observations || [];
      canonicalSpec.uncertainties = result.uncertainties || canonicalSpec.uncertainties || [];
      canonicalSpec.questionsForUser = result.questionsForUser || [];
      canonicalSpec.sourceImages = result.sourceImages || [];
      canonicalSpec.analysisMode = request.options?.mode || 'full';

      // Evaluate Risk Deterministically
      const risk = evaluateAnalysisRisk(canonicalSpec, {
        images: request.images,
        userCorrections,
      });

      canonicalSpec.risk = risk;
      if (risk.requiresUserConfirmation && canonicalSpec.status !== 'approved') {
        canonicalSpec.status = 'needs_review';
      }

      result.specification = canonicalSpec;
      result.data = canonicalSpec;
      result.risk = risk;
    }

    // 7. Store in Cache
    this.cache.set(request, result);

    this.logTelemetry({
      requestId,
      taskType: request.taskType,
      provider: executedProviderName,
      model: result.model || route.model,
      projectId,
      riskLevel: result.risk?.level || 'low',
      latencyMs,
      status: 'success',
      fallback: usedFallback ? executedProviderName : null,
      cacheHit: false,
    });

    return result;
  }

  /**
   * Dispatches call to provider with a strict timeout wrapper.
   */
  async invokeWithTimeout(provider, request, timeoutMs) {
    let timerId;
    const timeoutPromise = new Promise((_, reject) => {
      timerId = setTimeout(() => {
        reject(new Error(`AI Provider "${provider.name}" timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
    });

    try {
      let execPromise;
      if (
        request.taskType === AI_TASK_TYPES.USER_INSTRUCTION ||
        request.taskType === AI_TASK_TYPES.PATTERN_MODIFICATION_COMMAND
      ) {
        if (typeof provider.interpretInstruction === 'function') {
          execPromise = provider.interpretInstruction(request.userInstruction, {
            ...request.options,
            garmentSpecification: request.garmentSpecification,
          });
        } else {
          execPromise = provider.analyzeGarment(request.userInstruction, request.options);
        }
      } else {
        execPromise = provider.analyzeGarment(request.images, {
          ...request.options,
          taskType: request.taskType,
          existingSpecification: request.garmentSpecification,
          userCorrections: request.options?.userCorrections,
        });
      }

      const result = await Promise.race([execPromise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timerId);
    }
  }

  // =========================================================================
  // PUBLIC STABLE INTERFACE (Do not expose provider names to UI components)
  // =========================================================================

  /**
   * Full Garment Vision Analysis.
   * Primary routed to Gemini.
   */
  async analyzeGarment(images, options = {}) {
    return this.executeRequest({
      taskType: AI_TASK_TYPES.FULL_GARMENT_ANALYSIS,
      projectId: options.projectId || 'default',
      images,
      garmentSpecification: options.garmentSpecification || options.existingSpecification,
      options,
    });
  }

  /**
   * Seam & Construction Analysis.
   * Primary routed to Gemini.
   */
  async analyzeConstruction(images, options = {}) {
    return this.executeRequest({
      taskType: AI_TASK_TYPES.CONSTRUCTION_ANALYSIS,
      projectId: options.projectId || 'default',
      images,
      garmentSpecification: options.garmentSpecification || options.existingSpecification,
      options: { ...options, mode: 'construction' },
    });
  }

  /**
   * Fabric & Material Drape Analysis.
   * Primary routed to Gemini.
   */
  async analyzeFabric(images, options = {}) {
    return this.executeRequest({
      taskType: AI_TASK_TYPES.FABRIC_ANALYSIS,
      projectId: options.projectId || 'default',
      images,
      garmentSpecification: options.garmentSpecification || options.existingSpecification,
      options: { ...options, mode: 'fabric' },
    });
  }

  /**
   * Targeted Detail Verification.
   * Primary routed to Gemini.
   */
  async verifyGarment(images, options = {}) {
    return this.executeRequest({
      taskType: AI_TASK_TYPES.DETAIL_VERIFICATION,
      projectId: options.projectId || 'default',
      images,
      garmentSpecification: options.garmentSpecification || options.existingSpecification,
      options: { ...options, mode: 'verification' },
    });
  }

  /**
   * Natural-Language User Instruction & Modification Command.
   * Primary routed to Groq.
   */
  async interpretUserInstruction(userInstruction, options = {}) {
    return this.executeRequest({
      taskType: AI_TASK_TYPES.USER_INSTRUCTION,
      projectId: options.projectId || 'default',
      userInstruction,
      garmentSpecification: options.garmentSpecification || options.existingSpecification,
      options,
    });
  }

  /**
   * Clarification query.
   * Routed to Gemini if visual imagery present, Groq if text-only.
   */
  async requestClarification(questions, options = {}) {
    return this.executeRequest({
      taskType: AI_TASK_TYPES.CLARIFICATION,
      projectId: options.projectId || 'default',
      images: options.images || [],
      userInstruction: typeof questions === 'string' ? questions : JSON.stringify(questions),
      garmentSpecification: options.garmentSpecification,
      options,
    });
  }

  /**
   * Visual Interpretation (Fashion illustration / production flats).
   */
  async interpretVisual(garmentSpecification, options = {}) {
    return this.executeRequest({
      taskType: AI_TASK_TYPES.VISUAL_INTERPRETATION,
      projectId: options.projectId || 'default',
      garmentSpecification,
      options,
    });
  }

  /**
   * Invalidate project cache upon authoritative human corrections.
   */
  invalidateProjectCache(projectId) {
    this.cache.invalidateProject(projectId);
  }

  /**
   * Validates pattern generation gate.
   * Enforces: NEVER route an unknown garment to trousers.
   */
  checkPatternGate(garmentSpecification, options = {}) {
    return checkPatternGenerationGate(garmentSpecification, options);
  }

  /**
   * Deterministically applies an AI structured command to a GarmentSpecification.
   * Tailorix mutates the specification; the pattern engine then re-generates geometry.
   * 
   * @param {Object} command - { action, target, operation, value, unit, replacement, component }
   * @param {Object} garmentSpec - Current GarmentSpecification
   * @returns {Object} Updated GarmentSpecification
   */
  executePatternCommand(command = {}, garmentSpec = {}) {
    if (!command || !command.action) return garmentSpec;

    const updated = JSON.parse(JSON.stringify(garmentSpec));
    updated.version = (updated.version || 1) + 1;

    // Track user command authoritatively
    if (!updated.userCorrections) updated.userCorrections = {};

    switch (command.action) {
      case PATTERN_COMMAND_ACTIONS.MODIFY_MEASUREMENT: {
        const { target, operation, value, unit } = command;
        if (!updated.measurements) updated.measurements = {};
        const currentVal = updated.measurements[target] ?? 0;
        const delta = operation === 'subtract' ? -value : value;
        updated.measurements[target] = Math.max(0, currentVal + delta);
        updated.userCorrections[`measurements.${target}`] = updated.measurements[target];
        break;
      }

      case PATTERN_COMMAND_ACTIONS.REMOVE_COMPONENT: {
        const { target } = command;
        if (target.includes('pocket')) {
          updated.pockets = (updated.pockets || []).filter((p) => !p.placement?.includes('back'));
          updated.userCorrections['pockets'] = updated.pockets;
        } else if (target.includes('collar')) {
          updated.collar = { type: 'none' };
          updated.userCorrections['collar.type'] = 'none';
        } else if (target.includes('dart')) {
          updated.darts = [];
          updated.userCorrections['darts'] = [];
        }
        break;
      }

      case PATTERN_COMMAND_ACTIONS.REPLACE_COMPONENT: {
        const { target, replacement } = command;
        if (target === 'sleeve_construction' || target.includes('sleeve')) {
          if (!updated.sleeve) updated.sleeve = {};
          updated.sleeve.type = replacement;
          updated.sleeve.construction = replacement === 'raglan' ? 'raglan_split' : replacement;
          updated.userCorrections['sleeve.type'] = replacement;
        } else if (target === 'front_dart' || target.includes('dart')) {
          updated.darts = (updated.darts || []).filter((d) => !d.placement?.includes('front'));
          if (!updated.seams) updated.seams = [];
          updated.seams.push({ type: 'princess', placement: 'front_bodice' });
          updated.userCorrections['front_construction'] = 'princess_seams';
        }
        break;
      }

      case PATTERN_COMMAND_ACTIONS.ADD_COMPONENT: {
        const { component } = command;
        if (component.includes('waistband')) {
          updated.waistband = { type: 'contour', height: 1.5 };
          updated.userCorrections['waistband.type'] = 'contour';
        } else if (component.includes('pocket')) {
          if (!updated.pockets) updated.pockets = [];
          updated.pockets.push({ type: 'patch', placement: 'chest_left' });
          updated.userCorrections['pockets'] = updated.pockets;
        }
        break;
      }

      default:
        break;
    }

    // Immediately invalidate cache for this project so changes take effect
    if (updated.id) {
      this.invalidateProjectCache(updated.id);
    }

    return updated;
  }
}

export const aiOrchestrator = new AIOrchestrator();
