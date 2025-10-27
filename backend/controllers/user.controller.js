const mongoose = require('mongoose');
const User = require('../models/User');
const {
  getUserStatsSnapshot,
  getUserWithMergedData,
} = require('../services/userStats');

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const buildProfileDTO = (user, stats) => ({
  id: user._id?.toString() || 'demo',
  username: user.username,
  email: user.email,
  petName: user.petName,
  avatar: user.avatar,
  level: user.level || 1,
  xp: user.xp || 0,
  streak: user.streak || 0,
  hearts: user.hearts ?? 5,
  diamonds: user.diamonds || 0,
  lessonsCompleted: user.lessonsCompleted || 0,
  lastActiveAt: user.updatedAt,
  badges: user.badges || [],
  stats: stats || null,
});

// ✅ GET /api/user/stats/:userId
exports.getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    let user;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }

    if (!user) {
      user = await User.findOne({ username: userId });
    }

    if (!user && userId === 'demo') {
      user = await User.create({
        username: 'demo',
        email: 'demo@example.com',
        level: 1,
        xp: 0,
        streak: 0,
        hearts: 5,
        diamonds: 0,
        lessonsCompleted: 0,
        badges: ['starter'],
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const stats = await getUserStatsSnapshot(user._id);

    return res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};

// ✅ PUT /api/user/profile - Update user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    // Get userId from auth or from request body/query
    let userId = req.user?.id;
    
    if (!userId && req.body?.userId) {
      userId = req.body.userId;
    }
    
    if (!userId && req.query?.userId) {
      userId = req.query.userId;
    }

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - User ID required' 
      });
    }

    const { username, email, petName, avatar } = req.body;

    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and email are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกอีเมลที่ถูกต้อง' 
      });
    }

    // Check if username already exists (excluding current user)
    const existingUsername = await User.findOne({ 
      username: username.trim(), 
      _id: { $ne: userId } 
    });
    
    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว' 
      });
    }

    // Check if email already exists (excluding current user)
    const existingEmail = await User.findOne({ 
      email: email.trim(), 
      _id: { $ne: userId } 
    });
    
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'อีเมลนี้มีผู้ใช้งานแล้ว' 
      });
    }

    // Check if pet name already exists (excluding current user)
    if (petName) {
      const existingPetName = await User.findOne({ 
        petName: petName.trim(), 
        _id: { $ne: userId } 
      });
      
      if (existingPetName) {
        return res.status(400).json({ 
          success: false, 
          message: 'ชื่อสัตว์เลี้ยงนี้มีผู้ใช้งานแล้ว' 
        });
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username: username.trim(),
        email: email.trim(),
        petName: petName ? petName.trim() : null,
        avatar: avatar || null,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`✅ User profile updated: ${updatedUser.username}`);

    const stats = await getUserStatsSnapshot(updatedUser._id);

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: buildProfileDTO(updatedUser, stats),
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    next(err);
  }
};

// ✅ GET /api/user/stats - Get current user stats (from JWT)
exports.getCurrentUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await getUserStatsSnapshot(userId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Error getting current user stats:', err);
    next(err);
  }
};

// ✅ POST /api/user/stats - Update current user stats (from JWT)
exports.updateCurrentUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const payload =
      (req.body && typeof req.body === 'object' && req.body.stats && typeof req.body.stats === 'object')
        ? req.body.stats
        : req.body || {};

    const user = await getUserWithMergedData(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    if (payload.hearts !== undefined) {
      const oldHearts = safeNumber(user.hearts, 0);
      const nextHearts = safeNumber(payload.hearts, user.hearts || 0);
      user.hearts = Math.max(0, nextHearts);
      const deltaHearts = Math.max(0, safeNumber(user.hearts, 0) - oldHearts);
      if (deltaHearts > 0) {
        user.totalHeartsEarned = safeNumber(user.totalHeartsEarned, 0) + deltaHearts;
        user.lastRewardAt = new Date();
        user.rewardHistory = Array.isArray(user.rewardHistory)
          ? [...user.rewardHistory, { type: 'reward', xp: 0, diamonds: 0, hearts: deltaHearts, reason: 'update', source: 'client', levelBefore: user.level, levelAfter: user.level, createdAt: new Date() }]
          : [{ type: 'reward', xp: 0, diamonds: 0, hearts: deltaHearts, reason: 'update', source: 'client', levelBefore: user.level, levelAfter: user.level, createdAt: new Date() }];
      }
    }

    if (payload.diamonds !== undefined) {
      const newDiamonds = Math.max(0, safeNumber(payload.diamonds, user.diamonds || 0));
      const oldDiamonds = safeNumber(user.diamonds, 0);
      const deltaDiamonds = Math.max(0, newDiamonds - oldDiamonds);
      user.diamonds = newDiamonds;
      if (deltaDiamonds > 0) {
        user.totalDiamondsEarned = safeNumber(user.totalDiamondsEarned, 0) + deltaDiamonds;
        user.lastRewardAt = new Date();
        user.rewardHistory = Array.isArray(user.rewardHistory)
          ? [...user.rewardHistory, { type: 'reward', xp: 0, diamonds: deltaDiamonds, hearts: 0, reason: 'update', source: 'client', levelBefore: user.level, levelAfter: user.level, createdAt: new Date() }]
          : [{ type: 'reward', xp: 0, diamonds: deltaDiamonds, hearts: 0, reason: 'update', source: 'client', levelBefore: user.level, levelAfter: user.level, createdAt: new Date() }];
      }
    }

    // Track leveledUp events
    let previousLevel = user.level || 1;
    if (payload.xp !== undefined) {
      const xpValue = Math.max(0, safeNumber(payload.xp, user.xp || 0));
      user.xp = xpValue;
      if (payload.level === undefined) {
        user.level = Math.max(1, Math.floor(xpValue / 100) + 1);
      }
    }

    if (payload.level !== undefined) {
      user.level = Math.max(1, safeNumber(payload.level, user.level || 1));
    }
    const newLevel = user.level || 1;
    if (newLevel > previousLevel) {
      const now = new Date();
      const diff = newLevel - previousLevel;
      user.levelUps = (user.levelUps || 0) + diff;
      user.lastLevelUpAt = now;
      const rewardLog = {
        type: 'level_up',
        xp: safeNumber(payload.xpEarned || 0, 0),
        diamonds: safeNumber(payload.diamondsEarned || 0, 0),
        hearts: safeNumber(payload.heartsEarned || 0, 0),
        reason: 'Level Up',
        source: 'server:auto',
        levelBefore: previousLevel,
        levelAfter: newLevel,
        createdAt: now,
      };
      user.rewardHistory = Array.isArray(user.rewardHistory) ? [...user.rewardHistory, rewardLog] : [rewardLog];
      user.totalXpEarned = safeNumber(user.totalXpEarned, 0) + safeNumber(rewardLog.xp, 0);
      user.totalDiamondsEarned = safeNumber(user.totalDiamondsEarned, 0) + safeNumber(rewardLog.diamonds, 0);
      user.totalHeartsEarned = safeNumber(user.totalHeartsEarned, 0) + safeNumber(rewardLog.hearts, 0);
      user.lastRewardAt = now;
      if (rewardLog.diamonds) {
        user.diamonds = Math.max(0, safeNumber(user.diamonds, 0) + rewardLog.diamonds);
      }
      if (Number.isFinite(rewardLog.hearts) && rewardLog.hearts > 0) {
        user.hearts = Math.max(0, safeNumber(user.hearts, 0) + rewardLog.hearts);
      }
    }

    if (payload.streak !== undefined) {
      const streakValue = Math.max(0, safeNumber(payload.streak, user.streak || 0));
      user.streak = streakValue;
      user.longestStreak = Math.max(safeNumber(user.longestStreak, 0), streakValue);
      user.maxStreak = Math.max(safeNumber(user.maxStreak, 0), streakValue);
    }

    if (payload.maxStreak !== undefined) {
      const maxStreakValue = Math.max(0, safeNumber(payload.maxStreak, user.maxStreak || 0));
      user.longestStreak = Math.max(safeNumber(user.longestStreak, 0), maxStreakValue);
      user.maxStreak = Math.max(safeNumber(user.maxStreak, 0), maxStreakValue);
    }

    if (payload.lessonsCompleted !== undefined) {
      user.lessonsCompleted = Math.max(
        0,
        safeNumber(payload.lessonsCompleted, user.lessonsCompleted || 0)
      );
    }

    if (payload.leveledUp) {
      const now = new Date();
      user.levelUps = (user.levelUps || 0) + 1;
      user.lastLevelUpAt = now;
      const rewardLog = {
        type: 'level_up',
        xp: safeNumber(payload.xpEarned || payload.xpReward || 0, 0),
        diamonds: safeNumber(payload.diamondsEarned || payload.diamondReward || 0, 0),
        hearts: safeNumber(payload.heartsEarned || payload.heartReward || 0, 0),
        reason: 'Level Up (client)',
        source: 'client',
        levelBefore: previousLevel,
        levelAfter: user.level || previousLevel,
        createdAt: now,
      };
      user.rewardHistory = Array.isArray(user.rewardHistory) ? [...user.rewardHistory, rewardLog] : [rewardLog];
      user.totalXpEarned = safeNumber(user.totalXpEarned, 0) + safeNumber(rewardLog.xp, 0);
      user.totalDiamondsEarned = safeNumber(user.totalDiamondsEarned, 0) + safeNumber(rewardLog.diamonds, 0);
      user.totalHeartsEarned = safeNumber(user.totalHeartsEarned, 0) + safeNumber(rewardLog.hearts, 0);
      user.lastRewardAt = now;
      if (rewardLog.diamonds) {
        user.diamonds = Math.max(0, safeNumber(user.diamonds, 0) + rewardLog.diamonds);
      }
      if (Number.isFinite(rewardLog.hearts) && rewardLog.hearts > 0) {
        user.hearts = Math.max(0, safeNumber(user.hearts, 0) + rewardLog.hearts);
      }
    }

    if (payload.totalSessions !== undefined) {
      user.totalSessions = Math.max(
        0,
        safeNumber(payload.totalSessions, user.totalSessions || 0)
      );
    }

    if (payload.totalCorrectAnswers !== undefined) {
      user.totalCorrectAnswers = Math.max(
        0,
        safeNumber(payload.totalCorrectAnswers, user.totalCorrectAnswers || 0)
      );
    }

    if (payload.totalWrongAnswers !== undefined) {
      user.totalWrongAnswers = Math.max(
        0,
        safeNumber(payload.totalWrongAnswers, user.totalWrongAnswers || 0)
      );
    }

    if (payload.averageAccuracy !== undefined) {
      user.averageAccuracy = Math.max(
        0,
        safeNumber(payload.averageAccuracy, user.averageAccuracy || 0)
      );
    }

    if (payload.totalTimeSpent !== undefined) {
      user.totalTimeSpent = Math.max(
        0,
        safeNumber(payload.totalTimeSpent, user.totalTimeSpent || 0)
      );
    }

    if (payload.badges && Array.isArray(payload.badges)) {
      user.badges = Array.from(new Set(payload.badges));
    }

    if (payload.achievements && Array.isArray(payload.achievements)) {
      const existing = user.achievements || [];
      const existingIds = new Set(existing.map((item) => item?.id));
      payload.achievements.forEach((item) => {
        if (item && item.id && !existingIds.has(item.id)) {
          existing.push(item);
          existingIds.add(item.id);
        }
      });
      user.achievements = existing;
    }

    if (payload.lastGameResults) {
      user.lastGameResults = payload.lastGameResults;
      user.lastPlayed = payload.lastGameResults.completedAt
        ? new Date(payload.lastGameResults.completedAt)
        : new Date();
    }

    if (payload.lastPlayed) {
      user.lastPlayed = new Date(payload.lastPlayed);
    }

    await user.save();

    const stats = await getUserStatsSnapshot(user._id);

    res.json({
      success: true,
      message: 'Stats updated successfully',
      stats,
    });
  } catch (err) {
    console.error('Error updating current user stats:', err);
    next(err);
  }
};

// ✅ POST /api/user/change-password - Change user password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id || req.query.userId;
    const bcrypt = require('bcryptjs');

    // ✅ Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านใหม่ต้องไม่เหมือนเดิม'
      });
    }

    // ✅ Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    // ✅ Verify current password
    const isPasswordCorrect = await user.matchPassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
      });
    }

    // ✅ Update password with bcrypt hash
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    next(err);
  }
};
