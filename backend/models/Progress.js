const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProgressSchema = new Schema({
  userId:    { type: String, index: true, required: true },
  lessonId:  { type: String, index: true, required: true }, // thai-consonants, thai-vowels, thai-tones ฯลฯ
  category:  { type: String },                               // consonants_basic, vowels_basic...
  currentIndex: { type: Number, default: 0 },
  total:       { type: Number, default: 0 },
  hearts:      { type: Number, default: 5 },
  score:       { type: Number, default: 0 },
  xp:          { type: Number, default: 0 },
  progress:    { type: Number, default: 0 },                 // 0-100 percentage
  accuracy:    { type: Number, default: 0 },                 // 0-100 percentage
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date, default: null },

  perLetter: { type: Schema.Types.Mixed, default: {} },      // {'ก': {...}}
  answers:   { type: Schema.Types.Mixed, default: {} },      // by questionId
  questionsSnapshot: { type: Array, default: [] },

  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

ProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
ProgressSchema.index({ userId: 1 }, { sparse: true });
ProgressSchema.index({ lessonId: 1 }, { sparse: true });

module.exports = mongoose.model('Progress', ProgressSchema);
