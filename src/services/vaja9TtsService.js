import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiClient';

const DEFAULT_SPEECH_OPTIONS = {
  language: 'th-TH',
  rate: 0.95,
  pitch: 1.0,
  quality: Speech.VoiceQuality?.Enhanced,
};

// Cache key for AsyncStorage
const TTS_CACHE_KEY = 'tts_audio_cache';

// Load cache from AsyncStorage on startup
let audioCache = new Map();

const loadAudioCache = async () => {
  try {
    const cached = await AsyncStorage.getItem(TTS_CACHE_KEY);
    if (cached) {
      const cacheObj = JSON.parse(cached);
      audioCache = new Map(Object.entries(cacheObj));
      console.log('✅ [TTS] Loaded audio cache from storage:', audioCache.size, 'items');
    }
  } catch (error) {
    console.warn('⚠️ [TTS] Failed to load cache:', error?.message);
  }
};

// Save cache to AsyncStorage
const saveAudioCache = async () => {
  try {
    const cacheObj = Object.fromEntries(audioCache);
    console.log('💾 [TTS] Saving cache to AsyncStorage...', Object.keys(cacheObj).length, 'items');
    await AsyncStorage.setItem(TTS_CACHE_KEY, JSON.stringify(cacheObj));
    console.log('✅ [TTS] Cache saved successfully!');
  } catch (error) {
    console.error('❌ [TTS] Failed to save cache:', error?.message);
  }
};

// Initialize cache on app load
loadAudioCache();

// Configure audio session
const configureAudioSession = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionMode: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
    console.log('✅ [TTS] Audio session configured');
  } catch (error) {
    console.error('❌ [TTS] Failed to configure audio session:', error?.message);
  }
};

// Initialize audio session on first load
Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  interruptionMode: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  staysActiveInBackground: false,
}).catch((e) => console.warn('Audio mode warning:', e?.message));

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
  const cacheKey = `${text}:${options.speaker || 'default'}`;
  console.log('🔍 [TTS] Checking cache for:', cacheKey, '| Cache size:', audioCache.size);
  
  // Check if audio URL is already cached
  if (audioCache.has(cacheKey)) {
    console.log('⚡ [TTS] Playing from cache (instant!):', cacheKey);
    const cachedUrl = audioCache.get(cacheKey);
    console.log('⚡ [TTS] Cached URL:', cachedUrl);
    
    try {
      await configureAudioSession();
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: cachedUrl });
      console.log('✅ [TTS] Cache audio loaded, playing...');
      await sound.playAsync();

      currentPlayback = { sound, fileUri: null };

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish || status.isLoaded === false) {
          await releaseCurrentPlayback();
        }
      });
      return;
    } catch (error) {
      console.error('❌ [TTS] Failed to play cached audio:', error?.message);
      audioCache.delete(cacheKey);
      // Continue to request new audio
    }
  }

  console.log('📝 [TTS] Cache miss, need to request from API');
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

  console.log('🌐 [TTS] Requesting audio from backend...');
  const { data: response } = await api.post('tts/speak', payload);

  if (!response?.success) {
    throw new Error(response?.message || 'VajaX request failed');
  }

  const ttsData = response.data || {};

  // Support both audioUrl (new) and audioBase64 (legacy)
  if (!ttsData.audioUrl && !ttsData.audioBase64) {
    throw new Error('No audio data returned from backend');
  }

  if (ttsData.audioUrl) {
    // Cache the URL for future use
    audioCache.set(cacheKey, ttsData.audioUrl);
    await saveAudioCache(); // Save cache after successful request
    console.log('💾 [TTS] Cached audio URL for:', cacheKey);
    
    // Play directly from URL (real-time, no waiting for download)
    console.log('🎵 [TTS] Playing audio directly from URL (real-time):', ttsData.audioUrl);
    
    try {
      // Ensure audio session is configured
      await configureAudioSession();
      
      const sound = new Audio.Sound();
      console.log('🔊 [TTS] Loading audio with URL:', ttsData.audioUrl);
      await sound.loadAsync({ uri: ttsData.audioUrl });
      
      console.log('📢 [TTS] Sound loaded, playing now...');
      const status = await sound.playAsync();
      console.log('✅ [TTS] Playback status:', status?.isPlaying);

      currentPlayback = { sound, fileUri: null };

      sound.setOnPlaybackStatusUpdate(async (status) => {
        console.log('📊 [TTS] Playback update:', { isPlaying: status?.isPlaying, didJustFinish: status?.didJustFinish });
        if (status.didJustFinish || status.isLoaded === false) {
          await releaseCurrentPlayback();
        }
      });
    } catch (error) {
      console.error('❌ [TTS] Failed to play audio from URL:', error?.message, error);
      console.warn('⚠️ [TTS] Falling back to Expo Speech');
      // Fallback to Expo Speech
      await speakWithExpo(text, options);
    }
  } else {
    // Legacy: Use base64 (fallback)
    console.log('📝 [TTS] Using base64 audio data (fallback)');
    const extension = resolveFileExtension(ttsData.mimeType);
    const fileUri = `${FileSystem.cacheDirectory}tts-${Date.now()}.${extension}`;
    const encoding = FileSystem.EncodingType?.Base64 || 'base64';
    
    await FileSystem.writeAsStringAsync(fileUri, ttsData.audioBase64, {
      encoding,
    });

    const sound = new Audio.Sound();
    await sound.loadAsync({ uri: fileUri });
    await sound.playAsync();

    currentPlayback = { sound, fileUri };

    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish || status.isLoaded === false) {
        await releaseCurrentPlayback();
      }
    });
  }
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
