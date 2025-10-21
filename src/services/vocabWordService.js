import apiClient from './apiClient';
import fallbackVowelsData from '../data/vowels_fallback.json';

/**
 * Service for fetching vocabulary data, specifically consonants
 */

/**
 * Service for fetching greetings vocabulary
 */
export const fetchGreetings = async () => {
  try {
    console.log('🔄 Fetching greetings from API...');
    const response = await apiClient.get('/greetings');
    
    const payload = Array.isArray(response.data?.data) ? response.data.data : response.data;
    if (payload && Array.isArray(payload)) {
      console.log(`✅ Successfully loaded ${payload.length} greetings`);
      
      // Transform data for game use
      const greetings = payload.map(item => ({
        thai: item.thai,
        roman: item.roman,
        meaning: item.meaning,
        example: item.example,
        tts: item.tts,
        emoji: item.emoji,
        category: item.category,
        lesson: item.lesson,
        level: item.level,
        type: item.type,
        image: item.imagePath
      }));
      
      return greetings;
    } else {
      throw new Error('Invalid data format received from API');
    }
  } catch (error) {
    console.error('❌ Error fetching greetings:', error);
    throw error;
  }
};
export const fetchConsonants = async () => {
  try {
    console.log('🔄 Fetching consonants from API...');
    // baseURL already includes /api
    const response = await apiClient.get('/vocab/consonants');
    
    const payload = Array.isArray(response.data?.data) ? response.data.data : response.data;
    if (payload && Array.isArray(payload)) {
      console.log(`✅ Successfully loaded ${payload.length} consonants`);
      
      // Transform data for game use
      const consonants = payload.map(item => ({
        char: item.thai,
        name: item.exampleTH || item.nameTH,
        meaning: item.en,
        roman: item.roman,
        image: item.imagePath,
        level: item.level || 'Beginner',
        lessonKey: item.lessonKey || 'consonants_basic'
      }));
      
      return consonants;
    } else {
      throw new Error('Invalid data format received from API');
    }
  } catch (error) {
    console.error('❌ Error fetching consonants:', error);
    throw error;
  }
};

/**
 * Service for fetching vowel data
 */
export const fetchVowels = async () => {
  try {
    console.log('🔄 Fetching vowels from API...');
    const response = await apiClient.get('/vocab/vowels');

    const payload = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data?.vowels)
        ? response.data.vowels
        : response.data;

    if (payload && Array.isArray(payload)) {
      console.log(`✅ Successfully loaded ${payload.length} vowels`);

      return payload.map(item => ({
        char: item.thai,
        name: item.nameTH || item.thai,
        meaning: item.en,
        roman: item.roman,
        image: item.imagePath,
        level: item.level || 'Beginner',
        lessonKey: item.lessonKey || 'vowels_basic',
        sound: item.thai,
        imageKey: item.imagePath
          ? item.imagePath.split('/').pop()?.replace(/\.[^.]+$/, '')
          : item.thai,
        type: item.type || item.position || '',
        example: item.example,
        exampleAudio: item.exampleAudio,
        length: item.length || '',
        pair: item.pair || '',
        group: item.group || '',
      }));
    }

    throw new Error('Invalid data format received from API');
  } catch (error) {
    console.error('❌ Error fetching vowels:', error);
    throw error;
  }
};

/**
 * Get consonants with fallback data if API fails
 */
export const getConsonantsWithFallback = async () => {
  try {
    return await fetchConsonants();
  } catch (error) {
    console.warn('⚠️ Using fallback consonants data');
    return getFallbackConsonants();
  }
};

/**
 * Fallback vowels data (32 Thai vowels)
 */
const getFallbackVowels = () =>
  fallbackVowelsData.map((item) => ({
    char: item.thai,
    name: item.nameTH || item.thai,
    meaning: item.meaningTH || item.meaningEN || '',
    roman: item.roman,
    sound: item.audioText || item.thai,
    imageKey: item.image || item.thai,
    image: item.image || item.thai,
    example: item.exampleTH || item.example || '',
    exampleAudio: item.exampleAudio || '',
    type: item.type || item.position || '',
    length: item.length || '',
    pair: item.pair || '',
    group: item.group || '',
    level: item.level || 'Beginner',
    lessonKey: item.lessonKey || 'vowels_basic',
  }));

/**
 * Get vowels with fallback data if API fails
 */
export const getVowelsWithFallback = async () => {
  try {
    const vowels = await fetchVowels();
    if (!vowels || vowels.length === 0) {
      console.warn('⚠️ Vowel API returned empty dataset, using fallback');
      return getFallbackVowels();
    }
    return vowels;
  } catch (error) {
    console.warn('⚠️ Using fallback vowels data');
    return getFallbackVowels();
  }
};

/**
 * Fallback consonants data (44 Thai consonants)
 */
const getFallbackConsonants = () => {
  const fallbackData = [
    { char: 'ก', name: 'กอ-ไก่', meaning: 'chicken', roman: 'gor' },
    { char: 'ข', name: 'ขอ-ไข่', meaning: 'egg', roman: 'khor' },
    { char: 'ฃ', name: 'ฃอ-ขวด', meaning: 'bottle', roman: 'khor' },
    { char: 'ค', name: 'คอ-ควาย', meaning: 'buffalo', roman: 'khor' },
    { char: 'ฅ', name: 'ฅอ-คน', meaning: 'person', roman: 'khor' },
    { char: 'ฆ', name: 'ฆอ-ระฆัง', meaning: 'bell', roman: 'khor' },
    { char: 'ง', name: 'งอ-งู', meaning: 'snake', roman: 'ngor' },
    { char: 'จ', name: 'จอ-จาน', meaning: 'plate', roman: 'jor' },
    { char: 'ฉ', name: 'ฉอ-ฉิ่ง', meaning: 'cymbals', roman: 'chor' },
    { char: 'ช', name: 'ชอ-ช้าง', meaning: 'elephant', roman: 'chor' },
    { char: 'ซ', name: 'ซอ-โซ่', meaning: 'chain', roman: 'sor' },
    { char: 'ฌ', name: 'ฌอ-เฌอ', meaning: 'tree', roman: 'chor' },
    { char: 'ญ', name: 'ญอ-หญิง', meaning: 'woman', roman: 'yor' },
    { char: 'ฎ', name: 'ฎอ-ชฎา', meaning: 'crown', roman: 'dor' },
    { char: 'ฏ', name: 'ฏอ-ปฏัก', meaning: 'goad', roman: 'tor' },
    { char: 'ฐ', name: 'ฐอ-ฐาน', meaning: 'base', roman: 'thor' },
    { char: 'ฑ', name: 'ฑอ-มณโฑ', meaning: 'doll', roman: 'thor' },
    { char: 'ฒ', name: 'ฒอ-ผู้เฒ่า', meaning: 'elder', roman: 'thor' },
    { char: 'ณ', name: 'ณอ-เณร', meaning: 'novice', roman: 'nor' },
    { char: 'ด', name: 'ดอ-เด็ก', meaning: 'child', roman: 'dor' },
    { char: 'ต', name: 'ตอ-เต่า', meaning: 'turtle', roman: 'tor' },
    { char: 'ถ', name: 'ถอ-ถุง', meaning: 'bag', roman: 'thor' },
    { char: 'ท', name: 'ทอ-ทหาร', meaning: 'soldier', roman: 'thor' },
    { char: 'ธ', name: 'ธอ-ธง', meaning: 'flag', roman: 'thor' },
    { char: 'น', name: 'นอ-หนู', meaning: 'mouse', roman: 'nor' },
    { char: 'บ', name: 'บอ-ใบไม้', meaning: 'leaf', roman: 'bor' },
    { char: 'ป', name: 'ปอ-ปลา', meaning: 'fish', roman: 'por' },
    { char: 'ผ', name: 'ผอ-ผึ้ง', meaning: 'bee', roman: 'phor' },
    { char: 'ฝ', name: 'ฝอ-ฝา', meaning: 'lid', roman: 'for' },
    { char: 'พ', name: 'พอ-พาน', meaning: 'tray', roman: 'phor' },
    { char: 'ฟ', name: 'ฟอ-ฟัน', meaning: 'tooth', roman: 'for' },
    { char: 'ภ', name: 'ภอ-สำเภา', meaning: 'junk', roman: 'phor' },
    { char: 'ม', name: 'มอ-ม้า', meaning: 'horse', roman: 'mor' },
    { char: 'ย', name: 'ยอ-ยักษ์', meaning: 'giant', roman: 'yor' },
    { char: 'ร', name: 'รอ-เรือ', meaning: 'boat', roman: 'ror' },
    { char: 'ล', name: 'ลอ-ลิง', meaning: 'monkey', roman: 'lor' },
    { char: 'ว', name: 'วอ-แหวน', meaning: 'ring', roman: 'wor' },
    { char: 'ศ', name: 'ศอ-ศาลา', meaning: 'pavilion', roman: 'sor' },
    { char: 'ษ', name: 'ษอ-ฤาษี', meaning: 'hermit', roman: 'sor' },
    { char: 'ส', name: 'สอ-เสือ', meaning: 'tiger', roman: 'sor' },
    { char: 'ห', name: 'หอ-หีบ', meaning: 'box', roman: 'hor' },
    { char: 'ฬ', name: 'ฬอ-จุฬา', meaning: 'kite', roman: 'lor' },
    { char: 'อ', name: 'ออ-อ่าง', meaning: 'basin', roman: 'or' },
    { char: 'ฮ', name: 'ฮอ-นกฮูก', meaning: 'owl', roman: 'hor' }
  ];

  return fallbackData.map(item => ({
    ...item,
    image: `/src/assets/letters/${item.char.toLowerCase()}_${item.roman}.png`,
    level: 'Beginner',
    lessonKey: 'consonants_basic'
  }));
};

/**
 * Fallback greetings data
 */
const getGreetingsFallback = () => {
  const fallbackData = [
    { thai: "สวัสดี", roman: "sa-wat-dee", meaning: "hello", example: "สวัสดีครับ / สวัสดีค่ะ", tts: "สวัสดี", emoji: "👋" },
    { thai: "ขอบคุณ", roman: "khob-khun", meaning: "thank you", example: "ขอบคุณมากครับ / ขอบคุณค่ะ", tts: "ขอบคุณ", emoji: "🙏" },
    { thai: "ขอโทษ", roman: "kho-thot", meaning: "sorry / excuse me", example: "ขอโทษครับ / ขอโทษค่ะ", tts: "ขอโทษ", emoji: "😔" },
    { thai: "ลาก่อน", roman: "la-korn", meaning: "goodbye", example: "ลาก่อน แล้วพบกันใหม่", tts: "ลาก่อน", emoji: "👋" },
    { thai: "ฝันดี", roman: "fan-dee", meaning: "good night", example: "ฝันดีนะครับ / ฝันดีค่ะ", tts: "ฝันดี", emoji: "🌙" },
    { thai: "สบายดีไหม", roman: "sa-bai-dee-mai", meaning: "how are you?", example: "สบายดีไหมครับ / สบายดีไหมคะ", tts: "สบายดีไหม", emoji: "🙂" },
    { thai: "ยินดีที่ได้รู้จัก", roman: "yin-dee-tee-dai-roo-jak", meaning: "nice to meet you", example: "ยินดีที่ได้รู้จักครับ / ค่ะ", tts: "ยินดีที่ได้รู้จัก", emoji: "🤝" },
    { thai: "ขอให้โชคดี", roman: "kho-hai-chok-dee", meaning: "good luck", example: "ขอให้โชคดีนะ", tts: "ขอให้โชคดี", emoji: "🍀" },
    { thai: "ขอให้มีความสุข", roman: "kho-hai-mee-khwam-suk", meaning: "be happy / have a nice day", example: "ขอให้มีความสุขทุกวัน", tts: "ขอให้มีความสุข", emoji: "😊" },
    { thai: "ยินดีต้อนรับ", roman: "yin-dee-ton-rub", meaning: "welcome", example: "ยินดีต้อนรับสู่ประเทศไทย", tts: "ยินดีต้อนรับ", emoji: "🏠" }
  ];

  return fallbackData.map(item => ({
    ...item,
    category: 'greetings',
    lesson: 3,
    level: 'Beginner',
    type: 'greeting',
    image: `/src/assets/greetings/${item.thai}.png`
  }));
};

/**
 * Get image path for consonant
 */
export const getConsonantImagePath = (consonant) => {
  if (consonant.image) {
    return consonant.image;
  }
  
  // Generate fallback path
  const char = consonant.char || consonant.thai;
  const roman = consonant.roman || 'unknown';
  return `/src/assets/letters/${char.toLowerCase()}_${roman}.png`;
};

/**
 * Get display name for consonant
 */
export const getConsonantDisplayName = (consonant) => {
  return consonant.name || consonant.exampleTH || `${consonant.char}-${consonant.meaning}`;
};

/**
 * Get greetings with fallback
 */
export const getGreetingsWithFallback = async () => {
  try {
    return await fetchGreetings();
  } catch (error) {
    console.warn('⚠️ Using fallback greetings data:', error.message);
    return getGreetingsFallback();
  }
};

// Alias for compatibility
export const getConsonants = fetchConsonants;
export const getVowels = fetchVowels;
export const getGreetings = fetchGreetings;

export default {
  fetchConsonants,
  getConsonants,
  getConsonantsWithFallback,
  getConsonantImagePath,
  getConsonantDisplayName,
  fetchVowels,
  getVowels,
  getVowelsWithFallback,
  fetchGreetings,
  getGreetings,
  getGreetingsWithFallback
};
