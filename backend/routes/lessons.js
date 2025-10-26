const express = require('express');
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Normalize lesson document to legacy response shape expected by mobile app.
 */
const normalizeLesson = (lesson, index = 0) => {
  if (!lesson) return null;

  const order = Number.isFinite(lesson.order)
    ? lesson.order
    : Number.isFinite(lesson.lessonNumber)
    ? lesson.lessonNumber
    : index + 1;

  const rewards = lesson.rewards || {};

  return {
    _id: lesson._id,
    lesson_id: order,
    title: lesson.title,
    titleTH: lesson.titleTH || lesson.title,
    level: lesson.level,
    key: lesson.key || `${lesson.category || 'lesson'}-${order}`,
    description: lesson.description,
    order,
    difficulty: lesson.difficulty,
    estimatedTime: lesson.estimatedTime,
    xpReward: Number.isFinite(lesson.xpReward) ? lesson.xpReward : rewards.xp || 0,
    diamondsReward: Number.isFinite(lesson.diamondsReward)
      ? lesson.diamondsReward
      : rewards.diamonds || 0,
    category: lesson.category,
    isActive: lesson.isActive,
    isUnlocked: Boolean(lesson.defaultUnlocked ?? order === 1),
    isCompleted: false,
    progress: 0,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
};

const findLessonDocument = async (lessonId) => {
  if (!lessonId) return null;

  // Try ObjectId lookup first
  if (mongoose.Types.ObjectId.isValid(lessonId)) {
    const byId = await Lesson.findById(lessonId);
    if (byId) return byId;
  }

  // Fallback lookups (order, key)
  const numericId = Number(lessonId);
  const query = [
    { key: lessonId },
    { slug: lessonId },
    { lessonNumber: numericId },
    { order: numericId },
  ];

  return Lesson.findOne({ $or: query }).sort({ createdAt: 1 });
};

// ⭐ UNLOCK SYSTEM ROUTES (MUST BE BEFORE /level/:level)

// GET /api/lessons/unlocked - Get unlocked levels for authenticated user
router.get('/unlocked', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    
    const user = await User.findById(userId).select('unlockedLevels');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        unlockedLevels: user.unlockedLevels || ['level1'],
      },
    });
  } catch (error) {
    console.error('Error fetching unlocked levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unlocked levels',
      error: error.message,
    });
  }
});

// POST /api/lessons/check-unlock/:levelId - Check if next level should unlock for authenticated user
router.post('/check-unlock/:levelId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { levelId } = req.params;
    const { accuracy, score } = req.body;
    const User = require('../models/User');
    
    // Parse level number from levelId (e.g., 'level2' => 2)
    const currentLevelNum = parseInt(levelId.replace('level', ''));
    const nextLevelId = `level${currentLevelNum + 1}`;
    
    // Check if accuracy >= 70%
    const shouldUnlock = accuracy >= 70;
    
    if (shouldUnlock) {
      // Update user's unlockedLevels in DB
      await User.findByIdAndUpdate(
        userId,
        {
          $addToSet: { unlockedLevels: nextLevelId }
        },
        { new: true }
      );
      
      console.log(`✅ Level ${nextLevelId} unlocked for user ${userId} (accuracy: ${accuracy}%)`);
    }
    
    res.json({
      success: true,
      data: {
        currentLevel: levelId,
        nextLevel: nextLevelId,
        accuracy: accuracy,
        shouldUnlock: shouldUnlock,
        message: shouldUnlock ? `Congrats! Level ${nextLevelId} unlocked!` : `Need ≥70% to unlock (got ${accuracy}%)`,
      },
    });
  } catch (error) {
    console.error('Error checking unlock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check unlock',
      error: error.message,
    });
  }
});

// GET /api/lessons/level/:level - fetch lessons by level
router.get('/level/:level', async (req, res) => {
  try {
    const { level } = req.params;

    const lessons = await Lesson.find({
      level,
      isActive: { $ne: false },
    }).sort({ order: 1, createdAt: 1 });

    const normalized = lessons.map((lesson, index) =>
      normalizeLesson(lesson, index)
    );

    res.json({
      success: true,
      data: normalized,
      lessons: normalized,
      count: normalized.length,
      level,
    });
  } catch (error) {
    console.error('Error fetching lessons by level:', error);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลบทเรียนได้',
      data: [],
      lessons: [],
    });
  }
});

// GET /api/lessons - fetch all active lessons
router.get('/', async (_req, res) => {
  try {
    const lessons = await Lesson.find({
      isActive: { $ne: false },
    }).sort({ level: 1, order: 1, createdAt: 1 });

    const normalized = lessons.map((lesson, index) =>
      normalizeLesson(lesson, index)
    );

    res.json({
      success: true,
      data: normalized,
      lessons: normalized,
      count: normalized.length,
    });
  } catch (error) {
    console.error('Error fetching all lessons:', error);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลบทเรียนได้',
      data: [],
      lessons: [],
    });
  }
});

// GET /api/lessons/:id - fetch single lesson
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await findLessonDocument(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบบทเรียนที่ต้องการ',
        data: null,
      });
    }

    res.json({
      success: true,
      data: normalizeLesson(lesson),
    });
  } catch (error) {
    console.error('Error fetching lesson by ID:', error);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลบทเรียนได้',
      data: null,
    });
  }
});

// PUT /api/lessons/:id/progress - update per-user lesson progress
router.put('/:id/progress', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const {
      progress = 0,
      accuracy,
      completed,
      score,
      xp,
      lessonId: lessonIdOverride,
    } = req.body || {};

    const lessonKey = String(lessonIdOverride || id);

    const normalizedProgress = Math.max(
      0,
      Math.min(100, Number(progress) || 0)
    );

    const update = {
      progress: normalizedProgress,
      updatedAt: new Date(),
    };

    if (accuracy !== undefined) {
      const normalizedAccuracy = Math.max(
        0,
        Math.min(100, Number(accuracy) || 0)
      );
      update.accuracy = normalizedAccuracy;
    }

    if (typeof completed === 'boolean') {
      update.completed = completed;
      update.completedAt = completed ? new Date() : null;
    }

    if (score !== undefined && Number.isFinite(Number(score))) {
      update.score = Number(score);
    }

    if (xp !== undefined && Number.isFinite(Number(xp))) {
      update.xp = Number(xp);
    }

    const progressDoc = await Progress.findOneAndUpdate(
      { userId, lessonId: lessonKey },
      { $set: update },
      { new: true, upsert: true }
    ).lean();

    res.json({
      success: true,
      data: progressDoc,
      message: 'อัปเดตความคืบหน้าสำเร็จ',
    });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({
      success: false,
      error: 'ไม่สามารถอัปเดตความคืบหน้าได้',
    });
  }
});

module.exports = router;
