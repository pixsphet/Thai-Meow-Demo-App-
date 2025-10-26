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
  imageSource: doc.image ? transportationImages[doc.thai] : null,
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
  const dialogs = [
    {
      context: 'ฉันจะไป... (by car)',
      correct: item.thai,
      options: [item.thai, 'รถบัส', 'รถไฟ', 'เครื่องบิน']
    },
    {
      context: 'คุณใช้... ไปทำงาน?',
      correct: item.thai,
      options: [item.thai, 'จักรยาน', 'มอเตอร์ไซค์', 'รถแท็กซี่']
    },
    {
      context: 'ฉันชอบเดินทางด้วย...',
      correct: item.thai,
      options: [item.thai, 'เรือ', 'รถบัส', 'รถไฟ']
    }
  ];
  
  const dialog = pick(dialogs);
  const wrongOptions = pool.filter(w => w.thai !== item.thai).slice(0, 3);
  const allOptions = shuffle([item, ...wrongOptions]);
  
  return {
    id: `fb_transport_${item.id}_${uid()}`,
    type: TRANSPORT_QUESTION_TYPES.FILL_BLANK_DIALOG,
    instruction: 'เลือกคำที่เหมาะสมกับบทสนทนา',
    questionText: dialog.context,
    correctText: dialog.correct,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: allOptions.map((c, i) => ({
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