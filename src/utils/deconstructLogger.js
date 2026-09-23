/**
 * TAILORIX AI — STRUCTURED DEVELOPMENT LOGGER
 * 
 * Provides tagged, human-readable logging for deterministic tracking
 * through the deconstruct intelligence and pattern generation pipeline.
 */

const PREFIXES = {
  DECONSTRUCT: '[TAILORIX DECONSTRUCT]',
  SPEC: '[TAILORIX SPEC]',
  REASONING: '[TAILORIX REASONING]',
  ROUTER: '[TAILORIX ROUTER]',
  ORCHESTRATOR: '[TAILORIX ORCHESTRATOR]',
  GATE: '[TAILORIX GATE]',
  PATTERN: '[TAILORIX PATTERN]',
  VALIDATOR: '[TAILORIX VALIDATOR]',
  TRANSFORMATION: '[TAILORIX TRANSFORMATION]',
};

export const logger = {
  deconstruct: (msg, data) => log(PREFIXES.DECONSTRUCT, msg, data),
  spec: (msg, data) => log(PREFIXES.SPEC, msg, data),
  reasoning: (msg, data) => log(PREFIXES.REASONING, msg, data),
  router: (msg, data) => log(PREFIXES.ROUTER, msg, data),
  orchestrator: (msg, data) => log(PREFIXES.ORCHESTRATOR, msg, data),
  gate: (msg, data) => log(PREFIXES.GATE, msg, data),
  pattern: (msg, data) => log(PREFIXES.PATTERN, msg, data),
  validator: (msg, data) => log(PREFIXES.VALIDATOR, msg, data),
  transformation: (msg, data) => log(PREFIXES.TRANSFORMATION, msg, data),
};

function log(prefix, msg, data) {
  if (data !== undefined) {
    console.log(`${prefix} ${msg}`, data);
  } else {
    console.log(`${prefix} ${msg}`);
  }
}
