const express = require('express');
const router = express.Router();
const { getUserStats, updateUserProfile, getCurrentUserStats, updateCurrentUserStats, changePassword } = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const User = require('../models/User');

// /api/user/stats/:userId
router.get('/stats/:userId', getUserStats);

// /api/user/stats - Get current user stats (from JWT)
router.get('/stats', auth, getCurrentUserStats);

// /api/user/stats - Update current user stats (from JWT)
router.post('/stats', auth, updateCurrentUserStats);

// /api/user/profile - Update user profile  
router.put('/profile', auth, updateUserProfile);

// /api/user/change-password - Change password (from JWT)
router.post('/change-password', auth, changePassword);

// /api/user/unlock-level - Unlock a level for authenticated user (userId from JWT)
router.post('/unlock-level', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { levelId } = req.body;
    
    const trimmedLevelId = typeof levelId === 'string' ? levelId.trim() : levelId;
    console.log('🔓 [Unlock Attempt] userId:', userId, 'levelId:', trimmedLevelId);
    if (!trimmedLevelId) {
      return res.status(400).json({
        success: false,
        message: 'levelId is required'
      });
    }

    // Simple validation: accept only known level id patterns to avoid accidental cross-tier additions
    const isBeginner = /^level\d+$/i.test(trimmedLevelId);
    const isIntermediate = /^level_intermediate_\d+$/i.test(trimmedLevelId);
    const isAdvanced = /^level\d+_advanced$/i.test(trimmedLevelId);

    if (!isBeginner && !isIntermediate && !isAdvanced) {
      console.warn(`⚠️ Rejecting unlock for malformed levelId=${trimmedLevelId} (user ${userId})`);
      return res.status(400).json({
        success: false,
        message: 'Invalid levelId format',
        data: { levelId: trimmedLevelId }
      });
    }

    console.log(`🔎 Level tier detected: ${isBeginner ? 'beginner' : isIntermediate ? 'intermediate' : 'advanced'}`);

    // Update user's unlockedLevels if not already unlocked
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { unlockedLevels: levelId }
      },
      { new: true }
    ).select('unlockedLevels');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ [Unlock Success] unlockedLevels:', user.unlockedLevels);
    console.log(`✅ Level ${levelId} unlocked for user ${userId}`);
    
    res.json({
      success: true,
      message: `Level ${levelId} unlocked successfully`,
      data: {
        levelId,
        unlockedLevels: user.unlockedLevels,
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
