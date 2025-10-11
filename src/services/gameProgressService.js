// src/services/gameProgressService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const PROGRESS_KEYS = {
  USER_STATS: 'user_stats',
  GAME_SESSIONS: 'game_sessions',
  LEVEL_PROGRESS: 'level_progress',
  OFFLINE_QUEUE: 'offline_progress_queue',
};

/**
 * Game Progress Service - Comprehensive tracking and storage
 * Handles per-user progress, level unlocking, and offline sync
 */
class GameProgressService {
  constructor() {
    this.userId = null;
    this.isOnline = true;
  }

  /**
   * Initialize service with user ID
   */
  async initialize(userId) {
    this.userId = userId;
    console.log('🎮 GameProgressService initialized for user:', userId);
  }

  /**
   * Save game session results
   */
  async saveGameSession(sessionData) {
    const {
      lessonId,
      category,
      score,
      accuracy,
      timeSpent,
      questionTypes,
      completedAt,
      heartsRemaining,
      diamondsEarned,
      xpEarned,
      streak,
      maxStreak,
      level,
      totalQuestions,
      correctAnswers,
      wrongAnswers
    } = sessionData;

    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      lessonId,
      category,
      score,
      accuracy: Math.round(accuracy * 100) / 100,
      timeSpent,
      questionTypes: questionTypes || {},
      completedAt: completedAt || new Date().toISOString(),
      heartsRemaining: heartsRemaining || 5,
      diamondsEarned: diamondsEarned || 0,
      xpEarned: xpEarned || 0,
      streak: streak || 0,
      maxStreak: maxStreak || 0,
      level: level || 1,
      totalQuestions: totalQuestions || 0,
      correctAnswers: correctAnswers || 0,
      wrongAnswers: wrongAnswers || 0,
      createdAt: new Date().toISOString(),
      synced: false
    };

    try {
      // Save locally first
      await this.saveLocalSession(session);
      
      // Try to sync to server
      if (this.isOnline) {
        await this.syncSessionToServer(session);
        session.synced = true;
        await this.updateLocalSession(session);
      } else {
        await this.addToOfflineQueue(session);
      }

      // Update user stats
      await this.updateUserStats({
        xp: xpEarned,
        diamonds: diamondsEarned,
        hearts: heartsRemaining,
        level,
        streak,
        maxStreak,
        accuracy,
        totalTimeSpent: timeSpent
      });

      // Check level unlock
      await this.checkLevelUnlock(lessonId, accuracy);

      console.log('✅ Game session saved:', session.id);
      return session;
    } catch (error) {
      console.error('❌ Error saving game session:', error);
      throw error;
    }
  }

  /**
   * Save session locally
   */
  async saveLocalSession(session) {
    try {
      const key = `${PROGRESS_KEYS.GAME_SESSIONS}_${this.userId}`;
      const existingSessions = await this.getLocalSessions();
      const updatedSessions = [...existingSessions, session];
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedSessions));
      console.log('💾 Session saved locally');
    } catch (error) {
      console.error('❌ Error saving session locally:', error);
    }
  }

  /**
   * Get local sessions
   */
  async getLocalSessions() {
    try {
      const key = `${PROGRESS_KEYS.GAME_SESSIONS}_${this.userId}`;
      const sessions = await AsyncStorage.getItem(key);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('❌ Error getting local sessions:', error);
      return [];
    }
  }

  /**
   * Update local session
   */
  async updateLocalSession(session) {
    try {
      const sessions = await this.getLocalSessions();
      const updatedSessions = sessions.map(s => s.id === session.id ? session : s);
      const key = `${PROGRESS_KEYS.GAME_SESSIONS}_${this.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('❌ Error updating local session:', error);
    }
  }

  /**
   * Sync session to server
   */
  async syncSessionToServer(session) {
    try {
      const response = await apiClient.post('/game-results', {
        userId: this.userId,
        ...session
      });
      
      if (response.data.success) {
        console.log('☁️ Session synced to server');
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error syncing session to server:', error);
      throw error;
    }
  }

  /**
   * Add to offline queue
   */
  async addToOfflineQueue(session) {
    try {
      const queue = await this.getOfflineQueue();
      queue.push(session);
      await AsyncStorage.setItem(PROGRESS_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      console.log('📱 Added to offline queue');
    } catch (error) {
      console.error('❌ Error adding to offline queue:', error);
    }
  }

  /**
   * Get offline queue
   */
  async getOfflineQueue() {
    try {
      const queue = await AsyncStorage.getItem(PROGRESS_KEYS.OFFLINE_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('❌ Error getting offline queue:', error);
      return [];
    }
  }

  /**
   * Sync offline queue when online
   */
  async syncOfflineQueue() {
    try {
      const queue = await this.getOfflineQueue();
      if (queue.length === 0) return;

      console.log(`🔄 Syncing ${queue.length} offline sessions...`);
      
      for (const session of queue) {
        try {
          await this.syncSessionToServer(session);
          session.synced = true;
        } catch (error) {
          console.error('❌ Error syncing session from queue:', error);
        }
      }

      // Remove synced sessions from queue
      const unsyncedSessions = queue.filter(s => !s.synced);
      await AsyncStorage.setItem(PROGRESS_KEYS.OFFLINE_QUEUE, JSON.stringify(unsyncedSessions));
      
      console.log(`✅ Synced ${queue.length - unsyncedSessions.length} sessions`);
    } catch (error) {
      console.error('❌ Error syncing offline queue:', error);
    }
  }

  /**
   * Update user stats
   */
  async updateUserStats(stats) {
    try {
      const currentStats = await this.getUserStats();
      const updatedStats = {
        ...currentStats,
        ...stats,
        lastUpdated: new Date().toISOString()
      };

      // Save locally
      await this.saveUserStats(updatedStats);

      // Try to sync to server
      let latestStats = updatedStats;

      if (this.isOnline) {
        try {
          const syncedStats = await this.syncUserStatsToServer(updatedStats);
          if (syncedStats) {
            latestStats = syncedStats;
            await this.saveUserStats(latestStats);
          }
        } catch (syncError) {
          console.warn('⚠️ Failed to sync user stats, using local snapshot:', syncError?.message);
        }
      }

      console.log('📊 User stats updated:', latestStats);
      return latestStats;
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
      throw error;
    }
  }

  /**
   * Get user stats
   */
  async getUserStats() {
    try {
      const key = `${PROGRESS_KEYS.USER_STATS}_${this.userId}`;
      const stats = await AsyncStorage.getItem(key);
      return stats ? JSON.parse(stats) : {
        xp: 0,
        diamonds: 0,
        hearts: 5,
        level: 1,
        streak: 0,
        maxStreak: 0,
        accuracy: 0,
        totalTimeSpent: 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return {};
    }
  }

  /**
   * Save user stats locally
   */
  async saveUserStats(stats) {
    try {
      const key = `${PROGRESS_KEYS.USER_STATS}_${this.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(stats));
    } catch (error) {
      console.error('❌ Error saving user stats:', error);
    }
  }

  /**
   * Sync user stats to server
   */
  async syncUserStatsToServer(stats) {
    try {
      const response = await apiClient.post('/user/stats', { stats });
      if (response.data?.success) {
        console.log('☁️ User stats synced to server');
        return response.data?.stats || response.data?.data || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Error syncing user stats to server:', error);
      throw error;
    }
  }

  /**
   * Check level unlock based on accuracy
   */
  async checkLevelUnlock(lessonId, accuracy) {
    try {
      if (accuracy >= 70) {
        const nextLevel = lessonId + 1;
        const unlockData = {
          userId: this.userId,
          unlockedLevel: nextLevel,
          unlockedAt: new Date().toISOString(),
          accuracy,
          lessonId
        };

        // Save unlock locally
        await this.saveLevelUnlock(unlockData);

        // Try to sync to server
        if (this.isOnline) {
          await this.syncLevelUnlockToServer(unlockData);
        }

        console.log(`🎉 Level ${nextLevel} unlocked! Accuracy: ${accuracy}%`);
        return unlockData;
      }
    } catch (error) {
      console.error('❌ Error checking level unlock:', error);
    }
  }

  /**
   * Save level unlock locally
   */
  async saveLevelUnlock(unlockData) {
    try {
      const key = `${PROGRESS_KEYS.LEVEL_PROGRESS}_${this.userId}`;
      const existingUnlocks = await this.getLevelUnlocks();
      const updatedUnlocks = [...existingUnlocks, unlockData];
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedUnlocks));
    } catch (error) {
      console.error('❌ Error saving level unlock:', error);
    }
  }

  /**
   * Get level unlocks
   */
  async getLevelUnlocks() {
    try {
      const key = `${PROGRESS_KEYS.LEVEL_PROGRESS}_${this.userId}`;
      const unlocks = await AsyncStorage.getItem(key);
      return unlocks ? JSON.parse(unlocks) : [];
    } catch (error) {
      console.error('❌ Error getting level unlocks:', error);
      return [];
    }
  }

  /**
   * Sync level unlock to server
   */
  async syncLevelUnlockToServer(unlockData) {
    try {
      const response = await apiClient.post('/user/unlock-level', {
        userId: this.userId,
        levelId: unlockData.levelId
      });
      
      if (response.data.success) {
        console.log('☁️ Level unlock synced to server');
        return response.data;
      }
    } catch (error) {
      console.error('❌ Error syncing level unlock to server:', error);
      throw error;
    }
  }

  /**
   * Get user progress summary
   */
  async getUserProgressSummary() {
    try {
      const sessions = await this.getLocalSessions();
      const stats = await this.getUserStats();
      const unlocks = await this.getLevelUnlocks();

      // Calculate progress metrics
      const totalSessions = sessions.length;
      const averageAccuracy = sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length 
        : 0;
      const totalXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
      const totalDiamonds = sessions.reduce((sum, s) => sum + s.diamondsEarned, 0);
      const totalTimeSpent = sessions.reduce((sum, s) => sum + s.timeSpent, 0);

      // Get recent sessions (last 10)
      const recentSessions = sessions
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 10);

      return {
        stats,
        totalSessions,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        totalXP,
        totalDiamonds,
        totalTimeSpent,
        recentSessions,
        unlockedLevels: unlocks.map(u => u.unlockedLevel),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting user progress summary:', error);
      return null;
    }
  }

  /**
   * Get lesson progress
   */
  async getLessonProgress(lessonId) {
    try {
      const sessions = await this.getLocalSessions();
      const lessonSessions = sessions.filter(s => s.lessonId === lessonId);
      
      if (lessonSessions.length === 0) {
        return {
          completed: false,
          accuracy: 0,
          bestScore: 0,
          attempts: 0,
          lastPlayed: null
        };
      }

      const bestSession = lessonSessions.reduce((best, current) => 
        current.accuracy > best.accuracy ? current : best
      );
      
      const averageAccuracy = lessonSessions.reduce((sum, s) => sum + s.accuracy, 0) / lessonSessions.length;
      const isUnlocked = averageAccuracy >= 70;

      return {
        completed: true,
        accuracy: Math.round(averageAccuracy * 100) / 100,
        bestAccuracy: bestSession.accuracy,
        bestScore: bestSession.score,
        attempts: lessonSessions.length,
        lastPlayed: bestSession.completedAt,
        isUnlocked,
        nextLevelUnlocked: isUnlocked
      };
    } catch (error) {
      console.error('❌ Error getting lesson progress:', error);
      return {
        completed: false,
        accuracy: 0,
        bestScore: 0,
        attempts: 0,
        lastPlayed: null
      };
    }
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.syncOfflineQueue();
    }
  }

  /**
   * Clear all data for user
   */
  async clearUserData() {
    try {
      const keys = [
        `${PROGRESS_KEYS.USER_STATS}_${this.userId}`,
        `${PROGRESS_KEYS.GAME_SESSIONS}_${this.userId}`,
        `${PROGRESS_KEYS.LEVEL_PROGRESS}_${this.userId}`,
        PROGRESS_KEYS.OFFLINE_QUEUE
      ];

      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }

      console.log('🗑️ User data cleared');
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  }
}

export default new GameProgressService();
