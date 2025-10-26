const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  // Guest fallback: ถ้าไม่มี token ให้ mark เป็น guest (ไม่มี userId)
  if (!token) {
    req.user = { id: null, isGuest: true };
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const userId = payload.sub || payload.userId || payload.id;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      req.user = { id: userId, isGuest: false };
    } else {
      req.user = { id: null, isGuest: true };
    }
    return next();
  } catch (e) {
    // token เสีย/หมดอายุ: mark guest เช่นกัน
    req.user = { id: null, isGuest: true };
    return next();
  }
};
