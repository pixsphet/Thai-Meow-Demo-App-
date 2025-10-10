# 🐱 Thai-Meow - Thai Language Learning App

แอปพลิเคชันเรียนรู้ภาษาไทยที่ออกแบบมาเพื่อให้การเรียนรู้เป็นเรื่องสนุกและมีประสิทธิภาพ พร้อมระบบเกมมิฟิเคชันที่ช่วยให้ผู้เรียนมีแรงจูงใจในการเรียน

## 📱 ภาพรวมแอป

Thai-Meow เป็นแอปเรียนรู้ภาษาไทยที่รวมการเรียนรู้เข้ากับเกม โดยมีระบบ XP, Level, และ Rewards ที่ทำให้การเรียนเป็นเรื่องสนุก ผู้เรียนสามารถเรียนรู้พยัญชนะ สระ และวรรณยุกต์ผ่านเกมต่างๆ พร้อมระบบติดตามความคืบหน้าและสถิติที่ละเอียด

## 🎯 ฟีเจอร์หลัก

### 🏠 หน้าหลัก (HomeScreen)
- แสดงสถิติผู้ใช้แบบเรียลไทม์
- ระบบ Level และ XP
- แสดงความคืบหน้าในการเรียน
- Quick Actions สำหรับเข้าสู่บทเรียนต่างๆ
- ระบบ Streak และ Hearts

### 📊 หน้าความคืบหน้า (ProgressScreen)
- แสดงสถิติการเรียนแบบละเอียด
- กราฟแสดงความคืบหน้า
- ระบบ Achievement และ Badges
- แสดงเวลาที่ใช้ในการเรียน
- ความแม่นยำในการตอบคำถาม

### 👤 หน้าโปรไฟล์ (ProfileScreen)
- จัดการข้อมูลส่วนตัว
- แสดงสถิติและความสำเร็จ
- ระบบ Level Rewards
- การตั้งค่าบัญชีผู้ใช้
- แสดงความคืบหน้า XP แบบละเอียด

### 👥 หน้าเพิ่มเพื่อน (AddFriendScreen)
- ค้นหาและเพิ่มเพื่อน
- ระบบ Social Learning
- แข่งขันกับเพื่อน
- แชร์ความสำเร็จ

## 🎮 ระบบเกมการเรียนรู้

### 📚 บทเรียนพยัญชนะ (ConsonantLearnScreen)
- เรียนรู้พยัญชนะไทย 44 ตัว
- ระบบเสียงและการออกเสียง
- แบบฝึกหัดแบบ Interactive
- ระบบ Progress Tracking

### 🔤 บทเรียนสระ (ThaiVowelGame)
- เรียนรู้สระไทยทั้งหมด
- เกมจับคู่สระกับเสียง
- ระบบฝึกออกเสียง
- แบบทดสอบความเข้าใจ

### 🎵 บทเรียนวรรณยุกต์ (ThaiTonesGame)
- เรียนรู้วรรณยุกต์ทั้ง 5 เสียง
- เกมฝึกฟังและแยกเสียง
- ระบบฝึกออกเสียงวรรณยุกต์
- แบบทดสอบความแม่นยำ

## 🏗️ โครงสร้างโปรเจค

```
Thai-Meow/
├── 📱 Frontend (React Native + Expo)
│   ├── src/
│   │   ├── components/          # Components ที่ใช้ร่วมกัน
│   │   ├── contexts/            # React Context สำหรับ State Management
│   │   ├── hooks/               # Custom Hooks
│   │   ├── navigation/          # Navigation Configuration
│   │   ├── screens/            # หน้าจอต่างๆ ของแอป
│   │   ├── services/            # API Services
│   │   └── utils/               # Utility Functions
│   ├── assets/                 # รูปภาพ, เสียง, และ Animations
│   └── App.js                  # Entry Point
│
├── 🖥️ Backend (Node.js + Express)
│   ├── controllers/            # API Controllers
│   ├── models/                 # Database Models (MongoDB)
│   ├── routes/                 # API Routes
│   ├── middleware/             # Middleware Functions
│   ├── config/                 # Database Configuration
│   └── server.js               # Server Entry Point
│
└── 📄 Documentation
    ├── README.md
    ├── SETUP_GUIDE.md
    └── API_DOCUMENTATION.md
```

## 🎨 ระบบ UI/UX

### 🎨 Theme System
- Dark/Light Mode Support
- Consistent Color Palette
- Responsive Design
- Custom Components Library

### 🎭 Animations
- Lottie Animations สำหรับ Feedback
- Smooth Transitions
- Loading States
- Success/Error Animations

### 📱 Navigation
- Bottom Tab Navigation
- Stack Navigation
- Custom Tab Bar Design
- Deep Linking Support

## 🔧 เทคโนโลยีที่ใช้

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform และ tools
- **React Navigation** - Navigation library
- **Lottie React Native** - Animations
- **Expo Linear Gradient** - Gradient backgrounds
- **React Context API** - State management
- **AsyncStorage** - Local data storage

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Development Tools
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **GitHub** - Repository hosting

## 🚀 การติดตั้งและรัน

### Prerequisites
- Node.js (v16 หรือใหม่กว่า)
- npm หรือ yarn
- Expo CLI
- MongoDB
- Android Studio / Xcode (สำหรับรันบนอุปกรณ์จริง)

### Frontend Setup
```bash
# ติดตั้ง dependencies
npm install

# รันแอป
npm start
# หรือ
expo start
```

### Backend Setup
```bash
# เข้าไปในโฟลเดอร์ backend
cd backend

# ติดตั้ง dependencies
npm install

# ตั้งค่า environment variables
cp config.env.example config.env

# รันเซิร์ฟเวอร์
npm start
```

## 📊 ระบบข้อมูล

### User Management
- การสมัครสมาชิกและเข้าสู่ระบบ
- จัดการข้อมูลส่วนตัว
- ระบบ Authentication และ Authorization

### Progress Tracking
- บันทึกความคืบหน้าในการเรียน
- ระบบ XP และ Level
- สถิติการเรียนแบบละเอียด
- ระบบ Streak และ Rewards

### Game Data
- ข้อมูลพยัญชนะ สระ และวรรณยุกต์
- ระบบคำถามและคำตอบ
- บันทึกผลการเล่นเกม
- ระบบคะแนนและ Ranking

## 🎯 ฟีเจอร์พิเศษ

### 🏆 ระบบ Gamification
- **XP System**: ได้รับ XP จากการเรียนและเล่นเกม
- **Level System**: เลื่อนระดับตาม XP ที่สะสม
- **Rewards**: ได้รับ Hearts และ Diamonds เป็นรางวัล
- **Streak**: ระบบเรียนต่อเนื่องเพื่อรับรางวัลพิเศษ
- **Achievements**: ระบบความสำเร็จและ Badges

### 📈 Analytics & Statistics
- ติดตามเวลาที่ใช้ในการเรียน
- คำนวณความแม่นยำในการตอบคำถาม
- แสดงสถิติการเรียนแบบรายวัน/รายสัปดาห์/รายเดือน
- ระบบเปรียบเทียบกับเพื่อน

### 🔄 Real-time Sync
- ซิงค์ข้อมูลแบบเรียลไทม์
- Offline Mode Support
- Auto-save Progress
- Conflict Resolution

## 🎨 Design System

### Colors
- **Primary**: #FF8000 (Orange)
- **Secondary**: #34A853 (Green)
- **Accent**: #2196F3 (Blue)
- **Background**: #FFFFFF / #1B1B1B
- **Surface**: #F5F5F5 / #2C2C2C

### Typography
- **Primary Font**: System Default
- **Thai Font**: Sarabun, Kanit
- **Sizes**: 12px - 28px
- **Weights**: 400, 500, 600, 700, 800

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Rounded, gradient backgrounds
- **Inputs**: Clean design, focus states
- **Navigation**: Bottom tabs, consistent styling

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic Learning Modules
- ✅ User Authentication
- ✅ Progress Tracking
- ✅ Basic Gamification

### Phase 2 (Planned)
- 🔄 Advanced Analytics
- 🔄 Social Features
- 🔄 Offline Mode
- 🔄 Push Notifications

### Phase 3 (Future)
- 📋 AI-powered Learning Paths
- 📋 Voice Recognition
- 📋 AR/VR Integration
- 📋 Multi-language Support

## 🤝 Contributing

เรายินดีรับการมีส่วนร่วมจากชุมชน! หากคุณต้องการช่วยพัฒนาหรือปรับปรุงแอป สามารถ:

1. Fork repository นี้
2. สร้าง feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📄 License

โปรเจคนี้อยู่ภายใต้ MIT License - ดูรายละเอียดในไฟล์ [LICENSE](LICENSE)

## 📞 ติดต่อ

- **Developer**: pixsphet
- **GitHub**: [@pixsphet](https://github.com/pixsphet)
- **Repository**: [Thai-Meow-Demo-App](https://github.com/pixsphet/Thai-Meow-Demo-App-.git)

## 🙏 Acknowledgments

- ขอบคุณชุมชน React Native และ Expo
- ขอบคุณผู้ให้ข้อมูลภาษาไทยและเสียง
- ขอบคุณผู้ทดสอบและให้ feedback

---

**🐱 Thai-Meow** - ทำให้การเรียนรู้ภาษาไทยเป็นเรื่องสนุก! 🎉