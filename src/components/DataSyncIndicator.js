// src/components/DataSyncIndicator.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dataSyncService from '../services/dataSyncService';

const DataSyncIndicator = ({ onPress }) => {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: false,
    syncInProgress: false,
    lastSyncTime: null
  });

  useEffect(() => {
    // Update sync status every 5 seconds
    const interval = setInterval(() => {
      const status = dataSyncService.getSyncStatus();
      setSyncStatus(status);
    }, 5000);

    // Initial status check
    const status = dataSyncService.getSyncStatus();
    setSyncStatus(status);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (syncStatus.syncInProgress) return '#FFA500'; // Orange - syncing
    if (syncStatus.isOnline) return '#4CAF50'; // Green - online
    return '#F44336'; // Red - offline
  };

  const getStatusIcon = () => {
    if (syncStatus.syncInProgress) return 'sync';
    if (syncStatus.isOnline) return 'wifi';
    return 'wifi-off';
  };

  const getStatusText = () => {
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.isOnline) return 'Online';
    return 'Offline';
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'Never synced';
    
    const lastSync = new Date(syncStatus.lastSyncTime);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSync) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just synced';
    if (diffMinutes < 60) return `Synced ${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Synced ${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Synced ${diffDays} days ago`;
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: getStatusColor() }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name={getStatusIcon()} 
        size={12} 
        color="#FFFFFF"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default DataSyncIndicator;

