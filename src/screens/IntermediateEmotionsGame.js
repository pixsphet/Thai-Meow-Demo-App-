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
// daily streak service not used here to match ConsonantStage1Game flow

// Contexts
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useUserData } from '../contexts/UserDataContext';

// Data & Utils
import emotionsVocab from '../data/emotions_vocab.json';
import { generateEmotionQuestions, EMOTION_QUESTION_TYPES } from '../utils/emotionQuestionGenerator';
// FireStreakAlert not used in-game to match ConsonantStage1Game

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
  const [currentFeedback, setCurrentFeedback] = useState(null);
  // Fire streak, explicit accuracy tracking, and checked-state are omitted to match ConsonantStage1Game

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

      // Daily streak integration is intentionally omitted in this screen.
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
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak]);

  // Trigger autosave when state changes
  useEffect(() => {
    if (gameStarted && !gameFinished) {
      autosave();
    }
  }, [currentIndex, hearts, score, streak, gameStarted, gameFinished, autosave]);

  // No fire streak alert in-game to match ConsonantStage1Game

  // Play TTS
  const playTTS = useCallback(async (text) => {
    try {
      await vaja9TtsService.playThai(text);
    } catch (error) {
      console.error('TTS Error:', error);
    }
  }, []);

  // Handle start game
  const startGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    gameFinishedRef.current = false;
    startTimeRef.current = Date.now();
  };

  const resumeGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    gameFinishedRef.current = false;
    startTimeRef.current = Date.now();
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
      setScore(newScore);
      setXpEarned(xpEarned + xpReward);
      setDiamondsEarned(diamondsEarned + diamondReward);
    } else {
      const heartPenalty = currentQuestion.penaltyHeart || 1;
      const newHearts = Math.max(0, hearts - heartPenalty);
      setHearts(newHearts);
      if (newHearts <= 0) {
        Alert.alert(
          'หัวใจหมดแล้ว',
          'ซื้อหัวใจเพิ่มเพื่อเล่นต่อ',
          [
            { text: 'ไปร้านหัวใจ', onPress: () => navigation.navigate('GemShop') },
            { text: 'ยกเลิก', style: 'cancel' },
          ]
        );
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
      setCurrentFeedback(null);
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

    // Navigate to unified LessonComplete screen
    navigation.replace('LessonComplete', {
      lessonId: LESSON_ID,
      stageTitle: 'อารมณ์และความรู้สึก',
      score,
      totalQuestions: questions.length,
      timeSpent: elapsedTime,
      accuracyPercent,
      accuracyRatio: score / Math.max(1, questions.length),
      xpGained: xpEarned,
      diamondsGained: Math.max(2, diamondsEarned),
      heartsRemaining: hearts,
      streak: maxStreak,
      maxStreak,
      isUnlocked: unlockedNext,
      nextStageUnlocked: unlockedNext,
      stageSelectRoute: 'LevelStage2',
      replayRoute: 'IntermediateEmotionsGame',
      replayParams: { lessonId: LESSON_ID },
      questionTypeCounts: countQuestionTypes(),
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

  // Render unified start screen (match ConsonantStage1Game)
  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <View style={styles.startCard}>
            <LottieView
              source={require('../assets/animations/stage_start.json')}
              autoPlay
              loop
              style={{ width: 120, height: 120, marginBottom: 6 }}
            />
            <Text style={styles.startTitle}>🎭 อารมณ์และความรู้สึก</Text>
            <Text style={styles.startSubtitle}>เรียนรู้คำศัพท์และบทสนทนาเกี่ยวกับอารมณ์</Text>
          </View>

          {resumeData && (
            <TouchableOpacity
              style={{ backgroundColor: COLORS.cream, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 20 }}
              onPress={() => {
                resumeGame();
                setCurrentIndex(resumeData.currentIndex || 0);
              }}
              activeOpacity={0.9}
            >
              <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: '600' }}>
                เล่นต่อจากข้อที่ {resumeData.currentIndex + 1}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={{ paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, width: 220 }} onPress={startGame} activeOpacity={0.9}>
            <LinearGradient colors={[COLORS.primary, '#FFA24D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.white }}>เริ่มเล่น</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render game screen
  const currentQuestion = questions[currentIndex];
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFF5E5', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      
      {/* Header with gradient like ConsonantStage1Game */}
      <LinearGradient colors={[COLORS.primary, '#FFA24D', '#FFD700']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome name="times" size={26} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.progressSection}>
            <Text style={[styles.progressText, { color: COLORS.white }]}>ข้อ {currentIndex + 1} / {questions.length}</Text>
            <View style={styles.progressBar}>
              <LinearGradient colors={['#58cc02', '#7FD14F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
            </View>
            <View style={styles.headerMetaRow}>
              <View style={styles.typePill}><Text style={styles.typePillText}>{getTypeLabel(currentQuestion.type)}</Text></View>
              <View style={styles.heartsDisplayContainer}>
                <FontAwesome name="heart" size={16} color="#ff4b4b" />
                <Text style={styles.heartsDisplay}>{hearts}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Row (XP, Diamonds, Accuracy) */}
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
      </View>

      {/* Accuracy pill removed (merged into stats row) */}

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuestion(currentQuestion, currentAnswer, handleAnswerSelect, setDmSelected, setDmPairs, dmSelected, dmPairs, playTTS)}
      </ScrollView>

      {/* Enhanced Check Button with feedback (match ConsonantStage1Game) */}
      <View style={styles.checkContainerEnhanced}>
        {currentFeedback && (
          <View style={[styles.feedbackBadgeEnhanced, currentFeedback === 'correct' ? styles.feedbackCorrectEnhanced : styles.feedbackWrongEnhanced]}>
            <FontAwesome name={currentFeedback === 'correct' ? 'check-circle' : 'times-circle'} size={24} color={currentFeedback === 'correct' ? '#58cc02' : '#ff4b4b'} style={{ marginRight: 8 }} />
            <Text style={styles.feedbackTextEnhanced}>{currentFeedback === 'correct' ? 'ถูกต้อง! ยอดเยี่ยม' : 'พยายามอีกครั้ง'}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.checkButtonEnhanced, currentAnswer === null && styles.checkButtonDisabledEnhanced]}
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
          <LinearGradient colors={currentAnswer === null ? ['#ddd', '#ccc'] : [COLORS.primary, '#FFA24D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.checkGradientEnhanced}>
            <FontAwesome name={currentFeedback !== null ? 'arrow-right' : 'check'} size={20} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={styles.checkButtonTextEnhanced}>{currentFeedback !== null ? 'ต่อไป' : 'CHECK'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
                        handleAnswerSelect(filtered);
                        return;
                      }
                      const next = { leftId: item.id, rightId: dmSelected.rightId };
                      if (next.rightId) {
                        const filtered = dmPairs.filter((p) => p.rightId !== next.rightId && p.leftId !== next.leftId);
                        const updated = [...filtered, next];
                        setDmPairs(updated);
                        handleAnswerSelect(updated);
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
                        handleAnswerSelect(filtered);
                        return;
                      }
                      const next = { leftId: dmSelected.leftId, rightId: item.id };
                      if (next.leftId) {
                        const filtered = dmPairs.filter((p) => p.rightId !== next.rightId && p.leftId !== next.leftId);
                        const updated = [...filtered, next];
                        setDmPairs(updated);
                        handleAnswerSelect(updated);
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
    backgroundColor: 'transparent',
  },
  headerGradient: {
    paddingTop: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  backButton: { marginRight: 15 },
  progressSection: { flex: 1, marginHorizontal: 12 },
  progressText: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#E8DCC8', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  headerMetaRow: { width: '100%', marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  typePillText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  heartsDisplayContainer: { flexDirection: 'row', alignItems: 'center' },
  heartsDisplay: { fontSize: 16, fontWeight: '600', color: COLORS.white, marginLeft: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'rgba(255,245,229,0.9)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FFE3CC' },
  statBadgeEnhanced: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: '#F2F2F2', minWidth: 85 },
  statTextContainer: { marginLeft: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.dark },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  statDivider: { width: 0.8, height: '100%', backgroundColor: '#E8DCC8', marginHorizontal: 6 },
  heartAnimation: { width: 20, height: 20 },
  starAnimation: { width: 20, height: 20 },
  diamondAnimation: { width: 20, height: 20 },
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
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  questionContainer: {
    marginBottom: 20,
  },
  questionCard: { backgroundColor: COLORS.white, padding: 18, borderRadius: 20, borderWidth: 2, borderColor: '#FFE8CC' },
  instruction: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 12,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
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
  checkContainerEnhanced: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#E8DCC8' },
  checkButtonEnhanced: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 28, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  checkGradientEnhanced: { width: '100%', paddingVertical: 18, borderRadius: 28, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  checkButtonDisabledEnhanced: { backgroundColor: '#CCC' },
  checkButtonTextEnhanced: { fontSize: 18, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
  feedbackBadgeEnhanced: { position: 'absolute', top: -35, left: '50%', transform: [{ translateX: -50 }], backgroundColor: COLORS.white, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, borderWidth: 3, borderColor: '#E8DCC8', flexDirection: 'row', alignItems: 'center' },
  feedbackCorrectEnhanced: { borderColor: COLORS.success, backgroundColor: 'rgba(88,204,2,0.12)' },
  feedbackWrongEnhanced: { borderColor: COLORS.error, backgroundColor: 'rgba(255,75,75,0.12)' },
  feedbackTextEnhanced: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
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
