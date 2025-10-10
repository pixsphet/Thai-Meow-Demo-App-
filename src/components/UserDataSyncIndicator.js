import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const UserDataSyncIndicator = ({ syncStatus, onPress }) => {
  const { isOnline, queueLength, syncInProgress } = syncStatus;

  const getStatusColor = () => {
    if (syncInProgress) return '#FF8000'; // Orange for syncing
    if (!isOnline) return '#FF4444'; // Red for offline
    if (queueLength > 0) return '#FFAA00'; // Yellow for pending
    return '#00AA00'; // Green for synced
  };

  const getStatusText = () => {
    if (syncInProgress) return 'กำลังซิงค์...';
    if (!isOnline) return 'ออฟไลน์';
    if (queueLength > 0) return `รอซิงค์ ${queueLength} รายการ`;
    return 'ซิงค์แล้ว';
  };

  const getStatusIcon = () => {
    if (syncInProgress) return 'sync';
    if (!isOnline) return 'cloud-off';
    if (queueLength > 0) return 'cloud-queue';
    return 'cloud-done';
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <View style={styles.content}>
        {syncInProgress ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Icon name={getStatusIcon()} size={16} color="#FFFFFF" />
        )}
        <Text style={styles.text}>{getStatusText()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default UserDataSyncIndicator;
