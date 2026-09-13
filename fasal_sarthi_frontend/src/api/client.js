import axios from 'axios';
import { supabaseClient } from '../lib/supabaseClient';

export const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredUrl && configuredUrl.trim()) {
    return configuredUrl.trim();
  }
  // In development mode, allow safe localhost fallback
  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }
  // In production mode, fail explicitly rather than silently pointing to localhost
  throw new Error(
    "Configuration Error: VITE_API_BASE_URL environment variable is required in production but was not configured."
  );
};

export const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000") : (import.meta.env.VITE_API_BASE_URL || ""),
  timeout: 30000,
});

// Request interceptor: Dynamic URL check + Attach Supabase JWT bearer token if session exists
apiClient.interceptors.request.use(
  async (config) => {
    // Dynamically validate production baseURL on request
    if (!config.baseURL && !config.url?.startsWith('http')) {
      config.baseURL = getApiBaseUrl();
    }

    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (!error && data?.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    } catch (e) {
      console.warn('Failed to attach Supabase session token to request:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract clean error message
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage = error.response?.data?.error || error.message || 'An unexpected error occurred';
    error.userMessage = customMessage;
    return Promise.reject(error);
  }
);

export default apiClient;
