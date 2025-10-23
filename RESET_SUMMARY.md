# 🎮 RESET & LOCK/UNLOCK SYSTEM - COMPLETE SUMMARY

## ✅ สิ่งที่เพิ่มเติม

### 1️⃣ Lock/Unlock System (≥70% Accuracy)
- ✅ **LevelStage1.js** (Beginner): Lesson 1 open → Lesson 2+ locked until L1 ≥70%
- ✅ **LevelStage2.js** (Intermediate): Lesson 1 open → Lesson 2+ locked until L1 ≥70%
- ✅ **LevelStage3.js** (Advanced): Lesson 1 open → Lesson 2+ locked until L1 ≥70%

### 2️⃣ Reset Options in Settings

#### ✅ Level-by-Level Reset
```
Settings → รีเซ็ตความคืบหน้า
├─ 🟢 Beginner       → Reset L1-L5 only
├─ 🔵 Intermediate   → Reset I1-I5 only
├─ 🟣 Advanced       → Reset A1-A5 only
```

#### ✅ Delete All (ลบทั้งหมด)
```
Settings → รีเซ็ตความคืบหน้า → ลบทั้งหมด
→ Clears all progress (all 3 levels)
→ Only L1 of Beginner remains accessible
```

#### ✅ ULTRA RESET (ลบโลกใหม่!)
```
Settings → รีเซ็ตความคืบหน้า → ลบโลกใหม่! (Orange button)
→ DELETE EVERYTHING:
   • All progress
   • All stats (XP, Diamonds, Hearts, Streak)
   • All unlocked levels
   • All saved games
   • ALL data
→ Result: Completely fresh start from Level 1, Lesson 1
```

---

## 🔐 Lock/Unlock Logic

### Current State
```
Beginner Level:
├─ L1: ✅ Current/Done
├─ L2: 🔒 Locked (need L1 ≥70%)
├─ L3: 🔒 Locked (need L2 ≥70%)
├─ L4: 🔒 Locked (need L3 ≥70%)
└─ L5: 🔒 Locked (need L4 ≥70%)

Intermediate Level:
├─ I1: ✅ Current/Done
├─ I2: 🔒 Locked (need I1 ≥70%)
├─ I3: 🔒 Locked (need I2 ≥70%)
├─ I4: 🔒 Locked (need I3 ≥70%)
└─ I5: 🔒 Locked (need I4 ≥70%)

Advanced Level:
├─ A1: ✅ Current/Done
├─ A2: 🔒 Locked (need A1 ≥70%)
├─ A3: 🔒 Locked (need A2 ≥70%)
├─ A4: 🔒 Locked (need A3 ≥70%)
└─ A5: 🔒 Locked (need A4 ≥70%)
```

### Unlock Condition
```
prevStage.finished && prevStage.accuracy >= 0.7 = UNLOCK NEXT
```

---

## 📂 Files Modified

```
Git Commits:
├─ 8d141eb: Disable DEBUG_UNLOCK_ALL_STAGES (enable lock system)
├─ e56671c: Enforce strict 70% accuracy for unlock
├─ d2b80dd: Add level-by-level reset UI
└─ 7b69efa: Add ULTRA RESET functionality

Code Changes:
├─ src/screens/LevelStage1.js (Beginner)
│  └─ Remove DEBUG_UNLOCK_ALL_STAGES checks
│  └─ Enforce 70% accuracy requirement
│
├─ src/screens/LevelStage2.js (Intermediate)
│  └─ Remove DEBUG_UNLOCK_ALL_STAGES checks
│  └─ Enforce 70% accuracy requirement
│
├─ src/screens/LevelStage3.js (Advanced)
│  └─ Remove DEBUG_UNLOCK_ALL_STAGES checks
│  └─ Enforce 70% accuracy requirement
│
├─ src/screens/SettingsScreen.js
│  ├─ Import resetEverything
│  ├─ handleResetBeginnerProgress()
│  ├─ handleResetIntermediateProgress()
│  ├─ handleResetAdvancedProgress()
│  ├─ handleResetAllProgress()
│  └─ handleUltraReset() ⭐ NEW
│
├─ src/services/progressService.js
│  ├─ resetAllLessonProgress()
│  ├─ resetLessonProgress(lessonId)
│  └─ resetEverything() ⭐ NEW
│
└─ src/services/levelUnlockService.js
   ├─ resetAllProgress()
   └─ resetLevelProgress(levelId)
```

---

## 🚀 How to Use

### For Testing
```
1. Open Settings (⚙️ icon on Home)
2. Scroll to "รีเซ็ตความคืบหน้า"
3. Choose:
   - "Beginner/Intermediate/Advanced" → Reset that level
   - "ลบทั้งหมด" → Reset all 3 levels
   - "ลบโลกใหม่!" → ULTRA RESET (everything)
4. Confirm 2x
5. Done! ✅
```

### For Fresh Start
```
Settings → รีเซ็ตความคืบหน้า → ลบโลกใหม่! → Confirm
↓
Level 1 - Only Lesson 1 Open
↓
Complete Lesson 1 with ≥70%
↓
Lesson 2 Unlocks ✨
```

---

## 🎯 Test Scenarios

### Scenario 1: Normal Unlock Flow
```
1. ✅ Play Lesson 1 → Score 80%
2. 🔓 Lesson 2 Unlocks
3. ✅ Play Lesson 2 → Score 65%
4. 🔒 Lesson 3 Stays Locked (need ≥70%)
5. 🔄 Retry Lesson 2 → Score 75%
6. 🔓 Lesson 3 Now Unlocks ✨
```

### Scenario 2: Reset One Level
```
1. Lessons 1-3 Completed (Beginner)
2. Settings → Reset Beginner
3. ✅ Lesson 1 Open
4. 🔒 Lessons 2-3 Locked Again
5. Can retry Lessons 2-3 if data was saved elsewhere
```

### Scenario 3: ULTRA RESET
```
1. Completed: Beginner + Intermediate partially + Advanced (nothing)
2. Settings → Reset Everything → ULTRA RESET
3. ⚠️  ALL DATA DELETED
4. 📊 Stats reset: XP=0, Diamonds=0, Streak=0
5. 🎮 Back to Level 1, Lesson 1 only
6. 🔒 All other lessons locked
```

---

## 📝 Code Highlights

### Lock Logic (LevelStage1.js)
```javascript
if (i === 0) {
  // First lesson always open
  return { ...s, status: s._finished ? 'done' : 'current' };
}

const prevPassed = prevFinished && prevAccuracyRatio >= 0.7;
// Unlock only if previous lesson passed with ≥70%

if (!statusFromProgress || statusFromProgress === 'locked') {
  statusFromProgress = prevPassed ? 'current' : 'locked';
}
```

### ULTRA RESET (progressService.js)
```javascript
export const resetEverything = async () => {
  const allKeys = await AsyncStorage.getAllKeys();
  const keysToDelete = allKeys.filter(key => 
    key.includes('progress') || 
    key.includes('lesson') ||
    key.includes('unlock') ||
    // ... etc
  );
  await AsyncStorage.multiRemove(keysToDelete);
  // Sync to backend
};
```

### Reset Handler (SettingsScreen.js)
```javascript
const handleUltraReset = async () => {
  Alert.alert('🔥 ULTRA RESET...', '⚠️ Delete everything?', [
    { text: 'Cancel', style: 'cancel' },
    { 
      text: 'Reset Everything',
      onPress: async () => {
        await resetEverything();
        alert('✅ ULTRA RESET Complete!');
      },
      style: 'destructive'
    }
  ]);
};
```

---

## ✨ Features Summary

| Feature | Beginner | Intermediate | Advanced |
|---------|----------|--------------|----------|
| L1 Always Open | ✅ | ✅ | ✅ |
| 70% Unlock Rule | ✅ | ✅ | ✅ |
| Level-by-Level Reset | ✅ | ✅ | ✅ |
| Delete All Option | ✅ | ✅ | ✅ |
| ULTRA RESET | ✅ (All 3 levels) | | |

---

## 🔄 Data Flow

```
User plays Lesson → Finish with Score
           ↓
ConsonantStage1Game.js
           ↓
checkAndUnlockNextLevel(levelId, {accuracy, score})
           ↓
levelUnlockService.checkAndUnlockNextLevel()
           ↓
If accuracy ≥ 70% → Set next level status to 'current'
Else → Keep next level status as 'locked'
           ↓
LevelStage1.js re-fetches data
           ↓
Renders with updated lock states ✨
```

---

## 🎉 Status: COMPLETE

All lock/unlock and reset systems are fully functional and tested.

**Last Updated**: Commit `7b69efa`
**Version**: 2.0.0
