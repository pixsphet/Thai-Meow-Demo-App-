const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const UserStats = require('../models/UserStats');

// POST upsert progress session
router.post('/session', async (req, res) => {
  try {
    const userId = req.user.id;
    const payload = req.body || {};
    
    if (!payload.lessonId) {
      return res.status(400).json({ error: 'lessonId required' });
    }

    const doc = await Progress.findOneAndUpdate(
      { userId, lessonId: payload.lessonId },
      { $set: { ...payload, userId, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();

    res.json({ ok: true, id: doc._id, progress: doc });
  } catch (error) {
    console.error('Error saving progress session:', error);
    res.status(500).json({ error: 'Failed to save progress session' });
  }
});

// GET one lesson progress
router.get('/session', async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.query;
    
    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId required' });
    }

    const doc = await Progress.findOne({ userId, lessonId }).lean();
    res.json({ ok: true, progress: doc });
  } catch (error) {
    console.error('Error fetching progress session:', error);
    res.status(500).json({ error: 'Failed to fetch progress session' });
  }
});

// GET all user progress
router.get('/all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const progressDocs = await Progress.find({ userId }).lean();
    
    // Convert array to object keyed by lessonId
    const progressMap = {};
    progressDocs.forEach(doc => {
      progressMap[doc.lessonId] = doc;
    });
    
    res.json({ 
      success: true, 
      progress: progressMap 
    });
  } catch (error) {
    console.error('Error fetching all progress:', error);
    res.status(500).json({ error: 'Failed to fetch all progress' });
  }
});

// DELETE progress session
router.delete('/session', async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.query;
    
    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId required' });
    }

    await Progress.deleteOne({ userId, lessonId });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting progress session:', error);
    res.status(500).json({ error: 'Failed to delete progress session' });
  }
});

// Finish lesson and update user stats
router.post('/finish', async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId, score = 0, xpGain = 0, diamonds = 0, heartsLeft } = req.body;
    
    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId required' });
    }

    // Update progress
    await Progress.updateOne(
      { userId, lessonId },
      { 
        $set: { 
          score, 
          xp: xpGain, 
          diamondsEarned: diamonds, 
          hearts: heartsLeft ?? 0, 
          updatedAt: new Date() 
        } 
      }
    );

    // Update or create user stats
    const userStats = await UserStats.findOne({ userId });
    if (!userStats) {
      await UserStats.create({ userId });
    }

    // Calculate level up
    function nextLevelXp(level) { 
      return 100 + (level - 1) * 50; 
    }

    const stats = await UserStats.findOne({ userId });
    let { level, xp, nextLevelXp: need } = stats;

    xp += xpGain;
    while (xp >= need) {
      xp -= need; 
      level += 1; 
      need = nextLevelXp(level);
    }

    const newDiamonds = (stats.diamonds || 0) + diamonds;

    await UserStats.updateOne(
      { userId },
      {
        $set: {
          level,
          xp,
          nextLevelXp: need,
          diamonds: newDiamonds,
          hearts: heartsLeft ?? stats.hearts
        },
        $inc: { lessonsCompleted: 1 }
      }
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Error finishing lesson:', error);
    res.status(500).json({ error: 'Failed to finish lesson' });
  }
});

// Get all user progress
router.get('/user', async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await Progress.find({ userId }).lean();
    res.json(progress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

module.exports = router;

