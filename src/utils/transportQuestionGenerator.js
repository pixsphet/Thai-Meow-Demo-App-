import { shuffle, pick, uid } from './gameUtils';

// Question Types for Transportation
export const TRANSPORT_QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
};

// Image mapping for Transportation
const transportationImages = {
  'รถยนต์': require('../add/Transportation/รถยนต์.png'),
  'รถไฟ': require('../add/Transportation/รถไฟ.png'),
  'เครื่องบิน': require('../add/Transportation/เครื่องบิน.png'),
  'เรือ': require('../add/Transportation/เรือ.png'),
  'จักรยาน': require('../add/Transportation/จักรยาน.png'),
  'มอเตอร์ไซค์': require('../add/Transportation/มอเตอร์ไซค์.png'),
  'รถบัส': require('../add/Transportation/รถบัส.png'),
  'รถแท็กซี่': require('../add/Transportation/รถแท็กซี่.png'),
  'รถไฟฟ้า': require('../add/Transportation/รถไฟฟ้า.png'),
  'ทางม้าลาย': require('../add/Transportation/ทางม้าลาย.png'),
  'ป้ายรถเมล์': require('../add/Transportation/ป้ายรถเมล์.png'),
  'ถนน': require('../add/Transportation/ถนน.png'),
  'แยก': require('../add/Transportation/แยก.png'),
  'สะพาน': require('../add/Transportation/สะพาน.png'),
  'สัญญาณไฟ': require('../add/Transportation/สัญญาณไฟ.png')
};

const normalizeTransportItem = (doc) => ({
  id: doc.id || `transport_${uid()}`,
  thai: doc.thai || '',
  roman: doc.roman || '',
  en: doc.en || '',
  emoji: doc.emoji || '🚗',
  audioText: doc.audioText || doc.thai || '',
  imageSource: transportationImages[doc.thai] || null,
  type: doc.type || 'vehicle',
});

const makeListenChoose = (item, pool, usedWords = new Set()) => {
  const wrongChoices = pool
    .filter(w => w.thai !== item.thai && !usedWords.has(w.thai))
    .slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `lc_transport_${item.id}_${uid()}`,
    type: TRANSPORT_QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังเสียงแล้วเลือกยานพาหนะที่ได้ยิน',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: item.audioText,
    correctText: item.thai,
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.thai,
      roman: c.roman,
      text: `${c.emoji} ${c.thai}`,
      speakText: c.audioText,
      isCorrect: c.thai === item.thai,
    })),
  };
};

const makePictureMatch = (item, pool, usedWords = new Set()) => {
  const wrongChoices = pool
    .filter(w => w.thai !== item.thai && !usedWords.has(w.thai))
    .slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `pm_transport_${item.id}_${uid()}`,
    type: TRANSPORT_QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูรูปแล้วเลือกยานพาหนะที่ถูกต้อง',
    imageSource: item.imageSource,
    emoji: item.emoji,
    correctText: item.thai,
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.thai,
      text: c.thai,
      speakText: c.audioText,
      isCorrect: c.thai === item.thai,
    })),
  };
};

const makeTranslateMatch = (item, pool, usedWords = new Set()) => {
  const otherItems = pool.filter(w => w.thai !== item.thai && !usedWords.has(w.thai)).slice(0, 3);
  const allItems = shuffle([item, ...otherItems]);

  // Left = Thai, Right = English
  let leftItems = allItems.map((w, i) => ({
    id: `left_${i + 1}`,
    text: w.thai,
    correctMatch: w.en,
    speakText: w.audioText,
  }));

  let rightItems = allItems.map((w, i) => ({
    id: `right_${i + 1}`,
    text: w.en,
    correctMatch: w.thai,
    speakText: w.audioText,
  }));

  // Shuffle columns independently for better variety
  leftItems = shuffle(leftItems);
  rightItems = shuffle(rightItems);

  return {
    id: `tm_transport_${item.id}_${uid()}`,
    type: TRANSPORT_QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่คำศัพท์ไทยกับภาษาอังกฤษ',
    // Rewards for this question
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    leftItems,
    rightItems,
  };
};

const makeFillBlankDialog = (item, pool) => {
  // สร้าง dialog templates ที่ชัดเจน แต่ละ template มีคำตอบที่ถูกต้องเฉพาะ
  const dialogTemplates = [
    {
      context: 'ฉันจะไป... (by car)',
      correct: 'รถยนต์',
      wrongOptions: ['รถบัส', 'รถไฟ', 'เครื่องบิน']
    },
    {
      context: 'ฉันเดินทางด้วย... (by train)',
      correct: 'รถไฟ',
      wrongOptions: ['รถบัส', 'เครื่องบิน', 'จักรยาน']
    },
    {
      context: 'ฉันบินไปเที่ยว... (by airplane)',
      correct: 'เครื่องบิน',
      wrongOptions: ['รถยนต์', 'รถไฟ', 'เรือ']
    },
    {
      context: 'ฉันขี่... ไปตลาด (by bicycle)',
      correct: 'จักรยาน',
      wrongOptions: ['มอเตอร์ไซค์', 'รถยนต์', 'รถบัส']
    },
    {
      context: 'คุณใช้... ขับขี่ไปทำงาน? (by motorbike)',
      correct: 'มอเตอร์ไซค์',
      wrongOptions: ['จักรยาน', 'รถยนต์', 'รถแท็กซี่']
    },
    {
      context: 'ฉันนั่ง... ข้ามแม่น้ำ (by boat)',
      correct: 'เรือ',
      wrongOptions: ['เครื่องบิน', 'รถยนต์', 'จักรยาน']
    }
  ];
  
  // หา template ที่มี correct === item.thai
  let dialog = dialogTemplates.find(t => t.correct === item.thai);
  
  // ถ้าไม่มี ให้ใช้ template แรกที่มี correct = item.thai แต่อาจจะไม่เหมาะสม
  if (!dialog) {
    // สร้าง dialog อื่นๆ ที่ใช้ item.thai เป็นคำตอบที่ถูกต้อง
    dialog = {
      context: `ฉันชอบเดินทางด้วย${item.thai}`,
      correct: item.thai,
      wrongOptions: pool.filter(w => w.thai !== item.thai).slice(0, 3).map(w => w.thai)
    };
  }
  
  // สร้าง choices จาก pool โดยเลือก item.thai และ wrongOptions
  const choices = [item.thai, ...dialog.wrongOptions].slice(0, 4);
  const selectedItems = pool.filter(w => choices.includes(w.thai));
  
  return {
    id: `fb_transport_${item.id}_${uid()}`,
    type: TRANSPORT_QUESTION_TYPES.FILL_BLANK_DIALOG,
    instruction: 'เลือกยานพาหนะให้ตรงกับบทสนทนา',
    questionText: dialog.context,
    correctText: dialog.correct,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: shuffle(selectedItems).map((c, i) => ({
      id: i + 1,
      thai: c.thai,
      english: c.en,
      text: `${c.emoji} ${c.thai}`,
      isCorrect: c.thai === dialog.correct,
    })),
  };
};

// Generate questions tailored for Transportation
export const generateTransportQuestions = (pool) => {
  const questions = [];
  const usedWords = new Set();

  // LISTEN_CHOOSE × 5
  for (let i = 0; i < 5; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const item = pick(available);
    usedWords.add(item.thai);
    questions.push(makeListenChoose(item, pool, usedWords));
  }

  // PICTURE_MATCH × 5
  for (let i = 0; i < 5; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const item = pick(available);
    usedWords.add(item.thai);
    questions.push(makePictureMatch(item, pool, usedWords));
  }

  // TRANSLATE_MATCH × 4
  for (let i = 0; i < 4; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const item = pick(available);
    usedWords.add(item.thai);
    questions.push(makeTranslateMatch(item, pool, usedWords));
  }

  // FILL_BLANK_DIALOG × 4
  for (let i = 0; i < 4; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const item = pick(available);
    usedWords.add(item.thai);
    questions.push(makeFillBlankDialog(item, pool));
  }

  return shuffle(questions);
};

export { transportationImages };