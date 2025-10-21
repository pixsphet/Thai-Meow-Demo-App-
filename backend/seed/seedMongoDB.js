const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../config.env' });

// Import models
const User = require('../models/User');
const Vocab = require('../models/Vocab');
const Progress = require('../models/Progress');

// Import seed functions
const { seedGreetings } = require('./seedGreetings');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb+srv://2755petchanan_db_user:19202546@cluster0.lu8vz2p.mongodb.net/thai-meow?retryWrites=true&w=majority&appName=Cluster0',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Thai consonants data
const thaiConsonants = [
  { char: 'ก', name: 'กอ-ไก่', meaning: 'ไก่', english: 'chicken', roman: 'gor' },
  { char: 'ข', name: 'ขอ-ไข่', meaning: 'ไข่', english: 'egg', roman: 'kor' },
  { char: 'ค', name: 'คอ-ควาย', meaning: 'ควาย', english: 'buffalo', roman: 'kor' },
  { char: 'ง', name: 'งอ-งู', meaning: 'งู', english: 'snake', roman: 'ngor' },
  { char: 'จ', name: 'จอ-จาน', meaning: 'จาน', english: 'plate', roman: 'jor' },
  { char: 'ฉ', name: 'ฉอ-ฉิ่ง', meaning: 'ฉิ่ง', english: 'cymbals', roman: 'chor' },
  { char: 'ช', name: 'ชอ-ช้าง', meaning: 'ช้าง', english: 'elephant', roman: 'chor' },
  { char: 'ซ', name: 'ซอ-โซ่', meaning: 'โซ่', english: 'chain', roman: 'sor' },
  { char: 'ญ', name: 'ญอ-หญิง', meaning: 'หญิง', english: 'woman', roman: 'yor' },
  { char: 'ด', name: 'ดอ-เด็ก', meaning: 'เด็ก', english: 'child', roman: 'dor' },
  { char: 'ต', name: 'ตอ-เต่า', meaning: 'เต่า', english: 'turtle', roman: 'tor' },
  { char: 'ถ', name: 'ถอ-ถุง', meaning: 'ถุง', english: 'bag', roman: 'thor' },
  { char: 'ท', name: 'ทอ-ทหาร', meaning: 'ทหาร', english: 'soldier', roman: 'thor' },
  { char: 'น', name: 'นอ-หนู', meaning: 'หนู', english: 'mouse', roman: 'nor' },
  { char: 'บ', name: 'บอ-ใบไม้', meaning: 'ใบไม้', english: 'leaf', roman: 'bor' },
  { char: 'ป', name: 'ปอ-ปลา', meaning: 'ปลา', english: 'fish', roman: 'por' },
  { char: 'ผ', name: 'ผอ-ผึ้ง', meaning: 'ผึ้ง', english: 'bee', roman: 'phor' },
  { char: 'ฝ', name: 'ฝอ-ฝา', meaning: 'ฝา', english: 'lid', roman: 'for' },
  { char: 'พ', name: 'พอ-พาน', meaning: 'พาน', english: 'tray', roman: 'phor' },
  { char: 'ฟ', name: 'ฟอ-ฟัน', meaning: 'ฟัน', english: 'tooth', roman: 'for' },
  { char: 'ม', name: 'มอ-ม้า', meaning: 'ม้า', english: 'horse', roman: 'mor' },
  { char: 'ย', name: 'ยอ-ยักษ์', meaning: 'ยักษ์', english: 'giant', roman: 'yor' },
  { char: 'ร', name: 'รอ-เรือ', meaning: 'เรือ', english: 'boat', roman: 'ror' },
  { char: 'ล', name: 'ลอ-ลิง', meaning: 'ลิง', english: 'monkey', roman: 'lor' },
  { char: 'ว', name: 'วอ-แหวน', meaning: 'แหวน', english: 'ring', roman: 'wor' },
  { char: 'ศ', name: 'ศอ-ศาลา', meaning: 'ศาลา', english: 'pavilion', roman: 'sor' },
  { char: 'ษ', name: 'ษอ-ฤาษี', meaning: 'ฤาษี', english: 'hermit', roman: 'sor' },
  { char: 'ส', name: 'สอ-เสือ', meaning: 'เสือ', english: 'tiger', roman: 'sor' },
  { char: 'ห', name: 'หอ-หีบ', meaning: 'หีบ', english: 'box', roman: 'hor' },
  { char: 'ฬ', name: 'ฬอ-จุฬา', meaning: 'จุฬา', english: 'kite', roman: 'lor' },
  { char: 'อ', name: 'ออ-อ่าง', meaning: 'อ่าง', english: 'basin', roman: 'or' },
  { char: 'ฮ', name: 'ฮอ-นกฮูก', meaning: 'นกฮูก', english: 'owl', roman: 'hor' }
];

// Sample lessons data
const lessons = [
  {
    title: 'พยัญชนะพื้นฐาน ก-ฮ',
    description: 'เรียนรู้พยัญชนะไทยพื้นฐาน 44 ตัว',
    category: 'consonants',
    level: 'Beginner',
    difficulty: 'easy',
    stageCount: 44,
    estimatedTime: 30,
    isActive: true
  },
  {
    title: 'พยัญชนะระดับกลาง',
    description: 'เรียนรู้พยัญชนะไทยระดับกลาง',
    category: 'consonants',
    level: 'Intermediate',
    difficulty: 'medium',
    stageCount: 20,
    estimatedTime: 25,
    isActive: true
  },
  {
    title: 'พยัญชนะระดับสูง',
    description: 'เรียนรู้พยัญชนะไทยระดับสูง',
    category: 'consonants',
    level: 'Advanced',
    difficulty: 'hard',
    stageCount: 15,
    estimatedTime: 20,
    isActive: true
  }
];

// Sample user data
const sampleUsers = [
  {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    petName: 'น้องเหมียว',
    hearts: 5,
    diamonds: 10,
    xp: 150,
    level: 2,
    streak: 3,
    longestStreak: 7,
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    username: 'demo',
    email: 'demo@example.com',
    password: 'demo123',
    petName: 'น้องแมว',
    hearts: 5,
    diamonds: 20,
    xp: 300,
    level: 3,
    streak: 5,
    longestStreak: 12,
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Vocab.deleteMany({});
    await Progress.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Seed users
    console.log('👤 Seeding users...');
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
    }
    console.log(`✅ Seeded ${sampleUsers.length} users`);

    // Seed vocabulary
    console.log('📚 Seeding vocabulary...');
    for (const consonant of thaiConsonants) {
      const vocab = new Vocab({
        thai: consonant.char,
        name: consonant.name,
        meaningTH: consonant.meaning,
        meaningEN: consonant.english,
        roman: consonant.roman,
        type: 'consonant',
        level: 'Beginner',
        category: 'consonants',
        imageUrl: `/assets/letters/${consonant.char}.jpg`,
        audioText: consonant.name
      });
      await vocab.save();
    }
    console.log(`✅ Seeded ${thaiConsonants.length} vocabulary items`);

    // Seed lessons
    console.log('📖 Seeding lessons...');
    for (const lesson of lessons) {
      const lessonDoc = new (require('../models/Lesson'))(lesson);
      await lessonDoc.save();
    }
    console.log(`✅ Seeded ${lessons.length} lessons`);

    // Seed greetings vocabulary
    console.log('👋 Seeding greetings vocabulary...');
    await seedGreetings();

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run seeding
connectDB().then(() => {
  seedDatabase();
});

module.exports = { seedDatabase };
