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
import { useGameHearts } from '../utils/useGameHearts';

// Data
import objectsFallback from '../data/lesson4_objects_data.json';

// Object images from src/add/Objects directory
const objectImages = {
  'โต๊ะ': require('../add/Objects/โต๊ะ.png'),
  'เก้าอี้': require('../add/Objects/เก้าอี้.png'),
  'หนังสือ': require('../add/Objects/หนังสือ.png'),
  'ปากกา': require('../add/Objects/ปากกา.png'),
  'ดินสอ': require('../add/Objects/ดินสอ.png'),
  'สมุด': require('../add/Objects/สมุด.png'),
  'กระเป๋า': require('../add/Objects/กระเป๋า.png'),
  'โทรศัพท์': require('../add/Objects/โทรศัพท์.png'),
  'คอมพิวเตอร์': require('../add/Objects/คอมพิวเตอร์.png'),
  'ทีวี': require('../add/Objects/ทีวี.png'),
  'พัดลม': require('../add/Objects/พัดลม.png'),
  'ตู้เย็น': require('../add/Objects/ตู้เย็น.png'),
  'หมอน': require('../add/Objects/หมอน.png'),
  'ผ้าห่ม': require('../add/Objects/ผ้าห่ม.png'),
  'ประตู': require('../add/Objects/ประตู.png'),
  'หน้าต่าง': require('../add/Objects/หน้าต่าง.png'),
  'รองเท้า': require('../add/Objects/รองเท้า.png'),
  'เสื้อ': require('../add/Objects/เสื้อ.png'),
  'หมวก': require('../add/Objects/หมวก.png'),
  'กุญแจ': require('../add/Objects/กุญแจ.png'),
};

const { width, height } = Dimensions.get('window');

// Question Types
const QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  PICTURE_MATCH: 'PICTURE_MATCH',
  FILL_BLANK: 'FILL_BLANK',
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

// Normalize object data
const normalizeObject = (doc) => ({
  id: doc.id || doc._id?.toString() || uid(),
  char: doc.thai,
  name: doc.roman,
  roman: doc.roman,
  meaningTH: doc.meaningTH,
  meaningEN: doc.en,
  image: doc.thai,
  audioText: doc.audioText || doc.thai,
  en: doc.en,
  imagePath: doc.imagePath,
  imageSource: objectImages[doc.thai] || null,
});

// UI helper for hint texts
const getHintText = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
      return 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกคำที่ได้ยิน';
    case QUESTION_TYPES.PICTURE_MATCH:
      return 'ดูภาพตรงกลาง แล้วเลือกคำที่ตรงกัน';
    case QUESTION_TYPES.FILL_BLANK:
      return 'แตะตัวเลือกเพื่อเติมคำให้ถูกต้อง';
    default:
      return '';
  }
};

const isThaiText = (text) => /[ก-๙]/.test(String(text || ''));
const SHOW_ROMAN = true;

const getTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียงเลือกคำ';
    case QUESTION_TYPES.PICTURE_MATCH: return 'จับคู่จากรูปภาพ';
    case QUESTION_TYPES.FILL_BLANK: return 'เติมคำ';
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
    questionText: 'แตะปุ่มลำโพงเพื่อฟังคำศัพท์',
    audioText: word.audioText,
    correctText: word.char,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.char, // Show only Thai
      speakText: c.audioText || c.char,
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
    instruction: 'ดูภาพแล้วเลือกคำให้ตรง',
    imageKey: word.image,
    imagePath: word.imagePath,
    correctText: word.char,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.char, // Show only Thai
      speakText: c.audioText || c.char,
      isCorrect: c.char === word.char,
    })),
  };
};

const makeFillBlank = (word, pool) => {
  const templates = [
    `ฉันมี ____ ในกระเป๋า`,
    `นี่คือ ____`,
    `ฉันใช้ ____`,
  ];
  
  const template = pick(templates);
  const wrongChoices = pool
    .filter(w => w.char !== word.char)
    .slice(0, 2);
  const choices = shuffle([word, ...wrongChoices]).slice(0, 3);
  
  return {
    id: `fb_${word.char}_${uid()}`,
    type: QUESTION_TYPES.FILL_BLANK,
    instruction: 'เลือกคำมาเติมประโยคให้ถูกต้อง',
    questionText: template,
    imageSource: word.imageSource,
    correctText: word.char,
    choices: choices.map((c, i) => ({
      id: i + 1,
      text: c.char, // Show only Thai
      speakText: c.audioText || c.char,
      isCorrect: c.char === word.char,
    })),
  };
};

// Generate questions (target 12): LC×5, PM×4, FB×3
const generateObjectQuestions = (pool) => {
  const questions = [];
  const usedChars = new Set();
  
  // LISTEN_CHOOSE × 5
  for (let i = 0; i < 5; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeListenChoose(word, pool));
  }
  
  // PICTURE_MATCH × 4
  for (let i = 0; i < 4; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makePictureMatch(word, pool));
  }
  
  // FILL_BLANK × 3
  for (let i = 0; i < 3; i++) {
    const available = pool.filter(w => !usedChars.has(w.char));
    if (available.length === 0) break;
    const word = pick(available);
    usedChars.add(word.char);
    questions.push(makeFillBlank(word, pool));
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
    
    default:
      return false;
  }
};

const Lesson4ObjectsGame = ({ navigation, route }) => {
  const {
    lessonId = 4,
    category: routeCategory = 'thai-objects',
    stageTitle = 'สิ่งของรอบตัว',
    level: stageLevel = 1,
    nextStageMeta: incomingNextStageMeta,
    stageSelectRoute = 'LevelStage1',
    replayRoute = 'Lesson4ObjectsGame',
    replayParams: incomingReplayParams,
  } = route.params || {};

  const resolvedNextStageMeta = useMemo(() => {
    if (incomingNextStageMeta) {
      return incomingNextStageMeta;
    }
    // Default next after objects → Lesson5Body
    return {
      route: 'Lesson5BodyGame',
      params: {
        lessonId: 5,
        category: 'body',
        level: stageLevel,
        stageTitle: 'ร่างกาย (Body Parts)',
      },
    };
  }, [incomingNextStageMeta, stageLevel]);

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

  // Use unified hearts system
  const { hearts, heartsDisplay, loseHeart, setHearts } = useGameHearts();

  // State
  const [objects, setObjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
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
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);

  // Refs
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);

  // Load objects data
  useEffect(() => {
    const loadObjects = async () => {
      try {
        const normalizedObjects = objectsFallback.map(normalizeObject);
        setObjects(normalizedObjects);
        
        const generatedQuestions = generateObjectQuestions(normalizedObjects);
        setQuestions(generatedQuestions);
        
        const savedProgress = await restoreProgress(lessonId);
        if (savedProgress && savedProgress.questionsSnapshot) {
          setResumeData(savedProgress);
          setCurrentIndex(savedProgress.currentIndex || 0);
          if (savedProgress.hearts !== undefined) {
            setHearts(savedProgress.hearts);
          }
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
        console.error('Error loading objects:', error);
        setLoading(false);
      }
    };
    
    loadObjects();
  }, [lessonId]);

  // Initialize services
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
        generator: 'objects',
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
      loseHeart(1);
      if (newHearts === 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        finishLesson(elapsed);
        return;
      }
    }
  };

  // Reset state when index changes
  useEffect(() => {
    setChecked(false);
    setLastCorrect(null);
  }, [currentIndex]);

  // Next question
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(null);
      setChecked(false);
      setLastCorrect(null);
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
          gameMode: 'objects_lesson_4',
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
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level4', {
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
                <Image
                  source={question.imageSource || objectImages[question.imageKey]}
                  style={styles.imageFallback}
                />
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
      
      case QUESTION_TYPES.FILL_BLANK:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.questionText}>{question.questionText}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              {question.imageSource && (
                <View style={styles.imageContainer}>
                  <Image
                    source={question.imageSource}
                    style={styles.objectImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              
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
            <Text style={styles.startTitle}>สิ่งของรอบตัว</Text>
            <Text style={styles.startSubtitle}>เรียนรู้คำศัพท์สิ่งของ</Text>
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
  const correctCount = Object.values(answersRef.current || {}).filter(a => a && a.isCorrect).length;
  const answeredCount = Object.keys(answersRef.current || {}).length;
  const accuracyPercent = answeredCount > 0 ? Math.min(100, Math.round((correctCount / answeredCount) * 100)) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient */}
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
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.backButtonGradient}
            >
              <FontAwesome name="arrow-left" size={22} color={COLORS.white} />
            </LinearGradient>
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
            <Text style={styles.statValue}>{Math.min(100, Math.max(0, Math.round((score / Math.max(1, questions.length)) * 100)))}%</Text>
          </View>
        </View>
      </View>

      {/* Question */}
      <ScrollView style={styles.questionScrollView}>
        {renderQuestionComponent()}
      </ScrollView>

      {/* Check Button & Feedback - Enhanced 2-Phase */}
      <View style={styles.checkContainerEnhanced}>
        {lastCorrect !== null && (
          <View style={[
            styles.feedbackBadgeEnhanced,
            lastCorrect ? styles.feedbackCorrectEnhanced : styles.feedbackWrongEnhanced
          ]}>
            <FontAwesome 
              name={lastCorrect ? 'check-circle' : 'times-circle'} 
              size={28} 
              color={lastCorrect ? '#58cc02' : '#ff4b4b'}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.feedbackTextEnhanced}>
              {lastCorrect ? 'ถูกต้อง! ยอดเยี่ยม' : 'พยายามอีกครั้ง'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.checkButtonEnhanced,
            currentAnswer === null && styles.checkButtonDisabledEnhanced,
            checked && styles.checkButtonNextEnhanced,
          ]}
          onPress={() => {
            if (checked) {
              setChecked(false);
              setLastCorrect(null);
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
            colors={
              currentAnswer === null 
                ? ['#ddd', '#ccc'] 
                : checked 
                  ? ['#4CAF50', '#66BB6A']
                  : [COLORS.primary, '#FFA24D']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradientEnhanced}
          >
            <FontAwesome 
              name={checked ? 'arrow-right' : 'check-circle'} 
              size={24} 
              color={COLORS.white}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.checkButtonTextEnhanced}>
              {checked ? (hearts === 0 ? 'จบเกม' : 'NEXT') : 'CHECK'}
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
  headerGradient: {
    paddingTop: 40, // Adjust for status bar
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  heartsDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 5,
  },
  heartsIconAnimation: {
    width: 20,
    height: 20,
    marginRight: 5,
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
  objectImage: {
    width: 140,
    height: 140,
    borderRadius: 15,
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
  charText: {
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
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  dragItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cream,
    transform: [{ scale: 1.03 }],
    shadowOpacity: 0.1,
    elevation: 3,
  },
  dragItemPaired: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76,175,80,0.08)'
  },
  dragItemText: {
    fontSize: 15,
    fontWeight: '600',
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
  connectionPreview: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F2',
  },
  connectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  pairTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FFE3CC',
  },
  pairDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pairTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pairRemoveBtn: {
    marginLeft: 10,
    padding: 2,
  },
  pairRemoveX: {
    fontSize: 16,
    color: COLORS.gray,
  },
  columnHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 10,
    textAlign: 'center',
  },
  pairIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  matchingWrapper: {
    marginTop: 12,
    backgroundColor: '#FFF4E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  matchingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  matchingHeaderLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
  },
  matchingColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matchingColumn: {
    flex: 1,
  },
  matchingDivider: {
    width: 14,
  },
  matchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFE1C4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  matchCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,128,0,0.08)',
  },
  matchCardPaired: {
    borderWidth: 2.5,
  },
  matchCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
  },
  matchCardRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCardSubText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#7A7A7A',
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
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  nextButton: {
    backgroundColor: 'rgba(255,128,0,0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 12,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  statTextContainer: {
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 2,
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
    width: '90%',
    maxWidth: 320,
  },
  checkButtonNextEnhanced: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.5,
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

export default Lesson4ObjectsGame;
