import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './apiClient';
import { simpleApiService } from './simpleApiService';

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
      // Test connection first
      const connectionTest = await simpleApiService.testConnection();
      if (!connectionTest.success) {
        return {
          success: false,
          error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ'
        };
      }

      const result = await simpleApiService.register({
        email,
        password,
        username,
        petName
      });
      
      if (result.success && result.data) {
        // Validate token and user data before storing
        // The result.data contains the full server response, so we need result.data.data
        const token = result.data.data?.token;
        const user = result.data.data?.user;
        
        if (!token) {
          console.error('❌ [REGISTER] No token received from server');
          return {
            success: false,
            error: 'ไม่ได้รับ token จากเซิร์ฟเวอร์'
          };
        }
        
        if (!user) {
          console.error('❌ [REGISTER] No user data received from server');
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
          error: result.data?.error || result.error || 'สมัครสมาชิกไม่สำเร็จ'
        };
      }
    } catch (error) {
      console.error('AuthService register error:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
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

  async resetPasswordWithPet(email, petName, newPassword) {
    try {
      console.log('📤 [APP] resetPasswordWithPet payload =', { email, petName });

      const res = await api.post('/auth/reset-password-with-pet', { 
        email, 
        petName, 
        newPassword 
      });
      
      console.log('📨 [APP] resetPasswordWithPet response =', res.data);
      
      if (res.data.success) {
        return {
          success: true,
          message: res.data.message || 'รีเซ็ตรหัสผ่านสำเร็จ'
        };
      } else {
        return {
          success: false,
          error: res.data.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้'
        };
      }
    } catch (err) {
      console.log('❌ [APP] resetPasswordWithPet error =', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

export default new AuthService();