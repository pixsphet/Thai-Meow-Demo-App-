import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  Platform,
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

// Data & Utils
import emotionsVocab from '../data/emotions_vocab.json';
import { generateEmotionQuestions, EMOTION_QUESTION_TYPES } from '../utils/emotionQuestionGenerator';
import FireStreakAlert from '../components/FireStreakAlert';

const { width, height } = Dimensions.get('window');
const LESSON_ID = 'intermediate_2_emotions';
const LESSON_KEY = 'intermediate_2_emotions';

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

// Hint text function
const getHintText = (type) => {
  switch (type) {
    case EMOTION_QUESTION_TYPES.LISTEN_CHOOSE:
      return 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกคำที่ได้ยิน';
    case EMOTION_QUESTION_TYPES.PICTURE_MATCH:
      return 'ดูรูป/อีโมจิ แล้วเลือกคำไทยที่ตรง';
    case EMOTION_QUESTION_TYPES.TRANSLATE_MATCH:
      return 'แตะเพื่อจับคู่ ไทย ↔ อังกฤษ';
    case EMOTION_QUESTION_TYPES.FILL_BLANK_DIALOG:
      return 'เลือกคำที่ตรงกับบทสนทนา';
    case EMOTION_QUESTION_TYPES.EMOJI_MATCH:
      return 'ดูอีโมจิและเลือกคำไทยที่ตรง';
    case EMOTION_QUESTION_TYPES.TONE_PICK:
      return 'เลือกระดับความเข้มข้นของอารมณ์';
    default:
      return '';
  }
};

// Question type label
const getTypeLabel = (type) => {
  const labels = {
    [EMOTION_QUESTION_TYPES.LISTEN_CHOOSE]: 'ฟังและเลือก',
    [EMOTION_QUESTION_TYPES.PICTURE_MATCH]: 'จับคู่รูป',
    [EMOTION_QUESTION_TYPES.TRANSLATE_MATCH]: 'จับคู่เรียน',
    [EMOTION_QUESTION_TYPES.FILL_BLANK_DIALOG]: 'เติมคำบทสนทนา',
    [EMOTION_QUESTION_TYPES.EMOJI_MATCH]: 'จับคู่อีโมจิ',
    [EMOTION_QUESTION_TYPES.TONE_PICK]: 'เลือกระดับ',
  };
  return labels[type] || 'คำถาม';
};

// Answer checker function
const checkAnswer = (question, answer) => {
  switch (question.type) {
    case EMOTION_QUESTION_TYPES.LISTEN_CHOOSE:
    case EMOTION_QUESTION_TYPES.PICTURE_MATCH:
    case EMOTION_QUESTION_TYPES.EMOJI_MATCH:
    case EMOTION_QUESTION_TYPES.FILL_BLANK_DIALOG:
    case EMOTION_QUESTION_TYPES.TONE_PICK:
      return answer === question.correctText;
      
    case EMOTION_QUESTION_TYPES.TRANSLATE_MATCH:
      // Check if all pairs are correct
      if (!Array.isArray(answer)) return false;
      return answer.every((pair) => {
        const leftItem = question.leftItems.find((l) => l.id === pair.leftId);
        return leftItem && leftItem.correctMatch === question.rightItems.find((r) => r.id === pair.rightId)?.text;
      }) && answer.length === question.leftItems.length;
      
    default:
      return false;
  }
};

export default function IntermediateEmotionsGame({ navigation, route }) {
  // State
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
  const [showFireStreakAlert, setShowFireStreakAlert] = useState(false);
  const [accuracy, setAccuracy] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  // Contexts
  const { progressUser } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();

  // Refs
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const progressRef = useRef(null);
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);

  // Load questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const generatedQuestions = generateEmotionQuestions(emotionsVocab);
        if (generatedQuestions.length === 0) {
          console.warn('No questions generated');
          Alert.alert('ข้อผิดพลาด', 'ไม่สามารถสร้างคำถามได้');
          setLoading(false);
          return;
        }
        setQuestions(generatedQuestions);

        // Try to restore progress
        const savedProgress = await restoreProgress(LESSON_ID);
        if (savedProgress?.questionsSnapshot) {
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
          setAccuracy(savedProgress.accuracy || 0);
          setTotalAnswered(savedProgress.totalAnswered || 0);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading emotions game:', error);
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  // Initialize services
  useEffect(() => {
    const userId =
      progressUser?.id ||
      userData?.id ||
      stats?.userId ||
      stats?._id ||
      stats?.id;

    if (!userId || serviceInitRef.current) return;

    serviceInitRef.current = true;

    (async () => {
      try {
        await gameProgressService.initialize(userId);
        await levelUnlockService.initialize(userId);
        await userStatsService.initialize(userId);
        if (typeof dailyStreakService.setUser === 'function') {
          dailyStreakService.setUser(userId);
        }
      } catch (error) {
        console.warn('Service initialization error:', error?.message || error);
      }
    })();
  }, [progressUser?.id, userData?.id, stats?.userId, stats?._id, stats?.id]);

  // Autosave progress
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
      accuracy,
      totalAnswered,
      gameProgress: {
        generator: 'emotions',
        lessonId: LESSON_ID,
        timestamp: Date.now(),
      },
    };

    try {
      await saveProgress(LESSON_ID, snapshot);
    } catch (error) {
      console.error('Error autosaving:', error);
    }
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, accuracy, totalAnswered]);

  // Trigger autosave when state changes
  useEffect(() => {
    if (gameStarted && !gameFinished) {
      autosave();
    }
  }, [currentIndex, hearts, score, streak, gameStarted, gameFinished, autosave]);

  // Streak check for fire alert
  useEffect(() => {
    if (gameFinished && [5, 10, 20, 30, 50, 100].includes(maxStreak)) {
      setTimeout(() => {
        setShowFireStreakAlert(true);
      }, 1500);
    }
  }, [gameFinished, maxStreak]);

  // Play TTS
  const playTTS = useCallback(async (text) => {
    try {
      await vaja9TtsService.playThai(text);
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }, []);

  // Handle start game
  const handleStartGame = async () => {
    setGameStarted(true);
    startTimeRef.current = Date.now();

    // Mark that the user played this lesson today for streak
    try {
      const userId = progressUser?.id || userData?.id || stats?.userId || stats?.id;
      if (userId && typeof dailyStreakService.markPlayed === 'function') {
        await dailyStreakService.markPlayed(LESSON_ID, userId);
      }
    } catch (error) {
      console.warn('Failed to mark lesson as played:', error?.message || error);
    }
  };

  // Handle answer select
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

    // Save answer
    answersRef.current[currentIndex] = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      isCorrect,
      timestamp: Date.now(),
    };
    setAnswers({ ...answersRef.current });

    // Update accuracy
    const newTotal = totalAnswered + 1;
    const newCorrect = score + (isCorrect ? 1 : 0);
    const newAccuracy = Math.round((newCorrect / newTotal) * 100);
    setTotalAnswered(newTotal);

    if (isCorrect) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      const newMaxStreak = Math.max(maxStreak, newStreak);
      const newXp = xpEarned + 10;
      const newDiamonds = diamondsEarned + 1;

      setScore(newScore);
      setStreak(newStreak);
      setMaxStreak(newMaxStreak);
      setXpEarned(newXp);
      setDiamondsEarned(newDiamonds);
      setAccuracy(newAccuracy);

      nextQuestion();
    } else {
      const newHearts = Math.max(0, hearts - 1);
      setHearts(newHearts);
      setStreak(0);
      setAccuracy(newAccuracy);

      if (newHearts === 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        finishLesson(elapsed);
      } else {
        nextQuestion();
      }
    }
  };

  // Next question
  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      finishLesson(elapsed);
    } else {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(null);
      setDmSelected({ leftId: null, rightId: null });
      setDmPairs([]);
    }
  };

  // Finish lesson
  const finishLesson = async (elapsedTime) => {
    gameFinishedRef.current = true;
    setGameFinished(true);

    const accuracyPercent = Math.round((score / questions.length) * 100);
    const unlockedNext = accuracyPercent >= 70;

    const resultData = {
      lessonKey: LESSON_KEY,
      score,
      maxScore: questions.length * 10,
      accuracy: score / questions.length,
      accuracyPercent,
      timeSpentSec: elapsedTime,
      xpEarned,
      diamondsEarned: Math.max(2, diamondsEarned),
      heartsRemaining: hearts,
      streakDayCount: maxStreak,
      questionTypes: countQuestionTypes(),
      completedAt: new Date().toISOString(),
      unlockedNext,
    };

    try {
      const userId = progressUser?.id || userData?.id || stats?.userId || stats?.id;
      
      if (userId) {
        // Save to database
        await gameProgressService.saveGameResult(LESSON_ID, resultData);
        
        // Update user stats
        await userStatsService.addXP(xpEarned);
        await userStatsService.addDiamonds(Math.max(2, diamondsEarned));

        // Try to unlock next level if accuracy >= 70%
        if (unlockedNext) {
          await levelUnlockService.checkAndUnlockNextLevel('intermediate_2', {
            score,
            accuracy: accuracyPercent,
          });
        }
      }

      // Clear local progress
      await clearProgress(LESSON_ID);
    } catch (error) {
      console.error('Error saving game result:', error);
    }

    // Navigate to result screen
    navigation.replace('IntermediateResult', {
      resultData,
      questions,
      answers: answersRef.current,
    });
  };

  // Count question types
  const countQuestionTypes = () => {
    const counts = {};
    questions.forEach((q) => {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    return counts;
  };

  // Render loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render resume dialog
  if (!gameStarted && resumeData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <LinearGradient colors={[COLORS.primary, COLORS.cream]} style={styles.resumeCard}>
            <Text style={styles.resumeTitle}>ต้องการกลับมาต่อเกมเก่า?</Text>
            <Text style={styles.resumeSubtitle}>ความคืบหน้า: ข้อ {resumeData.currentIndex + 1} / {questions.length}</Text>
            
            <View style={styles.resumeButtonGroup}>
              <TouchableOpacity
                style={[styles.resumeButton, styles.resumeButtonContinue]}
                onPress={() => {
                  setGameStarted(true);
                  setCurrentIndex(resumeData.currentIndex);
                }}
              >
                <Text style={styles.resumeButtonText}>ต่อเกมเก่า</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.resumeButton, styles.resumeButtonNew]}
                onPress={() => {
                  setResumeData(null);
                  handleStartGame();
                }}
              >
                <Text style={[styles.resumeButtonText, { color: COLORS.primary }]}>เล่นใหม่</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  // Render start screen
  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <LinearGradient colors={[COLORS.primary, COLORS.cream]} style={styles.startCard}>
            <Text style={styles.startTitle}>🎭 อารมณ์และความรู้สึก</Text>
            <Text style={styles.startSubtitle}>Intermediate - Lesson 2</Text>
            <Text style={styles.startDescription}>
              เรียนรู้วิธีบอกอารมณ์และความรู้สึกเป็นภาษาไทย{'\n'}
              พร้อมปลอบ แสดงความยินดี และให้กำลังใจ
            </Text>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartGame}
            >
              <Text style={styles.startButtonText}>เริ่มเล่น →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  // Render game screen
  const currentQuestion = questions[currentIndex];
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fff9f0', '#fff']} style={StyleSheet.absoluteFill} />
      
      {/* Header / HUD */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            ข้อ {currentIndex + 1} / {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      {/* HUD Badges */}
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

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuestion(currentQuestion, currentAnswer, handleAnswerSelect, setDmSelected, setDmPairs, dmSelected, dmPairs, playTTS)}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.checkButton,
            currentAnswer === null && styles.checkButtonDisabled,
          ]}
          onPress={handleCheckAnswer}
          disabled={currentAnswer === null}
        >
          <Text style={styles.checkButtonText}>✓ ตรวจสอบ</Text>
        </TouchableOpacity>
      </View>

      {/* Fire Streak Alert */}
      <FireStreakAlert
        visible={showFireStreakAlert}
        streak={maxStreak}
        onClose={() => setShowFireStreakAlert(false)}
      />
    </SafeAreaView>
  );
}

// Render question based on type
function renderQuestion(question, currentAnswer, handleAnswerSelect, setDmSelected, setDmPairs, dmSelected, dmPairs, playTTS) {
  if (!question) return null;

  const { type } = question;

  switch (type) {
    case EMOTION_QUESTION_TYPES.LISTEN_CHOOSE:
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(type)}</Text>

            <TouchableOpacity style={styles.speakerButton} onPress={() => playTTS(question.audioText)}>
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
                  <Text style={styles.choiceText} numberOfLines={1} adjustsFontSizeToFit>
                    {choice.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );

    case EMOTION_QUESTION_TYPES.PICTURE_MATCH:
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(type)}</Text>

            <View style={styles.imageContainer}>
              <Text style={styles.emojiImage}>{question.emoji || '🙂'}</Text>
            </View>

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
                  <Text style={styles.choiceText} numberOfLines={1} adjustsFontSizeToFit>
                    {choice.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );

    case EMOTION_QUESTION_TYPES.TRANSLATE_MATCH:
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(type)}</Text>

            <View style={styles.dragMatchContainer}>
              <View style={styles.leftColumn}>
                {question.leftItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dragItem,
                      dmSelected.leftId === item.id && styles.dragItemSelected,
                      dmPairs.some((p) => p.leftId === item.id) && styles.dragItemPaired,
                    ]}
                    onPress={() => {
                      if (dmPairs.some((p) => p.leftId === item.id)) {
                        const filtered = dmPairs.filter((p) => p.leftId !== item.id);
                        setDmPairs(filtered);
                        setCurrentAnswer(filtered);
                        return;
                      }
                      const next = { leftId: item.id, rightId: dmSelected.rightId };
                      if (next.rightId) {
                        const filtered = dmPairs.filter((p) => p.rightId !== next.rightId && p.leftId !== next.leftId);
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
                      dmSelected.rightId === item.id && styles.dragItemSelected,
                      dmPairs.some((p) => p.rightId === item.id) && styles.dragItemPaired,
                    ]}
                    onPress={() => {
                      if (dmPairs.some((p) => p.rightId === item.id)) {
                        const filtered = dmPairs.filter((p) => p.rightId !== item.id);
                        setDmPairs(filtered);
                        setCurrentAnswer(filtered);
                        return;
                      }
                      const next = { leftId: dmSelected.leftId, rightId: item.id };
                      if (next.leftId) {
                        const filtered = dmPairs.filter((p) => p.rightId !== next.rightId && p.leftId !== next.leftId);
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
        </View>
      );

    case EMOTION_QUESTION_TYPES.FILL_BLANK_DIALOG:
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(type)}</Text>

            <Text style={styles.dialogQuestion}>{question.questionText}</Text>

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
                  <Text style={styles.choiceText} numberOfLines={2} adjustsFontSizeToFit>
                    {choice.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );

    case EMOTION_QUESTION_TYPES.EMOJI_MATCH:
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(type)}</Text>

            <View style={styles.imageContainer}>
              <Text style={styles.emojiImage}>{question.emoji}</Text>
            </View>

            <Text style={styles.dialogQuestion}>{question.questionText}</Text>

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
                  <Text style={styles.choiceText} numberOfLines={1} adjustsFontSizeToFit>
                    {choice.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );

    case EMOTION_QUESTION_TYPES.TONE_PICK:
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(type)}</Text>

            <Text style={styles.dialogQuestion}>{question.questionText}</Text>

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
                  <Text style={styles.choiceText} numberOfLines={1} adjustsFontSizeToFit>
                    {choice.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );

    default:
      return null;
  }
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF9F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressSection: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.dark,
    marginBottom: 6,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8DCC8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  settingsButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF9F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  statBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  heartAnimation: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  starAnimation: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  diamondAnimation: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  streakAnimation: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  accuracyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF9F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCC8',
  },
  accuracyLabel: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '600',
  },
  accuracyPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DCC8',
  },
  instruction: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  speakerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  emojiImage: {
    fontSize: 80,
  },
  dialogQuestion: {
    fontSize: 15,
    color: COLORS.dark,
    marginBottom: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  choicesContainer: {
    gap: 10,
  },
  choiceButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
  },
  choiceSelected: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.primary,
  },
  choiceText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  dragMatchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  leftColumn: {
    flex: 1,
    gap: 10,
  },
  rightColumn: {
    flex: 1,
    gap: 10,
  },
  dragItem: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
  },
  dragItemSelected: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.primary,
  },
  dragItemPaired: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
    opacity: 0.7,
  },
  dragItemText: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8DCC8',
    backgroundColor: '#FFF9F0',
  },
  checkButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#CCC',
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  startCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  startTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  startSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  startDescription: {
    fontSize: 14,
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  startButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  resumeCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  resumeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  resumeSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  resumeButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  resumeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButtonContinue: {
    backgroundColor: COLORS.primary,
  },
  resumeButtonNew: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  resumeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
});
