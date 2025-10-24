const express = require('express');
const router = express.Router();
const GameVocab = require('../models/GameVocab');
const { CATEGORY_ENUM } = require('../models/GameVocab');

// GET /api/game-vocab/categories
router.get('/categories', (req, res) => {
  res.json({ success: true, categories: CATEGORY_ENUM });
});

// GET /api/game-vocab/:category
// Random first to avoid accidental shadowing
router.get('/:category/random', async (req, res) => {
  try {
    const { category } = req.params;
    const count = Math.min(parseInt(req.query.count || '12', 10), 200);
    if (!CATEGORY_ENUM.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }
    const data = await GameVocab.aggregate([
      { $match: { category, isActive: true } },
      { $sample: { size: count } },
      { $sort: { thai: 1 } },
    ]);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('Error fetching random game vocab:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Regular category listing
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 1000);
    if (!CATEGORY_ENUM.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }
    const items = await GameVocab.find({ category, isActive: true })
      .sort({ thai: 1 })
      .limit(limit)
      .lean();
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('Error fetching game vocab by category:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;


