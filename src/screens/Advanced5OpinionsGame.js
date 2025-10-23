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

const opinionsPhrasesData = require('../data/advanced5_opinions.json');
const opinionsScenariosData = require('../data/advanced5_opinion_scenarios.json');
const LESSON_ID = 'advanced5';
const CATEGORY = 'thai-opinions';

const QUESTION_TYPES = {
  LISTEN_CHOOSE: 'LISTEN_CHOOSE',
  DRAG_MATCH: 'DRAG_MATCH',
  FILL_BLANK_DIALOG: 'FILL_BLANK_DIALOG',
  ARRANGE_SENTENCE: 'ARRANGE_SENTENCE',
  TONE_PICKER: 'TONE_PICKER',
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

const getHintText = (type) => {
  const hints = {
    [QUESTION_TYPES.LISTEN_CHOOSE]: 'ฟังประโยคแล้วเลือกความเห็นที่สมเหตุสมผลที่สุด',
    [QUESTION_TYPES.DRAG_MATCH]: 'แตะเพื่อจับคู่ วลี ↔ หน้าที่การสื่อสาร',
    [QUESTION_TYPES.FILL_BLANK_DIALOG]: 'เลือกวลีที่เหมาะสมเติมในบทสนทนา',
    [QUESTION_TYPES.ARRANGE_SENTENCE]: 'เรียงลำดับ "โครงความเห็น" ให้เหมาะสม',
    [QUESTION_TYPES.TONE_PICKER]: 'เลือกโทนประโยคที่เหมาะสมกับบริบท',
  };
  return hints[type] || '';
};

const getTypeLabel = (type) => {
  const labels = {
    [QUESTION_TYPES.LISTEN_CHOOSE]: 'ฟังแล้วเลือก',
    [QUESTION_TYPES.DRAG_MATCH]: 'จับคู่ หน้าที่',
    [QUESTION_TYPES.FILL_BLANK_DIALOG]: 'เติมบทสนทนา',
    [QUESTION_TYPES.ARRANGE_SENTENCE]: 'เรียงประโยค',
    [QUESTION_TYPES.TONE_PICKER]: 'เลือกโทน',
  };
  return labels[type] || '';
};

const makeListenChoose = (scenario) => {
  const correct = scenario.goodAnswerTH;
  const distractors = ['ไม่เห็นด้วย แต่ไม่ขออธิบาย', 'ก็ได้มั้ง', 'ฉันคิดว่าดี เฉยๆ'];
  const choices = shuffle([correct, ...shuffle(distractors).slice(0, 2)]).map((t, i) => ({ id: i + 1, text: t }));
  return {
    id: `LC_${uid()}`,
    type: QUESTION_TYPES.LISTEN_CHOOSE,
    instruction: 'ฟังคำตอบแล้วเลือก "ความเห็นที่สมเหตุสมผลที่สุด"',
    audioText: correct,
    questionText: scenario.promptTH,
    correctText: correct,
    choices,
  };
};

const makeDragMatch = (phrasePool) => {
  const pick4 = shuffle(phrasePool).slice(0, 4);
  const leftItems = pick4.map((p, i) => ({ id: `left_${i + 1}`, text: p.thai, correctMatch: p.function }));
  const rightItems = shuffle(pick4).map((p, i) => ({ id: `right_${i + 1}`, text: p.function }));
  return { id: `DM_${uid()}`, type: QUESTION_TYPES.DRAG_MATCH, instruction: 'จับคู่ "วลี" กับ "หน้าที่การสื่อสาร"', leftItems, rightItems };
};

const makeFillBlankDialog = (scenario, phrasePool) => {
  const stateOpinionPhrases = phrasePool.filter(p => p.function === 'state_opinion');
  const correct = stateOpinionPhrases.length > 0 ? pick(stateOpinionPhrases).thai : 'ส่วนตัวฉันคิดว่า';
  const choices = shuffle([correct, 'สรุปคือ', 'อย่างไรก็ตาม', 'เห็นด้วยบางส่วน']).slice(0, 4).map((t, i) => ({ id: i + 1, text: t }));
  return {
    id: `FB_${uid()}`,
    type: QUESTION_TYPES.FILL_BLANK_DIALOG,
    instruction: 'เลือกวลีที่เหมาะสมเติมในบทสนทนา',
    questionText: `A: ${scenario.promptTH}\nB: ____ ${scenario.goodAnswerTH.substring(8)}`,
    correctText: correct,
    choices,
  };
};

const makeArrangeOpinion = (scenario) => {
  const correctOrder = ['ตัวเปิดความเห็น', 'เหตุผล', 'สรุป'];
  const allBlocks = ['ตัวเปิดความเห็น', 'เหตุผล', 'คัดง้าง/เงื่อนไข', 'สรุป'];
  const wordBank = shuffle(correctOrder.concat(shuffle(allBlocks).slice(0, 1))).map(t => ({ id: uid(), text: t }));
  return {
    id: `AS_${uid()}`,
    type: QUESTION_TYPES.ARRANGE_SENTENCE,
    instruction: 'เรียงลำดับ "โครงความเห็น" ให้เหมาะสม',
    questionText: scenario.topic,
    correctOrder,
    wordBank,
  };
};

const makeTonePicker = (scenario) => {
  const options = [
    { id: 1, text: 'ส่วนตัวฉันคิดว่า… (กลาง/สุภาพ)', tone: 'neutral' },
    { id: 2, text: 'ก็บอกแล้วไงว่า… (ห้วน/ไม่สุภาพ)', tone: 'casual' },
    { id: 3, text: 'หากพิจารณาโดยรวม… (ทางการ)', tone: 'formal' },
  ];
  const correct = 'neutral';
  return {
    id: `TP_${uid()}`,
    type: QUESTION_TYPES.TONE_PICKER,
    instruction: 'เลือกโทนประโยคที่เหมาะสมกับบริบท',
    questionText: `${scenario.contextTH} (คุยกับหัวหน้า/ลูกค้า)`,
    correctText: options.find(o => o.tone === correct).text,
    choices: shuffle(options),
  };
};

const generateOpinionQuestions = (phrasePool, scenarioPool) => {
  const questions = [];
  for (let i = 0; i < 3 && scenarioPool.length > i; i++) questions.push(makeListenChoose(scenarioPool[i]));
  for (let i = 0; i < 3; i++) questions.push(makeDragMatch(phrasePool));
  for (let i = 0; i < 3 && scenarioPool.length > 3 + i; i++) questions.push(makeFillBlankDialog(scenarioPool[3 + i], phrasePool));
  for (let i = 0; i < 2 && scenarioPool.length > 6 + i; i++) questions.push(makeArrangeOpinion(scenarioPool[6 + i]));
  for (let i = 0; i < 2 && scenarioPool.length > 8 + i; i++) questions.push(makeTonePicker(scenarioPool[8 + i]));
  return shuffle(questions);
};

const checkAnswer = (question, userAnswer) => {
  switch (question.type) {
    case QUESTION_TYPES.LISTEN_CHOOSE:
    case QUESTION_TYPES.FILL_BLANK_DIALOG:
    case QUESTION_TYPES.TONE_PICKER:
      return userAnswer === question.correctText;
    case QUESTION_TYPES.DRAG_MATCH:
      return userAnswer && userAnswer.every(pair => question.leftItems.find(l => l.id === pair.leftId)?.correctMatch === question.rightItems.find(r => r.id === pair.rightId)?.text);
    case QUESTION_TYPES.ARRANGE_SENTENCE:
      return Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(question.correctOrder);
    default:
      return false;
  }
};

const Advanced5OpinionsGame = ({ navigation, route }) => {
  const { lessonId = LESSON_ID, category: routeCategory = CATEGORY, stageTitle = 'แสดงความคิดเห็น (Opinions)', level: stageLevel = 'Advanced', stageSelectRoute = 'LevelStage3' } = route.params || {};
  const { applyDelta, user: progressUser } = useProgress();
  const { stats } = useUnifiedStats();
  const { userData } = useUserData();

  const [phrases, setPhrases] = useState([]);
  const [scenarios, setScenarios] = useState([]);
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
  const [dmPairs, setDmPairs] = useState([]);
  const [selectedTone, setSelectedTone] = useState(null);
  const [arrangeOrder, setArrangeOrder] = useState([]);

  const startTimeRef = useRef(Date.now());
  const answersRef = useRef({});
  const gameFinishedRef = useRef(false);
  const serviceInitRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setPhrases(opinionsPhrasesData);
        setScenarios(opinionsScenariosData);
        const generatedQuestions = generateOpinionQuestions(opinionsPhrasesData, opinionsScenariosData);
        setQuestions(generatedQuestions);
        const savedProgress = await restoreProgress(lessonId);
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
      } catch (error) { console.error('Error loading opinions:', error); setLoading(false); }
    };
    loadData();
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
      await saveProgress(lessonId, { questionsSnapshot: questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, answers: answersRef.current, gameProgress: { generator: 'opinions', lessonId, timestamp: Date.now() } });
    } catch (error) { console.error('Error saving progress:', error); }
  }, [questions, currentIndex, hearts, score, xpEarned, diamondsEarned, streak, maxStreak, lessonId]);

  useEffect(() => {
    if (gameStarted && !gameFinished) autosave();
  }, [currentIndex, hearts, score, streak, gameStarted, gameFinished, autosave]);

  const playTTS = useCallback(async (text) => {
    try { await vaja9TtsService.playThai(text); } catch (error) { console.error('TTS Error:', error); }
  }, []);

  const handleCheckAnswer = () => {
    if (currentAnswer === null && dmPairs.length === 0 && selectedTone === null && arrangeOrder.length === 0) return;
    const currentQuestion = questions[currentIndex];
    let userAnswer = currentAnswer;
    if (currentQuestion.type === QUESTION_TYPES.DRAG_MATCH) userAnswer = dmPairs;
    else if (currentQuestion.type === QUESTION_TYPES.TONE_PICKER) userAnswer = selectedTone;
    else if (currentQuestion.type === QUESTION_TYPES.ARRANGE_SENTENCE) userAnswer = arrangeOrder;

    const isCorrect = checkAnswer(currentQuestion, userAnswer);
    answersRef.current[currentIndex] = { questionId: currentQuestion.id, answer: userAnswer, isCorrect, timestamp: Date.now() };
    setAnswers({ ...answersRef.current });

    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
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

  useEffect(() => {
    setCurrentAnswer(null);
    setDmPairs([]);
    setSelectedTone(null);
    setArrangeOrder([]);
  }, [currentIndex]);

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      finishLesson(elapsed);
    }
  };

  const startGame = () => { setGameStarted(true); setGameFinished(false); gameFinishedRef.current = false; startTimeRef.current = Date.now(); dailyStreakService.startStreak(); };

  const finishLesson = async (timeSpentOverrideSec) => {
    if (gameFinishedRef.current) return;
    gameFinishedRef.current = true;
    setGameFinished(true);
    try {
      const totalQuestions = questions.length;
      const correctAnswers = score;
      const wrongAnswers = Math.max(0, totalQuestions - correctAnswers);
      const accuracyPercent = Math.round((correctAnswers / totalQuestions) * 100);
      const timeSpent = Number.isFinite(timeSpentOverrideSec) ? timeSpentOverrideSec : Math.floor((Date.now() - startTimeRef.current) / 1000);
      const unlockedNext = accuracyPercent >= 70;
      const lastResults = { lessonId, stageTitle, totalQuestions, correctAnswers, wrongAnswers, accuracyPercent, xpEarned, diamondsEarned, heartsRemaining: hearts, timeSpent };
      const progressDelta = { xp: xpEarned, diamonds: diamondsEarned, finishedLesson: true, timeSpentSec: timeSpent, totalCorrectAnswers: correctAnswers, totalWrongAnswers: wrongAnswers, lastGameResults: lastResults };
      try { await applyDelta(progressDelta); } catch (e) { console.warn('applyDelta:', e?.message); }
      const questionTypeCounts = questions.reduce((acc, q) => { acc[q.type] = (acc[q.type] || 0) + 1; return acc; }, {});
      try { await gameProgressService.saveGameSession({ lessonId, category: routeCategory, gameMode: 'opinions_advanced', score: correctAnswers, totalQuestions, correctAnswers, wrongAnswers, accuracy: correctAnswers / totalQuestions, accuracyPercent, timeSpent, xpEarned, diamondsEarned, heartsRemaining: hearts, streak, maxStreak, questionTypes: questionTypeCounts, completedAt: new Date().toISOString() }); } catch (e) { console.warn('saveGameSession:', e?.message); }
      if (unlockedNext) { try { await levelUnlockService.checkAndUnlockNextLevel('level5_advanced', { accuracy: accuracyPercent, score: correctAnswers, attempts: 1 }); } catch (e) { console.warn('checkAndUnlockNextLevel:', e?.message); } }
      try { await clearProgress(lessonId); } catch (e) { console.warn('clearProgress:', e?.message); }
      navigation.replace('LessonComplete', { lessonId, stageTitle, score: correctAnswers, totalQuestions, timeSpent, accuracy: accuracyPercent, accuracyPercent, xpGained: xpEarned, diamondsGained: diamondsEarned, heartsRemaining: hearts, streak, maxStreak, isUnlocked: unlockedNext, stageSelectRoute, questionTypeCounts });
    } catch (error) { console.error('Error finishing lesson:', error); }
  };

  const renderQuestion = () => {
    if (questions.length === 0 || currentIndex >= questions.length) return null;
    const q = questions[currentIndex];
    if ([QUESTION_TYPES.LISTEN_CHOOSE, QUESTION_TYPES.FILL_BLANK_DIALOG, QUESTION_TYPES.TONE_PICKER].includes(q.type)) {
      return (
        <View style={styles.questionCard}>
          <Text style={styles.instruction}>{q.instruction}</Text>
          {q.questionText && <Text style={styles.questionText}>{q.questionText}</Text>}
          {q.audioText && (
            <TouchableOpacity style={styles.speakerButton} onPress={() => playTTS(q.audioText)}>
              <MaterialIcons name="volume-up" size={40} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.choicesContainer}>
            {q.choices.map((choice) => (
              <TouchableOpacity key={choice.id} style={[styles.choiceButton, currentAnswer === choice.text && styles.choiceSelected]} onPress={() => setCurrentAnswer(choice.text)}>
                <Text style={styles.choiceText}>{choice.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    if (q.type === QUESTION_TYPES.DRAG_MATCH) {
      return (
        <View style={styles.questionCard}>
          <Text style={styles.instruction}>{q.instruction}</Text>
          <Text style={styles.hintText}>{getHintText(q.type)}</Text>
          <View style={styles.dragContainer}>
            <View style={styles.leftColumn}>
              {q.leftItems.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.dragItem, dmPairs.some(p => p.leftId === item.id) && styles.dragItemPaired]} onPress={() => {
                  const filtered = dmPairs.filter(p => p.leftId !== item.id);
                  setDmPairs(filtered);
                  setCurrentAnswer(filtered.length > 0 ? filtered : null);
                }}>
                  <Text style={styles.dragItemText}>{item.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.rightColumn}>
              {q.rightItems.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.dragItem, dmPairs.some(p => p.rightId === item.id) && styles.dragItemPaired]} onPress={() => {
                  const existingIndex = dmPairs.findIndex(p => p.rightId === item.id);
                  if (existingIndex >= 0) {
                    const newPairs = dmPairs.filter((_, i) => i !== existingIndex);
                    setDmPairs(newPairs);
                    setCurrentAnswer(newPairs.length > 0 ? newPairs : null);
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
    if (q.type === QUESTION_TYPES.ARRANGE_SENTENCE) {
      return (
        <View style={styles.questionCard}>
          <Text style={styles.instruction}>{q.instruction}</Text>
          <View style={styles.arrangeDisplay}>
            <Text style={styles.arrangeText}>{arrangeOrder.length > 0 ? arrangeOrder.join(' → ') : 'ลากคำเพื่อเรียงลำดับ'}</Text>
          </View>
          <View style={styles.choicesContainer}>
            {q.wordBank.map((word, idx) => (
              <TouchableOpacity key={idx} style={[styles.choiceButton, arrangeOrder.includes(word.text) && styles.choiceSelected]} onPress={() => {
                if (arrangeOrder.includes(word.text)) {
                  setArrangeOrder(arrangeOrder.filter(w => w !== word.text));
                  setCurrentAnswer(arrangeOrder.length > 1 ? arrangeOrder.filter(w => w !== word.text) : null);
                } else {
                  setArrangeOrder([...arrangeOrder, word.text]);
                  setCurrentAnswer([...arrangeOrder, word.text]);
                }
              }}>
                <Text style={styles.choiceText}>{word.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    return null;
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><LottieView source={require('../assets/animations/LoadingCat.json')} autoPlay loop style={{ width: 200, height: 200 }} /><Text style={styles.loadingText}>กำลังโหลด...</Text></View></SafeAreaView>;
  if (!gameStarted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.startContainer}>
          <View style={styles.introCard}>
            <LottieView source={require('../assets/animations/stage_start.json')} autoPlay loop style={styles.introAnim} />
            <Text style={styles.startTitle}>แสดงความคิดเห็น</Text>
            <Text style={styles.startSubtitle}>บทเรียน Advanced</Text>
          </View>
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
            <View style={styles.typePill}><Text style={styles.typePillText}>{getTypeLabel(questions[currentIndex]?.type)}</Text></View>
          </View>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBadge}><LottieView source={require('../assets/animations/Heart.json')} autoPlay loop style={styles.statIcon} /><Text style={styles.statText}>{hearts}</Text></View>
        <View style={styles.statBadge}><LottieView source={require('../assets/animations/Streak-Fire1.json')} autoPlay loop style={styles.statIcon} /><Text style={styles.statText}>{streak}</Text></View>
        <View style={styles.statBadge}><LottieView source={require('../assets/animations/Star.json')} autoPlay loop style={styles.statIcon} /><Text style={styles.statText}>{xpEarned}</Text></View>
        <View style={styles.statBadge}><LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={styles.statIcon} /><Text style={styles.statText}>+{diamondsEarned}</Text></View>
        <View style={styles.statBadge}><Text style={styles.statText}>🎯 {Math.min(100, Math.max(0, Math.round((score / Math.max(1, currentIndex)) * 100)))}%</Text></View>
      </View>
      <ScrollView style={styles.questionScrollView}>{renderQuestion()}</ScrollView>
      <View style={styles.checkContainer}>
        <TouchableOpacity style={[styles.checkButton, (currentAnswer === null && dmPairs.length === 0 && selectedTone === null && arrangeOrder.length === 0) && styles.checkButtonDisabled]} onPress={handleCheckAnswer} disabled={(currentAnswer === null && dmPairs.length === 0 && selectedTone === null && arrangeOrder.length === 0)}>
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
  startButton: { paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, width: 220 },
  startGradient: { width: '100%', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  startButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'rgba(255,255,255,0.92)', borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  backButton: { marginRight: 15 },
  progressContainer: { flex: 1, alignItems: 'center' },
  progressBar: { width: '100%', height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 16, fontWeight: '600', color: COLORS.dark, marginTop: 5 },
  headerMetaRow: { width: '100%', marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typePill: { backgroundColor: COLORS.cream, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#FFE3CC' },
  typePillText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'rgba(255,245,229,0.9)' },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#F2F2F2' },
  statIcon: { width: 18, height: 18 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.dark, marginLeft: 4 },
  questionScrollView: { flex: 1, padding: 20 },
  instruction: { fontSize: 18, fontWeight: '600', color: COLORS.dark, marginBottom: 15, textAlign: 'center' },
  questionText: { fontSize: 16, color: COLORS.gray, marginBottom: 16, textAlign: 'center' },
  hintText: { fontSize: 13, color: '#8A8A8A', textAlign: 'center', marginBottom: 12 },
  speakerButton: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.cream, justifyContent: 'center', alignItems: 'center', marginBottom: 30, borderWidth: 1.5, borderColor: '#FFD8B2' },
  questionCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#F2F2F2' },
  choicesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  choiceButton: { width: '48%', backgroundColor: COLORS.white, paddingVertical: 18, paddingHorizontal: 16, borderRadius: 12, marginBottom: 15, borderWidth: 2, borderColor: COLORS.lightGray },
  choiceSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.cream },
  choiceText: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  dragContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  leftColumn: { flex: 1, marginRight: 10 },
  rightColumn: { flex: 1, marginLeft: 10 },
  dragItem: { backgroundColor: COLORS.white, paddingVertical: 15, paddingHorizontal: 12, borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: COLORS.lightGray },
  dragItemPaired: { borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.08)' },
  dragItemText: { fontSize: 14, fontWeight: '500', color: COLORS.dark },
  arrangeDisplay: { backgroundColor: COLORS.cream, padding: 20, borderRadius: 15, marginBottom: 20 },
  arrangeText: { fontSize: 18, fontWeight: '600', color: COLORS.dark, textAlign: 'center' },
  checkContainer: { padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  checkButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 28, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 },
  checkGradient: { width: '100%', paddingVertical: 16, borderRadius: 28, alignItems: 'center' },
  checkButtonDisabled: { backgroundColor: COLORS.lightGray },
  checkButtonText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, letterSpacing: 0.5 },
});

export default Advanced5OpinionsGame;
