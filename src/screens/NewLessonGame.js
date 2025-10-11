import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    Dimensions, 
    Image,
    ScrollView,
    Modal,
    Pressable,
} from 'react-native'; 	
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';
import vocabWordService from '../services/vocabWordService';
import { saveAutosnap, loadAutosnap, clearAutosnap, saveProgress } from '../services/progressService';
import { useProgress } from '../contexts/ProgressContext';
import vaja9TtsService from '../services/vaja9TtsService';
import levelUnlockService from '../services/levelUnlockService';
import { useUserData } from '../contexts/UserDataContext';
import { useUser } from '../contexts/UserContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import gameProgressService from '../services/gameProgressService';
import userStatsService from '../services/userStatsService';
import dailyStreakService from '../services/dailyStreakService';
import { letterImages } from '../assets/letters';
import StreakBadge from '../components/StreakBadge';

const { width } = Dimensions.get('window');

// Helper functions
const uid = () => Math.random().toString(36).substr(2, 9);
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const TH_CONNECTIVES = ['และ', 'หรือ', 'ของ', 'ใน', 'ที่', 'เป็น', 'มี', 'ให้', 'กับ', 'จาก'];

const groupOf = (char) => {
  if (['ก','ข','ค','ฆ'].includes(char)) return 'เสียงคอ';
  if (['จ','ฉ','ช','ซ','ศ','ษ','ส'].includes(char)) return 'เสียงศีรษะ';
  if (['ด','ต','ถ','ท'].includes(char)) return 'เสียงลิ้น';
  if (['บ','ป','ผ','พ','ฟ'].includes(char)) return 'เสียงปาก';
  return 'พยัญชนะพื้นฐาน';
};

const getNeighborChars = (char, pool) => {
  const groups = {
    'เสียงคอ': ['ก','ข','ค','ฆ'],
    'เสียงศีรษะ': ['จ','ฉ','ช','ซ','ศ','ษ','ส'],
    'เสียงลิ้น': ['ด','ต','ถ','ท'],
    'เสียงปาก': ['บ','ป','ผ','พ','ฟ']
  };
  const group = Object.keys(groups).find(g => groups[g].includes(char));
  return pool.filter(c => groups[group]?.includes(c.char) && c.char !== char);
};

// Question Factory Functions
const makeArrangeQ = (c) => {
  const t = pick([1,2,3,4,5]);

  let questionText, correctOrder;
  switch (t) {
    case 1:
      questionText = `${c.char} คือ ${c.meaning}`;
      correctOrder = [c.char, 'คือ', c.meaning];
      break;
    case 2:
      questionText = `${c.char} แปลว่า ${c.meaning}`;
      correctOrder = [c.char, 'แปลว่า', c.meaning];
      break;
    case 3:
      questionText = `เสียงอ่านของ ${c.char} คือ ${c.name}`;
      correctOrder = ['เสียงอ่านของ', c.char, 'คือ', c.name];
      break;
    case 4:
      questionText = `${c.meaning} ใช้ตัวอักษร ${c.char}`;
      correctOrder = [c.meaning, 'ใช้ตัวอักษร', c.char];
      break;
    default:
      questionText = `${c.char} เป็นพยัญชนะหมวด ${groupOf(c.char)}`;
      correctOrder = [c.char, 'เป็นพยัญชนะหมวด', groupOf(c.char)];
  }

  const base = correctOrder.map(w => ({ id: uid(), text: w }));
  const distract = shuffle(TH_CONNECTIVES).slice(0, 3).map(t => ({ id: uid(), text: t }));

  return {
    id: `arr_${c.char}_${uid()}`,
    type: 'ARRANGE_SENTENCE',
    instruction: 'เรียงคำให้เป็นประโยคที่ถูกต้อง',
    questionText,
    correctOrder,                  // string[]
    wordBank: shuffle([...base, ...distract]), // {id,text}[]
    consonantChar: c.char,
  };
};

const makeMatch_SelectChar = (c, pool) => {
  // สร้างคำถามหลายคำ (3-4 คำ)
  const selectedConsonants = shuffle(pool).slice(0, 4);
  const leftItems = selectedConsonants.map((item, i) => ({
    id: i + 1,
    text: item.meaning,
    correctMatch: item.char
  }));
  
  const rightItems = shuffle(selectedConsonants).map((item, i) => ({
    id: i + 1,
    text: item.char
  }));

  return {
    id: `match_c_${c.char}_${uid()}`,
    type: 'DRAG_MATCH',
    instruction: `ลากเส้นจับคู่ความหมายกับตัวอักษรที่ถูกต้อง`,
    questionText: `จับคู่ความหมายกับตัวอักษรให้ถูกต้อง`,
    correctText: c.char,
    consonantChar: c.char,
    leftItems,
    rightItems,
  };
};

const makeMatch_SelectMeaning = (c, pool) => {
  // สร้างคำถามหลายคำ (3-4 คำ)
  const selectedConsonants = shuffle(pool).slice(0, 4);
  const leftItems = selectedConsonants.map((item, i) => ({
    id: i + 1,
    text: item.char,
    correctMatch: item.meaning
  }));
  
  const rightItems = shuffle(selectedConsonants).map((item, i) => ({
    id: i + 1,
    text: item.meaning
  }));

  return {
    id: `match_m_${c.char}_${uid()}`,
    type: 'DRAG_MATCH',
    instruction: `ลากเส้นจับคู่ตัวอักษรกับความหมายที่ถูกต้อง`,
    questionText: `จับคู่ตัวอักษรกับความหมายให้ถูกต้อง`,
    correctText: c.meaning,
    consonantChar: c.char,
    leftItems,
    rightItems,
  };
};

const makeListenChoose = (c, pool) => {
  const near = getNeighborChars(c.char, pool);
  const fill = near.length ? near : pool.filter(x => x.char !== c.char);
  const distractors = shuffle(fill.filter(x => x.char !== c.char)).slice(0, 3);
  const choices = shuffle([c, ...distractors]).map((x, i) => ({ id: i + 1, text: x.char }));

  return {
    id: `listen_${c.char}_${uid()}`,
    type: 'LISTEN_CHOOSE',
    instruction: 'ฟังเสียงแล้วจับคู่ตัวอักษรที่ได้ยิน',
    questionText: c.name,
    correctText: c.char,
    audioText: c.name,
    choices,
    consonantChar: c.char,
  };
};

const makePictureMatch = (c, pool) => {
  const emojiMap = { 'ไก่':'🐔','ไข่':'🥚','ควาย':'🐃','งู':'🐍','จาน':'🍽️','ช้าง':'🐘','โซ่':'⛓️','หญิง':'👩','ดาบ':'⚔️','เต่า':'🐢','ถุง':'🛍️','ทหาร':'🪖','หนู':'🐭','ใบไม้':'🍃','ปลา':'🐟','ผึ้ง':'🐝','ฝา':'🛡️','พาน':'🛕','ฟัน':'🦷','ม้า':'🐴','ยักษ์':'👹','เรือ':'⛵','ลิง':'🐒','แหวน':'💍','เสือ':'🐯','หีบ':'🧰','จุฬา':'🎏','อ่าง':'🛁','นกฮูก':'🦉' };
  const emoji = emojiMap[c.meaning] || '🎯';

  const near = getNeighborChars(c.char, pool);
  const fill = near.length ? near : pool.filter(x => x.char !== c.char);
  const distractors = shuffle(fill.filter(x => x.char !== c.char)).slice(0, 3);
  const choices = shuffle([c, ...distractors]).map((x, i) => ({ id: i + 1, text: x.char }));

  return {
    id: `pic_${c.char}_${uid()}`,
    type: 'PICTURE_MATCH',
    instruction: 'จับคู่ตัวอักษรกับรูปภาพ',
    questionText: `${emoji} ${c.meaning}`,
    correctText: c.char,
    choices,
    consonantChar: c.char,
    emoji,
  };
};

// Question Generation
const generateQuestions = (consonants) => {
  const questions = [];
  const pool = consonants; // ใช้พยัญชนะทั้งหมดที่มีใน database
  
  console.log('🎯 Generating questions from', pool.length, 'consonants');
  
  // สำหรับด่านแรก (lessonId: 1) ให้เลือกแค่ 15 ตัวอักษรที่ไม่ซ้ำกัน
  let selectedConsonants = pool;
  if (consonants.length > 15) {
    // สุ่มเลือก 15 ตัวอักษรที่ไม่ซ้ำกัน
    const shuffledPool = shuffle([...pool]);
    selectedConsonants = shuffledPool.slice(0, 15);
    console.log('🎯 Selected 15 unique consonants for lesson 1:', selectedConsonants.map(c => c.char).join(', '));
  }
  
  // สร้างคำถาม 1 ข้อต่อพยัญชนะที่เลือก - เน้นเกมจับคู่ตัวอักษร
  selectedConsonants.forEach((consonant, index) => {
    // เน้นเกมจับคู่ตัวอักษร (80%) และเกมอื่นๆ (20%)
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
          questions.push(makeMatch_SelectChar(consonant, pool));
        } else {
          questions.push(makeMatch_SelectMeaning(consonant, pool));
        }
        break;
      case 'PICTURE_MATCH':
        questions.push(makePictureMatch(consonant, pool));
        break;
      case 'LISTEN_CHOOSE':
        questions.push(makeListenChoose(consonant, pool));
        break;
    }
  });
  
  // สุ่มคำถาม - ใช้จำนวนคำถามเท่ากับจำนวนพยัญชนะที่เลือก
  const shuffledQuestions = shuffle(questions);
  
  // Attach images for PICTURE_MATCH questions
  const questionsWithImages = shuffledQuestions.map(q => {
    if (q && q.type === 'PICTURE_MATCH') {
      const key = q.consonantChar || q.correctText || (Array.isArray(q.consonantChars) ? q.consonantChars[0] : null);
      return { ...q, imageSource: key ? (letterImages[key] || null) : null };
    }
    return q;
  });
  
  console.log(`🎮 Generated ${questionsWithImages.length} questions from ${selectedConsonants.length} selected consonants (${pool.length} total available)`);
  
  return questionsWithImages;
};

// Inline Components
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
        {/* ด้านซ้าย - ความหมายหรือตัวอักษร */}
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

// Main Lesson Screen - ด่านที่ 1 สำหรับ LevelStage1
const NewLessonGame = ({ navigation, route }) => {
    const {
        lessonId = 1,
        category = 'basic',
        level: levelName = 'Beginner',
        stageTitle: stageTitleParam,
    } = route.params || {};

    const currentLessonId = Number(lessonId) || 1;
    const currentCategory = category || 'basic';
    const levelLabel = levelName || 'Beginner';
    const stageTitle = stageTitleParam || `ด่าน ${currentLessonId}`;
    
    // Progress context
    const { applyDelta } = useProgress();
    
    // Use the new user data sync system
    const { updateUserStats, stats: userStats } = useUserData();
    const { user } = useUser();
    const getUserScopedKey = React.useCallback(
        (base) => `${base}_${user?.id || 'guest'}`,
        [user?.id]
    );
    const { updateFromGameSession: updateUnifiedFromGameSession, updateStats: updateUnifiedStats, stats: unifiedStats } = useUnifiedStats();
    
    const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState(null); 
    const [isCorrect, setIsCorrect] = useState(null); 
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [score, setScore] = useState(0);
    const [hearts, setHearts] = useState(5);
    const [perLetter, setPerLetter] = useState({});
    const [consonantData, setConsonantData] = useState([]);
    const [vocabularyData, setVocabularyData] = useState([]);
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

    // ข้อมูลผู้ใช้ที่สะสม (legacy)
    const [legacyUserStats, setLegacyUserStats] = useState({
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

    // ข้อมูลไฟสะสมรายวัน
    const [dailyStreak, setDailyStreak] = useState({
        currentStreak: 0,
        maxStreak: 0,
        isNewStreak: false,
        rewards: { xp: 0, diamonds: 0, bonus: '' },
        isPlayedToday: false
    });

    const currentQuestion = questions[currentQuestIndex];

    useEffect(() => {
        if (unifiedStats?.hearts !== undefined) {
            setHearts(unifiedStats.hearts);
        }
    }, [unifiedStats?.hearts]);
    
    // Debug logging
    console.log('🔍 Question state:', {
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
            const newTotalXP = legacyUserStats.totalXP + gameXP;
            const newTotalDiamonds = legacyUserStats.totalDiamonds + gameDiamonds;
            const { level, levelProgress } = calculateLevel(newTotalXP);
            
            const updatedStats = {
                totalXP: newTotalXP,
                totalDiamonds: newTotalDiamonds,
                currentLevel: level,
                levelProgress: levelProgress
            };
            
            setLegacyUserStats(updatedStats);
            await AsyncStorage.setItem(getUserScopedKey('userStats'), JSON.stringify(updatedStats));
            
            console.log('📊 Updated user stats (legacy):', updatedStats);
            return updatedStats;
        } catch (error) {
            console.error('❌ Error updating user stats (legacy):', error);
            return legacyUserStats;
        }
    };

    // เซฟความคืบหน้าของเกม
    const saveGameProgress = async () => {
        try {
            const progressData = {
                lessonId: currentLessonId,
                category: currentCategory,
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
                    consonantChar: q.consonantChar,
                    consonantChars: q.consonantChars
                })),
                answers: answersRef.current,
                score,
                hearts,
                gameProgress,
                startTime: gameProgress.startTime,
                lastSaved: Date.now()
            };
            
            const progressKey = getUserScopedKey(`gameProgress_${currentLessonId}_${currentCategory}`);
            await AsyncStorage.setItem(progressKey, JSON.stringify(progressData));
            console.log('💾 Game progress saved:', progressKey);
        } catch (error) {
            console.error('❌ Error saving game progress:', error);
        }
    };

    // โหลดความคืบหน้าของเกม
    const loadGameProgress = async () => {
        try {
            const progressKey = getUserScopedKey(`gameProgress_${currentLessonId}_${currentCategory}`);
            const progressData = await AsyncStorage.getItem(progressKey);
            
            if (progressData) {
                const parsed = JSON.parse(progressData);
                
                // ตรวจสอบว่าเป็นเกมเดียวกันหรือไม่
                if (parsed.lessonId === currentLessonId && parsed.category === currentCategory) {
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
            const progressKey = getUserScopedKey(`gameProgress_${currentLessonId}_${currentCategory}`);
            await AsyncStorage.removeItem(progressKey);
            console.log('🗑️ Game progress cleared:', progressKey);
        } catch (error) {
            console.error('❌ Error clearing game progress:', error);
        }
    };

    const getLevelStageScreen = React.useCallback(() => {
        const normalized = (levelLabel || '').toLowerCase();
        if (normalized.includes('intermediate')) return 'LevelStage2';
        if (normalized.includes('advanced')) return 'LevelStage3';
        return 'LevelStage1';
    }, [levelLabel]);

    const handleReplayLesson = React.useCallback(async () => {
        await clearGameProgress();
        navigation.replace('NewLessonGame', {
            lessonId: currentLessonId,
            category: currentCategory,
            level: levelLabel,
            stageTitle,
        });
    }, [clearGameProgress, navigation, currentLessonId, currentCategory, levelLabel, stageTitle]);

    const handleNavigateHome = React.useCallback(async () => {
        await clearGameProgress();
        navigation.navigate('HomeMain');
    }, [clearGameProgress, navigation]);

    const handleGoToNextStage = React.useCallback(async () => {
        await clearGameProgress();
        const nextLevelKey = levelUnlockService.getNextLevel(`level${currentLessonId}`);
        const nextLessonNumeric = nextLevelKey ? parseInt(nextLevelKey.replace('level', ''), 10) : null;

        if (nextLessonNumeric) {
            if (nextLessonNumeric === 2 && (levelLabel || '').toLowerCase().includes('beginner')) {
                navigation.replace('BeginnerVowelsStage', {
                    lessonId: nextLessonNumeric,
                    category: 'vowels_basic',
                    level: levelLabel,
                    stageTitle: `ด่าน ${nextLessonNumeric}`,
                });
            } else {
                navigation.replace('NewLessonGame', {
                    lessonId: nextLessonNumeric,
                    category: currentCategory,
                    level: levelLabel,
                    stageTitle: `ด่าน ${nextLessonNumeric}`,
                });
            }
        } else {
            navigation.navigate(getLevelStageScreen());
        }
    }, [clearGameProgress, currentLessonId, currentCategory, levelLabel, navigation, getLevelStageScreen]);

    // โหลดข้อมูลผู้ใช้ (legacy)
    const loadUserStats = async () => {
        try {
            const userStatsData = await AsyncStorage.getItem(getUserScopedKey('userStats'));
            if (userStatsData) {
                const parsed = JSON.parse(userStatsData);
                setLegacyUserStats(parsed);
                console.log('📊 Loaded user stats (legacy):', parsed);
            }
        } catch (error) {
            console.error('❌ Error loading user stats:', error);
        }
    };

    // Load consonant data from API
    useEffect(() => {
        loadConsonantData();
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
                console.log('✅ Progress tracking services initialized');
            }
        } catch (error) {
            console.error('❌ Error initializing services:', error);
        }
    };

    // เริ่มไฟสะสมเมื่อเข้าเล่นเกม
    const startDailyStreak = async () => {
        try {
            dailyStreakService.setUser(user?.id);
            const streakResult = await dailyStreakService.startStreak();
            const rewards = dailyStreakService.getStreakRewards(streakResult.streak);
            
            setDailyStreak(prev => ({
                currentStreak: streakResult.streak,
                maxStreak: Math.max(
                    streakResult?.maxStreak ?? 0,
                    streakResult.streak,
                    Number.isFinite(prev?.maxStreak) ? prev.maxStreak : 0
                ),
                isNewStreak: streakResult.isNewStreak,
                rewards: rewards,
                isPlayedToday: true
            }));

            console.log('🔥 Daily streak started:', {
                streak: streakResult.streak,
                isNew: streakResult.isNewStreak,
                rewards: rewards
            });

            return streakResult;
        } catch (error) {
            console.error('❌ Error starting daily streak:', error);
            return { streak: 0, isNewStreak: false };
        }
    };

    // Load vocabulary data from API
    useEffect(() => {
        loadVocabularyData();
    }, [currentLessonId, currentCategory, consonantData]);

    // โหลด snapshot ตอนเข้า
    useEffect(() => {
        (async () => {
            const snap = await loadAutosnap(currentLessonId);
            if (snap) { /* restore state จาก snap */ }
            else { /* generate questions ใหม่ */ }
        })();
    }, []);

    const loadConsonantData = async () => {
        try {
            console.log('🔤 Loading consonant data from database...');
            const consonants = await vocabWordService.getConsonants();
            
            if (consonants && Array.isArray(consonants) && consonants.length > 0) {
                const processedConsonants = consonants.map(item => ({
                    char: item.char || item.thai,
                    meaning: item.meaning || item.en,
                    name: item.name || item.exampleTH || `${item.char}-${item.meaning}`
                }));
                setConsonantData(processedConsonants);
                console.log('✅ Loaded', processedConsonants.length, 'consonants from database');
            } else {
                throw new Error('No consonant data received from database');
            }
        } catch (error) {
            console.error('❌ Error loading consonant data from database:', error);
            // Fallback data - พยัญชนะไทยครบ 44 ตัว
            const thaiConsonants = [
                { char: 'ก', meaning: 'ไก่', name: 'กอ ไก่' },
                { char: 'ข', meaning: 'ไข่', name: 'ขอ ไข่' },
                { char: 'ฃ', meaning: 'ฃวด', name: 'ฃอ ฃวด' },
                { char: 'ค', meaning: 'ควาย', name: 'คอ ควาย' },
                { char: 'ฅ', meaning: 'ฅน', name: 'ฅอ ฅน' },
                { char: 'ฆ', meaning: 'ระฆัง', name: 'ฆอ ระฆัง' },
                { char: 'ง', meaning: 'งู', name: 'งอ งู' },
                { char: 'จ', meaning: 'จาน', name: 'จอ จาน' },
                { char: 'ฉ', meaning: 'ฉิ่ง', name: 'ฉอ ฉิ่ง' },
                { char: 'ช', meaning: 'ช้าง', name: 'ชอ ช้าง' },
                { char: 'ซ', meaning: 'โซ่', name: 'ซอ โซ่' },
                { char: 'ฌ', meaning: 'เฌอ', name: 'ฌอ เฌอ' },
                { char: 'ญ', meaning: 'หญิง', name: 'ญอ หญิง' },
                { char: 'ฎ', meaning: 'ชฎา', name: 'ฎอ ชฎา' },
                { char: 'ฏ', meaning: 'ปฏัก', name: 'ฏอ ปฏัก' },
                { char: 'ฐ', meaning: 'ฐาน', name: 'ฐอ ฐาน' },
                { char: 'ฑ', meaning: 'มณโฑ', name: 'ฑอ มณโฑ' },
                { char: 'ฒ', meaning: 'ผู้เฒ่า', name: 'ฒอ ผู้เฒ่า' },
                { char: 'ณ', meaning: 'เณร', name: 'ณอ เณร' },
                { char: 'ด', meaning: 'เด็ก', name: 'ดอ เด็ก' },
                { char: 'ต', meaning: 'เต่า', name: 'ตอ เต่า' },
                { char: 'ถ', meaning: 'ถุง', name: 'ถอ ถุง' },
                { char: 'ท', meaning: 'ทหาร', name: 'ทอ ทหาร' },
                { char: 'ธ', meaning: 'ธง', name: 'ธอ ธง' },
                { char: 'น', meaning: 'หนู', name: 'นอ หนู' },
                { char: 'บ', meaning: 'ใบไม้', name: 'บอ ใบไม้' },
                { char: 'ป', meaning: 'ปลา', name: 'ปอ ปลา' },
                { char: 'ผ', meaning: 'ผึ้ง', name: 'ผอ ผึ้ง' },
                { char: 'ฝ', meaning: 'ฝา', name: 'ฝอ ฝา' },
                { char: 'พ', meaning: 'พาน', name: 'พอ พาน' },
                { char: 'ฟ', meaning: 'ฟัน', name: 'ฟอ ฟัน' },
                { char: 'ภ', meaning: 'สำเภา', name: 'ภอ สำเภา' },
                { char: 'ม', meaning: 'ม้า', name: 'มอ ม้า' },
                { char: 'ย', meaning: 'ยักษ์', name: 'ยอ ยักษ์' },
                { char: 'ร', meaning: 'เรือ', name: 'รอ เรือ' },
                { char: 'ล', meaning: 'ลิง', name: 'ลอ ลิง' },
                { char: 'ว', meaning: 'แหวน', name: 'วอ แหวน' },
                { char: 'ศ', meaning: 'ศาลา', name: 'ศอ ศาลา' },
                { char: 'ษ', meaning: 'ฤาษี', name: 'ษอ ฤาษี' },
                { char: 'ส', meaning: 'เสือ', name: 'สอ เสือ' },
                { char: 'ห', meaning: 'หีบ', name: 'หอ หีบ' },
                { char: 'ฬ', meaning: 'จุฬา', name: 'ฬอ จุฬา' },
                { char: 'อ', meaning: 'อ่าง', name: 'ออ อ่าง' },
                { char: 'ฮ', meaning: 'นกฮูก', name: 'ฮอ นกฮูก' }
            ];
            console.log('🔄 Using fallback consonant data (44 consonants)');
            setConsonantData(thaiConsonants);
        }
    };

    const loadVocabularyData = async () => {
        try {
            setLoading(true);
            console.log('🎯 Loading vocabulary data for lessonId:', currentLessonId, 'type:', typeof currentLessonId);

        // Try to restore from per-user progress
        const snap = await loadAutosnap(currentLessonId);
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

            // If no restore data, generate new questions from database
            console.log('🎯 Generating new questions from database consonants:', consonantData.length);
            
            // สำหรับด่านแรก (currentLessonId: 1) ใช้พยัญชนะทั้งหมด 44 ตัวเสมอ
            if (currentLessonId === 1 || currentLessonId === '1') {
                console.log('🎯 First stage - using all 44 consonants for lessonId:', currentLessonId);
                // ข้ามการโหลดจาก database และใช้ fallback data 44 ตัวเลย
            } else {
                // สำหรับด่านอื่นๆ ใช้ข้อมูลจาก database
                let pool = consonantData.length > 0 ? consonantData : [];
                
                if (pool.length === 0) {
                    console.log('⚠️ No consonant data available, loading from database...');
                    // ถ้าไม่มีข้อมูล consonantData ให้โหลดใหม่
                    try {
                        const dbConsonants = await vocabWordService.getConsonants();
                        if (dbConsonants && Array.isArray(dbConsonants) && dbConsonants.length > 0) {
                            const processedConsonants = dbConsonants.map(item => ({
                                char: item.char || item.thai,
                                meaning: item.meaning || item.en,
                                name: item.name || item.exampleTH || `${item.char}-${item.meaning}`
                            }));
                            setConsonantData(processedConsonants);
                            console.log('✅ Loaded consonants from database:', processedConsonants.length);
                            const gameQuestions = generateQuestions(processedConsonants);
                            console.log('🎮 Generated', gameQuestions.length, 'questions from database');
                            
                            setQuestions(gameQuestions);
                            setCurrentQuestIndex(0);
                            setIsCorrect(null);
                            setUserAnswer(null);
                            setLoading(false);
                            
                            // เริ่มไฟสะสมเมื่อโหลดคำถามเสร็จ
                            await startDailyStreak();
                            return;
                        }
                    } catch (dbError) {
                        console.error('❌ Error loading from database:', dbError);
                    }
                } else {
                    // ใช้ข้อมูลที่มีอยู่แล้ว
                    const gameQuestions = generateQuestions(pool);
                    console.log('🎮 Generated', gameQuestions.length, 'questions from existing data');
                    
                    setQuestions(gameQuestions);
                    setCurrentQuestIndex(0);
                    setIsCorrect(null);
                    setUserAnswer(null);
                    setLoading(false);
                    
                    // เริ่มไฟสะสมเมื่อโหลดคำถามเสร็จ
                    await startDailyStreak();
                    return;
                }
            }
            
            // ถ้าเป็นด่านแรกหรือโหลดจาก database ไม่ได้ ให้ใช้ fallback data
            if (currentLessonId === 1 || currentLessonId === '1' || consonantData.length === 0) {
                // ถ้าโหลดจาก database ไม่ได้ ให้ใช้ fallback - พยัญชนะไทยครบ 44 ตัว
                console.log('🔄 Using fallback consonant data (44 consonants)');
                const fallbackConsonants = [
                    { char: 'ก', meaning: 'ไก่', name: 'กอ ไก่' },
                    { char: 'ข', meaning: 'ไข่', name: 'ขอ ไข่' },
                    { char: 'ฃ', meaning: 'ฃวด', name: 'ฃอ ฃวด' },
                    { char: 'ค', meaning: 'ควาย', name: 'คอ ควาย' },
                    { char: 'ฅ', meaning: 'ฅน', name: 'ฅอ ฅน' },
                    { char: 'ฆ', meaning: 'ระฆัง', name: 'ฆอ ระฆัง' },
                    { char: 'ง', meaning: 'งู', name: 'งอ งู' },
                    { char: 'จ', meaning: 'จาน', name: 'จอ จาน' },
                    { char: 'ฉ', meaning: 'ฉิ่ง', name: 'ฉอ ฉิ่ง' },
                    { char: 'ช', meaning: 'ช้าง', name: 'ชอ ช้าง' },
                    { char: 'ซ', meaning: 'โซ่', name: 'ซอ โซ่' },
                    { char: 'ฌ', meaning: 'เฌอ', name: 'ฌอ เฌอ' },
                    { char: 'ญ', meaning: 'หญิง', name: 'ญอ หญิง' },
                    { char: 'ฎ', meaning: 'ชฎา', name: 'ฎอ ชฎา' },
                    { char: 'ฏ', meaning: 'ปฏัก', name: 'ฏอ ปฏัก' },
                    { char: 'ฐ', meaning: 'ฐาน', name: 'ฐอ ฐาน' },
                    { char: 'ฑ', meaning: 'มณโฑ', name: 'ฑอ มณโฑ' },
                    { char: 'ฒ', meaning: 'ผู้เฒ่า', name: 'ฒอ ผู้เฒ่า' },
                    { char: 'ณ', meaning: 'เณร', name: 'ณอ เณร' },
                    { char: 'ด', meaning: 'เด็ก', name: 'ดอ เด็ก' },
                    { char: 'ต', meaning: 'เต่า', name: 'ตอ เต่า' },
                    { char: 'ถ', meaning: 'ถุง', name: 'ถอ ถุง' },
                    { char: 'ท', meaning: 'ทหาร', name: 'ทอ ทหาร' },
                    { char: 'ธ', meaning: 'ธง', name: 'ธอ ธง' },
                    { char: 'น', meaning: 'หนู', name: 'นอ หนู' },
                    { char: 'บ', meaning: 'ใบไม้', name: 'บอ ใบไม้' },
                    { char: 'ป', meaning: 'ปลา', name: 'ปอ ปลา' },
                    { char: 'ผ', meaning: 'ผึ้ง', name: 'ผอ ผึ้ง' },
                    { char: 'ฝ', meaning: 'ฝา', name: 'ฝอ ฝา' },
                    { char: 'พ', meaning: 'พาน', name: 'พอ พาน' },
                    { char: 'ฟ', meaning: 'ฟัน', name: 'ฟอ ฟัน' },
                    { char: 'ภ', meaning: 'สำเภา', name: 'ภอ สำเภา' },
                    { char: 'ม', meaning: 'ม้า', name: 'มอ ม้า' },
                    { char: 'ย', meaning: 'ยักษ์', name: 'ยอ ยักษ์' },
                    { char: 'ร', meaning: 'เรือ', name: 'รอ เรือ' },
                    { char: 'ล', meaning: 'ลิง', name: 'ลอ ลิง' },
                    { char: 'ว', meaning: 'แหวน', name: 'วอ แหวน' },
                    { char: 'ศ', meaning: 'ศาลา', name: 'ศอ ศาลา' },
                    { char: 'ษ', meaning: 'ฤาษี', name: 'ษอ ฤาษี' },
                    { char: 'ส', meaning: 'เสือ', name: 'สอ เสือ' },
                    { char: 'ห', meaning: 'หีบ', name: 'หอ หีบ' },
                    { char: 'ฬ', meaning: 'จุฬา', name: 'ฬอ จุฬา' },
                    { char: 'อ', meaning: 'อ่าง', name: 'ออ อ่าง' },
                    { char: 'ฮ', meaning: 'นกฮูก', name: 'ฮอ นกฮูก' }
                ];
                const gameQuestions = generateQuestions(fallbackConsonants);
                console.log('🎮 Generated fallback questions (44 consonants):', gameQuestions.length);
                
                setQuestions(gameQuestions);
                setCurrentQuestIndex(0);
                setIsCorrect(null);
                setUserAnswer(null);
                setLoading(false);
                
                // เริ่มไฟสะสมเมื่อโหลดคำถามเสร็จ
                await startDailyStreak();
                return;
            }

            // Generate questions using factory functions from database data
            const gameQuestions = generateQuestions(pool);
            console.log('🎮 Generated', gameQuestions.length, 'questions from database');

            setQuestions(gameQuestions);
            setCurrentQuestIndex(0);
            setIsCorrect(null);
            setUserAnswer(null);
            
            // เริ่มไฟสะสมเมื่อโหลดคำถามเสร็จ
            await startDailyStreak();
            
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
            await saveProgress({
                lessonId: currentLessonId,
                category: currentCategory,
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
            // Use fallback data on error - พยัญชนะไทยครบ 44 ตัว
            const fallbackConsonants = [
                { char: 'ก', meaning: 'ไก่', name: 'กอ ไก่' },
                { char: 'ข', meaning: 'ไข่', name: 'ขอ ไข่' },
                { char: 'ฃ', meaning: 'ฃวด', name: 'ฃอ ฃวด' },
                { char: 'ค', meaning: 'ควาย', name: 'คอ ควาย' },
                { char: 'ฅ', meaning: 'ฅน', name: 'ฅอ ฅน' },
                { char: 'ฆ', meaning: 'ระฆัง', name: 'ฆอ ระฆัง' },
                { char: 'ง', meaning: 'งู', name: 'งอ งู' },
                { char: 'จ', meaning: 'จาน', name: 'จอ จาน' },
                { char: 'ฉ', meaning: 'ฉิ่ง', name: 'ฉอ ฉิ่ง' },
                { char: 'ช', meaning: 'ช้าง', name: 'ชอ ช้าง' },
                { char: 'ซ', meaning: 'โซ่', name: 'ซอ โซ่' },
                { char: 'ฌ', meaning: 'เฌอ', name: 'ฌอ เฌอ' },
                { char: 'ญ', meaning: 'หญิง', name: 'ญอ หญิง' },
                { char: 'ฎ', meaning: 'ชฎา', name: 'ฎอ ชฎา' },
                { char: 'ฏ', meaning: 'ปฏัก', name: 'ฏอ ปฏัก' },
                { char: 'ฐ', meaning: 'ฐาน', name: 'ฐอ ฐาน' },
                { char: 'ฑ', meaning: 'มณโฑ', name: 'ฑอ มณโฑ' },
                { char: 'ฒ', meaning: 'ผู้เฒ่า', name: 'ฒอ ผู้เฒ่า' },
                { char: 'ณ', meaning: 'เณร', name: 'ณอ เณร' },
                { char: 'ด', meaning: 'เด็ก', name: 'ดอ เด็ก' },
                { char: 'ต', meaning: 'เต่า', name: 'ตอ เต่า' },
                { char: 'ถ', meaning: 'ถุง', name: 'ถอ ถุง' },
                { char: 'ท', meaning: 'ทหาร', name: 'ทอ ทหาร' },
                { char: 'ธ', meaning: 'ธง', name: 'ธอ ธง' },
                { char: 'น', meaning: 'หนู', name: 'นอ หนู' },
                { char: 'บ', meaning: 'ใบไม้', name: 'บอ ใบไม้' },
                { char: 'ป', meaning: 'ปลา', name: 'ปอ ปลา' },
                { char: 'ผ', meaning: 'ผึ้ง', name: 'ผอ ผึ้ง' },
                { char: 'ฝ', meaning: 'ฝา', name: 'ฝอ ฝา' },
                { char: 'พ', meaning: 'พาน', name: 'พอ พาน' },
                { char: 'ฟ', meaning: 'ฟัน', name: 'ฟอ ฟัน' },
                { char: 'ภ', meaning: 'สำเภา', name: 'ภอ สำเภา' },
                { char: 'ม', meaning: 'ม้า', name: 'มอ ม้า' },
                { char: 'ย', meaning: 'ยักษ์', name: 'ยอ ยักษ์' },
                { char: 'ร', meaning: 'เรือ', name: 'รอ เรือ' },
                { char: 'ล', meaning: 'ลิง', name: 'ลอ ลิง' },
                { char: 'ว', meaning: 'แหวน', name: 'วอ แหวน' },
                { char: 'ศ', meaning: 'ศาลา', name: 'ศอ ศาลา' },
                { char: 'ษ', meaning: 'ฤาษี', name: 'ษอ ฤาษี' },
                { char: 'ส', meaning: 'เสือ', name: 'สอ เสือ' },
                { char: 'ห', meaning: 'หีบ', name: 'หอ หีบ' },
                { char: 'ฬ', meaning: 'จุฬา', name: 'ฬอ จุฬา' },
                { char: 'อ', meaning: 'อ่าง', name: 'ออ อ่าง' },
                { char: 'ฮ', meaning: 'นกฮูก', name: 'ฮอ นกฮูก' }
            ];
            const gameQuestions = generateQuestions(fallbackConsonants);
            console.log('🎮 Generated fallback questions after error (44 consonants):', gameQuestions.length);
            
            setQuestions(gameQuestions);
            setCurrentQuestIndex(0);
            setIsCorrect(null);
            setUserAnswer(null);
            
            // เริ่มไฟสะสมเมื่อโหลดคำถามเสร็จ
            await startDailyStreak();
        } finally {
            setLoading(false);
        }
    };

        // ---- Auto Save functions ----
        const snapshot = () => ({
            lessonId: currentLessonId, 
            category: currentCategory,
            questions, currentIndex: currentQuestIndex,
            hearts, score, perLetter, answers: answersRef.current,
            gameProgress: gameProgress, // เพิ่มข้อมูลความคืบหน้า
        });

        const autosave = async () => {
            await saveAutosnap(currentLessonId, snapshot());
            // sync server progress ราย user (JWT ทำให้รู้ว่า user ไหน)
            await apiClient.post('/progress/user/session', {
                ...snapshot(),
                total: questions.length,
                updatedAt: Date.now()
            });
            
            // บันทึกข้อมูลความคืบหน้าลงใน AsyncStorage
            try {
                const progressKey = getUserScopedKey(`gameProgress_${currentLessonId}_${Date.now()}`);
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

    // Cleanup TTS listeners
    useEffect(() => {
        return () => {
            vaja9TtsService.cleanup();
        };
    }, []);

    // Question rendering function
    const renderQuestionComponent = () => {
        console.log('🎯 Rendering question:', { 
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
    const handleCheckAnswer = React.useCallback(() => {
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
        if (currentQuestion.consonantChar) updateLetterMastery(currentQuestion.consonantChar, correct);
        if (currentQuestion.consonantChars) currentQuestion.consonantChars.forEach(ch => updateLetterMastery(ch, correct));
        
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
                        const combinedXP = finalProgress.xpEarned + dailyStreak.rewards.xp;
                        const combinedDiamonds = finalProgress.diamondsEarned + dailyStreak.rewards.diamonds;
                        const accuracyPercent = questions.length > 0
                          ? Math.round((finalProgress.correctAnswers / questions.length) * 100)
                          : 0;
                        const timeSpentSeconds = Math.round(finalProgress.totalTimeSpent / 1000);

                        const gameResults = {
                            correct: finalProgress.correctAnswers,
                            total: questions.length,
                            accuracy: accuracyPercent,
                            timeSpent: timeSpentSeconds,
                            xpEarned: combinedXP,
                            diamondsEarned: combinedDiamonds,
                            heartsRemaining: hearts,
                            streakReward: dailyStreak.rewards,
                            gameType: 'NewLessonGame',
                            completedAt: new Date().toISOString()
                        };

                        const sessionPayload = {
                            lessonId: currentLessonId,
                            category: currentCategory,
                            score,
                            accuracy: accuracyPercent / 100,
                            timeSpent: timeSpentSeconds,
                            questionTypes: finalProgress.questionTypes || {},
                            completedAt: gameResults.completedAt,
                            heartsRemaining: hearts,
                            diamondsEarned: combinedDiamonds,
                            xpEarned: combinedXP,
                            streak: finalProgress.streak || 0,
                            maxStreak: finalProgress.maxStreak || 0,
                            level: unifiedStats?.level || 1,
                            totalQuestions: questions.length,
                            correctAnswers: finalProgress.correctAnswers,
                            wrongAnswers: finalProgress.wrongAnswers
                        };

                        try {
                            const savedSession = await gameProgressService.saveGameSession(sessionPayload);
                            console.log('✅ Game session saved:', savedSession.id);
                        } catch (saveError) {
                            console.error('❌ Error saving game session:', saveError);
                        }

                        // Update legacy local stats for backward compatibility
                        const legacyStats = await updateUserStatsLegacy(finalProgress.xpEarned, finalProgress.diamondsEarned);

                        // Update unified stats (adds totals, level, etc.)
                        const updatedUnified = await updateUnifiedFromGameSession({
                            ...sessionPayload,
                            gameType: 'NewLessonGame'
                        });

                        // Persist last game results in unified stats + userData context
                        await updateUnifiedStats({ lastGameResults: gameResults });
                        await updateUserStats({ lastGameResults: gameResults });

                        // Apply rewards to progress context
                        await applyDelta({ 
                            xp: combinedXP, 
                            diamonds: combinedDiamonds, 
                            finishedLesson: true, 
                            timeSpentSec: timeSpentSeconds 
                        });

                        // Check and unlock next level based on accuracy
                        const currentLevelId = `level${currentLessonId}`;
                        const unlockResult = await levelUnlockService.checkAndUnlockNextLevel(currentLevelId, {
                            accuracy: accuracyPercent,
                            score,
                            attempts: 1
                        });

                        if (unlockResult) {
                            console.log('🎉 Next level unlocked!', unlockResult);
                        }

                        // ลบความคืบหน้าของเกมเมื่อจบ
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
                    } catch (err) {
                        console.error('❌ Error finalizing game summary:', err);
                    }
                })();
                
                return finalProgress;
            });
        }

        setScore(s => s + (correct ? 10 : 0));
        if (!correct) setHearts(h => Math.max(0, h - 1));
    }, [currentQuestion, userAnswer]);

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
        await clearAutosnap(currentLessonId);
        
        // Calculate rewards and performance metrics
        const xpGained = score;
        const diamondsGained = Math.max(2, Math.floor(score / 50));
        const accuracy = questions.length > 0 ? Math.round((score / (questions.length * 10)) * 100) : 0;
        const correctAnswers = gameProgress.correctAnswers;
        const wrongAnswers = gameProgress.wrongAnswers;
        const totalQuestions = questions.length;
        
        // Create comprehensive session data
        const sessionData = {
            lessonId: currentLessonId,
            category: currentCategory,
            score: score,
            accuracy: accuracy / 100, // Convert to decimal
            timeSpent: timeSpentSec,
            questionTypes: gameProgress.questionTypes || {},
            completedAt: new Date().toISOString(),
            heartsRemaining: hearts,
            diamondsEarned: diamondsGained,
            xpEarned: xpGained,
            streak: gameProgress.streak || 0,
            maxStreak: gameProgress.maxStreak || 0,
            level: Math.floor((userStats?.xp || 0 + xpGained) / 100) + 1,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            wrongAnswers: wrongAnswers
        };

        if (!sessionFinalizedRef.current) {
            try {
                const savedSession = await gameProgressService.saveGameSession(sessionData);
                console.log('✅ Game session saved (fallback path):', savedSession.id);

                await updateUnifiedFromGameSession({
                    ...sessionData,
                    gameType: 'NewLessonGame'
                });

                await updateUnifiedStats({
                    lastGameResults: {
                        correct: correctAnswers,
                        total: totalQuestions,
                        accuracy,
                        timeSpent: timeSpentSec,
                        xpEarned: xpGained,
                        diamondsEarned: diamondsGained,
                        heartsRemaining: hearts,
                        gameType: 'NewLessonGame',
                        completedAt: new Date().toISOString()
                    }
                });

                await applyDelta({ 
                    xp: xpGained, 
                    diamonds: diamondsGained, 
                    finishedLesson: true, 
                    timeSpentSec 
                });

                const currentLevelId = `level${currentLessonId}`;
                const unlockResult = await levelUnlockService.checkAndUnlockNextLevel(currentLevelId, {
                    accuracy,
                    score,
                    attempts: 1
                });

                if (unlockResult) {
                    console.log('🎉 Next level unlocked!', unlockResult);
                }

                sessionFinalizedRef.current = true;
            } catch (error) {
                console.error('❌ Error saving game progress (fallback):', error);
            }
        }
        
        // Navigate to completion screen with all data
        navigation.replace('LessonComplete', { 
            score, 
            totalQuestions: questions.length,
            timeSpent: timeSpentSec,
            accuracy,
            xpGained,
            diamondsGained,
            sessionData: sessionData
        });
    }, [currentLessonId, score, questions.length, updateUserStats, gameProgress, hearts, userStats]);

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
                        
                        {/* รางวัลไฟสะสม */}
                        {dailyStreak.rewards.xp > 0 && (
                            <View style={styles.streakRewardContainer}>
                                <LottieView
                                    source={require('../assets/animations/Streak-Fire1.json')}
                                    autoPlay
                                    loop
                                    style={styles.streakRewardAnimation}
                                />
                                <View style={styles.streakRewardInfo}>
                                    <Text style={styles.streakRewardTitle}>
                                        ไฟสะสม {dailyStreak.currentStreak} วัน!
                                    </Text>
                                    <Text style={styles.streakRewardText}>
                                        +{dailyStreak.rewards.xp} XP, +{dailyStreak.rewards.diamonds} เพชร
                                    </Text>
                                    {dailyStreak.rewards.bonus && (
                                        <Text style={styles.streakRewardBonus}>
                                            {dailyStreak.rewards.bonus}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
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

                    <View style={styles.summaryActions}>
                        <TouchableOpacity style={[styles.summaryActionButton, styles.secondaryAction]}
                            onPress={handleReplayLesson}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.summaryActionText}>เล่นอีกครั้ง</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.summaryActionButton, styles.primaryAction]}
                            onPress={handleGoToNextStage}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.summaryActionText}>ไปด่านถัดไป</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.summaryActionButton, styles.neutralAction]}
                            onPress={handleNavigateHome}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.summaryActionText}>กลับหน้าหลัก</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={async () => {
                        // เซฟความคืบหน้าก่อนออก
                        await saveGameProgress();
                        navigation.goBack();
                    }}
                >
                    <FontAwesome name="times" size={24} color="#FF8000" />
                </TouchableOpacity>
                
                <View style={styles.progressContainer}>
                    {gameSession.isResumed && (
                        <View style={styles.resumeNotification}>
                            <FontAwesome name="play-circle" size={16} color="#4CAF50" />
                            <Text style={styles.resumeText}>เล่นต่อจากข้อที่ {currentQuestIndex + 1}</Text>
                        </View>
                    )}
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
                    
                    {/* สถิติความคืบหน้า */}
                    <View style={styles.progressStats}>
                        <View style={styles.progressStatItem}>
                            <LottieView
                                source={require('../assets/animations/Star.json')}
                                autoPlay
                                loop
                                style={styles.progressStatAnimation}
                            />
                            <Text style={styles.progressStatText}>{gameProgress.xpEarned} XP</Text>
                        </View>
                        <View style={styles.progressStatItem}>
                            <LottieView
                                source={require('../assets/animations/Diamond.json')}
                                autoPlay
                                loop
                                style={styles.progressStatAnimation}
                            />
                            <Text style={styles.progressStatText}>{gameProgress.diamondsEarned}</Text>
                        </View>
                        <View style={styles.progressStatItem}>
                            <FontAwesome name="bullseye" size={12} color="#4ECDC4" />
                            <Text style={styles.progressStatText}>{gameProgress.accuracy.toFixed(0)}%</Text>
                        </View>
                        <View style={styles.progressStatItem}>
                            <FontAwesome name="fire" size={12} color="#FF8C00" />
                            <Text style={styles.progressStatText}>{gameProgress.streak}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.heartsContainer}>
                    <FontAwesome name="heart" size={20} color="#ff4b4b" />
                    <Text style={styles.heartsText}>{hearts}</Text>
                </View>

                {/* ไฟสะสมรายวัน */}
                <View style={styles.streakContainer}>
                    <StreakBadge value={dailyStreak.currentStreak || 0} />
                </View>
                
            </View>



            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollViewContent}
            >
                {renderQuestionComponent()}
            </ScrollView>

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: 10,
    },
    progressContainer: {
        flex: 1,
        marginHorizontal: 20,
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
    },
    resumeNotification: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginBottom: 8,
    },
    resumeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4CAF50',
        marginLeft: 6,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        gap: 12,
    },
    progressStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 128, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    progressStatText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#333',
        marginLeft: 4,
    },
    progressStatAnimation: {
        width: 12,
        height: 12,
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
    streakContainer: {
        marginLeft: 10,
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: 20,
    },
    questionContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    instructionText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
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
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 60,
        justifyContent: 'center',
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
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
        paddingVertical: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    checkButtonDisabled: {
        backgroundColor: '#ccc',
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    checkButtonTextDisabled: {
        color: '#999',
    },
    feedbackBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 12,
    },
    feedbackText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    continueButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    streakRewardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        padding: 15,
        borderRadius: 15,
        marginTop: 15,
        borderWidth: 2,
        borderColor: '#FF8C00',
    },
    streakRewardAnimation: {
        width: 40,
        height: 40,
    },
    streakRewardInfo: {
        marginLeft: 15,
        flex: 1,
    },
    streakRewardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF8C00',
        marginBottom: 4,
    },
    streakRewardText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
    },
    streakRewardBonus: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FF6B35',
        fontStyle: 'italic',
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
    summaryActions: {
        marginTop: 28,
        gap: 12,
    },
    summaryActionButton: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    primaryAction: {
        backgroundColor: '#FF8C2A',
    },
    secondaryAction: {
        backgroundColor: '#FFE8D5',
    },
    neutralAction: {
        backgroundColor: '#E9ECEF',
    },
    summaryActionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3B352E',
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
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 6,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    modalIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF4E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6B4C3B',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#7B5A3D',
        marginBottom: 18,
    },
    modalHighlight: {
        color: '#FF7A00',
        fontWeight: '700',
    },
    modalRewardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 22,
    },
    modalRewardChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    modalHeartChip: {
        backgroundColor: '#FFE4EA',
    },
    modalDiamondChip: {
        backgroundColor: '#E4F2FF',
    },
    modalRewardText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5C4630',
    },
    modalButton: {
        alignSelf: 'center',
        paddingHorizontal: 32,
        paddingVertical: 10,
        borderRadius: 18,
        backgroundColor: '#FF8C2A',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
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

export default NewLessonGame;
