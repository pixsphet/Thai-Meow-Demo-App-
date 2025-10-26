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
  Animated,
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const foodDrinksDataFallback = require('../data/intermediate1_food_20items.json');

// Food image mapping
const foodImages = {
  'ข้าว': require('../add/Food/ข้าว.png'),
  'ข้าวผัด': require('../add/Food/ข้าวผัด.png'),
  'ผัดไทย': require('../add/Food/ผัดไทย.png'),
  'ส้มตำ': require('../add/Food/ส้มตำ.png'),
  'ต้มยำ': require('../add/Food/ต้มยำ.png'),
  'ขนมจีน': require('../add/Food/ขนมจีน.png'),
  'ขนมปัง': require('../add/Food/ขนมปัง.png'),
  'ข้าวเหนียว': require('../add/Food/ข้าวเหนียว.png'),
  'มะม่วง': require('../add/Food/มะม่วง.png'),
  'กล้วย': require('../add/Food/กล้วย.png'),
  'ทุเรียน': require('../add/Food/ทุเรียน.png'),
  'ส้ม': require('../add/Food/ส้ม.png'),
  'แตงโม': require('../add/Food/แตงโม.png'),
  'น้ำปลา': require('../add/Food/น้ำปลา.png'),
  'น้ำตาล': require('../add/Food/น้ำตาล.png'),
  'เกลือ': require('../add/Food/เกลือ.png'),
  'ไข่': require('../add/Food/ไข่.png'),
  'แกงเขียวหวาน': require('../add/Food/แกงเขียวหวาน.png'),
  'ไอศกรีม': require('../add/Food/ไอศกรีม.png'),
  'ชาเย็น': require('../add/Food/ชาเย็น.png'),
};

const { width, height } = Dimensions.get('window');

// Question Types
const QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
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

// Normalize food data
const normalizeFoodItem = (doc) => ({
  id: doc.id || doc._id || `food_${uid()}`,
  thai: doc.thai || '',
  en: doc.en || '',
  emoji: doc.emoji || '🍲',
  audioText: doc.audioText || doc.thai || '',
});

// UI helper for hint texts per question type
const getHintText = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
      return 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกอาหารที่ได้ยิน';
    case QUESTION_TYPES.PICTURE_MATCH:
      return 'ดูรูป แล้วเลือกชื่ออาหารที่ตรงกัน';
    case QUESTION_TYPES.TRANSLATE_MATCH:
      return 'แตะเพื่อจับคู่ ไทย ↔ อังกฤษ';
    case QUESTION_TYPES.FILL_BLANK_DIALOG:
      return 'เลือกคำให้ตรงบริบทในบทสนทนา';
    default:
      return '';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียง';
    case QUESTION_TYPES.PICTURE_MATCH: return 'จับคู่รูป';
    case QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่ภาษา';
    case QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เติมคำ';
    default: return '';
  }
};

// Question Generators
const makeListenChoose = (item, pool) => {
  const wrongChoices = pool
    .filter(w => w.id !== item.id)
    .slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `lc_${item.id}_${uid()}`,
    type: QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังเสียงแล้วเลือกอาหารที่ได้ยิน',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: item.audioText || item.thai,
    correctText: item.thai,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.thai,
      emoji: c.emoji,
      speakText: c.audioText || c.thai,
      isCorrect: c.id === item.id,
    })),
  };
};

const makePictureMatch = (item, pool) => {
  const wrongChoices = pool
    .filter(w => w.id !== item.id)
    .slice(0, 3);
  const choices = shuffle([item, ...wrongChoices]).slice(0, 4);

  return {
    id: `pm_${item.id}_${uid()}`,
    type: QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูรูป แล้วเลือกชื่ออาหาร',
    imageSource: foodImages[item.thai] || null,
    emoji: item.emoji || '🍲',
    correctText: item.thai,
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.thai,
      emoji: c.emoji,
      speakText: c.audioText || c.thai,
      isCorrect: c.id === item.id,
    })),
  };
};

const makeTranslateMatch = (pick4) => {
  const left = pick4.map((x, i) => ({ id: i + 1, text: x.thai, correctMatch: x.en }));
  const right = shuffle(pick4).map((x, i) => ({ id: i + 1, text: x.en }));
  return {
    id: `tm_${uid()}`,
    type: QUESTION_TYPES.TRANSLATE_MATCH,
    instruction: 'จับคู่ไทย ↔ อังกฤษ',
    rewardXP: 15,
    rewardDiamond: 1,
    penaltyHeart: 1,
    leftItems: left,
    rightItems: right,
  };
};

const makeFillBlankDialog = (template, choices, answer) => ({
  id: `fb_${uid()}`,
  type: QUESTION_TYPES.FILL_BLANK_DIALOG,
  instruction: 'เลือกคำให้ตรงบริบท',
  questionText: template,
  correctText: answer,
  rewardXP: 15,
  rewardDiamond: 1,
  penaltyHeart: 1,
  choices: choices.map((t, i) => ({ id: i + 1, text: t })),
});

// Generate questions: LC×5, PM×4, TM×2, FB×2
const generateFoodDrinksQuestions = (pool) => {
  const questions = [];
  const usedIds = new Set();
  
  // LISTEN_CHOOSE × 5
  for (let i = 0; i < 5 && pool.length > usedIds.size; i++) {
    const available = pool.filter(p => !usedIds.has(p.id));
    if (available.length === 0) break;
    const item = pick(available);
    usedIds.add(item.id);
    questions.push(makeListenChoose(item, pool));
  }
  
  // PICTURE_MATCH × 4
  for (let i = 0; i < 4 && pool.length > usedIds.size; i++) {
    const available = pool.filter(p => !usedIds.has(p.id));
    if (available.length === 0) break;
    const item = pick(available);
    usedIds.add(item.id);
    questions.push(makePictureMatch(item, pool));
  }
  
  // TRANSLATE_MATCH × 2
  for (let i = 0; i < 2; i++) {
    const pick4 = shuffle(pool).slice(0, 4);
    questions.push(makeTranslateMatch(pick4));
  }
  
  // FILL_BLANK_DIALOG × 2
  const dialogTemplates = [
    {
      template: 'A: เมนูแนะนำคืออะไรครับ?\nB: ____',
      choices: ['ผัดไทย', 'ไม่เผ็ด', 'คิดเงินด้วยครับ'],
      answer: 'ผัดไทย',
    },
    {
      template: 'A: ขอชาเย็น ____\nB: ได้ค่ะ',
      choices: ['ไม่หวาน', 'ราคาเท่าไหร่', 'คิดเงินด้วยครับ'],
      answer: 'ไม่หวาน',
    },
  ];
  dialogTemplates.forEach(t => {
    questions.push(makeFillBlankDialog(t.template, t.choices, t.answer));
  });
  
  return shuffle(questions);
};

// Check answer
const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
    case QUESTION_TYPES.PICTURE_MATCH:
    case QUESTION_TYPES.FILL_BLANK_DIALOG:
      return userAnswer === question.correctText;
    
    case QUESTION_TYPES.TRANSLATE_MATCH:
      return userAnswer && userAnswer.every(pair =>
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );
    
    case QUESTION_TYPES.ORDER_FLOW:
      return Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
    
    default:
      return false;
  }
};

const Intermediate1FoodDrinksGame = ({ navigation, route }) => {
  const {
    lessonId = 'intermediate1',
    category: routeCategory = 'thai-food-drinks',
    stageTitle = 'อาหารและเครื่องดื่ม',
    level: stageLevel = 'Intermediate',
    nextStageMeta: incomingNextStageMeta,
    stageSelectRoute = 'LevelStage2',
    replayRoute = 'Intermediate1FoodDrinksGame',
    replayParams: incomingReplayParams,
  } = route.params || {};

  const resolvedNextStageMeta = useMemo(() => {
    if (incomingNextStageMeta) {
      return incomingNextStageMeta;
    }
    return null;
  }, [incomingNextStageMeta]);

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
  const [foodItems, setFoodItems] = useState([]);
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
  const [currentFeedback, setCurrentFeedback] = useState(null);
  
  // Refs
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);
  
  // Load food items data
  useEffect(() => {
    const loadFoodItems = async () => {
      try {
        const normalizedItems = (foodDrinksDataFallback || [])
          .map(normalizeFoodItem)
          .filter(i => i && i.thai);
        setFoodItems(normalizedItems);
        
        // Generate questions
        const generatedQuestions = generateFoodDrinksQuestions(normalizedItems);
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
        console.error('Error loading food items:', error);
        setLoading(false);
      }
    };
    
    loadFoodItems();
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
        console.warn('Failed to initialize gameProgressService:', error?.message);
      }

      try {
        await levelUnlockService.initialize(userId);
      } catch (error) {
        console.warn('Failed to initialize levelUnlockService:', error?.message);
      }

      try {
        await userStatsService.initialize(userId);
      } catch (error) {
        console.warn('Failed to initialize userStatsService:', error?.message);
      }
    })();
  }, [progressUser?.id, userData?.id, stats?.userId, stats?._id, stats?.id]);
  
  // Auto-save progress
  const autosave = useCallback(async () => {
    if (questions.length === 0) return;
    
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
        generator: 'food_drinks',
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
      playTTS(speakText);
    }
  };
  
  // Handle check answer
  const handleCheckAnswer = () => {
    if (currentAnswer === null) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = checkAnswer(currentQuestion, currentAnswer);

    answersRef.current[currentIndex] = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      isCorrect,
      timestamp: Date.now(),
      rewardXP: isCorrect ? (currentQuestion.rewardXP || 15) : 0,
      rewardDiamond: isCorrect ? (currentQuestion.rewardDiamond || 1) : 0,
      penaltyHeart: !isCorrect ? (currentQuestion.penaltyHeart || 1) : 0,
    };
    setAnswers({ ...answersRef.current });
    setCurrentFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newScore = score + 1;
      const xpReward = currentQuestion.rewardXP || 15;
      const diamondReward = currentQuestion.rewardDiamond || 1;
      const newXp = xpEarned + xpReward;
      const newDiamonds = diamondsEarned + diamondReward;

      setScore(newScore);
      setXpEarned(newXp);
      setDiamondsEarned(newDiamonds);
      
    } else {
      const heartPenalty = currentQuestion.penaltyHeart || 1;
      const newHearts = Math.max(0, hearts - heartPenalty);
      setHearts(newHearts);
      if (newHearts === 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        finishLesson(elapsed);
        return;
      }
    }
  };
  
  // Reset drag-match state when index changes
  useEffect(() => {
    setDmSelected({ leftId: null, rightId: null });
    setDmPairs([]);
    setCurrentAnswer(null);
    setCurrentFeedback(null);
  }, [currentIndex]);

  // Next question
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(null);
    } else {
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
          gameMode: 'intermediate_food_drinks',
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
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level_intermediate_1', {
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
    if (questions.length === 0 || currentIndex >= questions.length) return null;
    
    const question = questions[currentIndex];
    
    switch (question.type) {
      case QUESTION_TYPES.LISTEN_CHOOSE:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.questionText}>{question.questionText}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <TouchableOpacity
                style={styles.speakerButton}
                onPress={() => playTTS(question.audioText)}
              >
                <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
              </TouchableOpacity>
              
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
                    <Text style={[styles.choiceText, { fontSize: 24 }]}>{choice.emoji}</Text>
                    <Text style={styles.choiceText}>{choice.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.PICTURE_MATCH:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.imageContainer}>
                {question.imageSource ? (
                  <Image source={question.imageSource} style={styles.imageFallback} />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.emojiChar}>{question.emoji}</Text>
                  </View>
                )}
              </View>
              
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
      
      case QUESTION_TYPES.TRANSLATE_MATCH:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              {dmPairs.length > 0 && (
                <View style={styles.matchedPairsContainer}>
                  <Text style={styles.matchedLabel}>จับคู่แล้ว ({dmPairs.length}/{question.leftItems.length})</Text>
                  <View style={styles.matchedList}>
                    {dmPairs.map((p, idx) => (
                      <View key={`pair-${idx}`} style={styles.matchedPairItem}>
                        <View style={styles.matchedPairBadge}>
                          <Text style={styles.matchedPairText}>{question.leftItems.find(i => i.id === p.leftId)?.text || '—'}</Text>
                          <Text style={styles.matchedPairArrow}> ↔ </Text>
                          <Text style={styles.matchedPairText}>{question.rightItems.find(i => i.id === p.rightId)?.text || '—'}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            const filtered = dmPairs.filter(pp => !(pp.leftId === p.leftId && pp.rightId === p.rightId));
                            setDmPairs(filtered);
                            setCurrentAnswer(filtered);
                          }}
                        >
                          <FontAwesome name="times" size={16} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              <Text style={styles.matchLabel}>ไทย</Text>
              <View style={styles.matchListLeft}>
                {question.leftItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.matchItem,
                      dmSelected.leftId === item.id && styles.matchItemSelected,
                      dmPairs.some(p => p.leftId === item.id) && styles.matchItemMatched,
                    ]}
                    onPress={() => {
                      if (dmPairs.some(p => p.leftId === item.id)) {
                        const filtered = dmPairs.filter(p => p.leftId !== item.id);
                        setDmPairs(filtered);
                        setCurrentAnswer(filtered);
                        setDmSelected({ leftId: null, rightId: null });
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
                    <View style={styles.matchItemContent}>
                      <Text style={styles.matchItemText}>{item.text}</Text>
                      <MaterialIcons name="volume-up" size={18} color={dmPairs.some(p => p.leftId === item.id) ? COLORS.white : COLORS.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.matchLabel}>English</Text>
              <View style={styles.matchListRight}>
                {question.rightItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.matchItem,
                      dmSelected.rightId === item.id && styles.matchItemSelected,
                      dmPairs.some(p => p.rightId === item.id) && styles.matchItemMatched,
                    ]}
                    onPress={() => {
                      if (dmPairs.some(p => p.rightId === item.id)) {
                        const filtered = dmPairs.filter(p => p.rightId !== item.id);
                        setDmPairs(filtered);
                        setCurrentAnswer(filtered);
                        setDmSelected({ leftId: null, rightId: null });
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
                    <View style={styles.matchItemContent}>
                      <Text style={styles.matchItemText}>{item.text}</Text>
                      <MaterialIcons name="volume-up" size={18} color={dmPairs.some(p => p.rightId === item.id) ? COLORS.white : COLORS.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.FILL_BLANK_DIALOG:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.questionText}>{question.questionText}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.choicesContainer}>
                {question.choices.map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      currentAnswer === choice.text && styles.choiceSelected,
                    ]}
                    onPress={() => handleAnswerSelect(choice.text)}
                  >
                    <Text style={styles.choiceText}>{choice.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
            <Text style={styles.startTitle}>อาหาร & เครื่องดื่ม</Text>
            <Text style={styles.startSubtitle}>เรียนรู้คำศัพท์ในร้านอาหาร</Text>
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
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFF5E5', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bg}
      />
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
            <Text style={styles.statValue}>{Math.min(100, Math.max(0, Math.round((score / Math.max(1, questions.length)) * 100)))}%</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.questionScrollView}>
        {renderQuestionComponent()}
      </ScrollView>

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
              if (currentAnswer === null) {
                return;
              }
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
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  heartsDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFE3CC',
  },
  heartsIconAnimation: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  heartsDisplay: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageFallback: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    resizeMode: 'contain',
  },
  emojiChar: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
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
    paddingHorizontal: 22,
    borderRadius: 18,
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative'
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
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
    flex: 1,
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
  matchedPairsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  matchedLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 10,
  },
  matchedList: {
    gap: 8,
  },
  matchedPairItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchedPairBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  matchedPairText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
  },
  matchedPairArrow: {
    fontSize: 14,
    marginHorizontal: 8,
    color: '#4CAF50',
    fontWeight: '700',
  },
  matchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 10,
    marginTop: 15,
  },
  matchListLeft: {
    marginBottom: 16,
    gap: 10,
  },
  matchListRight: {
    marginBottom: 16,
    gap: 10,
  },
  matchItem: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  matchItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cream,
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  matchItemMatched: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderWidth: 2,
  },
  matchItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
    marginRight: 10,
  },
  dragMatchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});

export default Intermediate1FoodDrinksGame;
