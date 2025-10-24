import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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

// Data & Generators
import routineVocabFallback from '../data/routine_vocab.json';
import { generateRoutineQuestions } from '../utils/routineQuestionGenerator';

const { width, height } = Dimensions.get('window');
const LESSON_ID = 'intermediate_4_routines';
const LESSON_KEY = 'intermediate_4_routines';
const CATEGORY = 'thai-daily-routines';

// Question Types
const QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  TRANSLATE_MATCH: 'TRANSLATE_MATCH',
  ARRANGE_SENTENCE: 'ARRANGE_SENTENCE',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
  TIMELINE_ORDER: 'TIMELINE_ORDER',
};

// Colors (Orange theme for Daily Routines)
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

// Normalize routine data
const normalizeRoutineItem = (doc) => ({
  id: doc.id || doc._id || `routine_${uid()}`,
  thai: doc.thai || '',
  roman: doc.roman || '',
  en: doc.en || '',
  emoji: doc.emoji || '⏰',
  audioText: doc.audioText || doc.thai || '',
  type: doc.type || 'verb',
});

// UI helper for hint texts per question type
const getHintText = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
      return 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกกิจวัตรที่ได้ยิน';
    case QUESTION_TYPES.TRANSLATE_MATCH:
      return 'แตะเพื่อจับคู่ ไทย ↔ อังกฤษ';
    case QUESTION_TYPES.ARRANGE_SENTENCE:
      return 'เรียงคำให้เป็นประโยคที่มีความหมาย';
    case QUESTION_TYPES.FILL_BLANK_DIALOG:
      return 'เลือกคำให้ตรงบริบทในบทสนทนา';
    case QUESTION_TYPES.TIMELINE_ORDER:
      return 'เรียงลำดับกิจวัตรตามเวลา';
    default:
      return '';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียง';
    case QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่ภาษา';
    case QUESTION_TYPES.ARRANGE_SENTENCE: return 'เรียงคำ';
    case QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เติมคำ';
    case QUESTION_TYPES.TIMELINE_ORDER: return 'เรียงเวลา';
    default: return '';
  }
};

const IntermediateRoutinesGame = ({ navigation, route }) => {
  const {
    lessonId = LESSON_ID,
    category: routeCategory = CATEGORY,
    stageTitle = 'กิจวัตรประจำวัน (Daily Routines)',
    level: stageLevel = 'Intermediate',
    stageSelectRoute = 'LevelStage2',
  } = route.params || {};

  // Contexts
  const { applyDelta, user: progressUser } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();
  
  // State
  const [routineItems, setRoutineItems] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [diamondsEarned, setDiamondsEarned] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [answers, setAnswers] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState(null);
  const [dmSelected, setDmSelected] = useState({ leftId: null, rightId: null });
  const [dmPairs, setDmPairs] = useState([]);
  const [timelineSelected, setTimelineSelected] = useState([]);
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);
  
  // Refs
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);
  
  // Load routine items data
  useEffect(() => {
    const loadRoutineItems = async () => {
      try {
        const normalizedItems = (routineVocabFallback || [])
          .map(normalizeRoutineItem)
          .filter(i => i && i.thai);
        setRoutineItems(normalizedItems);
        
        // Generate questions using the generator
        const generatedQuestions = generateRoutineQuestions(normalizedItems);
        setQuestions(generatedQuestions);
        
        // Try to restore progress
        const savedProgress = await restoreProgress(LESSON_ID);
        if (savedProgress && savedProgress.questionsSnapshot) {
          setResumeData(savedProgress);
          setCurrentIndex(savedProgress.currentIndex || 0);
          setHearts(savedProgress.hearts || 5);
          setStreak(savedProgress.streak || 0);
          setMaxStreak(savedProgress.maxStreak || 0);
          setScore(savedProgress.score || 0);
          setXpEarned(savedProgress.xpEarned || 0);
          setDiamondsEarned(savedProgress.diamondsEarned || 0);
          setAccuracy(savedProgress.accuracy || 0);
          setAnswers(savedProgress.answers || {});
          answersRef.current = savedProgress.answers || {};
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading routine items:', error);
        setLoading(false);
      }
    };
    
    loadRoutineItems();
  }, []);

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

      try {
        if (typeof dailyStreakService.setUser === 'function') {
          dailyStreakService.setUser(userId);
        }
      } catch (error) {
        console.warn('Failed to bind user to dailyStreakService:', error?.message);
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
      accuracy,
      streak,
      maxStreak,
      answers: answersRef.current,
      gameProgress: {
        generator: 'routines',
        lessonId: LESSON_ID,
        timestamp: Date.now(),
      },
    };
    
    try {
      await saveProgress(LESSON_ID, snapshot);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, accuracy, streak, maxStreak]);
  
  // Save progress when state changes
  useEffect(() => {
    if (gameStarted && !gameFinished) {
      autosave();
    }
  }, [currentIndex, hearts, score, streak, accuracy, gameStarted, gameFinished, autosave]);
  
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
  
  // Check answer helper
  const checkAnswer = (question, userAnswer) => {
    switch (question.type) {
      case QUESTION_TYPES.LISTEN_CHOOSE:
      case QUESTION_TYPES.FILL_BLANK_DIALOG:
        return userAnswer === question.correctText;
      
      case QUESTION_TYPES.TRANSLATE_MATCH:
        return userAnswer && userAnswer.every(pair =>
          question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
          question.rightItems.find(right => right.id === pair.rightId)?.text
        );
      
      case QUESTION_TYPES.ARRANGE_SENTENCE:
      case QUESTION_TYPES.TIMELINE_ORDER:
        return Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
      
      default:
        return false;
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
      const newAccuracy = ((newScore) / (currentIndex + 1)) * 100;
      setScore(newScore);
      setXpEarned(newXp);
      setDiamondsEarned(newDiamonds);
      setAccuracy(Math.round(newAccuracy));
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
    setTimelineSelected([]);
    setChecked(false);
    setLastCorrect(null);
  }, [currentIndex]);

  // Next question
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(null);
    } else {
      // Game finished
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
        lessonId: LESSON_ID,
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
          lessonId: LESSON_ID,
          category: routeCategory,
          gameMode: 'intermediate_4_routines',
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
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level_intermediate_4', {
            accuracy: accuracyPercent,
            score: correctAnswers,
            attempts: 1,
          });
        } catch (unlockError) {
          console.warn('Failed to unlock next level:', unlockError?.message || unlockError);
        }
      }

      try {
        await clearProgress(LESSON_ID);
      } catch (clearError) {
        console.warn('Failed to clear progress snapshot:', clearError?.message || clearError);
      }

      navigation.replace('IntermediateResult', {
        lessonId: LESSON_ID,
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
        replayRoute: 'IntermediateRoutinesGame',
        replayParams: {
          lessonId: LESSON_ID,
          category: routeCategory,
          level: stageLevel,
          stageTitle,
        },
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
                    onPress={() => handleAnswerSelect(choice.text)}
                  >
                    <Text style={[styles.choiceText, { fontSize: 24 }]}>{choice.emoji}</Text>
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
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>
            
            {dmPairs.length > 0 && (
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
                      dmSelected.leftId === item.id && styles.dragItemSelected,
                      dmPairs.some(p => p.leftId === item.id) && styles.dragItemPaired,
                    ]}
                    onPress={() => {
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
                      dmSelected.rightId === item.id && styles.dragItemSelected,
                      dmPairs.some(p => p.rightId === item.id) && styles.dragItemPaired,
                    ]}
                    onPress={() => {
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
                    <MaterialIcons name="volume-up" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.ARRANGE_SENTENCE:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.arrangeContainer}>
                <Text style={styles.arrangeText}>
                  {currentAnswer ? currentAnswer.join(' → ') : 'เรียงคำให้ถูกต้อง'}
                </Text>
              </View>
              
              <View style={styles.choicesContainer}>
                {question.wordBank.map((part, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.choiceButton,
                      currentAnswer && currentAnswer.includes(part.text) && styles.choiceSelected,
                    ]}
                    onPress={() => {
                      if (!currentAnswer) {
                        setCurrentAnswer([part.text]);
                      } else if (!currentAnswer.includes(part.text)) {
                        setCurrentAnswer([...currentAnswer, part.text]);
                      } else {
                        setCurrentAnswer(currentAnswer.filter(p => p !== part.text));
                      }
                    }}
                  >
                    <Text style={styles.choiceText}>{part.text}</Text>
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
      
      case QUESTION_TYPES.TIMELINE_ORDER:
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>
            
            {timelineSelected.length > 0 && (
              <View style={styles.timelinePreview}>
                <Text style={styles.timelinePreviewLabel}>ลำดับของคุณ:</Text>
                <View style={styles.timelinePreviewRow}>
                  {timelineSelected.map((item, idx) => (
                    <View key={`tl-${idx}`} style={styles.timelineStep}>
                      <Text style={styles.timelineStepText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.timelineBank}>
              {question.stepsBank.map((step, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timelineButton,
                    timelineSelected.includes(step.text) && styles.timelineButtonSelected,
                  ]}
                  onPress={() => {
                    if (timelineSelected.includes(step.text)) {
                      const filtered = timelineSelected.filter(t => t !== step.text);
                      setTimelineSelected(filtered);
                      setCurrentAnswer(filtered);
                    } else {
                      const updated = [...timelineSelected, step.text];
                      setTimelineSelected(updated);
                      setCurrentAnswer(updated);
                    }
                  }}
                >
                  <Text style={styles.timelineButtonText}>{step.text}</Text>
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
            <Text style={styles.startTitle}>กิจวัตรประจำวัน</Text>
            <Text style={styles.startSubtitle}>เรียนรู้กิจกรรมในแต่ละช่วงเวลา</Text>
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
            style={styles.heartAnimation}
          />
          <Text style={styles.statText}>{hearts}</Text>
        </View>
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
          <LottieView
            source={require('../assets/animations/Streak-Fire1.json')}
            autoPlay
            loop
            style={styles.streakAnimation}
          />
          <Text style={styles.statText}>{streak}</Text>
        </View>
      </View>

      {/* Accuracy Display */}
      <View style={styles.accuracyContainer}>
        <Text style={styles.accuracyLabel}>แม่นยำ</Text>
        <Text style={styles.accuracyPercent}>{accuracy}%</Text>
      </View>
      
      {/* Question */}
      <ScrollView style={styles.questionScrollView}>
        {renderQuestionComponent()}
      </ScrollView>
      
      {/* Check Button */}
      <View style={styles.checkContainer}>
        <TouchableOpacity
          style={[
            styles.checkButton,
            currentAnswer === null && styles.checkButtonDisabled,
          ]}
          onPress={handleCheckAnswer}
          disabled={currentAnswer === null}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradient}
          >
            <Text style={styles.checkButtonText}>CHECK</Text>
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
  accuracyContainer: {
    backgroundColor: 'rgba(255, 128, 0, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE3CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accuracyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  accuracyPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  timelinePreview: {
    backgroundColor: COLORS.cream,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  timelinePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  timelinePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timelineStep: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timelineStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  timelineBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timelineButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.lightGray,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timelineButtonText: {
    fontSize: 13,
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

export default IntermediateRoutinesGame;
