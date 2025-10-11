import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineService from './offlineService';

// User Stats API calls (no userId needed - server gets from JWT)
export const getUserStats = async () => {
  try {
    const { data } = await apiClient.get('/user/stats');
    return data?.stats || null;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
};

export const postUserStats = async (payload) => {
  try {
    const { data } = await apiClient.post('/user/stats', { stats: payload });
    return data?.stats || null;
  } catch (error) {
    console.error('Error updating user stats:', error);
    return null;
  }
};

export const tickDailyStreak = async () => {
  try {
    const { data } = await apiClient.post('/streak/tick');
    return data;
  } catch (error) {
    console.error('Error ticking daily streak:', error);
    return null;
  }
};

// Progress session API calls (no userId needed - server gets from JWT)
export const saveProgressSession = async (payload) => {
  try {
    const { data } = await apiClient.post('/progress/user/session', payload);
    return data;
  } catch (error) {
    console.error('Error saving progress session:', error);
    return null;
  }
};

export const loadProgressSession = async (lessonId) => {
  try {
    const { data } = await apiClient.get('/progress/user/session', { 
      params: { lessonId } 
    });
    return data;
  } catch (error) {
    console.error('Error loading progress session:', error);
    return null;
  }
};

export const deleteProgressSession = async (lessonId) => {
  try {
    const { data } = await apiClient.delete('/progress/user/session', { 
      params: { lessonId } 
    });
    return data;
  } catch (error) {
    console.error('Error deleting progress session:', error);
    return null;
  }
};

export const finishLesson = async (payload) => {
  try {
    const { data } = await apiClient.post('/progress/finish', payload);
    return data;
  } catch (error) {
    console.error('Error finishing lesson:', error);
    return null;
  }
};

export const getAllUserProgress = async () => {
  try {
    const { data } = await apiClient.get('/progress/user');
    return data || [];
  } catch (error) {
    console.error('Error fetching all user progress:', error);
    return [];
  }
};

// Autosave functions with per-user keys
const autosaveKey = async (lessonId) => {
  const uid = await getCurrentUserId();
  return `autosave:${uid || 'demo'}:${lessonId}`;
};

// Helper function to get current user ID
const getCurrentUserId = async () => {
  try {
    const user = await AsyncStorage.getItem('userData');
    return user ? JSON.parse(user).id : null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

export const saveAutosnap = async (lessonId, snapshot) => {
  try {
    const key = await autosaveKey(lessonId);
    await AsyncStorage.setItem(key, JSON.stringify(snapshot));
    console.log('💾 Saved autosnap locally');
  } catch (error) {
    console.error('Error saving autosnap:', error);
  }
};

export const loadAutosnap = async (lessonId) => {
  try {
    const key = await autosaveKey(lessonId);
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error loading autosnap:', error);
    return null;
  }
};

export const clearAutosnap = async (lessonId) => {
  try {
    const key = await autosaveKey(lessonId);
    await AsyncStorage.removeItem(key);
    console.log('🗑️ Cleared autosnap');
  } catch (error) {
    console.error('Error clearing autosnap:', error);
  }
};

// Combined save function (local + server with offline support)
export const saveProgress = async (lessonId, payload) => {
  try {
    // Save locally first
    await saveAutosnap(lessonId, payload);
    
    // Save to server with offline support
    await offlineService.saveProgressWithOfflineSupport(lessonId, payload);
    
    console.log('✅ Progress saved locally and to server');
    return { success: true };
  } catch (error) {
    console.error('Error saving progress:', error);
    return { success: false, error: error.message };
  }
};

// Combined restore function (server first, then local)
export const restoreProgress = async (lessonId) => {
  try {
    // Try server first
    const serverData = await loadProgressSession(lessonId);
    if (serverData) {
      console.log('🌐 Restored progress from server');
      return serverData;
    }
    
    // Fallback to local
    const localData = await loadAutosnap(lessonId);
    if (localData) {
      console.log('💾 Restored progress from local storage');
      return localData;
    }
    
    console.log('📭 No progress found');
    return null;
  } catch (error) {
    console.error('Error restoring progress:', error);
    return null;
  }
};

// Clear progress (both local and server)
export const clearProgress = async (lessonId) => {
  try {
    await Promise.all([
      clearAutosnap(lessonId),
      deleteProgressSession(lessonId)
    ]);
    
    console.log('🗑️ Cleared progress from local and server');
    return { success: true };
  } catch (error) {
    console.error('Error clearing progress:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getUserStats,
  postUserStats,
  tickDailyStreak,
  saveProgressSession,
  loadProgressSession,
  deleteProgressSession,
  finishLesson,
  getAllUserProgress,
  saveAutosnap,
  loadAutosnap,
  clearAutosnap,
  saveProgress,
  restoreProgress,
  clearProgress
};
