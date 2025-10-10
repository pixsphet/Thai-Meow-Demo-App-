import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for development without MongoDB connection
const mockUsers = [
  {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    petName: 'Fluffy',
    hearts: 5,
    diamonds: 10,
    xp: 150,
    level: 2,
    streak: 3,
    progress: new Map(),
    achievements: [],
    settings: {
      soundEnabled: true,
      notificationsEnabled: true,
      language: 'th'
    }
  },
  {
    id: '2',
    username: 'testuser7',
    email: 'test7@example.com',
    petName: 'Fluffy7',
    hearts: 5,
    diamonds: 0,
    xp: 0,
    level: 1,
    streak: 0,
    progress: new Map(),
    achievements: [],
    settings: {
      soundEnabled: true,
      notificationsEnabled: true,
      language: 'th'
    }
  }
];

const mockVocabularies = [
  // Consonants
  { id: '1', thai: 'ก', roman: 'ko kai', meaning: 'chicken', category: 'consonant', difficulty: 'beginner' },
  { id: '2', thai: 'ข', roman: 'kho khai', meaning: 'egg', category: 'consonant', difficulty: 'beginner' },
  { id: '3', thai: 'ค', roman: 'kho khwai', meaning: 'buffalo', category: 'consonant', difficulty: 'beginner' },
  { id: '4', thai: 'ง', roman: 'ngo ngu', meaning: 'snake', category: 'consonant', difficulty: 'beginner' },
  { id: '5', thai: 'จ', roman: 'cho chan', meaning: 'plate', category: 'consonant', difficulty: 'beginner' },
  { id: '6', thai: 'ช', roman: 'cho chang', meaning: 'elephant', category: 'consonant', difficulty: 'beginner' },
  { id: '7', thai: 'ซ', roman: 'so so', meaning: 'chain', category: 'consonant', difficulty: 'beginner' },
  { id: '8', thai: 'ด', roman: 'do dek', meaning: 'child', category: 'consonant', difficulty: 'beginner' },
  { id: '9', thai: 'ต', roman: 'to tao', meaning: 'turtle', category: 'consonant', difficulty: 'beginner' },
  { id: '10', thai: 'น', roman: 'no nu', meaning: 'mouse', category: 'consonant', difficulty: 'beginner' },
  { id: '11', thai: 'บ', roman: 'bo baimai', meaning: 'leaf', category: 'consonant', difficulty: 'beginner' },
  { id: '12', thai: 'ป', roman: 'po pla', meaning: 'fish', category: 'consonant', difficulty: 'beginner' },
  { id: '13', thai: 'ม', roman: 'mo ma', meaning: 'horse', category: 'consonant', difficulty: 'beginner' },
  { id: '14', thai: 'ย', roman: 'yo yak', meaning: 'giant', category: 'consonant', difficulty: 'beginner' },
  { id: '15', thai: 'ร', roman: 'ro ruea', meaning: 'boat', category: 'consonant', difficulty: 'beginner' },
  { id: '16', thai: 'ล', roman: 'lo ling', meaning: 'monkey', category: 'consonant', difficulty: 'beginner' },
  { id: '17', thai: 'ว', roman: 'wo waen', meaning: 'ring', category: 'consonant', difficulty: 'beginner' },
  { id: '18', thai: 'ส', roman: 'so sua', meaning: 'tiger', category: 'consonant', difficulty: 'beginner' },
  { id: '19', thai: 'ห', roman: 'ho hip', meaning: 'chest', category: 'consonant', difficulty: 'beginner' },
  { id: '20', thai: 'อ', roman: 'o ang', meaning: 'basin', category: 'consonant', difficulty: 'beginner' },
  { id: '21', thai: 'ฮ', roman: 'ho nokhuk', meaning: 'owl', category: 'consonant', difficulty: 'beginner' },
  
  // Vowels
  { id: '22', thai: 'ะ', roman: 'a', meaning: 'short a', category: 'vowel', difficulty: 'beginner' },
  { id: '23', thai: 'า', roman: 'aa', meaning: 'long a', category: 'vowel', difficulty: 'beginner' },
  { id: '24', thai: 'ิ', roman: 'i', meaning: 'short i', category: 'vowel', difficulty: 'beginner' },
  { id: '25', thai: 'ี', roman: 'ii', meaning: 'long i', category: 'vowel', difficulty: 'beginner' },
  { id: '26', thai: 'ุ', roman: 'u', meaning: 'short u', category: 'vowel', difficulty: 'beginner' },
  { id: '27', thai: 'ู', roman: 'uu', meaning: 'long u', category: 'vowel', difficulty: 'beginner' },
  { id: '28', thai: 'เ', roman: 'e', meaning: 'e', category: 'vowel', difficulty: 'beginner' },
  { id: '29', thai: 'แ', roman: 'ae', meaning: 'ae', category: 'vowel', difficulty: 'beginner' },
  { id: '30', thai: 'โ', roman: 'o', meaning: 'o', category: 'vowel', difficulty: 'beginner' },
  
  // Tones
  { id: '31', thai: '่', roman: 'mai ek', meaning: 'low tone', category: 'tone', difficulty: 'beginner' },
  { id: '32', thai: '้', roman: 'mai tho', meaning: 'falling tone', category: 'tone', difficulty: 'beginner' },
  { id: '33', thai: '๊', roman: 'mai tri', meaning: 'high tone', category: 'tone', difficulty: 'intermediate' },
  { id: '34', thai: '๋', roman: 'mai chattawa', meaning: 'rising tone', category: 'tone', difficulty: 'intermediate' }
];

const mockLessons = [
  {
    id: '1',
    title: 'พยัญชนะพื้นฐาน ก-จ',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 10 ตัวแรก',
    category: 'consonant',
    difficulty: 'beginner',
    level: 1,
    content: 'เรียนรู้พยัญชนะ ก ข ฃ ค ฅ ฆ ง จ ฉ ช',
    gameModes: ['matching', 'multiple-choice'],
    objectives: ['จำพยัญชนะได้', 'ออกเสียงได้ถูกต้อง'],
    estimatedTime: 15,
    xpReward: 50,
    order: 1
  },
  {
    id: '2',
    title: 'พยัญชนะพื้นฐาน ซ-ญ',
    description: 'เรียนรู้พยัญชนะพื้นฐาน 10 ตัวที่สอง',
    category: 'consonant',
    difficulty: 'beginner',
    level: 1,
    content: 'เรียนรู้พยัญชนะ ซ ฌ ญ ฎ ฏ ฐ ฑ ฒ ณ ด',
    gameModes: ['matching', 'multiple-choice', 'fill-blank'],
    objectives: ['จำพยัญชนะได้', 'ออกเสียงได้ถูกต้อง'],
    estimatedTime: 15,
    xpReward: 50,
    order: 2
  },
  {
    id: '3',
    title: 'สระพื้นฐาน',
    description: 'เรียนรู้สระพื้นฐาน 8 ตัว',
    category: 'vowel',
    difficulty: 'beginner',
    level: 1,
    content: 'เรียนรู้สระ ะ า ิ ี ึ ื ุ ู',
    gameModes: ['matching', 'multiple-choice'],
    objectives: ['จำสระได้', 'ออกเสียงได้ถูกต้อง'],
    estimatedTime: 10,
    xpReward: 30,
    order: 3
  },
  {
    id: '4',
    title: 'วรรณยุกต์พื้นฐาน',
    description: 'เรียนรู้วรรณยุกต์ 4 ตัว',
    category: 'tone',
    difficulty: 'beginner',
    level: 1,
    content: 'เรียนรู้วรรณยุกต์ ่ ้ ๊ ๋',
    gameModes: ['matching', 'multiple-choice'],
    objectives: ['จำวรรณยุกต์ได้', 'ออกเสียงได้ถูกต้อง'],
    estimatedTime: 10,
    xpReward: 30,
    order: 4
  }
];

const mockProgress = [
  {
    id: '1',
    userId: '1',
    lessonId: '1',
    status: 'completed',
    completed: true,
    score: 85,
    bestScore: 85,
    attempts: 2,
    timeSpent: 900,
    lastAttempt: new Date(),
    xpEarned: 50
  },
  {
    id: '2',
    userId: '1',
    lessonId: '2',
    status: 'in-progress',
    completed: false,
    score: 60,
    bestScore: 60,
    attempts: 1,
    timeSpent: 600,
    lastAttempt: new Date(),
    xpEarned: 0
  }
];

// Helper functions
const findUserByEmail = (email) => mockUsers.find(user => user.email === email);
const findUserById = (id) => mockUsers.find(user => user.id === id);
const findVocabularyByCategory = (category) => mockVocabularies.filter(vocab => vocab.category === category);
const findLessonById = (id) => mockLessons.find(lesson => lesson.id === id);
const findProgressByUserId = (userId) => mockProgress.filter(progress => progress.userId === userId);

module.exports = {
  mockUsers,
  mockVocabularies,
  mockLessons,
  mockProgress,
  findUserByEmail,
  findUserById,
  findVocabularyByCategory,
  findLessonById,
  findProgressByUserId
};
