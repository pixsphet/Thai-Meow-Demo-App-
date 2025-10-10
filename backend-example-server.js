// backend-example-server.js
// Simple Express + Socket.IO server for testing the real-time sync system
// Run with: node backend-example-server.js

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({ 
  origin: '*', // In production, specify your app's origin
  credentials: true 
}));
app.use(express.json());

// Socket.IO configuration
const io = new Server(server, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  } 
});

// In-memory storage for demo (replace with MongoDB in production)
const users = {}; // { userId: { stats: {...} } }

// Default stats for new users
const getDefaultStats = () => ({
  xp: 0,
  hearts: 5,
  diamonds: 0,
  level: 1,
  streak: 0,
  accuracy: 0,
  maxStreak: 0,
  totalTimeSpent: 0,
  lastUpdated: new Date().toISOString()
});

// GET /api/users/:userId/stats
app.get('/api/users/:userId/stats', (req, res) => {
  const { userId } = req.params;
  
  if (!users[userId]) {
    users[userId] = { stats: getDefaultStats() };
  }
  
  console.log(`📊 GET stats for user ${userId}:`, users[userId].stats);
  res.json(users[userId]);
});

// POST /api/users/updateStats
app.post('/api/users/updateStats', (req, res) => {
  const { userId, stats } = req.body;
  
  if (!userId || !stats) {
    return res.status(400).json({ 
      error: 'userId and stats are required' 
    });
  }
  
  // Initialize user if doesn't exist
  if (!users[userId]) {
    users[userId] = { stats: getDefaultStats() };
  }
  
  // Update stats
  users[userId].stats = { 
    ...users[userId].stats, 
    ...stats,
    lastUpdated: new Date().toISOString()
  };
  
  console.log(`📝 Updated stats for user ${userId}:`, users[userId].stats);
  
  // Broadcast to all connected clients
  io.emit('user:update', { 
    userId, 
    stats: users[userId].stats 
  });
  
  res.json({ 
    success: true, 
    user: users[userId] 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Handle client updates
  socket.on('user:clientUpdate', ({ userId, stats }) => {
    console.log(`🔄 Client update from ${socket.id} for user ${userId}:`, stats);
    
    // Broadcast to all other clients
    socket.broadcast.emit('user:update', { userId, stats });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Stats API: http://localhost:${PORT}/api/users/:userId/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
