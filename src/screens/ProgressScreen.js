import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useProgress } from '../contexts/ProgressContext';
import { useUser } from '../contexts/UserContext';
import { useUserData } from '../contexts/UserDataContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ProgressScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { stats: userData } = useUserData();
  
  // Use unified stats as single source of truth
  const { 
    xp: totalXP,
    level: currentLevel,
    streak: currentStreak,
    hearts,
    diamonds,
    accuracy,
    totalTimeSpent,
    totalSessions,
    averageAccuracy,
    lastPlayed,
    achievements,
    badges,
    levelProgress,
    loading: statsLoading,
    error: statsError,
    updateStats,
    forceRefresh,
    isStatsLoaded
  } = useUnifiedStats();

  // Use unified stats as primary source, fallback to progress context
  const {
    getTotalXP,
    getCurrentLevel,
    getCurrentStreak,
    getLevelProgressPercentage,
    getStatistics,
    getRecentGames
  } = useProgress();

  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef(0);
  const REFRESH_THROTTLE = 60000;

  // Force refresh stats when screen comes into focus (throttled)
  useFocusEffect(
    useCallback(() => {
      if (!isStatsLoaded) return;
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_THROTTLE) {
        return;
      }
      lastRefreshRef.current = now;
      forceRefresh().catch(err => console.warn('ProgressScreen forceRefresh error:', err?.message));
    }, [isStatsLoaded, forceRefresh])
  );

  useEffect(() => {
    if (!isStatsLoaded && statsLoading) {
      setLoading(true);
    }
  }, [isStatsLoaded, statsLoading]);

  const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  useEffect(() => {
    const progressStats = getStatistics();
    const recent = getRecentGames() || [];

    const safeTotalXP = safeNumber(totalXP, getTotalXP());
    const safeLevel = safeNumber(currentLevel, getCurrentLevel());
    const safeStreak = safeNumber(currentStreak, getCurrentStreak());
    const progressRatio = (() => {
      if (typeof levelProgress === 'number') return levelProgress / 100;
      if (levelProgress && Number.isFinite(levelProgress.progress)) return levelProgress.progress;
      const fallback = getLevelProgressPercentage();
      if (Number.isFinite(fallback)) return fallback / 100;
      return 0;
    })();

    const xpToNext = Math.max(0, 100 - (safeTotalXP % 100));

    const normalizedAccuracy = (() => {
      const val = safeNumber(accuracy, progressStats.accuracy ?? 0);
      return val <= 1 ? Math.round(val * 100) : Math.round(val);
    })();

    const normalizedAverageAccuracy = (() => {
      const val = safeNumber(averageAccuracy, 0);
      return val <= 1 ? Math.round(val * 100) : Math.round(val);
    })();

    const derivedStats = {
      totalXP: safeTotalXP,
      currentLevel: safeLevel,
      currentStreak: safeStreak,
      levelProgressPercent: Math.round(Math.min(100, Math.max(0, progressRatio * 100))),
      hearts: safeNumber(hearts, userData?.hearts ?? 5),
      diamonds: safeNumber(diamonds, userData?.diamonds ?? 0),
      totalLessons: safeNumber(progressStats.totalLessons, userData?.totalLessons ?? 0),
      completedLessons: safeNumber(progressStats.completedLessons, userData?.completedLessons ?? 0),
      totalGames: safeNumber(totalSessions, progressStats.totalGames ?? 0),
      completedGames: safeNumber(progressStats.completedGames, 0),
      accuracy: normalizedAccuracy,
      timeSpentHours: (() => {
        const seconds = safeNumber(totalTimeSpent, progressStats.timeSpent ?? 0);
        return Math.max(0, Math.round(seconds / 3600));
      })(),
      averageAccuracy: normalizedAverageAccuracy,
      lastPlayed: lastPlayed || userData?.lastPlayed || null,
      xpToNext,
    };

    setStats(derivedStats);
    setRecentGames(recent.slice(0, 5));
    setLoading(false);
  }, [
    totalXP,
    currentLevel,
    currentStreak,
    hearts,
    diamonds,
    accuracy,
    totalTimeSpent,
    totalSessions,
    averageAccuracy,
    lastPlayed,
    levelProgress,
    userData,
    getStatistics,
    getRecentGames,
    getTotalXP,
    getCurrentLevel,
    getCurrentStreak,
    getLevelProgressPercentage
  ]);

  const StatCard = ({ icon, value, label, color, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  const learningMetrics = useMemo(() => [
    {
      key: 'lessons',
      icon: require('../assets/animations/book_lesson.json'),
      label: 'บทเรียนที่เสร็จ',
      value: `${stats?.completedLessons ?? 0}/${stats?.totalLessons ?? 0}`,
    },
    {
      key: 'hours',
      icon: require('../assets/animations/speaking.json'),
      label: 'เวลาเรียน',
      value: `${stats?.timeSpentHours ?? 0} ชั่วโมง`,
    },
    {
      key: 'accuracy',
      icon: require('../assets/animations/Star.json'),
      label: 'ความแม่นยำเฉลี่ย',
      value: `${safeNumber(stats?.averageAccuracy ?? stats?.accuracy, 0)}%`,
    },
    {
      key: 'sessions',
      icon: require('../assets/animations/Trophy.json'),
      label: 'จำนวนครั้งที่เล่น',
      value: safeNumber(stats?.totalGames, 0),
    },
  ], [stats]);

  const formattedRecentGames = useMemo(() => {
    return (recentGames || []).map(game => ({
      id: game.id || Math.random().toString(36).slice(2),
      title: game.title || 'บทเรียน',
      description: game.description || 'กิจกรรม',
      icon: game.icon || 'gamepad-variant',
      color: game.color || '#FF8C00',
      score: safeNumber(game.score, 0),
      completedAt: game.completedAt || new Date().toISOString()
    }));
  }, [recentGames]);

  const MetricCard = ({ metric }) => (
    <View style={[styles.metricCard, { backgroundColor: theme.card }]}>
      <LottieView
        source={metric.icon}
        autoPlay
        loop
        style={styles.metricIcon}
      />
      <View style={styles.metricContent}>
        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{metric.label}</Text>
        <Text style={[styles.metricValue, { color: theme.text }]}>{metric.value}</Text>
      </View>
    </View>
  );

  const AchievementCard = ({ achievement }) => (
    <View style={[styles.achievementCard, { backgroundColor: theme.card }]}>
      <View style={styles.achievementIcon}>
        <MaterialCommunityIcons 
          name={achievement.icon} 
          size={24} 
          color={achievement.unlocked ? '#FFD700' : '#ccc'} 
        />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, { color: theme.text }]}>
          {achievement.title}
        </Text>
        <Text style={[styles.achievementDescription, { color: theme.textSecondary }]}>
          {achievement.description}
        </Text>
        {achievement.unlocked && (
          <Text style={styles.achievementUnlocked}>
            ปลดล็อกแล้ว: {new Date(achievement.unlockedAt).toLocaleDateString('th-TH')}
          </Text>
        )}
      </View>
    </View>
  );

  const RecentGameCard = ({ game }) => (
    <View style={[styles.recentGameCard, { backgroundColor: theme.card }]}>
      <View style={styles.recentGameIcon}>
        <MaterialCommunityIcons name={game.icon} size={20} color={game.color} />
      </View>
      <View style={styles.recentGameContent}>
        <Text style={[styles.recentGameTitle, { color: theme.text }]}>{game.title}</Text>
        <Text style={[styles.recentGameDescription, { color: theme.textSecondary }]}>
          {game.description}
        </Text>
        <Text style={styles.recentGameTime}>
          {new Date(game.completedAt).toLocaleDateString('th-TH')}
        </Text>
      </View>
      <View style={styles.recentGameScore}>
        <Text style={styles.recentGameScoreText}>{game.score}</Text>
        <Text style={styles.recentGameScoreLabel}>คะแนน</Text>
      </View>
    </View>
  );

  if (loading || statsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading progress...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return null;
  }

  // Custom Tab Bar Component
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
            color={item.name === 'Progress' ? '#FF8000' : '#666'}
          />
          <Text style={{
            fontSize: 11,
            fontWeight: '500',
            color: item.name === 'Progress' ? '#FF8000' : '#666',
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
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.text }]}>ความคืบหน้าของคุณ</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              สวัสดี, {user?.username || 'ผู้เรียน'}!
            </Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={[styles.levelCard, { backgroundColor: theme.card }]}>
          <View style={styles.levelHeader}>
            <LottieView
              source={require('../assets/animations/Trophy.json')}
              autoPlay
              loop
              style={styles.levelAnimation}
            />
            <View style={styles.levelInfo}>
              <Text style={[styles.levelTitle, { color: theme.text }]}>Level {stats.currentLevel || 1}</Text>
              <Text style={[styles.levelXP, { color: theme.textSecondary }]}>
                {stats.totalXP} XP
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${stats.levelProgressPercent}%` }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {stats.levelProgressPercent}% ไปยัง Level {(stats.currentLevel || 1) + 1}
          </Text>
          <Text style={[styles.progressSubtext, { color: theme.textSecondary }]}>
            ต้องการอีก {stats.xpToNext} XP เพื่อเลเวลถัดไป
          </Text>
        </View>

        {/* User Stats Summary */}
        <View style={[styles.userStatsSummary, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>📊 สถิติรวมของคุณ</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <LottieView
                source={require('../assets/animations/Streak-Fire1.json')}
                autoPlay
                loop
                style={styles.summaryStatAnimation}
              />
              <Text style={styles.summaryStatValue}>{stats.currentStreak}</Text>
              <Text style={styles.summaryStatLabel}>วันต่อเนื่อง</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <LottieView
                source={require('../assets/animations/Heart.json')}
                autoPlay
                loop
                style={styles.summaryStatAnimation}
              />
              <Text style={styles.summaryStatValue}>{stats.hearts}</Text>
              <Text style={styles.summaryStatLabel}>หัวใจ</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <LottieView
                source={require('../assets/animations/Diamond.json')}
                autoPlay
                loop
                style={styles.summaryStatAnimation}
              />
              <Text style={styles.summaryStatValue}>{stats.diamonds}</Text>
              <Text style={styles.summaryStatLabel}>เพชร</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <LottieView
                source={require('../assets/animations/Star.json')}
                autoPlay
                loop
                style={styles.summaryStatAnimation}
              />
              <Text style={styles.summaryStatValue}>{stats.totalXP}</Text>
              <Text style={styles.summaryStatLabel}>XP</Text>
            </View>
          </View>
        </View>

        {/* Learning Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>ภาพรวมการเรียนรู้</Text>
          <View style={styles.metricsGrid}>
            {learningMetrics.map(metric => (
              <MetricCard key={metric.key} metric={metric} />
            ))}
          </View>
        </View>

        {/* Recent Games */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>เกมล่าสุด</Text>
          {formattedRecentGames.length > 0 ? (
            formattedRecentGames.map((game) => (
              <RecentGameCard key={game.id} game={game} />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}> 
              <MaterialCommunityIcons name="gamepad-variant" size={48} color="#ccc" />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}> 
                ยังไม่มีเกมที่เล่น
              </Text>
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>ความสำเร็จ</Text>
          {statsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}> 
                Loading achievements...
              </Text>
            </View>
          ) : achievements && achievements.length > 0 ? (
            achievements.map((achievement) => (
              <AchievementCard key={achievement.id || Math.random().toString(36).slice(2)} achievement={achievement} />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}> 
              <MaterialCommunityIcons name="trophy" size={48} color="#ccc" />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}> 
                ยังไม่มีความสำเร็จ
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
      
      {/* Custom Tab Bar */}
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
    alignItems: 'center',
    padding: 20,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  levelCard: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelAnimation: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  levelXP: {
    fontSize: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF8000',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  progressSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    flexBasis: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIcon: {
    width: 36,
    height: 36,
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  recentGameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentGameIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  recentGameContent: {
    flex: 1,
  },
  recentGameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recentGameDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  recentGameTime: {
    fontSize: 12,
    color: '#999',
  },
  recentGameScore: {
    alignItems: 'center',
  },
  recentGameScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8000',
  },
  recentGameScoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  achievementUnlocked: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // User Stats Summary Styles
  userStatsSummary: {
    marginHorizontal: 20,
    marginBottom: 25,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryStatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 80,
  },
  summaryStatAnimation: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  summaryStatLabel: {
    fontSize: 13,
    color: '#777',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});

export default ProgressScreen;
