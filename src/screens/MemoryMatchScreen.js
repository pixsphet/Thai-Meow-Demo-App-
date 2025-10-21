import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MemoryMatchScreen = () => {
  const navigation = useNavigation();
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [mismatchCount, setMismatchCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Sample data for the game
  const gameData = [
    { id: 1, thai: 'บ้าน', image: require('../add/picture/house.png'), type: 'word' },
    { id: 2, thai: 'โรงเรียน', image: require('../add/picture/school.png'), type: 'word' },
    { id: 3, thai: 'ตลาด', image: require('../add/picture/market.png'), type: 'word' },
    { id: 4, thai: 'เครื่องบิน', image: require('../add/picture/airplane.png'), type: 'word' },
    { id: 5, thai: 'แดง', image: require('../add/picture/red.png'), type: 'word' },
    { id: 6, thai: 'เขียว', image: require('../add/picture/green.png'), type: 'word' },
    { id: 7, thai: 'พ่อ', image: require('../add/picture/father.png'), type: 'word' },
    { id: 8, thai: 'แม่', image: require('../add/picture/mother.png'), type: 'word' },
  ];

  // Create pairs for the game
  const createGameCards = () => {
    const pairs = [];
    gameData.forEach((item, index) => {
      // Add word card
      pairs.push({
        id: `word-${item.id}`,
        content: item.thai,
        image: item.image,
        type: 'word',
        pairId: item.id,
      });
      // Add image card
      pairs.push({
        id: `image-${item.id}`,
        content: item.thai,
        image: item.image,
        type: 'image',
        pairId: item.id,
      });
    });
    
    // Better shuffle algorithm
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    
    return pairs;
  };

  useEffect(() => {
    setCards(createGameCards());
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !gameOver) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      setIsWin(false);
      setShowResult(true);
    }
  }, [timeLeft, gameOver]);

  // Check for win condition
  useEffect(() => {
    if (matchedCards.length === gameData.length * 2) {
      setGameOver(true);
      setIsWin(true);
      setShowResult(true);
    }
  }, [matchedCards, gameData.length]);

  const handleCardPress = (card) => {
    if (flippedCards.length >= 2 || flippedCards.includes(card.id) || matchedCards.includes(card.id) || isProcessing || gameOver) {
      return;
    }

    const newFlippedCards = [...flippedCards, card.id];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setIsProcessing(true);
      const [firstCardId, secondCardId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstCardId);
      const secondCard = cards.find(c => c.id === secondCardId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Match found!
        setMatchedCards(prev => [...prev, firstCardId, secondCardId]);
        setScore(prev => prev + 100);
        setFlippedCards([]);
        setIsProcessing(false);
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([]);
          setMismatchCount(prev => {
            const newMismatchCount = prev + 1;
            if (newMismatchCount >= 3) {
              setHearts(prevHearts => {
                const newHearts = Math.max(0, prevHearts - 1);
                if (newHearts <= 0) {
                  setGameOver(true);
                  setIsWin(false);
                  setShowResult(true);
                }
                return newHearts;
              });
            }
            return newMismatchCount;
          });
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  const restartGame = () => {
    setCards(createGameCards());
    setFlippedCards([]);
    setMatchedCards([]);
    setTimeLeft(120);
    setScore(0);
    setHearts(5);
    setGameOver(false);
    setShowResult(false);
    setIsWin(false);
    setMismatchCount(0);
    setIsProcessing(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const MemoryCard = ({ card, isFlipped, isMatched, onPress }) => {
    const flipAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(flipAnim, {
        toValue: isFlipped || isMatched ? 180 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [isFlipped, isMatched]);

    const frontInterpolate = flipAnim.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg']
    });

    const backInterpolate = flipAnim.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg']
    });

    return (
      <TouchableOpacity 
        onPress={() => onPress(card)} 
        disabled={isFlipped || isMatched || isProcessing}
        style={styles.cardContainer}
        activeOpacity={0.7}
      >
        <View style={styles.cardWrapper}>
          {/* Card back */}
          <Animated.View style={[
            styles.card,
            styles.cardBack,
            { transform: [{ rotateY: backInterpolate }] }
          ]}>
            <FontAwesome name="question" size={30} color="#8b5cf6" />
          </Animated.View>
          
          {/* Card front */}
          <Animated.View style={[
            styles.card,
            styles.cardFront,
            { transform: [{ rotateY: frontInterpolate }] }
          ]}>
            {card.type === 'word' ? (
              <Text style={styles.cardText}>{card.content}</Text>
            ) : (
              <Image source={card.image} style={styles.cardImage} resizeMode="contain" />
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10b981" />
      
      {/* Header */}
      <LinearGradient
        colors={['#10b981', '#34d399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Memory Match</Text>
            <Text style={styles.headerSubtitle}>จับคู่คำศัพท์กับรูปภาพ</Text>
          </View>
          
          <View style={styles.headerStats}>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statText}>{formatTime(timeLeft)}</Text>
            </View>
            <View style={styles.statBadge}>
              <LottieView 
                source={require('../assets/animations/Heart.json')} 
                autoPlay 
                loop 
                style={styles.heartAnim} 
              />
              <Text style={styles.statText}>{hearts}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statText}>{score}</Text>
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
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            จับคู่แล้ว: {matchedCards.length / 2} / {gameData.length} คู่
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(matchedCards.length / (gameData.length * 2)) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Cards Grid */}
        <View style={styles.cardsGrid}>
          {cards.map((card) => {
            const isFlipped = flippedCards.includes(card.id);
            const isMatched = matchedCards.includes(card.id);
            const isSelected = isFlipped || isMatched;
            
            return (
              <MemoryCard
                key={card.id}
                card={card}
                isFlipped={isFlipped}
                isMatched={isMatched}
                onPress={handleCardPress}
              />
            );
          })}
        </View>

        {/* Hearts Display */}
        <View style={styles.heartsContainer}>
          <Text style={styles.heartsLabel}>ชีวิต:</Text>
          <View style={styles.heartsRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View key={index} style={styles.heartContainer}>
                <LottieView
                  source={require('../assets/animations/Heart.json')}
                  autoPlay
                  loop
                  style={[
                    styles.heartIcon,
                    { opacity: index < hearts ? 1 : 0.3 }
                  ]}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Game Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>การ์ดที่เหลือ:</Text>
              <Text style={styles.statusValue}>{16 - matchedCards.length}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>ความแม่นยำ:</Text>
              <Text style={styles.statusValue}>
                {matchedCards.length > 0 ? Math.round((matchedCards.length / 2) / ((matchedCards.length / 2) + mismatchCount) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>💡 วิธีเล่น</Text>
          <Text style={styles.instructionsText}>
            • กดเลือกการ์ด 2 ใบเพื่อจับคู่{'\n'}
            • จับคู่คำไทยกับรูปภาพที่ตรงกัน{'\n'}
            • ใช้เวลาให้คุ้มค่าและจับคู่ให้ครบทุกคู่!
          </Text>
        </View>
      </ScrollView>

      {/* Result Modal */}
      <Modal transparent visible={showResult} animationType="fade">
        <View style={styles.modalBackdrop}>
          <Animated.View style={styles.modalContainer}>
            <LottieView 
              source={require('../assets/animations/Success.json')} 
              autoPlay 
              loop={false}
              style={styles.resultAnimation}
            />
            <Text style={styles.modalTitle}>
              {isWin ? "🎉 ยอดเยี่ยม!" : "⏱️ หมดเวลา!"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isWin ? "คุณจับคู่ได้ครบทุกคู่แล้ว!" : "ลองใหม่อีกครั้งนะ!"}
            </Text>
            
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>คะแนน:</Text>
                <Text style={styles.statValue}>{score}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>เวลาที่ใช้:</Text>
                <Text style={styles.statValue}>{formatTime(120 - timeLeft)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>คู่ที่จับได้:</Text>
                <Text style={styles.statValue}>{matchedCards.length / 2} / {gameData.length}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#10b981' }]}
                onPress={restartGame}
              >
                <FontAwesome name="refresh" size={18} color="#fff" />
                <Text style={styles.buttonText}>เล่นอีกครั้ง</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#667eea' }]}
                onPress={() => navigation.navigate('Minigame')}
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
    backgroundColor: '#f8fafc',
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
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  heartAnim: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
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
    color: '#10b981',
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
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heartsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heartsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 10,
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heartContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    width: 25,
    height: 25,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  cardContainer: {
    width: '23%',
    aspectRatio: 1,
    marginBottom: 15,
  },
  cardWrapper: {
    flex: 1,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: '#8b5cf6',
  },
  cardFront: {
    backgroundColor: '#10b981',
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cardImage: {
    width: 40,
    height: 40,
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
  resultAnimation: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginBottom: 25,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
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

export default MemoryMatchScreen;
