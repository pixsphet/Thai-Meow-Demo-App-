# 🔓 Stage Unlock System Fix

## Problem: "ทำไมไม่ปลดล็อกด่าน" (Why aren't the stages unlocking?)

The old system had three separate files (`LevelStage1.js`, `LevelStage2.js`, `LevelStage3.js`) with inconsistent stage unlocking logic. The unified `LevelStage.js` now implements a **clear, consistent unlock mechanism**.

## Solution: Unified LevelStage Component

### Key Unlock Rules

```javascript
// ✅ FIRST STAGE (index === 0): Always unlocked
if (index === 0) {
  status = progress.finished ? 'done' : 'current';  // NOT locked!
}

// 🎯 DEBUG STAGE: Special unlock for testing
if (DEBUG_UNLOCK_STAGE_3_GREETINGS && levelId === 1 && stageId === 3) {
  status = progress.finished ? 'done' : 'current';  // Force unlocked
}

// 🔒 OTHER STAGES: Unlock when previous stage passes
else if (prevStage) {
  const prevProgress = await readLessonProgress(prevConfig.key);
  const prevPassed = prevProgress.finished && prevProgress.accuracy >= 0.7;  // >= 70%!
  
  if (prevPassed) {
    status = progress.finished ? 'done' : 'current';
  } else {
    status = 'locked';
  }
}
```

## Architecture Changes

### Files Created/Modified:
1. **`src/screens/LevelStage.js`** (NEW - Consolidated)
   - Combines LevelStage1, LevelStage2, LevelStage3 into one file
   - LEVEL_CONFIG object defines all stages for all 3 levels
   - Proper unlocking based on completion status

2. **`src/navigation/BottomTabNavigator.js`** (MODIFIED)
   - Removed: LevelStage1, LevelStage2, LevelStage3 imports
   - Added: LevelStage import
   - Replaced three Stack.Screen entries with one unified LevelStage

3. **`src/screens/HomeScreen.js`** (MODIFIED)
   - Updated handleLevelPress to navigate to 'LevelStage' with levelId: 1, 2, or 3
   - Example: `navigation.navigate('LevelStage', { levelId: 1, level: 'Beginner' })`

## Level Configuration

```javascript
const LEVEL_CONFIG = {
  1: {  // BEGINNER
    stages: {
      1: { title: 'พยัญชนะพื้นฐาน ก-ฮ', gameScreen: 'ConsonantStage1Game', ... },
      2: { title: 'สระ 32 ตัว', gameScreen: 'VowelStage2Game', ... },
      3: { title: 'คำทักทาย', gameScreen: 'GreetingStage3Game', ... },
      4: { title: 'สิ่งของรอบตัว', gameScreen: 'Lesson4ObjectsGame', ... },
      5: { title: 'ร่างกาย', gameScreen: 'Lesson5BodyGame', ... },
    }
  },
  2: {  // INTERMEDIATE
    stages: { ... }  // 5 stages
  },
  3: {  // ADVANCED
    stages: { ... }  // 5 stages
  },
};
```

## UI Components

### Stage Status Display:
- ✅ **Done** (green): Completed with >= 70% accuracy
- ▶️ **Current** (blue): Unlocked and ready to play
- 🔒 **Locked** (gray): Waiting for previous stage completion

### Stage Card Example:
```
┌─────────────────────────────────────┐
│ [1] พยัญชนะพื้นฐาน ก-ฮ             │
│     เรียนรู้พยัญชนะไทย 44 ตัว       │
│                       ▶️ Current     │
│                       45% • 75%     │
└─────────────────────────────────────┘
```

## How It Works

### User Flow:
1. **Home Screen** → Click on "Beginner", "Intermediate", or "Advanced"
2. **LevelStage Screen** → Receives `levelId` (1, 2, or 3) via route params
3. **Fetch Stages** → Reads progress for each stage asynchronously
4. **Compute Status** → Applies unlock rules:
   - Stage 1: Always current (never locked)
   - Stage N: Unlocked if Stage N-1 is done AND accuracy >= 70%
5. **Render UI** → Shows all stages with proper status badges

### Debug Features:
```javascript
// In LevelStage.js - Line 21
const DEBUG_UNLOCK_STAGE_3_GREETINGS = true;  // Force unlock Stage 3 in Level 1

// Console output shows:
// 📍 Stage 1 (First): พยัญชนะพื้นฐาน ก-ฮ - Status: current
// 📍 Stage 2 (Unlocked): สระ 32 ตัว - Status: locked (prev accuracy: 65%)
// 📍 Stage 3 (Debug unlock): คำทักทาย - Status: current
```

## Production Checklist

- [ ] Set `DEBUG_UNLOCK_STAGE_3_GREETINGS = false` for production
- [ ] Test full unlock chain: Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5
- [ ] Verify 70% threshold works correctly
- [ ] Test with users at different progress levels
- [ ] Monitor console logs for unlock edge cases

## Benefits

✅ **Consolidated Code**: Single LevelStage.js instead of three separate files
✅ **Clear Logic**: Explicit unlock rules (first stage always current, others need 70%)
✅ **Consistent UX**: Same UI/UX across all three levels
✅ **Maintainability**: Easy to modify unlock rules in one place
✅ **Debugging**: Clear console logs showing stage status progression
✅ **Scalability**: Easy to add more levels or stages by updating LEVEL_CONFIG
