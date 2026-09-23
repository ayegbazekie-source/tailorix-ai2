/**
 * TAILORIX AI — DETERMINISTIC AI CACHE
 * Stage 2.5 Caching & Invalidation Layer
 * 
 * Prevents duplicate LLM / Vision calls for identical requests while
 * guaranteeing that authoritative human corrections immediately invalidate stale cache.
 */

class AICache {
  constructor(maxEntries = 100) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
    };
  }

  /**
   * Generates a deterministic hash key for an AI request context.
   */
  generateKey(request = {}) {
    const {
      taskType = 'unknown',
      projectId = 'default',
      images = [],
      userInstruction = '',
      garmentSpecification = null,
      options = {},
      provider = 'default',
      model = 'default',
    } = request;

    // Build unique image fingerprint
    const imageFingerprints = (Array.isArray(images) ? images : [images])
      .map((img) => {
        if (!img) return '';
        if (typeof img === 'string') {
          // If data URI or base64, sample length and checksum endpoints
          return `${img.length}_${img.slice(0, 32)}_${img.slice(-32)}`;
        }
        return `${img.id || ''}_${img.role || ''}_${img.name || ''}_${(img.data || '').length}`;
      })
      .join('|');

    // Build spec fingerprint
    let specFingerprint = '';
    if (garmentSpecification) {
      specFingerprint = `${garmentSpecification.id || ''}_${garmentSpecification.version || 1}_${garmentSpecification.status || ''}`;
      // Include any user corrections if present
      const userCorrections = garmentSpecification.userCorrections || options.userCorrections;
      if (userCorrections) {
        specFingerprint += `_uc:${JSON.stringify(userCorrections)}`;
      }
    }

    const cleanInstruction = (userInstruction || '').trim().toLowerCase();
    const mode = options.mode || 'full';
    const targetField = options.targetField || '';

    return `${projectId}::${taskType}::${provider}::${model}::${mode}::${targetField}::${imageFingerprints}::${specFingerprint}::${cleanInstruction}`;
  }

  /**
   * Retrieves a cached result if available and fresh.
   */
  get(request) {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL if configured (default 1 hour)
    if (Date.now() - entry.timestamp > (request.options?.ttlMs || 3600000)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Stores a result in the cache.
   */
  set(request, data) {
    if (!data) return;

    // Do not cache error responses or unresolved ambiguous queries
    if (data.status === 'error' || data.success === false) return;

    const key = this.generateKey(request);

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      projectId: request.projectId || 'default',
    });
  }

  /**
   * Invalidates cache entries for a specific project.
   * Called whenever user applies corrections or updates specification.
   */
  invalidateProject(projectId) {
    if (!projectId) return;
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.projectId === projectId || key.startsWith(`${projectId}::`)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.invalidations += count;
  }

  /**
   * Invalidates all cache entries.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Gets telemetry stats.
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
    };
  }
}

export const aiCache = new AICache();
