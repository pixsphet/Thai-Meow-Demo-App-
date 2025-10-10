# Thai-Meow Progress Tracking System

## ระบบติดตามความคืบหน้าและปลดล็อกด่านแบบครบวงจร

### 🎯 ฟีเจอร์หลัก

#### 1. **การติดตามความคืบหน้าแบบต่อผู้ใช้ (Per-User Progress Tracking)**
- เก็บข้อมูลผลการเล่นเกมทุกครั้ง
- บันทึกคะแนน, ความแม่นยำ, เวลาเล่น, ชนิดแบบฝึก
- เก็บข้อมูลวันที่-เวลา, XP, เพชร, หัวใจ
- วิเคราะห์ความคืบหน้าในอนาคต

#### 2. **ระบบปลดล็อกด่านอัตโนมัติ (Automatic Level Unlocking)**
- ปลดล็อกด่านถัดไปเมื่อได้คะแนนเฉลี่ย ≥ 70%
- ใช้ผลการเล่นครั้งล่าสุดหรือคำนวณจากหลายครั้ง
- ระบบความปลอดภัยป้องกันการเข้าถึงข้อมูลของผู้อื่น

#### 3. **การซิงค์ข้อมูลแบบ Real-time**
- อัปเดตสถานะแบบ real-time หรือ near real-time
- รองรับการทำงานออฟไลน์ (บันทึกไว้และซิงค์ภายหลัง)
- Auto-reconnect พร้อม backoff
- Conflict resolution (last-write-wins)

#### 4. **การจัดการข้อมูลแบบครบวงจร**
- เก็บข้อมูลสถิติผู้ใช้ (XP, เพชร, หัวใจ, เลเวล, streak)
- บันทึกประวัติการเล่นเกม
- ระบบ achievements และ badges
- การวิเคราะห์ประสิทธิภาพ

---

## 📁 โครงสร้างไฟล์

### Frontend Services
```
src/services/
├── gameProgressService.js      # บริการติดตามความคืบหน้าเกม
├── levelUnlockService.js       # บริการปลดล็อกด่าน
└── userStatsService.js         # บริการสถิติผู้ใช้แบบ real-time
```

### Backend API
```
backend-progress-api.js         # Express API server
backend-progress-package.json   # Dependencies
```

### Updated Components
```
src/screens/
├── NewLessonGame.js           # เกมบทเรียนหลัก (อัปเดตแล้ว)
├── ThaiVowelGame.js           # เกมสระไทย (อัปเดตแล้ว)
├── LevelStage1.js             # หน้าด่านระดับ 1 (อัปเดตแล้ว)
├── LevelStage2.js             # หน้าด่านระดับ 2
└── LevelStage3.js             # หน้าด่านระดับ 3
```

---

## 🚀 การติดตั้งและใช้งาน

### 1. Frontend Setup

#### ติดตั้ง Dependencies
```bash
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install socket.io-client
npm install axios
```

#### เริ่มใช้งาน Services
```javascript
// ใน App.js หรือ component หลัก
import gameProgressService from './src/services/gameProgressService';
import levelUnlockService from './src/services/levelUnlockService';
import userStatsService from './src/services/userStatsService';

// เริ่มต้น services
await gameProgressService.initialize(userId);
await levelUnlockService.initialize(userId);
await userStatsService.initialize(userId);
```

### 2. Backend Setup

#### ติดตั้ง Dependencies
```bash
cd /path/to/Thai-Meow
cp backend-progress-package.json package.json
npm install
```

#### ตั้งค่า Environment Variables
```bash
# .env
MONGODB_URI=mongodb://localhost:27017/thai-meow-progress
JWT_SECRET=your-secret-key
PORT=3001
```

#### เริ่มต้น Server
```bash
npm start
# หรือ
node backend-progress-api.js
```

---

## 📊 API Endpoints

### User Stats API
```javascript
// อัปเดตสถิติผู้ใช้
POST /api/user/stats
{
  "userId": "user123",
  "stats": {
    "xp": 150,
    "diamonds": 25,
    "hearts": 5,
    "level": 2,
    "streak": 5,
    "accuracy": 85.5
  }
}

// ดึงสถิติผู้ใช้
GET /api/user/stats/:userId
```

### Game Sessions API
```javascript
// บันทึกผลการเล่นเกม
POST /api/game/sessions
{
  "userId": "user123",
  "sessionData": {
    "lessonId": 1,
    "category": "consonants_basic",
    "score": 85,
    "accuracy": 0.85,
    "timeSpent": 300,
    "questionTypes": {
      "DRAG_MATCH": 5,
      "PICTURE_MATCH": 3,
      "LISTEN_CHOOSE": 2
    },
    "completedAt": "2024-01-15T10:30:00Z",
    "heartsRemaining": 4,
    "diamondsEarned": 3,
    "xpEarned": 85,
    "streak": 5,
    "totalQuestions": 10,
    "correctAnswers": 8,
    "wrongAnswers": 2
  }
}

// ดึงประวัติการเล่นเกม
GET /api/game/sessions/:userId?limit=50&offset=0&lessonId=1
```

### Level Unlock API
```javascript
// ปลดล็อกด่าน
POST /api/levels/unlock
{
  "userId": "user123",
  "unlockData": {
    "currentLevel": "level1",
    "unlockedLevel": "level2",
    "accuracy": 85,
    "score": 85,
    "attempts": 1,
    "unlockReason": "performance_threshold_met"
  }
}

// ดึงรายการด่านที่ปลดล็อกแล้ว
GET /api/levels/unlocks/:userId
```

### Progress Summary API
```javascript
// ดึงสรุปความคืบหน้าทั้งหมด
GET /api/progress/summary/:userId
```

---

## 🎮 การใช้งานในเกม

### 1. บันทึกผลการเล่นเกม

```javascript
// ใน NewLessonGame.js หรือ ThaiVowelGame.js
import gameProgressService from '../services/gameProgressService';

const finishLesson = async (timeSpentSec = 0) => {
  // สร้างข้อมูล session
  const sessionData = {
    lessonId: currentLessonId,
    category: currentCategory,
    score: score,
    accuracy: accuracy / 100,
    timeSpent: timeSpentSec,
    questionTypes: gameProgress.questionTypes || {},
    completedAt: new Date().toISOString(),
    heartsRemaining: hearts,
    diamondsEarned: diamondsGained,
    xpEarned: xpGained,
    streak: gameProgress.streak || 0,
    maxStreak: gameProgress.maxStreak || 0,
    level: Math.floor((userStats?.xp || 0 + xpGained) / 100) + 1,
    totalQuestions: questions.length,
    correctAnswers: gameProgress.correctAnswers,
    wrongAnswers: gameProgress.wrongAnswers
  };

  // บันทึก session
  const savedSession = await gameProgressService.saveGameSession(sessionData);
  
  // ตรวจสอบการปลดล็อกด่าน
  const unlockResult = await levelUnlockService.checkAndUnlockNextLevel(
    `level${currentLessonId}`, 
    { accuracy: accuracy, score: score, attempts: 1 }
  );
  
  if (unlockResult) {
    console.log('🎉 Next level unlocked!', unlockResult);
  }
};
```

### 2. อัปเดตสถิติผู้ใช้แบบ Real-time

```javascript
// ใน HomeScreen.js หรือหน้าอื่นๆ
import { useUserData } from '../contexts/UserDataContext';

const HomeScreen = () => {
  const { stats: userStats, updateUserStats } = useUserData();
  
  // แสดงข้อมูล real-time
  return (
    <View>
      <Text>Hearts: {userStats?.hearts || 5}</Text>
      <Text>Diamonds: {userStats?.diamonds || 0}</Text>
      <Text>XP: {userStats?.xp || 0}</Text>
      <Text>Level: {userStats?.level || 1}</Text>
    </View>
  );
};
```

### 3. ตรวจสอบสถานะด่าน

```javascript
// ใน LevelStage1.js
import levelUnlockService from '../services/levelUnlockService';

const fetchStages = async () => {
  const stages = await Promise.all(
    baseStages.map(async (stage) => {
      const levelId = `level${stage.lesson_id}`;
      const levelProgress = await levelUnlockService.getLevelProgress(levelId);
      
      return {
        ...stage,
        status: levelProgress.status, // 'locked', 'unlocked', 'completed'
        progress: levelProgress.accuracy / 100,
        accuracy: levelProgress.accuracy,
        attempts: levelProgress.attempts,
        bestScore: levelProgress.bestScore,
        lastPlayed: levelProgress.lastPlayed
      };
    })
  );
  
  setStages(stages);
};
```

---

## 🔒 ความปลอดภัย

### 1. การตรวจสอบสิทธิ์
- ใช้ JWT token สำหรับ authentication
- ตรวจสอบว่า user สามารถเข้าถึงข้อมูลของตัวเองเท่านั้น
- ป้องกันการเข้าถึงข้อมูลของผู้อื่น

### 2. การตรวจสอบข้อมูล
- ตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก
- ใช้ validation rules สำหรับ accuracy threshold
- ป้องกันการส่งข้อมูลที่ไม่ถูกต้อง

### 3. การจัดการข้อผิดพลาด
- Error handling ที่ครอบคลุม
- Logging สำหรับ debugging
- Graceful fallback เมื่อเกิดข้อผิดพลาด

---

## 📱 การทำงานออฟไลน์

### 1. Local Storage
- ใช้ AsyncStorage เก็บข้อมูลชั่วคราว
- Queue ระบบสำหรับข้อมูลที่ยังไม่ได้ซิงค์
- Auto-sync เมื่อกลับมาออนไลน์

### 2. Conflict Resolution
- ใช้ last-write-wins strategy
- เปรียบเทียบ timestamp
- Merge ข้อมูลอย่างปลอดภัย

### 3. Network Monitoring
- ใช้ NetInfo ตรวจสอบสถานะเครือข่าย
- Auto-reconnect พร้อม exponential backoff
- Retry mechanism สำหรับการซิงค์

---

## 🎯 การตั้งค่าและปรับแต่ง

### 1. Unlock Rules
```javascript
// ปรับแต่งกฎการปลดล็อก
levelUnlockService.updateUnlockRules({
  accuracyThreshold: 70,    // 70% accuracy required
  minimumAttempts: 1,       // At least 1 attempt
  consecutiveSuccess: false // Not required
});
```

### 2. Sync Settings
```javascript
// ปรับแต่งการซิงค์
gameProgressService.setOnlineStatus(true);
userStatsService.setOnlineStatus(true);
```

### 3. Performance Tuning
```javascript
// ปรับแต่งประสิทธิภาพ
const config = {
  throttleWindow: 600,      // ms
  debounceDelay: 180,       // ms
  maxRetries: 3,
  backoffMultiplier: 2
};
```

---

## 📈 การวิเคราะห์และรายงาน

### 1. User Progress Analytics
- ติดตามความคืบหน้าของผู้ใช้แต่ละคน
- วิเคราะห์ประสิทธิภาพการเรียนรู้
- แนะนำเนื้อหาที่เหมาะสม

### 2. Game Performance Metrics
- วิเคราะห์ความยากของคำถาม
- ติดตามเวลาการตอบ
- ปรับปรุงอัลกอริทึมการสร้างคำถาม

### 3. System Health Monitoring
- ติดตามการใช้งาน API
- ตรวจสอบประสิทธิภาพฐานข้อมูล
- Alert เมื่อเกิดปัญหา

---

## 🚨 การแก้ไขปัญหา

### 1. ปัญหาการซิงค์
```javascript
// ตรวจสอบสถานะการซิงค์
const syncStatus = await gameProgressService.getSyncStatus();
console.log('Sync status:', syncStatus);

// บังคับซิงค์
await gameProgressService.syncOfflineQueue();
```

### 2. ปัญหาการปลดล็อก
```javascript
// ตรวจสอบสถานะด่าน
const levelStatus = await levelUnlockService.getLevelStatus('level2');
console.log('Level status:', levelStatus);

// ปลดล็อกด่านด้วยตนเอง (สำหรับ admin)
await levelUnlockService.unlockLevel({
  userId: 'user123',
  unlockedLevel: 'level2',
  unlockReason: 'manual_unlock'
});
```

### 3. ปัญหาข้อมูลหาย
```javascript
// กู้คืนข้อมูลจาก local storage
const localData = await gameProgressService.getLocalSessions();
console.log('Local data:', localData);

// Export ข้อมูล
const exportData = await userStatsService.exportUserData();
console.log('Export data:', exportData);
```

---

## 🔄 การอัปเดตและบำรุงรักษา

### 1. การอัปเดต Schema
- ใช้ MongoDB migration scripts
- ตรวจสอบ compatibility
- Backup ข้อมูลก่อนอัปเดต

### 2. การทำความสะอาดข้อมูล
```javascript
// ลบข้อมูลเก่า
await gameProgressService.clearOldSessions(30); // 30 days

// Archive ข้อมูล
await gameProgressService.archiveCompletedSessions();
```

### 3. การ Monitor และ Alert
- ตั้งค่า monitoring สำหรับ API endpoints
- Alert เมื่อเกิด error rate สูง
- ติดตาม performance metrics

---

## 📞 การสนับสนุน

หากมีปัญหาหรือคำถามเกี่ยวกับระบบ Progress Tracking:

1. ตรวจสอบ logs ใน console
2. ดู documentation ในไฟล์นี้
3. ตรวจสอบ API endpoints ใน backend
4. ติดต่อทีมพัฒนา

---

## 🎉 สรุป

ระบบ Progress Tracking นี้ให้การติดตามความคืบหน้าแบบครบวงจรสำหรับ Thai-Meow:

✅ **การบันทึกข้อมูลแบบต่อผู้ใช้** - เก็บข้อมูลทุกการเล่นเกม
✅ **การปลดล็อกด่านอัตโนมัติ** - ปลดล็อกเมื่อได้ 70%+
✅ **การซิงค์แบบ Real-time** - อัปเดตทันทีทุกหน้าจอ
✅ **การทำงานออฟไลน์** - ทำงานได้แม้ไม่มีเน็ต
✅ **ความปลอดภัย** - ป้องกันการเข้าถึงข้อมูลของผู้อื่น
✅ **การวิเคราะห์** - ข้อมูลสำหรับปรับปรุงระบบ

ระบบนี้พร้อมใช้งานและสามารถขยายได้ตามความต้องการในอนาคต! 🚀
