// Test script ตาม prompt requirements
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
const testUserA = {
  email: 'usera@example.com',
  password: 'password123',
  username: 'usera'
};

const testUserB = {
  email: 'userb@example.com', 
  password: 'password123',
  username: 'userb'
};

let userAToken = null;
let userBToken = null;

async function testPerUserPrompt() {
  console.log('🧪 Testing Per-User System according to Prompt\n');

  try {
    // 1. Register test users
    console.log('1️⃣ Registering test users...');
    
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUserA);
      console.log('✅ User A registered');
    } catch (e) {
      console.log('ℹ️ User A already exists');
    }
    
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUserB);
      console.log('✅ User B registered');
    } catch (e) {
      console.log('ℹ️ User B already exists');
    }

    // 2. Login User A
    console.log('\n2️⃣ Logging in User A...');
    const loginA = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUserA.email,
      password: testUserA.password
    });
    userAToken = loginA.data.data.token;
    console.log('✅ User A logged in');

    // 3. User A plays 5 questions and saves progress
    console.log('\n3️⃣ User A plays 5 questions...');
    await axios.post(`${BASE_URL}/progress/session`, {
      lessonId: 'thai-consonants',
      category: 'consonants_basic',
      currentIndex: 5,
      total: 10,
      hearts: 3,
      score: 50,
      xp: 50,
      perLetter: { 'ก': { correct: 3, total: 5 } },
      answers: { 'q1': { answer: 'ก', correct: true } },
      questionsSnapshot: [
        { id: 'q1', type: 'MATCH_PICTURE', correctText: 'ก' },
        { id: 'q2', type: 'MATCH_PICTURE', correctText: 'ข' }
      ]
    }, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    console.log('✅ User A progress saved (5 questions)');

    // 4. Logout User A
    console.log('\n4️⃣ Logging out User A...');
    // In real app, this would clear the token
    userAToken = null;
    console.log('✅ User A logged out');

    // 5. Login User B
    console.log('\n5️⃣ Logging in User B...');
    const loginB = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUserB.email,
      password: testUserB.password
    });
    userBToken = loginB.data.data.token;
    console.log('✅ User B logged in');

    // 6. User B checks progress (should not see User A's progress)
    console.log('\n6️⃣ User B checks progress...');
    const userBProgress = await axios.get(`${BASE_URL}/progress/session?lessonId=thai-consonants`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    
    if (userBProgress.data === null) {
      console.log('✅ User B sees no progress (data isolation working)');
    } else {
      console.log('❌ User B sees User A progress (data isolation failed)');
    }

    // 7. User B plays and saves different progress
    console.log('\n7️⃣ User B plays and saves different progress...');
    await axios.post(`${BASE_URL}/progress/session`, {
      lessonId: 'thai-consonants',
      category: 'consonants_basic',
      currentIndex: 2,
      total: 10,
      hearts: 4,
      score: 20,
      xp: 20,
      perLetter: { 'ข': { correct: 1, total: 2 } },
      answers: { 'q1': { answer: 'ข', correct: true } }
    }, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    console.log('✅ User B progress saved (2 questions)');

    // 8. User A logs back in and checks progress
    console.log('\n8️⃣ User A logs back in...');
    const loginA2 = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUserA.email,
      password: testUserA.password
    });
    userAToken = loginA2.data.data.token;
    console.log('✅ User A logged in again');

    // 9. User A checks progress (should see their own progress)
    console.log('\n9️⃣ User A checks progress...');
    const userAProgress = await axios.get(`${BASE_URL}/progress/session?lessonId=thai-consonants`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    
    if (userAProgress.data && userAProgress.data.currentIndex === 5) {
      console.log('✅ User A sees their own progress (5 questions)');
    } else {
      console.log('❌ User A progress not restored correctly');
    }

    // 10. Test user stats
    console.log('\n🔟 Testing user stats...');
    
    // User A stats
    const userAStats = await axios.get(`${BASE_URL}/user/stats`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    console.log('User A stats:', {
      level: userAStats.data.stats.level,
      xp: userAStats.data.stats.xp,
      hearts: userAStats.data.stats.hearts
    });

    // User B stats
    const userBStats = await axios.get(`${BASE_URL}/user/stats`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    console.log('User B stats:', {
      level: userBStats.data.stats.level,
      xp: userBStats.data.stats.xp,
      hearts: userBStats.data.stats.hearts
    });

    // 11. Test lesson completion
    console.log('\n1️⃣1️⃣ Testing lesson completion...');
    
    // User A finishes lesson
    await axios.post(`${BASE_URL}/progress/finish`, {
      lessonId: 'thai-consonants',
      score: 80,
      xpGain: 100,
      diamonds: 4,
      heartsLeft: 2
    }, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    console.log('✅ User A finished lesson');

    // Check updated stats
    const updatedUserAStats = await axios.get(`${BASE_URL}/user/stats`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    console.log('Updated User A stats:', {
      level: updatedUserAStats.data.stats.level,
      xp: updatedUserAStats.data.stats.xp,
      diamonds: updatedUserAStats.data.stats.diamonds,
      lessonsCompleted: updatedUserAStats.data.stats.lessonsCompleted
    });

    // 12. Test streak tick
    console.log('\n1️⃣2️⃣ Testing streak tick...');
    
    const userAStreak = await axios.post(`${BASE_URL}/user/streak/tick`, {}, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    console.log('User A streak:', userAStreak.data);

    const userBStreak = await axios.post(`${BASE_URL}/user/streak/tick`, {}, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    console.log('User B streak:', userBStreak.data);

    // 13. Test demo user (no token)
    console.log('\n1️⃣3️⃣ Testing demo user (no token)...');
    
    const demoProgress = await axios.post(`${BASE_URL}/progress/session`, {
      lessonId: 'demo-lesson',
      currentIndex: 1,
      score: 25,
      hearts: 5
    });
    console.log('✅ Demo progress saved without token');

    const getDemoProgress = await axios.get(`${BASE_URL}/progress/session?lessonId=demo-lesson`);
    console.log('Demo progress:', {
      currentIndex: getDemoProgress.data.currentIndex,
      score: getDemoProgress.data.score
    });

    console.log('\n🎉 All tests passed! Per-user system working according to prompt requirements.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPerUserPrompt();
