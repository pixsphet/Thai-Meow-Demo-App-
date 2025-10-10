const express = require('express');
const Vocabulary = require('../models/Vocabulary');
const router = express.Router();

// Get all vocabulary
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get vocabulary with pagination
    const vocabulary = await Vocabulary.find(query)
      .sort({ frequency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Vocabulary.countDocuments(query);

    res.json({
      success: true,
      vocabulary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get vocabulary error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำศัพท์' 
    });
  }
});

// Get vocabulary by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const vocabulary = await Vocabulary.findById(id);
    
    if (!vocabulary) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคำศัพท์' 
      });
    }

    res.json({
      success: true,
      vocabulary
    });

  } catch (error) {
    console.error('Get vocabulary by ID error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำศัพท์' 
    });
  }
});

// Get vocabulary by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { difficulty, limit = 50 } = req.query;
    
    const query = { category };
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const vocabulary = await Vocabulary.find(query)
      .sort({ frequency: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      vocabulary
    });

  } catch (error) {
    console.error('Get vocabulary by category error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำศัพท์ตามหมวดหมู่' 
    });
  }
});

// Get Thai consonants
router.get('/consonants/all', async (req, res) => {
  try {
    const consonants = await Vocabulary.find({ category: 'consonant' })
      .sort({ thai: 1 });

    res.json({
      success: true,
      consonants
    });

  } catch (error) {
    console.error('Get consonants error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลพยัญชนะ' 
    });
  }
});

// Get Thai vowels
router.get('/vowels/all', async (req, res) => {
  try {
    const vowels = await Vocabulary.find({ category: 'vowel' })
      .sort({ thai: 1 });

    res.json({
      success: true,
      vowels
    });

  } catch (error) {
    console.error('Get vowels error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสระ' 
    });
  }
});

// Get Thai tones
router.get('/tones/all', async (req, res) => {
  try {
    const tones = await Vocabulary.find({ category: 'tone' })
      .sort({ thai: 1 });

    res.json({
      success: true,
      tones
    });

  } catch (error) {
    console.error('Get tones error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลวรรณยุกต์' 
    });
  }
});

// Update vocabulary stats (for learning analytics)
router.post('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { correct, score } = req.body;

    const vocabulary = await Vocabulary.findById(id);
    
    if (!vocabulary) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคำศัพท์' 
      });
    }

    vocabulary.updateStats(correct, score);
    await vocabulary.save();

    res.json({
      success: true,
      message: 'อัปเดตสถิติคำศัพท์เรียบร้อย',
      stats: {
        totalAttempts: vocabulary.stats.totalAttempts,
        correctAttempts: vocabulary.stats.correctAttempts,
        averageScore: vocabulary.stats.averageScore,
        accuracy: vocabulary.calculateAccuracy()
      }
    });

  } catch (error) {
    console.error('Update vocabulary stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการอัปเดตสถิติคำศัพท์' 
    });
  }
});

// Search vocabulary
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    const vocabulary = await Vocabulary.find({
      $text: { $search: query }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(parseInt(limit));

    res.json({
      success: true,
      vocabulary,
      query
    });

  } catch (error) {
    console.error('Search vocabulary error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการค้นหาคำศัพท์' 
    });
  }
});

module.exports = router;
