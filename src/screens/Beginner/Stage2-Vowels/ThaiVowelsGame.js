import React, { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    Dimensions, 
    Image,
    ScrollView
} from 'react-native'; 	
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../services/apiClient';
import { saveAutosnap, loadAutosnap, clearAutosnap, saveProgress } from '../../../services/progressService';
import { useProgress } from '../../../contexts/ProgressContext';
import vaja9TtsService from '../../../services/vaja9TtsService';
import levelUnlockService from '../../../services/levelUnlockService';
import { useUserData } from '../../../contexts/UserDataContext';
import { useUnifiedStats } from '../../../contexts/UnifiedStatsContext';
import { useUser } from '../../../contexts/UserContext';
import realProgressService from '../../../services/realProgressService';
import realUserStatsService from '../../../services/realUserStatsService';
import { vowelToImage } from '../../../assets/vowels/map';

const { width } = Dimensions.get('window');

// Helper functions
const uid = () => Math.random().toString(36).substr(2, 9);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 16 Thai Vowels Dataset for Stage 2
const THAI_VOWELS = [
  { char: 'ะ', roman: 'a', meaning: 'สระอะ', name: 'อะ', example: 'มะ' },
  { char: 'า', roman: 'aa', meaning: 'สระอา', name: 'อา', example: 'มา' },
  { char: 'ิ', roman: 'i', meaning: 'สระอิ', name: 'อิ', example: 'มิ' },
  { char: 'ี', roman: 'ii', meaning: 'สระอี', name: 'อี', example: 'มี' },
  { char: 'ุ', roman: 'u', meaning: 'สระอุ', name: 'อุ', example: 'มุ' },
  { char: 'ู', roman: 'uu', meaning: 'สระอู', name: 'อู', example: 'มู' },
  { char: 'เ', roman: 'e', meaning: 'สระเอ', name: 'เอ', example: 'เม' },
  { char: 'แ', roman: 'ae', meaning: 'สระแอ', name: 'แอ', example: 'แม' },
  { char: 'โ', roman: 'o', meaning: 'สระโอ', name: 'โอ', example: 'โม' },
  { char: 'ใ', roman: 'ai', meaning: 'สระใอ', name: 'ใอ', example: 'ใม' },
  { char: 'ไ', roman: 'ai', meaning: 'สระไอ', name: 'ไอ', example: 'ไม' },
  { char: 'อ', roman: 'o', meaning: 'สระออ', name: 'ออ', example: 'มอ' },
  { char: 'เอ', roman: 'e', meaning: 'สระเอ', name: 'เอ', example: 'เม' },
  { char: 'เออ', roman: 'er', meaning: 'สระเออ', name: 'เออ', example: 'เมอ' },
  { char: 'เอา', roman: 'ao', meaning: 'สระเอา', name: 'เอา', example: 'เมา' },
  { char: 'อำ', roman: 'am', meaning: 'สระอำ', name: 'อำ', example: 'มำ' },
];

// Question Generation Functions
const generateVowelQuestions = (lessonId = 2) => {
  const vowels = lessonId === 2 ? THAI_VOWELS : shuffle(THAI_VOWELS).slice(0, 12);
  const questions = [];
  
  vowels.forEach((vowel, index) => {
    // DRAG_MATCH (60% weight)
    if (Math.random() < 0.6) {
      questions.push(makeDragMatch(vowel, vowels));
    }
    // PICTURE_MATCH (20% weight)
    else if (Math.random() < 0.8) {
      questions.push(makePictureMatch(vowel, vowels));
    }
    // LISTEN_CHOOSE (20% weight)
    else {
      questions.push(makeListenChoose(vowel, vowels));
    }
  });
  
  return shuffle(questions).slice(0, 16);
};

const makeDragMatch = (vowel, pool) => {
  const isMeaningToVowel = Math.random() < 0.5;
  const selectedVowels = shuffle(pool).slice(0, 4);
  
  if (isMeaningToVowel) {
    return {
      id: `drag_meaning_${vowel.char}_${uid()}`,
      type: 'DRAG_MATCH',
      instruction: 'จับคู่ความหมายกับตัวสระ',
      questionText: `จับคู่ความหมายกับตัวสระ`,
      leftItems: selectedVowels.map((v, i) => ({ id: i + 1, text: v.meaning })),
      rightItems: selectedVowels.map((v, i) => ({ id: i + 1, text: v.char })),
      correctPairs: selectedVowels.map((v, i) => ({ left: i + 1, right: i + 1 })),
      vowelChar: vowel.char,
    };
  } else {
    return {
      id: `drag_vowel_${vowel.char}_${uid()}`,
      type: 'DRAG_MATCH',
      instruction: 'จับคู่ตัวสระกับความหมาย',
      questionText: `จับคู่ตัวสระกับความหมาย`,
      leftItems: selectedVowels.map((v, i) => ({ id: i + 1, text: v.char })),
      rightItems: selectedVowels.map((v, i) => ({ id: i + 1, text: v.meaning })),
      correctPairs: selectedVowels.map((v, i) => ({ left: i + 1, right: i + 1 })),
      vowelChar: vowel.char,
    };
  }
};

const makePictureMatch = (vowel, pool) => {
  const selectedVowels = shuffle(pool).slice(0, 4);
  const imagePath = vowelToImage[vowel.char];
  
  return {
    id: `picture_${vowel.char}_${uid()}`,
    type: 'PICTURE_MATCH',
    instruction: 'เลือกตัวสระที่ตรงกับภาพ',
    questionText: `เลือกตัวสระที่ตรงกับภาพ`,
    imagePath,
    choices: selectedVowels.map(v => ({
      id: v.char,
      text: v.char,
      isCorrect: v.char === vowel.char
    })),
    correctAnswer: vowel.char,
    vowelChar: vowel.char,
  };
};

const makeListenChoose = (vowel, pool) => {
  const selectedVowels = shuffle(pool).slice(0, 4);
  
  return {
    id: `listen_${vowel.char}_${uid()}`,
    type: 'LISTEN_CHOOSE',
    instruction: 'ฟังเสียงแล้วเลือกตัวสระที่ถูกต้อง',
    questionText: `ฟังเสียงแล้วเลือกตัวสระที่ถูกต้อง`,
    audioText: vowel.name,
    choices: selectedVowels.map(v => ({
      id: v.char,
      text: v.char,
      isCorrect: v.char === vowel.char
    })),
    correctAnswer: vowel.char,
    vowelChar: vowel.char,
  };
};

// Drag Match Component
const DragMatchComponent = ({ data, onAnswer, isCorrect, userAnswer }) => {
  const [connections, setConnections] = useState({});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);

  const handleLeftPress = (item) => {
    if (selectedLeft === item.id) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(item.id);
      if (selectedRight) {
        handleConnection(item.id, selectedRight);
      }
    }
  };

  const handleRightPress = (item) => {
    if (selectedRight === item.id) {
      setSelectedRight(null);
    } else {
      setSelectedRight(item.id);
      if (selectedLeft) {
        handleConnection(selectedLeft, item.id);
      }
    }
  };

  const handleConnection = (leftId, rightId) => {
    const newConnections = { ...connections, [leftId]: rightId };
    setConnections(newConnections);
    setSelectedLeft(null);
    setSelectedRight(null);
    
    // Check if all pairs are correct
    const allCorrect = data.correctPairs.every(pair => 
      newConnections[pair.left] === pair.right
    );
    
    if (allCorrect && Object.keys(newConnections).length === data.correctPairs.length) {
      onAnswer(true);
    }
  };

  return (
    <View style={styles.dragMatchContainer}>
      <Text style={styles.instructionText}>{data.instruction}</Text>
      
      <View style={styles.dragMatchArea}>
        <View style={styles.leftColumn}>
          {data.leftItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dragItem,
                selectedLeft === item.id && styles.selectedItem,
                connections[item.id] && styles.connectedItem
              ]}
              onPress={() => handleLeftPress(item)}
            >
              <Text style={styles.dragItemText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.rightColumn}>
          {data.rightItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dragItem,
                selectedRight === item.id && styles.selectedItem,
                Object.values(connections).includes(item.id) && styles.connectedItem
              ]}
              onPress={() => handleRightPress(item)}
            >
              <Text style={styles.dragItemText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// Picture Match Component
const PictureMatchComponent = ({ data, onAnswer, isCorrect, userAnswer }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleChoice = (choice) => {
    setSelectedChoice(choice.id);
    onAnswer(choice.isCorrect);
  };

  return (
    <View style={styles.pictureMatchContainer}>
      <Text style={styles.instructionText}>{data.instruction}</Text>
      
      {data.imagePath && (
        <View style={styles.imageContainer}>
          <Image source={data.imagePath} style={styles.questionImage} />
        </View>
      )}
      
      <View style={styles.choicesContainer}>
        {data.choices.map((choice) => (
          <TouchableOpacity
            key={choice.id}
            style={[
              styles.choiceButton,
              selectedChoice === choice.id && styles.selectedChoice,
              isCorrect !== null && choice.isCorrect && styles.correctChoice,
              isCorrect !== null && selectedChoice === choice.id && !choice.isCorrect && styles.incorrectChoice
            ]}
            onPress={() => handleChoice(choice)}
            disabled={isCorrect !== null}
          >
            <Text style={styles.choiceText}>{choice.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Listen Choose Component
const ListenChooseComponent = ({ data, onAnswer, isCorrect, userAnswer }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);

  const handleChoice = (choice) => {
    setSelectedChoice(choice.id);
    onAnswer(choice.isCorrect);
  };

  const playAudio = async () => {
    try {
      await vaja9TtsService.playThai(data.audioText);
    } catch (error) {
      console.log('TTS Error:', error);
    }
  };

  return (
    <View style={styles.listenChooseContainer}>
      <Text style={styles.instructionText}>{data.instruction}</Text>
      
      <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
        <FontAwesome name="volume-up" size={20} color="#fff" />
        <Text style={styles.audioButtonText}>เล่นเสียง</Text>
      </TouchableOpacity>
      
      <View style={styles.choicesContainer}>
        {data.choices.map((choice) => (
          <TouchableOpacity
            key={choice.id}
            style={[
              styles.choiceButton,
              selectedChoice === choice.id && styles.selectedChoice,
              isCorrect !== null && choice.isCorrect && styles.correctChoice,
              isCorrect !== null && selectedChoice === choice.id && !choice.isCorrect && styles.incorrectChoice
            ]}
            onPress={() => handleChoice(choice)}
            disabled={isCorrect !== null}
          >
            <Text style={styles.choiceText}>{choice.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Main ThaiVowelsGame Component
const ThaiVowelsGame = ({ navigation, route }) => {
  const { lessonId = 2, category = 'vowels_basic', vowelType = 'basic' } = route.params || {};
  
  // Progress context
  const { applyDelta, getTotalXP } = useProgress();
  
  // Use the enhanced real-time user data sync system
  const { stats, updateUserStats, forcePull, flushQueue, error: syncError } = useUserData();
  
  // Use unified stats for real-time updates
  const { 
    xp, diamonds, hearts: unifiedHearts, level, streak, 
    updateStats, updateFromGameSession, forceRefresh 
  } = useUnifiedStats();
  
  // Get user from context
  const { user } = useUser();
  
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null); 
  const [isCorrect, setIsCorrect] = useState(null); 
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(unifiedHearts || 5);
  const [perVowel, setPerVowel] = useState({});
  const [vowelData, setVowelData] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState({});
  const [syncStatus, setSyncStatus] = useState('connected'); // connected, syncing, offline, error
  
  // Monitor sync status
  useEffect(() => {
    if (syncError) {
      setSyncStatus('error');
    } else if (stats) {
      setSyncStatus('connected');
    }
  }, [syncError, stats]);

  // Sync hearts from unified stats
  useEffect(() => {
    if (unifiedHearts !== undefined) {
      setHearts(unifiedHearts);
    }
  }, [unifiedHearts]);

  // ข้อมูลความคืบหน้าแบบละเอียด
  const [gameProgress, setGameProgress] = useState({
    startTime: Date.now(),
    endTime: null,
    totalQuestions: 0,
    completedQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timePerQuestion: [],
    questionTypes: {},
    accuracy: 0,
    totalTimeSpent: 0,
    streak: 0,
    maxStreak: 0,
    xpEarned: 0,
    diamondsEarned: 0,
    level: 1,
    achievements: []
  });

  const currentQuestion = questions[currentQuestIndex];
  
  const answersRef = useRef({});
  const startTimeRef = useRef(Date.now());
  const questionStartTimeRef = useRef(Date.now());
  const progressAnimationRef = useRef(new Animated.Value(0));

  // Load game data and questions
  useEffect(() => {
    const loadGameData = async () => {
      try {
        setLoading(true);
        
        // Initialize real progress service
        await realProgressService.initialize(user?.id || '68e6550e9b2f55ba8bead565');
        
        // Generate questions based on lessonId
        const generatedQuestions = generateVowelQuestions(lessonId);
        setQuestions(generatedQuestions);
        setVowelData(THAI_VOWELS);
        
        // Try to load saved progress from real service
        const savedProgress = await realProgressService.loadProgressSnapshot(lessonId);
        if (savedProgress) {
          setCurrentQuestIndex(savedProgress.currentIndex || 0);
          setScore(savedProgress.score || 0);
          setHearts(savedProgress.hearts || 5);
          setPerVowel(savedProgress.perVowel || {});
          answersRef.current = savedProgress.answers || {};
          console.log('📱 Loaded saved progress from real service:', savedProgress);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading game data:', error);
        setLoading(false);
      }
    };

    loadGameData();
  }, [lessonId]);

  // Autosave progress with real service
  useEffect(() => {
    const autosave = async () => {
      if (questions.length > 0) {
        const progressData = {
          currentIndex: currentQuestIndex,
          answers: answersRef.current,
          score,
          hearts,
          xp: xp || 0,
          diamonds: diamonds || 0,
          timeSpent: Date.now() - startTimeRef.current,
          accuracy: questions.length > 0 ? (score / (questions.length * 10)) * 100 : 0,
          isCompleted: false
        };
        
        try {
          await realProgressService.saveProgressSnapshot(lessonId, progressData);
          console.log('💾 Progress autosaved with real service');
        } catch (error) {
          console.error('Error autosaving with real service:', error);
        }
      }
    };

    autosave();
  }, [currentQuestIndex, score, hearts, questions.length, xp, diamonds]);

  // Update game progress
  const updateGameProgress = (questionResult) => {
    const currentTime = Date.now();
    const questionTime = currentTime - questionStartTimeRef.current;
    
    setGameProgress(prev => {
      const newProgress = { ...prev };
      
      newProgress.completedQuestions += 1;
      newProgress.timePerQuestion.push(questionTime);
      
      if (questionResult.isCorrect) {
        newProgress.correctAnswers += 1;
        newProgress.streak += 1;
        newProgress.maxStreak = Math.max(newProgress.maxStreak, newProgress.streak);
        newProgress.xpEarned += questionResult.xp || 10;
        
        let diamonds = 1;
        if (newProgress.streak >= 3) diamonds += 1;
        if (newProgress.streak >= 5) diamonds += 1;
        if (newProgress.streak >= 10) diamonds += 2;
        
        newProgress.diamondsEarned += diamonds;
      } else {
        newProgress.wrongAnswers += 1;
        newProgress.streak = 0;
      }
      
      const questionType = questionResult.questionType || 'unknown';
      newProgress.questionTypes[questionType] = (newProgress.questionTypes[questionType] || 0) + 1;
      
      newProgress.accuracy = (newProgress.correctAnswers / newProgress.completedQuestions) * 100;
      newProgress.totalTimeSpent = currentTime - newProgress.startTime;
      newProgress.level = Math.floor(newProgress.xpEarned / 100) + 1;
      
      return newProgress;
    });
    
    questionStartTimeRef.current = currentTime;
  };

  // Handle answer check
  const handleCheckAnswer = () => {
    if (userAnswer === null) return;
    
    const correct = userAnswer === true;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 10);
      // Update real-time stats: +10 XP, +1 streak, +1 diamond
      updateStats({ xp: 10, streak: 1, diamonds: 1 });
      updateGameProgress({ isCorrect: true, xp: 10, questionType: currentQuestion?.type });
    } else {
      const newHearts = Math.max(0, hearts - 1);
      setHearts(newHearts);
      // Update real-time stats: -1 heart, reset streak
      updateStats({ hearts: -1, streak: 0 });
      updateGameProgress({ isCorrect: false, questionType: currentQuestion?.type });
    }
  };

  // Handle continue to next question
  const handleContinue = () => {
    if (currentQuestIndex < questions.length - 1) {
      setCurrentQuestIndex(prev => prev + 1);
      setUserAnswer(null);
      setIsCorrect(null);
    } else {
      // Game finished
      finishLesson();
    }
  };

  // Finish lesson
  const finishLesson = async (timeSpentSec = 0) => {
    const xpGained = score;
    const diamondsGained = Math.max(2, Math.floor(score / 50));
    const accuracy = questions.length > 0 ? Math.round((score / (questions.length * 10)) * 100) : 0;
    
    // Save final results with real service
    try {
      const finalResults = {
        finalScore: xpGained,
        accuracy: accuracy,
        timeSpent: timeSpentSec,
        xpEarned: xpGained,
        diamondsEarned: diamondsGained,
        heartsRemaining: hearts,
        totalQuestions: questions.length,
        correctAnswers: Math.round((accuracy / 100) * questions.length),
        wrongAnswers: questions.length - Math.round((accuracy / 100) * questions.length)
      };
      
      await realProgressService.saveFinalResults(lessonId, finalResults);
      console.log('✅ Final results saved with real service');
    } catch (error) {
      console.error('❌ Error saving final results:', error);
    }

    // Update unified stats
    try {
      await updateFromGameSession({
        xpEarned: xpGained,
        diamondsEarned: diamondsGained,
        heartsRemaining: hearts,
        accuracy: accuracy,
        timeSpent: timeSpentSec,
        correctAnswers: Math.round((accuracy / 100) * questions.length),
        wrongAnswers: questions.length - Math.round((accuracy / 100) * questions.length)
      });
      console.log('✅ Unified stats updated');
    } catch (error) {
      console.error('❌ Error updating unified stats:', error);
    }

    // Clear progress snapshot
    try {
      await realProgressService.clearProgressSnapshot(lessonId);
      console.log('🗑️ Progress snapshot cleared');
    } catch (error) {
      console.error('❌ Error clearing progress snapshot:', error);
    }
    
    // Navigate to completion screen
    navigation.replace('LessonComplete', {
      score: xpGained,
      totalQuestions: questions.length,
      accuracy,
      timeSpent: timeSpentSec,
      xpGained,
      diamondsGained,
      gameType: 'ThaiVowelsGame'
    });
  };

  // Update vowel mastery
  const updateVowelMastery = (char, correct) => {
    setPerVowel(prev => ({
      ...prev,
      [char]: {
        ...prev[char],
        total: (prev[char]?.total || 0) + 1,
        correct: (prev[char]?.correct || 0) + (correct ? 1 : 0),
        accuracy: ((prev[char]?.correct || 0) + (correct ? 1 : 0)) / ((prev[char]?.total || 0) + 1) * 100
      }
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../../assets/animations/LoadingCat.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showSummary) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#FF8C00', '#FFA500']} style={styles.container}>
          <View style={styles.summaryContainer}>
            <LottieView
              source={require('../../../assets/animations/Success.json')}
              autoPlay
              loop
              style={styles.summaryAnimation}
            />
            <Text style={styles.summaryTitle}>ยินดีด้วย!</Text>
            <Text style={styles.summarySubtitle}>คุณเรียนสระไทยเสร็จแล้ว</Text>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>คะแนน</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round((score / (questions.length * 10)) * 100)}%</Text>
                <Text style={styles.statLabel}>ความแม่นยำ</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.floor(score / 50)}</Text>
                <Text style={styles.statLabel}>เพชร</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>ต่อไป</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>ไม่พบคำถาม</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FF8C00', '#FFA500']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>สระไทย - ด่านที่ 2</Text>
            <Text style={styles.headerSubtitle}>คำถาม {currentQuestIndex + 1} จาก {questions.length}</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.statsContainer}>
              <View style={styles.heartsContainer}>
                <LottieView
                  source={require('../../../assets/animations/Heart.json')}
                  autoPlay
                  loop
                  style={styles.heartAnimation}
                />
                <Text style={styles.heartsText}>{hearts}</Text>
              </View>
              <View style={styles.xpContainer}>
                <Text style={styles.xpText}>XP: {xp || 0}</Text>
                <View style={[styles.syncIndicator, { backgroundColor: 
                  syncStatus === 'connected' ? '#4CAF50' : 
                  syncStatus === 'syncing' ? '#FF9800' : 
                  syncStatus === 'offline' ? '#9E9E9E' : '#F44336'
                }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: `${((currentQuestIndex + 1) / questions.length) * 100}%`
                }
              ]}
            />
          </View>
        </View>

        {/* Question Content */}
        <ScrollView style={styles.questionContainer} showsVerticalScrollIndicator={false}>
          {currentQuestion.type === 'DRAG_MATCH' && (
            <DragMatchComponent
              data={currentQuestion}
              onAnswer={(correct) => {
                setUserAnswer(correct);
                updateVowelMastery(currentQuestion.vowelChar, correct);
              }}
              isCorrect={isCorrect}
              userAnswer={userAnswer}
            />
          )}
          
          {currentQuestion.type === 'PICTURE_MATCH' && (
            <PictureMatchComponent
              data={currentQuestion}
              onAnswer={(correct) => {
                setUserAnswer(correct);
                updateVowelMastery(currentQuestion.vowelChar, correct);
              }}
              isCorrect={isCorrect}
              userAnswer={userAnswer}
            />
          )}
          
          {currentQuestion.type === 'LISTEN_CHOOSE' && (
            <ListenChooseComponent
              data={currentQuestion}
              onAnswer={(correct) => {
                setUserAnswer(correct);
                updateVowelMastery(currentQuestion.vowelChar, correct);
              }}
              isCorrect={isCorrect}
              userAnswer={userAnswer}
            />
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {isCorrect === null ? (
            <TouchableOpacity 
              style={[styles.actionButton, userAnswer === null && styles.disabledButton]} 
              onPress={handleCheckAnswer}
              disabled={userAnswer === null}
            >
              <Text style={styles.actionButtonText}>ตรวจคำตอบ</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={handleContinue}>
              <Text style={styles.actionButtonText}>
                {currentQuestIndex < questions.length - 1 ? 'ต่อไป' : 'เสร็จสิ้น'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Feedback Bar */}
        {isCorrect !== null && (
          <View style={[styles.feedbackBar, isCorrect ? styles.correctFeedback : styles.incorrectFeedback]}>
            <Text style={styles.feedbackText}>
              {isCorrect ? 'ถูกต้อง!' : 'ไม่ถูกต้อง ลองใหม่'}
            </Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  heartAnimation: {
    width: 24,
    height: 24,
    marginRight: 5,
  },
  heartsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  xpContainer: {
    alignItems: 'center',
  },
  xpText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  syncIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  dragMatchContainer: {
    flex: 1,
  },
  dragMatchArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  leftColumn: {
    flex: 1,
    marginRight: 10,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 10,
  },
  dragItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#FFE0B2',
  },
  connectedItem: {
    backgroundColor: '#C8E6C9',
  },
  dragItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pictureMatchContainer: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  questionImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  listenChooseContainer: {
    flex: 1,
  },
  audioButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    marginVertical: 20,
  },
  audioButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  choicesContainer: {
    marginTop: 20,
  },
  choiceButton: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedChoice: {
    backgroundColor: '#FFE0B2',
  },
  correctChoice: {
    backgroundColor: '#C8E6C9',
  },
  incorrectChoice: {
    backgroundColor: '#FFCDD2',
  },
  choiceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackBar: {
    padding: 15,
    alignItems: 'center',
  },
  correctFeedback: {
    backgroundColor: '#4CAF50',
  },
  incorrectFeedback: {
    backgroundColor: '#F44336',
  },
  feedbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  summarySubtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 30,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ThaiVowelsGame;
