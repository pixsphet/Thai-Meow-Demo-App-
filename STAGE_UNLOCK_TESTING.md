# 🧪 Stage Unlock System - Testing Guide

## Quick Start

```bash
cd /Users/n.phet/Documents/Thai-Meow
npx expo start --clear
# Then scan QR code on your device or select 'i' for iOS simulator
```

## Testing Scenarios

### ✅ Test 1: First Stage Always Unlocked

**Objective**: Verify that Stage 1 is ALWAYS unlocked (status: 'current') regardless of progress

**Steps**:
1. Open app → Go to Home Screen
2. Click "🐱 Beginner (Level 1)"
3. Look at Stage 1: "พยัญชนะพื้นฐาน ก-ฮ"

**Expected Result**:
- Status badge shows: `▶️ Current` (blue)
- Stage card is NOT grayed out
- Card is clickable and can start the game

**Console Output**:
```
📍 Stage 1 (First): พยัญชนะพื้นฐาน ก-ฮ - Status: current
```

---

### ✅ Test 2: Stage 2 Locked Initially

**Objective**: Verify that Stage 2 is locked until Stage 1 is completed

**Steps**:
1. DON'T play Stage 1 yet
2. Look at Stage 2: "สระ 32 ตัว"

**Expected Result**:
- Status badge shows: `🔒 Locked` (gray)
- Stage card is grayed out (opacity: 0.5)
- Card is NOT clickable
- Clicking it shows alert: "Complete the previous stage to unlock this one."

**Console Output**:
```
📍 Stage 2 (Locked): สระ 32 ตัว - Status: locked (prev accuracy: 0%)
```

---

### ✅ Test 3: Stage 2 Unlocks After Stage 1 Completion (>= 70%)

**Objective**: Verify that Stage 2 unlocks when Stage 1 reaches 70% accuracy

**Steps**:
1. Click on Stage 1: "พยัญชนะพื้นฐาน ก-ฮ"
2. Complete the game (answer questions until you get ~70% accuracy)
3. Finish the game
4. Go back to Level 1 (click back or navigate back)

**Expected Result**:
- Go back to Beginner level
- Stage 1 now shows: `✅ Done` (green)
- Stage 2 now shows: `▶️ Current` (blue) - UNLOCKED!
- You can now click on Stage 2

**Console Output**:
```
📍 Stage 1 (First): พยัญชนะพื้นฐาน ก-ฮ - Status: done
📍 Stage 2 (Unlocked): สระ 32 ตัว - Status: current
```

---

### ✅ Test 4: Debug Flag Override (Stage 3)

**Objective**: Verify that the DEBUG flag forces Stage 3 unlock in Level 1

**Current State**: `DEBUG_UNLOCK_STAGE_3_GREETINGS = true`

**Steps**:
1. Open Level 1 Beginner
2. Look at Stage 3: "คำทักทาย"

**Expected Result**:
- Stage 3 shows: `▶️ Current` (blue) - UNLOCKED (even if Stage 2 not completed!)
- You can click and play this stage
- This is for testing/demo purposes only

**Console Output**:
```
📍 Stage 3 (Debug unlock): คำทักทาย - Status: current
```

**Note**: When ready for production, change line 21 in `LevelStage.js`:
```javascript
const DEBUG_UNLOCK_STAGE_3_GREETINGS = false;  // Disable debug mode
```

---

### ✅ Test 5: Level Selection (Manual Fallback)

**Objective**: Verify that if levelId is not passed, user can manually select level

**Steps** (Simulate missing levelId):
1. Modify navigation to NOT pass levelId: `navigation.navigate('LevelStage')`
2. LevelStage screen loads
3. Should see: "Select a Level" with three buttons

**Expected Result**:
- Shows "Select a Level" screen
- Three buttons: Beginner, Intermediate, Advanced
- Clicking any button shows that level's stages
- Go Back button returns to Home

**Console Output**:
```
🎯 LevelStage Component Debug:
   paramLevelId: undefined
   selectedLevelId: null
   levelId: null
   levelConfig exists: false
```

---

### ✅ Test 6: All Three Levels Display Correctly

**Objective**: Verify all levels have correct stages

**Steps**:
1. Test Level 1 (Beginner) - 5 stages
2. Test Level 2 (Intermediate) - 5 stages
3. Test Level 3 (Advanced) - 5 stages

**Expected Results**:

**Level 1 - Beginner:**
- Stage 1: พยัญชนะพื้นฐาน ก-ฮ (ConsonantStage1Game)
- Stage 2: สระ 32 ตัว (VowelStage2Game)
- Stage 3: คำทักทาย (GreetingStage3Game)
- Stage 4: สิ่งของรอบตัว (Lesson4ObjectsGame)
- Stage 5: ร่างกาย (Lesson5BodyGame)

**Level 2 - Intermediate:**
- Stage 1: อาหารและเครื่องดื่ม (Intermediate1FoodDrinksGame)
- Stage 2: อารมณ์และความรู้สึก (IntermediateEmotionsGame)
- Stage 3: สถานที่ทั่วไป (IntermediatePlacesGame)
- Stage 4: กิจวัตรประจำวัน (IntermediateRoutinesGame)
- Stage 5: การเดินทาง (IntermediateTransportGame)

**Level 3 - Advanced:**
- Stage 1: สำนวนไทย (Advanced1IdiomsGame)
- Stage 2: อาชีพ (Advanced2OccupationsGame)
- Stage 3: ทิศทาง (Advanced3DirectionsGame)
- Stage 4: กริยากำลังด้ำเนิน (Advanced4ComplexVerbsGame)
- Stage 5: ความคิดเห็น (Advanced5OpinionsGame)

---

### ✅ Test 7: Progress Persistence

**Objective**: Verify progress is saved and restored correctly

**Steps**:
1. Complete Stage 1 Beginner (80% accuracy)
2. Close app completely
3. Reopen app
4. Navigate to Level 1 Beginner

**Expected Result**:
- Stage 1 still shows: ✅ Done (80% accuracy)
- Stage 2 still shows: ▶️ Current (unlocked)
- Progress is preserved across app restarts

---

### ✅ Test 8: Console Debugging

**Objective**: Verify debug logs appear in console

**Steps**:
1. Open Level 1 Beginner
2. Open Xcode console or device console
3. Watch for debug messages

**Expected Console Output**:
```
🎯 LevelStage Component Debug:
   paramLevelId: 1
   selectedLevelId: null
   levelId: 1
   levelConfig exists: true

📍 Stage 1 (First): พยัญชนะพื้นฐาน ก-ฮ - Status: current
📍 Stage 2 (Locked): สระ 32 ตัว - Status: locked (prev accuracy: 0%)
📍 Stage 3 (Debug unlock): คำทักทาย - Status: current
📍 Stage 4 (Locked): สิ่งของรอบตัว - Status: locked (prev accuracy: 0%)
📍 Stage 5 (Locked): ร่างกาย - Status: locked (prev accuracy: 0%)
✅ Loaded 5 stages for Level 1
```

---

## Edge Cases to Test

### Case 1: Stage with < 70% Accuracy
- Complete a stage with 65% accuracy
- Next stage should remain LOCKED
- Console shows: "prev accuracy: 65%"

### Case 2: Navigation Back
- Play a stage
- Go back to level screen
- Stage progress should be updated
- Check console for latest status

### Case 3: Multiple Level Switches
- Go to Level 1 → Go back → Go to Level 2 → Go back → Go to Level 1
- Each level should load fresh without data mixing
- Console should show correct levelId for each

### Case 4: Rapidly Clicking Buttons
- Click multiple level buttons quickly
- App should handle gracefully without crashes
- Should eventually settle on last clicked level

---

## Troubleshooting

### Issue: All stages showing as locked
**Solution**: 
- Check `DEBUG_UNLOCK_STAGE_3_GREETINGS` flag
- Verify Stage 1 status in console
- Check AsyncStorage has valid progress data

### Issue: Stage 1 shows as locked
**Solution**: This should NEVER happen!
- Check line 273-275 in LevelStage.js
- Verify `if (index === 0)` logic
- File a bug if this occurs

### Issue: Clicking stage does nothing
**Solution**:
- Check console for navigation errors
- Verify gameScreen property in LEVEL_CONFIG
- Check if game component exists and is registered

### Issue: Progress not saving
**Solution**:
- Check AsyncStorage keys match
- Verify game save logic in each game component
- Check for console errors after finishing game

---

## Performance Notes

- Stage loading should complete in < 500ms
- Async progress fetching happens in parallel
- Console output helps identify slow stages
- Monitor memory usage when switching levels frequently
