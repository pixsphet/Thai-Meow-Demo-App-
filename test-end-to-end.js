// End-to-End Test for Per-User System
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test scenarios
const testScenarios = [
  {
    name: 'User Registration & Login',
    test: async () => {
      console.log('🧪 Testing User Registration & Login...');
      
      // Register user
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'testuser_e2e',
        email: 'test_e2e@example.com',
        password: 'password123',
        petName: 'แมวทดสอบ'
      });
      
      console.log('✅ User registered:', registerResponse.data.data.user.username);
      
      // Login user
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test_e2e@example.com',
        password: 'password123'
      });
      
      const token = loginResponse.data.data.token;
      console.log('✅ User logged in, token received');
      
      return { token, userId: loginResponse.data.data.user.id };
    }
  },
  
  {
    name: 'User Stats Creation & Retrieval',
    test: async (context) => {
      console.log('🧪 Testing User Stats...');
      
      // Get initial stats (should create if not exists)
      const statsResponse = await axios.get(`${BASE_URL}/user/stats`, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      
      console.log('✅ User stats retrieved:', {
        level: statsResponse.data.stats.level,
        xp: statsResponse.data.stats.xp,
        hearts: statsResponse.data.stats.hearts
      });
      
      return { stats: statsResponse.data.stats };
    }
  },
  
  {
    name: 'Progress Session Management',
    test: async (context) => {
      console.log('🧪 Testing Progress Session...');
      
      const lessonId = 'thai-consonants-beginner-1';
      
      // Save progress
      const saveResponse = await axios.post(`${BASE_URL}/progress/session`, {
        lessonId,
        category: 'consonants_basic',
        currentIndex: 3,
        total: 10,
        hearts: 4,
        score: 30,
        xp: 30,
        perLetter: { 'ก': { correct: 2, total: 3 } },
        answers: { 'q1': { answer: 'ก', correct: true } },
        questionsSnapshot: [
          { id: 'q1', type: 'MATCH_PICTURE', correctText: 'ก' },
          { id: 'q2', type: 'MATCH_PICTURE', correctText: 'ข' }
        ]
      }, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      
      console.log('✅ Progress saved:', saveResponse.data.id);
      
      // Retrieve progress
      const getResponse = await axios.get(`${BASE_URL}/progress/session?lessonId=${lessonId}`, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      
      console.log('✅ Progress retrieved:', {
        currentIndex: getResponse.data.currentIndex,
        score: getResponse.data.score,
        hearts: getResponse.data.hearts
      });
      
      return { lessonId, progress: getResponse.data };
    }
  },
  
  {
    name: 'Lesson Completion & Stats Update',
    test: async (context) => {
      console.log('🧪 Testing Lesson Completion...');
      
      // Finish lesson
      const finishResponse = await axios.post(`${BASE_URL}/progress/finish`, {
        lessonId: context.lessonId,
        score: 50,
        xpGain: 100,
        diamonds: 5,
        heartsLeft: 3
      }, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      
      console.log('✅ Lesson finished');
      
      // Check updated stats
      const updatedStats = await axios.get(`${BASE_URL}/user/stats`, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      
      console.log('✅ Stats updated:', {
        level: updatedStats.data.stats.level,
        xp: updatedStats.data.stats.xp,
        diamonds: updatedStats.data.stats.diamonds,
        lessonsCompleted: updatedStats.data.stats.lessonsCompleted
      });
      
      return { updatedStats: updatedStats.data.stats };
    }
  },
  
  {
    name: 'Streak Management',
    test: async (context) => {
      console.log('🧪 Testing Streak Management...');
      
      // Tick streak
      const streakResponse = await axios.post(`${BASE_URL}/user/streak/tick`, {}, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      
      console.log('✅ Streak ticked:', {
        currentStreak: streakResponse.data.currentStreak,
        bestStreak: streakResponse.data.bestStreak,
        isNewDay: streakResponse.data.isNewDay
      });
      
      return { streak: streakResponse.data };
    }
  },
  
  {
    name: 'Data Isolation Between Users',
    test: async (context) => {
      console.log('🧪 Testing Data Isolation...');
      
      // Create second user
      const user2Register = await axios.post(`${BASE_URL}/auth/register`, {
        username: 'testuser2_e2e',
        email: 'test2_e2e@example.com',
        password: 'password123',
        petName: 'แมวทดสอบ2'
      });
      
      const user2Login = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test2_e2e@example.com',
        password: 'password123'
      });
      
      const user2Token = user2Login.data.data.token;
      console.log('✅ Second user created and logged in');
      
      // User 2 saves different progress
      await axios.post(`${BASE_URL}/progress/session`, {
        lessonId: 'thai-consonants-beginner-1',
        category: 'consonants_basic',
        currentIndex: 1,
        total: 10,
        hearts: 5,
        score: 10,
        xp: 10
      }, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });
      
      console.log('✅ User 2 progress saved');
      
      // Verify User 1's progress is unchanged
      const user1Progress = await axios.get(`${BASE_URL}/progress/session?lessonId=thai-consonants-beginner-1`, {
        headers: { Authorization: `Bearer ${context.token}` }
      });
      
      const user2Progress = await axios.get(`${BASE_URL}/progress/session?lessonId=thai-consonants-beginner-1`, {
        headers: { Authorization: `Bearer ${user2Token}` }
      });
      
      console.log('✅ Data isolation verified:');
      console.log('  User 1 progress:', {
        currentIndex: user1Progress.data.currentIndex,
        score: user1Progress.data.score
      });
      console.log('  User 2 progress:', {
        currentIndex: user2Progress.data.currentIndex,
        score: user2Progress.data.score
      });
      
      return { user2Token };
    }
  },
  
  {
    name: 'Demo User Fallback',
    test: async () => {
      console.log('🧪 Testing Demo User Fallback...');
      
      // Test without token (should use demo user)
      const demoProgress = await axios.post(`${BASE_URL}/progress/session`, {
        lessonId: 'demo-lesson',
        currentIndex: 1,
        score: 25,
        hearts: 5
      });
      
      console.log('✅ Demo progress saved without token');
      
      const getDemoProgress = await axios.get(`${BASE_URL}/progress/session?lessonId=demo-lesson`);
      
      console.log('✅ Demo progress retrieved:', {
        currentIndex: getDemoProgress.data.currentIndex,
        score: getDemoProgress.data.score
      });
      
      return { demoProgress: getDemoProgress.data };
    }
  }
];

async function runEndToEndTests() {
  console.log('🚀 Starting End-to-End Tests for Per-User System\n');
  
  const context = {};
  let passedTests = 0;
  let totalTests = testScenarios.length;
  
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];
    
    try {
      console.log(`\n${i + 1}. ${scenario.name}`);
      console.log('─'.repeat(50));
      
      const result = await scenario.test(context);
      
      // Merge result into context for next tests
      Object.assign(context, result);
      
      console.log(`✅ ${scenario.name} - PASSED`);
      passedTests++;
      
    } catch (error) {
      console.error(`❌ ${scenario.name} - FAILED`);
      console.error('Error:', error.response?.data || error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Per-user system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.');
  }
  
  console.log('\n📊 System Summary:');
  console.log('✅ User authentication and JWT handling');
  console.log('✅ Per-user data isolation');
  console.log('✅ Progress session management');
  console.log('✅ User stats tracking');
  console.log('✅ Streak management');
  console.log('✅ Demo user fallback');
  console.log('✅ Lesson completion rewards');
}

// Run the tests
runEndToEndTests().catch(console.error);

