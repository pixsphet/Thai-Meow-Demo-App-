const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for demo purposes
const userStats = new Map();
const gameSessions = new Map();
const levelUnlocks = new Map();

// Default user stats
const getDefaultStats = (userId) => ({
  xp: 0,
  diamonds: 0,
  hearts: 5,
  level: 1,
  streak: 0,
  maxStreak: 0,
  accuracy: 0,
  totalTimeSpent: 0,
  totalSessions: 0,
  totalCorrectAnswers: 0,
  totalWrongAnswers: 0,
  averageAccuracy: 0,
  lastPlayed: null,
  achievements: [],
  badges: [],
  lastUpdated: new Date().toISOString(),
  synced: true
});

// Routes

// Get user stats
app.get('/api/user/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userStats.has(userId)) {
      userStats.set(userId, getDefaultStats(userId));
    }
    
    const stats = userStats.get(userId);
    
    res.json({
      success: true,
      data: stats,
      message: 'User stats retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update user stats
app.post('/api/user/stats', (req, res) => {
  try {
    const { userId, stats } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const currentStats = userStats.get(userId) || getDefaultStats(userId);
    const updatedStats = {
      ...currentStats,
      ...stats,
      lastUpdated: new Date().toISOString(),
      synced: true
    };
    
    userStats.set(userId, updatedStats);
    
    res.json({
      success: true,
      data: updatedStats,
      message: 'User stats updated successfully'
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Save game session
app.post('/api/game/session', (req, res) => {
  try {
    const sessionData = req.body;
    
    if (!sessionData.userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const sessionId = `${sessionData.userId}_${Date.now()}`;
    gameSessions.set(sessionId, {
      ...sessionData,
      id: sessionId,
      createdAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: { sessionId },
      message: 'Game session saved successfully'
    });
  } catch (error) {
    console.error('Error saving game session:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get game sessions
app.get('/api/game/sessions/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = Array.from(gameSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: sessions,
      message: 'Game sessions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting game sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Check level unlock
app.post('/api/level/unlock', (req, res) => {
  try {
    const { userId, level, accuracy } = req.body;
    
    if (!userId || !level) {
      return res.status(400).json({
        success: false,
        message: 'User ID and level are required'
      });
    }
    
    const shouldUnlock = accuracy >= 70;
    const unlockKey = `${userId}_${level}`;
    
    if (shouldUnlock) {
      levelUnlocks.set(unlockKey, {
        userId,
        level,
        unlockedAt: new Date().toISOString(),
        accuracy
      });
    }
    
    res.json({
      success: true,
      data: {
        unlocked: shouldUnlock,
        level,
        accuracy
      },
      message: shouldUnlock ? 'Level unlocked successfully' : 'Level not unlocked - accuracy too low'
    });
  } catch (error) {
    console.error('Error checking level unlock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Progress API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Progress API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👤 User stats: http://localhost:${PORT}/api/user/stats/:userId`);
  console.log(`🎮 Game sessions: http://localhost:${PORT}/api/game/sessions/:userId`);
});

module.exports = app;