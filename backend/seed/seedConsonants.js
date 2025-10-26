const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vocab = require('../models/Vocab');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

// ข้อมูลพยัญชนะไทย 44 ตัว
const consonantsData = [
  { thai: 'ก', nameTH: 'กอ-ไก่', en: 'chicken', roman: 'gor', imagePath: '/src/assets/letters/ko_kai.png' },
  { thai: 'ข', nameTH: 'ขอ-ไข่', en: 'egg', roman: 'khor', imagePath: '/src/assets/letters/kho_khai.png' },
  { thai: 'ฃ', nameTH: 'ฃอ-ขวด', en: 'bottle', roman: 'khor', imagePath: '/src/assets/letters/kho_khuat.png' },
  { thai: 'ค', nameTH: 'คอ-ควาย', en: 'buffalo', roman: 'khor', imagePath: '/src/assets/letters/kho_khwai.png' },
  { thai: 'ฅ', nameTH: 'ฅอ-คน', en: 'person', roman: 'khor', imagePath: '/src/assets/letters/kho_khon.png' },
  { thai: 'ฆ', nameTH: 'ฆอ-ระฆัง', en: 'bell', roman: 'khor', imagePath: '/src/assets/letters/kho_rakhang.png' },
  { thai: 'ง', nameTH: 'งอ-งู', en: 'snake', roman: 'ngor', imagePath: '/src/assets/letters/ngo_ngu.png' },
  { thai: 'จ', nameTH: 'จอ-จาน', en: 'plate', roman: 'jor', imagePath: '/src/assets/letters/jo_jan.png' },
  { thai: 'ฉ', nameTH: 'ฉอ-ฉิ่ง', en: 'cymbals', roman: 'chor', imagePath: '/src/assets/letters/cho_ching.png' },
  { thai: 'ช', nameTH: 'ชอ-ช้าง', en: 'elephant', roman: 'chor', imagePath: '/src/assets/letters/cho_chang.png' },
  { thai: 'ซ', nameTH: 'ซอ-โซ่', en: 'chain', roman: 'sor', imagePath: '/src/assets/letters/so_so.png' },
  { thai: 'ฌ', nameTH: 'ฌอ-เฌอ', en: 'tree', roman: 'chor', imagePath: '/src/assets/letters/cho_cho.png' },
  { thai: 'ญ', nameTH: 'ญอ-หญิง', en: 'woman', roman: 'yor', imagePath: '/src/assets/letters/yo_ying.png' },
  { thai: 'ฎ', nameTH: 'ฎอ-ชฎา', en: 'crown', roman: 'dor', imagePath: '/src/assets/letters/do_chada.png' },
  { thai: 'ฏ', nameTH: 'ฏอ-ปฏัก', en: 'goad', roman: 'tor', imagePath: '/src/assets/letters/to_patak.png' },
  { thai: 'ฐ', nameTH: 'ฐอ-ฐาน', en: 'base', roman: 'thor', imagePath: '/src/assets/letters/tho_than.png' },
  { thai: 'ฑ', nameTH: 'ฑอ-มณโฑ', en: 'doll', roman: 'thor', imagePath: '/src/assets/letters/tho_montho.png' },
  { thai: 'ฒ', nameTH: 'ฒอ-ผู้เฒ่า', en: 'elder', roman: 'thor', imagePath: '/src/assets/letters/tho_phuthao.png' },
  { thai: 'ณ', nameTH: 'ณอ-เณร', en: 'novice', roman: 'nor', imagePath: '/src/assets/letters/no_nen.png' },
  { thai: 'ด', nameTH: 'ดอ-เด็ก', en: 'child', roman: 'dor', imagePath: '/src/assets/letters/do_dek.png' },
  { thai: 'ต', nameTH: 'ตอ-เต่า', en: 'turtle', roman: 'tor', imagePath: '/src/assets/letters/to_tao.png' },
  { thai: 'ถ', nameTH: 'ถอ-ถุง', en: 'bag', roman: 'thor', imagePath: '/src/assets/letters/tho_thung.png' },
  { thai: 'ท', nameTH: 'ทอ-ทหาร', en: 'soldier', roman: 'thor', imagePath: '/src/assets/letters/tho_thahan.png' },
  { thai: 'ธ', nameTH: 'ธอ-ธง', en: 'flag', roman: 'thor', imagePath: '/src/assets/letters/tho_thong.png' },
  { thai: 'น', nameTH: 'นอ-หนู', en: 'mouse', roman: 'nor', imagePath: '/src/assets/letters/no_nu.png' },
  { thai: 'บ', nameTH: 'บอ-ใบไม้', en: 'leaf', roman: 'bor', imagePath: '/src/assets/letters/bo_baimai.png' },
  { thai: 'ป', nameTH: 'ปอ-ปลา', en: 'fish', roman: 'por', imagePath: '/src/assets/letters/po_pla.png' },
  { thai: 'ผ', nameTH: 'ผอ-ผึ้ง', en: 'bee', roman: 'phor', imagePath: '/src/assets/letters/pho_phueng.png' },
  { thai: 'ฝ', nameTH: 'ฝอ-ฝา', en: 'lid', roman: 'for', imagePath: '/src/assets/letters/fo_fa.png' },
  { thai: 'พ', nameTH: 'พอ-พาน', en: 'tray', roman: 'phor', imagePath: '/src/assets/letters/pho_phan.png' },
  { thai: 'ฟ', nameTH: 'ฟอ-ฟัน', en: 'tooth', roman: 'for', imagePath: '/src/assets/letters/fo_fan.png' },
  { thai: 'ภ', nameTH: 'ภอ-สำเภา', en: 'junk', roman: 'phor', imagePath: '/src/assets/letters/pho_samphao.png' },
  { thai: 'ม', nameTH: 'มอ-ม้า', en: 'horse', roman: 'mor', imagePath: '/src/assets/letters/mo_ma.png' },
  { thai: 'ย', nameTH: 'ยอ-ยักษ์', en: 'giant', roman: 'yor', imagePath: '/src/assets/letters/yo_yak.png' },
  { thai: 'ร', nameTH: 'รอ-เรือ', en: 'boat', roman: 'ror', imagePath: '/src/assets/letters/ro_ruea.png' },
  { thai: 'ล', nameTH: 'ลอ-ลิง', en: 'monkey', roman: 'lor', imagePath: '/src/assets/letters/lo_ling.png' },
  { thai: 'ว', nameTH: 'วอ-แหวน', en: 'ring', roman: 'wor', imagePath: '/src/assets/letters/wo_waen.png' },
  { thai: 'ศ', nameTH: 'ศอ-ศาลา', en: 'pavilion', roman: 'sor', imagePath: '/src/assets/letters/so_sala.png' },
  { thai: 'ษ', nameTH: 'ษอ-ฤาษี', en: 'hermit', roman: 'sor', imagePath: '/src/assets/letters/so_ruesi.png' },
  { thai: 'ส', nameTH: 'สอ-เสือ', en: 'tiger', roman: 'sor', imagePath: '/src/assets/letters/so_suea.png' },
  { thai: 'ห', nameTH: 'หอ-หีบ', en: 'box', roman: 'hor', imagePath: '/src/assets/letters/ho_hip.png' },
  { thai: 'ฬ', nameTH: 'ฬอ-จุฬา', en: 'kite', roman: 'lor', imagePath: '/src/assets/letters/lo_chula.png' },
  { thai: 'อ', nameTH: 'ออ-อ่าง', en: 'basin', roman: 'or', imagePath: '/src/assets/letters/o_ang.png' },
  { thai: 'ฮ', nameTH: 'ฮอ-นกฮูก', en: 'owl', roman: 'hor', imagePath: '/src/assets/letters/ho_nokhuk.png' }
];

const seedConsonants = async (options = {}) => {
  const { mongoUri = process.env.MONGODB_URI, skipConnect = false } = options;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    console.log('🌱 Starting to seed consonants...');

    if (!skipConnect) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    // Clear existing consonants
    await Vocab.deleteMany({ category: 'thai-consonants' });
    console.log('🗑️ Cleared existing consonants');

    // Insert new consonants
    const consonantsToInsert = consonantsData.map(consonant => ({
      ...consonant,
      category: 'thai-consonants',
      level: 'Beginner',
      type: 'consonant',
      isActive: true,
      difficulty: 1
    }));

    const result = await Vocab.insertMany(consonantsToInsert);
    console.log(`✅ Successfully seeded ${result.length} consonants`);

    // Verify the data
    const count = await Vocab.countDocuments({ category: 'thai-consonants' });
    console.log(`📊 Total consonants in database: ${count}`);

    return result;
  } catch (error) {
    console.error('❌ Error seeding consonants:', error);
    throw error;
  } finally {
    if (!skipConnect) {
      await mongoose.disconnect();
    }
  }
};

// Run if called directly
if (require.main === module) {
  seedConsonants()
    .then(() => {
      console.log('🎉 Consonants seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedConsonants;
