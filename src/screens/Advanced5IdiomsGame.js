import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Services
import vaja9TtsService from '../services/vaja9TtsService';
import { saveProgress, restoreProgress, clearProgress } from '../services/progressService';
import gameProgressService from '../services/gameProgressService';
import levelUnlockService from '../services/levelUnlockService';
import userStatsService from '../services/userStatsService';

// Contexts
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useUserData } from '../contexts/UserDataContext';

// Data
const idiomsDataFallback = require('../data/advanced1_idioms.json');

const { width, height } = Dimensions.get('window');
const LESSON_ID = 'advanced1';
const CATEGORY = 'thai-idioms';

// Question Types
const QUESTION_TYPES = {
  LEARN_IDIOM: 'LEARN_IDIOM',
  LISTEN_MEANING: 'LISTEN_MEANING',
  LISTEN_USAGE: 'LISTEN_USAGE',
  MATCH_IDIOM_MEANING: 'MATCH_IDIOM_MEANING',
  FILL_CONTEXT: 'FILL_CONTEXT',
  ARRANGE_IDIOM: 'ARRANGE_IDIOM',
  PARAPHRASE_SELECT: 'PARAPHRASE_SELECT',
  TRUE_FALSE_EXPLANATION: 'TRUE_FALSE_EXPLANATION',
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
const uid = () => Math.random().toString(36).substr(2, 9);

// Normalize idiom data
const normalizeIdiom = (doc) => ({
  id: doc.id || doc._id || `idiom_${uid()}`,
  thai: doc.thai || '',
  meaningTH: doc.meaningTH || '',
  meaningEN: doc.meaningEN || '',
  exampleTH: doc.exampleTH || '',
  exampleEN: doc.exampleEN || '',
  audioText: doc.audioText || doc.thai || '',
});

// UI helper for hint texts per question type
const getHintText = (type) => {
  switch (type) {
    case QUESTION_TYPES.LEARN_IDIOM:
      return 'อ่านความหมายและตัวอย่าง แล้วกด NEXT';
    case QUESTION_TYPES.LISTEN_MEANING:
      return 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกความหมายที่ถูกต้อง';
    case QUESTION_TYPES.LISTEN_USAGE:
      return 'ฟังประโยคตัวอย่าง แล้วเลือกสำนวนที่เหมาะสม';
    case QUESTION_TYPES.MATCH_IDIOM_MEANING:
      return 'แตะเพื่อจับคู่ สำนวน ↔ ความหมาย';
    case QUESTION_TYPES.FILL_CONTEXT:
      return 'เลือกสำนวนที่เหมาะกับบริบท';
    case QUESTION_TYPES.ARRANGE_IDIOM:
      return 'เรียงคำให้เป็นสำนวนที่ถูกต้อง';
    case QUESTION_TYPES.PARAPHRASE_SELECT:
      return 'เลือกถอดความที่แม่นยำที่สุด';
    case QUESTION_TYPES.TRUE_FALSE_EXPLANATION:
      return 'ตัดสินว่าข้อความถูกหรือผิด';
    default:
      return '';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LEARN_IDIOM: return 'การ์ดความรู้';
    case QUESTION_TYPES.LISTEN_MEANING: return 'ฟังความหมาย';
    case QUESTION_TYPES.LISTEN_USAGE: return 'ฟังการใช้';
    case QUESTION_TYPES.MATCH_IDIOM_MEANING: return 'จับคู่ความหมาย';
    case QUESTION_TYPES.FILL_CONTEXT: return 'เติมบริบท';
    case QUESTION_TYPES.ARRANGE_IDIOM: return 'เรียงสำนวน';
    case QUESTION_TYPES.PARAPHRASE_SELECT: return 'เลือกถอดความ';
    case QUESTION_TYPES.TRUE_FALSE_EXPLANATION: return 'ถูก/ผิด';
    default: return '';
  }
};

// ---------- Builders ----------
const buildLearnCard = (idiom) => ({
  id: `learn_${idiom.id}_${uid()}`,
  type: QUESTION_TYPES.LEARN_IDIOM,
  instruction: 'สำนวนใหม่',
  thai: idiom.thai,
  meaningTH: idiom.meaningTH,
  meaningEN: idiom.meaningEN,
  exampleTH: idiom.exampleTH,
  exampleEN: idiom.exampleEN,
  audioText: idiom.audioText || idiom.thai,
  tips: 'อ่านแล้วกด NEXT เพื่อทำข้อถัดไป',
  rewardXP: 0,
  rewardDiamond: 0,
  penaltyHeart: 0,
});

const buildListenMeaning = (idiom, pool) => {
  const wrong = shuffle(
    pool.filter(p => p.id !== idiom.id).map(p => p.meaningTH)
  ).slice(0, 3);
  const choices = shuffle([idiom.meaningTH, ...wrong]).slice(0, 4);
  return {
    id: `lm_${idiom.id}_${uid()}`,
    type: QUESTION_TYPES.LISTEN_MEANING,
    instruction: 'ฟังแล้วเลือกความหมายที่ถูกต้อง',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: idiom.audioText || idiom.thai,
    correctText: idiom.meaningTH,
    choices: choices.map((t, i) => ({ id: i + 1, text: t })),
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
  };
};

const buildFillContext = (idiom, pool) => {
  const distract = shuffle(
    pool.filter(p => p.id !== idiom.id).map(p => p.thai)
  ).slice(0, 3);
  const opts = shuffle([idiom.thai, ...distract]).slice(0, 4);
  // ประโยคแม่แบบแบบกลาง ๆ
  const questionText = `บริบท: ทีมกำลังเผางาน/มีโอกาส/หรือเรื่องเล็กน้อย → เลือกสำนวนให้เหมาะ: ____`;
  return {
    id: `fc_${idiom.id}_${uid()}`,
    type: QUESTION_TYPES.FILL_CONTEXT,
    instruction: 'เลือกสำนวนที่เหมาะกับบริบท',
    questionText,
    correctText: idiom.thai,
    choices: opts.map((t, i) => ({ id: i + 1, text: t })),
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
  };
};

const buildMatch = (idioms) => {
  const batch = shuffle(idioms).slice(0, 3); // 3 คู่/ครั้ง
  return {
    id: `mm_${uid()}`,
    type: QUESTION_TYPES.MATCH_IDIOM_MEANING,
    instruction: 'จับคู่สำนวนไทยกับความหมาย',
    leftItems: batch.map((it, idx) => ({
      id: `L${idx + 1}`,
      text: it.thai,
      correctMatch: it.meaningTH,
    })),
    rightItems: shuffle(batch).map((it, idx) => ({
      id: `R${idx + 1}`,
      text: it.meaningTH,
    })),
    // Rewards for this question
    rewardXP: 15,      // XP for correct answer
    rewardDiamond: 1,  // Diamond for correct answer
    penaltyHeart: 1,   // Heart loss for wrong answer
  };
};

// ---------- Flow generator ----------
/**
 * สร้างบทเรียน n ข้อ (แนะนำ 6) แบบสลับ: LEARN → GAME → LEARN → GAME ...
 * - ใช้สำนวนไม่ซ้ำ
 * - เกมจะอ้างอิงสำนวนที่เพิ่งเรียน เพื่อย้ำจำ
 */
const generateIdiomsLessonFlow = (pool, n = 6) => {
  const idioms = shuffle((pool || []).map(normalizeIdiom)).filter(i => i.thai && i.meaningTH);
  if (idioms.length === 0) return [];

  // เลือกสำนวนหลักที่ใช้สอน (ceil(n/2))
  const learnCount = Math.ceil(n / 2);
  const learnIdioms = idioms.slice(0, learnCount);

  const out = [];

  for (let i = 0; i < learnCount; i++) {
    const idiom = learnIdioms[i];

    // 1) การ์ดความรู้
    out.push(buildLearnCard(idiom));

    // 2) เกมตามหลัง (เลือกจาก 3 แบบ หมุนเวียน)
    const gameTypeIndex = i % 3;
    if (gameTypeIndex === 0) {
      out.push(buildListenMeaning(idiom, idioms));
    } else if (gameTypeIndex === 1) {
      out.push(buildFillContext(idiom, idioms));
    } else {
      // จับคู่ 3 คำ: เอาคำที่เรียน + สุ่มเพิ่มอีก 2
      const extra = shuffle(idioms.filter(x => x.id !== idiom.id)).slice(0, 2);
      out.push(buildMatch([idiom, ...extra]));
    }
  }

  // ตัดให้เหลือ n ข้อพอดี
  return out.slice(0, n);
};

// Check answer
const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case QUESTION_TYPES.LEARN_IDIOM:
      return true; // การ์ดความรู้ ไม่มีการตรวจ
    case QUESTION_TYPES.LISTEN_MEANING:
    case QUESTION_TYPES.LISTEN_USAGE:
    case QUESTION_TYPES.FILL_CONTEXT:
    case QUESTION_TYPES.PARAPHRASE_SELECT:
    case QUESTION_TYPES.TRUE_FALSE_EXPLANATION:
      return userAnswer === question.correctText;
    
    case QUESTION_TYPES.MATCH_IDIOM_MEANING:
      return userAnswer && userAnswer.every(pair =>
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );
    
    case QUESTION_TYPES.ARRANGE_IDIOM:
      return Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
    
    default:
      return false;
  }
};

const Advanced5IdiomsGame = ({ navigation, route }) => {
  const {
    lessonId = LESSON_ID,
    category: routeCategory = CATEGORY,
    stageTitle = 'สำนวนไทย (Thai Idioms)',
    level: stageLevel = 'Advanced',
    stageSelectRoute = 'LevelStage3',
  } = route.params || {};

  // Contexts
  const { applyDelta, user: progressUser } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();
  
  // State
  const [idioms, setIdioms] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [diamondsEarned, setDiamondsEarned] = useState(0);
  const [answers, setAnswers] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState(null);
  const [dmSelected, setDmSelected] = useState({ leftId: null, rightId: null });
  const [dmPairs, setDmPairs] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null); // 'correct'|'wrong'|null
  
  // Refs
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);
  
  // Load idioms data
  useEffect(() => {
    const loadIdioms = async () => {
      try {
        const normalizedIdioms = (idiomsDataFallback || [])
          .map(normalizeIdiom)
          .filter(i => i && i.thai && i.meaningTH);
        setIdioms(normalizedIdioms);
        
        // ✨ ใช้ flow สลับเรียน–เล่น 20 ข้อ (10 สำนวน)
        const generatedQuestions = generateIdiomsLessonFlow(normalizedIdioms, 20);
        setQuestions(generatedQuestions);
        
        // Try to restore progress
        const savedProgress = await restoreProgress(lessonId);
        if (savedProgress && savedProgress.questionsSnapshot) {
          setResumeData(savedProgress);
          setCurrentIndex(savedProgress.currentIndex || 0);
          setHearts(savedProgress.hearts || 5);
          setStreak(savedProgress.streak || 0);
          setMaxStreak(savedProgress.maxStreak || 0);
          setScore(savedProgress.score || 0);
          setXpEarned(savedProgress.xpEarned || 0);
          setDiamondsEarned(savedProgress.diamondsEarned || 0);
          setAnswers(savedProgress.answers || {});
          answersRef.current = savedProgress.answers || {};
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading idioms:', error);
        setLoading(false);
      }
    };
    
    loadIdioms();
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
        generator: 'idioms',
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

  // Next question
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishLesson();
    }
    setCurrentAnswer(null);
    setCurrentFeedback(null);
    setDmSelected({ leftId: null, rightId: null });
    setDmPairs([]);
  };
  
  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    gameFinishedRef.current = false;
    startTimeRef.current = Date.now();
  };
  
  // Resume game
  const resumeGame = () => {
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
          gameMode: 'idioms_advanced',
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

      let unlockResult = null;
      if (unlockedNext) {
        try {
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level1_advanced', {
            accuracy: accuracyPercent,
            score: correctAnswers,
            attempts: 1,
          });
        } catch (unlockError) {
          console.warn('Failed to unlock next level:', unlockError?.message || unlockError);
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
        stageSelectRoute,
        questionTypeCounts,
      });
    } catch (error) {
      console.error('Error finishing lesson:', error);
    }
  };
  
  // Render question component
  const renderQuestionComponent = () => {
    if (questions.length === 0 || currentIndex >= questions.length) return null;
    
    const question = questions[currentIndex];
    
    switch (question.type) {
      case QUESTION_TYPES.LEARN_IDIOM:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={[styles.questionText, {fontSize: 22, fontWeight: '800', color: COLORS.dark}]}>
                {question.thai}
              </Text>
              <Text style={[styles.hintText, {marginBottom: 10}]}>
                {getHintText(question.type)}
              </Text>
              
              {question.audioText && (
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => playTTS(question.audioText)}
                >
                  <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              
              <View style={{marginTop: 6, marginBottom: 8}}>
                <Text style={{fontSize: 16, fontWeight: '700', color: COLORS.dark}}>ความหมาย</Text>
                <Text style={{fontSize: 15, color: COLORS.gray, marginTop: 4}}>
                  {question.meaningTH}
                </Text>
                {Boolean(question.meaningEN) && (
                  <Text style={{fontSize: 13, color: '#888', marginTop: 2}}>
                    ({question.meaningEN})
                  </Text>
                )}
              </View>
              
              {Boolean(question.exampleTH) && (
                <View style={{marginTop: 10}}>
                  <Text style={{fontSize: 16, fontWeight: '700', color: COLORS.dark}}>ตัวอย่าง</Text>
                  <Text style={{fontSize: 15, color: COLORS.gray, marginTop: 4}}>
                    {question.exampleTH}
                  </Text>
                  {Boolean(question.exampleEN) && (
                    <Text style={{fontSize: 13, color: '#888', marginTop: 2}}>
                      {question.exampleEN}
                    </Text>
                  )}
                </View>
              )}
              
              {Boolean(question.tips) && (
                <View style={{marginTop: 12, backgroundColor: '#FFF8F0', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FFE3CC'}}>
                  <Text style={{fontSize: 12, color: '#A86A00'}}>{question.tips}</Text>
                </View>
              )}
            </View>
          </View>
        );
      
      case QUESTION_TYPES.LISTEN_MEANING:
      case QUESTION_TYPES.LISTEN_USAGE:
      case QUESTION_TYPES.FILL_CONTEXT:
      case QUESTION_TYPES.PARAPHRASE_SELECT:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              {question.questionText && <Text style={styles.questionText}>{question.questionText}</Text>}
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              {question.audioText && (
                <TouchableOpacity
                  style={styles.speakerButton}
                  onPress={() => playTTS(question.audioText)}
                >
                  <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              
              <View style={styles.choicesContainer}>
                {question.choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      currentAnswer === choice.text && styles.choiceSelected,
                    ]}
                    onPress={() => handleAnswerSelect(choice.text, choice.speakText)}
                  >
                    <Text style={styles.choiceText}>{choice.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.TRUE_FALSE_EXPLANATION:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              <Text style={styles.statementText}>{question.statement}</Text>
              
              <View style={styles.trueFalseRow}>
                {question.choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.trueFalseButton,
                      currentAnswer === choice.text && styles.choiceSelected,
                    ]}
                    onPress={() => handleAnswerSelect(choice.text, choice.speakText)}
                  >
                    <Text style={styles.choiceText}>{choice.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.MATCH_IDIOM_MEANING:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>
            
            {(dmSelected.leftId || dmSelected.rightId || dmPairs.length > 0) && (
              <View style={styles.pairPreview}>
                {dmPairs.map((p, idx) => (
                  <View key={`pair-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                    <Text style={styles.pairPreviewText}>{question.leftItems.find(i => i.id === p.leftId)?.text || '—'}</Text>
                    <Text style={styles.pairArrow}> ↔ </Text>
                    <Text style={styles.pairPreviewText}>{question.rightItems.find(i => i.id === p.rightId)?.text || '—'}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.dragMatchContainer}>
              <View style={styles.leftColumn}>
                {question.leftItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dragItem,
                      (dmSelected.leftId === item.id) && styles.dragItemSelected,
                      dmPairs.some(p => p.leftId === item.id) && styles.dragItemPaired,
                    ]}
                    onPress={() => {
                      // if already paired, unpair
                      if (dmPairs.some(p => p.leftId === item.id)) {
                        const filtered = dmPairs.filter(p => p.leftId !== item.id);
                        setDmPairs(filtered);
                        setCurrentAnswer(filtered);
                        return;
                      }
                      const next = { leftId: item.id, rightId: dmSelected.rightId };
                      if (next.rightId) {
                        const filtered = dmPairs.filter(p => p.rightId !== next.rightId && p.leftId !== next.leftId);
                        const updated = [...filtered, next];
                        setDmPairs(updated);
                        setCurrentAnswer(updated);
                        setDmSelected({ leftId: null, rightId: null });
                      } else {
                        setDmSelected(next);
                      }
                    }}
                  >
                    <Text style={styles.dragItemText}>{item.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.rightColumn}>
                {question.rightItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dragItem,
                      (dmSelected.rightId === item.id) && styles.dragItemSelected,
                      dmPairs.some(p => p.rightId === item.id) && styles.dragItemPaired,
                    ]}
                    onPress={() => {
                      // if already paired, unpair
                      if (dmPairs.some(p => p.rightId === item.id)) {
                        const filtered = dmPairs.filter(p => p.rightId !== item.id);
                        setDmPairs(filtered);
                        setCurrentAnswer(filtered);
                        return;
                      }
                      const next = { leftId: dmSelected.leftId, rightId: item.id };
                      if (next.leftId) {
                        const filtered = dmPairs.filter(p => p.rightId !== next.rightId && p.leftId !== next.leftId);
                        const updated = [...filtered, next];
                        setDmPairs(updated);
                        setCurrentAnswer(updated);
                        setDmSelected({ leftId: null, rightId: null });
                      } else {
                        setDmSelected(next);
                      }
                    }}
                  >
                    <Text style={styles.dragItemText}>{item.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.ARRANGE_IDIOM:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>
            
            <View style={styles.arrangeContainer}>
              <Text style={styles.arrangeText}>
                {currentAnswer ? currentAnswer.join(' ') : 'เรียงคำให้ถูกต้อง'}
              </Text>
            </View>
            
            <View style={styles.choicesContainer}>
              {question.allParts.map((part, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.choiceButton,
                    currentAnswer && currentAnswer.includes(part) && styles.choiceSelected,
                  ]}
                  onPress={() => {
                    if (!currentAnswer) {
                      setCurrentAnswer([part]);
                    } else if (!currentAnswer.includes(part)) {
                      setCurrentAnswer([...currentAnswer, part]);
                    } else {
                      setCurrentAnswer(currentAnswer.filter(p => p !== part));
                    }
                  }}
                >
                  <Text style={styles.choiceText}>{part}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LottieView source={require('../assets/animations/LoadingCat.json')} autoPlay loop style={{ width: 200, height: 200 }} />
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
            <Text style={styles.startTitle}>สำนวนไทย</Text>
            <Text style={styles.startSubtitle}>บทเรียน Advanced</Text>
          </View>
          
          {resumeData && (
            <TouchableOpacity style={styles.resumeButton} onPress={resumeGame} activeOpacity={0.9}>
              <Text style={styles.resumeButtonText}>เล่นต่อจากข้อที่ {resumeData.currentIndex + 1}</Text>
            </TouchableOpacity>
          )}
          
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
  const isLearn = currentQuestion?.type === QUESTION_TYPES.LEARN_IDIOM;
  const isFeedbackPhase = currentFeedback !== null;
  const isButtonDisabled = !isLearn && !isFeedbackPhase && currentAnswer === null;
  const buttonIcon = isLearn || isFeedbackPhase ? 'arrow-right' : 'check';
  const buttonLabel = isLearn || isFeedbackPhase ? 'NEXT' : 'CHECK';
  
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.headerMetaRow}>
            <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
            <View style={styles.typePill}><Text style={styles.typePillText}>{getTypeLabel(currentQuestion.type)}</Text></View>
          </View>
        </View>
      </View>
      
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <LottieView
            source={require('../assets/animations/Heart.json')}
            autoPlay
            loop
            style={styles.statIcon}
          />
          <Text style={styles.statText}>{hearts}</Text>
        </View>
        <View style={styles.statBadge}>
          <LottieView
            source={require('../assets/animations/Streak-Fire1.json')}
            autoPlay
            loop
            style={styles.statIcon}
          />
          <Text style={styles.statText}>{streak}</Text>
        </View>
        <View style={styles.statBadge}>
          <LottieView
            source={require('../assets/animations/Star.json')}
            autoPlay
            loop
            style={styles.statIcon}
          />
          <Text style={styles.statText}>{xpEarned}</Text>
        </View>
        <View style={styles.statBadge}>
          <LottieView
            source={require('../assets/animations/Diamond.json')}
            autoPlay
            loop
            style={styles.statIcon}
          />
          <Text style={styles.statText}>+{diamondsEarned}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statText}>🎯 {Math.min(100, Math.max(0, Math.round((score / Math.max(1, questions.length)) * 100)))}%</Text>
        </View>
      </View>
      
      {/* Question */}
      <ScrollView style={styles.questionScrollView}>
        {renderQuestionComponent()}
      </ScrollView>
      
      {/* Check Button */}
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
            isButtonDisabled && styles.checkButtonDisabledEnhanced,
          ]}
          onPress={() => {
            if (isLearn) {
              nextQuestion();
              return;
            }
            if (isFeedbackPhase) {
              setCurrentFeedback(null);
              setCurrentAnswer(null);
              if (hearts === 0) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                finishLesson(elapsed);
              } else {
                nextQuestion();
              }
              return;
            }
            handleCheckAnswer();
          }}
          disabled={isButtonDisabled}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isButtonDisabled ? ['#ddd', '#ccc'] : [COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradientEnhanced}
          >
            <FontAwesome 
              name={buttonIcon}
              size={20}
              color={COLORS.white}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.checkButtonTextEnhanced}>
              {buttonLabel}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    marginTop: 16,
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backButton: {
    marginRight: 15,
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
    color: COLORS.dark,
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
    backgroundColor: COLORS.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE3CC',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  statIcon: {
    width: 18,
    height: 18,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 4,
  },
  questionScrollView: {
    flex: 1,
    padding: 20,
  },
  questionContainer: {
    flex: 1,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 15,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
    textAlign: 'center',
  },
  hintText: {
    fontSize: 13,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 12,
  },
  speakerButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: '#FFD8B2'
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    overflow: 'hidden'
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
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  choiceSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cream,
    transform: [{ scale: 1.02 }],
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  statementText: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  trueFalseRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trueFalseButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dragMatchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  leftColumn: {
    flex: 1,
    marginRight: 10,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 10,
  },
  dragItem: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dragItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cream,
    transform: [{ scale: 1.02 }]
  },
  dragItemPaired: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.08)'
  },
  dragItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.dark,
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
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  pairArrow: {
    fontSize: 14,
    marginHorizontal: 6,
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
  statBadgeEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  statTextContainer: {
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E8E8E8',
    marginHorizontal: 10,
  },
  checkContainerEnhanced: {
    padding: 18,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    alignItems: 'center',
  },
  feedbackBadgeEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  feedbackCorrectEnhanced: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  feedbackWrongEnhanced: {
    backgroundColor: '#FBE9E7',
    borderColor: '#FF7043',
    borderWidth: 2,
  },
  feedbackTextEnhanced: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 12,
    letterSpacing: 0.3,
    color: '#333',
  },
  checkButtonEnhanced: {
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  checkGradientEnhanced: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  checkButtonDisabledEnhanced: {
    backgroundColor: '#D0D0D0',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkButtonTextEnhanced: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
});

export default Advanced5IdiomsGame;
