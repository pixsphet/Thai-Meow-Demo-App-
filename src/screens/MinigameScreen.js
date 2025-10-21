import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MinigameScreen = () => {
  const navigation = useNavigation();
  const [userStats, setUserStats] = useState({
    totalScore: 0,
    gamesPlayed: 0,
    bestStreak: 0,
  });

  const minigames = [
    {
      id: 'word-finder',
      title: 'Word Finder',
      description: 'ช่วยแมวน้อยหาคำในตารางตัวอักษร',
      icon: '🔍',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#a855f7'],
      screen: 'Game1',
      difficulty: 'Easy',
      estimatedTime: '2-5 min',
    },
    {
      id: 'word-scramble',
      title: 'Word Scramble',
      description: 'เรียงตัวอักษรให้เป็นคำที่ถูกต้อง',
      icon: '🧩',
      color: '#f59e0b',
      gradient: ['#f59e0b', '#fbbf24'],
      screen: 'Game2',
      difficulty: 'Medium',
      estimatedTime: '3-7 min',
    },
    {
      id: 'memory-match',
      title: 'Memory Match',
      description: 'จับคู่คำศัพท์กับรูปภาพ',
      icon: '🧠',
      color: '#10b981',
      gradient: ['#10b981', '#34d399'],
      screen: 'MemoryMatch',
      difficulty: 'Medium',
      estimatedTime: '5-10 min',
      comingSoon: false,
    },
    {
      id: 'speed-typing',
      title: 'Speed Typing',
      description: 'พิมพ์คำศัพท์ให้เร็วที่สุด',
      icon: '⚡',
      color: '#ef4444',
      gradient: ['#ef4444', '#f87171'],
      screen: 'SpeedTyping',
      difficulty: 'Hard',
      estimatedTime: '2-8 min',
      comingSoon: false,
    },
  ];

  const GameCard = ({ game, index }) => {
    const isComingSoon = game.comingSoon;
    
    return (
      <TouchableOpacity
        style={[styles.gameCard, { marginTop: index === 0 ? 0 : 20 }]}
        onPress={() => {
          if (!isComingSoon && game.screen) {
            navigation.navigate(game.screen);
          }
        }}
        disabled={isComingSoon}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={game.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gameCardGradient}
        >
          {isComingSoon && (
            <View style={styles.comingSoonOverlay}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          )}
          
          <View style={styles.gameCardContent}>
            <View style={styles.gameIconContainer}>
              {game.id === 'word-finder' ? (
                <LottieView
                  source={require('../assets/animations/WordFinding.json')}
                  autoPlay
                  loop
                  style={styles.gameAnimation}
                />
              ) : game.id === 'word-scramble' ? (
                <LottieView
                  source={require('../assets/animations/WordScramble.json')}
                  autoPlay
                  loop
                  style={styles.gameAnimation}
                />
              ) : game.id === 'coming-soon-1' ? (
                <LottieView
                  source={require('../assets/animations/MemoryMatch.json')}
                  autoPlay
                  loop
                  style={styles.gameAnimation}
                />
              ) : game.id === 'speed-typing' ? (
                <LottieView
                  source={require('../assets/animations/SpeedTyping.json')}
                  autoPlay
                  loop
                  style={styles.gameAnimation}
                />
              ) : game.id === 'memory-match' ? (
                <LottieView
                  source={require('../assets/animations/MemoryMatch.json')}
                  autoPlay
                  loop
                  style={styles.gameAnimation}
                />
              ) : (
                <Text style={styles.gameIcon}>{game.icon}</Text>
              )}
            </View>
            
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDescription}>{game.description}</Text>
              
              <View style={styles.gameMeta}>
                <View style={styles.metaItem}>
                  <FontAwesome name="star" size={12} color="#fff" />
                  <Text style={styles.metaText}>{game.difficulty}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome name="clock-o" size={12} color="#fff" />
                  <Text style={styles.metaText}>{game.estimatedTime}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.playButton}>
              <FontAwesome 
                name={isComingSoon ? "lock" : "play"} 
                size={16} 
                color="#fff" 
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
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
            <Text style={styles.headerTitleText}>Mini Games</Text>
            <Text style={styles.headerSubtitle}>เกมสนุก ๆ สำหรับฝึกภาษาไทย</Text>
          </View>
          
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalScore}</Text>
              <Text style={styles.statLabel}>คะแนน</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.gamesPlayed}</Text>
              <Text style={styles.statLabel}>เกม</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <LottieView
            source={require('../assets/animations/GameCat.json')}
            autoPlay
            loop
            style={styles.welcomeAnimation}
          />
          <Text style={styles.welcomeTitle}>🎮 ยินดีต้อนรับสู่ Mini Games! 🎮</Text>
          <Text style={styles.welcomeDescription}>
            เลือกเกมที่คุณชอบและสนุกไปกับการเรียนรู้ภาษาไทย
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statText}>{userStats.totalScore}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statText}>{userStats.gamesPlayed}</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statText}>{userStats.bestStreak}</Text>
            </View>
          </View>
        </View>

        {/* Games List */}
        <View style={styles.gamesSection}>
          <Text style={styles.sectionTitle}>🎮 เลือกเกมที่คุณชอบ</Text>
          
          {minigames.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 เคล็ดลับ</Text>
          <View style={styles.tipItem}>
            <FontAwesome name="lightbulb-o" size={16} color="#f59e0b" />
            <Text style={styles.tipText}>เล่นเกมทุกวันเพื่อเพิ่มคะแนนและความแม่นยำ</Text>
          </View>
          <View style={styles.tipItem}>
            <FontAwesome name="trophy" size={16} color="#f59e0b" />
            <Text style={styles.tipText}>ลองเล่นเกมที่ยากขึ้นเพื่อท้าทายตัวเอง</Text>
          </View>
          <View style={styles.tipItem}>
            <FontAwesome name="heart" size={16} color="#f59e0b" />
            <Text style={styles.tipText}>อย่าลืมพักผ่อนเมื่อรู้สึกเหนื่อย</Text>
          </View>
        </View>
      </ScrollView>
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
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeAnimation: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 10,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  gamesSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  gameCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  gameCardGradient: {
    padding: 20,
    minHeight: 120,
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  gameIcon: {
    fontSize: 28,
  },
  gameAnimation: {
    width: 50,
    height: 50,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    lineHeight: 20,
  },
  gameMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});

export default MinigameScreen;
