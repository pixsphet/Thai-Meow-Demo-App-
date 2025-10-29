# 🐱 Thai Meow - แอปเรียนภาษาไทยแบบ Gamification

> แอปพลิเคชันเรียนภาษาไทยสำหรับชาวต่างชาติแบบ Cross-platform (Android/iOS) พัฒนาด้วย React Native + Expo พร้อม Backend Node.js/Express และ MongoDB

---

## 📑 สารบัญ

1. [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
2. [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
3. [หน้าจอทั้งหมด (Screens)](#หน้าจอทั้งหมด-screens)
4. [คอมโพเนนต์ (Components)](#คอมโพเนนต์-components)
5. [บริการ (Services)](#บริการ-services)
6. [Backend API](#backend-api)
7. [ระบบการทำงาน](#ระบบการทำงาน)
8. [วิธีใช้งาน](#วิธีใช้งาน)

---

## ภาพรวมโปรเจกต์

**Thai Meow** เป็นแอปพลิเคชันการเรียนรู้ภาษาไทยแบบ Gamification ที่รวม:

- ✅ **บทเรียนแบบขั้นบันได** - เริ่มจากพื้นฐานสู่ระดับสูง
- ✅ **ระบบเกมและคะแนน** - ระบบ Hearts, XP, Level, Streak, Diamonds
- ✅ **เสียง TTS** - ฝึกการออกเสียงด้วย Text-to-Speech
- ✅ **Minigames 4 เกม** - Word Finder, Word Scramble, Memory Match, Speed Typing
- ✅ **ติดตามความคืบหน้า** - Dashboard และสถิติแบบเรียลไทม์
- ✅ **ระบบเพื่อน** - ค้นหาเพื่อน ส่งคำขอ และแชร์ความสำเร็จ
- ✅ **รองรับออฟไลน์** - เก็บข้อมูลไว้ใน AsyncStorage

---

## โครงสร้างโปรเจกต์

```
Thai-Meow/
├── src/                          # Frontend (React Native)
│   ├── screens/                 # หน้าจอทั้งหมด (43 ไฟล์)
│   ├── components/              # UI Components (17 ไฟล์)
│   ├── services/                # API & Business Logic (22 ไฟล์)
│   ├── contexts/                # React Context (7 ไฟล์)
│   ├── navigation/              # Navigation config
│   ├── data/                    # JSON Data
│   ├── utils/                   # Utilities
│   └── assets/                  # Images & Animations
│
├── backend/                      # Backend API (Node.js)
│   ├── controllers/             # API Controllers (6 ไฟล์)
│   ├── models/                 # Mongoose Models (11 ไฟล์)
│   ├── routes/                 # API Routes (14 ไฟล์)
│   ├── middleware/             # Auth & Middleware
│   ├── services/               # Business Logic
│   └── server.js               # Main server
│
└── assets/                      # Static Assets
```

---

## หน้าจอทั้งหมด (Screens)

### 🏠 หน้าหลัก (Main Screens)

#### **HomeScreen.js**
**หน้าที่:** หน้าหลัก/แดชบอร์ด
- แสดงการทักทายผู้ใช้ พร้อมสถิติ Hearts, Diamonds, XP
- แสดง Streak Level และความคืบหน้า
- มี Quick Actions: ต่อบทเรียน, เข้า Minigame, ดูสถิติ
- แสดง Learning Tips และความสำเร็จล่าสุด
- แสดง Progress Bar สำหรับแต่ละ Level
- Custom Tab Bar (Home, Minigame, Progress, Profile)
- รองรับ Data Sync และ Network Status

#### **ProfileScreen.js**
**หน้าที่:** หน้าจอโปรไฟล์ผู้ใช้
- แสดงข้อมูลผู้ใช้: username, level, streak, avatar
- แสดงสถิติ: XP, Diamonds, Hearts, Accuracy, Total Sessions
- แสดง Achievements และ Badges
- แสดง Learning Streak พร้อม Fire Animation
- มีปุ่ม: แก้ไขโปรไฟล์, ดูสถิติ, ตั้งค่า
- แสดง Friends List และ Friend Requests
- Custom Tab Bar

#### **ProgressScreen.js**
**หน้าที่:** แสดงความคืบหน้าและการวิเคราะห์
- แสดงสถิติโดยรวม: Total XP, Level, Streak, Accuracy
- แสดง Progress Ring สำหรับแต่ละ Level
- แสดง Recent Games ที่เล่นล่าสุด
- แสดง Performance Chart
- แสดง Achievements Timeline
- Custom Tab Bar

#### **SettingsScreen.js**
**หน้าที่:** หน้าจอกำหนดค่า
- แก้ไข Username, Email, Password
- แก้ไข Pet Name
- เปลี่ยน Avatar
- Dark/Light Mode Toggle
- Language Settings
- ออกจากระบบ

#### **EditProfileScreen.js**
**หน้าที่:** แก้ไขโปรไฟล์
- แก้ไขข้อมูลส่วนตัว
- Validation สำหรับ Email และ Username
- อัปโหลด Avatar
- บันทึกการเปลี่ยนแปลง

---

### 📚 หน้าบทเรียน (Level Selection)

#### **LevelStage1.js**
**หน้าที่:** เลือกบทเรียน Level 1 (Beginner)
- Stage 1: พยัญชนะ (ConsonantStage1Game)
- Stage 2: สระ (VowelStage2Game)
- Stage 3: คำทักทาย (GreetingStage3Game)
- Stage 4: ของใช้ (Lesson4ObjectsGame)
- Stage 5: ร่างกาย (Lesson5BodyGame)

#### **LevelStage2.js**
**หน้าที่:** เลือกบทเรียน Level 2 (Intermediate)
- อารมณ์ความรู้สึก (IntermediateEmotionsGame)
- อาหารและเครื่องดื่ม (Intermediate1FoodDrinksGame)
- สถานที่ (IntermediatePlacesGame)
- กิจวัตรประจำวัน (IntermediateRoutinesGame)
- การคมนาคม (IntermediateTransportGame)

#### **LevelStage3.js**
**หน้าที่:** เลือกบทเรียน Level 3 (Advanced)
- อาชีพ (Advanced1OccupationsGame)
- หัวข้อต่างๆ (Advanced2TopicsGame)
- ทิศทาง (Advanced3DirectionsGame)
- คำกริยาซับซ้อน (Advanced4ComplexVerbsGame)
- สำนวนไทย (Advanced5IdiomsGame)

---

### 🎮 หน้าจอเกม (Game Screens)

#### **ConsonantStage1Game.js**
**หน้าที่:** เกมเรียนพยัญชนะ ก-ฮ (44 ตัว)
- ระบบ Hearts (เริ่มต้น 3 หัวใจ)
- Progress Bar แสดงความคืบหน้า
- คำถาม: LISTEN_CHOOSE, PICTURE_MATCH, DRAG_MATCH
- TTS ฝึกการออกเสียง
- LinearGradient Header (orange/yellow gradient)
- Lottie Heart Animation
- Two-phase CHECK/NEXT button flow

#### **VowelStage2Game.js**
**หน้าที่:** เกมเรียนสระ (32 ตัว)
- โครงสร้างเหมือน ConsonantStage1Game
- Focus ที่สระไทย (สระเสียงสั้น/ยาว)

#### **GreetingStage3Game.js**
**หน้าที่:** เกมเรียนคำทักทาย
- สวัสดี, ขอบคุณ, ลาก่อน, ขอโทษ
- รูปภาพประกอบคำศัพท์
- Custom Header Component (GreetingGameHeader)

#### **Lesson4ObjectsGame.js**
**หน้าที่:** เกมเรียนของใช้ประจำวัน
- เก้าอี้, โต๊ะ, หนังสือ, ดินสอ, กระเป๋า

#### **Lesson5BodyGame.js**
**หน้าที่:** เกมเรียนอวัยวะร่างกาย
- ศีรษะ, แขน, ขา, ตา, หู

#### **Intermediate1FoodDrinksGame.js**
**หน้าที่:** เกมเรียนอาหารและเครื่องดื่ม
- ข้าว, ผัก, เนื้อ, น้ำ, ชา

#### **IntermediateEmotionsGame.js**
**หน้าที่:** เกมเรียนอารมณ์ความรู้สึก
- สุข, เศร้า, โกรธ, ตื่นเต้น, กลัว

#### **IntermediatePlacesGame.js**
**หน้าที่:** เกมเรียนสถานที่
- โรงเรียน, โรงพยาบาล, ตลาด, สวน

#### **IntermediateRoutinesGame.js**
**หน้าที่:** เกมเรียนกิจวัตรประจำวัน
- ตื่นนอน, อาบน้ำ, แต่งตัว, กินข้าว

#### **IntermediateTransportGame.js**
**หน้าที่:** เกมเรียนการคมนาคม
- รถ, เรือ, เครื่องบิน, บีทีเอส

#### **Advanced1OccupationsGame.js**
**หน้าที่:** เกมเรียนอาชีพ
- หมอ, ครู, นักบิน, วิศวกร, พยาบาล

#### **Advanced2TopicsGame.js**
**หน้าที่:** เกมเรียนหัวข้อวิชาการ

#### **Advanced3DirectionsGame.js**
**หน้าที่:** เกมเรียนทิศทาง
- ซ้าย, ขวา, ตรง, ห่าง

#### **Advanced4ComplexVerbsGame.js**
**หน้าที่:** เกมเรียนคำกริยาซับซ้อน
- ทำ, ไป, มา, พูด, ฟัง

#### **Advanced5IdiomsGame.js**
**หน้าที่:** เกมเรียนสำนวนไทย

---

### 🎪 หน้าจอ Minigames

#### **MinigameScreen.js**
**หน้าที่:** จอเลือก Minigames
- **Word Finder** (🔍) - ค้นหาคำไทยในตาราง
- **Word Scramble** (🧩) - เรียงคำไทยให้ถูกต้อง
- **Memory Match** (🎴) - จับคู่คำกับรูป
- **Speed Typing** (⚡) - พิมพ์เร็วแข่งเวลา
- แสดงรางวัลที่ได้รับ และ Reward History

#### **Game1Screen.js (Word Finder)**
**หน้าที่:** เกมค้นหาคำในตาราง
- ตารางตัวอักษรสุ่ม
- ค้นหาคำไทยที่กำหนด
- ได้รางวัล Diamonds และ XP

#### **Game2Screen.js (Word Scramble)**
**หน้าที่:** เกมเรียงคำ
- ตัวอักษรสุ่ม
- เรียงให้เป็นคำไทยที่ถูกต้อง
- ได้รางวัล Diamonds และ XP

#### **MemoryMatchScreen.js**
**หน้าที่:** เกมความจำจับคู่
- คู่คำและรูปภาพ
- ค้นหาคู่ที่เหมือนกัน
- ได้รางวัล Diamonds และ XP

#### **SpeedTypingScreen.js**
**หน้าที่:** เกมพิมพ์เร็ว
- พิมพ์คำที่แสดงบนหน้าจอ
- แข่งเวลา
- ได้รางวัล Diamonds และ XP

#### **GemShopScreen.js**
**หน้าที่:** ร้านซื้อ Diamonds/Hearts
- ซื้อ Hearts ด้วย Diamonds
- ดูประวัติการซื้อ

---

### 📊 หน้าผลลัพธ์

#### **LessonCompleteScreen.js**
**หน้าที่:** หน้าสรุปผลบทเรียน
- แสดงผลคะแนน: ถูก/ผิด, Accuracy %
- แสดงรางวัล: XP, Diamonds
- แสดง Streak และ Fire Streak Alert
- แสดง Next Level Unlock Status
- Animation พร้อม Lottie
- ปุ่ม: Replay, Continue

#### **FireStreakAlert.js (Component)**
**หน้าที่:** Alert แสดง Fire Streak เมื่อครบ 5, 10, 20, 30, 50, 100 วัน
- Modal พร้อม Animation
- Gradient Background แบ่งตาม Tier
- แสดง Tier Badge (COMMON → LEGENDARY)
- ข้อความภาษาไทย
- Lottie Fire Animation

---

### 🔐 หน้าจอ Authentication

#### **FirstScreen.js**
**หน้าที่:** หน้าจอต้อนรับ
- แนะนำแอป
- ปุ่ม Sign In / Sign Up

#### **Onboarding1.js, Onboarding2.js, Onboarding3.js**
**หน้าที่:** หน้าจอแนะนำแอป (3 หน้า)
- อธิบายฟีเจอร์
- Navigation ระหว่างหน้าจอ

#### **SignInScreen.js**
**หน้าที่:** เข้าสู่ระบบ
- Login Form (Email/Username + Password)
- ลิงก์ Forgot Password และ Sign Up
- JWT Authentication

#### **SignUpScreen.js**
**หน้าที่:** สมัครสมาชิก
- Registration Form
- Validation: Username, Email, Password
- เลือก Avatar และ Pet Name

#### **ForgotPasswordScreen.js**
**หน้าที่:** ลืมรหัสผ่าน
- กรอก Email
- ส่งลิงก์รีเซ็ตรหัสผ่าน

#### **ChangePasswordScreen.js**
**หน้าที่:** เปลี่ยนรหัสผ่าน
- Old Password + New Password
- Validation และ Confirmation

---

### 🔧 หน้าจออื่นๆ

#### **ConsonantLearnScreen.js**
**หน้าที่:** หน้าเรียนรู้พยัญชนะ
- แสดงพยัญชนะทั้งหมด ก-ฮ
- ฟังเสียง และดูรูปภาพ

#### **NewLessonGame.js**
**หน้าที่:** Generic เกมบทเรียน
- Template สำหรับเกมบทเรียนใหม่

#### **TestConsonantGame.js**
**หน้าที่:** เกมทดสอบพยัญชนะ

#### **ThaiVowelGame.js**
**หน้าที่:** เกมสระไทย

#### **GameModeSelector.js (Component)**
**หน้าที่:** เลือกโหมดเกม
- เกมปกติ
- ชาเลนจ์โหมด
- Time Trial

---

## คอมโพเนนต์ (Components)

### **src/components/**

#### **FireStreakAlert.js**
**หน้าที่:** Modal แสดงความสำเร็จ Fire Streak
- Animated Modal พร้อม Spring Physics
- Gradient Background แบ่งตาม Tier
- Dynamic Message ภาษาไทย
- Tier Badges: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY
- Lottie Fire Animation

#### **ErrorBoundary.js**
**หน้าที่:** Error Handler สำหรับ React App
- Catch Error และแสดง Fallback UI

#### **NetworkStatusSimple.js**
**หน้าที่:** แสดงสถานะการเชื่อมต่ออินเทอร์เน็ต
- Offline/Online Indicator

#### **ProgressRing.js**
**หน้าที่:** Ring แสดงความคืบหน้า
- Animation คะแนนที่ได้

#### **ProgressSummary.js**
**หน้าที่:** สรุปความคืบหน้า
- แสดงสถิติใน Card

#### **StreakBadge.js**
**หน้าที่:** Badge แสดง Streak
- Fire Animation

#### **StreakLevelDisplay.js**
**หน้าที่:** แสดง Level ของ Streak
- Fire Animation และ Tier Display

#### **ThemeToggleButton.js**
**หน้าที่:** ปุ่ม Dark/Light Mode

#### **ThemedBackButton.js**
**หน้าที่:** ปุ่มย้อนกลับพร้อม Theme

#### **UserDataSyncIndicator.js**
**หน้าที่:** แสดงสถานะการซิงค์ข้อมูล
- Loading Animation

#### **UserSwitcher.js**
**หน้าที่:** เปลี่ยนผู้ใช้ (Dev)

#### **FlipCard.js**
**หน้าที่:** การ์ดพลิกสำหรับ Memory Match

#### **GameModeSelector.js**
**หน้าที่:** เลือกโหมดเกม

#### **DataSyncIndicator.js**
**หน้าที่:** แสดงสถานะการซิงค์ข้อมูล

#### **lessons/**
- **GreetingGameHeader.js** - Header สำหรับ Greeting Game
- **ListenChooseGame.js** - เกมฟังและเลือก
- **PictureMatchGame.js** - เกมจับคู่รูปภาพ

---

## บริการ (Services)

### **src/services/**

#### **apiClient.js**
**หน้าที่:** Axios Client สำหรับเรียก API
- Base URL Configuration
- Request/Response Interceptors
- Error Handling

#### **authService.js**
**หน้าที่:** บริการ Authentication
- `login(email, password)`
- `register(userData)`
- `logout()`
- `getCurrentUser()`
- `forgotPassword(email)`
- JWT Token Management

#### **dailyStreakService.js**
**หน้าที่:** บริการ Daily Streak
- `updateStreak()` - อัปเดต Streak
- `checkStreakReset()` - ตรวจสอบการรีเซ็ต Streak
- Firebase Streak Tracking

#### **dataSyncService.js**
**หน้าที่:** บริการซิงค์ข้อมูล
- `initialize(userId)` - เริ่มซิงค์
- `forceSync()` - ซิงค์แบบบังคับ
- Sync XP, Stats, Progress

#### **gameProgressService.js**
**หน้าที่:** บริการจัดการความคืบหน้าเกม
- `saveProgress()`
- `loadProgress()`
- `getLessonProgress()`
- Auto-save & Resume

#### **gameVocabService.js**
**หน้าที่:** บริการคำศัพท์สำหรับเกม
- `getVocabByCategory()`
- `listCategories()`
- GAME_CATEGORIES: Animals, Food, Colors, etc.

#### **imageUploadService.js**
**หน้าที่:** บริการอัปโหลดรูปภาพ
- Avatar Upload
- Image Compression

#### **lessonService.js**
**หน้าที่:** บริการบทเรียน
- `getLessons()`
- `getLessonById()`
- `unlockLesson()`

#### **lesson3Service.js**
**หน้าที่:** บริการบทเรียน Level 3
- Advanced Lessons

#### **levelUnlockService.js**
**หน้าที่:** บริการปลดล็อค Level
- `checkAndUnlockNextLevel()`
- Unlock Rules (≥70% accuracy)

#### **minigameRewards.js**
**หน้าที่:** บริการรางวัล Minigame
- `getRewardsTotal()` - รวมรางวัลที่ได้
- `getRewardsHistory()` - ประวัติรางวัล
- `clearRewardsHistory()` - ล้างประวัติ

#### **offlineService.js**
**หน้าที่:** บริการออฟไลน์
- Caching Data
- AsyncStorage Operations

#### **progressService.js**
**หน้าที่:** บริการความคืบหน้า
- `getProgress()`
- `updateProgress()`

#### **progressServicePerUser.js**
**หน้าที่:** บริการความคืบหน้าแบบ Per User

#### **realProgressService.js**
**หน้าที่:** บริการความคืบหน้าจริงจาก Backend

#### **realUserStatsService.js**
**หน้าที่:** บริการสถิติผู้ใช้จาก Backend
- Fetch XP, Level, Streak
- Update Stats

#### **unlockService.js**
**หน้าที่:** บริการปลดล็อค

#### **userService.js**
**หน้าที่:** บริการผู้ใช้
- `getUserProfile()`
- `updateProfile()`
- `changePassword()`

#### **userStatsService.js**
**หน้าที่:** บริการสถิติผู้ใช้
- `fetchUserStats()`
- `updateUserStats()`

#### **vaja9TtsService.js**
**หน้าที่:** บริการ Text-to-Speech (VajaX)
- `speak(text, speaker, style, speed)`
- AI For Thai VajaX API

#### **vocabWordService.js**
**หน้าที่:** บริการคำศัพท์
- `getVocabList()`
- Word Search

---

## React Contexts

### **src/contexts/**

#### **AuthContext.js**
**หน้าที่:** Context สำหรับ Authentication
- `user` - ผู้ใช้ปัจจุบัน
- `isAuthenticated` - สถานะการ Login
- `login()`, `logout()`

#### **ThemeContext.js**
**หน้าที่:** Context สำหรับ Theme
- `theme` - Dark/Light Theme
- `isDarkMode`
- `toggleTheme()`

#### **UserContext.js**
**หน้าที่:** Context สำหรับผู้ใช้
- `user` - ข้อมูลผู้ใช้
- `updateUser()`

#### **UserDataContext.js**
**หน้าที่:** Context สำหรับข้อมูลผู้ใช้
- `stats` - สถิติผู้ใช้

#### **ProgressContext.js**
**หน้าที่:** Context สำหรับความคืบหน้า
- `getTotalXP()`
- `getCurrentLevel()`
- `getCurrentStreak()`
- `updateProgress()`

#### **UnifiedStatsContext.js**
**หน้าที่:** Context สถิติแบบรวม (Single Source of Truth)
- `xp`, `diamonds`, `hearts`, `level`, `streak`
- `stats` - สถิติทั้งหมด
- `updateStats()` - อัปเดตสถิติ
- `forceRefresh()` - รีเฟรชข้อมูล

#### **UserDataContext.js** (duplicate - different purpose?)

---

## Backend API

### **Controllers**

#### **backend/controllers/auth.controller.js**
**หน้าที่:** Authentication Controller
- `register()` - สมัครสมาชิก
- `login()` - เข้าสู่ระบบ
- `getMe()` - ดูโปรไฟล์ตัวเอง
- JWT Token Generation

#### **backend/controllers/user.controller.js**
**หน้าที่:** User Controller
- `updateProfile()` - แก้ไขโปรไฟล์
- `changePassword()` - เปลี่ยนรหัสผ่าน
- `unlockLevel()` - ปลดล็อค Level

#### **backend/controllers/friend.controller.js**
**หน้าที่:** Friends Controller
- `searchFriend()` - ค้นหาเพื่อน
- `sendRequest()` - ส่งคำขอ
- `acceptRequest()` - ยอมรับคำขอ
- `rejectRequest()` - ปฏิเสธคำขอ
- `removeFriend()` - ลบเพื่อน

#### **backend/controllers/tts.controller.js**
**หน้าที่:** Text-to-Speech Controller
- `speak()` - สร้างเสียง TTS
- VajaX API Integration

#### **backend/controllers/dev.controller.js**
**หน้าที่:** Development Controller
- Test Endpoints

#### **backend/controllers/lesson3.controller.js**
**หน้าที่:** Lesson 3 Controller
- Advanced Lessons

---

### **Models**

#### **backend/models/User.js**
**หน้าที่:** User Model (MongoDB)
```javascript
{
  username, email, passwordHash,
  petName, avatar,
  level, xp, diamonds, hearts,
  streak, maxStreak,
  friends, badges, achievements,
  unlockedLevels,
  lastPlayed, createdAt, updatedAt
}
```

#### **backend/models/UserStats.js**
**หน้าที่:** UserStats Model
- XP, Level, Streak, Hearts, Diamonds
- Total Sessions, Accuracy
- Achievements, Badges

#### **backend/models/Progress.js**
**หน้าที่:** Progress Model
- Lesson Progress
- Current Index, Answers
- Accuracy, Score

#### **backend/models/GameResult.js**
**หน้าที่:** GameResult Model
- Score, Accuracy
- XP Gained, Diamonds Gained
- Time Spent

#### **backend/models/FriendRequest.js**
**หน้าที่:** FriendRequest Model
- From User, To User, Status

#### **backend/models/Lesson.js**
**หน้าที่:** Lesson Model
- Lesson Content
- Questions, Answers
- Category

#### **backend/models/GameVocab.js**
**หน้าที่:** GameVocab Model
- Vocabulary for Minigames
- Category, Word, Translation

#### **backend/models/Vocab.js, Vocabulary.js**
**หน้าที่:** Vocabulary Models
- Thai Words
- Definitions, Pronunciations

#### **backend/models/UserProgress.js**
**หน้าที่:** UserProgress Model
- Per-user Progress

#### **backend/models/Player.js**
**หน้าที่:** Player Model (legacy?)

---

### **Routes**

#### **backend/routes/auth.js**
**ปลายทาง:**
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/me` - ดูโปรไฟล์

#### **backend/routes/user.routes.js**
**ปลายทาง:**
- `GET /api/user/stats` - ดึงสถิติ
- `PUT /api/user/profile` - แก้ไขโปรไฟล์
- `POST /api/user/change-password` - เปลี่ยนรหัสผ่าน
- `POST /api/user/unlock-level` - ปลดล็อค Level

#### **backend/routes/friends.js**
**ปลายทาง:**
- `GET /api/friends/search` - ค้นหาเพื่อน
- `POST /api/friends/request` - ส่งคำขอ
- `POST /api/friends/accept` - ยอมรับ
- `POST /api/friends/reject` - ปฏิเสธ
- `GET /api/friends/list` - รายชื่อเพื่อน
- `DELETE /api/friends/remove` - ลบเพื่อน

#### **backend/routes/tts.js**
**ปลายทาง:**
- `POST /api/tts/speak` - สร้างเสียง TTS
- Body: `{ text, speaker?, style?, speed? }`

#### **backend/routes/lessons.js**
**ปลายทาง:**
- `GET /api/lessons` - รายการบทเรียน
- `GET /api/lessons/unlocked/:userId` - ด่านที่ปลดล็อค

#### **backend/routes/progress.js**
**ปลายทาง:**
- `POST /api/progress/finish` - บันทึกผลบทเรียน
- `GET /api/progress/user` - ดูความคืบหน้า
- `POST /api/progress/session` - บันทึก session

#### **backend/routes/gameResult.js**
**ปลายทาง:**
- `POST /api/game-results` - บันทึกผลเกม
- `GET /api/game-results/user` - ดูผลเกม

#### **backend/routes/streak.js, xp.js, progressPerUser.js**
**ปลายทาง:** Services สำหรับ Streak, XP, Progress

#### **backend/routes/gameVocab.js**
**ปลายทาง:** Vocabulary สำหรับ Minigames

#### **backend/routes/vocab.js, vocabRoutes.js**
**ปลายทาง:** Vocabulary API

#### **backend/routes/lesson3.js**
**ปลายทาง:** Advanced Lessons

#### **backend/routes/greetings.js**
**ปลายทาง:** Greetings API

---

## ระบบการทำงาน

### 1. **ระบบ Gamification**

#### Hearts System ❤️
- เริ่มต้น: 3 หัวใจ
- ตอบผิด: -1 หัวใจ
- หัวใจหมด: เกมจบ
- รอนาน 30 นาที: +1 หัวใจ
- ซื้อได้ที่ Gem Shop

#### XP & Level System ⭐
- ตอบถูก: +10-15 XP
- Level = `floor(XP / 100) + 1`
- Level สูง: ปลดล็อคคอนเทนต์ใหม่

#### Daily Streak 🔥
- เข้าทุกวัน: Streak เพิ่ม
- ข้ามวัน: Streak รีเซ็ต
- Milestone: 5, 10, 20, 30, 50, 100 วัน
- Fire Streak Alert แสดงที่ Layer บนสุด

#### Diamonds 💎
- ตอบถูก: +1-2 Diamonds
- ใช้ซื้อ Hearts
- Minigame Rewards

---

### 2. **ระบบ Unlock (ปลดล็อค)**

#### Unlock Rules
- ด่านแรก: Unlock อัตโนมัติ
- ด่านถัดไป: ต้องผ่านด่านก่อนหน้า ≥70%
- ปลดล็อคอัตโนมัติหลังจาก Complete

#### Services
- `levelUnlockService.checkAndUnlockNextLevel()`
- `gameProgressService.getLessonProgress()`
- `userStatsService.updateUserStats()`

---

### 3. **ระบบ Progress Tracking**

#### Session Progress
- บันทึกทุกคำถามที่ตอบ
- คำนวณ Accuracy %
- เก็บเวลาเล่น (timeSpent)
- Snapshots สำหรับ Resume

#### Final Results
- Total Score
- Accuracy %
- XP Gained
- Diamonds Gained
- Next Stage Unlocked

---

### 4. **ระบบ TTS (Text-to-Speech)**

#### VajaX (AI For Thai)
- API Key: `VAJAX_API_KEY`
- Configurable: `speaker`, `style`, `speed`
- Endpoint: `POST /api/tts/speak`

#### Expo Speech
- รองรับ Offline Playback
- เสียงพรีอินสตอลบนอุปกรณ์

---

## วิธีใช้งาน

### การติดตั้ง

```bash
# Clone repository
git clone https://github.com/pixsphet/Thai-Meow-Demo-App-.git
cd Thai-Meow

# Install Frontend dependencies
npm install

# Install Backend dependencies
cd backend
npm install

# Setup environment
cp config.env.example config.env
# แก้ไข MONGODB_URI, JWT_SECRET, VAJAX_API_KEY

# Run
npm run dev        # Run ทั้ง Frontend + Backend
# หรือ
npm run backend    # Backend on port 3000
npm start           # Expo Dev Client
```

### วิธีใช้งาน

1. เปิดแอป → ดู Onboarding → สมัครสมาชิก
2. เริ่มบทเรียน → เลือก Level → เลือก Stage
3. เล่นเกม → ตอบคำถาม → ได้ Hearts, XP, Diamonds
4. ดูความคืบหน้า → Dashboard → สถิติ
5. เล่น Minigames → ได้ Diamonds เพิ่ม
6. ค้นหาเพื่อน → ส่งคำขอ → แชร์ความสำเร็จ

---

## สรุป

**Thai Meow** เป็นแอปพลิเคชันเรียนภาษาไทยแบบ Gamification ที่ครอบคลุม:

✅ **43 Screens** - หน้าจอครบถ้วน  
✅ **17 Components** - คอมโพเนนต์ที่ใช้ซ้ำ  
✅ **22 Services** - บริการ API & Logic  
✅ **7 Contexts** - State Management  
✅ **6 Controllers** - Backend Controllers  
✅ **11 Models** - Database Models  
✅ **14 Routes** - API Endpoints

---

**Made with ❤️ by the Thai Meow Team**

*Thai Meow - Learn Thai the Fun Way! 🇹🇭🐱*
