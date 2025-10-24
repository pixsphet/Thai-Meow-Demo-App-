import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Services
import vaja9TtsService from '../services/vaja9TtsService';
import { saveProgress, restoreProgress, clearProgress } from '../services/progressService';
import gameProgressService from '../services/gameProgressService';
import levelUnlockService from '../services/levelUnlockService';
import userStatsService from '../services/userStatsService';
import dailyStreakService from '../services/dailyStreakService';

// Contexts
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useUserData } from '../contexts/UserDataContext';

// Data
import consonantsFallback from '../data/consonants_fallback.json';
import { letterImages } from '../assets/letters';
import FireStreakAlert from '../components/FireStreakAlert';

const { width, height } = Dimensions.get('window');

// Types
const Consonant = {
  id: String,
  char: String,
  name: String,
  roman: String,
  meaningTH: String,
  meaningEN: String,
  image: String,
  audioText: String,
};

// Question Types
const QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  DRAG_MATCH: 'DRAG_MATCH',
  FILL_BLANK: 'FILL_BLANK',
  SYLLABLE_BUILDER: 'SYLLABLE_BUILDER',
  ORDER_TILES: 'ORDER_TILES',
  A_OR_B: 'A_OR_B',
  MEMORY_MATCH: 'MEMORY_MATCH',
  CHALLENGE: 'CHALLENGE',
};

// Colors
const COLORS = {
  primary: '#FF8000',
  cream: '#FFF5E5',
  white: '#FFFFFF',
  dark: '#2C3E50',
  success: '#58cc02',
  error: '#ff4b4b',
  lightGray: '#f5f5f5',
  gray: '#666',
};

// Helper Functions
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).substr(2, 9);

// Normalize consonant data
const normalizeConsonant = (doc) => ({
  id: doc.id || doc._id?.toString() || uid(),
  char: doc.char || doc.thai,
  name: doc.name || doc.nameTH,
  roman: doc.roman,
  meaningTH: doc.meaningTH || doc.meaning,
  meaningEN: doc.meaningEN || doc.en,
  image: doc.image || doc.char,
  audioText: doc.audioText || doc.name || doc.nameTH,
});

// UI helper for hint texts per question type
const getHintText = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
      return 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกตัวอักษรที่ได้ยิน';
    case QUESTION_TYPES.PICTURE_MATCH:
      return 'ดูภาพตัวอักษรตรงกลาง แล้วเลือกตัวอักษรที่ตรงกัน';
    case QUESTION_TYPES.DRAG_MATCH:
      return 'แตะเพื่อจับคู่ ชื่อเรียก/โรมัน ↔ ตัวอักษรไทย';
    case QUESTION_TYPES.FILL_BLANK:
      return 'แตะตัวเลือกเพื่อเติมคำให้ถูกต้อง';
    case QUESTION_TYPES.ARRANGE_SENTENCE:
      return 'แตะคำเรียงตามลำดับให้ถูกต้อง';
    case QUESTION_TYPES.SYLLABLE_BUILDER:
      return 'เลือกให้ครบทุกช่องเพื่อประกอบพยางค์';
    case QUESTION_TYPES.ORDER_TILES:
      return 'แตะคำตามลำดับ ถ้ากดพลาดแตะซ้ำเพื่อเอาออก';
    case QUESTION_TYPES.A_OR_B:
      return 'ฟังเสียงแล้วเลือก A หรือ B เร็ว ๆ';
    case QUESTION_TYPES.MEMORY_MATCH:
      return 'จับคู่การ์ดตัวอักษรกับชื่ออ่านให้ครบ';
    case QUESTION_TYPES.CHALLENGE:
      return 'ท้าทายต่อเนื่องกับคำถามหลายแบบ';
    default:
      return '';
  }
};

// Language helpers
const isThaiText = (text) => /[ก-๙]/.test(String(text || ''));

// Global display preference: use both Thai and Roman
const SHOW_ROMAN = true;
const SHOW_THAI = true; // Also show Thai characters

const getTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียงเลือกตัวอักษร';
    case QUESTION_TYPES.PICTURE_MATCH: return 'จับคู่จากรูปภาพ';
    case QUESTION_TYPES.DRAG_MATCH: return 'จับคู่ชื่อเรียก ↔ ตัวอักษร';
    case QUESTION_TYPES.FILL_BLANK: return 'เติมคำให้ถูก';
    case QUESTION_TYPES.ARRANGE_SENTENCE: return 'เรียงคำ';
    case QUESTION_TYPES.SYLLABLE_BUILDER: return 'ประกอบพยางค์';
    case QUESTION_TYPES.ORDER_TILES: return 'เรียงบัตรคำ';
    case QUESTION_TYPES.A_OR_B: return 'เลือก A หรือ B';
    case QUESTION_TYPES.MEMORY_MATCH: return 'จับคู่ความจำ';
    case QUESTION_TYPES.CHALLENGE: return 'ท้าทายรวม';
    default: return '';
  }
};

// Helper constants for syllable building
const BASIC_VOWELS = ['ะ','า','ิ','ี','ุ','ู','เ','แ','โ'];
const BASIC_FINALS = ['', 'น', 'ม', 'ก'];
const TONES = ['', '่','้','๊','๋'];

// Helper: render syllable from components
const toRenderedSyllable = ({ initial, vowel, tone, final }) => {
  return `${vowel}${initial}${tone}${final}`;
};

// Question Generators
const makeListenChoose = (word, pool, usedChars = new Set()) => {
  const wrongChoices = pool
    .filter(w => w.char !== word.char && !usedChars.has(w.char))
    .slice(0, 3);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `lc_${word.char}_${uid()}`,
    type: QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังเสียงแล้วเลือกตัวอักษรที่ได้ยิน',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: word.audioText,
    correctText: word.char,
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.char,
      roman: c.roman || c.name,
      text: `${c.char}\n${c.roman || c.name}`, // Thai on top, Roman below
      speakText: c.audioText || c.name || c.roman || c.char,
      isCorrect: c.char === word.char,
    })),
  };
};

const makePictureMatch = (word, pool, usedChars = new Set()) => {
  const wrongChoices = pool
    .filter(w => w.char !== word.char && !usedChars.has(w.char))
    .slice(0, 3);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `pm_${word.char}_${uid()}`,
    type: QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูภาพแล้วเลือกพยัญชนะให้ถูกต้อง',
    imageKey: word.image,
    correctText: word.char,
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.char,
      roman: c.roman || c.name,
      text: `${c.char}\n${c.roman || c.name}`, // Thai on top, Roman below
      speakText: c.audioText || c.name || c.roman || c.char,
      isCorrect: c.char === word.char,
    })),
  };
};

// emoji placeholders for picture-side when assets are not available
const CONSONANT_EMOJI = {
  'ก': '🐔', 'ข': '🥚', 'ค': '🐃', 'ฆ': '🔔', 'ง': '🐍', 'จ': '🍽️', 'ฉ': '🥁', 'ช': '🐘',
  'ซ': '⛓️', 'ฌ': '🌳', 'ญ': '👩', 'ด': '👶', 'ต': '🐢', 'ถ': '👜', 'ท': '🪖', 'ธ': '🚩',
  'น': '🐭', 'บ': '🍃', 'ป': '🐟', 'ผ': '🐝', 'ฝ': '🛗', 'พ': '🛕', 'ฟ': '🦷', 'ภ': '⛵',
  'ม': '🐴', 'ย': '👹', 'ร': '🚤', 'ล': '🐒', 'ว': '💍', 'ศ': '🏛️', 'ษ': '🧙', 'ส': '🐯',
  'ห': '📦', 'ฬ': '🪁', 'อ': '🛁', 'ฮ': '🦉'
};

const makeDragMatch = (word, pool, usedChars = new Set()) => {
  const otherWords = pool.filter(w => w.char !== word.char && !usedChars.has(w.char)).slice(0, 3);
  const allWords = shuffle([word, ...otherWords]);

  // Left = words (meanings), Right = pictures (emoji placeholder) → match by character
  let leftItems = allWords.map((w, i) => ({
    id: `left_${i + 1}`,
    text: w.meaningTH || w.name || w.roman || w.char,
    correctMatch: w.char,
    speakText: w.meaningTH || w.audioText || w.name,
  }));

  let rightItems = allWords.map((w, i) => ({
    id: `right_${i + 1}`,
    text: w.char,                 // used for correctness check
    display: CONSONANT_EMOJI[w.char] || w.char, // what we visually show
    thai: w.char,
    roman: w.roman || w.name,
    speakText: w.audioText,
  }));

  // Shuffle columns independently for better variety
  leftItems = shuffle(leftItems);
  rightItems = shuffle(rightItems);

  return {
    id: `dm_${word.char}_${uid()}`,
    type: QUESTION_TYPES.DRAG_MATCH,
    instruction: 'จับคู่คำกับรูปภาพ',
    // Rewards for this question
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    leftItems,
    rightItems,
  };
};

const makeFillBlank = (word, pool, usedChars = new Set()) => {
  const wrongChoices = pool
    .filter(w => w.char !== word.char && !usedChars.has(w.char))
    .slice(0, 3);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `fb_${word.char}_${uid()}`,
    type: QUESTION_TYPES.FILL_BLANK,
    instruction: 'เติมคำในช่องว่าง',
    questionText: `ตัวอักษร ____ อ่านว่า "${word.name}"`,
    correctText: word.char,
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.char,
      roman: c.roman || c.name,
      text: `${c.char}\n${c.roman || c.name}`, // Thai on top, Roman below
      speakText: c.audioText || c.name || c.roman || c.char,
      isCorrect: c.char === word.char,
    })),
  };
};

const makeArrange = (word) => {
  const parts = [`คำว่า`, word.char, `อ่านว่า`, word.name];
  const distractors = ['ครับ', 'ค่ะ', 'ไหม'];
  const allParts = shuffle([...parts, ...distractors]);
  
  return {
    id: `arr_${word.char}_${uid()}`,
    type: QUESTION_TYPES.ARRANGE_SENTENCE,
    instruction: 'เรียงคำให้ถูกต้อง',
    correctOrder: parts,
    allParts,
  };
};

// Syllable Builder: choose initial, vowel, tone, final
const makeSyllableBuilder = (word, pool = []) => {
  const vowel = pick(BASIC_VOWELS);
  const tone = pick(TONES);
  const final = pick(BASIC_FINALS);
  
  // Create options for each slot
  const getOtherConsonants = () => {
    if (pool.length > 0) {
      return pool
        .filter(w => w.char !== word.char)
        .slice(0, 2)
        .map(w => w.char);
    }
    return ['ข', 'ค', 'ง'];
  };
  
  return {
    id: `sb_${word.char}_${uid()}`,
    type: QUESTION_TYPES.SYLLABLE_BUILDER,
    instruction: 'ประกอบพยางค์จากส่วนประกอบ',
    // Rewards for this question
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    correct: {
      initial: word.char,
      vowel,
      tone,
      final,
    },
    slots: [
      {
        key: 'initial',
        label: 'อักษรต้น (Initial)',
        options: shuffle([word.char, ...getOtherConsonants()]),
      },
      {
        key: 'vowel',
        label: 'สระ (Vowel)',
        options: shuffle([vowel, ...BASIC_VOWELS.filter(v => v !== vowel).slice(0, 2)]),
      },
      {
        key: 'tone',
        label: 'วรรณยุกต์ (Tone)',
        options: shuffle([tone, ...TONES.filter(t => t !== tone).slice(0, 1)]),
      },
      {
        key: 'final',
        label: 'ตัวสะกด (Final)',
        options: shuffle([final, ...BASIC_FINALS.filter(f => f !== final).slice(0, 2)]),
      },
    ],
  };
};

// Order Tiles: arrange words/phrases in correct order
const makeOrderTiles = (word) => {
  // Multiple correct orderings
  const correctOrders = [
    ['คำว่า', word.char, 'อ่านว่า', word.name],
    [word.char, 'อ่านว่า', word.name],
  ];
  
  // Distractors
  const distractors = ['ครับ', 'ค่ะ', 'ไหม', 'อย่าง'];
  
  // All parts to shuffle (use first correct order as base)
  const allParts = shuffle([...correctOrders[0], ...distractors]);
  
  return {
    id: `ot_${word.char}_${uid()}`,
    type: QUESTION_TYPES.ORDER_TILES,
    instruction: 'เรียงคำให้ถูกต้อง',
    // Rewards for this question
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    correctOrders,
    allParts,
  };
};

// A or B: Quick listen and choose between two
const makeAorB = (word, pool = [], usedChars = new Set()) => {
  // Get options that are different from target word and not used
  const wrongOptions = pool.filter(w => w.char !== word.char && !usedChars.has(w.char));
  
  // Pick one wrong option, or use word if no options available
  const wrongChoice = wrongOptions.length > 0 ? pick(wrongOptions) : word;
  
  // Randomly assign which position gets the correct answer
  const choiceA = Math.random() > 0.5 ? word : wrongChoice;
  const choiceB = choiceA === word ? wrongChoice : word;
  
  // Ensure both choices have data
  if (!choiceA || !choiceB) {
    console.warn('[makeAorB] Missing choice data', { choiceA, choiceB, word });
  }
  
  return {
    id: `aob_${word.char}_${uid()}`,
    type: QUESTION_TYPES.A_OR_B,
    instruction: 'เลือก A หรือ B',
    audioText: word.audioText || word.name,
    // Rewards for this question
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: [
      {
        letter: 'A',
        thai: choiceA?.char || '',
        roman: choiceA?.roman || choiceA?.name || '',
        text: `${choiceA?.char || ''}\n${choiceA?.roman || choiceA?.name || ''}`,
        isCorrect: choiceA?.char === word.char,
        char: choiceA?.char || '',
      },
      {
        letter: 'B',
        thai: choiceB?.char || '',
        roman: choiceB?.roman || choiceB?.name || '',
        text: `${choiceB?.char || ''}\n${choiceB?.roman || choiceB?.name || ''}`,
        isCorrect: choiceB?.char === word.char,
        char: choiceB?.char || '',
      },
    ],
  };
};

// Memory Match: flip cards to match characters with their names
const makeMemoryMatch = (wordList) => {
  const cards = [];
  const pairs = wordList.slice(0, 6).map(w => ({
    char: w.char,
    name: w.name,
    audioText: w.audioText,
  }));
  
  // Create card pairs (character + name for each word)
  pairs.forEach((pair, idx) => {
    cards.push({
      id: `mm_char_${idx}`,
      type: 'char',
      front: pair.char,
      back: pair.char,
      pairId: idx,
      audioText: pair.audioText,
    });
    cards.push({
      id: `mm_name_${idx}`,
      type: 'name',
      front: '?',
      back: pair.name,
      pairId: idx,
      audioText: pair.audioText,
    });
  });
  
  const shuffledCards = shuffle(cards);
  
  return {
    id: `mm_${uid()}`,
    type: QUESTION_TYPES.MEMORY_MATCH,
    instruction: 'จับคู่ตัวอักษรกับชื่ออ่าน',
    // Rewards for this question
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    cards: shuffledCards,
    pairCount: pairs.length,
  };
};

// Challenge: mini game combining multiple quick question types
const makeChallenge = (word, pool = [], usedChars = new Set()) => {
  const subQuestions = [];
  
  // Add a quick A/B question
  subQuestions.push(makeAorB(word, pool, usedChars));
  
  // Add a LISTEN_CHOOSE
  subQuestions.push(makeListenChoose(word, pool, usedChars));
  
  // Add a FILL_BLANK
  subQuestions.push(makeFillBlank(word, pool, usedChars));
  
  return {
    id: `ch_${word.char}_${uid()}`,
    type: QUESTION_TYPES.CHALLENGE,
    instruction: 'ท้าทายหลายแบบ',
    // Rewards for this question (for completing all 3 sub-questions)
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    subQuestions,
    currentSubIndex: 0,
  };
};

// Generate questions tailored for ก-ฮ (focus on recognition):
// Target 16-17 total: LC×5, PM×4, DM×3, FB×3, A/B×2
const generateConsonantQuestions = (pool) => {
  const questions = [];
  const usedChars = new Set();

  // LISTEN_CHOOSE × 5
  for (let i = 0; i < 5; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeListenChoose(word, pool, usedChars));
  }

  // PICTURE_MATCH × 4
  for (let i = 0; i < 4; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makePictureMatch(word, pool, usedChars));
  }

  // DRAG_MATCH × 3
  for (let i = 0; i < 3; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeDragMatch(word, pool, usedChars));
  }

  // FILL_BLANK × 3
  for (let i = 0; i < 3; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeFillBlank(word, pool, usedChars));
  }

  // A_OR_B × 2
  for (let i = 0; i < 2; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeAorB(word, pool, usedChars));
  }

  // Shuffle for varied flow
  return shuffle(questions);
};

// Check answer
const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
    case QUESTION_TYPES.PICTURE_MATCH:
    case QUESTION_TYPES.FILL_BLANK:
      return userAnswer === question.correctText;
    
    case QUESTION_TYPES.DRAG_MATCH:
      // For drag match, check if all pairs are correct
      return userAnswer && userAnswer.every(pair => 
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );
    
    case QUESTION_TYPES.ARRANGE_SENTENCE:
      return Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
    
    case QUESTION_TYPES.SYLLABLE_BUILDER:
      if (!userAnswer) return false;
      return ['initial', 'vowel', 'tone', 'final'].every(
        k => userAnswer[k] === question.correct[k]
      );
    
    case QUESTION_TYPES.ORDER_TILES:
      return Array.isArray(userAnswer) 
        && question.correctOrders.some(pattern =>
             userAnswer.length === pattern.length &&
             userAnswer.every((t, idx) => t === pattern[idx])
           );
    
    case QUESTION_TYPES.A_OR_B:
      // userAnswer should be the choice object with isCorrect flag
      return userAnswer && userAnswer.isCorrect;
    
    case QUESTION_TYPES.MEMORY_MATCH:
      // userAnswer should be array of matched pair IDs
      return Array.isArray(userAnswer) && userAnswer.length === question.pairCount;
    
    case QUESTION_TYPES.CHALLENGE:
      // userAnswer is the result from last sub-question
      return userAnswer === true;
    
    default:
      return false;
  }
};

const ConsonantStage1Game = ({ navigation, route }) => {
  const {
    lessonId = 1,
    category: routeCategory = 'consonants',
    stageTitle = 'พยัญชนะพื้นฐาน ก-ฮ',
    level: stageLevel = 1,
    nextStageMeta: incomingNextStageMeta,
    stageSelectRoute = 'LevelStage1',
    replayRoute = 'ConsonantStage1Game',
    replayParams: incomingReplayParams,
  } = route.params || {};

  const resolvedNextStageMeta = useMemo(() => {
    if (incomingNextStageMeta) {
      return incomingNextStageMeta;
    }
    if (Number(lessonId) === 1) {
      return {
        route: 'BeginnerVowelsStage',
        params: {
          lessonId: 2,
          category: 'vowels_basic',
          level: stageLevel,
          stageTitle: 'สระ 32 ตัว',
          generator: 'lesson2_vowels',
        },
      };
    }
    return null;
  }, [incomingNextStageMeta, lessonId, stageLevel]);

  const resolvedReplayParams = useMemo(
    () => ({
      lessonId,
      category: routeCategory,
      level: stageLevel,
      stageTitle,
      ...(incomingReplayParams || {}),
    }),
    [lessonId, routeCategory, stageLevel, stageTitle, incomingReplayParams]
  );
  
  // Contexts
  const { applyDelta, user: progressUser } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();
  
  // State
  const [consonants, setConsonants] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [diamondsEarned, setDiamondsEarned] = useState(0);
  const [answers, setAnswers] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState(null);
  const [dmSelected, setDmSelected] = useState({ leftId: null, rightId: null });
  const [dmPairs, setDmPairs] = useState([]); // {leftId,rightId}
  const [showFireStreakAlert, setShowFireStreakAlert] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null); // 'correct'|'wrong'|null
  
  // Memory Match state
  const [mmFlipped, setMmFlipped] = useState(new Set()); // card IDs that are flipped
  const [mmMatched, setMmMatched] = useState(new Set()); // pair IDs that are matched
  
  // Challenge state
  const [challengeSubIndex, setChallengeSubIndex] = useState(0); // current sub-question in challenge
  
  // Refs
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const progressRef = useRef(null);
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);
  
  // Load consonants data
  useEffect(() => {
    const loadConsonants = async () => {
      try {
        // Try to load from database first, fallback to local data
        const normalizedConsonants = consonantsFallback.map(normalizeConsonant);
        setConsonants(normalizedConsonants);
        
        // Generate questions
        const generatedQuestions = generateConsonantQuestions(normalizedConsonants);
        setQuestions(generatedQuestions);
        
        // Try to restore progress
        const savedProgress = await restoreProgress(lessonId);
        if (savedProgress && savedProgress.questionsSnapshot) {
          setResumeData(savedProgress);
          setCurrentIndex(savedProgress.currentIndex || 0);
          setHearts(savedProgress.hearts || 5);
          setStreak(savedProgress.streak || 0);
          setMaxStreak(savedProgress.maxStreak || 0);
          setScore(savedProgress.score || 0);
          setXpEarned(savedProgress.xpEarned || 0);
          setDiamondsEarned(savedProgress.diamondsEarned || 0);
          setAnswers(savedProgress.answers || {});
          answersRef.current = savedProgress.answers || {};
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading consonants:', error);
        setLoading(false);
      }
    };
    
    loadConsonants();
  }, [lessonId]);

  // Ensure progress-related services are initialized once per user
  useEffect(() => {
    const userId =
      progressUser?.id ||
      userData?.id ||
      stats?.userId ||
      stats?._id ||
      stats?.id;

    if (!userId || serviceInitRef.current) {
      return;
    }

    serviceInitRef.current = true;

    (async () => {
      try {
        await gameProgressService.initialize(userId);
      } catch (error) {
        console.warn('Failed to initialize gameProgressService:', error?.message || error);
      }

      try {
        await levelUnlockService.initialize(userId);
      } catch (error) {
        console.warn('Failed to initialize levelUnlockService:', error?.message || error);
      }

      try {
        await userStatsService.initialize(userId);
      } catch (error) {
        console.warn('Failed to initialize userStatsService:', error?.message || error);
      }

      try {
        if (typeof dailyStreakService.setUser === 'function') {
          dailyStreakService.setUser(userId);
        }
      } catch (error) {
        console.warn('Failed to bind user to dailyStreakService:', error?.message || error);
      }
    })();
  }, [progressUser?.id, userData?.id, stats?.userId, stats?._id, stats?.id]);
  
  // Auto-save progress
  const autosave = useCallback(async () => {
    if (questions.length === 0) return;
    
    console.debug(`[AutoSave] Q${currentIndex + 1}/${questions.length}`, { score, hearts, xpEarned });
    
    const snapshot = {
      questionsSnapshot: questions,
      currentIndex,
      hearts,
      score,
      xpEarned,
      diamondsEarned,
      streak,
      maxStreak,
      answers: answersRef.current,
      gameProgress: {
        generator: 'consonants',
        lessonId,
        timestamp: Date.now(),
      },
    };
    
    try {
      await saveProgress(lessonId, snapshot);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, lessonId]);
  
  // Save progress when state changes
  useEffect(() => {
    if (gameStarted && !gameFinished) {
      autosave();
    }
  }, [currentIndex, hearts, score, streak, gameStarted, gameFinished, autosave]);
  
  // Play TTS
  const playTTS = useCallback(async (text) => {
    try {
      await vaja9TtsService.playThai(text);
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }, []);
  
  // Handle answer selection
  const handleAnswerSelect = (answer, speakText) => {
    setCurrentAnswer(answer);
    if (speakText) {
      vaja9TtsService.playThai(speakText);
    }
  };
  
  // Handle check answer
  const handleCheckAnswer = (overrideAnswer) => {
    const answerToCheck = overrideAnswer !== undefined ? overrideAnswer : currentAnswer;
    if (answerToCheck === null) return;
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = checkAnswer(currentQuestion, answerToCheck);
    
    console.debug(`[Answer Check] Q${currentIndex + 1}: ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}`, {
      type: currentQuestion.type,
      answer: answerToCheck,
      correct: isCorrect,
      score: score + (isCorrect ? 1 : 0),
      // Show rewards for this answer
      xpReward: isCorrect ? (currentQuestion.rewardXP || 15) : 0,
      diamondReward: isCorrect ? (currentQuestion.rewardDiamond || 1) : 0,
      heartPenalty: !isCorrect ? (currentQuestion.penaltyHeart || 1) : 0,
    });
    
    // Save answer with reward details
    answersRef.current[currentIndex] = {
      questionId: currentQuestion.id,
      answer: answerToCheck,
      isCorrect,
      timestamp: Date.now(),
      // Include reward information
      rewardXP: isCorrect ? (currentQuestion.rewardXP || 15) : 0,
      rewardDiamond: isCorrect ? (currentQuestion.rewardDiamond || 1) : 0,
      penaltyHeart: !isCorrect ? (currentQuestion.penaltyHeart || 1) : 0,
    };
    setAnswers({ ...answersRef.current });
    
    // Show feedback
    setCurrentFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      // Correct answer
      const newScore = score + 1;
      const newStreak = streak + 1;
      const newMaxStreak = Math.max(maxStreak, newStreak);
      // Use question's reward data, default to 15 XP and 1 diamond if not specified
      const xpReward = currentQuestion.rewardXP || 15;
      const diamondReward = currentQuestion.rewardDiamond || 1;
      const newXp = xpEarned + xpReward;
      const newDiamonds = diamondsEarned + diamondReward;

      setScore(newScore);
      setStreak(newStreak);
      setMaxStreak(newMaxStreak);
      setXpEarned(newXp);
      setDiamondsEarned(newDiamonds);
      
      // Show feedback - don't auto-advance, user must click CHECK to continue
    } else {
      // Wrong answer
      const heartPenalty = currentQuestion.penaltyHeart || 1;
      const newHearts = Math.max(0, hearts - heartPenalty);
      setHearts(newHearts);
      setStreak(0);

      // If hearts are depleted, prompt to buy more
      if (newHearts <= 0) {
        Alert.alert(
          'หัวใจหมดแล้ว',
          'ซื้อหัวใจเพิ่มเพื่อเล่นต่อ',
          [
            { text: 'ไปร้านหัวใจ', onPress: () => navigation.navigate('GemShop') },
            { text: 'ยกเลิก', style: 'cancel' }
          ]
        );
      }
      // Show feedback - don't auto-advance, user must click CHECK to continue
    }
  };
  
  // Reset drag-match state when index changes
  useEffect(() => {
    setDmSelected({ leftId: null, rightId: null });
    setDmPairs([]);
    setCurrentFeedback(null);
    setMmFlipped(new Set());
    setMmMatched(new Set());
    setChallengeSubIndex(0);
  }, [currentIndex]);

  // Show Fire Streak Alert for milestone streaks
  useEffect(() => {
    if (gameFinished && streak > 0) {
      const milestones = [5, 10, 20, 30, 50, 100];
      if (milestones.includes(streak)) {
        // Delay alert to show after game finishes
        const timer = setTimeout(() => {
          setShowFireStreakAlert(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [gameFinished, streak]);

  // Next question
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(null);
    } else {
      // Game finished -> go to completion screen
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      finishLesson(elapsed);
    }
  };
  
  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    gameFinishedRef.current = false;
    startTimeRef.current = Date.now();
  };
  
  // Resume game
  const resumeGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    gameFinishedRef.current = false;
    startTimeRef.current = Date.now();
  };
  
  // Finish lesson
  const finishLesson = async (timeSpentOverrideSec) => {
    if (gameFinishedRef.current) {
      return;
    }

    gameFinishedRef.current = true;
    setGameFinished(true);
    
    console.debug(`[Game Complete] Lesson ${lessonId} finished`, {
      score,
      totalQuestions: questions.length,
      accuracy: Math.round((score / questions.length) * 100),
      xpEarned,
      diamondsEarned,
      maxStreak,
      timeSpent: Math.floor((Date.now() - startTimeRef.current) / 1000),
    });

    try {
      const totalQuestions = questions.length;
      const correctAnswers = score;
      const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
      const accuracyRatio = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
      const accuracyPercent = Math.round(accuracyRatio * 100);
      const timeSpent = Number.isFinite(timeSpentOverrideSec)
        ? timeSpentOverrideSec
        : Math.floor((Date.now() - startTimeRef.current) / 1000);
      const unlockedNext = accuracyPercent >= 70;

      const heartDelta = Number.isFinite(stats?.hearts)
        ? hearts - stats.hearts
        : 0;

      const lastResults = {
        lessonId,
        stageTitle,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        accuracyPercent,
        xpEarned,
        diamondsEarned,
        heartsRemaining: hearts,
        timeSpent,
      };

      const progressDelta = {
        xp: xpEarned,
        diamonds: diamondsEarned,
        finishedLesson: true,
        timeSpentSec: timeSpent,
        totalCorrectAnswers: correctAnswers,
        totalWrongAnswers: wrongAnswers,
        lastGameResults: lastResults,
      };

      if (heartDelta !== 0) {
        progressDelta.hearts = heartDelta;
      }

      try {
        await applyDelta(progressDelta);
      } catch (deltaError) {
        console.warn('Failed to update unified stats:', deltaError?.message || deltaError);
      }

      const questionTypeCounts = questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      }, {});

      try {
        await gameProgressService.saveGameSession({
          lessonId,
          category: routeCategory,
          gameMode: 'consonant_stage_1',
          score: correctAnswers,
          totalQuestions,
          correctAnswers,
          wrongAnswers,
          accuracy: accuracyRatio,
          accuracyPercent,
          timeSpent,
          xpEarned,
          diamondsEarned,
          heartsRemaining: hearts,
          streak,
          maxStreak,
          questionTypes: questionTypeCounts,
          completedAt: new Date().toISOString(),
        });
      } catch (sessionError) {
        console.warn('Failed to save game session:', sessionError?.message || sessionError);
      }

      let unlockResult = null;
      if (unlockedNext) {
        try {
          // Convert lessonId to levelId format (e.g., 1 -> 'level1')
          const currentLevelId = `level${lessonId}`;
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel(currentLevelId, {
            accuracy: accuracyPercent,
            score: correctAnswers,
            attempts: 1,
          });
          
          if (unlockResult) {
            console.log(`✅ Level unlocked! Next level: ${unlockResult.unlockedLevel}`);
          }
        } catch (unlockError) {
          console.warn('Failed to unlock next level:', unlockError?.message || unlockError);
        }
      }

      try {
        await clearProgress(lessonId);
      } catch (clearError) {
        console.warn('Failed to clear progress snapshot:', clearError?.message || clearError);
      }

      navigation.replace('LessonComplete', {
        lessonId,
        stageTitle,
        score: correctAnswers,
        totalQuestions,
        timeSpent,
        accuracy: accuracyPercent,
        accuracyPercent,
        accuracyRatio,
        xpGained: xpEarned,
        diamondsGained: diamondsEarned,
        heartsRemaining: hearts,
        streak,
        maxStreak,
        isUnlocked: unlockedNext,
        nextStageUnlocked: Boolean(unlockResult?.unlocked || unlockResult?.nextLevel),
        nextStageMeta: resolvedNextStageMeta,
        stageSelectRoute,
        replayRoute,
        replayParams: resolvedReplayParams,
        questionTypeCounts,
      });
    } catch (error) {
      console.error('Error finishing lesson:', error);
    }
  };
  
  // Render question component
  const renderQuestionComponent = () => {
    if (questions.length === 0 || currentIndex >= questions.length) return null;
    
    const question = questions[currentIndex];
    
    switch (question.type) {
      case QUESTION_TYPES.LISTEN_CHOOSE:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] LISTEN_CHOOSE`, { questionId: question.id, char: question.correctText });
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.questionText}>{question.questionText}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <TouchableOpacity
                style={styles.speakerButton}
                onPress={() => vaja9TtsService.playThai(question.audioText)}
              >
                <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
              </TouchableOpacity>
              
              <View style={styles.choicesContainer}>
                {question.choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      currentAnswer === choice.thai && styles.choiceSelected,
                    ]}
                    onPress={() => handleAnswerSelect(choice.thai, choice.speakText)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        isThaiText(choice.text) && { fontSize: 26, fontWeight: '900' }
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {choice.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.PICTURE_MATCH:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] PICTURE_MATCH`, { questionId: question.id, imageKey: question.imageKey });
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.imageContainer}>
                {letterImages[question.imageKey] ? (
                  <Image
                    source={letterImages[question.imageKey]}
                    style={styles.consonantImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.consonantChar}>{question.imageKey}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.choicesContainer}>
                {question.choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      currentAnswer === choice.thai && styles.choiceSelected,
                    ]}
                    onPress={() => handleAnswerSelect(choice.thai, choice.speakText)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        isThaiText(choice.text) && { fontSize: 26, fontWeight: '900' }
                      ]}
                    >
                      {choice.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.DRAG_MATCH:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] DRAG_MATCH`, { questionId: question.id, pairCount: question.leftItems.length });
        
        // Helper: connection color/symbol based on LEFT item fixed index
        const connectionColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        const connectionSymbols = ['●', '▲', '■', '♦', '★', '◆', '⬟', '⬢'];

        const getLeftIndex = (leftId) => {
          const idx = (question.leftItems || []).findIndex(l => l.id === leftId);
          return idx >= 0 ? idx : 0;
        };
        
        const getConnectionColor = (leftId) => {
          const connectionIndex = getLeftIndex(leftId);
          return connectionColors[connectionIndex % connectionColors.length];
        };
        
        const getConnectionSymbol = (leftId) => {
          const connectionIndex = getLeftIndex(leftId);
          return connectionSymbols[connectionIndex % connectionSymbols.length];
        };
        
        const isConnected = (leftId) => dmPairs.some(p => p.leftId === leftId);
        const getConnectedRight = (leftId) => dmPairs.find(p => p.leftId === leftId)?.rightId;
        
        // Define handlers BEFORE using them
        const handleLeftPress = (leftItem) => {
          if (currentFeedback) return;
          
          // Play sound using vaja9TtsService
          if (leftItem && leftItem.text) {
            try {
              vaja9TtsService.playThai(leftItem.text);
            } catch (error) {
              console.log('TTS Error:', error);
            }
          }
          
          setDmSelected({ leftId: leftItem.id, rightId: dmSelected.rightId });
        };

        const handleRightPress = (rightItem) => {
          if (currentFeedback) return;
          
          // Play sound using vaja9TtsService
          if (rightItem && rightItem.text) {
            try {
              vaja9TtsService.playThai(rightItem.text);
            } catch (error) {
              console.log('TTS Error:', error);
            }
          }
          
          if (dmSelected.leftId) {
            const newPairs = dmPairs.filter(p => p.rightId !== rightItem.id && p.leftId !== dmSelected.leftId);
            const newPair = { leftId: dmSelected.leftId, rightId: rightItem.id };
            const updated = [...newPairs, newPair];
            setDmPairs(updated);
            setCurrentAnswer(updated);
            setDmSelected({ leftId: null, rightId: null });
          } else {
            setDmSelected({ leftId: null, rightId: rightItem.id });
          }
        };
        
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            {!!question.questionText && <Text style={styles.questionText}>{question.questionText}</Text>}
            
            <View style={styles.dragMatchContainer}>
              {/* Left Column */}
              <View style={styles.leftColumn}>
                {question.leftItems?.map((item, index) => {
                  const connected = isConnected(item.id);
                  const color = connected ? getConnectionColor(item.id) : '#e0e0e0';
                  const symbol = connected ? getConnectionSymbol(item.id) : '';
                  const isSelected = dmSelected.leftId === item.id;
                  
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dragItem,
                        isSelected && styles.selectedDragItem,
                        currentFeedback && (
                          dmPairs.some(p => p.leftId === item.id && p.leftId !== item.id) 
                            ? styles.correctDragItem 
                            : styles.wrongDragItem
                        ),
                        { 
                          backgroundColor: connected ? color : (isSelected ? '#fff5e6' : '#fff'),
                          borderColor: connected ? color : (isSelected ? '#FF8000' : '#e0e0e0'),
                          borderWidth: isSelected ? 4 : 3
                        }
                      ]}
                      onPress={() => handleLeftPress(item)}
                      disabled={currentFeedback !== null}
                    >
                      <View style={styles.dragItemContent}>
                        {connected && (
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => {
                              const filtered = dmPairs.filter(p => p.leftId !== item.id);
                              setDmPairs(filtered);
                              setCurrentAnswer(filtered);
                            }}
                          >
                            <FontAwesome name="times" size={12} color="#fff" />
                          </TouchableOpacity>
                        )}
                        <Text style={[
                          styles.dragItemText,
                          connected && { color: '#fff', fontWeight: 'bold' },
                          isSelected && { color: '#FF8000', fontWeight: 'bold' }
                        ]}>{item.text}</Text>
                        {connected && (
                          <View style={{
                            marginLeft: 8,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: color,
                          }} />
                        )}
                        {connected && (
                          <Text style={[styles.connectionSymbol, { color: '#fff' }]}>
                            {symbol}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Right Column (show picture/emoji) */}
              <View style={styles.rightColumn}>
                {question.rightItems?.map((item, index) => {
                  const connectedLeftId = dmPairs.find(p => p.rightId === item.id)?.leftId;
                  const isCorrectMatch = connectedLeftId && 
                    question.leftItems.find(l => l.id === connectedLeftId)?.correctMatch === item.text;
                  const isWrongMatch = connectedLeftId && !isCorrectMatch;
                  const color = connectedLeftId ? getConnectionColor(connectedLeftId) : '#e0e0e0';
                  const symbol = connectedLeftId ? getConnectionSymbol(connectedLeftId) : '';
                  const isSelected = dmSelected.rightId === item.id;
                  
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dragItem,
                        isSelected && styles.selectedDragItem,
                        currentFeedback && isCorrectMatch && styles.correctDragItem,
                        currentFeedback && isWrongMatch && styles.wrongDragItem,
                        { 
                          backgroundColor: connectedLeftId ? color : (isSelected ? '#fff5e6' : '#fff'),
                          borderColor: connectedLeftId ? color : (isSelected ? '#FF8000' : '#e0e0e0'),
                          borderWidth: isSelected ? 4 : 3
                        }
                      ]}
                      onPress={() => handleRightPress(item)}
                      disabled={currentFeedback !== null}
                    >
                      <View style={styles.dragItemContent}>
                        <Text style={[
                          styles.dragItemText,
                          connectedLeftId && { color: '#fff', fontWeight: 'bold' },
                          isSelected && { color: '#FF8000', fontWeight: 'bold' }
                        ]}>{item.display || item.text}</Text>
                        {connectedLeftId && (
                          <View style={{
                            marginLeft: 8,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: color,
                          }} />
                        )}
                        {connectedLeftId && (
                          <Text style={[styles.connectionSymbol, { color: '#fff' }]}>
                            {symbol}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sound Buttons */}
            <View style={styles.soundButtonsContainer}>
              <TouchableOpacity 
                style={styles.soundButton}
                onPress={() => {
                  if (question.leftItems && Array.isArray(question.leftItems)) {
                    question.leftItems.forEach((item, index) => {
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
                <Text style={styles.soundButtonText}>เล่นเสียงซ้าย</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.soundButton}
                onPress={() => {
                  if (question.rightItems && Array.isArray(question.rightItems)) {
                    question.rightItems.forEach((item, index) => {
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
                <Text style={styles.soundButtonText}>เล่นเสียงขวา</Text>
              </TouchableOpacity>
            </View>

            {/* Connection Info */}
            {dmPairs.length > 0 && (
              <View style={styles.connectionInfo}>
                <Text style={styles.connectionText}>
                  เชื่อมต่อแล้ว {dmPairs.length}/{question.leftItems.length} คู่
                </Text>
              </View>
            )}
          </View>
        );
      
      case QUESTION_TYPES.FILL_BLANK:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] FILL_BLANK`, { questionId: question.id, correctText: question.correctText });
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.questionText}>{question.questionText}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.choicesContainer}>
                {question.choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      currentAnswer === choice.thai && styles.choiceSelected,
                    ]}
                    onPress={() => handleAnswerSelect(choice.thai, choice.speakText)}
                  >
                    <Text style={styles.choiceText}>{choice.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.A_OR_B:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] A_OR_B`, { questionId: question.id });
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <TouchableOpacity
                style={styles.speakerButton}
                onPress={() => vaja9TtsService.playThai(question.audioText)}
              >
                <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
              </TouchableOpacity>
              
              <View style={styles.aobContainer}>
                {question.choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.letter}
                    style={[
                      styles.aobButton,
                      currentAnswer === choice && styles.aobButtonSelected,
                    ]}
                    onPress={() => handleAnswerSelect(choice)}
                  >
                    <Text style={styles.aobLetter}>{choice.letter}</Text>
                    <Text style={styles.aobText}>
                      {choice.thai}
                      {'\n'}
                      {choice.roman}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.MEMORY_MATCH:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] MEMORY_MATCH`, { questionId: question.id, pairCount: question.pairCount });
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.memoryGrid}>
                {question.cards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.memoryCard,
                      mmMatched.has(card.pairId) && styles.memoryCardMatched,
                    ]}
                    onPress={() => {
                      if (mmMatched.has(card.pairId)) return; // Already matched
                      
                      const newFlipped = new Set(mmFlipped);
                      if (newFlipped.has(card.id)) {
                        newFlipped.delete(card.id);
                      } else {
                        newFlipped.add(card.id);
                      }
                      setMmFlipped(newFlipped);
                      
                      // Check if 2 cards are flipped
                      const flippedCards = question.cards.filter(c => newFlipped.has(c.id));
                      if (flippedCards.length === 2) {
                        const [card1, card2] = flippedCards;
                        if (card1.pairId === card2.pairId) {
                          // Match found!
                          vaja9TtsService.playThai(card1.audioText);
                          const newMatched = new Set(mmMatched);
                          newMatched.add(card1.pairId);
                          setMmMatched(newMatched);
                          setMmFlipped(new Set());
                          
                          // Auto-check if all matched
                          if (newMatched.size === question.pairCount) {
                            setTimeout(() => {
                              setCurrentAnswer(Array.from(newMatched));
                              setCurrentFeedback('correct');
                            }, 300);
                          }
                        } else {
                          // No match, flip back
                          setTimeout(() => {
                            setMmFlipped(new Set());
                          }, 800);
                        }
                      }
                    }}
                    disabled={mmMatched.has(card.pairId)}
                  >
                    {mmFlipped.has(card.id) || mmMatched.has(card.pairId) ? (
                      <Text style={styles.memoryCardText}>{card.back}</Text>
                    ) : (
                      <Text style={styles.memoryCardFront}>?</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.ARRANGE_SENTENCE:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>
            
            <View style={styles.arrangeContainer}>
              <Text style={styles.arrangeText}>
                {currentAnswer ? currentAnswer.join(' ') : 'เรียงคำให้ถูกต้อง'}
              </Text>
            </View>
            
            <View style={styles.choicesContainer}>
              {question.allParts.map((part, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.choiceButton,
                    currentAnswer && currentAnswer.includes(part) && styles.choiceSelected,
                  ]}
                  onPress={() => {
                    if (!currentAnswer) {
                      setCurrentAnswer([part]);
                    } else if (!currentAnswer.includes(part)) {
                      setCurrentAnswer([...currentAnswer, part]);
                    } else {
                      setCurrentAnswer(currentAnswer.filter(p => p !== part));
                    }
                  }}
                >
                  <Text style={styles.choiceText}>{part}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case QUESTION_TYPES.SYLLABLE_BUILDER:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] SYLLABLE_BUILDER`, { questionId: question.id, initial: question.correct.initial });
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>

              <View style={styles.arrangeContainer}>
                <Text style={styles.arrangeText}>
                  {currentAnswer 
                    ? toRenderedSyllable(currentAnswer)
                    : 'ประกอบพยางค์...'}
                </Text>
              </View>

              {question.slots.map((slot) => (
                <View key={slot.key} style={{ marginBottom: 12 }}>
                  <Text style={{ marginBottom: 6, fontWeight: '700', fontSize: 14, color: COLORS.dark }}>
                    {slot.label}
                  </Text>
                  <View style={styles.choicesContainer}>
                    {slot.options.map((opt) => (
                      <TouchableOpacity
                        key={opt || 'none'}
                        style={[
                          styles.choiceButton,
                          currentAnswer && currentAnswer[slot.key] === opt && styles.choiceSelected,
                        ]}
                        onPress={() => {
                          const next = currentAnswer 
                            ? { ...currentAnswer, [slot.key]: opt }
                            : { initial: '', vowel: '', tone: '', final: '', [slot.key]: opt };
                          setCurrentAnswer(next);
                        }}
                      >
                        <Text style={styles.choiceText}>{opt || '—'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      
      case QUESTION_TYPES.ORDER_TILES:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] ORDER_TILES`, { questionId: question.id, patternCount: question.correctOrders.length });
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>

              <View style={styles.arrangeContainer}>
                <Text style={styles.arrangeText}>
                  {currentAnswer && currentAnswer.length > 0
                    ? currentAnswer.join(' ')
                    : 'ยังไม่ได้เลือก'}
                </Text>
              </View>

              <View style={styles.choicesContainer}>
                {question.allParts.map((part, index) => (
                  <TouchableOpacity
                    key={`${part}-${index}`}
                    style={[
                      styles.choiceButton,
                      currentAnswer && currentAnswer.includes(part) && styles.choiceSelected,
                    ]}
                    onPress={() => {
                      if (!currentAnswer) {
                        setCurrentAnswer([part]);
                      } else if (currentAnswer.includes(part)) {
                        setCurrentAnswer(currentAnswer.filter(p => p !== part));
                      } else {
                        setCurrentAnswer([...currentAnswer, part]);
                      }
                    }}
                  >
                    <Text style={styles.choiceText}>{part}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.CHALLENGE:
        console.debug(`[Q${currentIndex + 1}/${questions.length}] CHALLENGE`, { questionId: question.id, subCount: question.subQuestions.length });
        const subQ = question.subQuestions[challengeSubIndex];
        if (!subQ) return null;
        
        // Render the current sub-question
        const renderSubQuestion = () => {
          switch (subQ.type) {
            case QUESTION_TYPES.A_OR_B:
              return (
                <View>
                  <Text style={[styles.instruction, { fontSize: 16 }]}>
                    ข้อที่ {challengeSubIndex + 1} / {question.subQuestions.length}
                  </Text>
                  <TouchableOpacity
                    style={styles.speakerButton}
                    onPress={() => vaja9TtsService.playThai(subQ.audioText)}
                  >
                    <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
                  </TouchableOpacity>
                  <View style={styles.aobContainer}>
                    {subQ.choices.map((choice) => (
                      <TouchableOpacity
                        key={choice.letter}
                        style={[
                          styles.aobButton,
                          currentAnswer === choice && styles.aobButtonSelected,
                        ]}
                        onPress={() => {
                          setCurrentAnswer(choice);
                          const isCorrect = choice.isCorrect;
                          setCurrentFeedback(isCorrect ? 'correct' : 'wrong');
                          setTimeout(() => {
                            if (challengeSubIndex < question.subQuestions.length - 1) {
                              setChallengeSubIndex(challengeSubIndex + 1);
                              setCurrentAnswer(null);
                              setCurrentFeedback(null);
                            } else {
                              // Last sub-question, mark whole challenge as done
                              setCurrentAnswer(isCorrect);
                            }
                          }, 600);
                        }}
                      >
                        <Text style={styles.aobLetter}>{choice.letter}</Text>
                        <Text style={styles.aobText}>
                          {choice.thai}
                          {'\n'}
                          {choice.roman}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            case QUESTION_TYPES.LISTEN_CHOOSE:
              return (
                <View>
                  <Text style={[styles.instruction, { fontSize: 16 }]}>
                    ข้อที่ {challengeSubIndex + 1} / {question.subQuestions.length}
                  </Text>
                  <TouchableOpacity
                    style={styles.speakerButton}
                    onPress={() => vaja9TtsService.playThai(subQ.audioText)}
                  >
                    <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
                  </TouchableOpacity>
                  <View style={styles.choicesContainer}>
                    {subQ.choices.map((choice) => (
                      <TouchableOpacity
                        key={choice.id}
                        style={[
                          styles.choiceButton,
                          currentAnswer === choice.thai && styles.choiceSelected,
                        ]}
                        onPress={() => {
                          setCurrentAnswer(choice.thai);
                          const isCorrect = choice.isCorrect;
                          setCurrentFeedback(isCorrect ? 'correct' : 'wrong');
                          setTimeout(() => {
                            if (challengeSubIndex < question.subQuestions.length - 1) {
                              setChallengeSubIndex(challengeSubIndex + 1);
                              setCurrentAnswer(null);
                              setCurrentFeedback(null);
                            } else {
                              setCurrentAnswer(isCorrect);
                            }
                          }, 600);
                        }}
                      >
                        <Text style={styles.choiceText}>{choice.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            case QUESTION_TYPES.FILL_BLANK:
              return (
                <View>
                  <Text style={[styles.instruction, { fontSize: 16 }]}>
                    ข้อที่ {challengeSubIndex + 1} / {question.subQuestions.length}
                  </Text>
                  <Text style={styles.questionText}>{subQ.questionText}</Text>
                  <View style={styles.choicesContainer}>
                    {subQ.choices.map((choice) => (
                      <TouchableOpacity
                        key={choice.id}
                        style={[
                          styles.choiceButton,
                          currentAnswer === choice.thai && styles.choiceSelected,
                        ]}
                        onPress={() => {
                          setCurrentAnswer(choice.thai);
                          const isCorrect = choice.isCorrect;
                          setCurrentFeedback(isCorrect ? 'correct' : 'wrong');
                          setTimeout(() => {
                            if (challengeSubIndex < question.subQuestions.length - 1) {
                              setChallengeSubIndex(challengeSubIndex + 1);
                              setCurrentAnswer(null);
                              setCurrentFeedback(null);
                            } else {
                              setCurrentAnswer(isCorrect);
                            }
                          }, 600);
                        }}
                      >
                        <Text style={styles.choiceText}>{choice.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            default:
              return null;
          }
        };
        
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              {renderSubQuestion()}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.startContainer}>
          <View style={styles.introCard}>
            <LottieView
              source={require('../assets/animations/stage_start.json')}
              autoPlay
              loop
              style={styles.introAnim}
            />
            <Text style={styles.startTitle}>พยัญชนะ ก-ฮ</Text>
            <Text style={styles.startSubtitle}>เรียนรู้พยัญชนะไทยพื้นฐาน</Text>
          </View>

          {/* Player Stats Display */}
          <View style={styles.playerStatsContainer}>
            <View style={styles.statsGrid}>
              {/* Level */}
              <View style={styles.statsGridItem}>
                <Text style={styles.statsGridLabel}>Level</Text>
                <Text style={styles.statsGridValue}>{stats?.level || 1}</Text>
              </View>
              {/* Total XP */}
              <View style={styles.statsGridItem}>
                <Text style={styles.statsGridLabel}>XP</Text>
                <Text style={styles.statsGridValue}>{stats?.xp || 0}</Text>
              </View>
              {/* Diamonds */}
              <View style={styles.statsGridItem}>
                <Text style={styles.statsGridLabel}>💎</Text>
                <Text style={styles.statsGridValue}>{stats?.diamonds || 0}</Text>
              </View>
              {/* Hearts */}
              <View style={styles.statsGridItem}>
                <Text style={styles.statsGridLabel}>❤️</Text>
                <Text style={styles.statsGridValue}>{stats?.hearts || 5}</Text>
              </View>
            </View>
          </View>
          
          {resumeData && (
            <TouchableOpacity style={styles.resumeButton} onPress={resumeGame} activeOpacity={0.9}>
              <Text style={styles.resumeButtonText}>เล่นต่อจากข้อที่ {resumeData.currentIndex + 1}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.9}>
            <LinearGradient
              colors={[COLORS.primary, '#FFA24D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startGradient}
            >
              <Text style={styles.startButtonText}>เริ่มเล่น</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (gameFinished) {
    return null;
  }
  
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient for depth */}
      <LinearGradient
        colors={['#FFF5E5', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
      {/* Header */}
      <LinearGradient
        colors={['#FF8000', '#FFA24D', '#FFD700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="times" size={26} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#58cc02', '#7FD14F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <View style={styles.headerMetaRow}>
              <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
              <View style={styles.typePill}><Text style={styles.typePillText}>{getTypeLabel(currentQuestion.type)}</Text></View>
              <View style={styles.heartsDisplayContainer}>
                <FontAwesome name="heart" size={16} color="#ff4b4b" />
                <Text style={styles.heartsDisplay}>{hearts}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      {/* Stats Row - Enhanced */}
      <View style={styles.statsRow}>
        <View style={styles.statBadgeEnhanced}>
          <LottieView
            source={require('../assets/animations/Star.json')}
            autoPlay
            loop
            style={styles.starAnimation}
          />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>XP</Text>
            <Text style={styles.statValue}>{xpEarned}</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statBadgeEnhanced}>
          <LottieView
            source={require('../assets/animations/Diamond.json')}
            autoPlay
            loop
            style={styles.diamondAnimation}
          />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Diamonds</Text>
            <Text style={styles.statValue}>+{diamondsEarned}</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statBadgeEnhanced}>
          <FontAwesome name="bullseye" size={18} color={COLORS.primary} />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>{Math.min(100, Math.max(0, Math.round((score / Math.max(1, currentIndex)) * 100)))}%</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statBadgeEnhanced}>
          <LottieView
            source={require('../assets/animations/Streak-Fire1.json')}
            autoPlay
            loop
            style={styles.streakAnimation}
          />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{streak}</Text>
          </View>
        </View>
      </View>
      
      {/* Question */}
      <ScrollView style={styles.questionScrollView}>
        {renderQuestionComponent()}
      </ScrollView>
      
      {/* Check Button - Enhanced */}
      <View style={styles.checkContainerEnhanced}>
        {currentFeedback && (
          <View style={[
            styles.feedbackBadgeEnhanced,
            currentFeedback === 'correct' ? styles.feedbackCorrectEnhanced : styles.feedbackWrongEnhanced
          ]}>
            <FontAwesome 
              name={currentFeedback === 'correct' ? 'check-circle' : 'times-circle'} 
              size={24} 
              color={currentFeedback === 'correct' ? '#58cc02' : '#ff4b4b'}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.feedbackTextEnhanced}>
              {currentFeedback === 'correct' ? 'ถูกต้อง! ยอดเยี่ยม' : 'พยายามอีกครั้ง'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.checkButtonEnhanced,
            currentAnswer === null && styles.checkButtonDisabledEnhanced,
          ]}
          onPress={() => {
            if (currentFeedback !== null) {
              setCurrentFeedback(null);
              if (hearts === 0) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                finishLesson(elapsed);
              } else {
                nextQuestion();
              }
            } else {
              handleCheckAnswer();
            }
          }}
          disabled={currentAnswer === null}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={currentAnswer === null ? ['#ddd', '#ccc'] : [COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradientEnhanced}
          >
            <FontAwesome 
              name={currentFeedback !== null ? 'arrow-right' : 'check'} 
              size={20} 
              color={COLORS.white}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.checkButtonTextEnhanced}>
              {currentFeedback !== null ? (hearts === 0 ? 'จบเกม' : 'ต่อไป') : 'CHECK'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <FireStreakAlert
        visible={showFireStreakAlert}
        onClose={() => setShowFireStreakAlert(false)}
        streak={streak}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.dark,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  introCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    marginBottom: 14,
  },
  introAnim: {
    width: 120,
    height: 120,
    marginBottom: 6,
  },
  startTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  startSubtitle: {
    fontSize: 18,
    color: COLORS.dark,
    marginBottom: 30,
    textAlign: 'center',
  },
  resumeButton: {
    backgroundColor: COLORS.cream,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  resumeButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: 220,
  },
  startGradient: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backButton: {
    marginRight: 15,
  },
  headerGradient: {
    paddingTop: 15,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 5,
  },
  headerMetaRow: {
    width: '100%',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  typePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,245,229,0.9)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FFE3CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'visible',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 5,
  },
  heartAnimation: {
    width: 20,
    height: 20,
  },
  starAnimation: {
    width: 20,
    height: 20,
  },
  diamondAnimation: {
    width: 20,
    height: 20,
  },
  streakAnimation: {
    width: 20,
    height: 20,
  },
  questionScrollView: {
    flex: 1,
    padding: 20,
    paddingBottom: 10,
  },
  questionContainer: {
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    shadowColor: '#FF8000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    overflow: 'hidden',
  },
  instruction: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 15,
    color: COLORS.gray,
    marginBottom: 15,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 10,
  },
  speakerButton: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#FFD8B2'
  },
  choicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  choiceButton: {
    width: '48%',
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  choiceSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,128,0,0.08)',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
  },
  choiceText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 26,
  },
  dragMatchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  consonantImage: {
    width: 120,
    height: 120,
    borderRadius: 18,
    shadowColor: '#FF8000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  imageFallback: {
    width: 120,
    height: 120,
    borderRadius: 18,
    backgroundColor: '#FFF5E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  consonantChar: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.primary,
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 8,
  },
  dragItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative'
  },
  dragItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,128,0,0.08)',
    borderWidth: 3,
    transform: [{ scale: 1.02 }],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  dragItemPaired: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.08)'
  },
  dragItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
    flex: 1,
  },
  pairPreview: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pairPreviewText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  pairArrow: {
    fontSize: 16,
    marginHorizontal: 8,
    color: COLORS.primary,
    fontWeight: '900',
  },
  arrangeContainer: {
    backgroundColor: COLORS.cream,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  arrangeText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  checkContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  checkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  checkGradient: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  feedbackBadge: {
    position: 'absolute',
    top: -30, // Adjust as needed
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackCorrect: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(88,204,2,0.1)',
  },
  feedbackWrong: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255,75,75,0.1)',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  aobContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  aobButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#FFF5E5',
    borderWidth: 2,
    borderColor: '#FFE8CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  aobButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,128,0,0.12)',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  aobLetter: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 5,
  },
  aobText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 20,
  },
  memoryGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memoryCard: {
    width: '48%',
    height: 110,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  memoryCardMatched: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(88,204,2,0.12)',
    shadowColor: COLORS.success,
    shadowOpacity: 0.2,
  },
  memoryCardFront: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  memoryCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  playerStatsContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGridItem: {
    alignItems: 'center',
  },
  statsGridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statsGridValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectedDragItem: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,127,80,0.1)',
  },
  correctDragItem: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  wrongDragItem: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255,75,75,0.1)',
  },
  dragItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    marginRight: 5,
  },
  connectionSymbol: {
    fontSize: 12,
    marginHorizontal: 5,
  },
  soundButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  soundButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  soundButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 4,
  },
  connectionInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statBadgeEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    minWidth: 85,
  },
  statTextContainer: {
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statDivider: {
    width: 0.8,
    height: '100%',
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 6,
  },
  heartsDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartsDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 5,
  },
  checkContainerEnhanced: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  checkButtonEnhanced: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  checkGradientEnhanced: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  checkButtonDisabledEnhanced: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkButtonTextEnhanced: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  feedbackBadgeEnhanced: {
    position: 'absolute',
    top: -35,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackCorrectEnhanced: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(88,204,2,0.12)',
    shadowColor: COLORS.success,
    shadowOpacity: 0.3,
  },
  feedbackWrongEnhanced: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255,75,75,0.12)',
    shadowColor: COLORS.error,
    shadowOpacity: 0.3,
  },
  feedbackTextEnhanced: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  aobContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  aobButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFF5E5',
    borderWidth: 2,
    borderColor: '#FFE8CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  aobLetter: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  aobText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 18,
  },
  arrangeContainer: {
    backgroundColor: COLORS.cream,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  arrangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
});

export default ConsonantStage1Game;
