# 🎯 Greeting Stage Demo Guide

## ✨ What's New

**Stage 3: คำทักทาย (Greetings)** is now available in **Level 1 - Beginner** with:

- ✅ **14 interactive questions** with 6 different question types
- ✅ **18+ greeting images** from `/src/add/Greetings & Common Phrases/`
- ✅ **Full TTS support** (Thai pronunciation)
- ✅ **Greeting phrase examples** and dialogue practice
- ✅ **CHECK/NEXT button flow** with feedback system
- ✅ **Hearts, XP, Diamonds system** with accuracy tracking

---

## 🎮 Question Types (6 Types)

| Type | Questions | Description |
|------|-----------|-------------|
| 🎧 **LISTEN_CHOOSE** | 4 | ฟังเสียงแล้วเลือกคำที่ได้ยิน |
| 🖼️ **PICTURE_MATCH** | 3 | ดูภาพแล้วเลือกคำให้ตรง |
| 🔗 **TH_EN_MATCH** | 2 | จับคู่ไทย ↔ English |
| 💬 **PHRASE_GAP** | 2 | เติมคำในบทสนทนา |
| 🧩 **ORDER_TILES** | 2 | เรียงบัตรคำเป็นวลี |
| ⚡ **QUICK_AB** | 1 | ฟังเสียง เลือก A/B เร็ว |
| **Total** | **14** | |

---

## 🚀 How to Access

### Option 1: From HomeScreen
```
1. Tap "Level 1 - Beginner" card on HomeScreen
2. Scroll down to "คำทักทาย" (Stage 3)
3. Tap to start playing
```

### Option 2: Test Navigation
```javascript
// In code
navigation.navigate('LevelStage', { levelId: 1 });
// Then select Stage 3 from the list
```

---

## 🎓 Stage Unlocking

**ℹ️ Current Setup:**
- Stage 1 (Consonants) & Stage 2 (Vowels): Always available (first stages)
- Stage 3 (Greetings): **DEBUG ENABLED** - Available immediately for demo ✅
- Stage 4 & 5: Locked until Stage 3 is completed with ≥70% accuracy

**To Disable Demo Mode:**
Edit `/src/screens/LevelStage.js` line 22:
```javascript
const DEBUG_UNLOCK_STAGE_3_GREETINGS = false; // Disable demo
```

---

## 📊 Game System Features

### Stats Display
- 🔴 **Hearts**: Start with 5 hearts (-1 per wrong answer)
- ⭐ **XP**: +15 per correct answer
- 💎 **Diamonds**: +1 per correct answer
- 📈 **Accuracy**: Calculated after first answer

### Feedback System
**Two-Phase Flow:**
1. **CHECK Phase**: User submits answer
   - Shows ✅ Correct / ❌ Wrong feedback
2. **NEXT Phase**: User can proceed
   - Shows next question or completion screen

### Game Completion
- **70% Accuracy**: Unlocks next stage
- **Below 70%**: Can replay
- **Hearts = 0**: Must buy hearts to continue

---

## 🖼️ Sample Questions

### LISTEN_CHOOSE (ฟังเสียง)
```
Instruction: ฟังเสียงแล้วเลือกคำที่ได้ยิน
Audio: "สวัสดี"
Choices:
  ☐ สวัสดี ✅
  ☐ ขอโทษ
  ☐ ลาก่อน
  ☐ ยินดี
```

### PICTURE_MATCH (ดูรูป)
```
Instruction: ดูภาพแล้วเลือกคำให้ตรง
Image: [สวัสดี greeting image]
Choices:
  ☐ สวัสดี ✅
  ☐ ลาก่อน
  ☐ ไม่เป็นไร
  ☐ ยินดี
```

### TH_EN_MATCH (จับคู่)
```
Instruction: จับคู่คำไทยกับความหมายภาษาอังกฤษ
Left Side:
  ➡️ สบายดีไหม
  ➡️ ไม่เป็นไร
  ➡️ ลาก่อน

Right Side:
  ⬅️ how are you
  ⬅️ no problem
  ⬅️ goodbye
```

---

## 📱 How to Test

### Prerequisites
```bash
# 1. Seed the greeting questions data
cd backend
node seed/seedGreetings.js

# Expected output:
# ✅ Seeded 14 greeting questions
# 📊 Summary:
#    LISTEN_CHOOSE: 4 questions
#    PICTURE_MATCH: 3 questions
#    TH_EN_MATCH: 2 questions
#    PHRASE_GAP: 2 questions
#    ORDER_TILES_PHRASE: 2 questions
#    QUICK_AB: 1 questions
```

### Step-by-Step Test
1. **Start App**
   ```bash
   npm start
   ```

2. **Navigate to Level 1**
   - Tap "Level 1 - Beginner" on HomeScreen

3. **Find Stage 3**
   - Scroll down to "คำทักทาย"
   - Status should show "current" (available now)

4. **Start Playing**
   - Tap the stage card
   - Answer all 14 questions

5. **Verify Features**
   - ✅ Hearts decrease on wrong answers
   - ✅ XP/Diamonds increase on correct answers
   - ✅ Accuracy percentage updates
   - ✅ CHECK/NEXT button flows properly
   - ✅ Images load correctly
   - ✅ TTS plays Thai audio

---

## 🎨 UI Components

### Header
```
┌─────────────────────────────────┐
│ ← [Progress Bar: Q3/14]          │
│ [Type Pill] 🎧 LISTEN_CHOOSE   │
│           ❤️ 5 hearts          │
└─────────────────────────────────┘
```

### Stats Row
```
┌──────────────────────────────────┐
│ ⭐ XP: 25  │  💎 Diamonds: +3   │
│ 🎯 Accuracy: 67%                │
└──────────────────────────────────┘
```

### Question Card
```
┌──────────────────────────────────┐
│ 🎧 ฟังเสียงแล้วเลือกคำ          │
│                                   │
│      [🔊 Speaker Button]         │
│                                   │
│  ┌──────────┐  ┌──────────┐      │
│  │ สวัสดี    │  │ ขอโทษ    │      │
│  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐      │
│  │ ลาก่อน    │  │ ยินดี    │      │
│  └──────────┘  └──────────┘      │
└──────────────────────────────────┘

[✅ CHECK Button]
```

---

## 🔧 Technical Details

### File Locations
- **Game Component**: `src/screens/GreetingStage3Game.js`
- **Images**: `src/add/Greetings & Common Phrases/` (18 images)
- **Image Mapping**: `src/assets/greetings/index.js`
- **Seed Data**: `backend/seed/seedGreetings.js`
- **Configuration**: `src/screens/LevelStage.js` (Stage 3 config)

### Data Flow
```
MongoDB (GreetingQuestions collection)
    ↓
API Endpoint (/api/greeting-questions)
    ↓
GreetingStage3Game.js
    ↓
greetingImages mapping
    ↓
UI Rendering
```

### Services Used
- `vaja9TtsService`: Text-to-Speech (Thai)
- `gameProgressService`: Save game results
- `levelUnlockService`: Stage unlock logic
- `userStatsService`: Update user stats

---

## 🐛 Troubleshooting

### Stage 3 Not Showing?
- ✅ Check: `DEBUG_UNLOCK_STAGE_3_GREETINGS = true` in `LevelStage.js`
- Verify: MongoDB seed data is imported

### Images Not Loading?
- ✅ Check: Files exist in `/src/add/Greetings & Common Phrases/`
- Verify: Image mapping is correct in `src/assets/greetings/index.js`

### TTS Not Playing?
- ✅ Check: `vaja9TtsService` is initialized
- Verify: Audio text is in Thai script

### Questions Not Loading?
- ✅ Check: Run `node seed/seedGreetings.js`
- Verify: MongoDB connection in `config.env`

---

## ✅ Demo Checklist

- [ ] App running successfully
- [ ] Level 1 accessible from HomeScreen
- [ ] Stage 3 showing as "current" (not locked)
- [ ] Can tap Stage 3 and enter game
- [ ] Question displays correctly
- [ ] TTS plays Thai audio
- [ ] Images load properly
- [ ] Hearts/XP/Diamonds update correctly
- [ ] CHECK/NEXT buttons work
- [ ] Feedback shows after answer
- [ ] Game completes after all 14 questions
- [ ] Results screen shows stats

---

## 📞 Quick Notes

**Features Included:**
- 6 different game mechanics
- 14 carefully crafted questions
- Full Thai localization
- Gamification (hearts, XP, diamonds)
- Progress tracking
- Image support
- TTS pronunciation

**Ready to Deploy:**
- Seed data provided
- Image mappings included
- Complete documentation
- Integration examples
- Troubleshooting guide

---

**Enjoy the demo! 🚀**
