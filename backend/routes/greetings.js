const express = require('express');
const router = express.Router();
const Vocab = require('../models/Vocab');

// Get all greetings vocabulary
router.get('/', async (req, res) => {
  try {
    const greetings = await Vocab.find({ category: 'greetings' })
      .select('thai roman meaning example tts emoji category lesson level type imagePath')
      .sort({ lesson: 1, thai: 1 });
    
    res.json({
      success: true,
      data: greetings,
      count: greetings.length
    });
  } catch (error) {
    console.error('Error fetching greetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch greetings vocabulary',
      error: error.message
    });
  }
});

// Get greetings by lesson
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const greetings = await Vocab.find({ 
      category: 'greetings',
      lesson: parseInt(lessonId)
    })
      .select('thai roman meaning example tts emoji category lesson level type imagePath')
      .sort({ thai: 1 });
    
    res.json({
      success: true,
      data: greetings,
      count: greetings.length,
      lesson: lessonId
    });
  } catch (error) {
    console.error('Error fetching greetings by lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch greetings for lesson',
      error: error.message
    });
  }
});

// Get greetings by level
router.get('/level/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const greetings = await Vocab.find({ 
      category: 'greetings',
      level: level
    })
      .select('thai roman meaning example tts emoji category lesson level type imagePath')
      .sort({ lesson: 1, thai: 1 });
    
    res.json({
      success: true,
      data: greetings,
      count: greetings.length,
      level: level
    });
  } catch (error) {
    console.error('Error fetching greetings by level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch greetings for level',
      error: error.message
    });
  }
});

// Get specific greeting by Thai word
router.get('/word/:thai', async (req, res) => {
  try {
    const { thai } = req.params;
    const greeting = await Vocab.findOne({ 
      category: 'greetings',
      thai: thai
    })
      .select('thai roman meaning example tts emoji category lesson level type imagePath');
    
    if (!greeting) {
      return res.status(404).json({
        success: false,
        message: 'Greeting not found'
      });
    }
    
    res.json({
      success: true,
      data: greeting
    });
  } catch (error) {
    console.error('Error fetching specific greeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch greeting',
      error: error.message
    });
  }
});

// Get random greetings for quiz
router.get('/quiz/:count', async (req, res) => {
  try {
    const { count } = req.params;
    const limit = parseInt(count) || 10;
    
    const greetings = await Vocab.aggregate([
      { $match: { category: 'greetings' } },
      { $sample: { size: limit } },
      { $project: { 
        thai: 1, 
        roman: 1, 
        meaning: 1, 
        example: 1, 
        tts: 1, 
        emoji: 1, 
        category: 1, 
        lesson: 1, 
        level: 1, 
        type: 1, 
        imagePath: 1 
      }}
    ]);
    
    res.json({
      success: true,
      data: greetings,
      count: greetings.length
    });
  } catch (error) {
    console.error('Error fetching random greetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch random greetings',
      error: error.message
    });
  }
});

module.exports = router;
