import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PORT = process.env?.EXPO_PUBLIC_API_PORT || '3000';

const sanitizeUrl = (url) => {
  if (!url) return null;
  return String(url).replace(/\s/g, '').replace(/\/+$/, '');
};

const resolveApiOriginFromEnv = () => {
  const envUrl =
    process.env?.EXPO_PUBLIC_API_URL ||
    process.env?.EXPO_PUBLIC_API_ORIGIN ||
    process.env?.API_URL ||
    process.env?.API_ORIGIN;
  return sanitizeUrl(envUrl);
};

const resolveHostFromExpo = () => {
  const candidates = [
    Constants?.expoConfig?.hostUri,
    Constants?.expoConfig?.extra?.expoClient?.hostUri,
    Constants?.expoConfig?.extra?.expoClient?.host,
    Constants?.manifest2?.extra?.expoClient?.hostUri,
    Constants?.manifest2?.extra?.expoClient?.host,
    Constants?.manifest?.debuggerHost,
    Constants?.manifest?.hostUri,
  ].filter(Boolean);

  if (candidates.length === 0) {
    return null;
  }

  const hostPort = candidates[0]
    .replace(/^https?:\/\//, '')
    .split('/')[0];
  return hostPort.split(':')[0];
};

const resolveWebOrigin = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const { protocol, hostname } = window.location;
  if (!protocol || !hostname) {
    return null;
  }
  return `${protocol}//${hostname}:${DEFAULT_PORT}`;
};

const resolveApiOrigin = () => {
  const fromEnv = resolveApiOriginFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  if (Platform.OS === 'web') {
    const webOrigin = resolveWebOrigin();
    if (webOrigin) {
      return webOrigin;
    }
  }

  const expoHost = resolveHostFromExpo();
  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  if (Platform.OS === 'ios') {
    // Try to get host from Expo first, fallback to localhost
    const expoHost = resolveHostFromExpo();
    if (expoHost) {
      return `http://${expoHost}:${DEFAULT_PORT}`;
    }
    return `http://localhost:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
};

export const API_ORIGIN = resolveApiOrigin();
export const API_BASE_URL = `${API_ORIGIN}/api`;

console.log('🔧 [API CLIENT] Platform:', Platform.OS);
console.log('🔧 [API CLIENT] Origin:', API_ORIGIN);
console.log('🔧 [API CLIENT] Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and log requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const shouldAttachToken = (() => {
        const url = config.url || '';
        const method = (config.method || 'get').toLowerCase();
        if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/reset-password')) {
          return false;
        }
        // allow explicit opt-out
        if (config.headers?.SkipAuth) {
          delete config.headers.SkipAuth;
          return false;
        }
        return true;
      })();

      if (token && shouldAttachToken) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request details
      console.log(`🌐 [API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      console.log(`📤 [API REQUEST] Headers:`, config.headers);
      if (config.data) {
        console.log(`📤 [API REQUEST] Data:`, config.data);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ [API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to log responses and handle offline mode
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API RESPONSE] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log(`📥 [API RESPONSE] Data:`, response.data);
    return response;
  },
  (error) => {
    // Debug logging
    console.log(`🔍 [API ERROR DEBUG] Code: ${error.code}, Message: ${error.message}, Response: ${error.response?.status}`);
    
    // Handle network errors with better error messages
    const isNetworkError = error.code === 'NETWORK_ERROR' || 
                          error.message === 'Network Error' ||
                          error.message === 'ERR_NETWORK' ||
                          error.code === 'ERR_NETWORK' ||
                          !error.response ||
                          error.response?.status >= 500;
    
    if (isNetworkError) {
      console.error(`❌ [NETWORK ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Server unavailable`);
      console.error(`❌ [NETWORK ERROR] Please check if backend server is running on ${API_ORIGIN}`);
      // Add retry mechanism for network errors
      if (error.config && !error.config._retry) {
        error.config._retry = true;
        console.log(`🔄 [RETRY] Retrying request to ${error.config.url}`);
        return api.request(error.config);
      }
    }
    
    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase();
    const url = error.config?.url;

    console.error(`❌ [API RESPONSE ERROR] ${status || 'NETWORK'} ${method} ${url}`);
    console.error(`❌ [API RESPONSE ERROR] Message:`, error.message);
    if (error.response?.data) {
      console.error(`❌ [API RESPONSE ERROR] Data:`, error.response.data);
    }

    if (status === 401) {
      console.warn('🔐 Unauthorized response detected, clearing stored credentials');
      AsyncStorage.removeItem('authToken').catch(() => {});
      AsyncStorage.removeItem('userData').catch(() => {});
    }

    return Promise.reject(error);
  }
);

// Mock data removed - using real database connections

export default api;
