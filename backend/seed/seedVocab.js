const mongoose = require("mongoose");
const Vocab = require("../models/Vocab");

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGODB_URL || "mongodb+srv://2755petchanan_db_user:19202546@cluster0.lu8vz2p.mongodb.net/thai-meow?retryWrites=true&w=majority&appName=Cluster0");

const consonants = [
  { thai: "ก", name: "กอ-ไก่", meaningTH: "ไก่", meaningEN: "chicken", roman: "gor-gai" },
  { thai: "ข", name: "ขอ-ไข่", meaningTH: "ไข่", meaningEN: "egg", roman: "khor-khai" },
  { thai: "ฃ", name: "ฃอ-ฃวด", meaningTH: "ฃวด", meaningEN: "bottle", roman: "khor-khwad" },
  { thai: "ค", name: "คอ-ควาย", meaningTH: "ควาย", meaningEN: "buffalo", roman: "khor-khwai" },
  { thai: "ฅ", name: "ฅอ-ฅน", meaningTH: "ฅน", meaningEN: "person", roman: "khor-khon" },
  { thai: "ฆ", name: "ฆอ-ระฆัง", meaningTH: "ระฆัง", meaningEN: "bell", roman: "khor-rakhang" },
  { thai: "ง", name: "งอ-งู", meaningTH: "งู", meaningEN: "snake", roman: "ngor-ngoo" },
  { thai: "จ", name: "จอ-จาน", meaningTH: "จาน", meaningEN: "plate", roman: "jor-jaan" },
  { thai: "ฉ", name: "ฉอ-ฉิ่ง", meaningTH: "ฉิ่ง", meaningEN: "cymbal", roman: "chor-ching" },
  { thai: "ช", name: "ชอ-ช้าง", meaningTH: "ช้าง", meaningEN: "elephant", roman: "chor-chang" },
  { thai: "ซ", name: "ซอ-โซ่", meaningTH: "โซ่", meaningEN: "chain", roman: "sor-so" },
  { thai: "ฌ", name: "ฌอ-เฌอ", meaningTH: "เฌอ", meaningEN: "tree", roman: "chor-choe" },
  { thai: "ญ", name: "ญอ-หญิง", meaningTH: "หญิง", meaningEN: "woman", roman: "yor-ying" },
  { thai: "ฎ", name: "ฎอ-ชฎา", meaningTH: "ชฎา", meaningEN: "crown", roman: "dor-chada" },
  { thai: "ฏ", name: "ฏอ-ปฏัก", meaningTH: "ปฏัก", meaningEN: "goad", roman: "dor-patak" },
  { thai: "ฐ", name: "ฐอ-ฐาน", meaningTH: "ฐาน", meaningEN: "base", roman: "thor-than" },
  { thai: "ฑ", name: "ฑอ-มณโฑ", meaningTH: "มณโฑ", meaningEN: "Mandodari", roman: "thor-mon-tho" },
  { thai: "ฒ", name: "ฒอ-ผู้เฒ่า", meaningTH: "ผู้เฒ่า", meaningEN: "elder", roman: "thor-phu-thao" },
  { thai: "ณ", name: "ณอ-เณร", meaningTH: "เณร", meaningEN: "novice", roman: "nor-nen" },
  { thai: "ด", name: "ดอ-เด็ก", meaningTH: "เด็ก", meaningEN: "child", roman: "dor-dek" },
  { thai: "ต", name: "ตอ-เต่า", meaningTH: "เต่า", meaningEN: "turtle", roman: "tor-tao" },
  { thai: "ถ", name: "ถอ-ถุง", meaningTH: "ถุง", meaningEN: "bag", roman: "thor-thung" },
  { thai: "ท", name: "ทอ-ทหาร", meaningTH: "ทหาร", meaningEN: "soldier", roman: "thor-thahan" },
  { thai: "ธ", name: "ธอ-ธง", meaningTH: "ธง", meaningEN: "flag", roman: "thor-thong" },
  { thai: "น", name: "นอ-หนู", meaningTH: "หนู", meaningEN: "mouse", roman: "nor-nu" },
  { thai: "บ", name: "บอ-ใบไม้", meaningTH: "ใบไม้", meaningEN: "leaf", roman: "bor-bai-mai" },
  { thai: "ป", name: "ปอ-ปลา", meaningTH: "ปลา", meaningEN: "fish", roman: "por-pla" },
  { thai: "ผ", name: "ผอ-ผึ้ง", meaningTH: "ผึ้ง", meaningEN: "bee", roman: "phor-phueng" },
  { thai: "ฝ", name: "ฝอ-ฝา", meaningTH: "ฝา", meaningEN: "lid", roman: "for-fa" },
  { thai: "พ", name: "พอ-พาน", meaningTH: "พาน", meaningEN: "tray", roman: "phor-phan" },
  { thai: "ฟ", name: "ฟอ-ฟัน", meaningTH: "ฟัน", meaningEN: "tooth", roman: "for-fan" },
  { thai: "ภ", name: "ภอ-สำเภา", meaningTH: "สำเภา", meaningEN: "junk", roman: "phor-sam-phao" },
  { thai: "ม", name: "มอ-ม้า", meaningTH: "ม้า", meaningEN: "horse", roman: "mor-ma" },
  { thai: "ย", name: "ยอ-ยักษ์", meaningTH: "ยักษ์", meaningEN: "giant", roman: "yor-yak" },
  { thai: "ร", name: "รอ-เรือ", meaningTH: "เรือ", meaningEN: "boat", roman: "ror-ruea" },
  { thai: "ล", name: "ลอ-ลิง", meaningTH: "ลิง", meaningEN: "monkey", roman: "lor-ling" },
  { thai: "ว", name: "วอ-แหวน", meaningTH: "แหวน", meaningEN: "ring", roman: "wor-waen" },
  { thai: "ศ", name: "ศอ-ศาลา", meaningTH: "ศาลา", meaningEN: "pavilion", roman: "sor-sala" },
  { thai: "ษ", name: "ษอ-ฤาษี", meaningTH: "ฤาษี", meaningEN: "hermit", roman: "sor-ruesi" },
  { thai: "ส", name: "สอ-เสือ", meaningTH: "เสือ", meaningEN: "tiger", roman: "sor-suea" },
  { thai: "ห", name: "หอ-หีบ", meaningTH: "หีบ", meaningEN: "box", roman: "hor-hip" },
  { thai: "ฬ", name: "ฬอ-จุฬา", meaningTH: "จุฬา", meaningEN: "kite", roman: "lor-chu-la" },
  { thai: "อ", name: "ออ-อ่าง", meaningTH: "อ่าง", meaningEN: "basin", roman: "or-ang" },
  { thai: "ฮ", name: "ฮอ-นกฮูก", meaningTH: "นกฮูก", meaningEN: "owl", roman: "hor-nok-huk" }
];

(async () => {
  try {
    console.log("🌱 Starting to seed consonants...");
    
    // ลบข้อมูลเก่า
    await Vocab.deleteMany({ type: "consonant" });
    console.log("🗑️ Cleared existing consonants");
    
    // เพิ่มข้อมูลใหม่
    const consonantData = consonants.map(c => ({
      ...c,
      type: "consonant",
      level: "Beginner",
      lessonKey: "consonants_basic",
      category: "พยัญชนะ",
      audioText: c.name,
      imageUrl: `/assets/letters/${c.thai}.jpg`
    }));
    
    await Vocab.insertMany(consonantData);
    console.log(`✅ Seeded ${consonants.length} consonants successfully!`);
    
    // แสดงตัวอย่างข้อมูล
    const sample = await Vocab.findOne({ thai: "ก" }).lean();
    console.log("📝 Sample data:", sample);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding consonants:", error);
    process.exit(1);
  }
})();
