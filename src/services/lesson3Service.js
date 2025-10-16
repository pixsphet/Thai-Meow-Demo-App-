import apiClient from './apiClient';
import lesson3Data from '../assets/lessons/lesson3.json';

const normalizeLesson3Payload = (payload) => {
  if (!payload) {
    return {
      lessonId: lesson3Data.lessonId,
      title: lesson3Data.title,
      words: lesson3Data.words,
      sentences: lesson3Data.sentences,
      soundGroups: lesson3Data.soundGroups,
      source: 'fallback',
    };
  }

  const words = Array.isArray(payload.words)
    ? payload.words
    : Array.isArray(payload.data)
    ? payload.data
    : lesson3Data.words;

  return {
    lessonId: payload.lessonId || lesson3Data.lessonId,
    title: payload.title || lesson3Data.title,
    words: words.length ? words : lesson3Data.words,
    sentences: Array.isArray(payload.sentences) && payload.sentences.length
      ? payload.sentences
      : lesson3Data.sentences,
    soundGroups: Array.isArray(payload.soundGroups) && payload.soundGroups.length
      ? payload.soundGroups
      : lesson3Data.soundGroups,
    source: payload.source || 'api',
  };
};

export const fetchLesson3Content = async () => {
  try {
    const { data } = await apiClient.get('/vocab/lesson3');
    return normalizeLesson3Payload(data?.data || data);
  } catch (error) {
    console.warn('⚠️ Falling back to bundled lesson3.json:', error?.message);
    return normalizeLesson3Payload(null);
  }
};

export const submitLesson3Result = async (payload) => {
  try {
    const response = await apiClient.post('/progress/lesson3/complete', payload);
    return response.data || { success: true };
  } catch (error) {
    console.error('❌ Failed to submit Lesson 3 result:', error?.message);
    throw error;
  }
};

export default {
  fetchLesson3Content,
  submitLesson3Result,
};
