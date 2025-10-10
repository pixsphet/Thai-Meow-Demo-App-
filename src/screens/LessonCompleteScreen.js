import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Easing
} from 'react-native';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProgress } from '../contexts/ProgressContext';

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
  
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);
  const xpAnim = new Animated.Value(0);
  const diamondAnim = new Animated.Value(0);

  useEffect(() => {
    // Calculate comprehensive rewards
    const calculatedRewards = calculateRewards();
    setRewards(calculatedRewards);
    
    // Check for achievements
    const newAchievements = checkAchievements();
    setAchievements(newAchievements);
    
    // Check for level up
    const currentLevel = userProgress?.level || 1;
    const currentXp = userProgress?.xp || 0;
    const newTotalXp = currentXp + calculatedRewards.xp;
    const levelUpThreshold = currentLevel * 100; // 100 XP per level
    
    if (newTotalXp >= levelUpThreshold) {
      setNewLevel(currentLevel + 1);
    }

    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowRewards(true);
      animateRewards();
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

  const animateRewards = () => {
    // Animate XP counter
    Animated.timing(xpAnim, {
      toValue: rewards.xp,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Animate diamond counter
    Animated.timing(diamondAnim, {
      toValue: rewards.diamonds,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const handleContinue = () => {
    // Apply rewards to progress
    applyDelta({
      xp: rewards.xp,
      diamonds: rewards.diamonds,
      hearts: rewards.hearts,
      finishedLesson: true,
      timeSpentSec: timeSpent
    });
    
    // Navigate back to home or next lesson
    navigation.navigate('Home');
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  const calculatedAccuracy = totalQuestions > 0 ? Math.round((score / (totalQuestions * 10)) * 100) : 0;
  const animatedXp = xpAnim.interpolate({
    inputRange: [0, xpGained],
    outputRange: [0, xpGained],
    extrapolate: 'clamp',
  });

  const animatedDiamonds = diamondAnim.interpolate({
    inputRange: [0, diamondsGained],
    outputRange: [0, diamondsGained],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require('../assets/animations/Success.json')}
              autoPlay
              loop={false}
              style={styles.successAnimation}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>ยินดีด้วย! 🎉</Text>
          <Text style={styles.subtitle}>คุณทำได้ดีมาก!</Text>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreNumber}>{score}</Text>
              <Text style={styles.scoreLabel}>คะแนน</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreNumber}>{calculatedAccuracy}%</Text>
              <Text style={styles.scoreLabel}>ความแม่นยำ</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreNumber}>{totalQuestions}</Text>
              <Text style={styles.scoreLabel}>คำถาม</Text>
            </View>
          </View>

          {/* Rewards Section */}
          {showRewards && (
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardsTitle}>รางวัลที่ได้รับ</Text>
              
              {/* XP Reward */}
              <View style={styles.rewardItem}>
                <View style={styles.rewardIcon}>
                  <LottieView
                    source={require('../assets/animations/Star.json')}
                    autoPlay
                    loop
                    style={styles.rewardAnimation}
                  />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>ประสบการณ์ (XP)</Text>
                  <Animated.Text style={styles.rewardValue}>
                    +{Math.round(animatedXp._value || 0)}
                  </Animated.Text>
                </View>
              </View>

              {/* Diamond Reward */}
              <View style={styles.rewardItem}>
                <View style={styles.rewardIcon}>
                  <LottieView
                    source={require('../assets/animations/Diamond.json')}
                    autoPlay
                    loop
                    style={styles.rewardAnimation}
                  />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>เพชร</Text>
                  <Animated.Text style={styles.rewardValue}>
                    +{Math.round(animatedDiamonds._value || 0)}
                  </Animated.Text>
                </View>
              </View>

              {/* Hearts Reward */}
              {rewards.hearts > 0 && (
                <View style={styles.rewardItem}>
                  <View style={styles.rewardIcon}>
                    <FontAwesome name="heart" size={24} color="#FF6B6B" />
                  </View>
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardLabel}>หัวใจ</Text>
                    <Text style={styles.rewardValue}>+{rewards.hearts}</Text>
                  </View>
                </View>
              )}

              {/* Streak Bonus */}
              {rewards.streak > 0 && (
                <View style={styles.rewardItem}>
                  <View style={styles.rewardIcon}>
                    <FontAwesome name="fire" size={24} color="#FF4500" />
                  </View>
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardLabel}>โบนัสต่อเนื่อง</Text>
                    <Text style={styles.rewardValue}>+{rewards.streak}x</Text>
                  </View>
                </View>
              )}

              {/* Achievements */}
              {achievements.length > 0 && (
                <View style={styles.achievementsContainer}>
                  <Text style={styles.achievementsTitle}>ความสำเร็จ</Text>
                  {achievements.map((achievement, index) => (
                    <View key={achievement.id} style={styles.achievementItem}>
                      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                      <View style={styles.achievementContent}>
                        <Text style={[styles.achievementTitle, { color: achievement.color }]}>
                          {achievement.title}
                        </Text>
                        <Text style={styles.achievementDescription}>
                          {achievement.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Level Up */}
              {newLevel && (
                <View style={styles.levelUpContainer}>
                  <LottieView
                    source={require('../assets/animations/Trophy.json')}
                    autoPlay
                    loop={false}
                    style={styles.trophyAnimation}
                  />
                  <Text style={styles.levelUpText}>
                    ระดับใหม่! ระดับ {newLevel} 🎊
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.retryButton]}
              onPress={handleRetry}
            >
              <FontAwesome name="refresh" size={20} color="#666" />
              <Text style={styles.retryButtonText}>ลองใหม่</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={handleContinue}
            >
              <FontAwesome name="check" size={20} color="#fff" />
              <Text style={styles.continueButtonText}>ต่อไป</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  animationContainer: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  successAnimation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 20,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  rewardsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
  },
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  rewardAnimation: {
    width: 24,
    height: 24,
  },
  rewardContent: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  levelUpContainer: {
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 10,
    padding: 15,
  },
  trophyAnimation: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  achievementsContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#4ECDC4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default LessonCompleteScreen;
