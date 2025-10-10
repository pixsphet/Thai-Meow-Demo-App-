const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Update streak when user plays
router.post('/streak/update', async (req, res) => {
  try {
    const { userId = 'demo' } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const streakResult = user.updateStreak();
    await user.save();

    console.log(`🔥 Streak updated for user ${userId}: ${streakResult.streak} days`);

    res.json({
      success: true,
      streak: streakResult.streak,
      longestStreak: streakResult.longestStreak,
      isNewStreak: streakResult.isNewStreak,
      message: streakResult.isNewStreak 
        ? `🔥 New streak started! Day ${streakResult.streak}`
        : `🔥 ${streakResult.streak}-day streak! Keep it up!`
    });

  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update streak'
    });
  }
});

// Get user streak info
router.get('/streak/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('streak longestStreak lastActive level xp diamonds');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      streak: user.streak,
      longestStreak: user.longestStreak,
      lastActive: user.lastActive,
      level: user.level,
      xp: user.xp,
      diamonds: user.diamonds
    });

  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streak info'
    });
  }
});

// Reset streak (for testing)
router.post('/streak/reset', async (req, res) => {
  try {
    const { userId = 'demo' } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.streak = 0;
    user.lastActive = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    await user.save();

    res.json({
      success: true,
      message: 'Streak reset successfully'
    });

  } catch (error) {
    console.error('Error resetting streak:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset streak'
    });
  }
});

module.exports = router;
