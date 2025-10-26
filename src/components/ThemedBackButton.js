import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const ThemedBackButton = ({ onPress, style, iconColor, size = 22, variant = 'ghost' }) => {
  const { theme, isDarkMode } = useTheme();

  const containerStyle = [
    styles.button,
    variant === 'solid' ? { backgroundColor: theme.card } : { backgroundColor: 'rgba(255,255,255,0.18)' },
    isDarkMode && variant === 'ghost' ? { backgroundColor: 'rgba(255,255,255,0.14)' } : null,
    style,
  ];

  const color = iconColor || theme.colors?.white || '#FFFFFF';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={containerStyle}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="arrow-left" size={size} color={color} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemedBackButton;


