/**
 * Placeholder images for Thai consonants
 * This file provides fallback images when actual consonant images are not available
 */

// For now, we'll use a simple text-based placeholder
// In production, replace these with actual consonant illustrations

export const getConsonantPlaceholder = (consonant, roman) => {
  // Return a simple text representation
  return {
    uri: `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#FFE0B2" rx="20"/>
        <text x="100" y="80" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#FF6B35">${consonant}</text>
        <text x="100" y="120" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#666">${roman}</text>
      </svg>
    `).toString('base64')}`
  };
};

// List of all consonant placeholders
export const consonantPlaceholders = {
  'ko_kai': getConsonantPlaceholder('ก', 'gor'),
  'kho_khai': getConsonantPlaceholder('ข', 'khor'),
  'kho_khuat': getConsonantPlaceholder('ฃ', 'khor'),
  'kho_khwai': getConsonantPlaceholder('ค', 'khor'),
  'kho_khon': getConsonantPlaceholder('ฅ', 'khor'),
  'kho_rakhang': getConsonantPlaceholder('ฆ', 'khor'),
  'ngo_ngu': getConsonantPlaceholder('ง', 'ngor'),
  'jo_jan': getConsonantPlaceholder('จ', 'jor'),
  'cho_ching': getConsonantPlaceholder('ฉ', 'chor'),
  'cho_chang': getConsonantPlaceholder('ช', 'chor'),
  'so_so': getConsonantPlaceholder('ซ', 'sor'),
  'cho_cho': getConsonantPlaceholder('ฌ', 'chor'),
  'yo_ying': getConsonantPlaceholder('ญ', 'yor'),
  'do_chada': getConsonantPlaceholder('ฎ', 'dor'),
  'to_patak': getConsonantPlaceholder('ฏ', 'tor'),
  'tho_than': getConsonantPlaceholder('ฐ', 'thor'),
  'tho_montho': getConsonantPlaceholder('ฑ', 'thor'),
  'tho_phuthao': getConsonantPlaceholder('ฒ', 'thor'),
  'no_nen': getConsonantPlaceholder('ณ', 'nor'),
  'do_dek': getConsonantPlaceholder('ด', 'dor'),
  'to_tao': getConsonantPlaceholder('ต', 'tor'),
  'tho_thung': getConsonantPlaceholder('ถ', 'thor'),
  'tho_thahan': getConsonantPlaceholder('ท', 'thor'),
  'tho_thong': getConsonantPlaceholder('ธ', 'thor'),
  'no_nu': getConsonantPlaceholder('น', 'nor'),
  'bo_baimai': getConsonantPlaceholder('บ', 'bor'),
  'po_pla': getConsonantPlaceholder('ป', 'por'),
  'pho_phueng': getConsonantPlaceholder('ผ', 'phor'),
  'fo_fa': getConsonantPlaceholder('ฝ', 'for'),
  'pho_phan': getConsonantPlaceholder('พ', 'phor'),
  'fo_fan': getConsonantPlaceholder('ฟ', 'for'),
  'pho_samphao': getConsonantPlaceholder('ภ', 'phor'),
  'mo_ma': getConsonantPlaceholder('ม', 'mor'),
  'yo_yak': getConsonantPlaceholder('ย', 'yor'),
  'ro_ruea': getConsonantPlaceholder('ร', 'ror'),
  'lo_ling': getConsonantPlaceholder('ล', 'lor'),
  'wo_waen': getConsonantPlaceholder('ว', 'wor'),
  'so_sala': getConsonantPlaceholder('ศ', 'sor'),
  'so_ruesi': getConsonantPlaceholder('ษ', 'sor'),
  'so_suea': getConsonantPlaceholder('ส', 'sor'),
  'ho_hip': getConsonantPlaceholder('ห', 'hor'),
  'lo_chula': getConsonantPlaceholder('ฬ', 'lor'),
  'o_ang': getConsonantPlaceholder('อ', 'or'),
  'ho_nokhuk': getConsonantPlaceholder('ฮ', 'hor')
};

export default consonantPlaceholders;
