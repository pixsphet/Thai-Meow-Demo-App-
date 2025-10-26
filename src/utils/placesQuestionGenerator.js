import { shuffle, pick, uid } from './gameUtils';

export const PLACES_QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
};

// Places images mapping
const placesImages = {
  'บ้าน': require('../add/Places/บ้าน.png'),
  'โรงเรียน': require('../add/Places/โรงเรียน.png'),
  'โรงพยาบาล': require('../add/Places/โรงพยาบาล.png'),
  'วัด': require('../add/Places/วัด.png'),
  'ตลาด': require('../add/Places/ตลาด.png'),
  'ร้านอาหาร': require('../add/Places/ร้านอาหาร.png'),
  'สวนสาธารณะ': require('../add/Places/สวนสาธารณะ.jpg'),
  'ถนน': null,
  'ทะเล': require('../add/Places/ทะเล.png'),
  'ภูเขา': require('../add/Places/ภูเขา.png'),
  'สนามบิน': require('../add/Places/สนามบิน.jpg'),
  'สถานีรถไฟ': null,
  'ห้องน้ำ': require('../add/Places/ห้องน้ำ.png'),
  'ห้องเรียน': require('../add/Places/ห้องเรียน.jpg'),
  'ห้องครัว': require('../add/Places/ห้องครัว.png'),
  'ร้านกาแฟ': require('../add/Places/ร้านกาแฟ.png'),
};

const dialogues = [
  {
    question: 'A: คุณอยู่ที่ไหน?\nB: ฉันอยู่ที่ _____',
    answer: 'บ้าน',
    options: ['บ้าน', 'โรงเรียน', 'สวนสาธารณะ']
  },
  {
    question: 'A: วันจันทร์นี้คุณไปไหน?\nB: ฉันไป _____',
    answer: 'โรงเรียน',
    options: ['โรงเรียน', 'โรงพยาบาล', 'ร้านอาหาร']
  },
  {
    question: 'A: หนูป่วยจึงไป _____\nB: หวังว่าคุณจะหายเร็ว',
    answer: 'โรงพยาบาล',
    options: ['โรงพยาบาล', 'วัด', 'ตลาด']
  },
  {
    question: 'A: วันอาทิตย์นี้ไปไหนดี?\nB: เราไป _____ ชมวิวดีไม่ดี',
    answer: 'ภูเขา',
    options: ['ภูเขา', 'ทะเล', 'ตลาด']
  },
  {
    question: 'A: คุณต้องซื้อสินค้า\nB: ไปที่ _____ ดีไหม',
    answer: 'ตลาด',
    options: ['ตลาด', 'วัด', 'บ้าน']
  },
  {
    question: 'A: หิว!\nB: ไปกิน _____ กันเถอะ',
    answer: 'ร้านอาหาร',
    options: ['ร้านอาหาร', 'โรงเรียน', 'บ้าน']
  },
  {
    question: 'A: วันนี้อากาศดี\nB: ไปเล่นที่ _____ ดีไหม',
    answer: 'สวนสาธารณะ',
    options: ['สวนสาธารณะ', 'ร้านกาแฟ', 'ห้องครัว']
  },
  {
    question: 'A: ต้องไป _____ เพื่อจองตั๋ว\nB: ใช่ครับ ตั๋วเครื่องบิน',
    answer: 'สนามบิน',
    options: ['สนามบิน', 'สถานีรถไฟ', 'ตลาด']
  },
];

// Question Generators
const makeListenChoose = (item, pool, usedWords = new Set()) => {
  const wrongChoices = shuffle(
    pool.filter(w => w.thai !== item.thai && !usedWords.has(w.thai))
  ).slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);

  return {
    id: `lc_place_${item.id}_${uid()}`,
    type: PLACES_QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังเสียงชื่อสถานที่แล้วเลือกคำที่ได้ยิน',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: item.audioText,
    correctText: item.thai,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.thai,
      isCorrect: c.thai === item.thai,
    })),
  };
};

const makePictureMatch = (item, pool, usedWords = new Set()) => {
  const wrongChoices = shuffle(
    pool.filter(w => w.thai !== item.thai && !usedWords.has(w.thai))
  ).slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);

  return {
    id: `pm_place_${item.id}_${uid()}`,
    type: PLACES_QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูรูปสถานที่แล้วเลือกชื่อที่ตรงกัน',
    imageSource: placesImages[item.thai] || null,
    emoji: item.emoji,
    correctText: item.thai,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.thai,
      isCorrect: c.thai === item.thai,
    })),
  };
};

const makeTranslateMatch = (item, pool, usedWords = new Set()) => {
  const otherItems = shuffle(
    pool.filter(w => w.thai !== item.thai && !usedWords.has(w.thai))
  ).slice(0, 2);
  const allItems = shuffle([item, ...otherItems]);

  const leftItems = allItems.map((w, i) => ({
    id: `left_${i + 1}`,
    text: w.thai,
    correctMatch: w.english,
  }));

  const rightItems = shuffle(allItems.map((w, i) => ({
    id: `right_${i + 1}`,
    text: w.english,
  })));

  return {
    id: `tm_place_${item.id}_${uid()}`,
    type: PLACES_QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่ชื่อสถานที่ไทยกับภาษาอังกฤษ',
    leftItems,
    rightItems,
  };
};

const makeFillBlankDialog = (dialogueObj, usedDialogues = new Set()) => {
  const allOptions = shuffle([
    dialogueObj.answer,
    ...dialogueObj.options.filter(o => o !== dialogueObj.answer)
  ]);

  return {
    id: `fb_place_${uid()}`,
    type: PLACES_QUESTION_TYPES.FILL_BLANK_DIALOG,
    instruction: 'เลือกคำให้ถูกต้องเพื่อเติมในบทสนทนา',
    questionText: dialogueObj.question,
    correctText: dialogueObj.answer,
    choices: allOptions.map((text, i) => ({
      id: i + 1,
      text,
    })),
  };
};

export const generatePlacesQuestions = (placesData) => {
  const questions = [];
  const pool = placesData || [];
  const usedWords = new Set();

  // LISTEN_CHOOSE × 4
  for (let i = 0; i < 4; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const item = pick(available);
    usedWords.add(item.thai);
    questions.push(makeListenChoose(item, pool, usedWords));
  }

  // PICTURE_MATCH × 4
  usedWords.clear();
  for (let i = 0; i < 4; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const item = pick(available);
    usedWords.add(item.thai);
    questions.push(makePictureMatch(item, pool, usedWords));
  }

  // TRANSLATE_MATCH × 2
  usedWords.clear();
  for (let i = 0; i < 2; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length < 3) break;
    const item = pick(available);
    usedWords.add(item.thai);
    questions.push(makeTranslateMatch(item, pool, usedWords));
  }

  // FILL_BLANK_DIALOG × 2
  const usedDialogues = new Set();
  for (let i = 0; i < 2; i++) {
    const dialogue = pick(dialogues);
    if (!usedDialogues.has(dialogue.question)) {
      usedDialogues.add(dialogue.question);
      questions.push(makeFillBlankDialog(dialogue, usedDialogues));
    }
  }

  return shuffle(questions);
};
