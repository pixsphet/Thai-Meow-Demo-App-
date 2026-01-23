# 🚀 Thai-Meow Deployment Guide

คู่มือการ Deploy แอป Thai-Meow ไปยัง Production Environment

---

## 📋 Table of Contents

1. [Backend Deployment](#backend-deployment)
2. [Frontend Deployment](#frontend-deployment)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [SSL/HTTPS Setup](#sslhttps-setup)
6. [Monitoring & Logging](#monitoring--logging)

---

## 🔧 Backend Deployment

### Option 1: VPS/Cloud Server (Ubuntu)

#### Prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Deployment Steps

1. **Clone/Upload Code:**
```bash
cd /var/www
sudo mkdir -p thai-meow-backend
sudo chown -R $USER:$USER thai-meow-backend
# Upload your backend code here
```

2. **Install Dependencies:**
```bash
cd /var/www/thai-meow-backend
npm install --production
```

3. **Setup Environment:**
```bash
cp config.env.example config.env
nano config.env
```

4. **Start with PM2:**
```bash
pm2 start server-pro.js --name thai-meow-api
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

5. **Setup Nginx Reverse Proxy:**

สร้างไฟล์ `/etc/nginx/sites-available/thai-meow-api`:
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/thai-meow-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Heroku

```bash
cd backend

# Login to Heroku
heroku login

# Create app
heroku create thai-meow-api

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set VAJAX_API_KEY=your_vajax_key
heroku config:set NODE_ENV=production
heroku config:set PORT=3000

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 3: Railway

1. สร้าง Account ที่ [railway.app](https://railway.app)
2. สร้าง New Project
3. Connect GitHub Repository
4. Add Service → Deploy from GitHub
5. Set Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `VAJAX_API_KEY`
   - `NODE_ENV=production`
   - `PORT=3000`
6. Deploy อัตโนมัติ

### Option 4: Render

1. สร้าง Account ที่ [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub Repository
4. Settings:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server-pro.js`
   - **Environment**: Node
5. Add Environment Variables
6. Deploy

---

## 📱 Frontend Deployment

### Web Deployment (Expo Web)

#### Option 1: Netlify

```bash
# Build
expo export:web

# Deploy
npm install -g netlify-cli
netlify deploy --prod --dir web-build
```

หรือใช้ Netlify Dashboard:
1. สร้าง Site ใหม่
2. Connect GitHub
3. Build settings:
   - **Build command**: `expo export:web`
   - **Publish directory**: `web-build`
4. Deploy

#### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Build
expo export:web

# Deploy
cd web-build
vercel --prod
```

หรือใช้ Vercel Dashboard:
1. Import Project จาก GitHub
2. Framework Preset: Other
3. Build Command: `expo export:web`
4. Output Directory: `web-build`
5. Deploy

#### Option 3: GitHub Pages

```bash
# Build
expo export:web

# Deploy to gh-pages branch
npm install -g gh-pages
gh-pages -d web-build
```

### Mobile App Deployment

#### Android APK

**Development Build:**
```bash
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

**Production Build:**
```bash
# 1. Generate Keystore
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 2. Update android/gradle.properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password

# 3. Update android/app/build.gradle signingConfigs

# 4. Build
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

**AAB (Google Play):**
```bash
cd android
./gradlew bundleRelease
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

#### iOS IPA

1. เปิด Xcode:
```bash
cd ios
open ThaiMeow.xcworkspace
```

2. ใน Xcode:
   - เลือก Target → Signing & Capabilities
   - เลือก Team (Apple Developer Account)
   - Product → Archive
   - Distribute App → App Store Connect / Ad Hoc / Enterprise

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. สร้าง Account ที่ [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. สร้าง Cluster (Free Tier ได้)
3. สร้าง Database User
4. Whitelist IP Address (0.0.0.0/0 สำหรับ Development)
5. Copy Connection String:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/thai-meow?retryWrites=true&w=majority
   ```
6. ใส่ใน `backend/config.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/thai-meow?retryWrites=true&w=majority
   ```

### Local MongoDB

```bash
# Install MongoDB
sudo apt install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Connection String
MONGODB_URI=mongodb://localhost:27017/thai-meow
```

### Seed Database

```bash
cd backend
npm run seed:all
```

---

## ⚙️ Environment Configuration

### Backend (`backend/config.env`)

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/thai-meow?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_minimum_32_characters

# Server
PORT=3000
NODE_ENV=production

# CORS (เพิ่ม domain ของคุณ)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# VajaX TTS
VAJAX_API_KEY=your_vajax_api_key
VAJAX_SPEAKER=nana
VAJAX_STYLE=nana
VAJAX_SPEED=1.0
```

### Frontend (`src/services/apiClient.js`)

เปลี่ยน `API_BASE_URL`:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Development
  : 'https://api.yourdomain.com';  // Production
```

---

## 🔒 SSL/HTTPS Setup

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL Certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Update Nginx Config

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs thai-meow-api

# Monitor
pm2 monit

# View info
pm2 info thai-meow-api

# Restart
pm2 restart thai-meow-api
```

### Application Logs

Logs ถูกเก็บไว้ที่:
- `backend/logs/access.log` - HTTP Access Logs
- `backend/logs/error.log` - Error Logs
- `backend/access.log` - Morgan Logs

### Health Check

```bash
# Test API
curl https://api.yourdomain.com/api/health

# Expected response:
{
  "success": true,
  "message": "Thai Meow API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "Connected"
}
```

---

## 🔄 Update & Maintenance

### Update Backend

```bash
cd /var/www/thai-meow-backend
git pull origin main  # หรือ pull จาก source
npm install --production
pm2 restart thai-meow-api
```

### Update Frontend

```bash
# Web
expo export:web
# Deploy ใหม่ตาม platform ที่ใช้

# Mobile
# Build APK/IPA ใหม่
```

### Database Backup

```bash
# MongoDB Atlas - ใช้ Automated Backups (แนะนำ)
# หรือ Manual Backup:
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/thai-meow" --out=./backup
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Environment variables ตั้งค่าแล้ว
- [ ] Database เชื่อมต่อได้
- [ ] API ทดสอบแล้ว
- [ ] Frontend ทดสอบแล้ว
- [ ] SSL Certificate พร้อม (Production)

### Backend
- [ ] Server Deploy แล้ว
- [ ] PM2 ทำงาน
- [ ] Nginx Config ถูกต้อง
- [ ] Health Check ผ่าน
- [ ] Logs ทำงาน

### Frontend
- [ ] Web Build สำเร็จ
- [ ] Mobile App Build สำเร็จ
- [ ] API_BASE_URL ถูกต้อง
- [ ] CORS ตั้งค่าแล้ว

### Post-Deployment
- [ ] ทดสอบ API Endpoints
- [ ] ทดสอบ Authentication
- [ ] ทดสอบ Database Connection
- [ ] Monitor Logs
- [ ] Setup Monitoring Alerts

---

## 🆘 Troubleshooting

### Backend ไม่ทำงาน
```bash
# Check PM2
pm2 status
pm2 logs thai-meow-api

# Check Port
sudo netstat -tulpn | grep 3000

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

### Database Connection Error
- ตรวจสอบ `MONGODB_URI`
- ตรวจสอบ MongoDB Atlas Whitelist IP
- ตรวจสอบ Network/Firewall

### CORS Error
- ตรวจสอบ `CORS_ORIGINS` ใน config.env
- ตรวจสอบ Frontend `API_BASE_URL`

---

**ขอให้โชคดีกับการ Deploy! 🚀**


