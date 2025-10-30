import { shuffle, pick, uid } from './gameUtils';

// Question Types for Advanced Occupations
export const OCCUPATIONS_ADVANCED_QUESTION_TYPES = {
  LEARN_IDIOM: 'LEARN_IDIOM',
  LISTEN_MEANING: 'LISTEN_MEANING',
  PICTURE_MATCH: 'PICTURE_MATCH',
  FILL_CONTEXT: 'FILL_CONTEXT',
  MATCH_IDIOM_MEANING: 'MATCH_IDIOM_MEANING',
};

// Normalize occupation data
const normalizeOccupation = (doc) => ({
  id: doc.id || `occ_${uid()}`,
  thai: doc.thai || '',
  roman: doc.roman || '',
  en: doc.en || '',
  meaningTH: doc.meaningTH || '',
  meaningEN: doc.meaningEN || '',
  exampleTH: doc.exampleTH || '',
  exampleEN: doc.exampleEN || '',
  audioText: doc.audioText || doc.thai || '',
  imagePath: doc.imagePath || '',
  tips: doc.tips || '',
});

// Generate lesson flow for all occupations with variety: LEARN → Random Game Type
export const generateOccupationsLessonFlow = (pool) => {
  if (!pool || pool.length === 0) return [];
  
  const questions = [];
  const gameTypes = ['LISTEN_MEANING', 'PICTURE_MATCH', 'FILL_CONTEXT', 'MATCH_IDIOM_MEANING'];
  
  // Process all occupations in order (using all 14 occupations)
  pool.forEach((item, index) => {
    // LEARN card
    questions.push({
      id: `learn_${item.id}_${uid()}`,
      type: OCCUPATIONS_ADVANCED_QUESTION_TYPES.LEARN_IDIOM,
      instruction: 'คำศัพท์ใหม่',
      thai: item.thai,
      meaningTH: item.meaningTH,
      meaningEN: item.meaningEN,
      exampleTH: item.exampleTH,
      exampleEN: item.exampleEN,
      audioText: item.audioText,
      tips: item.tips,
      imagePath: item.imagePath,
      imageKey: item.thai, // Use thai as key to match with occupationsImages
    });
    
    // Random game type for variety
    const gameType = gameTypes[index % gameTypes.length];
    
    switch (gameType) {
      case 'LISTEN_MEANING':
        questions.push(makeListenMeaning(item, pool));
        break;
      case 'PICTURE_MATCH':
        questions.push(makePictureMatch(item, pool));
        break;
      case 'FILL_CONTEXT':
        questions.push(makeFillContext(item, pool));
        break;
      case 'MATCH_IDIOM_MEANING':
        questions.push(makeMatchIdiomMeaning(item, pool));
        break;
      default:
        questions.push(makeListenMeaning(item, pool));
    }
  });
  
  // Shuffle to avoid patterns
  return shuffle(questions);
};

// Question generators
const makeListenMeaning = (item, pool) => {
  const wrongChoices = pool
    .filter(p => p.id !== item.id && p.thai && p.thai.trim())
    .slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `listen_${item.id}_${uid()}`,
    type: OCCUPATIONS_ADVANCED_QUESTION_TYPES.LISTEN_MEANING,
    instruction: 'ฟังแล้วเลือกคำศัพท์ที่ถูกต้อง',
    questionText: 'แตะปุ่มลำโพงเพื่อฟังคำศัพท์',
    audioText: item.audioText,
    correctText: item.thai,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.thai || '',
      roman: c.roman || '',
      speakText: c.thai || '', // Add speakText for TTS
      isCorrect: c.id === item.id,
    })),
  };
};

const makePictureMatch = (item, pool) => {
  const wrongChoices = pool
    .filter(p => p.id !== item.id && p.thai && p.thai.trim())
    .slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `picture_${item.id}_${uid()}`,
    type: OCCUPATIONS_ADVANCED_QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูภาพแล้วเลือกคำที่ตรงกัน',
    imageKey: item.thai, // Use thai as key to match with occupationsImages
    correctText: item.thai,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.thai || '',
      roman: c.roman || '',
      speakText: c.thai || '', // Add speakText for TTS
      isCorrect: c.id === item.id,
    })),
  };
};

const makeFillContext = (item, pool) => {
  // Generate context based on occupation meaning
  const occupationContexts = {
    'นักพัฒนาเว็บ': {
      th: 'บริษัทต้องการสร้างเว็บไซต์ให้ทันสมัยและใช้งานง่าย ควรจ้าง ____',
      en: 'A company needs to create a modern and user-friendly website. They should hire ____'
    },
    'นักพัฒนาแอป': {
      th: 'บริษัทต้องการสร้างแอปมือถือสำหรับลูกค้า ควรจ้าง ____',
      en: 'A company needs to create a mobile app for customers. They should hire ____'
    },
    'นักวิเคราะห์ข้อมูล': {
      th: 'บริษัทต้องการรายงานและแดชบอร์ดจากข้อมูลขนาดใหญ่ ควรจ้าง ____',
      en: 'A company needs reports and dashboards from big data. They should hire ____'
    },
    'นักวิจัย': {
      th: 'มหาวิทยาลัยต้องการทำวิจัยค้นหาความรู้ใหม่ ควรจ้าง ____',
      en: 'A university needs to research and discover new knowledge. They should hire ____'
    },
    'นักจิตวิทยา': {
      th: 'โรงพยาบาลต้องการช่วยผู้ป่วยให้เข้าใจอารมณ์และพฤติกรรม ควรจ้าง ____',
      en: 'A hospital needs to help patients understand their emotions and behavior. They should hire ____'
    },
    'ทนายความ': {
      th: 'บริษัทต้องการคำปรึกษากฎหมายและต่อสู้คดีในศาล ควรจ้าง ____',
      en: 'A company needs legal advice and representation in court. They should hire ____'
    },
    'นักการตลาด': {
      th: 'บริษัทต้องการวางแผนกลยุทธ์เพื่อเพิ่มยอดขาย ควรจ้าง ____',
      en: 'A company needs to plan strategies to increase sales. They should hire ____'
    },
    'แฮกเกอร์': {
      th: 'บริษัทต้องการทดสอบระบบเพื่อป้องกันการโจมตีไซเบอร์ ควรจ้าง ____',
      en: 'A company needs to test systems to prevent cyber attacks. They should hire ____'
    },
    'ยูทูบเบอร์': {
      th: 'บริษัทต้องการสร้างเนื้อหาวิดีโอและเผยแพร่บน YouTube ควรจ้าง ____',
      en: 'A company needs to create video content and share it on YouTube. They should hire ____'
    },
    'อินฟลูเอนเซอร์': {
      th: 'บริษัทต้องการหาคนที่มีอิทธิพลต่อการตัดสินใจของผู้บริโภค ควรจ้าง ____',
      en: 'A company needs someone who influences consumer decisions. They should hire ____'
    },
    'เจ้าหน้าที่สิ่งแวดล้อม': {
      th: 'รัฐบาลต้องการดูแลการอนุรักษ์ธรรมชาติและสิ่งแวดล้อม ควรจ้าง ____',
      en: 'The government needs to manage conservation and environmental protection. They should hire ____'
    },
    'นักแปล': {
      th: 'บริษัทต้องการถ่ายทอดข้อความจากภาษาหนึ่งไปยังอีกภาษา ควรจ้าง ____',
      en: 'A company needs to convert text from one language to another. They should hire ____'
    },
    'ล่าม': {
      th: 'องค์กรต้องการแปลภาษาแบบสดระหว่างการประชุม ควรจ้าง ____',
      en: 'An organization needs to translate spoken language in real-time during meetings. They should hire ____'
    },
    'นักวิทยาศาสตร์': {
      th: 'สถาบันต้องการทำการทดลองเพื่อค้นพบสิ่งใหม่ ควรจ้าง ____',
      en: 'An institute needs to conduct experiments to make new discoveries. They should hire ____'
    }
  };
  
  // Get context for this occupation or use default
  const context = occupationContexts[item.thai] || {
    th: `บริษัทต้องการคนที่มีความรู้ด้าน ____ ควรจ้างใคร?`,
    en: `A company needs someone with knowledge in ____. Who should they hire?`
  };
  
  const allChoices = shuffle([item.thai, ...pool.filter(p => p.id !== item.id).slice(0, 3).map(p => p.thai)]).slice(0, 4);
  
  return {
    id: `fill_${item.id}_${uid()}`,
    type: OCCUPATIONS_ADVANCED_QUESTION_TYPES.FILL_CONTEXT,
    instruction: 'เลือกคำที่เหมาะกับบริบท',
    instructionEN: 'Choose the word that fits the context',
    questionText: context.th,
    questionTextEN: context.en,
    correctText: item.thai,
    choices: allChoices.map((text, i) => ({
      id: i + 1,
      text,
      roman: (pool.find(p => p.thai === text) || {}).roman || '',
      speakText: text,
      isCorrect: text === item.thai,
    })),
  };
};

const makeMatchIdiomMeaning = (item, pool) => {
  const otherItems = pool.filter(p => p.id !== item.id).slice(0, 2);
  const allItems = shuffle([item, ...otherItems]);
  
  // Randomly switch Thai/English sides
  const switchSides = Math.random() > 0.5;
  
  let leftItems, rightItems, instruction;
  
  if (switchSides) {
    // Left: English, Right: Thai
    leftItems = shuffle(allItems).map((item, i) => ({
      id: `left_${i + 1}`,
      text: item.en,
      correctMatch: item.thai,
    }));
    
    rightItems = allItems.map((item, i) => ({
      id: `right_${i + 1}`,
      text: item.thai,
    }));
    
    instruction = 'จับคู่ภาษาอังกฤษกับคำไทย';
  } else {
    // Left: Thai, Right: English
    leftItems = allItems.map((item, i) => ({
      id: `left_${i + 1}`,
      text: item.thai,
      correctMatch: item.en,
    }));
    
    rightItems = shuffle(allItems).map((item, i) => ({
      id: `right_${i + 1}`,
      text: item.en,
    }));
    
    instruction = 'จับคู่คำไทยกับความหมายภาษาอังกฤษ';
  }
  
  return {
    id: `match_${item.id}_${uid()}`,
    type: OCCUPATIONS_ADVANCED_QUESTION_TYPES.MATCH_IDIOM_MEANING,
    instruction,
    leftItems,
    rightItems,
  };
};

// Check answer function
export const checkOccupationsAnswer = (question, userAnswer) => {
  switch (question.type) {
    case OCCUPATIONS_ADVANCED_QUESTION_TYPES.LEARN_IDIOM:
      return true; // Learn cards are always correct
    case OCCUPATIONS_ADVANCED_QUESTION_TYPES.LISTEN_MEANING:
    case OCCUPATIONS_ADVANCED_QUESTION_TYPES.PICTURE_MATCH:
    case OCCUPATIONS_ADVANCED_QUESTION_TYPES.FILL_CONTEXT:
      return userAnswer === question.correctText;
    case OCCUPATIONS_ADVANCED_QUESTION_TYPES.MATCH_IDIOM_MEANING:
      return userAnswer && userAnswer.every(pair =>
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );
    default:
      return false;
  }
};
