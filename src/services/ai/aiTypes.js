/**
 * TAILORIX AI — AI TASK TAXONOMY & TYPES
 * Stage 2.5 AI Orchestration Layer
 */

export const AI_TASK_TYPES = Object.freeze({
  FULL_GARMENT_ANALYSIS: 'full_garment_analysis',
  CONSTRUCTION_ANALYSIS: 'construction_analysis',
  FABRIC_ANALYSIS: 'fabric_analysis',
  DETAIL_VERIFICATION: 'detail_verification',
  GARMENT_VERIFICATION: 'garment_verification',
  USER_INSTRUCTION: 'user_instruction',
  PATTERN_MODIFICATION_COMMAND: 'pattern_modification_command',
  CLARIFICATION: 'clarification',
  VISUAL_INTERPRETATION: 'visual_interpretation',
});

export const AI_PROVIDERS = Object.freeze({
  GEMINI: 'gemini',
  GROQ: 'groq',
  OPENAI: 'openai',
  MOCK: 'mock',
});

export const IMAGE_ROLES = Object.freeze({
  FRONT: 'front',
  BACK: 'back',
  SIDE: 'side',
  DETAIL: 'detail',
  CLOSEUP: 'closeup',
  SLEEVE: 'sleeve',
  POCKET: 'pocket',
  COLLAR: 'collar',
  CONSTRUCTION: 'construction',
  FABRIC: 'fabric',
  CONCEPT: 'concept',
  UNKNOWN: 'unknown',
});

export const RISK_LEVELS = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
});

export const RECOMMENDED_ACTIONS = Object.freeze({
  CONTINUE: 'continue',
  CLARIFY: 'clarify',
  REQUEST_IMAGES: 'request_images',
  VERIFY: 'verify',
});

export const AI_ERROR_CODES = Object.freeze({
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  INVALID_IMAGE: 'INVALID_IMAGE',
  IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  ANALYSIS_UNCERTAIN: 'ANALYSIS_UNCERTAIN',
  MISSING_EVIDENCE: 'MISSING_EVIDENCE',
  CONTRADICTORY_INPUT: 'CONTRADICTORY_INPUT',
  INVALID_AI_OUTPUT: 'INVALID_AI_OUTPUT',
  PATTERN_GENERATION_BLOCKED: 'PATTERN_GENERATION_BLOCKED',
  UNSUPPORTED_CAPABILITY: 'UNSUPPORTED_CAPABILITY',
  ORCHESTRATOR_TIMEOUT: 'ORCHESTRATOR_TIMEOUT',
});

export const PATTERN_COMMAND_ACTIONS = Object.freeze({
  MODIFY_MEASUREMENT: 'modify_measurement',
  ADD_COMPONENT: 'add_component',
  REMOVE_COMPONENT: 'remove_component',
  REPLACE_COMPONENT: 'replace_component',
  UPDATE_SILHOUETTE: 'update_silhouette',
  UPDATE_FABRIC: 'update_fabric',
});
