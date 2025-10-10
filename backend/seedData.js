const mongoose = require('mongoose');
const User = require('./models/User');
const Vocabulary = require('./models/Vocabulary');
const Lesson = require('./models/Lesson');
const connectDB = require('./config/database');

// Load environment variables
require('dotenv').config({ path: './config.env' });

// Thai consonants data
const consonantsData = [
  { thai: 'ก', roman: 'ko kai', meaning: 'chicken', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ข', roman: 'kho khai', meaning: 'egg', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ฃ', roman: 'kho khuat', meaning: 'bottle', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ค', roman: 'kho khwai', meaning: 'buffalo', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ฅ', roman: 'kho khon', meaning: 'person', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ฆ', roman: 'kho ra-khang', meaning: 'bell', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ง', roman: 'ngo ngu', meaning: 'snake', category: 'consonant', difficulty: 'beginner' },
  { thai: 'จ', roman: 'cho chan', meaning: 'plate', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ฉ', roman: 'cho ching', meaning: 'cymbal', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ช', roman: 'cho chang', meaning: 'elephant', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ซ', roman: 'so so', meaning: 'chain', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ฌ', roman: 'cho choe', meaning: 'tree', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ญ', roman: 'yo ying', meaning: 'woman', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ฎ', roman: 'do chada', meaning: 'crown', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ฏ', roman: 'to patak', meaning: 'goat', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ฐ', roman: 'tho than', meaning: 'base', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ฑ', roman: 'tho montho', meaning: 'montho', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ฒ', roman: 'tho phu', meaning: 'elder', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ณ', roman: 'no nen', meaning: 'monk', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ด', roman: 'do dek', meaning: 'child', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ต', roman: 'to tao', meaning: 'turtle', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ถ', roman: 'tho thung', meaning: 'bag', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ท', roman: 'tho thahan', meaning: 'soldier', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ธ', roman: 'tho thong', meaning: 'flag', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'น', roman: 'no nu', meaning: 'mouse', category: 'consonant', difficulty: 'beginner' },
  { thai: 'บ', roman: 'bo baimai', meaning: 'leaf', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ป', roman: 'po pla', meaning: 'fish', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ผ', roman: 'pho phueng', meaning: 'bee', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ฝ', roman: 'fo fa', meaning: 'lid', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'พ', roman: 'pho phan', meaning: 'phan', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ฟ', roman: 'fo fan', meaning: 'fan', category: 'consonant', difficulty: 'intermediate' },
  { thai: 'ภ', roman: 'pho samphao', meaning: 'junk', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ม', roman: 'mo ma', meaning: 'horse', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ย', roman: 'yo yak', meaning: 'giant', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ร', roman: 'ro ruea', meaning: 'boat', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ล', roman: 'lo ling', meaning: 'monkey', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ว', roman: 'wo waen', meaning: 'ring', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ศ', roman: 'so sala', meaning: 'pavilion', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ษ', roman: 'so ruesi', meaning: 'hermit', category: 'consonant', difficulty: 'advanced' },
  { thai: 'ส', roman: 'so sua', meaning: 'tiger', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ห', roman: 'ho hip', meaning: 'chest', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ฬ', roman: 'lo chula', meaning: 'kite', category: 'consonant', difficulty: 'advanced' },
  { thai: 'อ', roman: 'o ang', meaning: 'basin', category: 'consonant', difficulty: 'beginner' },
  { thai: 'ฮ', roman: 'ho nokhuk', meaning: 'owl', category: 'consonant', difficulty: 'beginner' }
];

// Thai vowels data
const vowelsData = [
  { thai: 'ะ', roman: 'a', meaning: 'short a', category: 'vowel', difficulty: 'beginner' },
  { thai: 'า', roman: 'aa', meaning: 'long a', category: 'vowel', difficulty: 'beginner' },
  { thai: 'ิ', roman: 'i', meaning: 'short i', category: 'vowel', difficulty: 'beginner' },
  { thai: 'ี', roman: 'ii', meaning: 'long i', category: 'vowel', difficulty: 'beginner' },
  { thai: 'ึ', roman: 'ue', meaning: 'short ue', category: 'vowel', difficulty: 'intermediate' },
  { thai: 'ื', roman: 'uue', meaning: 'long ue', category: 'vowel', difficulty: 'intermediate' },
  { thai: 'ุ', roman: 'u', meaning: 'short u', category: 'vowel', difficulty: 'beginner' },
  { thai: 'ู', roman: 'uu', meaning: 'long u', category: 'vowel', difficulty: 'beginner' },
  { thai: 'เ', roman: 'e', meaning: 'e', category: 'vowel', difficulty: 'beginner' },
  { thai: 'แ', roman: 'ae', meaning: 'ae', category: 'vowel', difficulty: 'beginner' },
  { thai: 'โ', roman: 'o', meaning: 'o', category: 'vowel', difficulty: 'beginner' },
  { thai: 'ใ', roman: 'ai', meaning: 'ai', category: 'vowel', difficulty: 'intermediate' },
  { thai: 'ไ', roman: 'ai', meaning: 'ai', category: 'vowel', difficulty: 'intermediate' }
];

// Thai tones data
const tonesData = [
  { thai: '่', roman: 'mai ek', meaning: 'low tone', category: 'tone', difficulty: 'beginner' },
  { thai: '้', roman: 'mai tho', meaning: 'falling tone', category: 'tone', difficulty: 'beginner' },
  { thai: '๊', roman: 'mai tri', meaning: 'high tone', category: 'tone', difficulty: 'intermediate' },
  { thai: '๋', roman: 'mai chattawa', meaning: 'rising tone', category: 'tone', difficulty: 'intermediate' }
];

// Sample lessons data
const lessonsData = [
  {
    title: 'พยัญชนะพื้นฐาน ก-จ',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 10 ตัวแรก',
    category: 'consonant',
    difficulty: 'beginner',
    level: 1,
    content: 'เรียนรู้พยัญชนะ ก ข ฃ ค ฅ ฆ ง จ ฉ ช',
    gameModes: ['matching', 'multiple-choice'],
    objectives: ['จำพยัญชนะได้', 'ออกเสียงได้ถูกต้อง'],
    estimatedTime: 15,
    xpReward: 50,
    order: 1
  },
  {
    title: 'พยัญชนะพื้นฐาน ซ-ญ',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 10 ตัวที่สอง',
    category: 'consonant',
    difficulty: 'beginner',
    level: 1,
    content: 'เรียนรู้พยัญชนะ ซ ฌ ญ ฎ ฏ ฐ ฑ ฒ ณ ด',
    gameModes: ['matching', 'multiple-choice', 'fill-blank'],
    objectives: ['จำพยัญชนะได้', 'ออกเสียงได้ถูกต้อง'],
    estimatedTime: 15,
    xpReward: 50,
    order: 2
  },
  {
    title: 'สระพื้นฐาน',
    description: 'เรียนรู้สระพื้นฐาน 8 ตัว',
    category: 'vowel',
    difficulty: 'beginner',
    level: 1,
    content: 'เรียนรู้สระ ะ า ิ ี ึ ื ุ ู',
    gameModes: ['matching', 'multiple-choice'],
    objectives: ['จำสระได้', 'ออกเสียงได้ถูกต้อง'],
    estimatedTime: 10,
    xpReward: 30,
    order: 3
  },
  {
    title: 'วรรณยุกต์พื้นฐาน',
    description: 'เรียนรู้วรรณยุกต์ 4 ตัว',
    category: 'tone',
    difficulty: 'beginner',
    level: 1,
    content: 'เรียนรู้วรรณยุกต์ ่ ้ ๊ ๋',
    gameModes: ['matching', 'multiple-choice'],
    objectives: ['จำวรรณยุกต์ได้', 'ออกเสียงได้ถูกต้อง'],
    estimatedTime: 10,
    xpReward: 30,
    order: 4
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    await User.deleteMany({});
    await Vocabulary.deleteMany({});
    await Lesson.deleteMany({});
    
    console.log('🗑️  Cleared existing data');
    
    // Seed consonants
    console.log('📝 Seeding consonants...');
    const consonants = await Vocabulary.insertMany(consonantsData);
    console.log(`✅ Seeded ${consonants.length} consonants`);
    
    // Seed vowels
    console.log('📝 Seeding vowels...');
    const vowels = await Vocabulary.insertMany(vowelsData);
    console.log(`✅ Seeded ${vowels.length} vowels`);
    
    // Seed tones
    console.log('📝 Seeding tones...');
    const tones = await Vocabulary.insertMany(tonesData);
    console.log(`✅ Seeded ${tones.length} tones`);
    
    // Seed lessons
    console.log('📝 Seeding lessons...');
    const lessons = await Lesson.insertMany(lessonsData);
    console.log(`✅ Seeded ${lessons.length} lessons`);
    
    // Create sample user
    console.log('👤 Creating sample user...');
    const sampleUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      petName: 'Fluffy',
      hearts: 5,
      diamonds: 10,
      xp: 100,
      level: 2,
      streak: 3
    });
    
    await sampleUser.save();
    console.log('✅ Created sample user');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Total vocabularies: ${consonants.length + vowels.length + tones.length}`);
    console.log(`📚 Total lessons: ${lessons.length}`);
    console.log(`👤 Sample user: test@example.com / password123`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
