const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thaimeow');
    console.log('✅ Connected to MongoDB');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Define Body Parts Schema
const bodyPartSchema = new mongoose.Schema({
  thai: { type: String, required: true },
  roman: { type: String },
  en: { type: String },
  meaningTH: { type: String },
  category: { type: String, default: 'thai-body' },
  level: { type: String, default: 'Beginner' },
  imagePath: { type: String },
  audioText: { type: String },
  exampleTH: { type: String },
  exampleEN: { type: String },
  difficulty: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const BodyPart = mongoose.model('BodyPart', bodyPartSchema, 'thai-body');

// Seed data
const bodyPartsData = [
  {
    thai: 'ตา',
    roman: 'dtaa',
    en: 'eye',
    meaningTH: 'ตา',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ตา.jpg',
    audioText: 'ตา',
    exampleTH: 'ฉันมีตาสองข้าง',
    exampleEN: 'I have two eyes',
    difficulty: 1,
    isActive: true,
    tags: ['body', 'face'],
  },
  {
    thai: 'หู',
    roman: 'hǔu',
    en: 'ear',
    meaningTH: 'หู',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/หู.jpg',
    audioText: 'หู',
    exampleTH: 'ฉันฟังด้วยหู',
    exampleEN: 'I listen with my ear',
    difficulty: 1,
    isActive: true,
    tags: ['body', 'face'],
  },
  {
    thai: 'จมูก',
    roman: 'ja-mùuk',
    en: 'nose',
    meaningTH: 'จมูก',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/จมูก.jpg',
    audioText: 'จมูก',
    exampleTH: 'ฉันสูดอากาศผ่านจมูก',
    exampleEN: 'I breathe through my nose',
    difficulty: 1,
    isActive: true,
    tags: ['body', 'face'],
  },
  {
    thai: 'ปาก',
    roman: 'bpàak',
    en: 'mouth',
    meaningTH: 'ปาก',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ปาก.jpg',
    audioText: 'ปาก',
    exampleTH: 'เธอปิดปากตอนหนาว',
    exampleEN: 'You close your mouth when cold',
    difficulty: 1,
    isActive: true,
    tags: ['body', 'face'],
  },
  {
    thai: 'ฟัน',
    roman: 'fan',
    en: 'tooth',
    meaningTH: 'ฟัน',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ฟัน.jpg',
    audioText: 'ฟัน',
    exampleTH: 'เขาแปรงฟันทุกวัน',
    exampleEN: 'He brushes his teeth every day',
    difficulty: 1,
    isActive: true,
    tags: ['body', 'face'],
  },
  {
    thai: 'ลิ้น',
    roman: 'lín',
    en: 'tongue',
    meaningTH: 'ลิ้น',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ลิ้น.jpg',
    audioText: 'ลิ้น',
    exampleTH: 'ลิ้นช่วยให้เรารู้รส',
    exampleEN: 'The tongue helps us taste',
    difficulty: 1,
    isActive: true,
    tags: ['body', 'face'],
  },
  {
    thai: 'หัว',
    roman: 'hǔa',
    en: 'head',
    meaningTH: 'หัว',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/หัว.jpg',
    audioText: 'หัว',
    exampleTH: 'เขาปวดหัว',
    exampleEN: 'He has a headache',
    difficulty: 1,
    isActive: true,
    tags: ['body'],
  },
  {
    thai: 'ผม',
    roman: 'phǒm',
    en: 'hair',
    meaningTH: 'ผม',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ผม.jpg',
    audioText: 'ผม',
    exampleTH: 'เธอเสร็จผมอย่างไร',
    exampleEN: 'How do you style your hair',
    difficulty: 1,
    isActive: true,
    tags: ['body', 'face'],
  },
  {
    thai: 'ใบหน้า',
    roman: 'bai-nâa',
    en: 'face',
    meaningTH: 'ใบหน้า',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ใบหน้า.jpg',
    audioText: 'ใบหน้า',
    exampleTH: 'เธอมีใบหน้าสวย',
    exampleEN: 'You have a beautiful face',
    difficulty: 1,
    isActive: true,
    tags: ['body', 'face'],
  },
  {
    thai: 'มือ',
    roman: 'mʉʉ',
    en: 'hand',
    meaningTH: 'มือ',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/มือ.jpg',
    audioText: 'มือ',
    exampleTH: 'ฉันมีมือสองข้าง',
    exampleEN: 'I have two hands',
    difficulty: 1,
    isActive: true,
    tags: ['body'],
  },
  {
    thai: 'แขน',
    roman: 'khɛ̌ɛn',
    en: 'arm',
    meaningTH: 'แขน',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/แขน.jpg',
    audioText: 'แขน',
    exampleTH: 'แขนของฉันเหนื่อย',
    exampleEN: 'My arm is tired',
    difficulty: 1,
    isActive: true,
    tags: ['body'],
  },
  {
    thai: 'เท้า',
    roman: 'tháo',
    en: 'foot',
    meaningTH: 'เท้า',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/เท้า.jpg',
    audioText: 'เท้า',
    exampleTH: 'เท้าของฉันปวด',
    exampleEN: 'My foot hurts',
    difficulty: 1,
    isActive: true,
    tags: ['body'],
  },
  {
    thai: 'ขา',
    roman: 'khǎa',
    en: 'leg',
    meaningTH: 'ขา',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ขา.jpg',
    audioText: 'ขา',
    exampleTH: 'เขาวิ่งด้วยขาของเขา',
    exampleEN: 'He runs with his legs',
    difficulty: 1,
    isActive: true,
    tags: ['body'],
  },
  {
    thai: 'ไหล่',
    roman: 'lài',
    en: 'shoulder',
    meaningTH: 'ไหล่',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ไหล่.jpg',
    audioText: 'ไหล่',
    exampleTH: 'เขาจุดไหล่',
    exampleEN: 'He shrugged his shoulder',
    difficulty: 1,
    isActive: true,
    tags: ['body'],
  },
  {
    thai: 'หลัง',
    roman: 'lǎng',
    en: 'back',
    meaningTH: 'หลัง',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/หลัง.jpg',
    audioText: 'หลัง',
    exampleTH: 'หลังของฉันปวด',
    exampleEN: 'My back hurts',
    difficulty: 1,
    isActive: true,
    tags: ['body'],
  },
  {
    thai: 'ท้อง',
    roman: 'thóng',
    en: 'stomach',
    meaningTH: 'ท้อง',
    category: 'thai-body',
    level: 'Beginner',
    imagePath: 'body/ท้อง.jpg',
    audioText: 'ท้อง',
    exampleTH: 'ท้องของฉันหิว',
    exampleEN: 'My stomach is hungry',
    difficulty: 1,
    isActive: true,
    tags: ['body'],
  },
];

// Main function
const seedBodyParts = async () => {
  try {
    await connectDB();

    // Clear existing data
    await BodyPart.deleteMany({});
    console.log('🗑️  Cleared existing body parts');

    // Insert new data
    const result = await BodyPart.insertMany(bodyPartsData);
    console.log(`✅ Successfully seeded ${result.length} body parts`);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run seed
seedBodyParts();
