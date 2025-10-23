import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated, SafeAreaView, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import ProgressRing from '../components/ProgressRing';
import lessonService from '../services/lessonService';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';
import { getUserStats, restoreProgress } from '../services/progressServicePerUser';
import { useFocusEffect } from '@react-navigation/native';
import levelUnlockService from '../services/levelUnlockService';
import { useUserData } from '../contexts/UserDataContext';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import userStatsService from '../services/userStatsService';
import gameProgressService from '../services/gameProgressService';

const { width } = Dimensions.get('window');
const ITEM_OFFSET = 65;
const DEBUG_UNLOCK_ALL_STAGES = false; // Set to false for production - enable lock/unlock system

const CUSTOM_STAGE_META = {
  // Advanced level stages
  1: {
    lesson_id: 1,
    title: 'สำนวนไทย (Thai Idioms)',
    key: 'advanced1_idioms',
    category: 'thai-idioms',
    level: 'Advanced',
    description: 'เรียนรู้สำนวนไทยและการใช้ในบริบทจริง',
    gameScreen: 'Advanced1IdiomsGame',
  },
  2: {
    lesson_id: 2,
    title: 'อาชีพ (Occupations)',
    key: 'advanced2_occupations',
    category: 'thai-occupations',
    level: 'Advanced',
    description: 'เรียนรู้คำศัพท์อาชีพและการบรรยาย',
    gameScreen: 'Advanced2OccupationsGame',
  },
  3: {
    lesson_id: 3,
    title: 'ทิศทาง (Directions)',
    key: 'advanced3_directions',
    category: 'thai-directions',
    level: 'Advanced',
    description: 'เรียนรู้คำศัพท์ทิศทางและถามทาง',
    gameScreen: 'Advanced3DirectionsGame',
  },
  4: {
    lesson_id: 4,
    title: 'กริยาซับซ้อน (Complex Verbs)',
    key: 'advanced4_complex_verbs',
    category: 'thai-complex-verbs',
    level: 'Advanced',
    description: 'เรียนรู้คำเชื่อมและโครงสร้างประโยคซับซ้อน',
    gameScreen: 'Advanced4ComplexVerbsGame',
  },
  5: {
    lesson_id: 5,
    title: 'แสดงความคิดเห็น (Opinions)',
    key: 'advanced5_opinions',
    category: 'thai-opinions',
    level: 'Advanced',
    description: 'เรียนรู้วิธีการแสดงความคิดเห็นและการให้เหตุผล',
    gameScreen: 'Advanced5OpinionsGame',
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
  };
};

// อ่าน progress ต่อ lesson จาก restoreProgress(lessonId)
// คืน { progressRatio(0..1), finished(true/false), accuracy(0..1) }
const readLessonProgress = async (lessonId) => {
  try {
    const [restored, sessionProgress] = await Promise.all([
      restoreProgress(lessonId),
      gameProgressService.getLessonProgress(lessonId).catch(() => null),
    ]);

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

      // ถือว่า "จบ" ถ้าตอบครบแล้ว หรือ currentIndex ชนปลาย
      finished =
        (total > 0 && answered >= total) ||
        (typeof restored.currentIndex === 'number' && total > 0 && restored.currentIndex >= total - 1);

      // ความคืบหน้าวงแหวน: ตอบไปเท่าไรจากทั้งหมด (ถ้ายังไม่ gen total, เป็น 0)
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

const ensureAllStagesExist = (stages) => {
  // For Advanced level, ensure we always have lesson_id 1, 2, 3 (Idioms, Occupations, Directions)
  const stageIds = stages.map(s => s.lesson_id).filter(Boolean);
  
  // Ensure lesson_id 1 (Idioms)
  if (!stageIds.includes(1)) {
    const idiomsStage = applyCustomStageMeta({
      id: 'advanced_idioms_1',
      lesson_id: 1,
      title: 'สำนวนไทย (Thai Idioms)',
      level: 3,
      key: 'advanced1_idioms',
      category: 'thai-idioms',
      status: 'current',
      progress: 0,
      type: 'lottie',
      lottie: require('../assets/animations/stage_start.json'),
    });
    stages.unshift(idiomsStage);
  }
  
  // Ensure lesson_id 2 (Occupations)
  if (!stageIds.includes(2)) {
    const occupationsStage = applyCustomStageMeta({
      id: 'advanced_occupations_2',
      lesson_id: 2,
      title: 'อาชีพ (Occupations)',
      level: 3,
      key: 'advanced2_occupations',
      category: 'thai-occupations',
      status: DEBUG_UNLOCK_ALL_STAGES ? 'current' : 'locked',
      progress: 0,
      accuracy: 0,
      type: 'lottie',
      lottie: require('../assets/animations/stage_start.json'),
    });
    stages.push(occupationsStage);
  }
  
  // Ensure lesson_id 3 (Directions)
  if (!stageIds.includes(3)) {
    const directionsStage = applyCustomStageMeta({
      id: 'advanced_directions_3',
      lesson_id: 3,
      title: 'ทิศทาง (Directions)',
      level: 3,
      key: 'advanced3_directions',
      category: 'thai-directions',
      status: DEBUG_UNLOCK_ALL_STAGES ? 'current' : 'locked',
      progress: 0,
      accuracy: 0,
      type: 'lottie',
      lottie: require('../assets/animations/stage_start.json'),
    });
    stages.push(directionsStage);
  }
  
  // Ensure lesson_id 4 (Complex Verbs)
  if (!stageIds.includes(4)) {
    const complexVerbsStage = applyCustomStageMeta({
      id: 'advanced_complex_verbs_4',
      lesson_id: 4,
      title: 'กริยาซับซ้อน (Complex Verbs)',
      level: 3,
      key: 'advanced4_complex_verbs',
      category: 'thai-complex-verbs',
      status: DEBUG_UNLOCK_ALL_STAGES ? 'current' : 'locked',
      progress: 0,
      accuracy: 0,
      type: 'lottie',
      lottie: require('../assets/animations/stage_start.json'),
    });
    stages.push(complexVerbsStage);
  }
  
  // Ensure lesson_id 5 (Opinions)
  if (!stageIds.includes(5)) {
    const opinionsStage = applyCustomStageMeta({
      id: 'advanced_opinions_5',
      lesson_id: 5,
      title: 'แสดงความคิดเห็น (Opinions)',
      level: 3,
      key: 'advanced5_opinions',
      category: 'thai-opinions',
      status: DEBUG_UNLOCK_ALL_STAGES ? 'current' : 'locked',
      progress: 0,
      accuracy: 0,
      type: 'lottie',
      lottie: require('../assets/animations/stage_start.json'),
    });
    stages.push(opinionsStage);
  }
  
  return stages;
};

const LevelStage3 = ({ navigation }) => {
  const levelType = 'Advanced'; // กำหนดระดับนี้
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelProgress, setLevelProgress] = useState([]);
  
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
          console.log('✅ Progress tracking services initialized for LevelStage3');
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
      console.log('🔄 LevelStage3 updated with unified stats:', {
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

  // ดึงข้อมูลบทเรียนเฉพาะระดับ Advanced
  const fetchStages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to fetch stages...');
      
      // ลองดึงข้อมูลจาก API ก่อน
      const response = await lessonService.getLessonsByLevel(levelType);
      if (response.success && response.data) {
        console.log('✅ Successfully fetched stages from API:', response.data);
        const lessonsData = response.data;
        
        // ประมวลผลข้อมูลจาก API
        const baseStages = lessonsData.map((lesson, index) => applyCustomStageMeta({
          id: lesson._id || `lesson_${index}`,
          lesson_id: lesson.lesson_id || lesson.order || index + 1,
          title: lesson.title || lesson.titleTH || `บทเรียน ${index + 1}`,
          level: lesson.level || 3,
          key: lesson.key || `lesson_${index}`,
          category: lesson.category || 'advanced',
          status: 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        }));

        // ดึง progress และคำนวณสถานะ
        const withProgress = await Promise.all(
          baseStages.map(async (s) => {
            const p = await readLessonProgress(s.lesson_id);
            return { ...s, progress: p.progressRatio, _finished: p.finished, _accuracy: p.accuracy };
          })
        );
        
        // คำนวณสถานะปลดล็อก
        const normalizeAccuracy = (value) => {
          if (!Number.isFinite(value)) return 0;
          return value > 1 ? value / 100 : value;
        };

        const computed = await Promise.all(
          withProgress.map(async (s, i, arr) => {
            const prevStage = i > 0 ? arr[i - 1] : null;
            const prevFinished =
              prevStage && (prevStage._finished || prevStage.status === 'done' || prevStage.completed);
            const prevAccuracyRatio = prevStage ? normalizeAccuracy(prevStage._accuracy ?? prevStage.accuracy) : 0;
            const prevPassed = prevFinished && prevAccuracyRatio >= 0.7;

            // ด่านแรก: เปิดตลอด
            if (i === 0) {
              const accuracyPercent = Math.round((s._accuracy ?? 0) * 100);
              return { 
                ...s, 
                status: s._finished ? 'done' : 'current',
                accuracy: accuracyPercent
              };
            }
            
            const levelId = `level${s.lesson_id}`;
            const levelProgress = (await levelUnlockService.getLevelProgress(levelId)) || {};
            let statusFromProgress = levelProgress.status;

            // ด่านถัดไป: ปลดล็อกก็ต่อเมื่อ prevPassed (ด่านก่อนหน้า ≥70%)
            // ถ้าด่านก่อนหน้าไม่ผ่าน 70% ให้ lock ไว้เสมอ
            if (!prevPassed) {
              // ด่านก่อนหน้าไม่ผ่าน 70% → lock ไว้
              return { 
                ...s, 
                status: 'locked', 
                progress: 0,
                accuracy: levelProgress.accuracy ?? 0
              };
            }

            // ด่านก่อนหน้าผ่าน 70% → ปลดล็อกด่านนี้
            if (!statusFromProgress || statusFromProgress === 'locked') {
              statusFromProgress = 'current';
            }
            
            let status = statusFromProgress;
            if (levelProgress.completed) {
              status = 'done';
            }

            const accuracyPercent =
              levelProgress.accuracy !== undefined
                ? Math.round(normalizeAccuracy(levelProgress.accuracy) * 100)
                : Math.round((s._accuracy ?? 0) * 100);

            return { 
              ...s, 
              status,
              progress: Math.max(0, Math.min(1, accuracyPercent / 100)),
              accuracy: accuracyPercent,
              attempts: levelProgress.attempts,
              bestScore: levelProgress.bestScore,
              lastPlayed: levelProgress.lastPlayed
            };
          })
        );
        
        console.log('✅ Stages with progress from API:', computed);
        const allStages = ensureAllStagesExist(computed);
        setStages(allStages);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.warn('⚠️ API error, using fallback data:', error.message);
    }
    
    // ใช้ fallback data เมื่อ API ไม่ทำงาน
    try {
      const lessonsData = Array.from({ length: 10 }, (_, index) => ({
        _id: `fallback-${index + 1}`,
        lesson_id: index + 1,
        title: `บทเรียนที่ ${index + 1}`,
        level: 'Advanced',
        key: `lesson_${index + 1}`,
        category: 'advanced',
      }));

      // กำหนด stage ปัจจุบันเบื้องต้น: index 0
      const currentStageIndex = 0;
      let baseStages = lessonsData.map((lesson, index) => {
        // ตรวจสอบว่า lesson object มีข้อมูลครบหรือไม่
        if (!lesson || typeof lesson !== 'object') {
          console.warn(`Invalid lesson object at index ${index}:`, lesson);
          return applyCustomStageMeta({
            id: `lesson_${index}`,
            lesson_id: index + 1,
            title: `บทเรียน ${index + 1}`,
            level: 3,
            key: `lesson_${index}`,
            category: 'advanced',
            status: 'locked',
            progress: 0,
            type: 'lottie',
            lottie: require('../assets/animations/stage_start.json'),
          });
        }
        return applyCustomStageMeta({
          id: lesson?._id || `lesson_${index}`,
          lesson_id: lesson?.lesson_id || lesson?.order || index + 1,
          title: lesson?.title || lesson?.titleTH || `บทเรียน ${index + 1}`,
          level: lesson?.level || 3,
          key: lesson?.key || `lesson_${index}`,
          category: lesson?.category || 'advanced',
          status: 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        });
      });

      // ดึง progress ต่อบทเรียนแบบขนาน แล้วคำนวณสถานะ
      const withProgress = await Promise.all(
        baseStages.map(async (s) => {
          const p = await readLessonProgress(s.lesson_id);
          return { ...s, progress: p.progressRatio, _finished: p.finished, _accuracy: p.accuracy };
        })
      );

      // คำนวณ state ปลดล็อก
      const normalizeAccuracy = (value) => {
        if (!Number.isFinite(value)) return 0;
        return value > 1 ? value / 100 : value;
      };

      const computed = withProgress.map(async (s, i, arr) => {
        const prevStage = i > 0 ? arr[i - 1] : null;
        const prevFinished =
          prevStage && (prevStage._finished || prevStage.status === 'done' || prevStage.completed);
        const prevAccuracyRatio = prevStage ? normalizeAccuracy(prevStage._accuracy ?? prevStage.accuracy) : 0;
        const prevPassed = prevFinished && prevAccuracyRatio >= 0.7;

        // ด่านแรก: เปิดตลอด
        if (i === 0) {
          const status = s._finished ? 'done' : 'current';
          const accuracyPercent = Math.round((s._accuracy ?? 0) * 100);
          return { ...s, status, accuracy: accuracyPercent, unlockMessage: false };
        }
        
        // เช็คการปลดล็อกจากระบบใหม่
        const levelId = `level${s.lesson_id}`;
        const levelProgress = (await levelUnlockService.getLevelProgress(levelId)) || {};
        let statusFromProgress = levelProgress.status;
        // ด่านถัดไป: ปลดล็อกก็ต่อเมื่อ prevPassed (ด่านก่อนหน้า ≥70%)
        if (!statusFromProgress || statusFromProgress === 'locked') {
          statusFromProgress = prevPassed ? 'current' : 'locked';
        }
        if (statusFromProgress === 'locked' && prevPassed) {
          statusFromProgress = 'current';
        }
        
        if (statusFromProgress === 'locked' && !prevPassed) {
          return { 
            ...s, 
            status: 'locked', 
            progress: 0,
            accuracy: levelProgress.accuracy ?? 0,
            unlockMessage: false
          };
        }
        
        // ปลดล็อกแล้ว: ถ้าจบ → done, ถ้ายัง → current
        let status = statusFromProgress;
        if (levelProgress.completed) {
          status = 'done';
        } else if (!prevPassed) {
          status = 'locked';
        }
        const accuracyPercent =
          levelProgress.accuracy !== undefined
            ? Math.round(normalizeAccuracy(levelProgress.accuracy) * 100)
            : Math.round((s._accuracy ?? 0) * 100);
        return { 
          ...s, 
          status,
          progress: Math.max(0, Math.min(1, accuracyPercent / 100)),
          accuracy: accuracyPercent,
          attempts: levelProgress.attempts,
          bestScore: levelProgress.bestScore,
          lastPlayed: levelProgress.lastPlayed,
          unlockMessage: false
        };
      });

      // รอให้ async operations เสร็จ
      const computedResults = await Promise.all(computed);

      console.log('✅ Stages with progress (fallback):', computedResults);
      const allStages = ensureAllStagesExist(computedResults);
      setStages(allStages);
    } catch (fallbackError) {
      console.error('❌ Error in fallback data processing:', fallbackError);
      // ใช้ข้อมูลพื้นฐานสุดท้าย
      const basicStages = Array.from({ length: 10 }, (_, index) => {
        if (index === 0) {
          return applyCustomStageMeta({
            id: 'basic-idioms',
            lesson_id: 1,
            title: 'สำนวนไทย (Thai Idioms)',
            level: 3,
            key: 'advanced1_idioms',
            category: 'thai-idioms',
            status: 'current',
            progress: 0,
            type: 'lottie',
            lottie: require('../assets/animations/stage_start.json'),
            unlockMessage: false,
          });
        }
        return {
          id: `basic-${index + 1}`,
          lesson_id: index + 1,
          title: `บทเรียนที่ ${index + 1}`,
          level: 3,
          key: `lesson_${index + 1}`,
          status: index === 0 ? 'current' : 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
          unlockMessage: false,
        };
      });
      const allBasicStages = ensureAllStagesExist(basicStages);
      setStages(allBasicStages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // ทุกครั้งที่เข้าหน้านี้ ให้รีเฟรชความคืบหน้า
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
  if (loading) {
    return (
      <LinearGradient
        colors={['#9C27B0', '#BA68C8', '#CE93D8']}
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
              กำลังโหลดข้อมูล...
            </Text>
            <Text style={styles.loadingSubtext}>
              กรุณารอสักครู่
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <>
      <LinearGradient
        colors={['#9C27B0', '#BA68C8', '#CE93D8']}
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
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Level 3</Text>
              <Text style={styles.levelSubtext}>Advanced Level</Text>
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
              <Text style={styles.badgePillText}>⭐ {xp?.toLocaleString?.('th-TH') || xp || 0} XP</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: '#FF6B6B' }]}>
              <Text style={styles.badgePillText}>🔥 {streak || 0} วันต่อเนื่อง</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 255, 255, 0.25)', borderColor: '#90CAF9' }]}>
              <Text style={styles.badgePillText}>🎯 เลเวล {level || (userStats?.level || 1)}</Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.stageList} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
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
                      Alert.alert('ยังไม่ปลดล็อก', 'ต้องผ่านด่านก่อนหน้าอย่างน้อย 70% ในการเล่นครั้งแรก เพื่อปลดล็อกด่านนี้');
                      return;
                    }
                    console.log('Navigating to lesson screen with lessonId:', stage.lesson_id);
                    
                    // Navigate to appropriate game screen based on stage metadata
                    if (stage.gameScreen === 'Advanced1IdiomsGame') {
                      navigation.navigate('Advanced1IdiomsGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else if (stage.gameScreen === 'Advanced2OccupationsGame') {
                      navigation.navigate('Advanced2OccupationsGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else if (stage.gameScreen === 'Advanced3DirectionsGame') {
                      navigation.navigate('Advanced3DirectionsGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else if (stage.gameScreen === 'Advanced4ComplexVerbsGame') {
                      navigation.navigate('Advanced4ComplexVerbsGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else if (stage.gameScreen === 'Advanced5OpinionsGame') {
                      navigation.navigate('Advanced5OpinionsGame', {
                        lessonId: stage.lesson_id,
                        category: stage.category,
                        level: stage.level,
                        stageTitle: stage.title
                      });
                    } else {
                      navigation.navigate('NewLessonGame', {
                        lessonId: stage.lesson_id, 
                        category: 'advanced',
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
                      color="#9C27B0"
                      bgColor="rgba(156, 39, 176, 0.2)"
                      shadowColor="#9C27B0"
                      shadowOpacity={0.6}
                      shadowRadius={12}
                      gradient={true}
                      gradientColors={['#9C27B0', '#BA68C8', '#CE93D8']}
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
                {stage.status === 'current' ? 'เริ่มเรียน' : 
                 stage.status === 'done' ? 'เสร็จแล้ว' : 
                 stage.status === 'locked' ? 'ยังล็อค' : 'พร้อมเรียน'}
              </Text>

              {/* Stage info chips */}
              <View style={styles.stageChipsRow}>
                <View style={[styles.stageChip, { borderColor: '#CE93D8' }]}>
                  <Text style={styles.stageChipText}>📈 ความคืบหน้า {Math.round(Math.max(0, Math.min(1, stage.progress || 0)) * 100)}%</Text>
                </View>
                {Number.isFinite(stage.accuracy) && (
                  <View style={[styles.stageChip, { borderColor: stage.accuracy >= 70 ? '#4CAF50' : '#BA68C8' }]}>
                    <Text style={styles.stageChipText}>🎯 แม่นยำ {Math.round(stage.accuracy)}%</Text>
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
    borderColor: '#9C27B0',
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
    shadowColor: '#9C27B0', 
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
    borderColor: '#CE93D8' 
  },
  currentCircle: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderColor: '#9C27B0' 
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
    borderColor: '#9C27B0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  star: {
    fontSize: 16,
    color: '#FFD54F',
    textShadowColor: '#9C27B0',
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
export default LevelStage3;
