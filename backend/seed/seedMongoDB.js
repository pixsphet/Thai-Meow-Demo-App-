const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Progress = require('../models/Progress');
const UserProgress = require('../models/UserProgress');
const UserStats = require('../models/UserStats');
const Player = require('../models/Player');
const GameResult = require('../models/GameResult');

const sampleUsers = [
  {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    petName: 'น้องเหมียว',
    level: 3,
    xp: 260,
    streak: 5,
    longestStreak: 12,
    hearts: 4,
    maxHearts: 5,
    diamonds: 18,
    lessonsCompleted: 6,
    lastActiveAt: new Date(Date.now() - 60 * 60 * 1000),
    totalSessions: 14,
    totalCorrectAnswers: 132,
    totalWrongAnswers: 18,
    averageAccuracy: 88,
    totalTimeSpent: 7200,
    rewardHistory: [
      {
        type: 'reward',
        xp: 50,
        diamonds: 3,
        hearts: 0,
        reason: 'daily_practice',
        source: 'lesson_complete',
        levelBefore: 2,
        levelAfter: 3,
      },
    ],
    totalXpEarned: 360,
    totalDiamondsEarned: 54,
    totalHeartsEarned: 12,
  },
  {
    username: 'demo',
    email: 'demo@example.com',
    password: 'demo123',
    petName: 'น้องแมว',
    level: 2,
    xp: 140,
    streak: 3,
    longestStreak: 5,
    hearts: 5,
    maxHearts: 6,
    diamonds: 24,
    lessonsCompleted: 4,
    lastActiveAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    totalSessions: 9,
    totalCorrectAnswers: 84,
    totalWrongAnswers: 15,
    averageAccuracy: 82,
    totalTimeSpent: 5400,
    rewardHistory: [
      {
        type: 'level_up',
        xp: 40,
        diamonds: 5,
        hearts: 1,
        reason: 'level_up',
        source: 'xp_system',
        levelBefore: 1,
        levelAfter: 2,
      },
    ],
    totalXpEarned: 210,
    totalDiamondsEarned: 38,
    totalHeartsEarned: 9,
  },
];

const lessonSeeds = [
  {
    title: 'พยัญชนะพื้นฐาน ก-ฮ',
    description: 'เรียนรู้พยัญชนะไทยพื้นฐาน 44 ตัว',
    category: 'consonants',
    level: 'Beginner',
    difficulty: 'easy',
    stageCount: 44,
    estimatedTime: 30,
    isActive: true,
  },
  {
    title: 'สระไทยพื้นฐาน',
    description: 'ฝึกอ่านและออกเสียงสระไทยที่ใช้บ่อย',
    category: 'vowels',
    level: 'Beginner',
    difficulty: 'medium',
    stageCount: 28,
    estimatedTime: 25,
    isActive: true,
  },
  {
    title: 'คำศัพท์สถานที่และการเดินทาง',
    description: 'ฝึกคำศัพท์เกี่ยวกับสถานที่และการเดินทาง',
    category: 'words',
    level: 'Intermediate',
    difficulty: 'medium',
    stageCount: 20,
    estimatedTime: 35,
    isActive: true,
  },
];

const buildStatsPayload = (user) => ({
  userId: user._id.toString(),
  level: user.level,
  xp: user.xp,
  nextLevelXp: Math.max(100, (user.level + 1) * 100),
  currentStreak: user.streak,
  bestStreak: user.longestStreak,
  lastLoginDate: user.lastActiveAt || new Date(),
  diamonds: user.diamonds,
  hearts: user.hearts,
  maxHearts: user.maxHearts,
  lessonsCompleted: user.lessonsCompleted,
  correctAnswers: user.totalCorrectAnswers,
  wrongAnswers: user.totalWrongAnswers,
  lastGameResults: {
    correct: 18,
    total: 20,
    accuracy: 90,
    timeSpent: 180,
    xpEarned: 60,
    diamondsEarned: 5,
    gameType: 'matching',
    completedAt: new Date(),
  },
});

const buildPlayerPayload = (user) => ({
  userId: user._id.toString(),
  displayName: user.username,
  levelInfo: {
    level: user.level,
    xp: user.xp,
    nextLevelXp: Math.max(100, (user.level + 1) * 100),
  },
  streak: {
    current: user.streak,
    best: user.longestStreak,
    lastLoginDate: user.lastActiveAt || new Date(),
  },
  wallet: {
    diamonds: user.diamonds,
    hearts: user.hearts,
    maxHearts: user.maxHearts,
  },
  totals: {
    lessonsCompleted: user.lessonsCompleted,
    correctAnswers: user.totalCorrectAnswers,
    wrongAnswers: user.totalWrongAnswers,
  },
});

const seedMongoDB = async (options = {}) => {
  const { mongoUri = process.env.MONGODB_URI, skipConnect = false } = options;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (!skipConnect) {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for core data seeding');
  }

  try {
    console.log('🌱 Starting Thai-Meow core data seeding...');

    await Promise.all([
      User.deleteMany({}),
      Lesson.deleteMany({}),
      Progress.deleteMany({}),
      UserProgress.deleteMany({}),
      UserStats.deleteMany({}),
      Player.deleteMany({}),
      GameResult.deleteMany({}),
    ]);
    console.log('🧹 Cleared existing core collections');

    const preparedUsers = [];
    for (const user of sampleUsers) {
      const { password, ...rest } = user;
      const passwordHash = await bcrypt.hash(password, 10);
      preparedUsers.push({ ...rest, passwordHash });
    }
    const users = await User.insertMany(preparedUsers);
    console.log(`👤 Seeded ${users.length} users`);

    const lessons = await Lesson.insertMany(
      lessonSeeds.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      }))
    );
    console.log(`📚 Seeded ${lessons.length} lessons`);

    for (const user of users) {
      await UserStats.findOneAndUpdate(
        { userId: user._id.toString() },
        buildStatsPayload(user),
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await Player.findOneAndUpdate(
        { userId: user._id.toString() },
        buildPlayerPayload(user),
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('📈 Seeded user stats and player profiles');

    const progressDocs = [];
    const userProgressDocs = [];
    const gameResultDocs = [];

    users.forEach((user, index) => {
      const lesson = lessons[index % lessons.length];
      const completedAt = new Date(Date.now() - index * 24 * 60 * 60 * 1000);

      progressDocs.push({
        userId: user._id.toString(),
        lessonId: lesson._id.toString(),
        category: lesson.category,
        currentIndex: lesson.stageCount,
        total: lesson.stageCount,
        hearts: Math.max(1, user.hearts - index),
        score: 420 + index * 30,
        xp: 160 + index * 40,
        progress: 100,
        accuracy: Math.max(75, 92 - index * 3),
        completed: true,
        completedAt,
        perLetter: { 'ก': { attempts: 5, correct: 5, incorrect: 0 } },
        answers: { question1: { userAnswer: 'ก', isCorrect: true } },
        questionsSnapshot: [
          {
            thai: 'ก',
            en: 'chicken',
            roman: 'gor',
            correctAnswer: 'ก',
          },
        ],
      });

      userProgressDocs.push({
        userId: user._id,
        lessonId: lesson._id.toString(),
        accuracy: Math.max(75, 92 - index * 3),
        score: 420 + index * 30,
        xpEarned: 160 + index * 40,
        diamondsEarned: user.diamonds,
        heartsRemaining: Math.max(1, user.hearts - index),
        timeSpentSec: 420 + index * 45,
        unlockedNext: true,
        completedAt,
      });

      gameResultDocs.push({
        userId: user._id,
        lessonKey: `lesson-${lesson._id.toString()}`,
        category: lesson.category,
        gameMode: 'matching',
        score: 18 - index,
        maxScore: 20,
        accuracy: 90 - index * 2,
        timeSpent: 185 + index * 15,
        questions: [
          {
            questionId: 'q1',
            question: 'Match the consonant ก with its sound',
            correctAnswer: 'gor-gai',
            userAnswer: 'gor-gai',
            isCorrect: true,
            timeSpent: 6,
            hintsUsed: 0,
          },
        ],
        difficulty: lesson.difficulty === 'hard' ? 'hard' : 'medium',
        xpGained: 60 + index * 10,
        achievements: [
          {
            id: 'perfect_start',
            name: 'Perfect Start',
            description: 'Completed a lesson with over 90% accuracy',
            icon: '🏅',
            xpReward: 30,
          },
        ],
        sessionData: {
          startTime: new Date(Date.now() - 20 * 60 * 1000),
          endTime: new Date(),
          deviceInfo: {
            platform: 'expo',
            version: '1.0.0',
          },
          location: {
            country: 'TH',
            city: 'Bangkok',
          },
        },
        isCompleted: true,
        isPerfect: index === 0,
        streak: user.streak,
        rank: index + 1,
        percentile: 85 - index * 5,
        feedback: {
          rating: 5 - index,
          comment: 'Great practice session!',
        },
      });
    });

    await Progress.insertMany(progressDocs);
    console.log(`🗂️ Seeded ${progressDocs.length} detailed progress records`);

    await UserProgress.insertMany(userProgressDocs);
    console.log(`📘 Seeded ${userProgressDocs.length} user progress summaries`);

    await GameResult.insertMany(gameResultDocs);
    console.log(`🎮 Seeded ${gameResultDocs.length} game result documents`);

    console.log('🎉 Core database seeding completed successfully!');

    return {
      users: users.length,
      lessons: lessons.length,
      progress: progressDocs.length,
      userProgress: userProgressDocs.length,
      gameResults: gameResultDocs.length,
    };
  } catch (error) {
    console.error('❌ Error seeding core database:', error);
    throw error;
  } finally {
    if (!skipConnect) {
      await mongoose.disconnect();
      console.log('🔌 Database connection closed');
    }
  }
};

if (require.main === module) {
  seedMongoDB()
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error('❌ Seeding process failed:', error);
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        console.error('⚠️ Failed to disconnect cleanly:', disconnectError);
      }
      process.exit(1);
    });
}

module.exports = seedMongoDB;
