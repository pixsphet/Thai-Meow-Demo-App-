const express = require('express');
const router = express.Router();
const GameResult = require('../models/GameResult');

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const resolveLessonKey = (payload) => {
  if (payload.lessonKey) return String(payload.lessonKey);
  if (payload.lessonId) return `lesson_${payload.lessonId}`;
  return 'lesson';
};

const resolveCategory = (payload) => {
  const categories = ['consonants', 'vowels', 'tones', 'words', 'phrases'];
  if (categories.includes(payload.category)) return payload.category;
  if (typeof payload.level === 'string') {
    const lower = payload.level.toLowerCase();
    if (lower.includes('vowel') || lower.includes('สระ')) return 'vowels';
    if (lower.includes('tone') || lower.includes('วรรณยุกต์')) return 'tones';
  }
  return 'consonants';
};

const resolveGameMode = (payload) => {
  const modes = ['matching', 'multiple-choice', 'fill-blank', 'order', 'quiz'];
  if (modes.includes(payload.gameMode)) return payload.gameMode;
  return 'matching';
};

const buildQuestions = (payload) => {
  if (Array.isArray(payload.questions) && payload.questions.length > 0) {
    return payload.questions;
  }
  return [];
};

// POST /api/game-results - Save game result
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const { userId } = payload;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    const totalQuestions = Math.max(1, toNumber(payload.totalQuestions, buildQuestions(payload).length || 1));
    const correctAnswers = toNumber(payload.correctAnswers, 0);
    const wrongAnswers = toNumber(payload.wrongAnswers, 0);
    const score = toNumber(payload.score, correctAnswers * 10);
    const maxScore = toNumber(payload.maxScore, totalQuestions * 10);
    const accuracy =
      toNumber(payload.accuracy, totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0);
    const timeSpent = toNumber(payload.timeSpent, toNumber(payload.totalTimeSpent, 0));
    const startTime =
      payload.sessionData?.startTime ||
      payload.startTime ||
      new Date(Date.now() - Math.max(timeSpent, 0));
    const endTime = payload.sessionData?.endTime || payload.completedAt || new Date();

    const document = {
      userId,
      lessonKey: resolveLessonKey(payload),
      category: resolveCategory(payload),
      gameMode: resolveGameMode(payload),
      score,
      maxScore,
      accuracy: Math.min(Math.max(accuracy, 0), 100),
      timeSpent: Math.max(timeSpent, 0),
      questions: buildQuestions(payload),
      difficulty: payload.difficulty || 'medium',
      xpGained: toNumber(payload.xpEarned || payload.xpGained, 0),
      achievements: Array.isArray(payload.achievements) ? payload.achievements : [],
      sessionData: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        deviceInfo: payload.sessionData?.deviceInfo || {},
        location: payload.sessionData?.location || {},
      },
      isCompleted: payload.isCompleted !== undefined ? !!payload.isCompleted : true,
      isPerfect: accuracy >= 100,
      streak: toNumber(payload.streak, 0),
      percentile: payload.percentile,
      rank: payload.rank,
      feedback: payload.feedback,
    };

    const gameResult = new GameResult(document);
    
    // Calculate rank and percentile
    await gameResult.calculateRank();
    
    // Check for achievements
    const newAchievements = gameResult.checkAchievements();
    
    await gameResult.save();
    
    res.json({
      success: true,
      data: gameResult,
      newAchievements,
    });
  } catch (error) {
    console.error('Error saving game result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save game result',
      error: error.message,
    });
  }
});

// GET /api/game-results/:userId - Get game results by user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, gameMode, limit = 10 } = req.query;
    
    const options = { limit: parseInt(limit) };
    if (category) options.category = category;
    if (gameMode) options.gameMode = gameMode;
    
    const results = await GameResult.getByUser(userId, options);
    
    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching game results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game results',
      error: error.message,
    });
  }
});

// GET /api/game-results/stats/:userId - Get user statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, gameMode, dateFrom, dateTo } = req.query;
    
    const options = { category, gameMode, dateFrom, dateTo };
    const stats = await GameResult.getUserStats(userId, options);
    
    res.json({
      success: true,
      data: stats[0] || {},
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

// GET /api/game-results/leaderboard - Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { category, gameMode, limit = 10, dateFrom, dateTo } = req.query;
    
    const options = { category, gameMode, limit: parseInt(limit), dateFrom, dateTo };
    const leaderboard = await GameResult.getLeaderboard(options);
    
    res.json({
      success: true,
      data: leaderboard,
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

// GET /api/game-results/recent - Get recent game results
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20, category, gameMode } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (gameMode) query.gameMode = gameMode;
    
    const results = await GameResult.find(query)
      .populate('userId', 'username stats.level')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching recent results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent results',
      error: error.message,
    });
  }
});

// GET /api/game-results/achievements/:userId - Get user achievements from game results
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const results = await GameResult.find({ userId })
      .select('achievements')
      .sort({ createdAt: -1 });
    
    const allAchievements = results.flatMap(result => result.achievements);
    const uniqueAchievements = allAchievements.filter((achievement, index, self) =>
      index === self.findIndex(a => a.id === achievement.id)
    );
    
    res.json({
      success: true,
      data: uniqueAchievements,
      count: uniqueAchievements.length,
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

// PUT /api/game-results/:id/feedback - Add feedback to game result
router.put('/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const gameResult = await GameResult.findByIdAndUpdate(
      id,
      { 'feedback.rating': rating, 'feedback.comment': comment },
      { new: true }
    );
    
    if (!gameResult) {
      return res.status(404).json({
        success: false,
        message: 'Game result not found',
      });
    }
    
    res.json({
      success: true,
      data: gameResult,
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message,
    });
  }
});

// GET /api/game-results/analytics - Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const { category, gameMode, dateFrom, dateTo } = req.query;
    
    const matchStage = {};
    if (category) matchStage.category = category;
    if (gameMode) matchStage.gameMode = gameMode;
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }
    
    const analytics = await GameResult.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          averageScore: { $avg: '$score' },
          averageAccuracy: { $avg: '$accuracy' },
          averageTimeSpent: { $avg: '$timeSpent' },
          totalXP: { $sum: '$xpGained' },
          completedGames: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          perfectGames: { $sum: { $cond: ['$isPerfect', 1, 0] } },
          scoreDistribution: {
            $push: {
              $cond: [
                { $gte: ['$score', 80] },
                'high',
                { $cond: [{ $gte: ['$score', 60] }, 'medium', 'low'] }
              ]
            }
          }
        }
      },
      {
        $project: {
          totalGames: 1,
          averageScore: { $round: ['$averageScore', 2] },
          averageAccuracy: { $round: ['$averageAccuracy', 2] },
          averageTimeSpent: { $round: ['$averageTimeSpent', 2] },
          totalXP: 1,
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$completedGames', '$totalGames'] }, 100] },
              2
            ]
          },
          perfectRate: {
            $round: [
              { $multiply: [{ $divide: ['$perfectGames', '$totalGames'] }, 100] },
              2
            ]
          },
          scoreDistribution: {
            high: { $size: { $filter: { input: '$scoreDistribution', cond: { $eq: ['$$this', 'high'] } } } },
            medium: { $size: { $filter: { input: '$scoreDistribution', cond: { $eq: ['$$this', 'medium'] } } } },
            low: { $size: { $filter: { input: '$scoreDistribution', cond: { $eq: ['$$this', 'low'] } } } },
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: analytics[0] || {},
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message,
    });
  }
});

module.exports = router;
