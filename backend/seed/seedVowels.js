const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Vocab = require('../models/Vocab');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const vowels = [
  { thai: 'อะ', nameTH: 'สระอะ', en: 'short a', roman: 'a', imagePath: 'vowels/อะ.jpg' },
  { thai: 'อา', nameTH: 'สระอา', en: 'long aa', roman: 'aa', imagePath: 'vowels/อา.jpg' },
  { thai: 'อิ', nameTH: 'สระอิ', en: 'short i', roman: 'i', imagePath: 'vowels/อิ.jpg' },
  { thai: 'อี', nameTH: 'สระอี', en: 'long ii', roman: 'ii', imagePath: 'vowels/อี.jpg' },
  { thai: 'อึ', nameTH: 'สระอึ', en: 'short ue', roman: 'ue', imagePath: 'vowels/อึ.jpg' },
  { thai: 'อือ', nameTH: 'สระอือ', en: 'long uee', roman: 'uee', imagePath: 'vowels/อือ.jpg' },
  { thai: 'อุ', nameTH: 'สระอุ', en: 'short u', roman: 'u', imagePath: 'vowels/อุ.jpg' },
  { thai: 'อู', nameTH: 'สระอู', en: 'long uu', roman: 'uu', imagePath: 'vowels/อู.jpg' },
  { thai: 'เอะ', nameTH: 'สระเอะ', en: 'short e', roman: 'e (short)', imagePath: 'vowels/เอะ.jpg' },
  { thai: 'เอ', nameTH: 'สระเอ', en: 'long e', roman: 'e', imagePath: 'vowels/เอ.jpg' },
  { thai: 'แอะ', nameTH: 'สระแอะ', en: 'short ae', roman: 'ae (short)', imagePath: 'vowels/แอะ.jpg' },
  { thai: 'แอ', nameTH: 'สระแอ', en: 'long ae', roman: 'ae', imagePath: 'vowels/แอ.jpg' },
  { thai: 'โอะ', nameTH: 'สระโอะ', en: 'short o', roman: 'o (short)', imagePath: 'vowels/โอะ.jpg' },
  { thai: 'โอ', nameTH: 'สระโอ', en: 'long o', roman: 'o', imagePath: 'vowels/โอ.jpg' },
  { thai: 'เอาะ', nameTH: 'สระเอาะ', en: 'short aw', roman: 'aw (short)', imagePath: 'vowels/เอาะ.jpg' },
  { thai: 'ออ', nameTH: 'สระออ', en: 'long aw', roman: 'aw', imagePath: 'vowels/ออ.jpg' },
  { thai: 'เออะ', nameTH: 'สระเออะ', en: 'short oe', roman: 'oe (short)', imagePath: 'vowels/เออะ.jpg' },
  { thai: 'เออ', nameTH: 'สระเออ', en: 'long oe', roman: 'oe', imagePath: 'vowels/เออ.jpg' },
  { thai: 'เอียะ', nameTH: 'สระเอียะ', en: 'short ia', roman: 'ia (short)', imagePath: 'vowels/เอียะ.jpg' },
  { thai: 'เอีย', nameTH: 'สระเอีย', en: 'long ia', roman: 'ia', imagePath: 'vowels/เอีย.jpg' },
  { thai: 'เอือะ', nameTH: 'สระเอือะ', en: 'short uea', roman: 'uea (short)', imagePath: 'vowels/เอือะ.jpg' },
  { thai: 'เอือ', nameTH: 'สระเอือ', en: 'long uea', roman: 'uea', imagePath: 'vowels/เอือ.jpg' },
  { thai: 'อัวะ', nameTH: 'สระอัวะ', en: 'short ua', roman: 'ua (short)', imagePath: 'vowels/อัวะ.jpg' },
  { thai: 'อัว', nameTH: 'สระอัว', en: 'long ua', roman: 'ua', imagePath: 'vowels/อัว.jpg' },
  { thai: 'อำ', nameTH: 'สระอำ', en: 'am', roman: 'am', imagePath: 'vowels/อำ.jpg' },
  { thai: 'ใอ', nameTH: 'สระใอ', en: 'ai (mai muan)', roman: 'ai', imagePath: 'vowels/ใอ.jpg' },
  { thai: 'ไอ', nameTH: 'สระไอ', en: 'ai (mai malai)', roman: 'ai', imagePath: 'vowels/ไอ.jpg' },
  { thai: 'ฤ', nameTH: 'สระฤ', en: 'ri', roman: 'ri', imagePath: 'vowels/ฤ.jpg' },
  { thai: 'ฤๅ', nameTH: 'สระฤๅ', en: 'rue', roman: 'rue', imagePath: 'vowels/ฤๅ.jpg' },
  { thai: 'ฦ', nameTH: 'สระฦ', en: 'lue (short)', roman: 'lue', imagePath: 'vowels/ฦ.jpg' },
  { thai: 'ฦๅ', nameTH: 'สระฦๅ', en: 'lue (long)', roman: 'luee', imagePath: 'vowels/ฦๅ.jpg' },
];

const upsertVowel = async (vowel) => {
  await Vocab.findOneAndUpdate(
    { thai: vowel.thai },
    {
      thai: vowel.thai,
      nameTH: vowel.nameTH,
      en: vowel.en,
      roman: vowel.roman,
      category: 'thai-vowels',
      level: 'Beginner',
      imagePath: vowel.imagePath,
      difficulty: 1,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set in config.env');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🌱 Connected to MongoDB – seeding Thai vowels');

    for (const vowel of vowels) {
      await upsertVowel(vowel);
      console.log(`✅ Upserted ${vowel.thai}`);
    }

    console.log(`🎉 Seeded ${vowels.length} Thai vowels successfully`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed Thai vowels:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
