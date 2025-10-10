import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useUserDataSync } from '../hooks/useUserDataSync';
import UserDataSyncIndicator from '../components/UserDataSyncIndicator';

const UserDataSyncDemo = ({ navigation }) => {
  const {
    userData,
    isLoading,
    syncStatus,
    syncUserStats,
    updateUserStats,
    saveProgress,
    loadProgress,
    syncAllUserData,
    processSyncQueue,
    refreshUserData
  } = useUserDataSync();

  const [selectedLesson, setSelectedLesson] = useState('1');

  useEffect(() => {
    // Auto-sync when component mounts
    syncAllUserData();
  }, []);

  const handleUpdateHearts = async () => {
    const newHearts = Math.min(10, (userData?.hearts || 5) + 1);
    await updateUserStats({ hearts: newHearts });
  };

  const handleUpdateDiamonds = async () => {
    const newDiamonds = (userData?.diamonds || 0) + 10;
    await updateUserStats({ diamonds: newDiamonds });
  };

  const handleUpdateXP = async () => {
    const newXP = (userData?.xp || 0) + 50;
    await updateUserStats({ xp: newXP });
  };

  const handleSaveProgress = async () => {
    const progressData = {
      currentIndex: 5,
      total: 10,
      score: 85,
      xp: 25,
      perLetter: { 'ก': { correct: 3, total: 5 } }
    };
    
    await saveProgress(selectedLesson, progressData);
    Alert.alert('Success', 'Progress saved successfully!');
  };

  const handleLoadProgress = async () => {
    const progress = await loadProgress(selectedLesson);
    if (progress) {
      Alert.alert('Progress Loaded', `Lesson ${selectedLesson}: ${progress.score}% complete`);
    } else {
      Alert.alert('No Progress', 'No progress found for this lesson');
    }
  };

  const handleFullSync = async () => {
    const result = await syncAllUserData();
    if (result) {
      Alert.alert('Sync Complete', 'All user data synced successfully!');
    } else {
      Alert.alert('Sync Failed', 'Failed to sync user data');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading user data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Data Sync Demo</Text>
        <UserDataSyncIndicator syncStatus={syncStatus} />
      </View>

      {/* User Data Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current User Data</Text>
        <View style={styles.dataGrid}>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Hearts</Text>
            <Text style={styles.dataValue}>{userData?.hearts || 0}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Diamonds</Text>
            <Text style={styles.dataValue}>{userData?.diamonds || 0}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>XP</Text>
            <Text style={styles.dataValue}>{userData?.xp || 0}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Level</Text>
            <Text style={styles.dataValue}>{userData?.level || 1}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Streak</Text>
            <Text style={styles.dataValue}>{userData?.streak || 0}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Lessons</Text>
            <Text style={styles.dataValue}>{userData?.lessonsCompleted || 0}</Text>
          </View>
        </View>
      </View>

      {/* Stats Update Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Stats</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.button} onPress={handleUpdateHearts}>
            <Text style={styles.buttonText}>+1 Heart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleUpdateDiamonds}>
            <Text style={styles.buttonText}>+10 Diamonds</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleUpdateXP}>
            <Text style={styles.buttonText}>+50 XP</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Management</Text>
        <View style={styles.lessonSelector}>
          <Text style={styles.selectorLabel}>Lesson ID:</Text>
          <TouchableOpacity 
            style={styles.selectorButton}
            onPress={() => setSelectedLesson(selectedLesson === '1' ? '2' : '1')}
          >
            <Text style={styles.selectorText}>{selectedLesson}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.button} onPress={handleSaveProgress}>
            <Text style={styles.buttonText}>Save Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleLoadProgress}>
            <Text style={styles.buttonText}>Load Progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Controls</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.syncButton} onPress={handleFullSync}>
            <Text style={styles.syncButtonText}>Full Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.syncButton} onPress={processSyncQueue}>
            <Text style={styles.syncButtonText}>Process Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.syncButton} onPress={refreshUserData}>
            <Text style={styles.syncButtonText}>Refresh Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Status</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Online: {syncStatus.isOnline ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statusText}>
            Queue: {syncStatus.queueLength} items
          </Text>
          <Text style={styles.statusText}>
            Syncing: {syncStatus.syncInProgress ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lessonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  selectorButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  syncButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default UserDataSyncDemo;
