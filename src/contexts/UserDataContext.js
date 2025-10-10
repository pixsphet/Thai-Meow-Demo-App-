// src/contexts/UserDataContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserDataSync from '../hooks/useUserDataSync';

const UserDataContext = createContext(null);

export const UserDataProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ดึง userId จากที่เก็บ (ปรับตามโปรเจกต์จริงของคุณ)
  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('auth_user_id');
        if (uid) {
          setUserId(uid);
          console.log('Loaded userId from storage:', uid);
        }
      } catch (error) {
        console.warn('Failed to load userId:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ใช้ enhanced hook
  const { 
    userData: stats, 
    updateUserStats, 
    forcePull, 
    flushQueue,
    loading: syncLoading, 
    error 
  } = useUserDataSync(userId);

  const handleUpdateUserStats = useCallback(async (delta) => {
    if (!userId) {
      console.warn('Cannot update stats: no userId');
      return;
    }
    console.log('Updating user stats:', delta);
    return updateUserStats(delta);
  }, [userId, updateUserStats]);

  const value = {
    userId,
    stats,                    // { xp, hearts, diamonds, level, ... }
    loading: loading || syncLoading,
    error,
    updateUserStats: handleUpdateUserStats,
    forcePull,               // Force sync from server
    flushQueue,              // Flush offline queue
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
