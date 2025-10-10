import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const ProgressRing = ({ 
  progress = 0, 
  size = 100, 
  strokeWidth = 8, 
  color = '#2196F3', 
  bgColor = '#E3F2FD',
  shadowColor = '#2196F3',
  shadowOpacity = 0.3,
  shadowRadius = 8,
  gradient = false,
  gradientColors = ['#FF6B35', '#FF8C00']
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <View style={{ 
      width: size, 
      height: size,
      shadowColor: shadowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: shadowOpacity,
      shadowRadius: shadowRadius,
      elevation: 8,
    }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          {gradient && (
            <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
              <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
            </LinearGradient>
          )}
        </Defs>
        
        {/* Background circle with subtle glow */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.6}
        />
        
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradient ? "url(#progressGradient)" : color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          opacity={0.9}
        />
      </Svg>
    </View>
  );
};

export default ProgressRing;
