/**
 * TAILORIX AI — AI PROVIDER REGISTRY
 * Stage 2.5 Multi-Provider Registry
 * 
 * Manages provider instances (Gemini, Groq, OpenAI, Mock).
 * Allows dynamic registration and retrieval without breaking downstream consumers.
 */

import { MockAIProvider } from './mockAIProvider';
import { GeminiProvider } from './providers/geminiProvider';
import { GroqProvider } from './providers/groqProvider';
import { OpenAIProvider } from './providers/openaiProvider';
import { AI_PROVIDERS } from './aiTypes';

class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.activeProviderName = AI_PROVIDERS.GEMINI;

    // Register all standard providers
    this.register(AI_PROVIDERS.MOCK, new MockAIProvider());
    this.register(AI_PROVIDERS.GEMINI, new GeminiProvider());
    this.register(AI_PROVIDERS.GROQ, new GroqProvider());
    this.register(AI_PROVIDERS.OPENAI, new OpenAIProvider());
  }

  register(name, providerInstance) {
    if (!name || !providerInstance) {
      throw new Error('Provider name and instance are required.');
    }
    this.providers.set(name.toLowerCase(), providerInstance);
  }

  getProvider(name) {
    if (!name) return null;
    return this.providers.get(name.toLowerCase()) || null;
  }

  setActiveProvider(name) {
    const key = name.toLowerCase();
    if (!this.providers.has(key)) {
      throw new Error(`Provider "${name}" is not registered.`);
    }
    this.activeProviderName = key;
  }

  getActiveProvider() {
    const provider = this.providers.get(this.activeProviderName);
    if (!provider) {
      return this.providers.get(AI_PROVIDERS.GEMINI) || this.providers.get(AI_PROVIDERS.MOCK);
    }
    return provider;
  }

  getRegisteredProviders() {
    return Array.from(this.providers.keys());
  }
}

export const providerRegistry = new ProviderRegistry();
