# Thai Meow 🐱 - Interactive Thai Language Learning App

A comprehensive React Native + Node.js + MongoDB application for learning Thai language through gamified experiences.

## 📱 App Overview

Thai Meow is an interactive language learning app that makes learning Thai fun and engaging through gamified lessons, progress tracking, and AI-powered pronunciation.

## 🏗️ Project Structure

```
Thai-Meow/
├── src/                          # Frontend (React Native + Expo)
│   ├── components/               # Reusable UI components
│   ├── contexts/                 # React Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── navigation/               # Navigation configuration
│   ├── screens/                  # App screens
│   ├── services/                 # API and business logic
│   └── utils/                    # Utility functions
├── backend/                      # Backend (Node.js + Express)
│   ├── controllers/              # Route controllers
│   ├── middleware/               # Express middleware
│   ├── models/                   # MongoDB models
│   ├── routes/                   # API routes
│   └── server.js                 # Main server file
└── assets/                       # Static assets
```

## 🎮 Core Features

### 1. Learning Modules
- **Thai Consonants (ก-ฮ)** - 44 letters with pronunciation
- **Thai Vowels** - 32 vowels with audio learning
- **Thai Tones** - 5 tones with pitch training
- **Vocabulary Building** - Word recognition and meaning

### 2. Game Modes
- **Matching Game** - Match Thai letters with meanings
- **Multiple Choice** - Choose correct answers
- **Fill in the Blank** - Complete missing letters
- **Order Game** - Arrange letters in sequence
- **Quiz Mode** - Mixed challenge mode

### 3. Gamification System
- **Hearts (❤️)** - Player lives (regenerate over time)
- **Streaks (🔥)** - Daily login progress
- **XP (⭐)** - Experience points for leveling
- **Diamonds (💎)** - Premium currency for rewards
- **Achievements** - Unlockable badges and rewards
- **Level System** - Progressive difficulty unlock

### 4. AI Voice Integration
- **Vaja9 TTS** - Primary Thai text-to-speech service
- **AI For Thai** - High-quality pronunciation
- **Expo Speech** - Fallback TTS service
- **Emotion Support** - Happy, neutral, sad, excited tones

### 5. Progress Tracking
- **Real-time Sync** - Progress synced with MongoDB
- **Offline Support** - Local cache with AsyncStorage
- **Session Tracking** - Resume interrupted games
- **Analytics** - Detailed performance metrics
- **User Stats** - Comprehensive progress dashboard

## 🛠️ Technical Stack

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: React Navigation v7
- **State Management**: React Context API
- **Animations**: Lottie React Native
- **Storage**: AsyncStorage for offline support
- **TTS**: Expo Speech + Vaja9 TTS + AI For Thai

### Backend
- **Framework**: Node.js + Express
- **Database**: MongoDB Atlas (Cloud)
- **Authentication**: JWT tokens
- **Security**: Helmet, CORS, Rate Limiting
- **API**: RESTful API design

### Database Collections
- `users` - User profiles and authentication
- `userstats` - User statistics and progress
- `vocabularies` - Thai letters, vowels, tones with audio
- `progresses` - Learning progress and session data
- `lessons` - Structured lessons and content
- `gameresults` - Quiz results and performance
- `players` - Player data and achievements

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/your-username/thai-meow.git
   cd thai-meow
   npm install
   cd backend && npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy and edit environment file
   cp backend/config.env.example backend/config.env
   # Add your MongoDB Atlas connection string
   ```

3. **Start the application**
   ```bash
   # Start backend server
   cd backend
   npm start
   
   # Start frontend (in new terminal)
   npm start
   ```

## 🔧 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Game & Progress
- `POST /api/game-results` - Save game result
- `POST /api/progress/session` - Save progress session
- `POST /api/progress/finish` - Finish lesson
- `GET /api/progress/user` - Get user progress

### User Management
- `POST /api/user/stats` - Update user stats
- `POST /api/user/unlock-level` - Unlock level
- `GET /api/user/profile` - Get user profile

### Vocabulary
- `GET /api/vocab/consonants` - Get Thai consonants
- `GET /api/vocab/vowels` - Get Thai vowels
- `GET /api/vocab/search/:term` - Search vocabulary

## 🎨 UI/UX Features

### Theme System
- **Light/Dark Mode** - Automatic theme switching
- **Color Palette** - Consistent design system
- **Typography** - Readable fonts for Thai text
- **Accessibility** - Screen reader support

### Animations & Interactions
- **Lottie Animations** - Smooth micro-interactions
- **Progress Bars** - Visual progress indicators
- **Success/Error States** - Clear feedback
- **Loading States** - Smooth transitions

## 🔒 Security & Performance

### Security Features
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcryptjs encryption
- **Rate Limiting** - API abuse prevention
- **CORS Protection** - Cross-origin security
- **Input Validation** - Data sanitization

### Performance Optimizations
- **MongoDB Indexes** - Optimized database queries
- **Image Optimization** - Compressed assets
- **Lazy Loading** - On-demand content loading
- **Caching** - Local storage for offline support
- **Bundle Splitting** - Reduced app size

## 📱 App Screens & Navigation

### Main Screens
- **HomeScreen** - Dashboard with progress overview
- **ProfileScreen** - User profile and settings
- **ProgressScreen** - Detailed progress tracking
- **SettingsScreen** - App configuration

### Learning Screens
- **NewLessonGame** - Main lesson interface
- **ThaiConsonantsGame** - Consonant learning
- **ThaiVowelGame** - Vowel learning
- **ThaiTonesGame** - Tone learning
- **LessonCompleteScreen** - Lesson completion

### Authentication Screens
- **SignInScreen** - User login
- **SignUpScreen** - User registration
- **ForgotPasswordScreen** - Password recovery
- **Onboarding1-3** - App introduction

## 🧪 Testing & Development

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
npm test

# Development mode
npm run dev
```

## 📈 Recent Updates

- ✅ Fixed 404 errors for game progress saving
- ✅ Fixed level unlock syncing issues
- ✅ Improved user stats synchronization
- ✅ Enhanced offline support
- ✅ Optimized API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Vaja9 TTS** - Thai text-to-speech service
- **AI For Thai** - AI-powered pronunciation
- **MongoDB Atlas** - Cloud database hosting
- **Expo** - React Native development platform

---

**Made with ❤️ by the Thai Meow Team**