# 📝 Vocab Card Generator Prompt

ใช้กับ AI (ChatGPT/Claude) เพื่อสร้างการ์ดคำศัพท์ภาษาไทยพร้อม EN/TH descriptions

## 🎯 HOW TO USE

1. Copy prompt ด้านล่าง
2. วางใน ChatGPT/Claude พร้อมกับรายการคำที่ต้องการ
3. AI จะ return JSON array ให้ Copy-paste ไปรวมใน vocab_full.json

---

## 💬 PROMPT TO COPY

```markdown
[ROLE] คุณคือนักเขียนสื่อการสอนภาษาไทยสำหรับผู้เรียนต่างชาติ

[GOAL] สร้างการ์ดคำศัพท์ 1 รายการแบบ JSON object ต่อคำ โดย:
- thai: คำศัพท์ภาษาไทย
- english: คำแปลอังกฤษสั้น ๆ (1–3 คำ)
- category: ชื่อหมวด (Animals, Food, People & Family, Colors, Time, Places, Transportation, Weather, Objects, Greetings & Common Phrases, Activities, Emotions, Technology, Level Advanced)
- categoryFolder: โฟลเดอร์รูปใน src/add (เช่น "Animals", "Food")
- imageKey: "<categoryFolder>/<thai>" เพื่อใช้กับ require แบบ static (ไม่ต้องใส่นามสกุลไฟล์)
- descriptionTH: อธิบายภาษาไทยอย่างละเอียด (3–6 บรรทัด) ใช้ภาษาเรียบง่าย เหมาะกับผู้เริ่มต้น
- descriptionEN: อธิบายภาษาอังกฤษอย่างละเอียด (3–6 บรรทัด) ชัดเจน เข้าใจง่าย
- examplesTH: ตัวอย่างประโยคไทย 2–3 ประโยค (สั้น กระชับ)
- examplesEN: ตัวอย่างประโยคอังกฤษแปลของตัวอย่างไทย 2–3 ประโยค

[STYLE]
- สุภาพ เป็นกันเอง เน้นให้ผู้เรียนเข้าใจการใช้คำนั้นในชีวิตประจำวัน
- ไม่ใช้ศัพท์เทคนิคเกินจำเป็น
- ใช้หน่วยนับ/บริบทสอดคล้องกับหมวดหมู่

[OUTPUT FORMAT]
พิมพ์เป็น JSON object แถวเดียว (ไม่ต้อง indent) เช่น:

{
  "thai": "ช้าง",
  "english": "elephant",
  "category": "Animals",
  "categoryFolder": "Animals",
  "imageKey": "Animals/ช้าง",
  "descriptionTH": "ช้างเป็นสัตว์เลี้ยงลูกด้วยนมขนาดใหญ่ มีงวงยาว อาศัยในป่าและในสวนสัตว์ทั่วโลก ช้างเป็นสัตว์ที่เป็นมิตรกับมนุษย์ มักใช้ในการเคลื่อนย้ายของหนักหรือแสดงโชว์",
  "descriptionEN": "An elephant is a large mammal with a long trunk, living in forests and zoos around the world. Elephants are friendly with humans and are often used for carrying heavy items or performing in shows.",
  "examplesTH": ["ช้างเป็นสัตว์ที่ฉลาดมาก", "ฉันเห็นช้างที่สวนสัตว์", "ช้างมีงวงยาวมาก"],
  "examplesEN": ["Elephants are very smart animals.", "I saw an elephant at the zoo.", "Elephants have very long trunks."]
}

---

ตัวอย่างคำที่ต้องการ: [ใส่คำที่ต้องการ 1 คำ ต่อครั้ง]
```

## 📋 USAGE EXAMPLE

### Input 1:
```
ตัวอย่างคำที่ต้องการ: ข้าว
```

### Expected Output:
```json
{"thai":"ข้าว","english":"rice","category":"Food","categoryFolder":"Food","imageKey":"Food/ข้าว","descriptionTH":"ข้าวเป็นอาหารหลักของคนไทยและคนเอเชีย ข้าวหุงสุกแล้วสีขาว กินคู่กับกับข้าวทุกมื้อ ในประเทศไทยมีทั้งข้าวเหนียวและข้าวเจ้า","descriptionEN":"Rice is the main food for Thai and Asian people. Cooked rice is white and eaten with dishes at every meal. Thailand has both sticky rice and jasmine rice.","examplesTH":["คุณกินข้าวแล้วยัง","แม่หุงข้าวทุกเช้า","ผมชอบกินข้าวมาก"],"examplesEN":["Have you eaten rice yet?","My mom cooks rice every morning.","I really love eating rice."]}
```

## ✅ SUCCESS CHECKLIST

- [ ] JSON valid (test ด้วย JSONLint.com)
- [ ] ทุก field มีครบ 8 ตัว
- [ ] descriptionTH ยาว 3-6 บรรทัด
- [ ] descriptionEN ยาว 3-6 บรรทัด  
- [ ] examplesTH, examplesEN มี 2-3 ประโยค
- [ ] imageKey ตรงกับไฟล์รูปจริงใน src/add

## 🚀 NEXT STEPS

1. สร้าง vocab cards ด้วย Prompt นี้
2. รวม JSON objects เข้ากับ vocab_full.json
3. รัน `node scripts/generateAddImageManifest.mjs` เพื่อ update manifest
4. ตรวจสอบรูปภาพใน src/add มีครบ

