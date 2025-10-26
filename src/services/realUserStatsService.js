import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { API_ORIGIN } from './apiClient';
import { getXpProgress } from '../utils/leveling';

class RealUserStatsService {
  constructor() {
    this.userId = null;
    this.isOnline = true;
    this.lastNetworkCheck = 0;
    this.networkCheckInterval = 30000; // Check every 30 seconds
    this.lastStatsFetch = 0;
    this.statsFetchInterval = 60000; // Fetch stats only once per minute
    this.isFetching = false;
  }

  // Initialize with user ID
  async initialize(userId) {
    console.log('🔧 RealUserStatsService: Initializing with user ID:', userId);
    this.userId = userId;
    await this.checkNetworkStatus();
    console.log('✅ RealUserStatsService: Initialized successfully');
  }

  // Check network status with throttling
  async checkNetworkStatus() {
    const now = Date.now();
    if (now - this.lastNetworkCheck < this.networkCheckInterval) {
      return; // Skip check if done recently
    }
    
    this.lastNetworkCheck = now;
    try {
      // Try to connect to our own backend first
      const response = await fetch(`${API_ORIGIN}/api/health`, { 
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        this.isOnline = true;
        console.log('🌐 Backend connection successful');
        return;
      }
    } catch (error) {
      console.log('🔍 Backend not available, trying fallback...');
    }
    
    try {
      // Fallback to Google if backend is not available
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        timeout: 3000
      });
      this.isOnline = true;
      console.log('🌐 Internet connection available (fallback)');
    } catch (error) {
      this.isOnline = false;
      // Only log warning once per check interval
      console.warn('📱 Offline mode detected - no internet connection');
    }
  }

  // Get user stats from server
  async getUserStats() {
    if (!this.userId) {
      throw new Error('User ID not initialized');
    }

    // Throttle API calls
    const now = Date.now();
    if (this.isFetching || (now - this.lastStatsFetch) < this.statsFetchInterval) {
      const localStats = await this.loadLocalStats();
      if (localStats) {
        return localStats;
      }
      return this.getDefaultStats();
    }

    this.isFetching = true;
    this.lastStatsFetch = now;

    console.log('📊 RealUserStatsService: Getting user stats for user ID:', this.userId);

    try {
      // Try to fetch from server
      console.log('🌐 Fetching stats from server...');
      console.log('🔗 API URL:', `/user/stats/${this.userId}`);
      
      const response = await apiClient.get(`/user/stats/${this.userId}`);
      const stats = response.data?.stats || response.data?.data || response.data;
      
      // Save to local storage as backup
      await this.saveLocalStats(stats);
      
      console.log('🌐 User stats loaded from server:', stats);
      this.isOnline = true;
      return stats;
    } catch (error) {
      console.error('❌ Error loading user stats:', error?.message);
      this.isOnline = false;
      
      // Try loading from local storage
      console.log('📱 Attempting to load from local storage...');
      const localStats = await this.loadLocalStats();
      if (localStats) {
        console.log('💾 User stats loaded from local storage:', localStats);
        return localStats;
      }
      
      // Return default stats as final fallback
      console.log('🔧 Returning default stats (backend offline)');
      const defaultStats = this.getDefaultStats();
      return defaultStats;
    } finally {
      this.isFetching = false;
    }
  }

  // Update user stats
  async updateUserStats(updates) {
    if (!this.userId) {
      throw new Error('User ID not initialized');
    }

    try {
      // Get current stats
      const currentStats = await this.getUserStats();
      
      // Merge updates
      let mergedStats = {
        ...currentStats,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      // Remove hearts cap; allow unbounded positive hearts
      const nextHearts = Number.isFinite(mergedStats.hearts)
        ? mergedStats.hearts
        : (Number.isFinite(currentStats.hearts) ? currentStats.hearts : 0);
      const currentMaxHearts = Number.isFinite(mergedStats.maxHearts)
        ? mergedStats.maxHearts
        : (Number.isFinite(currentStats.maxHearts) ? currentStats.maxHearts : nextHearts);

      mergedStats = {
        ...mergedStats,
        maxHearts: currentMaxHearts,
        hearts: Math.max(0, nextHearts)
      };

      let updatedStats = mergedStats;
      if (Number.isFinite(mergedStats.xp)) {
        const xpSnapshot = getXpProgress(mergedStats.xp, mergedStats.level || currentStats.level || 1);
        updatedStats = {
          ...mergedStats,
          level: xpSnapshot.level,
          nextLevelXP: xpSnapshot.requirement,
          xpToNextLevel: xpSnapshot.toNext,
          levelProgressPercent: xpSnapshot.percent
        };
      }

      if (this.isOnline) {
        // Update server
        const response = await apiClient.post('/user/stats', { stats: updatedStats });
        console.log('✅ User stats updated on server');

        const serverStats = response.data?.stats || response.data?.data || updatedStats;

        await this.saveLocalStats(serverStats);
        
        return serverStats;
      } else {
        // Update local storage and queue for sync
        await this.saveLocalStats(updatedStats);
        await this.queueStatsUpdate(updatedStats);
        console.log('📱 User stats updated locally (offline)');
        return updatedStats;
      }
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
      this.isOnline = false;
      
      // Fallback to local update
      const currentStats = await this.loadLocalStats() || this.getDefaultStats();
      const updatedStats = { ...currentStats, ...updates };
      await this.saveLocalStats(updatedStats);
      await this.queueStatsUpdate(updatedStats);
      
      return updatedStats;
    }
  }

  // Save stats locally
  async saveLocalStats(stats) {
    const key = `user_stats_${this.userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(stats));
  }

  // Load stats from local storage
  async loadLocalStats() {
    const key = `user_stats_${this.userId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // Queue stats update for sync
  async queueStatsUpdate(stats) {
    const queueKey = `stats_sync_queue_${this.userId}`;
    const queue = await this.getStatsSyncQueue();
    queue.push({ stats, timestamp: Date.now() });
    await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
  }

  // Get stats sync queue
  async getStatsSyncQueue() {
    const queueKey = `stats_sync_queue_${this.userId}`;
    const data = await AsyncStorage.getItem(queueKey);
    return data ? JSON.parse(data) : [];
  }

  // Sync queued stats updates
  async syncQueuedStats() {
    if (!this.isOnline) return;

    const queue = await this.getStatsSyncQueue();
    if (queue.length === 0) return;

    console.log(`🔄 Syncing ${queue.length} queued stats updates...`);

    for (const item of queue) {
      try {
        await apiClient.post('/user/stats', { stats: item.stats });
        console.log('✅ Synced stats update');
      } catch (error) {
        console.error('❌ Failed to sync stats update:', error);
      }
    }

    // Clear successfully synced items
    await AsyncStorage.removeItem(`stats_sync_queue_${this.userId}`);
    console.log('✅ Stats sync queue cleared');
  }

  // Get default stats
  getDefaultStats() {
    return {
      userId: this.userId,
      xp: 0,
      diamonds: 0,
      hearts: 5,
      maxHearts: 5,
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

  // Update stats from game session
  async updateFromGameSession(gameResults) {
    const safeNumber = (value, fallback = 0) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : fallback;
    };

    const currentStats = await this.getUserStats();

    const xpEarned = safeNumber(gameResults.xpEarned);
    const diamondsEarned = safeNumber(gameResults.diamondsEarned);
    // No cap: baseMaxHearts tracks highest seen but does not limit hearts
    const baseMaxHearts = safeNumber(
      currentStats.maxHearts,
      Math.max(safeNumber(currentStats.hearts, 0), 0)
    );
    const rawHeartsRemaining = gameResults.heartsRemaining !== undefined
      ? safeNumber(gameResults.heartsRemaining, currentStats.hearts || baseMaxHearts)
      : safeNumber(currentStats.hearts, baseMaxHearts);
    const heartsRemaining = Math.max(0, rawHeartsRemaining);
    const timeSpent = safeNumber(gameResults.timeSpent);
    const correctAnswers = safeNumber(gameResults.correctAnswers);
    const wrongAnswers = safeNumber(gameResults.wrongAnswers);
    const accuracyPercent = safeNumber(
      gameResults.accuracy !== undefined
        ? (gameResults.accuracy <= 1 ? gameResults.accuracy * 100 : gameResults.accuracy)
        : currentStats.accuracy || 0
    );

    const totalXP = safeNumber(currentStats.xp) + xpEarned;
    const totalDiamonds = safeNumber(currentStats.diamonds) + diamondsEarned;
    const totalSessions = safeNumber(currentStats.totalSessions) + 1;
    const aggregateCorrect = safeNumber(currentStats.totalCorrectAnswers) + correctAnswers;
    const aggregateWrong = safeNumber(currentStats.totalWrongAnswers) + wrongAnswers;
    const aggregateTime = safeNumber(currentStats.totalTimeSpent) + timeSpent;
    const totalQuestionsAnswered = aggregateCorrect + aggregateWrong;
    const averageAccuracy = totalQuestionsAnswered > 0
      ? Math.round((aggregateCorrect / totalQuestionsAnswered) * 100)
      : (currentStats.averageAccuracy || accuracyPercent);

    let updates = {
      xp: totalXP,
      diamonds: totalDiamonds,
      hearts: heartsRemaining,
      maxHearts: baseMaxHearts,
      accuracy: accuracyPercent,
      totalTimeSpent: aggregateTime,
      totalSessions,
      totalCorrectAnswers: aggregateCorrect,
      totalWrongAnswers: aggregateWrong,
      averageAccuracy,
      lastPlayed: new Date().toISOString(),
      lastGameResults: {
        correct: correctAnswers,
        wrong: wrongAnswers,
        total: safeNumber(gameResults.totalQuestions) || (correctAnswers + wrongAnswers),
        accuracy: accuracyPercent,
        xpEarned,
        diamondsEarned,
        heartsRemaining,
        timeSpent,
        gameType: gameResults.gameType || 'lesson',
        completedAt: gameResults.completedAt || new Date().toISOString()
      }
    };

    // Calculate level and progression from XP
    const xpSnapshot = getXpProgress(totalXP, safeNumber(currentStats.level, 1));
    updates.level = xpSnapshot.level;
    updates.nextLevelXP = xpSnapshot.requirement;
    updates.xpToNextLevel = xpSnapshot.toNext;
    updates.levelProgressPercent = xpSnapshot.percent;
    const previousLevel = safeNumber(currentStats.level, 1);
    const levelDiff = xpSnapshot.level - previousLevel;
    if (levelDiff > 0) {
      console.log(`🎉 Level up! New level: ${xpSnapshot.level} (was ${previousLevel})`);
      const boostedMaxHearts = baseMaxHearts + levelDiff;
      const boostedHearts = Math.max(0, heartsRemaining + levelDiff);
      updates = {
        ...updates,
        hearts: boostedHearts,
        maxHearts: boostedMaxHearts
      };
      // Hint server to track level up event counters/timestamps
      updates.leveledUp = true;
      updates.xpEarned = xpEarned;
      updates.diamondsEarned = safeNumber(gameResults.diamondsEarned, 0);
      updates.heartsEarned = Math.max(0, boostedHearts - heartsRemaining);
    }

    // Calculate streak
    const lastPlayed = currentStats.lastPlayed;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const lastPlayedDate = lastPlayed ? new Date(lastPlayed).toDateString() : null;
    
    if (lastPlayedDate === today) {
      updates.streak = safeNumber(currentStats.streak, 0);
      updates.maxStreak = safeNumber(currentStats.maxStreak, updates.streak);
    } else if (lastPlayedDate === yesterday) {
      updates.streak = safeNumber(currentStats.streak, 0) + 1;
      updates.maxStreak = Math.max(safeNumber(currentStats.maxStreak, 0), updates.streak);
    } else {
      updates.streak = 1;
      updates.maxStreak = Math.max(safeNumber(currentStats.maxStreak, 0), 1);
    }

    // Ensure maxStreak always present
    if (updates.maxStreak === undefined) {
      updates.maxStreak = safeNumber(currentStats.maxStreak, 0);
    }

    return await this.updateUserStats(updates);
  }

  // Clear all user data
  async clearUserData() {
    if (!this.userId) return;

    try {
      // Clear from server
      if (this.isOnline) {
        await apiClient.delete(`/user/stats/${this.userId}`);
      }

      // Clear local storage
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter(key => key.includes(this.userId));
      
      for (const key of userKeys) {
        await AsyncStorage.removeItem(key);
      }
      
      console.log('🗑️ User data cleared');
    } catch (error) {
      console.error('❌ Error clearing user data:', error);
    }
  }

  // Force sync all data
  async forceSync() {
    await this.checkNetworkStatus();
    
    if (this.isOnline) {
      await this.syncQueuedStats();
      // Reload stats from server
      return await this.getUserStats();
    } else {
      console.warn('📱 Cannot sync - offline');
      return await this.loadLocalStats() || this.getDefaultStats();
    }
  }
}

export default new RealUserStatsService();
