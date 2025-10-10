import { Platform } from 'react-native';

// Get the correct localhost URL based on platform
const getBaseURL = () => {
  if (Platform.OS === 'android') {
    // For Android emulator, use 10.0.2.2 to access host machine
    return 'http://10.0.2.2:3000/api';
  } else if (Platform.OS === 'ios') {
    // For iOS simulator, use 127.0.0.1
    return 'http://127.0.0.1:3000/api';
  } else {
    // For web and other platforms
    return 'http://127.0.0.1:3000/api';
  }
};

export const API_BASE_URL = getBaseURL();

export const testConnection = async () => {
  try {
    console.log('Testing connection to:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Backend connection test:', data);
    return data.success;
  } catch (error) {
    console.error('Backend connection failed:', error);
    console.error('API_BASE_URL:', API_BASE_URL);
    return false;
  }
};
