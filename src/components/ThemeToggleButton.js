import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Animated,
  View,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggleButton = ({ style = {}, size = 'medium' }) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isDarkMode ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isDarkMode, animatedValue]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          width: 40,
          height: 40,
          toggleWidth: 48,
          toggleHeight: 24,
          iconSize: 14,
          knobSize: 20,
        };
      case 'large':
        return {
          width: 56,
          height: 56,
          toggleWidth: 72,
          toggleHeight: 36,
          iconSize: 18,
          knobSize: 32,
        };
      default: // medium
        return {
          width: 48,
          height: 48,
          toggleWidth: 60,
          toggleHeight: 30,
          iconSize: 16,
          knobSize: 26,
        };
    }
  };

  const config = getSizeConfig();

  const knobTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, config.toggleWidth - config.knobSize - 2],
  });

  const gradientColors = isDarkMode
    ? ['#5257E5', '#7B8CFF']
    : ['#FFB347', '#FFCC33'];

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          width: config.width,
          height: config.height,
          backgroundColor: theme.colors?.surface || '#fff',
          borderColor: theme.colors?.border || 'rgba(0,0,0,0.1)',
          shadowColor: theme.colors?.primary || '#FF8C00',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        style={[
          styles.toggleWrapper,
          {
            width: config.toggleWidth,
            height: config.toggleHeight,
            borderRadius: config.toggleHeight / 2,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="white-balance-sunny"
          size={config.iconSize}
          color="#fff"
          style={{ position: 'absolute', left: 4 }}
        />
        <MaterialCommunityIcons
          name="weather-night"
          size={config.iconSize}
          color="#fff"
          style={{ position: 'absolute', right: 4 }}
        />
        <Animated.View
          style={[
            styles.knob,
            {
              width: config.knobSize,
              height: config.knobSize,
              borderRadius: config.knobSize / 2,
              transform: [{ translateX: knobTranslate }],
            },
          ]}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toggleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  knob: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ThemeToggleButton;
