const express = require('express');
const router = express.Router();
const UserStats = require('../models/UserStats');

// GET user stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    let stats = await UserStats.findOne({ userId }).lean();
    if (!stats) {
      // Create default stats for new user
      stats = await UserStats.create({ userId });
    }

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// POST update user stats
router.post('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const stats = await UserStats.findOneAndUpdate(
      { userId },
      { $set: { ...updates, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();

    res.json({ stats });
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ error: 'Failed to update user stats' });
  }
});

// POST tick daily streak
router.post('/streak/tick', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = await UserStats.create({ userId });
    }

    const lastLogin = stats.lastLoginDate ? new Date(stats.lastLoginDate) : null;
    const isNewDay = !lastLogin || lastLogin < today;

    if (isNewDay) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isConsecutive = lastLogin && 
        lastLogin.getTime() === yesterday.getTime();

      const newStreak = isConsecutive ? stats.currentStreak + 1 : 1;
      const newBestStreak = Math.max(stats.bestStreak, newStreak);

      await UserStats.updateOne(
        { userId },
        {
          $set: {
            currentStreak: newStreak,
            bestStreak: newBestStreak,
            lastLoginDate: today
          }
        }
      );

      res.json({ 
        ok: true, 
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        isNewDay: true
      });
    } else {
      res.json({ 
        ok: true, 
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        isNewDay: false
      });
    }
  } catch (error) {
    console.error('Error ticking daily streak:', error);
    res.status(500).json({ error: 'Failed to tick daily streak' });
  }
});

module.exports = router;

