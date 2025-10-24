import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { awardDiamondsOnce, calculateDiamondReward } from '../services/minigameRewards';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';

const { width } = Dimensions.get('window');

const SpeedTypingScreen = () => {
  const navigation = useNavigation();
  const { updateFromGameSession } = useUnifiedStats();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);

  const inputRef = useRef(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  // Sample word list
  const wordList = [
    { word: 'บ้าน', hint: 'ที่อยู่อาศัย' },
    { word: 'โรงเรียน', hint: 'สถานที่เรียนหนังสือ' },
    { word: 'ตลาด', hint: 'ที่ซื้อขายของ' },
    { word: 'ฝน', hint: 'น้ำตกจากฟ้า' },
    { word: 'ร้อน', hint: 'อากาศสูง' },
    { word: 'หนาว', hint: 'อากาศเย็น' },
    { word: 'แดง', hint: 'สีแห่งความรัก' },
    { word: 'ฟ้า', hint: 'สีของท้องฟ้า' },
    { word: 'เขียว', hint: 'สีของต้นไม้' },
    { word: 'พ่อ', hint: 'ผู้ดูแลลูก (ผู้ชาย)' },
    { word: 'แม่', hint: 'ผู้ให้กำเนิด' },
    { word: 'ข้าว', hint: 'อาหารหลักของคนไทย' },
    { word: 'น้ำ', hint: 'ดื่มทุกวัน' },
    { word: 'เรือ', hint: 'ใช้เดินทางในน้ำ' },
    { word: 'เครื่องบิน', hint: 'บินบนท้องฟ้า' },
    { word: 'รถ', hint: 'ยานพาหนะบนถนน' },
    { word: 'หมา', hint: 'สัตว์เลี้ยงที่ซื่อสัตย์' },
    { word: 'แมว', hint: 'สัตว์เลี้ยงที่น่ารัก' },
    { word: 'ดอกไม้', hint: 'สวยงามและมีกลิ่นหอม' },
    { word: 'ต้นไม้', hint: 'ให้ร่มเงาและออกซิเจน' },
  ];

  const currentWord = wordList[currentWordIndex];
  const totalWords = wordList.length;

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      setShowResult(true);
      calculateFinalStats();
    }
  }, [timeLeft, gameOver]);

  // Auto-focus input
  useEffect(() => {
    if (!gameOver) {
      inputRef.current?.focus();
    }
  }, [currentWordIndex, gameOver]);

  const calculateFinalStats = () => {
    const timeUsed = 60 - timeLeft;
    const wpmValue = correctCount / (timeUsed / 60);
    const accuracyValue = correctCount > 0 ? (correctCount / (correctCount + (currentWordIndex - correctCount))) * 100 : 0;
    
    setWpm(Math.round(wpmValue));
    setAccuracy(Math.round(accuracyValue));
    // Reward preview
    const reward = calculateDiamondReward({
      difficulty: 'Hard',
      metrics: {
        timeUsed,
        timeTarget: 45,
        score,
        scoreTarget: 50 * 20, // per correct 50, 20 words
        accuracy: accuracyValue,
        maxCombo,
      }
    });
    setRewardInfo(reward);
  };

  const handleInputChange = (text) => {
    if (isProcessing) return;
    setUserInput(text);
    
    // Real-time feedback
    if (text === currentWord.word) {
      handleCorrectAnswer();
    }
  };

  const handleCorrectAnswer = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    setScore(prev => prev + 50 + (combo * 10));
    setCombo(prev => {
      const newCombo = prev + 1;
      setMaxCombo(prevMax => Math.max(prevMax, newCombo));
      return newCombo;
    });
    setCorrectCount(prev => prev + 1);
    setUserInput('');
    
    // Show success animation
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      // Move to next word after animation
      if (currentWordIndex < totalWords - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        // All words completed
        setGameOver(true);
        setShowResult(true);
        calculateFinalStats();
      }
      setIsProcessing(false);
    });
  };

  const checkAnswer = () => {
    if (isProcessing) return;
    
    if (userInput === currentWord.word) {
      handleCorrectAnswer();
    } else {
      setCombo(0);
      setUserInput('');
      
      // Show error shake animation
      Animated.sequence([
        Animated.timing(successAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(successAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(successAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(successAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  };

  const restartGame = () => {
    setCurrentWordIndex(0);
    setUserInput('');
    setTimeLeft(60);
    setScore(0);
    setCorrectCount(0);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setShowResult(false);
    setWpm(0);
    setAccuracy(0);
    setIsProcessing(false);
    setRewardInfo(null);
  };

  const getInputStyle = () => {
    if (userInput === currentWord.word) {
      return styles.inputCorrect;
    } else if (currentWord.word.startsWith(userInput) && userInput !== '') {
      return styles.inputPartial;
    } else if (userInput !== '' && !currentWord.word.startsWith(userInput)) {
      return styles.inputWrong;
    }
    return styles.input;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ef4444" />
      
      {/* Header */}
      <LinearGradient
        colors={['#ef4444', '#f87171']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="times" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>⚡ Speed Typing ⚡</Text>
            <Text style={styles.headerSubtitle}>พิมพ์คำศัพท์ให้เร็วที่สุด</Text>
          </View>
          
          <View style={styles.headerStats}>
            <View style={styles.timerBadge}>
              <FontAwesome name="clock-o" size={18} color="#fff" />
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>🏆 {score}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Game Area */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Current Word Display */}
        <Animated.View style={[styles.wordCard, { transform: [{ translateX: successAnim }] }]}>
          <Text style={styles.wordLabel}>คำที่ต้องพิมพ์:</Text>
          <Text style={styles.targetWord}>{currentWord.word}</Text>
          <Text style={styles.wordHint}>💡 {currentWord.hint}</Text>
        </Animated.View>

        {/* Input Area */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>พิมพ์คำตอบ:</Text>
          <TextInput
            ref={inputRef}
            style={getInputStyle()}
            value={userInput}
            onChangeText={handleInputChange}
            onSubmitEditing={checkAnswer}
            placeholder="พิมพ์ที่นี่..."
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            editable={!gameOver}
          />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            คำที่ทำได้: {correctCount} / {totalWords}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(correctCount / totalWords) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Combo Indicator */}
        {combo >= 3 && (
          <Animated.View style={styles.comboIndicator}>
            <Text style={styles.comboText}>🔥 COMBO x{combo}!</Text>
          </Animated.View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>💡 วิธีเล่น</Text>
          <Text style={styles.instructionsText}>
            • พิมพ์คำที่แสดงให้ถูกต้อง{'\n'}
            • พิมพ์ให้เร็วที่สุดเพื่อได้คะแนนสูง{'\n'}
            • ทำต่อเนื่องเพื่อได้คอมโบ!
          </Text>
        </View>
      </ScrollView>

      {/* Result Modal */}
      <Modal transparent visible={showResult} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Animated.View style={styles.modalContainer}>
            <LottieView 
              source={require('../assets/animations/Trophy.json')} 
              autoPlay 
              loop={false}
              style={styles.trophyAnimation}
            />
            <Text style={styles.modalTitle}>⚡ เกมจบแล้ว!</Text>
            
            <View style={styles.resultsCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>คะแนนรวม:</Text>
                <Text style={styles.resultValue}>{score}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>คำถูก:</Text>
                <Text style={styles.resultValue}>{correctCount}/{totalWords}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>ความแม่นยำ:</Text>
                <Text style={styles.resultValue}>{accuracy}%</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>คอมโบสูงสุด:</Text>
                <Text style={styles.resultValue}>🔥 x{maxCombo}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>WPM:</Text>
                <Text style={styles.resultValue}>{wpm}</Text>
              </View>
            </View>

              {rewardInfo && (
                <View style={[styles.resultsCard, { marginTop: 6, alignItems: 'center' }]}> 
                  <LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={{ width: 36, height: 36 }} />
                  <View style={[styles.resultRow, { width: '100%' }]}>
                    <Text style={styles.resultLabel}>รางวัลเพชร:</Text>
                    <Text style={styles.resultValue}>+{rewardInfo.diamonds}</Text>
                  </View>
                </View>
              )}

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#ef4444' }]}
                onPress={async () => {
                  const sessionId = String(Date.now());
                  const metrics = {
                    timeUsed: 60 - timeLeft,
                    timeTarget: 45,
                    score,
                    scoreTarget: 50 * 20,
                    accuracy,
                    maxCombo,
                  };
                  const result = await awardDiamondsOnce({
                    gameId: 'speed-typing',
                    difficulty: 'Hard',
                    sessionId,
                    metrics,
                  });
                  if (result && result.diamonds > 0) {
                    try {
                      await updateFromGameSession({
                        gameType: 'minigame-speed-typing',
                        diamondsEarned: result.diamonds,
                        xpEarned: 0,
                        timeSpent: metrics.timeUsed,
                        accuracy: metrics.accuracy,
                        correctAnswers: correctCount,
                        wrongAnswers: Math.max(currentWordIndex - correctCount, 0),
                        totalQuestions: totalWords,
                      });
                    } catch (_) {}
                  }
                  restartGame();
                }}
              >
                <FontAwesome name="refresh" size={18} color="#fff" />
                <Text style={styles.buttonText}>เล่นอีกครั้ง</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#667eea' }]}
                onPress={async () => {
                  const sessionId = String(Date.now());
                  const metrics = {
                    timeUsed: 60 - timeLeft,
                    timeTarget: 45,
                    score,
                    scoreTarget: 50 * 20,
                    accuracy,
                    maxCombo,
                  };
                  const result = await awardDiamondsOnce({
                    gameId: 'speed-typing',
                    difficulty: 'Hard',
                    sessionId,
                    metrics,
                  });
                  if (result && result.diamonds > 0) {
                    try {
                      await updateFromGameSession({
                        gameType: 'minigame-speed-typing',
                        diamondsEarned: result.diamonds,
                        xpEarned: 0,
                        timeSpent: metrics.timeUsed,
                        accuracy: metrics.accuracy,
                        correctAnswers: correctCount,
                        wrongAnswers: Math.max(currentWordIndex - correctCount, 0),
                        totalQuestions: totalWords,
                      });
                    } catch (_) {}
                  }
                  navigation.navigate('Minigame');
                }}
              >
                <FontAwesome name="home" size={18} color="#fff" />
                <Text style={styles.buttonText}>กลับเมนู</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef3c7',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  headerStats: {
    flexDirection: 'row',
    gap: 15,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 6,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  wordLabel: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 10,
  },
  targetWord: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  wordHint: {
    fontSize: 16,
    color: '#8b5cf6',
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#e5e7eb',
  },
  inputCorrect: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: '#d1fae5',
    padding: 20,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#10b981',
  },
  inputPartial: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: '#fef3c7',
    padding: 20,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#fbbf24',
  },
  inputWrong: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: '#fee2e2',
    padding: 20,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#ef4444',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  comboIndicator: {
    backgroundColor: '#fbbf24',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  comboText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  trophyAnimation: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  resultsCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 25,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SpeedTypingScreen;
