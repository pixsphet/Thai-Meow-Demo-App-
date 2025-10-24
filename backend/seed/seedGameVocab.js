/* eslint-disable no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'config.env') });
const mongoose = require('mongoose');
const GameVocab = require('../models/GameVocab');

const connect = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
};

const parse = (s) => s.split(',').map(v => v.trim()).filter(Boolean);

async function seed() {
  await connect();

  const data = {
    'Animals': parse('ช้าง, ม้า, วัว, ควาย, หมา, แมว, ปลา, นก, ไก่, หมู, ลิง, เสือ, หมี, กระต่าย, ยีราฟ, สิงโต, จระเข้, งู, เต่า, กบ, ผีเสื้อ, ยุง, มด, แมลงวัน, ปู, ปลาหมึก'),
    'Food': parse('ข้าว, ข้าวผัด, ผัดไทย, ส้มตำ, ต้มยำ, ขนมจีน, ขนมปัง, ข้าวเหนียว, มะม่วง, กล้วย, ทุเรียน, ส้ม, แตงโม, น้ำปลา, น้ำตาล, เกลือ, ไข่, แกงเขียวหวาน, ไอศกรีม, ชาเย็น'),
    'People & Family': parse('พ่อ, แม่, ลูก, พี่, น้อง, ลุง, ป้า, ตา, ยาย, เพื่อน, ครู, นักเรียน, หมอ, ตำรวจ, คนขับรถ, พนักงาน, ชาวนา, คนขายของ, ผู้หญิง, ผู้ชาย'),
    'Colors': parse('แดง, เหลือง, น้ำเงิน, เขียว, ชมพู, ส้ม, ม่วง, น้ำตาล, ดำ, ขาว, เทา, ฟ้า, ทอง, เงิน'),
    'Time': parse('เช้า, เที่ยง, บ่าย, เย็น, กลางคืน, วันนี้, พรุ่งนี้, เมื่อวาน, ตอนนี้, ชั่วโมง, นาที, วินาที, วัน, เดือน, ปี, ฤดูร้อน, ฤดูฝน, ฤดูหนาว'),
    'Places': parse('บ้าน, โรงเรียน, โรงพยาบาล, วัด, ตลาด, ร้านอาหาร, สวนสาธารณะ, ถนน, ทะเล, ภูเขา, สนามบิน, รถไฟ, ห้องน้ำ, ห้องเรียน, ห้องครัว, ร้านกาแฟ'),
    'Transportation': parse('รถยนต์, รถไฟ, เครื่องบิน, เรือ, จักรยาน, มอเตอร์ไซค์, รถบัส, รถแท็กซี่, รถไฟฟ้า, ทางม้าลาย, ป้ายรถเมล์, ถนน, แยก, สะพาน, สัญญาณไฟ'),
    'Weather': parse('แดด, ฝน, ลม, ฟ้า, เมฆ, ฟ้าผ่า, หิมะ, พายุ, หมอก, อุณหภูมิ, ร้อน, หนาว, เย็น, อบอุ่น'),
    'Objects': parse('โต๊ะ, เก้าอี้, หนังสือ, ปากกา, ดินสอ, สมุด, กระเป๋า, โทรศัพท์, คอมพิวเตอร์, ทีวี, พัดลม, ตู้เย็น, หมอน, ผ้าห่ม, ประตู, หน้าต่าง, รองเท้า, เสื้อ, หมวก, กุญแจ'),
    'Greetings & Common Phrases': parse('สวัสดี, ขอบคุณ, ขอโทษ, ลาก่อน, ยินดี, สบายดีไหม, ไม่เป็นไร, เจอกันใหม่, ยินดีต้อนรับ, ขออนุญาต, ชื่ออะไร, เท่าไหร่, ใช่, ไม่ใช่, ได้, ไม่ได้, ดีมาก, เยี่ยมเลย, สนุก, รัก'),
    'Activities': parse('กิน, นอน, วิ่ง, เดิน, อ่าน, เขียน, พูด, ฟัง, เล่น, เต้น, ว่ายน้ำ, ทำอาหาร, ทำงาน, เรียน, ขับรถ, เดินทาง, ถ่ายรูป, ดูหนัง, เล่นเกม, ออกกำลังกาย'),
    'Emotions': parse('ดีใจ, เสียใจ, โกรธ, กลัว, เบื่อ, เหงา, ตกใจ, มีความสุข, ภูมิใจ, กังวล, รัก, เกลียด, สงสัย, หิว, ง่วง, สนุก, ผ่อนคลาย, เครียด'),
    'Technology': parse('มือถือ, คอมพิวเตอร์, โน้ตบุ๊ก, อินเทอร์เน็ต, โปรแกรม, เกม, หูฟัง, กล้อง, ไมโครโฟน, เมาส์, คีย์บอร์ด, Wi-Fi, เว็บไซต์, รหัสผ่าน, แอป, ปุ่ม, อีเมล'),
    'Level Advanced': parse('ประชาธิปไตย, วัฒนธรรม, เทคโนโลยี, สิ่งแวดล้อม, พลังงาน, การศึกษา, สุขภาพ, การจราจร, เศรษฐกิจ, สังคม, วิทยาศาสตร์, ดาราศาสตร์, ภูมิศาสตร์, ประวัติศาสตร์, ศิลปะ, ดนตรี, การเมือง, อุตสาหกรรม, นวัตกรรม, ปัญญาประดิษฐ์'),
  };

  let upserted = 0;
  for (const [category, words] of Object.entries(data)) {
    for (const thai of words) {
      await GameVocab.updateOne(
        { category, thai },
        {
          $set: {
            category,
            thai,
            imageKey: '',
            isActive: true,
          },
        },
        { upsert: true }
      );
      upserted += 1;
    }
  }
  console.log(`✅ Seeded/updated ${upserted} game vocab items.`);
  await mongoose.disconnect();
}

seed().catch(async (e) => {
  console.error('❌ Seed error:', e);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});


