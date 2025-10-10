const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// ค้นหาผู้ใช้
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    const userId = req.user?.id;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: false,
        error: 'กรุณากรอกคำค้นหาอย่างน้อย 2 ตัวอักษร'
      });
    }

    // ค้นหาผู้ใช้ที่ไม่ใช่ตัวเอง
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email avatar createdAt')
    .limit(20)
    .lean();

    console.log('🔍 [FRIEND] Search results:', users.length);

    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ [FRIEND] Search error:', error);
    next(error);
  }
};

// ส่งคำขอเป็นเพื่อน
exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    const userId = req.user?.id;

    if (!friendId) {
      return res.json({
        success: false,
        error: 'กรุณาระบุ ID ของเพื่อน'
      });
    }

    if (userId === friendId) {
      return res.json({
        success: false,
        error: 'ไม่สามารถส่งคำขอเป็นเพื่อนกับตัวเองได้'
      });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.json({
        success: false,
        error: 'ไม่พบผู้ใช้ที่ระบุ'
      });
    }

    // ตรวจสอบว่ามีคำขออยู่แล้วหรือไม่
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    });

    if (existingRequest) {
      return res.json({
        success: false,
        error: 'มีคำขอเป็นเพื่อนอยู่แล้ว'
      });
    }

    // สร้างคำขอเป็นเพื่อน
    const friendRequest = new FriendRequest({
      sender: userId,
      receiver: friendId,
      status: 'pending'
    });

    await friendRequest.save();

    console.log('📤 [FRIEND] Friend request sent:', { sender: userId, receiver: friendId });

    return res.json({
      success: true,
      message: 'ส่งคำขอเป็นเพื่อนสำเร็จ'
    });
  } catch (error) {
    console.error('❌ [FRIEND] Send request error:', error);
    next(error);
  }
};

// ยอมรับคำขอเป็นเพื่อน
exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const userId = req.user?.id;

    if (!requestId) {
      return res.json({
        success: false,
        error: 'กรุณาระบุ ID ของคำขอ'
      });
    }

    // หาคำขอที่ส่งมาหาตัวเอง
    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      receiver: userId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.json({
        success: false,
        error: 'ไม่พบคำขอเป็นเพื่อนที่ระบุ'
      });
    }

    // อัปเดตสถานะเป็น accepted
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // เพิ่มเพื่อนในรายชื่อเพื่อนของทั้งสองคน
    await User.findByIdAndUpdate(userId, {
      $addToSet: { friends: friendRequest.sender }
    });

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: userId }
    });

    console.log('✅ [FRIEND] Friend request accepted:', { requestId, userId });

    return res.json({
      success: true,
      message: 'ยอมรับคำขอเป็นเพื่อนสำเร็จ'
    });
  } catch (error) {
    console.error('❌ [FRIEND] Accept error:', error);
    next(error);
  }
};

// ปฏิเสธคำขอเป็นเพื่อน
exports.rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.body;
    const userId = req.user?.id;

    if (!requestId) {
      return res.json({
        success: false,
        error: 'กรุณาระบุ ID ของคำขอ'
      });
    }

    // หาคำขอที่ส่งมาหาตัวเอง
    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      receiver: userId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.json({
        success: false,
        error: 'ไม่พบคำขอเป็นเพื่อนที่ระบุ'
      });
    }

    // อัปเดตสถานะเป็น rejected
    friendRequest.status = 'rejected';
    await friendRequest.save();

    console.log('❌ [FRIEND] Friend request rejected:', { requestId, userId });

    return res.json({
      success: true,
      message: 'ปฏิเสธคำขอเป็นเพื่อนสำเร็จ'
    });
  } catch (error) {
    console.error('❌ [FRIEND] Reject error:', error);
    next(error);
  }
};

// ดึงรายชื่อเพื่อน
exports.getFriends = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const user = await User.findById(userId).populate('friends', 'username email avatar');
    
    if (!user) {
      return res.json({
        success: false,
        error: 'ไม่พบผู้ใช้'
      });
    }

    console.log('👥 [FRIEND] Friends list:', user.friends.length);

    return res.json({
      success: true,
      data: user.friends
    });
  } catch (error) {
    console.error('❌ [FRIEND] Get friends error:', error);
    next(error);
  }
};

// ดึงคำขอเป็นเพื่อนที่รอการตอบรับ
exports.getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const requests = await FriendRequest.find({
      receiver: userId,
      status: 'pending'
    }).populate('sender', 'username email avatar');

    console.log('📨 [FRIEND] Friend requests:', requests.length);

    return res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('❌ [FRIEND] Get requests error:', error);
    next(error);
  }
};

// ลบเพื่อน
exports.removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    const userId = req.user?.id;

    if (!friendId) {
      return res.json({
        success: false,
        error: 'กรุณาระบุ ID ของเพื่อน'
      });
    }

    // ลบเพื่อนจากรายชื่อของทั้งสองคน
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    // ลบคำขอเป็นเพื่อนที่เกี่ยวข้อง
    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    });

    console.log('🗑️ [FRIEND] Friend removed:', { userId, friendId });

    return res.json({
      success: true,
      message: 'ลบเพื่อนสำเร็จ'
    });
  } catch (error) {
    console.error('❌ [FRIEND] Remove friend error:', error);
    next(error);
  }
};
