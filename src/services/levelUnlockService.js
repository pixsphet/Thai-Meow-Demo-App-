// src/services/levelUnlockService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import gameProgressService from './gameProgressService';

const UNLOCK_KEYS = {
  UNLOCKED_LEVELS: 'unlocked_levels',
  UNLOCK_RULES: 'unlock_rules',
};

/**
 * Level Unlock Service
 * Handles level unlocking logic based on performance thresholds
 */
class LevelUnlockService {
  constructor() {
    this.userId = null;
    this.unlockRules = {
      accuracyThreshold: 70, // 70% accuracy required
      minimumAttempts: 1,    // At least 1 attempt
      consecutiveSuccess: false, // Not required
    };
  }

  /**
   * Initialize service with user ID
   */
  async initialize(userId) {
    this.userId = userId;
    console.log('🔓 LevelUnlockService initialized for user:', userId);
  }

  /**
   * Check if a level should be unlocked based on performance
   */
  async checkAndUnlockNextLevel(currentLevelId, performanceData) {
    try {
      const { accuracy, score, attempts = 1 } = performanceData;
      
      // Check if performance meets unlock criteria
      const shouldUnlock = this.evaluateUnlockCriteria(accuracy, score, attempts);
      
      if (shouldUnlock) {
        const nextLevel = this.getNextLevel(currentLevelId);
        if (nextLevel) {
          const unlockData = {
            userId: this.userId,
            currentLevel: currentLevelId,
            unlockedLevel: nextLevel,
            levelId: nextLevel,
            accuracy,
            score,
            attempts,
            unlockedAt: new Date().toISOString(),
            unlockReason: 'performance_threshold_met'
          };

          await this.unlockLevel(unlockData);
          return unlockData;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error checking level unlock:', error);
      return null;
    }
  }

  /**
   * Evaluate unlock criteria
   */
  evaluateUnlockCriteria(accuracy, score, attempts) {
    const { accuracyThreshold, minimumAttempts } = this.unlockRules;
    
    return (
      accuracy >= accuracyThreshold &&
      attempts >= minimumAttempts
    );
  }

  /**
   * Get next level ID
   */
  getNextLevel(currentLevelId) {
    const levelMap = {
      'level1': 'level2',
      'level2': 'level3',
      'level3': 'level4',
      'level4': 'level5',
      'level5': 'level6',
      'level6': 'level7',
      'level7': 'level8',
      'level8': 'level9',
      'level9': 'level10',
      'level10': null // Max level reached
    };

    return levelMap[currentLevelId] || null;
  }

  /**
   * Unlock a level
   */
  async unlockLevel(unlockData) {
    try {
      // Save unlock locally
      await this.saveLevelUnlock(unlockData);

      // Try to sync to server
      try {
        await this.syncLevelUnlockToServer(unlockData);
      } catch (error) {
        console.warn('⚠️ Failed to sync unlock to server, saved locally');
      }

      // Update game progress service
      await gameProgressService.saveLevelUnlock(unlockData);

      console.log(`🎉 Level ${unlockData.unlockedLevel} unlocked!`);
      return unlockData;
    } catch (error) {
      console.error('❌ Error unlocking level:', error);
      throw error;
    }
  }

  /**
   * Unlock level via API call
   */
  async unlockLevelViaAPI(levelId) {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      console.log(`🔓 Unlocking level ${levelId} via API for user ${this.userId}`);
      
      const response = await apiClient.post('/user/unlock-level', {
        userId: this.userId,
        levelId: levelId
      });

      if (response.data.success) {
        console.log(`✅ Level ${levelId} unlocked successfully via API`);
        
        // Also save locally
        const unlockData = {
          userId: this.userId,
          unlockedLevel: levelId,
          levelId,
          unlockedAt: new Date().toISOString()
        };
        await this.saveLevelUnlock(unlockData);
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to unlock level');
      }
    } catch (error) {
      console.error('❌ Error unlocking level via API:', error);
      throw error;
    }
  }

  /**
   * Save level unlock locally
   */
  async saveLevelUnlock(unlockData) {
    try {
      const key = `${UNLOCK_KEYS.UNLOCKED_LEVELS}_${this.userId}`;
      const existingUnlocks = await this.getUnlockedLevels();
      
      // Check if already unlocked
      const alreadyUnlocked = existingUnlocks.some(
        unlock => unlock.unlockedLevel === unlockData.unlockedLevel
      );
      
      if (!alreadyUnlocked) {
        const normalized = {
          ...unlockData,
          levelId: unlockData.levelId || unlockData.unlockedLevel,
        };
        const updatedUnlocks = [...existingUnlocks, normalized];
        await AsyncStorage.setItem(key, JSON.stringify(updatedUnlocks));
        console.log('💾 Level unlock saved locally');
      }
    } catch (error) {
      console.error('❌ Error saving level unlock:', error);
    }
  }

  /**
   * Get unlocked levels
   */
  async getUnlockedLevels() {
    try {
      const key = `${UNLOCK_KEYS.UNLOCKED_LEVELS}_${this.userId}`;
      const unlocks = await AsyncStorage.getItem(key);
      if (!unlocks) return [];
      return JSON.parse(unlocks).map(item => ({
        ...item,
        levelId: item.levelId || item.unlockedLevel,
      }));
    } catch (error) {
      console.error('❌ Error getting unlocked levels:', error);
      return [];
    }
  }

  /**
   * Check if level is unlocked
   */
  async isLevelUnlocked(levelId) {
    try {
      const unlockedLevels = await this.getUnlockedLevels();
      return unlockedLevels.some(unlock => unlock.unlockedLevel === levelId);
    } catch (error) {
      console.error('❌ Error checking if level is unlocked:', error);
      return false;
    }
  }

  /**
   * Get level status (locked/unlocked/current)
   */
  async getLevelStatus(levelId) {
    try {
      const isUnlocked = await this.isLevelUnlocked(levelId);
      const progress = await gameProgressService.getLessonProgress(levelId);
      
      if (progress.completed && progress.isUnlocked) {
        return 'completed';
      } else if (isUnlocked || progress.completed) {
        return 'unlocked';
      } else {
        return 'locked';
      }
    } catch (error) {
      console.error('❌ Error getting level status:', error);
      return 'locked';
    }
  }

  /**
   * Get level progress details
   */
  async getLevelProgress(levelId) {
    try {
      const progress = await gameProgressService.getLessonProgress(levelId);
      const status = await this.getLevelStatus(levelId);
      
      return {
        levelId,
        status,
        ...progress,
        canUnlock: progress.accuracy >= this.unlockRules.accuracyThreshold,
        unlockThreshold: this.unlockRules.accuracyThreshold
      };
    } catch (error) {
      console.error('❌ Error getting level progress:', error);
      return {
        levelId,
        status: 'locked',
        completed: false,
        accuracy: 0,
        bestScore: 0,
        attempts: 0,
        lastPlayed: null,
        canUnlock: false,
        unlockThreshold: this.unlockRules.accuracyThreshold
      };
    }
  }

  /**
   * Sync level unlock to server
   */
  async syncLevelUnlockToServer(unlockData) {
    try {
      const levelId = unlockData.levelId || unlockData.unlockedLevel || unlockData.currentLevel;
      if (!this.userId || !levelId) {
        throw new Error('Missing userId or levelId for level unlock sync');
      }
      const response = await apiClient.post('/user/unlock-level', {
        userId: this.userId,
        levelId
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
   * Get all levels with their status
   */
  async getAllLevelsStatus() {
    try {
      const levels = [
        'level1', 'level2', 'level3', 'level4', 'level5',
        'level6', 'level7', 'level8', 'level9', 'level10'
      ];

      const levelsStatus = await Promise.all(
        levels.map(async (levelId) => {
          const progress = await this.getLevelProgress(levelId);
          return {
            id: levelId,
            name: this.getLevelName(levelId),
            ...progress
          };
        })
      );

      return levelsStatus;
    } catch (error) {
      console.error('❌ Error getting all levels status:', error);
      return [];
    }
  }

  /**
   * Get level name
   */
  getLevelName(levelId) {
    const levelNames = {
      'level1': 'พยัญชนะ ก-ฮ',
      'level2': 'สระไทย',
      'level3': 'วรรณยุกต์',
      'level4': 'คำพื้นฐาน',
      'level5': 'ประโยคง่าย',
      'level6': 'การอ่าน',
      'level7': 'การเขียน',
      'level8': 'ไวยากรณ์',
      'level9': 'บทสนทนา',
      'level10': 'ระดับสูง'
    };

    return levelNames[levelId] || levelId;
  }

  /**
   * Reset all unlocks (for testing)
   */
  async resetAllUnlocks() {
    try {
      const key = `${UNLOCK_KEYS.UNLOCKED_LEVELS}_${this.userId}`;
      await AsyncStorage.removeItem(key);
      console.log('🔄 All level unlocks reset');
    } catch (error) {
      console.error('❌ Error resetting unlocks:', error);
    }
  }

  /**
   * Update unlock rules
   */
  updateUnlockRules(newRules) {
    this.unlockRules = { ...this.unlockRules, ...newRules };
    console.log('⚙️ Unlock rules updated:', this.unlockRules);
  }

  /**
   * Get unlock rules
   */
  getUnlockRules() {
    return { ...this.unlockRules };
  }

  /**
   * Check if user can access level (considering prerequisites)
   */
  async canAccessLevel(levelId) {
    try {
      // Level 1 is always accessible
      if (levelId === 'level1') {
        return true;
      }

      // Check if previous level is completed with sufficient accuracy
      const previousLevel = this.getPreviousLevel(levelId);
      if (!previousLevel) {
        return false;
      }

      const previousProgress = await this.getLevelProgress(previousLevel);
      return previousProgress.completed && previousProgress.accuracy >= this.unlockRules.accuracyThreshold;
    } catch (error) {
      console.error('❌ Error checking level access:', error);
      return false;
    }
  }

  /**
   * Reset all progress for fresh start (admin/debug feature)
   * Clears all unlocked levels and game progress for user
   */
  async resetAllProgress() {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      console.log('🔄 Resetting all progress for user:', this.userId);

      // Clear unlocked levels
      const unlockedKey = `${UNLOCK_KEYS.UNLOCKED_LEVELS}_${this.userId}`;
      await AsyncStorage.removeItem(unlockedKey);

      // Try to sync reset to server
      try {
        await apiClient.post('/user/reset-progress', {
          userId: this.userId,
        });
        console.log('☁️ Reset synced to server');
      } catch (error) {
        console.warn('⚠️ Failed to sync reset to server, cleared locally');
      }

      console.log('✅ All progress reset successfully. Only level1 is now accessible.');
      return { success: true, message: 'All progress has been reset' };
    } catch (error) {
      console.error('❌ Error resetting progress:', error);
      throw error;
    }
  }

  /**
   * Reset progress for specific level
   */
  async resetLevelProgress(levelId) {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      console.log(`🔄 Resetting progress for level: ${levelId}`);

      // Remove this level from unlocked list
      const key = `${UNLOCK_KEYS.UNLOCKED_LEVELS}_${this.userId}`;
      const existingUnlocks = await this.getUnlockedLevels();
      const filtered = existingUnlocks.filter(u => u.unlockedLevel !== levelId);
      
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
      console.log(`✅ Level ${levelId} progress reset`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error resetting level progress:', error);
      throw error;
    }
  }

  /**
   * Get previous level ID
   */
  getPreviousLevel(levelId) {
    const levelMap = {
      'level2': 'level1',
      'level3': 'level2',
      'level4': 'level3',
      'level5': 'level4',
      'level6': 'level5',
      'level7': 'level6',
      'level8': 'level7',
      'level9': 'level8',
      'level10': 'level9'
    };

    return levelMap[levelId] || null;
  }
}

export default new LevelUnlockService();
