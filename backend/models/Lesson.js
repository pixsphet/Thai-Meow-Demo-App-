const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['consonants', 'vowels', 'tones', 'words', 'sentences']
  },
  level: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  stageCount: {
    type: Number,
    required: true,
    min: 1
  },
  estimatedTime: {
    type: Number,
    required: true,
    min: 1 // in minutes
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  rewards: {
    xp: {
      type: Number,
      default: 10
    },
    diamonds: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Index for better performance
lessonSchema.index({ category: 1, level: 1 });
lessonSchema.index({ isActive: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);