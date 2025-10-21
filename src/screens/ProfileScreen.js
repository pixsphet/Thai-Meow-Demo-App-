import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useUser } from "../contexts/UserContext";
import { useTheme } from "../contexts/ThemeContext";
import { useProgress } from "../contexts/ProgressContext";
import { useUserData } from "../contexts/UserDataContext";
import { useUnifiedStats } from "../contexts/UnifiedStatsContext";
import userService from "../services/userService";
import { getLevelRewards, getXpProgress } from "../utils/leveling";

const tabItems = [
  { name: 'Home', label: 'หน้าแรก', icon: 'home', screen: 'HomeMain' },
  { name: 'Minigame', label: 'เกม', icon: 'gamepad', screen: 'Minigame' },
  { name: 'Progress', label: 'ความคืบหน้า', icon: 'trophy', screen: 'Progress' },
  { name: 'Profile', label: 'โปรไฟล์', icon: 'user', screen: 'Profile' },
  { name: 'AddFriend', label: 'เพิ่มเพื่อน', icon: 'user-plus', screen: 'AddFriend' }
];

const CustomTabBar = ({ activeTab, navigation, theme }) => {
  return (
    <View style={{
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 26,
      backgroundColor: '#fff',
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 },
      borderTopWidth: 0,
      height: 68,
      borderRadius: 18,
      paddingBottom: 8,
      paddingTop: 8,
      overflow: 'hidden',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    }}>
      {tabItems.map(item => {
        const isActive = item.name === activeTab;
        let tint = '#666';
        if (isActive) {
          tint = '#FF8000';
        }
        return (
          <TouchableOpacity
            key={item.name}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <FontAwesome name={item.icon} size={24} color={tint} />
            <Text style={{
              fontSize: 12,
              fontWeight: '500',
              color: tint,
              marginTop: 4,
            }}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ProfileScreen = ({ navigation }) => {
  const { user } = useUser();
  const { theme } = useTheme();
  const { stats: userData } = useUserData();
  
  // Use unified stats as single source of truth
  const { 
    xp,
    diamonds,
    hearts,
    level,
    streak,
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

  const { 
    getTotalXP, 
    getCurrentLevel, 
    getCurrentStreak, 
    getLevelProgressPercentage,
    getStatistics 
  } = useProgress();

  // State for user stats (fallback)
  const [userStats, setUserStats] = useState({
    hearts: 5,
    diamonds: 0,
    level: 1,
    streak: 0,
    xp: 0,
    completedLessons: 0,
    totalLessons: 0,
    learningHours: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!statsLoading) {
      setLoading(false);
    }
  }, [statsLoading]);

  const lastRefreshRef = useRef(0);
  const REFRESH_THROTTLE = 60000; // 60s

  // Force refresh stats when screen comes into focus (throttled)
  useFocusEffect(
    useCallback(() => {
      if (!isStatsLoaded) return;
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_THROTTLE) {
        return;
      }
      lastRefreshRef.current = now;
      forceRefresh().catch(err => console.warn('Profile forceRefresh error:', err?.message));
    }, [isStatsLoaded, forceRefresh])
  );

  // Fetch user stats from backend (fallback)
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        if (isStatsLoaded) {
          setLoading(false);
          return;
        }
        setLoading(true);
        const response = await userService.getUserStats();
        
        if (response.success) {
          setUserStats({
            hearts: response.data.hearts || 5,
            diamonds: response.data.diamonds || 0,
            level: response.data.level || 1,
            streak: response.data.streak || 0,
            xp: response.data.xp || 0,
            completedLessons: response.data.completedLessons || 0,
            totalLessons: response.data.totalLessons || 0,
            learningHours: response.data.learningHours || 0
          });
        }
      } catch (error) {
        console.warn('Error fetching user stats:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [isStatsLoaded]);

  // Get progress data from context (fallback)
  const totalXPFallback = getTotalXP();
  const currentLevelFallback = getCurrentLevel();
  const currentStreakFallback = getCurrentStreak();
  const levelProgressFallback = getLevelProgressPercentage();
  const statistics = getStatistics();

  const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const rawXP = safeNumber(xp, safeNumber(userStats.xp, totalXPFallback || 0));
  const rawLevel = safeNumber(level, safeNumber(userStats.level, currentLevelFallback || 1));
  const displayHearts = safeNumber(hearts, safeNumber(userStats.hearts, 5));
  const displayDiamonds = safeNumber(diamonds, safeNumber(userStats.diamonds, 0));
  const displayStreak = safeNumber(streak, safeNumber(userStats.streak, 0));

  const learningHours = Number.isFinite(totalTimeSpent)
    ? Math.max(0, Math.round(totalTimeSpent / 3600))
    : safeNumber(userStats.learningHours, 0);

  const displayCompletedLessons = safeNumber(userStats.completedLessons, statistics.completedLessons || 0);
  const displayTotalLessons = safeNumber(userStats.totalLessons, statistics.totalLessons || 0);

  const xpSnapshot = useMemo(
    () => getXpProgress(rawXP, rawLevel),
    [rawXP, rawLevel]
  );
  const displayLevel = xpSnapshot.level;
  const displayXP = rawXP;
  const xpRequirementCurrentLevel = xpSnapshot.requirement;
  const xpDisplayWithinLevel = xpSnapshot.withinClamped;
  const xpToNextLevel = xpSnapshot.toNext;
  const progressRatio = xpSnapshot.ratio;
  const progressPercent = xpSnapshot.percent;
  const progressWidthPercent = `${Math.min(100, Math.max(0, progressPercent))}%`;
  const xpStatusLabel = `${xpDisplayWithinLevel.toLocaleString('th-TH')} / ${xpRequirementCurrentLevel.toLocaleString('th-TH')} XP`;
  const progressLabelColor = progressRatio > 0.55 ? '#fff' : (theme?.text || '#1b1b1b');

  const nextLevelRewards = useMemo(
    () => getLevelRewards(displayLevel + 1),
    [displayLevel]
  );

  const profileStats = useMemo(() => [
    {
      key: 'hearts',
      label: 'หัวใจ',
      value: displayHearts,
      subLabel: 'พร้อมใช้งาน',
      animation: require('../assets/animations/Heart.json'),
      tint: '#FF4F64',
    },
    {
      key: 'diamonds',
      label: 'เพชร',
      value: displayDiamonds,
      subLabel: 'สะสมทั้งหมด',
      animation: require('../assets/animations/Diamond.json'),
      tint: '#2196F3',
    },
    {
      key: 'streak',
      label: 'Streak',
      value: displayStreak,
      subLabel: 'วันต่อเนื่อง',
      animation: require('../assets/animations/Streak-Fire1.json'),
      tint: '#FF8C00',
    },
    {
      key: 'xp',
      label: 'XP',
      value: xpDisplayWithinLevel,
      subLabel: `ทั้งหมด ${displayXP.toLocaleString('th-TH')} XP`,
      animation: require('../assets/animations/Star.json'),
      tint: '#34A853',
    },
  ], [displayHearts, displayDiamonds, displayStreak, xpDisplayWithinLevel, displayXP]);

  const lastPlayedLabel = lastPlayed
    ? new Date(lastPlayed).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    : '-';

  const heroHighlights = useMemo(() => [
    {
      label: 'ระดับ',
      value: `Lv.${displayLevel}`,
      helper: `${progressPercent}% ของเลเวลนี้ (${xpStatusLabel})`,
      animation: require('../assets/animations/Star.json'),
      background: '#FFE9D6',
    },
    {
      label: 'หัวใจ',
      value: displayHearts,
      helper: `ของขวัญ Lv.${displayLevel + 1}: ❤️ +${nextLevelRewards.hearts.toLocaleString('th-TH')}`,
      animation: require('../assets/animations/Heart.json'),
      background: '#FFE8EC',
    },
    {
      label: 'Streak',
      value: `${displayStreak} วัน`,
      helper: `เล่นล่าสุด ${lastPlayedLabel}`,
      animation: require('../assets/animations/Streak-Fire1.json'),
      background: '#FFF4D6',
    },
  ], [displayLevel, displayHearts, displayDiamonds, displayStreak, progressPercent, lastPlayedLabel, nextLevelRewards]);

  const summaryMetrics = useMemo(() => [
    {
      key: 'lessons',
      icon: 'book-open-variant',
      label: 'บทเรียนที่เสร็จ',
      value: `${displayCompletedLessons}/${displayTotalLessons}`,
      tint: '#7C4DFF',
    },
    {
      key: 'hours',
      icon: 'timer-sand',
      label: 'เวลาเรียน',
      value: `${learningHours} ชั่วโมง`,
      tint: '#118AB2',
    },
    {
      key: 'accuracy',
      icon: 'target',
      label: 'ความแม่นยำเฉลี่ย',
      value: `${safeNumber(averageAccuracy, 0)}%`,
      tint: '#06D6A0',
    },
    {
      key: 'sessions',
      icon: 'gamepad-variant',
      label: 'จำนวนครั้งที่เล่น',
      value: safeNumber(totalSessions, statistics.totalGames || 0),
      tint: '#EF476F',
    },
  ], [displayCompletedLessons, displayTotalLessons, learningHours, averageAccuracy, totalSessions, statistics.totalGames]);

  const StatCard = ({ label, value, subLabel, animation, tint = '#FF8C00' }) => {
    const displayValue = typeof value === 'number'
      ? value.toLocaleString('th-TH')
      : value;

    return (
      <LinearGradient
        colors={[`${tint}26`, `${tint}10`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.statCard, { shadowColor: `${tint}40` }]}
      >
        <View style={styles.statAnimationWrap}>
          <LottieView source={animation} autoPlay loop style={styles.statAnimation} />
        </View>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.statNumber, { color: theme.text }]}>{displayValue}</Text>
        {subLabel ? (
          <Text style={[styles.statSubLabel, { color: theme.textSecondary }]}>{subLabel}</Text>
        ) : null}
      </LinearGradient>
    );
  };

  if (loading || statsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/animations/LoadingCat.json')}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            กำลังโหลดข้อมูล...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={['#FFE7CE', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    user?.avatar
                      ? { uri: user.avatar }
                      : require("../assets/images/catangry-Photoroom.png")
                  }
                  style={[styles.avatar, { borderColor: theme.primary }]}
                />
                <TouchableOpacity
                  onPress={() => navigation.navigate("EditProfile")}
                  style={[styles.avatarEdit, { backgroundColor: theme.primary }]}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color={theme.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.heroInfo}>
                <Text style={[styles.heroName, { color: theme.text }]}>
                  {user?.username || user?.name || "ผู้เรียน"}
                </Text>
                <Text style={[styles.heroEmail, { color: theme.textSecondary }]}>
                  {user?.email || "user@example.com"}
                </Text>
                {user?.petName ? (
                  <Text style={[styles.heroPet, { color: theme.orangeAccent }]}>
                    🐱 {user.petName}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: '#FFFFFF40' }]}
                onPress={() => navigation.navigate("Settings")}
              >
                <MaterialCommunityIcons name="cog" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.heroHighlightsRow}>
              {heroHighlights.map((item) => (
                <View key={item.label} style={[styles.heroHighlightCard, { backgroundColor: item.background }]}>
                  <LottieView source={item.animation} autoPlay loop style={styles.heroHighlightAnimation} />
                  <Text style={[styles.heroHighlightLabel, { color: theme.textSecondary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.heroHighlightValue, { color: theme.text }]}>
                    {item.value}
                  </Text>
                  <Text style={[styles.heroHighlightMeta, { color: theme.textSecondary }]}>
                    {item.helper}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>สรุปสถานะ</Text>
            <TouchableOpacity onPress={forceRefresh} style={styles.sectionAction}>
              <MaterialCommunityIcons name="refresh" size={16} color={theme.primary} />
              <Text style={[styles.sectionActionText, { color: theme.primary }]}>รีเฟรช</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {profileStats.map((stat) => (
              <StatCard
                key={stat.key}
                label={stat.label}
                value={stat.value}
                subLabel={stat.subLabel}
                animation={stat.animation}
                tint={stat.tint}
              />
            ))}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>ความคืบหน้า</Text>
            <Text style={[styles.sectionSubTitle, { color: theme.textSecondary }]}>
              XP ในเลเวลนี้ {xpDisplayWithinLevel.toLocaleString('th-TH')} / {xpRequirementCurrentLevel.toLocaleString('th-TH')} • ต้องการเพิ่ม {xpToNextLevel.toLocaleString('th-TH')} XP เพื่อเลเวลถัดไป
            </Text>
          </View>

          <View style={styles.levelProgressRow}>
            <View style={[styles.levelChip, { backgroundColor: theme.primary }]}>
              <MaterialCommunityIcons name="star" size={18} color="#fff" />
              <Text style={styles.levelChipText}>Lv.{displayLevel}</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.lightGray || '#ececec' }]}> 
              <LinearGradient
                colors={['#34A853', '#56C766']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: progressWidthPercent }]}
              />
              <Text style={[styles.progressBarLabel, { color: progressLabelColor }]}>
                {xpStatusLabel}
              </Text>
            </View>
            <View style={[styles.diamondChip, { backgroundColor: '#E4F2FF' }]}>
              <MaterialCommunityIcons name="diamond" size={18} color="#2196F3" />
              <Text style={[styles.diamondText, { color: '#2196F3' }]}>
                +{nextLevelRewards.diamonds.toLocaleString('th-TH')}
              </Text>
            </View>
          </View>
          <Text style={[styles.progressSubtitle, { color: theme.textSecondary }]}>
            เหลือ {xpToNextLevel.toLocaleString('th-TH')} XP เพื่อเลเวล {displayLevel + 1}
          </Text>
          <Text style={[styles.progressRewardText, { color: theme.text }]}>
            ของขวัญเลเวลถัดไป: ❤️ +{nextLevelRewards.hearts.toLocaleString('th-TH')} • 💎 +{nextLevelRewards.diamonds.toLocaleString('th-TH')}
          </Text>

          <View style={styles.progressMetaRow}>
            <View style={styles.progressMetaItem}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Streak</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>{displayStreak} วัน</Text>
            </View>
            <View style={styles.progressMetaItem}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>เล่นล่าสุด</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {lastPlayed ? new Date(lastPlayed).toLocaleDateString('th-TH') : '-'}
              </Text>
            </View>
            <View style={styles.progressMetaItem}>
              <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>เวลาเรียน</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>{learningHours} ชม.</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>สถิติหลัก</Text>
          <View style={styles.summaryGrid}>
            {summaryMetrics.map((item) => (
              <View key={item.key} style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
                <View style={[styles.summaryIconBadge, { backgroundColor: item.tint + '20' }]}>
                  <MaterialCommunityIcons name={item.icon} size={22} color={item.tint} />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {achievements?.length > 0 && (
          <View style={[styles.sectionCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>ความสำเร็จล่าสุด</Text>
            {achievements.slice(0, 4).map((achievement, index) => (
              <View key={index} style={styles.achievementRow}>
                <MaterialCommunityIcons
                  name={achievement.icon || "trophy"}
                  size={22}
                  color={theme.orangeAccent}
                />
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, { color: theme.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: theme.textSecondary }]}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlockedAt && (
                  <Text style={[styles.achievementDate, { color: theme.textSecondary }]}>
                    {new Date(achievement.unlockedAt).toLocaleDateString("th-TH")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>การจัดการบัญชี</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate("Settings")}
            >
              <MaterialCommunityIcons name="account-cog" size={20} color={theme.white} />
              <Text style={[styles.actionButtonText, { color: theme.white }]}>ตั้งค่าโปรไฟล์</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.primary, borderWidth: 1 }]}
              onPress={() => navigation.navigate("Progress")}
            >
              <MaterialCommunityIcons name="chart-box" size={20} color={theme.primary} />
              <Text style={[styles.actionButtonText, { color: theme.primary }]}>ดูรายละเอียดสถิติ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CustomTabBar activeTab="Profile" navigation={navigation} theme={theme} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAnimation: {
    width: 120,
    height: 120,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  heroGradient: {
    borderRadius: 24,
    padding: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  heroCard: {
    borderRadius: 23,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
    marginLeft: 16,
  },
  heroName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  heroEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  heroPet: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    marginLeft: 12,
  },
  heroHighlightsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  heroHighlightCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heroHighlightAnimation: {
    width: 48,
    height: 48,
    marginBottom: 6,
  },
  heroHighlightLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroHighlightValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroHighlightMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statAnimationWrap: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statAnimation: {
    width: 46,
    height: 46,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statSubLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    flex: 1,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  levelProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  levelChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  diamondChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  diamondText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  progressRewardText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  progressBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12,
  },
  progressMetaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  achievementContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  achievementDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  achievementDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProfileScreen;
