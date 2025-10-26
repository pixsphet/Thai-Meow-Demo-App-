import { shuffle, pick, uid } from './gameUtils';

// Helper utilities

// Question Type Constants
export const EMOTION_QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
  EMOJI_MATCH: 'EMOJI_MATCH',
  TONE_PICK: 'TONE_PICK',
};

// Question Generators
export const makeListenChoose = (item, pool) => ({
  id: `lc_${item.id}_${uid()}`,
  type: EMOTION_QUESTION_TYPES.LISTEN_CHOOSE,
  instruction: 'ฟังเสียงแล้วเลือกอารมณ์ที่ได้ยิน',
  audioText: item.audioText || item.thai,
  questionText: 'เสียงนี้สื่ออารมณ์อะไร?',
  correctText: item.thai,
  choices: shuffle([
    item,
    ...shuffle(pool.filter((p) => p.id !== item.id && p.type === 'emotion')).slice(0, 3),
  ]).map((x, i) => ({ id: i + 1, text: x.thai })),
});

export const makePictureMatch = (item, pool) => ({
  id: `pm_${item.id}_${uid()}`,
  type: EMOTION_QUESTION_TYPES.PICTURE_MATCH,
  instruction: 'ดูรูป/emoji แล้วเลือกคำที่ตรง',
  imageKey: item.imageUrl || null,
  emoji: item.emoji || '🙂',
  questionText: 'ภาพ/อีโมจินี้สื่ออารมณ์อะไร?',
  correctText: item.thai,
  choices: shuffle([
    item,
    ...shuffle(pool.filter((p) => p.id !== item.id && p.type === 'emotion')).slice(0, 3),
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
    type: EMOTION_QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่คำไทยกับภาษาอังกฤษ',
    leftItems: left,
    rightItems: right,
  };
};

export const makeFillBlank = (template) => ({
  id: `fb_${uid()}`,
  type: EMOTION_QUESTION_TYPES.FILL_BLANK_DIALOG,
  instruction: 'เลือกคำให้ตรงกับบทสนทนา',
  questionText: template.template,
  choices: template.options.map((t, i) => ({ id: i + 1, text: t })),
  correctText: template.answer,
});

export const makeEmojiMatch = (emoji, choices, correct) => ({
  id: `em_${uid()}`,
  type: EMOTION_QUESTION_TYPES.EMOJI_MATCH,
  instruction: 'อีโมจินี้สื่ออารมณ์อะไร?',
  emoji,
  questionText: 'เลือกคำไทยที่ตรง',
  choices: choices.map((t, i) => ({ id: i + 1, text: t })),
  correctText: correct,
});

export const makeTonePick = (stem, options, answer) => ({
  id: `tp_${uid()}`,
  type: EMOTION_QUESTION_TYPES.TONE_PICK,
  instruction: 'เลือก "ระดับ/ความเข้มข้น" ของอารมณ์ให้เหมาะ',
  questionText: stem,
  choices: options.map((t, i) => ({ id: i + 1, text: t })),
  correctText: answer,
});

// Preset Fill Blank Dialog Templates
const FILL_BLANK_TEMPLATES = [
  {
    template: 'A: วันนี้รู้สึกยังไงบ้าง?\nB: ____',
    options: ['ดีใจมาก', 'โกรธสุดๆ', 'โล่งใจนิดหน่อย'],
    answer: 'ดีใจมาก',
  },
  {
    template: 'A: เพื่อนป่วยอยู่\nB: ____',
    options: ['ขอโทษนะ', 'ขอให้หายไวๆ', 'ดีใจกับคุณด้วย'],
    answer: 'ขอให้หายไวๆ',
  },
  {
    template: 'A: ฉันสอบติดแล้ว!\nB: ____',
    options: ['ยินดีด้วย', 'เป็นห่วงนะ', 'ขอโทษนะ'],
    answer: 'ยินดีด้วย',
  },
  {
    template: 'A: วันนี้งานหนักมาก เครียดสุดๆ\nB: ____',
    options: ['ใจเย็นๆ', 'ดีใจมาก', 'เบื่อ'],
    answer: 'ใจเย็นๆ',
  },
  {
    template: 'A: เมื่อกี้พูดแรงไป ขอโทษนะ\nB: ____',
    options: ['ไม่เป็นไรนะ', 'โกรธมาก', 'เหงา'],
    answer: 'ไม่เป็นไรนะ',
  },
];

// Preset Emoji Match Templates
const EMOJI_MATCH_TEMPLATES = [
  { emoji: '😢', choices: ['เสียใจ', 'ดีใจ', 'โกรธ', 'โล่งใจ'], correct: 'เสียใจ' },
  { emoji: '😡', choices: ['โกรธ', 'เสียใจ', 'ตื่นเต้น', 'ผ่อนคลาย'], correct: 'โกรธ' },
  { emoji: '😰', choices: ['กังวล', 'ดีใจ', 'เขิน', 'ภูมิใจ'], correct: 'กังวล' },
  { emoji: '😳', choices: ['เขิน', 'โล่งใจ', 'ฮึกเหิม', 'ประทับใจ'], correct: 'เขิน' },
  { emoji: '🥰', choices: ['อบอุ่นใจ', 'เบื่อ', 'หมดหวัง', 'สับสน'], correct: 'อบอุ่นใจ' },
];

// Preset Tone Pick Templates
const TONE_PICK_TEMPLATES = [
  {
    stem: 'ฉัน…ตื่นเต้น____',
    options: ['นิดหน่อย', 'มาก', 'สุดๆ'],
    answer: 'มาก',
  },
  {
    stem: 'เพื่อนฉัน…โกรธ____',
    options: ['นิดเดียว', 'มาก', 'สุดๆ'],
    answer: 'สุดๆ',
  },
  {
    stem: 'อากาศวันนี้…ดีใจ____',
    options: ['นิดหน่อย', 'มาก', 'ขึ้นๆลงๆ'],
    answer: 'นิดหน่อย',
  },
];

/**
 * Main question generator - creates a complete set of 14 emotion questions
 * @param {Array} pool - Full vocabulary pool
 * @returns {Array} - Array of 14 questions (shuffled)
 */
export const generateEmotionQuestions = (pool = []) => {
  const questions = [];

  if (pool.length === 0) {
    console.warn('[emotionQuestionGenerator] Empty pool provided');
    return [];
  }

  // Filter only emotion vocab items (not phrases/responses)
  const emotionItems = pool.filter((p) => p.type === 'emotion');

  if (emotionItems.length < 4) {
    console.warn('[emotionQuestionGenerator] Not enough emotion items for questions');
    return [];
  }

  // 1. LISTEN_CHOOSE × 3
  for (let i = 0; i < 3; i++) {
    const item = emotionItems[i % emotionItems.length];
    questions.push(makeListenChoose(item, emotionItems));
  }

  // 2. PICTURE_MATCH × 3
  for (let i = 3; i < 6; i++) {
    const item = emotionItems[i % emotionItems.length];
    questions.push(makePictureMatch(item, emotionItems));
  }

  // 3. TRANSLATE_MATCH × 2
  for (let i = 0; i < 2; i++) {
    const pick4 = shuffle(pool).slice(0, 4);
    questions.push(makeTranslateMatch(pick4));
  }

  // 4. FILL_BLANK_DIALOG × 3
  FILL_BLANK_TEMPLATES.slice(0, 3).forEach((tpl) => {
    questions.push(makeFillBlank(tpl));
  });

  // 5. EMOJI_MATCH × 2
  EMOJI_MATCH_TEMPLATES.slice(0, 2).forEach((tpl) => {
    questions.push(makeEmojiMatch(tpl.emoji, tpl.choices, tpl.correct));
  });

  // 6. TONE_PICK × 1
  const tonePick = TONE_PICK_TEMPLATES[Math.floor(Math.random() * TONE_PICK_TEMPLATES.length)];
  questions.push(makeTonePick(tonePick.stem, tonePick.options, tonePick.answer));

  // Shuffle and return exactly 14 questions
  return shuffle(questions).slice(0, 14);
};

export default {
  generateEmotionQuestions,
  makeListenChoose,
  makePictureMatch,
  makeTranslateMatch,
  makeFillBlank,
  makeEmojiMatch,
  makeTonePick,
  EMOTION_QUESTION_TYPES,
};
