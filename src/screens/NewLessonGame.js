import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    Dimensions, 
    Image,
    ScrollView,
} from 'react-native'; 	
import { FontAwesome } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import vocabWordService from '../services/vocabWordService';
import { saveProgress, restoreProgress, clearProgress } from '../services/progressService';
import { useProgress } from '../contexts/ProgressContext';
import vaja9TtsService from '../services/vaja9TtsService';
import levelUnlockService from '../services/levelUnlockService';
import { useUserData } from '../contexts/UserDataContext';
import { useUser } from '../contexts/UserContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import gameProgressService from '../services/gameProgressService';
import userStatsService from '../services/userStatsService';
import dailyStreakService from '../services/dailyStreakService';
import { letterImages } from '../assets/letters';
import { vowelToImage } from '../assets/vowels/map';
import StreakBadge from '../components/StreakBadge';
import apiClient from '../services/apiClient';

const { width } = Dimensions.get('window');

// Helper functions
const uid = () => Math.random().toString(36).substr(2, 9);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const TH_CONNECTIVES = ['และ', 'หรือ', 'ของ', 'ใน', 'ที่', 'เป็น', 'มี', 'ให้', 'กับ', 'จาก'];

const groupOf = (char) => {
  if (['ก','ข','ค','ฆ'].includes(char)) return 'เสียงคอ';
  if (['จ','ฉ','ช','ซ','ศ','ษ','ส'].includes(char)) return 'เสียงศีรษะ';
  if (['ด','ต','ถ','ท'].includes(char)) return 'เสียงลิ้น';
  if (['บ','ป','ผ','พ','ฟ'].includes(char)) return 'เสียงปาก';
  return 'พยัญชนะพื้นฐาน';
};

const getNeighborChars = (char, pool) => {
  const groups = {
    'เสียงคอ': ['ก','ข','ค','ฆ'],
    'เสียงศีรษะ': ['จ','ฉ','ช','ซ','ศ','ษ','ส'],
    'เสียงลิ้น': ['ด','ต','ถ','ท'],
    'เสียงปาก': ['บ','ป','ผ','พ','ฟ']
  };
  const group = Object.keys(groups).find(g => groups[g].includes(char));
  return pool.filter(c => groups[group]?.includes(c.char) && c.char !== char);
};

const SENTENCE_ORDER_TYPES = new Set([
  'ARRANGE_SENTENCE',
  'ORDER_TILES',
  'ARRANGE_IDIOM',
  'ORDER_FLOW',
]);

const normalizeConsonantItem = (item = {}) => ({
  char: item.char || item.thai,
  meaning: item.meaning || item.en,
  name: item.name || item.exampleTH || `${item.char || item.thai}-${item.meaning || item.en}`,
  roman: item.roman
});

const normalizeVowelItem = (item = {}) => ({
  char: item.char || item.thai,
  meaning: item.meaning || item.en,
  name: item.name || item.nameTH || item.char || item.thai,
  roman: item.roman,
  sound: item.sound || item.thai || item.char,
  imageKey: item.imageKey || item.char || item.thai,
  imagePath: item.image || item.imagePath,
  type: item.type || item.position || '',
  example: item.example,
  exampleAudio: item.exampleAudio,
  length: item.length || '',
  pair: item.pair || '',
  group: item.group || ''
});

const resolveVowelImageSource = (vowel = {}) => {
  const candidates = [
    vowel.char,
    vowel.imageKey,
    typeof vowel.char === 'string' ? vowel.char.replace(/[^ก-๙๐-๙]/g, '') : null,
    typeof vowel.name === 'string' ? vowel.name.replace('สระ', '').trim() : null
  ].filter(Boolean);

  for (const key of candidates) {
    if (key && vowelToImage[key]) {
      return vowelToImage[key];
    }
  }

  if (typeof vowel.imagePath === 'string' && vowel.imagePath.startsWith('http')) {
    return { uri: vowel.imagePath };
  }

  return null;
};

// Question Factory Functions
const makeArrangeQ = (c) => {
  const t = pick([1,2,3,4,5]);

  let questionText, correctOrder;
  switch (t) {
    case 1:
      questionText = `${c.char} คือ ${c.meaning}`;
      correctOrder = [c.char, 'คือ', c.meaning];
      break;
    case 2:
      questionText = `${c.char} แปลว่า ${c.meaning}`;
      correctOrder = [c.char, 'แปลว่า', c.meaning];
      break;
    case 3:
      questionText = `เสียงอ่านของ ${c.char} คือ ${c.name}`;
      correctOrder = ['เสียงอ่านของ', c.char, 'คือ', c.name];
      break;
    case 4:
      questionText = `${c.meaning} ใช้ตัวอักษร ${c.char}`;
      correctOrder = [c.meaning, 'ใช้ตัวอักษร', c.char];
      break;
    default:
      questionText = `${c.char} เป็นพยัญชนะหมวด ${groupOf(c.char)}`;
      correctOrder = [c.char, 'เป็นพยัญชนะหมวด', groupOf(c.char)];
  }

  const base = correctOrder.map(w => ({ id: uid(), text: w }));
  const distract = shuffle(TH_CONNECTIVES).slice(0, 3).map(t => ({ id: uid(), text: t }));

  return {
    id: `arr_${c.char}_${uid()}`,
    type: 'ARRANGE_SENTENCE',
    instruction: 'เรียงคำให้เป็นประโยคที่ถูกต้อง',
    questionText,
    correctOrder,                  // string[]
    wordBank: shuffle([...base, ...distract]), // {id,text}[]
    consonantChar: c.char,
  };
};

const makeMatch_SelectChar = (c, pool) => {
  // สร้างคำถามหลายคำ (3-4 คำ)
  const selectedConsonants = shuffle(pool).slice(0, 4);
  const leftItems = selectedConsonants.map((item, i) => ({
    id: i + 1,
    text: item.meaning,
    correctMatch: item.char
  }));
  
  const rightItems = shuffle(selectedConsonants).map((item, i) => ({
    id: i + 1,
    text: item.char
  }));

  return {
    id: `match_c_${c.char}_${uid()}`,
    type: 'DRAG_MATCH',
    instruction: `ลากเส้นจับคู่ความหมายกับตัวอักษรที่ถูกต้อง`,
    questionText: `จับคู่ความหมายกับตัวอักษรให้ถูกต้อง`,
    correctText: c.char,
    consonantChar: c.char,
    leftItems,
    rightItems,
  };
};

const makeMatch_SelectMeaning = (c, pool) => {
  // สร้างคำถามหลายคำ (3-4 คำ)
  const selectedConsonants = shuffle(pool).slice(0, 4);
  const leftItems = selectedConsonants.map((item, i) => ({
    id: i + 1,
    text: item.char,
    correctMatch: item.meaning
  }));
  
  const rightItems = shuffle(selectedConsonants).map((item, i) => ({
    id: i + 1,
    text: item.meaning
  }));

  return {
    id: `match_m_${c.char}_${uid()}`,
    type: 'DRAG_MATCH',
    instruction: `ลากเส้นจับคู่ตัวอักษรกับความหมายที่ถูกต้อง`,
    questionText: `จับคู่ตัวอักษรกับความหมายให้ถูกต้อง`,
    correctText: c.meaning,
    consonantChar: c.char,
    leftItems,
    rightItems,
  };
};

const makeListenChoose = (c, pool) => {
  const near = getNeighborChars(c.char, pool);
  const fill = near.length ? near : pool.filter(x => x.char !== c.char);
  const distractors = shuffle(fill.filter(x => x.char !== c.char)).slice(0, 3);
  const choices = shuffle([c, ...distractors]).map((x, i) => ({ id: i + 1, text: x.char }));

  return {
    id: `listen_${c.char}_${uid()}`,
    type: 'LISTEN_CHOOSE',
    instruction: 'ฟังเสียงแล้วจับคู่ตัวอักษรที่ได้ยิน',
    questionText: c.name,
    correctText: c.char,
    audioText: c.name,
    choices,
    consonantChar: c.char,
  };
};

const makePictureMatch = (c, pool) => {
  const emojiMap = { 'ไก่':'🐔','ไข่':'🥚','ควาย':'🐃','งู':'🐍','จาน':'🍽️','ช้าง':'🐘','โซ่':'⛓️','หญิง':'👩','ดาบ':'⚔️','เต่า':'🐢','ถุง':'🛍️','ทหาร':'🪖','หนู':'🐭','ใบไม้':'🍃','ปลา':'🐟','ผึ้ง':'🐝','ฝา':'🛡️','พาน':'🛕','ฟัน':'🦷','ม้า':'🐴','ยักษ์':'👹','เรือ':'⛵','ลิง':'🐒','แหวน':'💍','เสือ':'🐯','หีบ':'🧰','จุฬา':'🎏','อ่าง':'🛁','นกฮูก':'🦉' };
  const emoji = emojiMap[c.meaning] || '🎯';

  const near = getNeighborChars(c.char, pool);
  const fill = near.length ? near : pool.filter(x => x.char !== c.char);
  const distractors = shuffle(fill.filter(x => x.char !== c.char)).slice(0, 3);
  const choices = shuffle([c, ...distractors]).map((x, i) => ({ id: i + 1, text: x.char }));

  return {
    id: `pic_${c.char}_${uid()}`,
    type: 'PICTURE_MATCH',
    instruction: 'จับคู่ตัวอักษรกับรูปภาพ',
    questionText: `${emoji} ${c.meaning}`,
    correctText: c.char,
    choices,
    consonantChar: c.char,
    emoji,
  };
};

// Question Generation
const generateConsonantQuestions = (consonants = []) => {
  const questions = [];
  const pool = consonants; // ใช้พยัญชนะทั้งหมดที่มีใน database
  
  console.log('🎯 Generating questions from', pool.length, 'consonants');
  
  // สำหรับด่านแรก (lessonId: 1) ให้เลือกแค่ 15 ตัวอักษรที่ไม่ซ้ำกัน
  let selectedConsonants = pool;
  if (consonants.length > 15) {
    // สุ่มเลือก 15 ตัวอักษรที่ไม่ซ้ำกัน
    const shuffledPool = shuffle([...pool]);
    selectedConsonants = shuffledPool.slice(0, 15);
    console.log('🎯 Selected 15 unique consonants for lesson 1:', selectedConsonants.map(c => c.char).join(', '));
  }
  
  // สร้างคำถาม 1 ข้อต่อพยัญชนะที่เลือก - เน้นเกมจับคู่ตัวอักษร
  selectedConsonants.forEach((consonant, index) => {
    // เน้นเกมจับคู่ตัวอักษร (80%) และเกมอื่นๆ (20%)
    const questionTypes = ['MATCH_PICTURE', 'PICTURE_MATCH', 'LISTEN_CHOOSE'];
    const weights = [0.6, 0.2, 0.2]; // 60% MATCH_PICTURE, 20% PICTURE_MATCH, 20% LISTEN_CHOOSE
    
    const random = Math.random();
    let selectedType;
    if (random < weights[0]) {
      selectedType = 'MATCH_PICTURE';
    } else if (random < weights[0] + weights[1]) {
      selectedType = 'PICTURE_MATCH';
    } else {
      selectedType = 'LISTEN_CHOOSE';
    }
    
    // สร้างคำถามตามประเภทที่เลือก
    switch (selectedType) {
      case 'MATCH_PICTURE':
        if (Math.random() < 0.5) {
          questions.push(makeMatch_SelectChar(consonant, pool));
        } else {
          questions.push(makeMatch_SelectMeaning(consonant, pool));
        }
        break;
      case 'PICTURE_MATCH':
        questions.push(makePictureMatch(consonant, pool));
        break;
      case 'LISTEN_CHOOSE':
        questions.push(makeListenChoose(consonant, pool));
        break;
    }
  });
  
  // สุ่มคำถาม - ใช้จำนวนคำถามเท่ากับจำนวนพยัญชนะที่เลือก
  const shuffledQuestions = shuffle(questions);
  
  // Attach images for PICTURE_MATCH questions
  const questionsWithImages = shuffledQuestions.map(q => {
    if (q && q.type === 'PICTURE_MATCH') {
      const key = q.consonantChar || q.correctText || (Array.isArray(q.consonantChars) ? q.consonantChars[0] : null);
      return { ...q, imageSource: key ? (letterImages[key] || null) : null };
    }
    return q;
  });
  
  console.log(`🎮 Generated ${questionsWithImages.length} questions from ${selectedConsonants.length} selected consonants (${pool.length} total available)`);
  
  return questionsWithImages;
};

const makeVowelListenQuestion = (vowel, pool) => {
  const distractors = shuffle(pool.filter(item => item.char !== vowel.char)).slice(0, 3);
  const choices = shuffle([vowel, ...distractors]).map((item, index) => ({
    id: index + 1,
    text: item.char,
  }));

  return {
    id: `v_listen_${vowel.char}_${uid()}`,
    type: 'LISTEN_CHOOSE',
    instruction: 'ฟังเสียงแล้วเลือกสระที่ได้ยิน',
    questionText: vowel.name,
    correctText: vowel.char,
    audioText: vowel.sound || vowel.name,
    choices,
    consonantChar: vowel.char,
  };
};

const makeVowelPictureQuestion = (vowel, pool) => {
  const distractors = shuffle(pool.filter(item => item.char !== vowel.char)).slice(0, 3);
  const choices = shuffle([vowel, ...distractors]).map((item, index) => ({
    id: index + 1,
    text: item.char,
  }));
  const imageSource = resolveVowelImageSource(vowel);

  return {
    id: `v_picture_${vowel.char}_${uid()}`,
    type: 'PICTURE_MATCH',
    instruction: 'ดูภาพแล้วเลือกสระที่ตรงกัน',
    questionText: vowel.name,
    correctText: vowel.char,
    choices,
    consonantChar: vowel.char,
    imageSource,
    imageKey: vowel.imageKey || vowel.char,
  };
};

const makeVowelMatchQuestion = (vowel, pool) => {
  const baseSelection = shuffle(pool).slice(0, 4);
  const hasTarget = baseSelection.some(item => item.char === vowel.char);
  const selection = hasTarget ? baseSelection : [vowel, ...baseSelection.slice(1)];
  const uniqueSelection = selection.filter(
    (item, index, arr) => arr.findIndex(other => other.char === item.char) === index
  );

  const leftItems = uniqueSelection.map((item, index) => ({
    id: index + 1,
    text: (item.roman || item.meaning || item.name || item.char).toUpperCase(),
    correctMatch: item.char,
  }));

  const rightItems = shuffle(uniqueSelection).map((item, index) => ({
    id: index + 1,
    text: item.char,
  }));

  return {
    id: `v_match_${vowel.char}_${uid()}`,
    type: 'DRAG_MATCH',
    instruction: 'จับคู่เสียงอ่านกับสระไทยที่ถูกต้อง',
    questionText: 'ลากเส้นจับคู่โรมันไรซ์เซชันกับสระไทย',
    correctText: vowel.char,
    consonantChar: vowel.char,
    leftItems,
    rightItems,
  };
};

const makeVowelArrangeQuestion = (vowel) => {
  const correctOrder = [vowel.char, 'อ่านว่า', vowel.name];
  const distractWords = shuffle(['เสียงสั้น', 'เสียงยาว', 'สระไทย', 'พื้นฐาน', 'คำแม่กกา']).slice(0, 3);
  const baseWords = correctOrder.map(text => ({ id: uid(), text }));
  const extraWords = distractWords.map(text => ({ id: uid(), text }));

  return {
    id: `v_arr_${vowel.char}_${uid()}`,
    type: 'ARRANGE_SENTENCE',
    instruction: 'เรียงคำให้เป็นประโยคที่ถูกต้อง',
    questionText: `${vowel.char} อ่านว่าอะไร`,
    correctOrder,
    wordBank: shuffle([...baseWords, ...extraWords]),
    consonantChar: vowel.char,
  };
};

const generateVowelQuestions = (vowels = []) => {
  const cleaned = vowels.filter(item => item && item.char);
  if (cleaned.length === 0) {
    return [];
  }

  console.log('🎯 Generating questions from', cleaned.length, 'vowels');

  const questions = [];
  const pool = cleaned;

  const listenSet = shuffle(pool).slice(0, Math.min(12, pool.length));
  listenSet.forEach(vowel => questions.push(makeVowelListenQuestion(vowel, pool)));

  const pictureSet = shuffle(pool).slice(0, Math.min(10, pool.length));
  pictureSet.forEach(vowel => questions.push(makeVowelPictureQuestion(vowel, pool)));

  const matchSet = shuffle(pool).slice(0, Math.min(8, pool.length));
  matchSet.forEach(vowel => questions.push(makeVowelMatchQuestion(vowel, pool)));

  const arrangeSet = shuffle(pool).slice(0, Math.min(4, pool.length));
  arrangeSet.forEach(vowel => questions.push(makeVowelArrangeQuestion(vowel)));

  return shuffle(questions);
};

const toPositionLabel = (pos) => {
  switch ((pos || '').toLowerCase()) {
    case 'front':
      return 'หน้า';
    case 'back':
      return 'หลัง';
    case 'top':
      return 'บน';
    case 'bottom':
      return 'ล่าง';
    default:
      return 'ไม่ระบุ';
  }
};

const selectRandomDistinct = (pool, count, exclude = new Set()) => {
  const available = pool.filter(v => !exclude.has(v.char));
  return shuffle(available).slice(0, Math.min(count, available.length));
};

const generateLesson2VowelQuestions = (vowels = []) => {
  if (!Array.isArray(vowels) || vowels.length === 0) {
    return [];
  }

  const pool = shuffle(vowels.filter(v => v.char));
  const usedChars = new Set();
  const questions = [];

  const takeVowel = () => {
    const available = pool.find(v => !usedChars.has(v.char));
    return available || pool[0];
  };

  const getChoices = (target, total = 4) => {
    const others = vowels.filter(v => v.char !== target.char);
    return shuffle([target, ...shuffle(others).slice(0, Math.max(0, total - 1))]);
  };

  // Q1 Listen & Choose
  const listenTarget = takeVowel();
  usedChars.add(listenTarget.char);
  const listenChoices = getChoices(listenTarget);
  questions.push({
    id: `lesson2_listen_${listenTarget.char}_${uid()}`,
    type: 'LISTEN_CHOOSE',
    instruction: 'ฟังเสียงแล้วเลือกสระที่ถูกต้อง',
    questionText: 'เลือกสระให้ตรงกับเสียงที่ได้ยิน',
    correctText: listenTarget.char,
    audioText: listenTarget.sound || listenTarget.char,
    choices: listenChoices.map((item, index) => ({
      id: index + 1,
      text: item.char
    })),
    consonantChar: listenTarget.char,
  });

  // Q2 Match Example Word (drag match)
  const matchSet = selectRandomDistinct(vowels, 4);
  matchSet.forEach(v => usedChars.add(v.char));
  questions.push({
    id: `lesson2_match_example_${uid()}`,
    type: 'DRAG_MATCH',
    instruction: 'จับคู่คำตัวอย่างกับสระที่ถูกต้อง',
    questionText: 'จับคู่คำกับสระ',
    leftItems: matchSet.map((item, index) => ({
      id: index + 1,
      text: item.example || `ก${item.char}`,
      correctMatch: item.char
    })),
    rightItems: shuffle(matchSet).map((item, index) => ({
      id: index + 1,
      text: item.char
    })),
    correctText: matchSet.map(item => item.char).join(','),
    consonantChar: matchSet[0]?.char
  });

  // Q3 Arrange short -> long
  const shortCandidates = vowels.filter(v => v.length === 'short' && v.pair);
  const pairTarget = shuffle(shortCandidates).find(v => vowels.some(other => other.char === v.pair));
  if (pairTarget) {
    usedChars.add(pairTarget.char);
    usedChars.add(pairTarget.pair);
    const longVowel = vowels.find(v => v.char === pairTarget.pair);
    const orderWords = [pairTarget.char, pairTarget.pair];
    questions.push({
      id: `lesson2_arrange_${pairTarget.char}_${uid()}`,
      type: 'ARRANGE_SENTENCE',
      instruction: 'เรียงเสียงสระจากสั้นไปยาว',
      questionText: 'ลากเพื่อเรียงลำดับเสียงสั้นก่อนเสียงยาว',
      correctOrder: orderWords,
      wordBank: shuffle(orderWords).map(text => ({ id: uid(), text })),
      consonantChar: pairTarget.char
    });
  }

  // Q4 Identify position
  const positionCandidates = vowels.filter(v => v.type);
  const positionTarget = shuffle(positionCandidates).find(v => v.type);
  if (positionTarget) {
    usedChars.add(positionTarget.char);
    const positionOptions = ['front', 'back', 'top', 'bottom'].map((key, index) => ({
      id: index + 1,
      value: key,
      text: toPositionLabel(key)
    }));

    questions.push({
      id: `lesson2_position_${positionTarget.char}_${uid()}`,
      type: 'MULTIPLE_CHOICE',
      instruction: 'เลือกตำแหน่งที่สระอยู่กับพยัญชนะ',
      questionText: `สระ "${positionTarget.char}" อยู่ตำแหน่งใดเมื่อใช้กับ "${positionTarget.example || 'กะ'}"?`,
      correctText: (positionTarget.type || '').toLowerCase(),
      positionValue: (positionTarget.type || '').toLowerCase(),
      choices: positionOptions,
      consonantChar: positionTarget.char
    });
  }

  // Q5 Picture match
  const pictureTarget = takeVowel();
  const pictureChoices = getChoices(pictureTarget);
  questions.push({
    id: `lesson2_picture_${pictureTarget.char}_${uid()}`,
    type: 'PICTURE_MATCH',
    instruction: 'ฟังเสียงแล้วเลือกภาพสระที่ถูกต้อง',
    questionText: 'เลือกภาพให้ตรงกับเสียงสระ',
    correctText: pictureTarget.char,
    audioText: pictureTarget.sound || pictureTarget.char,
    choices: pictureChoices.map((item, index) => ({
      id: index + 1,
      text: item.char
    })),
    consonantChar: pictureTarget.char,
    imageSource: resolveVowelImageSource(pictureTarget),
    imageKey: pictureTarget.char
  });

  while (questions.length < 5) {
    const fillerTarget = pool[(questions.length + Date.now()) % pool.length] || pool[0];
    const fillerChoices = getChoices(fillerTarget);
    questions.push({
      id: `lesson2_fill_listen_${fillerTarget.char}_${uid()}`,
      type: 'LISTEN_CHOOSE',
      instruction: 'ฟังเสียงแล้วเลือกสระที่ถูกต้อง',
      questionText: 'เลือกสระให้ตรงกับเสียงที่ได้ยิน',
      correctText: fillerTarget.char,
      audioText: fillerTarget.sound || fillerTarget.char,
      choices: fillerChoices.map((item, index) => ({
        id: index + 1,
        text: item.char
      })),
      consonantChar: fillerTarget.char
    });
  }

  return questions.slice(0, 5);
};

const generateQuestions = (items = [], options = {}) => {
  const type = options.type || 'consonant';
  if (type === 'lesson2_vowels') {
    return generateLesson2VowelQuestions(items);
  }
  if (type === 'vowel') {
    return generateVowelQuestions(items);
  }
  return generateConsonantQuestions(items);
};

// Inline Components
const ArrangementComponent = ({ data, onAnswerChange, userAnswer = [], isAnswered, isCorrect }) => {
  const [selected, setSelected] = useState([]);         // {id,text}[]
  const [bank, setBank] = useState(data.wordBank || []); // {id,text}[]

  useEffect(() => {
    // reset เมื่อเปลี่ยนข้อ
    setSelected([]);
    setBank(data.wordBank || []);
  }, [data.id]);

  // Sync with userAnswer prop
  useEffect(() => {
    if (userAnswer && Array.isArray(userAnswer)) {
      // Convert userAnswer (string[]) back to selected format
      const selectedWords = userAnswer.map(text => 
        bank.find(w => w.text === text) || { id: uid(), text }
      ).filter(Boolean);
      setSelected(selectedWords);
    }
  }, [userAnswer, bank]);

  const pickWord = (w) => {
    if (isAnswered) return;
    if (selected.find(x => x.id === w.id)) return;
    if (selected.length >= (data.correctOrder?.length || 99)) return;
    const next = [...selected, w];
    setSelected(next);
    onAnswerChange(next.map(x => x.text)); // ส่งเป็น string[]
  };

  const removeAt = (idx) => {
    if (isAnswered) return;
    const rm = selected[idx];
    const next = selected.filter((_, i) => i !== idx);
    setSelected(next);
    onAnswerChange(next.map(x => x.text));
    // คืนช่องใน bank (ตำแหน่งไม่ต้องเป๊ะ)
    setBank(prev => [...prev, rm]);
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.instructionText}>{data.instruction}</Text>
      <Text style={styles.questionText}>{data.questionText}</Text>

      {/* บริเวณเรียงคำ */}
      <View style={styles.answerArea}>
        {selected.length === 0 ? (
          <Text style={{color:'#888'}}>แตะคำจากด้านล่างเพื่อเรียง</Text>
        ) : (
          <View style={styles.arrangedWordsContainer}>
            {selected.map((w, i) => (
              <TouchableOpacity
                key={w.id}
                style={[
                  styles.arrangedWord,
                  isAnswered && isCorrect !== null && {
                    borderColor: isCorrect ? '#58cc02' : '#ff4b4b',
                    backgroundColor: isCorrect ? '#d4f4aa' : '#ffb3b3',
                  }
                ]}
                onPress={() => removeAt(i)}
                disabled={isAnswered}
              >
                <Text style={styles.arrangedWordText}>{w.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* คลังคำ */}
      <View style={styles.wordBank}>
        {bank
          .filter(w => !selected.find(s => s.id === w.id))
          .map(w => (
            <TouchableOpacity
              key={w.id}
              style={[styles.wordButton, isAnswered && {opacity:0.5}]}
              onPress={() => pickWord(w)}
              disabled={isAnswered}
            >
              <Text style={styles.wordButtonText}>{w.text}</Text>
            </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const MatchingComponent = ({ data, onAnswerChange, userAnswer, isAnswered, isCorrect }) => (
  <View style={styles.questionContainer}>
    <Text style={styles.instructionText}>{data.instruction}</Text>
    {!!data.questionText && <Text style={styles.questionText}>{data.questionText}</Text>}
    <View style={styles.choicesContainer}>
      {data.choices?.map((choice) => (
        <TouchableOpacity
          key={choice.id}
          style={[
            styles.choiceButton,
            userAnswer === choice.text && styles.selectedChoice,
            isAnswered && choice.text === data.correctText && styles.correctChoice,
            isAnswered && userAnswer === choice.text && choice.text !== data.correctText && styles.wrongChoice
          ]}
          onPress={() => onAnswerChange(choice.text)}
          disabled={isAnswered}
        >
          <Text style={styles.choiceText}>{choice.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const DragMatchComponent = ({ data, onAnswerChange, userAnswer, isAnswered, isCorrect }) => {
  const [connections, setConnections] = useState({});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [connectionColors] = useState([
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]);

  useEffect(() => {
    if (userAnswer && typeof userAnswer === 'object') {
      setConnections(userAnswer);
    } else {
      // รีเซ็ตการเชื่อมต่อเมื่อไม่มีคำตอบหรือเปลี่ยนข้อ
      setConnections({});
    }
    // รีเซ็ตการเลือกเมื่อเปลี่ยนข้อ
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [userAnswer, data.id]); // เพิ่ม data.id เพื่อรีเซ็ตเมื่อเปลี่ยนข้อ

  const handleLeftPress = (leftItem) => {
    if (isAnswered) return;
    
    // เล่นเสียงเมื่อแตะที่คำด้านซ้าย
    if (leftItem && leftItem.text) {
      try {
        vaja9TtsService.playThai(leftItem.text);
      } catch (error) {
        console.log('TTS Error:', error);
      }
    }
    
    setSelectedLeft(leftItem.id);
    setSelectedRight(null);
  };

  const handleRightPress = (rightItem) => {
    if (isAnswered) return;
    
    // เล่นเสียงเมื่อแตะที่คำด้านขวา
    if (rightItem && rightItem.text) {
      try {
        vaja9TtsService.playThai(rightItem.text);
      } catch (error) {
        console.log('TTS Error:', error);
      }
    }
    
    if (selectedLeft) {
      // สร้างการเชื่อมต่อ
      const newConnections = {
        ...connections,
        [selectedLeft]: rightItem.text
      };
      setConnections(newConnections);
      onAnswerChange(newConnections);
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedRight(rightItem.id);
    }
  };

  // ฟังก์ชันสำหรับลบการเชื่อมต่อ
  const removeConnection = (leftId) => {
    const newConnections = { ...connections };
    delete newConnections[leftId];
    setConnections(newConnections);
    onAnswerChange(newConnections);
  };

  const isConnected = (leftId, rightText) => {
    return connections[leftId] === rightText;
  };

  const isCorrectConnection = (leftId, rightText) => {
    const leftItem = data.leftItems.find(item => item.id === leftId);
    return leftItem && leftItem.correctMatch === rightText;
  };

  const getConnectionStatus = (leftId) => {
    const rightText = connections[leftId];
    if (!rightText) return 'none';
    const leftItem = data.leftItems.find(item => item.id === leftId);
    return leftItem && leftItem.correctMatch === rightText ? 'correct' : 'wrong';
  };

  const getConnectionColor = (leftId) => {
    const connectionIndex = Object.keys(connections).indexOf(leftId.toString());
    return connectionColors[connectionIndex % connectionColors.length];
  };

  const getConnectionSymbol = (leftId) => {
    const symbols = ['●', '▲', '■', '♦', '★', '◆', '▲', '●'];
    const connectionIndex = Object.keys(connections).indexOf(leftId.toString());
    return symbols[connectionIndex % symbols.length];
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.instructionText}>{data.instruction}</Text>
      {!!data.questionText && <Text style={styles.questionText}>{data.questionText}</Text>}
      
      <View style={styles.dragMatchContainer}>
        {/* ด้านซ้าย - ความหมายหรือตัวอักษร */}
        <View style={styles.leftColumn}>
          {data.leftItems?.map((item, index) => {
            const connectionColor = connections[item.id] ? getConnectionColor(item.id) : '#e0e0e0';
            const connectionSymbol = connections[item.id] ? getConnectionSymbol(item.id) : '';
            const isSelected = selectedLeft === item.id;
            const isConnected = connections[item.id];
            
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dragItem,
                  isSelected && styles.selectedDragItem,
                  isAnswered && getConnectionStatus(item.id) === 'correct' && styles.correctDragItem,
                  isAnswered && getConnectionStatus(item.id) === 'wrong' && styles.wrongDragItem,
                  { 
                    backgroundColor: isConnected ? connectionColor : (isSelected ? '#fff5e6' : '#fff'),
                    borderColor: isConnected ? connectionColor : (isSelected ? '#FF8000' : '#e0e0e0'),
                    borderWidth: isSelected ? 4 : 3
                  }
                ]}
                onPress={() => handleLeftPress(item)}
                disabled={isAnswered}
              >
                <View style={styles.dragItemContent}>
                  {isConnected && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeConnection(item.id)}
                    >
                      <FontAwesome name="times" size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                  <Text style={[
                    styles.dragItemText,
                    isConnected && { color: '#fff', fontWeight: 'bold' },
                    isSelected && { color: '#FF8000', fontWeight: 'bold' }
                  ]}>{item.text}</Text>
                  {isConnected && (
                    <Text style={[styles.connectionSymbol, { color: '#fff' }]}>
                      {connectionSymbol}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ด้านขวา - ตัวเลือก */}
        <View style={styles.rightColumn}>
          {data.rightItems?.map((item, index) => {
            const connectedLeftId = Object.keys(connections).find(leftId => connections[leftId] === item.text);
            const isCorrectMatch = connectedLeftId && getConnectionStatus(connectedLeftId) === 'correct';
            const isWrongMatch = connectedLeftId && getConnectionStatus(connectedLeftId) === 'wrong';
            const connectionColor = connectedLeftId ? getConnectionColor(connectedLeftId) : '#e0e0e0';
            const connectionSymbol = connectedLeftId ? getConnectionSymbol(connectedLeftId) : '';
            const isSelected = selectedRight === item.id;
            const isConnected = connectedLeftId;
            
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dragItem,
                  isSelected && styles.selectedDragItem,
                  isAnswered && isCorrectMatch && styles.correctDragItem,
                  isAnswered && isWrongMatch && styles.wrongDragItem,
                  { 
                    backgroundColor: isConnected ? connectionColor : (isSelected ? '#fff5e6' : '#fff'),
                    borderColor: isConnected ? connectionColor : (isSelected ? '#FF8000' : '#e0e0e0'),
                    borderWidth: isSelected ? 4 : 3
                  }
                ]}
                onPress={() => handleRightPress(item)}
                disabled={isAnswered}
              >
                <View style={styles.dragItemContent}>
                  <Text style={[
                    styles.dragItemText,
                    isConnected && { color: '#fff', fontWeight: 'bold' },
                    isSelected && { color: '#FF8000', fontWeight: 'bold' }
                  ]}>{item.text}</Text>
                  {isConnected && (
                    <Text style={[styles.connectionSymbol, { color: '#fff' }]}>
                      {connectionSymbol}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ปุ่มเล่นเสียง */}
      <View style={styles.soundButtonsContainer}>
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => {
            // เล่นเสียงคำด้านซ้ายทั้งหมด
            if (data.leftItems && Array.isArray(data.leftItems)) {
              data.leftItems.forEach((item, index) => {
                if (item && item.text) {
                  setTimeout(() => {
                    try {
                      vaja9TtsService.playThai(item.text);
                    } catch (error) {
                      console.log('TTS Error:', error);
                    }
                  }, index * 1000);
                }
              });
            }
          }}
        >
          <FontAwesome name="volume-up" size={16} color="#fff" />
          <Text style={styles.soundButtonText}>เล่นเสียงคำซ้าย</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => {
            // เล่นเสียงคำด้านขวาทั้งหมด
            if (data.rightItems && Array.isArray(data.rightItems)) {
              data.rightItems.forEach((item, index) => {
                if (item && item.text) {
                  setTimeout(() => {
                    try {
                      vaja9TtsService.playThai(item.text);
                    } catch (error) {
                      console.log('TTS Error:', error);
                    }
                  }, index * 1000);
                }
              });
            }
          }}
        >
          <FontAwesome name="volume-up" size={16} color="#fff" />
          <Text style={styles.soundButtonText}>เล่นเสียงคำขวา</Text>
        </TouchableOpacity>
      </View>

      {/* แสดงสถานะการเชื่อมต่อ */}
      {Object.keys(connections).length > 0 && (
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionText}>
            เชื่อมต่อแล้ว {Object.keys(connections).length}/{data.leftItems.length} คู่
          </Text>
        </View>
      )}
    </View>
  );
};

// Main Lesson Screen - ด่านที่ 1 สำหรับ LevelStage1
const NewLessonGame = ({ navigation, route }) => {
    const fallbackReplayRoute = route?.name || 'NewLessonGame';

    const {
        lessonId = 1,
        category = 'basic',
        level: levelName = 'Beginner',
        stageTitle: stageTitleParam,
        generator: generatorParam = 'consonants',
        nextStageMeta: incomingNextStageMeta = null,
        stageSelectRoute = 'LevelStage1',
        replayRoute = fallbackReplayRoute,
        replayParams: incomingReplayParams,
    } = route.params || {};

    const currentLessonId = Number(lessonId) || 1;
    const currentCategory = category || 'basic';
    const levelLabel = levelName || 'Beginner';
    const stageTitle = stageTitleParam || `ด่าน ${currentLessonId}`;
    const generatorType = (generatorParam || '').toLowerCase();
    const isLesson2Vowels = generatorType === 'lesson2_vowels';
    const isVowelLesson =
        generatorType === 'vowels' ||
        isLesson2Vowels ||
        (currentCategory || '').toLowerCase().includes('vowel');
    const pointsPerQuestion = isLesson2Vowels ? 5 : 10;
    const resolvedNextStageMeta = React.useMemo(() => {
        if (incomingNextStageMeta) {
            return incomingNextStageMeta;
        }

        try {
            const nextLevelKey = levelUnlockService.getNextLevel(`level${currentLessonId}`);
            const nextLessonNumeric = nextLevelKey
                ? parseInt(String(nextLevelKey).replace('level', ''), 10)
                : currentLessonId + 1;

            if (!Number.isFinite(nextLessonNumeric)) {
                return null;
            }

            const baseParams = {
                lessonId: nextLessonNumeric,
                category: currentCategory,
                level: levelLabel,
                stageTitle: `ด่าน ${nextLessonNumeric}`,
            };

            if (
                nextLessonNumeric === 2 &&
                typeof levelLabel === 'string' &&
                levelLabel.toLowerCase().includes('beginner')
            ) {
                return {
                    route: 'BeginnerVowelsStage',
                    params: {
                        ...baseParams,
                        category: 'vowels_basic',
                        generator: 'vowels',
                    },
                };
            }

            return {
                route: 'NewLessonGame',
                params: baseParams,
            };
        } catch (error) {
            console.warn('⚠️ Unable to resolve next stage meta:', error?.message || error);
            return null;
        }
    }, [incomingNextStageMeta, currentLessonId, currentCategory, levelLabel]);
    const resolvedReplayParams = React.useMemo(
        () => ({
            lessonId,
            category,
            level: levelName,
            stageTitle,
            generator: generatorParam,
            ...(incomingReplayParams || {})
        }),
        [lessonId, category, levelName, stageTitle, generatorParam, incomingReplayParams]
    );
    
    // Progress context
    const { applyDelta } = useProgress();
    
    // Use the new user data sync system
    const { updateUserStats, stats: userStats } = useUserData();
    const { user } = useUser();
    const getUserScopedKey = React.useCallback(
        (base) => `${base}_${user?.id || 'guest'}`,
        [user?.id]
    );
    const { updateFromGameSession: updateUnifiedFromGameSession, updateStats: updateUnifiedStats, stats: unifiedStats } = useUnifiedStats();
    
    const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState(null); 
   const [isCorrect, setIsCorrect] = useState(null); 
   const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const initialHearts = Number.isFinite(unifiedStats?.hearts) ? unifiedStats.hearts : 5;
    const [score, setScore] = useState(0);
    const [hearts, setHeartsState] = useState(initialHearts);
    const heartsRef = useRef(initialHearts);

    const updateLocalHearts = React.useCallback((nextHearts) => {
        const clamped = Math.max(0, nextHearts);
        heartsRef.current = clamped;
        setHeartsState(clamped);
    }, []);

    const syncHearts = React.useCallback(async (nextHearts) => {
        const clamped = Math.max(0, nextHearts);
        if (heartsRef.current === clamped) {
            return;
        }
        updateLocalHearts(clamped);
        try {
            await updateUnifiedStats({ hearts: clamped });
        } catch (error) {
            console.warn('⚠️ Unable to sync hearts state:', error?.message || error);
        }
    }, [updateLocalHearts, updateUnifiedStats]);

    useEffect(() => {
        if (Number.isFinite(unifiedStats?.hearts) && unifiedStats.hearts !== heartsRef.current) {
            updateLocalHearts(unifiedStats.hearts);
        }
    }, [unifiedStats?.hearts, updateLocalHearts]);
    const [perLetter, setPerLetter] = useState({});
    const [lessonCharacters, setLessonCharacters] = useState([]);
    const sessionFinalizedRef = useRef(false);

    useEffect(() => {
        if (!questions || questions.length === 0) {
            return;
        }
        const filtered = questions.filter((q) => q && !SENTENCE_ORDER_TYPES.has(q.type));
        if (filtered.length !== questions.length) {
            setQuestions(filtered);
        }
    }, [questions]);
    
    // ข้อมูลความคืบหน้าแบบละเอียด
    const [gameProgress, setGameProgress] = useState({
        startTime: Date.now(),
        endTime: null,
        totalQuestions: 0,
        completedQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        timePerQuestion: [],
        questionTypes: {},
        accuracy: 0,
        accuracyPercent: 0,
        totalTimeSpent: 0,
        streak: 0,
        maxStreak: 0,
        xpEarned: 0,
        diamondsEarned: 0,
        level: 1,
        achievements: []
    });

    // ข้อมูลผู้ใช้ที่สะสม (legacy)
    const [legacyUserStats, setLegacyUserStats] = useState({
        totalXP: 0,
        totalDiamonds: 0,
        currentLevel: 1,
        levelProgress: 0
    });

    // ข้อมูลความคืบหน้าของเกมปัจจุบัน
    const [gameSession, setGameSession] = useState({
        lessonId: null,
        category: null,
        currentQuestionIndex: 0,
        questions: [],
        answers: {},
        score: 0,
        hearts: 5,
        gameProgress: null,
        startTime: null,
        isResumed: false
    });

    // ข้อมูลไฟสะสมรายวัน
    const [dailyStreak, setDailyStreak] = useState({
        currentStreak: 0,
        maxStreak: 0,
        isNewStreak: false,
        rewards: { xp: 0, diamonds: 0, bonus: '' },
        isPlayedToday: false
    });

    const currentQuestion = questions[currentQuestIndex];

    const currentAccuracyPercent = (() => {
        if (Number.isFinite(gameProgress.accuracyPercent)) {
            return Math.max(0, Math.min(100, Math.round(gameProgress.accuracyPercent)));
        }
        if (Number.isFinite(gameProgress.accuracy)) {
            const accuracyValue = gameProgress.accuracy <= 1
                ? gameProgress.accuracy * 100
                : gameProgress.accuracy;
            return Math.max(0, Math.min(100, Math.round(accuracyValue)));
        }
        if (gameProgress.completedQuestions > 0) {
            return Math.max(
                0,
                Math.min(
                    100,
                    Math.round((gameProgress.correctAnswers / gameProgress.completedQuestions) * 100)
                )
            );
        }
        return 0;
    })();

    // Debug logging
    console.log('🔍 Question state:', {
        questionsLength: questions.length,
        currentQuestIndex,
        hasCurrentQuestion: !!currentQuestion,
        questionType: currentQuestion?.type
    });
    
    const answersRef = useRef({});
    const startTimeRef = useRef(Date.now());
    const questionStartTimeRef = useRef(Date.now());
    const progressAnimationRef = useRef(new Animated.Value(0));

    // ฟังก์ชันสำหรับอัปเดตความคืบหน้า
    const updateGameProgress = (questionResult) => {
        const currentTime = Date.now();
        const questionTime = currentTime - questionStartTimeRef.current;
        
        setGameProgress(prev => {
            const newProgress = { ...prev };
            
            // อัปเดตข้อมูลพื้นฐาน
            newProgress.completedQuestions += 1;
            newProgress.timePerQuestion.push(questionTime);
            
            // อัปเดตผลการตอบ
            if (questionResult.isCorrect) {
                newProgress.correctAnswers += 1;
                newProgress.streak += 1;
                newProgress.maxStreak = Math.max(newProgress.maxStreak, newProgress.streak);
                newProgress.xpEarned += questionResult.xp ?? pointsPerQuestion;
                
                // คำนวณเพชรตาม streak
                let diamonds = 1; // เพชรพื้นฐาน
                if (newProgress.streak >= 3) diamonds += 1; // bonus สำหรับ streak 3+
                if (newProgress.streak >= 5) diamonds += 1; // bonus สำหรับ streak 5+
                if (newProgress.streak >= 10) diamonds += 2; // bonus สำหรับ streak 10+
                
                newProgress.diamondsEarned += diamonds;
            } else {
                newProgress.wrongAnswers += 1;
                newProgress.streak = 0;
            }
            
            // อัปเดตประเภทคำถาม
            const questionType = questionResult.questionType || 'unknown';
            newProgress.questionTypes[questionType] = (newProgress.questionTypes[questionType] || 0) + 1;
            
            // คำนวณความแม่นยำ
            const accuracyRatio = newProgress.completedQuestions > 0
                ? newProgress.correctAnswers / newProgress.completedQuestions
                : 0;
            newProgress.accuracy = accuracyRatio;
            newProgress.accuracyPercent = Math.round(accuracyRatio * 100);
            
            // คำนวณเวลาทั้งหมด
            newProgress.totalTimeSpent = currentTime - newProgress.startTime;
            
            // คำนวณเลเวล
            newProgress.level = Math.floor(newProgress.xpEarned / 100) + 1;
            
            return newProgress;
        });
        
        // Animation เมื่อความคืบหน้าเปลี่ยน
        Animated.sequence([
            Animated.timing(progressAnimationRef.current, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(progressAnimationRef.current, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
        
        // รีเซ็ตเวลาสำหรับคำถามถัดไป
        questionStartTimeRef.current = currentTime;
    };

    // คำนวณ Level จาก XP
    const calculateLevel = (totalXP) => {
        // Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
        const level = Math.floor(totalXP / 100) + 1;
        const levelProgress = (totalXP % 100) / 100;
        return { level, levelProgress };
    };

    // อัปเดตข้อมูลผู้ใช้ (legacy function - renamed to avoid conflict)
    const updateUserStatsLegacy = async (gameXP, gameDiamonds) => {
        try {
            const newTotalXP = legacyUserStats.totalXP + gameXP;
            const newTotalDiamonds = legacyUserStats.totalDiamonds + gameDiamonds;
            const { level, levelProgress } = calculateLevel(newTotalXP);
            
            const updatedStats = {
                totalXP: newTotalXP,
                totalDiamonds: newTotalDiamonds,
                currentLevel: level,
                levelProgress: levelProgress
            };
            
            setLegacyUserStats(updatedStats);
            await AsyncStorage.setItem(getUserScopedKey('userStats'), JSON.stringify(updatedStats));
            
            console.log('📊 Updated user stats (legacy):', updatedStats);
            return updatedStats;
        } catch (error) {
            console.error('❌ Error updating user stats (legacy):', error);
            return legacyUserStats;
        }
    };

    // โหลดความคืบหน้าของเกมจากเซิร์ฟเวอร์/โลคอล
    const loadGameProgress = async () => {
        try {
            const saved = await restoreProgress(currentLessonId);
            if (!saved) {
                return false;
            }

            const questionType = isLesson2Vowels ? 'lesson2_vowels' : (isVowelLesson ? 'vowel' : 'consonant');
            const savedGenerator = saved?.generator || saved?.generatorType;
            const generatorMismatch =
                (isVowelLesson && savedGenerator !== 'vowel') ||
                (!isVowelLesson && savedGenerator === 'vowel');

            if (generatorMismatch) {
                console.log('♻️ Clearing incompatible saved progress for lesson', currentLessonId, {
                    expected: questionType,
                    found: savedGenerator || 'unknown'
                });
                await clearProgress(currentLessonId);
                return false;
            }

            const questionsSnapshot = Array.isArray(saved.questionsSnapshot) && saved.questionsSnapshot.length > 0
                ? saved.questionsSnapshot
                : questions;

            const nextIndex = Math.max(
                0,
                Math.min(saved.currentIndex ?? saved.currentQuestionIndex ?? 0, Math.max(questionsSnapshot.length - 1, 0))
            );

            setQuestions(questionsSnapshot);
            setCurrentQuestIndex(nextIndex);
            setScore(saved.score || 0);
            const restoredHearts = Number.isFinite(saved.hearts) ? saved.hearts : 5;
            syncHearts(restoredHearts);
            if (saved.perLetter) {
                setPerLetter(saved.perLetter);
            }
            if (saved.answers) {
                answersRef.current = saved.answers;
            }
            if (saved.gameProgress) {
                setGameProgress(prev => ({ ...prev, ...saved.gameProgress }));
            }

            setGameSession(prev => ({
                ...prev,
                lessonId: currentLessonId,
                category: currentCategory,
                currentQuestionIndex: nextIndex,
                questions: questionsSnapshot,
                score: saved.score || prev.score,
                hearts: Number.isFinite(restoredHearts) ? restoredHearts : prev.hearts,
                answers: saved.answers || prev.answers,
                isResumed: true,
            }));

            console.log('📂 Restored game progress at question', nextIndex + 1);
            return true;
        } catch (error) {
            console.error('❌ Error loading game progress:', error);
            return false;
        }
    };

    // ลบความคืบหน้าของเกม (เมื่อEnd Game)
    const clearGameProgress = async () => {
        try {
            await clearProgress(currentLessonId);
            console.log('🗑️ Game progress cleared for lesson:', currentLessonId);
        } catch (error) {
            console.error('❌ Error clearing game progress:', error);
        }
    };

    // โหลดข้อมูลผู้ใช้ (legacy)
    const loadUserStats = async () => {
        try {
            const userStatsData = await AsyncStorage.getItem(getUserScopedKey('userStats'));
            if (userStatsData) {
                const parsed = JSON.parse(userStatsData);
                setLegacyUserStats(parsed);
                console.log('📊 Loaded user stats (legacy):', parsed);
            }
        } catch (error) {
            console.error('❌ Error loading user stats:', error);
        }
    };

    // Load consonant data from API
    useEffect(() => {
        loadLessonCharacters();
        loadUserStats();
        
        // Initialize new services
        initializeServices();
        
        // โหลดความคืบหน้าของเกม (ถ้ามี)
        loadGameProgress();
    }, [isVowelLesson]);

    // Initialize new progress tracking services
    const initializeServices = async () => {
        try {
            if (user?.id) {
                await gameProgressService.initialize(user.id);
                await levelUnlockService.initialize(user.id);
                await userStatsService.initialize(user.id);
                console.log('✅ Progress tracking services initialized');
            }
        } catch (error) {
            console.error('❌ Error initializing services:', error);
        }
    };

    // เริ่มไฟสะสมเมื่อเข้าเล่นเกม
    const startDailyStreak = async () => {
        try {
            dailyStreakService.setUser(user?.id);
            const streakResult = await dailyStreakService.startStreak();
            const rewards = dailyStreakService.getStreakRewards(streakResult.streak);
            
            setDailyStreak(prev => ({
                currentStreak: streakResult.streak,
                maxStreak: Math.max(
                    streakResult?.maxStreak ?? 0,
                    streakResult.streak,
                    Number.isFinite(prev?.maxStreak) ? prev.maxStreak : 0
                ),
                isNewStreak: streakResult.isNewStreak,
                rewards: rewards,
                isPlayedToday: true
            }));

            console.log('🔥 Daily streak started:', {
                streak: streakResult.streak,
                isNew: streakResult.isNewStreak,
                rewards: rewards
            });

            return streakResult;
        } catch (error) {
            console.error('❌ Error starting daily streak:', error);
            return { streak: 0, isNewStreak: false };
        }
    };

    // Load vocabulary data from API
    useEffect(() => {
        loadVocabularyData();
    }, [currentLessonId, currentCategory, lessonCharacters, isVowelLesson, syncHearts]);

    const loadLessonCharacters = async () => {
        try {
            if (isVowelLesson) {
                console.log('🔤 Loading vowel data for lesson...');
                const vowels = await vocabWordService.getVowelsWithFallback();
                if (Array.isArray(vowels) && vowels.length > 0) {
                    const processedVowels = vowels.map(normalizeVowelItem);
                    setLessonCharacters(processedVowels);
                    console.log('✅ Loaded', processedVowels.length, 'vowels for lesson');
                    return;
                }

                throw new Error('No vowel data available');
            }

            console.log('🔤 Loading consonant data from database...');
            const consonants = await vocabWordService.getConsonants();
            
            if (consonants && Array.isArray(consonants) && consonants.length > 0) {
                const processedConsonants = consonants.map(normalizeConsonantItem);
                setLessonCharacters(processedConsonants);
                console.log('✅ Loaded', processedConsonants.length, 'consonants from database');
            } else {
                throw new Error('No consonant data received from database');
            }
        } catch (error) {
            console.error('❌ Error loading lesson characters:', error);

            if (isVowelLesson) {
                const fallbackVowels = await vocabWordService.getVowelsWithFallback();
                const processedFallback = fallbackVowels.map(normalizeVowelItem);
                setLessonCharacters(processedFallback);
            } else {
                const fallbackConsonants = await vocabWordService.getConsonantsWithFallback();
                const processedFallback = fallbackConsonants.map(normalizeConsonantItem);
                setLessonCharacters(processedFallback);
            }
        }
    };




    const loadVocabularyData = async () => {
        try {
            setLoading(true);
            console.log('🎯 Loading vocabulary data for lessonId:', currentLessonId, 'type:', typeof currentLessonId);

            const questionType = isLesson2Vowels ? 'lesson2_vowels' : (isVowelLesson ? 'vowel' : 'consonant');
            const savedProgress = await restoreProgress(currentLessonId);
            const savedGenerator = savedProgress?.generator || savedProgress?.generatorType;
            const generatorMismatch =
                (isVowelLesson && savedGenerator !== 'vowel') ||
                (!isVowelLesson && savedGenerator === 'vowel');

            if (generatorMismatch) {
                console.log('♻️ Ignoring incompatible saved progress for lesson', currentLessonId, {
                    expected: questionType,
                    found: savedGenerator || 'unknown'
                });
                await clearProgress(currentLessonId);
            } else if (savedProgress && savedProgress.questionsSnapshot && savedProgress.questionsSnapshot.length > 0) {
                console.log('✅ Restored lesson data from saved progress:', {
                    questionsCount: savedProgress.questionsSnapshot.length,
                    currentIndex: savedProgress.currentIndex,
                });

                const sanitizedSnapshot = (savedProgress.questionsSnapshot || []).filter(
                    q => q && !SENTENCE_ORDER_TYPES.has(q.type)
                );
                setQuestions(sanitizedSnapshot);
                const sanitizedLastIndex = Math.max(sanitizedSnapshot.length - 1, 0);
                const nextIndex = Math.max(
                    0,
                    Math.min(
                        savedProgress.currentIndex || savedProgress.currentQuestionIndex || 0,
                        sanitizedLastIndex
                    )
                );
                setCurrentQuestIndex(nextIndex);
                const restoredHearts = Number.isFinite(savedProgress.hearts) ? savedProgress.hearts : 5;
                syncHearts(restoredHearts);
                setScore(savedProgress.score || 0);
                if (savedProgress.perLetter) {
                    setPerLetter(savedProgress.perLetter);
                }
                if (savedProgress.answers) {
                    answersRef.current = savedProgress.answers;
                }
                setIsCorrect(null);
                setUserAnswer(null);
                setLoading(false);
                return;
            }

            let pool = Array.isArray(lessonCharacters) ? [...lessonCharacters] : [];

            if (pool.length === 0) {
                if (isVowelLesson) {
                    const vowels = await vocabWordService.getVowelsWithFallback();
                    pool = vowels.map(normalizeVowelItem);
                    setLessonCharacters(pool);
                } else {
                    const consonants = await vocabWordService.getConsonantsWithFallback();
                    pool = consonants.map(normalizeConsonantItem);
                    setLessonCharacters(pool);
                }
            }

            if (!pool || pool.length === 0) {
                throw new Error('No lesson characters available to generate questions');
            }

            if (!isVowelLesson && (currentLessonId === 1 || currentLessonId === '1')) {
                const fallbackConsonants = await vocabWordService.getConsonantsWithFallback();
                pool = fallbackConsonants.map(normalizeConsonantItem);
                setLessonCharacters(pool);
                console.log('🎯 First stage - ensuring full consonant set:', pool.length);
            }

            const gameQuestions = generateQuestions(pool, { type: questionType });
            const filteredQuestions = Array.isArray(gameQuestions)
                ? gameQuestions.filter(q => q && !SENTENCE_ORDER_TYPES.has(q.type))
                : [];

            if (!Array.isArray(filteredQuestions) || filteredQuestions.length === 0) {
                throw new Error(`No ${questionType} questions generated`);
            }

            setQuestions(filteredQuestions);
            setCurrentQuestIndex(0);
            setIsCorrect(null);
            setUserAnswer(null);
            setScore(0);
            syncHearts(5);
            setPerLetter({});
            answersRef.current = {};
            setLoading(false);

            await startDailyStreak();

            setGameProgress(prev => ({
                ...prev,
                startTime: Date.now(),
                totalQuestions: filteredQuestions.length,
                completedQuestions: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
                timePerQuestion: [],
                questionTypes: {},
                accuracy: 0,
                accuracyPercent: 0,
                totalTimeSpent: 0,
                streak: 0,
                maxStreak: 0,
                xpEarned: 0,
                level: 1,
                achievements: []
            }));

            await saveProgress({
                lessonId: currentLessonId,
                category: currentCategory,
                generator: questionType,
                currentIndex: 0,
                total: filteredQuestions.length,
                hearts: 5,
                score: 0,
                xp: 0,
                perLetter: {},
                answers: {},
                questionsSnapshot: filteredQuestions,
                updatedAt: Date.now()
            });

        } catch (error) {
            console.error('❌ Error loading vocabulary data:', error);
            try {
                const fallbackPoolSource = isVowelLesson
                    ? await vocabWordService.getVowelsWithFallback()
                    : await vocabWordService.getConsonantsWithFallback();

                const fallbackPool = fallbackPoolSource.map(
                    isVowelLesson ? normalizeVowelItem : normalizeConsonantItem
                );

                const fallbackQuestions = generateQuestions(fallbackPool, {
                    type: isVowelLesson ? 'vowel' : 'consonant'
                });

                const filteredFallbackQuestions = fallbackQuestions.filter(
                    q => q && !SENTENCE_ORDER_TYPES.has(q.type)
                );

                if (!filteredFallbackQuestions.length) {
                    throw new Error('Fallback question generation failed');
                }

                setLessonCharacters(fallbackPool);
                setQuestions(filteredFallbackQuestions);
                setCurrentQuestIndex(0);
                setIsCorrect(null);
                setUserAnswer(null);
                setScore(0);
                syncHearts(5);
                setPerLetter({});
                answersRef.current = {};
                setLoading(false);

                await startDailyStreak();

                setGameProgress(prev => ({
                    ...prev,
                    startTime: Date.now(),
                    totalQuestions: filteredFallbackQuestions.length,
                    completedQuestions: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    timePerQuestion: [],
                    questionTypes: {},
                    accuracy: 0,
                    accuracyPercent: 0,
                    totalTimeSpent: 0,
                    streak: 0,
                    maxStreak: 0,
                    xpEarned: 0,
                    level: 1,
                    achievements: []
                }));

                await saveProgress({
                    lessonId: currentLessonId,
                    category: currentCategory,
                    generator: isVowelLesson ? 'vowels' : 'consonants',
                    currentIndex: 0,
                    total: filteredFallbackQuestions.length,
                    hearts: 5,
                    score: 0,
                    xp: 0,
                    perLetter: {},
                    answers: {},
                    questionsSnapshot: filteredFallbackQuestions,
                    updatedAt: Date.now()
                });
            } catch (fallbackError) {
                console.error('❌ Unable to recover lesson with fallback data:', fallbackError);
                setLoading(false);
            }
        }
    };


        // ---- Auto Save functions ----
        const snapshot = () => {
            const totalQuestions = questions.length;
            const currentIndex = Math.max(0, Math.min(currentQuestIndex, Math.max(totalQuestions - 1, 0)));
            const progressPercent = totalQuestions > 0
                ? Math.round((currentIndex / totalQuestions) * 100)
                : 0;
            const accuracyPercent = Number.isFinite(gameProgress.accuracy)
                ? gameProgress.accuracy
                : 0;

            return {
                lessonId: currentLessonId,
                category: currentCategory,
                currentIndex,
                currentQuestionIndex: currentIndex,
                total: totalQuestions,
                hearts,
                score,
                xp: gameProgress.xpEarned || score || 0,
                diamondsEarned: gameProgress.diamondsEarned || 0,
                progress: progressPercent,
                accuracy: accuracyPercent,
                completed: totalQuestions > 0 && currentIndex >= totalQuestions,
                perLetter,
                answers: { ...answersRef.current },
                questionsSnapshot: questions,
                gameProgress,
                updatedAt: Date.now()
            };
        };

        const autosave = async () => {
            try {
                const snap = snapshot();
                await saveProgress(currentLessonId, snap);
            } catch (error) {
                console.error('❌ Error autosaving progress:', error);
            }
        };

    // เรียก autosave เมื่อ index/score/hearts เปลี่ยน
    useEffect(() => {
        if (questions.length) {
            autosave();
        }
    }, [currentQuestIndex, score, hearts, questions.length, gameProgress]);

    // Cleanup TTS listeners
    useEffect(() => {
        return () => {
            vaja9TtsService.cleanup();
        };
    }, []);

    // Question rendering function
    const renderQuestionComponent = () => {
        console.log('🎯 Rendering question:', { 
            hasCurrentQuestion: !!currentQuestion, 
            questionType: currentQuestion?.type,
            questionsLength: questions.length,
            currentIndex: currentQuestIndex
        });
        
        if (!currentQuestion) {
            console.warn('⚠️ No current question to render');
            return (
                <View style={styles.questionContainer}>
                    <Text style={styles.instructionText}>กำลังโหลดคำถาม...</Text>
                </View>
            );
        }

        const commonProps = {
            data: currentQuestion,
            onAnswerChange: setUserAnswer,
            userAnswer: userAnswer,
            isAnswered: isCorrect !== null,
            isCorrect: isCorrect, 
        };

        switch (currentQuestion.type) {
            case 'ARRANGE_SENTENCE':
                return <ArrangementComponent 
                    data={currentQuestion}
                    onAnswerChange={setUserAnswer}
                    userAnswer={userAnswer || []}
                    isAnswered={isCorrect !== null}
                    isCorrect={isCorrect}
                />;
            case 'MATCH_PICTURE':
                return <MatchingComponent {...commonProps} />;
            case 'DRAG_MATCH':
                return <DragMatchComponent {...commonProps} />;
            case 'LISTEN_CHOOSE':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.instructionText}>{currentQuestion.instruction}</Text>
                        <View style={styles.audioContainer}>
                            <AudioButton 
                                onPress={() => {
                                    if (currentQuestion.audioText) {
                                        vaja9TtsService.playThai(currentQuestion.audioText);
                                    }
                                }}
                                text={currentQuestion.audioText}
                            />
                        </View>
                        <View style={styles.choicesContainer}>
                            {currentQuestion.choices?.map((choice) => (
                                <TouchableOpacity
                                    key={choice.id}
                                    style={[
                                        styles.choiceButton,
                                        userAnswer === choice.text && styles.selectedChoice,
                                        isCorrect !== null && choice.text === currentQuestion.correctText && styles.correctChoice,
                                        isCorrect !== null && userAnswer === choice.text && choice.text !== currentQuestion.correctText && styles.wrongChoice
                                    ]}
                                    onPress={() => setUserAnswer(choice.text)}
                                    disabled={isCorrect !== null}
                                >
                                    <Text style={styles.choiceText}>{choice.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'PICTURE_MATCH':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.instructionText}>{currentQuestion.instruction}</Text>
                        {!!currentQuestion.imageSource && (
                            <View style={{ width: 220, height: 220, marginBottom: 14, borderRadius: 16, overflow: 'hidden', alignSelf: 'center' }}>
                                <Image
                                    key={currentQuestion.imageKey || currentQuestion.id}
                                    source={currentQuestion.imageSource}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="contain"
                                />
                            </View>
                        )}
                        {!!currentQuestion.questionText && <Text style={styles.questionText}>{currentQuestion.questionText}</Text>}
                        <View style={styles.choicesContainer}>
                            {currentQuestion.choices?.map((choice) => (
                                <TouchableOpacity
                                    key={choice.id}
                                    style={[
                                        styles.choiceButton,
                                        userAnswer === choice.text && styles.selectedChoice,
                                        isCorrect !== null && choice.text === currentQuestion.correctText && styles.correctChoice,
                                        isCorrect !== null && userAnswer === choice.text && choice.text !== currentQuestion.correctText && styles.wrongChoice
                                    ]}
                                    onPress={() => setUserAnswer(choice.text)}
                                    disabled={isCorrect !== null}
                                >
                                    <Text style={styles.choiceText}>{choice.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'MULTIPLE_CHOICE':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.instructionText}>{currentQuestion.instruction}</Text>
                        {!!currentQuestion.questionText && (
                            <Text style={[styles.questionText, { marginBottom: 20 }]}>{currentQuestion.questionText}</Text>
                        )}
                        <View style={styles.choicesContainer}>
                            {currentQuestion.choices?.map(choice => {
                                const isSelected = userAnswer === choice.value || userAnswer === choice.text;
                                const isCorrectChoice = isCorrect !== null && choice.value === currentQuestion.positionValue;
                                const isWrongChoice = isCorrect !== null && isSelected && !isCorrect;
                                return (
                                    <TouchableOpacity
                                        key={choice.id}
                                        style={[
                                            styles.choiceButton,
                                            isSelected && styles.selectedChoice,
                                            isCorrectChoice && styles.correctChoice,
                                            isWrongChoice && styles.wrongChoice
                                        ]}
                                        onPress={() => setUserAnswer(choice.value || choice.text)}
                                        disabled={isCorrect !== null}
                                    >
                                        <Text style={styles.choiceText}>{choice.text}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                );
            default:
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.instructionText}>คำถามไม่รองรับ</Text>
                    </View>
                );
        }
    };

    // Handle check answer
    const handleCheckAnswer = React.useCallback(() => {
        if (!currentQuestion) return;
        if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) return;

        let correct = false;
        switch (currentQuestion.type) {
            case 'ARRANGE_SENTENCE':
            case 'DRAG_ORDER':
                correct = JSON.stringify(userAnswer) === JSON.stringify(currentQuestion.correctOrder);
                break;
            case 'MATCH_PICTURE':
            case 'LISTEN_CHOOSE':
            case 'PICTURE_MATCH':
            case 'MULTIPLE_CHOICE':
            case 'MATCH_LETTER':
            case 'FILL_BLANK':
                correct = userAnswer === currentQuestion.correctText;
                break;
            case 'DRAG_MATCH':
                // CHECKสอบการเชื่อมต่อที่ถูกต้องทั้งหมด
                if (userAnswer && typeof userAnswer === 'object') {
                    const allCorrect = currentQuestion.leftItems.every(leftItem => {
                        const userAnswerText = userAnswer[leftItem.id];
                        return userAnswerText === leftItem.correctMatch;
                    });
                    const allConnected = currentQuestion.leftItems.every(leftItem => {
                        return userAnswer[leftItem.id];
                    });
                    correct = allCorrect && allConnected;
                }
                break;
            case 'SOUND_GROUP':
                correct = (currentQuestion.correctText || '').split(',').includes(userAnswer);
                break;
        }
        
        // เก็บคำตอบสำหรับการคำนวณสถิติย้อนหลัง
        answersRef.current[currentQuestIndex] = {
            questionId: currentQuestion.id ?? currentQuestIndex,
            answer: userAnswer,
            correct,
            answeredAt: Date.now(),
            questionType: currentQuestion.type
        };

        const xpReward = correct
            ? (isLesson2Vowels ? 20 : pointsPerQuestion)
            : 0;

        // อัปเดตความคืบหน้า
        updateGameProgress({
            isCorrect: correct,
            questionType: currentQuestion.type,
            xp: xpReward
        });

        setIsCorrect(correct);
        if (currentQuestion.consonantChar) updateLetterMastery(currentQuestion.consonantChar, correct);
        if (currentQuestion.consonantChars) currentQuestion.consonantChars.forEach(ch => updateLetterMastery(ch, correct));
        
        // CHECKสอบว่าEnd Gameหรือไม่
        if (currentQuestIndex === questions.length - 1) {
            // End Game - อัปเดตข้อมูลความคืบหน้าสุดท้าย
            setGameProgress(prev => {
                const finalProgress = {
                    ...prev,
                    endTime: Date.now(),
                    totalTimeSpent: Date.now() - prev.startTime
                };
                
                (async () => {
                    try {
                        const combinedXP = (finalProgress.xpEarned || 0) + (streakRewards.xp || 0);
                        const combinedDiamonds = (finalProgress.diamondsEarned || 0) + (streakRewards.diamonds || 0);
                        const accuracyPercent = questions.length > 0
                          ? Math.round((finalProgress.correctAnswers / questions.length) * 100)
                          : 0;
                        const accuracyRatio = accuracyPercent / 100;
                        const timeSpentSeconds = Math.round((finalProgress.totalTimeSpent || 0) / 1000);

                        await finalizeLesson({
                            finalProgress,
                            accuracyPercent,
                            accuracyRatio,
                            timeSpentSeconds,
                            combinedXP,
                            combinedDiamonds,
                        });
                    } catch (err) {
                        console.error('❌ Error finalizing game summary:', err);
                    }
                })();
                
                return finalProgress;
            });
        }

        setScore(s => s + (correct ? pointsPerQuestion : 0));
        if (!correct) {
            const nextHearts = Math.max(0, heartsRef.current - 1);
            syncHearts(nextHearts);
        }
    }, [currentQuestion, userAnswer, syncHearts, updateLocalHearts]);

    // Update letter mastery
    const updateLetterMastery = (char, correct) => {
        setPerLetter(prev => ({
            ...prev,
            [char]: {
                ...prev[char],
                total: (prev[char]?.total || 0) + 1,
                correct: (prev[char]?.correct || 0) + (correct ? 1 : 0),
                accuracy: ((prev[char]?.correct || 0) + (correct ? 1 : 0)) / ((prev[char]?.total || 0) + 1) * 100
            }
        }));
    };

    const finalizeLesson = React.useCallback(
        async ({
            finalProgress,
            accuracyPercent,
            accuracyRatio,
            timeSpentSeconds,
            combinedXP,
            combinedDiamonds,
        }) => {
            if (sessionFinalizedRef.current) {
                return;
            }

            sessionFinalizedRef.current = true;

            const streakRewards = dailyStreak?.rewards || { xp: 0, diamonds: 0 };

            const resolvedProgress = finalProgress || gameProgress;
            const totalQuestions = questions.length;
            const correctAnswers = Number.isFinite(resolvedProgress?.correctAnswers)
                ? resolvedProgress.correctAnswers
                : Object.values(answersRef.current || {}).filter((entry) => entry?.correct).length;
            const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
            const heartsRemaining = heartsRef.current;
            const streakValue = Number.isFinite(resolvedProgress?.streak)
                ? resolvedProgress.streak
                : 0;
            const maxStreakValue = Number.isFinite(resolvedProgress?.maxStreak)
                ? resolvedProgress.maxStreak
                : Math.max(streakValue, 0);
            const questionTypeCounts = resolvedProgress?.questionTypes || {};
            const completedAt = new Date().toISOString();

            const gameResults = {
                correct: correctAnswers,
                total: totalQuestions,
                accuracy: accuracyPercent,
                timeSpent: timeSpentSeconds,
                xpEarned: combinedXP,
                diamondsEarned: combinedDiamonds,
                heartsRemaining,
                streakReward: streakRewards,
                gameType: 'NewLessonGame',
                completedAt,
            };

            const sessionPayload = {
                lessonId: isLesson2Vowels ? 'lesson2_vowels' : currentLessonId,
                lessonKey: isLesson2Vowels ? 'lesson2_vowels' : `level${currentLessonId}`,
                category: currentCategory,
                gameMode: generatorType || 'new_lesson',
                score,
                maxScore: totalQuestions > 0 ? totalQuestions * pointsPerQuestion : pointsPerQuestion,
                accuracy: accuracyRatio,
                accuracyPercent,
                timeSpent: timeSpentSeconds,
                questionTypes: questionTypeCounts,
                completedAt,
                heartsRemaining,
                diamondsEarned: combinedDiamonds,
                xpEarned: combinedXP,
                streak: streakValue,
                maxStreak: maxStreakValue,
                level: unifiedStats?.level || 1,
                totalQuestions,
                correctAnswers,
                wrongAnswers,
            };

            try {
                if (isLesson2Vowels) {
                    try {
                        await apiClient.post('/progress/lesson2_vowels/complete', {
                            accuracy: accuracyPercent,
                            score,
                            xpEarned: combinedXP,
                            diamondsEarned: combinedDiamonds,
                            heartsRemaining,
                            timeSpentSec: timeSpentSeconds,
                            unlockedNext: accuracyPercent >= 70,
                        });
                    } catch (progressError) {
                        console.warn('⚠️ Unable to record lesson2 vowels progress', progressError?.message);
                    }
                }

                try {
                    const savedSession = await gameProgressService.saveGameSession(sessionPayload);
                    console.log('✅ Game session saved:', savedSession.id);
                } catch (saveError) {
                    console.error('❌ Error saving game session:', saveError);
                }

                await updateUserStatsLegacy(
                    resolvedProgress?.xpEarned ?? combinedXP,
                    resolvedProgress?.diamondsEarned ?? combinedDiamonds
                );

                let updatedUnified = null;
                try {
                    updatedUnified = await updateUnifiedFromGameSession({
                        ...sessionPayload,
                        gameType: 'NewLessonGame',
                    });
                    if (Number.isFinite(updatedUnified?.hearts)) {
                        updateLocalHearts(updatedUnified.hearts);
                    }
                } catch (unifiedError) {
                    console.warn('⚠️ Unable to update unified session stats:', unifiedError?.message || unifiedError);
                }

                try {
                    await updateUnifiedStats({ lastGameResults: gameResults });
                } catch (unifiedLastError) {
                    console.warn('⚠️ Unable to persist last game results in unified stats:', unifiedLastError?.message);
                }

                try {
                    await updateUserStats({ lastGameResults: gameResults });
                } catch (userDataError) {
                    console.warn('⚠️ Unable to persist last game results in user data:', userDataError?.message);
                }

                const progressDelta = {
                    xp: combinedXP,
                    diamonds: combinedDiamonds,
                    finishedLesson: true,
                    timeSpentSec: timeSpentSeconds,
                    totalCorrectAnswers: correctAnswers,
                    totalWrongAnswers: wrongAnswers,
                    lastGameResults: gameResults,
                };

                if (Number.isFinite(unifiedStats?.hearts)) {
                    const heartDelta = heartsRemaining - unifiedStats.hearts;
                    if (heartDelta !== 0) {
                        progressDelta.hearts = heartDelta;
                    }
                }

                try {
                    await applyDelta(progressDelta);
                } catch (deltaError) {
                    console.warn('⚠️ Unable to apply unified delta:', deltaError?.message || deltaError);
                }

                let unlockResult = null;
                try {
                    const currentLevelId = `level${currentLessonId}`;
                    unlockResult = await levelUnlockService.checkAndUnlockNextLevel(currentLevelId, {
                        accuracy: accuracyPercent,
                        score,
                        attempts: 1,
                    });
                } catch (unlockError) {
                    console.warn('⚠️ Unable to evaluate unlock progression:', unlockError?.message || unlockError);
                }

                await clearGameProgress();

                const nextStageUnlocked = Boolean(unlockResult?.unlocked || unlockResult?.nextLevel);

                navigation.replace('LessonComplete', {
                    lessonId: currentLessonId,
                    stageTitle,
                    score: correctAnswers,
                    totalQuestions,
                    timeSpent: timeSpentSeconds,
                    accuracyPercent,
                    accuracyRatio,
                    xpGained: combinedXP,
                    diamondsGained: combinedDiamonds,
                    heartsRemaining,
                    streak: streakValue,
                    maxStreak: maxStreakValue,
                    isUnlocked: accuracyPercent >= 70,
                    nextStageUnlocked,
                    nextStageMeta: resolvedNextStageMeta,
                    stageSelectRoute,
                    replayRoute,
                    replayParams: resolvedReplayParams,
                    questionTypeCounts,
                });
            } catch (err) {
                console.error('❌ Error finalizing lesson:', err);
                sessionFinalizedRef.current = false;
            }
        },
        [
            applyDelta,
            answersRef,
            clearGameProgress,
            clearProgress,
            currentCategory,
            currentLessonId,
            dailyStreak,
            gameProgress,
            generatorType,
            isLesson2Vowels,
            navigation,
            pointsPerQuestion,
            questions.length,
            resolvedNextStageMeta,
            resolvedReplayParams,
            stageSelectRoute,
            stageTitle,
            unifiedStats,
            updateLocalHearts,
            updateUnifiedFromGameSession,
            updateUnifiedStats,
            updateUserStats,
            updateUserStatsLegacy,
        ]
    );

    // Finish lesson
    const finishLesson = React.useCallback(
        async (timeSpentSec = 0) => {
            const streakRewards = dailyStreak?.rewards || { xp: 0, diamonds: 0 };
            const baseXp = isLesson2Vowels ? score * 4 : score;
            const diamondsFromProgress = Math.max(gameProgress.diamondsEarned || 0, 0);
            const diamondsGained = isLesson2Vowels
                ? Math.max(diamondsFromProgress, 3)
                : Math.max(2, Math.floor(score / 50));
            const totalQuestions = questions.length;
            const maxScore = totalQuestions > 0 ? totalQuestions * pointsPerQuestion : pointsPerQuestion;
            const accuracyPercent = totalQuestions > 0 ? Math.round((score / maxScore) * 100) : 0;
            const accuracyRatio = accuracyPercent / 100;

            await finalizeLesson({
                finalProgress: {
                    ...gameProgress,
                    correctAnswers: gameProgress.correctAnswers,
                    wrongAnswers: gameProgress.wrongAnswers,
                },
                accuracyPercent,
                accuracyRatio,
                timeSpentSeconds: timeSpentSec,
                combinedXP: baseXp + (streakRewards.xp || 0),
                combinedDiamonds: diamondsGained + (streakRewards.diamonds || 0),
            });
        },
        [
            dailyStreak,
            finalizeLesson,
            gameProgress,
            isLesson2Vowels,
            pointsPerQuestion,
            questions.length,
            score,
        ]
    );

    // Handle continue
    const handleContinue = React.useCallback(async () => {
        if (currentQuestIndex < questions.length - 1) {
            setCurrentQuestIndex(i => i + 1);
            setIsCorrect(null);
            setUserAnswer(null);
        } else {
            const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            await finishLesson(timeSpent);
        }
    }, [currentQuestIndex, questions.length, finishLesson]);

    // Audio Button Component
    const AudioButton = ({ onPress, text }) => (
        <TouchableOpacity style={styles.audioButton} onPress={onPress}>
            <FontAwesome name="volume-up" size={24} color="#FF8000" />
            <Text style={styles.audioText}>{text}</Text>
        </TouchableOpacity>
    );

    // Check Button Component
    const CheckButton = ({ onPress, disabled }) => (
        <TouchableOpacity 
            style={[styles.checkButton, disabled && styles.checkButtonDisabled]} 
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={[styles.checkButtonText, disabled && styles.checkButtonTextDisabled]}>
                CHECK
            </Text>
        </TouchableOpacity>
    );

    // Feedback Bar Component
    const FeedbackBar = ({ isCorrect, onContinue }) => (
        <View style={[styles.feedbackBar, { backgroundColor: isCorrect ? '#58cc02' : '#ff4b4b' }]}>
            <Text style={styles.feedbackText}>
                {isCorrect ? 'Correct!' : 'Wrong!'}
            </Text>
            <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                <Text style={styles.continueButtonText}>CONTINUE</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <LottieView
                        source={require('../assets/animations/LoadingCat.json')}
                        autoPlay
                        loop
                        style={styles.loadingAnimation}
                    />
                    <Text style={styles.loadingText}>
                        {gameSession.isResumed ? 'กำลังโหลดเกมต่อ...' : 'Loading...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }



    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={async () => {
                        await autosave();
                        navigation.goBack();
                    }}
                >
                    <FontAwesome name="times" size={24} color="#FF8000" />
                </TouchableOpacity>
                
                <View style={styles.progressContainer}>
                    {gameSession.isResumed && (
                        <View style={styles.resumeNotification}>
                            <FontAwesome name="play-circle" size={16} color="#4CAF50" />
                            <Text style={styles.resumeText}>Resume from question {currentQuestIndex + 1}</Text>
                        </View>
                    )}
                    <View style={styles.progressBar}>
                        <LinearGradient
                            colors={['#FF8000', '#FFB84D', '#FFD700']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.progressFill, 
                                { width: questions.length > 0 ? `${((currentQuestIndex + 1) / questions.length) * 100}%` : '0%' }
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {questions.length > 0 ? `${currentQuestIndex + 1} / ${questions.length}` : '0 / 0'}
                    </Text>
                    
                    {/* สถิติความคืบหน้า */}
                    <View style={styles.progressStats}>
                        <View style={styles.progressStatItem}>
                            <LottieView
                                source={require('../assets/animations/Star.json')}
                                autoPlay
                                loop
                                style={styles.progressStatAnimation}
                            />
                            <Text style={styles.progressStatText}>{gameProgress.xpEarned} XP</Text>
                        </View>
                        <View style={styles.progressStatItem}>
                            <LottieView
                                source={require('../assets/animations/Diamond.json')}
                                autoPlay
                                loop
                                style={styles.progressStatAnimation}
                            />
                            <Text style={styles.progressStatText}>{gameProgress.diamondsEarned}</Text>
                        </View>
                        <View style={styles.progressStatItem}>
                            <FontAwesome name="bullseye" size={12} color="#4ECDC4" />
                            <Text style={styles.progressStatText}>{currentAccuracyPercent}%</Text>
                        </View>
                        <View style={styles.progressStatItem}>
                            <FontAwesome name="fire" size={12} color="#FF8C00" />
                            <Text style={styles.progressStatText}>{gameProgress.streak}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.heartsContainer}>
                    <LottieView
                        source={require('../assets/animations/Heart.json')}
                        autoPlay
                        loop
                        style={styles.heartsAnimation}
                    />
                    <Text style={styles.heartsText}>{hearts}</Text>
                </View>

                {/* ไฟสะสมรายวัน */}
                <View style={styles.streakContainer}>
                    <StreakBadge value={dailyStreak.currentStreak || 0} />
                </View>
                
            </View>



            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollViewContent}
            >
                {renderQuestionComponent()}
            </ScrollView>

            {isCorrect !== null ? (
                <FeedbackBar 
                    isCorrect={isCorrect} 
                    onContinue={handleContinue}
                />
            ) : (
                <CheckButton 
                    onPress={handleCheckAnswer} 
                    disabled={!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)} 
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#fff' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingAnimation: {
        width: 100,
        height: 100,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 10,
    },
    progressContainer: {
        flex: 1,
        marginHorizontal: 20,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        textAlign: 'center',
        marginTop: 5,
        fontSize: 12,
        color: '#666',
    },
    resumeNotification: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginBottom: 8,
    },
    resumeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
        marginLeft: 6,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        gap: 12,
    },
    progressStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 128, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressStatText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4,
    },
    progressStatAnimation: {
        width: 12,
        height: 12,
    },
    rewardAnimation: {
        width: 24,
        height: 24,
    },
    userStatAnimation: {
        width: 20,
        height: 20,
    },
    heartsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heartsText: {
        marginLeft: 5,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ff4b4b',
    },
    streakContainer: {
        marginLeft: 10,
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
    },
    questionContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    instructionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    questionText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    answerArea: {
        minHeight: 60,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrangedWordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    arrangedWord: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    arrangedWordText: {
        fontSize: 16,
        color: '#333',
    },
    wordBank: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    wordButton: {
        backgroundColor: '#FF8000',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    wordButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    choicesContainer: {
        gap: 15,
    },
    choiceButton: {
        backgroundColor: '#ffffff',
        borderWidth: 3,
        borderColor: '#e0e0e0',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 60,
        justifyContent: 'center',
    },
    selectedChoice: {
        borderColor: '#FF8000',
        backgroundColor: '#fff5e6',
        borderWidth: 4,
        shadowColor: '#FF8000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    correctChoice: {
        borderColor: '#58cc02',
        backgroundColor: '#d4f4aa',
    },
    wrongChoice: {
        borderColor: '#ff4b4b',
        backgroundColor: '#ffb3b3',
    },
    choiceText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
    },
    audioContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    audioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5e6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FF8000',
    },
    audioText: {
        marginLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF8000',
    },
    checkButton: {
        backgroundColor: '#FF8000',
        paddingVertical: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkButtonDisabled: {
        backgroundColor: '#ccc',
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkButtonTextDisabled: {
        color: '#999',
    },
    feedbackBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
    },
    feedbackText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    continueButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Drag Match Styles
    dragMatchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
        minHeight: 250,
        paddingHorizontal: 15,
    },
    leftColumn: {
        flex: 1,
        marginRight: 20,
        justifyContent: 'space-around',
    },
    rightColumn: {
        flex: 1,
        marginLeft: 20,
        justifyContent: 'space-around',
    },
    dragItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 5,
    },
    connectionSymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 6,
    },
    dragItem: {
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        padding: 18,
        marginVertical: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        minHeight: 60,
        justifyContent: 'center',
    },
    selectedDragItem: {
        borderColor: '#FF8000',
        backgroundColor: '#fff5e6',
        borderWidth: 4,
        shadowColor: '#FF8000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    correctDragItem: {
        borderColor: '#58cc02',
        backgroundColor: '#d4f4aa',
    },
    wrongDragItem: {
        borderColor: '#ff4b4b',
        backgroundColor: '#ffb3b3',
    },
    dragItemText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
    },
    connectionInfo: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        alignItems: 'center',
    },
    connectionText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    // Sound Button Styles
    soundButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 15,
        paddingHorizontal: 20,
    },
    soundButton: {
        backgroundColor: '#4ECDC4',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    soundButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    removeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 5,
    },
    // Summary Screen Styles
    summaryContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
        justifyContent: 'center',
    },
    summaryTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF8000',
        textAlign: 'center',
        marginBottom: 30,
    },
    gameStatsContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    gameStatsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    gameStatsRow: {
        marginBottom: 10,
    },
    gameStatsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    rewardsContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    rewardsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    rewardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    rewardItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 128, 0, 0.1)',
        padding: 15,
        borderRadius: 15,
        minWidth: 100,
    },
    rewardText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    streakRewardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        padding: 15,
        borderRadius: 15,
        marginTop: 15,
        borderWidth: 2,
        borderColor: '#FF8C00',
    },
    streakRewardAnimation: {
        width: 40,
        height: 40,
    },
    streakRewardInfo: {
        marginLeft: 15,
        flex: 1,
    },
    streakRewardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF8C00',
        marginBottom: 4,
    },
    streakRewardText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    streakRewardBonus: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FF6B35',
        fontStyle: 'italic',
    },
    userStatsContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    userStatsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    userStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 20,
    },
    userStatItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 128, 0, 0.1)',
        padding: 12,
        borderRadius: 12,
        minWidth: 80,
    },
    userStatText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 6,
    },
    summaryActions: {
        marginTop: 28,
        gap: 12,
    },
    summaryActionButton: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    primaryAction: {
        backgroundColor: '#FF8C2A',
    },
    secondaryAction: {
        backgroundColor: '#FFE8D5',
    },
    neutralAction: {
        backgroundColor: '#E9ECEF',
    },
    summaryActionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3B352E',
    },
    levelProgressContainer: {
        marginTop: 10,
    },
    unlockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        padding: 15,
        borderRadius: 15,
        marginTop: 15,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    unlockAnimation: {
        width: 40,
        height: 40,
    },
    unlockInfo: {
        marginLeft: 15,
        flex: 1,
    },
    unlockTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 4,
    },
    unlockText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    unlockSubtext: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    lockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(158, 158, 158, 0.1)',
        padding: 15,
        borderRadius: 15,
        marginTop: 15,
        borderWidth: 2,
        borderColor: '#9E9E9E',
    },
    lockInfo: {
        marginLeft: 15,
        flex: 1,
    },
    lockTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#9E9E9E',
        marginBottom: 4,
    },
    lockText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    lockSubtext: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    levelProgressText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
    },
    levelProgressSubtext: {
        fontSize: 13,
        color: '#7A8696',
        textAlign: 'center',
        marginBottom: 12,
    },
    levelProgressBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelProgressTrack: {
        flex: 1,
        height: 12,
        backgroundColor: '#e0e0e0',
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: 10,
    },
    levelProgressFill: {
        height: '100%',
        borderRadius: 6,
    },
    levelProgressPercent: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF8000',
        minWidth: 40,
        textAlign: 'right',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 6,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    modalIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF4E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6B4C3B',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#7B5A3D',
        marginBottom: 18,
    },
    modalHighlight: {
        color: '#FF7A00',
        fontWeight: '700',
    },
    modalRewardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 22,
    },
    modalRewardChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    modalHeartChip: {
        backgroundColor: '#FFE4EA',
    },
    modalDiamondChip: {
        backgroundColor: '#E4F2FF',
    },
    modalRewardText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5C4630',
    },
    modalButton: {
        alignSelf: 'center',
        paddingHorizontal: 32,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: '#FF8C2A',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    continueButton: {
        backgroundColor: '#FF8000',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    heartsAnimation: {
        width: 40,
        height: 40,
    },
});

export default NewLessonGame;
