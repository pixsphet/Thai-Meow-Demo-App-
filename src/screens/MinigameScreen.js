// Minimal, clean MinigameScreen implementation
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Modal, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import ThemedBackButton from '../components/ThemedBackButton';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';

const MinigameScreen = () => {
  const navigation = useNavigation();
  const { xp, diamonds, stats, loading: statsLoading } = useUnifiedStats();
  const [historyVisible, setHistoryVisible] = React.useState(false);

  const games = [
    {
      id: 'word-finder',
      title: '🔍 Word Finder',
      subtitle: 'ค้นหาคำไทยในตาราง',
      description: 'หาคำศัพท์ไทยในช่องตารางแบบแนวตั้ง แนวนอน และแนวเฉียง',
      icon: 'search',
      color: ['#667eea', '#764ba2'],
      category: 'Animals',
      screen: 'Game1',
      difficulty: 'Medium',
    },
    {
      id: 'word-scramble',
      title: '🧩 Word Scramble',
      subtitle: 'เรียงคำไทยให้ถูกต้อง',
      description: 'เรียงตัวอักษรไทยให้เป็นคำที่ถูกต้องตามคำใบ้',
      icon: 'shuffle',
      color: ['#f093fb', '#f5576c'],
      category: 'Animals',
      screen: 'Game2',
      difficulty: 'Easy',
    },
    {
      id: 'memory-match',
      title: '🎴 Memory Match',
      subtitle: 'จับคู่คำกับรูป',
      description: 'จับคู่คำศัพท์ไทยกับรูปภาพที่ตรงกัน',
      icon: 'auto-fix-high',
      color: ['#4facfe', '#00f2fe'],
      category: 'Animals',
      screen: 'MemoryMatch',
      difficulty: 'Medium',
    },
    {
      id: 'speed-typing',
      title: '⚡ Speed Typing',
      subtitle: 'พิมพ์เร็วแข่งเวลา',
      description: 'พิมพ์คำศัพท์ไทยให้เร็วและแม่นยำที่สุด',
      icon: 'flash',
      color: ['#fa709a', '#fee140'],
      category: null,
      screen: 'SpeedTyping',
      difficulty: 'Hard',
    },
  ];

  const GameCard = ({ game }) => (
    <TouchableOpacity
      style={styles.gameCard}
      onPress={() => {
        if (game.screen === 'Game1' || game.screen === 'Game2' || game.screen === 'MemoryMatch') {
          navigation.navigate(game.screen, { category: game.category });
        } else {
          navigation.navigate(game.screen);
        }
      }}
      activeOpacity={0.8}
    >
      <LinearGradient colors={game.color} style={styles.cardGradient}>
        <View style={styles.cardHeader}>
          <LottieView
            source={require('../assets/animations/GameCat.json')}
            autoPlay
            loop
            style={styles.cardAnimation}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
            <Text style={styles.cardDescription}>{game.description}</Text>
            
            {/* Difficulty Badge */}
            <View style={[styles.difficultyBadge, { backgroundColor: game.difficulty === 'Easy' ? '#10b981' : game.difficulty === 'Medium' ? '#f59e0b' : '#ef4444' }]}>
              <MaterialIcons 
                name={game.difficulty === 'Easy' ? 'sentiment-very-satisfied' : game.difficulty === 'Medium' ? 'sentiment-satisfied' : 'mood-bad'} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.difficultyText}>{game.difficulty === 'Easy' ? 'ง่าย' : game.difficulty === 'Medium' ? 'ปานกลาง' : 'ยาก'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient colors={[ '#667eea', '#764ba2' ]} style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedBackButton style={styles.backButton} onPress={() => navigation.goBack()} />
          <View style={styles.headerTitleCentered}>
            <Text style={styles.headerTitleText}>🎮 Mini Games 🎮</Text>
            <Text style={styles.headerSubtitle}>เกมสนุก ๆ สำหรับฝึกภาษาไทย</Text>
            <View style={styles.headerStatsRow}>
              <View style={styles.statItemSmall}>
                <LottieView source={require('../assets/animations/Star.json')} autoPlay loop style={styles.statLottie} />
                <Text style={styles.statValueSmall}>{statsLoading ? '...' : (xp || 0)}</Text>
                <Text style={styles.statLabelSmall}>XP</Text>
              </View>
              <TouchableOpacity style={styles.statItemSmall} onPress={() => setHistoryVisible(true)}>
                <LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={styles.statLottie} />
                <Text style={styles.statValueSmall}>{statsLoading ? '...' : (diamonds || 0)}</Text>
                <Text style={styles.statLabelSmall}>เพชร</Text>
              </TouchableOpacity>
              <View style={styles.statItemSmall}>
                <MaterialIcons name="gamepad" size={24} color="#fff" />
                <Text style={styles.statValueSmall}>{statsLoading ? '...' : (stats?.totalSessions || 0)}</Text>
                <Text style={styles.statLabelSmall}>เกม</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <LottieView source={require('../assets/animations/GameCat.json')} autoPlay loop style={styles.welcomeAnimation} />
          <Text style={styles.welcomeTitle}>🎮 ยินดีต้อนรับสู่ Mini Games! 🎮</Text>
          <Text style={styles.welcomeDescription}>เลือกเกมที่คุณชอบและสนุกไปกับการเรียนรู้ภาษาไทย</Text>
        </View>

        {/* Games Grid */}
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <MaterialIcons name="info" size={24} color="#667eea" />
          <Text style={styles.infoTitle}>💡 ระบบรางวัล</Text>
          <Text style={styles.infoText}>
            • ผ่านเกมได้เพชรตามความยาก{'\n'}
            • ทำคะแนนสูงได้รางวัลมากขึ้น{'\n'}
            • ใช้เพชรซื้อหัวใจและไอเทมได้
          </Text>
        </View>
      </ScrollView>

      <Modal transparent visible={historyVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.historyModal}>
            <Text style={styles.historyTitle}>📊 สถิติการเล่น</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>คะแนนรวม:</Text>
              <Text style={styles.statValue}>{xp || 0} XP</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>เพชรรวม:</Text>
              <Text style={styles.statValue}>{diamonds || 0} 💎</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>เกมที่เล่น:</Text>
              <Text style={styles.statValue}>{stats?.totalSessions || 0} ครั้ง</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setHistoryVisible(false)}
            >
              <Text style={styles.closeButtonText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 36, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, minHeight: 150 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center' },
  headerTitleCentered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitleText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  headerStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statItemSmall: { alignItems: 'center', minWidth: 68, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, marginHorizontal: 4 },
  statLottie: { width: 20, height: 20, marginBottom: 4 },
  statValueSmall: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLabelSmall: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  welcomeSection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: -30, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  welcomeAnimation: { width: 100, height: 100 },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 8, textAlign: 'center' },
  welcomeDescription: { color: '#6b7280', textAlign: 'center', marginTop: 8, fontSize: 14 },
  gameCard: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: { padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardAnimation: { width: 60, height: 60, marginRight: 16 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 8 },
  cardDescription: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18, marginBottom: 12 },
  difficultyBadge: { 
    alignSelf: 'flex-start', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
    gap: 4,
  },
  difficultyText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  infoSection: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
  },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  historyModal: { 
    width: '85%', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 24,
    alignItems: 'center',
  },
  historyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 20 },
  statRow: { 
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statLabel: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#667eea' },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default MinigameScreen;
