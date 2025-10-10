const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');

// GET /api/lessons/:category - Get lessons by category
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { difficulty, tags } = req.query;
    
    const options = { difficulty };
    if (tags) {
      options.tags = tags.split(',');
    }
    
    const lessons = await Lesson.getByCategory(category, options);
    
    res.json({
      success: true,
      data: lessons,
      count: lessons.length,
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons',
      error: error.message,
    });
  }
});

// GET /api/lessons/item/:id - Get specific lesson
router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.getWithVocabulary(id);
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }
    
    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson',
      error: error.message,
    });
  }
});

// GET /api/lessons/random/:category - Get random lesson
router.get('/random/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { difficulty, exclude } = req.query;
    
    const excludeIds = exclude ? exclude.split(',') : [];
    const lesson = await Lesson.getRandom(category, difficulty, excludeIds);
    
    if (!lesson || lesson.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No lessons found',
      });
    }
    
    res.json({
      success: true,
      data: lesson[0],
    });
  } catch (error) {
    console.error('Error fetching random lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch random lesson',
      error: error.message,
    });
  }
});

// GET /api/lessons/search/:term - Search lessons
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    const { category, difficulty } = req.query;
    
    const lessons = await Lesson.search(term, { category, difficulty });
    
    res.json({
      success: true,
      data: lessons,
      count: lessons.length,
    });
  } catch (error) {
    console.error('Error searching lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search lessons',
      error: error.message,
    });
  }
});

// GET /api/lessons/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Lesson.distinct('category');
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
});

// GET /api/lessons/stats - Get lesson statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Lesson.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          difficulties: { $addToSet: '$difficulty' },
          totalAttempts: { $sum: '$stats.totalAttempts' },
          totalCompletions: { $sum: '$stats.totalCompletions' },
          averageScore: { $avg: '$stats.averageScore' },
        }
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          difficulties: 1,
          totalAttempts: 1,
          totalCompletions: 1,
          averageScore: { $round: ['$averageScore', 2] },
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$totalCompletions', '$totalAttempts'] }, 100] },
              2
            ]
          },
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching lesson stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson stats',
      error: error.message,
    });
  }
});

// POST /api/lessons/:id/play - Record lesson play
router.post('/:id/play', async (req, res) => {
  try {
    const { id } = req.params;
    const { score, timeSpent, completed } = req.body;
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }
    
    lesson.updateStats(score, timeSpent, completed);
    await lesson.save();
    
    res.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error('Error recording lesson play:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record lesson play',
      error: error.message,
    });
  }
});

// GET /api/lessons/:id/access/:userId - Check if user can access lesson
router.get('/:id/access/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }
    
    // Get user progress (this would need to be implemented based on your progress system)
    const userProgress = []; // Placeholder - implement based on your progress system
    
    const canAccess = lesson.canAccess(userProgress);
    
    res.json({
      success: true,
      data: {
        canAccess,
        lesson: canAccess ? lesson : null,
      },
    });
  } catch (error) {
    console.error('Error checking lesson access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check lesson access',
      error: error.message,
    });
  }
});

module.exports = router;

