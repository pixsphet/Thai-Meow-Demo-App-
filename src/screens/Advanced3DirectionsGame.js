import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import vaja9TtsService from '../services/vaja9TtsService';
import { saveProgress, restoreProgress, clearProgress } from '../services/progressService';
import gameProgressService from '../services/gameProgressService';
import levelUnlockService from '../services/levelUnlockService';
import userStatsService from '../services/userStatsService';
import dailyStreakService from '../services/dailyStreakService';
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useUserData } from '../contexts/UserDataContext';

const directionsDataFallback = require('../data/advanced3_directions.json');
const { width } = Dimensions.get('window');
const LESSON_ID = 'advanced3';
const CATEGORY = 'thai-directions';

const QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  DRAG_MATCH: 'DRAG_MATCH',
  PICTURE_MATCH: 'PICTURE_MATCH',
  FILL_DIALOG: 'FILL_DIALOG',
  ARRANGE_SENTENCE: 'ARRANGE_SENTENCE',
};

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

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).substr(2, 9);

const normalizeDirection = (doc) => ({
  id: doc.id || doc._id || `dir_${uid()}`,
  thai: doc.thai || '',
  roman: doc.roman || '',
  en: doc.en || '',
  meaningTH: doc.meaningTH || '',
  exampleTH: doc.exampleTH || '',
  audioText: doc.audioText || doc.thai || '',
  imagePath: doc.imagePath || '',
});

const getHintText = (type) => {
  const hints = {
    [QUESTION_TYPES.LISTEN_CHOOSE]: 'แตะปุ่มลำโพงเพื่อฟังซ้ำ แล้วเลือกคำถูกต้อง',
    [QUESTION_TYPES.DRAG_MATCH]: 'แตะเพื่อจับคู่ ไทย ↔ อังกฤษ',
    [QUESTION_TYPES.PICTURE_MATCH]: 'ดูภาพแล้วเลือกคำที่ตรงกัน',
    [QUESTION_TYPES.FILL_DIALOG]: 'เลือกคำที่เหมาะสมเพื่อเติมบทสนทนา',
    [QUESTION_TYPES.ARRANGE_SENTENCE]: 'เรียงคำให้เป็นประโยคที่ถูกต้อง',
  };
  return hints[type] || '';
};

const getTypeLabel = (type) => {
  const labels = {
    [QUESTION_TYPES.LISTEN_CHOOSE]: 'ฟังแล้วเลือก',
    [QUESTION_TYPES.DRAG_MATCH]: 'จับคู่ไทย-อังกฤษ',
    [QUESTION_TYPES.PICTURE_MATCH]: 'จับคู่จากรูป',
    [QUESTION_TYPES.FILL_DIALOG]: 'เติมบทสนทนา',
    [QUESTION_TYPES.ARRANGE_SENTENCE]: 'เรียงประโยค',
  };
  return labels[type] || '';
};

const makeListenChoose = (item, pool) => {
  const wrong = pool.filter(p => p.id !== item.id).slice(0, 3);
  const choices = shuffle([item, ...wrong]).slice(0, 4);
  return {
    id: `lc_${item.id}_${uid()}`,
    type: QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังเสียงแล้วเลือกคำที่ได้ยิน',
    questionText: 'แตะปุ่มลำโพงเพื่อฟัง',
    audioText: item.audioText,
    correctText: item.thai,
    choices: choices.map((c, i) => ({ id: i + 1, text: c.thai, isCorrect: c.id === item.id })),
  };
};

const makeDragMatch = (pool) => {
  const batch = shuffle(pool).slice(0, 4);
  const leftItems = batch.map((item, idx) => ({ id: `left_${idx + 1}`, text: item.thai, correctMatch: item.en }));
  const rightItems = shuffle(batch).map((item, idx) => ({ id: `right_${idx + 1}`, text: item.en }));
  return { id: `dm_${uid()}`, type: QUESTION_TYPES.DRAG_MATCH, instruction: 'จับคู่คำไทยกับคำอังกฤษ', leftItems, rightItems };
};

const makePictureMatch = (item, pool) => {
  const wrong = pool.filter(p => p.id !== item.id).slice(0, 3);
  const choices = shuffle([item, ...wrong]).slice(0, 4);
  return {
    id: `pm_${item.id}_${uid()}`,
    type: QUESTION_TYPES.PICTURE_MATCH,
    instruction: 'ดูภาพแล้วเลือกคำที่ตรงกัน',
    imageKey: item.imagePath,
    correctText: item.thai,
    choices: choices.map((c, i) => ({ id: i + 1, text: c.thai, isCorrect: c.id === item.id })),
  };
};

const makeDialogFill = (pool) => {
  const dialogs = [
    { q: 'ขอโทษครับ ร้านสะดวกซื้อไปทางไหนครับ?', a: 'ขอโทษครับ ____', choices: ['ตรงไป', 'เลี้ยวซ้าย', 'เลี้ยวขวา', 'ไกล'] },
    { q: 'โรงเรียนอยู่ใกล้ไหม?', a: '____', choices: ['ใกล้มาก', 'ไกลมาก', 'อยู่ข้างหน้า', 'อยู่ข้างหลัง'] },
    { q: 'จะไปสถานีตำรวจได้ยังไง?', a: '____', choices: ['เลี้ยวซ้าย', 'เลี้ยวขวา', 'ตรงไป', 'ผ่าน'] },
  ];
  const dialog = pick(dialogs);
  const item = pick(pool);
  return {
    id: `fb_${item.id}_${uid()}`,
    type: QUESTION_TYPES.FILL_DIALOG,
    instruction: 'เลือกคำที่เหมาะสมเพื่อเติมบทสนทนา',
    dialogQuestion: dialog.q,
    template: dialog.a,
    correctText: dialog.choices[0],
    choices: shuffle(dialog.choices).map((text, i) => ({ id: i + 1, text, isCorrect: text === dialog.choices[0] })),
  };
};

const makeArrangeSentence = (item) => {
  const sentences = [
    [`ไปตรงไป`, `แล้ว`, `เลี้ยวซ้าย`],
    [`เลี้ยวขวา`, `ที่`, `สี่แยก`],
    [item.thai, `ทุกที่`, `ได้`],
  ];
  const sentence = pick(sentences);
  const distractors = ['ครับ', 'ค่ะ', 'นะ'];
  return {
    id: `arr_${item.id}_${uid()}`,
    type: QUESTION_TYPES.ARRANGE_SENTENCE,
    instruction: 'เรียงคำให้เป็นประโยคที่ถูกต้อง',
    correctOrder: sentence,
    allParts: shuffle([...sentence, ...distractors.slice(0, 1)]),
  };
};

const generateDirectionsQuestions = (pool) => {
  if (!pool || pool.length === 0) return [];
  const questions = [];
  const usedIds = new Set();
  
  for (let i = 0; i < 3 && pool.length > usedIds.size; i++) {
    const available = pool.filter(p => !usedIds.has(p.id));
    if (available.length) {
      const item = pick(available);
      usedIds.add(item.id);
      questions.push(makeListenChoose(item, pool));
    }
  }
  
  for (let i = 0; i < 3; i++) questions.push(makeDragMatch(pool));
  
  for (let i = 0; i < 2 && pool.length > usedIds.size; i++) {
    const available = pool.filter(p => !usedIds.has(p.id));
    if (available.length) {
      const item = pick(available);
      usedIds.add(item.id);
      questions.push(makePictureMatch(item, pool));
    }
  }
  
  for (let i = 0; i < 3; i++) questions.push(makeDialogFill(pool));
  
  for (let i = 0; i < 2 && pool.length > usedIds.size; i++) {
    const available = pool.filter(p => !usedIds.has(p.id));
    if (available.length) {
      const item = pick(available);
      usedIds.add(item.id);
      questions.push(makeArrangeSentence(item));
    }
  }
  
  return shuffle(questions);
};

const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
    case QUESTION_TYPES.PICTURE_MATCH:
    case QUESTION_TYPES.FILL_DIALOG:
      return userAnswer === question.correctText;
    case QUESTION_TYPES.DRAG_MATCH:
      return userAnswer && userAnswer.every(pair =>
        question.leftItems.find(left => left.id === pair.leftId)?.correctMatch ===
        question.rightItems.find(right => right.id === pair.rightId)?.text
      );
    case QUESTION_TYPES.ARRANGE_SENTENCE:
      return Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
    default:
      return false;
  }
};

const Advanced3DirectionsGame = ({ navigation, route }) => {
  const { lessonId = LESSON_ID, category: routeCategory = CATEGORY, stageTitle = 'ทิศทาง (Directions)', level: stageLevel = 'Advanced', stageSelectRoute = 'LevelStage3' } = route.params || {};
  
  const { applyDelta, user: progressUser } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();
  
  const [directions, setDirections] = useState([]);
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

  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);

  useEffect(() => {
    const loadDirections = async () => {
      try {
        const normalized = (directionsDataFallback || []).map(normalizeDirection).filter(i => i && i.thai);
        setDirections(normalized);
        const generatedQuestions = generateDirectionsQuestions(normalized);
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
        console.error('Error loading directions:', error);
        setLoading(false);
      }
    };
    loadDirections();
  }, [lessonId]);

  useEffect(() => {
    const userId = progressUser?.id || userData?.id || stats?.userId || stats?._id || stats?.id;
    if (!userId || serviceInitRef.current) return;
    serviceInitRef.current = true;

    (async () => {
      try { await gameProgressService.initialize(userId); } catch (e) { console.warn('gameProgressService:', e?.message); }
      try { await levelUnlockService.initialize(userId); } catch (e) { console.warn('levelUnlockService:', e?.message); }
      try { await userStatsService.initialize(userId); } catch (e) { console.warn('userStatsService:', e?.message); }
      try { if (typeof dailyStreakService.setUser === 'function') dailyStreakService.setUser(userId); } catch (e) { console.warn('dailyStreakService:', e?.message); }
    })();
  }, [progressUser?.id, userData?.id, stats?.userId, stats?._id, stats?.id]);

  const autosave = useCallback(async () => {
    if (questions.length === 0) return;
    try {
      await saveProgress(lessonId, { questionsSnapshot: questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, answers: answersRef.current, gameProgress: { generator: 'directions', lessonId, timestamp: Date.now() } });
    } catch (error) { console.error('Error saving progress:', error); }
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, lessonId]);

  useEffect(() => {
    if (gameStarted && !gameFinished) autosave();
  }, [currentIndex, hearts, score, streak, gameStarted, gameFinished, autosave]);

  const playTTS = useCallback(async (text) => {
    try { await vaja9TtsService.playThai(text); } catch (error) { console.error('TTS Error:', error); }
  }, []);

  const handleAnswerSelect = (answer) => { setCurrentAnswer(answer); };

  const handleCheckAnswer = () => {
    if (currentAnswer === null) return;
    const currentQuestion = questions[currentIndex];
    const isCorrect = checkAnswer(currentQuestion, currentAnswer);
    
    answersRef.current[currentIndex] = { questionId: currentQuestion.id, answer: currentAnswer, isCorrect, timestamp: Date.now() };
    setAnswers({ ...answersRef.current });

    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      const newMax = Math.max(maxStreak, streak + 1);
      setMaxStreak(newMax);
      setXpEarned(xpEarned + 10);
      setDiamondsEarned(diamondsEarned + 1);
      nextQuestion();
    } else {
      const newHearts = Math.max(0, hearts - 1);
      setHearts(newHearts);
      setStreak(0);
      if (newHearts === 0) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        finishLesson(elapsed);
      } else {
        nextQuestion();
      }
    }
  };

  useEffect(() => { setDmSelected({ leftId: null, rightId: null }); setDmPairs([]); }, [currentIndex]);

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(null);
    } else {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      finishLesson(elapsed);
    }
  };

  const startGame = () => { setGameStarted(true); setGameFinished(false); gameFinishedRef.current = false; startTimeRef.current = Date.now(); dailyStreakService.startStreak(); };
  const resumeGame = () => { setGameStarted(true); setGameFinished(false); gameFinishedRef.current = false; startTimeRef.current = Date.now(); };

  const finishLesson = async (timeSpentOverrideSec) => {
    if (gameFinishedRef.current) return;
    gameFinishedRef.current = true;
    setGameFinished(true);

    try {
      const totalQuestions = questions.length;
      const correctAnswers = score;
      const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
      const accuracyRatio = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
      const accuracyPercent = Math.round(accuracyRatio * 100);
      const timeSpent = Number.isFinite(timeSpentOverrideSec) ? timeSpentOverrideSec : Math.floor((Date.now() - startTimeRef.current) / 1000);
      const unlockedNext = accuracyPercent >= 70;

      const lastResults = { lessonId, stageTitle, totalQuestions, correctAnswers, wrongAnswers, accuracyPercent, xpEarned, diamondsEarned, heartsRemaining: hearts, timeSpent };
      const progressDelta = { xp: xpEarned, diamonds: diamondsEarned, finishedLesson: true, timeSpentSec: timeSpent, totalCorrectAnswers: correctAnswers, totalWrongAnswers: wrongAnswers, lastGameResults: lastResults };

      try { await applyDelta(progressDelta); } catch (e) { console.warn('applyDelta:', e?.message); }

      const questionTypeCounts = questions.reduce((acc, q) => { acc[q.type] = (acc[q.type] || 0) + 1; return acc; }, {});

      try {
        await gameProgressService.saveGameSession({ lessonId, category: routeCategory, gameMode: 'directions_advanced', score: correctAnswers, totalQuestions, correctAnswers, wrongAnswers, accuracy: accuracyRatio, accuracyPercent, timeSpent, xpEarned, diamondsEarned, heartsRemaining: hearts, streak, maxStreak, questionTypes: questionTypeCounts, completedAt: new Date().toISOString() });
      } catch (e) { console.warn('saveGameSession:', e?.message); }

      if (unlockedNext) {
        try {
          await levelUnlockService.checkAndUnlockNextLevel('level3_advanced', { accuracy: accuracyPercent, score: correctAnswers, attempts: 1 });
        } catch (e) { console.warn('checkAndUnlockNextLevel:', e?.message); }
      }

      try { await clearProgress(lessonId); } catch (e) { console.warn('clearProgress:', e?.message); }

      navigation.replace('LessonComplete', { lessonId, stageTitle, score: correctAnswers, totalQuestions, timeSpent, accuracy: accuracyPercent, accuracyPercent, accuracyRatio, xpGained: xpEarned, diamondsGained: diamondsEarned, heartsRemaining: hearts, streak, maxStreak, isUnlocked: unlockedNext, stageSelectRoute, questionTypeCounts });
    } catch (error) { console.error('Error finishing lesson:', error); }
  };

  const renderQuestionComponent = () => {
    if (questions.length === 0 || currentIndex >= questions.length) return null;
    const question = questions[currentIndex];

    if ([QUESTION_TYPES.LISTEN_CHOOSE, QUESTION_TYPES.PICTURE_MATCH, QUESTION_TYPES.FILL_DIALOG].includes(question.type)) {
      return (
        <View style={styles.questionContainer}>
          <View style={styles.questionCard}>
            <Text style={styles.instruction}>{question.instruction}</Text>
            {question.dialogQuestion && <Text style={styles.questionText}>Q: {question.dialogQuestion}</Text>}
            {question.template && <Text style={styles.questionText}>{question.template}</Text>}
            <Text style={styles.hintText}>{getHintText(question.type)}</Text>
            {question.audioText && (
              <TouchableOpacity style={styles.speakerButton} onPress={() => playTTS(question.audioText)}>
                <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <View style={styles.choicesContainer}>
              {question.choices.map((choice) => (
                <TouchableOpacity key={choice.id} style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} onPress={() => handleAnswerSelect(choice.text)}>
                  <Text style={styles.choiceText}>{choice.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (question.type === QUESTION_TYPES.DRAG_MATCH) {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.instruction}>{question.instruction}</Text>
          <Text style={styles.hintText}>{getHintText(question.type)}</Text>
          {dmPairs.length > 0 && (
            <View style={styles.pairPreview}>
              {dmPairs.map((p, idx) => (
                <View key={`pair-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                <TouchableOpacity key={item.id} style={[styles.dragItem, dmSelected.leftId === item.id && styles.dragItemSelected, dmPairs.some(p => p.leftId === item.id) && styles.dragItemPaired]} onPress={() => {
                  if (dmPairs.some(p => p.leftId === item.id)) {
                    const filtered = dmPairs.filter(p => p.leftId !== item.id);
                    setDmPairs(filtered);
                    setCurrentAnswer(filtered);
                  } else {
                    const next = { leftId: item.id, rightId: dmSelected.rightId };
                    if (next.rightId) {
                      const updated = [...dmPairs.filter(p => p.rightId !== next.rightId && p.leftId !== next.leftId), next];
                      setDmPairs(updated);
                      setCurrentAnswer(updated);
                      setDmSelected({ leftId: null, rightId: null });
                    } else {
                      setDmSelected(next);
                    }
                  }
                }}>
                  <Text style={styles.dragItemText}>{item.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.rightColumn}>
              {question.rightItems.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.dragItem, dmSelected.rightId === item.id && styles.dragItemSelected, dmPairs.some(p => p.rightId === item.id) && styles.dragItemPaired]} onPress={() => {
                  if (dmPairs.some(p => p.rightId === item.id)) {
                    const filtered = dmPairs.filter(p => p.rightId !== item.id);
                    setDmPairs(filtered);
                    setCurrentAnswer(filtered);
                  } else {
                    const next = { leftId: dmSelected.leftId, rightId: item.id };
                    if (next.leftId) {
                      const updated = [...dmPairs.filter(p => p.rightId !== next.rightId && p.leftId !== next.leftId), next];
                      setDmPairs(updated);
                      setCurrentAnswer(updated);
                      setDmSelected({ leftId: null, rightId: null });
                    } else {
                      setDmSelected(next);
                    }
                  }
                }}>
                  <Text style={styles.dragItemText}>{item.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (question.type === QUESTION_TYPES.ARRANGE_SENTENCE) {
      return (
        <View style={styles.questionContainer}>
          <Text style={styles.instruction}>{question.instruction}</Text>
          <Text style={styles.hintText}>{getHintText(question.type)}</Text>
          <View style={styles.arrangeContainer}>
            <Text style={styles.arrangeText}>{currentAnswer ? currentAnswer.join(' ') : 'เรียงคำให้ถูกต้อง'}</Text>
          </View>
          <View style={styles.choicesContainer}>
            {question.allParts.map((part, index) => (
              <TouchableOpacity key={index} style={[styles.choiceButton, currentAnswer && currentAnswer.includes(part) && styles.choiceSelected]} onPress={() => {
                if (!currentAnswer) {
                  setCurrentAnswer([part]);
                } else if (!currentAnswer.includes(part)) {
                  setCurrentAnswer([...currentAnswer, part]);
                } else {
                  setCurrentAnswer(currentAnswer.filter(p => p !== part));
                }
              }}>
                <Text style={styles.choiceText}>{part}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LottieView source={require('../assets/animations/LoadingCat.json')} autoPlay loop style={{ width: 200, height: 200 }} />
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
            <LottieView source={require('../assets/animations/stage_start.json')} autoPlay loop style={styles.introAnim} />
            <Text style={styles.startTitle}>ทิศทาง</Text>
            <Text style={styles.startSubtitle}>บทเรียน Advanced</Text>
          </View>
          {resumeData && (
            <TouchableOpacity style={styles.resumeButton} onPress={resumeGame}>
              <Text style={styles.resumeButtonText}>เล่นต่อจากข้อที่ {resumeData.currentIndex + 1}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <LinearGradient colors={[COLORS.primary, '#FFA24D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.startGradient}>
              <Text style={styles.startButtonText}>เริ่มเล่น</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gameFinished) return null;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFF5E5', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bg} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <LottieView source={require('../assets/animations/Heart.json')} autoPlay loop style={styles.statIcon} />
          <Text style={styles.statText}>{hearts}</Text>
        </View>
        <View style={styles.statBadge}>
          <LottieView source={require('../assets/animations/Streak-Fire1.json')} autoPlay loop style={styles.statIcon} />
          <Text style={styles.statText}>{streak}</Text>
        </View>
        <View style={styles.statBadge}>
          <LottieView source={require('../assets/animations/Star.json')} autoPlay loop style={styles.statIcon} />
          <Text style={styles.statText}>{xpEarned}</Text>
        </View>
        <View style={styles.statBadge}>
          <LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={styles.statIcon} />
          <Text style={styles.statText}>+{diamondsEarned}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statText}>🎯 {Math.min(100, Math.max(0, Math.round((score / Math.max(1, currentIndex)) * 100)))}%</Text>
        </View>
      </View>
      <ScrollView style={styles.questionScrollView}>
        {renderQuestionComponent()}
      </ScrollView>
      <View style={styles.checkContainer}>
        <TouchableOpacity style={[styles.checkButton, currentAnswer === null && styles.checkButtonDisabled]} onPress={handleCheckAnswer} disabled={currentAnswer === null}>
          <LinearGradient colors={[COLORS.primary, '#FFA24D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.checkGradient}>
            <Text style={styles.checkButtonText}>CHECK</Text>
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
  loadingText: { fontSize: 18, color: COLORS.dark, marginTop: 16 },
  startContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  introCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, borderWidth: 1, borderColor: '#F2F2F2', marginBottom: 14 },
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
  progressContainer: { flex: 1, alignItems: 'center' },
  progressBar: { width: '100%', height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginTop: 5 },
  headerMetaRow: { width: '100%', marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill: { backgroundColor: COLORS.cream, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#FFE3CC' },
  typePillText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'rgba(255,245,229,0.9)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FFE3CC', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2, borderWidth: 1, borderColor: '#F2F2F2' },
  statIcon: { width: 18, height: 18 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.dark, marginLeft: 4 },
  questionScrollView: { flex: 1, padding: 20 },
  questionContainer: { flex: 1 },
  instruction: { fontSize: 18, fontWeight: '600', color: COLORS.dark, marginBottom: 15, textAlign: 'center' },
  questionText: { fontSize: 16, color: COLORS.gray, marginBottom: 16, textAlign: 'center' },
  hintText: { fontSize: 13, color: '#8A8A8A', textAlign: 'center', marginBottom: 12 },
  speakerButton: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.cream, justifyContent: 'center', alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderWidth: 1.5, borderColor: '#FFD8B2' },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#F2F2F2', overflow: 'hidden' },
  choicesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  choiceButton: { width: '48%', backgroundColor: COLORS.white, paddingVertical: 18, paddingHorizontal: 16, borderRadius: 12, marginBottom: 15, borderWidth: 2, borderColor: COLORS.lightGray, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  choiceSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.cream, transform: [{ scale: 1.02 }] },
  choiceText: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  dragMatchContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  leftColumn: { flex: 1, marginRight: 10 },
  rightColumn: { flex: 1, marginLeft: 10 },
  dragItem: { backgroundColor: COLORS.white, paddingVertical: 15, paddingHorizontal: 12, borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: COLORS.lightGray, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  dragItemSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.cream, transform: [{ scale: 1.02 }] },
  dragItemPaired: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.08)' },
  dragItemText: { fontSize: 14, fontWeight: '500', color: COLORS.dark },
  pairPreview: { alignSelf: 'center', flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: '#F2F2F2', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  pairPreviewText: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  pairArrow: { fontSize: 14, marginHorizontal: 6, color: COLORS.primary, fontWeight: '900' },
  arrangeContainer: { backgroundColor: COLORS.cream, padding: 20, borderRadius: 15, marginBottom: 20 },
  arrangeText: { fontSize: 18, fontWeight: '600', color: COLORS.dark, textAlign: 'center' },
  checkContainer: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  checkButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 28, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 },
  checkGradient: { width: '100%', paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  checkButtonDisabled: { backgroundColor: COLORS.lightGray, shadowOpacity: 0, elevation: 0 },
  checkButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, letterSpacing: 0.5 },
});

export default Advanced3DirectionsGame;
