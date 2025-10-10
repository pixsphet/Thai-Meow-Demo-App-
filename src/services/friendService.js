import api from './apiClient';

class FriendService {
  // ค้นหาผู้ใช้
  async searchUsers(query) {
    try {
      console.log('🔍 [FRIEND] Searching users:', query);
      
      const response = await api.get('/friends/search', {
        params: { query }
      });
      
      console.log('📨 [FRIEND] Search response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'ไม่สามารถค้นหาผู้ใช้ได้'
        };
      }
    } catch (error) {
      console.error('❌ [FRIEND] Search error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการค้นหา'
      };
    }
  }

  // ส่งคำขอเป็นเพื่อน
  async sendFriendRequest(friendId) {
    try {
      console.log('📤 [FRIEND] Sending friend request to:', friendId);
      
      const response = await api.post('/friends/request', {
        friendId
      });
      
      console.log('📨 [FRIEND] Friend request response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'ส่งคำขอเป็นเพื่อนสำเร็จ'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'ไม่สามารถส่งคำขอเป็นเพื่อนได้'
        };
      }
    } catch (error) {
      console.error('❌ [FRIEND] Send request error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการส่งคำขอเป็นเพื่อน'
      };
    }
  }

  // รับคำขอเป็นเพื่อน
  async acceptFriendRequest(requestId) {
    try {
      console.log('📤 [FRIEND] Accepting friend request:', requestId);
      
      const response = await api.post('/friends/accept', {
        requestId
      });
      
      console.log('📨 [FRIEND] Accept response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'ยอมรับคำขอเป็นเพื่อนสำเร็จ'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'ไม่สามารถยอมรับคำขอเป็นเพื่อนได้'
        };
      }
    } catch (error) {
      console.error('❌ [FRIEND] Accept error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการยอมรับคำขอเป็นเพื่อน'
      };
    }
  }

  // ปฏิเสธคำขอเป็นเพื่อน
  async rejectFriendRequest(requestId) {
    try {
      console.log('📤 [FRIEND] Rejecting friend request:', requestId);
      
      const response = await api.post('/friends/reject', {
        requestId
      });
      
      console.log('📨 [FRIEND] Reject response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'ปฏิเสธคำขอเป็นเพื่อนสำเร็จ'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'ไม่สามารถปฏิเสธคำขอเป็นเพื่อนได้'
        };
      }
    } catch (error) {
      console.error('❌ [FRIEND] Reject error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการปฏิเสธคำขอเป็นเพื่อน'
      };
    }
  }

  // ดึงรายชื่อเพื่อน
  async getFriends() {
    try {
      console.log('📤 [FRIEND] Getting friends list');
      
      const response = await api.get('/friends/list');
      
      console.log('📨 [FRIEND] Friends list response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'ไม่สามารถดึงรายชื่อเพื่อนได้'
        };
      }
    } catch (error) {
      console.error('❌ [FRIEND] Get friends error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการดึงรายชื่อเพื่อน'
      };
    }
  }

  // ดึงคำขอเป็นเพื่อนที่รอการตอบรับ
  async getFriendRequests() {
    try {
      console.log('📤 [FRIEND] Getting friend requests');
      
      const response = await api.get('/friends/requests');
      
      console.log('📨 [FRIEND] Friend requests response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || []
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'ไม่สามารถดึงคำขอเป็นเพื่อนได้'
        };
      }
    } catch (error) {
      console.error('❌ [FRIEND] Get requests error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการดึงคำขอเป็นเพื่อน'
      };
    }
  }

  // ลบเพื่อน
  async removeFriend(friendId) {
    try {
      console.log('📤 [FRIEND] Removing friend:', friendId);
      
      const response = await api.delete('/friends/remove', {
        data: { friendId }
      });
      
      console.log('📨 [FRIEND] Remove friend response:', response.data);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'ลบเพื่อนสำเร็จ'
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'ไม่สามารถลบเพื่อนได้'
        };
      }
    } catch (error) {
      console.error('❌ [FRIEND] Remove friend error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการลบเพื่อน'
      };
    }
  }
}

export default new FriendService();
