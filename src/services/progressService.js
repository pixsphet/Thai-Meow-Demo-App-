import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserStats = async () => {
  try {
    const response = await apiClient.get('/user/stats');
    return response.data?.stats || response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching legacy user stats:', error?.message);
    return null;
  }
};

export const postUserStats = async (payload) => {
  try {
    const response = await apiClient.post('/user/stats', { stats: payload });
    return response.data?.stats || response.data?.data || null;
  } catch (error) {
    console.error('Error posting legacy user stats:', error?.message);
    return null;
  }
};

export const tickDailyStreak = async () => {
  try {
    const response = await apiClient.post('/streak/tick');
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
export const saveProgress = async (lessonId, payload = {}) => {
  try {
    if (!payload || typeof payload !== 'object') {
      console.warn('⚠️ Cannot save null/undefined payload');
      return { success: false, error: 'Payload is required' };
    }

    const lessonIdStr = typeof lessonId === 'object' ? lessonId.lessonId || lessonId : lessonId;
    const payloadWithMeta = {
      lessonId: String(lessonIdStr),
      ...payload,
      updatedAt: Date.now(),
    };

    await saveAutosnap(lessonId, payloadWithMeta);
    console.log('💾 Saved progress locally');
    
    await apiClient.post('/progress/user/session', payloadWithMeta);
    console.log('🌐 Saved progress to server');
    
    return { success: true, progress: payloadWithMeta };
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
      const { data } = await apiClient.get('/progress/user/session', { 
        params: { lessonId }
      });
      const serverProgress = data?.progress || data?.data || null;
      if (serverProgress) {
        console.log('🌐 Restored progress from server');
        await saveAutosnap(lessonId, serverProgress);
        return serverProgress;
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

// Local-only save (for quick saves without server sync)
export const saveLocal = async (userId, lessonId, data) => {
  try {
    const key = `progress:local:${userId}:${lessonId}`;
    await AsyncStorage.setItem(key, JSON.stringify({
      ...data,
      savedAt: Date.now(),
    }));
    console.log('💾 Saved to local storage only');
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving locally:', error);
    return { success: false, error: error.message };
  }
};

// Local-only load
export const loadLocal = async (userId, lessonId) => {
  try {
    const key = `progress:local:${userId}:${lessonId}`;
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      console.log('💾 Loaded from local storage');
      return JSON.parse(raw);
    }
    return null;
  } catch (error) {
    console.error('❌ Error loading from local storage:', error);
    return null;
  }
};

// Clear progress (both local and server)
export const clearProgress = async (lessonId) => {
  try {
    // ลบจาก AsyncStorage
    await clearAutosnap(lessonId);
    
    // ลบจาก API
    await apiClient.delete('/progress/user/session', { 
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

/**
 * Reset all lesson progress for fresh start
 */
export const resetAllLessonProgress = async () => {
  try {
    console.log('🔄 Resetting all lesson progress...');
    
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Find all progress keys (they contain 'progress')
    const progressKeys = allKeys.filter(key => 
      key.includes('progress') || 
      key.includes('lesson') ||
      key.includes('game_session') ||
      key.includes('userStats')
    );
    
    // Remove all progress keys
    if (progressKeys.length > 0) {
      await AsyncStorage.multiRemove(progressKeys);
      console.log(`✅ Cleared ${progressKeys.length} progress entries`);
    }
    
    return { success: true, cleared: progressKeys.length };
  } catch (error) {
    console.error('❌ Error resetting all progress:', error);
    throw error;
  }
};

/**
 * Reset specific lesson progress
 */
export const resetLessonProgress = async (lessonId) => {
  try {
    console.log(`🔄 Resetting progress for lesson ${lessonId}...`);
    
    const key = `${STORAGE_KEYS.LESSON_PROGRESS}_${lessonId}`;
    await AsyncStorage.removeItem(key);
    
    console.log(`✅ Lesson ${lessonId} progress cleared`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Error resetting lesson ${lessonId}:`, error);
    throw error;
  }
};

/**
 * ✨ NUCLEAR OPTION: Reset everything to starting state
 * Clears all progress, unlocks, stats - back to level 1 only
 */
export const resetEverything = async () => {
  try {
    console.log('🔄 === RESETTING EVERYTHING ===');
    
    const allKeys = await AsyncStorage.getAllKeys();
    console.log(`📋 Found ${allKeys.length} keys`);
    
    // Filter all progress-related keys
    const keysToDelete = allKeys.filter(key => {
      const toDelete = 
        key.includes('progress') ||
        key.includes('lesson') ||
        key.includes('game_session') ||
        key.includes('userStats') ||
        key.includes('unlock') ||
        key.includes('streak') ||
        key.includes('xp') ||
        key.includes('diamonds') ||
        key.includes('hearts') ||
        key.includes('accuracy') ||
        key.includes('completed') ||
        key.includes('attempts') ||
        key.includes('questions');
      
      if (toDelete) {
        console.log(`  🗑️  ${key}`);
      }
      return toDelete;
    });
    
    console.log(`\n🗑️  Total keys to delete: ${keysToDelete.length}`);
    
    if (keysToDelete.length > 0) {
      await AsyncStorage.multiRemove(keysToDelete);
      console.log('✅ Deleted all progress keys');
    }
    
    // Also try to reset via backend
    try {
      await apiClient.post('/user/reset-all-progress');
      console.log('☁️  Backend reset completed');
    } catch (err) {
      console.warn('⚠️  Backend reset failed (offline?):', err?.message);
    }
    
    console.log('✅ === EVERYTHING RESET! BACK TO SQUARE ONE ===\n');
    return { success: true, cleared: keysToDelete.length };
  } catch (error) {
    console.error('❌ Error resetting everything:', error);
    throw error;
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
  saveLocal,
  loadLocal,
  fetchUserProgress,
  resetEverything
};
