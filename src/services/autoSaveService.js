import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const AUTOSAVE_KEY = (lessonId) => `autosave:${lessonId}`;
const USER_STATS_KEY = 'user:stats';

class AutoSaveService {
  // Save progress to local storage only (avoid network errors)
  async saveProgress(progressData) {
    try {
      const { lessonId, userId = 'demo' } = progressData;
      
      // Save to local storage only (for offline support)
      await AsyncStorage.setItem(
        AUTOSAVE_KEY(lessonId), 
        JSON.stringify({
          ...progressData,
          lastSaved: Date.now()
        })
      );

      console.log('💾 Progress saved locally:', {
        lessonId,
        currentIndex: progressData.currentIndex,
        score: progressData.score
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      throw error;
    }
  }

  // Restore progress from local storage only
  async restoreProgress(lessonId, userId = 'demo') {
    try {
      // Use local storage only to avoid network errors
      const localData = await AsyncStorage.getItem(AUTOSAVE_KEY(lessonId));
      if (localData) {
        const progress = JSON.parse(localData);
        console.log('✅ Restored from local storage:', progress);
        return progress;
      }
    } catch (error) {
      console.error('❌ Error restoring from local storage:', error);
    }

    return null;
  }

  // Clear progress (when lesson is completed)
  async clearProgress(lessonId) {
    try {
      await AsyncStorage.removeItem(AUTOSAVE_KEY(lessonId));
      console.log('🗑️ Progress cleared for lesson:', lessonId);
    } catch (error) {
      console.error('❌ Error clearing progress:', error);
    }
  }

  // Save user stats locally
  async saveUserStats(stats) {
    try {
      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
      console.log('💾 User stats saved locally');
    } catch (error) {
      console.error('❌ Error saving user stats:', error);
    }
  }

  // Get user stats from local storage
  async getUserStats() {
    try {
      const stats = await AsyncStorage.getItem(USER_STATS_KEY);
      return stats ? JSON.parse(stats) : null;
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return null;
    }
  }

  // Update streak
  async updateStreak(userId = 'demo') {
    try {
      const response = await apiClient.post('/streak/update', { userId });
      console.log('🔥 Streak updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating streak:', error);
      throw error;
    }
  }

  // Add XP and check for level up
  async addXP(userId = 'demo', xpGain, diamondsGain = 0, reason = 'lesson_complete') {
    try {
      const response = await apiClient.post('/xp/add', {
        userId,
        xpGain,
        diamondsGain,
        reason
      });
      
      console.log('💎 XP added:', response.data);
      
      // Save updated stats locally
      if (response.data.user) {
        await this.saveUserStats(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error adding XP:', error);
      const fallback = await this.loadUserStats();
      return { user: fallback, error, offline: true };
    }
  }

  // Get user stats from backend
  async getUserStatsFromBackend(userId = 'demo') {
    try {
      const response = await apiClient.get(`/user/stats/${userId}`);
      console.log('📊 User stats fetched:', response.data);
      
      // Save to local storage
      const stats = response.data?.data || response.data;
      if (stats) {
        await this.saveUserStats(stats);
      }
      
      return { user: stats };
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      const fallback = await this.loadUserStats();
      if (fallback) {
        console.log('💾 Returning cached stats after fetch failure');
        return { user: fallback };
      }
      return { user: null, error };
    }
  }
}

export default new AutoSaveService();
