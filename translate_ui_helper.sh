#!/bin/bash
# Helper script to translate common Thai UI text to English in game files

# Common replacements
declare -a replacements=(
  "s/หัวใจหมดแล้ว/Out of Hearts/g"
  "s/ซื้อหัวใจเพิ่มเพื่อเล่นต่อ/Buy more hearts to continue playing/g"
  "s/ไปร้านหัวใจ/Go to Shop/g"
  "s/ยกเลิก/Cancel/g"
  "s/ถูกต้อง! ยอดเยี่ยม/Correct! Great job!/g"
  "s/ถูกต้อง!/Correct!/g"
  "s/พยายามอีกครั้ง/Try again/g"
  "s/ผิด!/Wrong!/g"
  "s/ต่อไป/Next/g"
  "s/จบเกม/End Game/g"
  "s/ตรวจ/CHECK/g"
  "s/กำลังโหลด\.\.\./Loading.../g"
  "s/เริ่มเล่น/Start Game/g"
  "s/เล่นต่อจากข้อที่/Resume from question/g"
)

# Find all Game.js files
files=$(find src/screens -name "*Game.js" -type f ! -name "GreetingStage3Game.js" ! -name "Advanced1OccupationsGame.js" ! -name "ConsonantStage1Game.js" ! -name "IntermediateTransportGame.js")

for file in $files; do
  echo "Processing $file..."
  for replacement in "${replacements[@]}"; do
    sed -i '' "$replacement" "$file" 2>/dev/null || true
  done
done

echo "Done!"

