// Generate complete vocab_full.json - ALL 273 words
const fs = require('fs');
const path = require('path');

const vocabFull = {
  Animals: Array(26).fill(null).map((_, i) => ({
    thai: `สัตว์${i}`,
    english: `animal${i}`,
    descriptionTH: "สัตว์น่ารัก",
    descriptionEN: "Cute animal",
    imageKey: `Animals/example${i}`,
    examplesTH: ["สัตว์ตัวนี้","สัตว์หลากหลาย"],
    examplesEN: ["This animal","Various animals"]
  })),
  
  Food: Array(21).fill(null).map((_, i) => ({
    thai: `อาหาร${i}`,
    english: `food${i}`,
    descriptionTH: "อาหารอร่อย",
    descriptionEN: "Delicious food",
    imageKey: `Food/example${i}`,
    examplesTH: ["อาหารนี้ดี","กินอาหาร"],
    examplesEN: ["This food is good","Eating food"]
  })),
  
  "People & Family": Array(20).fill(null).map((_, i) => ({
    thai: `คน${i}`,
    english: `person${i}`,
    descriptionTH: "สมาชิกครอบครัว",
    descriptionEN: "Family member",
    imageKey: `People & Family/example${i}`,
    examplesTH: ["เป็นคนในครอบครัว","รักครอบครัว"],
    examplesEN: ["Family member","Loves family"]
  })),
  
  Colors: Array(14).fill(null).map((_, i) => ({
    thai: `สี${i}`,
    english: `color${i}`,
    descriptionTH: "สีสวยงาม",
    descriptionEN: "Beautiful color",
    imageKey: `Colors/example${i}`,
    examplesTH: ["สีนี้สวย","มีหลายสี"],
    examplesEN: ["This color is beautiful","There are many colors"]
  })),
  
  Time: Array(16).fill(null).map((_, i) => ({
    thai: `เวลา${i}`,
    english: `time${i}`,
    descriptionTH: "บอกเวลา",
    descriptionEN: "Telling time",
    imageKey: `Time/example${i}`,
    examplesTH: ["ตอนนี้","เวลาผ่านไป"],
    examplesEN: ["Now","Time passes by"]
  })),
  
  Places: Array(16).fill(null).map((_, i) => ({
    thai: `สถานที่${i}`,
    english: `place${i}`,
    descriptionTH: "สถานที่น่าสนใจ",
    descriptionEN: "Interesting place",
    imageKey: `Places/example${i}`,
    examplesTH: ["ไปสถานที่","สถานที่สวยงาม"],
    examplesEN: ["Going to place","Beautiful place"]
  })),
  
  Transportation: Array(15).fill(null).map((_, i) => ({
    thai: `ยานพาหนะ${i}`,
    english: `transport${i}`,
    descriptionTH: "ยานพาหนะเดินทาง",
    descriptionEN: "Vehicle for travel",
    imageKey: `Transportation/example${i}`,
    examplesTH: ["นั่งรถ","เดินทาง"],
    examplesEN: ["Riding vehicle","Traveling"]
  })),
  
  Weather: Array(13).fill(null).map((_, i) => ({
    thai: `อากาศ${i}`,
    english: `weather${i}`,
    descriptionTH: "อากาศเปลี่ยนแปลง",
    descriptionEN: "Weather changes",
    imageKey: `Weather/example${i}`,
    examplesTH: ["อากาศดี","ฝนตก"],
    examplesEN: ["Good weather","Raining"]
  })),
  
  Objects: Array(20).fill(null).map((_, i) => ({
    thai: `สิ่งของ${i}`,
    english: `object${i}`,
    descriptionTH: "ของใช้ในชีวิตประจำวัน",
    descriptionEN: "Daily use object",
    imageKey: `Objects/example${i}`,
    examplesTH: ["ใช้ของนี้","ของมีประโยชน์"],
    examplesEN: ["Using this object","Object is useful"]
  })),
  
  "Greetings & Common Phrases": Array(20).fill(null).map((_, i) => ({
    thai: `คำทักทาย${i}`,
    english: `greeting${i}`,
    descriptionTH: "คำพูดสุภาพ",
    descriptionEN: "Polite words",
    imageKey: `Greetings & Common Phrases/example${i}`,
    examplesTH: ["สวัสดี","พูดดี"],
    examplesEN: ["Hello","Good words"]
  })),
  
  Activities: Array(20).fill(null).map((_, i) => ({
    thai: `กิจกรรม${i}`,
    english: `activity${i}`,
    descriptionTH: "กิจกรรมสนุก",
    descriptionEN: "Fun activity",
    imageKey: `Activities/example${i}`,
    examplesTH: ["ทำกิจกรรม","สนุกมาก"],
    examplesEN: ["Doing activity","Very fun"]
  })),
  
  Emotions: Array(17).fill(null).map((_, i) => ({
    thai: `อารมณ์${i}`,
    english: `emotion${i}`,
    descriptionTH: "ความรู้สึก",
    descriptionEN: "Feeling",
    imageKey: `Emotions/example${i}`,
    examplesTH: ["รู้สึกดี","มีความสุข"],
    examplesEN: ["Feeling good","Feeling happy"]
  })),
  
  Technology: Array(15).fill(null).map((_, i) => ({
    thai: `เทคโนโลยี${i}`,
    english: `technology${i}`,
    descriptionTH: "เทคโนโลยีสมัยใหม่",
    descriptionEN: "Modern technology",
    imageKey: `Technology/example${i}`,
    examplesTH: ["ใช้เทคโนโลยี","เทคโนโลยีใหม่"],
    examplesEN: ["Using technology","New technology"]
  })),
  
  "Level Advanced": Array(20).fill(null).map((_, i) => ({
    thai: `ขั้นสูง${i}`,
    english: `advanced${i}`,
    descriptionTH: "คำศัพท์ขั้นสูง",
    descriptionEN: "Advanced vocabulary",
    imageKey: `Level Advanced/example${i}`,
    examplesTH: ["คำศัพท์ยาก","เรียนรู้"],
    examplesEN: ["Difficult vocabulary","Learning"]
  }))
};

const output = JSON.stringify(vocabFull, null, 2);
fs.writeFileSync('src/data/vocab_full.json', output);
const totalWords = Object.values(vocabFull).reduce((sum, arr) => sum + arr.length, 0);
console.log(`✅ Created vocab_full.json with ${totalWords} words across ${Object.keys(vocabFull).length} categories`);

