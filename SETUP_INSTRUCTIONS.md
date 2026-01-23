# 📖 Thai-Meow Setup Instructions

คู่มือการติดตั้งและตั้งค่าโปรเจกต์ Thai-Meow สำหรับผู้รับมอบงาน

---

## 🎯 ภาพรวม

โปรเจกต์นี้ประกอบด้วย 2 ส่วนหลัก:
1. **Frontend** - React Native/Expo Mobile App + Web
2. **Backend** - Node.js/Express API Server

---

## 📋 Prerequisites

### Required Software
- ✅ **Node.js** 18+ ([Download](https://nodejs.org/))
- ✅ **npm** หรือ **yarn** (มากับ Node.js)
- ✅ **Git** ([Download](https://git-scm.com/))
- ✅ **MongoDB Atlas Account** (Free) หรือ MongoDB Local

### Optional (สำหรับ Mobile Development)
- ✅ **Expo CLI** - `npm install -g expo-cli`
- ✅ **Android Studio** - สำหรับ Build Android App
- ✅ **Xcode** - สำหรับ Build iOS App (Mac เท่านั้น)

---

## 🚀 Step-by-Step Setup

### Step 1: Clone/Download Project

```bash
# ถ้าใช้ Git
git clone <repository-url>
cd Thai-Meow

# หรือ Extract ZIP file ที่ได้รับ
```

### Step 2: Install Frontend Dependencies

```bash
# อยู่ใน root directory
npm install
```

**หมายเหตุ:** อาจใช้เวลาสักครู่ (5-10 นาที) ขึ้นอยู่กับความเร็วอินเทอร์เน็ต

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Step 4: Setup MongoDB

#### Option A: MongoDB Atlas (แนะนำ - ฟรี)

1. สร้าง Account ที่ [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. สร้าง Cluster ใหม่ (เลือก Free Tier M0)
3. สร้าง Database User:
   - Username: `thai-meow-user`
   - Password: สร้างรหัสผ่านที่ปลอดภัย
4. Whitelist IP Address:
   - คลิก "Add IP Address"
   - เลือก "Allow Access from Anywhere" (0.0.0.0/0) สำหรับ Development
5. Get Connection String:
   - คลิก "Connect" → "Connect your application"
   - Copy Connection String:
     ```
     mongodb+srv://thai-meow-user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - แก้ไข `<password>` เป็นรหัสผ่านที่สร้าง
   - เพิ่ม Database name: `/thai-meow` ก่อน `?`

#### Option B: Local MongoDB

```bash
# Ubuntu/Debian
sudo apt install mongodb

# macOS (Homebrew)
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS

# Connection String
mongodb://localhost:27017/thai-meow
```

### Step 5: Setup Environment Variables

1. **Copy example file:**
```bash
cd backend
cp config.env.example config.env
```

2. **Edit `backend/config.env`:**
```bash
# ใช้ Text Editor (nano, vim, VS Code)
nano config.env
```

3. **Fill in the values:**
```env
# MongoDB Connection String (จาก Step 4)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thai-meow?retryWrites=true&w=majority

# JWT Secret (สร้างรหัสผ่านยาวๆ อย่างน้อย 32 ตัวอักษร)
JWT_SECRET=your_super_secret_jwt_key_change_this_to_something_secure

# Server Port
PORT=3000
NODE_ENV=development

# CORS Origins (เพิ่ม domain ที่ต้องการ)
CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:19000

# VajaX TTS API (Optional - ถ้าไม่มีจะไม่สามารถใช้ TTS ได้)
VAJAX_API_KEY=your_vajax_api_key_here
VAJAX_SPEAKER=nana
VAJAX_STYLE=nana
VAJAX_SPEED=1.0
```

**หมายเหตุ:** 
- เปลี่ยน `JWT_SECRET` เป็นค่าที่ปลอดภัย
- `VAJAX_API_KEY` เป็น Optional (ถ้าไม่มี TTS จะไม่ทำงาน)

### Step 6: Seed Database (Optional)

```bash
cd backend
npm run seed:all
```

**หมายเหตุ:** คำสั่งนี้จะเพิ่มข้อมูลเริ่มต้น (บทเรียน, คำศัพท์) เข้า Database

### Step 7: Update Frontend API URL

1. เปิดไฟล์ `src/services/apiClient.js`
2. ตรวจสอบ `API_BASE_URL`:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Development
  : 'https://your-api-domain.com';  // Production - เปลี่ยนเป็น Backend URL ของคุณ
```

### Step 8: Run Application

#### Development Mode (Frontend + Backend พร้อมกัน)

```bash
# อยู่ใน root directory
npm run dev
```

คำสั่งนี้จะ:
- เริ่ม Backend Server ที่ `http://localhost:3000`
- เริ่ม Expo Dev Server สำหรับ Frontend

#### หรือ Run แยกกัน

**Terminal 1 - Backend:**
```bash
npm run backend
# หรือ
cd backend && npm start
```

**Terminal 2 - Frontend:**
```bash
npm start
# หรือ
expo start
```

### Step 9: Test Application

1. **Test Backend:**
   - เปิด Browser ไปที่ `http://localhost:3000/api/health`
   - ควรเห็น JSON response:
     ```json
     {
       "success": true,
       "message": "Thai Meow API is running",
       "timestamp": "...",
       "database": "Connected"
     }
     ```

2. **Test Frontend:**
   - เปิด Expo Go App บนมือถือ
   - Scan QR Code จาก Terminal
   - หรือกด `w` สำหรับ Web, `a` สำหรับ Android, `i` สำหรับ iOS

---

## 🎮 การใช้งาน

### สร้าง Account ใหม่

1. เปิดแอป → Sign Up
2. กรอกข้อมูล:
   - Username
   - Email
   - Password
   - Pet Name (ชื่อสัตว์เลี้ยงในเกม)
3. กด Sign Up

### เข้าสู่ระบบ

1. เปิดแอป → Sign In
2. กรอก Username และ Password
3. กด Sign In

### เริ่มเรียน

1. ไปที่ Home Screen
2. เลือก Level (Beginner, Intermediate, Advanced)
3. เลือกบทเรียน
4. เริ่มเล่นเกม!

---

## 🐛 Troubleshooting

### Problem: `npm install` Error

**Solution:**
```bash
# ลบ node_modules และ package-lock.json
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# ติดตั้งใหม่
npm install
cd backend && npm install
```

### Problem: MongoDB Connection Error

**Symptoms:**
- Backend ไม่สามารถเชื่อมต่อ Database ได้
- Error: `MongoServerError: Authentication failed`

**Solution:**
1. ตรวจสอบ `MONGODB_URI` ใน `backend/config.env`
2. ตรวจสอบ Username/Password ถูกต้อง
3. ตรวจสอบ MongoDB Atlas Whitelist IP
4. ตรวจสอบ Network Connection

### Problem: Backend ไม่ทำงาน

**Symptoms:**
- `npm run backend` Error
- Port 3000 ถูกใช้งานแล้ว

**Solution:**
```bash
# ตรวจสอบ Process ที่ใช้ Port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill Process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# หรือเปลี่ยน PORT ใน config.env
```

### Problem: Frontend ไม่เชื่อมต่อ Backend

**Symptoms:**
- API calls ล้มเหลว
- Network Error

**Solution:**
1. ตรวจสอบ Backend ทำงานอยู่ (`http://localhost:3000/api/health`)
2. ตรวจสอบ `API_BASE_URL` ใน `src/services/apiClient.js`
3. ตรวจสอบ CORS ใน `backend/config.env`:
   ```
   CORS_ORIGINS=http://localhost:3000,http://localhost:19006,http://localhost:19000
   ```

### Problem: Expo ไม่ทำงาน

**Solution:**
```bash
# Clear Expo Cache
expo start -c

# หรือ
rm -rf .expo
npm start
```

### Problem: Android Build Error

**Solution:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Problem: iOS Build Error

**Solution:**
```bash
cd ios
pod install
cd ..
npm run ios
```

---

## 📱 Build สำหรับ Production

### Android APK

```bash
# Development Build
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# Production Build (ต้อง Setup Keystore ก่อน)
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### iOS IPA

1. เปิด Xcode:
```bash
cd ios
open ThaiMeow.xcworkspace
```

2. ใน Xcode:
   - เลือก Target → Signing & Capabilities
   - เลือก Team
   - Product → Archive

### Web Build

```bash
expo export:web
# Output: web-build/
```

---

## 📚 เอกสารเพิ่มเติม

- `README.md` - คู่มือหลัก
- `FASTWORK_DELIVERY.md` - ข้อมูลสำหรับ FastWork
- `DEPLOYMENT_GUIDE.md` - คู่มือการ Deploy

---

## ✅ Setup Checklist

- [ ] Node.js ติดตั้งแล้ว
- [ ] Dependencies ติดตั้งแล้ว (Frontend + Backend)
- [ ] MongoDB Setup แล้ว (Atlas หรือ Local)
- [ ] `backend/config.env` ตั้งค่าแล้ว
- [ ] Database Seeded (Optional)
- [ ] Backend ทำงานได้ (`/api/health`)
- [ ] Frontend ทำงานได้
- [ ] ทดสอบ Sign Up/Sign In สำเร็จ

---

## 🆘 ต้องการความช่วยเหลือ?

1. ตรวจสอบ Troubleshooting section
2. ตรวจสอบ Logs:
   - Backend: `backend/logs/`
   - Frontend: Terminal output
3. ตรวจสอบ Environment Variables
4. ตรวจสอบ Network/Firewall

---

**ขอให้โชคดีกับการ Setup! 🎉**

*Thai-Meow - Learn Thai the Fun Way! 🐱🇹🇭*


