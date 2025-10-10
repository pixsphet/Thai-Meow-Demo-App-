const mongoose = require('mongoose');
const Vocab = require('./models/Vocab');

// เชื่อมต่อ MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://2755petchanan_db_user:19202546@cluster0.lu8vz2p.mongodb.net/thai-meow?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// ข้อมูลพยัญชนะไทย 44 ตัว
const consonants = [
  { thai: "ก", nameTH: "กอ ไก่", en: "Chicken", roman: "Ko Kai", category: "thai-consonants", level: "Beginner" },
  { thai: "ข", nameTH: "ขอ ไข่", en: "Egg", roman: "Kho Khai", category: "thai-consonants", level: "Beginner" },
  { thai: "ฃ", nameTH: "ขอ ขวด", en: "Bottle", roman: "Kho Khwat", category: "thai-consonants", level: "Beginner" },
  { thai: "ค", nameTH: "คอ ควาย", en: "Buffalo", roman: "Kho Khwai", category: "thai-consonants", level: "Beginner" },
  { thai: "ฅ", nameTH: "คอ คน", en: "Person", roman: "Kho Khon", category: "thai-consonants", level: "Beginner" },
  { thai: "ฆ", nameTH: "คอ ระฆัง", en: "Bell", roman: "Kho Rakang", category: "thai-consonants", level: "Beginner" },
  { thai: "ง", nameTH: "งอ งู", en: "Snake", roman: "Ngo Ngu", category: "thai-consonants", level: "Beginner" },
  { thai: "จ", nameTH: "จอ จาน", en: "Plate", roman: "Cho Chan", category: "thai-consonants", level: "Beginner" },
  { thai: "ฉ", nameTH: "ฉอ ฉิ่ง", en: "Cymbal", roman: "Cho Ching", category: "thai-consonants", level: "Beginner" },
  { thai: "ช", nameTH: "ชอ ช้าง", en: "Elephant", roman: "Cho Chang", category: "thai-consonants", level: "Beginner" },
  { thai: "ซ", nameTH: "ซอ โซ่", en: "Chain", roman: "So So", category: "thai-consonants", level: "Beginner" },
  { thai: "ฌ", nameTH: "ชอ เฌอ", en: "Tree", roman: "Cho Cher", category: "thai-consonants", level: "Beginner" },
  { thai: "ญ", nameTH: "ยอ หญิง", en: "Woman", roman: "Yo Ying", category: "thai-consonants", level: "Beginner" },
  { thai: "ฎ", nameTH: "ดอ ชฎา", en: "Crown", roman: "Do Chada", category: "thai-consonants", level: "Beginner" },
  { thai: "ฏ", nameTH: "ตอ ปฏัก", en: "Spear", roman: "To Patak", category: "thai-consonants", level: "Beginner" },
  { thai: "ฐ", nameTH: "ถอ ฐาน", en: "Pedestal", roman: "Tho Than", category: "thai-consonants", level: "Beginner" },
  { thai: "ฑ", nameTH: "ทอ มณโฑ", en: "Queen Montho", roman: "Tho Montho", category: "thai-consonants", level: "Beginner" },
  { thai: "ฒ", nameTH: "ทอ ผู้เฒ่า", en: "Elder", roman: "Tho Phu Thao", category: "thai-consonants", level: "Beginner" },
  { thai: "ณ", nameTH: "นอ เณร", en: "Novice Monk", roman: "No Nen", category: "thai-consonants", level: "Beginner" },
  { thai: "ด", nameTH: "ดอ เด็ก", en: "Child", roman: "Do Dek", category: "thai-consonants", level: "Beginner" },
  { thai: "ต", nameTH: "ตอ เต่า", en: "Turtle", roman: "To Tao", category: "thai-consonants", level: "Beginner" },
  { thai: "ถ", nameTH: "ถอ ถุง", en: "Bag", roman: "Tho Thung", category: "thai-consonants", level: "Beginner" },
  { thai: "ท", nameTH: "ทอ ทหาร", en: "Soldier", roman: "Tho Thahan", category: "thai-consonants", level: "Beginner" },
  { thai: "ธ", nameTH: "ทอ ธง", en: "Flag", roman: "Tho Thong", category: "thai-consonants", level: "Beginner" },
  { thai: "น", nameTH: "นอ หนู", en: "Mouse", roman: "No Nu", category: "thai-consonants", level: "Beginner" },
  { thai: "บ", nameTH: "บอ ใบไม้", en: "Leaf", roman: "Bo Bai Mai", category: "thai-consonants", level: "Beginner" },
  { thai: "ป", nameTH: "ปอ ปลา", en: "Fish", roman: "Po Pla", category: "thai-consonants", level: "Beginner" },
  { thai: "ผ", nameTH: "ผอ ผึ้ง", en: "Bee", roman: "Pho Phueng", category: "thai-consonants", level: "Beginner" },
  { thai: "ฝ", nameTH: "ฝอ ฝา", en: "Lid", roman: "Fo Fa", category: "thai-consonants", level: "Beginner" },
  { thai: "พ", nameTH: "พอ พาน", en: "Tray", roman: "Pho Phan", category: "thai-consonants", level: "Beginner" },
  { thai: "ฟ", nameTH: "ฟอ ฟัน", en: "Tooth", roman: "Fo Fan", category: "thai-consonants", level: "Beginner" },
  { thai: "ภ", nameTH: "พอ สำเภา", en: "Ship", roman: "Pho Samphao", category: "thai-consonants", level: "Beginner" },
  { thai: "ม", nameTH: "มอ ม้า", en: "Horse", roman: "Mo Ma", category: "thai-consonants", level: "Beginner" },
  { thai: "ย", nameTH: "ยอ ยักษ์", en: "Giant", roman: "Yo Yak", category: "thai-consonants", level: "Beginner" },
  { thai: "ร", nameTH: "รอ เรือ", en: "Boat", roman: "Ro Ruea", category: "thai-consonants", level: "Beginner" },
  { thai: "ล", nameTH: "ลอ ลิง", en: "Monkey", roman: "Lo Ling", category: "thai-consonants", level: "Beginner" },
  { thai: "ว", nameTH: "วอ แหวน", en: "Ring", roman: "Wo Waen", category: "thai-consonants", level: "Beginner" },
  { thai: "ศ", nameTH: "สอ ศาลา", en: "Pavilion", roman: "So Sala", category: "thai-consonants", level: "Beginner" },
  { thai: "ษ", nameTH: "สอ ฤๅษี", en: "Hermit", roman: "So Rue Si", category: "thai-consonants", level: "Beginner" },
  { thai: "ส", nameTH: "สอ เสือ", en: "Tiger", roman: "So Suea", category: "thai-consonants", level: "Beginner" },
  { thai: "ห", nameTH: "หอ หีบ", en: "Chest", roman: "Ho Hip", category: "thai-consonants", level: "Beginner" },
  { thai: "ฬ", nameTH: "ลอ จุลา", en: "Kite", roman: "Lo Chula", category: "thai-consonants", level: "Beginner" },
  { thai: "อ", nameTH: "ออ อ่าง", en: "Basin", roman: "O Ang", category: "thai-consonants", level: "Beginner" },
  { thai: "ฮ", nameTH: "ฮอ นกฮูก", en: "Owl", roman: "Ho Nok Huk", category: "thai-consonants", level: "Beginner" }
];

// เพิ่มข้อมูลพยัญชนะเข้าไปในฐานข้อมูล
const seedConsonants = async () => {
  try {
    console.log('🌱 Starting to seed consonants...');
    
    let addedCount = 0;
    let updatedCount = 0;
    
    for (const consonant of consonants) {
      try {
        // ใช้ findOneAndUpdate เพื่อเพิ่มหรืออัปเดต
        const result = await Vocab.findOneAndUpdate(
          { thai: consonant.thai },
          consonant,
          { upsert: true, new: true }
        );
        
        if (result.isNew) {
          addedCount++;
          console.log(`✅ Added: ${consonant.thai} - ${consonant.nameTH}`);
        } else {
          updatedCount++;
          console.log(`🔄 Updated: ${consonant.thai} - ${consonant.nameTH}`);
        }
      } catch (error) {
        console.error(`❌ Error with ${consonant.thai}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Seeding completed!`);
    console.log(`✅ Added: ${addedCount} consonants`);
    console.log(`🔄 Updated: ${updatedCount} consonants`);
    console.log(`📊 Total: ${addedCount + updatedCount} consonants processed`);
    
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

// รัน script
const run = async () => {
  await connectDB();
  await seedConsonants();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

run();
