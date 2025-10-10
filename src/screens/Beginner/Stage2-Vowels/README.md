# Beginner Stage 2 - Thai Vowels Game

## Overview
This folder contains the Thai Vowels learning game for Beginner Stage 2. The game focuses on teaching 16 basic Thai vowels through interactive question types.

## Files
- `ThaiVowelsGame.js` - Main game component
- `index.js` - Barrel export
- `__tests__/ThaiVowelsGame.spec.js` - Unit tests
- `README.md` - This file

## Features
- **3 Question Types**:
  - DRAG_MATCH (60%) - Match meanings with vowel characters
  - PICTURE_MATCH (20%) - Select vowel based on image
  - LISTEN_CHOOSE (20%) - Listen and select correct vowel

- **16 Thai Vowels**: Complete set of basic Thai vowels
- **Progress Tracking**: Autosave, resume, XP/diamonds system
- **TTS Integration**: Audio pronunciation using vaja9TtsService
- **Level Unlocking**: Automatic progression to next level

## Usage
Navigate to this screen using:
```javascript
navigation.navigate('BeginnerVowelsStage', {
  lessonId: 2,
  category: 'vowels_basic',
  vowelType: 'basic'
});
```

## Dependencies
- React Native + Expo
- Lottie animations
- AsyncStorage for progress persistence
- TTS service for audio
- Progress context for XP/diamonds
- User data sync for stats
