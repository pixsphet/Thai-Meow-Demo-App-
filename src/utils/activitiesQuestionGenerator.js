import { shuffle, pick, uid } from './gameUtils';

// Question Types for Activities
export const ACTIVITIES_QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
};

// Image mapping for Activities
const activitiesImages = {
  'กิน': require('../add/Activities/กิน.png'),
  'นอน': require('../add/Activities/นอน.png'),
  'วิ่ง': require('../add/Activities/วิ่ง.png'),
  'เดิน': require('../add/Activities/เดิน.png'),
  'อ่าน': require('../add/Activities/อ่าน.png'),
  'เขียน': require('../add/Activities/เขียน.png'),
  'พูด': require('../add/Activities/พูด.png'),
  'ฟัง': require('../add/Activities/ฟัง.png'),
  'เล่น': require('../add/Activities/เล่น.png'),
  'เต้น': require('../add/Activities/เต้น.png'),
  'ว่ายน้ำ': require('../add/Activities/ว่ายน้ำ.png'),
  'ทำอาหาร': require('../add/Activities/ทำอาหาร.png'),
  'ทำงาน': require('../add/Activities/ทำงาน.png'),
  'เรียน': require('../add/Activities/เรียน.png'),
  'ขับรถ': require('../add/Activities/ขับรถ.png'),
  'เดินทาง': require('../add/Activities/เดินทาง.png'),
  'ถ่ายรูป': require('../add/Activities/ถ่ายรูป.png'),
  'ดูหนัง': require('../add/Activities/ดูหนัง.png'),
  'เล่นเกม': require('../add/Activities/เล่นเกม.png'),
  'ออกกำลังกาย': require('../add/Activities/ออกกำลังกาย.png'),
};

// Question Generators
const makeListenChoose = (item, pool, usedWords = new Set()) => {
  const wrongChoices = pool
    .filter(w => w.thai !== item.thai && !usedWords.has(w.thai))
    .slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `lc_activity_${item.id}_${uid()}`,
    type: ACTIVITIES_QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังเสียงแล้วเลือกกิจกรรมที่ได้ยิน',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: item.audioText,
    correctText: item.thai,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.thai,
      english: c.english,
      emoji: c.emoji,
      text: `${c.emoji} ${c.thai}`,
      speakText: c.audioText,
      isCorrect: c.thai === item.thai,
      subtitle: c.english || '',
    })),
  };
};

const makePictureMatch = (item, pool, usedWords = new Set()) => {
  const wrongChoices = pool
    .filter(w => w.thai !== item.thai && !usedWords.has(w.thai))
    .slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `pm_activity_${item.id}_${uid()}`,
    type: ACTIVITIES_QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูรูปกิจกรรมแล้วเลือกชื่อที่ตรงกัน',
    imageSource: activitiesImages[item.thai] || null,
    emoji: item.emoji,
    correctText: item.thai,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.thai,
      english: c.english,
      text: `${c.emoji} ${c.thai}`,
      speakText: c.audioText,
      isCorrect: c.thai === item.thai,
      subtitle: c.english || '',
    })),
  };
};

const makeTranslateMatch = (item, pool, usedWords = new Set()) => {
  const otherItems = pool.filter(w => w.thai !== item.thai && !usedWords.has(w.thai)).slice(0, 3);
  const allItems = shuffle([item, ...otherItems]);

  const leftItems = allItems.map((w, i) => ({
    id: `left_${i + 1}`,
    text: w.thai,
    subtitle: w.english || '',
    correctMatch: w.english,
    speakText: w.audioText,
  }));

  const rightItems = allItems.map((w, i) => ({
    id: `right_${i + 1}`,
    text: w.english,
    subtitle: w.thai,
    correctMatch: w.thai,
    speakText: w.audioText,
  }));

  return {
    id: `tm_activity_${item.id}_${uid()}`,
    type: ACTIVITIES_QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่คำศัพท์ไทยกับภาษาอังกฤษ',
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    leftItems: shuffle(leftItems),
    rightItems: shuffle(rightItems),
  };
};

const makeFillBlankDialog = (item, pool) => {
  const dialogs = [
    {
      context: 'ในตอนเช้า ฉันชอบ...',
      correct: item.thai,
      options: [item.thai, 'นอน', 'ดูหนัง', 'เล่นเกม']
    },
    {
      context: 'เพื่อนของฉันชอบ...',
      correct: item.thai,
      options: [item.thai, 'ทำงาน', 'เรียน', 'ขับรถ']
    },
    {
      context: 'วันหยุด ฉันมักจะ...',
      correct: item.thai,
      options: [item.thai, 'เรียน', 'ทำงาน', 'ขับรถ']
    }
  ];
  
  const dialog = pick(dialogs);
  const wrongOptions = pool.filter(w => w.thai !== item.thai).slice(0, 3);
  const allOptions = shuffle([item, ...wrongOptions]);
  
  return {
    id: `fb_activity_${item.id}_${uid()}`,
    type: ACTIVITIES_QUESTION_TYPES.FILL_BLANK_DIALOG,
    instruction: 'เลือกคำที่เหมาะสมกับบทสนทนา',
    questionText: dialog.context,
    correctText: dialog.correct,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: allOptions.map((c, i) => ({
      id: i + 1,
      thai: c.thai,
      english: c.english,
      text: `${c.emoji} ${c.thai}`,
      speakText: c.audioText,
      isCorrect: c.thai === dialog.correct,
      subtitle: c.english || '',
    })),
  };
};

// Generate questions tailored for Activities
export const generateActivitiesQuestions = (pool) => {
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

export { activitiesImages };
