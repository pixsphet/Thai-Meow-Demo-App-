import { shuffle, pick, uid } from './gameUtils';

export const OCCUPATIONS_QUESTION_TYPES = {
  LEARN_IDIOM: 'LEARN_IDIOM',
  LISTEN_MEANING: 'LISTEN_MEANING',
  FILL_CONTEXT: 'FILL_CONTEXT',
  MATCH_IDIOM_MEANING: 'MATCH_IDIOM_MEANING',
};

// Dynamically load images
const occupationImages = {
  "นักพัฒนาเว็บ": require('../add/Occupations/นักพัฒนาเว็บ.png'),
  "นักพัฒนาแอป": require('../add/Occupations/นักพัฒนาแอป.png'),
  "นักวิเคราะห์ข้อมูล": require('../add/Occupations/นักวิเคราะห์ข้อมูล.png'),
  "นักวิจัย": require('../add/Occupations/นักวิจัย.png'),
  "นักจิตวิทยา": require('../add/Occupations/นักจิตวิทยา.png'),
  "ทนายความ": require('../add/Occupations/ทนายความ.png'),
  "นักการตลาด": require('../add/Occupations/นักการตลาด.png'),
  "แฮกเกอร์": require('../add/Occupations/แฮกเกอร์.png'),
  "ยูทูบเบอร์": require('../add/Occupations/ยูทูบเบอร์.png'),
  "อินฟลูเอนเซอร์": require('../add/Occupations/อินฟลูเอนเซอร์.png'),
  "เจ้าหน้าที่สิ่งแวดล้อม": require('../add/Occupations/เจ้าหน้าที่สิ่งแวดล้อม.png'),
  "นักแปล": require('../add/Occupations/นักแปล.png'),
  "ล่าม": require('../add/Occupations/ล่าม.png'),
  "นักวิทยาศาสตร์": require('../add/Occupations/นักวิทยาศาสตร์.png'),
};

const normalizeOccupationItem = (doc) => ({
  id: doc.id || `occupation_${uid()}`,
  thai: doc.thai || '',
  roman: doc.roman || '',
  en: doc.en || '',
  meaningTH: doc.meaningTH || doc.en || '',
  meaningEN: doc.meaningEN || doc.en || '',
  exampleTH: doc.exampleTH || '',
  exampleEN: doc.exampleEN || '',
  audioText: doc.audioText || doc.thai || '',
  imageSource: doc.image ? occupationImages[doc.thai] : null,
  type: doc.type || 'occupation',
});

// ---------- Builders ----------
const buildLearnCard = (occupation) => ({
  id: `learn_${occupation.id}_${uid()}`,
  type: OCCUPATIONS_QUESTION_TYPES.LEARN_IDIOM,
  instruction: 'คำศัพท์ใหม่',
  thai: occupation.thai,
  meaningTH: occupation.meaningTH,
  meaningEN: occupation.meaningEN,
  exampleTH: occupation.exampleTH,
  exampleEN: occupation.exampleEN,
  audioText: occupation.audioText || occupation.thai,
  tips: 'อ่านแล้วกด NEXT เพื่อทำข้อถัดไป',
  rewardXP: 15,
  rewardDiamond: 1,
  penaltyHeart: 1,
});

const buildListenMeaning = (occupation, pool) => {
  const wrong = shuffle(
    pool.filter(p => p.id !== occupation.id).map(p => p.meaningEN)
  ).slice(0, 3);
  const choices = shuffle([occupation.meaningEN, ...wrong]).slice(0, 4);
  return {
    id: `lm_${occupation.id}_${uid()}`,
    type: OCCUPATIONS_QUESTION_TYPES.LISTEN_MEANING,
    instruction: 'ฟังแล้วเลือกความหมายที่ถูกต้อง',
    questionText: 'แตะปุ่มลำโพงเพื่อฟังคำศัพท์',
    audioText: occupation.audioText || occupation.thai,
    correctText: occupation.meaningEN,
    choices: choices.map((t, i) => ({ id: i + 1, text: t })),
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
  };
};

const buildFillContext = (occupation, pool) => {
  const distract = shuffle(
    pool.filter(p => p.id !== occupation.id).map(p => p.thai)
  ).slice(0, 3);
  const opts = shuffle([occupation.thai, ...distract]).slice(0, 4);
  
  // Context templates for occupations
  const contextTemplates = [
    {
      question: `บริษัทต้องการรายงานและแดชบอร์ดจากข้อมูลขนาดใหญ่ ควรจ้าง ____`,
      correct: occupation.thai,
      speakText: occupation.thai
    },
    {
      question: `เพื่อให้คำปรึกษากฎหมายและต่อสู้คดีในศาล ต้องเป็น ____`,
      correct: occupation.thai,
      speakText: occupation.thai
    },
    {
      question: `การสร้างและพัฒนาเว็บไซต์ต้องใช้ ____`,
      correct: occupation.thai,
      speakText: occupation.thai
    },
    {
      question: `การวิเคราะห์ข้อมูลและสร้างรายงานต้องใช้ ____`,
      correct: occupation.thai,
      speakText: occupation.thai
    }
  ];
  
  const template = pick(contextTemplates);
  
  return {
    id: `fc_${occupation.id}_${uid()}`,
    type: OCCUPATIONS_QUESTION_TYPES.FILL_CONTEXT,
    instruction: 'เลือกคำที่เหมาะกับบริบท',
    questionText: template.question,
    correctText: template.correct,
    choices: opts.map((t, i) => ({ id: i + 1, text: t, speakText: t })),
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
  };
};

const buildMatch = (occupations) => {
  const batch = shuffle(occupations).slice(0, 3);
  return {
    id: `mm_${uid()}`,
    type: OCCUPATIONS_QUESTION_TYPES.MATCH_IDIOM_MEANING,
    instruction: 'จับคู่คำไทยกับความหมายภาษาอังกฤษ',
    leftItems: batch.map((it, idx) => ({
      id: `L${idx + 1}`,
      text: it.thai,
      correctMatch: it.meaningEN,
      speakText: it.thai,
    })),
    rightItems: shuffle(batch).map((it, idx) => ({
      id: `R${idx + 1}`,
      text: it.meaningEN,
      speakText: it.meaningEN,
    })),
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
  };
};

// ---------- Flow generator ----------
/**
 * สร้างบทเรียน n ข้อ (แนะนำ 6) แบบสลับ: LEARN → GAME → LEARN → GAME ...
 * - ใช้คำศัพท์ไม่ซ้ำ
 * - เกมจะอ้างอิงคำศัพท์ที่เพิ่งเรียน เพื่อย้ำจำ
 */
export const generateOccupationsLessonFlow = (pool, n = 6) => {
  const occupations = shuffle((pool || []).map(normalizeOccupationItem)).filter(i => i.thai && i.meaningEN);
  if (occupations.length === 0) return [];

  // เลือกคำศัพท์หลักที่ใช้สอน (ceil(n/2))
  const learnCount = Math.ceil(n / 2);
  const learnOccupations = occupations.slice(0, learnCount);

  const out = [];
  const usedForMatch = [];

  for (let i = 0; i < learnCount; i++) {
    const occupation = learnOccupations[i];

    // 1) การ์ดความรู้
    out.push(buildLearnCard(occupation));
    usedForMatch.push(occupation);

    // 2) เกมตามหลัง (เลือกจาก 3 แบบ หมุนเวียน)
    const gameTypeIndex = i % 3;
    if (gameTypeIndex === 0) {
      out.push(buildListenMeaning(occupation, occupations));
    } else if (gameTypeIndex === 1) {
      out.push(buildFillContext(occupation, occupations));
    } else {
      // จับคู่ 3 คำ: เอาคำที่เรียน + สุ่มเพิ่มอีก 2
      const extra = shuffle(occupations.filter(x => x.id !== occupation.id)).slice(0, 2);
      out.push(buildMatch([occupation, ...extra]));
    }
  }

  // ตัดให้เหลือ n ข้อพอดี
  return out.slice(0, n);
};

// Export individual builders for flexibility
export {
  buildLearnCard,
  buildListenMeaning,
  buildFillContext,
  buildMatch,
  normalizeOccupationItem,
};
