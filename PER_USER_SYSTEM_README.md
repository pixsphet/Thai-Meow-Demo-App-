# 🧠 Per-User Statistics & Progress System

ระบบบันทึกสถิติและความคืบหน้าแยกตามผู้ใช้ (Per-User) สำหรับ Thai-Meow App

## 🎯 ภาพรวมระบบ

ระบบนี้ทำให้ทุกอย่างที่เกี่ยวกับสถิติ/ความคืบหน้า เซฟ/อ่าน ตาม user คนที่ล็อกอินอยู่ (ไม่ปนกัน) โดยใช้:
- **Frontend**: React Native (Expo) + AsyncStorage
- **Backend**: Node.js/Express + MongoDB Atlas
- **Authentication**: JWT Token-based

## 🏗️ สถาปัตยกรรมระบบ

### Backend Structure

```
backend/
├── middleware/
│   └── auth.js                 # JWT middleware
├── models/
│   ├── UserStats.js           # สถิติรวมต่อผู้ใช้
│   └── Progress.js            # ความคืบหน้าบทเรียนต่อผู้ใช้
├── routes/
│   ├── progressPerUser.js     # API routes สำหรับ progress (มี auth)
│   └── userStats.js           # API routes สำหรับ user stats (มี auth)
└── server.js                  # ใช้ auth middleware
```

### Frontend Structure

```
src/
├── contexts/
│   └── AuthContext.js         # จัดการ user & token
├── services/
│   └── progressServicePerUser.js  # API calls (ไม่ต้องส่ง userId)
├── utils/
│   └── tokenStore.js          # helper สำหรับ token
└── screens/
    └── NewLessonGame.js       # ใช้ per-user system
```

## 🔧 การทำงาน

### 1. Authentication Flow

```javascript
// 1. User login
const { login } = useAuth();
await login(userData, jwtToken);

// 2. Token ถูกส่งอัตโนมัติในทุก API call
// 3. Server อ่าน userId จาก JWT
// 4. ข้อมูลถูกแยกตาม userId อัตโนมัติ
```

### 2. Progress Saving

```javascript
// Frontend: ไม่ต้องส่ง userId
await saveProgress(lessonId, {
  lessonId: 'thai-consonants',
  currentIndex: 5,
  score: 100,
  hearts: 3,
  questionsSnapshot: [...]
});

// Backend: อ่าน userId จาก JWT
// req.user.id = 'user123' (จาก JWT)
```

### 3. Data Separation

- **UserStats**: `{ userId: 'user123', level: 5, xp: 1000, ... }`
- **Progress**: `{ userId: 'user123', lessonId: 'thai-consonants', ... }`
- **AsyncStorage**: `autosave:user123:thai-consonants`

## 📊 Database Schema

### UserStats Collection
```javascript
{
  userId: String,           // Primary key
  level: Number,           // ระดับผู้เล่น
  xp: Number,              // คะแนนประสบการณ์
  nextLevelXp: Number,     // XP ที่ต้องใช้เลื่อนเลเวล
  currentStreak: Number,   // ไฟต่อเนื่องปัจจุบัน
  bestStreak: Number,      // ไฟต่อเนื่องดีสุด
  lastLoginDate: Date,     // วันที่ล็อกอินล่าสุด
  diamonds: Number,        // เพชร
  hearts: Number,          // หัวใจ
  maxHearts: Number,       // หัวใจสูงสุด
  lessonsCompleted: Number, // จำนวนบทเรียนที่จบ
  correctAnswers: Number,   // คำตอบที่ถูก
  wrongAnswers: Number,    // คำตอบที่ผิด
  badges: [String],        // เหรียญตรา
  updatedAt: Date
}
```

### Progress Collection
```javascript
{
  userId: String,           // Foreign key
  lessonId: String,         // เช่น 'thai-consonants'
  category: String,         // เช่น 'consonants_basic'
  currentIndex: Number,     // ข้อปัจจุบัน
  total: Number,            // จำนวนข้อทั้งหมด
  hearts: Number,           // หัวใจที่เหลือ
  score: Number,            // คะแนน
  xp: Number,               // XP ที่ได้
  perLetter: Object,        // ความชำนาญต่อตัวอักษร
  answers: Object,          // คำตอบที่บันทึก
  questionsSnapshot: Array, // snapshot ของคำถาม
  updatedAt: Date
}
```

## 🚀 API Endpoints

### User Stats (ต้องมี JWT)
- `GET /api/user/stats` - ดึงสถิติผู้ใช้
- `POST /api/user/stats` - อัพเดตสถิติผู้ใช้
- `POST /api/user/streak/tick` - เพิ่มไฟต่อเนื่อง

### Progress (ต้องมี JWT)
- `POST /api/progress/session` - บันทึกความคืบหน้า
- `GET /api/progress/session?lessonId=xxx` - ดึงความคืบหน้า
- `DELETE /api/progress/session?lessonId=xxx` - ลบความคืบหน้า
- `POST /api/progress/finish` - จบบทเรียน + อัพเดตสถิติ
- `GET /api/progress/user` - ดึงความคืบหน้าทั้งหมด

## 🔐 Security Features

### JWT Middleware
```javascript
// middleware/auth.js
module.exports = function auth(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  
  if (!token) {
    req.user = { id: 'demo' }; // Fallback สำหรับ dev
    return next();
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    next();
  } catch (e) {
    req.user = { id: 'demo' }; // Fallback
    next();
  }
};
```

### Per-User AsyncStorage Keys
```javascript
// utils/tokenStore.js
const autosaveKey = async (lessonId) => {
  const uid = await getCurrentUserId();
  return `autosave:${uid || 'demo'}:${lessonId}`;
};
```

## 🧪 การทดสอบ

### 1. เริ่ม Backend
```bash
cd backend
npm start
```

### 2. รัน Test Script
```bash
node test-per-user-system.js
```

### 3. ทดสอบใน App
1. ล็อกอินเป็น User A → เล่นไป 5 ข้อ → ออกกลางคัน
2. ล็อกเอาต์ → ล็อกอิน User B → ไม่เห็นความคืบหน้าของ A
3. กลับไป User A → ได้ต่อจากข้อเดิม
4. จบบทเรียน → สถิติอัพเดตเฉพาะ User A

## 📱 การใช้งานใน Frontend

### 1. Setup AuthContext
```javascript
// App.js
import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### 2. ใช้ใน Game Screen
```javascript
// NewLessonGame.js
import { useAuth } from '../contexts/AuthContext';
import { saveProgress, restoreProgress } from '../services/progressServicePerUser';

const { user, isAuthenticated } = useAuth();

// บันทึกความคืบหน้า (ไม่ต้องส่ง userId)
await saveProgress(lessonId, progressData);

// ดึงความคืบหน้า (ไม่ต้องส่ง userId)
const progress = await restoreProgress(lessonId);
```

## ⚠️ ข้อควรระวัง

1. **Index**: ต้องมี `userId` index ในทุก collection
2. **JWT**: ถ้าไม่มี token จะใช้ `userId = 'demo'`
3. **AsyncStorage**: Key ต้องมี userId เพื่อไม่ให้ปนกัน
4. **Logout**: ควรเคลียร์ local data เมื่อ logout

## 🔄 Migration จากระบบเก่า

1. ระบบเก่ายังทำงานได้ (ไม่มี auth)
2. ระบบใหม่ทำงานควบคู่ (มี auth)
3. ข้อมูลเก่าจะใช้ `userId = 'demo'`
4. ข้อมูลใหม่จะใช้ `userId` จาก JWT

## 📈 Performance

- **Database**: Index ตาม `userId` ทำให้ query เร็ว
- **Caching**: AsyncStorage สำหรับ offline support
- **Batch Operations**: บันทึกทั้ง local + server
- **Fallback**: Server ไม่ได้ → ใช้ local data

## 🎉 สรุป

ระบบนี้ทำให้:
- ✅ ข้อมูลแยกตามผู้ใช้
- ✅ JWT รับรองตัวตน
- ✅ Offline support
- ✅ Backward compatibility
- ✅ Scalable architecture

พร้อมใช้งานแล้ว! 🚀

