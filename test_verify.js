const fs = require('fs');
const path = require('path');

console.log('�� Checking Intermediate Lessons Configuration...\n');

// 1. Check CUSTOM_STAGE_META
console.log('✅ 1. CUSTOM_STAGE_META Configuration:');
const levelStage2 = fs.readFileSync('src/screens/LevelStage2.js', 'utf8');
const hasGameScreens = ['Intermediate1FoodDrinksGame', 'IntermediateEmotionsGame', 'IntermediatePlacesGame', 'IntermediateRoutinesGame'].map(screen => {
  const found = levelStage2.includes(`gameScreen: '${screen}'`);
  console.log(`   ${found ? '✓' : '✗'} ${screen}`);
  return found;
});

// 2. Check Navigation Routes
console.log('\n✅ 2. BottomTabNavigator Routes:');
const tabNav = fs.readFileSync('src/navigation/BottomTabNavigator.js', 'utf8');
['IntermediateEmotionsGame', 'IntermediatePlacesGame', 'IntermediateRoutinesGame'].forEach(screen => {
  const found = tabNav.includes(`name="${screen}"`);
  console.log(`   ${found ? '✓' : '✗'} Route: ${screen}`);
});

// 3. Check Navigation Handlers in LevelStage2
console.log('\n✅ 3. LevelStage2 Navigation Handlers:');
['IntermediateEmotionsGame', 'IntermediatePlacesGame', 'IntermediateRoutinesGame'].forEach(screen => {
  const found = levelStage2.includes(`gameScreen === '${screen}'`);
  console.log(`   ${found ? '✓' : '✗'} Handler: ${screen}`);
});

// 4. Check Screen Files Exist
console.log('\n✅ 4. Screen Files Exist:');
['IntermediateEmotionsGame', 'IntermediatePlacesGame', 'IntermediateRoutinesGame'].forEach(screen => {
  const file = `src/screens/${screen}.js`;
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✓' : '✗'} ${file}`);
});

// 5. Check Fallback Data in LevelStage2
console.log('\n✅ 5. Fallback Data (LevelStage2):');
const lessons = ['Food & Drinks', 'Emotions & Feelings', 'Places & Location', 'Daily Routines'];
lessons.forEach((lesson, idx) => {
  const found = levelStage2.includes(lesson);
  console.log(`   ${found ? '✓' : '✗'} Lesson ${idx + 1}: ${lesson}`);
});

console.log('\n✅ Configuration Check Complete!\n');
