const User = require('../models/User');
const Player = require('../models/Player');
const UserStatsModel = require('../models/UserStats');
const Progress = require('../models/Progress');
const GameResult = require('../models/GameResult');

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toPositive = (value, fallback = 0) => {
  const num = toNumber(value, fallback);
  return num < 0 ? fallback : num;
};

const normalizeProgressValue = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value > 1) {
    return Math.min(1, value / 100);
  }
  if (value < 0) {
    return 0;
  }
  return value;
};

const mapGameResultSummary = (result) => {
  if (!result) return null;

  const correctCount = Array.isArray(result.questions)
    ? result.questions.filter((q) => q.isCorrect).length
    : toNumber(result.correctAnswers, 0);
  const totalQuestions = Array.isArray(result.questions)
    ? result.questions.length
    : toNumber(result.totalQuestions, 0);

  return {
    id: result._id?.toString(),
    lessonKey: result.lessonKey,
    category: result.category,
    gameMode: result.gameMode,
    score: toNumber(result.score, 0),
    maxScore: toNumber(result.maxScore, 0),
    xpEarned: toNumber(result.xpGained || result.xpEarned, 0),
    diamondsEarned: toNumber(result.diamondsEarned, 0),
    accuracy: toNumber(result.accuracy, 0),
    correct: correctCount,
    total: totalQuestions,
    timeSpent: toNumber(result.timeSpent, 0),
    completedAt: result.createdAt || result.sessionData?.endTime || new Date(),
  };
};

async function mergeLegacyStats(user) {
  if (!user) return null;

  const userIdStr = user._id.toString();
  let modified = false;

  const legacyStats = await UserStatsModel.findOne({ userId: userIdStr });
  if (legacyStats) {
    if (toNumber(user.xp) < toNumber(legacyStats.xp)) {
      user.xp = toNumber(legacyStats.xp);
      modified = true;
    }

    const legacyLevel = toNumber(legacyStats.level, 1);
    if (toNumber(user.level, 1) < legacyLevel) {
      user.level = legacyLevel;
      modified = true;
    }

    if (toNumber(user.diamonds) < toNumber(legacyStats.diamonds)) {
      user.diamonds = toNumber(legacyStats.diamonds);
      modified = true;
    }

    if (toNumber(user.hearts) < toNumber(legacyStats.hearts)) {
      user.hearts = toNumber(legacyStats.hearts);
      modified = true;
    }

    if (toNumber(user.maxHearts) < toNumber(legacyStats.maxHearts)) {
      user.maxHearts = toNumber(legacyStats.maxHearts);
      modified = true;
    }

    if (toNumber(user.streak) < toNumber(legacyStats.currentStreak)) {
      user.streak = toNumber(legacyStats.currentStreak);
      modified = true;
    }

    const bestStreak = toNumber(legacyStats.bestStreak);
    if (toNumber(user.longestStreak) < bestStreak) {
      user.longestStreak = bestStreak;
      modified = true;
    }
    if (toNumber(user.maxStreak) < bestStreak) {
      user.maxStreak = bestStreak;
      modified = true;
    }

    if (toNumber(user.lessonsCompleted) < toNumber(legacyStats.lessonsCompleted)) {
      user.lessonsCompleted = toNumber(legacyStats.lessonsCompleted);
      modified = true;
    }

    if (toNumber(user.totalSessions) < toNumber(legacyStats.totalSessions)) {
      user.totalSessions = toNumber(legacyStats.totalSessions);
      modified = true;
    }

    if (toNumber(user.totalCorrectAnswers) < toNumber(legacyStats.correctAnswers)) {
      user.totalCorrectAnswers = toNumber(legacyStats.correctAnswers);
      modified = true;
    }

    if (toNumber(user.totalWrongAnswers) < toNumber(legacyStats.wrongAnswers)) {
      user.totalWrongAnswers = toNumber(legacyStats.wrongAnswers);
      modified = true;
    }

    if (toNumber(user.totalTimeSpent) < toNumber(legacyStats.totalTimeSpent)) {
      user.totalTimeSpent = toNumber(legacyStats.totalTimeSpent);
      modified = true;
    }

    if (toNumber(user.averageAccuracy) < toNumber(legacyStats.accuracy)) {
      user.averageAccuracy = toNumber(legacyStats.accuracy);
      modified = true;
    }

    if (!user.lastGameResults && legacyStats.lastGameResults) {
      user.lastGameResults = legacyStats.lastGameResults;
      user.lastPlayed =
        legacyStats.lastGameResults.completedAt || user.lastPlayed || legacyStats.updatedAt;
      modified = true;
    }

    await UserStatsModel.deleteOne({ _id: legacyStats._id }).catch(() => {});
  }

  const legacyPlayer = await Player.findOne({ userId: userIdStr });
  if (legacyPlayer) {
    const playerLevel = toNumber(legacyPlayer.levelInfo?.level, 1);
    if (toNumber(user.level, 1) < playerLevel) {
      user.level = playerLevel;
      modified = true;
    }

    const playerXPWithinLevel = toNumber(legacyPlayer.levelInfo?.xp, 0);
    const playerXP =
      Math.max(playerLevel - 1, 0) * 100 + playerXPWithinLevel;
    if (toNumber(user.xp) < playerXP) {
      user.xp = playerXP;
      modified = true;
    }

    if (toNumber(user.diamonds) < toNumber(legacyPlayer.wallet?.diamonds)) {
      user.diamonds = toNumber(legacyPlayer.wallet?.diamonds);
      modified = true;
    }

    if (toNumber(user.hearts) < toNumber(legacyPlayer.wallet?.hearts)) {
      user.hearts = toNumber(legacyPlayer.wallet?.hearts);
      modified = true;
    }

    if (toNumber(user.maxHearts) < toNumber(legacyPlayer.wallet?.maxHearts)) {
      user.maxHearts = toNumber(legacyPlayer.wallet?.maxHearts);
      modified = true;
    }

    if (toNumber(user.streak) < toNumber(legacyPlayer.streak?.current)) {
      user.streak = toNumber(legacyPlayer.streak?.current);
      modified = true;
    }

    const playerBest = toNumber(legacyPlayer.streak?.best);
    if (toNumber(user.longestStreak) < playerBest) {
      user.longestStreak = playerBest;
      modified = true;
    }
    if (toNumber(user.maxStreak) < playerBest) {
      user.maxStreak = playerBest;
      modified = true;
    }

    if (toNumber(user.lessonsCompleted) < toNumber(legacyPlayer.totals?.lessonsCompleted)) {
      user.lessonsCompleted = toNumber(legacyPlayer.totals?.lessonsCompleted);
      modified = true;
    }

    if (toNumber(user.totalCorrectAnswers) < toNumber(legacyPlayer.totals?.correctAnswers)) {
      user.totalCorrectAnswers = toNumber(legacyPlayer.totals?.correctAnswers);
      modified = true;
    }

    if (toNumber(user.totalWrongAnswers) < toNumber(legacyPlayer.totals?.wrongAnswers)) {
      user.totalWrongAnswers = toNumber(legacyPlayer.totals?.wrongAnswers);
      modified = true;
    }

    await Player.deleteOne({ _id: legacyPlayer._id }).catch(() => {});
  }

  if (modified) {
    await user.save();
  }

  return user;
}

async function buildProgressSnapshot(userIdStr) {
  const progressDocs = await Progress.find({ userId: userIdStr }).lean();
  const progressByLesson = {};
  let lessonsCompleted = 0;

  progressDocs.forEach((doc) => {
    const progressValue = normalizeProgressValue(doc.progress);
    const completed =
      Boolean(doc.completed) ||
      progressValue >= 1 ||
      toNumber(doc.score) > 0 ||
      toNumber(doc.xp) > 0;

    if (completed) {
      lessonsCompleted += 1;
    }

    progressByLesson[doc.lessonId] = {
      lessonId: doc.lessonId,
      category: doc.category,
      progress: progressValue,
      score: toNumber(doc.score, 0),
      xp: toNumber(doc.xp, 0),
      accuracy: toNumber(doc.accuracy, 0),
      hearts: toNumber(doc.hearts, null),
      completed,
      updatedAt: doc.updatedAt,
    };
  });

  return {
    progressByLesson,
    lessonsCompleted,
    totalLessons: progressDocs.length,
  };
}

async function buildStatsDTO(user) {
  if (!user) return null;

  const userIdStr = user._id.toString();

  await mergeLegacyStats(user);

  const progressSnapshot = await buildProgressSnapshot(userIdStr);

  let userModified = false;
  if (toNumber(user.lessonsCompleted) !== progressSnapshot.lessonsCompleted) {
    user.lessonsCompleted = progressSnapshot.lessonsCompleted;
    userModified = true;
  }

  const latestGameResult = await GameResult.findOne({
    userId: user._id,
  })
    .sort({ createdAt: -1 })
    .lean()
    .catch(() => null);

  if (!user.lastGameResults && latestGameResult) {
    user.lastGameResults = mapGameResultSummary(latestGameResult);
    user.lastPlayed = user.lastGameResults?.completedAt || latestGameResult.createdAt;
    userModified = true;
  }

  if (toNumber(user.totalSessions) === 0) {
    const sessionsCount = await GameResult.countDocuments({
      userId: user._id,
    }).catch(() => 0);
    if (sessionsCount > 0) {
      user.totalSessions = sessionsCount;
      userModified = true;
    }
  }

  if (userModified) {
    await user.save();
  }

  const xpTotal = toNumber(user.xp, 0);
  const level = toNumber(user.level, Math.floor(xpTotal / 100) + 1);
  const xpWithinLevel = xpTotal % 100;

  return {
    userId: userIdStr,
    username: user.username,
    email: user.email,
    level,
    xp: xpTotal,
    xpProgress: {
      current: xpWithinLevel,
      nextLevel: 100,
      ratio: xpWithinLevel / 100,
    },
    nextLevelXp: (level) * 100,
    hearts: toNumber(user.hearts, 5),
    maxHearts: toNumber(user.maxHearts, 5),
    diamonds: toNumber(user.diamonds, 0),
    streak: toNumber(user.streak, 0),
    longestStreak: Math.max(
      toNumber(user.longestStreak, 0),
      toNumber(user.maxStreak, 0)
    ),
    accuracy: toNumber(user.averageAccuracy, 0),
    lessonsCompleted: progressSnapshot.lessonsCompleted,
    totalLessons: progressSnapshot.totalLessons,
    totalSessions: toNumber(user.totalSessions, 0),
    totalCorrectAnswers: toNumber(user.totalCorrectAnswers, 0),
    totalWrongAnswers: toNumber(user.totalWrongAnswers, 0),
    averageAccuracy: toNumber(user.averageAccuracy, 0),
    totalTimeSpent: toNumber(user.totalTimeSpent, 0),
    lastPlayed: user.lastPlayed,
    lastGameResults:
      user.lastGameResults || mapGameResultSummary(latestGameResult),
    badges: Array.isArray(user.badges) ? user.badges : [],
    achievements: Array.isArray(user.achievements) ? user.achievements : [],
    progressByLesson: progressSnapshot.progressByLesson,
  };
}

async function getUserWithMergedData(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  await mergeLegacyStats(user);
  return user;
}

async function getUserStatsSnapshot(userId) {
  const user = await getUserWithMergedData(userId);
  if (!user) {
    return null;
  }

  return buildStatsDTO(user);
}

function applyProgressToUser(user, update = {}) {
  if (!user) return;

  const now = new Date();

  if (update.xpGain !== undefined) {
    user.addXP(update.xpGain);
  }

  if (update.diamondsEarned !== undefined) {
    user.diamonds = toNumber(user.diamonds, 0) + toNumber(update.diamondsEarned, 0);
  }

  if (update.heartsLeft !== undefined) {
    const maxHearts = toNumber(user.maxHearts, 5);
    user.hearts = Math.max(
      0,
      Math.min(maxHearts, toNumber(update.heartsLeft, maxHearts))
    );
  }

  if (update.completedLesson) {
    user.lessonsCompleted = toNumber(user.lessonsCompleted, 0) + 1;
  }

  if (update.totalSessions !== undefined) {
    user.totalSessions = Math.max(0, toNumber(update.totalSessions));
  } else if (update.incrementSession || update.totalSessionsIncrement) {
    const increment = update.totalSessionsIncrement || 1;
    user.totalSessions = toNumber(user.totalSessions, 0) + increment;
  }

  if (update.correctAnswers !== undefined) {
    user.totalCorrectAnswers = toNumber(user.totalCorrectAnswers, 0) + toPositive(update.correctAnswers, 0);
  }

  if (update.wrongAnswers !== undefined) {
    user.totalWrongAnswers = toNumber(user.totalWrongAnswers, 0) + toPositive(update.wrongAnswers, 0);
  }

  const answeredIncrement =
    toPositive(update.correctAnswers, 0) + toPositive(update.wrongAnswers, 0);
  const totalAnswered =
    toNumber(user.totalCorrectAnswers, 0) + toNumber(user.totalWrongAnswers, 0);
  if (answeredIncrement > 0 && totalAnswered > 0) {
    user.averageAccuracy = Math.round(
      (toNumber(user.totalCorrectAnswers, 0) / totalAnswered) * 100
    );
  } else if (update.accuracy !== undefined) {
    user.averageAccuracy = toNumber(update.accuracy, user.averageAccuracy || 0);
  }

  if (update.timeSpent !== undefined) {
    user.totalTimeSpent =
      toNumber(user.totalTimeSpent, 0) + toPositive(update.timeSpent, 0);
  }

  if (update.streak !== undefined) {
    const streakValue = toNumber(update.streak, 0);
    user.streak = streakValue;
    user.longestStreak = Math.max(
      toNumber(user.longestStreak, 0),
      streakValue
    );
    user.maxStreak = Math.max(toNumber(user.maxStreak, 0), streakValue);
  }

  if (update.maxStreak !== undefined) {
    const maxStreakValue = toNumber(update.maxStreak, 0);
    user.longestStreak = Math.max(
      toNumber(user.longestStreak, 0),
      maxStreakValue
    );
    user.maxStreak = Math.max(toNumber(user.maxStreak, 0), maxStreakValue);
  }

  if (update.badges && Array.isArray(update.badges)) {
    user.badges = Array.from(new Set([...(user.badges || []), ...update.badges]));
  }

  if (update.achievements && Array.isArray(update.achievements)) {
    const existing = user.achievements || [];
    const existingIds = new Set(existing.map((item) => item?.id));
    update.achievements.forEach((achievement) => {
      if (achievement && achievement.id && !existingIds.has(achievement.id)) {
        existing.push(achievement);
        existingIds.add(achievement.id);
      }
    });
    user.achievements = existing;
  }

  if (update.lastGameResults) {
    user.lastGameResults = update.lastGameResults;
    if (update.lastGameResults.completedAt) {
      user.lastPlayed = new Date(update.lastGameResults.completedAt);
    } else {
      user.lastPlayed = now;
    }
  } else if (update.lastPlayed) {
    user.lastPlayed = new Date(update.lastPlayed);
  } else if (update.completedLesson) {
    user.lastPlayed = now;
  }
}

module.exports = {
  mergeLegacyStats,
  buildStatsDTO,
  getUserWithMergedData,
  getUserStatsSnapshot,
  applyProgressToUser,
  mapGameResultSummary,
};
