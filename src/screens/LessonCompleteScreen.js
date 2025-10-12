import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView
} from 'react-native';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProgress } from '../contexts/ProgressContext';
import { getLevelRewards, getXpProgress } from '../utils/leveling';

const { width, height } = Dimensions.get('window');

const LessonCompleteScreen = ({ navigation, route }) => {
  const { 
    score = 0, 
    totalQuestions = 0, 
    timeSpent = 0, 
    accuracy = 0,
    xpGained = 0,
    diamondsGained = 0
  } = route.params || {};
  const { userProgress, applyDelta } = useProgress();
  
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState({
    xp: 0,
    diamonds: 0,
    hearts: 0,
    streak: 0
  });
  const [newLevel, setNewLevel] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [levelSummary, setLevelSummary] = useState(null);
  const [nextRewards, setNextRewards] = useState(null);
  
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    // Calculate comprehensive rewards
    const calculatedRewards = calculateRewards();
    setRewards(calculatedRewards);
    
    // Check for achievements
    const newAchievements = checkAchievements();
    setAchievements(newAchievements);
    
    // Summarise level progress with unified leveling rules
    const currentLevel = userProgress?.level || 1;
    const currentXp = userProgress?.xp || 0;
    const beforeProgress = getXpProgress(currentXp, currentLevel);
    const newTotalXp = currentXp + calculatedRewards.xp;
    const afterProgress = getXpProgress(newTotalXp, beforeProgress.level);

    setLevelSummary({
      before: beforeProgress,
      after: afterProgress,
      totalXp: newTotalXp,
      xpGained: calculatedRewards.xp
    });
    setNextRewards(getLevelRewards(afterProgress.level + 1));

    if (afterProgress.level > beforeProgress.level) {
      setNewLevel(afterProgress.level);
    }

    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 45,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowRewards(true);
    });
  }, []);

  const calculateRewards = () => {
    const baseXp = xpGained || score;
    const baseDiamonds = diamondsGained || Math.max(2, Math.floor(score / 50));
    
    // Bonus multipliers based on performance
    let xpMultiplier = 1;
    let diamondMultiplier = 1;
    let heartsBonus = 0;
    let streakBonus = 0;
    
    // Perfect score bonus (100% accuracy)
    if (accuracy >= 100) {
      xpMultiplier += 0.5;
      diamondMultiplier += 0.5;
      heartsBonus += 2;
    }
    
    // High accuracy bonus (90%+)
    if (accuracy >= 90) {
      xpMultiplier += 0.3;
      diamondMultiplier += 0.3;
      heartsBonus += 1;
    }
    
    // Speed bonus (completed quickly)
    const avgTimePerQuestion = timeSpent / totalQuestions;
    if (avgTimePerQuestion < 10) { // Less than 10 seconds per question
      xpMultiplier += 0.2;
      diamondMultiplier += 0.2;
    }
    
    // Streak bonus (if user has been playing consistently)
    const currentStreak = userProgress?.streak || 0;
    if (currentStreak >= 3) {
      streakBonus = Math.floor(currentStreak / 3);
      xpMultiplier += streakBonus * 0.1;
    }
    
    return {
      xp: Math.floor(baseXp * xpMultiplier),
      diamonds: Math.floor(baseDiamonds * diamondMultiplier),
      hearts: heartsBonus,
      streak: streakBonus
    };
  };

  const checkAchievements = () => {
    const achievements = [];
    
    // Perfect Score Achievement
    if (accuracy >= 100) {
      achievements.push({
        id: 'perfect_score',
        title: 'คะแนนเต็ม! 🎯',
        description: 'ตอบถูกทุกข้อ',
        icon: '🎯',
        color: '#FFD700'
      });
    }
    
    // Speed Demon Achievement
    const avgTimePerQuestion = timeSpent / totalQuestions;
    if (avgTimePerQuestion < 5) {
      achievements.push({
        id: 'speed_demon',
        title: 'เร็วมาก! ⚡',
        description: 'ตอบเร็วมาก',
        icon: '⚡',
        color: '#FF6B6B'
      });
    }
    
    // Streak Master Achievement
    const currentStreak = userProgress?.streak || 0;
    if (currentStreak >= 7) {
      achievements.push({
        id: 'streak_master',
        title: 'ต่อเนื่อง! 🔥',
        description: `เล่นต่อเนื่อง ${currentStreak} วัน`,
        icon: '🔥',
        color: '#FF4500'
      });
    }
    
    // First Lesson Achievement
    if (totalQuestions > 0 && score > 0) {
      achievements.push({
        id: 'first_lesson',
        title: 'เริ่มต้นดี! 🌟',
        description: 'ผ่านด่านแรกแล้ว',
        icon: '🌟',
        color: '#4ECDC4'
      });
    }
    
    return achievements;
  };

  const handleContinue = async () => {
    try {
      await applyDelta({
        xp: rewards.xp,
        diamonds: rewards.diamonds,
        hearts: rewards.hearts,
        finishedLesson: true,
        timeSpentSec: timeSpent
      });
    } catch (error) {
      console.warn('⚠️ Failed to persist rewards:', error?.message || error);
    }

    navigation.navigate('Home');
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  const calculatedAccuracy = totalQuestions > 0 ? Math.round((score / (totalQuestions * 10)) * 100) : 0;
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const RewardChip = ({ icon, label, value, colors }) => (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rewardChip}>
      <View style={styles.rewardChipIcon}>{icon}</View>
      <View style={styles.rewardChipTextGroup}>
        <Text style={styles.rewardChipLabel}>{label}</Text>
        <Text style={styles.rewardChipValue}>{value}</Text>
      </View>
    </LinearGradient>
  );

  const StatBadge = ({ icon, label, value }) => (
    <View style={styles.statBadge}>
      <View style={styles.statBadgeIcon}>{icon}</View>
      <Text style={styles.statBadgeValue}>{value}</Text>
      <Text style={styles.statBadgeLabel}>{label}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={['#FFB680', '#FFEDDA']}
      style={styles.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.headerSection}>
              <LottieView
                source={require('../assets/animations/celebration.json')}
                autoPlay
                loop={false}
                style={styles.celebrationAnimation}
              />
              <Text style={styles.title}>ยอดเยี่ยมมาก! 🎉</Text>
              <Text style={styles.subtitle}>
                คุณทำคะแนนได้ {score} จาก {totalQuestions * 10} คะแนน
              </Text>
            </View>

            <View style={styles.statsRow}>
              <StatBadge
                icon={<FontAwesome6 name="bullseye" size={18} color="#FF7A00" />}
                label="ความแม่นยำ"
                value={`${calculatedAccuracy}%`}
              />
              <StatBadge
                icon={<FontAwesome6 name="clock" size={18} color="#4ECDC4" />}
                label="เวลาที่ใช้"
                value={formatTime(timeSpent)}
              />
              <StatBadge
                icon={<FontAwesome6 name="list-check" size={18} color="#45B7D1" />}
                label="จำนวนข้อ"
                value={totalQuestions}
              />
            </View>

            {showRewards && (
              <View style={styles.rewardsBlock}>
                <Text style={styles.sectionTitle}>ของรางวัล</Text>
                <View style={styles.rewardRow}>
                  <RewardChip
                    icon={<LottieView source={require('../assets/animations/Star.json')} autoPlay loop style={styles.rewardAnimation} />}
                    label="ประสบการณ์ (XP)"
                    value={`+${rewards.xp}`}
                    colors={['#FFF7C2', '#FFE082']}
                  />
                  <RewardChip
                    icon={<LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={styles.rewardAnimation} />}
                    label="เพชร"
                    value={`+${rewards.diamonds}`}
                    colors={['#E0F4FF', '#B0E5FF']}
                  />
                </View>
                {(rewards.hearts > 0 || rewards.streak > 0) && (
                  <View style={styles.rewardRow}>
                    {rewards.hearts > 0 && (
                      <RewardChip
                        icon={<FontAwesome name="heart" size={20} color="#FF4F64" />}
                        label="หัวใจ"
                        value={`+${rewards.hearts}`}
                        colors={['#FFE1E8', '#FFB2C7']}
                      />
                    )}
                    {rewards.streak > 0 && (
                      <RewardChip
                        icon={<FontAwesome name="fire" size={20} color="#FF6B3D" />}
                        label="โบนัสต่อเนื่อง"
                        value={`x${rewards.streak}`}
                        colors={['#FFE8D6', '#FFC9A3']}
                      />
                    )}
                  </View>
                )}
              </View>
            )}

            {newLevel && (
              <View style={styles.levelUpCard}>
                <LottieView
                  source={require('../assets/animations/Trophy.json')}
                  autoPlay
                  loop={false}
                  style={styles.trophyAnimation}
                />
                <Text style={styles.levelUpTitle}>ขึ้นสู่เลเวล {newLevel}</Text>
                <Text style={styles.levelUpSubtitle}>เก็บ XP ต่อเนื่องเพื่อปลดล็อกของรางวัลพิเศษ!</Text>
              </View>
            )}

            {levelSummary && (
              <View style={styles.levelSummaryCard}>
                <View style={styles.levelSummaryHeader}>
                  <View style={styles.levelBadgeLarge}>
                    <FontAwesome6 name="trophy" size={16} color="#FF8C00" />
                    <Text style={styles.levelBadgeLargeText}>Lv.{levelSummary.after.level}</Text>
                  </View>
                  <View style={styles.levelSummaryStats}>
                    <Text style={styles.levelSummaryXP}>{levelSummary.totalXp.toLocaleString('th-TH')} XP</Text>
                    <Text style={styles.levelSummaryLabel}>XP สะสมทั้งหมด</Text>
                  </View>
                </View>

                <View style={styles.levelProgressTrack}>
                  <View
                    style={[
                      styles.levelProgressFill,
                      { width: `${levelSummary.after.percent}%` }
                    ]}
                  />
                </View>

                <View style={styles.levelProgressMeta}>
                  <Text style={styles.levelProgressStat}>
                    {levelSummary.after.withinClamped.toLocaleString('th-TH')} /{' '}
                    {levelSummary.after.requirement.toLocaleString('th-TH')} XP
                  </Text>
                  <Text style={styles.levelProgressHint}>
                    เหลือ {levelSummary.after.toNext.toLocaleString('th-TH')} XP ถึง Lv.
                    {levelSummary.after.level + 1}
                  </Text>
                </View>

                {nextRewards && (
                  <View style={styles.nextRewardsRow}>
                    <Text style={styles.nextRewardsLabel}>ของขวัญเลเวลถัดไป</Text>
                    <View style={styles.nextRewardsChips}>
                      <View style={[styles.nextRewardChip, styles.nextRewardHeart]}>
                        <FontAwesome name="heart" size={14} color="#FF4F64" />
                        <Text style={styles.nextRewardText}>+{nextRewards.hearts}</Text>
                      </View>
                      <View style={[styles.nextRewardChip, styles.nextRewardDiamond]}>
                        <FontAwesome name="diamond" size={14} color="#2196F3" />
                        <Text style={styles.nextRewardText}>+{nextRewards.diamonds}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {achievements.length > 0 && (
              <View style={styles.achievementBlock}>
                <Text style={styles.sectionTitle}>ความสำเร็จรอบนี้</Text>
                {achievements.map((achievement) => (
                  <View
                    key={achievement.id}
                    style={[
                      styles.achievementPill,
                      { backgroundColor: `${achievement.color}18` },
                    ]}
                  >
                    <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                    <View style={styles.achievementTextGroup}>
                      <Text style={[styles.achievementTitle, { color: achievement.color }]}>
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementSubtitle}>{achievement.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry} activeOpacity={0.85}>
                <FontAwesome6 name="rotate-right" size={18} color="#FF7A00" />
                <Text style={styles.secondaryButtonText}>ลองอีกครั้ง</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.9}>
                <LinearGradient
                  colors={['#FF8C00', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <FontAwesome6 name="arrow-right" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>กลับหน้าหลัก</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 14,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrationAnimation: {
    width: '100%',
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1E1E',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
    color: '#5C3B16',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 25,
  },
  statBadge: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFF6EB',
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: 'rgba(255,140,0,0.18)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  statBadgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statBadgeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  statBadgeLabel: {
    fontSize: 13,
    color: '#6B4A29',
    marginTop: 4,
  },
  rewardsBlock: {
    width: '100%',
    backgroundColor: '#FFF8EE',
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C3B16',
    textAlign: 'center',
    marginBottom: 14,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rewardChip: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  rewardChipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rewardChipTextGroup: {
    flex: 1,
  },
  rewardChipLabel: {
    fontSize: 13,
    color: '#5C3B16',
    marginBottom: 4,
  },
  rewardChipValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  rewardAnimation: {
    width: 30,
    height: 30,
  },
  levelUpCard: {
    width: '100%',
    backgroundColor: '#FFF6D8',
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyAnimation: {
    width: 80,
    height: 80,
    marginBottom: 4,
  },
  levelUpTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 6,
  },
  levelUpSubtitle: {
    fontSize: 14,
    color: '#7B551F',
    textAlign: 'center',
  },
  levelSummaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 24,
    shadowColor: 'rgba(0,0,0,0.07)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  levelSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  levelBadgeLarge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadgeLargeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
  },
  levelSummaryStats: {
    marginLeft: 16,
  },
  levelSummaryXP: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E50',
  },
  levelSummaryLabel: {
    fontSize: 13,
    color: '#7B8A97',
    marginTop: 4,
  },
  levelProgressTrack: {
    height: 14,
    borderRadius: 10,
    backgroundColor: '#F1F4F9',
    overflow: 'hidden',
    marginBottom: 14,
  },
  levelProgressFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#FF8C00',
  },
  levelProgressMeta: {
    marginBottom: 14,
  },
  levelProgressStat: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  levelProgressHint: {
    fontSize: 13,
    color: '#8C99A5',
    marginTop: 4,
  },
  nextRewardsRow: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    paddingTop: 16,
  },
  nextRewardsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D3D3D',
    marginBottom: 10,
  },
  nextRewardsChips: {
    flexDirection: 'row',
    gap: 12,
  },
  nextRewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  nextRewardHeart: {
    backgroundColor: '#FFE6EC',
  },
  nextRewardDiamond: {
    backgroundColor: '#E4F1FF',
  },
  nextRewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D3D3D',
  },
  achievementBlock: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  achievementPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: 'row',
    marginBottom: 10,
  },
  achievementEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  achievementTextGroup: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  achievementSubtitle: {
    fontSize: 13,
    color: '#6B4A29',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 18,
    backgroundColor: '#FFF5E6',
    borderWidth: 1,
    borderColor: '#FFD4A3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FF7A00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LessonCompleteScreen;
