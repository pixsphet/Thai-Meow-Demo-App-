import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';
import offlineService from '../services/offlineService';

const NetworkStatusSimple = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);
  const [showStatus, setShowStatus] = useState(false);
  const slideAnim = useState(new Animated.Value(-50))[0];

  useEffect(() => {
    // Simple network check using fetch
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        setIsOnline(true);
      } catch (error) {
        setIsOnline(false);
      }
    };

    // Check network status periodically
    const interval = setInterval(checkNetwork, 10000);
    checkNetwork();

    // Check pending actions periodically
    const checkPendingActions = () => {
      const status = offlineService.getOfflineStatus();
      setPendingActions(status.pendingActionsCount);
    };

    const pendingInterval = setInterval(checkPendingActions, 5000);
    checkPendingActions();

    return () => {
      clearInterval(interval);
      clearInterval(pendingInterval);
    };
  }, []);

  useEffect(() => {
    if (showStatus) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showStatus, slideAnim]);

  // Show status when offline or when there are pending actions
  useEffect(() => {
    if (!isOnline || pendingActions > 0) {
      setShowStatus(true);
      if (isOnline && pendingActions === 0) {
        setTimeout(() => setShowStatus(false), 3000);
      }
    } else {
      setShowStatus(false);
    }
  }, [isOnline, pendingActions]);

  const { isDarkMode } = useTheme();
  if (!showStatus) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: isOnline ? (isDarkMode ? '#1B5E20' : '#4CAF50') : (isDarkMode ? '#B71C1C' : '#F44336')
        }
      ]}
    >
      <View style={styles.content}>
        <FontAwesome 
          name={isOnline ? "wifi" : "wifi-slash"} 
          size={16} 
          color="white" 
        />
        <Text style={styles.text}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
        {!isOnline && pendingActions > 0 && (
          <Text style={styles.pendingText}>
            ({pendingActions} pending sync)
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
});

export default NetworkStatusSimple;
