import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const result = await authService.getStoredUser();
      if (result.success) {
        setUser(result.user);
        console.log('✅ User loaded from storage:', result.user);
      } else {
        // Set fallback user for development
        const fallbackUser = {
          id: '68e6550e9b2f55ba8bead565',
          username: 'demo_user',
          email: 'demo@example.com',
          avatar: null
        };
        setUser(fallbackUser);
        console.log('ℹ️ No user data found, using fallback user:', fallbackUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Set fallback user even on error
      const fallbackUser = {
        id: '68e6550e9b2f55ba8bead565',
        username: 'demo_user',
        email: 'demo@example.com',
        avatar: null
      };
      setUser(fallbackUser);
      console.log('ℹ️ Error loading user, using fallback user:', fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      setUser(userData);
      // Token and user data are already stored by authService
      console.log('✅ User logged in:', userData);
      return { success: true };
    } catch (error) {
      console.error('Error logging in:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await authService.logout();
      console.log('✅ User logged out');
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Also update in AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      console.log('✅ User updated:', updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    setUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
