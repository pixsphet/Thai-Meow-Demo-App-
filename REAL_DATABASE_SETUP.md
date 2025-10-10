# Real Database Setup Guide

## Overview
This guide explains how to set up the Thai-Meow app with real MongoDB Atlas database instead of mock data.

## Prerequisites
1. MongoDB Atlas account
2. Node.js installed
3. Thai-Meow app cloned

## Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (choose free tier)

### 1.2 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a user with read/write permissions
4. Note down the username and password

### 1.3 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Add your current IP address (or 0.0.0.0/0 for development)

### 1.4 Get Connection String
1. Go to "Clusters" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `thai-meow`

Example connection string:
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net/thai-meow?retryWrites=true&w=majority
```

## Step 2: Backend Setup

### 2.1 Install Dependencies
```bash
cd /Users/n.phet/Documents/Thai-Meow
npm install express mongoose cors body-parser
npm install -D nodemon
```

### 2.2 Configure Environment
Create a `.env` file in the project root:
```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/thai-meow?retryWrites=true&w=majority

# API Configuration
API_BASE_URL=http://localhost:3001/api
SOCKET_URL=http://localhost:3001

# Development
NODE_ENV=development
PORT=3001
```

### 2.3 Start Backend Server
```bash
node backend-real-api.js
```

The server will start on `http://localhost:3001`

## Step 3: Frontend Configuration

### 3.1 Update API Base URL
In `src/services/apiClient.js`, update the base URL:
```javascript
const api = axios.create({
  baseURL: 'http://localhost:3001/api', // Change from mock to real API
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 3.2 Update User ID
In game screens, replace hardcoded user IDs with real user data:
```javascript
// Instead of 'demo_user_id'
const { user } = useUser();
await realProgressService.initialize(user?.id);
```

## Step 4: Database Schema

The following collections will be created automatically:

### UserStats Collection
```javascript
{
  userId: String (unique),
  xp: Number,
  diamonds: Number,
  hearts: Number,
  level: Number,
  streak: Number,
  maxStreak: Number,
  accuracy: Number,
  totalTimeSpent: Number,
  totalSessions: Number,
  totalCorrectAnswers: Number,
  totalWrongAnswers: Number,
  averageAccuracy: Number,
  lastPlayed: Date,
  achievements: [String],
  badges: [String],
  lastUpdated: Date,
  synced: Boolean
}
```

### ProgressSession Collection
```javascript
{
  userId: String,
  lessonId: String,
  currentIndex: Number,
  answers: Map,
  score: Number,
  hearts: Number,
  diamonds: Number,
  xp: Number,
  timeSpent: Number,
  accuracy: Number,
  timestamp: Date,
  isCompleted: Boolean
}
```

### GameSession Collection
```javascript
{
  userId: String,
  lessonId: String,
  finalScore: Number,
  accuracy: Number,
  timeSpent: Number,
  xpEarned: Number,
  diamondsEarned: Number,
  heartsRemaining: Number,
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers: Number,
  completedAt: Date
}
```

### LevelUnlock Collection
```javascript
{
  userId: String,
  levelId: String,
  isUnlocked: Boolean,
  unlockedAt: Date,
  accuracy: Number,
  score: Number
}
```

## Step 5: Testing

### 5.1 Test API Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Get user stats
curl http://localhost:3001/api/user/stats/demo_user_id

# Create user stats
curl -X POST http://localhost:3001/api/user/stats \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo_user_id","xp":100,"diamonds":10,"hearts":5}'
```

### 5.2 Test App Integration
1. Start the backend server
2. Start the React Native app
3. Play a game session
4. Check MongoDB Atlas for data

## Step 6: Production Deployment

### 6.1 Environment Variables
Set these environment variables in your production environment:
- `MONGODB_URI`: Your production MongoDB Atlas connection string
- `API_BASE_URL`: Your production API URL
- `NODE_ENV`: `production`

### 6.2 Security Considerations
1. Use strong database passwords
2. Restrict network access to your app's IP addresses
3. Enable MongoDB Atlas security features
4. Use HTTPS in production

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if MongoDB Atlas cluster is running
   - Verify network access settings
   - Check connection string format

2. **Authentication Failed**
   - Verify username and password
   - Check database user permissions
   - Ensure user has read/write access

3. **CORS Errors**
   - Check CORS configuration in backend
   - Verify API base URL in frontend

4. **Data Not Syncing**
   - Check network connectivity
   - Verify API endpoints are working
   - Check console logs for errors

### Debug Commands
```bash
# Check MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_URI').then(() => console.log('Connected')).catch(console.error)"

# Test API endpoints
curl -v http://localhost:3001/api/health
```

## Support

For issues with this setup:
1. Check MongoDB Atlas documentation
2. Review backend logs
3. Check React Native console logs
4. Verify environment variables
