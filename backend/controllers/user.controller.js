const User = require('../models/User');

const buildStatsDTO = (u) => ({
  userId: u._id?.toString() || 'demo',
  username: u.username,
  level: u.level || 1,
  xp: u.xp || 0,
  streak: u.streak || 0,
  hearts: u.hearts ?? 5,
  diamonds: u.diamonds || 0,
  lessonsCompleted: u.lessonsCompleted || 0,
  lastActiveAt: u.updatedAt,
  badges: u.badges || [],
});

const buildProfileDTO = (u) => ({
  id: u._id?.toString() || 'demo',
  username: u.username,
  email: u.email,
  petName: u.petName,
  avatar: u.avatar,
  level: u.level || 1,
  xp: u.xp || 0,
  streak: u.streak || 0,
  hearts: u.hearts ?? 5,
  diamonds: u.diamonds || 0,
  lessonsCompleted: u.lessonsCompleted || 0,
  lastActiveAt: u.updatedAt,
  badges: u.badges || [],
});

// ✅ GET /api/user/stats/:userId
exports.getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    let user;
    
    // Try to find by ObjectId first
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(userId);
    } else {
      // Fallback to username search
      user = await User.findOne({ username: userId });
    }

    // ถ้าไม่มี user demo ให้สร้างขึ้นอัตโนมัติ
    if (!user && userId === 'demo') {
      user = await User.create({
        username: 'demo',
        level: 1,
        xp: 120,
        streak: 3,
        hearts: 5,
        lessonsCompleted: 7,
        badges: ['starter', 'first-lesson'],
      });
    }

    if (!user) {
      // If user not found, create default stats for the user
      console.log('🔧 Creating default stats for user:', userId);
      const defaultStats = {
        userId: userId,
        username: 'User',
        level: 1,
        xp: 0,
        streak: 0,
        hearts: 5,
        diamonds: 0,
        lessonsCompleted: 0,
        lastActiveAt: new Date(),
        badges: []
      };
      return res.json({ success: true, data: defaultStats });
    }

    return res.json({ success: true, data: buildStatsDTO(user) });
  } catch (err) {
    next(err);
  }
};

// ✅ PUT /api/user/profile - Update user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, petName, avatar } = req.body;

    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and email are required' 
      });
    }

    // Check if username already exists (excluding current user)
    const existingUsername = await User.findOne({ 
      username: username.trim(), 
      _id: { $ne: userId } 
    });
    
    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว' 
      });
    }

    // Check if pet name already exists (excluding current user)
    if (petName) {
      const existingPetName = await User.findOne({ 
        petName: petName.trim(), 
        _id: { $ne: userId } 
      });
      
      if (existingPetName) {
        return res.status(400).json({ 
          success: false, 
          message: 'ชื่อสัตว์เลี้ยงนี้มีผู้ใช้งานแล้ว' 
        });
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username: username.trim(),
        email: email.trim(),
        petName: petName ? petName.trim() : null,
        avatar: avatar || null,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`✅ User profile updated: ${updatedUser.username}`);

    return res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: buildProfileDTO(updatedUser)
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    next(err);
  }
};

// ✅ GET /api/user/stats - Get current user stats (from JWT)
exports.getCurrentUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const stats = buildStatsDTO(user);
    
    res.json({ 
      success: true, 
      stats 
    });
  } catch (err) {
    console.error('Error getting current user stats:', err);
    next(err);
  }
};

// ✅ POST /api/user/stats - Update current user stats (from JWT)
exports.updateCurrentUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body || {};
    
    // Allowed fields for stats update
    const allowedFields = ['hearts', 'diamonds', 'xp', 'level', 'streak', 'lessonsCompleted', 'badges'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid fields to update' 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const stats = buildStatsDTO(updatedUser);
    
    console.log(`✅ User stats updated: ${updatedUser.username}`, updateData);

    res.json({ 
      success: true, 
      message: 'Stats updated successfully',
      stats 
    });
  } catch (err) {
    console.error('Error updating current user stats:', err);
    next(err);
  }
};
