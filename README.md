# Thai Meow 🐱 - Interactive Thai Language Learning App

แอปพลิเคชันเรียนภาษาไทยสำหรับชาวต่างชาติแบบ Cross-platform (Android/iOS) ด้วย React Native + Expo พร้อม Backend บน Node.js/Express และ MongoDB

## 📱 ภาพรวมโปรเจกต์

**Thai Meow** เป็นแอปพลิเคชันการเรียนรู้ภาษาไทยแบบ Gamification ที่มุ่งเน้น:
- ✅ **เข้าใจง่าย** - บทเรียนเป็นขั้นบันได พร้อมรูปภาพและเสียง
- ✅ **สนุกและติด** - ระบบเกม คะแนน XP/Level/Streak
- ✅ **เห็นผลจริง** - Dashboard ติดตามความก้าวหน้า
- ✅ **เสียงเจ้าของภาษา** - TTS (Text-to-Speech) ฝึกการออกเสียง
- ✅ **ออฟไลน์** - รองรับการเล่นแบบไม่ต้องเชื่อมต่ออินเทอร์เน็ต

## 🏗️ สถาปัตยกรรม

### Tech Stack

**Frontend (Mobile App)**
- React Native 0.81 + Expo 54
- React Navigation v7 (Stack/BottomTabs)
- Lottie Animations
- AsyncStorage (Offline cache)
- Expo Speech + AI For Thai VajaX (TTS)

**Backend API**
- Node.js + Express 5
- MongoDB + Mongoose
- JWT Authentication
- RESTful API design

**Database (MongoDB Collections)**
- `users` - โปรไฟล์ผู้ใช้และ authentication
- `userstats` - สถิติ XP/Level/Streak/Hearts
- `vocabularies` - คำศัพท์ พยัญชนะ สระ
- `progresses` - ความคืบหน้าต่อบทเรียน
- `lessons` - บทเรียนและเนื้อหา
- `gameresults` - ผลเกมและสถิติ
- `friends` - ระบบเพื่อนและสังคม
- `friendrequests` - คำขอเป็นเพื่อน

### โครงสร้างโปรเจกต์

```
Thai-Meow/
├── src/                          # Frontend (React Native)
│   ├── components/              # UI Components
│   ├── contexts/                 # React Context (Theme, Stats)
│   ├── navigation/              # Navigation config
│   ├── screens/                 # App Screens
│   ├── services/                # API & Business Logic
│   ├── data/                    # JSON Data
│   └── utils/                    # Utilities
├── backend/                      # Backend API
│   ├── controllers/             # API Controllers
│   ├── models/                  # Mongoose Models
│   ├── routes/                  # API Routes
│   ├── middleware/             # Auth & Middleware
│   └── server.js                # Main server
└── assets/                      # Images & Animations
```

## 🎮 ฟีเจอร์หลัก

### 1. ระบบบทเรียนและเกม (Learning Modules)

#### Beginner Levels (Level 1)
- **Stage 1: พยัญชนะ** (`ConsonantStage1Game.js`) - ก-ฮ (44 ตัว)
- **Stage 2: สระ** (`VowelStage2Game.js`) - สระ 32 ตัว
- **Stage 3: คำทักทาย** (`GreetingStage3Game.js`) - สวัสดี, ขอบคุณ, ลาก่อน
- **Stage 4: ของใช้** (`Lesson4ObjectsGame.js`) - เก้าอี้, หนังสือ, รถยนต์
- **Stage 5: ร่างกาย** (`Lesson5BodyGame.js`) - ศีรษะ, แขน, ขา

#### Intermediate Levels (Level 2)
- **Emotions** - สุข, เศร้า, โกรธ, ตื่นเต้น
- **Food & Drinks** - ข้าว, ผัก, เนื้อ, เครื่องดื่ม
- **Places** - โรงเรียน, โรงพยาบาล, ตลาด, สวน
- **Routines** - ตื่นนอน, อาบน้ำ, แต่งตัว, กินข้าว
- **Transportation** - รถ, เรือ, เครื่องบิน, บีทีเอส

#### Advanced Levels (Level 3-4)
- **Directions** - ซ้าย, ขวา, ตรง, ห่าง
- **Complex Verbs** - ทำ, ไป, มา, พูด, ฟัง
- **Occupations** - หมอ, ครู, นักบิน, วิศวกร
- **Topics** - วิชาการ, การเมือง, สุขภาพ
- **Idioms** - สำนวนไทย

### 2. ระบบเกม (Game Types)

ทุกบทเรียนประกอบด้วยคำถามหลากหลาย:

- **LISTEN_CHOOSE** - ฟังเสียงแล้วเลือกคำตอบ
- **PICTURE_MATCH** - จับคู่ภาพกับคำ
- **DRAG_MATCH** - ลากและวางจับคู่
- **FILL_BLANK** - เติมคำในช่องว่าง
- **ARRANGE_SENTENCE** - เรียงประโยค
- **MEMORY_MATCH** - เกมความจำ
- **ORDER_TILES** - เรียงลำดับ
- **SYLLABLE_BUILDER** - สร้างพยางค์
- **CHALLENGE** - โหมดท้าทาย

### 3. ระบบ Gamification

#### Hearts System ❤️
- เริ่มต้นด้วย 3 หัวใจ
- ตอบผิด → หัวใจลด 1
- หัวใจหมด → เกมจบ
- รอนาน 30 นาที → หัวใจ+1

#### XP & Level System ⭐
- ตอบถูก → ได้ XP 10-15
- Level = `floor(XP / 100) + 1`
- Level สูง → ปลดล็อกคอนเทนต์ใหม่

#### Daily Streak 🔥
- เข้าทุกวัน → Streak เพิ่ม
- ข้ามวัน → Streak รีเซ็ตเป็น 1
- เก็บสถิติ Longest Streak

#### Diamonds 💎
- ตอบถูก → ได้ 1-2 เพชร
- ใช้เพชรซื้อ Item/Avatar

### 4. ระบบเพื่อน (Friends System)

- ค้นหาเพื่อนด้วย username
- ส่งคำขอเป็นเพื่อน
- รับ/ปฏิเสธคำขอ
- ดูรายชื่อเพื่อน
- ลบเพื่อนออก

### 5. ระบบเสียง (TTS)

#### VajaX (AI For Thai)
- ใช้ API Key: `VAJAX_API_KEY`
- Configurable: speaker, style, speed
- Endpoint: `POST /api/tts/speak`

#### Expo Speech
- รองรับ offline playback
- เสียงพรีอินสตอลบนอุปกรณ์

### 6. ระบบ Progress Tracking

#### Session Progress
- บันทึกทุกคำถามที่ตอบ
- คำนวณ accuracy %
- เก็บเวลาเล่น (timeSpent)
- Snapshots สำหรับ resume

#### Final Results
- คะแนนรวม (total score)
- ความแม่นยำ (accuracy %)
- XP ที่ได้รับ (xpGained)
- เพชรที่ได้รับ (diamondsGained)
- ด่านถัดไปปลดล็อกหรือไม่

## 🚀 Quick Start

### Prerequisites
```bash
- Node.js 18+
- MongoDB Atlas account
- VAJAX_API_KEY (สำหรับ TTS)
```

### Installation

#### 1. Clone repository
```bash
git clone https://github.com/pixsphet/Thai-Meow-Demo-App-.git
cd Thai-Meow
```

#### 2. Install dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

#### 3. Setup environment

สร้างไฟล์ `backend/config.env`:
```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/thai-meow?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_secret_key_here

# AI For Thai VajaX
VAJAX_API_KEY=your_vajax_api_key
VAJAX_SPEAKER=nana
VAJAX_STYLE=
VAJAX_SPEED=1.0
```

#### 4. Run the app
```bash
# Run both Frontend + Backend
npm run dev

# Or run separately
npm run backend    # Backend on port 3000
npm start           # Expo Dev Client
```

### Health Check
```bash
# Backend
curl http://localhost:3000/api/health

# Frontend
# Open in Expo Go app or iOS Simulator/Android Emulator
```

## 📚 API Endpoints

### Authentication
```javascript
POST   /api/auth/register       // สมัครสมาชิก
POST   /api/auth/login          // เข้าสู่ระบบ (JWT 7 วัน)
GET    /api/auth/me             // ดูโปรไฟล์ตัวเอง
```

### User Stats
```javascript
GET    /api/user/stats          // ดึงสถิติผู้ใช้
POST   /api/user/stats          // อัปเดตสถิติ
PUT    /api/user/profile        // แก้ไขโปรไฟล์
POST   /api/user/change-password // เปลี่ยนรหัสผ่าน
POST   /api/user/unlock-level   // ปลดล็อกด่าน
```

### Progress Tracking
```javascript
POST   /api/progress/finish     // บันทึกผลบทเรียน
GET    /api/progress/user       // ดูความคืบหน้า
POST   /api/progress/session    // บันทึก session
```

### Lessons
```javascript
GET    /api/lessons             // รายการบทเรียน
GET    /api/lessons/unlocked/:userId // ดูด่านที่ปลดล็อก
```

### Game Results
```javascript
POST   /api/game-results        // บันทึกผลเกม
GET    /api/game-results/user  // ดูผลเกมของผู้ใช้
```

### Friends
```javascript
GET    /api/friends/search     // ค้นหาเพื่อน
POST   /api/friends/request     // ส่งคำขอ
POST   /api/friends/accept      // ยอมรับ
POST   /api/friends/reject      // ปฏิเสธ
GET    /api/friends/list        // รายชื่อเพื่อน
GET    /api/friends/requests    // คำขอค้าง
DELETE /api/friends/remove      // ลบเพื่อน
```

### TTS (Text-to-Speech)
```javascript
POST   /api/tts/speak           // สร้างเสียง
Body: { text, speaker?, style?, speed? }
```

## 🎨 Screens Overview

### Main Screens
- **HomeScreen** - Dashboard พร้อมสถิติและความคืบหน้า
- **ProfileScreen** - โปรไฟล์ และตั้งค่า
- **ProgressScreen** - ติดตามรายละเอียดแต่ละบทเรียน
- **LevelStage1-3** - เลือกบทเรียนตาม level

### Game Screens
- `ConsonantStage1Game` - เรียนพยัญชนะ
- `VowelStage2Game` - เรียนสระ
- `GreetingStage3Game` - คำทักทาย
- `IntermediateEmotionsGame` - อารมณ์ความรู้สึก
- `IntermediatePlacesGame` - สถานที่
- `Advanced3DirectionsGame` - ทิศทาง

### Authentication
- **SignInScreen** - เข้าสู่ระบบ
- **SignUpScreen** - สมัครสมาชิก
- **OnboardingScreens** - แนะนำแอป

### Result Screen
- **LessonCompleteScreen** - สรุปผลบทเรียน + Fire Streak Alert

## 📊 Data Structure

### User Model
```javascript
{
  username, email, passwordHash,
  petName, avatar,
  
  // Gamification
  level, xp, diamonds,
  hearts, maxHearts,
  streak, longestStreak, maxStreak,
  
  // Progress
  lessonsCompleted, totalSessions,
  totalCorrectAnswers, totalWrongAnswers,
  averageAccuracy,
  
  // Social
  friends[], badges[], achievements[],
  unlockedLevels[],
  
  // Timestamps
  lastPlayed, createdAt, updatedAt
}
```

### Progress Model
```javascript
{
  userId, lessonId, category,
  
  // Current Session
  currentIndex, total,
  hearts, score, xp,
  progress, accuracy,
  
  // Completed
  completed, completedAt,
  
  // Snapshot
  questionsSnapshot[],
  answers: Map,
  perLetter: {}
}
```

### GameResult Model
```javascript
{
  userId, lessonKey, category, gameMode,
  
  // Results
  score, maxScore, accuracy,
  xpGained, timeSpent,
  
  // Details
  questions[], difficulty,
  isCompleted, isPerfect,
  
  // Analytics
  streak, rank, percentile
}
```

## 🎯 ระบบ Unlock (ปลดล็อก)

### Unlock Rules
- ด่านแรก (Consonants) → Unlock อัตโนมัติ
- ด่านที่ 2-5 → ต้องผ่านด่านก่อนหน้าด้วยความแม่นยำ ≥70%
- ด่านถัดไปจะปลดล็อกอัตโนมัติหลังจาก Complete

### Services
- `levelUnlockService.checkAndUnlockNextLevel()` - ตรวจสอบและปลดล็อก
- `gameProgressService.getLessonProgress()` - ค้นหาความคืบหน้า
- `userStatsService.updateUserStats()` - อัปเดตสถิติ

## 🎮 Gameplay Flow

### Typical Game Flow
1. เลือกบทเรียนจาก `LevelStageX.js`
2. เปิดเกม → โหลดข้อมูลจาก JSON
3. สร้างคำถามด้วย Question Generator
4. ผู้ใช้ตอบคำถาม → ตรวจสอบคำตอบ
5. บันทึก progress snapshot (auto-save)
6. เมื่อจบ → คำนวณผล (accuracy %, XP, Diamonds)
7. ตรวจสอบ unlock rule
8. ไปที่ `LessonCompleteScreen` พร้อมสรุปผล

### Resume Game
- Snapshots บันทึกใน AsyncStorage
- รองรับ resume จากที่ค้างไว้
- Restore: `currentIndex`, `answers`, `score`

## 🔐 Security

- JWT Authentication (7 days expiry)
- bcryptjs password hashing
- CORS enabled
- Input validation & sanitization
- Rate limiting on critical endpoints

## 📱 Offline Support

- AsyncStorage สำหรับ cache
- Local JSON fallbacks
- Resume game functionality
- TTS caching (ยังไม่สมบูรณ์)

## 🚧 Limitations

- ❌ ยังไม่มี Pronunciation Scoring (ประเมินการออกเสียง)
- ❌ ยังไม่มี Community/Leaderboard
- ❌ ยังไม่มี Adaptive Learning (AI ปรับบทเรียน)
- ❌ ต้องออนไลน์เพื่อ sync ข้อมูล

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Basic learning modules
- [x] Gamification system
- [x] Progress tracking
- [x] Friends system
- [x] TTS integration

### Phase 2 (Future)
- [ ] Pronunciation scoring
- [ ] Community & Leaderboard
- [ ] Weekly challenges
- [ ] Adaptive learning
- [ ] Teacher dashboard

### Phase 3 (Future)
- [ ] Voice chat practice
- [ ] AI conversation bot
- [ ] Live tutoring
- [ ] Mobile app stores

## 📞 Contact

- **Repository**: [Thai-Meow-Demo-App-](https://github.com/pixsphet/Thai-Meow-Demo-App-)
- **License**: MIT
- **Team**: Thai Meow Team

---

**Made with ❤️ by the Thai Meow Team**

*Thai Meow - Learn Thai the Fun Way! 🇹🇭🐱*
