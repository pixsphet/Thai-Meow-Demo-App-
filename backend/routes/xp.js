const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUserWithMergedData, getUserStatsSnapshot } = require('../services/userStats');

// Add XP and check for level up
router.post('/add', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { xpGain = 0, diamondsGain = 0, reason = 'lesson_complete' } = req.body || {};

    const user = await getUserWithMergedData(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const xpResult = user.addXP(xpGain);
    user.diamonds = Math.max(0, Number(user.diamonds || 0) + Number(diamondsGain || 0));

    await user.save();

    const stats = await getUserStatsSnapshot(userId);

    res.json({
      success: true,
      stats,
      xpGain,
      diamondsGain,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
      reason,
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add XP',
    });
  }
});

// Get user stats - moved to user.routes.js

// Award diamonds for specific achievements
router.post('/diamonds', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { diamonds = 0, reason = 'achievement' } = req.body || {};

    const user = await getUserWithMergedData(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.diamonds = Math.max(0, Number(user.diamonds || 0) + Number(diamonds || 0));
    await user.save();

    const stats = await getUserStatsSnapshot(userId);

    res.json({
      success: true,
      stats,
      diamondsGained: Number(diamonds || 0),
      reason,
    });
  } catch (error) {
    console.error('Error awarding diamonds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award diamonds',
    });
  }
});

module.exports = router;
