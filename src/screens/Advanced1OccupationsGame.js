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
  Image,
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
import dailyStreakService from '../services/dailyStreakService';

// Contexts
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useUserData } from '../contexts/UserDataContext';

// Data
import occupationsAdvancedVocab from '../data/occupations_advanced_vocab.json';
import occupationsImages from '../assets/images/occupationsImages';
import { generateOccupationsLessonFlow, OCCUPATIONS_ADVANCED_QUESTION_TYPES, checkOccupationsAnswer } from '../utils/occupationsAdvancedQuestionGenerator';

const { width, height } = Dimensions.get('window');
const LESSON_ID = 'advanced1';
const CATEGORY = 'occupations_advanced';

// Question Types
const QUESTION_TYPES = OCCUPATIONS_ADVANCED_QUESTION_TYPES;

const SENTENCE_ORDER_TYPES = new Set([
  'ARRANGE_SENTENCE',
  'ORDER_TILES',
  'ARRANGE_IDIOM',
  'ORDER_FLOW',
]);

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

// Normalize occupation data
const normalizeOccupationItem = (doc) => ({
  id: doc.id || `occ_${uid()}`,
  thai: doc.thai || '',
  roman: doc.roman || '',
  en: doc.en || '',
  meaningTH: doc.meaningTH || '',
  meaningEN: doc.meaningEN || '',
  exampleTH: doc.exampleTH || '',
  exampleEN: doc.exampleEN || '',
  audioText: doc.audioText || doc.thai || '',
  imagePath: doc.imagePath || '',
  tips: doc.tips || '',
});

// UI helper for hint texts per question type
const getHintText = (type) => {
  switch (type) {
    case QUESTION_TYPES.LEARN_IDIOM:
      return 'Read the meaning and examples, then tap NEXT';
    case QUESTION_TYPES.LISTEN_MEANING:
      return 'Tap the speaker button to listen again, then select the correct word';
    case QUESTION_TYPES.PICTURE_MATCH:
      return 'Look at the occupation image and select the matching name';
    case QUESTION_TYPES.FILL_CONTEXT:
      return 'Select the word that fits the context';
    case QUESTION_TYPES.MATCH_IDIOM_MEANING:
      return 'Tap to match Thai words ↔ English meanings';
    default:
      return '';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case QUESTION_TYPES.LEARN_IDIOM: return 'Knowledge Card';
    case QUESTION_TYPES.LISTEN_MEANING: return 'Listen & Choose';
    case QUESTION_TYPES.PICTURE_MATCH: return 'Picture Match';
    case QUESTION_TYPES.FILL_CONTEXT: return 'Fill Context';
    case QUESTION_TYPES.MATCH_IDIOM_MEANING: return 'Match Meaning';
    default: return '';
  }
};

const Advanced1OccupationsGame = ({ navigation, route }) => {
  const {
    lessonId = LESSON_ID,
    category: routeCategory = CATEGORY,
    stageTitle = 'อาชีพ (Occupations)',
    level: stageLevel = 'Advanced',
    stageSelectRoute = 'LevelStage3',
  } = route.params || {};

  // Contexts
  const { applyDelta, user: progressUser } = useProgress();
  const { stats, hearts: unifiedHearts, updateStats } = useUnifiedStats();
  const { userData } = useUserData();
  
  // State
  const [occupations, setOccupations] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [hearts, setHearts] = useState(unifiedHearts || 5);
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

  useEffect(() => {
    if (!questions || questions.length === 0) {
      return;
    }
    const filtered = questions.filter((q) => q && !SENTENCE_ORDER_TYPES.has(q.type));
    if (filtered.length !== questions.length) {
      setQuestions(filtered);
    }
  }, [questions]);
  
  // Sync hearts with unified stats
  useEffect(() => {
    if (unifiedHearts !== undefined && unifiedHearts !== hearts) {
      setHearts(unifiedHearts);
    }
  }, [unifiedHearts]);
  
  // Update unified stats when hearts change
  useEffect(() => {
    if (hearts !== undefined && updateStats) {
      updateStats({ hearts });
    }
  }, [hearts]);
  
  // Load occupations data
  useEffect(() => {
    const loadOccupations = async () => {
      try {
        // Use the new vocabulary data
        const normalizedOccupations = occupationsAdvancedVocab.map(normalizeOccupationItem);
        setOccupations(normalizedOccupations);
        
        // Generate questions using the new lesson flow
        const generatedQuestions = generateOccupationsLessonFlow(normalizedOccupations, 6);
        const filteredQuestions = generatedQuestions.filter(q => q && !SENTENCE_ORDER_TYPES.has(q.type));
        setQuestions(filteredQuestions);
        
        // Try to restore progress
        const savedProgress = await restoreProgress(lessonId);
        if (savedProgress && savedProgress.questionsSnapshot) {
          // Validate that the restored snapshot actually belongs to the Occupations mode
          const validTypes = new Set([
            QUESTION_TYPES.LEARN_IDIOM,
            QUESTION_TYPES.LISTEN_MEANING,
            QUESTION_TYPES.PICTURE_MATCH,
            QUESTION_TYPES.FILL_CONTEXT,
            QUESTION_TYPES.MATCH_IDIOM_MEANING,
          ]);
          const snapshotLooksLikeOccupations = (savedProgress.questionsSnapshot || []).every(
            (q) => q && validTypes.has(q.type)
          );

          if (!snapshotLooksLikeOccupations) {
            // Ignore stale/incorrect snapshot from another game (e.g., consonant game)
            console.warn('[Advanced1] Ignoring non-occupations snapshot');
          } else {
          const sanitizedSnapshot = (savedProgress.questionsSnapshot || []).filter(
            (q) => q && !SENTENCE_ORDER_TYPES.has(q.type)
          );

          setResumeData({ ...savedProgress, questionsSnapshot: sanitizedSnapshot });
          setCurrentIndex(Math.min(savedProgress.currentIndex || 0, Math.max(sanitizedSnapshot.length - 1, 0)));
          setHearts(savedProgress.hearts || 5);
          setStreak(savedProgress.streak || 0);
          setMaxStreak(savedProgress.maxStreak || 0);
          setScore(savedProgress.score || 0);
          setXpEarned(savedProgress.xpEarned || 0);
          setDiamondsEarned(savedProgress.diamondsEarned || 0);
          setAnswers(savedProgress.answers || {});
          answersRef.current = savedProgress.answers || {};
          setCurrentFeedback(savedProgress.currentFeedback || null);

          if (sanitizedSnapshot.length > 0) {
            setQuestions(sanitizedSnapshot);
          }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading occupations:', error);
        setLoading(false);
      }
    };
    
    loadOccupations();
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
        generator: 'occupations',
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
    const isCorrect = checkOccupationsAnswer(currentQuestion, answerToCheck);
    
    console.debug(`[Answer Check] Q${currentIndex + 1}: ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}`, {
      type: currentQuestion?.type,
      answer: answerToCheck,
      correct: isCorrect,
      score: score + (isCorrect ? 1 : 0),
      // Show rewards for this answer
      xpReward: isCorrect ? (currentQuestion?.rewardXP || 15) : 0,
      diamondReward: isCorrect ? (currentQuestion?.rewardDiamond || 1) : 0,
      heartPenalty: !isCorrect ? (currentQuestion?.penaltyHeart || 1) : 0,
    });
    
    // Save answer with reward details
    answersRef.current[currentIndex] = {
      questionId: currentQuestion?.id,
      answer: answerToCheck,
      isCorrect,
      timestamp: Date.now(),
      // Include reward information
      rewardXP: isCorrect ? (currentQuestion?.rewardXP || 15) : 0,
      rewardDiamond: isCorrect ? (currentQuestion?.rewardDiamond || 1) : 0,
      penaltyHeart: !isCorrect ? (currentQuestion?.penaltyHeart || 1) : 0,
    };
    setAnswers({ ...answersRef.current });
    
    // Show feedback
    setCurrentFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      // Correct answer
      const newScore = score + 1;
      // Daily streak is handled globally; do not increment per-question streak here
      // Use question's reward data, default to 15 XP and 1 diamond if not specified
      const xpReward = currentQuestion?.rewardXP || 15;
      const diamondReward = currentQuestion?.rewardDiamond || 1;
      const newXp = xpEarned + xpReward;
      const newDiamonds = diamondsEarned + diamondReward;

      setScore(newScore);
      setXpEarned(newXp);
      setDiamondsEarned(newDiamonds);
      
      // Show feedback - don't auto-advance, user must click NEXT to continue
    } else {
      // Wrong answer
      const heartPenalty = currentQuestion?.penaltyHeart || 1;
      const newHearts = Math.max(0, hearts - heartPenalty);
      setHearts(newHearts);

      // If hearts are depleted, prompt to buy more
      if (newHearts <= 0) {
        Alert.alert(
          'Out of Hearts',
          'Buy more hearts to continue playing',
          [
            { text: 'Go to Shop', onPress: () => navigation.navigate('GemShop') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
      // Show feedback - don't auto-advance, user must click NEXT to continue
    }
  };
  
  // Reset state when index changes
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
  };
  
  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    gameFinishedRef.current = false;
    startTimeRef.current = Date.now();
    dailyStreakService.startStreak();
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
          gameMode: 'occupations_advanced',
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
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level2_advanced', {
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
    if (questions.length === 0 || currentIndex >= questions.length) {
      console.warn('[Advanced1OccupationsGame] No questions or invalid index', {
        questionsLength: questions.length,
        currentIndex,
      });
      return null;
    }
    
    const question = questions[currentIndex];
    
    if (!question) {
      console.error('[Advanced1OccupationsGame] Question is null/undefined', {
        currentIndex,
        questionsLength: questions.length,
      });
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>ข้อผิดพลาด: ไม่พบคำถาม</Text>
            <Text style={styles.hintText}>กรุณาลองใหม่อีกครั้ง</Text>
          </View>
        </View>
      );
    }
    
    if (!question.type) {
      console.warn('[Advanced1OccupationsGame] Question missing type', {
        questionId: question.id,
        question: question,
      });
    }
    
    const computeInstruction = (qType) => {
      switch (qType) {
        case QUESTION_TYPES.PICTURE_MATCH:
          return 'Look at the occupation image and select the matching name';
        case QUESTION_TYPES.LISTEN_MEANING:
          return 'Tap the speaker button to listen, then select the correct word';
        case QUESTION_TYPES.FILL_CONTEXT:
          return 'Choose the word that fits the context';
        case QUESTION_TYPES.MATCH_IDIOM_MEANING:
          return 'Tap to match Thai words ↔ English meanings';
        case QUESTION_TYPES.LEARN_IDIOM:
        default:
          return question.instruction || '';
      }
    };

    switch (question.type) {
      case QUESTION_TYPES.LEARN_IDIOM:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{computeInstruction(question.type)}</Text>
              
              {/* Show image if available */}
              {question.imageKey && (
                <View style={styles.imageContainer}>
                  {occupationsImages[question.imageKey] ? (
                    <Image
                      source={occupationsImages[question.imageKey]}
                      style={styles.occupationImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.imageFallback}>
                      <Text style={styles.occupationChar}>{question.imageKey}</Text>
                    </View>
                  )}
                </View>
              )}
              
              <Text style={[styles.questionText, {fontSize: 22, fontWeight: '800', color: COLORS.dark, marginTop: question.imageKey ? 0 : 10}]}>
                {question.thai}
              </Text>
              {!!question.meaningEN && (
                <Text style={[styles.hintText, { marginTop: 2 }]}>{question.meaningEN}</Text>
              )}
              {!!question.roman && (
                <Text style={[styles.hintText, { marginTop: 2, fontStyle: 'italic' }]}>{question.roman}</Text>
              )}
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
      
      case QUESTION_TYPES.PICTURE_MATCH:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{computeInstruction(question.type)}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.imageContainer}>
                {occupationsImages[question.imageKey] ? (
                  <Image
                    source={occupationsImages[question.imageKey]}
                    style={styles.occupationImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.occupationChar}>{question.imageKey}</Text>
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
                    <Text style={styles.choiceThai}>{choice.text}</Text>
                    {!!choice.roman && (
                      <Text style={styles.choiceRoman}>{choice.roman}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.LISTEN_MEANING:
      case QUESTION_TYPES.FILL_CONTEXT:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{computeInstruction(question.type)}</Text>
              {question.instructionEN && (
                <Text style={[styles.instruction, { fontSize: 14, color: COLORS.gray, marginTop: -8 }]}>
                  {question.instructionEN}
                </Text>
              )}
              {question.questionText && <Text style={styles.questionText}>{question.questionText}</Text>}
              {question.questionTextEN && (
                <Text style={[styles.questionText, { fontSize: 14, color: COLORS.gray, marginTop: -8 }]}>
                  {question.questionTextEN}
                </Text>
              )}
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
                {(question.choices || []).map((choice) => (
                  <TouchableOpacity
                    key={choice.id}
                    style={[
                      styles.choiceButton,
                      currentAnswer === choice.text && styles.choiceSelected,
                    ]}
                    onPress={() => handleAnswerSelect(choice.text, choice.speakText)}
                  >
                    <Text style={styles.choiceThai}>{choice.text}</Text>
                    {!!choice.roman && (
                      <Text style={styles.choiceRoman}>{choice.roman}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                {(!question.choices || question.choices.length === 0) && (
                  <View style={styles.choiceButton}>
                    <Text style={styles.choiceText}>ไม่มีตัวเลือก</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      
      case QUESTION_TYPES.MATCH_IDIOM_MEANING:
        // Helper functions for matching game
        const isConnected = (leftId) => dmPairs.some(p => p.leftId === leftId);
        const getConnectionColor = (leftId) => {
          const connectionColors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
          const idx = (question.leftItems || []).findIndex(l => l.id === leftId);
          return connectionColors[idx % connectionColors.length] || '#e0e0e0';
        };
        const getConnectionSymbol = (leftId) => {
          const symbols = ['●', '▲', '■'];
          const idx = (question.leftItems || []).findIndex(l => l.id === leftId);
          return symbols[idx % symbols.length] || '';
        };
        const handleLeftPress = (item) => {
          if (currentFeedback) return;
          setDmSelected({ leftId: item.id, rightId: dmSelected.rightId });
        };
        const handleRightPress = (item) => {
          if (currentFeedback) return;
          if (dmSelected.leftId) {
            const newPairs = dmPairs.filter(p => p.rightId !== item.id && p.leftId !== dmSelected.leftId);
            const newPair = { leftId: dmSelected.leftId, rightId: item.id };
            const updated = [...newPairs, newPair];
            setDmPairs(updated);
            setCurrentAnswer(updated);
            setDmSelected({ leftId: null, rightId: null });
          } else {
            setDmSelected({ leftId: null, rightId: item.id });
          }
        };
        
        return (
          <View style={styles.questionContainer}>
            <Text style={styles.instruction}>{computeInstruction(question.type)}</Text>
            {!!question.questionText && <Text style={styles.questionText}>{question.questionText}</Text>}
            
            <View style={styles.dragMatchContainer}>
              {/* Left Column */}
              <View style={styles.leftColumn}>
                <Text style={styles.columnLabel}>
                  {question.instruction && question.instruction.includes('ภาษาอังกฤษกับคำไทย') ? '🇬🇧 English' : '🇹🇭 ไทย'}
                </Text>
                {question.leftItems?.map((item, index) => {
                  const connected = isConnected(item.id);
                  const color = connected ? getConnectionColor(item.id) : '#e0e0e0';
                  const symbol = connected ? getConnectionSymbol(item.id) : '';
                  const isSelected = dmSelected.leftId === item.id;
                  
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dragItem,
                        isSelected && styles.selectedDragItem,
                        currentFeedback && (
                          dmPairs.some(p => p.leftId === item.id && p.leftId !== item.id) 
                            ? styles.correctDragItem 
                            : styles.wrongDragItem
                        ),
                        { 
                          backgroundColor: connected ? color : (isSelected ? '#fff5e6' : '#fff'),
                          borderColor: connected ? color : (isSelected ? '#FF8000' : '#e0e0e0'),
                          borderWidth: isSelected ? 4 : 3
                        }
                      ]}
                      onPress={() => handleLeftPress(item)}
                      disabled={currentFeedback !== null}
                    >
                      <View style={styles.dragItemContent}>
                        {connected && (
                          <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => {
                              const filtered = dmPairs.filter(p => p.leftId !== item.id);
                              setDmPairs(filtered);
                              setCurrentAnswer(filtered);
                            }}
                          >
                            <FontAwesome name="times" size={12} color="#fff" />
                          </TouchableOpacity>
                        )}
                        <Text style={[
                          styles.dragItemText,
                          connected && { color: '#fff', fontWeight: 'bold' },
                          isSelected && { color: '#FF8000', fontWeight: 'bold' }
                        ]}>{item.text}</Text>
                        {connected && (
                          <View style={{
                            marginLeft: 8,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: color,
                          }} />
                        )}
                        {connected && (
                          <Text style={[styles.connectionSymbol, { color: '#fff' }]}>
                            {symbol}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Right Column */}
              <View style={styles.rightColumn}>
                <Text style={styles.columnLabel}>
                  {question.instruction && question.instruction.includes('ภาษาอังกฤษกับคำไทย') ? '🇹🇭 ไทย' : '🇺🇸 English'}
                </Text>
                {question.rightItems?.map((item, index) => {
                  const connectedLeftId = dmPairs.find(p => p.rightId === item.id)?.leftId;
                  const isCorrectMatch = connectedLeftId && 
                    question.leftItems.find(l => l.id === connectedLeftId)?.correctMatch === item.text;
                  const isWrongMatch = connectedLeftId && !isCorrectMatch;
                  const color = connectedLeftId ? getConnectionColor(connectedLeftId) : '#e0e0e0';
                  const symbol = connectedLeftId ? getConnectionSymbol(connectedLeftId) : '';
                  const isSelected = dmSelected.rightId === item.id;
                  
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dragItem,
                        isSelected && styles.selectedDragItem,
                        currentFeedback && isCorrectMatch && styles.correctDragItem,
                        currentFeedback && isWrongMatch && styles.wrongDragItem,
                        { 
                          backgroundColor: connectedLeftId ? color : (isSelected ? '#fff5e6' : '#fff'),
                          borderColor: connectedLeftId ? color : (isSelected ? '#FF8000' : '#e0e0e0'),
                          borderWidth: isSelected ? 4 : 3
                        }
                      ]}
                      onPress={() => handleRightPress(item)}
                      disabled={currentFeedback !== null}
                    >
                      <View style={styles.dragItemContent}>
                        <Text style={[
                          styles.dragItemText,
                          connectedLeftId && { color: '#fff', fontWeight: 'bold' },
                          isSelected && { color: '#FF8000', fontWeight: 'bold' }
                        ]}>{item.text}</Text>
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
                          <Text style={[styles.connectionSymbol, { color: '#fff' }]}>
                            {symbol}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Connection Info */}
            {dmPairs.length > 0 && (
              <View style={styles.connectionInfo}>
                <Text style={styles.connectionText}>
                  เชื่อมต่อแล้ว {dmPairs.length}/{question.leftItems.length} คู่
                </Text>
              </View>
            )}
          </View>
        );
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
        // Safe fallback UI for any unexpected question type
        console.warn(`[Advanced1OccupationsGame] Unknown Question Type: Q${currentIndex + 1}/${questions.length}`, {
          type: question?.type || 'undefined',
          questionId: question?.id,
          hasInstruction: !!question?.instruction,
          hasQuestionText: !!question?.questionText,
          hasChoices: Array.isArray(question?.choices) && question.choices.length > 0,
          question: question,
        });
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              {!!question?.instruction && (
                <Text style={styles.instruction}>{computeInstruction(question.type)}</Text>
              )}
              {!!question?.questionText && (
                <Text style={styles.questionText}>{question.questionText}</Text>
              )}
              <Text style={styles.hintText}>
                {question?.type ? `Question type: ${question.type}` : 'This is a learning card. Read and understand, then tap NEXT'}
              </Text>
              {Array.isArray(question?.choices) && question.choices.length > 0 && (
                <View style={styles.choicesContainer}>
                  {question.choices.map((choice, idx) => (
                    <TouchableOpacity
                      key={choice.id || choice.text || idx}
                      style={[
                        styles.choiceButton,
                        currentAnswer === (choice.text || choice.thai) && styles.choiceSelected,
                      ]}
                      onPress={() => handleAnswerSelect(choice.text || choice.thai, choice.speakText || choice.text || choice.thai)}
                    >
                      <Text style={styles.choiceText}>
                        {choice.text || choice.thai || String(choice)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {(!question?.choices || question.choices.length === 0) && (
                <Text style={[styles.hintText, { marginTop: 20, color: COLORS.gray }]}>
                  This card has no choices. Tap NEXT to continue
                </Text>
              )}
            </View>
          </View>
        );
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LottieView source={require('../assets/animations/LoadingCat.json')} autoPlay loop style={{ width: 200, height: 200 }} />
          <Text style={styles.loadingText}>Loading...</Text>
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
            <Text style={styles.startTitle}>Occupations</Text>
            <Text style={styles.startSubtitle}>Advanced Lesson</Text>
          </View>
          
          {resumeData && (
            <TouchableOpacity style={styles.resumeButton} onPress={resumeGame} activeOpacity={0.9}>
              <Text style={styles.resumeButtonText}>Resume from question {resumeData.currentIndex + 1}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.startButton} onPress={startGame} activeOpacity={0.9}>
            <LinearGradient
              colors={[COLORS.primary, '#FFA24D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startGradient}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
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
  const progress = ((currentIndex + 1) / Math.max(1, questions.length)) * 100;
  const hasChoices = Array.isArray(currentQuestion?.choices) && currentQuestion.choices.length > 0;
  const isLearn = currentQuestion?.type === QUESTION_TYPES.LEARN_IDIOM || !hasChoices;
  
  return (
    <SafeAreaView style={styles.container}>
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
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.headerMetaRow}>
            <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
            <View style={styles.typePill}><Text style={styles.typePillText}>{getTypeLabel(currentQuestion?.type)}</Text></View>
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
              {currentFeedback === 'correct' ? 'Correct! Great job!' : 'Try again'}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.checkButtonEnhanced,
            (!isLearn && currentAnswer === null && currentFeedback === null) && styles.checkButtonDisabledEnhanced,
          ]}
          onPress={() => {
            if (currentFeedback !== null) {
              // After feedback shown, move to next question
              setCurrentFeedback(null);
              if (hearts === 0) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                finishLesson(elapsed);
              } else {
                nextQuestion();
              }
            } else if (isLearn) {
              // Skip to next question immediately for learn cards
              nextQuestion();
            } else {
              // Check answer - must have selected an answer
              if (currentAnswer !== null) {
                handleCheckAnswer();
              }
            }
          }}
          disabled={!isLearn && (currentAnswer === null && currentFeedback === null)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={(!isLearn && currentAnswer === null && currentFeedback === null) ? ['#ddd', '#ccc'] : [COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradientEnhanced}
          >
            <View style={styles.checkButtonContent}>
              <FontAwesome 
                name={currentFeedback !== null ? 'arrow-right' : 'check'} 
                size={20} 
                color={COLORS.white}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.checkButtonTextEnhanced}>
                {currentFeedback !== null ? (hearts === 0 ? 'End Game' : 'Next') : (isLearn ? 'NEXT' : 'CHECK')}
              </Text>
            </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
    marginBottom: 16,
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
  choiceThai: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center'
  },
  choiceRoman: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    textAlign: 'center'
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
  },
  checkButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  feedbackBadge: {
    position: 'absolute',
    top: -50,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feedbackCorrect: {
    backgroundColor: '#4CAF50',
  },
  feedbackWrong: {
    backgroundColor: '#F44336',
  },
  feedbackText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  heartsDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartsDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 5,
  },
  heartsIconAnimation: {
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
  columnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 10,
    textAlign: 'center',
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
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 16,
  },
  occupationImage: {
    width: 140,
    height: 140,
    borderRadius: 20,
    shadowColor: '#FF8000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  imageFallback: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  occupationChar: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
  },
});

export default Advanced1OccupationsGame;
