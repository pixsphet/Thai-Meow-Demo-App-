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
import apiClient from '../services/apiClient';
import { saveAutosnap, loadAutosnap, clearAutosnap, saveProgress } from '../services/progressService';
import { useProgress } from '../contexts/ProgressContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import vaja9TtsService from '../services/vaja9TtsService';
import levelUnlockService from '../services/levelUnlockService';
import { useUserData } from '../contexts/UserDataContext';
import { useUser } from '../contexts/UserContext';
import gameProgressService from '../services/gameProgressService';
import userStatsService from '../services/userStatsService';
import { vowelToImage } from '../assets/vowels/map';

const { width } = Dimensions.get('window');

// Helper functions
const uid = () => Math.random().toString(36).substr(2, 9);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ข้อมูลสระไทย
const thaiVowels = [
    { char: 'ะ', roman: 'a', meaning: 'สระอะ', name: 'อะ', example: 'มะ' },
    { char: 'า', roman: 'aa', meaning: 'สระอา', name: 'อา', example: 'มา' },
    { char: 'ิ', roman: 'i', meaning: 'สระอิ', name: 'อิ', example: 'มิ' },
    { char: 'ี', roman: 'ii', meaning: 'สระอี', name: 'อี', example: 'มี' },
    { char: 'ึ', roman: 'ue', meaning: 'สระอึ', name: 'อึ', example: 'มึ' },
    { char: 'ื', roman: 'uee', meaning: 'สระอือ', name: 'อือ', example: 'มือ' },
    { char: 'ุ', roman: 'u', meaning: 'สระอุ', name: 'อุ', example: 'มุ' },
    { char: 'ู', roman: 'uu', meaning: 'สระอู', name: 'อู', example: 'มู' },
    { char: 'เ', roman: 'e', meaning: 'สระเอ', name: 'เอ', example: 'เม' },
    { char: 'แ', roman: 'ae', meaning: 'สระแอ', name: 'แอ', example: 'แม' },
    { char: 'โ', roman: 'o', meaning: 'สระโอ', name: 'โอ', example: 'โม' },
    { char: 'ใ', roman: 'ai', meaning: 'สระใอ', name: 'ใอ', example: 'ใม' },
    { char: 'ไ', roman: 'ai', meaning: 'สระไอ', name: 'ไอ', example: 'ไม' },
    { char: 'ำ', roman: 'am', meaning: 'สระอำ', name: 'อำ', example: 'นำ' },
    { char: 'ฤ', roman: 'rue', meaning: 'สระฤ', name: 'ฤ', example: 'ฤกษ์' },
    { char: 'ฦ', roman: 'lue', meaning: 'สระฦ', name: 'ฦ', example: 'ฦา' },
];

const TH_CONNECTIVES = ['และ', 'หรือ', 'ของ', 'ใน', 'ที่', 'เป็น', 'มี', 'ให้', 'กับ', 'จาก'];

const getVowelGroup = (char) => {
  if (['ะ', 'า'].includes(char)) return 'สระเสียงอะ';
  if (['ิ', 'ี'].includes(char)) return 'สระเสียงอิ';
  if (['ึ', 'ื'].includes(char)) return 'สระเสียงอึ';
  if (['ุ', 'ู'].includes(char)) return 'สระเสียงอุ';
  if (['เ', 'แ'].includes(char)) return 'สระเสียงเอ';
  if (['โ', 'ใ', 'ไ'].includes(char)) return 'สระเสียงโอ';
  return 'สระพื้นฐาน';
};

const getNeighborVowels = (char, pool) => {
  const groups = {
    'สระเสียงอะ': ['ะ', 'า'],
    'สระเสียงอิ': ['ิ', 'ี'],
    'สระเสียงอึ': ['ึ', 'ื'],
    'สระเสียงอุ': ['ุ', 'ู'],
    'สระเสียงเอ': ['เ', 'แ'],
    'สระเสียงโอ': ['โ', 'ใ', 'ไ']
  };
  const group = Object.keys(groups).find(g => groups[g].includes(char));
  return pool.filter(v => groups[group]?.includes(v.char) && v.char !== char);
};

// Question Factory Functions for Vowels
const makeArrangeVowelQ = (v) => {
  const t = pick([1,2,3,4,5]);

  let questionText, correctOrder;
  switch (t) {
    case 1:
      questionText = `${v.char} คือ ${v.meaning}`;
      correctOrder = [v.char, 'คือ', v.meaning];
      break;
    case 2:
      questionText = `${v.char} แปลว่า ${v.meaning}`;
      correctOrder = [v.char, 'แปลว่า', v.meaning];
      break;
    case 3:
      questionText = `เสียงอ่านของ ${v.char} คือ ${v.name}`;
      correctOrder = ['เสียงอ่านของ', v.char, 'คือ', v.name];
      break;
    case 4:
      questionText = `${v.meaning} ใช้ตัวอักษร ${v.char}`;
      correctOrder = [v.meaning, 'ใช้ตัวอักษร', v.char];
      break;
    default:
      questionText = `${v.char} เป็นสระหมวด ${getVowelGroup(v.char)}`;
      correctOrder = [v.char, 'เป็นสระหมวด', getVowelGroup(v.char)];
  }

  const base = correctOrder.map(w => ({ id: uid(), text: w }));
  const distract = shuffle(TH_CONNECTIVES).slice(0, 3).map(t => ({ id: uid(), text: t }));

  return {
    id: `arr_${v.char}_${uid()}`,
    type: 'ARRANGE_SENTENCE',
    instruction: 'เรียงคำให้เป็นประโยคที่ถูกต้อง',
    questionText,
    correctOrder,                  // string[]
    wordBank: shuffle([...base, ...distract]), // {id,text}[]
    vowelChar: v.char,
  };
};

const makeMatch_SelectVowel = (v, pool) => {
  // สร้างคำถามหลายคำ (3-4 คำ)
  const selectedVowels = shuffle(pool).slice(0, 4);
  const leftItems = selectedVowels.map((item, i) => ({
    id: i + 1,
    text: item.meaning,
    correctMatch: item.char
  }));
  
  const rightItems = shuffle(selectedVowels).map((item, i) => ({
    id: i + 1,
    text: item.char
  }));

  return {
    id: `match_v_${v.char}_${uid()}`,
    type: 'DRAG_MATCH',
    instruction: `ลากเส้นจับคู่ความหมายกับสระที่ถูกต้อง`,
    questionText: `จับคู่ความหมายกับสระให้ถูกต้อง`,
    correctText: v.char,
    vowelChar: v.char,
    leftItems,
    rightItems,
  };
};

const makeMatch_SelectMeaning = (v, pool) => {
  // สร้างคำถามหลายคำ (3-4 คำ)
  const selectedVowels = shuffle(pool).slice(0, 4);
  const leftItems = selectedVowels.map((item, i) => ({
    id: i + 1,
    text: item.char,
    correctMatch: item.meaning
  }));
  
  const rightItems = shuffle(selectedVowels).map((item, i) => ({
    id: i + 1,
    text: item.meaning
  }));

  return {
    id: `match_m_${v.char}_${uid()}`,
    type: 'DRAG_MATCH',
    instruction: `ลากเส้นจับคู่สระกับความหมายที่ถูกต้อง`,
    questionText: `จับคู่สระกับความหมายให้ถูกต้อง`,
    correctText: v.meaning,
    vowelChar: v.char,
    leftItems,
    rightItems,
  };
};

const makeListenChoose = (v, pool) => {
  const near = getNeighborVowels(v.char, pool);
  const fill = near.length ? near : pool.filter(x => x.char !== v.char);
  const distractors = shuffle(fill.filter(x => x.char !== v.char)).slice(0, 3);
  const choices = shuffle([v, ...distractors]).map((x, i) => ({ id: i + 1, text: x.char }));

  return {
    id: `listen_${v.char}_${uid()}`,
    type: 'LISTEN_CHOOSE',
    instruction: 'ฟังเสียงแล้วจับคู่สระที่ได้ยิน',
    questionText: v.name,
    correctText: v.char,
    audioText: v.name,
    choices,
    vowelChar: v.char,
  };
};

const makePictureMatch = (v, pool) => {
  const emojiMap = { 
    'สระอะ':'🔤','สระอา':'🔤','สระอิ':'🔤','สระอี':'🔤',
    'สระอึ':'🔤','สระอือ':'🔤','สระอุ':'🔤','สระอู':'🔤',
    'สระเอ':'🔤','สระแอ':'🔤','สระโอ':'🔤','สระใอ':'🔤',
    'สระไอ':'🔤','สระอำ':'🔤','สระฤ':'🔤','สระฦ':'🔤'
  };
  const emoji = emojiMap[v.meaning] || '🔤';

  const near = getNeighborVowels(v.char, pool);
  const fill = near.length ? near : pool.filter(x => x.char !== v.char);
  const distractors = shuffle(fill.filter(x => x.char !== v.char)).slice(0, 3);
  const choices = shuffle([v, ...distractors]).map((x, i) => ({ id: i + 1, text: x.char }));

  return {
    id: `pic_${v.char}_${uid()}`,
    type: 'PICTURE_MATCH',
    instruction: 'จับคู่สระกับรูปภาพ',
    questionText: `${emoji} ${v.meaning}`,
    correctText: v.char,
    choices,
    vowelChar: v.char,
    emoji,
    imageSource: vowelToImage[v.char] || null,
  };
};

// Question Generation for Vowels
const generateVowelQuestions = (vowels) => {
  const questions = [];
  const pool = vowels;
  
  console.log('🎯 Generating vowel questions from', pool.length, 'vowels');
  
  // สำหรับด่าน 2 (lessonId: 2) ให้เลือกแค่ 12 สระที่ไม่ซ้ำกัน
  let selectedVowels = pool;
  if (vowels.length > 12) {
    // สุ่มเลือก 12 สระที่ไม่ซ้ำกัน
    const shuffledPool = shuffle([...pool]);
    selectedVowels = shuffledPool.slice(0, 12);
    console.log('🎯 Selected 12 unique vowels for lesson 2:', selectedVowels.map(v => v.char).join(', '));
  }
  
  // สร้างคำถาม 1 ข้อต่อสระที่เลือก - เน้นเกมจับคู่สระ
  selectedVowels.forEach((vowel, index) => {
    // เน้นเกมจับคู่สระ (80%) และเกมอื่นๆ (20%)
    const questionTypes = ['MATCH_PICTURE', 'PICTURE_MATCH', 'LISTEN_CHOOSE'];
    const weights = [0.6, 0.2, 0.2]; // 60% MATCH_PICTURE, 20% PICTURE_MATCH, 20% LISTEN_CHOOSE
    
    const random = Math.random();
    let selectedType;
    if (random < weights[0]) {
      selectedType = 'MATCH_PICTURE';
    } else if (random < weights[0] + weights[1]) {
      selectedType = 'PICTURE_MATCH';
    } else {
      selectedType = 'LISTEN_CHOOSE';
    }
    
    // สร้างคำถามตามประเภทที่เลือก
    switch (selectedType) {
      case 'MATCH_PICTURE':
        if (Math.random() < 0.5) {
          questions.push(makeMatch_SelectVowel(vowel, pool));
        } else {
          questions.push(makeMatch_SelectMeaning(vowel, pool));
        }
        break;
      case 'PICTURE_MATCH':
        questions.push(makePictureMatch(vowel, pool));
        break;
      case 'LISTEN_CHOOSE':
        questions.push(makeListenChoose(vowel, pool));
        break;
    }
  });
  
  // สุ่มคำถาม - ใช้จำนวนคำถามเท่ากับจำนวนสระที่เลือก
  const shuffledQuestions = shuffle(questions);
  
  // Attach images for PICTURE_MATCH questions
  const questionsWithImages = shuffledQuestions.map(q => {
    if (q && q.type === 'PICTURE_MATCH') {
      const key = q.vowelChar || q.correctText || (Array.isArray(q.vowelChars) ? q.vowelChars[0] : null);
      return { ...q, imageSource: key ? (vowelToImage[key] || null) : null };
    }
    return q;
  });
  
  console.log(`🎮 Generated ${questionsWithImages.length} vowel questions from ${selectedVowels.length} selected vowels (${pool.length} total available)`);
  
  return questionsWithImages;
};

// Inline Components (same as NewLessonGame.js)
const ArrangementComponent = ({ data, onAnswerChange, userAnswer = [], isAnswered, isCorrect }) => {
  const [selected, setSelected] = useState([]);         // {id,text}[]
  const [bank, setBank] = useState(data.wordBank || []); // {id,text}[]

  useEffect(() => {
    // reset เมื่อเปลี่ยนข้อ
    setSelected([]);
    setBank(data.wordBank || []);
  }, [data.id]);

  // Sync with userAnswer prop
  useEffect(() => {
    if (userAnswer && Array.isArray(userAnswer)) {
      // Convert userAnswer (string[]) back to selected format
      const selectedWords = userAnswer.map(text => 
        bank.find(w => w.text === text) || { id: uid(), text }
      ).filter(Boolean);
      setSelected(selectedWords);
    }
  }, [userAnswer, bank]);

  const pickWord = (w) => {
    if (isAnswered) return;
    if (selected.find(x => x.id === w.id)) return;
    if (selected.length >= (data.correctOrder?.length || 99)) return;
    const next = [...selected, w];
    setSelected(next);
    onAnswerChange(next.map(x => x.text)); // ส่งเป็น string[]
  };

  const removeAt = (idx) => {
    if (isAnswered) return;
    const rm = selected[idx];
    const next = selected.filter((_, i) => i !== idx);
    setSelected(next);
    onAnswerChange(next.map(x => x.text));
    // คืนช่องใน bank (ตำแหน่งไม่ต้องเป๊ะ)
    setBank(prev => [...prev, rm]);
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.instructionText}>{data.instruction}</Text>
      <Text style={styles.questionText}>{data.questionText}</Text>

      {/* บริเวณเรียงคำ */}
      <View style={styles.answerArea}>
        {selected.length === 0 ? (
          <Text style={{color:'#888'}}>แตะคำจากด้านล่างเพื่อเรียง</Text>
        ) : (
          <View style={styles.arrangedWordsContainer}>
            {selected.map((w, i) => (
              <TouchableOpacity
                key={w.id}
                style={[
                  styles.arrangedWord,
                  isAnswered && isCorrect !== null && {
                    borderColor: isCorrect ? '#58cc02' : '#ff4b4b',
                    backgroundColor: isCorrect ? '#d4f4aa' : '#ffb3b3',
                  }
                ]}
                onPress={() => removeAt(i)}
                disabled={isAnswered}
              >
                <Text style={styles.arrangedWordText}>{w.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* คลังคำ */}
      <View style={styles.wordBank}>
        {bank
          .filter(w => !selected.find(s => s.id === w.id))
          .map(w => (
            <TouchableOpacity
              key={w.id}
              style={[styles.wordButton, isAnswered && {opacity:0.5}]}
              onPress={() => pickWord(w)}
              disabled={isAnswered}
            >
              <Text style={styles.wordButtonText}>{w.text}</Text>
            </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const MatchingComponent = ({ data, onAnswerChange, userAnswer, isAnswered, isCorrect }) => (
  <View style={styles.questionContainer}>
    <Text style={styles.instructionText}>{data.instruction}</Text>
    {!!data.questionText && <Text style={styles.questionText}>{data.questionText}</Text>}
    <View style={styles.choicesContainer}>
      {data.choices?.map((choice) => (
        <TouchableOpacity
          key={choice.id}
          style={[
            styles.choiceButton,
            userAnswer === choice.text && styles.selectedChoice,
            isAnswered && choice.text === data.correctText && styles.correctChoice,
            isAnswered && userAnswer === choice.text && choice.text !== data.correctText && styles.wrongChoice
          ]}
          onPress={() => onAnswerChange(choice.text)}
          disabled={isAnswered}
        >
          <Text style={styles.choiceText}>{choice.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const DragMatchComponent = ({ data, onAnswerChange, userAnswer, isAnswered, isCorrect }) => {
  const [connections, setConnections] = useState({});
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [connectionColors] = useState([
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]);

  useEffect(() => {
    if (userAnswer && typeof userAnswer === 'object') {
      setConnections(userAnswer);
    } else {
      // รีเซ็ตการเชื่อมต่อเมื่อไม่มีคำตอบหรือเปลี่ยนข้อ
      setConnections({});
    }
    // รีเซ็ตการเลือกเมื่อเปลี่ยนข้อ
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [userAnswer, data.id]); // เพิ่ม data.id เพื่อรีเซ็ตเมื่อเปลี่ยนข้อ

  const handleLeftPress = (leftItem) => {
    if (isAnswered) return;
    
    // เล่นเสียงเมื่อแตะที่คำด้านซ้าย
    if (leftItem && leftItem.text) {
      try {
        vaja9TtsService.playThai(leftItem.text);
      } catch (error) {
        console.log('TTS Error:', error);
      }
    }
    
    setSelectedLeft(leftItem.id);
    setSelectedRight(null);
  };

  const handleRightPress = (rightItem) => {
    if (isAnswered) return;
    
    // เล่นเสียงเมื่อแตะที่คำด้านขวา
    if (rightItem && rightItem.text) {
      try {
        vaja9TtsService.playThai(rightItem.text);
      } catch (error) {
        console.log('TTS Error:', error);
      }
    }
    
    if (selectedLeft) {
      // สร้างการเชื่อมต่อ
      const newConnections = {
        ...connections,
        [selectedLeft]: rightItem.text
      };
      setConnections(newConnections);
      onAnswerChange(newConnections);
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedRight(rightItem.id);
    }
  };

  // ฟังก์ชันสำหรับลบการเชื่อมต่อ
  const removeConnection = (leftId) => {
    const newConnections = { ...connections };
    delete newConnections[leftId];
    setConnections(newConnections);
    onAnswerChange(newConnections);
  };

  const isConnected = (leftId, rightText) => {
    return connections[leftId] === rightText;
  };

  const isCorrectConnection = (leftId, rightText) => {
    const leftItem = data.leftItems.find(item => item.id === leftId);
    return leftItem && leftItem.correctMatch === rightText;
  };

  const getConnectionStatus = (leftId) => {
    const rightText = connections[leftId];
    if (!rightText) return 'none';
    const leftItem = data.leftItems.find(item => item.id === leftId);
    return leftItem && leftItem.correctMatch === rightText ? 'correct' : 'wrong';
  };

  const getConnectionColor = (leftId) => {
    const connectionIndex = Object.keys(connections).indexOf(leftId.toString());
    return connectionColors[connectionIndex % connectionColors.length];
  };

  const getConnectionSymbol = (leftId) => {
    const symbols = ['●', '▲', '■', '♦', '★', '◆', '▲', '●'];
    const connectionIndex = Object.keys(connections).indexOf(leftId.toString());
    return symbols[connectionIndex % symbols.length];
  };

  return (
    <View style={styles.questionContainer}>
      <Text style={styles.instructionText}>{data.instruction}</Text>
      {!!data.questionText && <Text style={styles.questionText}>{data.questionText}</Text>}
      
      <View style={styles.dragMatchContainer}>
        {/* ด้านซ้าย - ความหมายหรือสระ */}
        <View style={styles.leftColumn}>
          {data.leftItems?.map((item, index) => {
            const connectionColor = connections[item.id] ? getConnectionColor(item.id) : '#e0e0e0';
            const connectionSymbol = connections[item.id] ? getConnectionSymbol(item.id) : '';
            const isSelected = selectedLeft === item.id;
            const isConnected = connections[item.id];
            
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dragItem,
                  isSelected && styles.selectedDragItem,
                  isAnswered && getConnectionStatus(item.id) === 'correct' && styles.correctDragItem,
                  isAnswered && getConnectionStatus(item.id) === 'wrong' && styles.wrongDragItem,
                  { 
                    backgroundColor: isConnected ? connectionColor : (isSelected ? '#fff5e6' : '#fff'),
                    borderColor: isConnected ? connectionColor : (isSelected ? '#FF8000' : '#e0e0e0'),
                    borderWidth: isSelected ? 4 : 3
                  }
                ]}
                onPress={() => handleLeftPress(item)}
                disabled={isAnswered}
              >
                <View style={styles.dragItemContent}>
                  {isConnected && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeConnection(item.id)}
                    >
                      <FontAwesome name="times" size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                  <Text style={[
                    styles.dragItemText,
                    isConnected && { color: '#fff', fontWeight: 'bold' },
                    isSelected && { color: '#FF8000', fontWeight: 'bold' }
                  ]}>{item.text}</Text>
                  {isConnected && (
                    <Text style={[styles.connectionSymbol, { color: '#fff' }]}>
                      {connectionSymbol}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ด้านขวา - ตัวเลือก */}
        <View style={styles.rightColumn}>
          {data.rightItems?.map((item, index) => {
            const connectedLeftId = Object.keys(connections).find(leftId => connections[leftId] === item.text);
            const isCorrectMatch = connectedLeftId && getConnectionStatus(connectedLeftId) === 'correct';
            const isWrongMatch = connectedLeftId && getConnectionStatus(connectedLeftId) === 'wrong';
            const connectionColor = connectedLeftId ? getConnectionColor(connectedLeftId) : '#e0e0e0';
            const connectionSymbol = connectedLeftId ? getConnectionSymbol(connectedLeftId) : '';
            const isSelected = selectedRight === item.id;
            const isConnected = connectedLeftId;
            
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dragItem,
                  isSelected && styles.selectedDragItem,
                  isAnswered && isCorrectMatch && styles.correctDragItem,
                  isAnswered && isWrongMatch && styles.wrongDragItem,
                  { 
                    backgroundColor: isConnected ? connectionColor : (isSelected ? '#fff5e6' : '#fff'),
                    borderColor: isConnected ? connectionColor : (isSelected ? '#FF8000' : '#e0e0e0'),
                    borderWidth: isSelected ? 4 : 3
                  }
                ]}
                onPress={() => handleRightPress(item)}
                disabled={isAnswered}
              >
                <View style={styles.dragItemContent}>
                  <Text style={[
                    styles.dragItemText,
                    isConnected && { color: '#fff', fontWeight: 'bold' },
                    isSelected && { color: '#FF8000', fontWeight: 'bold' }
                  ]}>{item.text}</Text>
                  {isConnected && (
                    <Text style={[styles.connectionSymbol, { color: '#fff' }]}>
                      {connectionSymbol}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ปุ่มเล่นเสียง */}
      <View style={styles.soundButtonsContainer}>
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => {
            // เล่นเสียงคำด้านซ้ายทั้งหมด
            if (data.leftItems && Array.isArray(data.leftItems)) {
              data.leftItems.forEach((item, index) => {
                if (item && item.text) {
                  setTimeout(() => {
                    try {
                      vaja9TtsService.playThai(item.text);
                    } catch (error) {
                      console.log('TTS Error:', error);
                    }
                  }, index * 1000);
                }
              });
            }
          }}
        >
          <FontAwesome name="volume-up" size={16} color="#fff" />
          <Text style={styles.soundButtonText}>เล่นเสียงคำซ้าย</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.soundButton}
          onPress={() => {
            // เล่นเสียงคำด้านขวาทั้งหมด
            if (data.rightItems && Array.isArray(data.rightItems)) {
              data.rightItems.forEach((item, index) => {
                if (item && item.text) {
                  setTimeout(() => {
                    try {
                      vaja9TtsService.playThai(item.text);
                    } catch (error) {
                      console.log('TTS Error:', error);
                    }
                  }, index * 1000);
                }
              });
            }
          }}
        >
          <FontAwesome name="volume-up" size={16} color="#fff" />
          <Text style={styles.soundButtonText}>เล่นเสียงคำขวา</Text>
        </TouchableOpacity>
      </View>

      {/* แสดงสถานะการเชื่อมต่อ */}
      {Object.keys(connections).length > 0 && (
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionText}>
            เชื่อมต่อแล้ว {Object.keys(connections).length}/{data.leftItems.length} คู่
          </Text>
        </View>
      )}
    </View>
  );
};

// Main Vowel Game Screen
const ThaiVowelsGame = ({ navigation, route }) => {
    const { lessonId = 2, category = 'vowels_basic', vowelType = 'basic' } = route.params || {};
    
    // Progress context
    const { applyDelta, getTotalXP } = useProgress();
    
    // Use the new user data sync system
    const { stats: userData, updateUserStats } = useUserData();
    const { updateStats: updateUnifiedStats, updateFromGameSession: updateUnifiedFromGameSession, stats: unifiedStats } = useUnifiedStats();
    const { user } = useUser();
    const getUserScopedKey = React.useCallback(
        (base) => `${base}_${user?.id || 'guest'}`,
        [user?.id]
    );
    
    const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState(null); 
    const [isCorrect, setIsCorrect] = useState(null); 
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [hearts, setHearts] = useState(5);
    const [perLetter, setPerLetter] = useState({});
    const [vowelData, setVowelData] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const [summaryData, setSummaryData] = useState({});
    const sessionFinalizedRef = useRef(false);
    
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

    // ข้อมูลผู้ใช้ที่สะสม
    const [userStats, setUserStats] = useState({
        totalXP: 0,
        totalDiamonds: 0,
        currentLevel: 1,
        levelProgress: 0
    });

    // ข้อมูลความคืบหน้าของเกมปัจจุบัน
    const [gameSession, setGameSession] = useState({
        lessonId: null,
        category: null,
        currentQuestionIndex: 0,
        questions: [],
        answers: {},
        score: 0,
        hearts: 5,
        gameProgress: null,
        startTime: null,
        isResumed: false
    });

    const currentQuestion = questions[currentQuestIndex];

    useEffect(() => {
        if (unifiedStats?.hearts !== undefined) {
            setHearts(unifiedStats.hearts);
        }
    }, [unifiedStats?.hearts]);
    
    // Debug logging
    console.log('🔍 Vowel Question state:', {
        questionsLength: questions.length,
        currentQuestIndex,
        hasCurrentQuestion: !!currentQuestion,
        questionType: currentQuestion?.type
    });
    
    const answersRef = useRef({});
    const startTimeRef = useRef(Date.now());
    const questionStartTimeRef = useRef(Date.now());
    const progressAnimationRef = useRef(new Animated.Value(0));

    // ฟังก์ชันสำหรับอัปเดตความคืบหน้า
    const updateGameProgress = (questionResult) => {
        const currentTime = Date.now();
        const questionTime = currentTime - questionStartTimeRef.current;
        
        setGameProgress(prev => {
            const newProgress = { ...prev };
            
            // อัปเดตข้อมูลพื้นฐาน
            newProgress.completedQuestions += 1;
            newProgress.timePerQuestion.push(questionTime);
            
            // อัปเดตผลการตอบ
            if (questionResult.isCorrect) {
                newProgress.correctAnswers += 1;
                newProgress.streak += 1;
                newProgress.maxStreak = Math.max(newProgress.maxStreak, newProgress.streak);
                newProgress.xpEarned += questionResult.xp || 10;
                
                // คำนวณเพชรตาม streak
                let diamonds = 1; // เพชรพื้นฐาน
                if (newProgress.streak >= 3) diamonds += 1; // bonus สำหรับ streak 3+
                if (newProgress.streak >= 5) diamonds += 1; // bonus สำหรับ streak 5+
                if (newProgress.streak >= 10) diamonds += 2; // bonus สำหรับ streak 10+
                
                newProgress.diamondsEarned += diamonds;
            } else {
                newProgress.wrongAnswers += 1;
                newProgress.streak = 0;
            }
            
            // อัปเดตประเภทคำถาม
            const questionType = questionResult.questionType || 'unknown';
            newProgress.questionTypes[questionType] = (newProgress.questionTypes[questionType] || 0) + 1;
            
            // คำนวณความแม่นยำ
            newProgress.accuracy = (newProgress.correctAnswers / newProgress.completedQuestions) * 100;
            
            // คำนวณเวลาทั้งหมด
            newProgress.totalTimeSpent = currentTime - newProgress.startTime;
            
            // คำนวณเลเวล
            newProgress.level = Math.floor(newProgress.xpEarned / 100) + 1;
            
            return newProgress;
        });
        
        // Animation เมื่อความคืบหน้าเปลี่ยน
        Animated.sequence([
            Animated.timing(progressAnimationRef.current, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(progressAnimationRef.current, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
        
        // รีเซ็ตเวลาสำหรับคำถามถัดไป
        questionStartTimeRef.current = currentTime;
    };

    // คำนวณ Level จาก XP
    const calculateLevel = (totalXP) => {
        // Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
        const level = Math.floor(totalXP / 100) + 1;
        const levelProgress = (totalXP % 100) / 100;
        return { level, levelProgress };
    };

    // อัปเดตข้อมูลผู้ใช้ (legacy function - renamed to avoid conflict)
    const updateUserStatsLegacy = async (gameXP, gameDiamonds) => {
        try {
            const newTotalXP = userStats.totalXP + gameXP;
            const newTotalDiamonds = userStats.totalDiamonds + gameDiamonds;
            const { level, levelProgress } = calculateLevel(newTotalXP);
            
            const updatedStats = {
                totalXP: newTotalXP,
                totalDiamonds: newTotalDiamonds,
                currentLevel: level,
                levelProgress: levelProgress
            };
            
            setUserStats(updatedStats);
            await AsyncStorage.setItem(getUserScopedKey('userStats'), JSON.stringify(updatedStats));
            
            console.log('📊 Updated user stats (legacy):', updatedStats);
            return updatedStats;
        } catch (error) {
            console.error('❌ Error updating user stats (legacy):', error);
            return userStats;
        }
    };

    // เซฟความคืบหน้าของเกม
    const saveGameProgress = async () => {
        try {
            const progressData = {
                lessonId,
                category,
                currentQuestionIndex: currentQuestIndex,
                questions: questions.map(q => ({
                    id: q.id,
                    type: q.type,
                    instruction: q.instruction,
                    questionText: q.questionText,
                    correctText: q.correctText,
                    correctOrder: q.correctOrder,
                    leftItems: q.leftItems,
                    rightItems: q.rightItems,
                    imageSource: q.imageSource,
                    vowelChar: q.vowelChar,
                    vowelChars: q.vowelChars
                })),
                answers: answersRef.current,
                score,
                hearts,
                gameProgress,
                startTime: gameProgress.startTime,
                lastSaved: Date.now()
            };
            
            const progressKey = getUserScopedKey(`gameProgress_${lessonId}_${category}`);
            await AsyncStorage.setItem(progressKey, JSON.stringify(progressData));
            console.log('💾 Game progress saved:', progressKey);
        } catch (error) {
            console.error('❌ Error saving game progress:', error);
        }
    };

    // โหลดความคืบหน้าของเกม
    const loadGameProgress = async () => {
        try {
            const progressKey = getUserScopedKey(`gameProgress_${lessonId}_${category}`);
            const progressData = await AsyncStorage.getItem(progressKey);
            
            if (progressData) {
                const parsed = JSON.parse(progressData);
                
                // ตรวจสอบว่าเป็นเกมเดียวกันหรือไม่
                if (parsed.lessonId === lessonId && parsed.category === category) {
                    setGameSession(prev => ({
                        ...prev,
                        ...parsed,
                        isResumed: true
                    }));
                    
                    // ตั้งค่าข้อมูลเกม
                    setQuestions(parsed.questions || []);
                    setCurrentQuestIndex(parsed.currentQuestionIndex || 0);
                    setScore(parsed.score || 0);
                    setHearts(parsed.hearts || 5);
                    setGameProgress(parsed.gameProgress || gameProgress);
                    answersRef.current = parsed.answers || {};
                    
                    console.log('📂 Game progress loaded:', progressKey);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('❌ Error loading game progress:', error);
            return false;
        }
    };

    // ลบความคืบหน้าของเกม (เมื่อจบเกม)
    const clearGameProgress = async () => {
        try {
            const progressKey = getUserScopedKey(`gameProgress_${lessonId}_${category}`);
            await AsyncStorage.removeItem(progressKey);
            console.log('🗑️ Game progress cleared:', progressKey);
        } catch (error) {
            console.error('❌ Error clearing game progress:', error);
        }
    };

    // โหลดข้อมูลผู้ใช้
    const loadUserStats = async () => {
        try {
            const userStatsData = await AsyncStorage.getItem(getUserScopedKey('userStats'));
            if (userStatsData) {
                const parsed = JSON.parse(userStatsData);
                setUserStats(parsed);
                console.log('📊 Loaded user stats:', parsed);
            }
        } catch (error) {
            console.error('❌ Error loading user stats:', error);
        }
    };

    // Load vowel data
    useEffect(() => {
        loadVowelData();
        loadUserStats();
        
        // Initialize new services
        initializeServices();
        
        // โหลดความคืบหน้าของเกม (ถ้ามี)
        loadGameProgress();
    }, []);

    // Initialize new progress tracking services
    const initializeServices = async () => {
        try {
            if (user?.id) {
                await gameProgressService.initialize(user.id);
                await levelUnlockService.initialize(user.id);
                await userStatsService.initialize(user.id);
                console.log('✅ Progress tracking services initialized for ThaiVowelGame');
            }
        } catch (error) {
            console.error('❌ Error initializing services:', error);
        }
    };

    // Load vocabulary data from API
    useEffect(() => {
        loadVocabularyData();
    }, [lessonId, category, vowelData]);

    // Sync initial user data when game starts
    useEffect(() => {
        const syncInitialData = async () => {
            try {
                // Sync current user stats when game starts
                const stats = await updateUserStats({ xp: 0, diamonds: 0, hearts: 0 });
                if (stats) {
                    console.log('🎮 Initial user stats synced:', stats);
                }
            } catch (error) {
                console.error('❌ Error syncing initial user stats:', error);
            }
        };
        
        syncInitialData();
    }, [updateUserStats]);

    // โหลด snapshot ตอนเข้า
    useEffect(() => {
        (async () => {
            const snap = await loadAutosnap(lessonId);
            if (snap) { /* restore state จาก snap */ }
            else { /* generate questions ใหม่ */ }
        })();
    }, []);

    const loadVowelData = async () => {
        try {
            console.log('🔤 Loading vowel data...');
            setVowelData(thaiVowels);
            console.log('✅ Loaded', thaiVowels.length, 'vowels');
        } catch (error) {
            console.error('❌ Error loading vowel data:', error);
            setVowelData(thaiVowels);
        }
    };

    const loadVocabularyData = async () => {
        try {
            setLoading(true);
            console.log('🎯 Loading vocabulary data for lessonId:', lessonId, 'type:', typeof lessonId);

            // Try to restore from per-user progress
            const snap = await loadAutosnap(lessonId);
            if (snap && snap.questionsSnapshot && snap.questionsSnapshot.length > 0) {
              console.log('✅ Restored from per-user progress:', { 
                questionsCount: snap.questionsSnapshot.length,
                currentIndex: snap.currentIndex 
              });
              
              setQuestions(snap.questionsSnapshot);
              setCurrentQuestIndex(Math.min(snap.currentIndex || 0, snap.questionsSnapshot.length - 1));
              setHearts(snap.hearts || 5);
              setScore(snap.score || 0);
              if (snap.perLetter) {
                setPerLetter(snap.perLetter);
              }
              if (snap.answers) {
                answersRef.current = snap.answers;
              }
              setIsCorrect(null);
              setUserAnswer(null);
              setLoading(false);
              return;
            }

            // If no restore data, generate new questions from vowel data
            console.log('🎯 Generating new questions from vowel data:', vowelData.length);
            
            // สำหรับด่าน 2 (lessonId: 2) ใช้สระทั้งหมด 16 ตัวเสมอ
            if (lessonId === 2 || lessonId === '2') {
                console.log('🎯 Second stage - using all 16 vowels for lessonId:', lessonId);
                // ใช้ข้อมูลสระที่กำหนดไว้
            } else {
                // สำหรับด่านอื่นๆ ใช้ข้อมูลจาก vowelData
                let pool = vowelData.length > 0 ? vowelData : [];
                
                if (pool.length === 0) {
                    console.log('⚠️ No vowel data available, using default data...');
                    pool = thaiVowels;
                }
                
                const gameQuestions = generateVowelQuestions(pool);
                console.log('🎮 Generated', gameQuestions.length, 'questions from vowel data');
                
                setQuestions(gameQuestions);
                setCurrentQuestIndex(0);
                setIsCorrect(null);
                setUserAnswer(null);
                setLoading(false);
                return;
            }
            
            // ถ้าเป็นด่าน 2 หรือโหลดจาก vowelData ไม่ได้ ให้ใช้ fallback data
            if (lessonId === 2 || lessonId === '2' || vowelData.length === 0) {
                // ใช้ข้อมูลสระที่กำหนดไว้
                console.log('🔄 Using fallback vowel data (16 vowels)');
                const gameQuestions = generateVowelQuestions(thaiVowels);
                console.log('🎮 Generated fallback questions (16 vowels):', gameQuestions.length);
                
                setQuestions(gameQuestions);
                setCurrentQuestIndex(0);
                setIsCorrect(null);
                setUserAnswer(null);
                setLoading(false);
                return;
            }

            // Generate questions using factory functions from vowel data
            const gameQuestions = generateVowelQuestions(vowelData);
            console.log('🎮 Generated', gameQuestions.length, 'questions from vowel data');

            setQuestions(gameQuestions);
            setCurrentQuestIndex(0);
            setIsCorrect(null);
            setUserAnswer(null);
            
            // อัปเดตข้อมูลความคืบหน้าเมื่อเริ่มเกม
            setGameProgress(prev => ({
                ...prev,
                startTime: Date.now(),
                totalQuestions: gameQuestions.length,
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
                level: 1,
                achievements: []
            }));

            // Save the questions snapshot for future restore
            await saveProgress(lessonId, {
                category,
                currentIndex: 0,
                total: gameQuestions.length,
                hearts: 5,
                score: 0,
                xp: 0,
                perLetter: {},
                answers: {},
                questionsSnapshot: gameQuestions,
                updatedAt: Date.now()
            });

        } catch (error) {
            console.error('❌ Error loading vocabulary data:', error);
            // Use fallback data on error - สระไทยครบ 16 ตัว
            const gameQuestions = generateVowelQuestions(thaiVowels);
            console.log('🎮 Generated fallback questions after error (16 vowels):', gameQuestions.length);
            
            setQuestions(gameQuestions);
            setCurrentQuestIndex(0);
            setIsCorrect(null);
            setUserAnswer(null);
        } finally {
            setLoading(false);
        }
    };

        // ---- Auto Save functions ----
        const snapshot = () => ({
            lessonId, category,
            questions, currentIndex: currentQuestIndex,
            hearts, score, perLetter, answers: answersRef.current,
            gameProgress: gameProgress, // เพิ่มข้อมูลความคืบหน้า
        });

        const autosave = async () => {
            await saveAutosnap(lessonId, snapshot());
            // sync server progress ราย user (JWT ทำให้รู้ว่า user ไหน)
            await apiClient.post('/progress/user/session', {
                ...snapshot(),
                total: questions.length,
                updatedAt: Date.now()
            });
            
            // บันทึกข้อมูลความคืบหน้าลงใน AsyncStorage
            try {
                const progressKey = getUserScopedKey(`gameProgress_${lessonId}_${Date.now()}`);
                await AsyncStorage.setItem(progressKey, JSON.stringify(gameProgress));
                console.log('📊 Game progress saved:', progressKey);
            } catch (error) {
                console.error('❌ Error saving game progress:', error);
            }
        };

    // เรียก autosave เมื่อ index/score/hearts เปลี่ยน
    useEffect(() => {
        if (questions.length) {
            autosave();
            saveGameProgress(); // เซฟความคืบหน้าทุกครั้งที่มีการเปลี่ยนแปลง
        }
    }, [currentQuestIndex, score, hearts, questions.length, gameProgress]);

    // Real-time sync with global progress context
    useEffect(() => {
        const globalXP = getTotalXP();
        const globalLevel = getCurrentLevel();
        
        if (globalXP > 0) {
            setGameProgress(prev => ({
                ...prev,
                level: globalLevel
            }));
            console.log('🎮 Game synced with global progress:', { xp: globalXP, level: globalLevel });
        }
    }, [getTotalXP, getCurrentLevel]);

    // Real-time sync with userData changes
    useEffect(() => {
        if (userData) {
            setHearts(userData.hearts || 5);
            setDiamonds(userData.diamonds || 0);
            setXp(userData.xp || 0);
            setLevel(userData.level || 1);
            console.log('🎮 Game updated from userData change:', userData);
        }
    }, [userData]);

    // Real-time sync when hearts or diamonds change
    useEffect(() => {
        const syncStats = async () => {
            try {
                await updateUserStats({
                    hearts: hearts,
                    diamonds: diamonds,
                    xp: xp,
                    level: level
                });
                console.log('🎮 Game stats synced:', { hearts, diamonds, xp, level });
            } catch (error) {
                console.error('❌ Error syncing game stats:', error);
            }
        };
        
        if (hearts !== 5 || diamonds !== 0 || xp !== 0 || level !== 1) {
            syncStats();
        }
    }, [hearts, diamonds, xp, level, updateUserStats]);

    // Real-time sync when gameProgress changes
    useEffect(() => {
        const syncGameProgress = async () => {
            try {
                await updateUserStats({
                    xp: gameProgress.xpEarned,
                    diamonds: gameProgress.diamondsEarned,
                    level: gameProgress.level
                });
                console.log('🎮 Game progress synced:', { 
                    xp: gameProgress.xpEarned, 
                    diamonds: gameProgress.diamondsEarned, 
                    level: gameProgress.level 
                });
            } catch (error) {
                console.error('❌ Error syncing game progress:', error);
            }
        };
        
        if (gameProgress.xpEarned > 0 || gameProgress.diamondsEarned > 0 || gameProgress.level > 1) {
            syncGameProgress();
        }
    }, [gameProgress.xpEarned, gameProgress.diamondsEarned, gameProgress.level, updateUserStats]);

    // Real-time sync when score changes
    useEffect(() => {
        const syncScore = async () => {
            try {
                await updateUserStats({
                    xp: score
                });
                console.log('🎮 Score synced:', { score });
            } catch (error) {
                console.error('❌ Error syncing score:', error);
            }
        };
        
        if (score > 0) {
            syncScore();
        }
    }, [score, updateUserStats]);

    // Real-time sync when hearts change
    useEffect(() => {
        const syncHearts = async () => {
            try {
                await updateUserStats({
                    hearts: hearts
                });
                console.log('🎮 Hearts synced:', { hearts });
            } catch (error) {
                console.error('❌ Error syncing hearts:', error);
            }
        };
        
        if (hearts !== 5) {
            syncHearts();
        }
    }, [hearts, updateUserStats]);

    // Real-time sync when diamonds change
    useEffect(() => {
        const syncDiamonds = async () => {
            try {
                await updateUserStats({
                    diamonds: diamonds
                });
                console.log('🎮 Diamonds synced:', { diamonds });
            } catch (error) {
                console.error('❌ Error syncing diamonds:', error);
            }
        };
        
        if (diamonds > 0) {
            syncDiamonds();
        }
    }, [diamonds, updateUserStats]);

    // Real-time sync when level changes
    useEffect(() => {
        const syncLevel = async () => {
            try {
                await updateUserStats({
                    level: level
                });
                console.log('🎮 Level synced:', { level });
            } catch (error) {
                console.error('❌ Error syncing level:', error);
            }
        };
        
        if (level > 1) {
            syncLevel();
        }
    }, [level, updateUserStats]);

    // Real-time sync when xp changes
    useEffect(() => {
        const syncXP = async () => {
            try {
                await updateUserStats({
                    xp: xp
                });
                console.log('🎮 XP synced:', { xp });
            } catch (error) {
                console.error('❌ Error syncing XP:', error);
            }
        };
        
        if (xp > 0) {
            syncXP();
        }
    }, [xp, updateUserStats]);

    // Real-time sync when accuracy changes
    useEffect(() => {
        const syncAccuracy = async () => {
            try {
                await updateUserStats({
                    accuracy: gameProgress.accuracy
                });
                console.log('🎮 Accuracy synced:', { accuracy: gameProgress.accuracy });
            } catch (error) {
                console.error('❌ Error syncing accuracy:', error);
            }
        };
        
        if (gameProgress.accuracy > 0) {
            syncAccuracy();
        }
    }, [gameProgress.accuracy, updateUserStats]);

    // Real-time sync when streak changes
    useEffect(() => {
        const syncStreak = async () => {
            try {
                await updateUserStats({
                    streak: gameProgress.streak
                });
                console.log('🎮 Streak synced:', { streak: gameProgress.streak });
            } catch (error) {
                console.error('❌ Error syncing streak:', error);
            }
        };
        
        if (gameProgress.streak > 0) {
            syncStreak();
        }
    }, [gameProgress.streak, updateUserStats]);

    // Real-time sync when maxStreak changes
    useEffect(() => {
        const syncMaxStreak = async () => {
            try {
                await updateUserStats({
                    maxStreak: gameProgress.maxStreak
                });
                console.log('🎮 MaxStreak synced:', { maxStreak: gameProgress.maxStreak });
            } catch (error) {
                console.error('❌ Error syncing maxStreak:', error);
            }
        };
        
        if (gameProgress.maxStreak > 0) {
            syncMaxStreak();
        }
    }, [gameProgress.maxStreak, updateUserStats]);

    // Real-time sync when totalTimeSpent changes
    useEffect(() => {
        const syncTotalTimeSpent = async () => {
            try {
                await updateUserStats({
                    totalTimeSpent: gameProgress.totalTimeSpent
                });
                console.log('🎮 TotalTimeSpent synced:', { totalTimeSpent: gameProgress.totalTimeSpent });
            } catch (error) {
                console.error('❌ Error syncing totalTimeSpent:', error);
            }
        };
        
        if (gameProgress.totalTimeSpent > 0) {
            syncTotalTimeSpent();
        }
    }, [gameProgress.totalTimeSpent, updateUserStats]);

    // Real-time sync when completedQuestions changes
    useEffect(() => {
        const syncCompletedQuestions = async () => {
            try {
                await updateUserStats({
                    completedQuestions: gameProgress.completedQuestions
                });
                console.log('🎮 CompletedQuestions synced:', { completedQuestions: gameProgress.completedQuestions });
            } catch (error) {
                console.error('❌ Error syncing completedQuestions:', error);
            }
        };
        
        if (gameProgress.completedQuestions > 0) {
            syncCompletedQuestions();
        }
    }, [gameProgress.completedQuestions, updateUserStats]);

    // Real-time sync when correctAnswers changes
    useEffect(() => {
        const syncCorrectAnswers = async () => {
            try {
                await updateUserStats({
                    correctAnswers: gameProgress.correctAnswers
                });
                console.log('🎮 CorrectAnswers synced:', { correctAnswers: gameProgress.correctAnswers });
            } catch (error) {
                console.error('❌ Error syncing correctAnswers:', error);
            }
        };
        
        if (gameProgress.correctAnswers > 0) {
            syncCorrectAnswers();
        }
    }, [gameProgress.correctAnswers, updateUserStats]);

    // Real-time sync when wrongAnswers changes
    useEffect(() => {
        const syncWrongAnswers = async () => {
            try {
                await updateUserStats({
                    wrongAnswers: gameProgress.wrongAnswers
                });
                console.log('🎮 WrongAnswers synced:', { wrongAnswers: gameProgress.wrongAnswers });
            } catch (error) {
                console.error('❌ Error syncing wrongAnswers:', error);
            }
        };
        
        if (gameProgress.wrongAnswers > 0) {
            syncWrongAnswers();
        }
    }, [gameProgress.wrongAnswers, updateUserStats]);

    // Real-time sync when totalQuestions changes
    useEffect(() => {
        const syncTotalQuestions = async () => {
            try {
                await updateUserStats({
                    totalQuestions: gameProgress.totalQuestions
                });
                console.log('🎮 TotalQuestions synced:', { totalQuestions: gameProgress.totalQuestions });
            } catch (error) {
                console.error('❌ Error syncing totalQuestions:', error);
            }
        };
        
        if (gameProgress.totalQuestions > 0) {
            syncTotalQuestions();
        }
    }, [gameProgress.totalQuestions, updateUserStats]);

    // Real-time sync when questionTypes changes
    useEffect(() => {
        const syncQuestionTypes = async () => {
            try {
                await updateUserStats({
                    questionTypes: gameProgress.questionTypes
                });
                console.log('🎮 QuestionTypes synced:', { questionTypes: gameProgress.questionTypes });
            } catch (error) {
                console.error('❌ Error syncing questionTypes:', error);
            }
        };
        
        if (gameProgress.questionTypes && Object.keys(gameProgress.questionTypes).length > 0) {
            syncQuestionTypes();
        }
    }, [gameProgress.questionTypes, updateUserStats]);

    // Real-time sync when achievements changes
    useEffect(() => {
        const syncAchievements = async () => {
            try {
                await updateUserStats({
                    achievements: gameProgress.achievements
                });
                console.log('🎮 Achievements synced:', { achievements: gameProgress.achievements });
            } catch (error) {
                console.error('❌ Error syncing achievements:', error);
            }
        };
        
        if (gameProgress.achievements && gameProgress.achievements.length > 0) {
            syncAchievements();
        }
    }, [gameProgress.achievements, updateUserStats]);

    // Real-time sync when timePerQuestion changes
    useEffect(() => {
        const syncTimePerQuestion = async () => {
            try {
                await updateUserStats({
                    timePerQuestion: gameProgress.timePerQuestion
                });
                console.log('🎮 TimePerQuestion synced:', { timePerQuestion: gameProgress.timePerQuestion });
            } catch (error) {
                console.error('❌ Error syncing timePerQuestion:', error);
            }
        };
        
        if (gameProgress.timePerQuestion && gameProgress.timePerQuestion.length > 0) {
            syncTimePerQuestion();
        }
    }, [gameProgress.timePerQuestion, updateUserStats]);

    // Real-time sync when startTime changes
    useEffect(() => {
        const syncStartTime = async () => {
            try {
                await updateUserStats({
                    startTime: gameProgress.startTime
                });
                console.log('🎮 StartTime synced:', { startTime: gameProgress.startTime });
            } catch (error) {
                console.error('❌ Error syncing startTime:', error);
            }
        };
        
        if (gameProgress.startTime > 0) {
            syncStartTime();
        }
    }, [gameProgress.startTime, updateUserStats]);

    // Real-time sync when endTime changes
    useEffect(() => {
        const syncEndTime = async () => {
            try {
                await updateUserStats({
                    endTime: gameProgress.endTime
                });
                console.log('🎮 EndTime synced:', { endTime: gameProgress.endTime });
            } catch (error) {
                console.error('❌ Error syncing endTime:', error);
            }
        };
        
        if (gameProgress.endTime > 0) {
            syncEndTime();
        }
    }, [gameProgress.endTime, updateUserStats]);

    // Real-time sync when xpEarned changes
    useEffect(() => {
        const syncXPEarned = async () => {
            try {
                await updateUserStats({
                    xpEarned: gameProgress.xpEarned
                });
                console.log('🎮 XPEarned synced:', { xpEarned: gameProgress.xpEarned });
            } catch (error) {
                console.error('❌ Error syncing xpEarned:', error);
            }
        };
        
        if (gameProgress.xpEarned > 0) {
            syncXPEarned();
        }
    }, [gameProgress.xpEarned, updateUserStats]);

    // Real-time sync when diamondsEarned changes
    useEffect(() => {
        const syncDiamondsEarned = async () => {
            try {
                await updateUserStats({
                    diamondsEarned: gameProgress.diamondsEarned
                });
                console.log('🎮 DiamondsEarned synced:', { diamondsEarned: gameProgress.diamondsEarned });
            } catch (error) {
                console.error('❌ Error syncing diamondsEarned:', error);
            }
        };
        
        if (gameProgress.diamondsEarned > 0) {
            syncDiamondsEarned();
        }
    }, [gameProgress.diamondsEarned, updateUserStats]);

    // Real-time sync when gameProgress.level changes
    useEffect(() => {
        const syncGameProgressLevel = async () => {
            try {
                await updateUserStats({
                    level: gameProgress.level
                });
                console.log('🎮 GameProgressLevel synced:', { level: gameProgress.level });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.level:', error);
            }
        };
        
        if (gameProgress.level > 1) {
            syncGameProgressLevel();
        }
    }, [gameProgress.level, updateUserStats]);

    // Real-time sync when gameProgress.achievements changes
    useEffect(() => {
        const syncGameProgressAchievements = async () => {
            try {
                await updateUserStats({
                    achievements: gameProgress.achievements
                });
                console.log('🎮 GameProgressAchievements synced:', { achievements: gameProgress.achievements });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.achievements:', error);
            }
        };
        
        if (gameProgress.achievements && gameProgress.achievements.length > 0) {
            syncGameProgressAchievements();
        }
    }, [gameProgress.achievements, updateUserStats]);

    // Real-time sync when gameProgress.questionTypes changes
    useEffect(() => {
        const syncGameProgressQuestionTypes = async () => {
            try {
                await updateUserStats({
                    questionTypes: gameProgress.questionTypes
                });
                console.log('🎮 GameProgressQuestionTypes synced:', { questionTypes: gameProgress.questionTypes });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.questionTypes:', error);
            }
        };
        
        if (gameProgress.questionTypes && Object.keys(gameProgress.questionTypes).length > 0) {
            syncGameProgressQuestionTypes();
        }
    }, [gameProgress.questionTypes, updateUserStats]);

    // Real-time sync when gameProgress.timePerQuestion changes
    useEffect(() => {
        const syncGameProgressTimePerQuestion = async () => {
            try {
                await updateUserStats({
                    timePerQuestion: gameProgress.timePerQuestion
                });
                console.log('🎮 GameProgressTimePerQuestion synced:', { timePerQuestion: gameProgress.timePerQuestion });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.timePerQuestion:', error);
            }
        };
        
        if (gameProgress.timePerQuestion && gameProgress.timePerQuestion.length > 0) {
            syncGameProgressTimePerQuestion();
        }
    }, [gameProgress.timePerQuestion, updateUserStats]);

    // Real-time sync when gameProgress.totalTimeSpent changes
    useEffect(() => {
        const syncGameProgressTotalTimeSpent = async () => {
            try {
                await updateUserStats({
                    totalTimeSpent: gameProgress.totalTimeSpent
                });
                console.log('🎮 GameProgressTotalTimeSpent synced:', { totalTimeSpent: gameProgress.totalTimeSpent });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.totalTimeSpent:', error);
            }
        };
        
        if (gameProgress.totalTimeSpent > 0) {
            syncGameProgressTotalTimeSpent();
        }
    }, [gameProgress.totalTimeSpent, updateUserStats]);

    // Real-time sync when gameProgress.completedQuestions changes
    useEffect(() => {
        const syncGameProgressCompletedQuestions = async () => {
            try {
                await updateUserStats({
                    completedQuestions: gameProgress.completedQuestions
                });
                console.log('🎮 GameProgressCompletedQuestions synced:', { completedQuestions: gameProgress.completedQuestions });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.completedQuestions:', error);
            }
        };
        
        if (gameProgress.completedQuestions > 0) {
            syncGameProgressCompletedQuestions();
        }
    }, [gameProgress.completedQuestions, updateUserStats]);

    // Real-time sync when gameProgress.correctAnswers changes
    useEffect(() => {
        const syncGameProgressCorrectAnswers = async () => {
            try {
                await updateUserStats({
                    correctAnswers: gameProgress.correctAnswers
                });
                console.log('🎮 GameProgressCorrectAnswers synced:', { correctAnswers: gameProgress.correctAnswers });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.correctAnswers:', error);
            }
        };
        
        if (gameProgress.correctAnswers > 0) {
            syncGameProgressCorrectAnswers();
        }
    }, [gameProgress.correctAnswers, updateUserStats]);

    // Real-time sync when gameProgress.wrongAnswers changes
    useEffect(() => {
        const syncGameProgressWrongAnswers = async () => {
            try {
                await updateUserStats({
                    wrongAnswers: gameProgress.wrongAnswers
                });
                console.log('🎮 GameProgressWrongAnswers synced:', { wrongAnswers: gameProgress.wrongAnswers });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.wrongAnswers:', error);
            }
        };
        
        if (gameProgress.wrongAnswers > 0) {
            syncGameProgressWrongAnswers();
        }
    }, [gameProgress.wrongAnswers, updateUserStats]);

    // Real-time sync when gameProgress.totalQuestions changes
    useEffect(() => {
        const syncGameProgressTotalQuestions = async () => {
            try {
                await updateUserStats({
                    totalQuestions: gameProgress.totalQuestions
                });
                console.log('🎮 GameProgressTotalQuestions synced:', { totalQuestions: gameProgress.totalQuestions });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.totalQuestions:', error);
            }
        };
        
        if (gameProgress.totalQuestions > 0) {
            syncGameProgressTotalQuestions();
        }
    }, [gameProgress.totalQuestions, updateUserStats]);

    // Real-time sync when gameProgress.accuracy changes
    useEffect(() => {
        const syncGameProgressAccuracy = async () => {
            try {
                await updateUserStats({
                    accuracy: gameProgress.accuracy
                });
                console.log('🎮 GameProgressAccuracy synced:', { accuracy: gameProgress.accuracy });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.accuracy:', error);
            }
        };
        
        if (gameProgress.accuracy > 0) {
            syncGameProgressAccuracy();
        }
    }, [gameProgress.accuracy, updateUserStats]);

    // Real-time sync when gameProgress.streak changes
    useEffect(() => {
        const syncGameProgressStreak = async () => {
            try {
                await updateUserStats({
                    streak: gameProgress.streak
                });
                console.log('🎮 GameProgressStreak synced:', { streak: gameProgress.streak });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.streak:', error);
            }
        };
        
        if (gameProgress.streak > 0) {
            syncGameProgressStreak();
        }
    }, [gameProgress.streak, updateUserStats]);

    // Real-time sync when gameProgress.maxStreak changes
    useEffect(() => {
        const syncGameProgressMaxStreak = async () => {
            try {
                await updateUserStats({
                    maxStreak: gameProgress.maxStreak
                });
                console.log('🎮 GameProgressMaxStreak synced:', { maxStreak: gameProgress.maxStreak });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.maxStreak:', error);
            }
        };
        
        if (gameProgress.maxStreak > 0) {
            syncGameProgressMaxStreak();
        }
    }, [gameProgress.maxStreak, updateUserStats]);

    // Real-time sync when gameProgress.startTime changes
    useEffect(() => {
        const syncGameProgressStartTime = async () => {
            try {
                await updateUserStats({
                    startTime: gameProgress.startTime
                });
                console.log('🎮 GameProgressStartTime synced:', { startTime: gameProgress.startTime });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.startTime:', error);
            }
        };
        
        if (gameProgress.startTime > 0) {
            syncGameProgressStartTime();
        }
    }, [gameProgress.startTime, updateUserStats]);

    // Real-time sync when gameProgress.endTime changes
    useEffect(() => {
        const syncGameProgressEndTime = async () => {
            try {
                await updateUserStats({
                    endTime: gameProgress.endTime
                });
                console.log('🎮 GameProgressEndTime synced:', { endTime: gameProgress.endTime });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.endTime:', error);
            }
        };
        
        if (gameProgress.endTime > 0) {
            syncGameProgressEndTime();
        }
    }, [gameProgress.endTime, updateUserStats]);

    // Real-time sync when gameProgress.xpEarned changes
    useEffect(() => {
        const syncGameProgressXPEarned = async () => {
            try {
                await updateUserStats({
                    xpEarned: gameProgress.xpEarned
                });
                console.log('🎮 GameProgressXPEarned synced:', { xpEarned: gameProgress.xpEarned });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.xpEarned:', error);
            }
        };
        
        if (gameProgress.xpEarned > 0) {
            syncGameProgressXPEarned();
        }
    }, [gameProgress.xpEarned, updateUserStats]);

    // Real-time sync when gameProgress.diamondsEarned changes
    useEffect(() => {
        const syncGameProgressDiamondsEarned = async () => {
            try {
                await updateUserStats({
                    diamondsEarned: gameProgress.diamondsEarned
                });
                console.log('🎮 GameProgressDiamondsEarned synced:', { diamondsEarned: gameProgress.diamondsEarned });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.diamondsEarned:', error);
            }
        };
        
        if (gameProgress.diamondsEarned > 0) {
            syncGameProgressDiamondsEarned();
        }
    }, [gameProgress.diamondsEarned, updateUserStats]);

    // Real-time sync when gameProgress.level changes
    useEffect(() => {
        const syncGameProgressLevel = async () => {
            try {
                await updateUserStats({
                    level: gameProgress.level
                });
                console.log('🎮 GameProgressLevel synced:', { level: gameProgress.level });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.level:', error);
            }
        };
        
        if (gameProgress.level > 1) {
            syncGameProgressLevel();
        }
    }, [gameProgress.level, updateUserStats]);

    // Real-time sync when gameProgress.achievements changes
    useEffect(() => {
        const syncGameProgressAchievements = async () => {
            try {
                await updateUserStats({
                    achievements: gameProgress.achievements
                });
                console.log('🎮 GameProgressAchievements synced:', { achievements: gameProgress.achievements });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.achievements:', error);
            }
        };
        
        if (gameProgress.achievements && gameProgress.achievements.length > 0) {
            syncGameProgressAchievements();
        }
    }, [gameProgress.achievements, updateUserStats]);

    // Real-time sync when gameProgress.questionTypes changes
    useEffect(() => {
        const syncGameProgressQuestionTypes = async () => {
            try {
                await updateUserStats({
                    questionTypes: gameProgress.questionTypes
                });
                console.log('🎮 GameProgressQuestionTypes synced:', { questionTypes: gameProgress.questionTypes });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.questionTypes:', error);
            }
        };
        
        if (gameProgress.questionTypes && Object.keys(gameProgress.questionTypes).length > 0) {
            syncGameProgressQuestionTypes();
        }
    }, [gameProgress.questionTypes, updateUserStats]);

    // Real-time sync when gameProgress.timePerQuestion changes
    useEffect(() => {
        const syncGameProgressTimePerQuestion = async () => {
            try {
                await updateUserStats({
                    timePerQuestion: gameProgress.timePerQuestion
                });
                console.log('🎮 GameProgressTimePerQuestion synced:', { timePerQuestion: gameProgress.timePerQuestion });
            } catch (error) {
                console.error('❌ Error syncing gameProgress.timePerQuestion:', error);
            }
        };
        
        if (gameProgress.timePerQuestion && gameProgress.timePerQuestion.length > 0) {
            syncGameProgressTimePerQuestion();
        }
    }, [gameProgress.timePerQuestion, updateUserStats]);

    // Cleanup TTS listeners
    useEffect(() => {
        return () => {
            vaja9TtsService.cleanup();
        };
    }, []);

    // Question rendering function
    const renderQuestionComponent = () => {
        console.log('🎯 Rendering vowel question:', { 
            hasCurrentQuestion: !!currentQuestion, 
            questionType: currentQuestion?.type,
            questionsLength: questions.length,
            currentIndex: currentQuestIndex
        });
        
        if (!currentQuestion) {
            console.warn('⚠️ No current question to render');
            return (
                <View style={styles.questionContainer}>
                    <Text style={styles.instructionText}>กำลังโหลดคำถาม...</Text>
                </View>
            );
        }

        const commonProps = {
            data: currentQuestion,
            onAnswerChange: setUserAnswer,
            userAnswer: userAnswer,
            isAnswered: isCorrect !== null,
            isCorrect: isCorrect, 
        };

        switch (currentQuestion.type) {
            case 'ARRANGE_SENTENCE':
                return <ArrangementComponent 
                    data={currentQuestion}
                    onAnswerChange={setUserAnswer}
                    userAnswer={userAnswer || []}
                    isAnswered={isCorrect !== null}
                    isCorrect={isCorrect}
                />;
            case 'MATCH_PICTURE':
                return <MatchingComponent {...commonProps} />;
            case 'DRAG_MATCH':
                return <DragMatchComponent {...commonProps} />;
            case 'LISTEN_CHOOSE':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.instructionText}>{currentQuestion.instruction}</Text>
                        <View style={styles.audioContainer}>
                            <AudioButton 
                                onPress={() => {
                                    if (currentQuestion.audioText) {
                                        vaja9TtsService.playThai(currentQuestion.audioText);
                                    }
                                }}
                                text={currentQuestion.audioText}
                            />
                        </View>
                        <View style={styles.choicesContainer}>
                            {currentQuestion.choices?.map((choice) => (
                                <TouchableOpacity
                                    key={choice.id}
                                    style={[
                                        styles.choiceButton,
                                        userAnswer === choice.text && styles.selectedChoice,
                                        isCorrect !== null && choice.text === currentQuestion.correctText && styles.correctChoice,
                                        isCorrect !== null && userAnswer === choice.text && choice.text !== currentQuestion.correctText && styles.wrongChoice
                                    ]}
                                    onPress={() => setUserAnswer(choice.text)}
                                    disabled={isCorrect !== null}
                                >
                                    <Text style={styles.choiceText}>{choice.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            case 'PICTURE_MATCH':
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.instructionText}>{currentQuestion.instruction}</Text>
                        {!!currentQuestion.imageSource && (
                            <View style={{ width: 220, height: 220, marginBottom: 14, borderRadius: 16, overflow: 'hidden', alignSelf: 'center' }}>
                                <Image source={currentQuestion.imageSource} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                            </View>
                        )}
                        {!!currentQuestion.questionText && <Text style={styles.questionText}>{currentQuestion.questionText}</Text>}
                        <View style={styles.choicesContainer}>
                            {currentQuestion.choices?.map((choice) => (
                                <TouchableOpacity
                                    key={choice.id}
                                    style={[
                                        styles.choiceButton,
                                        userAnswer === choice.text && styles.selectedChoice,
                                        isCorrect !== null && choice.text === currentQuestion.correctText && styles.correctChoice,
                                        isCorrect !== null && userAnswer === choice.text && choice.text !== currentQuestion.correctText && styles.wrongChoice
                                    ]}
                                    onPress={() => setUserAnswer(choice.text)}
                                    disabled={isCorrect !== null}
                                >
                                    <Text style={styles.choiceText}>{choice.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            default:
                return (
                    <View style={styles.questionContainer}>
                        <Text style={styles.instructionText}>คำถามไม่รองรับ</Text>
                    </View>
                );
        }
    };

    // Handle check answer
    const handleCheckAnswer = React.useCallback(async () => {
        if (!currentQuestion) return;
        if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) return;

        let correct = false;
        switch (currentQuestion.type) {
            case 'ARRANGE_SENTENCE':
            case 'DRAG_ORDER':
                correct = JSON.stringify(userAnswer) === JSON.stringify(currentQuestion.correctOrder);
                break;
            case 'MATCH_PICTURE':
            case 'LISTEN_CHOOSE':
            case 'PICTURE_MATCH':
            case 'MATCH_LETTER':
            case 'FILL_BLANK':
                correct = userAnswer === currentQuestion.correctText;
                break;
            case 'DRAG_MATCH':
                // ตรวจสอบการเชื่อมต่อที่ถูกต้องทั้งหมด
                if (userAnswer && typeof userAnswer === 'object') {
                    const allCorrect = currentQuestion.leftItems.every(leftItem => {
                        const userAnswerText = userAnswer[leftItem.id];
                        return userAnswerText === leftItem.correctMatch;
                    });
                    const allConnected = currentQuestion.leftItems.every(leftItem => {
                        return userAnswer[leftItem.id];
                    });
                    correct = allCorrect && allConnected;
                }
                break;
            case 'SOUND_GROUP':
                correct = (currentQuestion.correctText || '').split(',').includes(userAnswer);
                break;
        }
        
        // อัปเดตความคืบหน้า
        updateGameProgress({
            isCorrect: correct,
            questionType: currentQuestion.type,
            xp: correct ? 10 : 0
        });

        setIsCorrect(correct);
        if (currentQuestion.vowelChar) updateLetterMastery(currentQuestion.vowelChar, correct);
        if (currentQuestion.vowelChars) currentQuestion.vowelChars.forEach(ch => updateLetterMastery(ch, correct));
        
        // ตรวจสอบว่าจบเกมหรือไม่
        if (currentQuestIndex === questions.length - 1) {
            // จบเกม - อัปเดตข้อมูลความคืบหน้าสุดท้าย
            setGameProgress(prev => {
                const finalProgress = {
                    ...prev,
                    endTime: Date.now(),
                    totalTimeSpent: Date.now() - prev.startTime
                };
                
                (async () => {
                    try {
                        const combinedXP = finalProgress.xpEarned;
                        const combinedDiamonds = finalProgress.diamondsEarned;
                        const accuracyPercent = questions.length > 0
                          ? Math.round((finalProgress.correctAnswers / questions.length) * 100)
                          : 0;
                        const timeSpentSeconds = Math.round(finalProgress.totalTimeSpent / 1000);
                        const completedAt = new Date().toISOString();

                        const sessionPayload = {
                            lessonId: lessonId,
                            category,
                            score,
                            accuracy: accuracyPercent / 100,
                            timeSpent: timeSpentSeconds,
                            questionTypes: finalProgress.questionTypes || {},
                            completedAt,
                            heartsRemaining: hearts,
                            diamondsEarned: combinedDiamonds,
                            xpEarned: combinedXP,
                            streak: finalProgress.streak || 0,
                            maxStreak: finalProgress.maxStreak || 0,
                            level: userStats.currentLevel,
                            totalQuestions: questions.length,
                            correctAnswers: finalProgress.correctAnswers,
                            wrongAnswers: finalProgress.wrongAnswers
                        };

                        try {
                            const savedSession = await gameProgressService.saveGameSession(sessionPayload);
                            console.log('✅ Vowel session saved:', savedSession.id);
                        } catch (saveError) {
                            console.error('❌ Error saving vowel session:', saveError);
                        }

                        const legacyStats = await updateUserStatsLegacy(finalProgress.xpEarned, finalProgress.diamondsEarned);

                        const updatedUnified = await updateUnifiedFromGameSession({
                            ...sessionPayload,
                            gameType: 'ThaiVowelGame'
                        });

                        const gameResults = {
                            correct: finalProgress.correctAnswers,
                            total: questions.length,
                            accuracy: accuracyPercent,
                            timeSpent: timeSpentSeconds,
                            xpEarned: combinedXP,
                            diamondsEarned: combinedDiamonds,
                            heartsRemaining: hearts,
                            gameType: 'ThaiVowelGame',
                            completedAt
                        };

                        await updateUnifiedStats({ lastGameResults: gameResults });
                        await updateUserStats({ lastGameResults: gameResults });

                        await applyDelta({ 
                            xp: combinedXP, 
                            diamonds: combinedDiamonds,
                            finishedLesson: true,
                            timeSpentSec: timeSpentSeconds
                        });

                        clearGameProgress();
                        sessionFinalizedRef.current = true;

                        setSummaryData({
                            ...gameResults,
                            newLevel: updatedUnified?.level || legacyStats.currentLevel,
                            totalXP: updatedUnified?.xp ?? legacyStats.totalXP,
                            totalDiamonds: updatedUnified?.diamonds ?? legacyStats.totalDiamonds,
                            levelProgress: updatedUnified
                              ? ((updatedUnified.xp || 0) % 100) / 100
                              : legacyStats.levelProgress
                        });
                        setShowSummary(true);
                    } catch (error) {
                        console.error('❌ Error finalizing vowel game summary:', error);
                    }
                })();
                
                return finalProgress;
            });
        }

        setScore(s => s + (correct ? 10 : 0));
        if (!correct) setHearts(h => Math.max(0, h - 1));
    }, [currentQuestion, userAnswer, updateUserStats, applyDelta, getTotalXP]);

    // Update letter mastery
    const updateLetterMastery = (char, correct) => {
        setPerLetter(prev => ({
            ...prev,
            [char]: {
                ...prev[char],
                total: (prev[char]?.total || 0) + 1,
                correct: (prev[char]?.correct || 0) + (correct ? 1 : 0),
                accuracy: ((prev[char]?.correct || 0) + (correct ? 1 : 0)) / ((prev[char]?.total || 0) + 1) * 100
            }
        }));
    };

    // Finish lesson
    const finishLesson = React.useCallback(async (timeSpentSec = 0) => {
        await clearAutosnap(lessonId);
        
        // Calculate rewards
        const xpGained = score;
        const diamondsGained = Math.max(2, Math.floor(score / 50));
        const accuracy = questions.length > 0 ? Math.round((score / (questions.length * 10)) * 100) : 0;
        
        if (!sessionFinalizedRef.current) {
            try {
                const sessionPayload = {
                    lessonId,
                    category,
                    score,
                    accuracy: accuracy / 100,
                    timeSpent: timeSpentSec,
                    questionTypes: gameProgress.questionTypes || {},
                    completedAt: new Date().toISOString(),
                    heartsRemaining: hearts,
                    diamondsEarned: diamondsGained,
                    xpEarned: xpGained,
                    streak: gameProgress.streak || 0,
                    maxStreak: gameProgress.maxStreak || 0,
                    level: userStats.currentLevel,
                    totalQuestions: questions.length,
                    correctAnswers: gameProgress.correctAnswers,
                    wrongAnswers: gameProgress.wrongAnswers
                };

                try {
                    const savedSession = await gameProgressService.saveGameSession(sessionPayload);
                    console.log('✅ Vowel session saved (fallback path):', savedSession.id);
                } catch (saveErr) {
                    console.error('❌ Error saving vowel session (fallback):', saveErr);
                }

                await updateUnifiedFromGameSession({
                    ...sessionPayload,
                    gameType: 'ThaiVowelGame'
                });

                const gameResults = {
                    correct: gameProgress.correctAnswers,
                    total: questions.length,
                    accuracy,
                    timeSpent: timeSpentSec,
                    xpEarned: xpGained,
                    diamondsEarned: diamondsGained,
                    heartsRemaining: hearts,
                    gameType: 'ThaiVowelGame',
                    completedAt: new Date().toISOString()
                };

                await updateUnifiedStats({ lastGameResults: gameResults });
                await updateUserStats({ lastGameResults: gameResults });

                await applyDelta({ 
                    xp: xpGained, 
                    diamonds: diamondsGained, 
                    finishedLesson: true, 
                    timeSpentSec 
                });

                const currentLevelId = `level${lessonId}`;
                const unlockResult = await levelUnlockService.checkAndUnlockNextLevel(currentLevelId, {
                    accuracy,
                    score,
                    attempts: 1
                });

                if (unlockResult) {
                    console.log('🎉 Next level unlocked!', unlockResult);
                }

                sessionFinalizedRef.current = true;
            } catch (err) {
                console.error('❌ Error finalizing lesson (fallback):', err);
            }
        }
        
        // Navigate to completion screen with all data
        navigation.replace('LessonComplete', { 
            score, 
            totalQuestions: questions.length,
            timeSpent: timeSpentSec,
            accuracy,
            xpGained,
            diamondsGained
        });
    }, [lessonId, score, questions.length, updateUserStats]);

    // Handle continue
    const handleContinue = React.useCallback(async () => {
        if (currentQuestIndex < questions.length - 1) {
            setCurrentQuestIndex(i => i + 1);
            setIsCorrect(null);
            setUserAnswer(null);
        } else {
            const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
            await finishLesson(timeSpent);
        }
    }, [currentQuestIndex, questions.length, finishLesson]);

    // Audio Button Component
    const AudioButton = ({ onPress, text }) => (
        <TouchableOpacity style={styles.audioButton} onPress={onPress}>
            <FontAwesome name="volume-up" size={24} color="#FF8000" />
            <Text style={styles.audioText}>{text}</Text>
        </TouchableOpacity>
    );

    // Check Button Component
    const CheckButton = ({ onPress, disabled }) => (
        <TouchableOpacity 
            style={[styles.checkButton, disabled && styles.checkButtonDisabled]} 
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={[styles.checkButtonText, disabled && styles.checkButtonTextDisabled]}>
                CHECK
            </Text>
        </TouchableOpacity>
    );

    // Feedback Bar Component
    const FeedbackBar = ({ isCorrect, onContinue }) => (
        <View style={[styles.feedbackBar, { backgroundColor: isCorrect ? '#58cc02' : '#ff4b4b' }]}>
            <Text style={styles.feedbackText}>
                {isCorrect ? 'ถูกต้อง!' : 'ผิด!'}
            </Text>
            <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
                <Text style={styles.continueButtonText}>CONTINUE</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <LottieView
                        source={require('../assets/animations/LoadingCat.json')}
                        autoPlay
                        loop
                        style={styles.loadingAnimation}
                    />
                    <Text style={styles.loadingText}>
                        {gameSession.isResumed ? 'กำลังโหลดเกมต่อ...' : 'กำลังโหลด...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (showSummary) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>🎉 เสร็จสิ้น!</Text>
                    
                    {/* สถิติเกม */}
                    <View style={styles.gameStatsContainer}>
                        <Text style={styles.gameStatsTitle}>ผลการเล่น</Text>
                        <View style={styles.gameStatsRow}>
                            <Text style={styles.gameStatsText}>
                                ตอบถูก {summaryData.correct} จาก {summaryData.total} ข้อ
                            </Text>
                        </View>
                        <View style={styles.gameStatsRow}>
                            <Text style={styles.gameStatsText}>
                                ความแม่นยำ: {summaryData.accuracy}%
                            </Text>
                        </View>
                        <View style={styles.gameStatsRow}>
                            <Text style={styles.gameStatsText}>
                                เวลาที่ใช้: {summaryData.timeSpent} วินาที
                            </Text>
                        </View>
                    </View>

                    {/* รางวัลที่ได้รับ */}
                    <View style={styles.rewardsContainer}>
                        <Text style={styles.rewardsTitle}>รางวัลที่ได้รับ</Text>
                        <View style={styles.rewardsRow}>
                            <View style={styles.rewardItem}>
                                <LottieView
                                    source={require('../assets/animations/Star.json')}
                                    autoPlay
                                    loop
                                    style={styles.rewardAnimation}
                                />
                                <Text style={styles.rewardText}>+{summaryData.xpEarned} XP</Text>
                            </View>
                            <View style={styles.rewardItem}>
                                <LottieView
                                    source={require('../assets/animations/Diamond.json')}
                                    autoPlay
                                    loop
                                    style={styles.rewardAnimation}
                                />
                                <Text style={styles.rewardText}>+{summaryData.diamondsEarned} เพชร</Text>
                            </View>
                        </View>
                    </View>

                    {/* ข้อมูลผู้ใช้รวม */}
                    <View style={styles.userStatsContainer}>
                        <Text style={styles.userStatsTitle}>ข้อมูลรวมของคุณ</Text>
                        <View style={styles.userStatsRow}>
                            <View style={styles.userStatItem}>
                                <LottieView
                                    source={require('../assets/animations/Star.json')}
                                    autoPlay
                                    loop
                                    style={styles.userStatAnimation}
                                />
                                <Text style={styles.userStatText}>{summaryData.totalXP} XP</Text>
                            </View>
                            <View style={styles.userStatItem}>
                                <LottieView
                                    source={require('../assets/animations/Diamond.json')}
                                    autoPlay
                                    loop
                                    style={styles.userStatAnimation}
                                />
                                <Text style={styles.userStatText}>{summaryData.totalDiamonds} เพชร</Text>
                            </View>
                            <View style={styles.userStatItem}>
                                <LottieView
                                    source={require('../assets/animations/Trophy.json')}
                                    autoPlay
                                    loop
                                    style={styles.userStatAnimation}
                                />
                                <Text style={styles.userStatText}>Level {summaryData.newLevel}</Text>
                            </View>
                        </View>
                        
                        {/* แถบความคืบหน้า Level */}
                        <View style={styles.levelProgressContainer}>
                            <Text style={styles.levelProgressText}>
                                ความคืบหน้า Level {summaryData.newLevel}
                            </Text>
                            <View style={styles.levelProgressBar}>
                                <View style={styles.levelProgressTrack}>
                                    <LinearGradient
                                        colors={['#FF8000', '#FFB84D', '#FFD700']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[
                                            styles.levelProgressFill,
                                            { width: `${summaryData.levelProgress * 100}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.levelProgressPercent}>
                                    {Math.round(summaryData.levelProgress * 100)}%
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.continueButton}
                        onPress={async () => {
                            // ลบความคืบหน้าของเกมเมื่อจบ
                            await clearGameProgress();
                            navigation.goBack();
                        }}
                    >
                        <Text style={styles.continueButtonText}>กลับ</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Enhanced Header with Clean Design */}
            <View style={styles.headerContainer}>
                {/* Top Row - Back Button and Hearts */}
                <View style={styles.headerTopRow}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={async () => {
                            // เซฟความคืบหน้าก่อนออก
                            await saveGameProgress();
                            navigation.goBack();
                        }}
                    >
                        <FontAwesome name="times" size={20} color="#FF8000" />
                    </TouchableOpacity>
                    
                    <View style={styles.heartsContainer}>
                        <View style={styles.badgeIconWrap}>
                            <LottieView
                                source={require('../assets/animations/Heart.json')}
                                autoPlay
                                loop
                                style={styles.badgeAnim}
                            />
                        </View>
                        <Text style={styles.badgeValue}>{hearts}</Text>
                    </View>
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                    {gameSession.isResumed && (
                        <View style={styles.resumeNotification}>
                            <FontAwesome name="play-circle" size={14} color="#4CAF50" />
                            <Text style={styles.resumeText}>เล่นต่อจากข้อที่ {currentQuestIndex + 1}</Text>
                        </View>
                    )}
                    
                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                            <LinearGradient
                                colors={['#FF8000', '#FFB84D', '#FFD700']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[
                                    styles.progressFill, 
                                    { width: questions.length > 0 ? `${((currentQuestIndex + 1) / questions.length) * 100}%` : '0%' }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {questions.length > 0 ? `${currentQuestIndex + 1} / ${questions.length}` : '0 / 0'}
                        </Text>
                    </View>
                    
                    {/* Compact Stats Row */}
                    <View style={styles.compactStatsRow}>
                        <View style={styles.compactStatItem}>
                            <LottieView
                                source={require('../assets/animations/Star.json')}
                                autoPlay
                                loop
                                style={styles.compactStatAnimation}
                            />
                            <Text style={styles.compactStatText}>{gameProgress.xpEarned}</Text>
                        </View>
                        <View style={styles.compactStatItem}>
                            <FontAwesome name="bullseye" size={10} color="#4ECDC4" />
                            <Text style={styles.compactStatText}>{gameProgress.accuracy.toFixed(0)}%</Text>
                        </View>
                        <View style={styles.compactStatItem}>
                            <FontAwesome name="fire" size={10} color="#FF8C00" />
                            <Text style={styles.compactStatText}>{gameProgress.streak}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Question Card with Enhanced Design */}
                <View style={styles.questionCardContainer}>
                    {renderQuestionComponent()}
                </View>
            </ScrollView>

            {/* Enhanced Bottom Action Area */}
            <View style={styles.bottomActionArea}>
                {isCorrect !== null ? (
                    <FeedbackBar 
                        isCorrect={isCorrect} 
                        onContinue={handleContinue}
                    />
                ) : (
                    <CheckButton 
                        onPress={handleCheckAnswer} 
                        disabled={!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)} 
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#fff' 
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingAnimation: {
        width: 100,
        height: 100,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#666',
    },
    headerContainer: {
        backgroundColor: '#fff',
        paddingTop: 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressSection: {
        flex: 1,
    },
    backButton: {
        padding: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    progressBarContainer: {
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        textAlign: 'center',
        marginTop: 5,
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    resumeNotification: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
        alignSelf: 'center',
    },
    resumeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4CAF50',
        marginLeft: 4,
    },
    compactStatsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    compactStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    compactStatText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#666',
        marginLeft: 3,
    },
    compactStatAnimation: {
        width: 10,
        height: 10,
    },
    rewardAnimation: {
        width: 24,
        height: 24,
    },
    userStatAnimation: {
        width: 20,
        height: 20,
    },
    heartsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heartsText: {
        marginLeft: 5,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ff4b4b',
    },
    badgeIconWrap: {
        width: 26,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    badgeAnim: {
        width: 32,
        height: 32,
        marginBottom: 4,
    },
    badgeValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF8000',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
        paddingBottom: 100,
    },
    questionCardContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 0,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    bottomActionArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingTop: 15,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    questionContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        marginBottom: 0,
    },
    instructionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF8000',
        marginBottom: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(255, 128, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    questionText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    answerArea: {
        minHeight: 60,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrangedWordsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    arrangedWord: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    arrangedWordText: {
        fontSize: 16,
        color: '#333',
    },
    wordBank: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    wordButton: {
        backgroundColor: '#FF8000',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    wordButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    choicesContainer: {
        gap: 15,
    },
    choiceButton: {
        backgroundColor: '#ffffff',
        borderWidth: 3,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        minHeight: 70,
        justifyContent: 'center',
        marginVertical: 8,
    },
    selectedChoice: {
        borderColor: '#FF8000',
        backgroundColor: '#fff5e6',
        borderWidth: 4,
        shadowColor: '#FF8000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    correctChoice: {
        borderColor: '#58cc02',
        backgroundColor: '#d4f4aa',
    },
    wrongChoice: {
        borderColor: '#ff4b4b',
        backgroundColor: '#ffb3b3',
    },
    choiceText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    audioContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    audioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5e6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#FF8000',
    },
    audioText: {
        marginLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF8000',
    },
    checkButton: {
        backgroundColor: '#FF8000',
        paddingVertical: 18,
        marginHorizontal: 0,
        marginBottom: 0,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#FF8000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    checkButtonDisabled: {
        backgroundColor: '#ccc',
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    checkButtonTextDisabled: {
        color: '#999',
    },
    feedbackBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingVertical: 18,
        marginHorizontal: 0,
        marginBottom: 0,
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    feedbackText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    continueButton: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // Drag Match Styles
    dragMatchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
        minHeight: 250,
        paddingHorizontal: 15,
    },
    leftColumn: {
        flex: 1,
        marginRight: 20,
        justifyContent: 'space-around',
    },
    rightColumn: {
        flex: 1,
        marginLeft: 20,
        justifyContent: 'space-around',
    },
    dragItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 5,
    },
    connectionSymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 6,
    },
    dragItem: {
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        padding: 18,
        marginVertical: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        minHeight: 60,
        justifyContent: 'center',
    },
    selectedDragItem: {
        borderColor: '#FF8000',
        backgroundColor: '#fff5e6',
        borderWidth: 4,
        shadowColor: '#FF8000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    correctDragItem: {
        borderColor: '#58cc02',
        backgroundColor: '#d4f4aa',
    },
    wrongDragItem: {
        borderColor: '#ff4b4b',
        backgroundColor: '#ffb3b3',
    },
    dragItemText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
    },
    connectionInfo: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        alignItems: 'center',
    },
    connectionText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    // Sound Button Styles
    soundButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 15,
        paddingHorizontal: 20,
    },
    soundButton: {
        backgroundColor: '#4ECDC4',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#4ECDC4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    soundButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    removeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 5,
    },
    // Summary Screen Styles
    summaryContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        padding: 20,
        justifyContent: 'center',
    },
    summaryTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF8000',
        textAlign: 'center',
        marginBottom: 30,
    },
    gameStatsContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    gameStatsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    gameStatsRow: {
        marginBottom: 10,
    },
    gameStatsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    rewardsContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    rewardsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    rewardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    rewardItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 128, 0, 0.1)',
        padding: 15,
        borderRadius: 15,
        minWidth: 100,
    },
    rewardText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
    },
    userStatsContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    userStatsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    userStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 20,
    },
    userStatItem: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 128, 0, 0.1)',
        padding: 12,
        borderRadius: 12,
        minWidth: 80,
    },
    userStatText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 6,
    },
    levelProgressContainer: {
        marginTop: 10,
    },
    levelProgressText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
    },
    levelProgressBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelProgressTrack: {
        flex: 1,
        height: 12,
        backgroundColor: '#e0e0e0',
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: 10,
    },
    levelProgressFill: {
        height: '100%',
        borderRadius: 6,
    },
    levelProgressPercent: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF8000',
        minWidth: 40,
        textAlign: 'right',
    },
    continueButton: {
        backgroundColor: '#FF8000',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ThaiVowelsGame;
