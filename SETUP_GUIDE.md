# Thai Meow - Setup Guide 🐱

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Environment Setup
```bash
# Copy environment file
cp backend/.env.example backend/.env

# Edit backend/.env with your MongoDB Atlas connection string
# MONGODB_URL=mongodb+srv://username:password@cluster0.mongodb.net/thai-meow?retryWrites=true&w=majority
```

### 3. Add Your Assets
```bash
# Add your logo to:
src/assets/images/logo.png

# Add your Lottie animation to:
src/assets/animations/cat_on_firstscreen.json
```

### 4. Start the Application
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm start
```

## 📱 App Flow

1. **FirstScreen** - Logo animation with cat Lottie (2.5 seconds)
2. **HomeScreen** - Main dashboard with learning categories
3. **Learning Screens** - Thai consonants, vowels, tones
4. **Game Modes** - Matching, multiple choice, fill blank, order, quiz
5. **Progress Screen** - Track learning progress and achievements

## 🎨 Brand Colors

- **Primary Brand**: `#FF8000` (Orange)
- **Brand Light**: `#FFB366` (Light Orange)
- **Brand Dark**: `#E67300` (Dark Orange)

## 🔧 Customization

### Logo Requirements
- **Size**: 500x220 pixels
- **Format**: PNG with transparent background
- **Location**: `src/assets/images/logo.png`

### Lottie Animation Requirements
- **Size**: 250x250 pixels
- **Format**: JSON Lottie file
- **Location**: `src/assets/animations/cat_on_firstscreen.json`

### Theme Customization
Edit `src/contexts/ThemeContext.js` to modify:
- Colors
- Typography
- Spacing
- Border radius

## 📊 Database Setup

### MongoDB Atlas Collections
- `users` - User profiles and stats
- `vocabularies` - Thai letters, vowels, tones
- `progresses` - Learning progress
- `lessons` - Structured lessons
- `game_results` - Game performance

### Sample Data
The app will automatically create sample vocabulary data when first run.

## 🎮 Game Features

### Learning Categories
- **Thai Consonants** (ก-ฮ) - 44 letters
- **Thai Vowels** - 32 vowels
- **Thai Tones** - 5 tones

### Game Modes
- **Matching Game** - Match letters with meanings
- **Multiple Choice** - Choose correct answers
- **Fill in the Blank** - Complete missing letters
- **Order Game** - Arrange letters in sequence
- **Quiz Game** - Mixed challenge mode

### Gamification
- **Hearts (❤️)** - Player lives
- **Streaks (🔥)** - Daily progress
- **XP (⭐)** - Experience points
- **Diamonds (💎)** - Premium currency
- **Achievements** - Unlockable badges

## 🔊 TTS Integration

### Supported Services
- **Vaja9 TTS** - Primary Thai pronunciation
- **AI For Thai** - High-quality AI pronunciation
- **Expo Speech** - Fallback service

### Configuration
Add your API keys to `backend/.env`:
```
VAJA9_API_KEY=your-vaja9-api-key
AI_FOR_THAI_API_KEY=your-ai-for-thai-api-key
```

## 🚀 Deployment

### Frontend (Expo)
```bash
# Build for production
expo build:android
expo build:ios

# Deploy to app stores
expo submit:android
expo submit:ios
```

### Backend (Node.js)
```bash
# Deploy to Heroku
git push heroku main

# Deploy to AWS
npm run deploy
```

## 🐛 Troubleshooting

### Common Issues
1. **Logo not showing** - Check file path and format
2. **Animation not playing** - Verify Lottie file format
3. **Database connection** - Check MongoDB Atlas connection string
4. **TTS not working** - Verify API keys and network connection

### Debug Mode
```bash
# Enable debug logging
export DEBUG=thai-meow:*
npm start
```

## 📞 Support

For technical support or questions:
- **Email**: support@thaimeow.app
- **Documentation**: See TECHNICAL_DOCUMENTATION.md
- **Issues**: Create GitHub issue

---

**Happy Learning! 🎉**

