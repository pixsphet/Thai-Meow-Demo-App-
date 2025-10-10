const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriends, getFriendRequests, removeFriend } = require('../controllers/friend.controller');

// ค้นหาผู้ใช้
router.get('/search', auth, searchUsers);

// ส่งคำขอเป็นเพื่อน
router.post('/request', auth, sendFriendRequest);

// ยอมรับคำขอเป็นเพื่อน
router.post('/accept', auth, acceptFriendRequest);

// ปฏิเสธคำขอเป็นเพื่อน
router.post('/reject', auth, rejectFriendRequest);

// ดึงรายชื่อเพื่อน
router.get('/list', auth, getFriends);

// ดึงคำขอเป็นเพื่อนที่รอการตอบรับ
router.get('/requests', auth, getFriendRequests);

// ลบเพื่อน
router.delete('/remove', auth, removeFriend);

module.exports = router;
