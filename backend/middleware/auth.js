const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  // โหมด dev: ถ้าไม่มี token ให้ใช้ userId = demo ObjectId
  if (!token) {
    req.user = { id: new mongoose.Types.ObjectId() };
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const userId = payload.sub || payload.userId || payload.id;
    req.user = { id: mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId() };
    return next();
  } catch (e) {
    // token เสีย/หมดอายุ: ให้ fallback เป็น demo ObjectId
    req.user = { id: new mongoose.Types.ObjectId() };
    return next();
  }
};