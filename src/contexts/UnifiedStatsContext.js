// src/contexts/UnifiedStatsContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from './UserContext';
import { useUserData } from './UserDataContext';
import realUserStatsService from '../services/realUserStatsService';
import dailyStreakService from '../services/dailyStreakService';

const UnifiedStatsContext = createContext(null);

export const UnifiedStatsProvider = ({ children }) => {
  const { user } = useUser();
  const { stats: userData } = useUserData();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize service when user changes
  useEffect(() => {
    const initializeService = async () => {
      console.log('🔄 UnifiedStatsContext: user changed:', user);
      if (user?.id) {
        try {
          setLoading(true);
          setError(null);
          
          console.log('🔧 Initializing realUserStatsService with user ID:', user.id);
          dailyStreakService.setUser(user.id);
          await realUserStatsService.initialize(user.id);
          
          // Load initial stats
          const initialStats = await realUserStatsService.getUserStats();
          let mergedStats = initialStats;

          try {
            const currentStreak = await dailyStreakService.getCurrentStreak();
            if (typeof currentStreak === 'number') {
              mergedStats = {
                ...initialStats,
                streak: currentStreak,
              };
              await realUserStatsService.saveLocalStats(mergedStats);
            }
          } catch (streakErr) {
            console.warn('⚠️ Failed to load daily streak:', streakErr?.message);
          }

          setStats(mergedStats);
          
          console.log('✅ UnifiedStatsContext initialized for user:', user.id, 'stats:', mergedStats);
        } catch (err) {
          console.error('❌ Error initializing UnifiedStatsContext:', err);
          setError(err);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('⚠️ No user ID available, setting stats to null');
        setStats(null);
        setLoading(false);
      }
    };

    initializeService();
  }, [user?.id]);

  // Sync with userData from UserDataContext
  useEffect(() => {
    if (userData) {
      console.log('🔄 UnifiedStatsContext: syncing with userData:', userData);
      setStats(prevStats => ({
        ...prevStats,
        xp: userData.xp || 0,
        diamonds: userData.diamonds || 0,
        hearts: userData.hearts || 5,
        level: userData.level || 1,
        streak: userData.streak || 0,
        accuracy: userData.accuracy || 0,
        totalTimeSpent: userData.totalTimeSpent || 0,
        lastPlayed: userData.lastPlayed || null,
        lastGameResults: userData.lastGameResults || null,
      }));
    }
  }, [userData]);

  // Update stats function
  const updateStats = useCallback(async (updates) => {
    try {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      const updatedStats = await realUserStatsService.updateUserStats(updates);
      setStats(updatedStats);
      return updatedStats;
    } catch (err) {
      console.error('❌ Error updating stats:', err);
      setError(err);
      throw err;
    }
  }, [user?.id]);

  // Update from game session
  const updateFromGameSession = useCallback(async (sessionData) => {
    try {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      const updatedStats = await realUserStatsService.updateFromGameSession(sessionData);
      setStats(updatedStats);
      return updatedStats;
    } catch (err) {
      console.error('❌ Error updating from game session:', err);
      setError(err);
      throw err;
    }
  }, [user?.id]);

  // Force refresh from server
  const forceRefresh = useCallback(async () => {
    try {
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      const refreshedStats = await realUserStatsService.forceSync();
      setStats(refreshedStats);
      return refreshedStats;
    } catch (err) {
      console.error('❌ Error force refreshing stats:', err);
      setError(err);
      throw err;
    }
  }, [user?.id]);

  // Get stats summary
  const getStatsSummary = useCallback(() => {
    return stats;
  }, [stats]);

  // Check if stats are loaded
  const isStatsLoaded = useCallback(() => {
    return stats !== null;
  }, [stats]);

  // Set online status
  const setOnlineStatus = useCallback((isOnline) => {
    realUserStatsService.isOnline = isOnline;
  }, []);

  const value = {
    // Core data
    stats,
    loading,
    error,
    
    // Actions
    updateStats,
    updateFromGameSession,
    forceRefresh,
    getStatsSummary,
    isStatsLoaded,
    setOnlineStatus,
    
    // Computed values for easy access
    xp: stats?.xp || 0,
    diamonds: stats?.diamonds || 0,
    hearts: stats?.hearts || 5,
    level: stats?.level || 1,
    streak: stats?.streak || 0,
    maxStreak: stats?.maxStreak || 0,
    accuracy: stats?.accuracy || 0,
    totalTimeSpent: stats?.totalTimeSpent || 0,
    totalSessions: stats?.totalSessions || 0,
    totalCorrectAnswers: stats?.totalCorrectAnswers || 0,
    totalWrongAnswers: stats?.totalWrongAnswers || 0,
    averageAccuracy: stats?.averageAccuracy || 0,
    lastPlayed: stats?.lastPlayed || null,
    achievements: stats?.achievements || [],
    badges: stats?.badges || [],
    
    // Level progress
    levelProgress: stats ? {
      currentLevel: stats.level || 1,
      currentLevelXP: (stats.xp || 0) % 100,
      progress: ((stats.xp || 0) % 100) / 100,
      nextLevelXP: 100
    } : {
      currentLevel: 1,
      currentLevelXP: 0,
      progress: 0,
      nextLevelXP: 100
    }
  };

  return (
    <UnifiedStatsContext.Provider value={value}>
      {children}
    </UnifiedStatsContext.Provider>
  );
};

export const useUnifiedStats = () => {
  const context = useContext(UnifiedStatsContext);
  if (!context) {
    throw new Error('useUnifiedStats must be used within a UnifiedStatsProvider');
  }
  return context;
};
