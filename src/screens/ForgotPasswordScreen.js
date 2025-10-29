import React, { useState, useRef } from 'react';
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
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/authService';

const ForgotPasswordScreen = () => {
    const navigation = useNavigation();
    const { theme, darkTheme } = useTheme();

    const [email, setEmail] = useState('');
    const [petName, setPetName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPetName, setShowPetName] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [step, setStep] = useState(1); // 1: email, 2: reset password

    const fadeAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 6;
    };

    const handleContinue = () => {
        if (step === 1) {
            // Email validation step
        if (!email.trim()) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมล');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('ข้อผิดพลาด', 'รูปแบบอีเมลไม่ถูกต้อง');
            return;
        }

            // Move to password reset step
            setStep(2);
        } else {
            // Password reset step
            handleResetPassword();
        }
    };

    const handleResetPassword = async () => {
        // Validation
        if (!petName || !newPassword || !confirmPassword) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('ข้อผิดพลาด', 'รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }

        if (!validatePassword(newPassword)) {
            Alert.alert('รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        if (!petName.trim()) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อสัตว์เลี้ยง');
            return;
        }

        setLoading(true);

        try {
            const result = await authService.resetPasswordWithPet(email, petName, newPassword);
            
            if (result.success) {
                setSuccessModalVisible(true);
                // Clear form
                setPetName('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                // Show user-friendly error messages
                let errorMessage = result.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้';
                
                if (result.error && result.error.includes('ไม่พบผู้ใช้ในระบบ')) {
                    errorMessage = 'ไม่พบผู้ใช้ในระบบ กรุณาตรวจสอบอีเมล';
                } else if (result.error && result.error.includes('ชื่อสัตว์เลี้ยงไม่ถูกต้อง')) {
                    errorMessage = 'ชื่อสัตว์เลี้ยงไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
                } else if (result.error && result.error.includes('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')) {
                    errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ';
                }
                
                Alert.alert('ข้อผิดพลาด', errorMessage);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessModalVisible(false);
        navigation.navigate('SignIn');
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            navigation.goBack();
        }
    };

    const SimpleInput = ({ 
        value, 
        onChangeText, 
        placeholder, 
        label,
        inputRef = null,
        onSubmitEditing = null,
        icon = null
    }) => {
        return (
            <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
                <View style={[styles.inputWrapper, { 
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    borderWidth: 1
                }]}>
                    <TextInput
                        ref={inputRef}
                        style={[styles.input, { color: theme.text }]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize="words"
                        autoCorrect={false}
                        spellCheck={false}
                        autoFocus={false}
                        blurOnSubmit={false}
                        returnKeyType="done"
                        onSubmitEditing={onSubmitEditing}
                        enablesReturnKeyAutomatically={false}
                        selectionColor={theme.primary}
                    />
                    {icon && (
                        <View style={styles.eyeButton} pointerEvents="none">
                            {icon}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const PasswordInput = ({ 
        value, 
        onChangeText, 
        placeholder, 
        showPassword, 
        onToggleShow, 
        label,
        inputRef = null,
        onSubmitEditing = null
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
                        ref={inputRef}
                        style={[styles.passwordInput, { color: theme.text }]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry={!showPassword}
                        editable={true}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        autoFocus={false}
                        blurOnSubmit={false}
                        returnKeyType="done"
                        enablesReturnKeyAutomatically={false}
                        selectionColor={theme.primary}
                    />
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={onToggleShow}
                        activeOpacity={0.7}
                    >
                        <Icon 
                            name={showPassword ? "visibility" : "visibility-off"} 
                            size={24} 
                            color={theme.textSecondary} 
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.validationContainer}>
                    <Text style={[styles.validationText, { color: '#666' }]}>
                        รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร
                    </Text>
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
                            onPress={handleBack}
                        >
                            <Icon name="arrow-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>
                            {step === 1 ? 'ลืมรหัสผ่าน' : 'รีเซ็ตรหัสผ่าน'}
                        </Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    {step === 1 ? (
                        // Step 1: Email Input
                        <>
                    {/* Info */}
                    <View style={styles.infoContainer}>
                        <Icon name="lock-reset" size={60} color={theme.primary} />
                        <Text style={[styles.infoTitle, { color: theme.text }]}>รีเซ็ตรหัสผ่าน</Text>
                        <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
                            กรอกอีเมลของคุณเพื่อรีเซ็ตรหัสผ่านด้วยชื่อสัตว์เลี้ยง
                        </Text>
                    </View>
                        </>
                    ) : (
                        // Step 2: Password Reset
                        <>
                            {/* Info */}
                            <View style={styles.infoContainer}>
                                <Icon name="pets" size={60} color={theme.primary} />
                                <Text style={[styles.infoTitle, { color: theme.text }]}>ยืนยันตัวตนด้วยชื่อสัตว์เลี้ยง</Text>
                                <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
                                    กรอกชื่อสัตว์เลี้ยงที่คุณตั้งไว้ตอนสมัครสมาชิก
                                </Text>
                                <Text style={[styles.emailText, { color: theme.primary }]}>{email}</Text>
                            </View>
                        </>
                    )}

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {step === 1 ? (
                            // Step 1: Email Input
                        <View style={styles.inputContainer}>
                            <Text style={[styles.inputLabel, { color: theme.text }]}>อีเมล</Text>
                            <View style={[styles.inputWrapper, { 
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                                borderWidth: 1
                            }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="กรอกอีเมลของคุณ"
                                    placeholderTextColor={theme.textSecondary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoFocus={false}
                                    blurOnSubmit={false}
                                    returnKeyType="done"
                                    enablesReturnKeyAutomatically={true}
                                />
                                <Icon name="email" size={24} color={theme.textSecondary} />
                            </View>
                        </View>
                        ) : (
                            // Step 2: Password Reset
                            <>
                                <SimpleInput
                                    value={petName}
                                    onChangeText={setPetName}
                                    placeholder="ชื่อสัตว์เลี้ยงตัวแรกของคุณ"
                                    label="ชื่อสัตว์เลี้ยง"
                                    icon={<Icon name="pets" size={24} color={theme.textSecondary} />}
                                />

                                <PasswordInput
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="รหัสผ่านใหม่"
                                    showPassword={showNewPassword}
                                    onToggleShow={() => setShowNewPassword(!showNewPassword)}
                                    label="รหัสผ่านใหม่"
                                />

                                <PasswordInput
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="ยืนยันรหัสผ่านใหม่"
                                    showPassword={showConfirmPassword}
                                    onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                                    label="ยืนยันรหัสผ่าน"
                                />
                            </>
                        )}
                    </View>

                    {/* Continue Button */}
                    <LinearGradient
                        colors={["#FF8C00", "#FFA500"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.continueButton}
                    >
                        <TouchableOpacity
                            onPress={handleContinue}
                            disabled={loading || (step === 1 ? !email.trim() : !petName.trim() || !newPassword.trim() || !confirmPassword.trim())}
                            activeOpacity={0.8}
                            style={[
                                styles.continueTouchable,
                                (loading || (step === 1 ? !email.trim() : !petName.trim() || !newPassword.trim() || !confirmPassword.trim())) && styles.disabledButton
                            ]}
                        >
                            {loading ? (
                                <Text style={styles.continueText}>
                                    {step === 1 ? 'กำลังตรวจสอบ...' : 'กำลังรีเซ็ตรหัสผ่าน...'}
                                </Text>
                            ) : (
                                <Text style={styles.continueText}>
                                    {step === 1 ? 'ต่อไป' : 'รีเซ็ตรหัสผ่าน'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Back to Login */}
                    <TouchableOpacity
                        style={styles.backToLoginButton}
                        onPress={() => navigation.navigate('SignIn')}
                    >
                        <Text style={[styles.backToLoginText, { color: theme.primary }]}>
                            กลับไปเข้าสู่ระบบ
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
                            รหัสผ่านของคุณได้รับการรีเซ็ตเรียบร้อยแล้ว
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: theme.primary }]}
                            onPress={handleSuccessClose}
                        >
                            <Text style={styles.modalButtonText}>เข้าสู่ระบบ</Text>
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
    inputWrapper: {
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
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 0,
        minHeight: 48,
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
    // Password input styles
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
        marginTop: 8,
    },
    validationText: {
        fontSize: 12,
        marginLeft: 4,
    },
    emailText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
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

export default ForgotPasswordScreen;
