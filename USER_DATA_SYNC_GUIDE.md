# User Data Sync System Guide

## Overview
ระบบซิงค์ข้อมูลผู้ใช้ที่ครอบคลุมสำหรับซิงค์ข้อมูลเพชร หัวใจ XP และความคืบหน้าการเล่นทั้งหมดของแต่ละ user

## Features
- ✅ **User Stats Sync**: Hearts, Diamonds, XP, Level, Streak, Lessons Completed
- ✅ **Progress Sync**: Lesson progress, scores, per-letter data
- ✅ **Offline Support**: Queue changes when offline, sync when online
- ✅ **Real-time Status**: Visual sync indicator
- ✅ **Auto-sync**: Automatic sync on app focus/network changes

## Quick Start

### 1. Import the Hook
```javascript
import { useUserDataSync } from '../hooks/useUserDataSync';
import UserDataSyncIndicator from '../components/UserDataSyncIndicator';
```

### 2. Use in Your Component
```javascript
const MyScreen = () => {
  const {
    userData,           // Current user data (hearts, diamonds, xp, etc.)
    isLoading,          // Loading state
    syncStatus,         // Sync status (online, queue length, etc.)
    updateUserStats,    // Update user stats
    saveProgress,       // Save lesson progress
    loadProgress,       // Load lesson progress
    syncAllUserData,    // Full sync
    refreshUserData     // Refresh local data
  } = useUserDataSync();

  // Update hearts
  const addHeart = async () => {
    await updateUserStats({ hearts: (userData?.hearts || 0) + 1 });
  };

  // Update diamonds
  const addDiamonds = async () => {
    await updateUserStats({ diamonds: (userData?.diamonds || 0) + 10 });
  };

  // Save progress
  const saveLessonProgress = async () => {
    await saveProgress('lesson1', {
      currentIndex: 5,
      total: 10,
      score: 85,
      xp: 25
    });
  };

  return (
    <View>
      <UserDataSyncIndicator syncStatus={syncStatus} />
      <Text>Hearts: {userData?.hearts || 0}</Text>
      <Text>Diamonds: {userData?.diamonds || 0}</Text>
      <Text>XP: {userData?.xp || 0}</Text>
    </View>
  );
};
```

## API Endpoints

### User Stats
- `GET /api/user/stats` - Get current user stats
- `POST /api/user/stats` - Update user stats

### Progress
- `GET /api/progress/user/session?lessonId=X` - Get lesson progress
- `POST /api/progress/user/session` - Save lesson progress
- `GET /api/progress/user/all` - Get all user progress

## Data Structure

### User Stats
```javascript
{
  userId: "user_id",
  username: "username",
  level: 1,
  xp: 100,
  streak: 5,
  hearts: 8,
  diamonds: 50,
  lessonsCompleted: 3,
  lastActiveAt: "2025-10-08T12:00:00Z",
  badges: ["starter", "first-lesson"]
}
```

### Progress Data
```javascript
{
  lessonId: "1",
  currentIndex: 5,
  total: 10,
  score: 85,
  xp: 25,
  perLetter: {
    "ก": { correct: 3, total: 5 },
    "ข": { correct: 2, total: 3 }
  },
  answers: { /* question answers */ },
  questionsSnapshot: [ /* questions array */ ]
}
```

## Sync Status Indicator

The `UserDataSyncIndicator` shows:
- 🟢 **Green**: All synced
- 🟡 **Yellow**: Pending items in queue
- 🟠 **Orange**: Currently syncing
- 🔴 **Red**: Offline

## Offline Support

The system automatically:
1. Saves changes locally when offline
2. Queues changes for later sync
3. Syncs queued changes when coming online
4. Shows sync status to user

## Integration Examples

### In Game Screen
```javascript
const GameScreen = () => {
  const { userData, updateUserStats, saveProgress } = useUserDataSync();

  const handleCorrectAnswer = async () => {
    // Update XP
    await updateUserStats({ 
      xp: (userData?.xp || 0) + 10 
    });
  };

  const handleLessonComplete = async (lessonId, score) => {
    // Save progress
    await saveProgress(lessonId, {
      score,
      completed: true,
      xp: 50
    });
    
    // Update user stats
    await updateUserStats({
      lessonsCompleted: (userData?.lessonsCompleted || 0) + 1,
      xp: (userData?.xp || 0) + 50
    });
  };
};
```

### In Shop Screen
```javascript
const ShopScreen = () => {
  const { userData, updateUserStats } = useUserDataSync();

  const buyItem = async (cost, itemType) => {
    if (userData?.diamonds >= cost) {
      await updateUserStats({
        diamonds: userData.diamonds - cost,
        [itemType]: (userData[itemType] || 0) + 1
      });
    }
  };
};
```

## Demo Screen

See `UserDataSyncDemo.js` for a complete example of all features.

## Backend Requirements

Make sure your backend has:
1. User model with diamonds field
2. Progress model for lesson data
3. JWT authentication middleware
4. API endpoints for stats and progress sync

## Notes

- All sync operations are asynchronous
- Data is saved locally first, then synced to server
- Network status is monitored automatically
- Sync queue is processed when coming online
- Visual feedback is provided to users
