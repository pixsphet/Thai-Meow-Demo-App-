const express = require("express");
const router = express.Router();
const Vocab = require("../models/Vocab");

// ดึงพยัญชนะทั้งหมด
router.get("/consonants", async (req, res) => {
  try {
    const { level = "Beginner" } = req.query;
    const vocab = await Vocab.find({ type: "consonant", level }).sort({ thai: 1 }).lean();
    res.json(vocab);
  } catch (error) {
    console.error('Error fetching consonants:', error);
    res.status(500).json({ error: 'Failed to fetch consonants' });
  }
});

// ดึงพยัญชนะทั้งหมดสำหรับเกม (44 ตัว)
router.get("/vocab/consonants", async (req, res) => {
  try {
    console.log('🔄 Fetching consonants for game...');
    const docs = await Vocab.find({ 
      category: 'thai-consonants',
      isActive: true 
    })
      .select('thai nameTH en roman imagePath level category')
      .sort({ thai: 1 })
      .lean();
    
    console.log(`✅ Found ${docs.length} consonants`);
    
    // Transform data for game
    const consonants = docs.map(doc => ({
      thai: doc.thai,
      exampleTH: doc.nameTH,
      en: doc.en,
      roman: doc.roman,
      imagePath: doc.imagePath || `/src/assets/letters/${doc.thai.toLowerCase()}_${doc.roman}.png`,
      lessonKey: 'consonants_basic',
      level: doc.level || 'Beginner'
    }));
    
    res.json(consonants);
  } catch (error) {
    console.error('❌ Fetch consonants error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ดึงคำศัพท์ตาม ID
router.get("/:id", async (req, res) => {
  try {
    const vocab = await Vocab.findById(req.params.id).lean();
    if (!vocab) {
      return res.status(404).json({ error: 'Vocab not found' });
    }
    res.json(vocab);
  } catch (error) {
    console.error('Error fetching vocab:', error);
    res.status(500).json({ error: 'Failed to fetch vocab' });
  }
});

// ดึงคำศัพท์ตามระดับและประเภท
router.get("/", async (req, res) => {
  try {
    const { level, type, category } = req.query;
    const filter = {};
    
    if (level) filter.level = level;
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    const vocab = await Vocab.find(filter).sort({ thai: 1 }).lean();
    res.json(vocab);
  } catch (error) {
    console.error('Error fetching vocab:', error);
    res.status(500).json({ error: 'Failed to fetch vocab' });
  }
});

module.exports = router;