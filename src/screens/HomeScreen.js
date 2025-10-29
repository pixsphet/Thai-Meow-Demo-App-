import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import StreakLevelDisplay from '../components/StreakLevelDisplay';
import DataSyncIndicator from '../components/DataSyncIndicator';
import dataSyncService from '../services/dataSyncService';
import { XP_CONFIG, getLevelRewards } from '../utils/leveling';

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();

  // Use unified stats as single source of truth
  const { 
    xp, 
    diamonds, 
    hearts, 
    level, 
    streak, 
    stats,
    loading: statsLoading,
    updateStats,
    isStatsLoaded
  } = useUnifiedStats();

  // Function to sync data
  const handleSyncData = async () => {
    try {
      console.log('🔄 Manual sync requested');
      await dataSyncService.forceSync();
      alert('✅ ซิงค์ข้อมูลเรียบร้อยแล้ว!');
    } catch (error) {
      console.error('❌ Error syncing data:', error);
      alert('❌ ไม่สามารถซิงค์ข้อมูลได้: ' + error.message);
    }
  };

  // Initialize data sync service
  useEffect(() => {
    if (user?.id) {
      dataSyncService.initialize(user.id);
    }
    
    return () => {
      dataSyncService.destroy();
    };
  }, [user?.id]);

  const hasLoggedInitRef = useRef(false);
  const lastLevelRef = useRef(level || 1);

  // Log once when stats ready (optional debug)
  useEffect(() => {
    if (!__DEV__) return;
    if (!user?.id || !stats) return;
    if (hasLoggedInitRef.current) return;
    console.log('🔄 HomeScreen initializing stats');
    hasLoggedInitRef.current = true;
  }, [user?.id, stats]);

  useEffect(() => {
    if (!isStatsLoaded) {
      lastLevelRef.current = level || 1;
      return;
    }

    const currentLevel = Number.isFinite(level) ? level : 1;
    const previousLevel = Number.isFinite(lastLevelRef.current) ? lastLevelRef.current : currentLevel;

    if (currentLevel > previousLevel) {
      let totalHeartsReward = 0;
      let totalDiamondsReward = 0;
      for (let lvl = previousLevel + 1; lvl <= currentLevel; lvl += 1) {
        const reward = getLevelRewards(lvl);
        totalHeartsReward += reward.hearts;
        totalDiamondsReward += reward.diamonds;
      }

      const currentHearts = Number.isFinite(hearts) ? hearts : 5;
      const updatedHearts = Math.max(0, currentHearts + totalHeartsReward);
      const heartsGained = Math.max(0, updatedHearts - currentHearts);
      const currentDiamonds = Number.isFinite(diamonds) ? diamonds : 0;
      const updatedDiamonds = currentDiamonds + totalDiamondsReward;

      (async () => {
        try {
          await updateStats({ hearts: updatedHearts, diamonds: updatedDiamonds });
        } catch (err) {
          console.warn('Failed to update stats with rewards:', err?.message);
        } finally {
          Alert.alert(
            'เลเวลอัพ!',
            `ได้รับหัวใจ +${heartsGained.toLocaleString('th-TH')} ดวง และเพชร +${totalDiamondsReward.toLocaleString('th-TH')} เม็ด`,
            [{ text: 'เยี่ยม!' }]
          );
        }
      })();
    }

    lastLevelRef.current = currentLevel;
  }, [level, hearts, diamonds, updateStats, isStatsLoaded]);

  // Language levels data from LevelScreen
  const languageLevels = [
    {
      id: 'thai-consonants',
      level: 'หมวดการเรียน พยัญชนะ สระ และ วรรณยุกต์ เริ่มต้น',
      description: 'สำรวจบทเรียนพื้นฐานสำหรับพยัญชนะ สระ และวรรณยุกต์ พร้อมภาพและเสียงประกอบ',
      color: '#FF8C00', // สีส้มหลัก
      image: require('../assets/images/Grumpy Cat.png'),
    },
    {
      id: 'beginner',
      level: 'Level 1 - Beginner',
      description: 'เรียนรู้คำศัพท์พื้นฐาน การออกเสียง และประโยคง่ายๆ',
      color: '#FFA500', // สีส้มอ่อน
      image: require('../assets/images/Catsmile.png'),
    },
    {
      id: 'intermediate',
      level: 'Level 2 - Intermediate',
      description: 'พัฒนาทักษะการพูด ฟัง อ่าน เขียน สำหรับการใช้ในชีวิตประจำวัน',
      color: '#FF6B35', // สีส้มแดง
      image: require('../assets/images/Catsmile1.png'),

    },
    {
      id: 'advanced',
      level: 'Level 3 - Advanced',
      description: 'สำหรับผู้เชี่ยวชาญในสำนวน ไวยากรณ์ และการสนทนาที่ซับซ้อน',
      color: '#E67300', // สีส้มเข้ม
      image: require('../assets/images/happy.png'),
    },
  ];

  const handleLevelPress = (levelId) => {
    try {
      console.log('🎯 Navigating to level:', levelId);
      // Navigate ไปหน้า level selection สำหรับแต่ละ level
      switch (levelId) {
        case 'thai-consonants':
          navigation.navigate('ConsonantLearn', {
            lessonId: 1,
            category: 'thai-consonants',
            level: 'Beginner',
            stageTitle: 'พยัญชนะพื้นฐาน ก-ฮ',
          });
          break;
        case 'beginner':
          navigation.navigate('LevelStage1', { levelId, level: 'Beginner' });
          break;
        case 'intermediate':
          navigation.navigate('LevelStage2', { levelId, level: 'Intermediate' });
          break;
        case 'advanced':
          navigation.navigate('LevelStage3', { levelId, level: 'Advanced' });
          break;
        default:
          navigation.navigate('ConsonantLearn', { levelId });
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  };

  const QuickActionCard = ({ icon, title, subtitle, onPress, colors, iconColor = "white" }) => (
    <TouchableOpacity onPress={onPress} style={styles.quickActionCard}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );

  // Custom Tab Bar Component for HomeScreen
  const CustomTabBar = () => {
    const tabBarStyle = {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 26,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      borderTopWidth: 0,
      height: 72,
      borderRadius: 18,
      paddingBottom: 8,
      paddingTop: 8,
      paddingHorizontal: 4,
      overflow: 'hidden',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    };

    const tabBarGradient = ['#FFF5E6', '#FFFFFF'];

    const tabItems = [
      {
        name: 'Home',
        label: 'หน้าแรก',
        icon: 'home',
        screen: 'HomeMain',
      },
      {
        name: 'Minigame',
        label: 'เกม',
        icon: 'gamepad',
        screen: 'Minigame',
      },
      {
        name: 'Progress',
        label: 'ความคืบหน้า',
        icon: 'trophy',
        screen: 'Progress',
      },
      {
        name: 'Profile',
        label: 'โปรไฟล์',
        icon: 'user',
        screen: 'Profile',
      },
    ];

    return (
      <LinearGradient
        colors={tabBarGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tabBarStyle}
      >
        {tabItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
              paddingHorizontal: 2,
              minWidth: 60,
            }}
            onPress={() => navigation.navigate(item.screen)}
          >
          <FontAwesome 
            name={item.icon} 
            size={22} 
            color={item.name === 'Home' ? '#FF8000' : '#666'}
          />
          <Text style={{
            fontSize: 11,
            fontWeight: '500',
            color: item.name === 'Home' ? '#FF8000' : '#666',
            marginTop: 3,
            textAlign: 'center',
          }}>
              {item.label}
          </Text>
        </TouchableOpacity>
        ))}
      </LinearGradient>
    );
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} // Add padding for tab bar
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.greeting, { color: theme.text }]}>
              สวัสดี, {user?.username || 'ผู้เรียน'}!
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              พร้อมเรียนภาษาไทยกันไหม?
            </Text>
          </View>
          {/* Right: Status badges */}
          <View style={styles.headerStatusRight}>
            {/* Hearts */}
            <View style={styles.statusBadge}>
              <View style={styles.badgeIconWrap}>
                <LottieView
                  source={require('../assets/animations/Heart.json')}
                  autoPlay
                  loop
                  style={styles.badgeAnim}
                />
              </View>
              <Text style={styles.badgeValue}>{statsLoading ? '...' : hearts}</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('GemShop')}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Diamonds */}
            <View style={styles.statusBadge}>
              <View style={styles.badgeIconWrap}>
                <LottieView
                  source={require('../assets/animations/Diamond.json')}
                  autoPlay
                  loop
                  style={styles.badgeAnim}
                />
              </View>
              <Text style={styles.badgeValue}>{statsLoading ? '...' : diamonds}</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('GemShop')}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Data Sync Indicator - Small Icon */}
            <DataSyncIndicator onPress={handleSyncData} />
          </View>
        </View>

        {/* Streak and Level Display */}
        <StreakLevelDisplay />

        {/* 🔥 ⭐ 🏆 User Stats Card - Single Row */}
        <View style={styles.userStatsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <LottieView
                source={require('../assets/animations/Streak-Fire1.json')}
                autoPlay
                loop
                style={styles.statAnimation}
              />
              <Text style={styles.statValue}>{statsLoading ? '...' : (streak || 0)}</Text>
              <Text style={styles.statLabel}>วันต่อเนื่อง</Text>
            </View>


            <View style={styles.statItem}>
              <LottieView
                source={require('../assets/animations/Star.json')}
                autoPlay
                loop
                style={styles.statAnimation}
              />
              <Text style={styles.statValue}>{statsLoading ? '...' : (xp || 0)}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>

            <View style={styles.statItem}>
              <LottieView
                source={require('../assets/animations/Trophy.json')}
                autoPlay
                loop
                style={styles.statAnimation}
              />
              <Text style={styles.statValue}>{statsLoading ? '...' : (level || 1)}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>
        </View>

        {/* Language Levels */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎯 เลือกระดับการเรียนรู้</Text>
          {languageLevels.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.levelBox, { backgroundColor: item.color }]}
              onPress={() => handleLevelPress(item.id)}
            >
              <View style={styles.boxContent}>
                {item.image && <Image source={item.image} style={styles.catImage} resizeMode="contain" />}
                <View style={styles.textContainer}>
                  <Text style={styles.levelText}>{item.level}</Text>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                  
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${(item.completedStages / item.stageCount) * 100}%`,
                            backgroundColor: item.color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {item.completedStages} / {item.stageCount} ด่าน
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions removed per request */}

        {/* Minigames Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎮 Mini Games</Text>
          
          <TouchableOpacity 
            style={[styles.minigameCard, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate('Minigame')}
          >
            <View style={styles.minigameContent}>
              <View style={styles.minigameIconContainer}>
                <LottieView
                  source={require('../assets/animations/GameCat.json')}
                  autoPlay
                  loop
                  style={styles.minigameAnimation}
                />
              </View>
              <View style={styles.minigameText}>
                <Text style={[styles.minigameTitle, { color: theme.text }]}>
                  Mini Games
                </Text>
                <Text style={[styles.minigameSubtitle, { color: theme.textSecondary }]}>
                  เล่นเกมสนุก ๆ เพื่อฝึกภาษาไทย
                </Text>
                <View style={styles.minigameFeatures}>
                  <Text style={[styles.minigameFeature, { color: theme.textSecondary }]}>
                    🔍 Word Finder • 🧩 Word Scramble • 🃏 Memory Match • ⌨️ Speed Typing
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Daily Challenge removed per request */}

        {/* Recent Activity removed per request */}

        {/* Learning Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💡 เคล็ดลับการเรียนรู้</Text>
          <View style={[styles.tipsCard, { backgroundColor: theme.card }]}>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color="#FFD93D" />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.text }]}>เรียนทุกวัน</Text>
                <Text style={[styles.tipDescription, { color: theme.textSecondary }]}>
                  เรียน 15-30 นาทีต่อวันจะช่วยให้จำได้ดีขึ้น
                </Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="volume-high" size={24} color="#4ECDC4" />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.text }]}>ฟังเสียง</Text>
                <Text style={[styles.tipDescription, { color: theme.textSecondary }]}>
                  ฟังการออกเสียงจะช่วยให้จำได้แม่นยำ
                </Text>
              </View>
            </View>
            <View style={styles.tipItem}>
              <MaterialCommunityIcons name="repeat" size={24} color="#FF6B6B" />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: theme.text }]}>ทบทวน</Text>
                <Text style={[styles.tipDescription, { color: theme.textSecondary }]}>
                  ทบทวนบทเรียนเก่าเป็นประจำ
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Custom Tab Bar - Only shown on HomeScreen */}
      <CustomTabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  /* กลุ่มทางขวาแทนปุ่มเดิม */
  headerStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  /* แบดจ์แต่ละอัน */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(254,131,5,0.08)', // โทนส้มอ่อน
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
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
    color: '#2C3E50',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientCard: {
    padding: 20,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
    textAlign: 'center',
  },
  minigameCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  minigameContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minigameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  testIcon: {
    fontSize: 30,
  },
  minigameAnimation: {
    width: 40,
    height: 40,
  },
  minigameText: {
    flex: 1,
  },
  minigameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  minigameSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  minigameFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minigameFeature: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dailyChallenge: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeText: {
    flex: 1,
    marginLeft: 16,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  challengeSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  activityCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityText: {
    marginLeft: 12,
    fontSize: 14,
  },
  // Level box styles from LevelScreen
  levelBox: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  boxContent: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  catImage: { 
    width: 80, 
    height: 80, 
    marginRight: 15, 
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  textContainer: { 
    flex: 1 
  },
  levelText: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  descriptionText: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: 14, 
    lineHeight: 18, 
    marginBottom: 15 
  },
  progressContainer: { 
    marginTop: 10 
  },
  progressBar: { 
    height: 6, 
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    borderRadius: 3, 
    overflow: 'hidden',
    marginBottom: 5
  },
  progressFill: { 
    height: '100%', 
    borderRadius: 3 
  },
  progressText: { 
    color: 'rgba(255, 255, 255, 0.8)', 
    fontSize: 12, 
    fontWeight: '500' 
  },
  // User Stats Card Styles - 2 Rows Layout
  userStatsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 25,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 80,
  },
  statAnimation: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  // Learning Tips Styles
  tipsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Add Button Styles
  addButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
});

export default HomeScreen;
