import realUserStatsService from './realUserStatsService';

class UserStatsService {
  async initialize(userId) {
    if (!userId) {
      console.warn('UserStatsService.initialize called without userId');
      return null;
    }
    await realUserStatsService.initialize(userId);
    return realUserStatsService.getUserStats();
  }

  async updateUserStats(updates) {
    return realUserStatsService.updateUserStats(updates);
  }

  async loadUserStats() {
    return realUserStatsService.getUserStats();
  }

  async saveUserStats(stats) {
    return realUserStatsService.saveLocalStats(stats);
  }

  async clearUserData() {
    return realUserStatsService.clearUserData();
  }
}

export default new UserStatsService();
