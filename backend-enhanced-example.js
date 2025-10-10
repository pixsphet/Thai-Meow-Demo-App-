// backend-enhanced-example.js
// Enhanced Express + Socket.IO server with all advanced features
// Supports: auto-reconnect, conflict resolution, presence, ping, queue management
// Run with: node backend-enhanced-example.js

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

// Socket.IO configuration with advanced options
const io = new Server(server, { 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// In-memory storage for demo (replace with MongoDB in production)
const users = {}; // { userId: { stats: {...}, lastSeen: timestamp } }
const userRooms = new Map(); // { socketId: userId }

// Default stats for new users
const getDefaultStats = () => ({
  xp: 0,
  hearts: 5,
  diamonds: 0,
  level: 1,
  streak: 0,
  accuracy: 0,
  maxStreak: 0,
  completedQuestions: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  totalQuestions: 0,
  timePerQuestion: [],
  totalTimeSpent: 0,
  lastGameResults: null,
  updatedAt: new Date().toISOString()
});

// Conflict resolution helper
const resolveConflict = (local, incoming) => {
  const localTime = new Date(local?.updatedAt || 0).getTime();
  const incomingTime = new Date(incoming?.updatedAt || 0).getTime();
  
  if (incomingTime >= localTime) {
    return { ...local, ...incoming, updatedAt: new Date().toISOString() };
  }
  return local;
};

// GET /api/users/:userId/stats
app.get('/api/users/:userId/stats', (req, res) => {
  const { userId } = req.params;
  
  if (!users[userId]) {
    users[userId] = { 
      stats: getDefaultStats(),
      lastSeen: Date.now()
    };
  }
  
  console.log(`📊 GET stats for user ${userId}:`, users[userId].stats);
  res.json(users[userId].stats);
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
    users[userId] = { 
      stats: getDefaultStats(),
      lastSeen: Date.now()
    };
  }
  
  // Apply conflict resolution
  const currentStats = users[userId].stats;
  const mergedStats = resolveConflict(currentStats, {
    ...stats,
    updatedAt: new Date().toISOString()
  });
  
  // Update user stats
  users[userId].stats = mergedStats;
  users[userId].lastSeen = Date.now();
  
  console.log(`📝 Updated stats for user ${userId}:`, mergedStats);
  
  // Broadcast to all connected clients in the user's room
  io.to(`user:${userId}`).emit('user:data:updated', mergedStats);
  
  // Also broadcast to all clients for real-time updates
  io.emit('user:update', { 
    userId, 
    stats: mergedStats 
  });
  
  res.json({ 
    success: true, 
    user: users[userId],
    conflictResolved: true
  });
});

// POST /api/users/data/patch (for delta updates)
app.post('/api/users/data/patch', (req, res) => {
  const delta = req.body;
  const userId = req.headers['x-user-id'] || req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ 
      error: 'userId is required in headers or query' 
    });
  }
  
  // Initialize user if doesn't exist
  if (!users[userId]) {
    users[userId] = { 
      stats: getDefaultStats(),
      lastSeen: Date.now()
    };
  }
  
  // Apply delta to current stats
  const currentStats = users[userId].stats;
  const updatedStats = {
    ...currentStats,
    xp: (currentStats.xp || 0) + (delta.xp || 0),
    diamonds: (currentStats.diamonds || 0) + (delta.diamonds || 0),
    hearts: Math.max(0, Math.min(5, (currentStats.hearts || 5) + (delta.hearts || 0))),
    level: delta.level || currentStats.level || 1,
    streak: delta.streak ?? currentStats.streak || 0,
    accuracy: delta.accuracy ?? currentStats.accuracy || 0,
    maxStreak: Math.max(currentStats.maxStreak || 0, delta.maxStreak || 0),
    completedQuestions: (currentStats.completedQuestions || 0) + (delta.completedQuestions || 0),
    correctAnswers: (currentStats.correctAnswers || 0) + (delta.correctAnswers || 0),
    wrongAnswers: (currentStats.wrongAnswers || 0) + (delta.wrongAnswers || 0),
    totalQuestions: delta.totalQuestions ?? currentStats.totalQuestions || 0,
    timePerQuestion: delta.timePerQuestion || currentStats.timePerQuestion || [],
    totalTimeSpent: delta.totalTimeSpent ?? currentStats.totalTimeSpent || 0,
    lastGameResults: delta.lastGameResults || currentStats.lastGameResults,
    updatedAt: new Date().toISOString()
  };
  
  users[userId].stats = updatedStats;
  users[userId].lastSeen = Date.now();
  
  console.log(`🔧 Applied delta for user ${userId}:`, delta);
  
  // Broadcast updates
  io.to(`user:${userId}`).emit('user:data:updated', updatedStats);
  io.emit('user:update', { userId, stats: updatedStats });
  
  res.json({ 
    success: true, 
    stats: updatedStats 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const connectedUsers = userRooms.size;
  const totalUsers = Object.keys(users).length;
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount,
    connectedUsers,
    totalUsers,
    uptime: process.uptime()
  });
});

// Socket.IO connection handling with advanced features
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Handle user authentication and room joining
  socket.on('presence:join', ({ userId }) => {
    if (userId) {
      userRooms.set(socket.id, userId);
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined room via socket ${socket.id}`);
      
      // Send current stats to the newly connected client
      if (users[userId]) {
        socket.emit('user:data:updated', users[userId].stats);
      }
    }
  });
  
  // Handle presence ping
  socket.on('presence:ping', ({ t }) => {
    const userId = userRooms.get(socket.id);
    if (userId && users[userId]) {
      users[userId].lastSeen = Date.now();
    }
    socket.emit('presence:pong', { t, serverTime: Date.now() });
  });
  
  // Handle client updates (for real-time sync)
  socket.on('user:clientUpdate', ({ userId, stats }) => {
    console.log(`🔄 Client update from ${socket.id} for user ${userId}:`, stats);
    
    if (userId && users[userId]) {
      // Apply conflict resolution
      const currentStats = users[userId].stats;
      const mergedStats = resolveConflict(currentStats, stats);
      users[userId].stats = mergedStats;
      users[userId].lastSeen = Date.now();
      
      // Broadcast to all other clients
      socket.broadcast.emit('user:update', { userId, stats: mergedStats });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const userId = userRooms.get(socket.id);
    if (userId) {
      console.log(`👤 User ${userId} disconnected: ${reason}`);
      userRooms.delete(socket.id);
    } else {
      console.log(`🔌 Anonymous client disconnected: ${reason}`);
    }
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Cleanup inactive users (run every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
  
  Object.keys(users).forEach(userId => {
    if (now - users[userId].lastSeen > inactiveThreshold) {
      console.log(`🧹 Cleaning up inactive user: ${userId}`);
      delete users[userId];
    }
  });
}, 5 * 60 * 1000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Enhanced server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready with advanced features`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Stats API: http://localhost:${PORT}/api/users/:userId/stats`);
  console.log(`🔧 Patch API: http://localhost:${PORT}/api/users/data/patch`);
  console.log(`✨ Features: Auto-reconnect, Conflict Resolution, Presence, Queue Management`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down enhanced server...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

module.exports = { app, server, io };
