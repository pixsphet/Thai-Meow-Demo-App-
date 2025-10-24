const mongoose = require('mongoose');

const CATEGORY_ENUM = [
  'Animals',
  'Food',
  'People & Family',
  'Colors',
  'Time',
  'Places',
  'Transportation',
  'Weather',
  'Objects',
  'Greetings & Common Phrases',
  'Activities',
  'Emotions',
  'Technology',
  'Level Advanced'
];

const GameVocabSchema = new mongoose.Schema({
  thai: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: CATEGORY_ENUM },
  imageKey: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
  tags: { type: [String], default: [] },
}, { timestamps: true });

GameVocabSchema.index({ category: 1, thai: 1 }, { unique: true });
GameVocabSchema.index({ thai: 1 });

module.exports = mongoose.model('GameVocab', GameVocabSchema);
module.exports.CATEGORY_ENUM = CATEGORY_ENUM;


