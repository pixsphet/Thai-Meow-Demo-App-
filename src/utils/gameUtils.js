// Game utility functions
// Path: src/utils/gameUtils.js

// Helper Functions
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const uid = () => Math.random().toString(36).substr(2, 9);

// Language helpers
export const isThaiText = (text) => /[ก-๙]/.test(String(text || ''));

// Normalize data helpers
export const normalizeTopic = (doc) => ({
  id: doc.id || doc._id?.toString() || uid(),
  thai: doc.thai,
  roman: doc.roman,
  en: doc.en,
  meaningTH: doc.meaningTH,
  exampleTH: doc.exampleTH,
  exampleEN: doc.exampleEN,
  imageKey: doc.thai,
  audioText: doc.audioText || doc.thai,
});

// Colors
export const COLORS = {
  primary: '#FF8000',
  cream: '#FFF5E5',
  white: '#FFFFFF',
  dark: '#2C3E50',
  success: '#58cc02',
  error: '#ff4b4b',
  lightGray: '#f5f5f5',
  gray: '#666',
};
