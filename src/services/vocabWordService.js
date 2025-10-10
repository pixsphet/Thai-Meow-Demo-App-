import apiClient from './apiClient';

/**
 * Service for fetching vocabulary data, specifically consonants
 */
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

// Alias for compatibility
export const getConsonants = fetchConsonants;

export default {
  fetchConsonants,
  getConsonants,
  getConsonantsWithFallback,
  getConsonantImagePath,
  getConsonantDisplayName
};