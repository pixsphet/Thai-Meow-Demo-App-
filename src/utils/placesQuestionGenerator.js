// Helper utilities
const uid = () => Math.random().toString(36).substr(2, 9);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Question Type Constants
export const PLACES_QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
  DIRECTION_FLOW: 'DIRECTION_FLOW',
};

// Question Generators
export const makeListenChoose = (item, pool) => ({
  id: `lc_${item.id}_${uid()}`,
  type: PLACES_QUESTION_TYPES.LISTEN_CHOOSE,
  instruction: 'ฟังเสียงแล้วเลือกสถานที่/ตำแหน่งที่ได้ยิน',
  audioText: item.audioText || item.thai,
  questionText: 'นี่คือสถานที่/ตำแหน่งอะไร?',
  correctText: item.thai,
  choices: shuffle([
    item,
    ...shuffle(pool.filter((p) => p.id !== item.id && (p.type === 'place' || p.type === 'preposition'))).slice(0, 3),
  ]).map((x, i) => ({ id: i + 1, text: x.thai })),
});

export const makePictureMatch = (item, pool) => ({
  id: `pm_${item.id}_${uid()}`,
  type: PLACES_QUESTION_TYPES.PICTURE_MATCH,
  instruction: 'ดูรูป/emoji แล้วเลือกชื่อสถานที่ให้ถูกต้อง',
  imageKey: item.imageUrl || null,
  emoji: item.emoji || '🏢',
  questionText: 'ภาพนี้คืออะไร?',
  correctText: item.thai,
  choices: shuffle([
    item,
    ...shuffle(pool.filter((p) => p.id !== item.id && (p.type === 'place' || p.type === 'preposition'))).slice(0, 3),
  ]).map((x, i) => ({ id: i + 1, text: x.thai })),
});

export const makeTranslateMatch = (pick4) => {
  const left = pick4.map((x, i) => ({
    id: i + 1,
    text: x.thai,
    correctMatch: x.en,
  }));
  const right = shuffle(pick4).map((x, i) => ({
    id: i + 1,
    text: x.en,
  }));
  return {
    id: `tm_${uid()}`,
    type: PLACES_QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่คำไทยกับภาษาอังกฤษ',
    leftItems: left,
    rightItems: right,
  };
};

export const makeFillBlankDialog = (template) => ({
  id: `fb_${uid()}`,
  type: PLACES_QUESTION_TYPES.FILL_BLANK_DIALOG,
  instruction: 'เติมคำให้ถูกต้องตามบทสนทนา',
  questionText: template.template,
  choices: template.options.map((t, i) => ({ id: i + 1, text: t })),
  correctText: template.answer,
});

export const makeDirectionFlow = (origin, destination, correctOrder, stepsBank) => ({
  id: `df_${uid()}`,
  type: PLACES_QUESTION_TYPES.DIRECTION_FLOW,
  instruction: 'เรียงขั้นตอนเส้นทางให้ถูกต้อง',
  questionText: `จาก ${origin} ไป ${destination} ต้องทำอย่างไรบ้าง?`,
  correctOrder,
  stepsBank: shuffle([...new Set([...correctOrder, ...stepsBank])]),
});

// Preset Fill Blank Dialog Templates
const FILL_BLANK_TEMPLATES = [
  {
    template: 'A: ไปธนาคารยังไงครับ?\nB: ตรงไป 200 เมตร แล้ว ____',
    options: ['เลี้ยวซ้าย', 'อยู่ข้างๆ', 'วงเวียน'],
    answer: 'เลี้ยวซ้าย',
  },
  {
    template: 'A: โรงพยาบาลอยู่ ____ ห้างสรรพสินค้า\nB: ใช่ค่ะ ใกล้ๆ กัน',
    options: ['ข้างหน้า', 'ใต้', 'ข้างๆ'],
    answer: 'ข้างๆ',
  },
  {
    template: 'A: ป้ายรถเมล์อยู่ที่ไหน?\nB: อยู่ ____ สถานีตำรวจ',
    options: ['ข้างหน้า', 'วงเวียน', 'บน'],
    answer: 'ข้างหน้า',
  },
  {
    template: 'A: จากตลาดไปโรงเรียน ต้อง ____\nB: แล้วเลี้ยวขวา',
    options: ['เลี้ยวซ้าย', 'ตรงไป', 'กลับรถ'],
    answer: 'ตรงไป',
  },
  {
    template: 'A: สวนสาธารณะ ____ ไกลไหม?\nB: ไม่ไกล อยู่ใกล้ตรงนี้',
    options: ['อยู่ที่ไหน', 'ไปยังไง', 'เลี้ยวซ้าย'],
    answer: 'ไปยังไง',
  },
];

// Preset Direction Flow Templates
const DIRECTION_FLOW_TEMPLATES = [
  {
    origin: 'ป้ายรถเมล์',
    destination: 'โรงเรียน',
    correctOrder: ['ตรงไป', 'เลี้ยวซ้าย', 'ข้ามถนน'],
    distractors: ['เลี้ยวขวา', 'วงเวียน', 'กลับรถ', 'ทางม้าลาย'],
  },
  {
    origin: 'ตลาด',
    destination: 'โรงพยาบาล',
    correctOrder: ['เลี้ยวขวา', 'ตรงไป', 'ข้างหน้า'],
    distractors: ['เลี้ยวซ้าย', 'วงเวียน', 'กลับรถ', 'ทางม้าลาย'],
  },
  {
    origin: 'สถานีรถไฟ',
    destination: 'ธนาคาร',
    correctOrder: ['ตรงไป', 'วงเวียน', 'เลี้ยวซ้าย'],
    distractors: ['เลี้ยวขวา', 'ทางม้าลาย', 'กลับรถ', 'ข้ามถนน'],
  },
  {
    origin: 'ซูเปอร์มาร์เก็ต',
    destination: 'วัด',
    correctOrder: ['ตรงไป', 'เลี้ยวขวา', 'ข้ามถนน'],
    distractors: ['เลี้ยวซ้าย', 'วงเวียน', 'กลับรถ', 'ทางม้าลาย'],
  },
];

/**
 * Main question generator - creates a complete set of 14 places questions
 * @param {Array} pool - Full vocabulary pool
 * @returns {Array} - Array of 14 questions (shuffled)
 */
export const generatePlacesQuestions = (pool = []) => {
  const questions = [];

  if (pool.length === 0) {
    console.warn('[placesQuestionGenerator] Empty pool provided');
    return [];
  }

  // Filter places and prepositions
  const places = pool.filter((p) => p.type === 'place');
  const allItems = pool.filter((p) => p.type === 'place' || p.type === 'preposition');

  if (places.length < 4) {
    console.warn('[placesQuestionGenerator] Not enough places for questions');
    return [];
  }

  // 1. LISTEN_CHOOSE × 4
  for (let i = 0; i < 4; i++) {
    const item = allItems[i % allItems.length];
    questions.push(makeListenChoose(item, allItems));
  }

  // 2. PICTURE_MATCH × 4
  for (let i = 4; i < 8; i++) {
    const item = places[i % places.length];
    questions.push(makePictureMatch(item, places));
  }

  // 3. TRANSLATE_MATCH × 3
  for (let i = 0; i < 3; i++) {
    const pick4 = shuffle(pool).slice(0, 4);
    questions.push(makeTranslateMatch(pick4));
  }

  // 4. FILL_BLANK_DIALOG × 2
  FILL_BLANK_TEMPLATES.slice(0, 2).forEach((tpl) => {
    questions.push(makeFillBlankDialog(tpl));
  });

  // 5. DIRECTION_FLOW × 1
  const directionTemplate = DIRECTION_FLOW_TEMPLATES[Math.floor(Math.random() * DIRECTION_FLOW_TEMPLATES.length)];
  questions.push(
    makeDirectionFlow(
      directionTemplate.origin,
      directionTemplate.destination,
      directionTemplate.correctOrder,
      directionTemplate.distractors
    )
  );

  // Shuffle and return exactly 14 questions
  return shuffle(questions).slice(0, 14);
};

export default {
  generatePlacesQuestions,
  makeListenChoose,
  makePictureMatch,
  makeTranslateMatch,
  makeFillBlankDialog,
  makeDirectionFlow,
  PLACES_QUESTION_TYPES,
};
