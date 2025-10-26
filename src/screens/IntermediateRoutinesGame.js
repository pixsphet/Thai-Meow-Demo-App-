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

import activitiesVocab from '../data/activities_vocab.json';
import { generateActivitiesQuestions, ACTIVITIES_QUESTION_TYPES } from '../utils/activitiesQuestionGenerator';

const { width, height } = Dimensions.get('window');
const LESSON_ID = 'intermediate_4_activities';
const LESSON_KEY = 'intermediate_4_activities';

const COLORS = {
  primary: '#FF8000', cream: '#FFF5E5', white: '#FFFFFF', dark: '#2C3E50',
  success: '#58cc02', error: '#ff4b4b', lightGray: '#f5f5f5', gray: '#666',
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const getHintText = (type) => {
  switch (type) {
    case ACTIVITIES_QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังเสียงกิจกรรมแล้วเลือกคำที่ได้ยิน';
    case ACTIVITIES_QUESTION_TYPES.PICTURE_MATCH: return 'ดูรูปกิจกรรมแล้วเลือกชื่อที่ถูกต้อง';
    case ACTIVITIES_QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่คำศัพท์ไทยกับภาษาอังกฤษ';
    case ACTIVITIES_QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เลือกกิจกรรมให้ตรงกับบทสนทนา';
    default: return '';
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case ACTIVITIES_QUESTION_TYPES.LISTEN_CHOOSE: return 'ฟังและเลือก';
    case ACTIVITIES_QUESTION_TYPES.PICTURE_MATCH: return 'จับคู่รูป';
    case ACTIVITIES_QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่ไทย-English';
    case ACTIVITIES_QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เติมบทสนทนา';
    default: return '';
  }
};

const checkAnswer = (question, answer) => {
  switch (question.type) {
    case ACTIVITIES_QUESTION_TYPES.LISTEN_CHOOSE:
    case ACTIVITIES_QUESTION_TYPES.PICTURE_MATCH:
    case ACTIVITIES_QUESTION_TYPES.FILL_BLANK_DIALOG:
      return answer === question.correctText;
    case ACTIVITIES_QUESTION_TYPES.TRANSLATE_MATCH:
      if (!Array.isArray(answer)) return false;
      return answer.every((pair) => {
        const leftItem = question.leftItems.find((l) => l.id === pair.leftId);
        return leftItem && leftItem.correctMatch === question.rightItems.find((r) => r.id === pair.rightId)?.text;
      }) && answer.length === question.leftItems.length;
    default: return false;
  }
};

export default function IntermediateRoutinesGame({ navigation, route }) {
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
  const [currentFeedback, setCurrentFeedback] = useState(null); // 'correct'|'wrong'|null
  const [resumeData, setResumeData] = useState(null);

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
        const generatedQuestions = generateActivitiesQuestions(activitiesVocab);
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
        console.error('Error loading activities game:', error);
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
      gameProgress: { generator: 'activities', lessonId: LESSON_ID, timestamp: Date.now() },
    };
    try { await saveProgress(LESSON_ID, snapshot); } catch (error) { console.error('Error autosaving:', error); }
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, accuracy, totalAnswered]);

  useEffect(() => { if (gameStarted && !gameFinished) autosave(); }, [currentIndex, hearts, score, streak, gameStarted, gameFinished, autosave]);

  const playTTS = useCallback(async (text) => {
    try { await vaja9TtsService.playThai(text); } catch (error) { console.error('TTS Error:', error); }
  }, []);
  
  // Handle answer selection
  const handleAnswerSelect = (answer, speakText) => {
    setCurrentAnswer(answer);
    if (speakText) {
      vaja9TtsService.playThai(speakText);
    }
  };

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

  const resumeGame = () => {
    setGameStarted(true);
    setGameFinished(false);
    startTimeRef.current = Date.now();
  };

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

  // Reset drag-match state when index changes
  useEffect(() => {
    setDmSelected({ leftId: null, rightId: null });
    setDmPairs([]);
    setCurrentFeedback(null);
  }, [currentIndex]);

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
        console.log('🎯 IntermediateRoutinesGame finishLesson - accuracyPercent:', accuracyPercent, 'unlockedNext:', unlockedNext);
        await gameProgressService.saveGameSession({
          lessonId: LESSON_ID,
          category: 'intermediate_activities',
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
        
        // Unlock next level
        if (unlockedNext) {
          try {
            console.log('🔓 Attempting to unlock next level...');
            const unlockResult = await levelUnlockService.checkAndUnlockNextLevel('level_intermediate_4', {
              accuracy: accuracyPercent,
              score: score,
              attempts: 1,
            });
            console.log('✅ Next level unlocked:', unlockResult);
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
      stageTitle: 'กิจกรรมประจำวัน',
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
      replayRoute: 'IntermediateRoutinesGame',
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
            <Text style={styles.startTitle}>🎯 กิจกรรมประจำวัน (Daily Activities)</Text>
            <Text style={styles.startSubtitle}>Intermediate - Lesson 4</Text>
            <Text style={styles.startDescription}>
              เรียนรู้คำศัพท์กิจกรรมต่างๆ ในชีวิตประจำวัน{'\n'}
              พร้อมฟังเสียงไทย และจับคู่คำศัพท์
            </Text>
          </View>

          {/* Player Stats Display removed per request */}
          
          {resumeData && (
            <TouchableOpacity style={styles.resumeButton} onPress={resumeGame} activeOpacity={0.9}>
              <Text style={styles.resumeButtonText}>เล่นต่อจากข้อที่ {resumeData.currentIndex + 1}</Text>
            </TouchableOpacity>
          )}
          
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

            {currentQuestion.type === ACTIVITIES_QUESTION_TYPES.LISTEN_CHOOSE && (
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

            {currentQuestion.type === ACTIVITIES_QUESTION_TYPES.PICTURE_MATCH && (
              <>
                <View style={styles.imageContainer}>
                  {currentQuestion.imageSource ? (
                    <Image source={currentQuestion.imageSource} style={styles.activityImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.emojiImage}>{currentQuestion.emoji || '🎯'}</Text>
                  )}
                </View>
                <View style={styles.choicesContainer}>
                  {currentQuestion.choices.map((choice) => (
                    <TouchableOpacity 
                      key={choice.id} 
                      style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} 
                      onPress={() => handleAnswerSelect(choice.text, choice.speakText)}
                    >
                      <Text style={styles.choiceText}>{choice.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {currentQuestion.type === ACTIVITIES_QUESTION_TYPES.TRANSLATE_MATCH && (
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

            {currentQuestion.type === ACTIVITIES_QUESTION_TYPES.FILL_BLANK_DIALOG && (
              <>
                <Text style={styles.dialogQuestion}>{currentQuestion.questionText}</Text>
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
  headerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
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
    color: COLORS.white,
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
  activityImage: { width: 120, height: 120, borderRadius: 8 },
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
  checkContainerEnhanced: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
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
});