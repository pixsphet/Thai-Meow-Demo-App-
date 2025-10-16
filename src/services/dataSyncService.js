// src/services/dataSyncService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { API_ORIGIN } from './apiClient';
import realUserStatsService from './realUserStatsService';
import realProgressService from './realProgressService';

class DataSyncService {
  constructor() {
    this.userId = null;
    this.isOnline = true;
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
  }

  getStorageKey(key) {
    return `${key}:${this.userId || 'guest'}`;
  }

  /**
   * Initialize sync service with user ID
   */
  async initialize(userId) {
    this.userId = userId;
    console.log('🔄 Initializing DataSyncService for user:', userId);
    
    // Initialize other services
    await realUserStatsService.initialize(userId);
    await realProgressService.initialize(userId);
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Perform initial sync
    await this.syncAllData();
  }

  /**
   * Start periodic data synchronization
   */
  startPeriodicSync() {
    // Clear existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      if (!this.syncInProgress) {
        await this.syncAllData();
      }
    }, 30000);

    console.log('⏰ Started periodic sync (every 30 seconds)');
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Stopped periodic sync');
    }
  }

  /**
   * Sync all user data
   */
  async syncAllData() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Starting full data sync...');

      // Check network status
      await this.checkNetworkStatus();

      if (!this.isOnline) {
        console.log('📱 Offline - skipping sync');
        return;
      }

      // Sync user stats
      await this.syncUserStats();

      // Sync progress data
      await this.syncProgressData();

      // Update last sync time
      this.lastSyncTime = new Date().toISOString();
      await AsyncStorage.setItem(this.getStorageKey('lastSyncTime'), this.lastSyncTime);

      console.log('✅ Data sync completed successfully');
    } catch (error) {
      console.error('❌ Error during data sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync user stats
   */
  async syncUserStats() {
    try {
      console.log('📊 Syncing user stats...');
      
      // Force sync from server
      const serverStats = await realUserStatsService.forceSync();
      
      if (serverStats) {
        console.log('✅ User stats synced:', serverStats);
        return serverStats;
      }
    } catch (error) {
      console.error('❌ Error syncing user stats:', error);
      throw error;
    }
  }

  /**
   * Sync progress data
   */
  async syncProgressData() {
    try {
      console.log('📈 Syncing progress data...');
      
      // Get local progress data
      const localProgress = await this.getLocalProgressData();
      
      if (localProgress && localProgress.length > 0) {
        // Sync each progress item to server
        for (const progress of localProgress) {
          try {
            await realProgressService.saveProgressSnapshot(progress.lessonId, progress);
            console.log(`✅ Progress synced for lesson ${progress.lessonId}`);
          } catch (error) {
            console.error(`❌ Error syncing progress for lesson ${progress.lessonId}:`, error);
          }
        }
      }
      
      console.log('✅ Progress data sync completed');
    } catch (error) {
      console.error('❌ Error syncing progress data:', error);
      throw error;
    }
  }

  /**
   * Get local progress data from storage
   */
  async getLocalProgressData() {
    try {
      const progressData = await AsyncStorage.getItem(this.getStorageKey('progressData'));
      return progressData ? JSON.parse(progressData) : [];
    } catch (error) {
      console.error('❌ Error getting local progress data:', error);
      return [];
    }
  }

  /**
   * Save local progress data
   */
  async saveLocalProgressData(progressData) {
    try {
      await AsyncStorage.setItem(this.getStorageKey('progressData'), JSON.stringify(progressData));
      console.log('💾 Progress data saved locally');
    } catch (error) {
      console.error('❌ Error saving local progress data:', error);
    }
  }

  /**
   * Check network status
   */
  async checkNetworkStatus() {
    try {
      // Try to connect to our backend first
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
      // Fallback to Google
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
      console.warn('📱 Offline mode detected - no internet connection');
    }
  }

  /**
   * Force immediate sync
   */
  async forceSync() {
    console.log('🚀 Force sync requested');
    await this.syncAllData();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      userId: this.userId
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopPeriodicSync();
    this.userId = null;
    this.syncInProgress = false;
    console.log('🧹 DataSyncService destroyed');
  }
}

// Export singleton instance
const dataSyncService = new DataSyncService();
export default dataSyncService;
