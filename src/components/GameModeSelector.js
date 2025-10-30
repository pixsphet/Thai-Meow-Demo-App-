import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GameModeSelector = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { levelId } = route.params || {};
  
  const [selectedMode, setSelectedMode] = useState(null);

  const gameModes = [
    {
      id: 'matching',
      title: 'Match',
      description: 'Match vocabulary with meanings',
      icon: 'puzzle',
      colors: ['#FF6B6B', '#FF8E8E'],
      difficulty: 'Easy',
    },
    {
      id: 'multiple-choice',
      title: 'Choose Answer',
      description: 'Select the correct answer from the choices',
      icon: 'format-list-bulleted',
      colors: ['#4ECDC4', '#6BCF7F'],
      difficulty: 'Medium',
    },
    {
      id: 'fill-blank',
      title: 'Fill Blank',
      description: 'Fill the missing word in the sentence',
      icon: 'pencil',
      colors: ['#FFD93D', '#FFA726'],
      difficulty: 'Hard',
    },
    {
      id: 'order',
      title: 'Order',
      description: 'Order words or sentences correctly',
      icon: 'sort',
      colors: ['#9C27B0', '#BA68C8'],
      difficulty: 'Medium',
    },
    {
      id: 'quiz',
      title: 'Quiz',
      description: 'Answer questions about Thai',
      icon: 'help-circle',
      colors: ['#607D8B', '#90A4AE'],
      difficulty: 'Hard',
    },
  ];

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    
    // Navigate to appropriate game screen based on levelId
    switch (levelId) {
      case 'thai-consonants':
        navigation.navigate('ConsonantLearn', { gameMode: mode.id });
        break;
      case 'thai-vowels':
        navigation.navigate('ThaiVowels', { gameMode: mode.id });
        break;
      case 'thai-tones':
        navigation.navigate('BeginnerVowelsStage', { gameMode: mode.id });
        break;
      default:
        navigation.navigate('ConsonantLearn', { gameMode: mode.id });
    }
  };

  const GameModeCard = ({ mode }) => (
    <TouchableOpacity 
      style={styles.gameModeCard}
      onPress={() => handleModeSelect(mode)}
    >
      <LinearGradient
        colors={mode.colors}
        style={styles.gameModeGradient}
      >
        <View style={styles.gameModeHeader}>
          <MaterialCommunityIcons name={mode.icon} size={32} color="white" />
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{mode.difficulty}</Text>
          </View>
        </View>
        
        <Text style={styles.gameModeTitle}>{mode.title}</Text>
        <Text style={styles.gameModeDescription}>{mode.description}</Text>
        
        <View style={styles.gameModeFooter}>
          <MaterialCommunityIcons name="play" size={20} color="white" />
          <Text style={styles.playText}>Start</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Choose game mode</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Select the game mode you want to play</Text>
        </View>

        <View style={styles.gameModes}>
          {gameModes.map((mode) => (
            <GameModeCard key={mode.id} mode={mode} />
          ))}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#666" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  gameModes: {
    paddingHorizontal: 20,
  },
  gameModeCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gameModeGradient: {
    padding: 20,
  },
  gameModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameModeTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gameModeDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  gameModeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  playText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
});

export default GameModeSelector;