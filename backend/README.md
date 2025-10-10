# 🐱 Thai-Meow Backend API

Backend API server สำหรับแอป Thai-Meow เรียนรู้ภาษาไทย

## 🚀 Features

- ✅ MongoDB Atlas Integration
- ✅ User Stats API
- ✅ Auto Port Handling
- ✅ Colorful Logging
- ✅ Error Handling
- ✅ Request Timing
- ✅ Production Ready

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

สร้างไฟล์ `.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thai-meow
```

## 🏃‍♂️ Running

```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### GET /api/user/stats/:userId
ดึงข้อมูลสถิติผู้ใช้

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "671f8e2b...",
    "username": "demo",
    "level": 1,
    "xp": 120,
    "streak": 3,
    "hearts": 5,
    "lessonsCompleted": 7,
    "lastActiveAt": "2025-10-06T09:45:00.123Z",
    "badges": ["starter", "first-lesson"]
  }
}
```

## 🧪 Testing

```bash
curl http://localhost:3000/api/user/stats/demo
```

## 📁 Project Structure

```
backend/
├── server-pro.js          # Main server file
├── .env                   # Environment variables
├── package.json           # Dependencies
├── models/
│   └── User.js           # User model
├── controllers/
│   └── user.controller.js # User controller
└── routes/
    └── user.routes.js    # User routes
```

## 🔥 Production Features

- **Auto Port Detection**: เปลี่ยน port อัตโนมัติถ้าถูกใช้
- **Colorful Logs**: Log สีสวยงามใน console
- **Request Timing**: วัดเวลาตอบสนอง
- **Error Handling**: จัดการ error อย่างเหมาะสม
- **MongoDB Integration**: เชื่อมต่อ MongoDB Atlas
- **CORS Support**: รองรับ cross-origin requests

## 📊 Logs

- **Console**: สีสวยงามพร้อม timestamp
- **File**: บันทึกใน `access.log`
- **Error**: บันทึกใน `error.log`

## 🎯 Ready for Production!

Backend นี้พร้อมใช้งานกับ React Native app ทันที!
