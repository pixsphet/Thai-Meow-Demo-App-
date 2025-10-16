import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useProgress } from '../contexts/ProgressContext';
import { useUser } from '../contexts/UserContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { fetchLesson3Content, submitLesson3Result } from '../services/lesson3Service';
import { saveProgress, restoreProgress, clearProgress } from '../services/progressService';
import vaja9TtsService from '../services/vaja9TtsService';
import levelUnlockService from '../services/levelUnlockService';
import gameProgressService from '../services/gameProgressService';

const { width } = Dimensions.get('window');

const MINI_GAME_ORDER = [
  'LISTEN_CHOOSE',
  'MATCH_MEANING',
  'ARRANGE_SENTENCE',
  'PICTURE_MATCH',
  'SOUND_GROUP',
];

const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 6,
};

const shuffle = (array = []) => [...array].sort(() => Math.random() - 0.5);

const ListenChooseGame = ({ data, onAnswerChange, userAnswer, locked }) => {
  const handlePlay = () => {
    try {
      vaja9TtsService.playThai(data.audioText || data.correctAnswer);
    } catch (error) {
      console.warn('TTS error:', error?.message);
    }
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>ฟังเสียงแล้วเลือกคำที่ถูกต้อง</Text>
      <TouchableOpacity style={styles.audioButton} onPress={handlePlay}>
        <FontAwesome name="volume-up" size={20} color="#fff" />
        <Text style={styles.audioButtonText}>เล่นเสียง</Text>
      </TouchableOpacity>
      <Text style={styles.subText}>{data.prompt}</Text>
      <View style={styles.choiceGrid}>
        {data.choices.map((choice) => (
          <TouchableOpacity
            key={choice}
            style={[
              styles.choiceButton,
              userAnswer === choice && styles.choiceSelected,
            ]}
            onPress={() => onAnswerChange(choice)}
            disabled={locked}
          >
            <Text style={styles.choiceText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const MatchMeaningGame = ({ data, onAnswerChange, userAnswer, locked }) => (
  <View style={styles.gameCard}>
    <Text style={styles.gameTitle}>จับคู่ความหมาย</Text>
    <Text style={styles.questionHighlight}>{data.thai}</Text>
    <Text style={styles.subText}>คำนี้หมายความว่าอะไร?</Text>
    <View style={styles.choiceGrid}>
      {data.choices.map((choice) => (
        <TouchableOpacity
          key={choice}
          style={[
            styles.choiceButton,
            userAnswer === choice && styles.choiceSelected,
          ]}
          onPress={() => onAnswerChange(choice)}
          disabled={locked}
        >
          <Text style={styles.choiceText}>{choice}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const ArrangeSentenceGame = ({ data, onAnswerChange, userAnswer = [], locked }) => {
  const [selected, setSelected] = useState(userAnswer);

  useEffect(() => {
    setSelected(userAnswer);
  }, [data.id]);

  useEffect(() => {
    setSelected(userAnswer);
  }, [userAnswer]);

  const handleSelect = (word) => {
    if (locked) return;
    if (selected.includes(word)) return;
    const next = [...selected, word];
    setSelected(next);
    onAnswerChange(next);
  };

  const handleRemove = (index) => {
    if (locked) return;
    const next = selected.filter((_, i) => i !== index);
    setSelected(next);
    onAnswerChange(next);
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>เรียงประโยคให้ถูกต้อง</Text>
      <Text style={styles.subText}>{data.hint}</Text>
      <View style={styles.arrangedRow}>
        {selected.length === 0 ? (
          <Text style={styles.placeholder}>แตะคำด้านล่างเพื่อเริ่มเรียง</Text>
        ) : (
          selected.map((word, index) => (
            <TouchableOpacity
              key={`${word}-${index}`}
              style={[styles.arrangedWord, locked && styles.disabled]}
              onPress={() => handleRemove(index)}
              disabled={locked}
            >
              <Text style={styles.arrangedWordText}>{word}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      <View style={styles.wordBank}>
        {data.wordBank.map((word) => (
          <TouchableOpacity
            key={word}
            style={[
              styles.wordToken,
              selected.includes(word) && styles.wordTokenUsed,
            ]}
            onPress={() => handleSelect(word)}
            disabled={selected.includes(word) || locked}
          >
            <Text style={styles.wordTokenText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const PictureMatchGame = ({ data, onAnswerChange, userAnswer, locked }) => (
  <View style={styles.gameCard}>
    <Text style={styles.gameTitle}>จับคู่คำกับรูป</Text>
    <Text style={styles.emojiDisplay}>{data.emoji}</Text>
    <Text style={styles.subText}>{data.prompt}</Text>
    <View style={styles.choiceGrid}>
      {data.choices.map((choice) => (
        <TouchableOpacity
          key={choice}
          style={[
            styles.choiceButton,
            userAnswer === choice && styles.choiceSelected,
          ]}
          onPress={() => onAnswerChange(choice)}
          disabled={locked}
        >
          <Text style={styles.choiceText}>{choice}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const SoundGroupGame = ({ data, onAnswerChange, userAnswer, locked }) => {
  const handlePlay = () => {
    try {
      vaja9TtsService.playThai(data.audio);
    } catch (error) {
      console.warn('TTS error:', error?.message);
    }
  };

  return (
    <View style={styles.gameCard}>
      <Text style={styles.gameTitle}>โทนเสียง / กิริยาสุภาพ</Text>
      <TouchableOpacity style={styles.audioButton} onPress={handlePlay}>
        <FontAwesome name="play" size={18} color="#fff" />
        <Text style={styles.audioButtonText}>ฟังประโยค</Text>
      </TouchableOpacity>
      <Text style={styles.subText}>เลือกกลุ่มการพูดที่ตรงกับเสียงที่ได้ยิน</Text>
      <View style={styles.choiceColumn}>
        {data.choices.map((choice) => (
          <TouchableOpacity
            key={choice}
            style={[
              styles.choiceRow,
              userAnswer === choice && styles.choiceRowSelected,
            ]}
            onPress={() => onAnswerChange(choice)}
            disabled={locked}
          >
            <Text
              style={[
                styles.choiceRowText,
                userAnswer === choice && { color: '#fff' },
              ]}
            >
              {choice}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const lessonFallbackWord = {
  id: 'fallback_hello',
  thai: 'สวัสดี',
  english: 'hello',
  emoji: '👋',
  audio: 'สวัสดี',
};

const buildMiniGames = (content) => {
  const words = shuffle(content.words || []);
  const sentences = shuffle(content.sentences || []);
  const soundGroups = shuffle(content.soundGroups || []);

  const listenWord = words[0] || lessonFallbackWord;
  const matchWord = words[1] || listenWord;
  const pictureWord = words[2] || listenWord;
  const extraChoices = (excludeId) =>
    shuffle(words.filter((w) => w.id !== excludeId)).slice(0, 3);

  const listenGame = {
    id: `listen_${listenWord.id}`,
    type: 'LISTEN_CHOOSE',
    correctAnswer: listenWord.thai,
    audioText: listenWord.audio || listenWord.thai,
    prompt: listenWord.english,
    choices: shuffle([listenWord, ...extraChoices(listenWord.id)]).map(
      (item) => item.thai
    ),
  };

  const matchGame = {
    id: `match_${matchWord.id}`,
    type: 'MATCH_MEANING',
    thai: matchWord.thai,
    correctAnswer: matchWord.english,
    choices: shuffle([matchWord, ...extraChoices(matchWord.id)]).map(
      (item) => item.english
    ),
  };

  const sentence = sentences[0] || {
    id: 'fallback_sentence',
    parts: ['ฉัน', 'สบายดี', 'ครับ'],
    hint: 'เรียงประโยคแนะนำตัวง่ายๆ',
  };
  const arrangeGame = {
    id: `arrange_${sentence.id}`,
    type: 'ARRANGE_SENTENCE',
    correctAnswer: sentence.parts,
    wordBank: shuffle([
      ...sentence.parts,
      ...shuffle(['นะ', 'แล้ว', 'วันนี้']).slice(0, 2),
    ]),
    hint: sentence.hint || sentence.english,
  };

  const pictureGame = {
    id: `picture_${pictureWord.id}`,
    type: 'PICTURE_MATCH',
    emoji: pictureWord.emoji || '🎯',
    prompt: pictureWord.english,
    correctAnswer: pictureWord.thai,
    choices: shuffle([pictureWord, ...extraChoices(pictureWord.id)]).map(
      (item) => item.thai
    ),
  };

  const soundGameSource = soundGroups[0] || {
    id: 'fallback_sound',
    audio: 'สวัสดีครับ',
    correct: 'สุภาพชาย',
    choices: ['สุภาพชาย', 'สุภาพหญิง', 'กันเอง'],
  };
  const soundGame = {
    id: `sound_${soundGameSource.id}`,
    type: 'SOUND_GROUP',
    audio: soundGameSource.audio,
    correctAnswer: soundGameSource.correct,
    choices: soundGameSource.choices,
  };

  return [listenGame, matchGame, arrangeGame, pictureGame, soundGame];
};

const evaluateAnswer = (question, answer) => {
  if (question.type === 'ARRANGE_SENTENCE') {
    const joined = Array.isArray(answer) ? answer.join(' ') : '';
    const correct = question.correctAnswer.join(' ');
    return {
      correct: joined === correct,
      correctAnswer: question.correctAnswer,
    };
  }

  return {
    correct: answer === question.correctAnswer,
    correctAnswer: question.correctAnswer,
  };
};

const Lesson3Game = ({ navigation, route, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [xpEarned, setXpEarned] = useState(0);
  const [diamondsEarned, setDiamondsEarned] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const startTimeRef = useRef(Date.now());
  const { userProgress, applyDelta } = useProgress();
  const { user } = useUser();
  const { hearts: globalHearts } = useUnifiedStats();
  const initialHeartsRef = useRef(null);

  const totalRounds = questions.length || MINI_GAME_ORDER.length;
  const currentQuestion = questions[currentIndex];
  const userAnswer = answers[currentQuestion?.id];
  const isAnswered = Boolean(results[currentQuestion?.id]);

  const embedded = typeof onClose === 'function';

  useFocusEffect(
    useCallback(() => {
      if (embedded) {
        return undefined;
      }
      navigation
        ?.getParent()
        ?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation?.getParent()?.setOptions({ height: 80 });
      };
    }, [navigation, embedded])
  );

  const persistProgress = useCallback(
    async (overrides = {}) => {
      try {
        const snapshot = {
          lessonId: 'lesson3',
          currentIndex,
          answers,
          results,
          hearts,
          xpEarned,
          diamondsEarned,
          total: totalRounds,
          initialHearts: initialHeartsRef.current ?? hearts,
          questionsSnapshot: questions.map((q) => ({
            id: q.id,
            type: q.type,
            correctAnswer: q.correctAnswer,
          })),
          ...overrides,
        };
        await saveProgress('lesson3', snapshot);
      } catch (error) {
        console.warn('Failed to save progress:', error?.message);
      }
    },
    [currentIndex, answers, results, hearts, xpEarned, diamondsEarned, totalRounds, questions]
  );

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        initialHeartsRef.current = null;
        const lessonContent = await fetchLesson3Content();
        const builtQuestions = buildMiniGames(lessonContent);
        setQuestions(builtQuestions);

        const restored = await restoreProgress('lesson3');
        if (restored && restored.questionsSnapshot) {
          setAnswers(restored.answers || {});
          setResults(restored.results || {});
          setCurrentIndex(
            Math.min(restored.currentIndex || 0, builtQuestions.length - 1)
          );
          const restoredHearts = restored.hearts ?? hearts;
          setHearts(restoredHearts);
          if (initialHeartsRef.current === null) {
            initialHeartsRef.current =
              restored.initialHearts ?? restoredHearts;
          }
          setXpEarned(restored.xpEarned || 0);
          setDiamondsEarned(restored.diamondsEarned || 0);
        } else {
          const startingHearts = Math.max(
            1,
            Math.min(
              userProgress?.hearts ?? globalHearts ?? 5,
              userProgress?.maxHearts ?? 5
            )
          );
          setHearts(startingHearts);
          if (initialHeartsRef.current === null) {
            initialHeartsRef.current = startingHearts;
          }
        }

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        Alert.alert('เกิดข้อผิดพลาด', error?.message || 'ไม่สามารถโหลดบทเรียนได้');
      } finally {
        setLoading(false);
        startTimeRef.current = Date.now();
      }
    };

    loadContent();
  }, []);

  const handleAnswerChange = (value) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleCheck = async () => {
    if (!currentQuestion) return;
    if (
      currentQuestion.type === 'ARRANGE_SENTENCE' &&
      (!Array.isArray(userAnswer) ||
        userAnswer.length !== currentQuestion.correctAnswer.length)
    ) {
      Alert.alert('ยังไม่ครบ', 'เรียงให้ครบทุกคำก่อนตรวจคำตอบนะ');
      return;
    }
    if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
      Alert.alert('ยังไม่ได้เลือกคำตอบ', 'กรุณาเลือกคำตอบก่อนตรวจสอบ');
      return;
    }

    const evaluation = evaluateAnswer(currentQuestion, userAnswer);
    setResults((prev) => ({
      ...prev,
      [currentQuestion.id]: evaluation,
    }));

    if (!evaluation.correct) {
      setHearts((prev) => Math.max(0, prev - 1));
    } else {
      setXpEarned((prev) => prev + 25);
    }

    await persistProgress({
      results: {
        ...results,
        [currentQuestion.id]: evaluation,
      },
      answers: {
        ...answers,
        [currentQuestion.id]: userAnswer,
      },
      hearts: evaluation.correct ? hearts : Math.max(0, hearts - 1),
      xpEarned: evaluation.correct ? xpEarned + 25 : xpEarned,
    });
  };

  const moveNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < totalRounds) {
      setCurrentIndex(nextIndex);
      await persistProgress({ currentIndex: nextIndex });
    } else {
      await finalizeLesson();
    }
  };

  const correctCount = useMemo(() => {
    return Object.values(results).filter((r) => r?.correct).length;
  }, [results]);

  const accuracyPercent = totalRounds
    ? Math.round((correctCount / totalRounds) * 100)
    : 0;

  const passed = accuracyPercent >= 70;

  const finalizeLesson = async () => {
    try {
      const spent = Math.round((Date.now() - startTimeRef.current) / 1000);
      setTimeSpent(spent);
      const diamonds = passed ? 3 : correctCount >= 3 ? 2 : 1;
      setDiamondsEarned(diamonds);
      setShowSummary(true);

      await clearProgress('lesson3');

      if (user?.id) {
        await lesson3FinalizeRemote({
          diamonds,
          accuracyPercent,
          spent,
        });
      }
    } catch (error) {
      console.warn('Failed to finalize lesson:', error?.message);
    }
  };

  const lesson3FinalizeRemote = async ({ diamonds, accuracyPercent, spent }) => {
    try {
      if (!user?.id) return;
      if (levelUnlockService.userId !== user.id) {
        await levelUnlockService.initialize(user.id);
      }
      if (gameProgressService.userId !== user.id) {
        await gameProgressService.initialize(user.id);
      }

      const payload = {
        userId: user.id,
        lessonId: 'lesson3',
        accuracy: accuracyPercent,
        xpEarned: xpEarned,
        diamondsEarned: diamonds,
        heartsRemaining: hearts,
        timeSpentSec: spent,
        unlockedNext: passed,
      };

      await submitLesson3Result(payload);

      await applyDelta({
        xp: xpEarned,
        diamonds,
        hearts: hearts - (initialHeartsRef.current ?? hearts),
        finishedLesson: true,
        totalCorrectAnswers: correctCount,
        totalWrongAnswers: totalRounds - correctCount,
        totalTimeSpent: spent,
        lastGameResults: {
          lessonId: 'lesson3',
          gameType: 'Lesson3Game',
          correct: correctCount,
          total: totalRounds,
          accuracy: accuracyPercent,
          diamondsEarned: diamonds,
          heartsRemaining: hearts,
          xpEarned,
          completedAt: new Date().toISOString(),
        },
      });

      await gameProgressService.saveGameSession({
        lessonId: 'lesson3',
        category: 'greetings',
        score: correctCount,
        accuracyPercent,
        timeSpent: spent,
        questionTypes: MINI_GAME_ORDER.reduce((map, type) => {
          map[type] = 1;
          return map;
        }, {}),
        heartsRemaining: hearts,
        diamondsEarned: diamonds,
        xpEarned,
        totalQuestions: totalRounds,
        correctAnswers: correctCount,
        wrongAnswers: totalRounds - correctCount,
      });

      if (passed) {
        await levelUnlockService.checkAndUnlockNextLevel('level3', {
          accuracy: accuracyPercent,
          score: correctCount,
          attempts: 1,
        });
      }
    } catch (error) {
      console.warn('Failed to sync lesson 3 result:', error?.message);
    }
  };

  const resetLesson = async () => {
    await clearProgress('lesson3');
    setAnswers({});
    setResults({});
    setCurrentIndex(0);
    setXpEarned(0);
    setDiamondsEarned(0);
    const resetHearts = Math.max(
      1,
      Math.min(
        userProgress?.hearts ?? globalHearts ?? 5,
        userProgress?.maxHearts ?? 5
      )
    );
    setHearts(resetHearts);
    initialHeartsRef.current = resetHearts;
    setShowSummary(false);
    startTimeRef.current = Date.now();
  };

  const renderGame = () => {
    if (!currentQuestion) return null;
    const commonProps = {
      data: currentQuestion,
      onAnswerChange: handleAnswerChange,
      userAnswer,
      locked: isAnswered,
    };

    switch (currentQuestion.type) {
      case 'LISTEN_CHOOSE':
        return <ListenChooseGame {...commonProps} />;
      case 'MATCH_MEANING':
        return <MatchMeaningGame {...commonProps} />;
      case 'ARRANGE_SENTENCE':
        return <ArrangeSentenceGame {...commonProps} />;
      case 'PICTURE_MATCH':
        return <PictureMatchGame {...commonProps} />;
      case 'SOUND_GROUP':
        return <SoundGroupGame {...commonProps} />;
      default:
        return null;
    }
  };

  const renderActionButton = () => {
    if (!isAnswered) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, SHADOW]}
          onPress={handleCheck}
        >
          <Text style={styles.actionButtonText}>ตรวจคำตอบ</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.actionButtonSecondary, SHADOW]}
        onPress={moveNext}
      >
        <Text style={styles.actionButtonText}>
          {currentIndex + 1 === totalRounds ? 'สรุปผล' : 'มินิเกมถัดไป'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.loadingText}>กำลังเตรียมบทเรียน...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF8C00', '#FF6B35']} style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (embedded && onClose) {
              onClose();
            } else {
              navigation?.goBack?.();
            }
          }}
          style={styles.backButton}
        >
          <FontAwesome name="chevron-left" size={18} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Lesson 3 · คำทักทาย</Text>
          <Text style={styles.headerSubtitle}>
            มินิเกม {currentIndex + 1} จาก {totalRounds}
          </Text>
        </View>
        <View style={styles.heartsContainer}>
          <Text style={styles.heartsLabel}>❤️ {hearts}</Text>
          <Text style={styles.streakLabel}>XP {xpEarned}</Text>
        </View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.body,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.scrollInner} bounces={false}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentIndex + 1) / totalRounds) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            Mini-Game {currentIndex + 1} of {totalRounds}
          </Text>
          {renderGame()}
        </ScrollView>

        <View style={styles.actionBar}>{renderActionButton()}</View>
      </Animated.View>

      <Modal visible={showSummary} transparent animationType="fade">
        <View style={styles.summaryOverlay}>
          <View style={[styles.summaryCard, SHADOW]}>
            <LottieView
              source={
                passed
                  ? require('../assets/animations/Trophy.json')
                  : require('../assets/animations/Error animation.json')
              }
              autoPlay
              loop={false}
              style={styles.summaryAnimation}
            />
            <Text style={styles.summaryTitle}>
              {passed ? 'ยอดเยี่ยม! ปลดล็อกบทถัดไป 🎉' : 'ยังไม่ผ่าน ลองใหม่อีกครั้ง'}
            </Text>
            <View style={styles.summaryStats}>
              <SummaryRow label="ความแม่นยำ" value={`${accuracyPercent}%`} />
              <SummaryRow label="XP ที่ได้รับ" value={xpEarned} />
              <SummaryRow label="เพชร" value={diamondsEarned} />
              <SummaryRow label="หัวใจคงเหลือ" value={hearts} />
              <SummaryRow label="เวลาที่ใช้" value={`${timeSpent} วินาที`} />
            </View>
            <TouchableOpacity
              style={[styles.actionButton, SHADOW, { marginTop: 20 }]}
              onPress={() => {
              setShowSummary(false);
              if (embedded && onClose) {
                onClose();
              } else {
                navigation?.goBack?.();
              }
            }}
          >
              <Text style={styles.actionButtonText}>กลับหน้าบทเรียน</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButtonSecondaryAlt, { marginTop: 12 }]}
              onPress={resetLesson}
            >
              <Text style={styles.actionButtonSecondaryText}>เล่นซ้ำอีกครั้ง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const SummaryRow = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
  heartsContainer: {
    alignItems: 'flex-end',
  },
  heartsLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  streakLabel: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  body: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  scrollInner: {
    paddingBottom: 120,
  },
  progressBar: {
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
  },
  progressLabel: {
    marginTop: 8,
    fontWeight: '600',
    color: '#FF6B35',
    textAlign: 'center',
  },
  gameCard: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...SHADOW,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  subText: {
    marginTop: 12,
    color: '#666',
  },
  audioButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 8,
  },
  audioButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  questionHighlight: {
    fontSize: 32,
    textAlign: 'center',
    marginTop: 18,
    color: '#FF6B35',
    fontWeight: '700',
  },
  choiceGrid: {
    marginTop: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  choiceButton: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
  },
  choiceSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  arrangedRow: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    marginTop: 20,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  placeholder: {
    color: '#aaa',
  },
  arrangedWord: {
    backgroundColor: '#FFECB3',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  arrangedWordText: {
    fontWeight: '600',
    color: '#7A4E0B',
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  wordToken: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  wordTokenUsed: {
    opacity: 0.3,
  },
  wordTokenText: {
    color: '#333',
    fontWeight: '500',
  },
  emojiDisplay: {
    fontSize: 72,
    textAlign: 'center',
    marginVertical: 16,
  },
  choiceColumn: {
    marginTop: 18,
    gap: 12,
  },
  choiceRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
  },
  choiceRowSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  choiceRowText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    width: width - 48,
  },
  actionButtonSecondary: {
    backgroundColor: '#FF8C00',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  summaryAnimation: {
    width: 140,
    height: 140,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
  },
  summaryStats: {
    width: '100%',
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryValue: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  actionButtonSecondaryAlt: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  actionButtonSecondaryText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Lesson3Game;
