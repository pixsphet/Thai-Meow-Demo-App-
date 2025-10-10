// ระบบสร้างคำถามเกมตามระดับความยาก

// สร้างคำถามจาก Atlas documents
export const buildQuestionsFromAtlasDocs = async (consonantData, vocabularyData, category) => {
  try {
    console.log('🎯 Building questions from Atlas docs...', { 
      consonantCount: consonantData?.length || 0, 
      vocabCount: vocabularyData?.length || 0,
      category 
    });

    if (!consonantData || consonantData.length === 0) {
      console.warn('⚠️ No consonant data available');
      return [];
    }

    const questions = [];
    const consonants = consonantData.slice(0, 10); // ใช้ 10 ตัวแรก

    // สร้างคำถามแบบต่างๆ
    consonants.forEach((consonant, index) => {
      // 1. Match Picture - เลือกตัวอักษรตามความหมาย
      questions.push({
        id: `match_${consonant.char}_${index}`,
        type: 'MATCH_PICTURE',
        instruction: `เลือกตัวอักษรที่หมายถึง "${consonant.meaning}"`,
        correctText: consonant.char,
        choices: generateChoices(consonant, consonants),
        consonantChar: consonant.char,
        questionText: consonant.meaning
      });

      // 2. Listen Choose - ฟังเสียงเลือกตัวอักษร
      questions.push({
        id: `listen_${consonant.char}_${index}`,
        type: 'LISTEN_CHOOSE',
        instruction: `ฟังเสียงแล้วเลือกตัวอักษรที่ได้ยิน`,
        questionText: consonant.name,
        correctText: consonant.char,
        choices: generateChoices(consonant, consonants),
        consonantChar: consonant.char,
        audioText: consonant.name
      });

      // 3. Arrange Sentence - เรียงประโยค
      questions.push({
        id: `arrange_${consonant.char}_${index}`,
        type: 'ARRANGE_SENTENCE',
        instruction: 'เรียงคำให้เป็นประโยคที่ถูกต้อง',
        questionText: `${consonant.char} คือ ${consonant.meaning}`,
        correctOrder: [consonant.char, 'คือ', consonant.meaning],
        wordBank: shuffleArray([consonant.char, 'คือ', consonant.meaning, 'และ', 'หรือ', 'ของ']),
        consonantChar: consonant.char
      });
    });

    // สร้าง Drag Order question
    if (consonants.length >= 4) {
      questions.push({
        id: `drag_order_${Date.now()}`,
        type: 'DRAG_ORDER',
        instruction: 'เรียงลำดับตัวอักษรจาก ก ไป ฮ',
        correctOrder: consonants.slice(0, 4).map(c => c.char),
        wordBank: shuffleArray(consonants.slice(0, 4).map(c => ({ id: c.char, text: c.char }))),
        consonantChars: consonants.slice(0, 4).map(c => c.char)
      });
    }

    // สร้าง Sound Group question
    if (consonants.length >= 3) {
      const groupConsonant = consonants[0];
      const sameGroup = consonants.filter(c => getSoundGroup(c.char) === getSoundGroup(groupConsonant.char)).slice(1, 3);
      const otherGroup = consonants.filter(c => getSoundGroup(c.char) !== getSoundGroup(groupConsonant.char)).slice(0, 2);
      
      questions.push({
        id: `sound_group_${Date.now()}`,
        type: 'SOUND_GROUP',
        instruction: `เลือกตัวอักษรที่อยู่ในกลุ่มเสียงเดียวกับ "${groupConsonant.char}"`,
        questionText: `ตัวไหนอยู่ในกลุ่มเสียงเดียวกับ ${groupConsonant.char}?`,
        correctChars: sameGroup.map(c => c.char),
        choices: [...sameGroup, ...otherGroup].map((c, i) => ({
          id: i + 1,
          text: c.char,
          isCorrect: sameGroup.includes(c)
        })),
        consonantChar: groupConsonant.char
      });
    }

    console.log(`✅ Generated ${questions.length} questions`);
    return shuffleArray(questions);

  } catch (error) {
    console.error('❌ Error building questions from Atlas docs:', error);
    return [];
  }
};

// Helper functions
const generateChoices = (correctConsonant, allConsonants) => {
  const otherConsonants = allConsonants.filter(c => c.char !== correctConsonant.char);
  const choices = [correctConsonant, ...otherConsonants.slice(0, 3)];
  return shuffleArray(choices).map((c, i) => ({
    id: i + 1,
    text: c.char
  }));
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getSoundGroup = (char) => {
  if (['ก','ข','ค','ฆ'].includes(char)) return 'เสียงคอ';
  if (['จ','ฉ','ช','ซ','ศ','ษ','ส'].includes(char)) return 'เสียงศีรษะ';
  if (['ด','ต','ถ','ท'].includes(char)) return 'เสียงลิ้น';
  if (['บ','ป','ผ','พ','ฟ'].includes(char)) return 'เสียงปาก';
  return 'พยัญชนะพื้นฐาน';
};

export const GAME_MODES = {
  BEGINNER: {
    LISTEN_CHOOSE: 'LISTEN_CHOOSE',
    PICTURE_MATCH: 'PICTURE_MATCH'
  },
  INTERMEDIATE: {
    ARRANGE_SENTENCE: 'ARRANGE_SENTENCE',
    DRAG_ORDER: 'DRAG_ORDER'
  },
  ADVANCED: {
    FILL_BLANK: 'FILL_BLANK',
    SOUND_GROUP: 'SOUND_GROUP'
  }
};

// สร้างคำถามตามระดับและโหมด
export const createQuestion = (consonant, level = 'Beginner', mode = null) => {
  const question = {
    id: `${consonant.thai}_${Date.now()}`,
    consonant,
    level,
    mode: mode || getRandomMode(level),
    question: '',
    options: [],
    correctAnswer: '',
    points: getPoints(level)
  };

  switch (level) {
    case 'Beginner':
      return createBeginnerQuestion(question);
    case 'Intermediate':
      return createIntermediateQuestion(question);
    case 'Advanced':
      return createAdvancedQuestion(question);
    default:
      return createBeginnerQuestion(question);
  }
};

// สร้างคำถามระดับ Beginner
const createBeginnerQuestion = (question) => {
  const { consonant } = question;
  
  // โหมด LISTEN_CHOOSE - ฟังเสียงเลือกตัวอักษร
  if (question.mode === GAME_MODES.BEGINNER.LISTEN_CHOOSE) {
    question.question = `ฟังเสียงแล้วเลือกตัวอักษรที่ถูกต้อง`;
    question.options = generateConsonantOptions(consonant.thai);
    question.correctAnswer = consonant.thai;
  }
  // โหมด PICTURE_MATCH - จับคู่รูปภาพ
  else if (question.mode === GAME_MODES.BEGINNER.PICTURE_MATCH) {
    question.question = `จับคู่รูปภาพกับตัวอักษรที่ถูกต้อง`;
    question.options = generatePictureOptions(consonant);
    question.correctAnswer = consonant.thai;
  }
  
  return question;
};

// สร้างคำถามระดับ Intermediate
const createIntermediateQuestion = (question) => {
  const { consonant } = question;
  
  // โหมด ARRANGE_SENTENCE - เรียงคำ
  if (question.mode === GAME_MODES.INTERMEDIATE.ARRANGE_SENTENCE) {
    question.question = `เรียงคำให้ถูกต้อง`;
    question.options = generateSentenceOptions(consonant);
    question.correctAnswer = consonant.name;
  }
  // โหมด DRAG_ORDER - เรียงลำดับพยัญชนะ
  else if (question.mode === GAME_MODES.INTERMEDIATE.DRAG_ORDER) {
    question.question = `เรียงลำดับพยัญชนะให้ถูกต้อง`;
    question.options = generateOrderOptions(consonant.thai);
    question.correctAnswer = consonant.thai;
  }
  
  return question;
};

// สร้างคำถามระดับ Advanced
const createAdvancedQuestion = (question) => {
  const { consonant } = question;
  
  // โหมด FILL_BLANK - เติมคำ
  if (question.mode === GAME_MODES.ADVANCED.FILL_BLANK) {
    question.question = `เติมคำที่หายไป`;
    question.options = generateFillBlankOptions(consonant);
    question.correctAnswer = consonant.meaningTH;
  }
  // โหมด SOUND_GROUP - จัดกลุ่มเสียง
  else if (question.mode === GAME_MODES.ADVANCED.SOUND_GROUP) {
    question.question = `จัดกลุ่มเสียงที่ใกล้เคียงกัน`;
    question.options = generateSoundGroupOptions(consonant);
    question.correctAnswer = consonant.thai;
  }
  
  return question;
};

// ฟังก์ชันช่วยเหลือ
const getRandomMode = (level) => {
  const modes = Object.values(GAME_MODES[level.toUpperCase()]);
  return modes[Math.floor(Math.random() * modes.length)];
};

const getPoints = (level) => {
  switch (level) {
    case 'Beginner': return 10;
    case 'Intermediate': return 20;
    case 'Advanced': return 30;
    default: return 10;
  }
};

// สร้างตัวเลือกสำหรับพยัญชนะ
const generateConsonantOptions = (correctThai) => {
  const allConsonants = ['ก', 'ข', 'ค', 'ง', 'จ', 'ช', 'ซ', 'ญ', 'ด', 'ต'];
  const options = [correctThai];
  
  // เพิ่มตัวเลือกผิด
  while (options.length < 4) {
    const random = allConsonants[Math.floor(Math.random() * allConsonants.length)];
    if (!options.includes(random)) {
      options.push(random);
    }
  }
  
  return shuffleArray(options);
};

// สร้างตัวเลือกสำหรับรูปภาพ
const generatePictureOptions = (consonant) => {
  const pictures = [
    { thai: consonant.thai, meaning: consonant.meaningTH },
    { thai: 'ข', meaning: 'ไข่' },
    { thai: 'ค', meaning: 'ควาย' },
    { thai: 'ง', meaning: 'งู' }
  ];
  
  return shuffleArray(pictures);
};

// สร้างตัวเลือกสำหรับประโยค
const generateSentenceOptions = (consonant) => {
  const words = consonant.name.split('-');
  return shuffleArray(words);
};

// สร้างตัวเลือกสำหรับลำดับ
const generateOrderOptions = (thai) => {
  const orders = [thai, 'ข', 'ค', 'ง'];
  return shuffleArray(orders);
};

// สร้างตัวเลือกสำหรับเติมคำ
const generateFillBlankOptions = (consonant) => {
  const meanings = [consonant.meaningTH, 'ไข่', 'ควาย', 'งู'];
  return shuffleArray(meanings);
};

// สร้างตัวเลือกสำหรับกลุ่มเสียง
const generateSoundGroupOptions = (consonant) => {
  const sounds = [consonant.thai, 'ข', 'ค', 'ง'];
  return shuffleArray(sounds);
};

