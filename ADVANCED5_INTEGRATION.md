# Advanced 5: Expressing Opinions - Integration Checklist

## ✅ Files Created:
1. **`/src/data/advanced5_opinions.json`** - 30 opinion phrases (state, reason, agree, disagree, counter, suggest, hedge, conclude)
2. **`/src/data/advanced5_opinion_scenarios.json`** - 12 opinion scenarios for practice
3. **`/src/screens/Advanced5OpinionsGame.js`** - Main game screen (900+ lines)

## 📝 TODO: Navigation Integration

### 1. Update `src/navigation/BottomTabNavigator.js`
Add import:
```javascript
import Advanced5OpinionsGame from '../screens/Advanced5OpinionsGame';
```

Add Screen:
```javascript
<Stack.Screen 
  name="Advanced5OpinionsGame" 
  component={Advanced5OpinionsGame} 
  options={{ headerShown: false }}
/>
```

### 2. Update `src/screens/LevelStage3.js`

In `CUSTOM_STAGE_META`:
```javascript
5: {
  lesson_id: 5,
  title: 'แสดงความคิดเห็น (Opinions)',
  key: 'advanced5_opinions',
  category: 'thai-opinions',
  level: 'Advanced',
  description: 'เรียนรู้วิธีการแสดงความคิดเห็นและการให้เหตุผล',
  gameScreen: 'Advanced5OpinionsGame',
},
```

In navigation logic (where other gameScreen checks exist):
```javascript
} else if (stage.gameScreen === 'Advanced5OpinionsGame') {
  navigation.navigate('Advanced5OpinionsGame', {
    lessonId: stage.lesson_id,
    category: stage.category,
    level: stage.level,
    stageTitle: stage.title
  });
```

In `ensureAllStagesExist()` function:
```javascript
// Ensure lesson_id 5 (Opinions)
if (!stageIds.includes(5)) {
  const opinionsStage = applyCustomStageMeta({
    id: 'advanced_opinions_5',
    lesson_id: 5,
    title: 'แสดงความคิดเห็น (Opinions)',
    level: 3,
    key: 'advanced5_opinions',
    category: 'thai-opinions',
    status: DEBUG_UNLOCK_ALL_STAGES ? 'current' : 'locked',
    progress: 0,
    accuracy: 0,
    type: 'lottie',
    lottie: require('../assets/animations/stage_start.json'),
  });
  stages.push(opinionsStage);
}
```

## 🎮 Game Features:
- **5 Question Types**: LISTEN_CHOOSE, DRAG_MATCH, FILL_BLANK_DIALOG, ARRANGE_SENTENCE, TONE_PICKER
- **13 Questions per session**: LC×3, DM×3, FB×3, AS×2, TP×2
- **Gamification**: Hearts (5), Streak, XP (+10), Diamonds (+1), Accuracy %
- **TTS Integration**: Full Thai audio support
- **Save/Resume**: Autosave + progress persistence
- **Unlock Next**: At ≥70% accuracy
- **Scenario-based**: 12 real-world opinion scenarios

## ✨ Status:
⏳ Awaiting navigation integration to complete the Advanced 5 stage
