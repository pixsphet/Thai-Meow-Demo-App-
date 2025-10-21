const fs = require('fs');
const path = require('path');

const VAJAX_ENDPOINT = 'https://api.aiforthai.in.th/vaja';

const VAJAX_API_KEY = process.env.VAJAX_API_KEY;
const DEFAULT_SPEAKER = (process.env.VAJAX_SPEAKER || 'nana').trim();
const DEFAULT_STYLE = (process.env.VAJAX_STYLE || '').trim();
const DEFAULT_REFERENCE_AUDIO_PATH = process.env.VAJAX_REFERENCE_AUDIO_PATH;
const DEFAULT_REFERENCE_TEXT = (process.env.VAJAX_REFERENCE_TEXT || '').trim();

const backendRoot = path.join(__dirname, '..');

let cachedReference = null;
let cachedReferenceError = null;

const clampNumber = (value, min, max) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  if (parsed < min) {
    return min;
  }
  if (parsed > max) {
    return max;
  }
  return parsed;
};

const sanitizeSpeaker = (value) => {
  const speaker = (value || '').trim();
  return speaker || DEFAULT_SPEAKER;
};

const sanitizeStyle = (value) => {
  const style = (value || '').trim();
  return style || DEFAULT_STYLE || undefined;
};

const ensureConfig = () => {
  if (!VAJAX_API_KEY || VAJAX_API_KEY.trim() === '') {
    throw new Error('Missing VajaX API key. Set VAJAX_API_KEY in backend/config.env');
  }
};

const readFileAsBase64 = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  return buffer.toString('base64');
};

const resolveDefaultReference = async () => {
  if (cachedReference !== null || cachedReferenceError) {
    return { ...cachedReference, error: cachedReferenceError };
  }

  if (!DEFAULT_REFERENCE_AUDIO_PATH) {
    cachedReference = {
      audioBase64: null,
      text: DEFAULT_REFERENCE_TEXT || '',
    };
    return { ...cachedReference };
  }

  try {
    const resolvedPath = path.isAbsolute(DEFAULT_REFERENCE_AUDIO_PATH)
      ? DEFAULT_REFERENCE_AUDIO_PATH
      : path.join(backendRoot, DEFAULT_REFERENCE_AUDIO_PATH);

    const base64 = await readFileAsBase64(resolvedPath);

    cachedReference = {
      audioBase64: base64,
      text: DEFAULT_REFERENCE_TEXT || '',
    };

    return { ...cachedReference };
  } catch (error) {
    cachedReferenceError = error;
    console.error('❌ [TTS] Failed to load default VajaX reference audio:', {
      path: DEFAULT_REFERENCE_AUDIO_PATH,
      message: error.message,
    });

    return {
      audioBase64: null,
      text: DEFAULT_REFERENCE_TEXT || '',
      error,
    };
  }
};

const extractAudioBase64 = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.audio_base64) {
    return payload.audio_base64;
  }

  if (payload.result?.audio_base64) {
    return payload.result.audio_base64;
  }

  if (payload.result && typeof payload.result === 'string' && payload.result.startsWith('Ukl')) {
    return payload.result;
  }

  if (payload.audioContent) {
    return payload.audioContent;
  }

  return null;
};

exports.generateSpeech = async (req, res) => {
  try {
    ensureConfig();

    const {
      text,
      targetText,
      referenceAudio,
      referenceText,
      speaker,
      style,
      speed,
      nfeSteps,
      seed,
      usePhoneme,
    } = req.body || {};

    const resolvedText = (text || targetText || '').trim();

    if (!resolvedText) {
      return res.status(400).json({
        success: false,
        message: 'text (or targetText) is required for TTS generation',
      });
    }

    const payload = {
      text: resolvedText,
      speaker: sanitizeSpeaker(speaker),
    };

    const resolvedStyle = sanitizeStyle(style);
    if (resolvedStyle) {
      payload.style = resolvedStyle;
    }

    if (referenceAudio) {
      payload.reference_audio = referenceAudio;
    }

    if (referenceText) {
      payload.reference_text = referenceText;
    }

    const resolvedSpeed = clampNumber(speed, 0.5, 2.0);
    if (resolvedSpeed !== undefined) {
      payload.speed = resolvedSpeed;
    }

    const resolvedNfeSteps = clampNumber(nfeSteps, 16, 64);
    if (resolvedNfeSteps !== undefined) {
      payload.nfe_steps = Math.round(resolvedNfeSteps);
    }

    if (seed !== undefined && seed !== null && seed !== '') {
      const parsedSeed = Number(seed);
      if (Number.isFinite(parsedSeed)) {
        payload.seed = parsedSeed;
      }
    }

    if (typeof usePhoneme === 'boolean') {
      payload.use_phoneme = usePhoneme;
    }

    console.log('🎙️ [TTS] Generating speech via VajaX', {
      speaker: payload.speaker,
      style: payload.style,
      hasReferenceAudio: Boolean(payload.reference_audio),
      textLength: resolvedText.length,
    });

    const response = await fetch(VAJAX_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Apikey: VAJAX_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      console.error('❌ [TTS] VajaX error response:', {
        status: response.status,
        body: responseBody,
      });

      return res.status(response.status || 502).json({
        success: false,
        message: responseBody?.detail?.msg || responseBody?.message || 'Failed to generate speech with VajaX',
        details: responseBody,
      });
    }

    const audioUrl = responseBody?.audio_url;

    if (!audioUrl) {
      console.error('❌ [TTS] VajaX returned no audio URL', responseBody);
      return res.status(502).json({
        success: false,
        message: 'VajaX did not return audio URL',
        details: responseBody,
      });
    }

    return res.json({
      success: true,
      data: {
        audioUrl,
        text: resolvedText,
        speaker: payload.speaker,
      },
    });
  } catch (error) {
    console.error('❌ [TTS] VajaX request failed:', {
      message: error.message,
    });

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
