# คู่มือ Advanced4ComplexVerbsGame.js 📚

## 🎯 ภาพรวม

**Advanced4ComplexVerbsGame.js** เป็นเกมการเรียนรู้ภาษาไทยสำหรับ **แพตเทิร์นคำเชื่อมขั้นสูง** (เช่น "เพราะ...จึง", "แม้ว่า...แต่", "ถ้า...ก็") 

- **มีคำศัพท์:** 12 แพตเทิร์นคำเชื่อม
- **จำนวนข้อ:** 6 ข้อ (ง่ายขึ้น)
- **ระบบ:** CHECK → ต่อไป (แบบ ConsonantStage1Game.js)
- **ความยาก:** ระดับ Advanced

---

## 📋 โครงสร้างไฟล์

### 1. **src/data/advanced4_complex_verbs.json** 📁
ไฟล์ข้อมูลแพตเทิร์นคำเชื่อม

**ตัวอย่างโครงสร้าง:**
```json
{
  "id": "cv_001",
  "thai": "เพราะ...จึง",
  "roman": "phró ... jueng",
  "en": "because ... therefore",
  "type": "causal",
  "exampleTH": "เพราะฝนตกหนัก จึงรถติดมาก",
  "exampleEN": "Because it rained heavily, the traffic was severe.",
  "tts": "เพราะฝนตกหนัก จึงรถติดมาก",
  "clozeTH": "___ฝนตกหนัก จึงรถติดมาก"
}
```

**ฟิลด์ที่สำคัญ:**
- `thai` - แพตเทิร์นคำเชื่อม (มี ... เป็นช่องว่าง)
- `type` - ประเภท (causal, concession, condition, temporal, purpose, additive, correlative, contrast)
- `exampleTH` - ตัวอย่างประโยคภาษาไทย
- `clozeTH` - ประโยคเว้นว่างสำหรับข้อเติมคำ
- `tts` - ข้อความสำหรับ TTS

**ประเภทแพตเทิร์น:**
- `causal` - เหตุ-ผล (เพราะ...จึง, เนื่องจาก...จึง)
- `concession` - ยอมรับ-สวนทาง (แม้ว่า...แต่, ถึงแม้ว่า...ก็)
- `condition` - เงื่อนไข (ถ้า...ก็, หาก...จะ)
- `temporal` - เวลา/ลำดับ (เมื่อ...ก็)
- `purpose` - วัตถุประสงค์ (เพื่อที่จะ...)
- `additive` - เพิ่มเติม (นอกจาก...ก็ยัง...)
- `correlative` - เปรียบเทียบแบบ (ยิ่ง...ยิ่ง...)
- `contrast` - เปรียบเทียบ (แทนที่จะ...)

---

## 🎮 ประเภทคำถาม (6 ข้อ)

### 1. **LISTEN_CHOOSE** - ฟังแล้วเลือก
- **รูปแบบ:** ฟังประโยคแล้วเลือกคำเชื่อมที่ถูกต้อง
- **ตัวเลือก:** 3 ตัวเลือก
- **จุดประสงค์:** ฝึกฟังและเข้าใจแพตเทิร์น

### 2. **DRAG_MATCH** - จับคู่
- **รูปแบบ:** จับคู่ แพตเทิร์นคำเชื่อม ↔ หน้าที่ (เช่น "causal" = เหตุ-ผล)
- **จำนวน:** 4 คู่
- **จุดประสงค์:** ฝึกจำประเภทของคำเชื่อม

### 3. **FILL_BLANK** - เติมช่องว่าง
- **รูปแบบ:** เติมคำเชื่อมในประโยคเว้นว่าง (`clozeTH`)
- **ตัวเลือก:** 3 ตัวเลือก
- **ตัวอย่าง:** "___ฝนตกหนัก จึงรถติดมาก" → เลือก "เพราะ"

### 4. **ARRANGE_SENTENCE** - เรียงประโยค
- **รูปแบบ:** เรียงคำให้เป็นประโยคที่ถูกต้อง
- **เวิร์ดแบงค์:** คำในประโยค + ตัวหลอก
- **จุดประสงค์:** ฝึกจำโครงสร้างประโยค

### 5. **TRANSFORM_PARAPHRASE** - แปลงประโยค
- **รูปแบบ:** แปลงประโยคให้ใช้แพตเทิร์นที่กำหนด
- **อินพุต:** TextInput (พิมพ์)
- **ตัวอย่าง:** "He went to work" → แปลงเป็น "เพื่อที่เขาจะไปทำงาน"

### 6. **LISTEN_CHOOSE** - ฟังแล้วเลือก (อีกคำ)
- ข้อที่ 6 เป็นคำถามฟังซ้ำ อีกแพตเทิร์นหนึ่ง

---

## 🔧 ระบบ Feedback (CHECK → ต่อไป)

### รูปแบบการเล่น:
```
1. เลือกคำตอบ
2. กด CHECK
3. ดู feedback (ถูก/ผิด) 👈 แสดงทันที
4. กด ต่อไป 👈 ไปข้อถัดไป
```

### State Management:
```javascript
const [currentFeedback, setCurrentFeedback] = useState(null);
// 'correct' | 'wrong' | null
```

### handleCheckOrNext Logic:
```javascript
const handleCheckOrNext = () => {
  // ถ้ามี feedback แล้ว -> ไปข้อถัดไป
  if (currentFeedback !== null) {
    setCurrentFeedback(null);
    // ไปข้อถัดไป...
    return;
  }

  // ยังไม่เช็ก -> เช็กตอนนี้
  const isCorrect = checkAnswer(currentQuestion, userAnswer);
  
  if (isCorrect) {
    setCurrentFeedback('correct');
    // รางวัล: +15 XP, +1 Diamond
  } else {
    setCurrentFeedback('wrong');
    // ปรับโทษ: -1 Heart
  }
};
```

---

## 🎨 UI Components

### 1. **Feedback Badge**
```javascript
{currentFeedback && (
  <View style={[
    styles.feedbackBadgeEnhanced,
    currentFeedback === 'correct' 
      ? styles.feedbackCorrectEnhanced 
      : styles.feedbackWrongEnhanced
  ]}>
    <FontAwesome 
      name={currentFeedback === 'correct' ? 'check-circle' : 'times-circle'} 
      size={24} 
      color={currentFeedback === 'correct' ? '#58cc02' : '#ff4b4b'}
    />
    <Text style={styles.feedbackTextEnhanced}>
      {currentFeedback === 'correct' ? 'ถูกต้อง! เก่งมาก' : 'ยังไม่ถูก ลองข้อถัดไปนะ'}
    </Text>
  </View>
)}
```

### 2. **Dynamic Button**
```javascript
<TouchableOpacity onPress={handleCheckOrNext}>
  <Text>{currentFeedback ? 'ต่อไป' : 'CHECK'}</Text>
</TouchableOpacity>
```

### 3. **Choice Buttons with Feedback**
```javascript
{question.choices.map((choice) => {
  const isSelected = currentAnswer === choice.text;
  const showFeedback = currentFeedback !== null;
  const isCorrectChoice = choice.text === question.correctText;

  const feedbackStyle = showFeedback
    ? (isCorrectChoice ? styles.choiceCorrect : (isSelected ? styles.choiceWrong : {}))
    : {};

  return (
    <TouchableOpacity 
      style={[styles.choiceButton, isSelected && styles.choiceSelected, feedbackStyle]}
      disabled={currentFeedback !== null} // 👈 disabled หลัง feedback
    >
      <Text>{choice.text}</Text>
    </TouchableOpacity>
  );
})}
```

---

## 🔍 ระบบตรวจคำตอบ (checkAnswer)

### รูปแบบการตรวจ:

```javascript
const checkAnswer = (question, userAnswer) => {
  const norm = (s) => (typeof s === 'string' ? s.trim() : s);
  
  switch (question.type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
    case QUESTION_TYPES.FILL_BLANK:
      return norm(userAnswer) === norm(question.correctText);

    case QUESTION_TYPES.DRAG_MATCH:
      // ตรวจว่าทุกคู่ถูกต้อง
      return userAnswer && userAnswer.every(pair => 
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );

    case QUESTION_TYPES.ARRANGE_SENTENCE:
      // ตรวจลำดับคำ
      return Array.isArray(userAnswer) && 
             JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);

    case QUESTION_TYPES.TRANSFORM_PARAPHRASE: {
      // ตรวจชิ้นส่วนของแพตเทิร์น (p1 และ p2) และลำดับ
      const parts = (question.targetPattern || '').split('...');
      if (parts.length === 1) {
        return userAnswer.includes(parts[0]);
      }
      const [p1, p2] = parts;
      const i1 = userAnswer.indexOf(p1);
      const i2 = userAnswer.indexOf(p2);
      return i1 !== -1 && i2 !== -1 && i1 < i2;
    }
  }
};
```

**จุดสำคัญ:**
- ✅ `norm()` - trim ช่องว่าง (ตรวจง่ายขึ้น)
- ✅ TRANSFORM_PARAPHRASE - ตรวจชิ้นส่วนและลำดับ (เข้มงวด)
- ✅ DRAG_MATCH - ตรวจทุกคู่ (ไม่ใช่แค่บางคู่)

---

## 💡 คำใบ้และ Tips

### 1. **เพิ่มแพตเทิร์นคำเชื่อมใหม่**

**ขั้นตอน:**
1. เพิ่ม JSON object ใน `src/data/advanced4_complex_verbs.json`
2. กำหนด `type` ที่ถูกต้อง (causal, concession, condition, etc.)
3. เขียน `clozeTH` สำหรับข้อเติมคำ (ใช้ `___` แทนช่องว่าง)

**ตัวอย่าง:**
```json
{
  "id": "cv_013",
  "thai": "เพื่อให้...",
  "roman": "phuea-hai",
  "en": "so that ...",
  "type": "purpose",
  "exampleTH": "เพื่อให้เข้าใจดี",
  "exampleEN": "So that we understand better.",
  "tts": "เพื่อให้เข้าใจดี",
  "clozeTH": "___เข้าใจดี"
}
```

### 2. **ปรับจำนวนข้อ**

ปัจจุบัน: **6 ข้อ**

**ถ้าต้องการเพิ่ม:**
แก้ฟังก์ชัน `generateComplexVerbsQuestions`:
```javascript
const generateComplexVerbsQuestions = (pool) => {
  const qs = [];
  const used = new Set();
  const pickOne = () => pick(pool.filter(p => !used.has(p.id)));
  
  qs.push(makeListenChoose(pickOne(), pool));
  qs.push(makeDragMatch(pool));
  qs.push(makeFillBlank(pickOne(), pool));
  // 👈 เพิ่มข้อเพิ่มเติมที่นี่
  qs.push(makeArrangeSentence(pickOne()));
  qs.push(makeTransform(pickOne()));
  
  return qs;
};
```

### 3. **ปรับตัวเลือก (2, 3, หรือ 4 ตัวเลือก)**

ปัจจุบัน: **3 ตัวเลือก**

**แก้ใน makeListenChoose/makeFillBlank:**
```javascript
const makeListenChoose = (item, pool) => {
  const wrong = shuffle(pool.filter(p => p.id !== item.id))
    .slice(0, 1); // 👈 เปลี่ยนเป็น 1 = 2 ตัวเลือก, 2 = 3 ตัวเลือก, 3 = 4 ตัวเลือก
  const choices = shuffle([item, ...wrong]);
  // ...
};
```

### 4. **แก้เพลงเบื้องหลังหรือเสียง**

ใช้ `vaja9TtsService`:
```javascript
import vaja9TtsService from '../services/vaja9TtsService';

// เล่นเสียง
await vaja9TtsService.playThai('เพราะฝนตกหนัก จึงรถติดมาก');
```

### 5. **เปลี่ยนรางวัล**

ปัจจุบัน:
- ✅ ถูก: +15 XP, +1 Diamond
- ❌ ผิด: -1 Heart

**แก้ในฟังก์ชัน makeListenChoose/makeFillBlank/etc:**
```javascript
return {
  // ...
  rewardXP: 20,        // 👈 เปลี่ยน XP
  rewardDiamond: 2,    // 👈 เปลี่ยน Diamond
  penaltyHeart: 2,     // 👈 เปลี่ยน Heart penalty
};
```

### 6. **เปลี่ยนความยาก (3 → 4 ตัวเลือก)**

**เพิ่มตัวเลือก:**
```javascript
const makeListenChoose = (item, pool) => {
  const wrong = shuffle(pool.filter(p => p.id !== item.id)).slice(0, 3); // 👈 เปลี่ยนเป็น .slice(0, 3)
  const choices = shuffle([item, ...wrong]); // = 4 ตัวเลือก
  // ...
};
```

### 7. **เพิ่มประเภทคำถามใหม่**

**ขั้นตอน:**
1. เพิ่ม QUESTION_TYPE
```javascript
const QUESTION_TYPES = {
  // ...
  TRUE_FALSE: 'TRUE_FALSE', // 👈 เพิ่ม
};
```

2. สร้าง generator function
```javascript
const makeTrueFalse = (item, pool) => {
  const isTrue = Math.random() > 0.5;
  return {
    id: `tf_${item.id}_${uid()}`,
    type: QUESTION_TYPES.TRUE_FALSE,
    instruction: 'ข้อนี้ถูกหรือผิด?',
    statement: `"${item.thai}" = ${item.en}`,
    correctText: isTrue ? 'ถูก' : 'ผิด',
    choices: [
      { id: 1, text: 'ถูก', isCorrect: isTrue },
      { id: 2, text: 'ผิด', isCorrect: !isTrue },
    ],
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
  };
};
```

3. เพิ่มใน generateComplexVerbsQuestions
```javascript
qs.push(makeTrueFalse(pickOne(), pool));
```

4. เพิ่ม render case ใน renderQuestionComponent

---

## 🔗 เชื่อมต่อกับระบบอื่น

### Services ที่ใช้:
- `gameProgressService` - บันทึก progress
- `levelUnlockService` - ปลดล็อกด่านถัดไป
- `userStatsService` - อัปเดตสถิติผู้ใช้
- `dailyStreakService` - เช็ค daily streak
- `progressService` - บันทึก/restore progress

### Navigation:
```javascript
navigation.replace('LessonComplete', {
  lessonId,
  stageTitle,
  score: correctAnswers,
  totalQuestions,
  // ...
});
```

---

## 🐛 ปัญหาที่พบบ่อย

### 1. **Transform Input ไม่ทำงาน**
**แก้ไข:**
- ใช้ `TextInput` จาก react-native (ไม่ได้จำลอง)
- Bind กับ `transformInput` state

### 2. **clozeTH ไม่แสดง**
**ตรวจสอบ:**
- มี field `clozeTH` ใน JSON หรือไม่?
- ใช้ `item.clozeTH` ใน makeFillBlank

### 3. **Feedback ไม่แสดง**
**ตรวจสอบ:**
- มี state `currentFeedback` หรือไม่?
- เรียก `setCurrentFeedback('correct'/'wrong')` หลังตรวจหรือไม่?

### 4. **ปุ่มไม่เปลี่ยนเป็น "ต่อไป"**
**แก้:**
```javascript
<Text style={styles.checkButtonText}>
  {currentFeedback ? 'ต่อไป' : 'CHECK'}
</Text>
```

---

## 📝 Checklist สำหรับการพัฒนา

- [ ] สร้างไฟล์ JSON สำหรับคำศัพท์
- [ ] ทดสอบแต่ละประเภทคำถาม
- [ ] ตรวจสอบระบบ feedback
- [ ] ตรวจสอบระบบรางวัล (XP, Diamond, Hearts)
- [ ] ทดสอบ DRAG_MATCH (3 คู่)
- [ ] ทดสอบ FILL_BLANK (ใช้ clozeTH)
- [ ] ทดสอบ TRANSFORM_PARAPHRASE
- [ ] ตรวจสอบ navigation ไป LessonComplete

---

## 🎓 คำอธิบายโค้ดหลัก

### generateComplexVerbsQuestions
```javascript
const generateComplexVerbsQuestions = (pool) => {
  const qs = [];
  const used = new Set();
  
  const pickOne = () => pick(pool.filter(p => !used.has(p.id)));
  
  // 1) ฟังแล้วเลือก
  const a = pickOne(); 
  used.add(a.id); 
  qs.push(makeListenChoose(a, pool));
  
  // 2) จับคู่
  qs.push(makeDragMatch(pool));
  
  // 3) เติมช่องว่าง
  const b = pickOne(); 
  used.add(b.id); 
  qs.push(makeFillBlank(b, pool));
  
  // 4) เรียงประโยค
  const c = pickOne(); 
  used.add(c.id); 
  qs.push(makeArrangeSentence(c));
  
  // 5) แปลงประโยค
  const d = pickOne(); 
  used.add(d.id); 
  qs.push(makeTransform(d));
  
  // 6) ฟังแล้วเลือก (อีกคำ)
  const e = pickOne(); 
  used.add(e.id); 
  qs.push(makeListenChoose(e, pool));
  
  return qs;
};
```

**ผลลัพธ์:**
- เหมือนเดิมทุกครั้ง (ไม่สุ่ม)
- แต่ละคำใช้ครั้งเดียว
- สลับประเภทคำถาม

### makeFillBlank
```javascript
const makeFillBlank = (item, pool) => {
  const wrong = shuffle(pool.filter(p => p.id !== item.id)).slice(0, 2);
  const choices = shuffle([item, ...wrong]); // รวม 3 ตัวเลือก
  
  return {
    id: `fb_${item.id}_${uid()}`,
    type: QUESTION_TYPES.FILL_BLANK,
    instruction: 'เลือกคำเชื่อมให้ถูกต้อง',
    questionText: item.clozeTH || '___ (เติมคำเชื่อมให้เหมาะสม)', // 👈 ใช้ clozeTH
    correctText: item.thai,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.thai,
      isCorrect: c.id === item.id
    })),
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
  };
};
```

**จุดสำคัญ:**
- ใช้ `item.clozeTH` สำหรับประโยคเว้นว่าง
- ตัวเลือกเป็นแพตเทิร์นทั้งหมด (ไม่ใช่แค่ชิ้นส่วน)
- รางวัลเสมอ (15 XP, 1 Diamond, -1 Heart)

---

## 🎯 ผลลัพธ์

ระบบพร้อมใช้งาน:
- ✅ ไฟล์ JSON พร้อม 12 แพตเทิร์น
- ✅ เกม 6 ข้อ (ง่ายขึ้น)
- ✅ ระบบ CHECK → ต่อไป
- ✅ Feedback badge
- ✅ UI/UX เหมือน ConsonantStage1Game.js
- ✅ ไม่มี linting errors

**ระบบพร้อมใช้งาน! 🚀**

