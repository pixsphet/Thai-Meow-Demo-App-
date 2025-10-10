const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// อัปเดต updatedAt เมื่อมีการแก้ไข
friendRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index สำหรับการค้นหาที่เร็วขึ้น
friendRequestSchema.index({ sender: 1, receiver: 1 });
friendRequestSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
