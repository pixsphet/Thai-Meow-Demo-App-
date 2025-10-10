// src/services/userStatsService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import gameProgressService from './gameProgressService';

const STATS_KEYS = {
  USER_STATS: 'user_stats',
  STATS_HISTORY: 'stats_history',
  SYNC_QUEUE: 'stats_sync_queue',
};

/**
 * User Stats Service
 * Handles real-time user statistics and progress tracking
 */
class UserStatsService {
  constructor() {
    this.userId = null;
    this.isOnline = true;
    this.listeners = new Set();
  }

  /**
   * Initialize service with user ID
   */
  async initialize(userId) {
    this.userId = userId;
    console.log('📊 UserStatsService initialized for user:', userId);
    
    // Load initial stats
    await this.loadUserStats();
  }

  /**
   * Subscribe to stats changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of stats changes
   */
  notifyListeners(stats) {
    this.listeners.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('❌ Error in stats listener:', error);
      }
    });
  }

  /**
   * Load user stats from local storage
   */
  async loadUserStats() {
    try {
      const key = `${STATS_KEYS.USER_STATS}_${this.userId}`;
      const stats = await AsyncStorage.getItem(key);
      
      if (stats) {
        const parsedStats = JSON.parse(stats);
        this.notifyListeners(parsedStats);
        return parsedStats;
      }

      // Return default stats if none exist
      const defaultStats = this.getDefaultStats();
      await this.saveUserStats(defaultStats);
      return defaultStats;
    } catch (error) {
      console.error('❌ Error loading user stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get default stats
   */
  getDefaultStats() {
    return {
      xp: 0,
      diamonds: 0,
      hearts: 5,
      level: 1,
      streak: 0,
      maxStreak: 0,
      accuracy: 0,
      totalTimeSpent: 0,
      totalSessions: 0,
      totalCorrectAnswers: 0,
      totalWrongAnswers: 0,
      averageAccuracy: 0,
      lastPlayed: null,
      achievements: [],
      badges: [],
      lastUpdated: new Date().toISOString(),
      synced: false
    };
  }

  /**
   * Update user stats
   */
  async updateUserStats(updates) {
    try {
      const currentStats = await this.loadUserStats();
      const updatedStats = {
        ...currentStats,
        ...updates,
        lastUpdated: new Date().toISOString(),
        synced: false
      };

      // Save locally
      await this.saveUserStats(updatedStats);

      // Notify listeners
      this.notifyListeners(updatedStats);

      // Try to sync to server
      if (this.isOnline) {
        await this.syncStatsToServer(updatedStats);
      } else {
        await this.addToSyncQueue(updates);
      }

      console.log('📊 User stats updated:', updates);
      return updatedStats;
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
      const fallbackStats = await this.loadUserStats();
      await this.addToSyncQueue(updates);
      return fallbackStats || this.getDefaultStats();
    }
  }

  /**
   * Save user stats locally
   */
  async saveUserStats(stats) {
    try {
      const key = `${STATS_KEYS.USER_STATS}_${this.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(stats));
    } catch (error) {
      console.error('❌ Error saving user stats:', error);
    }
  }

  /**
   * Sync stats to server
   */
  async syncStatsToServer(stats) {
    try {
      const response = await apiClient.post('/user/stats', {
        userId: this.userId,
        stats
      });
      
      if (response.data.success) {
        // Mark as synced
        const syncedStats = { ...stats, synced: true };
        await this.saveUserStats(syncedStats);
        this.notifyListeners(syncedStats);
        
        console.log('☁️ User stats synced to server');
        return response.data;
      }
    } catch (error) {
      console.warn('⚠️ Server not available, stats saved locally:', error.message);
      // Don't throw error, just log warning
      return null;
    }
  }

  /**
   * Add to sync queue
   */
  async addToSyncQueue(updates) {
    try {
      const queue = await this.getSyncQueue();
      queue.push({
        ...updates,
        timestamp: Date.now()
      });
      await AsyncStorage.setItem(STATS_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      console.log('📱 Added to sync queue');
    } catch (error) {
      console.error('❌ Error adding to sync queue:', error);
    }
  }

  /**
   * Get sync queue
   */
  async getSyncQueue() {
    try {
      const queue = await AsyncStorage.getItem(STATS_KEYS.SYNC_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('❌ Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Sync queue when online
   */
  async syncQueue() {
    try {
      const queue = await this.getSyncQueue();
      if (queue.length === 0) return;

      console.log(`🔄 Syncing ${queue.length} stats updates...`);
      
      // Merge all updates
      const mergedUpdates = queue.reduce((acc, update) => {
        return { ...acc, ...update };
      }, {});

      // Apply merged updates
      await this.updateUserStats(mergedUpdates);

      // Clear queue
      await AsyncStorage.removeItem(STATS_KEYS.SYNC_QUEUE);
      
      console.log('✅ Sync queue processed');
    } catch (error) {
      console.error('❌ Error syncing queue:', error);
    }
  }

  /**
   * Update stats from game session
   */
  async updateFromGameSession(sessionData) {
    try {
      const {
        xpEarned = 0,
        diamondsEarned = 0,
        heartsRemaining = 5,
        accuracy = 0,
        timeSpent = 0,
        correctAnswers = 0,
        wrongAnswers = 0,
        streak = 0,
        maxStreak = 0
      } = sessionData;

      const currentStats = await this.loadUserStats();
      
      // Calculate new values
      const newXP = currentStats.xp + xpEarned;
      const newDiamonds = currentStats.diamonds + diamondsEarned;
      const newLevel = Math.floor(newXP / 100) + 1;
      const newTotalSessions = currentStats.totalSessions + 1;
      const newTotalCorrect = currentStats.totalCorrectAnswers + correctAnswers;
      const newTotalWrong = currentStats.totalWrongAnswers + wrongAnswers;
      const newTotalAnswers = newTotalCorrect + newTotalWrong;
      const newAverageAccuracy = newTotalAnswers > 0 
        ? (newTotalCorrect / newTotalAnswers) * 100 
        : currentStats.averageAccuracy;

      const updates = {
        xp: newXP,
        diamonds: newDiamonds,
        hearts: heartsRemaining,
        level: newLevel,
        streak: Math.max(currentStats.streak, streak),
        maxStreak: Math.max(currentStats.maxStreak, maxStreak),
        accuracy: accuracy,
        totalTimeSpent: currentStats.totalTimeSpent + timeSpent,
        totalSessions: newTotalSessions,
        totalCorrectAnswers: newTotalCorrect,
        totalWrongAnswers: newTotalWrong,
        averageAccuracy: Math.round(newAverageAccuracy * 100) / 100,
        lastPlayed: new Date().toISOString()
      };

      await this.updateUserStats(updates);
      return updates;
    } catch (error) {
      console.error('❌ Error updating from game session:', error);
      throw error;
    }
  }

  /**
   * Get user stats summary
   */
  async getUserStatsSummary() {
    try {
      const stats = await this.loadUserStats();
      const progress = await gameProgressService.getUserProgressSummary();
      
      return {
        ...stats,
        ...progress,
        levelProgress: this.calculateLevelProgress(stats.xp),
        nextLevelXP: this.getNextLevelXP(stats.xp),
        achievements: await this.getAchievements(stats),
        recentActivity: await this.getRecentActivity()
      };
    } catch (error) {
      console.error('❌ Error getting user stats summary:', error);
      return null;
    }
  }

  /**
   * Calculate level progress
   */
  calculateLevelProgress(xp) {
    const currentLevel = Math.floor(xp / 100) + 1;
    const currentLevelXP = xp % 100;
    const progress = currentLevelXP / 100;
    
    return {
      currentLevel,
      currentLevelXP,
      progress: Math.round(progress * 100) / 100,
      nextLevelXP: 100 - currentLevelXP
    };
  }

  /**
   * Get next level XP requirement
   */
  getNextLevelXP(xp) {
    const currentLevel = Math.floor(xp / 100) + 1;
    const currentLevelXP = xp % 100;
    return 100 - currentLevelXP;
  }

  /**
   * Get achievements
   */
  async getAchievements(stats) {
    const achievements = [];

    // XP achievements
    if (stats.xp >= 1000) achievements.push({ id: 'xp_master', name: 'XP Master', description: 'Earned 1000+ XP' });
    if (stats.xp >= 5000) achievements.push({ id: 'xp_legend', name: 'XP Legend', description: 'Earned 5000+ XP' });

    // Streak achievements
    if (stats.maxStreak >= 10) achievements.push({ id: 'streak_master', name: 'Streak Master', description: '10+ correct answers in a row' });
    if (stats.maxStreak >= 25) achievements.push({ id: 'streak_legend', name: 'Streak Legend', description: '25+ correct answers in a row' });

    // Accuracy achievements
    if (stats.averageAccuracy >= 80) achievements.push({ id: 'accuracy_master', name: 'Accuracy Master', description: '80%+ average accuracy' });
    if (stats.averageAccuracy >= 95) achievements.push({ id: 'accuracy_legend', name: 'Accuracy Legend', description: '95%+ average accuracy' });

    // Session achievements
    if (stats.totalSessions >= 50) achievements.push({ id: 'dedicated_learner', name: 'Dedicated Learner', description: 'Completed 50+ sessions' });
    if (stats.totalSessions >= 100) achievements.push({ id: 'learning_champion', name: 'Learning Champion', description: 'Completed 100+ sessions' });

    return achievements;
  }

  /**
   * Get recent activity
   */
  async getRecentActivity() {
    try {
      const progress = await gameProgressService.getUserProgressSummary();
      return progress.recentSessions || [];
    } catch (error) {
      console.error('❌ Error getting recent activity:', error);
      return [];
    }
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.syncQueue();
    }
  }

  /**
   * Clear all user data
   */
  async clearUserData() {
    try {
      const keys = [
        `${STATS_KEYS.USER_STATS}_${this.userId}`,
        `${STATS_KEYS.STATS_HISTORY}_${this.userId}`,
        STATS_KEYS.SYNC_QUEUE
      ];

      for (const key of keys) {
        await AsyncStorage.removeItem(key);
      }

      this.listeners.clear();
      console.log('🗑️ User stats data cleared');
    } catch (error) {
      console.error('❌ Error clearing user stats data:', error);
    }
  }

  /**
   * Export user data
   */
  async exportUserData() {
    try {
      const stats = await this.loadUserStats();
      const progress = await gameProgressService.getUserProgressSummary();
      
      return {
        stats,
        progress,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('❌ Error exporting user data:', error);
      return null;
    }
  }
}

export default new UserStatsService();
