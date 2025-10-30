import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { getLevelRewards, getXpProgress } from '../utils/leveling';
import FireStreakAlert from '../components/FireStreakAlert';

const { width, height } = Dimensions.get('window');

const LessonCompleteScreen = ({ navigation, route }) => {
  const {
    lessonId,
    stageTitle = 'เล่นเสร็จสิ้น',
    score = 0,
    totalQuestions = 0,
    correctAnswers,
    wrongAnswers,
    timeSpent = 0,
    accuracyPercent,
    accuracyRatio,
    accuracy,
    xpGained = 0,
    diamondsGained = 0,
    heartsRemaining,
    streak = 0,
    maxStreak = 0,
    isUnlocked = false,
    nextStageUnlocked = false,
    nextStageMeta = null,
    stageSelectRoute = 'LevelStage1',
    replayRoute = 'ConsonantStage1Game',
    replayParams = {},
    questionTypeCounts = {},
  } = route.params || {};
  
  const { userProgress } = useProgress();
  const { xp, diamonds, hearts, updateStats } = useUnifiedStats();
  
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
  const [showFireStreakAlert, setShowFireStreakAlert] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const initialStatsRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  // คำนวณคะแนนที่ถูก
  const resolvedCorrectAnswers = useMemo(() => {
    if (Number.isFinite(correctAnswers)) {
      return correctAnswers;
    }
    if (Number.isFinite(score)) {
      return score;
    }
    return 0;
  }, [correctAnswers, score]);

  // คำนวณคะแนนที่ผิด
  const resolvedWrongAnswers = useMemo(() => {
    if (Number.isFinite(wrongAnswers)) {
      return wrongAnswers;
    }
    const total = totalQuestions || 0;
    return Math.max(0, total - resolvedCorrectAnswers);
  }, [wrongAnswers, totalQuestions, resolvedCorrectAnswers]);

  // คำนวณความแม่นยำเป็นเปอร์เซ็นต์
  const normalizedAccuracyPercent = useMemo(() => {
    if (Number.isFinite(accuracyPercent)) {
      const val = Math.round(accuracyPercent);
      return Math.max(0, Math.min(100, val));
    }
    if (Number.isFinite(accuracy)) {
      const val = accuracy <= 1 ? Math.round(accuracy * 100) : Math.round(accuracy);
      return Math.max(0, Math.min(100, val));
    }
    if (totalQuestions > 0) {
      const val = Math.round((resolvedCorrectAnswers / totalQuestions) * 100);
      return Math.max(0, Math.min(100, val));
    }
    return 0;
  }, [accuracyPercent, accuracy, resolvedCorrectAnswers, totalQuestions]);

  // คำนวณความแม่นยำเป็นอัตราส่วน
  const normalizedAccuracyRatio = useMemo(() => {
    if (Number.isFinite(accuracyRatio)) {
      return Math.max(0, Math.min(1, accuracyRatio));
    }
    const ratio = normalizedAccuracyPercent / 100;
    return Math.max(0, Math.min(1, ratio));
  }, [accuracyRatio, normalizedAccuracyPercent]);

  useEffect(() => {
    if (!initialStatsRef.current && Number.isFinite(userProgress?.xp)) {
      initialStatsRef.current = {
        xp: userProgress.xp || 0,
        level: userProgress.level || 1
      };
    }
  }, [userProgress?.xp, userProgress?.level]);

  // Animate entrance
  useEffect(() => {
    if (hasAnimatedRef.current) return;
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
      hasAnimatedRef.current = true;
      setShowRewards(true);
    });
  }, [fadeAnim, scaleAnim]);

  // Show Fire Streak Alert for milestone streaks
  useEffect(() => {
    if (showRewards && maxStreak > 0) {
      const milestones = [5, 10, 20, 30, 50, 100];
      if (milestones.includes(maxStreak)) {
        // Delay alert to show after rewards animation
        const timer = setTimeout(() => {
          setShowFireStreakAlert(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [showRewards, maxStreak]);

  const calculatedRewards = useMemo(
    () => calculateRewards(),
    [xpGained, diamondsGained, streak, maxStreak, userProgress?.streak]
  );

  const derivedAchievements = useMemo(
    () => checkAchievements(),
    [normalizedAccuracyPercent, timeSpent, totalQuestions, userProgress?.streak, streak, maxStreak]
  );

  useEffect(() => {
    if (rewards !== calculatedRewards) {
      setRewards(calculatedRewards);
    }
    if (achievements !== derivedAchievements) {
      setAchievements(derivedAchievements);
    }

    const baseline = initialStatsRef.current || {
      xp: Number.isFinite(userProgress?.xp) ? userProgress.xp : 0,
      level: Number.isFinite(userProgress?.level) ? userProgress.level : 1
    };

    const beforeProgress = getXpProgress(baseline.xp, baseline.level);
    const projectedXp = baseline.xp + calculatedRewards.xp;
    const resolvedXp =
      Number.isFinite(userProgress?.xp) && userProgress.xp >= baseline.xp
        ? userProgress.xp
        : projectedXp;
    const afterProgress = getXpProgress(resolvedXp, beforeProgress.level);

    setLevelSummary({
      before: beforeProgress,
      after: afterProgress,
      totalXp: resolvedXp,
      xpGained: calculatedRewards.xp
    });
    setNextRewards(getLevelRewards(afterProgress.level + 1));

    setNewLevel(afterProgress.level > beforeProgress.level ? afterProgress.level : null);
  }, [
    calculatedRewards,
    derivedAchievements,
    rewards,
    achievements,
    userProgress?.xp,
    userProgress?.level
  ]);

  // อัพเดท UnifiedStats เมื่อได้รางวัล
  useEffect(() => {
    if (!updateStats || rewards.xp === 0 && rewards.diamonds === 0) return;
    
    const updateUnifiedStats = async () => {
      try {
        // บวกกับของเดิม
        const newXp = (Number.isFinite(xp) ? xp : 0) + rewards.xp;
        const newDiamonds = (Number.isFinite(diamonds) ? diamonds : 0) + rewards.diamonds;
        
        await updateStats({
          xp: Math.max(0, newXp),
          diamonds: Math.max(0, newDiamonds),
        });
        
        console.log('✅ Updated UnifiedStats:', { newXp, newDiamonds });
      } catch (error) {
        console.warn('❌ Failed to update UnifiedStats:', error?.message);
      }
    };
    
    updateUnifiedStats();
  }, [rewards.xp, rewards.diamonds, updateStats, xp, diamonds]);

  function calculateRewards() {
    const xpReward = Number.isFinite(xpGained) ? Math.max(0, Math.round(xpGained)) : 0;
    const diamondReward = Number.isFinite(diamondsGained) ? Math.max(0, Math.round(diamondsGained)) : 0;
    const resolvedStreak = Math.max(
      0,
      Number.isFinite(maxStreak) ? Math.round(maxStreak) : 0,
      Number.isFinite(streak) ? Math.round(streak) : 0
    );

    return {
      xp: xpReward,
      diamonds: diamondReward,
      hearts: 0,
      streak: resolvedStreak,
    };
  }

  function checkAchievements() {
    const achievements = [];
    
    // Perfect Score Achievement
    if (normalizedAccuracyPercent >= 100) {
      achievements.push({
        id: 'perfect_score',
        title: 'คะแนนเต็ม! 🎯',
        description: 'ตอบถูกทุกข้อ',
        icon: '🎯',
        color: '#FFD700'
      });
    }
    
    // Speed Demon Achievement
    const avgTimePerQuestion = totalQuestions > 0 ? timeSpent / totalQuestions : Infinity;
    if (avgTimePerQuestion < 5 && totalQuestions > 0) {
      achievements.push({
        id: 'speed_demon',
        title: 'เร็วมาก! ⚡',
        description: 'ตอบเร็วมาก',
        icon: '⚡',
        color: '#FF6B6B'
      });
    }
    
    // Streak Master Achievement
    const currentStreak = Math.max(
      Number.isFinite(userProgress?.streak) ? userProgress.streak : 0,
      Number.isFinite(streak) ? streak : 0,
      Number.isFinite(maxStreak) ? maxStreak : 0
    );
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
    if (totalQuestions > 0 && resolvedCorrectAnswers > 0) {
      achievements.push({
        id: 'first_lesson',
        title: 'เริ่มต้นดี! 🌟',
        description: 'ผ่านด่านแรกแล้ว',
        icon: '🌟',
        color: '#4ECDC4'
      });
    }

    // High Accuracy Achievement
    if (normalizedAccuracyPercent >= 90 && totalQuestions > 0) {
      achievements.push({
        id: 'high_accuracy',
        title: 'ความแม่นยำสูง 🎪',
        description: 'ตอบถูกมากกว่า 90%',
        icon: '🎪',
        color: '#6B5FFF'
      });
    }
    
    return achievements;
  }

  const handleStageSelect = () => {
    navigation.navigate(stageSelectRoute);
  };

  const handleNextStage = () => {
    if (nextStageMeta?.route) {
      if (nextStageUnlocked) {
        navigation.replace(nextStageMeta.route, nextStageMeta.params || {});
        return;
      }
      // If locked, take user to stage select to review and replay previous stage
      navigation.navigate(stageSelectRoute);
      return;
    }
    handleStageSelect();
  };

  const handleReplay = () => {
    if (replayRoute) {
      navigation.replace(replayRoute, replayParams || {});
      return;
    }
    navigation.goBack();
  };

  const calculatedAccuracy = Math.max(0, Math.min(100, normalizedAccuracyPercent));
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasNextStage = Boolean(nextStageMeta?.route);
  const canGoNextStage = hasNextStage && nextStageUnlocked;
  // Keep visual disabled style but allow pressing to guide user to stage select
  const primaryButtonDisabled = false;
  const primaryButtonLabel = hasNextStage
    ? canGoNextStage
      ? 'ไปด่านถัดไป'
      : 'ปลดล็อกเพื่อเล่นด่านถัดไป'
    : 'Back to stage selection';
  const primaryButtonColors = primaryButtonDisabled
    ? ['#D4D4D4', '#BDBDBD']
    : ['#FF8C00', '#FF6B35'];

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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <LottieView
                source={require('../assets/animations/celebration.json')}
                autoPlay
                loop={false}
                style={styles.celebrationAnimation}
              />
              {stageTitle ? (
                <Text style={styles.lessonTitle}>{stageTitle}</Text>
              ) : null}
              <Text style={styles.title}>Great job! 🎉</Text>
              <Text style={styles.subtitle}>
                You answered {resolvedCorrectAnswers} out of {totalQuestions} correctly
              </Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatBadge
                icon={<FontAwesome6 name="bullseye" size={18} color="#FF7A00" />}
                label="Accuracy"
                value={`${calculatedAccuracy}%`}
              />
              <StatBadge
                icon={<FontAwesome6 name="clock" size={18} color="#4ECDC4" />}
                label="Time spent"
                value={formatTime(timeSpent)}
              />
              <StatBadge
                icon={<FontAwesome6 name="heart" size={18} color="#FF4F64" />}
                label="Hearts remaining"
                value={Number.isFinite(heartsRemaining) ? heartsRemaining : '-'}
              />
            </View>

            {/* Rewards Block */}
            {showRewards && (
              <View style={styles.rewardsBlock}>
                <Text style={styles.sectionTitle}>Rewards</Text>
                <View style={styles.rewardRow}>
                  <RewardChip
                    icon={<LottieView source={require('../assets/animations/Star.json')} autoPlay loop style={styles.rewardAnimation} />}
                    label="Experience (XP)"
                    value={`+${rewards.xp}`}
                    colors={['#FFF7C2', '#FFE082']}
                  />
                  <RewardChip
                    icon={<LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={styles.rewardAnimation} />}
                    label="Diamonds"
                    value={`+${rewards.diamonds}`}
                    colors={['#E0F4FF', '#B0E5FF']}
                  />
                </View>
                {rewards.hearts > 0 && (
                  <View style={styles.rewardRow}>
                    <RewardChip
                      icon={<LottieView source={require('../assets/animations/Heart.json')} autoPlay loop style={styles.rewardAnimation} />}
                      label="Hearts"
                      value={`+${rewards.hearts}`}
                      colors={['#FFE1E8', '#FFB2C7']}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Level Up Card */}
            {newLevel && (
              <View style={styles.levelUpCard}>
                <LottieView
                  source={require('../assets/animations/Trophy.json')}
                  autoPlay
                  loop={false}
                  style={styles.trophyAnimation}
                />
                <Text style={styles.levelUpTitle}>Level up to {newLevel}</Text>
                <Text style={styles.levelUpSubtitle}>Keep earning XP to unlock special rewards!</Text>
              </View>
            )}

            {/* Unlock/Lock Status */}
            {isUnlocked && nextStageUnlocked && (
              <View style={styles.unlockContainer}>
                <LottieView
                  source={require('../assets/animations/Trophy.json')}
                  autoPlay
                  loop
                  style={styles.unlockAnimation}
                />
                <View style={styles.unlockInfo}>
                  <Text style={styles.unlockTitle}>🎉 Next stage unlocked!</Text>
                  <Text style={styles.unlockText}>
                    Accuracy {calculatedAccuracy}% - Passed the 70% threshold
                  </Text>
                  <Text style={styles.unlockSubtext}>
                    You can now play the next stage
                  </Text>
                </View>
              </View>
            )}
            
            {!isUnlocked && (
              <View style={styles.lockContainer}>
                <FontAwesome6 name="lock" size={24} color="#999" />
                <View style={styles.lockInfo}>
                  <Text style={styles.lockTitle}>Not enough accuracy</Text>
                  <Text style={styles.lockText}>
                    Accuracy {calculatedAccuracy}% - Need at least 70%
                  </Text>
                  <Text style={styles.lockSubtext}>
                    Try again to unlock the next stage
                  </Text>
                </View>
              </View>
            )}

            {/* Level Summary */}
            {levelSummary && (
              <View style={styles.levelSummaryCard}>
                <View style={styles.levelSummaryHeader}>
                  <View style={styles.levelBadgeLarge}>
                    <FontAwesome6 name="trophy" size={16} color="#FF8C00" />
                    <Text style={styles.levelBadgeLargeText}>Lv.{levelSummary.after.level}</Text>
                  </View>
                  <View style={styles.levelSummaryStats}>
                    <Text style={styles.levelSummaryXP}>{levelSummary.totalXp.toLocaleString('th-TH')} XP</Text>
                    <Text style={styles.levelSummaryLabel}>Total XP</Text>
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
                    {levelSummary.after.toNext.toLocaleString('th-TH')} XP left to next level
                    {levelSummary.after.level + 1}
                  </Text>
                </View>

                {nextRewards && (
                  <View style={styles.nextRewardsRow}>
                    <Text style={styles.nextRewardsLabel}>Next level rewards</Text>
                    <View style={styles.nextRewardsChips}>
                      <View style={[styles.nextRewardChip, styles.nextRewardHeart]}>
                        <LottieView source={require('../assets/animations/Heart.json')} autoPlay loop style={styles.nextRewardIcon} />
                        <Text style={styles.nextRewardText}>+{nextRewards.hearts}</Text>
                      </View>
                      <View style={[styles.nextRewardChip, styles.nextRewardDiamond]}>
                        <LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={styles.nextRewardIcon} />
                        <Text style={styles.nextRewardText}>+{nextRewards.diamonds}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
              <View style={styles.achievementBlock}>
                <Text style={styles.sectionTitle}>Achievements this round</Text>
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

            {/* Action Buttons */}
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  primaryButtonDisabled && styles.primaryButtonDisabled
                ]}
                onPress={handleNextStage}
                activeOpacity={0.9}
                disabled={primaryButtonDisabled && hasNextStage}
              >
                <LinearGradient
                  colors={primaryButtonColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <FontAwesome6 name="arrow-right" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{primaryButtonLabel}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleStageSelect} activeOpacity={0.85}>
                  <FontAwesome6 name="list-ul" size={18} color="#FF7A00" />
                  <Text style={styles.secondaryButtonText}>Choose stage</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={handleReplay} activeOpacity={0.85}>
                  <FontAwesome6 name="rotate-right" size={18} color="#FF7A00" />
                  <Text style={styles.secondaryButtonText}>Play again</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
      <FireStreakAlert
        visible={showFireStreakAlert}
        onClose={() => setShowFireStreakAlert(false)}
        streak={maxStreak}
      />
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
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B4A29',
    marginBottom: 6,
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
    color: '#5C3B16',
    textAlign: 'center',
    paddingHorizontal: 20,
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
  nextRewardIcon: {
    width: 20,
    height: 20,
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
  buttonColumn: {
    width: '100%',
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    marginHorizontal: 6,
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
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryButtonDisabled: {
    opacity: 0.75,
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
  unlockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  unlockAnimation: {
    width: 40,
    height: 40,
  },
  unlockInfo: {
    marginLeft: 15,
    flex: 1,
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  unlockText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  unlockSubtext: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#9E9E9E',
  },
  lockInfo: {
    marginLeft: 15,
    flex: 1,
  },
  lockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9E9E9E',
    marginBottom: 4,
  },
  lockText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lockSubtext: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default LessonCompleteScreen;
