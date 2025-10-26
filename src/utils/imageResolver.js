import { ADD_IMAGES } from '../add/imageManifest';

// รับได้ 3 รูปแบบ:
// 1) item.imageKey = "Animals/ช้าง"
// 2) item.imagePath = "src/add/Animals/ช้าง.png"
// 3) {categoryFolder, filename} แยกมาก็ได้
export function resolveAddImage(item) {
  if (!item) return null;

  // 1) imageKey ตรง ๆ
  if (item.imageKey && ADD_IMAGES[item.imageKey]) return ADD_IMAGES[item.imageKey];

  // 2) path เต็ม แปลงเป็น key
  if (item.imagePath && item.imagePath.includes('/src/add/')) {
    const rel = item.imagePath.split('/src/add/')[1]; // "Animals/ช้าง.png"
    const withoutExt = rel.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    if (ADD_IMAGES[withoutExt]) return ADD_IMAGES[withoutExt];
  }

  // 3) เดาจาก categoryFolder + thai
  if (item.categoryFolder && item.thai) {
    const key = `${item.categoryFolder}/${item.thai}`;
    if (ADD_IMAGES[key]) return ADD_IMAGES[key];
  }

  return null; // ให้ fallback เป็น text/emoji
}
