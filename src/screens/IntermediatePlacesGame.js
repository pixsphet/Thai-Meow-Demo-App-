import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  Dimensions, Animated, Alert, Platform, Image,
} from 'react-native';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import vaja9TtsService from '../services/vaja9TtsService';
import { saveProgress, restoreProgress, clearProgress } from '../services/progressService';
import gameProgressService from '../services/gameProgressService';
import levelUnlockService from '../services/levelUnlockService';
import userStatsService from '../services/userStatsService';
import dailyStreakService from '../services/dailyStreakService';
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useUserData } from '../contexts/UserDataContext';

import placesVocab from '../data/places_vocab.js';
import { generatePlacesQuestions, PLACES_QUESTION_TYPES } from '../utils/placesQuestionGenerator';
import FireStreakAlert from '../components/FireStreakAlert';

const { width, height } = Dimensions.get('window');
const LESSON_ID = 'intermediate_3_places';
const LESSON_KEY = 'intermediate_3_places';

const COLORS = {
  primary: '#FF8000', cream: '#FFF5E5', white: '#FFFFFF', dark: '#2C3E50',
  success: '#58cc02', error: '#ff4b4b', lightGray: '#f5f5f5', gray: '#666',
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const getHintText = (type) => {
  switch (type) {
    case PLACES_QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียงชื่อสถานที่แล้วเลือกคำที่ได้ยิน';
    case PLACES_QUESTION_TYPES.PICTURE_MATCH: return 'ดูรูปสถานที่แล้วเลือกชื่อที่ถูกต้อง';
    case PLACES_QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่ชื่อสถานที่ไทยกับภาษาอังกฤษ';
    case PLACES_QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เลือกชื่อสถานที่ให้ตรงกับบทสนทนา';
    default: return '';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case PLACES_QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังและเลือก';
    case PLACES_QUESTION_TYPES.PICTURE_MATCH: return 'จับคู่รูป';
    case PLACES_QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่ไทย-English';
    case PLACES_QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เติมบทสนทนา';
    default: return '';
  }
};

const checkAnswer = (question, answer) => {
  switch (question.type) {
    case PLACES_QUESTION_TYPES.LISTEN_CHOOSE:
    case PLACES_QUESTION_TYPES.PICTURE_MATCH:
    case PLACES_QUESTION_TYPES.FILL_BLANK_DIALOG:
      return answer === question.correctText;
    case PLACES_QUESTION_TYPES.TRANSLATE_MATCH:
      if (!Array.isArray(answer)) return false;
      return answer.every((pair) => {
        const leftItem = question.leftItems.find((l) => l.id === pair.leftId);
        return leftItem && leftItem.correctMatch === question.rightItems.find((r) => r.id === pair.rightId)?.text;
      }) && answer.length === question.leftItems.length;
    case PLACES_QUESTION_TYPES.DIRECTION_FLOW:
      if (!Array.isArray(answer)) return false;
      return JSON.stringify(answer) === JSON.stringify(question.correctOrder);
    default: return false;
  }
};

export default function IntermediatePlacesGame({ navigation, route }) {
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
  const [accuracy, setAccuracy] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [dmPairs, setDmPairs] = useState([]);
  const [dmSelected, setDmSelected] = useState({ leftId: null, rightId: null });
  const [directionSteps, setDirectionSteps] = useState([]);
  const [showFireStreakAlert, setShowFireStreakAlert] = useState(false);
  const [checked, setChecked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);
  const [currentFeedback, setCurrentFeedback] = useState(null); // 'correct'|'wrong'|null

  const { progressUser, applyDelta } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();

  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const generatedQuestions = generatePlacesQuestions(placesVocab);
        setQuestions(generatedQuestions);
        const savedProgress = await restoreProgress(LESSON_ID);
        if (savedProgress?.questionsSnapshot) {
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
        console.error('Error loading places game:', error);
        setLoading(false);
      }
    };
    loadQuestions();
  }, []);

  useEffect(() => {
    const userId = progressUser?.id || userData?.id || stats?.userId || stats?.id;
    if (!userId || serviceInitRef.current) return;
    serviceInitRef.current = true;
    (async () => {
      try {
        await gameProgressService.initialize(userId);
        await levelUnlockService.initialize(userId);
        await userStatsService.initialize(userId);
        if (typeof dailyStreakService.setUser === 'function') dailyStreakService.setUser(userId);
      } catch (error) {
        console.warn('Service initialization error:', error?.message || error);
      }
    })();
  }, [progressUser?.id, userData?.id, stats?.userId, stats?.id]);

  const autosave = useCallback(async () => {
    if (questions.length === 0) return;
    const snapshot = {
      questionsSnapshot: questions, currentIndex, hearts, score, xpEarned, diamondsEarned,
      streak, maxStreak, answers: answersRef.current, accuracy, totalAnswered,
      gameProgress: { generator: 'places', lessonId: LESSON_ID, timestamp: Date.now() },
    };
    try { await saveProgress(LESSON_ID, snapshot); } catch (error) { console.error('Error autosaving:', error); }
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, accuracy, totalAnswered]);

  useEffect(() => { if (gameStarted && !gameFinished) autosave(); }, [currentIndex, hearts, score, streak, gameStarted, gameFinished, autosave]);

  useEffect(() => {
    if (gameFinished && [5, 10, 20, 30, 50, 100].includes(maxStreak)) {
      setTimeout(() => { setShowFireStreakAlert(true); }, 1500);
    }
  }, [gameFinished, maxStreak]);

  const playTTS = useCallback(async (text) => {
    try { await vaja9TtsService.playThai(text); } catch (error) { console.error('TTS Error:', error); }
  }, []);

  const handleStartGame = async () => {
    setGameStarted(true);
    startTimeRef.current = Date.now();
    try {
      const userId = progressUser?.id || userData?.id || stats?.userId || stats?.id;
      if (userId && typeof dailyStreakService.markPlayed === 'function') {
        await dailyStreakService.markPlayed(LESSON_ID, userId);
      }
    } catch (error) {
      console.warn('Failed to mark lesson as played:', error?.message || error);
    }
  };


  const handleCheckAnswer = () => {
    if (currentAnswer === null && directionSteps.length === 0) return;
    const currentQuestion = questions[currentIndex];
    const answerToCheck = currentQuestion.type === PLACES_QUESTION_TYPES.DIRECTION_FLOW ? directionSteps : currentAnswer;
    const isCorrect = checkAnswer(currentQuestion, answerToCheck);

    console.debug(`[Answer Check] Q${currentIndex + 1}: ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}`, {
      type: currentQuestion.type,
      answer: answerToCheck,
      correct: isCorrect,
      score: score + (isCorrect ? 1 : 0),
    });

    // Save answer
    answersRef.current[currentIndex] = {
      questionId: currentQuestion.id, answer: answerToCheck, isCorrect, timestamp: Date.now(),
    };
    setAnswers({ ...answersRef.current });

    // Show feedback
    setCurrentFeedback(isCorrect ? 'correct' : 'wrong');

    const newTotal = totalAnswered + 1;
    const newCorrect = score + (isCorrect ? 1 : 0);
    const newAccuracy = Math.round((newCorrect / newTotal) * 100);
    setTotalAnswered(newTotal);
    setAccuracy(newAccuracy);
    setChecked(true);
    setLastCorrect(isCorrect);

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
        Alert.alert(
          'หัวใจหมดแล้ว',
          'ซื้อหัวใจเพิ่มเพื่อเล่นต่อ',
          [
            { text: 'ไปร้านหัวใจ', onPress: () => navigation.navigate('GemShop') },
            { text: 'ยกเลิก', style: 'cancel' }
          ]
        );
      }
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      finishLesson(elapsed);
    } else {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(null);
      setDmPairs([]);
      setDmSelected({ leftId: null, rightId: null });
      setDirectionSteps([]);
      setChecked(false);
      setLastCorrect(null);
      setCurrentFeedback(null);
    }
  };

  const finishLesson = async (elapsedTime) => {
    gameFinishedRef.current = true;
    setGameFinished(true);
    const accuracyPercent = Math.round((score / questions.length) * 100);
    const unlockedNext = accuracyPercent >= 70;
    const resultData = {
      lessonKey: LESSON_KEY, score, maxScore: questions.length * 10,
      accuracy: score / questions.length, accuracyPercent, timeSpentSec: elapsedTime,
      xpEarned, diamondsEarned: Math.max(2, diamondsEarned),
      heartsRemaining: hearts, streakDayCount: maxStreak,
      questionTypes: countQuestionTypes(), completedAt: new Date().toISOString(), unlockedNext,
    };

    try {
      const userId = progressUser?.id || userData?.id || stats?.userId || stats?.id;
      if (userId) {
        console.log('🎯 IntermediatePlacesGame finishLesson - accuracyPercent:', accuracyPercent, 'unlockedNext:', unlockedNext);
        await gameProgressService.saveGameSession({
          lessonId: LESSON_ID,
          category: 'intermediate_places',
          score,
          totalQuestions: questions.length,
          correctAnswers: score,
          wrongAnswers: Math.max(0, questions.length - score),
          accuracy: score / Math.max(1, questions.length),
          accuracyPercent,
          timeSpent: elapsedTime,
          xpEarned,
          diamondsEarned: Math.max(2, diamondsEarned),
          heartsRemaining: hearts,
          streak: maxStreak,
          maxStreak,
          questionTypes: countQuestionTypes(),
          completedAt: new Date().toISOString(),
        });
        
        // Update user stats using applyDelta
        const progressDelta = {
          xp: xpEarned,
          diamonds: Math.max(2, diamondsEarned),
          finishedLesson: true,
          timeSpentSec: elapsedTime,
        };
        
        try {
          await applyDelta(progressDelta);
        } catch (deltaError) {
          console.warn('Failed to update unified stats:', deltaError?.message || deltaError);
        }
        
        // Unlock next level (IntermediateRoutinesGame)
        if (unlockedNext) {
          try {
            console.log('🔓 Attempting to unlock level_intermediate_4 (Routines)...');
            const unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level_intermediate_3', {
              accuracy: accuracyPercent,
              score: score,
              attempts: 1,
            });
            console.log('✅ level_intermediate_4 unlocked:', unlockResult);
          } catch (unlockError) {
            console.warn('❌ Failed to unlock next level:', unlockError?.message || unlockError);
          }
        } else {
          console.log('⚠️ Level not unlocked for userId:', userId, '- accuracy:', accuracyPercent, '(need 70%)');
        }
      }
      await clearProgress(LESSON_ID);
    } catch (error) {
      console.error('Error saving game result:', error);
    }

    navigation.replace('LessonComplete', {
      lessonId: LESSON_ID,
      stageTitle: 'สถานที่และทิศทาง',
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
      replayRoute: 'IntermediatePlacesGame',
      replayParams: { lessonId: LESSON_ID },
      questionTypeCounts: countQuestionTypes(),
    });
  };

  const countQuestionTypes = () => {
    const counts = {};
    questions.forEach((q) => {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    return counts;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
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
            <Text style={styles.startTitle}>📍 สถานที่ (Places & Location)</Text>
            <Text style={styles.startSubtitle}>Intermediate - Lesson 3</Text>
            <Text style={styles.startDescription}>
              เรียนรู้วิธีบอกสถานที่ ทิศทาง และถามเส้นทาง{'\n'}
              พร้อมฟังศัพท์ไทย และลำดับขั้นตอนทางที่ถูกต้อง
            </Text>
          </View>

          {/* Player Stats Display removed per request */}
          
          <TouchableOpacity style={styles.startButton} onPress={handleStartGame} activeOpacity={0.9}>
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

  const currentQuestion = questions[currentIndex];

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
                style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]}
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
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{currentQuestion.instruction}</Text>
            <Text style={styles.hintText}>{getHintText(currentQuestion.type)}</Text>

            {currentQuestion.type === PLACES_QUESTION_TYPES.LISTEN_CHOOSE && (
              <>
                <TouchableOpacity style={styles.speakerButton} onPress={() => playTTS(currentQuestion.audioText)}>
                  <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
                </TouchableOpacity>
                <View style={styles.choicesContainer}>
                  {currentQuestion.choices.map((choice) => (
                    <TouchableOpacity key={choice.id} style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} onPress={() => setCurrentAnswer(choice.text)}>
                      <Text style={styles.choiceText} numberOfLines={1} adjustsFontSizeToFit>{choice.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {currentQuestion.type === PLACES_QUESTION_TYPES.PICTURE_MATCH && (
              <>
                <View style={styles.imageContainer}>
                  {currentQuestion.imageSource ? (
                    <Image source={currentQuestion.imageSource} style={styles.placeImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.emojiImage}>{currentQuestion.emoji || '🏢'}</Text>
                  )}
                </View>
                <View style={styles.choicesContainer}>
                  {currentQuestion.choices.map((choice) => (
                    <TouchableOpacity key={choice.id} style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} onPress={() => setCurrentAnswer(choice.text)}>
                      <Text style={styles.choiceText}>{choice.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {currentQuestion.type === PLACES_QUESTION_TYPES.DIRECTION_FLOW && (
              <>
                <Text style={styles.dialogQuestion}>{currentQuestion.questionText}</Text>
                <View style={styles.choicesContainer}>
                  {currentQuestion.stepsBank.map((step, i) => (
                    <TouchableOpacity key={i} style={[styles.choiceButton, directionSteps.includes(step) && styles.choiceSelected]} onPress={() => {
                      if (directionSteps.includes(step)) {
                        setDirectionSteps(directionSteps.filter(s => s !== step));
                      } else {
                        setDirectionSteps([...directionSteps, step]);
                      }
                    }}>
                      <Text style={styles.choiceText}>{step}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {directionSteps.length > 0 && (
                  <View style={styles.stepOrderContainer}>
                    <Text style={styles.stepOrderTitle}>ลำดับที่เลือก:</Text>
                    {directionSteps.map((step, i) => <Text key={i} style={styles.stepOrderItem}>{i + 1}. {step}</Text>)}
                  </View>
                )}
              </>
            )}

            {currentQuestion.type === PLACES_QUESTION_TYPES.FILL_BLANK_DIALOG && (
              <>
                <Text style={styles.dialogQuestion}>{currentQuestion.questionText}</Text>
                <View style={styles.choicesContainer}>
                  {currentQuestion.choices.map((choice) => (
                    <TouchableOpacity key={choice.id} style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} onPress={() => setCurrentAnswer(choice.text)}>
                      <Text style={styles.choiceText} numberOfLines={2}>{choice.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {currentQuestion.type === PLACES_QUESTION_TYPES.TRANSLATE_MATCH && (
              <>
                <View style={styles.dragMatchContainer}>
                  <View style={styles.leftColumn}>
                    <Text style={styles.columnLabel}>🇹🇭 ไทย</Text>
                    {currentQuestion.leftItems.map((item) => (
                      <TouchableOpacity key={item.id} style={[styles.dragItem, dmSelected.leftId === item.id && styles.dragItemSelected, dmPairs.some(p => p.leftId === item.id) && styles.dragItemPaired]} onPress={() => {
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
                      }}>
                        <Text style={styles.dragItemText}>{item.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.rightColumn}>
                    <Text style={styles.columnLabel}>🇺🇸 English</Text>
                    {currentQuestion.rightItems.map((item) => (
                      <TouchableOpacity key={item.id} style={[styles.dragItem, dmSelected.rightId === item.id && styles.dragItemSelected, dmPairs.some(p => p.rightId === item.id) && styles.dragItemPaired]} onPress={() => {
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
                      }}>
                        <Text style={styles.dragItemText}>{item.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
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
              {currentFeedback === 'correct' ? 'ถูกต้อง! ยอดเยี่ยม' : 'พยายามอีกครั้ง'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.checkButtonEnhanced,
            (currentAnswer === null && directionSteps.length === 0) && styles.checkButtonDisabledEnhanced,
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
              handleCheckAnswer();
            }
          }}
          disabled={(currentAnswer === null && directionSteps.length === 0)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={(currentAnswer === null && directionSteps.length === 0) ? ['#ddd', '#ccc'] : [COLORS.primary, '#FFA24D']}
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
      {/* FireStreakAlert removed */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
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
  hudContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'space-around' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E8DCC8' },
  badgeAnimation: { width: 20, height: 20, marginRight: 6 },
  badgeText: { fontSize: 13, fontWeight: 'bold', color: COLORS.dark },
  accuracyBadge: { backgroundColor: '#FFF5E5' },
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
  imageContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, marginBottom: 16, backgroundColor: '#F5F5F5', borderRadius: 12 },
  emojiImage: { fontSize: 96 },
  placeImage: { width: 120, height: 120, borderRadius: 8 },
  dialogQuestion: { fontSize: 15, color: COLORS.dark, marginBottom: 16, fontWeight: '500', lineHeight: 22 },
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
    marginBottom: 20,
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 8,
  },
  columnLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 10,
    textAlign: 'center',
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
  dragItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,128,0,0.08)',
    borderWidth: 3,
    transform: [{ scale: 1.02 }],
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
  },
  dragItemPaired: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76,175,80,0.08)'
  },
  dragItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.dark,
    flex: 1,
    textAlign: 'center',
  },
  stepOrderContainer: { marginTop: 16, padding: 12, backgroundColor: '#FFF5E5', borderRadius: 8 },
  stepOrderTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  stepOrderItem: { fontSize: 12, color: COLORS.dark, marginBottom: 4 },
  bottomActions: { paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E8DCC8', backgroundColor: '#FFF9F0' },
  checkButton: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkButtonDisabled: { backgroundColor: '#CCC' },
  checkButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
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
  startDescription: {
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
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
  loadingText: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
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
  heartAnimation: { width: 20, height: 20, marginRight: 6 },
  starAnimation: { width: 20, height: 20, marginRight: 6 },
  diamondAnimation: { width: 20, height: 20, marginRight: 6 },
  streakAnimation: { width: 20, height: 20, marginRight: 6 },
  statText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 40 : 20, // Adjust for safe area
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'transparent', // Make header transparent
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  progressSection: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
    color: COLORS.white,
    marginBottom: 6,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  headerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  typePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  heartsDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  heartsIconAnimation: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  heartsDisplay: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
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
  heartsDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartsIconAnimation: {
    width: 20,
    height: 20,
  },
  heartsDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginLeft: 5,
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
  starAnimation: {
    width: 20,
    height: 20,
  },
  diamondAnimation: {
    width: 20,
    height: 20,
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
});
