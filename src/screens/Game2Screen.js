import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  Modal,
} from "react-native";
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { awardDiamondsOnce, calculateDiamondReward } from '../services/minigameRewards';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import LottieView from 'lottie-react-native';
import { getByCategory } from '../services/gameVocabService';
import { resolveImage } from '../utils/imageResolver';

const LEVELS = [
  { id: 1, word: "บ้าน", hint: "ที่อยู่อาศัยของคน", image: require("../add/picture/house.png") },
  { id: 2, word: "โรงเรียน", hint: "ที่เรียนหนังสือ", image: require("../add/picture/school.png") },
  { id: 3, word: "โรงพยาบาล", hint: "ที่รักษาคนป่วย", image: require("../add/picture/hospital.png") },
  { id: 4, word: "ตลาด", hint: "ที่ซื้อขายของ", image: require("../add/picture/market.png") },
  { id: 5, word: "ฝน", hint: "น้ำตกจากฟ้า", image: require("../add/picture/rain.png") },
  { id: 6, word: "ร้อน", hint: "อากาศสูง อุณหภูมิสูง", image: require("../add/picture/sun.png") },
  { id: 7, word: "หนาว", hint: "อากาศเย็น", image: require("../add/picture/cold.png") },
  { id: 8, word: "เครื่องบิน", hint: "บินขึ้นฟ้า", image: require("../add/picture/airplane.png") },
  { id: 9, word: "เรือ", hint: "ใช้เดินทางบนแม่น้ำหรือทะเล", image: require("../add/picture/boat.png") },
  { id: 10, word: "แดง", hint: "สีแห่งความรักและความร้อนแรง", image: require("../add/picture/red.png") },
  { id: 11, word: "ฟ้า", hint: "สีแห่งท้องฟ้าและทะเล", image: require("../add/picture/skyblue.png") },
  { id: 12, word: "เขียว", hint: "สีแห่งต้นไม้และธรรมชาติ", image: require("../add/picture/green.png") },
  { id: 13, word: "พ่อ", hint: "ผู้ดูแลและรักเรา", image: require("../add/picture/father.png") },
  { id: 14, word: "แม่", hint: "ผู้ให้กำเนิดเราและดูแลเรา", image: require("../add/picture/mother.png") },
  { id: 15, word: "ข้าว", hint: "อาหารหลักของคนไทย", image: require("../add/picture/rice.png") },
  { id: 16, word: "น้ำ", hint: "ของเหลวที่ดื่มได้ทุกวัน", image: require("../add/picture/water.png") },
];

const shuffleArray = (array) => {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const splitThaiCharacters = (word) => {
  const result = [];
  const consonants = "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ";
  const combining = ["่", "้", "๊", "๋", "ิ", "ี", "ึ", "ื", "ุ", "ู", "ั", "็", "์", "ๅ"];
  const leadingVowels = ["เ", "แ", "โ", "ใ", "ไ"];
  let buffer = "";
  for (let char of word) {
    if (consonants.includes(char)) {
      if (buffer) result.push(buffer);
      buffer = char;
    } else if (combining.includes(char)) {
      buffer += char;
    } else if (leadingVowels.includes(char)) {
      if (buffer) result.push(buffer);
      buffer = char;
    } else {
      if (buffer) result.push(buffer);
      buffer = char;
    }
  }
  if (buffer) result.push(buffer);
  return result;
};

const Game2Screen = ({ route }) => {
  const category = route?.params?.category || 'Animals';
  const { updateFromGameSession } = useUnifiedStats();
  const [currentLevel, setCurrentLevel] = useState(null);
  const [previousId, setPreviousId] = useState(null);
  const [shuffledLetters, setShuffledLetters] = useState([]);
  const [userAnswer, setUserAnswer] = useState([]);
  const [usedIndices, setUsedIndices] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const popupAnim = useRef(new Animated.Value(0)).current;
  const [rewardInfo, setRewardInfo] = useState(null);

  const navigation = useNavigation();

  const [dynamicLevels, setDynamicLevels] = useState(null);
  const loadNewLevel = () => {
    const source = Array.isArray(dynamicLevels) && dynamicLevels.length ? dynamicLevels : LEVELS;
    let next;
    do {
      next = source[Math.floor(Math.random() * source.length)];
    } while (next && next.id === previousId && source.length > 1);

    const splitWord = splitThaiCharacters(next.word);
    setPreviousId(next.id);
    setCurrentLevel(next);
    setUserAnswer([]);
    setUsedIndices([]);
    setShuffledLetters(shuffleArray(splitWord));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const words = await getByCategory(category, { count: 12 });
        if (!mounted) return;
        if (Array.isArray(words) && words.length) {
          const mapped = words.map((w, idx) => ({
            id: idx + 1,
            word: w.thai,
            hint: category,
            image: resolveImage(w.thai, category)
          }));
          setDynamicLevels(mapped);
        } else {
          setDynamicLevels(null);
        }
      } catch (_) {
        setDynamicLevels(null);
      } finally {
        loadNewLevel();
      }
    })();
    return () => { mounted = false; };
  }, [category]);

  const handleLetterPress = (letter, index) => {
    if (usedIndices.includes(index)) return;
    const splitWord = splitThaiCharacters(currentLevel.word);
    if (userAnswer.length < splitWord.length) {
      setUserAnswer((prev) => [...prev, letter]);
      setUsedIndices((prev) => [...prev, index]);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleDelete = () => {
    if (userAnswer.length > 0) {
      setUserAnswer((prev) => prev.slice(0, -1));
      setUsedIndices((prev) => prev.slice(0, -1));
    }
  };

  const checkAnswer = () => {
    const splitWord = splitThaiCharacters(currentLevel.word);
    const correct = userAnswer.join("") === splitWord.join("");
    setIsCorrect(correct);
    setModalVisible(true);
    popupAnim.setValue(0);
    Animated.spring(popupAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();

    if (correct) {
      setScore((prev) => prev + 10);
      const reward = calculateDiamondReward({
        difficulty: 'Easy',
        metrics: {
          score: score + 10,
          scoreTarget: 10 * splitWord.length,
          accuracy: 100,
          timeUsed: 0,
          timeTarget: 0,
          maxCombo: 0,
        }
      });
      setRewardInfo(reward);
    } else {
      setScore((prev) => Math.max(prev - 5, 0));
    }
  };

  const handleNext = () => {
    Animated.timing(popupAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      loadNewLevel();
    });
  };

  if (!currentLevel) return null;
  const splitWord = splitThaiCharacters(currentLevel.word);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* ปุ่มออก */}
        <TouchableOpacity style={styles.exitButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="times" size={24} color="#fff" />
        </TouchableOpacity>

        {/* หัวข้อ */}
        <Text style={styles.title}>ช่วยแมวน้อยเรียงคำ</Text>

        {/* 🏆 กล่องคะแนน (อยู่ใต้หัวข้อ ตรงกลาง) */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreIcon}>🏆</Text>
          <Text style={styles.scoreText}>คะแนน: {score}</Text>
        </View>

        {/* รูปภาพ */}
        <Image source={currentLevel.image} style={styles.image} resizeMode="contain" />

        {/* คำใบ้ */}
        <View style={styles.hintBox}>
          <Text style={styles.hintIcon}>💡</Text>
          <Text style={styles.hint}>{currentLevel.hint}</Text>
        </View>

        {/* กล่องคำตอบ */}
        <View style={styles.answerWrapper}>
          <Text style={styles.answerLabel}>คำตอบของคุณ</Text>
          <View style={styles.answerContainer}>
            {splitWord.map((_, index) => (
              <Animated.View key={index} style={[styles.answerBox, { transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.answerText}>{userAnswer[index] || ""}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ตัวอักษรให้เลือก */}
        <View style={styles.lettersWrapper}>
          <Text style={styles.lettersLabel}>เลือกตัวอักษร:</Text>
          <View style={styles.lettersContainer}>
            {shuffledLetters.map((letter, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.letterButton, usedIndices.includes(index) && styles.letterButtonDisabled]}
                onPress={() => handleLetterPress(letter, index)}
                disabled={usedIndices.includes(index)}
              >
                <Text style={[styles.letterText, usedIndices.includes(index) && styles.letterTextDisabled]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ปุ่มควบคุม */}
        <View style={styles.controlContainer}>
          <TouchableOpacity style={[styles.controlButton, styles.deleteButton]} onPress={handleDelete}>
            <FontAwesome name="trash" size={20} color="#fff" />
            <Text style={styles.controlText}>ลบ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.checkButton]} onPress={checkAnswer}>
            <FontAwesome name="check" size={20} color="#fff" />
            <Text style={styles.controlText}>ตรวจ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal แจ้งผล */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] },
            ]}
          >
            <Text style={styles.modalEmoji}>{isCorrect ? "🎉" : "😿"}</Text>
            <Text style={styles.modalTitle}>{isCorrect ? "เก่งมาก! ถูกต้องแล้ว!" : "ยังไม่ถูก ลองอีกทีนะ!"}</Text>
            <Text style={styles.modalWord}>
              {isCorrect ? `คำตอบคือ "${currentLevel.word}"` : `ดูคำใบ้อีกครั้งสิ 😺`}
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: isCorrect ? "#34D399" : "#FF6B9D" }]}
              onPress={async () => {
                if (isCorrect) {
                  const sessionId = String(Date.now());
                  const result = await awardDiamondsOnce({
                    gameId: 'word-scramble',
                    difficulty: 'Easy',
                    sessionId,
                    metrics: {
                      score,
                      scoreTarget: 10 * splitWord.length,
                      accuracy: 100,
                      timeUsed: 0,
                      timeTarget: 0,
                      maxCombo: 0,
                    },
                  });
                  if (result && result.diamonds > 0) {
                    try {
                      await updateFromGameSession({
                        gameType: 'minigame-word-scramble',
                        diamondsEarned: result.diamonds,
                        xpEarned: 0,
                        timeSpent: 0,
                        accuracy: 100,
                        correctAnswers: splitWord.length,
                        wrongAnswers: 0,
                        totalQuestions: splitWord.length,
                      });
                    } catch (_) {}
                  }
                  handleNext();
                } else {
                  setModalVisible(false);
                }
              }}
            >
              {isCorrect && rewardInfo ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={{ width: 24, height: 24, marginRight: 6 }} />
                  <Text style={styles.modalButtonText}>+{rewardInfo.diamonds} ด่านต่อไป 🚀</Text>
                </View>
              ) : (
                <Text style={styles.modalButtonText}>{isCorrect ? 'ด่านต่อไป 🚀' : 'ลองอีกครั้ง 💪'}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbd7e1ff" },
  scrollContent: { flexGrow: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40, alignItems: "center" },

  exitButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 20,
    backgroundColor: "#42d1fdff",
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6BF3FF",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },

  // 🏆 กล่องคะแนน (อยู่ตรงกลางใต้หัวข้อ)
  scoreContainer: {
    marginTop: -10,
    marginBottom: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee558ff",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#FFB300",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  scoreIcon: { fontSize: 26, color: "#FF6B9D", marginRight: 10 },
  scoreText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },

  title: {
    fontSize: 30,
    marginBottom: 25,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFFFFF",
    backgroundColor: "#B877FD",
    paddingHorizontal: 50,
    paddingVertical: 22,
    borderRadius: 60,
    shadowColor: "#7C3AED",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ rotate: "-1.5deg" }],
  },

  image: { width: 250, height: 250, marginBottom: 35 },
  hintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderRadius: 28,
    marginBottom: 35,
    borderWidth: 4,
    borderColor: "#34D399",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  hintIcon: { fontSize: 34, marginRight: 16 },
  hint: { fontSize: 20, color: "#1F2937", fontWeight: "700", flex: 1, lineHeight: 28 },

  answerWrapper: { width: "100%", alignItems: "center", marginBottom: 45 },
  answerLabel: { fontSize: 26, fontWeight: "800", color: "#b133f9ff", marginBottom: 22 },
  answerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    minHeight: 110,
    paddingHorizontal: 12,
  },
  answerBox: {
    width: 75,
    height: 75,
    marginHorizontal: 7,
    marginVertical: 7,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 4,
    borderColor: "#FBBF24",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  answerText: { fontSize: 40, fontWeight: "900", color: "#FF6B9D" },

  lettersWrapper: { width: "100%", alignItems: "center", marginBottom: 35 },
  lettersLabel: { fontSize: 26, fontWeight: "900", color: "#34c791ff", marginBottom: 22 },
  lettersContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", paddingHorizontal: 12 },

  letterButton: {
    backgroundColor: "#34D399",
    margin: 7,
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderRadius: 22,
    minWidth: 65,
    minHeight: 65,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  letterButtonDisabled: { backgroundColor: "#D1D5DB", opacity: 0.45 },
  letterText: { fontSize: 32, color: "#FFFFFF", fontWeight: "900" },
  letterTextDisabled: { color: "#9CA3AF" },

  controlContainer: { flexDirection: "row", marginTop: 35, gap: 22, justifyContent: "center" },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    paddingHorizontal: 38,
    borderRadius: 35,
    minWidth: 160,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  deleteButton: { backgroundColor: "#FF6B9D", shadowColor: "#F43F5E" },
  checkButton: { backgroundColor: "#d9ee1aff", shadowColor: "#bac00fff" },
  controlText: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", marginLeft: 8 },

  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    padding: 35,
    borderRadius: 30,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  modalEmoji: { fontSize: 60, marginBottom: 10 },
  modalTitle: { fontSize: 28, fontWeight: "600", marginBottom: 15, textAlign: "center" },
  modalWord: { fontSize: 22, marginBottom: 25, color: "#4B5563", textAlign: "center" },
  modalButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: "#c51919ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalButtonText: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
});

export default Game2Screen;
