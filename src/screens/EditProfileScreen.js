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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import userService from '../services/userService';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useUser();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const petNameRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    petName: '',
    avatar: null,
  });

  useEffect(() => {
    // Initialize form with current user data
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      petName: user?.petName || '',
      avatar: user?.avatar || null,
    });
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const focusInput = (ref) => {
    if (ref?.current) {
      ref.current.focus();
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อผู้ใช้');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมล');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมลที่ถูกต้อง');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Update user data via API
      const response = await userService.updateProfile({
        username: formData.username.trim(),
        email: formData.email.trim(),
        petName: formData.petName.trim(),
        avatar: formData.avatar,
      });

      if (response.success) {
        // Update local user context
        updateUser({
          ...user,
          username: formData.username.trim(),
          email: formData.email.trim(),
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
        Alert.alert('ข้อผิดพลาด', response.message || 'ไม่สามารถอัพเดทโปรไฟล์ได้');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์');
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
        >
          <MaterialCommunityIcons name="close" size={24} color={theme.white} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.white }]}>
          แก้ไขโปรไฟล์
        </Text>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.white} />
          ) : (
            <MaterialCommunityIcons name="check" size={24} color={theme.white} />
          )}
        </TouchableOpacity>
      </View>

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
              <TouchableOpacity
                style={[styles.changeAvatarButton, { backgroundColor: theme.primary }]}
                onPress={() => {
              Alert.alert('แจ้งเตือน', 'ฟีเจอร์เปลี่ยนรูปภาพจะเปิดใช้งานในเร็วๆ นี้');
            }}
          >
            <MaterialCommunityIcons name="camera" size={16} color={theme.white} />
            <Text style={[styles.changeAvatarText, { color: theme.white }]}>
              เปลี่ยนรูป
            </Text>
          </TouchableOpacity>
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

          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.label, { color: theme.text }]}>
              ชื่อผู้ใช้
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.lightGray,
                  color: theme.text,
                }
              ]}
              value={formData.username}
              ref={usernameRef}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder="กรอกชื่อผู้ใช้"
              placeholderTextColor={theme.textSecondary}
              maxLength={20}
            />
            <TouchableOpacity
              style={[styles.editFieldButton, { borderColor: theme.primary }]}
              onPress={() => focusInput(usernameRef)}
            >
              <MaterialCommunityIcons name="pencil" size={16} color={theme.primary} />
              <Text style={[styles.editFieldText, { color: theme.primary }]}>
                แก้ไข
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.label, { color: theme.text }]}>
              อีเมล
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.lightGray,
                  color: theme.text,
                }
              ]}
              value={formData.email}
              ref={emailRef}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="กรอกอีเมล"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.editFieldButton, { borderColor: theme.primary }]}
              onPress={() => focusInput(emailRef)}
            >
              <MaterialCommunityIcons name="pencil" size={16} color={theme.primary} />
              <Text style={[styles.editFieldText, { color: theme.primary }]}>
                แก้ไข
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.label, { color: theme.text }]}>
              ชื่อสัตว์เลี้ยง
            </Text>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.lightGray,
                  color: theme.text,
                }
              ]}
              value={formData.petName}
              ref={petNameRef}
              onChangeText={(value) => handleInputChange('petName', value)}
              placeholder="กรอกชื่อสัตว์เลี้ยง (ไม่บังคับ)"
              placeholderTextColor={theme.textSecondary}
              maxLength={15}
            />
            <TouchableOpacity
              style={[styles.editFieldButton, { borderColor: theme.primary }]}
              onPress={() => focusInput(petNameRef)}
            >
              <MaterialCommunityIcons name="pencil" size={16} color={theme.primary} />
              <Text style={[styles.editFieldText, { color: theme.primary }]}>
                แก้ไข
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: theme.primary }]}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: theme.primary }]}>
              ยกเลิก
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.white }]}>
                บันทึก
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  changeAvatarButton: {
    position: 'absolute',
    bottom: -10,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  saveButton: {
    // backgroundColor will be set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
