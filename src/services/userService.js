import apiClient from './apiClient';

const userService = {
  // Get user stats (hearts, diamonds, XP, etc.)
  async getUserStats() {
    try {
      // Mock implementation - in real app, you'd call API
      const mockStats = {
        hearts: 5,
        diamonds: 0,
        xp: 0,
        level: 1,
        streak: 0,
        totalLessons: 0,
        completedLessons: 0,
      };

      return {
        success: true,
        data: mockStats,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Update user stats
  async updateUserStats(stats) {
    try {
      // Mock implementation - in real app, you'd call API
      console.log('Updating user stats:', stats);
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error updating user stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get user profile
  async getUserProfile() {
    try {
      // Mock implementation - in real app, you'd call API
      const mockProfile = {
        id: '1',
        username: 'ผู้เรียน',
        email: 'user@example.com',
        petName: 'Fluffy',
        avatar: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      return {
        success: true,
        data: mockProfile,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Update user profile
  async updateUserProfile(profileData) {
    try {
      console.log('Updating user profile:', profileData);
      
      const response = await apiClient.put('/user/profile', profileData);
      
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Get user achievements
  async getUserAchievements() {
    try {
      // Mock implementation - in real app, you'd call API
      const mockAchievements = [
        {
          id: '1',
          title: 'First Lesson',
          description: 'Complete your first lesson',
          icon: 'star',
          unlocked: true,
          unlockedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Streak Master',
          description: 'Maintain a 7-day streak',
          icon: 'fire',
          unlocked: false,
          unlockedAt: null,
        },
      ];

      return {
        success: true,
        data: mockAchievements,
      };
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get user progress
  async getUserProgress() {
    try {
      // Mock implementation - in real app, you'd call API
      const mockProgress = {
        totalXP: 0,
        currentLevel: 1,
        currentStreak: 0,
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
      };

      return {
        success: true,
        data: mockProgress,
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Add XP to user
  async addXP(amount) {
    try {
      // Mock implementation - in real app, you'd call API
      console.log(`Adding ${amount} XP to user`);
      
      return {
        success: true,
        data: { xpAdded: amount },
      };
    } catch (error) {
      console.error('Error adding XP:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Add hearts to user
  async addHearts(amount) {
    try {
      // Mock implementation - in real app, you'd call API
      console.log(`Adding ${amount} hearts to user`);
      
      return {
        success: true,
        data: { heartsAdded: amount },
      };
    } catch (error) {
      console.error('Error adding hearts:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Add diamonds to user
  async addDiamonds(amount) {
    try {
      // Mock implementation - in real app, you'd call API
      console.log(`Adding ${amount} diamonds to user`);
      
      return {
        success: true,
        data: { diamondsAdded: amount },
      };
    } catch (error) {
      console.error('Error adding diamonds:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default userService;
