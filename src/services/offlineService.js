import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.pendingActions = [];
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    // Simple network check using fetch
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        const wasOffline = !this.isOnline;
        this.isOnline = true;
        
        if (wasOffline && this.isOnline) {
          console.log('🌐 Back online - syncing pending actions');
          this.syncPendingActions();
        }
      } catch (error) {
        const wasOnline = this.isOnline;
        this.isOnline = false;
        
        if (wasOnline && !this.isOnline) {
          console.log('📱 Offline mode - actions will be queued');
        }
      }
    };

    // Check network status every 10 seconds
    setInterval(checkNetwork, 10000);
    checkNetwork();
  }

  // Queue action for later sync
  async queueAction(action) {
    const userId = await this.getCurrentUserId();
    const actionWithId = {
      ...action,
      id: Date.now() + Math.random(),
      userId: userId || 'demo',
      timestamp: new Date().toISOString()
    };

    this.pendingActions.push(actionWithId);
    await this.savePendingActions();
    
    console.log('📝 Action queued for sync:', action.type);
  }

  // Save pending actions to storage
  async savePendingActions() {
    try {
      await AsyncStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Error saving pending actions:', error);
    }
  }

  // Load pending actions from storage
  async loadPendingActions() {
    try {
      const stored = await AsyncStorage.getItem('pendingActions');
      if (stored) {
        this.pendingActions = JSON.parse(stored);
        console.log(`📋 Loaded ${this.pendingActions.length} pending actions`);
      }
    } catch (error) {
      console.error('Error loading pending actions:', error);
    }
  }

  // Sync pending actions when back online
  async syncPendingActions() {
    if (this.pendingActions.length === 0) return;

    console.log(`🔄 Syncing ${this.pendingActions.length} pending actions...`);
    
    const actionsToSync = [...this.pendingActions];
    this.pendingActions = [];

    for (const action of actionsToSync) {
      try {
        await this.executeAction(action);
        console.log('✅ Synced action:', action.type);
      } catch (error) {
        console.error('❌ Failed to sync action:', action.type, error);
        // Re-queue failed actions
        this.pendingActions.push(action);
      }
    }

    await this.savePendingActions();
  }

  // Execute a specific action
  async executeAction(action) {
    const { progressServicePerUser } = require('./progressServicePerUser');
    
    switch (action.type) {
      case 'SAVE_PROGRESS':
        await progressServicePerUser.saveProgressSession(action.data);
        break;
      case 'UPDATE_STATS':
        await progressServicePerUser.postUserStats(action.data);
        break;
      case 'FINISH_LESSON':
        await progressServicePerUser.finishLesson(action.data);
        break;
      case 'TICK_STREAK':
        await progressServicePerUser.tickDailyStreak();
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  }

  // Wrapper for save progress with offline support
  async saveProgressWithOfflineSupport(lessonId, progressData) {
    const action = {
      type: 'SAVE_PROGRESS',
      data: { lessonId, ...progressData }
    };

    if (this.isOnline) {
      try {
        const { saveProgressSession } = require('./progressServicePerUser');
        await saveProgressSession({ lessonId, ...progressData });
        console.log('✅ Progress saved online');
      } catch (error) {
        console.warn('⚠️ Online save failed, queuing for later:', error);
        await this.queueAction(action);
      }
    } else {
      console.log('📱 Offline - queuing progress save');
      await this.queueAction(action);
    }
  }

  // Wrapper for update stats with offline support
  async updateStatsWithOfflineSupport(statsData) {
    const action = {
      type: 'UPDATE_STATS',
      data: statsData
    };

    if (this.isOnline) {
      try {
        const { postUserStats } = require('./progressServicePerUser');
        await postUserStats(statsData);
        console.log('✅ Stats updated online');
      } catch (error) {
        console.warn('⚠️ Online stats update failed, queuing for later:', error);
        await this.queueAction(action);
      }
    } else {
      console.log('📱 Offline - queuing stats update');
      await this.queueAction(action);
    }
  }

  // Wrapper for finish lesson with offline support
  async finishLessonWithOfflineSupport(lessonData) {
    const action = {
      type: 'FINISH_LESSON',
      data: lessonData
    };

    if (this.isOnline) {
      try {
        const { finishLesson } = require('./progressServicePerUser');
        await finishLesson(lessonData);
        console.log('✅ Lesson finished online');
      } catch (error) {
        console.warn('⚠️ Online lesson finish failed, queuing for later:', error);
        await this.queueAction(action);
      }
    } else {
      console.log('📱 Offline - queuing lesson finish');
      await this.queueAction(action);
    }
  }

  // Get offline status
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      pendingActionsCount: this.pendingActions.length
    };
  }

  // Helper function to get current user ID
  async getCurrentUserId() {
    try {
      const user = await AsyncStorage.getItem('userData');
      return user ? JSON.parse(user).id : null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  // Clear all pending actions (use with caution)
  async clearPendingActions() {
    this.pendingActions = [];
    await AsyncStorage.removeItem('pendingActions');
    console.log('🗑️ Cleared all pending actions');
  }
}

// Export singleton instance
export default new OfflineService();

