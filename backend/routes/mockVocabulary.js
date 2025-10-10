const express = require('express');
const { mockVocabularies, findVocabularyByCategory } = require('../mockData');
const router = express.Router();

// Get all vocabulary
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, search, limit = 50, page = 1 } = req.query;
    
    // Filter vocabulary
    let filteredVocab = [...mockVocabularies];
    
    if (category) {
      filteredVocab = filteredVocab.filter(vocab => vocab.category === category);
    }
    
    if (difficulty) {
      filteredVocab = filteredVocab.filter(vocab => vocab.difficulty === difficulty);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredVocab = filteredVocab.filter(vocab => 
        vocab.thai.toLowerCase().includes(searchLower) ||
        vocab.roman.toLowerCase().includes(searchLower) ||
        vocab.meaning.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVocab = filteredVocab.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      vocabulary: paginatedVocab,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredVocab.length,
        pages: Math.ceil(filteredVocab.length / parseInt(limit))
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
    
    const vocabulary = mockVocabularies.find(v => v.id === id);
    
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
    
    let vocabularies = findVocabularyByCategory(category);
    
    if (difficulty) {
      vocabularies = vocabularies.filter(vocab => vocab.difficulty === difficulty);
    }

    vocabularies = vocabularies.slice(0, parseInt(limit));

    res.json({
      success: true,
      vocabulary: vocabularies
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
    const consonants = findVocabularyByCategory('consonant')
      .sort((a, b) => a.thai.localeCompare(b.thai));

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
    const vowels = findVocabularyByCategory('vowel')
      .sort((a, b) => a.thai.localeCompare(b.thai));

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
    const tones = findVocabularyByCategory('tone')
      .sort((a, b) => a.thai.localeCompare(b.thai));

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

    const vocabulary = mockVocabularies.find(v => v.id === id);
    
    if (!vocabulary) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคำศัพท์' 
      });
    }

    // Mock stats update
    res.json({
      success: true,
      message: 'อัปเดตสถิติคำศัพท์เรียบร้อย',
      stats: {
        totalAttempts: 1,
        correctAttempts: correct ? 1 : 0,
        averageScore: score,
        accuracy: correct ? 100 : 0
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

    const searchLower = query.toLowerCase();
    const vocabulary = mockVocabularies.filter(vocab => 
      vocab.thai.toLowerCase().includes(searchLower) ||
      vocab.roman.toLowerCase().includes(searchLower) ||
      vocab.meaning.toLowerCase().includes(searchLower)
    ).slice(0, parseInt(limit));

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
