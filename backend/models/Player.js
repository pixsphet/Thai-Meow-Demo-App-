const mongoose = require('mongoose');
const { Schema } = mongoose;

const StreakSchema = new Schema({
  current: { type: Number, default: 0 },       // วันติดกันตอนนี้
  best: { type: Number, default: 0 },          // สถิติดีสุด
  lastLoginDate: { type: Date, default: null } // ใช้เช็คต่อเนื่อง
}, { _id: false });

const WalletSchema = new Schema({
  diamonds: { type: Number, default: 0 },
  hearts: { type: Number, default: 5 },        // คงเหลือ ณ ปัจจุบัน
  maxHearts: { type: Number, default: 5 },
}, { _id: false });

const LevelSchema = new Schema({
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  nextLevelXp: { type: Number, default: 100 } // XP ที่ต้องใช้เลื่อนเลเวล
}, { _id: false });

const PlayerSchema = new Schema({
  userId: { type: String, unique: true, index: true, required: true },
  displayName: String,
  photoUrl: String,

  levelInfo: { type: LevelSchema, default: () => ({}) },
  streak:    { type: StreakSchema, default: () => ({}) },
  wallet:    { type: WalletSchema, default: () => ({}) },

  totals: {
    lessonsCompleted: { type: Number, default: 0 },
    correctAnswers:   { type: Number, default: 0 },
    wrongAnswers:     { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Player', PlayerSchema);
