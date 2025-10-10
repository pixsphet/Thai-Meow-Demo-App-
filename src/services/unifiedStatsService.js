// src/services/unifiedStatsService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import gameProgressService from './gameProgressService';
import userStatsService from './userStatsService';

const UNIFIED_STATS_KEY = 'unified_user_stats';
const DEFAULT_STATS = {
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

/**
 * Unified Stats Service - Single source of truth for all user statistics
 * This service ensures all screens (HomeScreen, ProgressScreen, ProfileScreen) 
 * display the same data consistently
 */
class UnifiedStatsService {
  constructor() {
    this.userId = null;
    this.listeners = new Set();
    this.isOnline = true;
    this.cache = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the service with user ID
   */
  async initialize(userId) {
    this.userId = userId;
    this.isInitialized = true;
    
    // Load initial data
    await this.loadStats();
    
    // Initialize other services
    await gameProgressService.initialize(userId);
    await userStatsService.initialize(userId);
    
    console.log('✅ UnifiedStatsService initialized for user:', userId);
  }

  /**
   * Subscribe to stats changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    
    // Immediately call with current data if available
    if (this.cache) {
      callback(this.cache);
    }
    
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of stats changes
   */
  notifyListeners(stats) {
    this.cache = stats;
    this.listeners.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('❌ Error in stats listener:', error);
      }
    });
  }

  /**
   * Load stats from local storage
   */
  async loadStats() {
    try {
      if (!this.userId) {
        console.warn('No userId available for loading stats');
        return DEFAULT_STATS;
      }

      const key = `${UNIFIED_STATS_KEY}_${this.userId}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        const stats = JSON.parse(stored);
        this.cache = stats;
        this.notifyListeners(stats);
        console.log('📊 Loaded unified stats from storage:', stats);
        return stats;
      }

      // If no stored data, try to get from userStatsService
      const userStats = await userStatsService.loadUserStats();
      if (userStats && Object.keys(userStats).length > 0) {
        this.cache = userStats;
        this.notifyListeners(userStats);
        await this.saveStats(userStats);
        return userStats;
      }

      // Return default stats
      this.cache = DEFAULT_STATS;
      this.notifyListeners(DEFAULT_STATS);
      return DEFAULT_STATS;
    } catch (error) {
      console.error('❌ Error loading unified stats:', error);
      this.cache = DEFAULT_STATS;
      this.notifyListeners(DEFAULT_STATS);
      return DEFAULT_STATS;
    }
  }

  /**
   * Save stats to local storage
   */
  async saveStats(stats) {
    try {
      if (!this.userId) return;

      const key = `${UNIFIED_STATS_KEY}_${this.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(stats));
      console.log('💾 Saved unified stats to storage');
    } catch (error) {
      console.error('❌ Error saving unified stats:', error);
    }
  }

  /**
   * Get current stats (from cache or load)
   */
  async getStats() {
    if (this.cache) {
      return this.cache;
    }
    return await this.loadStats();
  }

  /**
   * Update stats with new data
   */
  async updateStats(updates) {
    try {
      if (!this.isInitialized) {
        console.warn('UnifiedStatsService not initialized');
        return;
      }

      const currentStats = await this.getStats();
      const updatedStats = {
        ...currentStats,
        ...updates,
        lastUpdated: new Date().toISOString(),
        synced: false
      };

      // Update cache and notify listeners
      this.cache = updatedStats;
      this.notifyListeners(updatedStats);

      // Save locally
      await this.saveStats(updatedStats);

      // Try to sync to server
      if (this.isOnline) {
        await this.syncToServer(updatedStats);
      }

      // Also update userStatsService for compatibility
      await userStatsService.updateUserStats(updates);

      console.log('📊 Updated unified stats:', updates);
      return updatedStats;
    } catch (error) {
      console.error('❌ Error updating unified stats:', error);
      throw error;
    }
  }

  /**
   * Sync stats to server
   */
  async syncToServer(stats) {
    try {
      if (!this.userId) return;

      const response = await apiClient.post('/user/stats', {
        userId: this.userId,
        stats
      });

      if (response.data.success) {
        // Mark as synced
        const syncedStats = { ...stats, synced: true };
        this.cache = syncedStats;
        this.notifyListeners(syncedStats);
        await this.saveStats(syncedStats);
        
        console.log('☁️ Unified stats synced to server');
        return response.data;
      }
    } catch (error) {
      console.warn('⚠️ Server not available, stats saved locally:', error.message);
      // Don't throw error, just log warning
      return null;
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

      const currentStats = await this.getStats();
      
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

      return await this.updateStats(updates);
    } catch (error) {
      console.error('❌ Error updating from game session:', error);
      throw error;
    }
  }

  /**
   * Force refresh from server
   */
  async forceRefresh() {
    try {
      if (!this.userId) return;

      const response = await apiClient.get(`/user/stats/${this.userId}`);
      
      if (response.data?.data) {
        const serverStats = response.data.data;
        this.cache = serverStats;
        this.notifyListeners(serverStats);
        await this.saveStats(serverStats);
        
        console.log('🔄 Force refreshed stats from server');
        return serverStats;
      }
    } catch (error) {
      console.warn('⚠️ Server not available, using local data:', error.message);
      // Fallback to local data
      return await this.loadStats();
    }
  }

  /**
   * Set online status
   */
  setOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    if (isOnline) {
      // Try to sync when coming back online
      this.syncToServer(this.cache);
    }
  }

  /**
   * Get stats summary for display
   */
  getStatsSummary() {
    if (!this.cache) return DEFAULT_STATS;
    
    return {
      ...this.cache,
      levelProgress: this.calculateLevelProgress(this.cache.xp),
      nextLevelXP: this.getNextLevelXP(this.cache.xp),
      isLoaded: true
    };
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
   * Clear all data for user
   */
  async clearUserData() {
    try {
      if (!this.userId) return;

      const key = `${UNIFIED_STATS_KEY}_${this.userId}`;
      await AsyncStorage.removeItem(key);
      
      this.cache = DEFAULT_STATS;
      this.notifyListeners(DEFAULT_STATS);
      
      console.log('🗑️ Unified stats data cleared');
    } catch (error) {
      console.error('❌ Error clearing unified stats data:', error);
    }
  }

  /**
   * Check if stats are loaded
   */
  isStatsLoaded() {
    return this.cache !== null && this.isInitialized;
  }

  /**
   * Get loading state
   */
  isLoading() {
    return !this.isInitialized || this.cache === null;
  }
}

export default new UnifiedStatsService();
