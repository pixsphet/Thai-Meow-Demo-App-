import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
  Dimensions, Animated, Alert, Platform,
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

import placesVocab from '../data/places_vocab.json';
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
    case PLACES_QUESTION_TYPES.LISTEN_CHOOSE: return 'แตะปุ่มลำโพงแล้วเลือกคำที่ได้ยิน';
    case PLACES_QUESTION_TYPES.PICTURE_MATCH: return 'ดูรูป/emoji แล้วเลือกชื่อสถานที่';
    case PLACES_QUESTION_TYPES.TRANSLATE_MATCH: return 'จับคู่คำไทยกับภาษาอังกฤษ';
    case PLACES_QUESTION_TYPES.FILL_BLANK_DIALOG: return 'เลือกคำให้ตรงกับบทสนทนา';
    case PLACES_QUESTION_TYPES.DIRECTION_FLOW: return 'เรียงลำดับขั้นตอนให้ถูกต้อง';
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

  const { progressUser } = useProgress();
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
    if (checked) { nextQuestion(); return; }
    if (currentAnswer === null && directionSteps.length === 0) return;
    const currentQuestion = questions[currentIndex];
    const answerToCheck = currentQuestion.type === PLACES_QUESTION_TYPES.DIRECTION_FLOW ? directionSteps : currentAnswer;
    const isCorrect = checkAnswer(currentQuestion, answerToCheck);

    answersRef.current[currentIndex] = {
      questionId: currentQuestion.id, answer: answerToCheck, isCorrect, timestamp: Date.now(),
    };
    setAnswers({ ...answersRef.current });

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
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        finishLesson(elapsed);
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
        await gameProgressService.saveGameResult(LESSON_ID, resultData);
        await userStatsService.addXP(xpEarned);
        await userStatsService.addDiamonds(Math.max(2, diamondsEarned));
        if (unlockedNext) {
          await levelUnlockService.checkAndUnlockNextLevel('intermediate_3', { score, accuracy: accuracyPercent });
        }
      }
      await clearProgress(LESSON_ID);
    } catch (error) {
      console.error('Error saving game result:', error);
    }

    navigation.replace('IntermediateResult', { resultData, questions, answers: answersRef.current });
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
        <View style={styles.centerContainer}>
          <LinearGradient colors={[COLORS.primary, COLORS.cream]} style={styles.startCard}>
            <Text style={styles.startTitle}>📍 สถานที่ (Places & Location)</Text>
            <Text style={styles.startSubtitle}>Intermediate - Lesson 3</Text>
            <Text style={styles.startDescription}>
              เรียนรู้วิธีบอกสถานที่ ทิศทาง และถามเส้นทาง{'\n'}
              พร้อมฟังศัพท์ไทย และลำดับขั้นตอนทางที่ถูกต้อง
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <Text style={styles.startButtonText}>เริ่มเล่น →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#fff9f0', '#fff']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>ข้อ {currentIndex + 1} / {questions.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.hudContainer}>
        <View style={styles.badge}>
          {hearts > 0 && <LottieView source={require('../assets/animations/Heart.json')} autoPlay loop style={styles.badgeAnimation} />}
          <Text style={styles.badgeText}>{hearts}</Text>
        </View>
        <View style={styles.badge}>
          <MaterialIcons name="local-fire-department" size={24} color={COLORS.primary} />
          <Text style={styles.badgeText}>{streak}</Text>
        </View>
        <View style={styles.badge}>
          <MaterialIcons name="star" size={24} color="#FFD700" />
          <Text style={styles.badgeText}>{xpEarned}</Text>
        </View>
        <View style={styles.badge}>
          <MaterialIcons name="diamond" size={24} color="#00BCD4" />
          <Text style={styles.badgeText}>{diamondsEarned}</Text>
        </View>
        <View style={[styles.badge, styles.accuracyBadge]}>
          <MaterialIcons name="show-chart" size={20} color={COLORS.primary} />
          <Text style={styles.badgeText}>{accuracy}%</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                  <Text style={styles.emojiImage}>{currentQuestion.emoji || '🏢'}</Text>
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

      <View style={styles.bottomActions}>
        <TouchableOpacity style={[styles.checkButton, (currentAnswer === null && directionSteps.length === 0) && !checked && styles.checkButtonDisabled]} onPress={handleCheckAnswer} disabled={(currentAnswer === null && directionSteps.length === 0) && !checked}>
          <Text style={styles.checkButtonText}>{checked ? '→ ต่อไป' : '✓ ตรวจสอบ'}</Text>
        </TouchableOpacity>
      </View>

      <FireStreakAlert visible={showFireStreakAlert} streak={maxStreak} onClose={() => setShowFireStreakAlert(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F0' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF9F0', borderBottomWidth: 1, borderBottomColor: '#E8DCC8' },
  backButton: { padding: 8, marginRight: 8 },
  progressSection: { flex: 1, marginHorizontal: 12 },
  progressText: { fontSize: 13, color: COLORS.dark, marginBottom: 6, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#E8DCC8', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  hudContainer: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'space-around' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E8DCC8' },
  badgeAnimation: { width: 20, height: 20, marginRight: 6 },
  badgeText: { fontSize: 13, fontWeight: 'bold', color: COLORS.dark },
  accuracyBadge: { backgroundColor: '#FFF5E5' },
  content: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  questionContainer: { marginBottom: 20 },
  questionCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E8DCC8' },
  instruction: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  hintText: { fontSize: 12, color: '#999', fontStyle: 'italic', marginBottom: 16 },
  speakerButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  imageContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, marginBottom: 12, backgroundColor: '#F5F5F5', borderRadius: 8 },
  emojiImage: { fontSize: 80 },
  dialogQuestion: { fontSize: 15, color: COLORS.dark, marginBottom: 16, fontWeight: '500', lineHeight: 22 },
  choicesContainer: { gap: 10 },
  choiceButton: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#F5F5F5', borderRadius: 8, borderWidth: 2, borderColor: 'transparent', minHeight: 48, justifyContent: 'center' },
  choiceSelected: { backgroundColor: COLORS.cream, borderColor: COLORS.primary },
  choiceText: { fontSize: 14, color: COLORS.dark, fontWeight: '500' },
  dragMatchContainer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  leftColumn: { flex: 1, gap: 10 },
  rightColumn: { flex: 1, gap: 10 },
  dragItem: { padding: 12, backgroundColor: '#F5F5F5', borderRadius: 8, borderWidth: 2, borderColor: 'transparent', minHeight: 48, justifyContent: 'center' },
  dragItemSelected: { backgroundColor: COLORS.cream, borderColor: COLORS.primary },
  dragItemPaired: { backgroundColor: COLORS.success, borderColor: COLORS.success, opacity: 0.7 },
  dragItemText: { fontSize: 13, color: COLORS.dark, fontWeight: '500', textAlign: 'center' },
  stepOrderContainer: { marginTop: 16, padding: 12, backgroundColor: '#FFF5E5', borderRadius: 8 },
  stepOrderTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  stepOrderItem: { fontSize: 12, color: COLORS.dark, marginBottom: 4 },
  bottomActions: { paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E8DCC8', backgroundColor: '#FFF9F0' },
  checkButton: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  checkButtonDisabled: { backgroundColor: '#CCC' },
  checkButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  startCard: { padding: 24, borderRadius: 16, alignItems: 'center', width: '100%' },
  startTitle: { fontSize: 28, fontWeight: '700', color: COLORS.dark, marginBottom: 8, textAlign: 'center' },
  startSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  startDescription: { fontSize: 14, color: COLORS.dark, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  startButton: { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: COLORS.primary, borderRadius: 8, width: '100%', justifyContent: 'center', alignItems: 'center' },
  startButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  loadingText: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
});
