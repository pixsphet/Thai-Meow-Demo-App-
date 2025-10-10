const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, findUserById, mockUsers } = require('../mockData');
const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, petName } = req.body;

    // Validation
    if (!username || !email || !password || !petName) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' 
      });
    }

    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    // Create new user (mock)
    const newUser = {
      id: (mockUsers.length + 1).toString(),
      username,
      email,
      petName,
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
    };

    mockUsers.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกเรียบร้อย',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        petName: newUser.petName,
        hearts: newUser.hearts,
        diamonds: newUser.diamonds,
        xp: newUser.xp,
        level: newUser.level,
        streak: newUser.streak
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'กรุณากรอกอีเมลและรหัสผ่าน' 
      });
    }

    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' 
      });
    }

    // For mock, accept any password (in real app, use bcrypt)
    // Accept any password for mock testing
    if (password.length < 6) {
      return res.status(401).json({ 
        success: false, 
        error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        petName: user.petName,
        hearts: user.hearts,
        diamonds: user.diamonds,
        xp: user.xp,
        level: user.level,
        streak: user.streak
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'ไม่พบ token' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        petName: user.petName,
        hearts: user.hearts,
        diamonds: user.diamonds,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        progress: user.progress,
        achievements: user.achievements,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' 
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'ไม่พบ token' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findUserById(decoded.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบผู้ใช้' 
      });
    }

    const { petName, settings } = req.body;

    if (petName) user.petName = petName;
    if (settings) user.settings = { ...user.settings, ...settings };

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลเรียบร้อย',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        petName: user.petName,
        hearts: user.hearts,
        diamonds: user.diamonds,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' 
    });
  }
});

module.exports = router;
