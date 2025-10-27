import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

class ImageUploadService {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  }

  // Request permissions for camera and library
  async requestPermissions() {
    try {
      // Request camera permission
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      // Request media library permission
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
        Alert.alert(
          'ขาดสิทธิ์การเข้าถึง',
          'ต้องการสิทธิ์ในการเข้าถึงกล้องและไลบรารี่รูปภาพ'
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Pick image from library
  async pickImageFromLibrary() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert('ข้อผิดพลาด', 'ต้องการสิทธิ์ในการเข้าถึงไลบรารี่รูปภาพ');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('ข้อผิดพลาด', error.message || 'ไม่สามารถเลือกรูปภาพได้ ลองใหม่อีกครั้ง');
      return null;
    }
  }

  // Take photo with camera
  async takePhotoWithCamera() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert('ข้อผิดพลาด', 'ต้องการสิทธิ์ในการเข้าถึงกล้อง');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('ข้อผิดพลาด', error.message || 'ไม่สามารถถ่ายรูปได้ ลองใหม่อีกครั้ง');
      return null;
    }
  }

  // Validate image
  async validateImage(imageUri) {
    try {
      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (fileInfo.size > this.maxFileSize) {
        throw new Error(`ขนาดไฟล์ใหญ่เกินไป (สูงสุด ${this.maxFileSize / 1024 / 1024}MB)`);
      }

      return true;
    } catch (error) {
      console.error('Error validating image:', error);
      throw error;
    }
  }

  // Convert image to base64
  async imageToBase64(imageUri) {
    try {
      // Validate image first
      await this.validateImage(imageUri);

      // Read file and convert to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  // Compress image if needed
  async compressImage(imageUri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      // If file is small enough, return as is
      if (fileInfo.size < 500 * 1024) {
        return imageUri;
      }

      console.log('Compressing image...');
      return imageUri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return imageUri;
    }
  }
}

export default new ImageUploadService();
