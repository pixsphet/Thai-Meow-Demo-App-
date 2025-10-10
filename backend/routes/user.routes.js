const express = require('express');
const router = express.Router();
const { getUserStats, updateUserProfile, getCurrentUserStats, updateCurrentUserStats } = require('../controllers/user.controller');
const auth = require('../middleware/auth');

// /api/user/stats/:userId
router.get('/stats/:userId', getUserStats);

// /api/user/stats - Get current user stats (from JWT)
router.get('/stats', auth, getCurrentUserStats);

// /api/user/stats - Update current user stats (from JWT)
router.post('/stats', auth, updateCurrentUserStats);

// /api/user/profile - Update user profile
router.put('/profile', auth, updateUserProfile);

// /api/user/unlock-level - Unlock a level for user
router.post('/unlock-level', async (req, res) => {
  try {
    const { userId, levelId } = req.body;
    
    if (!userId || !levelId) {
      return res.status(400).json({
        success: false,
        message: 'userId and levelId are required'
      });
    }

    // For now, just return success - in a real app, you'd update the database
    console.log(`🔓 Unlocking level ${levelId} for user ${userId}`);
    
    res.json({
      success: true,
      message: `Level ${levelId} unlocked successfully`,
      data: {
        userId,
        levelId,
        unlockedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error unlocking level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock level',
      error: error.message
    });
  }
});

module.exports = router;
