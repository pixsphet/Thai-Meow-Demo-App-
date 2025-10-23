# 🎮 SYLLABLE_BUILDER & ORDER_TILES Developer Guide

## Quick Overview

Two new easier-to-understand question types have been successfully added to `ConsonantStage1Game.js`:

| Type | Purpose | Difficulty | User Action |
|------|---------|-----------|------------|
| **SYLLABLE_BUILDER** | Compose Thai syllables from 4 components | ★★☆ Medium | Select from 4 slots |
| **ORDER_TILES** | Arrange words in correct sequence | ★★☆ Medium | Tap tiles in order |

Both types are automatically included in the game (1 of each per session).

---

## 🔧 Technical Architecture

### File Location
`/src/screens/ConsonantStage1Game.js`

### Question Distribution (15 questions per game)
- LISTEN_CHOOSE: 5 questions
- PICTURE_MATCH: 4 questions  
- DRAG_MATCH: 3 questions
- FILL_BLANK: 2 questions
- **SYLLABLE_BUILDER: 1 question** ✨
- **ORDER_TILES: 1 question** ✨

---

## 📚 SYLLABLE_BUILDER in Detail

### What It Is
Users select from 4 interactive slots to compose a complete Thai syllable:
- **Initial** (อักษรต้น) - The consonant
- **Vowel** (สระ) - The vowel mark
- **Tone** (วรรณยุกต์) - The tone mark
- **Final** (ตัวสะกด) - The final consonant

### Visual Flow
```
┌─────────────────────────────────┐
│  ประกอบพยางค์จากส่วนประกอบ      │ (Instruction)
├─────────────────────────────────┤
│         า ก ่ ม              │ (Live syllable preview)
├─────────────────────────────────┤
│ อักษรต้น (Initial):              │
│  [ก]  [ข]  [ค]                  │
├─────────────────────────────────┤
│ สระ (Vowel):                    │
│  [ะ]  [า]  [ิ]                  │
├─────────────────────────────────┤
│ วรรณยุกต์ (Tone):                 │
│  [ ]  [่]                       │
├─────────────────────────────────┤
│ ตัวสะกด (Final):                 │
│  [ ]  [น]  [ม]  [ก]             │
└─────────────────────────────────┘
```

### Code Example

```javascript
// Generator creates this structure:
{
  id: 'sb_ก_abc123',
  type: QUESTION_TYPES.SYLLABLE_BUILDER,
  instruction: 'ประกอบพยางค์จากส่วนประกอบ',
  correct: {
    initial: 'ก',
    vowel: 'า',
    tone: '',
    final: 'ง'
  },
  slots: [
    {
      key: 'initial',
      label: 'อักษรต้น (Initial)',
      options: ['ก', 'ข', 'ค']  // Shuffled
    },
    {
      key: 'vowel',
      label: 'สระ (Vowel)',
      options: ['า', 'ะ', 'ิ']   // Shuffled
    },
    {
      key: 'tone',
      label: 'วรรณยุกต์ (Tone)',
      options: ['', '่']         // Shuffled
    },
    {
      key: 'final',
      label: 'ตัวสะกด (Final)',
      options: ['ง', 'น', 'ม']   // Shuffled
    }
  ]
}

// User answer format:
{
  initial: 'ก',
  vowel: 'า',
  tone: '',
  final: 'ง'
}
```

### Validation Logic
```javascript
const isCorrect = checkAnswer(question, userAnswer);
// ✓ Returns true only if ALL 4 components match exactly
```

### Helper Constants
```javascript
const BASIC_VOWELS = ['ะ','า','ิ','ี','ุ','ู','เ','แ','โ'];
const BASIC_FINALS = ['', 'น', 'ม', 'ก'];
const TONES = ['', '่','้','๊','๋'];

const toRenderedSyllable = ({ initial, vowel, tone, final }) => {
  return `${vowel}${initial}${tone}${final}`;  // Thai rendering order
};
```

---

## 📚 ORDER_TILES in Detail

### What It Is
Users tap word tiles in sequence to arrange them into correct sentences. Accepts multiple valid orderings!

### Visual Flow
```
┌──────────────────────────────────┐
│     เรียงคำให้ถูกต้อง             │ (Instruction)
├──────────────────────────────────┤
│   ก  อ่านว่า  เกะ               │ (User's current sequence)
├──────────────────────────────────┤
│ Available tiles (tap to add/remove):
│
│  [คำว่า]  [ก]  [อ่านว่า]        │
│  [เกะ]  [ครับ]  [ค่ะ]  [ไหม]    │
└──────────────────────────────────┘
```

### Code Example

```javascript
// Generator creates this structure:
{
  id: 'ot_ก_abc123',
  type: QUESTION_TYPES.ORDER_TILES,
  instruction: 'เรียงคำให้ถูกต้อง',
  correctOrders: [
    // Pattern 1: Full sentence
    ['คำว่า', 'ก', 'อ่านว่า', 'เกะ'],
    // Pattern 2: Shortened version (also correct!)
    ['ก', 'อ่านว่า', 'เกะ']
  ],
  allParts: [
    'อ่านว่า', 'ครับ', 'ก', 'คำว่า', 
    'ค่ะ', 'ไหม', 'อย่าง', 'เกะ'
  ]  // Shuffled, includes distractors
}

// User answer format (an array):
['ก', 'อ่านว่า', 'เกะ']

// This is CORRECT because it matches correctOrders[1]
```

### Validation Logic
```javascript
const isCorrect = checkAnswer(question, userAnswer);
// ✓ Returns true if answer matches ANY pattern in correctOrders
// ✗ Returns false if length or sequence doesn't match any pattern
```

### Key Features

**Multiple Valid Answers:**
- Users can complete the question in multiple ways
- Makes the question less rigid, more natural

**Distractors:**
```javascript
const distractors = ['ครับ', 'ค่ะ', 'ไหม', 'อย่าง'];
// These are included to add challenge and variety
```

**Toggle Selection:**
- Tap a tile to add it to your sequence
- Tap the same tile again to remove it from sequence
- Easy to fix mistakes!

---

## 🔗 Integration Points

### 1. Question Type Constants (Line 51-58)
```javascript
const QUESTION_TYPES = {
  // ... existing types ...
  SYLLABLE_BUILDER: 'SYLLABLE_BUILDER',
  ORDER_TILES: 'ORDER_TILES',
};
```

### 2. Hint Text Display (Line 102-105)
```javascript
case QUESTION_TYPES.SYLLABLE_BUILDER:
  return 'เลือกให้ครบทุกช่องเพื่อประกอบพยางค์';
case QUESTION_TYPES.ORDER_TILES:
  return 'แตะคำตามลำดับ ถ้ากดพลาดแตะซ้ำเพื่อเอาออก';
```

### 3. Question Generation (Line 376, 384)
```javascript
// SYLLABLE_BUILDER is generated once per game
questions.push(makeSyllableBuilder(word, pool));

// ORDER_TILES is generated once per game
questions.push(makeOrderTiles(word));
```

### 4. Answer Checking (Line 408-419)
Already implemented! No changes needed.

### 5. UI Rendering (Line 1125-1210)
Already implemented! No changes needed.

---

## 🎯 Acceptance Criteria Checklist

- ✅ QUESTION_TYPES has SYLLABLE_BUILDER & ORDER_TILES keys
- ✅ makeSyllableBuilder(word, pool) returns proper object
- ✅ makeOrderTiles(word) returns proper object
- ✅ Helper constants in place (BASIC_VOWELS, BASIC_FINALS, TONES)
- ✅ No new imports added (reused existing constants & helpers)
- ✅ Answer validation handles both types
- ✅ UI rendering handles both types
- ✅ Integrated into generateConsonantQuestions()
- ✅ Code compiles without errors
- ✅ No linting errors

---

## 🧪 Testing the Implementation

### Manual Testing
1. Start ConsonantStage1Game
2. Play through all questions
3. You should encounter:
   - 1 SYLLABLE_BUILDER question (compose syllable)
   - 1 ORDER_TILES question (arrange words)
4. Verify both show correct hints
5. Verify answers are validated correctly
6. Verify Fire Streak Alert shows on milestones

### Expected Behavior

**SYLLABLE_BUILDER:**
- Select all 4 components correctly → ✓ Correct
- Miss any component → ✗ Wrong
- Check button enabled only when all slots filled

**ORDER_TILES:**
- Match any valid pattern → ✓ Correct
- Wrong sequence → ✗ Wrong
- Able to undo selections by tapping again

---

## 📝 Future Enhancements

Potential improvements (not in current scope):
- Add audio playback for ORDER_TILES
- Support animated transitions between slots in SYLLABLE_BUILDER
- Add difficulty levels that adjust number of distractors
- Support more vowel/tone/final combinations
- Add time-based scoring bonus

---

## 📞 Support

For questions or issues:
1. Check this guide first
2. Review the code comments in ConsonantStage1Game.js
3. Examine the test verification file
