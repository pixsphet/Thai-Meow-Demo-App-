const express = require('express');
const Progress = require('../models/Progress');
const UserProgress = require('../models/UserProgress');
const auth = require('../middleware/auth');
const {
  applyProgressToUser,
  getUserStatsSnapshot,
  getUserWithMergedData,
} = require('../services/userStats');
const router = express.Router();

// POST upsert
router.post('/session', auth, async (req, res) => {
  const userId = req.user.id;
  const payload = req.body || {};
  if (!payload.lessonId) return res.status(400).json({ error: 'lessonId required' });

  const doc = await Progress.findOneAndUpdate(
    { userId, lessonId: payload.lessonId },
    { $set: { ...payload, userId, updatedAt: new Date() } },
    { upsert: true, new: true }
  ).lean();

  res.json({ ok: true, id: doc._id, progress: doc });
});

// GET one lesson progress
router.get('/session', auth, async (req, res) => {
  const userId = req.user.id;
  const { lessonId } = req.query;
  if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

  const doc = await Progress.findOne({ userId, lessonId }).lean();
  res.json(doc || null);
});

// finish a lesson → award diamonds/xp/level up
router.post('/finish', auth, async (req, res) => {
  const userId = req.user.id;
  const { lessonId, score=0, xpGain=0, diamonds=0, heartsLeft } = req.body;
  if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

  await Progress.updateOne(
    { userId, lessonId },
    { $set: { score, xp: xpGain, diamondsEarned: diamonds, hearts: heartsLeft ?? 0, updatedAt: new Date() } }
  );

  const user = await getUserWithMergedData(userId);
  if (user) {
    applyProgressToUser(user, {
      xpGain,
      diamondsEarned: diamonds,
      heartsLeft: heartsLeft ?? user.hearts,
      completedLesson: true,
      incrementSession: true,
      lastPlayed: new Date(),
    });
    await user.save();
  }

  const stats = await getUserStatsSnapshot(userId);

  res.json({ ok: true, stats });
});

// Lesson 2 vowels completion
router.post('/lesson2_vowels/complete', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      accuracy = 0,
      score = 0,
      xpEarned = 0,
      diamondsEarned = 0,
      heartsRemaining = 0,
      timeSpentSec = 0,
      unlockedNext = false,
    } = req.body || {};

    const payload = {
      userId,
      lessonId: 'lesson2_vowels',
      accuracy,
      score,
      xpEarned,
      diamondsEarned,
      heartsRemaining,
      timeSpentSec,
      unlockedNext,
      completedAt: new Date(),
    };

    await UserProgress.create(payload);

    res.json({
      success: true,
      message: 'Lesson 2 vowels progress recorded',
      data: payload,
    });
  } catch (error) {
    console.error('❌ Error recording lesson2 vowels progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record lesson 2 vowels progress',
    });
  }
});

// ดึงความคืบหน้าทั้งหมดของผู้ใช้
router.get("/user", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await Progress.find({ userId }).lean();
    res.json(progress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

// DELETE
router.delete("/session", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.query;
    if (!lessonId) return res.status(400).json({ error: "lessonId required" });
    
    await Progress.deleteOne({ userId, lessonId });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting progress:', error);
    res.status(500).json({ error: 'Failed to delete progress' });
  }
});

module.exports = router;
