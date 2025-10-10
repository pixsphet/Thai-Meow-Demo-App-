const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  lessonKey: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['consonants', 'vowels', 'tones', 'words', 'phrases'],
    index: true,
  },
  gameMode: {
    type: String,
    required: true,
    enum: ['matching', 'multiple-choice', 'fill-blank', 'order', 'quiz'],
    index: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0,
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0, // in seconds
  },
  questions: [{
    questionId: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    userAnswer: {
      type: String,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    hintsUsed: {
      type: Number,
      default: 0,
    },
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium',
  },
  xpGained: {
    type: Number,
    default: 0,
    min: 0,
  },
  achievements: [{
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    xpReward: {
      type: Number,
      default: 0,
    },
  }],
  sessionData: {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    deviceInfo: {
      platform: {
        type: String,
        trim: true,
      },
      version: {
        type: String,
        trim: true,
      },
    },
    location: {
      country: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isPerfect: {
    type: Boolean,
    default: false,
  },
  streak: {
    type: Number,
    default: 0,
    min: 0,
  },
  rank: {
    type: Number,
    min: 1,
  },
  percentile: {
    type: Number,
    min: 0,
    max: 100,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
gameResultSchema.index({ userId: 1, createdAt: -1 });
gameResultSchema.index({ category: 1, gameMode: 1 });
gameResultSchema.index({ score: -1 });
gameResultSchema.index({ accuracy: -1 });
gameResultSchema.index({ timeSpent: 1 });
gameResultSchema.index({ isCompleted: 1 });

// Virtual for score percentage
gameResultSchema.virtual('scorePercentage').get(function() {
  if (this.maxScore === 0) return 0;
  return Math.round((this.score / this.maxScore) * 100);
});

// Virtual for session duration
gameResultSchema.virtual('sessionDuration').get(function() {
  return Math.floor((this.sessionData.endTime - this.sessionData.startTime) / 1000);
});

// Virtual for questions count
gameResultSchema.virtual('questionsCount').get(function() {
  return this.questions.length;
});

// Virtual for correct answers count
gameResultSchema.virtual('correctAnswersCount').get(function() {
  return this.questions.filter(q => q.isCorrect).length;
});

// Static method to get user statistics
gameResultSchema.statics.getUserStats = function(userId, options = {}) {
  const matchStage = { userId: mongoose.Types.ObjectId(userId) };
  
  if (options.category) {
    matchStage.category = options.category;
  }
  
  if (options.gameMode) {
    matchStage.gameMode = options.gameMode;
  }
  
  if (options.dateFrom || options.dateTo) {
    matchStage.createdAt = {};
    if (options.dateFrom) {
      matchStage.createdAt.$gte = new Date(options.dateFrom);
    }
    if (options.dateTo) {
      matchStage.createdAt.$lte = new Date(options.dateTo);
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalGames: { $sum: 1 },
        totalScore: { $sum: '$score' },
        averageScore: { $avg: '$score' },
        averageAccuracy: { $avg: '$accuracy' },
        averageTimeSpent: { $avg: '$timeSpent' },
        totalTimeSpent: { $sum: '$timeSpent' },
        completedGames: {
          $sum: { $cond: ['$isCompleted', 1, 0] }
        },
        perfectGames: {
          $sum: { $cond: ['$isPerfect', 1, 0] }
        },
        totalXP: { $sum: '$xpGained' },
        bestScore: { $max: '$score' },
        bestAccuracy: { $max: '$accuracy' },
        longestStreak: { $max: '$streak' },
      }
    },
    {
      $project: {
        totalGames: 1,
        totalScore: 1,
        averageScore: { $round: ['$averageScore', 2] },
        averageAccuracy: { $round: ['$averageAccuracy', 2] },
        averageTimeSpent: { $round: ['$averageTimeSpent', 2] },
        totalTimeSpent: 1,
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ['$completedGames', '$totalGames'] }, 100] },
            2
          ]
        },
        perfectRate: {
          $round: [
            { $multiply: [{ $divide: ['$perfectGames', '$totalGames'] }, 100] },
            2
          ]
        },
        totalXP: 1,
        bestScore: 1,
        bestAccuracy: 1,
        longestStreak: 1,
      }
    }
  ]);
};

// Static method to get leaderboard
gameResultSchema.statics.getLeaderboard = function(options = {}) {
  const matchStage = {};
  
  if (options.category) {
    matchStage.category = options.category;
  }
  
  if (options.gameMode) {
    matchStage.gameMode = options.gameMode;
  }
  
  if (options.dateFrom || options.dateTo) {
    matchStage.createdAt = {};
    if (options.dateFrom) {
      matchStage.createdAt.$gte = new Date(options.dateFrom);
    }
    if (options.dateTo) {
      matchStage.createdAt.$lte = new Date(options.dateTo);
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        totalScore: { $sum: '$score' },
        totalGames: { $sum: 1 },
        averageScore: { $avg: '$score' },
        averageAccuracy: { $avg: '$accuracy' },
        completedGames: {
          $sum: { $cond: ['$isCompleted', 1, 0] }
        },
        totalXP: { $sum: '$xpGained' },
        lastPlayed: { $max: '$createdAt' },
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        username: '$user.username',
        totalScore: 1,
        totalGames: 1,
        averageScore: { $round: ['$averageScore', 2] },
        averageAccuracy: { $round: ['$averageAccuracy', 2] },
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ['$completedGames', '$totalGames'] }, 100] },
            2
          ]
        },
        totalXP: 1,
        lastPlayed: 1,
      }
    },
    { $sort: { totalScore: -1, averageAccuracy: -1 } },
    { $limit: options.limit || 10 }
  ]);
};

// Static method to get game results by user
gameResultSchema.statics.getByUser = function(userId, options = {}) {
  const query = { userId: mongoose.Types.ObjectId(userId) };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.gameMode) {
    query.gameMode = options.gameMode;
  }
  
  if (options.limit) {
    return this.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit);
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Method to calculate rank and percentile
gameResultSchema.methods.calculateRank = async function() {
  const totalResults = await this.constructor.countDocuments({
    category: this.category,
    gameMode: this.gameMode,
    score: { $gte: this.score }
  });
  
  const totalGames = await this.constructor.countDocuments({
    category: this.category,
    gameMode: this.gameMode,
  });
  
  this.rank = totalResults;
  this.percentile = Math.round(((totalGames - totalResults + 1) / totalGames) * 100);
  
  return { rank: this.rank, percentile: this.percentile };
};

// Method to check for achievements
gameResultSchema.methods.checkAchievements = function() {
  const achievements = [];
  
  // Perfect score achievement
  if (this.isPerfect && !this.achievements.find(a => a.id === 'perfect_score')) {
    achievements.push({
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Achieved 100% accuracy',
      icon: '🎯',
      xpReward: 50,
    });
  }
  
  // Speed achievement
  if (this.timeSpent < 60 && this.accuracy >= 90) {
    achievements.push({
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Completed game in under 1 minute with 90%+ accuracy',
      icon: '⚡',
      xpReward: 30,
    });
  }
  
  // Streak achievement
  if (this.streak >= 5) {
    achievements.push({
      id: 'hot_streak',
      name: 'Hot Streak',
      description: 'Got 5 correct answers in a row',
      icon: '🔥',
      xpReward: 20,
    });
  }
  
  this.achievements.push(...achievements);
  return achievements;
};

// Pre-save middleware to calculate derived fields
gameResultSchema.pre('save', function(next) {
  // Calculate score percentage
  if (this.maxScore > 0) {
    this.scorePercentage = Math.round((this.score / this.maxScore) * 100);
  }
  
  // Check if perfect
  this.isPerfect = this.accuracy === 100 && this.score === this.maxScore;
  
  // Calculate XP gained
  const baseXP = Math.floor(this.score / 10);
  const accuracyBonus = Math.floor(this.accuracy / 10);
  const timeBonus = this.timeSpent < 300 ? 10 : 0; // Bonus for completing in under 5 minutes
  this.xpGained = baseXP + accuracyBonus + timeBonus;
  
  next();
});

module.exports = mongoose.model('GameResult', gameResultSchema);

