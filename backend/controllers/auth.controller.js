const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    console.log('🔐 [LOGIN] body =', req.body);               // <== debug

    if (!email || !password) {
      return res.status(400).json({ success:false, error:'email & password are required' });
    }

    const normEmail = String(email).toLowerCase().trim();
    // find using normalized email (case-insensitive)
    const userDoc = await User.findOne({ email: { $regex: new RegExp(`^${normEmail}$`, 'i') } });
    const user = userDoc ? userDoc.toObject() : null;
    console.log('🔎 [LOGIN] find user by', normEmail, '=>', !!user, user?._id);  // <== debug

    if (!user) {
      return res.status(401).json({ success:false, error:'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    // รองรับ DB เก่า: ถ้ามี user.password (เดิม) ให้ใช้เป็น hash เทียบ และ migrate มาเป็น passwordHash เมื่อผ่าน
    let ok = false;
    if (user.passwordHash) {
      ok = await bcrypt.compare(password, user.passwordHash);
    } else if (user.password) {
      console.warn('⚠️ [LOGIN] legacy password field detected, attempting migrate for', normEmail);
      ok = await bcrypt.compare(password, user.password);
      if (ok) {
        try {
          const newHash = await bcrypt.hash(password, 10);
          await User.updateOne({ _id: user._id }, { $set: { passwordHash: newHash }, $unset: { password: 1 } });
          console.log('🔧 [LOGIN] migrated legacy password -> passwordHash for', normEmail);
        } catch (mErr) {
          console.warn('⚠️ [LOGIN] migrate failed:', mErr?.message);
        }
      }
    } else {
      console.warn('⚠️ [LOGIN] user has no password/passwordHash, email=', normEmail);
    }
    console.log('🧮 [LOGIN] bcrypt.compare =>', ok);           // <== debug

    if (!ok) {
      return res.status(401).json({ success:false, error:'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { sub: user._id },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    return res.json({ success:true, data:{ user: {
      id: user._id, email: user.email, username: user.username,
      level: user.level, xp: user.xp, streak: user.streak, hearts: user.hearts,
      lessonsCompleted: user.lessonsCompleted, badges: user.badges
    }, token }});
  } catch (e) { 
    console.error('❌ [LOGIN] error:', e);
    next(e); 
  }
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, petName } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    const normEmail = String(email).toLowerCase().trim();
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email: normEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'อีเมลนี้มีผู้ใช้งานแล้ว'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        error: 'ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว'
      });
    }

    // Check if pet name already exists (if provided)
    if (petName) {
      const existingPetName = await User.findOne({ petName: petName.trim() });
      if (existingPetName) {
        return res.status(400).json({
          success: false,
          error: 'ชื่อสัตว์เลี้ยงนี้มีผู้ใช้งานแล้ว'
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username: username.trim(),
      email: normEmail,
      passwordHash,
      petName: petName ? petName.trim() : 'น้องแมว'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { sub: user._id },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          petName: user.petName,
          hearts: user.hearts,
          xp: user.xp,
          level: user.level,
          streak: user.streak
        },
        token
      }
    });
  } catch (error) {
    console.error('❌ [REGISTER] error:', error);
    next(error);
  }
};
