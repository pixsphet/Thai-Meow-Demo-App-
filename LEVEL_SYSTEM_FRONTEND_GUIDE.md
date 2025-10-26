# Frontend Level System Integration Guide

## Quick Start

### 1. Import Required Services

```javascript
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import progressServicePerUser from '../services/progressServicePerUser';
import levelUnlockService from '../services/levelUnlockService';
import unlockService from '../services/unlockService';
```

### 2. Get Current User ID

```javascript
const { user, token } = useAuth();

// Always check if user is authenticated
if (!user?.id || !token) {
  console.warn('User not authenticated');
  return;
}

const userId = user.id;
```

### 3. Automatically Included in API Calls

The `apiClient` automatically adds JWT token to all requests:

```javascript
// config/apiClient.js handles this automatically
// No need to manually add Authorization header
const token = await AsyncStorage.getItem('token');
if (token) {
  headers.Authorization = `Bearer ${token}`;
}
```

## Common Patterns

### Pattern 1: Load Lesson Progress

```javascript
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import progressServicePerUser from '../services/progressServicePerUser';

function MyGameScreen() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const loadProgress = async () => {
      setLoading(true);
      try {
        // No need to pass userId - comes from JWT
        const data = await progressServicePerUser.restoreProgress('lesson1');
        setProgress(data);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [user?.id]);

  // ... rest of component
}
```

### Pattern 2: Save Lesson Progress

```javascript
async function handleProgressUpdate(newProgress) {
  if (!user?.id) return;

  try {
    // ✅ Correct - userId comes from JWT token
    await progressServicePerUser.saveProgress('lesson1', {
      currentIndex: newProgress.currentIndex,
      answers: newProgress.answers,
      progress: newProgress.percentComplete,
      accuracy: newProgress.accuracy
    });
    
    console.log('✅ Progress saved');
  } catch (error) {
    console.error('❌ Error saving progress:', error);
  }
}
```

### Pattern 3: Finish Lesson & Check Unlock

```javascript
async function handleLessonComplete(results) {
  if (!user?.id) return;

  try {
    // 1. Save final progress
    await progressServicePerUser.finishLesson({
      lessonId: 'lesson1',
      score: results.score,
      xpGain: results.xpEarned,
      diamonds: results.diamondsEarned,
      heartsLeft: results.heartsRemaining,
      accuracy: results.accuracy,
      correctAnswers: results.correct,
      wrongAnswers: results.wrong,
      timeSpent: results.timeSpent
    });

    // 2. Check if should unlock next level
    // ✅ Correct - userId from JWT, not passed explicitly
    const unlockResult = await unlockService.checkAndUnlockNext(
      'level2',  // levelId
      {
        accuracy: results.accuracy,
        score: results.score
      }
    );

    if (unlockResult.shouldUnlock) {
      console.log('🎉 Level unlocked!');
      // Show unlock animation/notification
    }

  } catch (error) {
    console.error('Error completing lesson:', error);
  }
}
```

### Pattern 4: Get Unlocked Levels

```javascript
async function loadUnlockedLevels() {
  if (!user?.id) return;

  try {
    // ✅ Correct - no userId parameter needed
    const unlockedLevels = await unlockService.getUnlockedLevels();
    
    // unlockedLevels = ['level1', 'level2', 'level3']
    setUnlockedLevels(unlockedLevels);
  } catch (error) {
    console.error('Error loading unlocked levels:', error);
  }
}
```

### Pattern 5: Check If Level Is Unlocked

```javascript
async function checkLevelAccess(levelId) {
  if (!user?.id) return false;

  try {
    // ✅ Correct - no userId needed
    const isUnlocked = await unlockService.isLevelUnlocked(levelId);
    return isUnlocked;
  } catch (error) {
    console.error('Error checking level unlock:', error);
    return false;
  }
}
```

## Complete Game Screen Example

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import progressServicePerUser from '../services/progressServicePerUser';
import unlockService from '../services/unlockService';

export default function GameScreen({ route, navigation }) {
  const { user, token } = useAuth();
  const { applyDelta } = useProgress();
  
  const lessonId = 'lesson1';
  const levelId = 'level1';
  
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState({
    currentQuestion: 0,
    score: 0,
    correct: 0,
    wrong: 0,
    timeStarted: Date.now()
  });

  // 1. Load Progress on Mount
  useEffect(() => {
    if (!user?.id || !token) {
      console.error('User not authenticated');
      return;
    }

    loadGameProgress();
  }, [user?.id, token]);

  // 2. Load existing progress
  const loadGameProgress = async () => {
    setLoading(true);
    try {
      const existing = await progressServicePerUser.restoreProgress(lessonId);
      setProgress(existing);
    } catch (error) {
      console.error('Error loading progress:', error);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // 3. Answer question handler
  const handleAnswer = async (isCorrect) => {
    const newState = {
      ...gameState,
      currentQuestion: gameState.currentQuestion + 1,
      score: isCorrect ? gameState.score + 10 : gameState.score,
      correct: isCorrect ? gameState.correct + 1 : gameState.correct,
      wrong: isCorrect ? gameState.wrong : gameState.wrong + 1
    };

    setGameState(newState);

    // Auto-save progress periodically
    if (newState.currentQuestion % 5 === 0) {
      await saveProgress(newState);
    }
  };

  // 4. Save progress
  const saveProgress = async (state) => {
    if (!user?.id) return;

    try {
      await progressServicePerUser.saveProgress(lessonId, {
        currentIndex: state.currentQuestion,
        accuracy: state.correct / (state.correct + state.wrong) * 100,
        progress: (state.currentQuestion / 20) * 100 // assuming 20 questions
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // 5. Finish lesson
  const handleLessonComplete = async () => {
    if (!user?.id) return;

    const timeSpent = (Date.now() - gameState.timeStarted) / 1000;
    const accuracy = gameState.correct / (gameState.correct + gameState.wrong) * 100;
    const xpEarned = Math.round(accuracy * 5);
    const diamondsEarned = gameState.correct * 2;

    try {
      // 1. Finish lesson
      const result = await progressServicePerUser.finishLesson({
        lessonId,
        score: gameState.score,
        xpGain: xpEarned,
        diamonds: diamondsEarned,
        accuracy,
        correctAnswers: gameState.correct,
        wrongAnswers: gameState.wrong,
        timeSpent: Math.round(timeSpent)
      });

      // 2. Update local context
      if (result?.stats) {
        await applyDelta({
          xp: xpEarned,
          diamonds: diamondsEarned,
          finishedLesson: true
        });
      }

      // 3. Check unlock
      const unlockResult = await unlockService.checkAndUnlockNext(
        levelId,
        { accuracy, score: gameState.score }
      );

      // 4. Navigate to result screen
      navigation.navigate('LessonCompleteScreen', {
        score: gameState.score,
        accuracy: accuracy.toFixed(1),
        xpEarned,
        diamondsEarned,
        unlockedNext: unlockResult.shouldUnlock,
        nextLevel: unlockResult.nextLevel
      });

    } catch (error) {
      console.error('Error completing lesson:', error);
      // Show error to user
    }
  };

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text>Game Screen - {lessonId}</Text>
      <Text>Score: {gameState.score}</Text>
      <Text>Correct: {gameState.correct} / Wrong: {gameState.wrong}</Text>
      {/* ... game UI ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  }
});
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND - Game Screen                     │
├─────────────────────────────────────────────────────────────────┤
│  useAuth() → { user: { id: 'user123' }, token: 'jwt...' }      │
│                                                                 │
│  1. Load Progress                                               │
│     └─ progressServicePerUser.restoreProgress(lessonId)        │
│        └─ GET /progress/session?lessonId=lesson1               │
│           └─ Header: Authorization: Bearer <JWT>               │
│              (Backend extracts userId from JWT)                │
│              └─ Returns progress for user123 + lesson1         │
│                                                                 │
│  2. Answer Question                                             │
│     └─ Save every N questions                                  │
│        └─ progressServicePerUser.saveProgress(lessonId, {...}) │
│           └─ POST /progress/session                            │
│              └─ Header: Authorization: Bearer <JWT>            │
│                                                                 │
│  3. Complete Lesson                                             │
│     └─ progressServicePerUser.finishLesson({...})              │
│        └─ POST /progress/finish                                │
│           └─ Updates: Progress, User stats, Streak              │
│                                                                 │
│  4. Check Level Unlock                                          │
│     └─ unlockService.checkAndUnlockNext(levelId, {...})        │
│        └─ POST /lessons/check-unlock/level2                    │
│           └─ Backend checks if accuracy ≥ 70%                  │
│           └─ If yes: adds level to user.unlockedLevels         │
│                                                                 │
│  5. Update Local State                                          │
│     └─ useProgress().applyDelta({...})                         │
│        └─ Updates XP, Diamonds, Level                          │
│                                                                 │
│  6. Show Results                                                │
│     └─ Navigate to LessonCompleteScreen                        │
│        └─ Shows score, unlock info, rewards                    │
└─────────────────────────────────────────────────────────────────┘
         │                   JWT Token                     │
         │           (user identification)                │
         └──────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND - API Routes                         │
├─────────────────────────────────────────────────────────────────┤
│  All routes protected with `auth` middleware                    │
│                                                                 │
│  GET /progress/session                                          │
│    └─ Filter: { userId: req.user.id, lessonId }               │
│    └─ Return: progress for ONLY this user                      │
│                                                                 │
│  POST /progress/session                                         │
│    └─ Create/Update: { userId: req.user.id, ...body }         │
│                                                                 │
│  POST /progress/finish                                          │
│    └─ Update Progress doc: { userId: req.user.id, ... }        │
│    └─ Update User stats: { _id: req.user.id, ... }             │
│                                                                 │
│  POST /lessons/check-unlock/:levelId                            │
│    └─ Get User: { _id: req.user.id }                           │
│    └─ Add to unlockedLevels if criteria met                    │
│                                                                 │
│  GET /lessons/unlocked                                          │
│    └─ Get User: { _id: req.user.id }                           │
│    └─ Return: user.unlockedLevels only                         │
└─────────────────────────────────────────────────────────────────┘
         │                                                  │
         │            MongoDB Collections                  │
         └─────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────────────────────┐
         │  Users Collection                  │
         ├────────────────────────────────────┤
         │ {                                  │
         │   _id: ObjectId('user123'),        │
         │   username: 'player1',             │
         │   unlockedLevels: [                │
         │     'level1', 'level2', 'level3'  │
         │   ],                               │
         │   xp: 500,                         │
         │   level: 3                         │
         │ }                                  │
         └────────────────────────────────────┘
                              
         ┌────────────────────────────────────┐
         │  Progress Collection               │
         ├────────────────────────────────────┤
         │ {                                  │
         │   userId: 'user123',               │
         │   lessonId: 'lesson1',             │
         │   progress: 100,                   │
         │   accuracy: 85,                    │
         │   completed: true                  │
         │ }                                  │
         └────────────────────────────────────┘
```

## Common Mistakes to Avoid

### ❌ WRONG: Sending userId explicitly
```javascript
// DON'T DO THIS
await apiClient.post(`/lessons/check-unlock/${userId}/${levelId}`, {...});
```

### ✅ RIGHT: Let JWT handle user identification
```javascript
// DO THIS
await apiClient.post(`/lessons/check-unlock/${levelId}`, {...});
```

### ❌ WRONG: Not checking user authentication
```javascript
// DON'T DO THIS
function MyComponent() {
  const handleGame = async () => {
    // What if user is null?
    await saveProgress('lesson1', data);
  };
}
```

### ✅ RIGHT: Always verify user is authenticated
```javascript
// DO THIS
function MyComponent() {
  const { user, token } = useAuth();
  
  const handleGame = async () => {
    if (!user?.id || !token) {
      console.error('User not authenticated');
      return;
    }
    await saveProgress('lesson1', data);
  };
}
```

### ❌ WRONG: Forgetting to include JWT in requests
```javascript
// DON'T DO THIS
const response = await fetch('http://api/progress/session', {
  method: 'GET'
  // Missing headers with JWT!
});
```

### ✅ RIGHT: Use apiClient (automatically handles JWT)
```javascript
// DO THIS
const response = await apiClient.get('/progress/session');
// JWT is automatically added by apiClient
```

## Testing Checklist

- [ ] Verify user can see only their own progress
- [ ] Verify user can see only their own unlocked levels
- [ ] Verify level unlock only happens at ≥70% accuracy
- [ ] Verify each user's data doesn't leak to other users
- [ ] Verify JWT token is required for all endpoints
- [ ] Verify offline progress syncs correctly when back online
- [ ] Verify progress persists across app restarts
