// src/components/RealTimeStatsDemo.js
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useUserData } from '../contexts/UserDataContext';

/**
 * Demo component showing how to use the real-time user data sync system
 * This can be used in any screen to display and update user stats
 */
const RealTimeStatsDemo = () => {
  const { stats, updateUserStats, loading } = useUserData();

  const onCorrectAnswer = useCallback(() => {
    // Simulate correct answer: +10 XP, +1 streak, +1 diamond
    updateUserStats({ xp: 10, streak: 1, diamonds: 1 });
  }, [updateUserStats]);

  const onWrongAnswer = useCallback(() => {
    // Simulate wrong answer: -1 heart, reset streak
    updateUserStats({ hearts: -1, __set: { streak: 0 } });
  }, [updateUserStats]);

  const onLevelUp = useCallback(() => {
    // Simulate level up: +100 XP, +5 diamonds, +1 level
    updateUserStats({ 
      xp: 100, 
      diamonds: 5, 
      level: 1,
      __set: { hearts: 5 } // Refill hearts on level up
    });
  }, [updateUserStats]);

  if (loading) {
    return <Text style={styles.loadingText}>Loading stats...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-Time Stats Demo</Text>
      
      {/* Display current stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>XP: {stats?.xp || 0}</Text>
        <Text style={styles.statText}>Hearts: {stats?.hearts || 5}</Text>
        <Text style={styles.statText}>Diamonds: {stats?.diamonds || 0}</Text>
        <Text style={styles.statText}>Level: {stats?.level || 1}</Text>
        <Text style={styles.statText}>Streak: {stats?.streak || 0}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onCorrectAnswer}>
          <Text style={styles.buttonText}>✅ Simulate Correct Answer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={onWrongAnswer}>
          <Text style={styles.buttonText}>❌ Simulate Wrong Answer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={onLevelUp}>
          <Text style={styles.buttonText}>🎉 Simulate Level Up</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        Note: All stats update in real-time across all screens!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF8000',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default RealTimeStatsDemo;
