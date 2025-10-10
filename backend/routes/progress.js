const express = require('express');
const Progress = require('../models/Progress');
const Player = require('../models/Player');
const auth = require('../middleware/auth');
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

  // award to player
  const player = await Player.findOne({ userId });
  if (!player) await Player.create({ userId });

  // level calc
  function nextLevelXp(level) { return 100 + (level - 1) * 50; }

  const p = await Player.findOne({ userId });
  let { level, xp, nextLevelXp: need } = p.levelInfo;

  xp += xpGain;
  while (xp >= need) {
    xp -= need; level += 1; need = nextLevelXp(level);
  }

  const newDiamonds = (p.wallet.diamonds || 0) + diamonds;

  await Player.updateOne(
    { userId },
    {
      $set: {
        'levelInfo.level': level,
        'levelInfo.xp': xp,
        'levelInfo.nextLevelXp': need,
        'wallet.diamonds': newDiamonds,
        'wallet.hearts': heartsLeft ?? p.wallet.hearts
      },
      $inc: { 'totals.lessonsCompleted': 1 }
    }
  );

  res.json({ ok: true });
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
router.delete("/session", async (req, res) => {
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