import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import progressService from './progressServicePerUser';
import { getXpProgress } from '../utils/leveling';

const clamp = (value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(max, Math.max(min, numeric));
};

const getStoredUser = async () => {
  try {
    const stored = await AsyncStorage.getItem('userData');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to parse stored user data:', error);
    return null;
  }
};

const getCurrentUserId = async () => {
  const storedUser = await getStoredUser();
  return storedUser?.id || null;
};

const extractStatsPayload = (data) => data?.stats || data?.data || data;

const userService = {
  async getUserStats() {
    try {
      const response = await apiClient.get('/user/stats');
      return {
        success: response.data?.success !== false,
        data: extractStatsPayload(response.data),
        message: response.data?.message
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  async updateUserStats(updates) {
    try {
      const response = await apiClient.post('/user/stats', { stats: updates });
      return {
        success: response.data?.success !== false,
        data: extractStatsPayload(response.data) || updates,
        message: response.data?.message
      };
    } catch (error) {
      console.error('Error updating user stats:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  async getUserProfile() {
    try {
      const [storedUser, statsResult] = await Promise.all([
        getStoredUser(),
        this.getUserStats()
      ]);

      const profile = {
        ...(storedUser || {}),
        stats: statsResult.success ? statsResult.data : null
      };

      return {
        success: true,
        data: profile
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async updateUserProfile(profileData) {
    try {
      const response = await apiClient.put('/user/profile', profileData);
      if (response.data?.success && response.data?.data) {
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
      }

      return {
        success: response.data?.success !== false,
        data: response.data?.data,
        message: response.data?.message,
        error: response.data?.message
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    }
  },

  async getUserAchievements() {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          success: false,
          error: 'ไม่พบข้อมูลผู้ใช้'
        };
      }

      const { data } = await apiClient.get(`/game-results/achievements/${userId}`);
      return {
        success: data?.success !== false,
        data: data?.data || [],
        message: data?.message
      };
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  },

  async getUserProgress() {
    try {
      const statsResult = await this.getUserStats();
      const lessons = await progressService.getAllUserProgress();
      const entries = Array.isArray(lessons) ? lessons : [];
      const completed = entries.filter(
        (entry) => entry.completed || entry.progress >= 100
      );

      const summary = {
        totalXP: statsResult.success ? statsResult.data?.xp || 0 : 0,
        currentLevel: statsResult.success ? statsResult.data?.level || 1 : 1,
        currentStreak: statsResult.success ? statsResult.data?.streak || 0 : 0,
        totalLessons: entries.length,
        completedLessons: completed.length,
        progressPercentage: entries.length
          ? Math.round((completed.length / entries.length) * 100)
          : 0,
        lessons: entries
      };

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async addXP(amount) {
    try {
      const statsResult = await this.getUserStats();
      if (!statsResult.success) return statsResult;

      const current = statsResult.data || {};
      const xpAmount = Number(amount) || 0;
      const nextXp = Math.max(0, (current.xp || 0) + xpAmount);
      const xpSnapshot = getXpProgress(nextXp, current.level || 1);
      return this.updateUserStats({
        xp: nextXp,
        level: xpSnapshot.level,
        nextLevelXP: xpSnapshot.requirement,
        xpToNextLevel: xpSnapshot.toNext,
        levelProgressPercent: xpSnapshot.percent
      });
    } catch (error) {
      console.error('Error adding XP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async addHearts(amount) {
    try {
      const statsResult = await this.getUserStats();
      if (!statsResult.success) return statsResult;

      const current = statsResult.data || {};
      const currentHearts = Number.isFinite(current.hearts) ? current.hearts : 5;
      const maxHearts = Number.isFinite(current.maxHearts) ? current.maxHearts : 5;
      const nextHearts = clamp(currentHearts + Number(amount || 0), {
        min: 0,
        max: maxHearts
      });

      return this.updateUserStats({ hearts: nextHearts });
    } catch (error) {
      console.error('Error adding hearts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async addDiamonds(amount) {
    try {
      const statsResult = await this.getUserStats();
      if (!statsResult.success) return statsResult;

      const current = statsResult.data || {};
      const nextDiamonds = Math.max(0, (current.diamonds || 0) + Number(amount || 0));

      return this.updateUserStats({ diamonds: nextDiamonds });
    } catch (error) {
      console.error('Error adding diamonds:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  changePassword: async (data) => {
    try {
      const response = await apiClient.post('/user/change-password', data);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้',
        error: error.message
      };
    }
  }
};

export default userService;
