const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.forceResetDemo = async (req, res, next) => {
  try {
    const email = 'test@example.com';
    const password = '19202546';
    const passwordHash = await bcrypt.hash(password, 10);

    // Delete ALL existing demo users first (handle duplicates)
    await User.deleteMany({ $or: [{ email }, { username: 'demo' }] });

    // Upsert new demo user safely
    const u = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          username: 'demo',
          passwordHash,
          petName: 'น้องแมว',
          level: 1,
          xp: 0,
          streak: 0,
          hearts: 5,
          lessonsCompleted: 0,
          badges: [],
        },
        $unset: { password: 1 },
      },
      { new: true, upsert: true }
    );

    console.log('✅ [DEV] Demo user reset:', { userId: u._id, email, password });

    return res.json({ 
      success: true, 
      message: 'demo user reset', 
      userId: u._id, 
      email, 
      password 
    });
  } catch (e) { 
    console.error('❌ [DEV] forceResetDemo error:', e);
    next(e); 
  }
};
