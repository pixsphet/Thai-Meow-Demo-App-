/**
 * Unified Hearts Manager Hook
 * 
 * จัดการระบบหัวใจให้ตรงกันทุกหน้า:
 * - ดึงค่า hearts จาก UnifiedStatsContext (source of truth)
 * - Sync ออกไป UnifiedStats ทันทีเมื่อเปลี่ยนแปลง
 * - Sync เข้ามา local state เมื่อ UnifiedStats เปลี่ยน
 * - จัดการ edge cases และ race conditions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';

/**
 * Custom hook สำหรับจัดการ hearts ในเกม
 * 
 * @returns {Object} { hearts, setHearts, syncHearts, heartsRef }
 */
export const useGameHearts = () => {
  const { hearts: unifiedHearts, updateStats } = useUnifiedStats();
  
  // ใช้ UnifiedStats เป็นค่าเริ่มต้นเสมอ
  const initialHearts = Number.isFinite(unifiedHearts) ? unifiedHearts : 5;
  
  const [hearts, setHeartsState] = useState(initialHearts);
  const heartsRef = useRef(initialHearts);
  const isUpdatingRef = useRef(false);

  // Update local hearts
  const updateLocalHearts = useCallback((newHearts) => {
    const clamped = Math.max(0, Math.floor(newHearts));
    heartsRef.current = clamped;
    setHeartsState(clamped);
  }, []);

  // Sync hearts ไป UnifiedStats (debounced)
  const syncToUnifiedStats = useCallback(async (newHearts) => {
    if (isUpdatingRef.current) return;
    
    const clamped = Math.max(0, Math.floor(newHearts));
    
    // ถ้าค่าเท่าที่เก็บไว้ ไม่ต้อง sync ซ้ำ
    if (heartsRef.current === clamped) return;
    
    isUpdatingRef.current = true;
    
    try {
      updateLocalHearts(clamped);
      await updateStats({ hearts: clamped });
      console.log('✅ Hearts synced to UnifiedStats:', clamped);
    } catch (error) {
      console.warn('⚠️ Failed to sync hearts:', error?.message);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [updateLocalHearts, updateStats]);

  // Sync hearts จาก UnifiedStats
  useEffect(() => {
    if (Number.isFinite(unifiedHearts) && unifiedHearts !== heartsRef.current && !isUpdatingRef.current) {
      console.log('🔄 Syncing hearts from UnifiedStats:', unifiedHearts);
      updateLocalHearts(unifiedHearts);
    }
  }, [unifiedHearts, updateLocalHearts]);

  // Function สำหรับลดหัวใจ
  const loseHeart = useCallback((amount = 1) => {
    const newHearts = Math.max(0, heartsRef.current - amount);
    syncToUnifiedStats(newHearts);
  }, [syncToUnifiedStats]);

  // Function สำหรับเพิ่มหัวใจ
  const gainHeart = useCallback((amount = 1) => {
    const newHearts = heartsRef.current + amount;
    syncToUnifiedStats(newHearts);
  }, [syncToUnifiedStats]);

  // Function สำหรับตั้งค่า hearts ใหม่
  const setHearts = useCallback((newHearts) => {
    syncToUnifiedStats(newHearts);
  }, [syncToUnifiedStats]);

  return {
    hearts: heartsRef.current,
    heartsDisplay: hearts, // สำหรับ UI
    setHearts,
    loseHeart,
    gainHeart,
    syncHearts: syncToUnifiedStats,
    heartsRef,
  };
};

export default useGameHearts;





