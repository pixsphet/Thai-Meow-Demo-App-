# Thai Consonants Images

This directory contains images for all 44 Thai consonants used in the game.

## File Naming Convention

Images are named using the pattern: `{consonant}_{roman}.png`

Examples:
- `ko_kai.png` - ก (กอ-ไก่)
- `kho_khai.png` - ข (ขอ-ไข่)
- `kho_khuat.png` - ฃ (ฃอ-ขวด)

## Required Images (44 total)

1. ko_kai.png - ก (กอ-ไก่) - chicken
2. kho_khai.png - ข (ขอ-ไข่) - egg
3. kho_khuat.png - ฃ (ฃอ-ขวด) - bottle
4. kho_khwai.png - ค (คอ-ควาย) - buffalo
5. kho_khon.png - ฅ (ฅอ-คน) - person
6. kho_rakhang.png - ฆ (ฆอ-ระฆัง) - bell
7. ngo_ngu.png - ง (งอ-งู) - snake
8. jo_jan.png - จ (จอ-จาน) - plate
9. cho_ching.png - ฉ (ฉอ-ฉิ่ง) - cymbals
10. cho_chang.png - ช (ชอ-ช้าง) - elephant
11. so_so.png - ซ (ซอ-โซ่) - chain
12. cho_cho.png - ฌ (ฌอ-เฌอ) - tree
13. yo_ying.png - ญ (ญอ-หญิง) - woman
14. do_chada.png - ฎ (ฎอ-ชฎา) - crown
15. to_patak.png - ฏ (ฏอ-ปฏัก) - goad
16. tho_than.png - ฐ (ฐอ-ฐาน) - base
17. tho_montho.png - ฑ (ฑอ-มณโฑ) - doll
18. tho_phuthao.png - ฒ (ฒอ-ผู้เฒ่า) - elder
19. no_nen.png - ณ (ณอ-เณร) - novice
20. do_dek.png - ด (ดอ-เด็ก) - child
21. to_tao.png - ต (ตอ-เต่า) - turtle
22. tho_thung.png - ถ (ถอ-ถุง) - bag
23. tho_thahan.png - ท (ทอ-ทหาร) - soldier
24. tho_thong.png - ธ (ธอ-ธง) - flag
25. no_nu.png - น (นอ-หนู) - mouse
26. bo_baimai.png - บ (บอ-ใบไม้) - leaf
27. po_pla.png - ป (ปอ-ปลา) - fish
28. pho_phueng.png - ผ (ผอ-ผึ้ง) - bee
29. fo_fa.png - ฝ (ฝอ-ฝา) - lid
30. pho_phan.png - พ (พอ-พาน) - tray
31. fo_fan.png - ฟ (ฟอ-ฟัน) - tooth
32. pho_samphao.png - ภ (ภอ-สำเภา) - junk
33. mo_ma.png - ม (มอ-ม้า) - horse
34. yo_yak.png - ย (ยอ-ยักษ์) - giant
35. ro_ruea.png - ร (รอ-เรือ) - boat
36. lo_ling.png - ล (ลอ-ลิง) - monkey
37. wo_waen.png - ว (วอ-แหวน) - ring
38. so_sala.png - ศ (ศอ-ศาลา) - pavilion
39. so_ruesi.png - ษ (ษอ-ฤาษี) - hermit
40. so_suea.png - ส (สอ-เสือ) - tiger
41. ho_hip.png - ห (หอ-หีบ) - box
42. lo_chula.png - ฬ (ฬอ-จุฬา) - kite
43. o_ang.png - อ (ออ-อ่าง) - basin
44. ho_nokhuk.png - ฮ (ฮอ-นกฮูก) - owl

## Image Specifications

- Format: PNG with transparent background
- Size: 200x200 pixels minimum
- Style: Cartoon/illustrated style matching the app theme
- Background: Transparent or white with rounded corners

## Usage in Code

Images are loaded using:
```javascript
const imagePath = `/src/assets/letters/${consonant}_${roman}.png`;
const image = require(`../assets/letters/${consonant}_${roman}.png`);
```

## Note

Currently using placeholder images. Replace with actual consonant illustrations for production.
