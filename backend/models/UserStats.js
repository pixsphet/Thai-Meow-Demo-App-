const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserStatsSchema = new Schema({
  userId: { type: String, unique: true, index: true, required: true },
  
  // Level & XP
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  nextLevelXp: { type: Number, default: 100 },
  
  // Streak
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },
  
  // Wallet
  diamonds: { type: Number, default: 0 },
  hearts: { type: Number, default: 5 },
  maxHearts: { type: Number, default: 5 },
  
  // Totals
  lessonsCompleted: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  
  // Game Results Summary
  lastGameResults: {
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    diamondsEarned: { type: Number, default: 0 },
    gameType: { type: String, default: '' },
    completedAt: { type: Date, default: null }
  },
  
  // Badges
  badges: { type: [String], default: [] },
  
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

UserStatsSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('UserStats', UserStatsSchema);

