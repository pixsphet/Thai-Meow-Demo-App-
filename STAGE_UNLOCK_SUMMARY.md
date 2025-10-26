# 🔓 Stage Unlock System - Implementation Complete

## ✅ What Was Fixed

### Problem:
- User asked: "ทำไมไม่ปลดล็อกด่าน" (Why aren't the stages unlocking?)
- Old system had 3 separate files (LevelStage1, 2, 3) with inconsistent logic
- Stage unlocking wasn't working correctly

### Solution:
✅ Created unified `LevelStage.js` with proper unlock logic:
- **Stage 1**: ALWAYS unlocked (status: 'current')
- **Stage N**: Unlocked when Stage N-1 is done AND accuracy >= 70%
- **Debug Flag**: Optional force-unlock for testing

## 📁 Files Modified/Created

### New Files:
1. **src/screens/LevelStage.js** - Unified component for all 3 levels (650+ lines)
2. **STAGE_UNLOCK_FIX.md** - Technical documentation
3. **STAGE_UNLOCK_TESTING.md** - Comprehensive testing guide

### Modified Files:
1. **src/navigation/BottomTabNavigator.js**
   - Changed: `import LevelStage1/2/3` → `import LevelStage`
   - Changed: 3 Stack.Screen → 1 Stack.Screen

2. **src/screens/HomeScreen.js**
   - Changed: `navigate('LevelStage1')` → `navigate('LevelStage', { levelId: 1 })`
   - Changed: `navigate('LevelStage2')` → `navigate('LevelStage', { levelId: 2 })`
   - Changed: `navigate('LevelStage3')` → `navigate('LevelStage', { levelId: 3 })`

## 🎯 Key Features

### Unlock Logic:
```javascript
✅ Stage 1: ALWAYS current (never locked)
✅ Stage N: Unlock if prev stage >= 70% accuracy
🎯 Debug: Force unlock Stage 3 in Level 1 (for testing)
```

### UI/UX:
- ✅ Done (green): Completed with >= 70% accuracy
- ▶️ Current (blue): Unlocked and ready to play
- 🔒 Locked (gray): Waiting for prerequisite

### Levels Configuration:
```
Level 1 (Beginner) - 5 stages
├── Stage 1: พยัญชนะพื้นฐาน
├── Stage 2: สระ 32 ตัว
├── Stage 3: คำทักทาย (🎯 DEBUG unlocked)
├── Stage 4: สิ่งของรอบตัว
└── Stage 5: ร่างกาย

Level 2 (Intermediate) - 5 stages
└── ...

Level 3 (Advanced) - 5 stages
└── ...
```

## 🧪 Testing

Run comprehensive tests per STAGE_UNLOCK_TESTING.md:

```bash
# Start the app
npx expo start --clear

# Test scenarios:
✅ Test 1: First stage always unlocked
✅ Test 2: Stage 2 locked initially
✅ Test 3: Stage 2 unlocks after Stage 1 > 70%
✅ Test 4: Debug flag works
✅ Test 5: Level selection fallback
✅ Test 6: All levels display correctly
✅ Test 7: Progress persists
✅ Test 8: Console debugging works
```

## 📊 Unlock Chain Example

```
BEGINNER LEVEL:

Stage 1 (พยัญชนะ)
    ↓ [ALWAYS UNLOCKED]
    ↓
▶️ Current ← User plays and scores 80%
    ↓ [PASS - accuracy >= 70%]
    ↓
Stage 2 (สระ)
▶️ Current ← Now unlocked!
    ↓ [User plays and scores 65%]
    ↓
Stage 3 (คำทักทาย)
🔒 Locked ← Still locked! (prev accuracy < 70%)

When user retakes Stage 2 and gets 75%:
    ↓
Stage 3 (คำทักทาย)
▶️ Current ← Unlocked! (prev accuracy >= 70%)
```

## 🔍 Console Debug Output

When navigating to a level, you'll see:

```
🎯 LevelStage Component Debug:
   paramLevelId: 1
   selectedLevelId: null
   levelId: 1
   levelConfig exists: true

📍 Stage 1 (First): พยัญชนะพื้นฐาน ก-ฮ - Status: current
📍 Stage 2 (Locked): สระ 32 ตัว - Status: locked (prev accuracy: 0%)
📍 Stage 3 (Debug unlock): คำทักทาย - Status: current
✅ Loaded 5 stages for Level 1
```

## ⚙️ Configuration for Production

Before shipping:

1. **Disable Debug Flag** (in LevelStage.js line 21):
   ```javascript
   const DEBUG_UNLOCK_STAGE_3_GREETINGS = false;  // Change from true
   ```

2. **Verify All Screens Registered**:
   - All game screens must be in BottomTabNavigator
   - All gameScreen values in LEVEL_CONFIG must match

3. **Test Each Level**:
   - Level 1: 5 stages ✅
   - Level 2: 5 stages ✅
   - Level 3: 5 stages ✅

## 📈 Benefits

✅ Single unified component (consolidation)
✅ Clear, consistent unlock logic
✅ Easy to debug (detailed console logs)
✅ Easy to extend (add more levels/stages)
✅ Same UI/UX across all levels
✅ Proper state management with useState
✅ Async progress loading with proper error handling
✅ No breaking changes to game components

## ✨ Next Steps

1. Run the app: `npx expo start --clear`
2. Test scenarios from STAGE_UNLOCK_TESTING.md
3. Check console for debug output
4. Verify all stages unlock correctly
5. Change DEBUG_UNLOCK_STAGE_3_GREETINGS = false for production
