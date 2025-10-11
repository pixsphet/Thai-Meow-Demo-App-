import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

class RealProgressService {
  constructor() {
    this.userId = null;
    this.isOnline = true;
    this.lastNetworkCheck = 0;
    this.networkCheckInterval = 30000; // Check every 30 seconds
  }

  // Initialize with user ID
  async initialize(userId) {
    this.userId = userId;
    await this.checkNetworkStatus();
  }

  // Check network status with throttling
  async checkNetworkStatus() {
    const now = Date.now();
    if (now - this.lastNetworkCheck < this.networkCheckInterval) {
      return; // Skip check if done recently
    }
    
    this.lastNetworkCheck = now;
    try {
      // Simple network check
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      this.isOnline = true;
    } catch (error) {
      this.isOnline = false;
      // Only log warning once per check interval
      console.warn('📱 Offline mode detected');
    }
  }

  // Save progress snapshot to server
  async saveProgressSnapshot(lessonId, progressData) {
    if (!this.userId) {
      throw new Error('User ID not initialized');
    }

    const snapshot = {
      userId: this.userId,
      lessonId,
      currentIndex: progressData.currentIndex || 0,
      answers: progressData.answers || [],
      score: progressData.score || 0,
      hearts: progressData.hearts || 5,
      diamonds: progressData.diamonds || 0,
      xp: progressData.xp || 0,
      timeSpent: progressData.timeSpent || 0,
      accuracy: progressData.accuracy || 0,
      timestamp: new Date().toISOString(),
      isCompleted: progressData.isCompleted || false
    };

    try {
      if (this.isOnline) {
        // Save to server
        const response = await apiClient.post('/progress/user/session', snapshot);
        console.log('✅ Progress snapshot saved to server:', response.data);
        
        // Also save locally as backup
        await this.saveLocalSnapshot(lessonId, snapshot);
        return response.data;
      } else {
        // Save locally and queue for later sync
        await this.saveLocalSnapshot(lessonId, snapshot);
        await this.queueForSync(lessonId, snapshot);
        console.log('📱 Progress snapshot saved locally (offline)');
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error('❌ Error saving progress snapshot:', error);
      // Fallback to local storage
      await this.saveLocalSnapshot(lessonId, snapshot);
      await this.queueForSync(lessonId, snapshot);
      throw error;
    }
  }

  // Load progress snapshot from server or local storage
  async loadProgressSnapshot(lessonId) {
    if (!this.userId) {
      throw new Error('User ID not initialized');
    }

    try {
      if (this.isOnline) {
        // Try to load from server first
        const response = await apiClient.get('/progress/user/session', {
          params: { lessonId, userId: this.userId }
        });
        
        if (response.data && response.data.currentIndex !== undefined) {
          console.log('🌐 Progress snapshot loaded from server');
          // Update local storage with server data
          await this.saveLocalSnapshot(lessonId, response.data);
          return response.data;
        }
      }

      // Fallback to local storage
      const localSnapshot = await this.loadLocalSnapshot(lessonId);
      if (localSnapshot) {
        console.log('💾 Progress snapshot loaded from local storage');
        return localSnapshot;
      }

      console.log('📭 No progress snapshot found');
      return null;
    } catch (error) {
      console.error('❌ Error loading progress snapshot:', error);
      // Fallback to local storage
      const localSnapshot = await this.loadLocalSnapshot(lessonId);
      return localSnapshot;
    }
  }

  // Save snapshot locally
  async saveLocalSnapshot(lessonId, snapshot) {
    const key = `progress_snapshot_${this.userId}_${lessonId}`;
    await AsyncStorage.setItem(key, JSON.stringify(snapshot));
  }

  // Load snapshot from local storage
  async loadLocalSnapshot(lessonId) {
    const key = `progress_snapshot_${this.userId}_${lessonId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // Queue snapshot for sync when online
  async queueForSync(lessonId, snapshot) {
    const queueKey = `sync_queue_${this.userId}`;
    const queue = await this.getSyncQueue();
    queue.push({ lessonId, snapshot, timestamp: Date.now() });
    await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
  }

  // Get sync queue
  async getSyncQueue() {
    const queueKey = `sync_queue_${this.userId}`;
    const data = await AsyncStorage.getItem(queueKey);
    return data ? JSON.parse(data) : [];
  }

  // Sync queued snapshots when online
  async syncQueuedSnapshots() {
    if (!this.isOnline) return;

    const queue = await this.getSyncQueue();
    if (queue.length === 0) return;

    console.log(`🔄 Syncing ${queue.length} queued snapshots...`);

    for (const item of queue) {
      try {
        await apiClient.post('/progress/user/session', item.snapshot);
        console.log('✅ Synced snapshot for lesson:', item.lessonId);
      } catch (error) {
        console.error('❌ Failed to sync snapshot:', error);
        // Keep in queue for next attempt
      }
    }

    // Clear successfully synced items
    await AsyncStorage.removeItem(`sync_queue_${this.userId}`);
    console.log('✅ Sync queue cleared');
  }

  // Clear progress snapshot
  async clearProgressSnapshot(lessonId) {
    if (!this.userId) return;

    try {
      // Clear from server
      if (this.isOnline) {
        await apiClient.delete('/progress/user/session', {
          params: { lessonId, userId: this.userId }
        });
      }

      // Clear from local storage
      const key = `progress_snapshot_${this.userId}_${lessonId}`;
      await AsyncStorage.removeItem(key);
      
      console.log('🗑️ Progress snapshot cleared');
    } catch (error) {
      console.error('❌ Error clearing progress snapshot:', error);
    }
  }

  // Save final game results
  async saveFinalResults(lessonId, results) {
    if (!this.userId) {
      throw new Error('User ID not initialized');
    }

    const finalResults = {
      userId: this.userId,
      lessonId,
      finalScore: results.finalScore || 0,
      accuracy: results.accuracy || 0,
      timeSpent: results.timeSpent || 0,
      xpEarned: results.xpEarned || 0,
      diamondsEarned: results.diamondsEarned || 0,
      heartsRemaining: results.heartsRemaining || 0,
      totalQuestions: results.totalQuestions || 0,
      correctAnswers: results.correctAnswers || 0,
      completedAt: new Date().toISOString(),
      isCompleted: true
    };

    try {
      if (this.isOnline) {
        // Save to server
        const response = await apiClient.post('/progress/finish', finalResults);
        console.log('✅ Final results saved to server:', response.data);
        
        // Update user stats
        await this.updateUserStats(finalResults);
        
        // Clear progress snapshot
        await this.clearProgressSnapshot(lessonId);
        
        return response.data;
      } else {
        // Queue for later sync
        await this.queueForSync(lessonId, finalResults);
        console.log('📱 Final results queued for sync (offline)');
        return { success: true, offline: true };
      }
    } catch (error) {
      console.error('❌ Error saving final results:', error);
      throw error;
    }
  }

  // Update user stats
  async updateUserStats(results) {
    try {
      const statsUpdate = {
        xp: results.xpEarned,
        diamonds: results.diamondsEarned,
        hearts: results.heartsRemaining,
        accuracy: results.accuracy,
        totalTimeSpent: results.timeSpent,
        totalSessions: 1, // Increment by 1
        lastPlayed: results.completedAt
      };

      await apiClient.post('/user/stats', { stats: statsUpdate });
      console.log('✅ User stats updated');
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
    }
  }

  // Get user progress summary
  async getUserProgress() {
    if (!this.userId) {
      throw new Error('User ID not initialized');
    }

    try {
      if (this.isOnline) {
        const response = await apiClient.get('/progress/user', {
          params: { userId: this.userId }
        });
        return response.data;
      } else {
        // Return local progress data
        const localData = await this.getLocalProgressData();
        return localData;
      }
    } catch (error) {
      console.error('❌ Error getting user progress:', error);
      return [];
    }
  }

  // Get local progress data
  async getLocalProgressData() {
    const keys = await AsyncStorage.getAllKeys();
    const progressKeys = keys.filter(key => key.startsWith(`progress_snapshot_${this.userId}_`));
    
    const progressData = [];
    for (const key of progressKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        progressData.push(JSON.parse(data));
      }
    }
    
    return progressData;
  }
}

export default new RealProgressService();
