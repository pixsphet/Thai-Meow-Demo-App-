## ThaiMeow — สรุประบบปัจจุบัน (ฉบับละเอียด)

แอปพลิเคชันเรียนภาษาไทยสำหรับชาวต่างชาติแบบ Cross‑platform (Android/iOS) ด้วย React Native + Expo พร้อม Backend บน Node.js/Express และฐานข้อมูล MongoDB รองรับมินิเกม บทเรียน และการติดตามความก้าวหน้าแบบครบวงจร

### 1) บทนำ
ThaiMeow ตั้งใจทำให้การเรียนภาษาไทย “เข้าใจง่าย สนุก และเห็นพัฒนาการได้จริง” ด้วยบทเรียนที่เป็นขั้นบันได มินิเกมหลากหลาย ระบบคะแนน/เลเวล/สตรีค และสถิติภาพรวมแบบ Dashboard รวมถึงเสียงอ่านเจ้าของภาษา (TTS) เพื่อช่วยฝึกการออกเสียงอย่างเป็นธรรมชาติ

### 2) ภาพรวมสถาปัตยกรรม
- Mobile App: React Native 0.81 + Expo 54, ใช้งานบน Android/iOS
- Backend API: Node.js (Express 5) ให้บริการ REST API สำหรับ Auth/Progress/Lessons/Vocab/Game Results/Friends/TTS
- Database: MongoDB + Mongoose เป็นแหล่งเก็บข้อมูลผู้ใช้ ความคืบหน้า ผลเกม และคำขอเป็นเพื่อน
- TTS: ต่อบริการ AI for Thai VajaX ผ่าน endpoint `/api/tts/speak`
- State/Sync ชั้นแอป: `UnifiedStatsContext` + `realUserStatsService` + `dailyStreakService` ประสาน XP/Level/Streak และสถิติต่าง ๆ

โครงสร้างโครงการ (บางส่วน):
- `src/` หน้าจอ มินิเกม บริการ และคอนเท็กซ์สถานะผู้ใช้
- `backend/` Express API, โมเดล Mongoose, คอนโทรลเลอร์ และไฟล์เซิร์ฟเวอร์ (`server.js`, `server-pro.js`)

### 3) เทคโนโลยีที่ใช้
- Frontend: React Native, Expo, React Navigation, Lottie, Expo AV/FileSystem/Speech
- Backend: Express 5, JWT, Morgan, CORS, dotenv
- Database: MongoDB + Mongoose
- เสียงอ่าน (TTS): AI for Thai VajaX (ต้องมี `VAJAX_API_KEY`)

### 4) ฟีเจอร์หลัก (Current Implementation)
- บทเรียน/คอร์ส: คำศัพท์ พยัญชนะ สระ วรรณยุกต์ และหมวดคำในชีวิตประจำวัน แบ่งเป็นด่าน/ระดับความยาก พร้อมข้อมูลภาพ/เสียง
- มินิเกม/แบบฝึกหัด:
  - Matching (ภาพ–เสียง–คำ), Multiple-choice, Fill-in-the-blank, Order/Build-sentence
  - เก็บผลเกม: คะแนน ความแม่นยำ เวลาเล่น รายข้อคำถาม และคำนวณ XP อัตโนมัติ
- ระบบ TTS:
  - Endpoint: `POST /api/tts/speak` ต่อกับ VajaX สามารถกำหนด speaker/style/speed/reference ได้ (ขึ้นกับ config)
- ระบบติดตามผล (Progress Tracking):
  - ค่า XP/Level (Level = floor(XP/100) + 1), Diamonds, Hearts/MaxHearts
  - Daily Streak + Longest/Max Streak, ปรับตามเวลาเข้าใช้งาน และแสดงผลแจ้งเตือนเชิง UI
  - บันทึกการเล่นต่อบทเรียน: คะแนน % ความถูกต้อง เวลาเล่น ความคืบหน้า
  - ปลดล็อกด่าน (`unlockedLevels`) ตามเงื่อนไขการผ่านบทเรียน
- ระบบเพื่อน (Friends): ค้นหา/ขอเป็นเพื่อน/ยอมรับ/ปฏิเสธ/ลบ และดึงรายการคำขอค้างอยู่
- Dashboard ภายในแอป: แสดง XP/Level/Streak/Hearts/Diamonds/Accuracy/Time/Progress ต่อบทเรียน และผลเกมล่าสุด

### 5) โครงสร้างข้อมูล (สรุปโมเดลหลัก)
- User
  - ฟิลด์สำคัญ: `username`, `email`, `passwordHash`, `petName`, `level`, `xp`, `hearts/maxHearts`, `diamonds`, `streak/longestStreak/maxStreak`, `lessonsCompleted`, `totalSessions`, `totalCorrectAnswers/totalWrongAnswers/averageAccuracy`, `totalTimeSpent`, `lastPlayed`, `lastGameResults`, `badges[]`, `achievements[]`, `friends[]`, `unlockedLevels[]`
  - เมธอด: `addXP(xpGain)` คำนวณ XP/Level, `updateStreak()` อัปเดต streak ตามวันใช้งาน
- Progress (ต่อบทเรียน)
  - `userId`, `lessonId`, `category`, `currentIndex`, `total`, `hearts`, `score`, `xp`, `progress%`, `accuracy%`, `completed`, `completedAt`, `perLetter`, `answers`, `questionsSnapshot`
- UserProgress (บันทึกผลจบบท)
  - `accuracy`, `score`, `xpEarned`, `diamondsEarned`, `heartsRemaining`, `timeSpentSec`, `unlockedNext`, `completedAt`
- GameResult (ผลเกม/โหมด)
  - `lessonKey`, `category`, `gameMode`, `score/maxScore`, `accuracy`, `timeSpent`, `questions[]`, `difficulty`, `xpGained`, `achievements[]`, `sessionData`, `isCompleted/isPerfect`, `streak`, `rank/percentile`
- FriendRequest
  - `sender`, `receiver`, `status (pending|accepted|rejected)`, เวลาสร้าง/แก้ไข

หมายเหตุด้านตรรกะสำคัญ:
- การคำนวณ Level: `Level = floor(XP / 100) + 1`
- การอัปเดต Streak: เปรียบเทียบ `lastActiveAt` แบบวันต่อวัน; ข้ามมากกว่า 1 วันจะรีเซ็ตเป็น 1; เก็บ `longestStreak`, `maxStreak`

### 6) สรุป REST API ที่สำคัญ
- Auth (`/api/auth`)
  - `POST /register` สมัครสมาชิก (บังคับ `username`, `email`, `password`)
  - `POST /login` เข้าสู่ระบบ (JWT อายุ 7 วัน)
- User (`/api/user`)
  - `GET /stats` (JWT) ดึงสถิติผู้ใช้ปัจจุบัน
  - `POST /stats` (JWT) อัปเดตสถิติผู้ใช้ปัจจุบัน (xp/level/streak/diamonds/hearts ฯลฯ)
  - `PUT /profile` (JWT) อัปเดตโปรไฟล์ผู้ใช้
  - `POST /change-password` (JWT) เปลี่ยนรหัสผ่าน
  - `POST /unlock-level` ปลดล็อกด่าน (เดโม/ทดสอบ)
- Lessons (`/api/lessons`)
  - `GET /unlocked/:userId` ดึงรายการด่านที่ปลดล็อก
  - มีตรรกะตรวจปลดล็อกด่านถัดไปตามผลสำเร็จ
- Progress ต่อผู้ใช้ (`/api/progress/user`)
  - `POST /finish` บันทึกผลบทเรียน คำนวณ XP/เพชร/หัวใจ/สถิติรวม และ snapshot สถานะใหม่
- Game Results (`/api/game-results`)
  - รองรับการบันทึก/สรุปสถิติ/กระดานผู้นำ (ขึ้นกับการเรียกใช้งานในแอป)
- Vocabulary (`/api/vocab`)
  - ตัวอย่าง: `/consonants` (พยัญชนะไทย), `/vowels/...` (ข้อมูลสระ)
- Friends (`/api/friends`)
  - `GET /search` (JWT) ค้นหาผู้ใช้
  - `POST /request` (JWT) ส่งคำขอเป็นเพื่อน
  - `POST /accept` (JWT) ยอมรับคำขอ
  - `POST /reject` (JWT) ปฏิเสธคำขอ
  - `GET /list` (JWT) รายชื่อเพื่อน
  - `GET /requests` (JWT) คำขอค้างอยู่
  - `DELETE /remove` (JWT) ลบเพื่อน
- TTS (`/api/tts`)
  - `POST /speak` ส่ง `{ text, speaker?, style?, speed? }` รับ URL เสียงจาก VajaX

### 7) การติดตั้งและเริ่มต้นใช้งาน
สิ่งที่ต้องเตรียม:
- Node.js + npm, MongoDB URI, และคีย์ `VAJAX_API_KEY` สำหรับ VajaX

ตัวอย่างไฟล์ `.env` ในโฟลเดอร์ `backend/` (ใช้ชื่อ `config.env` ตามโปรเจกต์):
```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret

# AI for Thai VajaX
VAJAX_API_KEY=your_vajax_key
VAJAX_SPEAKER=nana
VAJAX_STYLE=
VAJAX_SPEED=1.0
```

คำสั่งรัน (root project):
```
# รันพร้อมกัน Frontend + Backend
npm run dev

# หรือรันแยก
npm run backend     # ภายใต้โฟลเดอร์ backend
npm start           # Expo dev client
```

ตรวจสุขภาพระบบ Backend:
- Health Check: `GET http://localhost:<PORT>/api/health`
- Root: `GET http://localhost:<PORT>/`

หมายเหตุพอร์ต: เซิร์ฟเวอร์มีระบบเลื่อนพอร์ตอัตโนมัติถ้าพอร์ตซ้ำ (เริ่มจาก `process.env.PORT` หรือ 3000)

### 8) ข้อจำกัดปัจจุบัน
- ยังไม่มีการประเมินการออกเสียงจากไมโครโฟนผู้ใช้ (ใช้ TTS เพื่อฟังเสียงตัวอย่างแทน)
- ยังไม่มีห้องเรียนสด/Community ภายในแอป
- ยังไม่มีการปรับบทเรียนอัตโนมัติด้วย AI ตามความสามารถผู้เรียน
- ต้องออนไลน์เพื่อซิงก์ข้อมูลและดึงสื่อ/เนื้อหา

### 9) Roadmap (ทิศทางพัฒนาต่อ)
- เพิ่มระบบประเมินการออกเสียงจากผู้ใช้ (ASR/Pronunciation Scoring)
- เพิ่ม Community/Leaderboard/กิจกรรมรายสัปดาห์
- Adaptive Learning ปรับระดับตามพฤติกรรมการเรียนรู้
- เครื่องมือสำหรับครู/ผู้สอนในการสร้างบทเรียน/แบบฝึกหัด


