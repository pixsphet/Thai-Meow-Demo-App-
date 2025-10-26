const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    petName: { type: String, default: 'น้องแมว' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: null },
    hearts: { type: Number, default: 5 },
    maxHearts: { type: Number, default: 5 },
    diamonds: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
  // Level up tracking
  levelUps: { type: Number, default: 0 },
  lastLevelUpAt: { type: Date, default: null },
    totalSessions: { type: Number, default: 0 },
    totalCorrectAnswers: { type: Number, default: 0 },
    totalWrongAnswers: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    lastPlayed: { type: Date, default: null },
    lastGameResults: { type: mongoose.Schema.Types.Mixed, default: null },
    badges: { type: [String], default: [] },
    achievements: { type: [mongoose.Schema.Types.Mixed], default: [] },
  // Reward logging and totals
  rewardHistory: {
    type: [
      new mongoose.Schema({
        type: { type: String, default: 'reward' }, // 'level_up' | 'reward'
        xp: { type: Number, default: 0 },
        diamonds: { type: Number, default: 0 },
        hearts: { type: Number, default: 0 },
        reason: { type: String, default: '' },
        source: { type: String, default: '' },
        levelBefore: { type: Number, default: null },
        levelAfter: { type: Number, default: null },
        createdAt: { type: Date, default: Date.now },
      }, { _id: false })
    ],
    default: []
  },
  totalXpEarned: { type: Number, default: 0 },
  totalDiamondsEarned: { type: Number, default: 0 },
  totalHeartsEarned: { type: Number, default: 0 },
  lastRewardAt: { type: Date, default: null },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    unlockedLevels: { 
      type: [String], 
      default: ['level1'], // Only level1 unlocked by default
    },
  },
  { timestamps: true }
);

UserSchema.methods.addXP = function addXP(xpGain = 0) {
  const gain = Number(xpGain);
  if (!Number.isFinite(gain) || gain === 0) {
    return {
      leveledUp: false,
      newLevel: this.level || 1,
      totalXP: this.xp || 0,
    };
  }

  const currentXP = Number(this.xp) || 0;
  const totalXP = currentXP + gain;
  this.xp = totalXP;

  const calculatedLevel = Math.floor(totalXP / 100) + 1;
  const previousLevel = this.level || 1;
  if (calculatedLevel > previousLevel) {
    this.level = calculatedLevel;
  } else if (!this.level) {
    this.level = calculatedLevel;
  }

  return {
    leveledUp: calculatedLevel > previousLevel,
    newLevel: this.level,
    totalXP,
  };
};

UserSchema.methods.updateStreak = function updateStreak() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = this.lastActiveAt ? new Date(this.lastActiveAt) : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  let isNewStreak = false;

  if (!lastActive) {
    this.streak = 1;
    isNewStreak = true;
  } else {
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return {
        streak: this.streak,
        longestStreak: this.longestStreak || this.streak,
        isNewStreak: false,
      };
    }
    if (diffDays === 1) {
      this.streak += 1;
      isNewStreak = true;
    } else if (diffDays > 1) {
      this.streak = 1;
      isNewStreak = true;
    }
  }

  this.longestStreak = Math.max(this.longestStreak || 0, this.streak);
  this.maxStreak = Math.max(this.maxStreak || 0, this.streak);
  this.lastActiveAt = today;

  return {
    streak: this.streak,
    longestStreak: this.longestStreak,
    isNewStreak,
  };
};

module.exports = mongoose.model('User', UserSchema);
