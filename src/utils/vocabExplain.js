// ใช้สร้างคำอธิบายยาวแบบอ่านเพลิน ๆ
export function buildExplanation(item) {
  const th = item.descriptionTH?.trim();
  const en = item.descriptionEN?.trim();

  const thai = th || [
    `คำว่า "${item.thai}" หมายถึง ${item.english || '—'}.`,
    `มักใช้ในบริบทเกี่ยวกับหมวดหมู่ "${item.category || item.categoryFolder || 'คำศัพท์ทั่วไป'}".`,
    `ตัวอย่างประโยค:`,
    ...(item.examplesTH?.length ? item.examplesTH.map(x => `• ${x}`) : [`• ฉันชอบ${item.thai}มาก`, `• วันนี้มี${item.thai}ที่บ้าน`]),
  ].join('\n');

  const eng = en || [
    `${item.thai} means "${item.english || '—'}".`,
    `Commonly used in the topic/category of "${item.category || item.categoryFolder || 'general vocabulary'}".`,
    `Examples:`,
    ...(item.examplesEN?.length ? item.examplesEN.map(x => `• ${x}`) : [`• I really like ${item.english || item.thai}.`, `• There is ${item.english || item.thai} at home today.`]),
  ].join('\n');

  return { thai, eng };
}

