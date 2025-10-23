export const ROUTINE_QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  ARRANGE_SENTENCE: 'ARRANGE_SENTENCE',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
  TIMELINE_ORDER: 'TIMELINE_ORDER',
};

const uid = () => Math.random().toString(36).substring(2, 10);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Helper: Create LISTEN_CHOOSE question
export const makeListenChoose = (item, pool) => ({
  id: `lc_${item.id}_${uid()}`,
  type: ROUTINE_QUESTION_TYPES.LISTEN_CHOOSE,
  instruction: 'ฟังเสียงแล้วเลือกกิจกรรมที่ได้ยิน',
  audioText: item.audioText || item.thai,
  questionText: 'นี่คือกิจกรรมอะไร?',
  correctText: item.thai,
  choices: shuffle([item, ...shuffle(pool.filter(p => p.id !== item.id)).slice(0, 3)])
    .map((x, i) => ({ id: i + 1, text: x.thai, audioText: x.audioText || x.thai })),
});

// Helper: Create TRANSLATE_MATCH question
export const makeTranslateMatch = (pick4) => {
  const left = pick4.map((x, i) => ({ id: i + 1, text: x.thai, correctMatch: x.en }));
  const right = shuffle(pick4).map((x, i) => ({ id: i + 1, text: x.en }));
  return {
    id: `tm_${uid()}`,
    type: ROUTINE_QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่คำไทยกับภาษาอังกฤษ',
    leftItems: left,
    rightItems: right,
  };
};

// Helper: Create ARRANGE_SENTENCE question
export const makeArrangeSentence = (verb1, verb2, connector = 'แล้ว') => {
  const correctOrder = ['ตอนเช้า', verb1.thai, connector, verb2.thai];
  const distractors = shuffle(['กำลัง', 'ก่อน', 'หลังจากนั้น', 'ทุกวัน']).slice(0, 2);
  const wordBank = shuffle([...correctOrder, ...distractors]).map((t) => ({
    id: uid(),
    text: t,
  }));
  return {
    id: `as_${uid()}`,
    type: ROUTINE_QUESTION_TYPES.ARRANGE_SENTENCE,
    instruction: 'เรียงคำให้เป็นประโยคกิจวัตรที่ถูกต้อง',
    questionText: 'จัดลำดับกิจกรรมตอนเช้า',
    correctOrder,
    wordBank,
  };
};

// Helper: Create FILL_BLANK_DIALOG question
export const makeFillBlank = (template, options, answer) => ({
  id: `fb_${uid()}`,
  type: ROUTINE_QUESTION_TYPES.FILL_BLANK_DIALOG,
  instruction: 'เติมคำให้เป็นประโยคที่ถูกต้อง',
  questionText: template,
  choices: shuffle(options).map((t, i) => ({ id: i + 1, text: t })),
  correctText: answer,
});

// Helper: Create TIMELINE_ORDER question
export const makeTimelineOrder = (correctOrder, stepsBank = []) => ({
  id: `tl_${uid()}`,
  type: ROUTINE_QUESTION_TYPES.TIMELINE_ORDER,
  instruction: 'เรียงลำดับกิจวัตรตามเวลา',
  questionText: 'เรียงลำดับกิจกรรมตั้งแต่เช้าถึงเข้านอน',
  correctOrder,
  stepsBank: shuffle([...new Set([...correctOrder, ...stepsBank])]).map((t) => ({
    id: uid(),
    text: t,
  })),
});

// Main generator: Create 12-14 questions
export const generateRoutineQuestions = (vocabPool = []) => {
  if (vocabPool.length === 0) return [];

  const verbs = vocabPool.filter((v) => v.type === 'verb').slice(0, 20);
  const times = vocabPool.filter((v) => v.type === 'time');
  const freqs = vocabPool.filter((v) => v.type === 'frequency');
  const grammars = vocabPool.filter((v) => v.type === 'grammar');

  const pool = [...verbs, ...times, ...freqs];
  const questions = [];

  // 3-4 LISTEN_CHOOSE questions
  const listeningVerbs = shuffle(verbs).slice(0, 4);
  listeningVerbs.forEach((verb) => {
    questions.push(makeListenChoose(verb, pool));
  });

  // 2-3 TRANSLATE_MATCH questions
  for (let i = 0; i < 2; i++) {
    const pick4 = shuffle(pool).slice(0, 4);
    questions.push(makeTranslateMatch(pick4));
  }

  // 2-3 ARRANGE_SENTENCE questions
  const connectors = ['แล้ว', 'ก่อน', 'หลังจากนั้น'];
  for (let i = 0; i < 2 && verbs.length >= 2; i++) {
    const v1 = shuffle(verbs)[0];
    const v2 = shuffle(verbs)[1];
    const connector = connectors[i % connectors.length];
    questions.push(makeArrangeSentence(v1, v2, connector));
  }

  // 2-3 FILL_BLANK_DIALOG questions
  const fills = [
    { template: 'ตอนเช้า ฉัน ____ แล้วค่อยไปทำงาน', options: ['ชงกาแฟ', 'ดูทีวี', 'เล่นเกม'], answer: 'ชงกาแฟ' },
    { template: 'หลังจาก ____ ฉันจะกินข้าวเย็น', options: ['ออกกำลังกาย', 'นอนหลับ', 'แปรงฟัน'], answer: 'ออกกำลังกาย' },
    { template: 'ฉัน ____ ทุกวันเวลาเจ็ดโมงเช้า', options: ['ตื่นนอน', 'อาบน้ำตอนเย็น', 'ดูทีวี'], answer: 'ตื่นนอน' },
    { template: 'ตอนค่ำ เขา ____ แล้วก็เข้านอน', options: ['อ่านหนังสือ', 'ไปทำงาน', 'ขับรถ'], answer: 'อ่านหนังสือ' },
    { template: 'ฉันกำลัง ____ อยู่ ช่วยรอสักครู่', options: ['อาบน้ำ', 'นอนหลับ', 'เข้านอน'], answer: 'อาบน้ำ' },
  ];
  fills.slice(0, 3).forEach((f) => {
    questions.push(makeFillBlank(f.template, f.options, f.answer));
  });

  // 2-3 TIMELINE_ORDER questions
  const timeline1 = ['ตื่นนอน', 'ล้างหน้า', 'แปรงฟัน', 'กินข้าวเช้า', 'ไปทำงาน'];
  const timeline1Bank = ['ดูทีวี', 'เล่นเกม', 'ซักผ้า', 'แต่งตัว'];
  questions.push(makeTimelineOrder(timeline1, timeline1Bank));

  const timeline2 = ['กลับบ้าน', 'กินข้าวเย็น', 'อาบน้ำตอนเย็น', 'อ่านหนังสือ', 'เข้านอน'];
  const timeline2Bank = ['ออกกำลังกาย', 'ชงกาแฟ', 'ทำการบ้าน'];
  questions.push(makeTimelineOrder(timeline2, timeline2Bank));

  return shuffle(questions).slice(0, 14);
};
