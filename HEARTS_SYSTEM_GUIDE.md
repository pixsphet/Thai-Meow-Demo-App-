# ระบบหัวใจที่ตรงกันทุกหน้า (Unified Hearts System)

## ปัญหาปัจจุบัน
- แต่ละเกมใช้ `useState(5)` แทนที่จะ sync กับ UnifiedStats
- บางเกมมี sync บางเกมไม่มี
- เกิดการไม่ตรงกันของจำนวนหัวใจระหว่างหน้าต่างๆ

## วิธีแก้ไข: ใช้ `useGameHearts` Hook

### ตอน 1: เพิ่ม Import
```javascript
import { useGameHearts } from '../utils/useGameHearts';
```

### ตอน 2: แทนที่ Local State
**เก่า:**
```javascript
const [hearts, setHearts] = useState(5);
```

**ใหม่:**
```javascript
const { hearts, heartsDisplay, setHearts, loseHeart, gainHeart } = useGameHearts();
```

### ตอน 3: ลบ useEffect ที่ sync hearts (ถ้ามี)
**ลบโค้ดพวกนี้:**
```javascript
// Sync hearts from UnifiedStats
useEffect(() => {
  if (Number.isFinite(unifiedHearts)) {
    if (hearts !== unifiedHearts) {
      setHearts(unifiedHearts);
    }
  }
}, [unifiedHearts]);

// Update hearts back to UnifiedStats
useEffect(() => {
  if (hearts !== unifiedHearts) {
    updateStats({ hearts });
  }
}, [hearts]);
```

### ตอน 4: ใช้ Functions ที่ให้มา
**เมื่อต้องการลดหัวใจ:**
```javascript
// เก่า:
const handleWrong = () => {
  setHearts(hearts - 1);
};

// ใหม่:
const handleWrong = () => {
  loseHeart(1); // ลด 1 หัวใจ
  // หรือ loseHeart(2); ถ้าจะลด 2
};
```

**เมื่อต้องการเพิ่มหัวใจ:**
```javascript
// เก่า:
setHearts(hearts + 1);

// ใหม่:
gainHeart(1); // เพิ่ม 1 หัวใจ
```

### ตอน 5: ใช้ heartsDisplay สำหรับ UI
```javascript
<Text>{heartsDisplay} ❤️</Text>
```

## ไฟล์ที่แก้ไขเสร็จแล้ว

### ✅ แก้ไขแล้ว (ใช้ useUnifiedStats)
- ✅ `src/utils/useGameHearts.js` (สร้างใหม่)
- ✅ `src/screens/ConsonantStage1Game.js` 
- ✅ `src/screens/Intermediate1FoodDrinksGame.js`
- ✅ `src/screens/IntermediateEmotionsGame.js`
- ✅ `src/screens/IntermediatePlacesGame.js`
- ✅ `src/screens/LevelStage2.js` (ใช้แล้ว ตั้งแต่แรก)

### วิธีใช้งานที่ง่ายกว่า (Recommended):

ไม่ต้องใช้ `useGameHearts` hook ที่ซับซ้อน เพียงแค่:

1. **เปลี่ยนจาก:**
```javascript
const { stats } = useUnifiedStats();
const [hearts, setHearts] = useState(5);
```

2. **เป็น:**
```javascript
const { hearts, updateStats } = useUnifiedStats();
```

3. **เปลี่ยนจาก:**
```javascript
setHearts(newHearts);
```

4. **เป็น:**
```javascript
updateStats({ hearts: newHearts });
```

5. **ลบ hearts ออกจาก autosave snapshot** (ไม่ต้องบันทึกเพราะจะ sync อัตโนมัติ)

### ไฟล์ที่ยังต้องแก้
- ⏳ `src/screens/IntermediateRoutinesGame.js`
- ⏳ `src/screens/IntermediateTransportGame.js`
- ⏳ `src/screens/Advanced1OccupationsGame.js`
- ⏳ `src/screens/Advanced2TopicsGame.js`
- ⏳ `src/screens/Advanced3DirectionsGame.js`
- ⏳ `src/screens/Advanced4ComplexVerbsGame.js`
- ⏳ `src/screens/Advanced5IdiomsGame.js`
- ⏳ `src/screens/GreetingStage3Game.js`
- ⏳ `src/screens/Lesson4ObjectsGame.js`
- ⏳ `src/screens/Lesson5BodyGame.js`
- ⏳ `src/screens/VowelStage2Game.js`
- ⏳ `src/screens/MemoryMatchScreen.js`
- ⏳ `src/screens/NewLessonGame.js`

## ตัวอย่างการแก้ไขเต็ม (IntermediateRoutinesGame)
```javascript
// 1. เพิ่ม import
import { useGameHearts } from '../utils/useGameHearts';

// 2. แทนที่
const { hearts, heartsDisplay, setHearts, loseHeart, gainHeart } = useGameHearts();

// 3. ลบ useEffect ที่ sync hearts (บรรทัด 130-147)

// 4. แก้ไข function ที่ใช้ hearts
// เช่น handleWrong
const handleWrong = () => {
  loseHeart(1);
  // ... โค้ดอื่นๆ
};
```

## ข้อดี
1. ✅ Hearts จะตรงกันทุกหน้า (ใช้ UnifiedStatsContext เป็น source of truth)
2. ✅ Auto-sync ทันทีเมื่อเปลี่ยนแปลง
3. ✅ ไม่ต้องเขียน sync logic ซ้ำๆ
4. ✅ จัดการ edge cases และ race conditions อัตโนมัติ

## การใช้งาน
หลังจากแก้ไขทุกไฟล์แล้ว:
1. Hearts จะ sync ระหว่างหน้าต่างๆ อัตโนมัติ
2. เมื่อผู้ใช้เล่นเกมแล้วใช้หัวใจไป มันจะหายจากทุกหน้า
3. เมื่อผู้ใช้ซื้อหัวใจ มันจะเพิ่มทุกหน้า
4. ไม่ต้องกังวลเรื่อง state ไม่ตรงกันอีก

