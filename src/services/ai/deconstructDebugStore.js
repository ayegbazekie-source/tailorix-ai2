/**
 * TAILORIX AI — DECONSTRUCT DEBUG STORE
 * Real-time diagnostic store for forensic pipeline verification.
 * Captures live state of:
 * - Last Request Payload
 * - Last AI Raw Response
 * - Normalized GarmentSpecification
 * - Resolved Pattern Engine
 * - Generated Pattern Pieces
 * - Validation Results
 */

class DeconstructDebugStore {
  constructor() {
    this.listeners = new Set();
    this.state = {
      lastRequest: null,
      lastAiResponse: null,
      normalizedSpec: null,
      resolvedEngine: null,
      patternPieces: [],
      validationResults: null,
      updatedAt: null,
    };
    this._notifyScheduled = false;
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    if (this._notifyScheduled) return;
    this._notifyScheduled = true;
    Promise.resolve().then(() => {
      this._notifyScheduled = false;
      const snapshot = { ...this.state };
      this.listeners.forEach((listener) => {
        try {
          listener(snapshot);
        } catch (err) {
          console.error('[DebugStore] Listener exception:', err);
        }
      });
    });
  }

  recordRequest(payload) {
    this.state = {
      ...this.state,
      lastRequest: {
        ...payload,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    };
    this.notify();
  }

  recordAiResponse(response) {
    this.state = {
      ...this.state,
      lastAiResponse: {
        ...response,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    };
    this.notify();
  }

  recordNormalization(spec) {
    this.state = {
      ...this.state,
      normalizedSpec: spec,
      updatedAt: Date.now(),
    };
    this.notify();
  }

  recordRouting(routing) {
    this.state = {
      ...this.state,
      resolvedEngine: routing,
      updatedAt: Date.now(),
    };
    this.notify();
  }

  recordPatternPieces(pieces, validation) {
    this.state = {
      ...this.state,
      patternPieces: (pieces || []).map((p) => ({
        id: p.id,
        name: p.name,
        pointCount: p.points?.length || 0,
        seamAllowance: p.seamAllowance,
        bounds: p.bounds || null,
      })),
      validationResults: validation || null,
      updatedAt: Date.now(),
    };
    this.notify();
  }

  clear() {
    this.state = {
      lastRequest: null,
      lastAiResponse: null,
      normalizedSpec: null,
      resolvedEngine: null,
      patternPieces: [],
      validationResults: null,
      updatedAt: Date.now(),
    };
    this.notify();
  }
}

export const deconstructDebugStore = new DeconstructDebugStore();
