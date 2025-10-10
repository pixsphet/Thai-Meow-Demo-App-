const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
  thai: {
    type: String,
    required: true,
    trim: true
  },
  roman: {
    type: String,
    required: true,
    trim: true
  },
  meaning: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['consonant', 'vowel', 'tone', 'word', 'phrase']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced']
  },
  // Audio files
  audioUrl: {
    type: String,
    trim: true
  },
  // Image for visual learning
  imageUrl: {
    type: String,
    trim: true
  },
  // Example usage
  examples: [{
    thai: String,
    roman: String,
    meaning: String
  }],
  // Related words
  relatedWords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vocabulary'
  }],
  // Usage frequency (for difficulty calculation)
  frequency: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  // Tags for search and filtering
  tags: [String],
  // Learning progress tracking
  stats: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    correctAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for search
vocabularySchema.index({ thai: 'text', roman: 'text', meaning: 'text' });
vocabularySchema.index({ category: 1, difficulty: 1 });

// Calculate accuracy
vocabularySchema.methods.calculateAccuracy = function() {
  if (this.stats.totalAttempts === 0) return 0;
  return (this.stats.correctAttempts / this.stats.totalAttempts) * 100;
};

// Update stats
vocabularySchema.methods.updateStats = function(correct, score) {
  this.stats.totalAttempts += 1;
  if (correct) {
    this.stats.correctAttempts += 1;
  }
  
  // Update average score
  const totalScore = this.stats.averageScore * (this.stats.totalAttempts - 1) + score;
  this.stats.averageScore = totalScore / this.stats.totalAttempts;
};

module.exports = mongoose.model('Vocabulary', vocabularySchema);