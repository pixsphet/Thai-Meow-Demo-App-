import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated, SafeAreaView, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProgressRing from '../components/ProgressRing';
import lessonService from '../services/lessonService';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { restoreProgress } from '../services/progressServicePerUser';
import { useFocusEffect } from '@react-navigation/native';
import levelUnlockService from '../services/levelUnlockService';
import { useUserData } from '../contexts/UserDataContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { useTheme } from '../contexts/ThemeContext';
import userStatsService from '../services/userStatsService';
import gameProgressService from '../services/gameProgressService';
import unlockService from '../services/unlockService';

const { width } = Dimensions.get('window');
const ITEM_OFFSET = 65;
const DEBUG_UNLOCK_ALL_STAGES = false; // Set to false for production
const DEBUG_FORCE_UNLOCK = false; // Set to true to force unlock all stages for testing

const CUSTOM_STAGE_META = {
  // Intermediate level stages can be added here if needed
  1: {
    lesson_id: 1,
    title: 'Food & Drinks (อาหารและเครื่องดื่ม)',
    key: 'intermediate1_food_drinks',
    category: 'thai-food-drinks',
    level: 'Intermediate',
    description: 'Learn Thai words for food, drinks, and common restaurant phrases',
    gameScreen: 'Intermediate1FoodDrinksGame',
  },
  2: {
    lesson_id: 2,
    title: 'Emotions & Feelings (ความรู้สึกและอารมณ์)',
    key: 'intermediate_2_emotions',
    category: 'thai-emotions',
    level: 'Intermediate',
    description: 'Express emotions, ask feelings, and respond the Thai way',
    gameScreen: 'IntermediateEmotionsGame',
  },
  3: {
    lesson_id: 3,
    title: 'Places & Location (สถานที่)',
    key: 'intermediate_3_places',
    category: 'thai-places',
    level: 'Intermediate',
    description: 'Learn place vocabulary and basic positions/directions',
    gameScreen: 'IntermediatePlacesGame',
  },
  4: {
    lesson_id: 4,
    title: 'Daily Routines (กิจวัตรประจำวัน)',
    key: 'intermediate_4_routines',
    category: 'thai-daily-routines',
    level: 'Intermediate',
    description: 'Learn common verbs, time expressions, and frequencies',
    gameScreen: 'IntermediateRoutinesGame',
  },
  5: {
    lesson_id: 5,
    title: 'Transportation & Movement (การเดินทาง)',
    key: 'intermediate_5_transport',
    category: 'thai-transport',
    level: 'Intermediate',
    description: 'Learn vehicles, travel verbs, and useful travel phrases',
    gameScreen: 'IntermediateTransportGame',
  },
};

const applyCustomStageMeta = (stage) => {
  if (!stage) return stage;
  const lessonId = Number(stage.lesson_id);
  const meta = CUSTOM_STAGE_META[lessonId];
  if (!meta) {
    return stage;
  }

  return {
    ...stage,
    ...meta,
    key: meta.key || stage.key,
    category: meta.category || stage.category,
    description: meta.description || stage.description,
    gameScreen: meta.gameScreen || stage.gameScreen,
  };
};

// อ่าน progress ต่อ lesson จาก restoreProgress(lessonId)
const readLessonProgress = async (lessonId) => {
  try {
    const lessonKey =
      typeof lessonId === 'string' ? lessonId : `level_intermediate_${lessonId}`;

    let restored = await restoreProgress(lessonId).catch(() => null);
    if (!restored && lessonKey) {
      restored = await restoreProgress(lessonKey).catch(() => null);
    }

    const sessionProgress =
      (await gameProgressService.getLessonProgress(lessonId).catch(() => null)) ||
      (await gameProgressService.getLessonProgress(lessonKey).catch(() => null));

    let progressRatio = 0;
    let finished = false;
    let accuracy = 0;

    if (restored) {
      const total = restored.total || (restored.questionsSnapshot?.length || 0);
      const answersObj = restored.answers || {};
      const answers = Object.values(answersObj);
      const answered = answers.length;

      const correct = answers.filter(a => a && a.correct === true).length;
      accuracy = total > 0 ? correct / total : 0;

      finished =
        (total > 0 && answered >= total) ||
        (typeof restored.currentIndex === 'number' && total > 0 && restored.currentIndex >= total - 1);

      progressRatio = total > 0 ? Math.min(1, answered / total) : 0;
    }

    if (sessionProgress && Number.isFinite(sessionProgress.attempts) && sessionProgress.attempts > 0) {
      const resolveAccuracyPercent = () => {
        if (Number.isFinite(sessionProgress.bestAccuracy)) {
          return sessionProgress.bestAccuracy;
        }
        if (Number.isFinite(sessionProgress.accuracy)) {
          return sessionProgress.accuracy;
        }
        return 0;
      };

      const accuracyPercent = resolveAccuracyPercent();
      const accuracyRatio = Math.max(
        0,
        Math.min(1, accuracyPercent > 1 ? accuracyPercent / 100 : accuracyPercent)
      );

      accuracy = Math.max(accuracy, accuracyRatio);
      finished = finished || sessionProgress.completed || accuracyRatio >= 0.7;
      progressRatio = Math.max(progressRatio, sessionProgress.completed ? 1 : accuracyRatio);
    }

    return { progressRatio, finished, accuracy };
  } catch (e) {
    console.warn('readLessonProgress error:', e?.message);
    return { progressRatio: 0, finished: false, accuracy: 0 };
  }
};

// ตรวจปลดล็อกด่านถัดไปตามกฎ "ครั้งแรก ≥ 70%"
const canUnlockNextByRule = ({ finished, accuracy }) => {
  return finished && accuracy >= 0.7;
};

const REQUIRED_STAGE_IDS = Object.keys(CUSTOM_STAGE_META)
  .map(id => Number(id))
  .filter(Number.isFinite)
  .sort((a, b) => a - b);

const buildStageListFromLessons = (lessonsData = []) => {
  const normalizedLessons = Array.isArray(lessonsData) ? lessonsData : [];
  return REQUIRED_STAGE_IDS.map((lessonId) => {
    const meta = CUSTOM_STAGE_META[lessonId] || {};
    const matchedLesson = normalizedLessons.find((lesson) => {
      const lessonKey = Number(lesson?.lesson_id);
      if (Number.isFinite(lessonKey) && lessonKey === lessonId) return true;
      if (lesson?.key && meta.key && lesson.key === meta.key) return true;
      if (lesson?.title && meta.title && lesson.title === meta.title) return true;
      if (lesson?.titleTH && meta.title && lesson.titleTH === meta.title) return true;
      return false;
    });

    return applyCustomStageMeta({
      id: matchedLesson?._id || `intermediate_${lessonId}`,
      lesson_id: lessonId,
      title: matchedLesson?.title || matchedLesson?.titleTH || meta.title,
      level: matchedLesson?.level || meta.level || 'Intermediate',
      key: matchedLesson?.key || meta.key,
      category: matchedLesson?.category || meta.category || 'thai-intermediate',
      status: 'locked',
      progress: 0,
      accuracy: 0,
      type: 'lottie',
      lottie: require('../assets/animations/stage_start.json'),
    });
  });
};

const ensureAllStagesExist = (stages = []) => {
  const stageMap = new Map();

  (stages || []).forEach((stage) => {
    if (!stage || stage.lesson_id === undefined || stage.lesson_id === null) {
      return;
    }
    const key = Number(stage.lesson_id);
    if (Number.isFinite(key) && !stageMap.has(key)) {
      stageMap.set(key, applyCustomStageMeta(stage));
    }
  });

  REQUIRED_STAGE_IDS.forEach((lessonId) => {
    if (!stageMap.has(lessonId)) {
      const meta = CUSTOM_STAGE_META[lessonId] || {};
      stageMap.set(
        lessonId,
        applyCustomStageMeta({
          id: `intermediate_${lessonId}`,
          lesson_id: lessonId,
          title: meta.title,
          level: meta.level || 2,
          key: meta.key,
          category: meta.category,
          status: DEBUG_UNLOCK_ALL_STAGES ? 'current' : 'locked',
          progress: 0,
          accuracy: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        })
      );
    }
  });

  return Array.from(stageMap.values()).sort(
    (a, b) => Number(a.lesson_id) - Number(b.lesson_id)
  );
};

const LevelStage2 = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const levelType = 'Intermediate'; // กำหนดระดับนี้
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get user data and progress
  const { user } = useUser();
  const { isAuthenticated } = useAuth();
  const { getCurrentLevel } = useProgress();
  const { stats: userStats, updateUserStats } = useUserData();
  
  // Use unified stats for real-time sync
  const { 
    xp, 
    diamonds, 
    hearts, 
    level, 
    streak,
    loading: statsLoading 
  } = useUnifiedStats();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ซ่อนแท็บบาร์เมื่อเข้าหน้านี้ และคืนค่ากลับเมื่อออก
  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: { height: 80 } });
      };
    }, [navigation])
  );

  // Initialize new progress tracking services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        if (user?.id) {
          await gameProgressService.initialize(user.id);
          await levelUnlockService.initialize(user.id);
          await userStatsService.initialize(user.id);
          console.log('✅ Progress tracking services initialized for LevelStage2');
        }
      } catch (error) {
        console.error('❌ Error initializing services:', error);
      }
    };

    initializeServices();
  }, [user?.id]);

  // Real-time updates for user stats
  useEffect(() => {
    if (hearts !== undefined && diamonds !== undefined) {
      console.log('🔄 LevelStage2 updated with unified stats:', {
        hearts,
        diamonds,
        xp,
        level,
        streak
      });
      
      // Refresh stages to update unlock status
      fetchStages();
    }
  }, [hearts, diamonds, xp, level, streak]);

  const evaluateStagesWithProgress = async (stageList = []) => {
    const stagedList = ensureAllStagesExist(stageList);

    const withProgress = await Promise.all(
      stagedList.map(async (stage) => {
        const progressSnapshot = await readLessonProgress(stage.lesson_id);
        return {
          ...stage,
          progress: progressSnapshot.progressRatio,
          _finished: progressSnapshot.finished,
          _accuracy: progressSnapshot.accuracy,
        };
      })
    );

    const normalizeAccuracy = (value) => {
      if (!Number.isFinite(value)) return 0;
      return value > 1 ? value / 100 : value;
    };

    const evaluated = await Promise.all(
      withProgress.map(async (stage, index, array) => {
        if (index === 0) {
          const accuracyPercent = Math.round((stage._accuracy ?? 0) * 100);
          return {
            ...stage,
            status: stage._finished ? 'done' : 'current',
            accuracy: accuracyPercent,
          };
        }

        const prevStage = array[index - 1];
        const prevFinished =
          prevStage &&
          (prevStage._finished || prevStage.status === 'done' || prevStage.completed);
        const prevAccuracyRatio = prevStage
          ? normalizeAccuracy(prevStage._accuracy ?? prevStage.accuracy)
          : 0;
        const prevPassed = prevFinished && prevAccuracyRatio >= 0.7;
        const levelId = `level_intermediate_${stage.lesson_id}`;
        const levelProgress = (await levelUnlockService.getLevelProgress(levelId)) || {};

        if (!prevPassed && !DEBUG_FORCE_UNLOCK) {
          const lockedAccuracyPercent =
            levelProgress.accuracy !== undefined
              ? Math.round(normalizeAccuracy(levelProgress.accuracy) * 100)
              : Math.round((stage._accuracy ?? 0) * 100);

          return {
            ...stage,
            status: 'locked',
            progress: 0,
            accuracy: lockedAccuracyPercent,
          };
        }

        const wasLockedBefore =
          !levelProgress.status ||
          levelProgress.status === 'locked' ||
          levelProgress.status === 'unlocked';

        if (wasLockedBefore && user?.id && prevStage) {
          const previousLevelId = `level_intermediate_${prevStage.lesson_id}`;
          try {
            await levelUnlockService.unlockLevel({
              userId: user.id,
              currentLevel: previousLevelId,
              unlockedLevel: levelId,
              levelId,
              unlockedAt: new Date().toISOString(),
              accuracy: Math.round(prevAccuracyRatio * 100),
              attempts: levelProgress.attempts ?? 0,
              bestScore: levelProgress.bestScore ?? 0,
            });
          } catch (unlockError) {
            console.warn(
              '⚠️ Unable to persist intermediate unlock for',
              levelId,
              unlockError?.message || unlockError
            );
          }
        }

        let statusFromProgress = levelProgress.status;
        if (!statusFromProgress || statusFromProgress === 'locked') {
          statusFromProgress = 'current';
        }
        if (levelProgress.completed) {
          statusFromProgress = 'done';
        }

        const accuracyPercent =
          levelProgress.accuracy !== undefined
            ? Math.round(normalizeAccuracy(levelProgress.accuracy) * 100)
            : Math.round((stage._accuracy ?? 0) * 100);

        console.log('[LevelStage2] Stage evaluation', {
          lessonId: stage.lesson_id,
          status: statusFromProgress,
          prevPassed,
          prevAccuracyRatio,
          levelProgressStatus: levelProgress.status,
          levelProgressAccuracy: levelProgress.accuracy,
          attempts: levelProgress.attempts,
          bestScore: levelProgress.bestScore,
          wasLockedBefore,
          debugForceUnlock: DEBUG_FORCE_UNLOCK,
          prevStageFinished: prevStage?._finished,
          prevStageStatus: prevStage?.status,
        });

        return {
          ...stage,
          status: statusFromProgress,
          progress: Math.max(0, Math.min(1, accuracyPercent / 100)),
          accuracy: accuracyPercent,
          attempts: levelProgress.attempts,
          bestScore: levelProgress.bestScore,
          lastPlayed: levelProgress.lastPlayed,
        };
      })
    );

    return ensureAllStagesExist(evaluated);
  };

  // ดึงข้อมูลบทเรียนเฉพาะระดับ Intermediate
  const fetchStages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to fetch intermediate stages...');

      if (user?.id) {
        try {
          const unlockedLevels = await unlockService.getUnlockedLevels(user.id);
          console.log('🔓 Fetched unlocked intermediate levels from backend:', unlockedLevels);
        } catch (error) {
          console.warn('⚠️ Could not fetch intermediate unlocks from backend:', error.message);
        }
      }

      try {
        const response = await lessonService.getLessonsByLevel(levelType);
        if (response.success && response.data) {
          console.log('✅ Successfully fetched intermediate stages from API:', response.data);
          const baseStages = buildStageListFromLessons(response.data);
          const computed = await evaluateStagesWithProgress(baseStages);
          setStages(computed);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Intermediate lessons API error, using fallback:', apiError?.message || apiError);
      }

      const fallbackStages = buildStageListFromLessons();
      const computedFallback = await evaluateStagesWithProgress(fallbackStages);
      setStages(computedFallback);
    } catch (error) {
      console.error('❌ Error loading intermediate stages:', error);
      const fallbackBasic = REQUIRED_STAGE_IDS.map((lessonId, index) =>
        applyCustomStageMeta({
          id: `intermediate_${lessonId}`,
          lesson_id: lessonId,
          title: CUSTOM_STAGE_META[lessonId]?.title || `บทเรียนที่ ${lessonId}`,
          level: CUSTOM_STAGE_META[lessonId]?.level || 2,
          key: CUSTOM_STAGE_META[lessonId]?.key || `lesson_${lessonId}`,
          category: CUSTOM_STAGE_META[lessonId]?.category || 'intermediate',
          status: index === 0 ? 'current' : 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        })
      );
      setStages(fallbackBasic);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStages();
      return () => {};
    }, [])
  );

  // Animation effects
  useEffect(() => {
    if (stages.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [stages]);

  // Pulse animation for progress rings
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, []);

  // Loading Screen
  const bgGradient = isDarkMode
    ? ['#2C2C2C', '#1F1F1F', '#1A1A1A']
    : [
        theme.colors?.brand || '#FF8C00',
        theme.colors?.orange || '#FFA500',
        theme.colors?.brandLight || '#FFB74D',
      ];

  if (loading) {
    return (
      <LinearGradient
        colors={bgGradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../assets/animations/LoadingCat.json')}
              autoPlay
              loop
              style={styles.loadingAnimation}
            />
            <Text style={styles.loadingText}>
              Loading...
            </Text>
            <Text style={styles.loadingSubtext}>
              Please wait
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <>
      <LinearGradient
        colors={bgGradient}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('HomeMain')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Level 2</Text>
              <Text style={styles.levelSubtext}>Intermediate Level</Text>
            </View>
            <View style={styles.progressIcons}>
              <View style={styles.iconWithLabel}>
                <View style={[styles.iconContainer, styles.heartIcon]}>
                  <LottieView
                    source={require('../assets/animations/Heart.json')}
                    autoPlay
                    loop
                    style={styles.headerAnimation}
                  />
                </View>
                <Text style={styles.iconLabel}>{hearts}</Text>
              </View>
              <View style={styles.iconWithLabel}>
                <View style={[styles.iconContainer, styles.diamondIcon]}>
                  <LottieView
                    source={require('../assets/animations/Diamond.json')}
                    autoPlay
                    loop
                    style={styles.headerAnimation}
                  />
                </View>
                <Text style={styles.iconLabel}>{diamonds}</Text>
              </View>
              <View style={styles.iconWithLabel}>
                <View style={[styles.iconContainer, styles.levelIcon]}>
                  <LottieView
                    source={require('../assets/animations/Trophy.json')}
                    autoPlay
                    loop
                    style={styles.headerAnimation}
                  />
                </View>
                <Text style={styles.iconLabel}>{userStats?.level || getCurrentLevel()}</Text>
              </View>
            </View>
          </View>

          {/* Header badges row */}
          <View style={styles.headerBadgesRow}>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: '#FFD54F' }]}>
              <Text style={[styles.badgePillText, { color: theme.colors?.white || '#FFFFFF' }]}>⭐ {xp?.toLocaleString?.('en-US') || xp || 0} XP</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: '#FF6B6B' }]}>
              <Text style={[styles.badgePillText, { color: theme.colors?.white || '#FFFFFF' }]}>🔥 {streak || 0} days streak</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: '#90CAF9' }]}>
              <Text style={[styles.badgePillText, { color: theme.colors?.white || '#FFFFFF' }]}>🎯 Level {level || (userStats?.level || 1)}</Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.stageList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            stages.map((stage, idx) => (
            <Animated.View
              key={stage.id || `stage-${idx}`}
              style={[
                styles.stageWrapper,
                {
                  alignSelf: idx % 2 === 0 ? 'flex-start' : 'flex-end',
                  marginLeft: idx % 2 === 0 ? ITEM_OFFSET : 0,
                  marginRight: idx % 2 !== 0 ? ITEM_OFFSET : 0,
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                },
              ]}
            >
            <TouchableOpacity
              style={[
                styles.stageCircle,
                stage.status === 'done' && styles.doneCircle,
                stage.status === 'active' && styles.activeCircle,
                stage.status === 'current' && styles.currentCircle,
                stage.status === 'locked' && styles.lockedCircle,
              ]}
                  onPress={async () => {
                    if (stage.status === 'locked') {
                      Alert.alert('Locked', 'Pass the previous stage with at least 70% on first play to unlock this stage.');
                      return;
                    }
                    console.log('Navigating to lesson screen with lessonId:', stage.lesson_id);
                    
                    if (stage.gameScreen === 'Intermediate1FoodDrinksGame') {
                      navigation.navigate('Intermediate1FoodDrinksGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else if (stage.gameScreen === 'IntermediateEmotionsGame') {
                      navigation.navigate('IntermediateEmotionsGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else if (stage.gameScreen === 'IntermediatePlacesGame') {
                      navigation.navigate('IntermediatePlacesGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else if (stage.gameScreen === 'IntermediateRoutinesGame') {
                      navigation.navigate('IntermediateRoutinesGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else if (stage.gameScreen === 'IntermediateTransportGame') {
                      navigation.navigate('IntermediateTransportGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else {
                      navigation.navigate('NewLessonGame', {
                        lessonId: stage.lesson_id, 
                        category: 'intermediate',
                        level: stage.level,
                        stageTitle: stage.title 
                      });
                    }
                  }}
              activeOpacity={0.8}
            >
              <View style={styles.progressWrapper}>
                {stage.status === 'current' && (
                  <Animated.View
                    style={{
                      transform: [{ scale: pulseAnim }]
                    }}
                  >
                    <ProgressRing
                      progress={Math.max(0, Math.min(1, stage.progress || 0))}
                      size={142}
                      strokeWidth={14}
                      color="#4CAF50"
                      bgColor="rgba(76, 175, 80, 0.2)"
                      shadowColor="#4CAF50"
                      shadowOpacity={0.6}
                      shadowRadius={12}
                      gradient={true}
                      gradientColors={['#4CAF50', '#81C784', '#A5D6A7']}
                    />
                  </Animated.View>
                )}

                {stage.type === 'lottie' && stage.lottie && (
                  <LottieView
                    source={stage.lottie}
                    autoPlay
                    loop={stage.status !== 'locked'}
                    style={[
                      styles.lottieIcon,
                      (stage.status === 'current' || stage.status === 'done') && styles.glow,
                    ]}
                  />
                )}

                <View style={styles.starContainer}>
                  <Text style={styles.star}>⭐</Text>
                </View>

                {/* Lock overlay */}
                {stage.status === 'locked' && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockText}>🔒</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.stageLabelContainer}>
              <Text
                style={[
                  styles.stageLabel,
                  stage.status === 'locked' && { color: 'rgba(255, 255, 255, 0.5)' },
                ]}
              >
                {stage.title}
              </Text>
              <Text style={styles.stageDescription}>
                {stage.status === 'current' ? 'Start Learning' : 
                 stage.status === 'done' ? 'Completed' : 
                 stage.status === 'locked' ? 'Locked' : 'Ready to learn'}
              </Text>

              {/* Stage info chips */}
              <View style={styles.stageChipsRow}>
                <View style={[styles.stageChip, { borderColor: '#A5D6A7' }]}>
                  <Text style={styles.stageChipText}>📈 Progress {Math.round(Math.max(0, Math.min(1, stage.progress || 0)) * 100)}%</Text>
                </View>
                {Number.isFinite(stage.accuracy) && (
                  <View style={[styles.stageChip, { borderColor: stage.accuracy >= 70 ? '#4CAF50' : '#81C784' }]}>
                    <Text style={styles.stageChipText}>🎯 Accuracy {Math.round(stage.accuracy)}%</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        ))
        )}
        </ScrollView>

        </SafeAreaView>
      </LinearGradient>

    </>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  levelInfo: {
    flex: 1,
    alignItems: 'center',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  headerBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    justifyContent: 'center',
  },
  badgePill: {
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWithLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginHorizontal: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  heartIcon: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  diamondIcon: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  levelIcon: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  headerAnimation: {
    width: 24,
    height: 24,
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  stageList: { 
    paddingBottom: 30, 
    width: width, 
    paddingTop: 30 
  },
  stageWrapper: { 
    marginBottom: 40, 
    alignItems: 'center', 
    position: 'relative', 
    width: 285 
  },
  stageCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#4CAF50',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  progressWrapper: { 
    width: 150, 
    height: 150, 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative' 
  },
  lottieIcon: { 
    width: 150, 
    height: 150, 
    position: 'absolute', 
    zIndex: 10 
  },
  glow: { 
    shadowColor: '#4CAF50', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.7, 
    shadowRadius: 22, 
    elevation: 28 
  },
  doneCircle: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderColor: '#4CAF50' 
  },
  activeCircle: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderColor: '#81C784' 
  },
  currentCircle: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderColor: '#4CAF50' 
  },
  lockedCircle: { 
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    borderColor: 'rgba(255, 255, 255, 0.3)' 
  },
  stageLabelContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  stageLabel: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  stageDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: { 
    fontSize: 18, 
    color: '#FFFFFF', 
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
  starContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  star: {
    fontSize: 16,
    color: '#FFD54F',
    textShadowColor: '#4CAF50',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    fontWeight: 'bold',
  },
  lockOverlay: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  lockText: {
    fontSize: 26,
    color: '#FFF',
  },
  stageChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  stageChip: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  stageChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  // Loading Screen Styles
  loadingAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
});
export default LevelStage2;
