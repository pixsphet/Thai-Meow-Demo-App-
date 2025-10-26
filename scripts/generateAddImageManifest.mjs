// scripts/generateAddImageManifest.mjs
import { readdirSync, writeFileSync, statSync } from 'fs';
import { join, relative, extname, basename } from 'path';

const ROOT = join(process.cwd(), 'src', 'add');
const outFile = join(process.cwd(), 'src', 'add', 'imageManifest.js');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) return walk(p);
    const ext = extname(p).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return [p];
    return [];
  });
}

const files = walk(ROOT);

// สร้าง key ที่เสถียร: 'Animals/ช้าง.png' -> 'Animals/ช้าง'
function keyFrom(p) {
  const rel = relative(ROOT, p).replaceAll('\\', '/');
  const dir = rel.split('/').slice(0, -1).join('/');
  const base = basename(rel, extname(rel));
  return `${dir}/${base}`;
}

const lines = [];
lines.push('// ✅ AUTO-GENERATED. DO NOT EDIT BY HAND.');
lines.push('// ใช้: import { ADD_IMAGES } from "./imageManifest";');
lines.push('export const ADD_IMAGES = {');
for (const f of files) {
  const key = keyFrom(f);
  const relToThis = './' + relative(join(process.cwd(), 'src', 'add'), f).replaceAll('\\', '/');
  // ต้องเป็น static require
  lines.push(`  ${JSON.stringify(key)}: require(${JSON.stringify(relToThis)}),`);
}
lines.push('};');
lines.push('');
lines.push('export default ADD_IMAGES;');

writeFileSync(outFile, lines.join('\n'), 'utf8');
console.log(`✅ Wrote manifest with ${files.length} images to ${outFile}`);

