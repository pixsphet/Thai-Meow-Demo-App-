// Script to reset all progress
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function resetAllProgress() {
  try {
    console.log('🔄 Resetting all progress...');
    
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📋 Found keys:', allKeys.length);
    
    // Filter progress-related keys
    const progressKeys = allKeys.filter(key =>
      key.includes('progress') ||
      key.includes('lesson') ||
      key.includes('game_session') ||
      key.includes('userStats') ||
      key.includes('unlock') ||
      key.includes('streak') ||
      key.includes('xp') ||
      key.includes('diamonds') ||
      key.includes('hearts')
    );
    
    console.log('🗑️  Removing keys:', progressKeys);
    
    if (progressKeys.length > 0) {
      await AsyncStorage.multiRemove(progressKeys);
      console.log('✅ Cleared', progressKeys.length, 'keys');
    }
    
    console.log('✅ All progress reset successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetAllProgress();
