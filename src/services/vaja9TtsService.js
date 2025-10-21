import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import api from './apiClient';

const DEFAULT_SPEECH_OPTIONS = {
  language: 'th-TH',
  rate: 0.95,
  pitch: 1.0,
  quality: Speech.VoiceQuality?.Enhanced,
};

let currentPlayback = {
  sound: null,
  fileUri: null,
};

const releaseCurrentPlayback = async () => {
  const { sound, fileUri } = currentPlayback;
  currentPlayback = { sound: null, fileUri: null };

  if (sound) {
    try {
      await sound.stopAsync();
    } catch (err) {
      console.warn('⚠️ [TTS] stopAsync failed:', err?.message);
    }

    try {
      await sound.unloadAsync();
    } catch (err) {
      console.warn('⚠️ [TTS] unloadAsync failed:', err?.message);
    }
  }

  if (fileUri) {
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (err) {
      console.warn('⚠️ [TTS] deleteAsync failed:', err?.message);
    }
  }
};

const resolveFileExtension = (mimeType) => {
  if (!mimeType) {
    return 'wav';
  }

  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    return 'mp3';
  }

  if (mimeType.includes('wav') || mimeType.includes('wave')) {
    return 'wav';
  }

  if (mimeType.includes('ogg')) {
    return 'ogg';
  }

  return 'wav';
};

const playViaVajaX = async (text, options = {}) => {
  const payload = {
    text,
    speaker: options.speaker,
    style: options.style,
    speed: options.speed,
    nfeSteps: options.nfeSteps,
    seed: options.seed,
    usePhoneme: options.usePhoneme,
    referenceAudio: options.referenceAudio,
    referenceText: options.referenceText,
  };

  // Remove undefined fields to keep payload clean
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  const { data: response } = await api.post('tts/speak', payload);

  if (!response?.success) {
    throw new Error(response?.message || 'VajaX request failed');
  }

  const ttsData = response.data || {};

  // Support both audioUrl (new) and audioBase64 (legacy)
  if (!ttsData.audioUrl && !ttsData.audioBase64) {
    throw new Error('No audio data returned from backend');
  }

  let fileUri;

  if (ttsData.audioUrl) {
    // Download from URL
    console.log('📥 [TTS] Downloading audio from URL:', ttsData.audioUrl);
    fileUri = `${FileSystem.cacheDirectory}tts-${Date.now()}.wav`;
    
    try {
      const result = await FileSystem.downloadAsync(ttsData.audioUrl, fileUri);
      console.log('✅ [TTS] Audio downloaded:', result.uri);
    } catch (error) {
      console.error('❌ [TTS] Failed to download audio from URL:', error?.message);
      throw new Error(`Failed to download audio: ${error?.message}`);
    }
  } else {
    // Legacy: Use base64
    console.log('📝 [TTS] Using base64 audio data');
    const extension = resolveFileExtension(ttsData.mimeType);
    fileUri = `${FileSystem.cacheDirectory}tts-${Date.now()}.${extension}`;
    const encoding = FileSystem.EncodingType?.Base64 || 'base64';
    
    await FileSystem.writeAsStringAsync(fileUri, ttsData.audioBase64, {
      encoding,
    });
  }

  const sound = new Audio.Sound();
  await sound.loadAsync({ uri: fileUri });
  await sound.playAsync();

  currentPlayback = { sound, fileUri };

  sound.setOnPlaybackStatusUpdate(async (status) => {
    if (status.didJustFinish || status.isLoaded === false) {
      await releaseCurrentPlayback();
    }
  });
};

const speakWithExpo = async (text, options = {}) => {
  return new Promise((resolve) => {
    try {
      Speech.speak(text, {
        ...DEFAULT_SPEECH_OPTIONS,
        ...options,
        onDone: resolve,
        onStopped: resolve,
        onError: (err) => {
          console.error('❌ [TTS] Expo Speech error:', err?.message);
          resolve();
        },
      });
    } catch (error) {
      console.error('❌ [TTS] Failed to start Expo Speech:', error?.message);
      resolve();
    }
  });
};

const vaja9TtsService = {
  // เล่นเสียงภาษาไทยด้วย VajaX (fallback เป็น Expo Speech หากล้มเหลว)
  playThai: async (text, options = {}) => {
    try {
      if (!text) {
        console.log('⚠️ [TTS] No text provided');
        return;
      }

      await vaja9TtsService.stop();

      console.log('🎧 [TTS] Playing via VajaX:', text);

      await playViaVajaX(text, options);

      console.log('✅ [TTS] VajaX playback started');
    } catch (error) {
      console.error('❌ [TTS] VajaX error, falling back:', error?.message);
      await speakWithExpo(text, options);
    }
  },

  // เล่นเสียงพยัญชนะ
  playConsonant: async (consonant) => {
    if (!consonant) {
      return;
    }
    const phrase = consonant.name || consonant.thai || consonant.char;
    await vaja9TtsService.playThai(phrase);
  },

  // เล่นเสียงคำถาม
  playQuestion: async (question) => {
    if (!question) {
      return;
    }
    await vaja9TtsService.playThai(question);
  },

  // หยุดเสียงทั้งหมด
  stop: async () => {
    await releaseCurrentPlayback();
    try {
      await Speech.stop();
    } catch (error) {
      console.error('❌ [TTS] Error stopping speech:', error);
    }
  },

  // ตรวจสอบว่าเสียงกำลังเล่นอยู่หรือไม่
  isPlaying: async () => {
    const { sound } = currentPlayback;
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        return Boolean(status.isLoaded && status.isPlaying);
      } catch (error) {
        console.warn('⚠️ [TTS] getStatusAsync failed:', error?.message);
      }
    }

    try {
      return await Speech.isSpeakingAsync();
    } catch (error) {
      console.warn('⚠️ [TTS] Speech.isSpeakingAsync failed:', error?.message);
      return false;
    }
  },

  // ทำความสะอาดทรัพยากรเสียง
  cleanup: async () => {
    await vaja9TtsService.stop();
  },
};

export default vaja9TtsService;
