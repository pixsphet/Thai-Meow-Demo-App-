# 🚀 Places & Location Lesson - Quick Start Guide

## What Was Created?

### 3 New/Updated Files:
1. **IntermediatePlacesGame.js** - Main game screen (920 lines)
2. **IntermediatePlacesResult.js** - Results screen (450 lines)
3. LevelStage2.js + BottomTabNavigator.js - Navigation integration

### 2 Previously Created Files (Already Done):
- `src/data/places_vocab.json` - 50 vocabulary items
- `src/utils/placesQuestionGenerator.js` - Question factory

---

## How to Test?

### Step 1: Run the app
```bash
npm start
# or
expo start
```

### Step 2: Navigate to Places lesson
1. From home screen → Tap "Intermediate" tab
2. Scroll to find "Places & Location (ด่าน 3)" card
3. Tap the card to start

### Step 3: Play through a game
- Read the start screen (lesson description)
- Tap "เริ่มเล่น" (Start Playing)
- Answer 14 questions mixing 5 types:
  - 🎧 Listen & Choose
  - 🖼️ Picture Match
  - 🔄 Translation Match
  - 💬 Fill Dialog
  - 📍 Direction Flow (Arrange steps)
- See results with stats

---

## What Question Types Do What?

| Type | Action | Example |
|------|--------|---------|
| **LISTEN_CHOOSE** | Tap speaker → hear Thai → pick from 4 | Hear "โรงแรม" → tap "Hotel" |
| **PICTURE_MATCH** | See emoji/picture → select Thai name | See 🏫 → tap "โรงเรียน" |
| **TRANSLATE_MATCH** | Tap Thai, then English to pair them | Tap "ร้านอาหาร", then "Restaurant" |
| **FILL_BLANK_DIALOG** | Read conversation, fill missing word | "ฉันอยู่ที่ ___" → tap "บ้าน" (home) |
| **DIRECTION_FLOW** | Pick direction steps in correct order | "To the hotel:" tap steps in order |

---

## Game Mechanics at a Glance

```
Starting State:
  ❤️ Hearts: 5
  🔥 Streak: 0
  ⭐ XP: 0
  💎 Diamonds: 0
  📊 Accuracy: 0%

Per Correct Answer:
  ⭐ +10 XP
  💎 +1 Diamond
  🔥 Streak +1
  📊 Accuracy recalculated

Per Wrong Answer:
  ❤️ Hearts -1
  🔥 Streak resets to 0

Game Over When:
  ✓ 14 questions answered, OR
  ✓ Hearts reach 0

Win Condition:
  🎉 ≥70% accuracy = Unlock next lesson
  🎉 Milestone streaks (5,10,20,30,50,100) = Special alert!
```

---

## File Locations

```
src/
├── screens/
│   ├── IntermediatePlacesGame.js          ✅ NEW
│   ├── IntermediatePlacesResult.js        ✅ NEW
│   └── LevelStage2.js                     ✅ UPDATED
├── utils/
│   └── placesQuestionGenerator.js         ✅ (existing)
├── data/
│   └── places_vocab.json                  ✅ (existing)
└── navigation/
    └── BottomTabNavigator.js              ✅ UPDATED

INTERMEDIATE3_PLACES_COMPLETE.md           ✅ Documentation
PLACES_QUICK_START.md                      ✅ This file
```

---

## Key Code Sections

### In IntermediatePlacesGame.js:

**Start Game:**
```javascript
handleStartGame = async () => {
  setGameStarted(true);
  // Questions load, HUD displays, question loop begins
}
```

**Answer Checking:**
```javascript
const isCorrect = checkAnswer(currentQuestion, currentAnswer);
// True → score up, streak up, XP up
// False → hearts down, streak reset
```

**Game Over:**
```javascript
const accuracyPercent = (score / questions.length) * 100;
const unlockedNext = accuracyPercent >= 70;
// Navigate to IntermediatePlacesResult
```

---

## Customization Examples

### Change unlock threshold:
In `IntermediatePlacesGame.js`, line ~240:
```javascript
const unlockedNext = accuracyPercent >= 70; // Change 70 to 80, 60, etc.
```

### Change XP per question:
In `IntermediatePlacesGame.js`, line ~180:
```javascript
const newXp = xpEarned + 10; // Change 10 to 15, 5, etc.
```

### Change number of hearts:
In `IntermediatePlacesGame.js`, line ~90:
```javascript
const [hearts, setHearts] = useState(5); // Change 5 to 3, 10, etc.
```

---

## Troubleshooting

### Issue: Places lesson doesn't show in LevelStage2
**Solution:** Check that `CUSTOM_STAGE_META` in LevelStage2.js has:
```javascript
3: {
  lesson_id: 3,
  title: 'สถานที่ (Places & Location)',
  ...
}
```

### Issue: TTS audio doesn't play
**Solution:** Check `vaja9TtsService` is initialized and has internet access

### Issue: Questions look different from Emotions
**Solution:** They use same template - check `placesQuestionGenerator.js` for type definitions

### Issue: Results screen shows "ไม่พบข้อมูลผลการเรียน"
**Solution:** Make sure `resultData` is passed from game screen via navigation params

---

## What's Different from Emotions Lesson?

| Feature | Emotions | Places |
|---------|----------|--------|
| Question Types | 6 types | 5 types (no EMOJI_MATCH or TONE_PICK) |
| Special Type | EMOJI_MATCH | **DIRECTION_FLOW** (new!) |
| Vocab Items | 40 | 50 |
| Categories | Emotions, Intensifiers, Phrases | Places, Directions, Phrases |
| Theme Color | Orange | Orange (same) |

---

## Next Steps (Optional)

1. **Backend Sync:** Create MongoDB seed for Places vocab
2. **Lesson 4:** Create Intermediate Level 4 lesson using same pattern
3. **Challenges:** Daily challenges using Places vocabulary
4. **Reviews:** Vocabulary review mode between lessons
5. **Mini-games:** Word search with place names

---

## Support

For questions or issues:
1. Check `INTERMEDIATE3_PLACES_COMPLETE.md` for full documentation
2. Review `IntermediateEmotionsGame.js` for comparison (template source)
3. Check console logs for error messages
4. Verify all imports are correct

---

**Happy coding! 🎉**

*The Places & Location lesson is fully integrated and ready to use.*
