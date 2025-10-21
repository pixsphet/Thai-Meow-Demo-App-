const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Define Greeting schema inline
const greetingSchema = new mongoose.Schema({
  thai: { type: String, required: true },
  roman: { type: String },
  en: { type: String },
  meaningTH: { type: String },
  meaningEN: { type: String },
  exampleTH: { type: String },
  exampleEN: { type: String },
  category: { type: String, default: 'thai-greetings' },
  level: { type: String, default: 'Beginner' },
  imagePath: { type: String },
  audioText: { type: String },
  tags: [String],
  difficulty: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Greeting = mongoose.model('Greeting', greetingSchema);

const greetingsData = [
  {
    thai: 'สวัสดี',
    roman: 'sa-wat-dee',
    en: 'hello',
    meaningTH: 'ทักทาย/สวัสดี',
    meaningEN: 'greetings',
    exampleTH: 'สวัสดีครับ/ค่ะ',
    exampleEN: 'Hello.',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/สวัสดี.png',
    audioText: 'สวัสดี',
    tags: ['common', 'polite'],
    difficulty: 1,
    isActive: true,
  },
  {
    thai: 'ขอโทษ',
    roman: 'kho-thot',
    en: 'sorry',
    meaningTH: 'ขออภัย',
    meaningEN: 'apologize',
    exampleTH: 'ขอโทษนะครับ/คะ',
    exampleEN: "I'm sorry.",
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/ขอโทษ.png',
    audioText: 'ขอโทษ',
    tags: ['common', 'polite'],
    difficulty: 1,
    isActive: true,
  },
  {
    thai: 'ขอบคุณ',
    roman: 'khob-khun',
    en: 'thank you',
    meaningTH: 'ขอบคุณ',
    meaningEN: 'gratitude',
    exampleTH: 'ขอบคุณมากครับ/ค่ะ',
    exampleEN: 'Thank you very much.',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/ขอบคุณ.png',
    audioText: 'ขอบคุณ',
    tags: ['common', 'polite'],
    difficulty: 1,
    isActive: true,
  },
  {
    thai: 'ขอให้โชคดี',
    roman: 'kho-hai-chok-dee',
    en: 'good luck',
    meaningTH: 'ขอให้โชคดี',
    meaningEN: 'wish of luck',
    exampleTH: 'ขอให้โชคดีนะ',
    exampleEN: 'Good luck!',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/ขอให้โชคดี.png',
    audioText: 'ขอให้โชคดี',
    tags: ['polite', 'encouraging'],
    difficulty: 2,
    isActive: true,
  },
  {
    thai: 'ขอให้มีความสุข',
    roman: 'kho-hai-mee-khwam-suk',
    en: 'be happy',
    meaningTH: 'ขอให้มีความสุข',
    meaningEN: 'well-wishing',
    exampleTH: 'ขอให้มีความสุขทุกวัน',
    exampleEN: 'Be happy every day.',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/ขอให้มีความสุข.png',
    audioText: 'ขอให้มีความสุข',
    tags: ['polite', 'kind'],
    difficulty: 2,
    isActive: true,
  },
  {
    thai: 'ฝันดี',
    roman: 'fan-dee',
    en: 'good night',
    meaningTH: 'ฝันดี/ราตรีสวัสดิ์',
    meaningEN: 'farewell at night',
    exampleTH: 'ฝันดีนะครับ/ค่ะ',
    exampleEN: 'Good night.',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/ฝันดี.png',
    audioText: 'ฝันดี',
    tags: ['common', 'evening'],
    difficulty: 1,
    isActive: true,
  },
  {
    thai: 'ยินดีต้อนรับ',
    roman: 'yin-dee-ton-rab',
    en: 'welcome',
    meaningTH: 'ยินดีต้อนรับ',
    meaningEN: 'hospitality',
    exampleTH: 'ยินดีต้อนรับค่ะ/ครับ',
    exampleEN: 'Welcome.',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/ยินดีต้อนรับ.png',
    audioText: 'ยินดีต้อนรับ',
    tags: ['polite', 'hospitality'],
    difficulty: 2,
    isActive: true,
  },
  {
    thai: 'ยินดีที่ได้รู้จัก',
    roman: 'yin-dee-tee-dai-roo-jak',
    en: 'nice to meet you',
    meaningTH: 'ยินดีที่ได้รู้จัก',
    meaningEN: 'first meeting',
    exampleTH: 'ยินดีที่ได้รู้จักครับ/ค่ะ',
    exampleEN: 'Nice to meet you.',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/ยินดีที่ได้รู้จัก.png',
    audioText: 'ยินดีที่ได้รู้จัก',
    tags: ['polite', 'meeting'],
    difficulty: 2,
    isActive: true,
  },
  {
    thai: 'ลาก่อน',
    roman: 'la-korn',
    en: 'goodbye',
    meaningTH: 'ลาก่อน/บิดา',
    meaningEN: 'farewell',
    exampleTH: 'ลาก่อน แล้วพบกันใหม่',
    exampleEN: 'Goodbye, see you again.',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/ลาก่อน.png',
    audioText: 'ลาก่อน',
    tags: ['common', 'farewell'],
    difficulty: 1,
    isActive: true,
  },
  {
    thai: 'สบายดีไหม',
    roman: 'sa-bai-dee-mai',
    en: 'how are you',
    meaningTH: 'สอบถามสุขภาพ',
    meaningEN: 'inquiry of health',
    exampleTH: 'สบายดีไหมครับ/คะ',
    exampleEN: 'How are you?',
    category: 'thai-greetings',
    level: 'Beginner',
    imagePath: 'greetings/สบายดีไหม.png',
    audioText: 'สบายดีไหม',
    tags: ['common', 'polite'],
    difficulty: 1,
    isActive: true,
  },
];

const seedGreetings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/thai-meow', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Clear existing greetings
    await Greeting.deleteMany({});
    console.log('🗑️  Cleared existing greetings');

    // Insert new data
    const inserted = await Greeting.insertMany(greetingsData);
    console.log(`✅ Seeded ${inserted.length} greetings`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding greetings:', error);
    process.exit(1);
  }
};

seedGreetings();
