const express = require('express');
const jwt = require('jsonwebtoken');
const { findUserById, findProgressByUserId, findLessonById, mockProgress } = require('../mockData');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'ไม่พบ token' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findUserById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Token ไม่ถูกต้อง' 
    });
  }
};

// Get user progress
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get all progress records for the user
    const progressRecords = findProgressByUserId(user.id);

    res.json({
      success: true,
      progress: progressRecords.map(record => {
        const lesson = findLessonById(record.lessonId);
        return {
          lessonId: record.lessonId,
          lessonTitle: lesson ? lesson.title : 'Unknown Lesson',
          category: lesson ? lesson.category : 'unknown',
          difficulty: lesson ? lesson.difficulty : 'unknown',
          level: lesson ? lesson.level : 1,
          status: record.status,
          completed: record.completed,
          score: record.score,
          bestScore: record.bestScore,
          attempts: record.attempts,
          timeSpent: record.timeSpent,
          lastAttempt: record.lastAttempt,
          xpEarned: record.xpEarned
        };
      })
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลความคืบหน้า' 
    });
  }
});

// Update lesson progress
router.post('/lesson/:lessonId', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { score, timeSpent, gameMode, vocabularyProgress } = req.body;
    const user = req.user;

    // Find or create progress record
    let progress = mockProgress.find(p => p.userId === user.id && p.lessonId === lessonId);

    if (!progress) {
      progress = {
        id: (mockProgress.length + 1).toString(),
        userId: user.id,
        lessonId: lessonId,
        status: 'not-started',
        completed: false,
        score: 0,
        bestScore: 0,
        attempts: 0,
        timeSpent: 0,
        lastAttempt: new Date(),
        xpEarned: 0
      };
      mockProgress.push(progress);
    }

    // Update progress
    progress.attempts += 1;
    progress.score = Math.max(progress.score, score);
    progress.bestScore = Math.max(progress.bestScore, score);
    progress.timeSpent += timeSpent;
    progress.lastAttempt = new Date();

    // Check if lesson is completed
    if (score >= 70 && !progress.completed) {
      progress.completed = true;
      progress.status = 'completed';
      progress.xpEarned = Math.floor(score / 10) + 10;
    }

    // Update user stats
    if (progress.completed) {
      user.xp += progress.xpEarned;
      const newLevel = Math.floor(user.xp / 100) + 1;
      if (newLevel > user.level) {
        user.level = newLevel;
        user.diamonds += 5;
      }
    }

    res.json({
      success: true,
      message: 'บันทึกความคืบหน้าเรียบร้อย',
      progress: {
        status: progress.status,
        completed: progress.completed,
        score: progress.score,
        bestScore: progress.bestScore,
        attempts: progress.attempts,
        timeSpent: progress.timeSpent,
        xpEarned: progress.xpEarned
      },
      user: {
        xp: user.xp,
        level: user.level,
        diamonds: user.diamonds,
        leveledUp: user.level > 1,
        newLevel: user.level,
        diamondsEarned: 5
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการบันทึกความคืบหน้า' 
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get progress statistics
    const progressRecords = findProgressByUserId(user.id);
    const totalLessons = progressRecords.length;
    const completedLessons = progressRecords.filter(p => p.completed).length;
    
    const totalXP = user.xp;
    const currentLevel = user.level;
    const currentStreak = user.streak;
    const hearts = user.hearts;
    const diamonds = user.diamonds;

    // Calculate accuracy
    const totalAttempts = progressRecords.reduce((sum, record) => sum + record.attempts, 0);
    const totalScore = progressRecords.reduce((sum, record) => sum + record.score, 0);
    const accuracy = totalAttempts > 0 ? (totalScore / totalAttempts) : 0;

    // Calculate total time spent
    const totalTimeSpent = progressRecords.reduce((sum, record) => sum + record.timeSpent, 0);

    res.json({
      success: true,
      stats: {
        totalLessons,
        completedLessons,
        totalXP,
        currentLevel,
        currentStreak,
        hearts,
        diamonds,
        accuracy: Math.round(accuracy),
        totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
        completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ' 
    });
  }
});

// Get recent games
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const progressRecords = findProgressByUserId(user.id)
      .sort((a, b) => new Date(b.lastAttempt) - new Date(a.lastAttempt))
      .slice(0, 10);

    res.json({
      success: true,
      recentGames: progressRecords.map(record => {
        const lesson = findLessonById(record.lessonId);
        return {
          id: record.id,
          title: lesson ? lesson.title : 'Unknown Lesson',
          category: lesson ? lesson.category : 'unknown',
          difficulty: lesson ? lesson.difficulty : 'unknown',
          score: record.score,
          completed: record.completed,
          lastAttempt: record.lastAttempt,
          gameMode: 'matching' // Default for mock
        };
      })
    });

  } catch (error) {
    console.error('Get recent games error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเกมล่าสุด' 
    });
  }
});

// Update hearts
router.post('/hearts', authenticateToken, async (req, res) => {
  try {
    const { action, amount = 1 } = req.body;
    const user = req.user;

    if (action === 'add') {
      user.hearts = Math.min(5, user.hearts + amount);
    } else if (action === 'subtract') {
      user.hearts = Math.max(0, user.hearts - amount);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Action ไม่ถูกต้อง' 
      });
    }

    res.json({
      success: true,
      message: 'อัปเดต hearts เรียบร้อย',
      hearts: user.hearts
    });

  } catch (error) {
    console.error('Update hearts error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการอัปเดต hearts' 
    });
  }
});

// Update diamonds
router.post('/diamonds', authenticateToken, async (req, res) => {
  try {
    const { action, amount = 1 } = req.body;
    const user = req.user;

    if (action === 'add') {
      user.diamonds += amount;
    } else if (action === 'subtract') {
      user.diamonds = Math.max(0, user.diamonds - amount);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Action ไม่ถูกต้อง' 
      });
    }

    res.json({
      success: true,
      message: 'อัปเดต diamonds เรียบร้อย',
      diamonds: user.diamonds
    });

  } catch (error) {
    console.error('Update diamonds error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการอัปเดต diamonds' 
    });
  }
});

// Session progress endpoints (for NewLessonGame compatibility)
router.post('/session', async (req, res) => {
  try {
    const { userId = "demo", lessonId, ...payload } = req.body;
    if (!lessonId) return res.status(400).json({ error: "lessonId required" });
    
    // Mock save progress
    console.log('💾 Mock saving progress:', { userId, lessonId, ...payload });
    
    res.json({ ok: true, id: `mock_${Date.now()}` });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

router.get('/session', async (req, res) => {
  try {
    const { userId = "demo", lessonId } = req.query;
    if (!lessonId) return res.status(400).json({ error: "lessonId required" });
    
    // Mock get progress - return null for now
    console.log('📖 Mock getting progress:', { userId, lessonId });
    
    res.json(null);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

router.delete('/session', async (req, res) => {
  try {
    const { userId = "demo", lessonId } = req.query;
    if (!lessonId) return res.status(400).json({ error: "lessonId required" });
    
    // Mock delete progress
    console.log('🗑️ Mock deleting progress:', { userId, lessonId });
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting progress:', error);
    res.status(500).json({ error: 'Failed to delete progress' });
  }
});

module.exports = router;
