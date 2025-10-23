import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggleButton from '../components/ThemeToggleButton';
import userService from '../services/userService';
import imageUploadService from '../services/imageUploadService';

const { width } = Dimensions.get('window');

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useUser();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const petNameRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    petName: '',
    avatar: null,
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    petName: '',
  });

  useEffect(() => {
    // Initialize form with current user data
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      petName: user?.petName || '',
      avatar: user?.avatar || null,
    });
    setErrors({
      username: '',
      email: '',
      petName: '',
    });
  }, [user]);

  const handlePickImageFromLibrary = async () => {
    try {
      setUploading(true);
      setImagePickerVisible(false);
      
      const pickedImage = await imageUploadService.pickImageFromLibrary();
      
      if (pickedImage) {
        // Convert to base64
        const base64 = await imageUploadService.imageToBase64(pickedImage.uri);
        setFormData(prev => ({
          ...prev,
          avatar: base64
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเลือกรูปภาพได้: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setUploading(true);
      setImagePickerVisible(false);
      
      const photo = await imageUploadService.takePhotoWithCamera();
      
      if (photo) {
        // Convert to base64
        const base64 = await imageUploadService.imageToBase64(photo.uri);
        setFormData(prev => ({
          ...prev,
          avatar: base64
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถถ่ายรูปได้: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      avatar: null
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const focusInput = (ref) => {
    if (ref?.current) {
      ref.current.focus();
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleEmailChange = (value) => {
    // Email is locked - do nothing
    // User cannot change email
  };

  const validateForm = () => {
    let isValid = true;
    if (!formData.username.trim()) {
      setErrors(prev => ({ ...prev, username: 'กรุณากรอกชื่อผู้ใช้' }));
      isValid = false;
    } else if (formData.username.trim() !== user?.username && formData.username.length < 3) {
      setErrors(prev => ({ ...prev, username: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' }));
      isValid = false;
    } else {
      setErrors(prev => ({ ...prev, username: '' }));
    }
    if (!formData.email.trim()) {
      setErrors(prev => ({ ...prev, email: 'กรุณากรอกอีเมล' }));
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'กรุณากรอกอีเมลที่ถูกต้อง' }));
      isValid = false;
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    if (!formData.petName.trim()) {
      setErrors(prev => ({ ...prev, petName: 'กรุณากรอกชื่อสัตว์เลี้ยง' }));
      isValid = false;
    } else if (formData.petName.trim().length < 2) {
      setErrors(prev => ({ ...prev, petName: 'ชื่อสัตว์เลี้ยงต้องมีอย่างน้อย 2 ตัวอักษร' }));
      isValid = false;
    } else {
      setErrors(prev => ({ ...prev, petName: '' }));
    }
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Update user data via API
      // Note: Email is LOCKED and cannot be changed
      const response = await userService.updateUserProfile({
        username: formData.username.trim(),
        email: user?.email, // Keep original email (locked)
        petName: formData.petName.trim(),
        avatar: formData.avatar,
      });

      if (response.success) {
        // Update local user context
        updateUser({
          ...user,
          username: formData.username.trim(),
          // Email stays the same (locked)
          petName: formData.petName.trim(),
          avatar: formData.avatar,
        });

        Alert.alert(
          'สำเร็จ',
          'อัพเดทโปรไฟล์เรียบร้อยแล้ว',
          [
            {
              text: 'ตกลง',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        // Display server error message
        const errorMessage = response.message || response.error || 'ไม่สามารถอัพเดทโปรไฟล์ได้';
        Alert.alert('ข้อผิดพลาด', errorMessage);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('ข้อผิดพลาด', error.message || 'เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'ยกเลิกการแก้ไข',
      'คุณต้องการยกเลิกการแก้ไขโปรไฟล์หรือไม่?',
      [
        { text: 'ไม่', style: 'cancel' },
        { text: 'ใช่', onPress: () => navigation.goBack() }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.primary, theme.primary + 'dd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.white} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name="pencil-box" size={28} color={theme.white} />
          <Text style={[styles.headerTitle, { color: theme.white }]}>
            แก้ไขโปรไฟล์
          </Text>
        </View>
        
        <ThemeToggleButton size="small" />
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.white} />
          ) : (
            <MaterialCommunityIcons name="check-circle" size={24} color={theme.white} />
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profilePreview, { backgroundColor: theme.surface }]}>
          <View style={styles.previewRow}>
            <View style={styles.previewAvatarWrapper}>
              <Image
                source={
                  formData.avatar
                    ? { uri: formData.avatar }
                    : require("../assets/images/catangry-Photoroom.png")
                }
                style={[styles.avatar, { borderColor: theme.primary }]}
              />
              <View style={styles.avatarButtonGroup}>
                <TouchableOpacity
                  style={[styles.changeAvatarButton, { backgroundColor: theme.primary }]}
                  onPress={() => setImagePickerVisible(true)}
                  disabled={uploading}
                >
                  <MaterialCommunityIcons name="camera-plus" size={14} color={theme.white} />
                </TouchableOpacity>
                {formData.avatar && (
                  <TouchableOpacity
                    style={[styles.removeAvatarButton, { backgroundColor: '#EF4444' }]}
                    onPress={handleRemoveImage}
                    disabled={uploading}
                  >
                    <MaterialCommunityIcons name="delete" size={14} color={theme.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.previewInfo}>
              <Text style={[styles.previewName, { color: theme.text }]}>
                {formData.username || 'ผู้เรียน'}
              </Text>
              <Text style={[styles.previewEmail, { color: theme.textSecondary }]}>
                {formData.email || 'user@example.com'}
              </Text>
              {formData.petName ? (
                <Text style={[styles.previewPet, { color: theme.orangeAccent }]}>
                  🐱 {formData.petName}
                </Text>
              ) : (
                <Text style={[styles.previewPet, { color: theme.textSecondary }]}>
                  เพิ่มชื่อสัตว์เลี้ยงสำหรับโปรไฟล์ของคุณ
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            ข้อมูลบัญชี
          </Text>

          {/* Username Input */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputLabelRow}>
              <MaterialCommunityIcons name="account" size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.text, marginLeft: 8 }]}>
                ชื่อผู้ใช้
              </Text>
            </View>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.lightGray || '#f5f5f5',
                  borderColor: errors.username ? '#EF4444' : theme.lightGray,
                  color: theme.text,
                  borderWidth: 1,
                }
              ]}
              value={formData.username}
              ref={usernameRef}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder="กรอกชื่อผู้ใช้"
              placeholderTextColor={theme.textSecondary}
              maxLength={20}
            />
            {errors.username && (
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{errors.username}</Text>
            )}
          </View>

          {/* Email Input - LOCKED */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputLabelRow}>
              <MaterialCommunityIcons name="email" size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.text, marginLeft: 8 }]}>
                อีเมล
              </Text>
              <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="lock" size={14} color="#FF9500" />
                <Text style={{ fontSize: 11, color: '#FF9500', fontWeight: '600' }}>ล็อก</Text>
              </View>
            </View>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: '#f0f0f0',
                  borderColor: '#cccccc',
                  color: theme.textSecondary,
                  borderWidth: 1,
                  opacity: 0.7,
                }
              ]}
              value={formData.email}
              ref={emailRef}
              onChangeText={handleEmailChange}
              placeholder="กรอกอีเมล"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={[styles.hintText, { color: theme.textSecondary, marginTop: 6 }]}>
              💡 ไม่สามารถเปลี่ยนอีเมลได้ เพื่อความปลอดภัย
            </Text>
            {errors.email && (
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{errors.email}</Text>
            )}
          </View>

          {/* Pet Name Input */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputLabelRow}>
              <MaterialCommunityIcons name="cat" size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.text, marginLeft: 8 }]}>
                ชื่อสัตว์เลี้ยง
              </Text>
            </View>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.lightGray || '#f5f5f5',
                  borderColor: errors.petName ? '#EF4444' : theme.lightGray,
                  color: theme.text,
                  borderWidth: 1,
                }
              ]}
              value={formData.petName}
              ref={petNameRef}
              onChangeText={(value) => handleInputChange('petName', value)}
              placeholder="กรอกชื่อสัตว์เลี้ยง (ไม่บังคับ)"
              placeholderTextColor={theme.textSecondary}
              maxLength={15}
            />
            {errors.petName && (
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{errors.petName}</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: theme.primary, borderWidth: 2 }]}
            onPress={handleCancel}
            disabled={loading}
          >
            <MaterialCommunityIcons name="close" size={18} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.buttonText, { color: theme.primary }]}>
              ยกเลิก
            </Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[theme.primary, theme.primary + 'cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, styles.saveButton]}
          >
            <TouchableOpacity
              style={styles.saveButtonContent}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color={theme.white} style={{ marginRight: 4 }} />
                  <Text style={[styles.buttonText, { color: theme.white }]}>
                    บันทึก
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          >
            <View style={[styles.modalContentWrapper, { shadowColor: theme.primary }]}>
              <LinearGradient
                colors={['#FFF8F0', '#FFF5E8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconWrapper}>
                    <MaterialCommunityIcons name="image-multiple" size={28} color={theme.primary} />
                  </View>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    เลือกรูปโปรไฟล์
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setImagePickerVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalDivider} />

                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    { 
                      backgroundColor: theme.primary + '15',
                      borderColor: theme.primary + '30',
                    }
                  ]}
                  onPress={handleTakePhoto}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalButtonIcon, { backgroundColor: theme.primary + '25' }]}>
                    <MaterialCommunityIcons name="camera" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.modalButtonContent}>
                    <Text style={[styles.modalButtonText, { color: theme.text }]}>
                      ถ่ายรูปใหม่
                    </Text>
                    <Text style={[styles.modalButtonSubtext, { color: theme.textSecondary }]}>
                      ใช้กล้องเพื่อถ่ายรูปโปรไฟล์
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    { 
                      backgroundColor: theme.primary + '15',
                      borderColor: theme.primary + '30',
                    }
                  ]}
                  onPress={handlePickImageFromLibrary}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalButtonIcon, { backgroundColor: theme.primary + '25' }]}>
                    <MaterialCommunityIcons name="image" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.modalButtonContent}>
                    <Text style={[styles.modalButtonText, { color: theme.text }]}>
                      เลือกจากไลบรารี่
                    </Text>
                    <Text style={[styles.modalButtonSubtext, { color: theme.textSecondary }]}>
                      เลือกรูปภาพที่มีอยู่แล้ว
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.primary} />
                </TouchableOpacity>

                {formData.avatar && (
                  <>
                    <View style={styles.modalDivider} />
                    <TouchableOpacity
                      style={[
                        styles.modalButton, 
                        { 
                          backgroundColor: '#EF4444' + '15',
                          borderColor: '#EF4444' + '30',
                        }
                      ]}
                      onPress={() => {
                        setImagePickerVisible(false);
                        handleRemoveImage();
                      }}
                      disabled={uploading}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.modalButtonIcon, { backgroundColor: '#EF4444' + '25' }]}>
                        <MaterialCommunityIcons name="trash-can" size={24} color="#EF4444" />
                      </View>
                      <View style={styles.modalButtonContent}>
                        <Text style={[styles.modalButtonText, { color: '#EF4444' }]}>
                          ลบรูปปัจจุบัน
                        </Text>
                        <Text style={[styles.modalButtonSubtext, { color: theme.textSecondary }]}>
                          ใช้รูปค่าเริ่มต้น
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </>
                )}
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Uploading Indicator */}
      {uploading && (
        <View style={[styles.uploadingOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[styles.uploadingBox, { backgroundColor: theme.surface }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.uploadingText, { color: theme.text, marginTop: 12 }]}>
              กำลังประมวลผลรูปภาพ...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
  },
  profilePreview: {
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewAvatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  avatarButtonGroup: {
    position: 'absolute',
    bottom: -10,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changeAvatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 0,
  },
  removeAvatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    gap: 0,
  },
  previewInfo: {
    flex: 1,
    marginLeft: 18,
  },
  previewName: {
    fontSize: 22,
    fontWeight: '700',
  },
  previewEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  previewPet: {
    fontSize: 13,
    marginTop: 6,
  },
  formSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  editFieldButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  editFieldText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    flexDirection: 'row',
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContentWrapper: {
    width: '100%',
    maxWidth: width * 0.88,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  modalContent: {
    width: '100%',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  modalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9500' + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: '#FF8C00',
  },
  modalCloseButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 140, 0, 0.08)',
  },
  modalDivider: {
    width: '100%',
    height: 1.5,
    backgroundColor: '#FF9500' + '20',
    marginVertical: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  modalButtonIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonContent: {
    flex: 1,
    marginLeft: 14,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonSubtext: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingBox: {
    width: width * 0.7,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    marginTop: 6,
  },
});

export default EditProfileScreen;
