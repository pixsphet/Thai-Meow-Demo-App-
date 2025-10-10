import axios from 'axios';
import { API_BASE_URL } from './networkService';

// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = global.authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('Full error:', error);
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('Network connection failed. Please check if backend server is running on port 3000');
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // User management
  async getUser(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async createUser(userData) {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(userId, userData) {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Progress management
  async getProgress(userId) {
    try {
      const response = await apiClient.get(`/progress/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress:', error);
      return {};
    }
  },

  async updateProgress(userId, lessonKey, completed, score) {
    try {
      const response = await apiClient.post('/progress', {
        userId,
        lessonKey,
        completed,
        score,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  },

  async getSessionProgress(userId) {
    try {
      const response = await apiClient.get(`/progress/session/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session progress:', error);
      return {};
    }
  },

  // Vocabulary management
  async getVocabularies(category) {
    try {
      const response = await apiClient.get(`/vocab/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vocabularies:', error);
      return [];
    }
  },

  async getVocabularyById(id) {
    try {
      const response = await apiClient.get(`/vocab/item/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vocabulary item:', error);
      return null;
    }
  },

  // Lessons management
  async getLessons(category) {
    try {
      const response = await apiClient.get(`/lessons/${category}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }
  },

  async getLessonById(id) {
    try {
      const response = await apiClient.get(`/lessons/item/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      return null;
    }
  },

  // Game results
  async saveGameResult(resultData) {
    try {
      const response = await apiClient.post('/game-results', resultData);
      return response.data;
    } catch (error) {
      console.error('Error saving game result:', error);
      throw error;
    }
  },

  async getGameResults(userId, limit = 10) {
    try {
      const response = await apiClient.get(`/game-results/${userId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching game results:', error);
      return [];
    }
  },

  // TTS Integration
  async getTtsAudio(text, emotion = 'happy') {
    try {
      // Import vaja9TtsService dynamically to avoid circular dependency
      const { vaja9TtsService } = await import('./vaja9TtsService');
      const audioUrl = await vaja9TtsService.getAudio(text, emotion);
      return audioUrl;
    } catch (error) {
      console.error('Error getting TTS audio:', error);
      return null;
    }
  },

  // Authentication
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data;
      global.authToken = token;
      return { success: true, token, user };
    } catch (error) {
      console.error('Error logging in:', error);
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  },

  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      const { token, user } = response.data;
      global.authToken = token;
      return { success: true, token, user };
    } catch (error) {
      console.error('Error registering:', error);
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  },

  async logout() {
    global.authToken = null;
  },
};
