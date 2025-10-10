// src/hooks/useUserDataSync.js
import { useEffect, useState, useCallback } from 'react';
import UserDataSync from '../services/userDataSync';

export default function useUserDataSync(userId) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsub = () => {};
    
    const initSync = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userId) {
          setLoading(false);
          return;
        }

        await UserDataSync.init(userId);
        unsub = UserDataSync.subscribe((data) => {
          setUserData(data);
          setLoading(false);
        });
      } catch (err) {
        console.error('Failed to initialize user data sync:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initSync();

    return () => {
      unsub();
    };
  }, [userId]);

  const updateUserStats = useCallback(async (delta) => {
    try {
      setError(null);
      return await UserDataSync.updateUserStats(delta);
    } catch (err) {
      console.error('Failed to update user stats:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  const forcePull = useCallback(async () => {
    try {
      setError(null);
      await UserDataSync.forcePull();
    } catch (err) {
      console.error('Failed to force pull:', err);
      setError(err.message);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    try {
      setError(null);
      await UserDataSync.flushQueue();
    } catch (err) {
      console.error('Failed to flush queue:', err);
      setError(err.message);
    }
  }, []);

  return { 
    userData, 
    updateUserStats, 
    forcePull, 
    flushQueue,
    loading, 
    error 
  };
}