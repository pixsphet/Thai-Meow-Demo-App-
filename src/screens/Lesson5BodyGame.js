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
import dailyStreakService from '../services/dailyStreakService';

// Contexts
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useUserData } from '../contexts/UserDataContext';

// Data
import bodyFallback from '../data/lesson5_body.json';

const { width, height } = Dimensions.get('window');

// Question Types
const QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  DRAG_MATCH: 'DRAG_MATCH',
  FILL_BLANK: 'FILL_BLANK',
  ARRANGE_SENTENCE: 'ARRANGE_SENTENCE',
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

// Normalize body part data
const normalizeBody = (doc) => ({
  id: doc.id || doc._id?.toString() || uid(),
  char: doc.thai,
  name: doc.meaningTH || doc.thai,
  roman: doc.roman,
  meaningTH: doc.meaningTH || doc.thai,
  meaningEN: doc.en,
  image: doc.thai,
  audioText: doc.audioText || doc.thai,
});

// UI helper for hint texts per question type
const getHintText = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
      return 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกคำที่ได้ยิน';
    case QUESTION_TYPES.PICTURE_MATCH:
      return 'ดูรูปอวัยวะตรงกลาง แล้วเลือกคำที่ตรงกัน';
    case QUESTION_TYPES.DRAG_MATCH:
      return 'แตะเพื่อจับคู่ ชื่อภาษาไทย ↔ ความหมายภาษาอังกฤษ';
    case QUESTION_TYPES.FILL_BLANK:
      return 'แตะตัวเลือกเพื่อเติมคำให้ถูกต้อง';
    case QUESTION_TYPES.ARRANGE_SENTENCE:
      return 'แตะคำเรียงตามลำดับให้ถูกต้อง';
    default:
      return '';
  }
};

// Language helpers
const isThaiText = (text) => /[ก-๙]/.test(String(text || ''));

// Global display preference
const SHOW_ROMAN = false;

const getTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียงเลือกคำ';
    case QUESTION_TYPES.PICTURE_MATCH: return 'จับคู่จากรูปภาพ';
    case QUESTION_TYPES.DRAG_MATCH: return 'จับคู่ไทย ↔ อังกฤษ';
    case QUESTION_TYPES.FILL_BLANK: return 'เติมคำให้ถูก';
    case QUESTION_TYPES.ARRANGE_SENTENCE: return 'เรียงคำ';
    default: return '';
  }
};

// Question Generators
const makeListenChoose = (word, pool) => {
  const wrongChoices = pool
    .filter(w => w.char !== word.char)
    .slice(0, 3);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `lc_${word.char}_${uid()}`,
    type: QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังเสียงแล้วเลือกคำที่ได้ยิน',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: word.audioText,
    correctText: word.char,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: SHOW_ROMAN ? (c.roman || c.name) : c.char,
      speakText: c.audioText || c.name || c.roman || c.char,
      isCorrect: c.char === word.char,
    })),
  };
};

const makePictureMatch = (word, pool) => {
  const wrongChoices = pool
    .filter(w => w.char !== word.char)
    .slice(0, 3);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 4);
  
  return {
    id: `pm_${word.char}_${uid()}`,
    type: QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูรูปแล้วเลือกคำที่ตรงกัน',
    imageKey: word.image,
    correctText: word.char,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: SHOW_ROMAN ? (c.roman || c.name) : c.char,
      speakText: c.audioText || c.name || c.roman || c.char,
      isCorrect: c.char === word.char,
    })),
  };
};

const makeDragMatch = (word, pool) => {
  const otherWords = pool.filter(w => w.char !== word.char).slice(0, 3);
  const allWords = shuffle([word, ...otherWords]);
  
  const leftItems = allWords.map((w, i) => ({
    id: `left_${i + 1}`,
    text: w.char,
    correctMatch: w.meaningEN,
    speakText: w.audioText,
  }));
  
  const rightItems = allWords.map((w, i) => ({
    id: `right_${i + 1}`,
    text: w.meaningEN,
    thai: w.char,
    roman: w.roman || w.name,
    speakText: w.audioText,
  }));
  
  return {
    id: `dm_${word.char}_${uid()}`,
    type: QUESTION_TYPES.DRAG_MATCH,
    instruction: 'จับคู่คำไทยกับความหมายภาษาอังกฤษ',
    leftItems,
    rightItems,
  };
};

const makeFillBlank = (word, pool) => {
  const templates = [
    `ส่วนร่างกาย ____ ใช้ในการมองเห็น`,
    `____ เป็นส่วนสำคัญของร่างกายที่อยู่บนสุด`,
    `เราใช้ ____ ในการฟังเสียง`,
  ];
  
  const template = pick(templates);
  const wrongChoices = pool
    .filter(w => w.char !== word.char)
    .slice(0, 2);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 3);
  
  return {
    id: `fb_${word.char}_${uid()}`,
    type: QUESTION_TYPES.FILL_BLANK,
    instruction: 'เติมคำในช่องว่าง',
    questionText: template,
    correctText: word.char,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: SHOW_ROMAN ? (c.roman || c.name) : c.char,
      speakText: c.audioText || c.name || c.roman || c.char,
      isCorrect: c.char === word.char,
    })),
  };
};

const makeArrange = (word) => {
  const parts = [word.char, `เป็น`, `ส่วน`, `ของ`, `ร่างกาย`];
  const distractors = ['ครับ', 'ค่ะ', 'ไหม'];
  const allParts = shuffle([...parts, ...distractors]);
  
  return {
    id: `arr_${word.char}_${uid()}`,
    type: QUESTION_TYPES.ARRANGE_SENTENCE,
    instruction: 'เรียงคำให้ถูกต้อง',
    correctOrder: parts,
    allParts,
  };
};

// Generate questions (target 14): LC×4, PM×3, DM×3, FB×2, ARR×2
const generateBodyQuestions = (pool) => {
  const questions = [];
  const usedChars = new Set();
  
  // LISTEN_CHOOSE × 4
  for (let i = 0; i < 4; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeListenChoose(word, pool));
  }
  
  // PICTURE_MATCH × 3
  for (let i = 0; i < 3; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makePictureMatch(word, pool));
  }
  
  // DRAG_MATCH × 3
  for (let i = 0; i < 3; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeDragMatch(word, pool));
  }
  
  // FILL_BLANK × 2
  for (let i = 0; i < 2; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeFillBlank(word, pool));
  }
  
  // ARRANGE_SENTENCE × 2
  for (let i = 0; i < 2; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeArrange(word));
  }
  
  return shuffle(questions);
};

// Check answer
const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
    case QUESTION_TYPES.PICTURE_MATCH:
    case QUESTION_TYPES.FILL_BLANK:
      return userAnswer === question.correctText;
    
    case QUESTION_TYPES.DRAG_MATCH:
      return userAnswer && userAnswer.every(pair => 
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );
    
    case QUESTION_TYPES.ARRANGE_SENTENCE:
      return Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
    
    default:
      return false;
  }
};

const Lesson5BodyGame = ({ navigation, route }) => {
  const {
    lessonId = 5,
    category: routeCategory = 'body',
    stageTitle = 'ร่างกาย (Body Parts)',
    level: stageLevel = 1,
    nextStageMeta: incomingNextStageMeta,
    stageSelectRoute = 'LevelStage1',
    replayRoute = 'Lesson5BodyGame',
    replayParams: incomingReplayParams,
  } = route.params || {};

  const resolvedNextStageMeta = useMemo(() => {
    if (incomingNextStageMeta) {
      return incomingNextStageMeta;
    }
    // No default next after lesson 5; return null to go to stage select
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
  const [bodyParts, setBodyParts] = useState([]);
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
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);
  
  // Refs
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const progressRef = useRef(null);
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);
  
  // Load body parts data
  useEffect(() => {
    const loadBodyParts = async () => {
      try {
        const normalizedBodyParts = bodyFallback.map(normalizeBody);
        setBodyParts(normalizedBodyParts);
        
        const generatedQuestions = generateBodyQuestions(normalizedBodyParts);
        setQuestions(generatedQuestions);
        
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
        console.error('Error loading body parts:', error);
        setLoading(false);
      }
    };
    
    loadBodyParts();
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

      try {
        if (typeof dailyStreakService.setUser === 'function') {
          dailyStreakService.setUser(userId);
        }
      } catch (error) {
        console.warn('Failed to bind user to dailyStreakService:', error?.message || error);
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
        generator: 'body_parts',
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
    if (checked) { nextQuestion(); return; }
    if (currentAnswer === null) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = checkAnswer(currentQuestion, currentAnswer);

    answersRef.current[currentIndex] = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      isCorrect,
      timestamp: Date.now(),
    };
    setAnswers({ ...answersRef.current });
    setLastCorrect(isCorrect);
    setChecked(true);

    if (isCorrect) {
      const newScore = score + 1;
      const newXp = xpEarned + 10;
      const newDiamonds = diamondsEarned + 1;
      setScore(newScore);
      setXpEarned(newXp);
      setDiamondsEarned(newDiamonds);
    } else {
      const newHearts = Math.max(0, hearts - 1);
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
    setChecked(false);
    setLastCorrect(null);
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
          gameMode: 'body_parts_stage',
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
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level5', {
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
                  <Text
                    style={[
                      styles.choiceText,
                      isThaiText(choice.text) && { fontSize: 26, fontWeight: '900' }
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
      
      case QUESTION_TYPES.PICTURE_MATCH:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.imageContainer}>
                <View style={styles.imageFallback}>
                  <Text style={styles.consonantChar}>{question.imageKey}</Text>
                </View>
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
                  <Text
                    style={[
                      styles.choiceText,
                      isThaiText(choice.text) && { fontSize: 26, fontWeight: '900' }
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
      
      case QUESTION_TYPES.DRAG_MATCH:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>
            
            {(dmSelected.leftId || dmSelected.rightId || dmPairs.length > 0) && (
              <View style={styles.pairPreview}>
                {dmPairs.map((p, idx) => (
                  <View key={`pair-${idx}`} style={{ flexDirection:'row', alignItems:'center', marginRight:8 }}>
                    <Text style={styles.pairPreviewText}>{question.leftItems.find(i=>i.id===p.leftId)?.text || '—'}</Text>
                    <Text style={styles.pairArrow}> ↔ </Text>
                    <Text style={styles.pairPreviewText}>{question.rightItems.find(i=>i.id===p.rightId)?.text || '—'}</Text>
                  </View>
                ))}
                {(dmSelected.leftId || dmSelected.rightId) && (
                  <View style={{ flexDirection:'row', alignItems:'center' }}>
                    <Text style={[styles.pairPreviewText,{opacity:0.6}]}>{question.leftItems.find(i=>i.id===dmSelected.leftId)?.text || '—'}</Text>
                    <Text style={styles.pairArrow}> ↔ </Text>
                    <Text style={[styles.pairPreviewText,{opacity:0.6}]}>{question.rightItems.find(i=>i.id===dmSelected.rightId)?.text || '—'}</Text>
                  </View>
                )}
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
                      dmPairs.some(p=>p.leftId===item.id) && styles.dragItemPaired,
                    ]}
                    onPress={() => {
                      playTTS(item.speakText);
                      if (dmPairs.some(p=>p.leftId===item.id)) {
                        const filtered = dmPairs.filter(p=>p.leftId!==item.id);
                        setDmPairs(filtered);
                        setCurrentAnswer(filtered);
                        return;
                      }
                      const next = { leftId: item.id, rightId: dmSelected.rightId };
                      if (next.rightId) {
                        const filtered = dmPairs.filter(p=>p.rightId!==next.rightId && p.leftId!==next.leftId);
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
                    <MaterialIcons name="volume-up" size={20} color={COLORS.gray} />
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
                      dmPairs.some(p=>p.rightId===item.id) && styles.dragItemPaired,
                    ]}
                    onPress={() => {
                      playTTS(item.speakText);
                      if (dmPairs.some(p=>p.rightId===item.id)) {
                        const filtered = dmPairs.filter(p=>p.rightId!==item.id);
                        setDmPairs(filtered);
                        setCurrentAnswer(filtered);
                        return;
                      }
                      const next = { leftId: dmSelected.leftId, rightId: item.id };
                      if (next.leftId) {
                        const filtered = dmPairs.filter(p=>p.rightId!==next.rightId && p.leftId!==next.leftId);
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
                    <MaterialIcons name="volume-up" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.FILL_BLANK:
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
      
      case QUESTION_TYPES.ARRANGE_SENTENCE:
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
            <Text style={styles.startTitle}>ร่างกาย</Text>
            <Text style={styles.startSubtitle}>เรียนรู้ชื่อส่วนร่างกายไทยพื้นฐาน</Text>
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
      
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <LottieView
            source={require('../assets/animations/Star.json')}
            autoPlay
            loop
            style={styles.starAnimation}
          />
          <Text style={styles.statText}>{xpEarned} XP</Text>
        </View>
        <View style={styles.statBadge}>
          <LottieView
            source={require('../assets/animations/Diamond.json')}
            autoPlay
            loop
            style={styles.diamondAnimation}
          />
          <Text style={styles.statText}>+{diamondsEarned}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statText}>🎯 {Math.min(100, Math.max(0, Math.round((score / Math.max(1, currentIndex)) * 100)))}%</Text>
        </View>
        <View style={styles.statBadge}>
          <LottieView
            source={require('../assets/animations/Streak-Fire1.json')}
            autoPlay
            loop
            style={styles.streakAnimation}
          />
          <Text style={styles.statText}>{streak}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.questionScrollView}>
        {renderQuestionComponent()}
      </ScrollView>
      
      <View style={styles.checkContainer}>
        <TouchableOpacity
          style={[
            styles.checkButton,
            currentAnswer === null && !checked && styles.checkButtonDisabled,
          ]}
          onPress={handleCheckAnswer}
          disabled={currentAnswer === null && !checked}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradient}
          >
            <Text style={styles.checkButtonText}>{checked ? 'NEXT' : 'CHECK'}</Text>
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
  },
  consonantChar: {
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
});

export default Lesson5BodyGame;
