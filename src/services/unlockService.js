import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNLOCK_CACHE_KEY = 'level_unlocks';

/**
 * Get user's unlocked levels from backend
 */
export const getUnlockedLevels = async () => {
  try {
    // Try to get from backend first
    try {
      const response = await apiClient.get(`/lessons/unlocked`);
      if (response.data?.success) {
        const unlockedLevels = response.data.data.unlockedLevels || ['level1'];
        console.log(`✅ Fetched unlocked levels from backend:`, unlockedLevels);
        
        // Cache locally
        const user = await AsyncStorage.getItem('userData');
        const userId = user ? JSON.parse(user).id : 'demo';
        await AsyncStorage.setItem(`${UNLOCK_CACHE_KEY}_${userId}`, JSON.stringify(unlockedLevels));
        return unlockedLevels;
      }
    } catch (apiError) {
      console.warn('⚠️ Backend fetch failed, trying cache:', apiError.message);
    }

    // Fallback to cached data
    const user = await AsyncStorage.getItem('userData');
    const userId = user ? JSON.parse(user).id : 'demo';
    const cached = await AsyncStorage.getItem(`${UNLOCK_CACHE_KEY}_${userId}`);
    if (cached) {
      const unlockedLevels = JSON.parse(cached);
      console.log(`📦 Using cached unlocked levels:`, unlockedLevels);
      return unlockedLevels;
    }

    // Default: only level1
    return ['level1'];
  } catch (error) {
    console.error('❌ Error getting unlocked levels:', error);
    return ['level1']; // Fallback to level1 only
  }
};

/**
 * Check if a level is unlocked for user
 */
export const isLevelUnlocked = async (levelId) => {
  try {
    const unlockedLevels = await getUnlockedLevels();
    return unlockedLevels.includes(levelId);
  } catch (error) {
    console.error('❌ Error checking level unlock:', error);
    return levelId === 'level1'; // Only level1 by default
  }
};

/**
 * Check unlock eligibility and unlock next level if qualified
 */
export const checkAndUnlockNext = async (levelId, { accuracy, score }) => {
  try {
    if (accuracy < 70) {
      return {
        success: true,
        message: `Need ≥70% to unlock (got ${accuracy}%)`,
        shouldUnlock: false,
      };
    }

    // Call backend to check and unlock (userId comes from JWT token)
    const response = await apiClient.post(`/lessons/check-unlock/${levelId}`, {
      accuracy,
      score,
    });

    if (response.data?.success) {
      const { shouldUnlock, nextLevel } = response.data.data;
      
      if (shouldUnlock) {
        // Update local cache
        const unlockedLevels = await getUnlockedLevels();
        if (!unlockedLevels.includes(nextLevel)) {
          unlockedLevels.push(nextLevel);
          const user = await AsyncStorage.getItem('userData');
          const userId = user ? JSON.parse(user).id : 'demo';
          await AsyncStorage.setItem(
            `${UNLOCK_CACHE_KEY}_${userId}`,
            JSON.stringify(unlockedLevels)
          );
          console.log(`🔓 ${nextLevel} unlocked and cached`);
        }
      }

      return {
        success: true,
        shouldUnlock,
        nextLevel,
        message: response.data.data.message,
      };
    }

    return {
      success: false,
      message: 'Failed to check unlock',
      shouldUnlock: false,
    };
  } catch (error) {
    console.warn('⚠️ Backend check-unlock failed:', error.message);
    // Fallback: allow local unlock management
    if (accuracy >= 70) {
      return {
        success: true,
        shouldUnlock: true,
        message: 'Unlocked (local)',
      };
    }
    return {
      success: true,
      shouldUnlock: false,
      message: `Need ≥70% (got ${accuracy}%)`,
    };
  }
};

/**
 * Reset all unlocks for user (admin function)
 */
export const resetAllUnlocks = async () => {
  try {
    // Clear cache
    const user = await AsyncStorage.getItem('userData');
    const userId = user ? JSON.parse(user).id : 'demo';
    await AsyncStorage.removeItem(`${UNLOCK_CACHE_KEY}_${userId}`);
    console.log(`🔄 Reset all unlocks for ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error resetting unlocks:', error);
    return { success: false, error: error.message };
  }
};

export default {
  getUnlockedLevels,
  isLevelUnlocked,
  checkAndUnlockNext,
  resetAllUnlocks,
};
