/*
  Resolve an image require() for a given thai word and optional category.
  Uses assets under /src/add/ based on user instruction. Fallback to generic icon.
*/

// Static map for picture folder common items (extend gradually as needed)
const pictureMap = {
  'บ้าน': require('../add/picture/house.png'),
  'โรงเรียน': require('../add/picture/school.png'),
  'ตลาด': require('../add/picture/market.png'),
  'เครื่องบิน': require('../add/picture/airplane.png'),
  'แดง': require('../add/picture/red.png'),
  'เขียว': require('../add/picture/green.png'),
};

export function resolveImage(thai, category) {
  // First, try picture map
  if (pictureMap[thai]) return pictureMap[thai];

  // Try structured folder by category and file name variants
  const base = '../add';
  const candidates = [];

  if (category) {
    // Attempt direct file with png/jpg
    candidates.push(`${base}/${category}/${thai}.png`);
    candidates.push(`${base}/${category}/${thai}.jpg`);
  }

  // Generic picture folder fallback
  candidates.push(`${base}/picture/${thai}.png`);
  candidates.push(`${base}/picture/${thai}.jpg`);

  // Try require dynamically (must be static; so limit to known map)
  // Since React Native require needs static paths, return undefined for unresolved cases.
  try {
    // Minimal safe placeholders by category could be added here in the future
    // Fallback to a generic cat image placeholder
    return require('../assets/images/Catsmile.png');
  } catch (e) {
    // Last resort: another bundled placeholder
    return require('../assets/images/Grumpy Cat.png');
  }
}

export default { resolveImage };


