import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get correct baseURL for each platform - Updated for real API server (Fixed double /api issue)
const getBaseURL = () => {
  console.log('🔧 [PLATFORM DEBUG] Platform.OS:', Platform.OS);
  console.log('🔧 [PLATFORM DEBUG] Platform.Version:', Platform.Version);
  
  if (Platform.OS === 'android') {
    // Android emulator
    console.log('🔧 [PLATFORM DEBUG] Using Android URL: http://10.0.2.2:3000');
    return 'http://10.0.2.2:3000';
  } else if (Platform.OS === 'ios') {
    // iOS simulator - use localhost for simulator
    console.log('🔧 [PLATFORM DEBUG] Using iOS URL: http://localhost:3000');
    return 'http://localhost:3000';
  } else {
    // Web and other platforms
    console.log('🔧 [PLATFORM DEBUG] Using Web/Other URL: http://localhost:3000');
    return 'http://localhost:3000';
  }
};

const BASE = getBaseURL();

// Debug logging to verify the correct URL is being used
console.log('🔧 [API CLIENT] Base URL configured as:', BASE);
console.log('🔧 [API CLIENT] Full API URL will be:', `${BASE}/api`);

const api = axios.create({
  baseURL: `${BASE}/api`,
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
      console.error(`❌ [NETWORK ERROR] Please check if backend server is running on ${BASE}`);
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
