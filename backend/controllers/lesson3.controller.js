const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');
const { getUserWithMergedData, applyProgressToUser, getUserStatsSnapshot } = require('../services/userStats');

let cachedLesson3 = null;

const loadLesson3Data = () => {
  if (cachedLesson3) {
    return cachedLesson3;
  }

  try {
    const filePath = path.join(__dirname, '..', 'seed', 'lesson3.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    cachedLesson3 = JSON.parse(raw);
  } catch (error) {
    console.error('❌ Failed to load lesson3.json:', error);
    cachedLesson3 = {
      lessonId: 'lesson3',
      title: 'Greetings',
      words: [],
      sentences: [],
      soundGroups: [],
    };
  }
  return cachedLesson3;
};

exports.getLesson3Vocab = async (req, res, next) => {
  try {
    const lessonData = loadLesson3Data();
    res.json({
      success: true,
      data: lessonData,
      source: 'static',
    });
  } catch (error) {
    next(error);
  }
};

exports.postLesson3Completion = async (req, res, next) => {
  try {
    const {
      userId,
      lessonId = 'lesson3',
      accuracy = 0,
      xpEarned = 0,
      diamondsEarned = 0,
      heartsRemaining = 0,
      timeSpentSec = 0,
      unlockedNext = false,
    } = req.body || {};

    const normalizedUserId = req.user?.id || userId;

    if (!normalizedUserId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
      });
    }

    const payload = {
      userId: mongoose.Types.ObjectId(normalizedUserId),
      lessonId,
      accuracy,
      score: Math.round((accuracy / 100) * 5),
      xpEarned,
      diamondsEarned,
      heartsRemaining,
      timeSpentSec,
      unlockedNext,
      completedAt: new Date(),
    };

    await UserProgress.create(payload);

    const user = await getUserWithMergedData(normalizedUserId);
    if (user) {
      applyProgressToUser(user, {
        xpGain: xpEarned,
        diamondsEarned,
        heartsLeft: heartsRemaining,
        completedLesson: true,
        incrementSession: true,
        accuracy: accuracy,
        timeSpent: timeSpentSec,
      });
      await user.save();
    }

    const stats = await getUserStatsSnapshot(normalizedUserId);

    res.json({
      success: true,
      message: 'Lesson 3 progress recorded',
      data: {
        progress: payload,
        stats,
      },
    });
  } catch (error) {
    console.error('❌ Failed to store lesson3 completion:', error);
    next(error);
  }
};
