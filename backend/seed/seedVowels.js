/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vocab = require('../models/Vocab');

dotenv.config({ path: '../config.env' });

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGODB_URL ||
  'mongodb://127.0.0.1:27017/thai-meow';

const vowels = [
  { thai: 'อะ', nameTH: 'สระ อะ', en: 'short a', roman: 'a' },
  { thai: 'อา', nameTH: 'สระ อา', en: 'long a', roman: 'aa' },
  { thai: 'อิ', nameTH: 'สระ อิ', en: 'short i', roman: 'i' },
  { thai: 'อี', nameTH: 'สระ อี', en: 'long i', roman: 'ii' },
  { thai: 'อึ', nameTH: 'สระ อึ', en: 'short ue', roman: 'ue' },
  { thai: 'อื', nameTH: 'สระ อื', en: 'long ue', roman: 'uee' },
  { thai: 'อุ', nameTH: 'สระ อุ', en: 'short u', roman: 'u' },
  { thai: 'อู', nameTH: 'สระ อู', en: 'long u', roman: 'uu' },
  { thai: 'เอะ', nameTH: 'สระ เอะ', en: 'short e', roman: 'e' },
  { thai: 'เอ', nameTH: 'สระ เอ', en: 'long e', roman: 'ee' },
  { thai: 'แอะ', nameTH: 'สระ แอะ', en: 'short ae', roman: 'ae' },
  { thai: 'แอ', nameTH: 'สระ แอ', en: 'long ae', roman: 'aee' },
  { thai: 'โอะ', nameTH: 'สระ โอะ', en: 'short o', roman: 'o' },
  { thai: 'โอ', nameTH: 'สระ โอ', en: 'long o', roman: 'oo' },
  { thai: 'เอาะ', nameTH: 'สระ เอาะ', en: 'short aw', roman: 'aw' },
  { thai: 'ออ', nameTH: 'สระ ออ', en: 'long aw', roman: 'aww' },
  { thai: 'เออะ', nameTH: 'สระ เออะ', en: 'short oe', roman: 'oe' },
  { thai: 'เออ', nameTH: 'สระ เออ', en: 'long oe', roman: 'oeo' },
  { thai: 'เอียะ', nameTH: 'สระ เอียะ', en: 'short ia', roman: 'ia' },
  { thai: 'เอีย', nameTH: 'สระ เอีย', en: 'long ia', roman: 'iaa' },
  { thai: 'เอือะ', nameTH: 'สระ เอือะ', en: 'short uea', roman: 'uea' },
  { thai: 'เอือ', nameTH: 'สระ เอือ', en: 'long uea', roman: 'ueaa' },
  { thai: 'อัวะ', nameTH: 'สระ อัวะ', en: 'short ua', roman: 'ua' },
  { thai: 'อัว', nameTH: 'สระ อัว', en: 'long ua', roman: 'uaa' },
  { thai: 'เอา', nameTH: 'สระ เอา', en: 'au', roman: 'ao' },
  { thai: 'ใอ', nameTH: 'สระ ใอ', en: 'ai mai muan', roman: 'ai' },
  { thai: 'ไอ', nameTH: 'สระ ไอ', en: 'ai mai malai', roman: 'aii' },
  { thai: 'อำ', nameTH: 'สระ อำ', en: 'am', roman: 'am' },
  { thai: 'ฤ', nameTH: 'สระ ฤ', en: 'rue short', roman: 'rue' },
  { thai: 'ฤๅ', nameTH: 'สระ ฤๅ', en: 'rue long', roman: 'ruee' },
  { thai: 'ฦ', nameTH: 'สระ ฦ', en: 'lue short', roman: 'lue' },
  { thai: 'ฦๅ', nameTH: 'สระ ฦๅ', en: 'lue long', roman: 'luee' },
];

const buildVowelDoc = (vowel) => ({
  thai: vowel.thai,
  nameTH: vowel.nameTH,
  en: vowel.en,
  roman: vowel.roman,
  category: 'thai-vowels',
  level: 'Beginner',
  difficulty: 1,
  imagePath: `/assets/vowels/${encodeURIComponent(vowel.thai)}.png`,
  audioUrl: '',
});

async function seedVowels() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('🌱 Seeding Thai vowels into MongoDB...');

  let inserted = 0;
  let updated = 0;

  for (const vowel of vowels) {
    const update = buildVowelDoc(vowel);
    const result = await Vocab.updateOne(
      { thai: vowel.thai, category: 'thai-vowels' },
      { $set: update },
      { upsert: true }
    );

    if (result.upsertedCount && result.upsertedCount > 0) {
      inserted += 1;
    } else if (result.modifiedCount && result.modifiedCount > 0) {
      updated += 1;
    }
  }

  const total = await Vocab.countDocuments({ category: 'thai-vowels' });

  console.log(`✅ Seeded/updated Thai vowels successfully!`);
  console.log(`   ➜ Inserted new: ${inserted}`);
  console.log(`   ➜ Updated existing: ${updated}`);
  console.log(`   ➜ Total vowels in database: ${total}`);

  await mongoose.connection.close();
}

seedVowels()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error seeding vowels:', error);
    mongoose.connection.close(() => process.exit(1));
  });
