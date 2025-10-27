import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useUser } from './UserContext';
import { useUnifiedStats } from './UnifiedStatsContext';
import progressService from '../services/progressServicePerUser';
import { getXpProgress } from '../utils/leveling';

const ProgressContext = createContext(null);

const clampNumber = (value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY }) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
};

export const ProgressProvider = ({ children }) => {
  const { user } = useUser();
  const {
    stats,
    updateStats,
    forceRefresh,
    xp,
    diamonds,
    hearts,
    level,
    streak,
    maxStreak,
    totalTimeSpent,
    totalSessions,
    totalCorrectAnswers,
    totalWrongAnswers,
    averageAccuracy,
    loading: statsLoading
  } = useUnifiedStats();

  const [lessonProgress, setLessonProgress] = useState({});
  const [progressLoading, setProgressLoading] = useState(false);

  const loadUserProgress = useCallback(async () => {
    if (!user?.id) {
      setLessonProgress({});
      return;
    }

    setProgressLoading(true);
    try {
      const entries = await progressService.getAllUserProgress();
      const mapped = {};
      if (Array.isArray(entries)) {
        entries.forEach((entry) => {
          const key = entry.lessonId || entry._id || entry.id;
          if (key) {
            mapped[String(key)] = entry;
          }
        });
      }
      setLessonProgress(mapped);
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setProgressLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserProgress();
  }, [loadUserProgress]);

  useEffect(() => {
    if (stats?.progressByLesson && typeof stats.progressByLesson === 'object') {
      setLessonProgress(stats.progressByLesson);
    }
  }, [stats?.progressByLesson]);

  const applyDelta = useCallback(
    async (delta = {}) => {
      if (!user?.id) {
        console.warn('applyDelta skipped: no authenticated user');
        return stats;
      }

      const base = stats || {};
      const updates = {};

      if (delta.xp !== undefined) {
        const nextXp = Math.max(0, (base.xp || 0) + Number(delta.xp || 0));
        const xpSnapshot = getXpProgress(nextXp, base.level || 1);
        updates.xp = nextXp;
        updates.level = xpSnapshot.level;
        updates.nextLevelXP = xpSnapshot.requirement;
        updates.levelProgressPercent = xpSnapshot.percent;
      }

      if (delta.diamonds !== undefined) {
        updates.diamonds = Math.max(0, (base.diamonds || 0) + Number(delta.diamonds || 0));
      }

      if (delta.hearts !== undefined) {
        const currentHearts = Number.isFinite(base.hearts) ? base.hearts : 5;
        const maxHearts = Number.isFinite(base.maxHearts) ? base.maxHearts : 5;
        updates.hearts = clampNumber(currentHearts + Number(delta.hearts || 0), {
          min: 0,
          max: maxHearts
        });
      }

      if (delta.streak !== undefined) {
        updates.streak = Math.max(0, Number(delta.streak));
        const candidateMax = delta.maxStreak !== undefined
          ? Number(delta.maxStreak)
          : updates.streak;
        const resolvedMax = Number.isFinite(base.maxStreak) ? base.maxStreak : 0;
        updates.maxStreak = Math.max(resolvedMax, candidateMax);
      } else if (delta.maxStreak !== undefined) {
        const resolvedMax = Number.isFinite(base.maxStreak) ? base.maxStreak : 0;
        updates.maxStreak = Math.max(resolvedMax, Number(delta.maxStreak));
      }

      if (delta.finishedLesson) {
        updates.lessonsCompleted = (base.lessonsCompleted || 0) + 1;
      }

      if (delta.totalSessions !== undefined) {
        updates.totalSessions = Math.max(
          0,
          (base.totalSessions || 0) + Number(delta.totalSessions || 0)
        );
      } else if (delta.incrementSession) {
        updates.totalSessions = Math.max(0, (base.totalSessions || 0) + 1);
      } else if (totalSessions === undefined && base.totalSessions === undefined && delta.xp) {
        updates.totalSessions = 1;
      }

      const timeDelta =
        delta.totalTimeSpent !== undefined
          ? Number(delta.totalTimeSpent)
          : delta.timeSpentSec !== undefined
          ? Number(delta.timeSpentSec)
          : 0;
      if (timeDelta) {
        updates.totalTimeSpent = Math.max(0, (base.totalTimeSpent || 0) + timeDelta);
      }

      if (delta.totalCorrectAnswers !== undefined) {
        updates.totalCorrectAnswers = Math.max(
          0,
          (base.totalCorrectAnswers || 0) + Number(delta.totalCorrectAnswers || 0)
        );
      }

      if (delta.totalWrongAnswers !== undefined) {
        updates.totalWrongAnswers = Math.max(
          0,
          (base.totalWrongAnswers || 0) + Number(delta.totalWrongAnswers || 0)
        );
      }

      if (delta.lastGameResults) {
        updates.lastGameResults = delta.lastGameResults;
      }

      if (Object.keys(updates).length === 0) {
        return stats;
      }

      try {
        return await updateStats(updates);
      } catch (error) {
        console.error('Failed to apply progress delta:', error);
        throw error;
      }
    },
    [stats, updateStats, user?.id]
  );

  const addXP = useCallback((amount) => applyDelta({ xp: amount }), [applyDelta]);
  const addDiamonds = useCallback(
    (amount) => applyDelta({ diamonds: amount }),
    [applyDelta]
  );
  const addHearts = useCallback((amount) => applyDelta({ hearts: amount }), [applyDelta]);
  const loseHeart = useCallback(() => applyDelta({ hearts: -1 }), [applyDelta]);
  const gainHeart = useCallback(() => applyDelta({ hearts: 1 }), [applyDelta]);
  const spendDiamonds = useCallback(
    (amount) => applyDelta({ diamonds: -Math.abs(amount || 0) }),
    [applyDelta]
  );
  const updateStreak = useCallback(
    (value) =>
      applyDelta({
        streak: value,
        maxStreak: Math.max(value, maxStreak || 0)
      }),
    [applyDelta, maxStreak]
  );

  const updateProgress = useCallback(
    async (lessonId, payload = {}) => {
      if (!lessonId) {
        throw new Error('lessonId is required to update progress');
      }

      await progressService.saveProgress(lessonId, {
        ...payload,
        lessonId
      });

      setLessonProgress((prev) => ({
        ...prev,
        [String(lessonId)]: {
          ...(prev[String(lessonId)] || {}),
          ...payload,
          lessonId
        }
      }));
    },
    []
  );

  const getTotalXP = useCallback(() => Number.isFinite(xp) ? xp : 0, [xp]);
  const getCurrentLevel = useCallback(() => Number.isFinite(level) ? level : 1, [level]);
  const getCurrentStreak = useCallback(
    () => Number.isFinite(streak) ? streak : 0,
    [streak]
  );

  const getLevelProgressPercentage = useCallback(() => {
    const xpSnapshot = getXpProgress(getTotalXP(), getCurrentLevel());
    return clampNumber(xpSnapshot.percent, { min: 0, max: 100 });
  }, [getCurrentLevel, getTotalXP]);

  const getStatistics = useCallback(() => {
    const lessons = Object.values(lessonProgress);
    const completed = lessons.filter((entry) => entry.completed || entry.progress >= 100);
    return {
      totalLessons: lessons.length,
      completedLessons: completed.length,
      totalSessions: totalSessions ?? lessons.length,
      completedSessions: completed.length,
      accuracy: averageAccuracy ?? 0,
      timeSpent: (totalTimeSpent || 0) / 60 // minutes
    };
  }, [lessonProgress, totalSessions, averageAccuracy, totalTimeSpent]);

  const getRecentGames = useCallback(() => {
    const lastResult = stats?.lastGameResults;
    if (!lastResult) return [];
    return [
      {
        id: lastResult.completedAt || Date.now().toString(),
        title: lastResult.gameType || 'Lesson',
        description: 'ผลการเล่นล่าสุด',
        icon: 'gamepad-variant',
        color: '#FF6B6B',
        score: lastResult.correct || 0,
        accuracy: lastResult.accuracy || 0,
        completedAt: lastResult.completedAt
      }
    ];
  }, [stats?.lastGameResults]);

  const syncWithBackend = useCallback(async () => {
    await Promise.all([
      forceRefresh().catch((error) =>
        console.warn('Failed to refresh unified stats:', error?.message)
      ),
      loadUserProgress().catch((error) =>
        console.warn('Failed to reload lesson progress:', error?.message)
      )
    ]);
  }, [forceRefresh, loadUserProgress]);

  const userProgress = useMemo(() => {
    const totalXP = getTotalXP();
    const currentLevel = getCurrentLevel();
    const xpSnapshot = getXpProgress(totalXP, currentLevel);

    return {
      xp: totalXP,
      diamonds: Number.isFinite(diamonds) ? diamonds : 0,
      hearts: Number.isFinite(hearts) ? hearts : 5,
      level: xpSnapshot.level,
      streak: getCurrentStreak(),
      maxStreak: Number.isFinite(maxStreak) ? maxStreak : 0,
      lessonsCompleted: stats?.lessonsCompleted || 0,
      totalLessons: Object.keys(lessonProgress).length,
      totalTimeSpent: totalTimeSpent || 0,
      totalSessions: totalSessions || 0,
      totalCorrectAnswers: totalCorrectAnswers || 0,
      totalWrongAnswers: totalWrongAnswers || 0,
      accuracy: averageAccuracy || 0,
      levelProgress: xpSnapshot,
      nextLevelXP: xpSnapshot.requirement,
      xpToNextLevel: xpSnapshot.toNext
    };
  }, [
    averageAccuracy,
    diamonds,
    hearts,
    lessonProgress,
    maxStreak,
    stats?.lessonsCompleted,
    totalCorrectAnswers,
    totalSessions,
    totalTimeSpent,
    totalWrongAnswers,
    getCurrentLevel,
    getCurrentStreak,
    getTotalXP
  ]);

  const value = {
    user: userProgress,
    userProgress,
    progress: lessonProgress,
    hearts: userProgress.hearts,
    streak: userProgress.streak,
    xp: userProgress.xp,
    diamonds: userProgress.diamonds,
    level: userProgress.level,
    isLoading: statsLoading || progressLoading,
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
    applyDelta
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};
