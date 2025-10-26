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

// Data & Generators
import transportationVocab from '../data/transportation_vocab.json';
import { generateTransportQuestions, TRANSPORT_QUESTION_TYPES, transportationImages } from '../utils/transportQuestionGenerator';

const { width, height } = Dimensions.get('window');

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

const getHintText = (type) => {
  switch (type) {
    case TRANSPORT_QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียงยานพาหนะแล้วเลือกคำที่ได้ยิน';
    case TRANSPORT_QUESTION_TYPES.PICTURE_MATCH: return 'ดูรูปยานพาหนะแล้วเลือกชื่อที่ถูกต้อง';
    case TRANSPORT_QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่คำศัพท์ไทยกับภาษาอังกฤษ';
    case TRANSPORT_QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เลือกยานพาหนะให้ตรงกับบทสนทนา';
    default: return '';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case TRANSPORT_QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังและเลือก';
    case TRANSPORT_QUESTION_TYPES.PICTURE_MATCH: return 'จับคู่รูป';
    case TRANSPORT_QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่ไทย-English';
    case TRANSPORT_QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เติมบทสนทนา';
    default: return '';
  }
};

const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case TRANSPORT_QUESTION_TYPES.LISTEN_CHOOSE:
    case TRANSPORT_QUESTION_TYPES.PICTURE_MATCH:
    case TRANSPORT_QUESTION_TYPES.FILL_BLANK_DIALOG:
      return userAnswer === question.correctText;
    
    case TRANSPORT_QUESTION_TYPES.TRANSLATE_MATCH:
      // For drag match, check if all pairs are correct
      return userAnswer && userAnswer.every(pair => 
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );
    
    default:
      return false;
  }
};

const IntermediateTransportGame = ({ navigation, route }) => {
  const {
    lessonId = 5,
    category: routeCategory = 'transportation',
    stageTitle = 'การเดินทาง (Transportation)',
    level: stageLevel = 'Intermediate',
    stageSelectRoute = 'LevelStage2',
  } = route.params || {};

  // Contexts
  const { applyDelta, user: progressUser } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();
  
  // State
  const [transportItems, setTransportItems] = useState([]);
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
  
  // Load transport items data
  useEffect(() => {
    const loadTransportItems = async () => {
      try {
        const normalizedItems = transportationVocab.map(item => ({
          id: item.thai,
          thai: item.thai,
          roman: item.roman,
          en: item.en,
          emoji: item.emoji,
          audioText: item.audioText,
          imageSource: transportationImages[item.thai] || null,
        }));
        setTransportItems(normalizedItems);
        
        const generatedQuestions = generateTransportQuestions(normalizedItems);
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
        console.error('Error loading transport items:', error);
        setLoading(false);
      }
    };
    
    loadTransportItems();
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
        generator: 'transport',
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
          gameMode: 'intermediate_transport',
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
          // Convert lessonId to levelId format (e.g., 5 -> 'level5')
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
        stageSelectRoute,
        replayRoute: 'IntermediateTransportGame',
        replayParams: {
          lessonId,
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
            <Text style={styles.startTitle}>การเดินทาง</Text>
            <Text style={styles.startSubtitle}>เรียนรู้ยานพาหนะและการเดินทาง</Text>
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="times" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        
        <View style={styles.headerGradient}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.headerMetaRow}>
              <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{getTypeLabel(currentQuestion.type)}</Text>
              </View>
            </View>
          </View>
          
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
      
      {/* Stats Row */}
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
          <FontAwesome name="bullseye" size={20} color={COLORS.primary} />
          <View style={styles.statTextContainer}>
            <Text style={styles.statLabel}>แม่นยำ</Text>
            <Text style={styles.statValue}>{Math.round((score / (currentIndex + 1)) * 100)}%</Text>
          </View>
        </View>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.questionScrollView}>
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{currentQuestion.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(currentQuestion.type)}</Text>
            
            {currentQuestion.type === TRANSPORT_QUESTION_TYPES.LISTEN_CHOOSE && (
              <>
                <TouchableOpacity style={styles.speakerButton} onPress={() => vaja9TtsService.playThai(currentQuestion.audioText)}>
                  <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
                </TouchableOpacity>
                <View style={styles.choicesContainer}>
                  {currentQuestion.choices.map((choice) => (
                    <TouchableOpacity 
                      key={choice.id} 
                      style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} 
                      onPress={() => handleAnswerSelect(choice.text, choice.speakText)}
                    >
                      <Text style={styles.choiceText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {choice.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            
            {currentQuestion.type === TRANSPORT_QUESTION_TYPES.PICTURE_MATCH && (
              <>
                <View style={styles.imageContainer}>
                  {currentQuestion.imageSource ? (
                    <Image source={currentQuestion.imageSource} style={styles.transportImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.emojiImage}>{currentQuestion.emoji || '🚗'}</Text>
                  )}
                </View>
                <View style={styles.choicesContainer}>
                  {currentQuestion.choices.map((choice) => (
                    <TouchableOpacity 
                      key={choice.id} 
                      style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} 
                      onPress={() => handleAnswerSelect(choice.text, choice.speakText)}
                    >
                      <Text style={styles.choiceText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {choice.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            
            {currentQuestion.type === TRANSPORT_QUESTION_TYPES.TRANSLATE_MATCH && (
              <>
                <View style={styles.dragMatchContainer}>
                  <View style={styles.leftColumn}>
                    <Text style={styles.columnLabel}>🇹🇭 ไทย</Text>
                    {currentQuestion.leftItems.map((item) => (
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
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <View style={styles.rightColumn}>
                    <Text style={styles.columnLabel}>🇺🇸 English</Text>
                    {currentQuestion.rightItems.map((item) => (
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
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
            
            {currentQuestion.type === TRANSPORT_QUESTION_TYPES.FILL_BLANK_DIALOG && (
              <>
                <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
                <View style={styles.choicesContainer}>
                  {currentQuestion.choices.map((choice) => (
                    <TouchableOpacity 
                      key={choice.id} 
                      style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} 
                      onPress={() => handleAnswerSelect(choice.text, choice.speakText)}
                    >
                      <Text style={styles.choiceText} numberOfLines={2}>{choice.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
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
              size={20} 
              color={currentFeedback === 'correct' ? '#4CAF50' : '#FF7043'} 
            />
            <Text style={styles.feedbackTextEnhanced}>
              {currentFeedback === 'correct' ? 'ถูกต้อง!' : 'ผิด!'}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.checkButtonEnhanced,
            currentAnswer === null && dmPairs.length === 0 && styles.checkButtonDisabledEnhanced,
          ]}
          onPress={() => {
            if (currentFeedback) {
              nextQuestion();
            } else {
              handleCheckAnswer();
            }
          }}
          disabled={currentAnswer === null && dmPairs.length === 0}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={currentAnswer === null ? ['#ddd', '#ccc'] : [COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkGradientEnhanced}
          >
            <Text style={styles.checkButtonTextEnhanced}>
              {currentFeedback ? (currentIndex < questions.length - 1 ? 'ต่อไป' : 'จบเกม') : 'ตรวจ'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  bg: { ...StyleSheet.absoluteFillObject },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: COLORS.dark },
  startContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
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
  introAnim: { width: 120, height: 120, marginBottom: 6 },
  startTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10 },
  startSubtitle: { fontSize: 18, color: COLORS.dark, marginBottom: 30, textAlign: 'center' },
  resumeButton: { backgroundColor: COLORS.cream, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 20 },
  resumeButtonText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  startButton: { paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, width: 220 },
  startGradient: { width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(255,255,255,0.92)', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  backButton: { marginRight: 15 },
  headerGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressContainer: { flex: 1, alignItems: 'center' },
  progressBar: { width: '100%', height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginTop: 5 },
  headerMetaRow: { width: '100%', marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill: { backgroundColor: COLORS.cream, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#FFE3CC' },
  typePillText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  heartsDisplayContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F2F2F2' },
  heartsIconAnimation: { width: 20, height: 20 },
  heartsDisplay: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginLeft: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(255,245,229,0.9)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FFE3CC', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statBadgeEnhanced: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1, borderWidth: 1, borderColor: '#F5F5F5' },
  statTextContainer: { marginLeft: 8 },
  statLabel: { fontSize: 10, color: '#999', marginBottom: 2, fontWeight: '600' },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  statDivider: { width: 1, height: '80%', backgroundColor: '#E8E8E8', marginHorizontal: 10 },
  starAnimation: { width: 20, height: 20 },
  diamondAnimation: { width: 20, height: 20 },
  questionScrollView: { flex: 1, padding: 20 },
  questionContainer: { flex: 1 },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#F2F2F2', overflow: 'hidden' },
  instruction: { fontSize: 18, fontWeight: '600', color: COLORS.dark, marginBottom: 15, textAlign: 'center' },
  questionText: { fontSize: 16, color: COLORS.gray, marginBottom: 20, textAlign: 'center' },
  hintText: { fontSize: 13, color: '#8A8A8A', textAlign: 'center', marginBottom: 12 },
  speakerButton: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.cream, justifyContent: 'center', alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderWidth: 1.5, borderColor: '#FFD8B2' },
  imageContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, marginBottom: 12, backgroundColor: '#F5F5F5', borderRadius: 8 },
  emojiImage: { fontSize: 80 },
  transportImage: { width: 120, height: 120 },
  choicesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  choiceButton: { width: '48%', backgroundColor: COLORS.white, paddingVertical: 18, paddingHorizontal: 22, borderRadius: 18, marginBottom: 15, borderWidth: 2, borderColor: COLORS.lightGray, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  choiceSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.cream, transform: [{ scale: 1.02 }] },
  choiceText: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  dragMatchContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  leftColumn: { flex: 1, marginRight: 10 },
  rightColumn: { flex: 1, marginLeft: 10 },
  columnLabel: { fontSize: 16, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginBottom: 10 },
  dragItem: { padding: 12, backgroundColor: COLORS.white, borderRadius: 8, borderWidth: 2, borderColor: COLORS.lightGray, minHeight: 48, justifyContent: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  dragItemSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.cream, transform: [{ scale: 1.02 }] },
  dragItemPaired: { backgroundColor: COLORS.success, borderColor: COLORS.success, opacity: 0.7 },
  dragItemText: { fontSize: 16, fontWeight: '500', color: COLORS.dark, textAlign: 'center' },
  checkContainerEnhanced: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  feedbackBadgeEnhanced: { position: 'absolute', top: -35, left: '50%', transform: [{ translateX: -50 }], backgroundColor: COLORS.white, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3, borderWidth: 2, flexDirection: 'row', alignItems: 'center' },
  feedbackCorrectEnhanced: { borderColor: '#4CAF50' },
  feedbackWrongEnhanced: { borderColor: '#FF7043' },
  feedbackTextEnhanced: { fontSize: 16, fontWeight: '800', marginLeft: 12, letterSpacing: 0.3, color: '#333' },
  checkButtonEnhanced: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 28, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  checkGradientEnhanced: { width: '100%', paddingVertical: 18, borderRadius: 28, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  checkButtonDisabledEnhanced: { backgroundColor: COLORS.lightGray, shadowOpacity: 0, elevation: 0 },
  checkButtonTextEnhanced: { fontSize: 18, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },
});

export default IntermediateTransportGame;
