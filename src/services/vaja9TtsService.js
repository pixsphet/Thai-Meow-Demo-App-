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

// Audio URL cache - stores remote URLs, not local paths
let audioUrlCache = new Map();

// Load cache from AsyncStorage on startup
const loadAudioUrlCache = async () => {
  try {
    const cached = await AsyncStorage.getItem(TTS_CACHE_KEY);
    if (cached) {
      const cacheObj = JSON.parse(cached);
      audioUrlCache = new Map(Object.entries(cacheObj));
      console.log('✅ [TTS] Loaded audio URL cache from storage:', audioUrlCache.size, 'items');
    }
  } catch (error) {
    console.warn('⚠️ [TTS] Failed to load cache:', error?.message);
  }
};

// Save cache to AsyncStorage
const saveAudioUrlCache = async () => {
  try {
    const cacheObj = Object.fromEntries(audioUrlCache);
    console.log('💾 [TTS] Saving audio URL cache...', Object.keys(cacheObj).length, 'items');
    await AsyncStorage.setItem(TTS_CACHE_KEY, JSON.stringify(cacheObj));
    console.log('✅ [TTS] Cache saved!');
  } catch (error) {
    console.error('❌ [TTS] Failed to save cache:', error?.message);
  }
};

// Initialize cache on app load
loadAudioUrlCache();

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

// Test audio playback on app load
const testAudioPlayback = async () => {
  try {
    console.log('🔊 [TTS] Testing audio output...');
    await Audio.Sound.createAsync(
      require('../../assets/sounds/test.wav'),
      { volume: 1 },
      async (status) => {
        if (status.isLoaded) {
          console.log('✅ [TTS] Audio test successful - sound is working!');
        }
      }
    ).catch(err => {
      console.log('ℹ️ [TTS] No test sound available (OK)');
    });
  } catch (error) {
    console.log('ℹ️ [TTS] Audio test skipped');
  }
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

const playAudioFile = async (fileUri) => {
  try {
    await configureAudioSession();
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri: fileUri });
    console.log('📢 [TTS] Sound loaded, playing now...');
    const status = await sound.playAsync();
    console.log('✅ [TTS] Playback status:', status?.isPlaying, 'Duration:', status?.durationMillis, 'ms');

    currentPlayback = { sound, fileUri };

    sound.setOnPlaybackStatusUpdate(async (status) => {
      console.log('📊 [TTS] Playback update:', { isPlaying: status?.isPlaying, didJustFinish: status?.didJustFinish });
      if (status.didJustFinish || status.isLoaded === false) {
        await releaseCurrentPlayback();
      }
    });
  } catch (error) {
    console.error('❌ [TTS] Failed to play audio from cache:', error?.message, error);
    console.warn('⚠️ [TTS] Falling back to Expo Speech');
    // Fallback to Expo Speech
    await speakWithExpo(null, { referenceAudio: fileUri }); // Assuming referenceAudio can be used for fallback
  }
};

const playViaVajaX = async (text, options = {}) => {
  const cacheKey = `${text}:${options.speaker || 'default'}`;
  console.log('🔍 [TTS] Checking cache for:', cacheKey, '| Cache size:', audioUrlCache.size);
  
  // Check if audio URL is already cached
  if (audioUrlCache.has(cacheKey)) {
    console.log('⚡ [TTS] Playing from cache (instant!):', cacheKey);
    const cachedUrl = audioUrlCache.get(cacheKey);
    console.log('⚡ [TTS] Cached URL:', cachedUrl);
    
    try {
      await configureAudioSession();
      await playAudioFile(cachedUrl);
      return;
    } catch (error) {
      console.error('❌ [TTS] Failed to play cached audio:', error?.message);
      audioUrlCache.delete(cacheKey);
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
    audioUrlCache.set(cacheKey, ttsData.audioUrl);
    await saveAudioUrlCache();
    console.log('💾 [TTS] Cached audio URL:', cacheKey);
    
    // Download to temp cache file
    console.log('📥 [TTS] Downloading audio to cache...');
    const tempFileName = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`;
    const tempFileUri = `${FileSystem.cacheDirectory}${tempFileName}`;
    
    try {
      const result = await FileSystem.downloadAsync(ttsData.audioUrl, tempFileUri);
      console.log('✅ [TTS] Audio downloaded to:', tempFileUri);
      
      // Play from temp cache
      await playAudioFile(result.uri);
    } catch (downloadError) {
      console.error('❌ [TTS] Failed to download audio:', downloadError?.message);
      throw new Error(`Failed to download audio: ${downloadError?.message}`);
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
