const mongoose = require('mongoose');

const VocabSchema = new mongoose.Schema({
  thai: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nameTH: {
    type: String,
    required: true,
    trim: true
  },
  en: {
    type: String,
    required: true,
    trim: true
  },
  roman: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    default: 'thai-consonants',
    enum: ['thai-consonants', 'thai-vowels', 'thai-tones']
  },
  level: {
    type: String,
    required: true,
    default: 'Beginner',
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  imagePath: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  audioUrl: {
    type: String,
    default: '',
    trim: true
  },
  // Additional fields for game logic
  difficulty: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
VocabSchema.index({ category: 1, level: 1 });
VocabSchema.index({ thai: 1 });
VocabSchema.index({ isActive: 1 });

// Virtual for display name
VocabSchema.virtual('displayName').get(function() {
  return `${this.thai} - ${this.nameTH}`;
});

// Method to get all consonants
VocabSchema.statics.getConsonants = function() {
  return this.find({ 
    category: 'thai-consonants',
    isActive: true 
  }).sort({ thai: 1 });
};

// Method to get consonants by level
VocabSchema.statics.getConsonantsByLevel = function(level) {
  return this.find({ 
    category: 'thai-consonants',
    level: level,
    isActive: true 
  }).sort({ thai: 1 });
};

// Method to get random consonants for game
VocabSchema.statics.getRandomConsonants = function(count = 10, level = 'Beginner') {
  return this.aggregate([
    { 
      $match: { 
        category: 'thai-consonants',
        level: level,
        isActive: true 
      } 
    },
    { $sample: { size: count } }
  ]);
};

module.exports = mongoose.model('Vocab', VocabSchema);