// Mock data for Thai Meow app
export const mockData = {
  // User stats
  fire: 5,
  diamonds: 120,
  learningHours: 12,
  
  // Current level
  currentLevel: 'Beginner',
  
  // Levels data
  levels: [
    {
      name: 'Beginner',
      stages: [
        { correct: 8, total: 10 },
        { correct: 7, total: 10 },
        { correct: 9, total: 10 },
        { correct: 6, total: 10 },
        { correct: 8, total: 10 }
      ]
    },
    {
      name: 'Intermediate',
      stages: [
        { correct: 6, total: 10 },
        { correct: 7, total: 10 },
        { correct: 5, total: 10 }
      ]
    },
    {
      name: 'Advanced',
      stages: [
        { correct: 4, total: 10 },
        { correct: 3, total: 10 }
      ]
    }
  ],
  
  // User friends
  friends: [
    { id: 1, name: 'John', avatar: null },
    { id: 2, name: 'Jane', avatar: null },
    { id: 3, name: 'Mike', avatar: null }
  ],
  
  // Recent games
  recentGames: [
    {
      id: 1,
      title: 'พยัญชนะ ก-ฮ',
      score: 85,
      date: '2024-01-15',
      level: 'Beginner'
    },
    {
      id: 2,
      title: 'สระ อา-อี',
      score: 92,
      date: '2024-01-14',
      level: 'Beginner'
    },
    {
      id: 3,
      title: 'วรรณยุกต์',
      score: 78,
      date: '2024-01-13',
      level: 'Intermediate'
    }
  ],
  
  // Achievements
  achievements: [
    {
      id: 1,
      title: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎯',
      unlocked: true,
      date: '2024-01-10'
    },
    {
      id: 2,
      title: 'Streak Master',
      description: 'Study for 7 days in a row',
      icon: '🔥',
      unlocked: true,
      date: '2024-01-15'
    },
    {
      id: 3,
      title: 'Perfect Score',
      description: 'Get 100% on any lesson',
      icon: '⭐',
      unlocked: false,
      date: null
    }
  ]
};

export default mockData;
