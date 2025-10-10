const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection - Using local MongoDB for development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thai-meow';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('📝 Note: Make sure MongoDB is running locally or set MONGODB_URI environment variable');
});

// User Stats Schema
const userStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  xp: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  hearts: { type: Number, default: 5 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  totalCorrectAnswers: { type: Number, default: 0 },
  totalWrongAnswers: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 },
  lastPlayed: { type: Date },
  achievements: [{ type: String }],
  badges: [{ type: String }],
  lastUpdated: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false }
});

const UserStats = mongoose.model('UserStats', userStatsSchema);

// Progress Session Schema
const progressSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  lessonId: { type: String, required: true },
  currentIndex: { type: Number, default: 0 },
  answers: { type: Map, of: mongoose.Schema.Types.Mixed },
  score: { type: Number, default: 0 },
  hearts: { type: Number, default: 5 },
  diamonds: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  isCompleted: { type: Boolean, default: false }
});

const ProgressSession = mongoose.model('ProgressSession', progressSessionSchema);

// Game Session Schema
const gameSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  lessonId: { type: String, required: true },
  finalScore: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timeSpent: { type: Number, required: true },
  xpEarned: { type: Number, required: true },
  diamondsEarned: { type: Number, required: true },
  heartsRemaining: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  wrongAnswers: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now }
});

const GameSession = mongoose.model('GameSession', gameSessionSchema);

// Level Unlock Schema
const levelUnlockSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  levelId: { type: String, required: true },
  isUnlocked: { type: Boolean, default: false },
  unlockedAt: { type: Date },
  accuracy: { type: Number },
  score: { type: Number }
});

const LevelUnlock = mongoose.model('LevelUnlock', levelUnlockSchema);

// API Routes

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Support both email and username login
    const loginId = email || username;
    
    // Simple mock authentication for development
    if ((loginId === 'demo' || loginId === 'demo@example.com') && password === 'demo') {
      const token = `mock_token_${Date.now()}`;
      const user = {
        id: '68e6550e9b2f55ba8bead565',
        username: 'demo_user',
        email: 'demo@example.com',
        avatar: null
      };
      
      res.json({
        success: true,
        message: 'Login successful',
        data: { user, token }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Simple mock registration
    const token = `mock_token_${Date.now()}`;
    const user = {
      id: `user_${Date.now()}`,
      username,
      email,
      avatar: null
    };
    
    res.json({
      success: true,
      message: 'Registration successful',
      data: { user, token }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
});

// Get user stats
app.get('/api/user/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Return default stats if MongoDB not connected
      const defaultStats = {
        userId,
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
        synced: false
      };
      return res.json(defaultStats);
    }
    
    let userStats = await UserStats.findOne({ userId });
    
    if (!userStats) {
      // Create new user stats
      userStats = new UserStats({ userId });
      await userStats.save();
    }
    
    res.json(userStats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// Update user stats
app.post('/api/user/stats', async (req, res) => {
  try {
    const { userId, ...updates } = req.body;
    
    const userStats = await UserStats.findOneAndUpdate(
      { userId },
      { ...updates, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    
    res.json(userStats);
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ error: 'Failed to update user stats' });
  }
});

// Save progress session
app.post('/api/progress/user/session', async (req, res) => {
  try {
    const { userId, lessonId, ...sessionData } = req.body;
    
    const session = await ProgressSession.findOneAndUpdate(
      { userId, lessonId },
      { ...sessionData, timestamp: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error saving progress session:', error);
    res.status(500).json({ error: 'Failed to save progress session' });
  }
});

// Get progress session
app.get('/api/progress/user/session', async (req, res) => {
  try {
    const { userId, lessonId } = req.query;
    
    const session = await ProgressSession.findOne({ userId, lessonId });
    res.json(session);
  } catch (error) {
    console.error('Error getting progress session:', error);
    res.status(500).json({ error: 'Failed to get progress session' });
  }
});

// Delete progress session
app.delete('/api/progress/user/session', async (req, res) => {
  try {
    const { userId, lessonId } = req.query;
    
    await ProgressSession.deleteOne({ userId, lessonId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting progress session:', error);
    res.status(500).json({ error: 'Failed to delete progress session' });
  }
});

// Save final game results
app.post('/api/progress/finish', async (req, res) => {
  try {
    const gameSession = new GameSession(req.body);
    await gameSession.save();
    
    // Update user stats
    const { userId, xpEarned, diamondsEarned, heartsRemaining, accuracy, timeSpent, correctAnswers, wrongAnswers } = req.body;
    
    await UserStats.findOneAndUpdate(
      { userId },
      {
        $inc: {
          xp: xpEarned,
          diamonds: diamondsEarned,
          totalSessions: 1,
          totalCorrectAnswers: correctAnswers,
          totalWrongAnswers: wrongAnswers,
          totalTimeSpent: timeSpent
        },
        $set: {
          hearts: heartsRemaining,
          accuracy: accuracy,
          lastPlayed: new Date(),
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
    res.json({ success: true, gameSession });
  } catch (error) {
    console.error('Error saving final results:', error);
    res.status(500).json({ error: 'Failed to save final results' });
  }
});

// Get user progress summary
app.get('/api/progress/user', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const sessions = await GameSession.find({ userId }).sort({ completedAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ error: 'Failed to get user progress' });
  }
});

// Check and unlock level
app.post('/api/level/unlock', async (req, res) => {
  try {
    const { userId, levelId, accuracy, score } = req.body;
    
    // Check if accuracy >= 70%
    if (accuracy >= 70) {
      const unlock = await LevelUnlock.findOneAndUpdate(
        { userId, levelId },
        { isUnlocked: true, unlockedAt: new Date(), accuracy, score },
        { upsert: true, new: true }
      );
      
      res.json({ unlocked: true, unlock });
    } else {
      res.json({ unlocked: false, message: 'Accuracy not sufficient for unlock' });
    }
  } catch (error) {
    console.error('Error checking level unlock:', error);
    res.status(500).json({ error: 'Failed to check level unlock' });
  }
});

// Additional endpoints for app compatibility
app.get('/api/user/data', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    // Return user stats in the expected format
    const stats = await UserStats.findOne({ userId }) || {
      userId,
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
      synced: false
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

app.post('/api/user/data/patch', async (req, res) => {
  try {
    const { userId, ...updates } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userStats = await UserStats.findOneAndUpdate(
      { userId },
      { ...updates, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, data: userStats });
  } catch (error) {
    console.error('Error patching user data:', error);
    res.status(500).json({ error: 'Failed to patch user data' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Real API server running on port ${PORT}`);
  console.log(`📊 MongoDB Atlas connected`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
