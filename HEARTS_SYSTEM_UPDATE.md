# Hearts System Update - การอัพเดตระบบหัวใจแบบ Unified

## 📝 สรุปการแก้ไข (Summary of Changes)

### ปัญหาที่แก้ไข
1. **Advanced game screens ไม่ใช้ระบบหัวใจเดียวกับ HomeScreen**
   - ผู้ใช้มี hearts ไม่เท่ากันในแต่ละหน้า
   - Hearts ไม่อัพเดตแบบ real-time

2. **ConsonantStage1Game.js มี error: "Property 'stats' doesn't exist"**
   - ใช้ `stats` ใน `useMemo` แต่ไม่ได้ destructure

3. **TRANSLATE_MATCH question type ไม่ถูก render**
   - เกมแสดง "Unknown question type: TRANSLATE_MATCH"
   - ต้องเพิ่มการรองรับ type นี้

---

## ✅ ไฟล์ที่แก้ไข (Modified Files)

### 1. `src/screens/Advanced1OccupationsGame.js`
**ตำแหน่งที่แก้:**
- **บรรทัด 122**: เพิ่ม `stats` และ `updateStats` จาก `useUnifiedStats()`
- **บรรทัด 130**: เปลี่ยน hearts initialization จาก `useState(5)` เป็น `useState(unifiedHearts || 5)`
- **บรรทัด 161-173**: เพิ่ม 2 useEffect สำหรับ sync hearts

**สิ่งที่เพิ่มเติม:**
```javascript
// บรรทัด 616
const { stats, hearts: unifiedHearts, updateStats } = useUnifiedStats();

// บรรทัด 624
const [hearts, setHearts] = useState(unifiedHearts || 5);

// บรรทัด 161-173: Sync hearts
useEffect(() => {
  if (unifiedHearts !== undefined && unifiedHearts !== hearts) {
    setHearts(unifiedHearts);
  }
}, [unifiedHearts]);

useEffect(() => {
  if (hearts !== undefined && updateStats) {
    updateStats({ hearts });
  }
}, [hearts]);
```

---

### 2. `src/screens/Advanced2TopicsGame.js`
**ตำแหน่งที่แก้:**
- **บรรทัด 146**: เพิ่ม `stats` และ `updateStats` จาก `useUnifiedStats()`
- **บรรทัด 154**: เปลี่ยน hearts initialization
- **บรรทัด 186-198**: เพิ่ม useEffect สำหรับ sync hearts

**สิ่งที่เพิ่มเติม:**
```javascript
// บรรทัด 146
const { stats, hearts: unifiedHearts, updateStats } = useUnifiedStats();

// บรรทัด 154
const [hearts, setHearts] = useState(unifiedHearts || 5);

// บรรทัด 186-198: Sync effects (เหมือนกับ Advanced1OccupationsGame)
```

---

### 3. `src/screens/Advanced3DirectionsGame.js`
**ตำแหน่งที่แก้:**
- **บรรทัด 267**: เพิ่ม `stats` และ `updateStats` จาก `useUnifiedStats()`
- **บรรทัด 274**: เปลี่ยน hearts initialization
- **บรรทัด 304-316**: เพิ่ม useEffect สำหรับ sync hearts

**สิ่งที่เพิ่มเติม:**
```javascript
// บรรทัด 267
const { stats, hearts: unifiedHearts, updateStats } = useUnifiedStats();

// บรรทัด 274
const [hearts, setHearts] = useState(unifiedHearts || 5);

// บรรทัด 304-316: Sync hearts effects
```

---

### 4. `src/screens/Advanced4ComplexVerbsGame.js`
**ตำแหน่งที่แก้:**
- **บรรทัด 246**: เพิ่ม `stats` และ `updateStats` จาก `useUnifiedStats()`
- **บรรทัด 253**: เปลี่ยน hearts initialization
- **บรรทัด 284-296**: เพิ่ม useEffect สำหรับ sync hearts

**สิ่งที่เพิ่มเติม:**
```javascript
// บรรทัด 246
const { stats, hearts: unifiedHearts, updateStats } = useUnifiedStats();

// บรรทัด 253
const [hearts, setHearts] = useState(unifiedHearts || 5);

// บรรทัด 284-296: Sync hearts
```

---

### 5. `src/screens/Advanced5IdiomsGame.js`
**ตำแหน่งที่แก้:**
- **บรรทัด 275**: เพิ่ม `stats` และ `updateStats` จาก `useUnifiedStats()`
- **บรรทัด 283**: เปลี่ยน hearts initialization
- **บรรทัด 314-326**: เพิ่ม useEffect สำหรับ sync hearts

**สิ่งที่เพิ่มเติม:**
```javascript
// บรรทัด 275
const { stats, hearts: unifiedHearts, updateStats } = useUnifiedStats();

// บรรทัด 283
const [hearts, setHearts] = useState(unifiedHearts || 5);

// บรรทัด 314-326: Sync hearts
```

---

### 6. `src/screens/ConsonantStage1Game.js` 🔧 **ไฟล์หลัก**

#### ส่วนที่ 1: แก้ไข Import Stats (บรรทัด 616)
```javascript
// เดิม
const { hearts: unifiedHearts, updateStats } = useUnifiedStats();

// ใหม่
const { stats, hearts: unifiedHearts, updateStats } = useUnifiedStats();
```

**เหตุผล:** ใช้ `stats?.userId` ใน useMemo (บรรทัด 753) แต่ไม่ได้ import

---

#### ส่วนที่ 2: เพิ่ม Safety Check (บรรทัด 2039-2049)
```javascript
const currentQuestion = questions[currentIndex];
const progress = ((currentIndex + 1) / questions.length) * 100;

// ✨ ADDED: Safety check if no current question
if (!currentQuestion) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <LottieView source={require('../assets/animations/LoadingCat.json')} autoPlay loop style={{ width: 200, height: 200 }} />
        <Text style={styles.loadingText}>กำลังโหลดคำถาม...</Text>
      </View>
    </SafeAreaView>
  );
}
```

**เหตุผล:** ป้องกัน error เมื่อ `currentQuestion` เป็น undefined

---

#### ส่วนที่ 3: เพิ่ม TRANSLATE_MATCH Case (บรรทัด 1979-2132)
```javascript
case 'TRANSLATE_MATCH':
case 'MATCH_IDIOM_MEANING':
  // Handle matching game with leftItems and rightItems
  console.debug(`[Q${currentIndex + 1}/${questions.length}] TRANSLATE_MATCH/MATCH_IDIOM`);
  
  // ... (โค้ด render matching game UI)
  
  return (
    <View style={styles.questionContainer}>
      <Text style={styles.instruction}>{question.instruction || 'จับคู่คำไทยกับคำภาษาอังกฤษ'}</Text>
      
      {/* Left Column - คำไทย */}
      <View style={styles.leftColumn}>
        {question.leftItems?.map((item) => (
          <TouchableOpacity onPress={() => handleLeftPress2(item)}>
            <Text>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Right Column - คำอังกฤษ */}
      <View style={styles.rightColumn}>
        {question.rightItems?.map((item) => (
          <TouchableOpacity onPress={() => handleRightPress2(item)}>
            <Text>{item.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Connection Info */}
      {dmPairs.length > 0 && (
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionText}>
            เชื่อมต่อแล้ว {dmPairs.length}/{question.leftItems?.length || 0} คู่
          </Text>
        </View>
      )}
    </View>
  );
```

**เหตุผล:** รองรับ question type `TRANSLATE_MATCH` ที่มาจาก saved progress

---

#### ส่วนที่ 4: เพิ่ม Hint Text (บรรทัด 111-113)
```javascript
case 'TRANSLATE_MATCH':
case 'MATCH_IDIOM_MEANING':
  return 'แตะเพื่อจับคู่คำ ให้ตรงกัน';
```

---

#### ส่วนที่ 5: เพิ่ม Type Label (บรรทัด 145-146)
```javascript
case 'TRANSLATE_MATCH':
case 'MATCH_IDIOM_MEANING': return 'จับคู่คำ';
```

---

#### ส่วนที่ 6: แก้ไข Default Case (บรรทัด 2134-2143)
```javascript
// เดิม
default:
  return null;

// ใหม่
default:
  console.warn(`[Unknown Question Type] Q${currentIndex + 1}: ${question.type}`);
  return (
    <View style={styles.questionContainer}>
      <View style={styles.questionCard}>
        <Text style={styles.instruction}>Unknown question type: {question.type}</Text>
        <Text style={styles.hintText}>Please report this issue</Text>
      </View>
    </View>
  );
```

**เหตุผล:** แทนที่จะ return `null` ให้แสดง error message

---

#### ส่วนที่ 7: เพิ่มใน Check Answer (บรรทัด 532-534)
```javascript
case QUESTION_TYPES.DRAG_MATCH:
case 'TRANSLATE_MATCH':
case 'MATCH_IDIOM_MEANING':
  // For drag match, check if all pairs are correct
  return userAnswer && userAnswer.every(pair => 
    question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
    question.rightItems.find(right => right.id === pair.rightId)?.text
  );
```

**เหตุผล:** ตรวจสอบคำตอบของ TRANSLATE_MATCH แบบเดียวกับ DRAG_MATCH

---

## 🎯 ผลลัพธ์ (Results)

### ก่อนแก้ไข:
- ❌ Hearts ไม่ sync ระหว่างหน้าต่างๆ
- ❌ Error "Property 'stats' doesn't exist"
- ❌ "Unknown question type: TRANSLATE_MATCH"
- ❌ Default case return `null` ทำให้แสดงหน้าว่าง

### หลังแก้ไข:
- ✅ Hearts sync ทุกหน้า (HomeScreen, Advanced games, ConsonantGame)
- ✅ ไม่มี error เรื่อง stats
- ✅ รองรับ TRANSLATE_MATCH question type
- ✅ แสดง error message แทนหน้าว่าง
- ✅ ไม่มี linter errors

---

## 📋 สรุปเปลี่ยนแปลงโดยย่อ

| ไฟล์ | บรรทัดที่แก้ | สิ่งที่ทำ |
|------|-------------|-----------|
| Advanced1OccupationsGame.js | 122, 130, 161-173 | ✅ เพิ่ม unified stats sync |
| Advanced2TopicsGame.js | 146, 154, 186-198 | ✅ เพิ่ม unified stats sync |
| Advanced3DirectionsGame.js | 267, 274, 304-316 | ✅ เพิ่ม unified stats sync |
| Advanced4ComplexVerbsGame.js | 246, 253, 284-296 | ✅ เพิ่ม unified stats sync |
| Advanced5IdiomsGame.js | 275, 283, 314-326 | ✅ เพิ่ม unified stats sync |
| **ConsonantStage1Game.js** | 616, 753, 1979-2132 | ✅ แก้ไข stats import, เพิ่ม TRANSLATE_MATCH case |

---

## 🔄 วิธีการทำงาน (How It Works)

### 1. Hearts Sync Flow
```
HomeScreen (unifiedHearts)
    ↓
  updateStats({ hearts: newValue })
    ↓
UnifiedStatsContext
    ↓
  all screens get updated hearts
    ↓
ConsonantStage1Game, AdvancedGames, etc.
```

### 2. TRANSLATE_MATCH Rendering Flow
```
Saved Progress (questionsSnapshot)
    ↓
  Load TRANSLATE_MATCH questions
    ↓
  Render matching game UI
    ↓
  leftItems ↔ rightItems
    ↓
  Check answer via dmPairs
```

---

## 🧪 การทดสอบ (Testing)

### สิ่งที่ต้องทดสอบ:
1. ✅ Hearts sync ระหว่างหน้าต่างๆ
2. ✅ Hearts ลดลงเมื่อตอบผิด
3. ✅ TRANSLATE_MATCH questions แสดงได้
4. ✅ Matching game ทำงานได้
5. ✅ ไม่มี error ใน console

---

## 📝 หมายเหตุ (Notes)

- ระบบ unified stats ใช้ `useUnifiedStats()` เป็น single source of truth
- ทุก game screen ต้อง sync hearts ผ่าน `updateStats()`
- TRANSLATE_MATCH คือ matching game แบบซ้าย-ขวา (ไทย ↔ อังกฤษ)
- Default case ควรแสดง error message แทน `null`

---

## 🚀 ข้อเสนอแนะเพิ่มเติม (Future Improvements)

1. **ทำให้ match colors มากขึ้น** - เพิ่มสีสำหรับ connections
2. **เพิ่ม animations** - เมื่อจับคู่สำเร็จ
3. **Sound feedback** - เมื่อจับคู่ถูก/ผิด
4. **Tutorial mode** - แสดงวิธีเล่นให้ผู้ใช้ใหม่

---

## 📞 ติดต่อ (Contact)

หากพบปัญหา:
1. ดู console logs เพื่อหาข้อมูลเพิ่มเติม
2. ตรวจสอบว่า `unifiedHearts` มีค่าหรือไม่
3. ตรวจสอบว่า `questions` array มีข้อมูลครบหรือไม่

---

**แก้ไขโดย:** AI Assistant  
**วันที่:** 2025  
**สถานะ:** ✅ เสร็จสมบูรณ์

