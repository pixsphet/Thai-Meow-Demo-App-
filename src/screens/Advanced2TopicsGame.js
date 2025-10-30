import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Image,
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
import advancedTopicsData from '../data/advanced_topics.json';
import advancedTopicsImages from '../assets/images/advancedTopicsImages';

// Utils
import { 
  ADVANCED_TOPICS_QUESTION_TYPES,
  generateAdvancedTopicsLessonFlow 
} from '../utils/advancedTopicsQuestionGenerator';
import { COLORS, shuffle, pick, uid, isThaiText, normalizeTopic } from '../utils/gameUtils';

const SENTENCE_ORDER_TYPES = new Set([
  ADVANCED_TOPICS_QUESTION_TYPES.ARRANGE_SENTENCE,
  'ORDER_TILES',
  'ARRANGE_IDIOM',
  'ORDER_FLOW',
]);

const { width, height } = Dimensions.get('window');

// UI helper for hint texts per question type
const getHintText = (type) => {
  switch (type) {
    case ADVANCED_TOPICS_QUESTION_TYPES.LEARN_TOPIC:
      return 'Read the topic info, then tap NEXT';
    case ADVANCED_TOPICS_QUESTION_TYPES.LISTEN_CHOOSE:
      return 'Tap the speaker button to listen again, then select the correct answer';
    case ADVANCED_TOPICS_QUESTION_TYPES.PICTURE_MATCH:
      return 'Look at the topic image and select the matching word';
    case ADVANCED_TOPICS_QUESTION_TYPES.TRANSLATE_MATCH:
      return 'Tap to match Thai ↔ English';
    case ADVANCED_TOPICS_QUESTION_TYPES.ARRANGE_SENTENCE:
      return 'Tap words in the correct order';
    case ADVANCED_TOPICS_QUESTION_TYPES.FILL_BLANK_DIALOG:
      return 'Select a word that fits the context';
    default:
      return '';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case ADVANCED_TOPICS_QUESTION_TYPES.LEARN_TOPIC: return 'Knowledge Card';
    case ADVANCED_TOPICS_QUESTION_TYPES.LISTEN_CHOOSE: return 'Listen & Choose';
    case ADVANCED_TOPICS_QUESTION_TYPES.PICTURE_MATCH: return 'Picture Match';
    case ADVANCED_TOPICS_QUESTION_TYPES.TRANSLATE_MATCH: return 'Match Translation';
    case ADVANCED_TOPICS_QUESTION_TYPES.ARRANGE_SENTENCE: return 'Arrange Sentence';
    case ADVANCED_TOPICS_QUESTION_TYPES.FILL_BLANK_DIALOG: return 'Fill Dialog';
    default: return '';
  }
};

// Check answer function

// Check answer
const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case ADVANCED_TOPICS_QUESTION_TYPES.LEARN_TOPIC:
      return true; // Learn cards don't need checking
    case ADVANCED_TOPICS_QUESTION_TYPES.LISTEN_CHOOSE:
    case ADVANCED_TOPICS_QUESTION_TYPES.PICTURE_MATCH:
    case ADVANCED_TOPICS_QUESTION_TYPES.FILL_BLANK_DIALOG:
      return userAnswer === question.correctText;
    case ADVANCED_TOPICS_QUESTION_TYPES.TRANSLATE_MATCH:
      return userAnswer && userAnswer.every(pair => 
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );
    case ADVANCED_TOPICS_QUESTION_TYPES.ARRANGE_SENTENCE:
      return Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
    default:
      return false;
  }
};

const Advanced2TopicsGame = ({ navigation, route }) => {
  const {
    lessonId = 2,
    category: routeCategory = 'advanced_topics',
    stageTitle = 'หัวข้อขั้นสูง',
    level: stageLevel = 2,
    nextStageMeta: incomingNextStageMeta,
    stageSelectRoute = 'LevelStage2',
    replayRoute = 'Advanced2TopicsGame',
    replayParams: incomingReplayParams,
  } = route.params || {};

  const resolvedNextStageMeta = useMemo(() => {
    if (incomingNextStageMeta) {
      return incomingNextStageMeta;
    }
    return {
      route: 'Advanced3DirectionsGame',
      params: {
        lessonId: 3,
        category: 'advanced_directions',
        level: stageLevel,
        stageTitle: 'ทิศทาง (Directions)',
        generator: 'lesson3_directions',
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
  const { stats, hearts: unifiedHearts, updateStats } = useUnifiedStats();
  const { userData } = useUserData();
  
  // State
  const [topics, setTopics] = useState([]);
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
  const progressRef = useRef(null);
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
  
  // Load topics data
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const normalizedTopics = advancedTopicsData.map(normalizeTopic);
        setTopics(normalizedTopics);
        
        // Generate questions using learn-play flow (14 questions)
        const generatedQuestions = generateAdvancedTopicsLessonFlow(normalizedTopics, 14);
        const filteredGenerated = generatedQuestions.filter(q => q && !SENTENCE_ORDER_TYPES.has(q.type));
        setQuestions(filteredGenerated);
        
        // Try to restore progress
        const savedProgress = await restoreProgress(lessonId);
        if (savedProgress && savedProgress.questionsSnapshot) {
          const sanitizedSnapshot = (savedProgress.questionsSnapshot || []).filter(
            q => q && !SENTENCE_ORDER_TYPES.has(q.type)
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

          if (sanitizedSnapshot.length > 0) {
            setQuestions(sanitizedSnapshot);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading topics:', error);
        setLoading(false);
      }
    };
    
    loadTopics();
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
        generator: 'advanced_topics',
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
      const xpReward = currentQuestion.rewardXP || 15;
      const diamondReward = currentQuestion.rewardDiamond || 1;
      const newXp = xpEarned + xpReward;
      const newDiamonds = diamondsEarned + diamondReward;

      setScore(newScore);
      setXpEarned(newXp);
      setDiamondsEarned(newDiamonds);
    } else {
      // Wrong answer
      const heartPenalty = currentQuestion.penaltyHeart || 1;
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
          gameMode: 'advanced_topics',
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
          const currentLevelId = `level${lessonId}`;
          unlockResult = await levelUnlockService.checkAndUnlockNextLevel(currentLevelId, {
            accuracy: accuracyPercent,
            score: correctAnswers,
            attempts: 1,
          });
          
          if (unlockResult) {
            console.log(`✅ Level unlocked! Next level: ${unlockResult.unlockedLevel}`);
          }
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
      case ADVANCED_TOPICS_QUESTION_TYPES.LEARN_TOPIC:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              
              {/* Show image if available */}
              {question.imageKey && (
                <View style={styles.imageContainer}>
                  {advancedTopicsImages[question.imageKey] ? (
                    <Image
                      source={advancedTopicsImages[question.imageKey]}
                      style={styles.topicImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.imageFallback}>
                      <Text style={styles.topicChar}>{question.imageKey}</Text>
                    </View>
                  )}
                </View>
              )}
              
              <Text style={[styles.questionText, {fontSize: 22, fontWeight: '800', color: COLORS.dark, marginTop: question.imageKey ? 0 : 10}]}>
                {question.thai}
              </Text>
              <Text style={[styles.hintText, {marginBottom: 10}]}>
                {getHintText(question.type)}
              </Text>
              {question.audioText ? (
                <TouchableOpacity style={styles.speakerButton} onPress={() => playTTS(question.audioText)}>
                  <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
                </TouchableOpacity>
              ) : null}
              <View style={{marginTop: 6, marginBottom: 8}}>
                <Text style={{fontSize: 16, fontWeight: '700', color: COLORS.dark}}>ความหมาย</Text>
                <Text style={{fontSize: 15, color: COLORS.gray, marginTop: 4}}>
                  {question.meaningTH}
                </Text>
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
              </View>
              {Boolean(question.tips) && (
                <View style={{marginTop: 12, backgroundColor: '#FFF8F0', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FFE3CC'}}>
                  <Text style={{fontSize: 12, color: '#A86A00'}}>{question.tips}</Text>
                </View>
              )}
            </View>
          </View>
        );
      
      case ADVANCED_TOPICS_QUESTION_TYPES.LISTEN_CHOOSE:
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
      
      case ADVANCED_TOPICS_QUESTION_TYPES.PICTURE_MATCH:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.hintText}>{getHintText(question.type)}</Text>
              
              <View style={styles.imageContainer}>
                {advancedTopicsImages[question.imageKey] ? (
                  <Image
                    source={advancedTopicsImages[question.imageKey]}
                    style={styles.topicImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.topicChar}>{question.imageKey}</Text>
                  </View>
                )}
              </View>
              
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
      
      case ADVANCED_TOPICS_QUESTION_TYPES.TRANSLATE_MATCH:
        const connectionColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
        const connectionSymbols = ['●', '▲', '■', '♦'];

        const getLeftIndex = (leftId) => {
          const idx = (question.leftItems || []).findIndex(l => l.id === leftId);
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
        
        const isConnected = (leftId) => dmPairs.some(p => p.leftId === leftId);
        const getConnectedRight = (leftId) => dmPairs.find(p => p.leftId === leftId)?.rightId;
        
        const handleLeftPress = (leftItem) => {
          if (currentFeedback) return;
          
          if (leftItem && leftItem.text) {
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
          
          if (dmSelected.leftId) {
            const newPairs = dmPairs.filter(p => p.rightId !== rightItem.id && p.leftId !== dmSelected.leftId);
            const newPair = { leftId: dmSelected.leftId, rightId: rightItem.id };
            const updated = [...newPairs, newPair];
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
              {/* Left Column */}
              <View style={styles.leftColumn}>
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
      
      case ADVANCED_TOPICS_QUESTION_TYPES.ARRANGE_SENTENCE:
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
      
      case ADVANCED_TOPICS_QUESTION_TYPES.FILL_BLANK_DIALOG:
        return (
          <View style={styles.questionContainer}>
            <View style={styles.questionCard}>
              <Text style={styles.instruction}>{question.instruction}</Text>
              <Text style={styles.questionText}>{question.questionText}</Text>
              <Text style={styles.questionText}>{question.template}</Text>
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
            <Text style={styles.startTitle}>หัวข้อขั้นสูง</Text>
            <Text style={styles.startSubtitle}>เรียนรู้หัวข้อสำคัญในสังคม</Text>
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
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLearn = currentQuestion?.type === ADVANCED_TOPICS_QUESTION_TYPES.LEARN_TOPIC;
  
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
            !isLearn && currentAnswer === null && styles.checkButtonDisabledEnhanced,
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
              if (isLearn) {
                nextQuestion();
              } else {
                handleCheckAnswer();
              }
            }
          }}
          disabled={!isLearn && currentAnswer === null}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={(!isLearn && currentAnswer === null) ? ['#ddd', '#ccc'] : [COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradientEnhanced}
          >
            <View style={styles.checkButtonContent}>
              <FontAwesome 
                name={currentFeedback !== null ? 'arrow-right' : (isLearn ? 'arrow-right' : 'check')} 
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
  topicImage: {
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
  topicChar: {
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFE8CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative'
  },
  selectedDragItem: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,128,0,0.08)',
    borderWidth: 3,
    transform: [{ scale: 1.02 }],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  correctDragItem: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76,175,80,0.08)'
  },
  wrongDragItem: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255,75,75,0.08)'
  },
  dragItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
    flex: 1,
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
  connectionInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
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
    justifyContent: 'center',
  },
  checkButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  starAnimation: {
    width: 20,
    height: 20,
  },
  diamondAnimation: {
    width: 20,
    height: 20,
  },
  heartsIconAnimation: {
    width: 20,
    height: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 16,
  },
  topicImage: {
    width: 160,
    height: 160,
    borderRadius: 20,
    shadowColor: '#FF8000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  imageFallback: {
    width: 160,
    height: 160,
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
  topicChar: {
    fontSize: 52,
    fontWeight: '900',
    color: COLORS.primary,
  },
});

export default Advanced2TopicsGame;
