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
import unlockService from '../services/unlockService';
// Removed Lesson3Game/Lesson4Game (files no longer exist)

const { width } = Dimensions.get('window');
const ITEM_OFFSET = 65;
const DEBUG_UNLOCK_ALL_STAGES = false; // Set to false for production - enable lock/unlock system

const CUSTOM_STAGE_META = {
  1: {
    title: 'พยัญชนะพื้นฐาน ก-ฮ',
    key: 'lesson_consonants_1',
    category: 'consonants',
  },
  2: {
    title: 'สระ 32 ตัว',
    key: 'lesson_vowels_32',
    category: 'vowels',
    description: 'ฝึกครบสระไทยทั้ง 32 ตัว',
  },
  3: {
    title: 'คำทักทาย',
    key: 'lesson_greetings_3',
    category: 'greetings',
    description: 'ฝึกคำทักทายพร้อม 5 มินิเกม',
  },
  4: {
    title: 'สิ่งของรอบตัว',
    key: 'lesson_objects_4',
    category: 'objects',
    description: 'ฝึกคำศัพท์สิ่งของรอบตัว 16 คำ',
  },
  5: {
    title: 'ร่างกาย (Body Parts)',
    key: 'lesson_body_5',
    category: 'body',
    description: 'ฝึกคำศัพท์ร่างกาย 16 คำ',
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
// หมายเหตุ: ถ้าไม่มีการเก็บ attempt แยกครั้งแรกในระบบเดิม เราจะใช้เกณฑ์ "มีการจบครั้งใดครั้งหนึ่ง ≥ 0.7" เป็นตัวปลดล็อกแทน
const canUnlockNextByRule = ({ finished, accuracy }) => {
  return finished && accuracy >= 0.7;
};

const ensureAllStagesExist = (stages) => {
  const requiredLessonIds = [1, 2, 3, 4, 5];
  const existingLessonIds = stages.map(s => Number(s.lesson_id));
  const missingLessonIds = requiredLessonIds.filter(id => !existingLessonIds.includes(id));

  if (missingLessonIds.length > 0) {
    console.warn(`Missing stages for lesson IDs: ${missingLessonIds.join(', ')}. Adding default stages.`);
    const newStages = [...stages];
    missingLessonIds.forEach(id => {
      const meta = CUSTOM_STAGE_META[id];
      if (meta) {
        newStages.push(applyCustomStageMeta({
          id: `lesson_${id}`,
          lesson_id: id,
          title: meta.title,
          level: 'Beginner',
          key: meta.key,
          category: meta.category,
          status: 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        }));
      } else {
        console.warn(`No meta data found for lesson ID: ${id}. Skipping.`);
      }
    });
    return newStages;
  }
  return stages;
};

const LevelStage1 = ({ navigation }) => {
  const levelType = 'Beginner'; // กำหนดระดับนี้
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelProgress, setLevelProgress] = useState([]);
  // Removed lesson3/lesson4 modal state (use navigation instead)
  
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

  // Stats are now handled by useUnifiedStats - no need for local fetch

  // Initialize new progress tracking services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        if (user?.id) {
          await gameProgressService.initialize(user.id);
          await levelUnlockService.initialize(user.id);
          await userStatsService.initialize(user.id);
          console.log('✅ Progress tracking services initialized for LevelStage1');
        }
      } catch (error) {
        console.error('❌ Error initializing services:', error);
      }
    };

    initializeServices();
  }, [user?.id]);

  // Real-time updates for user stats - now handled by useUnifiedStats
  useEffect(() => {
    if (hearts !== undefined && diamonds !== undefined) {
      console.log('🔄 LevelStage1 updated with unified stats:', {
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

  // ดึงข้อมูลบทเรียนเฉพาะระดับ Beginner
  const fetchStages = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting to fetch stages...');
      
      // Fetch unlock status from backend first
      if (user?.id) {
        try {
          const unlockedLevels = await unlockService.getUnlockedLevels(user.id);
          console.log('🔓 Fetched unlocked levels from backend:', unlockedLevels);
        } catch (error) {
          console.warn('⚠️ Could not fetch unlocks from backend:', error.message);
        }
      }
      
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
          level: lesson.level || 1,
          key: lesson.key || `lesson_${index}`,
          category: lesson.category || (lesson.lesson_id === 2 ? 'vowels' : 'consonants'),
          status: 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        }));

        if (!baseStages.some(stage => Number(stage.lesson_id) === 3)) {
          const lesson3Stage = applyCustomStageMeta({
            id: 'lesson3',
            lesson_id: 3,
            title: 'Lesson 3 - คำทักทาย',
            level: 'Beginner',
            key: 'lesson_greetings_3',
            category: 'greetings',
            status: 'locked',
            progress: 0,
            type: 'lottie',
            lottie: require('../assets/animations/stage_start.json'),
          });
          baseStages.splice(2, 0, lesson3Stage);
        }
        
        if (!baseStages.some(stage => Number(stage.lesson_id) === 4)) {
          const lesson4Stage = applyCustomStageMeta({
            id: 'lesson4',
            lesson_id: 4,
            title: 'Lesson 4 - สิ่งของรอบตัว',
            level: 'Beginner',
            key: 'lesson_objects_4',
            category: 'objects',
            status: 'locked',
            progress: 0,
            type: 'lottie',
            lottie: require('../assets/animations/stage_start.json'),
          });
          baseStages.splice(3, 0, lesson4Stage);
        }
        
        if (!baseStages.some(stage => Number(stage.lesson_id) === 5)) {
          const lesson5Stage = applyCustomStageMeta({
            id: 'lesson5',
            lesson_id: 5,
            title: 'Lesson 5 - ร่างกาย (Body Parts)',
            level: 'Beginner',
            key: 'lesson_body_5',
            category: 'body',
            status: 'locked',
            progress: 0,
            type: 'lottie',
            lottie: require('../assets/animations/stage_start.json'),
          });
          baseStages.splice(4, 0, lesson5Stage);
        }
        
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
                accuracy: levelProgress.accuracy ?? 0
              };
            }
            
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
        level: 'Beginner',
        key: `lesson_${index + 1}`,
        category: index === 1 ? 'vowels' : 'consonants',
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
            level: 1,
            key: `lesson_${index}`,
            category: index === 1 ? 'vowels' : 'consonants',
            status: 'locked', // เดี๋ยวค่อยคำนวณจริงหลังอ่าน progress
            progress: 0,      // 0..1
            type: 'lottie',
            lottie: require('../assets/animations/stage_start.json'),
          });
        }
        return applyCustomStageMeta({
          id: lesson?._id || `lesson_${index}`,
          lesson_id: lesson?.lesson_id || lesson?.order || index + 1,
          title: lesson?.title || lesson?.titleTH || `บทเรียน ${index + 1}`,
          level: lesson?.level || 1,
          key: lesson?.key || `lesson_${index}`,
          category: lesson?.category || (lesson?.lesson_id === 2 ? 'vowels' : 'consonants'),
          status: 'locked',   // ค่อยอัปเดตทีหลัง
          progress: 0,        // 0..1 จะคำนวณจริงทีหลัง
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'), // ใช้ stage_start animation
        });
      });

      if (!baseStages.some(stage => Number(stage.lesson_id) === 3)) {
        const lesson3Stage = applyCustomStageMeta({
          id: 'lesson3',
          lesson_id: 3,
          title: 'Lesson 3 - คำทักทาย',
          level: 'Beginner',
          key: 'lesson_greetings_3',
          category: 'greetings',
          status: 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        });
        baseStages.splice(2, 0, lesson3Stage);
      }
      
      if (!baseStages.some(stage => Number(stage.lesson_id) === 4)) {
        const lesson4Stage = applyCustomStageMeta({
          id: 'lesson4',
          lesson_id: 4,
          title: 'Lesson 4 - สิ่งของรอบตัว',
          level: 'Beginner',
          key: 'lesson_objects_4',
          category: 'objects',
          status: 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        });
        baseStages.splice(3, 0, lesson4Stage);
      }

      if (!baseStages.some(stage => Number(stage.lesson_id) === 5)) {
        const lesson5Stage = applyCustomStageMeta({
          id: 'lesson5',
          lesson_id: 5,
          title: 'Lesson 5 - ร่างกาย (Body Parts)',
          level: 'Beginner',
          key: 'lesson_body_5',
          category: 'body',
          status: 'locked',
          progress: 0,
          type: 'lottie',
          lottie: require('../assets/animations/stage_start.json'),
        });
        baseStages.splice(4, 0, lesson5Stage);
      }

      // ดึง progress ต่อบทเรียนแบบขนาน แล้วคำนวณสถานะ
      const withProgress = await Promise.all(
        baseStages.map(async (s) => {
          const p = await readLessonProgress(s.lesson_id);
          return { ...s, progress: p.progressRatio, _finished: p.finished, _accuracy: p.accuracy };
        })
      );

      // คำนวณ state ปลดล็อก:
      // - ด่านแรก: ปลดล็อกเสมอ (status = 'current' ถ้ายังไม่จบ, 'done' ถ้าจบแล้ว; progress แสดงจริง)
      // - ด่านถัดไป: ปลดล็อกได้ ถ้า "ด่านก่อนหน้า" ผ่านกฎ canUnlockNextByRule (≥70%)
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
          progress: Math.max(0, Math.min(1, accuracyPercent / 100)), // Convert to 0-1 range
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
      const basicStages = Array.from({ length: 10 }, (_, index) => ({
        id: `basic-${index + 1}`,
        lesson_id: index + 1,
        title: `บทเรียนที่ ${index + 1}`,
        level: 1,
        key: `lesson_${index + 1}`,
        status: index === 0 ? 'current' : 'locked',
        progress: 0,
        type: 'lottie',
        lottie: require('../assets/animations/stage_start.json'),
        unlockMessage: false,
      }));
      setStages(basicStages);
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
        colors={['#FF8C00', '#FFA500', '#FFB74D']}
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
        colors={['#FF8C00', '#FFA500', '#FFB74D']}
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
              <Text style={styles.levelText}>Level 1</Text>
              <Text style={styles.levelSubtext}>Beginner Level</Text>
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
                    
                    // Special case for lesson 1 - route to ConsonantStage1Game (ก-ฮ)
                    if (stage.lesson_id === 1) {
                      navigation.navigate('ConsonantStage1Game', {
                        lessonId: stage.lesson_id,
                        category: 'thai-consonants',
                        level: stage.level,
                        stageTitle: stage.title || 'พยัญชนะพื้นฐาน ก-ฮ',
                      });
                    // Special case for lesson 2 - route to Thai vowel game
                    } else if (stage.lesson_id === 2) {
                      navigation.navigate('VowelStage2Game', {
                        lessonId: stage.lesson_id,
                        category: 'vowels_basic',
                        level: stage.level,
                        stageTitle: stage.title || 'สระ 32 ตัว',
                        generator: 'lesson2_vowels',
                      });
                    } else if (stage.lesson_id === 3) {
                      navigation.navigate('GreetingStage3Game', {
                        lessonId: stage.lesson_id,
                        category: 'thai-greetings',
                        level: stage.level,
                        stageTitle: stage.title || 'คำทักทาย',
                      });
                    } else if (stage.lesson_id === 4) {
                      navigation.navigate('Lesson4ObjectsGame', {
                        lessonId: stage.lesson_id,
                        category: 'thai-objects',
                        level: stage.level,
                        stageTitle: stage.title || 'สิ่งของรอบตัว',
                      });
                    } else if (stage.lesson_id === 5) {
                      navigation.navigate('Lesson5BodyGame', {
                        lessonId: stage.lesson_id,
                        category: 'thai-body-parts',
                        level: stage.level,
                        stageTitle: stage.title || 'ร่างกาย (Body Parts)',
                      });
                    } else {
                      navigation.navigate('NewLessonGame', {
                        lessonId: stage.lesson_id, 
                        category: 'basic',
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
                      color="#FF8000"
                      bgColor="rgba(255, 255, 255, 0.28)"
                      shadowColor="#FF8000"
                      shadowOpacity={0.6}
                      shadowRadius={12}
                      gradient={true}
                      gradientColors={['#FF8000', '#FFA500', '#FFB74D']}
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
                <View style={[styles.stageChip, { borderColor: '#FFB74D' }]}>
                  <Text style={styles.stageChipText}>📈 ความคืบหน้า {Math.round(Math.max(0, Math.min(1, stage.progress || 0)) * 100)}%</Text>
                </View>
                {Number.isFinite(stage.accuracy) && (
                  <View style={[styles.stageChip, { borderColor: stage.accuracy >= 70 ? '#4CAF50' : '#FFA000' }]}>
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

      {/* Removed Lesson3/Lesson4 modal implementation */}
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
    borderColor: '#FF9800',
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
    shadowColor: '#FF9800', 
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
    borderColor: '#FFB74D' 
  },
  currentCircle: { 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderColor: '#FF9800' 
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
    borderColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  star: {
    fontSize: 16,
    color: '#FFD54F',
    textShadowColor: '#FF9800',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
export default LevelStage1;
