import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';
// import { apiService } from '../services/apiService'; // Using mock data for now

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const { user: authUser } = useUser();
  const currentUserId = authUser?.id || 'guest';
  const storageKey = useCallback((key) => `${key}:${currentUserId}`, [currentUserId]);

  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // User stats
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [level, setLevel] = useState(1);

  const resetState = useCallback(() => {
    setUser(null);
    setProgress({});
    setHearts(5);
    setStreak(0);
    setXp(0);
    setDiamonds(0);
    setLevel(1);
  }, []);

  const loadUserData = useCallback(async () => {
    if (!currentUserId) {
      resetState();
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      resetState();

      const userKey = storageKey('progress_user');
      const localUser = await AsyncStorage.getItem(userKey);
      if (localUser) {
        const userData = JSON.parse(localUser);
        setUser(userData);
        setHearts(userData.hearts || 5);
        setStreak(userData.streak || 0);
        setXp(userData.xp || 0);
        setDiamonds(userData.diamonds || 0);
        setLevel(userData.level || 1);
      }

      // Load progress data
      const progressKey = storageKey('progress_data');
      const localProgress = await AsyncStorage.getItem(progressKey);
      if (localProgress) {
        setProgress(JSON.parse(localProgress));
      }

      // Sync with backend
      await syncWithBackend();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, resetState, storageKey]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const syncWithBackend = async () => {
    try {
      if (typeof apiService === 'undefined') {
        return;
      }
      if (user) {
        // Sync user data
        const userData = await apiService.getUser(user.id);
        if (userData) {
          setUser(userData);
          setHearts(userData.hearts);
          setStreak(userData.streak);
          setXp(userData.xp);
          setDiamonds(userData.diamonds);
          setLevel(userData.level);
          
          // Save to local storage
          await AsyncStorage.setItem(storageKey('progress_user'), JSON.stringify(userData));
        }

        // Sync progress data
        const progressData = await apiService.getProgress(user.id);
        if (progressData) {
          setProgress(progressData);
          await AsyncStorage.setItem(storageKey('progress_data'), JSON.stringify(progressData));
        }
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
    }
  };

  const updateProgress = async (lessonKey, completed, score) => {
    try {
      const newProgress = {
        ...progress,
        [lessonKey]: {
          completed,
          score,
          lastPlayed: new Date().toISOString(),
        },
      };

      setProgress(newProgress);
      await AsyncStorage.setItem(storageKey('progress_data'), JSON.stringify(newProgress));

      // Update backend
      if (user) {
        await apiService.updateProgress(user.id, lessonKey, completed, score);
      }

      // Award XP and check for level up
      if (completed) {
        const xpGained = Math.floor(score / 10) + 10; // Base XP + bonus
        const newXp = xp + xpGained;
        setXp(newXp);
        
        // Check for level up
        const newLevel = Math.floor(newXp / 100) + 1;
        if (newLevel > level) {
          setLevel(newLevel);
          setDiamonds(diamonds + 5); // Reward for leveling up
        }

        // Update user data
        const updatedUser = {
          ...user,
          xp: newXp,
          level: newLevel,
          diamonds: diamonds + (newLevel > level ? 5 : 0),
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(storageKey('progress_user'), JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const loseHeart = () => {
    const newHearts = Math.max(0, hearts - 1);
    setHearts(newHearts);
    
    if (user) {
      const updatedUser = { ...user, hearts: newHearts };
      setUser(updatedUser);
      AsyncStorage.setItem(storageKey('progress_user'), JSON.stringify(updatedUser));
    }
  };

  const gainHeart = () => {
    const newHearts = Math.min(5, hearts + 1);
    setHearts(newHearts);
    
    if (user) {
      const updatedUser = { ...user, hearts: newHearts };
      setUser(updatedUser);
      AsyncStorage.setItem(storageKey('progress_user'), JSON.stringify(updatedUser));
    }
  };

  const updateStreak = (newStreak) => {
    setStreak(newStreak);
    
    if (user) {
      const updatedUser = { ...user, streak: newStreak };
      setUser(updatedUser);
      AsyncStorage.setItem(storageKey('progress_user'), JSON.stringify(updatedUser));
    }
  };

  const spendDiamonds = (amount) => {
    const newDiamonds = Math.max(0, diamonds - amount);
    setDiamonds(newDiamonds);
    
    if (user) {
      const updatedUser = { ...user, diamonds: newDiamonds };
      setUser(updatedUser);
      AsyncStorage.setItem(storageKey('progress_user'), JSON.stringify(updatedUser));
    }
  };

  // Helper functions for HomeScreen
  const getTotalXP = () => xp;
  const getCurrentLevel = () => level;
  const getCurrentStreak = () => streak;
  const getLevelProgressPercentage = () => {
    const currentLevelXp = (level - 1) * 100;
    const nextLevelXp = level * 100;
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.min(100, Math.max(0, progress));
  };
  const getStatistics = () => ({
    totalLessons: Object.keys(progress).length,
    completedLessons: Object.values(progress).filter(p => p.completed).length,
    totalGames: Object.keys(progress).length,
    completedGames: Object.values(progress).filter(p => p.completed).length,
    accuracy: 85, // Mock accuracy
    timeSpent: 120, // Mock time in minutes
  });
  const getRecentGames = () => [
    {
      id: '1',
      title: 'พยัญชนะ ก-ฮ',
      description: 'จับคู่พยัญชนะ',
      icon: 'alphabetical',
      color: '#FF6B6B',
      score: 85,
      completedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'สระไทย',
      description: 'เลือกคำตอบ',
      icon: 'format-letter-case',
      color: '#4ECDC4',
      score: 92,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const addXP = (amount) => {
    const newXp = xp + amount;
    setXp(newXp);
    
    // Check for level up
    const newLevel = Math.floor(newXp / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
      setDiamonds(diamonds + 5);
    }
    
    if (user) {
      const updatedUser = { ...user, xp: newXp, level: newLevel };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const addHearts = (amount) => {
    const newHearts = Math.min(5, hearts + amount);
    setHearts(newHearts);
    
    if (user) {
      const updatedUser = { ...user, hearts: newHearts };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const addDiamonds = (amount) => {
    const newDiamonds = diamonds + amount;
    setDiamonds(newDiamonds);
    
    if (user) {
      const updatedUser = { ...user, diamonds: newDiamonds };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    progress,
    hearts,
    streak,
    xp,
    diamonds,
    level,
    isLoading,
    updateProgress,
    loseHeart,
    gainHeart,
    updateStreak,
    spendDiamonds,
    syncWithBackend,
    getTotalXP,
    getCurrentLevel,
    getCurrentStreak,
    getLevelProgressPercentage,
    getStatistics,
    getRecentGames,
    addXP,
    addHearts,
    addDiamonds,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
