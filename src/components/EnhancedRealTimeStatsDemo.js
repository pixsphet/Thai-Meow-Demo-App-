// src/components/EnhancedRealTimeStatsDemo.js
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useUserData } from '../contexts/UserDataContext';

/**
 * Enhanced demo component showing all advanced features of the real-time sync system
 * - Auto-reconnect with backoff
 * - Offline queue management
 * - Debounced updates
 * - Conflict resolution
 * - App state monitoring
 * - Network status monitoring
 */
const EnhancedRealTimeStatsDemo = () => {
  const { 
    stats, 
    updateUserStats, 
    forcePull, 
    flushQueue, 
    loading, 
    error 
  } = useUserData();
  
  const [networkStatus, setNetworkStatus] = useState('unknown');
  const [lastUpdate, setLastUpdate] = useState(null);

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      // This would be handled by the sync service internally
      setNetworkStatus('online'); // Simplified for demo
    };
    
    updateNetworkStatus();
  }, []);

  // Track last update time
  useEffect(() => {
    if (stats?.updatedAt) {
      setLastUpdate(new Date(stats.updatedAt).toLocaleTimeString());
    }
  }, [stats?.updatedAt]);

  const onCorrectAnswer = useCallback(async () => {
    try {
      setLastUpdate('Updating...');
      await updateUserStats({ xp: 10, streak: 1, diamonds: 1 });
      Alert.alert('Success', 'Stats updated! All screens will sync automatically.');
    } catch (err) {
      Alert.alert('Error', `Failed to update: ${err.message}`);
    }
  }, [updateUserStats]);

  const onWrongAnswer = useCallback(async () => {
    try {
      setLastUpdate('Updating...');
      await updateUserStats({ hearts: -1, __set: { streak: 0 } });
      Alert.alert('Success', 'Stats updated! Hearts decreased, streak reset.');
    } catch (err) {
      Alert.alert('Error', `Failed to update: ${err.message}`);
    }
  }, [updateUserStats]);

  const onLevelUp = useCallback(async () => {
    try {
      setLastUpdate('Updating...');
      await updateUserStats({ 
        xp: 100, 
        diamonds: 5, 
        level: 1,
        __set: { hearts: 5 } // Refill hearts on level up
      });
      Alert.alert('Level Up!', 'Congratulations! All stats updated across all screens.');
    } catch (err) {
      Alert.alert('Error', `Failed to update: ${err.message}`);
    }
  }, [updateUserStats]);

  const onForceSync = useCallback(async () => {
    try {
      setLastUpdate('Syncing...');
      await forcePull();
      Alert.alert('Sync Complete', 'Latest data pulled from server.');
    } catch (err) {
      Alert.alert('Sync Error', `Failed to sync: ${err.message}`);
    }
  }, [forcePull]);

  const onFlushQueue = useCallback(async () => {
    try {
      setLastUpdate('Flushing...');
      await flushQueue();
      Alert.alert('Queue Flushed', 'All pending updates sent to server.');
    } catch (err) {
      Alert.alert('Flush Error', `Failed to flush: ${err.message}`);
    }
  }, [flushQueue]);

  const onSimulateOffline = useCallback(async () => {
    // Simulate multiple updates while "offline"
    for (let i = 0; i < 5; i++) {
      await updateUserStats({ xp: 5, diamonds: 1 });
    }
    Alert.alert('Offline Simulation', '5 updates queued. They will sync when online.');
  }, [updateUserStats]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading enhanced sync system...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enhanced Real-Time Sync Demo</Text>
      
      {/* Status Indicators */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Network:</Text>
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.statusText}>Online</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Sync Status:</Text>
          <View style={[styles.statusDot, { 
            backgroundColor: error ? '#F44336' : '#4CAF50' 
          }]} />
          <Text style={styles.statusText}>
            {error ? 'Error' : 'Connected'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Last Update:</Text>
          <Text style={styles.statusText}>{lastUpdate || 'Never'}</Text>
        </View>
      </View>

      {/* Current Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Real-Time Stats</Text>
        <Text style={styles.statText}>XP: {stats?.xp || 0}</Text>
        <Text style={styles.statText}>Hearts: {stats?.hearts || 5}</Text>
        <Text style={styles.statText}>Diamonds: {stats?.diamonds || 0}</Text>
        <Text style={styles.statText}>Level: {stats?.level || 1}</Text>
        <Text style={styles.statText}>Streak: {stats?.streak || 0}</Text>
        <Text style={styles.statText}>Max Streak: {stats?.maxStreak || 0}</Text>
        <Text style={styles.statText}>Accuracy: {stats?.accuracy || 0}%</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onCorrectAnswer}>
          <Text style={styles.buttonText}>✅ Correct Answer (+10 XP)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={onWrongAnswer}>
          <Text style={styles.buttonText}>❌ Wrong Answer (-1 Heart)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={onLevelUp}>
          <Text style={styles.buttonText}>🎉 Level Up (+100 XP)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.syncButton]} onPress={onForceSync}>
          <Text style={styles.buttonText}>🔄 Force Sync</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.syncButton]} onPress={onFlushQueue}>
          <Text style={styles.buttonText}>📤 Flush Queue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.offlineButton]} onPress={onSimulateOffline}>
          <Text style={styles.buttonText}>📱 Simulate Offline</Text>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Sync Error: {error}</Text>
        </View>
      )}

      {/* Feature List */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Advanced Features:</Text>
        <Text style={styles.featureText}>• Auto-reconnect with exponential backoff</Text>
        <Text style={styles.featureText}>• Offline queue with automatic flush</Text>
        <Text style={styles.featureText}>• Debounced updates (600ms throttle)</Text>
        <Text style={styles.featureText}>• Conflict resolution (last-write-wins)</Text>
        <Text style={styles.featureText}>• App state monitoring (background/foreground)</Text>
        <Text style={styles.featureText}>• Network status monitoring</Text>
        <Text style={styles.featureText}>• Real-time updates across all screens</Text>
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 100,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF8000',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  syncButton: {
    backgroundColor: '#2196F3',
  },
  offlineButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
  },
  featuresContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  featureText: {
    fontSize: 12,
    color: '#2e7d32',
    marginBottom: 2,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default EnhancedRealTimeStatsDemo;
