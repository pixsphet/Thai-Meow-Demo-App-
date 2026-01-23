# 📦 Thai-Meow - FastWork Delivery Package

## 🎯 ภาพรวมโปรเจกต์

**Thai-Meow** เป็นแอปพลิเคชันเรียนรู้ภาษาไทยแบบ Gamification สำหรับ Mobile (Android/iOS) และ Web

### ✨ ฟีเจอร์หลัก
- ✅ ระบบบทเรียนแบบขั้นบันได (Beginner → Intermediate → Advanced)
- ✅ เกมการเรียนรู้ 9 ประเภท (LISTEN_CHOOSE, PICTURE_MATCH, DRAG_MATCH, etc.)
- ✅ ระบบ Gamification (XP, Level, Hearts, Streak, Diamonds)
- ✅ ระบบเพื่อน (Friends System)
- ✅ Text-to-Speech (TTS) ด้วย VajaX API
- ✅ Progress Tracking แบบ Real-time
- ✅ Mini Games 4 เกม (Word Finder, Word Scramble, Memory Match, Speed Typing)
- ✅ Offline Support

### 🛠️ Tech Stack
- **Frontend**: React Native 0.81 + Expo 54
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT
- **Database**: MongoDB (Mongoose)
- **Platforms**: Android, iOS, Web

---

## 📋 สิ่งที่ได้รับในแพ็กเกจนี้

### 1. Source Code
- ✅ Frontend (React Native/Expo) - โค้ดทั้งหมดพร้อม
- ✅ Backend API (Node.js/Express) - พร้อมใช้งาน
- ✅ Database Models & Controllers
- ✅ UI Components & Screens
- ✅ Services & Utilities

### 2. เอกสารประกอบ
- ✅ README.md - คู่มือการติดตั้งและใช้งาน
- ✅ API Documentation - รายละเอียด API Endpoints
- ✅ Database Schema - โครงสร้างฐานข้อมูล
- ✅ Deployment Guide - คู่มือการ Deploy

### 3. Configuration Files
- ✅ `backend/config.env.example` - ตัวอย่างไฟล์ config
- ✅ `package.json` - Dependencies ทั้งหมด
- ✅ `app.json` - Expo configuration

### 4. Assets & Resources
- ✅ Images & Icons
- ✅ Lottie Animations
- ✅ Audio Resources
- ✅ JSON Data Files

---

## 🚀 Quick Start Guide

### Prerequisites
```bash
- Node.js 18+ 
- MongoDB Atlas account (หรือ MongoDB Local)
- npm หรือ yarn
- Expo CLI (สำหรับ Mobile)
- Android Studio / Xcode (สำหรับ Build Mobile App)
```

### Installation Steps

#### 1. ติดตั้ง Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

#### 2. Setup Environment Variables

สร้างไฟล์ `backend/config.env` จาก `backend/config.env.example`:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thai-meow?retryWrites=true&w=majority

# JWT Secret (เปลี่ยนเป็นค่าที่ปลอดภัย)
JWT_SECRET=your_super_secret_jwt_key_here_change_this

# Server Port
PORT=3000
NODE_ENV=production

# CORS Origins (เพิ่ม domain ของคุณ)
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# VajaX TTS API (สำหรับ Text-to-Speech)
VAJAX_API_KEY=your_vajax_api_key_here
VAJAX_SPEAKER=nana
VAJAX_STYLE=nana
VAJAX_SPEED=1.0
```

#### 3. Setup Database

```bash
# Seed ข้อมูลเริ่มต้น (Optional)
cd backend
npm run seed:all
```

#### 4. Run Application

```bash
# Development Mode (Frontend + Backend พร้อมกัน)
npm run dev

# หรือ Run แยกกัน
npm run backend    # Backend on port 3000
npm start          # Expo Dev Client
```

#### 5. Build สำหรับ Production

**Android:**
```bash
npm run android
# หรือ
cd android && ./gradlew assembleRelease
```

**iOS:**
```bash
npm run ios
# หรือเปิด Xcode และ Build
```

**Web:**
```bash
npm run web
# หรือ
expo export:web
```

---

## 🌐 Deployment Guide

### Backend Deployment (Node.js/Express)

#### Option 1: Deploy บน VPS/Cloud Server

**Requirements:**
- Ubuntu 20.04+ / CentOS 7+
- Node.js 18+
- PM2 (Process Manager)
- Nginx (Reverse Proxy)

**Steps:**

1. **Upload Code:**
```bash
scp -r backend/ user@your-server:/var/www/thai-meow-backend/
```

2. **Install Dependencies:**
```bash
cd /var/www/thai-meow-backend
npm install --production
```

3. **Setup Environment:**
```bash
cp config.env.example config.env
nano config.env  # แก้ไขค่าต่างๆ
```

4. **Install PM2:**
```bash
npm install -g pm2
```

5. **Start Server:**
```bash
pm2 start server-pro.js --name thai-meow-api
pm2 save
pm2 startup
```

6. **Setup Nginx:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Option 2: Deploy บน Heroku

```bash
cd backend
heroku create thai-meow-api
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set VAJAX_API_KEY=your_vajax_key
git push heroku main
```

#### Option 3: Deploy บน Railway / Render

1. สร้าง Project ใหม่
2. Connect GitHub Repository
3. Set Environment Variables
4. Deploy อัตโนมัติ

### Frontend Deployment

#### Web (Expo Web)

```bash
# Build Static Files
expo export:web

# Deploy ไปยัง Netlify / Vercel / GitHub Pages
# หรือ Upload folder web-build/ ไปยัง Web Server
```

#### Mobile Apps

**Android APK:**
```bash
cd android
./gradlew assembleRelease
# APK จะอยู่ที่: android/app/build/outputs/apk/release/
```

**iOS IPA:**
- เปิด Xcode
- Archive และ Upload ไปยัง App Store Connect

---

## 📱 API Endpoints

### Base URL
```
Development: http://localhost:3000
Production: https://api.yourdomain.com
```

### Authentication
```
POST   /api/auth/register       # สมัครสมาชิก
POST   /api/auth/login          # เข้าสู่ระบบ
GET    /api/auth/me             # ดูโปรไฟล์ (ต้องมี JWT Token)
```

### User Management
```
GET    /api/user/stats          # ดึงสถิติผู้ใช้
POST   /api/user/stats          # อัปเดตสถิติ
PUT    /api/user/profile        # แก้ไขโปรไฟล์
POST   /api/user/change-password # เปลี่ยนรหัสผ่าน
POST   /api/user/unlock-level   # ปลดล็อกด่าน
```

### Lessons & Progress
```
GET    /api/lessons             # รายการบทเรียน
GET    /api/lessons/unlocked/:userId  # ด่านที่ปลดล็อก
POST   /api/progress/finish     # บันทึกผลบทเรียน
GET    /api/progress/user       # ดูความคืบหน้า (ต้องมี Auth)
```

### Game Results
```
POST   /api/game-results        # บันทึกผลเกม
GET    /api/game-results/user   # ดูผลเกมของผู้ใช้
```

### Friends System
```
GET    /api/friends/search      # ค้นหาเพื่อน
POST   /api/friends/request     # ส่งคำขอเป็นเพื่อน
POST   /api/friends/accept      # ยอมรับคำขอ
POST   /api/friends/reject      # ปฏิเสธคำขอ
GET    /api/friends/list        # รายชื่อเพื่อน
GET    /api/friends/requests    # คำขอค้าง
DELETE /api/friends/remove      # ลบเพื่อน
```

### TTS (Text-to-Speech)
```
POST   /api/tts/speak           # สร้างเสียง
Body: {
  "text": "สวัสดี",
  "speaker": "nana",
  "style": "nana",
  "speed": 1.0
}
```

### Health Check
```
GET    /api/health              # ตรวจสอบสถานะ API
```

---

## 🗄️ Database Schema

### Collections

1. **users** - ข้อมูลผู้ใช้
2. **userstats** - สถิติ XP/Level/Streak
3. **vocabularies** - คำศัพท์
4. **lessons** - บทเรียน
5. **progresses** - ความคืบหน้า
6. **gameresults** - ผลเกม
7. **friends** - ระบบเพื่อน
8. **friendrequests** - คำขอเป็นเพื่อน

ดูรายละเอียดเพิ่มเติมใน `README.md`

---

## 🔐 Security Checklist

- [ ] เปลี่ยน `JWT_SECRET` เป็นค่าที่ปลอดภัย
- [ ] ตั้งค่า `MONGODB_URI` ที่ปลอดภัย (ไม่เปิดเผย password)
- [ ] ตั้งค่า CORS ให้เหมาะสม
- [ ] ใช้ HTTPS ใน Production
- [ ] ตรวจสอบ Rate Limiting (แนะนำเพิ่ม)
- [ ] ตรวจสอบ Input Validation
- [ ] Backup Database เป็นประจำ

---

## 📝 Configuration Checklist

### Backend (`backend/config.env`)
- [ ] `MONGODB_URI` - เชื่อมต่อ MongoDB
- [ ] `JWT_SECRET` - Secret Key สำหรับ JWT
- [ ] `PORT` - Port ของ Server
- [ ] `CORS_ORIGINS` - Domain ที่อนุญาต
- [ ] `VAJAX_API_KEY` - API Key สำหรับ TTS

### Frontend (`src/services/apiClient.js`)
- [ ] เปลี่ยน `API_BASE_URL` เป็น Backend URL ของคุณ

---

## 🐛 Troubleshooting

### Backend ไม่เชื่อมต่อ MongoDB
```bash
# ตรวจสอบ MONGODB_URI ใน config.env
# ตรวจสอบ Network/Firewall
# ตรวจสอบ MongoDB Atlas Whitelist IP
```

### Frontend ไม่เชื่อมต่อ Backend
```bash
# ตรวจสอบ API_BASE_URL ใน apiClient.js
# ตรวจสอบ CORS_ORIGINS ใน backend
# ตรวจสอบ Network/Firewall
```

### Build Mobile App ไม่สำเร็จ
```bash
# Android: ตรวจสอบ Android Studio และ SDK
# iOS: ตรวจสอบ Xcode และ CocoaPods
# Run: cd ios && pod install
```

---

## 📞 Support & Contact

### Documentation
- `README.md` - คู่มือหลัก
- `README_THAI.md` - คู่มือภาษาไทย
- API Documentation - ดูใน `README.md`

### Issues
หากพบปัญหา:
1. ตรวจสอบ `Troubleshooting` section
2. ตรวจสอบ Logs (`backend/logs/`)
3. ตรวจสอบ Environment Variables

---

## 📄 License

MIT License - ใช้งานได้ฟรีทั้ง Commercial และ Personal

---

## ✅ Delivery Checklist

### Code
- [x] Source Code ครบถ้วน
- [x] Dependencies ระบุใน package.json
- [x] Configuration files พร้อม
- [x] Environment variables example

### Documentation
- [x] README.md
- [x] API Documentation
- [x] Deployment Guide
- [x] Setup Instructions

### Assets
- [x] Images & Icons
- [x] Animations
- [x] Data Files

### Testing
- [ ] Backend API ทดสอบแล้ว
- [ ] Frontend ทดสอบแล้ว
- [ ] Database Schema ถูกต้อง

---

## 🎉 สรุป

โปรเจกต์นี้พร้อมใช้งานแล้ว! เพียงแค่:

1. **Setup Environment Variables** - ตั้งค่า config.env
2. **Install Dependencies** - npm install
3. **Setup Database** - เชื่อมต่อ MongoDB
4. **Run** - npm run dev
5. **Deploy** - ตาม Deployment Guide

**ขอให้โชคดีกับการใช้งาน! 🐱🇹🇭**

---

*Thai-Meow - Learn Thai the Fun Way!*


