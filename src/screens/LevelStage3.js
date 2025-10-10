import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import ProgressRing from '../components/ProgressRing';
import lessonService from '../services/lessonService';

const { width } = Dimensions.get('window');
const ITEM_OFFSET = 65;

const LevelStage3 = ({ navigation }) => {
  const level = 'Advanced'; // กำหนดระดับนี้
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // ดึงข้อมูลบทเรียนเฉพาะระดับ Advanced
  const fetchStages = async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch stages...');
      
      // ใช้ lessonService เพื่อดึงข้อมูลจาก MongoDB
      const response = await lessonService.getLessonsByLevel('Advanced');
      
      if (!response.success) {
        throw new Error(`API error: ${response.message || 'Failed to fetch lessons'}`);
      }
      
      const data = response.data || response.lessons || [];
      console.log('Fetched stages data:', data);

      // กำหนด stage ปัจจุบัน (current)
      const currentStageIndex = 0; // stage แรกเป็น current

      const updatedStages = data.map((lesson, index) => {
        let status = 'locked';
        if (index === currentStageIndex) status = 'current';
        else if (index < currentStageIndex) status = 'done';
        else status = 'locked';

        return {
          id: lesson._id,
          lesson_id: lesson.lesson_id || lesson.order || index + 1,
          title: lesson.title || lesson.titleTH,
          level: lesson.level,
          key: lesson.key,
          status,
          progress: index === currentStageIndex ? 0 : 1, // progress เริ่มต้น
          type: 'lottie',
          lottie: require('../assets/animations/Star.json'), // ใช้ Star animation
        };
      });

      console.log('Updated stages:', updatedStages);
      setStages(updatedStages);
    } catch (error) {
      console.error('Error fetching stages:', error);
      
      // สร้างข้อมูล fallback สำหรับ 10 ด่าน
      const fallbackStages = Array.from({ length: 10 }, (_, index) => {
        let status = 'locked';
        if (index === 0) status = 'current';
        else if (index < 0) status = 'done';
        else status = 'locked';

        return {
          id: `fallback-${index + 1}`,
          lesson_id: index + 1,
          title: `บทเรียนที่ ${index + 1}`,
          level: 'Advanced',
          key: `lesson_${index + 1}`,
          status,
          progress: index === 0 ? 0 : 1,
          type: 'lottie',
          lottie: require('../assets/animations/Star.json'),
        };
      });
      
      console.log('Using fallback data:', fallbackStages);
      setStages(fallbackStages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

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

  // Loading Screen
  if (loading) {
    return (
      <LinearGradient
        colors={['#FF9800', '#FFB74D', '#FFCC80']}
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
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FF9800', '#FFB74D', '#FFCC80']}
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
              <View style={[styles.iconContainer, styles.completedIcon]}>
                <Text style={styles.completedIconText}>⭐</Text>
              </View>
              <View style={[styles.iconContainer, styles.completedIcon]}>
                <Text style={styles.completedIconText}>📖</Text>
              </View>
              <View style={[styles.iconContainer, styles.currentIcon]}>
                <Text style={styles.currentIconText}>📖</Text>
              </View>
              <View style={[styles.iconContainer, styles.lockedIcon]}>
                <Text style={styles.lockedIconText}>📚</Text>
              </View>
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
              disabled={stage.status === 'locked'}
              style={[
                styles.stageCircle,
                stage.status === 'done' && styles.doneCircle,
                stage.status === 'active' && styles.activeCircle,
                stage.status === 'current' && styles.currentCircle,
                stage.status === 'locked' && styles.lockedCircle,
              ]}
                  onPress={() => {
                    if (stage.status !== 'locked') {
                      // ไปที่เกมใหม่ NewLessonGame
                      console.log('Navigating to NewLessonGame with lessonId:', stage.lesson_id);
                      navigation.navigate('Game', { 
                        screen: 'NewLessonGame',
                        params: {
                          lessonId: stage.lesson_id, 
                          category: 'advanced',
                          level: stage.level,
                          stageTitle: stage.title 
                        }
                      });
                    }
                  }}
              activeOpacity={0.8}
            >
              <View style={styles.progressWrapper}>
                {stage.status === 'current' && (
                  <ProgressRing
                    progress={stage.progress || 0.67}
                    size={138}
                    strokeWidth={10}
                    color="#FF8000"
                    bgColor="#FFE0B2"
                  />
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
            </View>
          </Animated.View>
        ))
        )}
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
  progressIcons: {
    flexDirection: 'row',
    alignItems: 'center',
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
  completedIcon: {
    backgroundColor: '#FFD700',
  },
  currentIcon: {
    backgroundColor: '#FF9800',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  lockedIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  completedIconText: {
    fontSize: 20,
    color: '#B8860B',
  },
  currentIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  lockedIconText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderColor: '#4CAF50' 
  },
  activeCircle: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderColor: '#FFB74D' 
  },
  currentCircle: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
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
    color: 'rgba(255, 255, 255, 0.8)',
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
  starContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    color: '#FFD700',
    textShadowColor: '#FF9800',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    fontWeight: 'bold',
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

export default LevelStage3;
