import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Services
import vaja9TtsService from '../services/vaja9TtsService';
import { saveProgress, restoreProgress, clearProgress } from '../services/progressService';
import gameProgressService from '../services/gameProgressService';
import levelUnlockService from '../services/levelUnlockService';
import userStatsService from '../services/userStatsService';
// daily streak service removed from in-game usage per request

// Contexts
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useUserData } from '../contexts/UserDataContext';

// Remove FireStreakAlert from in-game

const { width, height } = Dimensions.get('window');

// Question Types
const QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  DRAG_MATCH: 'DRAG_MATCH',
};

// Colors
const COLORS = {
  primary: '#FF8000',
  cream: '#FFF5E5',
  white: '#FFFFFF',
  dark: '#2C3E50',
  success: '#58cc02',
  error: '#ff4b4b',
  lightGray: '#f5f5f5',
  gray: '#666',
};

// Helper Functions
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).substr(2, 9);

const emotionImages = {
  'ดีใจ': require('../add/Emotions/ดีใจ.png'),
  'เสียใจ': require('../add/Emotions/เสียใจ.png'),
  'โกรธ': require('../add/Emotions/โกรธ.png'),
  'กลัว': require('../add/Emotions/กลัว.png'),
  'เบื่อ': require('../add/Emotions/เบื่อ.png'),
  'เหงา': require('../add/Emotions/เหงา.png'),
  'ตกใจ': require('../add/Emotions/ตกใจ.png'),
  'มีความสุข': require('../add/Emotions/มีความสุข.png'),
  'ภูมิใจ': require('../add/Emotions/ภูมิใจ.png'),
  'กังวล': require('../add/Emotions/กังวล.png'),
  'รัก': require('../add/Emotions/รัก.png'),
  'เกลียด': require('../add/Emotions/เกลียด.png'),
  'สงสัย': require('../add/Emotions/สงสัย.png'),
  'หิว': require('../add/Emotions/หิว.png'),
  'ง่วง': require('../add/Emotions/ง่วง.png'),
  'สนุก': require('../add/Emotions/สนุก.png'),
  'ผ่อนคลาย': require('../add/Emotions/ผ่อนคลาย.png'),
  'เครียด': require('../add/Emotions/เครียด.png'),
};

const RAW_EMOTIONS = [
  { thai: 'ดีใจ', roman: 'dii-jai', english: 'Happy' },
  { thai: 'เสียใจ', roman: 'sia-jai', english: 'Sad' },
  { thai: 'โกรธ', roman: 'kroht', english: 'Angry' },
  { thai: 'กลัว', roman: 'kluua', english: 'Afraid' },
  { thai: 'เบื่อ', roman: 'beua', english: 'Bored' },
  { thai: 'เหงา', roman: 'ngao', english: 'Lonely' },
  { thai: 'ตกใจ', roman: 'tok-jai', english: 'Surprised' },
  { thai: 'มีความสุข', roman: 'mii-khwaam-suk', english: 'Joyful' },
  { thai: 'ภูมิใจ', roman: 'phuum-jai', english: 'Proud' },
  { thai: 'กังวล', roman: 'kang-won', english: 'Worried' },
  { thai: 'รัก', roman: 'rak', english: 'Love' },
  { thai: 'เกลียด', roman: 'gliat', english: 'Hate' },
  { thai: 'สงสัย', roman: 'song-sai', english: 'Curious' },
  { thai: 'หิว', roman: 'hiu', english: 'Hungry' },
  { thai: 'ง่วง', roman: 'nguang', english: 'Sleepy' },
  { thai: 'สนุก', roman: 'sa-nuk', english: 'Having fun' },
  { thai: 'ผ่อนคลาย', roman: 'phon-khlaai', english: 'Relaxed' },
  { thai: 'เครียด', roman: 'khriat', english: 'Stressed' },
];

const EMOTIONS = RAW_EMOTIONS.map((item) => ({
  id: `emotion_${item.thai}`,
  thai: item.thai,
  english: item.english,
  roman: item.roman,
  imageKey: item.thai,
  audioText: item.thai,
}));

// UI helper for hint texts per question type
const getHintText = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
      return 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกคำอารมณ์ที่ได้ยิน';
    case QUESTION_TYPES.PICTURE_MATCH:
      return 'ดูภาพอารมณ์ตรงกลาง แล้วเลือกคำที่ตรงกัน';
    case QUESTION_TYPES.DRAG_MATCH:
      return 'จับคู่คำไทยกับภาพและคำแปลภาษาอังกฤษ';
    default:
      return '';
  }
};

// Language helpers
const isThaiText = (text) => /[ก-๙]/.test(String(text || ''));

const getTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียงเลือกอารมณ์';
    case QUESTION_TYPES.PICTURE_MATCH: return 'จับคู่จากภาพ';
    case QUESTION_TYPES.DRAG_MATCH: return 'จับคู่ไทย ↔ อังกฤษ';
    default: return '';
  }
};

// Helper constants for syllable building
// Question Generators
const makeListenChoose = (word, pool, usedWords = new Set()) => {
  const wrongChoices = shuffle(
    pool.filter(w => w.thai !== word.thai && !usedWords.has(w.thai))
  ).slice(0, 3);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `lc_${word.id}_${uid()}`,
    type: QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังเสียงแล้วเลือกอารมณ์ที่ได้ยิน',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: word.audioText,
    correctText: word.thai,
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.thai,
      roman: c.roman,
      english: c.english,
      text: `${c.thai}\n${c.roman}`,
      speakText: c.audioText || c.thai,
      isCorrect: c.thai === word.thai,
    })),
  };
};

const makePictureMatch = (word, pool, usedWords = new Set()) => {
  const wrongChoices = shuffle(
    pool.filter(w => w.thai !== word.thai && !usedWords.has(w.thai))
  ).slice(0, 3);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `pm_${word.id}_${uid()}`,
    type: QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูภาพแล้วเลือกคำอารมณ์ให้ตรง',
    imageKey: word.imageKey,
    imageSource: emotionImages[word.imageKey] || word.imageSource || null,
    correctText: word.thai,
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
    choices: choices.map((c, i) => ({
      id: i + 1,
      thai: c.thai,
      english: c.english,
      text: `${c.thai}\n${c.english}`,
      speakText: c.audioText || c.thai,
      isCorrect: c.thai === word.thai,
    })),
  };
};
 
const makeDragMatch = (word, pool, usedWords = new Set()) => {
  const otherWords = shuffle(
    pool.filter(w => w.thai !== word.thai && !usedWords.has(w.thai))
  ).slice(0, 3);
  const allWords = shuffle([word, ...otherWords]);

  // Left = Thai words, Right = English meanings → match by translation
  let leftItems = allWords.map((w, i) => ({
    id: `left_${i + 1}`,
    text: w.thai,
    correctMatch: w.english,
    speakText: w.audioText || w.thai,
  }));

  let rightItems = allWords.map((w, i) => ({
    id: `right_${i + 1}`,
    text: w.english,
    display: w.english,
    thai: w.thai,
    english: w.english,
    roman: w.roman,
    imageKey: w.imageKey,
    imageSource: emotionImages[w.imageKey] || w.imageSource || null,
    speakText: w.audioText || w.thai,
  }));

  // Shuffle columns independently for better variety
  leftItems = shuffle(leftItems);
  rightItems = shuffle(rightItems);

  return {
    id: `dm_${word.id}_${uid()}`,
    type: QUESTION_TYPES.DRAG_MATCH,
    instruction: 'จับคู่คำไทยกับภาพและคำแปลภาษาอังกฤษ',
    // Rewards for this question
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    leftItems,
    rightItems,
  };
};

// Generate questions tailored for emotions (focus on recognition and usage)
const generateEmotionQuestions = (pool) => {
  const questions = [];
  const usedWords = new Set();

  // LISTEN_CHOOSE × 5
  for (let i = 0; i < 5; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const word = pick(available);
    usedWords.add(word.thai);
    questions.push(makeListenChoose(word, pool, usedWords));
  }

  // PICTURE_MATCH × 4
  for (let i = 0; i < 4; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const word = pick(available);
    usedWords.add(word.thai);
    questions.push(makePictureMatch(word, pool, usedWords));
  }

  // DRAG_MATCH × 3
  for (let i = 0; i < 3; i++) {
    const available = pool.filter(w => !usedWords.has(w.thai));
    if (available.length === 0) break;
    const word = pick(available);
    usedWords.add(word.thai);
    questions.push(makeDragMatch(word, pool, usedWords));
  }


  // Shuffle for varied flow
  return shuffle(questions);
};

// Check answer
const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
    case QUESTION_TYPES.PICTURE_MATCH:
      return userAnswer === question.correctText;
    
    case QUESTION_TYPES.DRAG_MATCH:
      // For drag match, check if all pairs are correct
      return userAnswer && userAnswer.every(pair => 
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );

    default:
      return false;
  }
};

const IntermediateEmotionsGame = ({ navigation, route }) => {
  const {
    lessonId = 2,
    category: routeCategory = 'emotions',
    stageTitle = 'อารมณ์ระดับกลาง',
    level: stageLevel = 2,
    nextStageMeta: incomingNextStageMeta,
    stageSelectRoute = 'LevelStage2',
    replayRoute = 'IntermediateEmotionsGame',
    replayParams: incomingReplayParams,
  } = route.params || {};

  const resolvedNextStageMeta = useMemo(
    () => incomingNextStageMeta || null,
    [incomingNextStageMeta]
  );

  const resolvedReplayParams = useMemo(
    () => ({
      lessonId,
      category: routeCategory,
      level: stageLevel,
      stageTitle,
      ...(incomingReplayParams || {}),
    }),
    [lessonId, routeCategory, stageLevel, stageTitle, incomingReplayParams]
  );
  
  // Contexts
  const { applyDelta, user: progressUser } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();
  
  // State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [hearts, setHearts] = useState(5);
  // Streak counts kept for stats but UI/alerts removed
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [diamondsEarned, setDiamondsEarned] = useState(0);
  const [answers, setAnswers] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dmSelected, setDmSelected] = useState({ leftId: null, rightId: null });
  const [dmPairs, setDmPairs] = useState([]); // {leftId,rightId}
  // const [showFireStreakAlert, setShowFireStreakAlert] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null); // 'correct'|'wrong'|null
  
  // Refs
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);
  
  // Load emotions data
  useEffect(() => {
    const loadEmotions = async () => {
      try {
        const normalizedEmotions = EMOTIONS.map((emotion) => ({
          ...emotion,
          imageSource: emotionImages[emotion.imageKey] || null,
        }));

        // Generate questions
        const generatedQuestions = generateEmotionQuestions(normalizedEmotions);
        setQuestions(generatedQuestions);

        // Try to restore progress
        const savedProgress = await restoreProgress(lessonId);
        const isValidSnapshot =
          savedProgress &&
          savedProgress.questionsSnapshot &&
          savedProgress.gameProgress?.generator === 'intermediate_emotions';

        if (isValidSnapshot) {
          setResumeData(savedProgress);
          setCurrentIndex(savedProgress.currentIndex || 0);
          setHearts(savedProgress.hearts || 5);
          setStreak(savedProgress.streak || 0);
          setMaxStreak(savedProgress.maxStreak || 0);
          setScore(savedProgress.score || 0);
          setXpEarned(savedProgress.xpEarned || 0);
          setDiamondsEarned(savedProgress.diamondsEarned || 0);
          const restoredQuestions = (savedProgress.questionsSnapshot || []).map((q) => ({
            ...q,
            imageSource: q.imageKey ? emotionImages[q.imageKey] || null : q.imageSource || null,
          }));
          setQuestions(restoredQuestions.length ? restoredQuestions : generatedQuestions);
          const storedAnswers = savedProgress.answers || {};
          setAnswers(storedAnswers);
          answersRef.current = storedAnswers;
        } else if (savedProgress) {
          // Remove outdated snapshots from other lessons to avoid UI crashes
          try {
            await clearProgress(lessonId);
          } catch (clearErr) {
            console.warn('Failed to clear outdated progress snapshot:', clearErr?.message || clearErr);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading emotions:', error);
        setLoading(false);
      }
    };

    loadEmotions();
  }, [lessonId]);

  // Ensure progress-related services are initialized once per user
  useEffect(() => {
    const userId =
      progressUser?.id ||
      userData?.id ||
      stats?.userId ||
      stats?._id ||
      stats?.id;

    if (!userId || serviceInitRef.current) {
      return;
    }

    serviceInitRef.current = true;

    (async () => {
      try {
        await gameProgressService.initialize(userId);
      } catch (error) {
        console.warn('Failed to initialize gameProgressService:', error?.message || error);
      }

      try {
        await levelUnlockService.initialize(userId);
      } catch (error) {
        console.warn('Failed to initialize levelUnlockService:', error?.message || error);
      }

      try {
        await userStatsService.initialize(userId);
      } catch (error) {
        console.warn('Failed to initialize userStatsService:', error?.message || error);
      }

    })();
  }, [progressUser?.id, userData?.id, stats?.userId, stats?._id, stats?.id]);
  
  // Auto-save progress
  const autosave = useCallback(async () => {
    if (questions.length === 0) return;
    
    console.debug(`[AutoSave] Q${currentIndex + 1}/${questions.length}`, { score, hearts, xpEarned });
    
    const snapshot = {
      questionsSnapshot: questions,
      currentIndex,
      hearts,
      score,
      xpEarned,
      diamondsEarned,
      streak,
      maxStreak,
      answers: answersRef.current,
      gameProgress: {
        generator: 'intermediate_emotions',
        lessonId,
        timestamp: Date.now(),
      },
    };
    
    try {
        await saveProgress(lessonId, snapshot);
      } catch (error) {
        console.error('Error saving progress:', error);
      }
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, lessonId]);
  
  // Save progress when state changes
  useEffect(() => {
    if (gameStarted && !gameFinished) {
      autosave();
    }
  }, [currentIndex, hearts, score, streak, gameStarted, gameFinished, autosave]);
  
  // Play TTS
  const playTTS = useCallback(async (text) => {
    try {
      await vaja9TtsService.playThai(text);
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }, []);
  
  // Handle answer selection
  const handleAnswerSelect = (answer, speakText) => {
    setCurrentAnswer(answer);
    if (speakText) {
      vaja9TtsService.playThai(speakText);
    }
  };
  
  // Handle check answer
  const handleCheckAnswer = (overrideAnswer) => {
    const answerToCheck = overrideAnswer !== undefined ? overrideAnswer : currentAnswer;
    if (answerToCheck === null) return;
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = checkAnswer(currentQuestion, answerToCheck);
    
    console.debug(`[Answer Check] Q${currentIndex + 1}: ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}`, {
      type: currentQuestion.type,
      answer: answerToCheck,
      correct: isCorrect,
      score: score + (isCorrect ? 1 : 0),
      // Show rewards for this answer
      xpReward: isCorrect ? (currentQuestion.rewardXP || 15) : 0,
      diamondReward: isCorrect ? (currentQuestion.rewardDiamond || 1) : 0,
      heartPenalty: !isCorrect ? (currentQuestion.penaltyHeart || 1) : 0,
    });
    
    // Save answer with reward details
    answersRef.current[currentIndex] = {
      questionId: currentQuestion.id,
      answer: answerToCheck,
      isCorrect,
      timestamp: Date.now(),
      // Include reward information
      rewardXP: isCorrect ? (currentQuestion.rewardXP || 15) : 0,
      rewardDiamond: isCorrect ? (currentQuestion.rewardDiamond || 1) : 0,
      penaltyHeart: !isCorrect ? (currentQuestion.penaltyHeart || 1) : 0,
    };
    setAnswers({ ...answersRef.current });
    
    // Show feedback
    setCurrentFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      // Correct answer
      const newScore = score + 1;
      // Daily streak is handled globally; do not increment per-question streak here
      // Use question's reward data, default to 15 XP and 1 diamond if not specified
      const xpReward = currentQuestion.rewardXP || 15;
      const diamondReward = currentQuestion.rewardDiamond || 1;
      const newXp = xpEarned + xpReward;
      const newDiamonds = diamondsEarned + diamondReward;

      setScore(newScore);
      setXpEarned(newXp);
      setDiamondsEarned(newDiamonds);
      
      // Show feedback - don't auto-advance, user must click CHECK to continue
    } else {
      // Wrong answer
      const heartPenalty = currentQuestion.penaltyHeart || 1;
      const newHearts = Math.max(0, hearts - heartPenalty);
      setHearts(newHearts);

      // If hearts are depleted, prompt to buy more
      if (newHearts <= 0) {
        Alert.alert(
          'หัวใจหมดแล้ว',
          'ซื้อหัวใจเพิ่มเพื่อเล่นต่อ',
          [
            { text: 'ไปร้านหัวใจ', onPress: () => navigation.navigate('GemShop') },
            { text: 'ยกเลิก', style: 'cancel' }
          ]
        );
      }
      // Show feedback - don't auto-advance, user must click CHECK to continue
    }
  };
  
  // Reset drag-match state when index changes
  useEffect(() => {
    setDmSelected({ leftId: null, rightId: null });
    setDmPairs([]);
    setCurrentFeedback(null);
  }, [currentIndex]);

  // Removed fire streak alert per request

  // Next question
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(null);
    } else {
      // Game finished -> go to completion screen
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      finishLesson(elapsed);
    }
  };
  
  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    gameFinishedRef.current = false;
    startTimeRef.current = Date.now();
  };
  
  
  // Finish lesson
  const finishLesson = async (timeSpentOverrideSec) => {
    if (gameFinishedRef.current) {
      return;
    }

    gameFinishedRef.current = true;
    setGameFinished(true);
    
    console.debug(`[Game Complete] Lesson ${lessonId} finished`, {
      score,
      totalQuestions: questions.length,
      accuracy: Math.round((score / questions.length) * 100),
      xpEarned,
      diamondsEarned,
      maxStreak,
      timeSpent: Math.floor((Date.now() - startTimeRef.current) / 1000),
    });

    try {
      const totalQuestions = questions.length;
      const correctAnswers = score;
      const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
      const accuracyRatio = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
      const accuracyPercent = Math.round(accuracyRatio * 100);
      const timeSpent = Number.isFinite(timeSpentOverrideSec)
        ? timeSpentOverrideSec
        : Math.floor((Date.now() - startTimeRef.current) / 1000);
      const unlockedNext = accuracyPercent >= 70;

      const heartDelta = Number.isFinite(stats?.hearts)
        ? hearts - stats.hearts
        : 0;

      const lastResults = {
        lessonId,
        stageTitle,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        accuracyPercent,
        xpEarned,
        diamondsEarned,
        heartsRemaining: hearts,
        timeSpent,
      };

      const progressDelta = {
        xp: xpEarned,
        diamonds: diamondsEarned,
        finishedLesson: true,
        timeSpentSec: timeSpent,
        totalCorrectAnswers: correctAnswers,
        totalWrongAnswers: wrongAnswers,
        lastGameResults: lastResults,
      };

      if (heartDelta !== 0) {
        progressDelta.hearts = heartDelta;
      }

      try {
        await applyDelta(progressDelta);
      } catch (deltaError) {
        console.warn('Failed to update unified stats:', deltaError?.message || deltaError);
      }

      const questionTypeCounts = questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      }, {});

      try {
        await gameProgressService.saveGameSession({
          lessonId,
          category: routeCategory,
          gameMode: 'intermediate_emotions',
          score: correctAnswers,
          totalQuestions,
          correctAnswers,
          wrongAnswers,
          accuracy: accuracyRatio,
          accuracyPercent,
          timeSpent,
          xpEarned,
          diamondsEarned,
          heartsRemaining: hearts,
          streak,
          maxStreak,
          questionTypes: questionTypeCounts,
          completedAt: new Date().toISOString(),
        });
      } catch (sessionError) {
        console.warn('Failed to save game session:', sessionError?.message || sessionError);
      }

      console.log('🎯 IntermediateEmotionsGame finishLesson - accuracyPercent:', accuracyPercent, 'unlockedNext:', unlockedNext);
      let unlockResult = null;
      if (unlockedNext) {
        try {
          console.log('🔓 Attempting to unlock level_intermediate_3 (Places)...');
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level_intermediate_2', {
            accuracy: accuracyPercent,
            score: correctAnswers,
            attempts: 1,
          });
          console.log('✅ level_intermediate_3 (Places) unlocked:', unlockResult);
        } catch (unlockError) {
          console.warn('❌ Failed to unlock next level:', unlockError?.message || unlockError);
        }
      }

      try {
        await clearProgress(lessonId);
      } catch (clearError) {
        console.warn('Failed to clear progress snapshot:', clearError?.message || clearError);
      }

      navigation.replace('LessonComplete', {
        lessonId,
        stageTitle,
        score: correctAnswers,
        totalQuestions,
        timeSpent,
        accuracy: accuracyPercent,
        accuracyPercent,
        accuracyRatio,
        xpGained: xpEarned,
        diamondsGained: diamondsEarned,
        heartsRemaining: hearts,
        streak,
        maxStreak,
        isUnlocked: unlockedNext,
        nextStageUnlocked: Boolean(unlockResult?.unlocked || unlockResult?.nextLevel),
        nextStageMeta: resolvedNextStageMeta,
        stageSelectRoute,
        replayRoute,
        replayParams: resolvedReplayParams,
        questionTypeCounts,
      });
    } catch (error) {
      console.error('Error finishing lesson:', error);
    }
  };
  
  // Render question component
  const renderQuestionComponent = () => {
    if (questions.length === 0 || currentIndex >= questions.length) {
      return null;
    }

    const question = questions[currentIndex];

    if (question.type === QUESTION_TYPES.LISTEN_CHOOSE) {
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.questionText}>{question.questionText}</Text>
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>

            <TouchableOpacity
              style={styles.speakerButton}
              onPress={() => vaja9TtsService.playThai(question.audioText)}
            >
              <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
            </TouchableOpacity>

            <View style={styles.choicesContainer}>
              {question.choices.map((choice) => (
                <TouchableOpacity
                  key={choice.id}
                  style={[
                    styles.choiceButton,
                    currentAnswer === choice.thai && styles.choiceSelected,
                  ]}
                  onPress={() => handleAnswerSelect(choice.thai, choice.speakText)}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      isThaiText(choice.text) && { fontSize: 26, fontWeight: '900' },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {choice.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (question.type === QUESTION_TYPES.PICTURE_MATCH) {
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>

            <View style={styles.imageContainer}>
              {(() => {
                const pictureSource = question.imageSource || (question.imageKey ? emotionImages[question.imageKey] : null);
                if (pictureSource) {
                  return (
                    <Image
                      source={pictureSource}
                      style={styles.emotionImage}
                      resizeMode="contain"
                    />
                  );
                }
                return (
                  <View style={styles.imageFallback}>
                    <Text style={styles.emotionChar}>{question.imageKey}</Text>
                  </View>
                );
              })()}
            </View>

            <View style={styles.choicesContainer}>
              {question.choices.map((choice) => (
                <TouchableOpacity
                  key={choice.id}
                  style={[
                    styles.choiceButton,
                    currentAnswer === choice.thai && styles.choiceSelected,
                  ]}
                  onPress={() => handleAnswerSelect(choice.thai, choice.speakText)}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      isThaiText(choice.text) && { fontSize: 26, fontWeight: '900' },
                    ]}
                  >
                    {choice.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (question.type === QUESTION_TYPES.DRAG_MATCH) {
      const connectionColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
      const connectionSymbols = ['●', '▲', '■', '♦', '★', '◆', '⬟', '⬢'];

      const getLeftIndex = (leftId) => {
        const idx = (question.leftItems || []).findIndex((item) => item.id === leftId);
        return idx >= 0 ? idx : 0;
      };

      const getConnectionColor = (leftId) => {
        const connectionIndex = getLeftIndex(leftId);
        return connectionColors[connectionIndex % connectionColors.length];
      };

      const getConnectionSymbol = (leftId) => {
        const connectionIndex = getLeftIndex(leftId);
        return connectionSymbols[connectionIndex % connectionSymbols.length];
      };

      const getConnectedRight = (leftId) => dmPairs.find((pair) => pair.leftId === leftId)?.rightId;
      const isConnected = (leftId) => Boolean(getConnectedRight(leftId));

      const handleLeftPress = (leftItem) => {
        if (currentFeedback) return;
        if (leftItem?.text) {
          try {
            vaja9TtsService.playThai(leftItem.text);
          } catch (error) {
            console.log('TTS Error:', error);
          }
        }
        setDmSelected({ leftId: leftItem.id, rightId: dmSelected.rightId });
      };

      const handleRightPress = (rightItem) => {
        if (currentFeedback) return;
        if (rightItem?.text) {
          try {
            vaja9TtsService.playThai(rightItem.text);
          } catch (error) {
            console.log('TTS Error:', error);
          }
        }

        if (dmSelected.leftId) {
          const filtered = dmPairs.filter(
            (pair) => pair.leftId !== dmSelected.leftId && pair.rightId !== rightItem.id,
          );
          const updated = [...filtered, { leftId: dmSelected.leftId, rightId: rightItem.id }];
          setDmPairs(updated);
          setCurrentAnswer(updated);
          setDmSelected({ leftId: null, rightId: null });
        } else {
          setDmSelected({ leftId: null, rightId: rightItem.id });
        }
      };

      return (
        <View style={styles.questionContainer}>
          <Text style={styles.instruction}>{question.instruction}</Text>
          {!!question.questionText && <Text style={styles.questionText}>{question.questionText}</Text>}

          <View style={styles.dragMatchContainer}>
            <View style={styles.leftColumn}>
              {question.leftItems?.map((item) => {
                const connectedRightId = getConnectedRight(item.id);
                const isCorrect = connectedRightId
                  ? question.rightItems.find((right) => right.id === connectedRightId)?.text === item.correctMatch
                  : false;
                const isWrong = connectedRightId && !isCorrect;
                const color = connectedRightId ? getConnectionColor(item.id) : '#e0e0e0';
                const symbol = connectedRightId ? getConnectionSymbol(item.id) : '';
                const isSelected = dmSelected.leftId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dragItem,
                      isSelected && styles.selectedDragItem,
                      currentFeedback && isCorrect && styles.correctDragItem,
                      currentFeedback && isWrong && styles.wrongDragItem,
                      {
                        backgroundColor: connectedRightId ? color : isSelected ? '#fff5e6' : '#fff',
                        borderColor: connectedRightId ? color : isSelected ? '#FF8000' : '#e0e0e0',
                        borderWidth: isSelected ? 4 : 3,
                      },
                    ]}
                    onPress={() => handleLeftPress(item)}
                    disabled={currentFeedback !== null}
                  >
                    <View style={styles.dragItemContent}>
                      {connectedRightId && (
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => {
                            const filtered = dmPairs.filter((pair) => pair.leftId !== item.id);
                            setDmPairs(filtered);
                            setCurrentAnswer(filtered);
                          }}
                        >
                          <FontAwesome name="times" size={12} color="#fff" />
                        </TouchableOpacity>
                      )}
                      <Text
                        style={[
                          styles.dragItemText,
                          connectedRightId && { color: '#fff', fontWeight: 'bold' },
                          isSelected && { color: '#FF8000', fontWeight: 'bold' },
                        ]}
                      >
                        {item.text}
                      </Text>
                      {connectedRightId && (
                        <View style={{
                          marginLeft: 8,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: color,
                        }} />
                      )}
                      {connectedRightId && (
                        <Text style={[styles.connectionSymbol, { color: '#fff' }]}>{symbol}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.rightColumn}>
              {question.rightItems?.map((item) => {
                const connectedLeftId = dmPairs.find((pair) => pair.rightId === item.id)?.leftId;
                const isCorrect = connectedLeftId
                  ? question.leftItems.find((left) => left.id === connectedLeftId)?.correctMatch === item.text
                  : false;
                const isWrong = connectedLeftId && !isCorrect;
                const color = connectedLeftId ? getConnectionColor(connectedLeftId) : '#e0e0e0';
                const symbol = connectedLeftId ? getConnectionSymbol(connectedLeftId) : '';
                const isSelected = dmSelected.rightId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dragItem,
                      isSelected && styles.selectedDragItem,
                      currentFeedback && isCorrect && styles.correctDragItem,
                      currentFeedback && isWrong && styles.wrongDragItem,
                      {
                        backgroundColor: connectedLeftId ? color : isSelected ? '#fff5e6' : '#fff',
                        borderColor: connectedLeftId ? color : isSelected ? '#FF8000' : '#e0e0e0',
                        borderWidth: isSelected ? 4 : 3,
                      },
                    ]}
                    onPress={() => handleRightPress(item)}
                    disabled={currentFeedback !== null}
                  >
                    <View style={styles.dragItemContent}>
                      {item.imageSource ? (
                        <Image
                          source={item.imageSource}
                          style={styles.dragItemImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.dragItemImageFallback}>
                          <Text style={styles.dragItemFallbackText}>{item.thai}</Text>
                        </View>
                      )}
                      <View style={styles.dragItemLabelWrap}>
                        <Text
                          style={[
                            styles.dragItemText,
                            connectedLeftId && { color: '#fff', fontWeight: 'bold' },
                            isSelected && { color: '#FF8000', fontWeight: 'bold' },
                          ]}
                        >
                          {item.english}
                        </Text>
                        <Text
                          style={[
                            styles.dragItemSubLabel,
                            connectedLeftId && { color: '#fff' },
                            isSelected && { color: '#FF8000' },
                          ]}
                        >
                          {item.roman ? `${item.roman} • ${item.thai}` : item.thai}
                        </Text>
                      </View>
                      {connectedLeftId && (
                        <View style={{
                          marginLeft: 8,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: color,
                        }} />
                      )}
                      {connectedLeftId && (
                        <Text style={[styles.connectionSymbol, { color: '#fff' }]}>{symbol}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.soundButtonsContainer}>
            <TouchableOpacity
              style={styles.soundButton}
              onPress={() => {
                question.leftItems?.forEach((item, index) => {
                  if (!item?.text) return;
                  setTimeout(() => {
                    try {
                      vaja9TtsService.playThai(item.text);
                    } catch (error) {
                      console.log('TTS Error:', error);
                    }
                  }, index * 900);
                });
              }}
            >
              <FontAwesome name="volume-up" size={16} color="#fff" />
              <Text style={styles.soundButtonText}>เล่นเสียงซ้าย</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.soundButton}
              onPress={() => {
                question.rightItems?.forEach((item, index) => {
                  if (!item?.text) return;
                  setTimeout(() => {
                    try {
                      vaja9TtsService.playThai(item.text);
                    } catch (error) {
                      console.log('TTS Error:', error);
                    }
                  }, index * 900);
                });
              }}
            >
              <FontAwesome name="volume-up" size={16} color="#fff" />
              <Text style={styles.soundButtonText}>เล่นเสียงขวา</Text>
            </TouchableOpacity>
          </View>

          {dmPairs.length > 0 && (
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionText}>
                เชื่อมต่อแล้ว {dmPairs.length}/{question.leftItems.length} คู่
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.startContainer}>
          <View style={styles.introCard}>
            <LottieView
              source={require('../assets/animations/stage_start.json')}
              autoPlay
              loop
              style={styles.introAnim}
            />
            <Text style={styles.startTitle}>อารมณ์ภาษาไทย</Text>
            <Text style={styles.startSubtitle}>ฝึกคำศัพท์ความรู้สึกพร้อมภาพประกอบ</Text>
          </View>

          {/* Player Stats Display removed per request */}
          
          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.9}>
            <LinearGradient
              colors={[COLORS.primary, '#FFA24D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startGradient}
            >
              <Text style={styles.startButtonText}>เริ่มเล่น</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  if (gameFinished) {
    return null;
  }
  
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient for depth */}
      <LinearGradient
        colors={['#FFF5E5', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
      {/* Header */}
      <LinearGradient
        colors={['#FF8000', '#FFA24D', '#FFD700']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="times" size={26} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#58cc02', '#7FD14F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <View style={styles.headerMetaRow}>
              <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
              <View style={styles.typePill}><Text style={styles.typePillText}>{getTypeLabel(currentQuestion.type)}</Text></View>
              <View style={styles.heartsDisplayContainer}>
                <LottieView
                  source={require('../assets/animations/Heart.json')}
                  autoPlay
                  loop
                  style={styles.heartsIconAnimation}
                />
                <Text style={styles.heartsDisplay}>{hearts}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
      
      {/* Stats Row - Enhanced */}
      <View style={styles.statsRow}>
        <View style={styles.statBadgeEnhanced}>
          <LottieView
            source={require('../assets/animations/Star.json')}
            autoPlay
            loop
            style={styles.starAnimation}
          />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>XP</Text>
            <Text style={styles.statValue}>{xpEarned}</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statBadgeEnhanced}>
          <LottieView
            source={require('../assets/animations/Diamond.json')}
            autoPlay
            loop
            style={styles.diamondAnimation}
          />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Diamonds</Text>
            <Text style={styles.statValue}>+{diamondsEarned}</Text>
          </View>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statBadgeEnhanced}>
          <FontAwesome name="bullseye" size={18} color={COLORS.primary} />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>{Math.min(100, Math.max(0, Math.round((score / Math.max(1, currentIndex)) * 100)))}%</Text>
          </View>
        </View>
        
        {/* Removed Streak UI */}
      </View>
      
      {/* Question */}
      <ScrollView style={styles.questionScrollView}>
        {renderQuestionComponent()}
      </ScrollView>
      
      {/* Check Button - Enhanced */}
      <View style={styles.checkContainerEnhanced}>
        {currentFeedback && (
          <View style={[
            styles.feedbackBadgeEnhanced,
            currentFeedback === 'correct' ? styles.feedbackCorrectEnhanced : styles.feedbackWrongEnhanced
          ]}>
            <FontAwesome 
              name={currentFeedback === 'correct' ? 'check-circle' : 'times-circle'} 
              size={24} 
              color={currentFeedback === 'correct' ? '#58cc02' : '#ff4b4b'}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.feedbackTextEnhanced}>
              {currentFeedback === 'correct' ? 'ถูกต้อง! ยอดเยี่ยม' : 'พยายามอีกครั้ง'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.checkButtonEnhanced,
            currentAnswer === null && styles.checkButtonDisabledEnhanced,
          ]}
          onPress={() => {
            if (currentFeedback !== null) {
              setCurrentFeedback(null);
              if (hearts === 0) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                finishLesson(elapsed);
              } else {
                nextQuestion();
              }
            } else {
              handleCheckAnswer();
            }
          }}
          disabled={currentAnswer === null}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={currentAnswer === null ? ['#ddd', '#ccc'] : [COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradientEnhanced}
          >
            <FontAwesome 
              name={currentFeedback !== null ? 'arrow-right' : 'check'} 
              size={20} 
              color={COLORS.white}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.checkButtonTextEnhanced}>
              {currentFeedback !== null ? (hearts === 0 ? 'จบเกม' : 'ต่อไป') : 'CHECK'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {/* FireStreakAlert removed */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.dark,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  introCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    marginBottom: 14,
  },
  introAnim: {
    width: 120,
    height: 120,
    marginBottom: 6,
  },
  startTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  startSubtitle: {
    fontSize: 18,
    color: COLORS.dark,
    marginBottom: 30,
    textAlign: 'center',
  },
  resumeButton: {
    backgroundColor: COLORS.cream,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  resumeButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: 220,
  },
  startGradient: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backButton: {
    marginRight: 15,
  },
  headerGradient: {
    paddingTop: 15,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 5,
  },
  headerMetaRow: {
    width: '100%',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  typePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,245,229,0.9)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FFE3CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'visible',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 5,
  },
  heartAnimation: {
    width: 20,
    height: 20,
  },
  starAnimation: {
    width: 20,
    height: 20,
  },
  diamondAnimation: {
    width: 20,
    height: 20,
  },
  streakAnimation: {
    width: 20,
    height: 20,
  },
  questionScrollView: {
    flex: 1,
    padding: 20,
    paddingBottom: 10,
  },
  questionContainer: {
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    shadowColor: '#FF8000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    overflow: 'hidden',
  },
  instruction: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 15,
    color: COLORS.gray,
    marginBottom: 15,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 10,
  },
  speakerButton: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#FFD8B2'
  },
  choicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  choiceButton: {
    width: '48%',
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  choiceSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,128,0,0.08)',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
  },
  choiceText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 26,
  },
  dragMatchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  emotionImage: {
    width: 120,
    height: 120,
    borderRadius: 18,
    shadowColor: '#FF8000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  imageFallback: {
    width: 120,
    height: 120,
    borderRadius: 18,
    backgroundColor: '#FFF5E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  emotionChar: {
    fontSize: 56,
    fontWeight: '900',
    color: COLORS.primary,
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 8,
  },
  dragItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    minHeight: 70,
  },
  dragItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,128,0,0.08)',
    borderWidth: 3,
    transform: [{ scale: 1.02 }],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  dragItemPaired: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.08)'
  },
  dragItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
    flex: 1,
  },
  dragItemLabelWrap: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  dragItemSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7A7A7A',
    marginTop: 2,
  },
  dragItemImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFF5E5',
    marginRight: 12,
  },
  dragItemImageFallback: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFF5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dragItemFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pairPreview: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pairPreviewText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  pairArrow: {
    fontSize: 16,
    marginHorizontal: 8,
    color: COLORS.primary,
    fontWeight: '900',
  },
  arrangeContainer: {
    backgroundColor: COLORS.cream,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  arrangeText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  checkContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  checkButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  checkGradient: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  feedbackBadge: {
    position: 'absolute',
    top: -30, // Adjust as needed
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackCorrect: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(88,204,2,0.1)',
  },
  feedbackWrong: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255,75,75,0.1)',
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  memoryGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memoryCard: {
    width: '48%',
    height: 110,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  memoryCardMatched: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(88,204,2,0.12)',
    shadowColor: COLORS.success,
    shadowOpacity: 0.2,
  },
  memoryCardFront: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  memoryCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  playerStatsContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsGridItem: {
    alignItems: 'center',
  },
  statsGridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statsGridValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  selectedDragItem: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,127,80,0.1)',
  },
  correctDragItem: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76,175,80,0.1)',
  },
  wrongDragItem: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255,75,75,0.1)',
  },
  dragItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    marginRight: 5,
  },
  connectionSymbol: {
    fontSize: 12,
    marginHorizontal: 5,
  },
  soundButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  soundButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  soundButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 4,
  },
  connectionInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statBadgeEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    minWidth: 85,
  },
  statTextContainer: {
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statDivider: {
    width: 0.8,
    height: '100%',
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 6,
  },
  heartsDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartsDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 5,
  },
  checkContainerEnhanced: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  checkButtonEnhanced: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  checkGradientEnhanced: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  checkButtonDisabledEnhanced: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkButtonTextEnhanced: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  feedbackBadgeEnhanced: {
    position: 'absolute',
    top: -35,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackCorrectEnhanced: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(88,204,2,0.12)',
    shadowColor: COLORS.success,
    shadowOpacity: 0.3,
  },
  feedbackWrongEnhanced: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255,75,75,0.12)',
    shadowColor: COLORS.error,
    shadowOpacity: 0.3,
  },
  feedbackTextEnhanced: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
  },
  arrangeContainer: {
    backgroundColor: COLORS.cream,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  arrangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  heartsIconAnimation: {
    width: 20,
    height: 20,
  },
});

export default IntermediateEmotionsGame;
