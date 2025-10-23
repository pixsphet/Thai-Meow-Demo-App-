import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import userService from '../services/userService';

const ChangePasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 6) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    if (!/[a-z]/.test(password)) return 'รหัสผ่านต้องมีตัวอักษรตัวเล็ก';
    if (!/[A-Z]/.test(password)) return 'รหัสผ่านต้องมีตัวอักษรตัวใหญ่';
    if (!/[0-9]/.test(password)) return 'รหัสผ่านต้องมีตัวเลข';
    return '';
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'กรุณากรอกรหัสผ่านปัจจุบัน';
      isValid = false;
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'กรุณากรอกรหัสผ่านใหม่';
      isValid = false;
    } else {
      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
        isValid = false;
      }
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
      isValid = false;
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'รหัสผ่านใหม่ต้องไม่เหมือนเดิม';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await userService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        Alert.alert(
          'สำเร็จ',
          'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
          [
            {
              text: 'ตกลง',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('ข้อผิดพลาด', response.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'ยกเลิก',
      'คุณต้องการยกเลิกการเปลี่ยนรหัสผ่านหรือไม่?',
      [
        { text: 'ไม่', style: 'cancel' },
        { text: 'ใช่', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.primary + 'dd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <MaterialCommunityIcons name="close" size={24} color={theme.white} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name="lock-reset" size={28} color={theme.white} />
          <Text style={[styles.headerTitle, { color: theme.white }]}>เปลี่ยนรหัสผ่าน</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleChangePassword}
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
        <View style={styles.formContainer}>
          {/* Current Password */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputLabelRow}>
              <MaterialCommunityIcons name="lock" size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.text, marginLeft: 8 }]}>
                รหัสผ่านปัจจุบัน
              </Text>
            </View>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.lightGray || '#f5f5f5',
                  borderColor: errors.currentPassword ? '#EF4444' : theme.lightGray,
                  color: theme.text,
                  borderWidth: 1,
                }
              ]}
              value={formData.currentPassword}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, currentPassword: text }));
                if (errors.currentPassword) {
                  setErrors(prev => ({ ...prev, currentPassword: '' }));
                }
              }}
              placeholder="กรอกรหัสผ่านปัจจุบัน"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPasswords.current}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
            >
              <MaterialCommunityIcons
                name={showPasswords.current ? 'eye' : 'eye-off'}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {errors.currentPassword && (
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{errors.currentPassword}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputLabelRow}>
              <MaterialCommunityIcons name="lock-plus" size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.text, marginLeft: 8 }]}>
                รหัสผ่านใหม่
              </Text>
            </View>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.lightGray || '#f5f5f5',
                  borderColor: errors.newPassword ? '#EF4444' : theme.lightGray,
                  color: theme.text,
                  borderWidth: 1,
                }
              ]}
              value={formData.newPassword}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, newPassword: text }));
                if (errors.newPassword) {
                  setErrors(prev => ({ ...prev, newPassword: '' }));
                }
              }}
              placeholder="กรอกรหัสผ่านใหม่"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPasswords.new}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
            >
              <MaterialCommunityIcons
                name={showPasswords.new ? 'eye' : 'eye-off'}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {errors.newPassword && (
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{errors.newPassword}</Text>
            )}
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>
              💡 ต้องมี: ตัวเล็ก, ตัวใหญ่, ตัวเลข, อย่างน้อย 6 ตัวอักษร
            </Text>
          </View>

          {/* Confirm Password */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputLabelRow}>
              <MaterialCommunityIcons name="lock-check" size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.text, marginLeft: 8 }]}>
                ยืนยันรหัสผ่านใหม่
              </Text>
            </View>
            <TextInput
              style={[
                styles.inputField,
                {
                  backgroundColor: theme.lightGray || '#f5f5f5',
                  borderColor: errors.confirmPassword ? '#EF4444' : theme.lightGray,
                  color: theme.text,
                  borderWidth: 1,
                }
              ]}
              value={formData.confirmPassword}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, confirmPassword: text }));
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
              placeholder="ยืนยันรหัสผ่าน"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={!showPasswords.confirm}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
            >
              <MaterialCommunityIcons
                name={showPasswords.confirm ? 'eye' : 'eye-off'}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
            {errors.confirmPassword && (
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Security Tips */}
          <View style={[styles.securityTips, { backgroundColor: theme.primary + '10' }]}>
            <MaterialCommunityIcons name="shield-alert" size={20} color={theme.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.tipTitle, { color: theme.primary }]}>เคล็ดลับความปลอดภัย</Text>
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                • ใช้รหัสผ่านที่ยากต่อการทายง่าย{'\n'}
                • อย่าบอกรหัสผ่านให้ใครทราบ{'\n'}
                • เปลี่ยนรหัสผ่านเป็นระยะ
              </Text>
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    gap: 16,
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
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 50,
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    marginTop: 8,
  },
  securityTips: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 32,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default ChangePasswordScreen;
