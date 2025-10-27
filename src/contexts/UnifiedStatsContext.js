// src/contexts/UnifiedStatsContext.js
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from './UserContext';
import { useUserData } from './UserDataContext';
import dailyStreakService from '../services/dailyStreakService';
import realUserStatsService from '../services/realUserStatsService';
import { getXpProgress } from '../utils/leveling';

const UnifiedStatsContext = createContext(null);

export const UnifiedStatsProvider = ({ children }) => {
  const { user } = useUser();
  const { stats: userData } = useUserData();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const statsRef = useRef(null);

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
        console.log('⚠️ No user ID available, initializing guest stats');
        await realUserStatsService.initialize(null);
        const guestStats = await realUserStatsService.getUserStats();
        setStats(guestStats);
        setLoading(false);
      }
    };

    initializeService();
  }, [user?.id]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

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
      const updatedStats = await realUserStatsService.updateUserStats(updates);
      setStats(updatedStats);
      return updatedStats;
    } catch (err) {
      console.error('❌ Error updating stats:', err);
      setError(err);
      throw err;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    const handleStreakUpdate = async (snapshot) => {
      if (!snapshot || typeof snapshot.streak !== 'number') {
        return;
      }
      if (snapshot.userId && snapshot.userId !== user.id) {
        return;
      }

      const prevStats = statsRef.current || {};
      const prevStreak = Number.isFinite(prevStats?.streak) ? prevStats.streak : 0;
      const prevMax = Number.isFinite(prevStats?.maxStreak) ? prevStats.maxStreak : 0;
      const snapshotMax = Number.isFinite(snapshot.maxStreak) ? snapshot.maxStreak : 0;
      const computedMax = Math.max(prevMax, snapshotMax, snapshot.streak);
      const lastPlayed =
        snapshot.lastPlayDate ||
        prevStats.lastPlayed ||
        prevStats.lastUpdated ||
        new Date().toISOString();

      if (prevStreak === snapshot.streak && prevMax >= computedMax) {
        return;
      }

      try {
        await updateStats({
          streak: snapshot.streak,
          maxStreak: computedMax,
          lastPlayed
        });
      } catch (err) {
        console.warn('⚠️ Failed to sync streak stats:', err?.message);
        setStats(prev => {
          const safePrev = prev || {};
          const merged = {
            ...safePrev,
            userId: safePrev.userId || user?.id || snapshot.userId || null,
            streak: snapshot.streak,
            maxStreak: computedMax,
            lastPlayed
          };
          realUserStatsService.saveLocalStats(merged).catch(() => {});
          return merged;
        });
      }
    };

    const unsubscribe = dailyStreakService.subscribe(handleStreakUpdate);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.id, updateStats]);

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

  const xpProgress = stats ? getXpProgress(stats.xp || 0, stats.level || 1) : getXpProgress(0, 1);

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
    hearts: Number.isFinite(stats?.hearts) ? stats.hearts : 0,
    level: xpProgress.level,
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
    progressByLesson: stats?.progressByLesson || {},
    
    // Level progress
    levelProgress: {
      currentLevel: xpProgress.level,
      currentLevelXP: xpProgress.withinClamped,
      progress: xpProgress.ratio,
      percent: xpProgress.percent,
      nextLevelXP: xpProgress.requirement,
      toNext: xpProgress.toNext,
    },
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
