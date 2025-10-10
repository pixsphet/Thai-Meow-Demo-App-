/**
 * Image mapping for Thai letters
 * Maps letter characters to their image assets
 */

// Consonant images mapping - using fallback for now
export const consonantImages = {
  // Using fallback images since actual letter images are not available
  'ก': require('./fallback.js').default.consonant,
  'ข': require('./fallback.js').default.consonant,
  'ฃ': require('./fallback.js').default.consonant,
  'ค': require('./fallback.js').default.consonant,
  'ฅ': require('./fallback.js').default.consonant,
  'ฆ': require('./fallback.js').default.consonant,
  'ง': require('./fallback.js').default.consonant,
  'จ': require('./fallback.js').default.consonant,
  'ฉ': require('./fallback.js').default.consonant,
  'ช': require('./fallback.js').default.consonant,
  'ซ': require('./fallback.js').default.consonant,
  'ฌ': require('./fallback.js').default.consonant,
  'ญ': require('./fallback.js').default.consonant,
  'ด': require('./fallback.js').default.consonant,
  'ฎ': require('./fallback.js').default.consonant,
  'ต': require('./fallback.js').default.consonant,
  'ฏ': require('./fallback.js').default.consonant,
  'ถ': require('./fallback.js').default.consonant,
  'ฐ': require('./fallback.js').default.consonant,
  'ท': require('./fallback.js').default.consonant,
  'ฑ': require('./fallback.js').default.consonant,
  'ฒ': require('./fallback.js').default.consonant,
  'น': require('./fallback.js').default.consonant,
  'ณ': require('./fallback.js').default.consonant,
  'บ': require('./fallback.js').default.consonant,
  'ป': require('./fallback.js').default.consonant,
  'ผ': require('./fallback.js').default.consonant,
  'ฝ': require('./fallback.js').default.consonant,
  'พ': require('./fallback.js').default.consonant,
  'ฟ': require('./fallback.js').default.consonant,
  'ภ': require('./fallback.js').default.consonant,
  'ม': require('./fallback.js').default.consonant,
  'ย': require('./fallback.js').default.consonant,
  'ร': require('./fallback.js').default.consonant,
  'ล': require('./fallback.js').default.consonant,
  'ว': require('./fallback.js').default.consonant,
  'ศ': require('./fallback.js').default.consonant,
  'ษ': require('./fallback.js').default.consonant,
  'ส': require('./fallback.js').default.consonant,
  'ห': require('./fallback.js').default.consonant,
  'ฬ': require('./fallback.js').default.consonant,
  'อ': require('./fallback.js').default.consonant,
  'ฮ': require('./fallback.js').default.consonant
};

// Vowel images mapping - using fallback for now
export const vowelImages = {
  'ะ': require('./fallback.js').default.vowel,
  'า': require('./fallback.js').default.vowel,
  'ิ': require('./fallback.js').default.vowel,
  'ี': require('./fallback.js').default.vowel,
  'ึ': require('./fallback.js').default.vowel,
  'ื': require('./fallback.js').default.vowel,
  'ุ': require('./fallback.js').default.vowel,
  'ู': require('./fallback.js').default.vowel,
  'เ': require('./fallback.js').default.vowel,
  'แ': require('./fallback.js').default.vowel,
  'โ': require('./fallback.js').default.vowel,
  'ใ': require('./fallback.js').default.vowel,
  'ไ': require('./fallback.js').default.vowel,
  'ำ': require('./fallback.js').default.vowel,
  'ฤ': require('./fallback.js').default.vowel,
  'ฦ': require('./fallback.js').default.vowel,
  'ฤา': require('./fallback.js').default.vowel,
  'ฦา': require('./fallback.js').default.vowel
};

// Tone images mapping - using fallback for now
export const toneImages = {
  '่': require('./fallback.js').default.tone,
  '้': require('./fallback.js').default.tone,
  '๊': require('./fallback.js').default.tone,
  '๋': require('./fallback.js').default.tone
};

// Get image for a letter
export const getLetterImage = (char, type) => {
  try {
    if (type === 'consonant') {
      return consonantImages[char] || require('./fallback.js').default.consonant;
    } else if (type === 'vowel') {
      return vowelImages[char] || require('./fallback.js').default.vowel;
    } else if (type === 'tone') {
      return toneImages[char] || require('./fallback.js').default.tone;
    }
    return require('./fallback.js').default.letter;
  } catch (error) {
    console.warn('⚠️ Image not found for letter:', char, type);
    return require('./fallback.js').default.letter;
  }
};

// Get fallback emoji for letter
export const getLetterEmoji = (char, type) => {
  if (type === 'consonant') {
    return '🔤';
  } else if (type === 'vowel') {
    return '🔡';
  } else if (type === 'tone') {
    return '🎵';
  }
  return '📝';
};

// Check if consonant image exists
export const hasConsonantImage = (char) => {
  return consonantImages.hasOwnProperty(char);
};

// Get consonant image with fallback
export const getConsonantImage = (char) => {
  return consonantImages[char] || null;
};

export default {
  consonantImages,
  vowelImages,
  toneImages,
  getLetterImage,
  getLetterEmoji
};
