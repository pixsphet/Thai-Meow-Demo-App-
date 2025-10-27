import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiClient';

class AuthService {
  async login(email, password) {
    try {
      console.log('📤 [APP] login payload =', { email, password }); // ตรวจ payload

      const res = await api.post('/auth/login', { email, password }); // ต้องเป็น JSON
      console.log('📨 [APP] login response =', res.data);
      
      if (res.data.success) {
        // Validate token and user data before storing
        const token = res.data.data.token;
        const user = res.data.data.user;
        
        if (!token) {
          console.error('❌ [LOGIN] No token received from server');
          return {
            success: false,
            error: 'ไม่ได้รับ token จากเซิร์ฟเวอร์'
          };
        }
        
        if (!user) {
          console.error('❌ [LOGIN] No user data received from server');
          return {
            success: false,
            error: 'ไม่ได้รับข้อมูลผู้ใช้จากเซิร์ฟเวอร์'
          };
        }
        
        // Store token and user data
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        
        return {
          success: true,
          user: user,
          token: token
        };
      } else {
        return {
          success: false,
          error: res.data.error || 'เข้าสู่ระบบไม่สำเร็จ'
        };
      }
    } catch (err) {
      console.log('❌ [APP] login error =', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async register(email, password, username, petName) {
    try {
      const res = await api.post('/auth/register', {
        email,
        password,
        username,
        petName
      });

      if (res.data.success) {
        const token = res.data.data?.token;
        const user = res.data.data?.user;

        if (!token || !user) {
          return {
            success: false,
            error: 'ไม่ได้รับข้อมูลผู้ใช้หรือ token จากเซิร์ฟเวอร์'
          };
        }

        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));

        return {
          success: true,
          user,
          token
        };
      }

      return {
        success: false,
        error: res.data.error || 'สมัครสมาชิกไม่สำเร็จ'
      };
    } catch (error) {
      console.error('AuthService register error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
      };
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      return { success: true };
    } catch (error) {
      console.error('AuthService logout error:', error);
      return { success: false, error: 'เกิดข้อผิดพลาดในการออกจากระบบ' };
    }
  }

  async getStoredUser() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('authToken');
      
      if (userData && token) {
        return {
          success: true,
          user: JSON.parse(userData),
          token
        };
      } else {
        return {
          success: false,
          error: 'ไม่พบข้อมูลผู้ใช้'
        };
      }
    } catch (error) {
      console.error('AuthService getStoredUser error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
      };
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return !!token;
    } catch (error) {
      console.error('AuthService isAuthenticated error:', error);
      return false;
    }
  }

  async verifyIdentityForReset(data) {
    try {
      console.log('📤 [AUTH] verifyIdentity payload =', { email: data.email });

      const res = await api.post('/auth/verify-identity', data);
      
      console.log('📨 [AUTH] verifyIdentity response =', res.data);
      
      if (res.data.success) {
        return {
          success: true,
          message: res.data.message || 'ยืนยันตัวตนสำเร็จ'
        };
      } else {
        return {
          success: false,
          message: res.data.error || 'ข้อมูลไม่ถูกต้อง'
        };
      }
    } catch (err) {
      console.log('❌ [AUTH] verifyIdentity error =', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async resetPassword(data) {
    try {
      console.log('📤 [AUTH] resetPassword payload =', { email: data.email });

      const res = await api.post('/auth/reset-password', data);
      
      console.log('📨 [AUTH] resetPassword response =', res.data);
      
      if (res.data.success) {
        return {
          success: true,
          message: res.data.message || 'รีเซ็ตรหัสผ่านสำเร็จ'
        };
      } else {
        return {
          success: false,
          message: res.data.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้'
        };
      }
    } catch (err) {
      console.log('❌ [AUTH] resetPassword error =', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน';
      return {
        success: false,
        message: errorMessage
      };
    }
  }
}

export default new AuthService();
