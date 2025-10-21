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

    const numericAccuracy = Number.isFinite(Number(accuracy))
      ? Number(accuracy)
      : 0;
    const normalizedPayload = {
      lessonId,
      accuracy: numericAccuracy,
      score: Math.max(
        0,
        Math.min(5, Math.round((numericAccuracy / 100) * 5))
      ),
      xpEarned: Number.isFinite(Number(xpEarned)) ? Number(xpEarned) : 0,
      diamondsEarned: Number.isFinite(Number(diamondsEarned))
        ? Number(diamondsEarned)
        : 0,
      heartsRemaining: Number.isFinite(Number(heartsRemaining))
        ? Number(heartsRemaining)
        : 0,
      timeSpentSec: Number.isFinite(Number(timeSpentSec))
        ? Number(timeSpentSec)
        : 0,
      unlockedNext: Boolean(unlockedNext),
      completedAt: new Date(),
    };

    const isValidUserId = mongoose.Types.ObjectId.isValid(normalizedUserId);

    if (!isValidUserId) {
      console.warn(
        '[lesson3] Skipping persistence for non-ObjectId userId:',
        normalizedUserId
      );

      return res.json({
        success: true,
        message: 'Lesson 3 progress accepted (guest)',
        data: {
          progress: {
            ...normalizedPayload,
            userId: normalizedUserId || null,
            persisted: false,
          },
          stats: null,
          meta: {
            persisted: false,
            reason: 'invalid_user_id',
          },
        },
      });
    }

    const payload = {
      ...normalizedPayload,
      userId: new mongoose.Types.ObjectId(normalizedUserId),
    };

    await UserProgress.create(payload);

    const user = await getUserWithMergedData(normalizedUserId);
    if (user) {
      applyProgressToUser(user, {
        xpGain: payload.xpEarned,
        diamondsEarned: payload.diamondsEarned,
        heartsLeft: payload.heartsRemaining,
        completedLesson: true,
        incrementSession: true,
        accuracy: payload.accuracy,
        timeSpent: payload.timeSpentSec,
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
        meta: {
          persisted: true,
        },
      },
    });
  } catch (error) {
    console.error('❌ Failed to store lesson3 completion:', error);
    next(error);
  }
};
