const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Add XP and check for level up
router.post('/add', async (req, res) => {
  try {
    const { userId = 'demo', xpGain = 0, diamondsGain = 0, reason = 'lesson_complete' } = req.body;
    
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add XP
    const xpResult = user.addXP(xpGain);
    
    // Add diamonds
    user.diamonds += diamondsGain;

    await user.save();

    console.log(`💎 XP added: +${xpGain} XP, +${diamondsGain} diamonds for user ${userId}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        level: user.level,
        xp: user.xp,
        nextLevelXP: user.nextLevelXP,
        diamonds: user.diamonds,
        streak: user.streak
      },
      xpGain,
      diamondsGain,
      leveledUp: xpResult.leveledUp,
      levelUpReward: xpResult.diamondsEarned,
      xpRemaining: xpResult.xpRemaining,
      message: xpResult.leveledUp 
        ? `🎉 Level Up! You're now level ${xpResult.newLevel}!`
        : `+${xpGain} XP earned!`
    });

  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add XP'
    });
  }
});

// Get user stats - moved to user.routes.js

// Award diamonds for specific achievements
router.post('/diamonds', async (req, res) => {
  try {
    const { userId = 'demo', diamonds = 0, reason = 'achievement' } = req.body;
    
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.diamonds += diamonds;
    await user.save();

    console.log(`💎 Diamonds awarded: +${diamonds} for ${reason} to user ${userId}`);

    res.json({
      success: true,
      diamonds: user.diamonds,
      diamondsGained: diamonds,
      reason,
      message: `+${diamonds} 💎 earned for ${reason}!`
    });

  } catch (error) {
    console.error('Error awarding diamonds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award diamonds'
    });
  }
});

module.exports = router;
