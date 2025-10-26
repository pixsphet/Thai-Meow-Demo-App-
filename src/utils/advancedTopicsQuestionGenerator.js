// Question Generator for Advanced Topics
// Path: src/utils/advancedTopicsQuestionGenerator.js

import { shuffle, pick, uid } from './gameUtils';

// Question Types
export const ADVANCED_TOPICS_QUESTION_TYPES = {
  LEARN_TOPIC: 'LEARN_TOPIC',
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  ARRANGE_SENTENCE: 'ARRANGE_SENTENCE',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
};

// Builders
export const buildLearnCard = (topic) => ({
  id: `learn_${topic.id}_${uid()}`,
  type: ADVANCED_TOPICS_QUESTION_TYPES.LEARN_TOPIC,
  instruction: 'หัวข้อใหม่',
  thai: topic.thai,
  roman: topic.roman,
  en: topic.en,
  meaningTH: topic.meaningTH,
  exampleTH: topic.exampleTH,
  exampleEN: topic.exampleEN,
  audioText: topic.audioText,
  tips: 'อ่านแล้วกด NEXT เพื่อทำข้อถัดไป',
  imageKey: topic.thai, // Use thai as key to match with advancedTopicsImages
  rewardXP: 15,
  rewardDiamond: 1,
  penaltyHeart: 1,
});

export const buildListenChoose = (topic, pool) => {
  const wrong = shuffle(pool.filter(p => p.id !== topic.id)).slice(0, 3);
  const mode = Math.random() > 0.5 ? 'thai' : 'en';
  const choices = shuffle([topic, ...wrong]).slice(0, 4);
  
  return {
    id: `lc_${topic.id}_${uid()}`,
    type: ADVANCED_TOPICS_QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: mode === 'thai' ? 'ฟังเสียงแล้วเลือกคำไทยที่ได้ยิน' : 'ฟังเสียงแล้วเลือกความหมายภาษาอังกฤษที่ถูกต้อง',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: topic.audioText,
    correctText: mode === 'thai' ? topic.thai : topic.en,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: mode === 'thai' ? c.thai : c.en,
      speakText: c.audioText,
      isCorrect: c.id === topic.id,
    })),
  };
};

export const buildPictureMatch = (topic, pool) => {
  const wrong = shuffle(pool.filter(p => p.id !== topic.id)).slice(0, 3);
  const mode = Math.random() > 0.5 ? 'thai' : 'en';
  const choices = shuffle([topic, ...wrong]).slice(0, 4);
  
  return {
    id: `pm_${topic.id}_${uid()}`,
    type: ADVANCED_TOPICS_QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูภาพหัวข้อแล้วเลือกคำที่ตรงกัน',
    imageKey: topic.imageKey,
    correctText: mode === 'thai' ? topic.thai : topic.en,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: mode === 'thai' ? c.thai : c.en,
      speakText: c.audioText,
      isCorrect: c.id === topic.id,
    })),
  };
};

export const buildTranslateMatch = (pool) => {
  const batch = shuffle(pool).slice(0, 4);
  const leftItems = batch.map((b, i) => ({
    id: `L${i}`,
    text: b.thai,
    correctMatch: b.en,
    speakText: b.audioText,
  }));
  const rightItems = shuffle(batch).map((b, i) => ({
    id: `R${i}`,
    text: b.en,
  }));
  
  return {
    id: `tm_${uid()}`,
    type: ADVANCED_TOPICS_QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่ไทยกับอังกฤษ',
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    leftItems,
    rightItems,
  };
};

export const buildArrangeSentence = (topic) => {
  const parts = [`${topic.thai}`, `สำคัญ`, `ต่อ`, `สังคม`];
  const distractors = ['มาก', 'ในยุคนี้'];
  const allParts = shuffle([...parts, ...distractors]);
  
  return {
    id: `arr_${topic.id}_${uid()}`,
    type: ADVANCED_TOPICS_QUESTION_TYPES.ARRANGE_SENTENCE,
    instruction: 'เรียงคำให้ได้ประโยคสมบูรณ์',
    correctOrder: parts,
    allParts,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
  };
};

export const buildFillBlankDialog = (topic, pool) => {
  const templates = [
    { q: `คุณคิดว่า ${topic.thai} มีผลต่ออนาคตอย่างไร`, a: `ผมคิดว่า ____ ช่วยแก้ปัญหาได้`, key: topic.thai },
    { q: `อธิบายสั้น ๆ ว่า ${topic.thai} คืออะไร`, a: `โดยสรุป ____ คือหัวใจของการพัฒนา`, key: topic.thai },
  ];
  const t = pick(templates);
  const wrong = shuffle(pool.filter(p => p.thai !== topic.thai)).slice(0, 3).map(p => p.thai);
  const choices = shuffle([topic.thai, ...wrong]).slice(0, 4);
  
  return {
    id: `fb_${topic.id}_${uid()}`,
    type: ADVANCED_TOPICS_QUESTION_TYPES.FILL_BLANK_DIALOG,
    instruction: 'เลือกคำมาเติมให้สอดคล้องกับบริบท',
    questionText: `Q: ${t.q}`,
    template: t.a,
    correctText: topic.thai,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c,
      isCorrect: c === topic.thai,
    })),
  };
};

// Generate lesson flow: LEARN → GAME → LEARN → GAME (6 questions total)
export const generateAdvancedTopicsLessonFlow = (pool, n = 6) => {
  const topics = shuffle((pool || []).map(topic => ({
    ...topic,
    imageKey: topic.thai, // Ensure imageKey is set
  }))).filter(t => t.thai && t.meaningTH);
  
  if (topics.length === 0) return [];
  
  const learnCount = Math.ceil(n / 2);
  const learnTopics = topics.slice(0, learnCount);
  const out = [];
  
  for (let i = 0; i < learnCount; i++) {
    const topic = learnTopics[i];
    
    // 1) Learn card
    out.push(buildLearnCard(topic));
    
    // 2) Game question (rotate between types)
    const gameTypeIndex = i % 4;
    if (gameTypeIndex === 0) {
      out.push(buildListenChoose(topic, topics));
    } else if (gameTypeIndex === 1) {
      out.push(buildPictureMatch(topic, topics));
    } else if (gameTypeIndex === 2) {
      out.push(buildTranslateMatch(topics));
    } else {
      out.push(buildArrangeSentence(topic));
    }
  }
  
  return out.slice(0, n);
};
