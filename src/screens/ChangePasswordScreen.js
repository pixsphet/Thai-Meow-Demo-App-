import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import userService from '../services/userService';

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const { theme, darkTheme } = useTheme();
    const { user } = useUser();

    // Use useCallback for stable setState functions
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Stable setState functions
    const handleCurrentPasswordChange = useCallback((text) => {
        setCurrentPassword(text);
    }, []);

    const handleNewPasswordChange = useCallback((text) => {
        setNewPassword(text);
    }, []);

    const handleConfirmPasswordChange = useCallback((text) => {
        setConfirmPassword(text);
    }, []);

    const handleShowCurrentPassword = useCallback(() => {
        setShowCurrentPassword(prev => !prev);
    }, []);

    const handleShowNewPassword = useCallback(() => {
        setShowNewPassword(prev => !prev);
    }, []);

    const handleShowConfirmPassword = useCallback(() => {
        setShowConfirmPassword(prev => !prev);
    }, []);

    // Add keys for TextInput to prevent cursor reset
    const currentPasswordKey = `current-${showCurrentPassword}`;
    const newPasswordKey = `new-${showNewPassword}`;
    const confirmPasswordKey = `confirm-${showConfirmPassword}`;

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    const validatePassword = (password) => {
        if (password.length < 6) return false;
        return true;
    };

    const handleChangePassword = async () => {
        // Validation
        if (!currentPassword.trim()) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัสผ่านปัจจุบัน');
            return;
        }

        if (!newPassword.trim()) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัสผ่านใหม่');
            return;
        }

        if (!confirmPassword.trim()) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกการยืนยันรหัสผ่าน');
            return;
        }

        if (!validatePassword(newPassword)) {
            Alert.alert(
                'รหัสผ่านไม่ถูกต้อง',
                'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('ข้อผิดพลาด', 'รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert('ข้อผิดพลาด', 'รหัสผ่านใหม่ต้องไม่เหมือนเดิม');
            return;
        }

        setLoading(true);

        try {
            const result = await userService.changePassword({
                currentPassword,
                newPassword,
            });

            if (result.success) {
                setSuccessModalVisible(true);
                // Clear form using stable functions
                handleCurrentPasswordChange('');
                handleNewPasswordChange('');
                handleConfirmPasswordChange('');
            } else {
                Alert.alert('ข้อผิดพลาด', result.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
            }
        } catch (error) {
            console.error('Change password error:', error);
            Alert.alert('ข้อผิดพลาด', error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessModalVisible(false);
        navigation.goBack();
    };

    const PasswordInput = ({
        value,
        onChangeText,
        placeholder,
        showPassword,
        onToggleShow,
        label,
    }) => {
        return (
            <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
                <View style={[styles.passwordInputWrapper, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderWidth: 1
                }]}>
                    <TextInput
                        style={[styles.passwordInput, { color: theme.text }]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="password"
                        spellCheck={false}
                        keyboardType="default"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        clearButtonMode="while-editing"
                        selectTextOnFocus={true}
                        contextMenuHidden={false}
                        selectionColor={theme.primary}
                        cursorColor={theme.primary}
                        underlineColorAndroid="transparent"
                        textContentType="password"
                        importantForAutofill="yes"
                        autoFocus={false}
                        maxLength={50}
                        multiline={false}
                        numberOfLines={1}
                        scrollEnabled={false}
                        disableFullscreenUI={true}
                        keyboardAppearance={darkTheme ? 'dark' : 'light'}
                        dataDetectorTypes="none"
                        allowFontScaling={true}
                        adjustsFontSizeToFit={false}
                    />
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={onToggleShow}
                        activeOpacity={0.7}
                        disabled={loading}
                    >
                        <Icon
                            name={showPassword ? "visibility" : "visibility-off"}
                            size={24}
                            color={theme.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={darkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Icon name="arrow-back" size={24} color={theme.text} />
                            </TouchableOpacity>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>
                                เปลี่ยนรหัสผ่าน
                            </Text>
                            <View style={styles.headerSpacer} />
                        </View>

                        {/* Info */}
                        <View style={styles.infoContainer}>
                            <Icon name="lock-reset" size={60} color={theme.primary} />
                            <Text style={[styles.infoTitle, { color: theme.text }]}>
                                เปลี่ยนรหัสผ่าน
                            </Text>
                            <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
                                อัปเดตรหัสผ่านของคุณเพื่อความปลอดภัยที่ดีขึ้น
                            </Text>
                            {user?.email && (
                                <Text style={[styles.emailText, { color: theme.primary }]}>
                                    {user.email}
                                </Text>
                            )}
                        </View>

                        {/* Form */}
                        <View style={styles.formContainer}>
                            <PasswordInput
                                value={currentPassword}
                                onChangeText={handleCurrentPasswordChange}
                                placeholder="กรอกรหัสผ่านปัจจุบัน"
                                showPassword={showCurrentPassword}
                                onToggleShow={handleShowCurrentPassword}
                                label="รหัสผ่านปัจจุบัน"
                            />

                            <PasswordInput
                                value={newPassword}
                                onChangeText={handleNewPasswordChange}
                                placeholder="กรอกรหัสผ่านใหม่"
                                showPassword={showNewPassword}
                                onToggleShow={handleShowNewPassword}
                                label="รหัสผ่านใหม่"
                            />

                            <PasswordInput
                                value={confirmPassword}
                                onChangeText={handleConfirmPasswordChange}
                                placeholder="ยืนยันรหัสผ่านใหม่"
                                showPassword={showConfirmPassword}
                                onToggleShow={handleShowConfirmPassword}
                                label="ยืนยันรหัสผ่าน"
                            />

                            {/* Password Requirements */}
                            <View style={styles.validationContainer}>
                                <Text style={[styles.validationTitle, { color: theme.text }]}>
                                    ✓ ต้องการเงื่อนไขรหัสผ่าน:
                                </Text>
                                <Text style={[styles.validationText, { color: theme.textSecondary }]}>
                                    • อย่างน้อย 6 ตัวอักษร
                                </Text>
                            </View>
                        </View>

                        {/* Change Button */}
                        <LinearGradient
                            colors={["#FF8C00", "#FFA500"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.continueButton}
                        >
                            <TouchableOpacity
                                onPress={handleChangePassword}
                                disabled={loading || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
                                activeOpacity={0.8}
                                style={[
                                    styles.continueTouchable,
                                    (loading || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) && styles.disabledButton
                                ]}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.continueText}>
                                        เปลี่ยนรหัสผ่าน
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </LinearGradient>

                        {/* Back Button */}
                        <TouchableOpacity
                            style={styles.backToLoginButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={[styles.backToLoginText, { color: theme.primary }]}>
                                ยกเลิก
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Success Modal */}
            <Modal
                transparent
                visible={successModalVisible}
                animationType="fade"
                onRequestClose={handleSuccessClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
                        <View style={styles.successIconContainer}>
                            <Icon name="check-circle" size={60} color="#4CAF50" />
                        </View>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>สำเร็จ!</Text>
                        <Text style={[styles.modalMessage, { color: theme.text }]}>
                            เปลี่ยนรหัสผ่านเรียบร้อยแล้ว
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: theme.primary }]}
                            onPress={handleSuccessClose}
                        >
                            <Text style={styles.modalButtonText}>ตกลง</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingTop: 60,
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: 30,
        paddingVertical: 20,
    },
    infoTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 15,
        marginBottom: 10,
        textAlign: 'center',
    },
    infoSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    emailText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    formContainer: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 0,
        minHeight: 48,
    },
    eyeButton: {
        padding: 8,
    },
    validationContainer: {
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    validationTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    validationText: {
        fontSize: 12,
        lineHeight: 18,
    },
    continueButton: {
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 30,
        elevation: 6,
    },
    continueTouchable: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    continueText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backToLoginButton: {
        alignItems: 'center',
        paddingVertical: 15,
    },
    backToLoginText: {
        fontSize: 16,
        fontWeight: '500',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        margin: 20,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    successIconContainer: {
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    modalButton: {
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ChangePasswordScreen;
