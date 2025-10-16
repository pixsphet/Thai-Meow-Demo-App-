const express = require('express');
const Vocab = require('../models/Vocab');
const router = express.Router();

// GET /api/vocab/consonants - Get all Thai consonants
router.get('/consonants', async (req, res) => {
  try {
    console.log('🔤 Fetching Thai consonants from database...');
    
    const consonants = await Vocab.getConsonants();
    
    console.log(`✅ Found ${consonants.length} consonants in database`);
    
    res.json({
      success: true,
      count: consonants.length,
      data: consonants,
      message: `Successfully fetched ${consonants.length} Thai consonants`
    });

  } catch (error) {
    console.error('❌ Error fetching consonants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consonants',
      message: error.message
    });
  }
});

const formatVowelResponse = (vowelDoc) => ({
  id: vowelDoc._id,
  thai: vowelDoc.thai,
  roman: vowelDoc.roman,
  type: vowelDoc.position || vowelDoc.type || '',
  example: vowelDoc.example,
  exampleAudio: vowelDoc.exampleAudio,
  length: vowelDoc.length || '',
  pair: vowelDoc.pair || '',
  meaning: vowelDoc.meaning || '',
  group: vowelDoc.group || '',
  imagePath: vowelDoc.imagePath || '',
  level: vowelDoc.level,
  lessonKey: vowelDoc.lessonKey || 'vowels_basic',
  isActive: vowelDoc.isActive
});

// GET /api/vocab/vowels - Get all Thai vowels
router.get('/vowels', async (req, res) => {
  try {
    console.log('🔤 Fetching Thai vowels from database...');

    const vowels = await Vocab.find({
      category: 'thai-vowels',
      isActive: true
    }).sort({ thai: 1 });

    console.log(`✅ Found ${vowels.length} vowels in database`);

    res.json({
      success: true,
      count: vowels.length,
      data: vowels.map(formatVowelResponse),
      message: `Successfully fetched ${vowels.length} Thai vowels`
    });
  } catch (error) {
    console.error('❌ Error fetching vowels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vowels',
      message: error.message
    });
  }
});

// Legacy route support /vowels/all
router.get('/vowels/all', async (req, res) => {
  try {
    const vowels = await Vocab.find({
      category: 'thai-vowels',
      isActive: true
    }).sort({ thai: 1 });

    res.json({
      success: true,
      vowels: vowels.map(formatVowelResponse)
    });
  } catch (error) {
    console.error('❌ Error fetching vowels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vowels',
      message: error.message
    });
  }
});

// GET /api/vocab/consonants/level/:level - Get consonants by level
router.get('/consonants/level/:level', async (req, res) => {
  try {
    const { level } = req.params;
    
    console.log(`🔤 Fetching consonants for level: ${level}`);
    
    const consonants = await Vocab.getConsonantsByLevel(level);
    
    console.log(`✅ Found ${consonants.length} consonants for level ${level}`);
    
    res.json({
      success: true,
      level: level,
      count: consonants.length,
      data: consonants,
      message: `Successfully fetched ${consonants.length} consonants for level ${level}`
    });

  } catch (error) {
    console.error('❌ Error fetching consonants by level:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consonants by level',
      message: error.message
    });
  }
});

// GET /api/vocab/consonants/random - Get random consonants for game
router.get('/consonants/random', async (req, res) => {
  try {
    const { count = 10, level = 'Beginner' } = req.query;
    
    console.log(`🎮 Fetching ${count} random consonants for level ${level}`);
    
    const consonants = await Vocab.getRandomConsonants(parseInt(count), level);
    
    console.log(`✅ Found ${consonants.length} random consonants`);
    
    res.json({
      success: true,
      level: level,
      count: consonants.length,
      data: consonants,
      message: `Successfully fetched ${consonants.length} random consonants`
    });

  } catch (error) {
    console.error('❌ Error fetching random consonants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch random consonants',
      message: error.message
    });
  }
});

// GET /api/vocab/consonants/:id - Get specific consonant by ID
router.get('/consonants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔤 Fetching consonant with ID: ${id}`);
    
    const consonant = await Vocab.findById(id);
    
    if (!consonant) {
      return res.status(404).json({
        success: false,
        error: 'Consonant not found'
      });
    }
    
    console.log(`✅ Found consonant: ${consonant.displayName}`);
    
    res.json({
      success: true,
      data: consonant,
      message: 'Successfully fetched consonant'
    });

  } catch (error) {
    console.error('❌ Error fetching consonant by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch consonant',
      message: error.message
    });
  }
});

// POST /api/vocab/consonants - Create new consonant (admin only)
router.post('/consonants', async (req, res) => {
  try {
    const consonantData = req.body;
    
    console.log('🔤 Creating new consonant:', consonantData.thai);
    
    const consonant = new Vocab(consonantData);
    await consonant.save();
    
    console.log(`✅ Created consonant: ${consonant.displayName}`);
    
    res.status(201).json({
      success: true,
      data: consonant,
      message: 'Successfully created consonant'
    });

  } catch (error) {
    console.error('❌ Error creating consonant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create consonant',
      message: error.message
    });
  }
});

// PUT /api/vocab/consonants/:id - Update consonant
router.put('/consonants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`🔤 Updating consonant with ID: ${id}`);
    
    const consonant = await Vocab.findByIdAndUpdate(
      id, 
      { ...updateData, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    );
    
    if (!consonant) {
      return res.status(404).json({
        success: false,
        error: 'Consonant not found'
      });
    }
    
    console.log(`✅ Updated consonant: ${consonant.displayName}`);
    
    res.json({
      success: true,
      data: consonant,
      message: 'Successfully updated consonant'
    });

  } catch (error) {
    console.error('❌ Error updating consonant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update consonant',
      message: error.message
    });
  }
});

// DELETE /api/vocab/consonants/:id - Delete consonant (soft delete)
router.delete('/consonants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔤 Soft deleting consonant with ID: ${id}`);
    
    const consonant = await Vocab.findByIdAndUpdate(
      id, 
      { isActive: false, updatedAt: new Date() }, 
      { new: true }
    );
    
    if (!consonant) {
      return res.status(404).json({
        success: false,
        error: 'Consonant not found'
      });
    }
    
    console.log(`✅ Soft deleted consonant: ${consonant.displayName}`);
    
    res.json({
      success: true,
      message: 'Successfully deleted consonant'
    });

  } catch (error) {
    console.error('❌ Error deleting consonant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete consonant',
      message: error.message
    });
  }
});

// GET /api/vocab/stats - Get vocabulary statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching vocabulary statistics...');
    
    const totalConsonants = await Vocab.countDocuments({ 
      category: 'thai-consonants',
      isActive: true 
    });
    
    const consonantsByLevel = await Vocab.aggregate([
      { 
        $match: { 
          category: 'thai-consonants',
          isActive: true 
        } 
      },
      { 
        $group: { 
          _id: '$level', 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    console.log(`✅ Found ${totalConsonants} total consonants`);
    
    res.json({
      success: true,
      data: {
        totalConsonants,
        consonantsByLevel,
        lastUpdated: new Date()
      },
      message: 'Successfully fetched vocabulary statistics'
    });

  } catch (error) {
    console.error('❌ Error fetching vocabulary stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vocabulary statistics',
      message: error.message
    });
  }
});

module.exports = router;
