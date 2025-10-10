import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserStats = async () => {
  try {
    const response = await apiClient.get('/user/stats/demo');
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching legacy user stats:', error?.message);
    return null;
  }
};

export const postUserStats = async (payload) => {
  try {
    const response = await apiClient.post('/user/stats', payload);
    return response.data?.stats || response.data?.data || null;
  } catch (error) {
    console.error('Error posting legacy user stats:', error?.message);
    return null;
  }
};

export const tickDailyStreak = async () => {
  try {
    const response = await apiClient.post('/user/streak/tick');
    return response.data;
  } catch (error) {
    console.error('Error ticking daily streak:', error?.message);
    return null;
  }
};

// autosave per-user
const autosaveKey = async (lessonId) => {
  const uid = await getCurrentUserId(); 
  const lessonIdStr = typeof lessonId === 'object' ? lessonId.lessonId || 'unknown' : String(lessonId);
  return `autosave:${uid || 'demo'}:${lessonIdStr}`;
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
  if (!snapshot) {
    console.warn('⚠️ Cannot save null/undefined snapshot');
    return;
  }
  try {
    await AsyncStorage.setItem(await autosaveKey(lessonId), JSON.stringify(snapshot));
    console.log('💾 Autosnap saved successfully');
  } catch (error) {
    console.error('❌ Error saving autosnap:', error);
  }
};

export const loadAutosnap = async (lessonId) => {
  const raw = await AsyncStorage.getItem(await autosaveKey(lessonId));
  return raw ? JSON.parse(raw) : null;
};

export const clearAutosnap = async (lessonId) =>
  AsyncStorage.removeItem(await autosaveKey(lessonId));

// Combined save function (local + server)
export const saveProgress = async (lessonId, payload) => {
  try {
    if (!payload) {
      console.warn('⚠️ Cannot save null/undefined payload');
      return { success: false, error: 'Payload is required' };
    }

    // บันทึกใน AsyncStorage ก่อน (local)
    await saveAutosnap(lessonId, payload);
    console.log('💾 Saved progress locally');
    
    // บันทึกใน API (server)
    await apiClient.post('/progress/session', payload);
    console.log('🌐 Saved progress to server');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving progress:', error);
    return { success: false, error: error.message };
  }
};

// Combined restore function (server first, then local)
export const restoreProgress = async (lessonId) => {
  try {
    // ลองดึงจาก API ก่อน
    try {
      const { data } = await apiClient.get('/progress/session', { 
        params: { lessonId } 
      });
      if (data) {
        console.log('🌐 Restored progress from server');
        return data;
      }
    } catch (apiError) {
      console.log('⚠️ API not available, trying local storage');
    }
    
    // ถ้า API ไม่ได้ ให้ดึงจาก AsyncStorage
    const local = await loadAutosnap(lessonId);
    if (local) {
      console.log('💾 Restored progress from local storage');
      return local;
    }
    
    console.log('📭 No progress found');
    return null;
  } catch (error) {
    console.error('❌ Error restoring progress:', error);
    return null;
  }
};

// Clear progress (both local and server)
export const clearProgress = async (lessonId) => {
  try {
    // ลบจาก AsyncStorage
    await clearAutosnap(lessonId);
    
    // ลบจาก API
    await apiClient.delete("/progress/session", { 
      params: { lessonId } 
    });
    
    console.log('🗑️ Cleared progress');
    return { success: true };
  } catch (error) {
    console.error('❌ Error clearing progress:', error);
    return { success: false, error: error.message };
  }
};

export const fetchUserProgress = async () => {
  try {
    const { data } = await apiClient.get(`/progress/user`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching user progress:', error);
    return [];
  }
};

export default {
  getUserStats,
  postUserStats,
  tickDailyStreak,
  saveAutosnap,
  loadAutosnap,
  clearAutosnap,
  saveProgress,
  restoreProgress,
  clearProgress,
  fetchUserProgress
};
