export const XP_CONFIG = {
  baseRequirement: 100,
  growthRate: 1.15,
  roundingStep: 5,
  maxHearts: 10,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toFinite = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeLevel = (level) => Math.max(1, Math.floor(toFinite(level, 1)));

export function getXpRequirementForLevel(level) {
  const safeLevel = normalizeLevel(level);
  const index = safeLevel - 1;
  const scaled = XP_CONFIG.baseRequirement * Math.pow(XP_CONFIG.growthRate, index);
  const rounded = Math.round(scaled / XP_CONFIG.roundingStep) * XP_CONFIG.roundingStep;
  return Math.max(XP_CONFIG.baseRequirement, rounded);
}

export function getTotalXpBeforeLevel(level) {
  const safeLevel = normalizeLevel(level);
  if (safeLevel <= 1) return 0;
  let total = 0;
  for (let i = 1; i < safeLevel; i += 1) {
    total += getXpRequirementForLevel(i);
  }
  return total;
}

export function resolveLevelFromXp(totalXp, providedLevel) {
  const xpValue = toFinite(totalXp);
  let safeLevel = normalizeLevel(providedLevel);
  let accumulatedBefore = getTotalXpBeforeLevel(safeLevel);

  if (xpValue < accumulatedBefore) {
    safeLevel = 1;
    accumulatedBefore = 0;
    while (true) {
      const requirement = getXpRequirementForLevel(safeLevel);
      if (xpValue < accumulatedBefore + requirement) {
        break;
      }
      accumulatedBefore += requirement;
      safeLevel += 1;
    }
  }

  return { level: safeLevel, accumulatedBefore };
}

export function getXpProgress(totalXp, level) {
  const { level: safeLevel, accumulatedBefore } = resolveLevelFromXp(totalXp, level);
  const requirement = getXpRequirementForLevel(safeLevel);
  const withinRaw = Math.max(0, toFinite(totalXp) - accumulatedBefore);
  const withinClamped = clamp(withinRaw, 0, requirement);
  const ratio = requirement > 0 ? clamp(withinRaw / requirement, 0, 1) : 0;
  const percent = Math.round(ratio * 100);
  const toNext = Math.max(0, requirement - withinClamped);

  return {
    level: safeLevel,
    requirement,
    accumulatedBefore,
    withinRaw,
    withinClamped,
    ratio,
    percent,
    toNext,
  };
}

export function getLevelRewards(level) {
  const safeLevel = normalizeLevel(level);
  const hearts = 1 + Math.floor((safeLevel - 1) / 2);
  const diamonds = 8 + (safeLevel - 1) * 5;
  return { hearts, diamonds };
}
