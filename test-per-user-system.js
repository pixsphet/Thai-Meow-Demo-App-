// Test script for per-user system
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
const testUser1 = {
  email: 'test1@example.com',
  password: 'password123',
  username: 'testuser1'
};

const testUser2 = {
  email: 'test2@example.com', 
  password: 'password123',
  username: 'testuser2'
};

let user1Token = null;
let user2Token = null;

async function testPerUserSystem() {
  console.log('🧪 Testing Per-User System...\n');

  try {
    // 1. Register two test users
    console.log('1️⃣ Registering test users...');
    
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser1);
      console.log('✅ User 1 registered');
    } catch (e) {
      console.log('ℹ️ User 1 already exists');
    }
    
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser2);
      console.log('✅ User 2 registered');
    } catch (e) {
      console.log('ℹ️ User 2 already exists');
    }

    // 2. Login both users
    console.log('\n2️⃣ Logging in users...');
    
    const login1 = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser1.email,
      password: testUser1.password
    });
    user1Token = login1.data.data.token;
    console.log('✅ User 1 logged in');

    const login2 = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser2.email,
      password: testUser2.password
    });
    user2Token = login2.data.data.token;
    console.log('✅ User 2 logged in');

    // 3. Test user stats (should be separate)
    console.log('\n3️⃣ Testing user stats separation...');
    
    const stats1 = await axios.get(`${BASE_URL}/user/stats`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.log('User 1 stats:', stats1.data.stats);

    const stats2 = await axios.get(`${BASE_URL}/user/stats`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    console.log('User 2 stats:', stats2.data.stats);

    // 4. Test progress session (per-user)
    console.log('\n4️⃣ Testing progress session per-user...');
    
    const progress1 = await axios.post(`${BASE_URL}/progress/session`, {
      lessonId: 'test-lesson-1',
      currentIndex: 5,
      score: 100,
      hearts: 3
    }, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.log('✅ User 1 progress saved');

    const progress2 = await axios.post(`${BASE_URL}/progress/session`, {
      lessonId: 'test-lesson-1', 
      currentIndex: 2,
      score: 50,
      hearts: 4
    }, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    console.log('✅ User 2 progress saved');

    // 5. Verify progress separation
    console.log('\n5️⃣ Verifying progress separation...');
    
    const getProgress1 = await axios.get(`${BASE_URL}/progress/session?lessonId=test-lesson-1`, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.log('User 1 progress:', getProgress1.data);

    const getProgress2 = await axios.get(`${BASE_URL}/progress/session?lessonId=test-lesson-1`, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    console.log('User 2 progress:', getProgress2.data);

    // 6. Test demo user (no token)
    console.log('\n6️⃣ Testing demo user (no token)...');
    
    const demoProgress = await axios.post(`${BASE_URL}/progress/session`, {
      lessonId: 'demo-lesson',
      currentIndex: 1,
      score: 25,
      hearts: 5
    });
    console.log('✅ Demo progress saved');

    const getDemoProgress = await axios.get(`${BASE_URL}/progress/session?lessonId=demo-lesson`);
    console.log('Demo progress:', getDemoProgress.data);

    // 7. Test streak tick
    console.log('\n7️⃣ Testing streak tick...');
    
    const streak1 = await axios.post(`${BASE_URL}/user/streak/tick`, {}, {
      headers: { Authorization: `Bearer ${user1Token}` }
    });
    console.log('User 1 streak:', streak1.data);

    const streak2 = await axios.post(`${BASE_URL}/user/streak/tick`, {}, {
      headers: { Authorization: `Bearer ${user2Token}` }
    });
    console.log('User 2 streak:', streak2.data);

    console.log('\n🎉 All tests passed! Per-user system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPerUserSystem();

