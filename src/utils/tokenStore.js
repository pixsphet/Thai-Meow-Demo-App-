import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const getCurrentUserId = async () => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user).id : null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

export const setToken = async (token) => {
  try {
    if (!token) {
      console.warn('⚠️ [TOKEN] Attempted to set null/undefined token, removing instead');
      await AsyncStorage.removeItem('authToken');
      return;
    }
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

