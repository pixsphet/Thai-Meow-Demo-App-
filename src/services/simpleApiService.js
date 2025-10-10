import { Platform } from 'react-native';

// Simple API service without axios to avoid network issues
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  } else {
    // For iOS Simulator, use localhost
    return 'http://localhost:3000/api';
  }
};

const API_BASE_URL = getBaseURL();

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('🌐 Making request to:', url);
  
  // Debug network info
  console.log('=== Network Debug Info ===');
  console.log('Platform:', Platform.OS);
  console.log('Platform Version:', Platform.Version);
  console.log('API Call:', endpoint, options.method || 'GET');
  console.log('Full URL:', url);
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...options,
  };

  try {
    console.log('📡 Sending request with options:', defaultOptions);
    console.log('🌐 Full URL:', url);
    console.log('📤 Request body:', defaultOptions.body);
    
    const response = await fetch(url, defaultOptions);
    console.log('📨 Response status:', response.status);
    console.log('📨 Response headers:', response.headers);
    console.log('📨 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP Error Response:', errorText);
      
      // Try to parse error response as JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { success: false, error: errorText };
      }
      
      // Return error data instead of throwing
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`,
        data: errorData
      };
    }
    
    const data = await response.json();
    console.log('✅ API response data:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ API request failed:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Handle specific error types
    if (error.message.includes('Network request failed')) {
      return {
        success: false,
        error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        data: null
      };
    } else if (error.message.includes('401')) {
      return {
        success: false,
        error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        data: null
      };
    } else if (error.message.includes('404')) {
      return {
        success: false,
        error: 'ไม่พบ API endpoint ที่ต้องการ',
        data: null
      };
    } else {
      return {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        data: null
      };
    }
  }
};

export const simpleApiService = {
  // Make request function
  makeRequest,
  
  // Test connection
  async testConnection() {
    return makeRequest('/health');
  },

  // Authentication
  async login(email, password) {
    return makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(userData) {
    return makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Vocabulary
  async getConsonants() {
    return makeRequest('/vocabulary/consonants/all');
  },

  async getVowels() {
    return makeRequest('/vocabulary/vowels/all');
  },

  async getTones() {
    return makeRequest('/vocabulary/tones/all');
  },
};

export default simpleApiService;
