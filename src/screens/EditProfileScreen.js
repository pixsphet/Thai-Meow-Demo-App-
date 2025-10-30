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
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import userService from '../services/userService';

const { width } = Dimensions.get('window');

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
    });
    setErrors({
      username: '',
      email: '',
      petName: '',
    });
  }, [user]);


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
      setErrors(prev => ({ ...prev, username: 'Please enter a username' }));
      isValid = false;
    } else if (formData.username.trim() !== user?.username && formData.username.length < 3) {
      setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
      isValid = false;
    } else {
      setErrors(prev => ({ ...prev, username: '' }));
    }
    if (!formData.email.trim()) {
      setErrors(prev => ({ ...prev, email: 'Please enter an email' }));
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      isValid = false;
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
    if (!formData.petName.trim()) {
      setErrors(prev => ({ ...prev, petName: 'Please enter your pet name' }));
      isValid = false;
    } else if (formData.petName.trim().length < 2) {
      setErrors(prev => ({ ...prev, petName: 'Pet name must be at least 2 characters' }));
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
      // Note: Email and Pet Name are LOCKED and cannot be changed
      const response = await userService.updateUserProfile({
        username: formData.username.trim(),
        email: user?.email, // Keep original email (locked)
        petName: user?.petName, // Keep original pet name (locked)
      });

      if (response.success) {
        // Update local user context
        updateUser({
          ...user,
          username: formData.username.trim(),
          // Email and petName stay the same (locked)
        });

        Alert.alert(
          'Success',
          'Profile updated successfully',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        // Display server error message
        const errorMessage = response.message || response.error || 'Unable to update profile';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel editing',
      'Do you want to discard profile changes?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => navigation.goBack() }
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
            Edit Profile
          </Text>
        </View>
        
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
                source={require("../assets/images/catangry-Photoroom.png")}
                style={[styles.avatar, { borderColor: theme.primary }]}
              />
            </View>
            <View style={styles.previewInfo}>
              <Text style={[styles.previewName, { color: theme.text }]}>
                {formData.username || 'Learner'}
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
                  Add a pet name for your profile
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Account Information
          </Text>

          {/* Username Input */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputLabelRow}>
              <MaterialCommunityIcons name="account" size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.text, marginLeft: 8 }]}>
                Username
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
              placeholder="Enter username"
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
                Email
              </Text>
              <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="lock" size={14} color="#FF9500" />
                <Text style={{ fontSize: 11, color: '#FF9500', fontWeight: '600' }}>Locked</Text>
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
              placeholder="Enter email"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Text style={[styles.hintText, { color: theme.textSecondary, marginTop: 6 }]}>
              💡 Email cannot be changed for security reasons
            </Text>
            {errors.email && (
              <Text style={[styles.errorText, { color: '#EF4444' }]}>{errors.email}</Text>
            )}
          </View>

          {/* Pet Name Input - LOCKED */}
          <View style={[styles.inputCard, { backgroundColor: theme.surface }]}>
            <View style={styles.inputLabelRow}>
              <MaterialCommunityIcons name="cat" size={18} color={theme.primary} />
              <Text style={[styles.label, { color: theme.text, marginLeft: 8 }]}>
                Pet Name
              </Text>
              <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="lock" size={14} color="#FF9500" />
                <Text style={{ fontSize: 11, color: '#FF9500', fontWeight: '600' }}>Locked</Text>
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
              value={formData.petName}
              ref={petNameRef}
              editable={false}
              placeholder="Your pet name"
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={[styles.hintText, { color: theme.textSecondary, marginTop: 6 }]}>
              💡 Pet name cannot be changed; it is used for password recovery
            </Text>
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
              Cancel
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
                    Save
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
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
