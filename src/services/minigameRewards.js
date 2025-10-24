import AsyncStorage from '@react-native-async-storage/async-storage';
// Stats updates should be done via UnifiedStatsContext in screens.

// Benchmark diamonds per heart based on Gem Shop pricing (between 1.25 and 1.43)
const DIAMONDS_PER_HEART = 1.35;

// Base hearts by difficulty
const BASE_HEARTS = {
  Easy: 3,
  Medium: 6,
  Hard: 10,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function computePerformanceMultiplier(metrics = {}) {
  let multiplier = 1.0;

  // Accuracy bonus
  if (typeof metrics.accuracy === 'number') {
    const acc = clamp(metrics.accuracy, 0, 100);
    if (acc >= 90) multiplier += 0.25;
    else if (acc >= 75) multiplier += 0.1;
    else if (acc < 50) multiplier -= 0.1;
  }

  // Time bonus: faster than target yields up to +20%
  if (Number.isFinite(metrics.timeUsed) && Number.isFinite(metrics.timeTarget) && metrics.timeTarget > 0) {
    const ratio = clamp(metrics.timeTarget / Math.max(metrics.timeUsed, 1), 0.5, 1.5);
    if (ratio > 1) {
      multiplier += clamp((ratio - 1) * 0.4, 0, 0.2); // up to +0.2
    } else if (ratio < 1) {
      multiplier -= clamp((1 - ratio) * 0.2, 0, 0.15); // up to -0.15
    }
  }

  // Score relative to target (+/- up to 20%)
  if (Number.isFinite(metrics.score) && Number.isFinite(metrics.scoreTarget) && metrics.scoreTarget > 0) {
    const sr = clamp(metrics.score / metrics.scoreTarget, 0, 2);
    if (sr > 1) multiplier += clamp((sr - 1) * 0.2, 0, 0.2);
    else if (sr < 1) multiplier -= clamp((1 - sr) * 0.2, 0, 0.2);
  }

  // Combo/streak light bonus
  if (Number.isFinite(metrics.maxCombo) && metrics.maxCombo >= 3) {
    multiplier += clamp((metrics.maxCombo - 2) * 0.02, 0, 0.1);
  }

  return clamp(multiplier, 0.8, 1.6);
}

export function calculateDiamondReward({ difficulty = 'Easy', metrics = {} } = {}) {
  const baseHearts = BASE_HEARTS[difficulty] || BASE_HEARTS.Easy;
  const perf = computePerformanceMultiplier(metrics);
  const hearts = Math.max(1, Math.round(baseHearts * perf));
  const diamonds = Math.max(1, Math.round(hearts * DIAMONDS_PER_HEART));
  return { heartsEquivalent: hearts, diamonds };
}

export async function awardDiamondsOnce({ gameId, difficulty = 'Easy', sessionId, metrics = {} }) {
  try {
    if (!gameId) throw new Error('gameId required');
    const sid = sessionId || String(Date.now());
    const key = `mg_awarded:${gameId}:${sid}`;
    const exists = await AsyncStorage.getItem(key);
    if (exists) {
      return { alreadyAwarded: true, diamonds: 0 };
    }

    const { diamonds } = calculateDiamondReward({ difficulty, metrics });

    // Do not mutate stats here; let screens update UnifiedStatsContext
    await AsyncStorage.setItem(key, '1');

    // log reward history
    await appendRewardLog({
      at: Date.now(),
      gameId,
      difficulty,
      diamonds,
      metrics,
    });

    return { alreadyAwarded: false, diamonds };
  } catch (err) {
    console.warn('[awardDiamondsOnce] failed:', err?.message || err);
    return { alreadyAwarded: false, diamonds: 0, error: err?.message || String(err) };
  }
}

const LOG_KEY = 'mg_rewards_log_v1';

async function appendRewardLog(entry) {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(entry);
    // keep only last 200 entries
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(0, 200)));
  } catch (e) {
    console.warn('[appendRewardLog] failed:', e?.message || e);
  }
}

export async function getRewardsHistory() {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export async function getRewardsTotal() {
  const list = await getRewardsHistory();
  return list.reduce((sum, r) => sum + (Number(r?.diamonds) || 0), 0);
}

export async function clearRewardsHistory() {
  await AsyncStorage.removeItem(LOG_KEY);
}

export default {
  calculateDiamondReward,
  awardDiamondsOnce,
  getRewardsHistory,
  getRewardsTotal,
  clearRewardsHistory,
};


