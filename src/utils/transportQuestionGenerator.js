export const TRANSPORT_QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
  ARRANGE_SENTENCE: 'ARRANGE_SENTENCE',
};

const uid = () => Math.random().toString(36).substr(2, 9);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const makeListenChoose = (item, pool) => ({
  id: `lc_${item.thai}_${uid()}`,
  type: TRANSPORT_QUESTION_TYPES.LISTEN_CHOOSE,
  instruction: 'ฟังเสียงแล้วเลือกคำที่ได้ยิน',
  audioText: item.audioText || item.thai,
  questionText: 'นี่คืออะไร?',
  correctText: item.thai,
  choices: shuffle([item, ...shuffle(pool.filter(p => p.id !== item.id)).slice(0, 3)])
    .map((x, i) => ({ id: i + 1, text: x.thai, emoji: x.emoji })),
});

export const makePictureMatch = (item, pool) => ({
  id: `pm_${item.thai}_${uid()}`,
  type: TRANSPORT_QUESTION_TYPES.PICTURE_MATCH,
  instruction: 'จับคู่ภาพกับคำให้ถูกต้อง',
  emoji: item.emoji || '🚗',
  questionText: 'ภาพนี้คืออะไร?',
  correctText: item.thai,
  choices: shuffle([item, ...shuffle(pool.filter(p => p.id !== item.id)).slice(0, 3)])
    .map((x, i) => ({ id: i + 1, text: x.thai })),
});

export const makeTranslateMatch = (pick4) => {
  const left = pick4.map((x, i) => ({ id: i + 1, text: x.thai, correctMatch: x.en }));
  const right = shuffle(pick4).map((x, i) => ({ id: i + 1, text: x.en }));
  return {
    id: `tm_${uid()}`,
    type: TRANSPORT_QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่คำไทยกับภาษาอังกฤษ',
    leftItems: left,
    rightItems: right,
  };
};

const fillBlankTemplates = [
  {
    template: 'A: คุณไปทำงานยังไง? B: ฉันไปโดย ____',
    options: ['รถไฟ', 'แท็กซี่', 'เครื่องบิน'],
    answer: 'รถไฟ',
  },
  {
    template: 'A: เขา ____ รถเมล์ไปตลาดทุกวัน',
    options: ['ขี่', 'นั่ง', 'ขับ'],
    answer: 'นั่ง',
  },
  {
    template: 'A: ฉันจะ ____ รถที่หน้าบ้าน',
    options: ['ขึ้น', 'ลง', 'ขี่'],
    answer: 'ขึ้น',
  },
  {
    template: 'A: ช้าเพราะ ____',
    options: ['รถติด', 'รถเร็ว', 'รถสะอาด'],
    answer: 'รถติด',
  },
  {
    template: 'A: เราจะ ____ รถไฟฟ้าไปห้างไหม?',
    options: ['ขึ้น', 'ลง', 'ขี่'],
    answer: 'ขึ้น',
  },
  {
    template: 'A: ลงรถ ____ ตรงป้ายนี้',
    options: ['ตรง', 'ถูก', 'ชัวร์'],
    answer: 'ตรง',
  },
];

export const makeFillBlank = (template) => ({
  id: `fb_${uid()}`,
  type: TRANSPORT_QUESTION_TYPES.FILL_BLANK_DIALOG,
  instruction: 'เติมคำให้ถูกต้องในบทสนทนา',
  questionText: template.template,
  choices: template.options.map((t, i) => ({ id: i + 1, text: t })),
  correctText: template.answer,
});

export const makeArrangeSentence = () => {
  const sentences = [
    {
      correctOrder: ['ฉัน', 'นั่ง', 'รถไฟ', 'ไป', 'กรุงเทพฯ'],
      distract: ['ตอนเช้า', 'เมื่อวาน', 'โดย', 'เร็วๆนี้'],
    },
    {
      correctOrder: ['เขา', 'ขี่', 'จักรยาน', 'ไป', 'โรงเรียน'],
      distract: ['ทุกวัน', 'เหนื่อย', 'ได้', 'แล้ว'],
    },
    {
      correctOrder: ['ฉัน', 'ขับรถ', 'ไป', 'ทำงาน', 'ตอนเช้า'],
      distract: ['ช้า', 'สาย', 'ถึง', 'เร็ว'],
    },
    {
      correctOrder: ['เรา', 'ถึง', 'ที่หมาย', 'แล้ว'],
      distract: ['ยังไง', 'ไป', 'ไหน', 'เมื่อไร'],
    },
  ];
  const picked = pick(sentences);
  const correctOrder = picked.correctOrder;
  const bank = shuffle([...correctOrder, ...picked.distract]).map((t) => ({
    id: uid(),
    text: t,
  }));

  return {
    id: `as_${uid()}`,
    type: TRANSPORT_QUESTION_TYPES.ARRANGE_SENTENCE,
    instruction: 'เรียงคำให้เป็นประโยคการเดินทางที่ถูกต้อง',
    questionText: 'แตะคำด้านล่างเพื่อเรียงประโยค',
    correctOrder,
    wordBank: bank,
  };
};

export const generateTransportQuestions = (pool = []) => {
  const q = [];

  if (!pool || pool.length === 0) {
    return q;
  }

  const allItems = [...pool];
  const vehicles = allItems.filter((p) => p.type === 'vehicle').slice(0, 8);
  const verbs = allItems.filter((p) => p.type === 'verb').slice(0, 5);
  const phrases = allItems.filter((p) => p.type === 'phrase').slice(0, 5);

  // LISTEN_CHOOSE (4 questions)
  vehicles.forEach((v) => {
    q.push(makeListenChoose(v, allItems));
  });

  // PICTURE_MATCH (4 questions)
  vehicles.slice(0, 4).forEach((v) => {
    q.push(makePictureMatch(v, allItems));
  });

  // TRANSLATE_MATCH (2 questions)
  for (let i = 0; i < 2; i++) {
    const pick4 = shuffle(allItems).slice(0, 4);
    q.push(makeTranslateMatch(pick4));
  }

  // FILL_BLANK_DIALOG (2 questions)
  fillBlankTemplates.slice(0, 2).forEach((tpl) => {
    q.push(makeFillBlank(tpl));
  });

  // ARRANGE_SENTENCE (2 questions)
  q.push(makeArrangeSentence());
  q.push(makeArrangeSentence());

  return shuffle(q).slice(0, 14);
};
