import { letterImages } from '../assets/letters';
import { /* named to preserve original default export shape if any */ } from './gameQuestionFactory';
import * as rawFactory from './gameQuestionFactory';

// We support either exported function names present in gameQuestionFactory:
// - buildQuestionsFromAtlasDocs (async or sync)
// - generateQuestions (for local generation already used in NewLessonGame)

const attachImageIfNeeded = (q) => {
  if (q && q.type === 'PICTURE_MATCH') {
    const key = q.consonantChar || q.correctText || (Array.isArray(q.consonantChars) ? q.consonantChars[0] : null);
    return { ...q, imageSource: key ? (letterImages[key] || null) : null };
  }
  return q;
};

export const buildQuestionsFromAtlasDocs = async (...args) => {
  const builder = rawFactory.buildQuestionsFromAtlasDocs;
  const result = builder ? await builder(...args) : [];
  return Array.isArray(result) ? result.map(attachImageIfNeeded) : [];
};

export const generateQuestions = (...args) => {
  const gen = rawFactory.generateQuestions;
  const qs = gen ? gen(...args) : [];
  return Array.isArray(qs) ? qs.map(attachImageIfNeeded) : [];
};

export default {
  buildQuestionsFromAtlasDocs,
  generateQuestions,
};


