const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates._id;
    
    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, lastLogin: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
});

// GET /api/users/:id/stats - Get user statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('stats achievements');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        stats: user.stats,
        achievements: user.achievements,
        levelProgress: user.levelProgress,
        nextLevelXP: user.nextLevelXP,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats',
      error: error.message,
    });
  }
});

// POST /api/users/:id/add-xp - Add XP to user
router.post('/:id/add-xp', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const result = user.addXP(amount);
    await user.save();
    
    // Check for new achievements
    const newAchievements = user.checkAchievements();
    if (newAchievements.length > 0) {
      await user.save();
    }
    
    res.json({
      success: true,
      data: {
        xp: user.stats.xp,
        level: user.stats.level,
        diamonds: user.stats.diamonds,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
        diamondsAwarded: result.diamondsAwarded,
        newAchievements,
      },
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add XP',
      error: error.message,
    });
  }
});

// POST /api/users/:id/update-streak - Update user streak
router.post('/:id/update-streak', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const newStreak = user.updateStreak();
    await user.save();
    
    res.json({
      success: true,
      data: {
        streak: newStreak,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update streak',
      error: error.message,
    });
  }
});

// POST /api/users/:id/spend-diamonds - Spend diamonds
router.post('/:id/spend-diamonds', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, item } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.stats.diamonds < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient diamonds',
      });
    }
    
    user.stats.diamonds -= amount;
    await user.save();
    
    res.json({
      success: true,
      data: {
        diamonds: user.stats.diamonds,
        item,
      },
    });
  } catch (error) {
    console.error('Error spending diamonds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to spend diamonds',
      error: error.message,
    });
  }
});

// GET /api/users/:id/achievements - Get user achievements
router.get('/:id/achievements', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('achievements');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: user.achievements,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements',
      error: error.message,
    });
  }
});

// POST /api/users/:id/achievements - Check and unlock achievements
router.post('/:id/achievements', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const newAchievements = user.checkAchievements();
    if (newAchievements.length > 0) {
      await user.save();
    }
    
    res.json({
      success: true,
      data: {
        newAchievements,
        totalAchievements: user.achievements.length,
      },
    });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check achievements',
      error: error.message,
    });
  }
});

// GET /api/users/leaderboard - Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10, sortBy = 'xp' } = req.query;
    
    const sortField = `stats.${sortBy}`;
    const users = await User.find({ isActive: true })
      .select('username stats achievements')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
});

// DELETE /api/users/:id - Delete user (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
});

module.exports = router;

