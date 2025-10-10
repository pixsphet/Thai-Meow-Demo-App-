import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { vowelToImage } from '../assets/vowels/map';

const ThaiVowelsGame = ({ navigation }) => {
  const { theme } = useTheme();
  const { addXP, addHearts, addDiamonds } = useProgress();
  
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [gameMode, setGameMode] = useState('matching');

  // Thai vowels data
  const vowels = [
    { thai: 'ะ', roman: 'a', meaning: 'short a', example: 'มะ' },
    { thai: 'า', roman: 'aa', meaning: 'long a', example: 'มา' },
    { thai: 'ิ', roman: 'i', meaning: 'short i', example: 'มิ' },
    { thai: 'ี', roman: 'ii', meaning: 'long i', example: 'มี' },
    { thai: 'ุ', roman: 'u', meaning: 'short u', example: 'มุ' },
    { thai: 'ู', roman: 'uu', meaning: 'long u', example: 'มู' },
    { thai: 'เ', roman: 'e', meaning: 'short e', example: 'เม' },
    { thai: 'แ', roman: 'ae', meaning: 'short ae', example: 'แม' },
    { thai: 'โ', roman: 'o', meaning: 'short o', example: 'โม' },
    { thai: 'ใ', roman: 'ai', meaning: 'ai', example: 'ใม' },
  ];

  const [currentVowel, setCurrentVowel] = useState(vowels[0]);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setHearts(5);
    setSelectedAnswer(null);
  };

  const handleAnswer = (isCorrect) => {
    if (isCorrect) {
      setScore(score + 10);
      addXP(10);
      // Move to next vowel
      const nextIndex = vowels.findIndex(v => v.thai === currentVowel.thai) + 1;
      if (nextIndex < vowels.length) {
        setCurrentVowel(vowels[nextIndex]);
        setCurrentLevel(nextIndex + 1);
        setSelectedAnswer(null);
      } else {
        // Game completed
        Alert.alert('ยินดีด้วย!', 'คุณเรียนสระครบแล้ว!', [
          { text: 'เล่นใหม่', onPress: () => startGame() },
          { text: 'กลับหน้าหลัก', onPress: () => navigation.navigate('HomeMain') }
        ]);
      }
    } else {
      setHearts(hearts - 1);
      if (hearts <= 1) {
        Alert.alert('เกมจบ!', `คะแนน: ${score}`, [
          { text: 'เล่นใหม่', onPress: () => startGame() },
          { text: 'กลับหน้าหลัก', onPress: () => navigation.navigate('HomeMain') }
        ]);
      }
    }
  };

  const GameModeButton = ({ mode, title, icon, colors, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.gameModeButton}>
      <LinearGradient colors={colors} style={styles.gameModeGradient}>
        <MaterialCommunityIcons name={icon} size={32} color="white" />
        <Text style={styles.gameModeTitle}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (!gameStarted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>สระไทย</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              เรียนรู้สระพื้นฐาน 32 ตัว
            </Text>
          </View>

          <View style={styles.gameModes}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>เลือกโหมดเกม</Text>
            
            <GameModeButton
              mode="matching"
              title="จับคู่"
              icon="puzzle"
              colors={['#4ECDC4', '#6BCF7F']}
              onPress={() => {
                setGameMode('matching');
                startGame();
              }}
            />
            
            <GameModeButton
              mode="multiple-choice"
              title="เลือกคำตอบ"
              icon="format-list-bulleted"
              colors={['#FF6B6B', '#FF8E8E']}
              onPress={() => {
                setGameMode('multiple-choice');
                startGame();
              }}
            />
            
            <GameModeButton
              mode="fill-blank"
              title="เติมคำ"
              icon="pencil"
              colors={['#FFD93D', '#FFA726']}
              onPress={() => {
                setGameMode('fill-blank');
                startGame();
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.gameHeader}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <LottieView
              source={require('../assets/animations/Heart.json')}
              autoPlay
              loop
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{hearts}</Text>
          </View>
          
          <View style={styles.statItem}>
            <LottieView
              source={require('../assets/animations/Star.json')}
              autoPlay
              loop
              style={styles.statIcon}
            />
            <Text style={styles.statValue}>{score}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.levelText}>Level {currentLevel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.gameContent}>
        <View style={styles.vowelCard}>
          {vowelToImage[currentVowel.thai] && (
            <View style={styles.vowelImageContainer}>
              <Image source={vowelToImage[currentVowel.thai]} style={styles.vowelImage} />
            </View>
          )}
          <Text style={styles.vowelThai}>{currentVowel.thai}</Text>
          <Text style={styles.vowelRoman}>{currentVowel.roman}</Text>
          <Text style={styles.vowelMeaning}>{currentVowel.meaning}</Text>
          <Text style={styles.vowelExample}>ตัวอย่าง: {currentVowel.example}</Text>
        </View>

        <View style={styles.gameButtons}>
          <TouchableOpacity
            style={[styles.gameButton, styles.correctButton]}
            onPress={() => handleAnswer(true)}
          >
            <Text style={styles.buttonText}>ถูกต้อง</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.gameButton, styles.incorrectButton]}
            onPress={() => handleAnswer(false)}
          >
            <Text style={styles.buttonText}>ผิด</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  gameModes: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameModeButton: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  gameModeGradient: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  gameModeTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  gameHeader: {
    padding: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 30,
    height: 30,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  gameContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  vowelCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  vowelImageContainer: {
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vowelImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  vowelThai: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 20,
  },
  vowelRoman: {
    fontSize: 24,
    color: '#666',
    marginBottom: 10,
  },
  vowelMeaning: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    marginBottom: 10,
  },
  vowelExample: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  gameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gameButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  correctButton: {
    backgroundColor: '#4CAF50',
  },
  incorrectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ThaiVowelsGame;