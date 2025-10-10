import * as Speech from "expo-speech";

const vaja9TtsService = {
  // เล่นเสียงภาษาไทย
  playThai: async (text) => {
    try {
      if (!text) {
        console.log('⚠️ No text provided for TTS');
        return;
      }
      
      console.log(`🔊 Playing TTS: ${text}`);
      
      // หยุดเสียงเก่าก่อน
      await Speech.stop();
      
      // เล่นเสียงใหม่
      await Speech.speak(text, { 
        language: "th-TH", 
        rate: 0.95,
        pitch: 1.0,
        quality: Speech.VoiceQuality.Enhanced
      });
      
      console.log('✅ TTS played successfully');
    } catch (error) {
      console.error('❌ TTS Error:', error);
    }
  },

  // เล่นเสียงพยัญชนะ
  playConsonant: async (consonant) => {
    try {
      if (!consonant) return;
      
      // เล่นชื่อพยัญชนะ (เช่น "กอ-ไก่")
      await vaja9TtsService.playThai(consonant.name || consonant.thai);
    } catch (error) {
      console.error('❌ Error playing consonant:', error);
    }
  },

  // เล่นเสียงคำถาม
  playQuestion: async (question) => {
    try {
      if (!question) return;
      
      // เล่นคำถาม
      await vaja9TtsService.playThai(question);
    } catch (error) {
      console.error('❌ Error playing question:', error);
    }
  },

  // หยุดเสียง
  stop: async () => {
    try {
      await Speech.stop();
      console.log('🔇 TTS stopped');
    } catch (error) {
      console.error('❌ Error stopping TTS:', error);
    }
  },

  // ตรวจสอบว่าเสียงกำลังเล่นอยู่หรือไม่
  isPlaying: () => {
    return Speech.isSpeakingAsync();
  },

  // หยุดเสียงและทำความสะอาด
  cleanup: async () => {
    try {
      await Speech.stop();
      console.log('🧹 TTS cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
};

export default vaja9TtsService;