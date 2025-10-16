const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lessonId: {
      type: String,
      required: true,
      index: true,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    diamondsEarned: {
      type: Number,
      default: 0,
    },
    heartsRemaining: {
      type: Number,
      default: 0,
    },
    timeSpentSec: {
      type: Number,
      default: 0,
    },
    unlockedNext: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

UserProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: false });

module.exports = mongoose.model('UserProgress', UserProgressSchema);
