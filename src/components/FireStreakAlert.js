import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FireStreakAlert = ({ visible, streak = 0, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fireAnimationRef = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const getStreakMessage = () => {
    if (streak >= 100) return '🔥 LEGENDARY STREAK! 🔥';
    if (streak >= 50) return '⭐ AMAZING STREAK! ⭐';
    if (streak >= 30) return '🎯 AWESOME STREAK! 🎯';
    if (streak >= 20) return '💪 GREAT STREAK! 💪';
    if (streak >= 10) return '✨ GOOD STREAK! ✨';
    if (streak >= 5) return '🌟 NICE STREAK! 🌟';
    return '🔥 FIRE STREAK! 🔥';
  };

  const getStreakColor = () => {
    if (streak >= 100) return ['#FF4444', '#FF6B6B', '#FF4444'];
    if (streak >= 50) return ['#FFD700', '#FFA500', '#FFD700'];
    if (streak >= 30) return ['#FF6B9D', '#FF8FAB', '#FF6B9D'];
    if (streak >= 20) return ['#4ECDC4', '#44B8A6', '#4ECDC4'];
    if (streak >= 10) return ['#00D4FF', '#0099FF', '#00D4FF'];
    if (streak >= 5) return ['#9D4EDD', '#BB86FC', '#9D4EDD'];
    return ['#FF6B35', '#FF8C42', '#FF6B35'];
  };

  const getStreakTier = () => {
    if (streak >= 100) return 'LEGENDARY';
    if (streak >= 50) return 'LEGENDARY';
    if (streak >= 30) return 'EPIC';
    if (streak >= 20) return 'RARE';
    if (streak >= 10) return 'UNCOMMON';
    return 'COMMON';
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.overlayTouchable}
          onPress={handleClose}
        >
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={getStreakColor()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              {/* Background animated elements */}
              <View style={styles.backgroundGlow} />

              {/* Top Fire Animation */}
              <View style={styles.fireTopContainer}>
                <LottieView
                  ref={fireAnimationRef}
                  source={require('../assets/animations/Streak-Fire1.json')}
                  autoPlay
                  loop
                  style={styles.fireAnimationTop}
                />
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* Streak Number */}
                <View style={styles.streakNumberContainer}>
                  <Text style={styles.streakNumber}>{streak}</Text>
                  <Text style={styles.streakLabel}>DAYS</Text>
                </View>

                {/* Message */}
                <Text style={styles.message}>{getStreakMessage()}</Text>

                {/* Tier Badge */}
                <View style={[styles.tierBadge, { opacity: 0.95 }]}>
                  <Text style={styles.tierText}>{getStreakTier()}</Text>
                </View>

                {/* Encouragement Text */}
                <Text style={styles.encouragement}>
                  {streak >= 100
                    ? 'ยอด! เทพสตรีก! 🏆'
                    : streak >= 50
                    ? 'เก่งมาก! ยังไงต่อไป! 💪'
                    : streak >= 30
                    ? 'อยู่ที่นี่! สืบต่อเลย! 🌟'
                    : streak >= 20
                    ? 'ทำได้ดี! ไม่หยุด! ✨'
                    : streak >= 10
                    ? 'วุ้ย! เก่งแล้ว! 🎯'
                    : streak >= 5
                    ? 'ดีเลย! ทำต่อไป! 🔥'
                    : 'ติดต่อกันต่อไป! 🚀'}
                </Text>
              </View>

              {/* Bottom Fire Animation */}
              <View style={styles.fireBottomContainer}>
                <LottieView
                  source={require('../assets/animations/Streak-Fire1.json')}
                  autoPlay
                  loop
                  style={styles.fireAnimationBottom}
                />
              </View>
            </LinearGradient>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 400,
  },
  card: {
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 15,
    overflow: 'hidden',
  },
  backgroundGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fireTopContainer: {
    height: 100,
    width: 100,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireAnimationTop: {
    width: 100,
    height: 100,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  streakNumberContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginTop: -4,
  },
  message: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  tierText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  encouragement: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  fireBottomContainer: {
    height: 80,
    width: 80,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireAnimationBottom: {
    width: 80,
    height: 80,
  },
  closeButton: {
    marginTop: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default FireStreakAlert;
