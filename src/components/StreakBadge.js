import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const StreakBadge = ({
  value = 0,
  label = 'วันติดต่อกัน',
  style,
  textStyle,
  labelStyle
}) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, [value]);

  return (
    <View style={[styles.badge, style]}>
      <View style={styles.iconWrap}>
        <LottieView
          ref={animationRef}
          source={require('../assets/animations/Streak-Fire1.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.value, textStyle]}>{value}</Text>
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 140,
  },
  iconWrap: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 28,
    height: 28,
  },
  content: {
    marginLeft: 12,
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF8C00',
    lineHeight: 26,
  },
  label: {
    fontSize: 13,
    color: '#FF8C00',
    marginTop: -4,
  },
});

export default StreakBadge;
