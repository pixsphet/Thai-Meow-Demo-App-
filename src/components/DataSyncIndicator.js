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
    if (syncStatus.syncInProgress) return 'กำลังซิงค์...';
    if (syncStatus.isOnline) return 'ออนไลน์';
    return 'ออฟไลน์';
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'ยังไม่เคยซิงค์';
    
    const lastSync = new Date(syncStatus.lastSyncTime);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastSync) / (1000 * 60));
    
    if (diffMinutes < 1) return 'เพิ่งซิงค์';
    if (diffMinutes < 60) return `ซิงค์เมื่อ ${diffMinutes} นาทีที่แล้ว`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `ซิงค์เมื่อ ${diffHours} ชั่วโมงที่แล้ว`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `ซิงค์เมื่อ ${diffDays} วันที่แล้ว`;
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

