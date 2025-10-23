# 🎮 Intermediate Level - Complete Testing Guide

## ✅ Verified Components

### 1. Game Display & Navigation ✅
- [x] All 5 lessons appear in LevelStage2
- [x] Lessons display as circles with proper metadata
- [x] Circle click → correct game screen opens
- [x] Back button returns to LevelStage2

### 2. Navigation Routes ✅
- [x] Intermediate1FoodDrinksGame registered
- [x] IntermediateEmotionsGame registered
- [x] IntermediatePlacesGame registered
- [x] IntermediateRoutinesGame registered
- [x] IntermediateTransportGame registered
- [x] IntermediateResultScreen (generic result) registered

### 3. Question Types & Game Flow ✅

#### Lesson 1: Food & Drinks
- [x] LISTEN_CHOOSE (Lottie speaker icon)
- [x] PICTURE_MATCH (emoji display)
- [x] TRANSLATE_MATCH (drag-match Thai ↔ English)
- [x] FILL_BLANK_DIALOG (multiple choice)
- [x] ORDER_FLOW (arrange sequence)

#### Lesson 2: Emotions & Feelings
- [x] LISTEN_CHOOSE
- [x] PICTURE_MATCH
- [x] TRANSLATE_MATCH
- [x] FILL_BLANK_DIALOG
- [x] EMOJI_MATCH
- [x] TONE_PICK

#### Lesson 3: Places & Location
- [x] LISTEN_CHOOSE
- [x] PICTURE_MATCH
- [x] TRANSLATE_MATCH
- [x] FILL_BLANK_DIALOG
- [x] DIRECTION_FLOW (new type)

#### Lesson 4: Daily Routines
- [x] LISTEN_CHOOSE
- [x] TRANSLATE_MATCH
- [x] ARRANGE_SENTENCE
- [x] FILL_BLANK_DIALOG
- [x] TIMELINE_ORDER (new type)

#### Lesson 5: Transportation
- [x] LISTEN_CHOOSE
- [x] PICTURE_MATCH
- [x] TRANSLATE_MATCH
- [x] FILL_BLANK_DIALOG
- [x] ARRANGE_SENTENCE

### 4. Game Features ✅

#### HUD (Heads-Up Display)
- [x] Hearts indicator (Lottie animation)
  - Starts: 5 hearts
  - Wrong answer: -1 heart
  - Game over: 0 hearts
  
- [x] XP counter (Lottie Star animation)
  - Correct answer: +10 XP
  - Updates in real-time
  
- [x] Diamonds (Lottie Diamond animation)
  - Correct answer: +1 diamond
  - Updates in real-time
  
- [x] Streak (Lottie Fire animation)
  - Continuous correct: +1 streak
  - Wrong answer: resets to 0
  
- [x] Progress bar
  - Shows question progress (X / total)
  - Updates per question

#### Accuracy Tracking
- [x] Starts at 0%
- [x] Calculates after first answer
- [x] Updates in real-time: (correct / currentIndex) * 100
- [x] Displayed in HUD
- [x] Used for unlock criteria (≥70%)

#### TTS (Text-to-Speech)
- [x] vaja9TtsService imported
- [x] Plays on speaker icon click
- [x] Works for LISTEN_CHOOSE questions
- [x] Works for TRANSLATE_MATCH items

#### Auto-Save & Resume
- [x] Saves progress per question
- [x] Restores from last position
- [x] Uses progressService (AsyncStorage)

#### Unlock Logic
- [x] Accuracy ≥ 70% = next level unlocked
- [x] levelUnlockService.checkAndUnlockNextLevel()
- [x] Lesson 1 always playable (first lesson)
- [x] Subsequent lessons need 70% from previous
- [x] Locked UI shows alert when tapped

---

## 🧪 Manual Testing Steps

### Step 1: Game Display
1. Open app
2. Go to Home → Intermediate Level → Level 2
3. **EXPECT:** See 5 circles (Food, Emotions, Places, Routines, Transport)
4. **VERIFY:** ✅ All circles visible and centered

### Step 2: Game Launch
1. Tap Circle 1 (Food & Drinks)
2. **EXPECT:** Game screen opens with intro
3. Tap "เริ่มเล่น" (Start button)
4. **EXPECT:** Question 1 appears

### Step 3: Question Types (Food & Drinks)
1. **LISTEN_CHOOSE:**
   - Tap speaker icon
   - Select matching food name
   - Tap CHECK → should be correct
   
2. **PICTURE_MATCH:**
   - See emoji
   - Select matching name
   - Tap CHECK
   
3. **TRANSLATE_MATCH:**
   - Tap Thai word on left
   - Tap English word on right
   - Complete all 4 pairs
   - Tap CHECK
   
4. **FILL_BLANK_DIALOG:**
   - See dialog template with blank
   - Select correct word
   - Tap CHECK
   
5. **ORDER_FLOW:**
   - See word bank
   - Tap words to arrange sequence
   - Tap CHECK

### Step 4: HUD Verification
During gameplay:
- [x] Hearts decrease on wrong answer (initially 5)
- [x] XP increases on correct answer (by 10s)
- [x] Diamonds increase on correct answer (by 1s)
- [x] Streak shows continuous correct answers
- [x] Progress bar fills as you advance

### Step 5: Accuracy Test
1. Play 5 questions
2. Get 3 correct, 2 wrong
3. **EXPECT:** Accuracy = (3/5) * 100 = 60%
4. **VERIFY:** HUD shows ~60%

### Step 6: Result Screen
1. Finish all questions (or game over)
2. **EXPECT:** Navigate to IntermediateResult
3. **VERIFY:**
   - Final score displayed
   - XP/Diamonds/Hearts/Streak shown
   - Accuracy % visible
   - Unlock status (≥70% = ✅)
   - Buttons: Back to Stage / Next Lesson (if ≥70%)

### Step 7: Unlock Logic
1. Complete Lesson 1 with <70% accuracy
2. Try to open Lesson 2
3. **EXPECT:** Alert "ยังไม่ปลดล็อก"
4. Return to Lesson 1, score ≥70%
5. Lesson 2 should now be playable

---

## 🔍 Debug Console Checks

Open React Native console and check for:

```
✅ "🔄 Starting to fetch stages..."
✅ "✅ Successfully fetched stages from API:" or "✅ Stages with progress (fallback):"
✅ "Navigating to lesson screen with lessonId: 1" (when tapping lesson)
✅ No error messages in console
❌ "Error" or "undefined" = Problem!
```

---

## 📋 Checklist Before Release

- [x] All 5 games appear in LevelStage2
- [x] Game launch works from all 5 lessons
- [x] All question types render correctly
- [x] Answer checking works accurately
- [x] HUD updates in real-time
- [x] TTS plays on demand
- [x] Accuracy calculates correctly
- [x] Result screen shows all stats
- [x] Unlock logic blocks locked levels
- [x] Auto-save restores progress
- [x] No linting errors
- [x] No console warnings

---

## 🚀 Deployment Ready!

All components verified. Ready for:
- ✅ Production testing
- ✅ User acceptance testing
- ✅ Store deployment

---

**Last Updated:** Oct 22, 2025
**Status:** ✅ READY FOR PRODUCTION
