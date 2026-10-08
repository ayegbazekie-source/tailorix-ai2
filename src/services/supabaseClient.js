import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta?.env && import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process?.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

export const invokeDeconstructGateway = async (options) => {
  try {
    let endpoint = '/api/deconstruct-garment';
    if (typeof window === 'undefined') {
      const port = process.env.PORT || 3000;
      endpoint = `http://127.0.0.1:${port}/api/deconstruct-garment`;
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options?.body || {}),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return {
        data,
        error: new Error(data?.error?.message || data?.message || `HTTP ${res.status} from /api/deconstruct-garment`),
      };
    }
    return { data, error: null };
  } catch (err) {
    if (typeof window === 'undefined') {
      try {
        const { handleDeconstructRequest } = await import('../../server/deconstructGateway.ts');
        const result = await handleDeconstructRequest(options?.body || {});
        if (!result.success) {
          return { data: result, error: new Error(result.error?.message || 'Gateway error') };
        }
        return { data: result, error: null };
      } catch (importErr) {
        // Fall through
      }
    }
    return { data: null, error: err };
  }
};

const createFunctionsInterceptor = (originalFunctions) => ({
  invoke: async (functionName, options) => {
    if (functionName === 'deconstruct-garment') {
      return invokeDeconstructGateway(options);
    }
    if (originalFunctions && typeof originalFunctions.invoke === 'function') {
      return originalFunctions.invoke(functionName, options);
    }
    return { data: null, error: new Error(`Edge function ${functionName} not available`) };
  },
});

let client = null;
if (isConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
    const interceptor = createFunctionsInterceptor(client.functions);
    Object.defineProperty(client, 'functions', {
      get: () => interceptor,
      configurable: true,
      enumerable: true,
    });
  } catch (err) {
    console.warn('[Tailorix AI] Supabase initialization failed, activating in-memory client:', err);
  }
}

if (!client) {
  const dummyInterceptor = createFunctionsInterceptor(null);
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase credentials not configured') }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null }),
    }),
    functions: dummyInterceptor,
  };
}

export const supabase = client;

