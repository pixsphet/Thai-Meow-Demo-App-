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
    ActivityIndicator,
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
    const [step, setStep] = useState(1); // 1: verify identity, 2: reset password

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

    const handleContinue = async () => {
        if (step === 1) {
            // Step 1: Verify email and pet name
            if (!email.trim()) {
                Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมล');
                return;
            }

            if (!validateEmail(email)) {
                Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมลให้ถูกต้อง');
                return;
            }

            if (!petName.trim()) {
                Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อสัตว์เลี้ยง');
                return;
            }

            setLoading(true);

            try {
                // Verify identity with backend
                const result = await authService.verifyIdentityForReset({ email, petName });

                if (result.success) {
                    setStep(2);
                } else {
                    Alert.alert('ข้อผิดพลาด', result.message || 'ชื่อสัตว์เลี้ยงไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
                }
            } catch (error) {
                console.error('Verify identity error:', error);
                Alert.alert('ข้อผิดพลาด', error.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
            } finally {
                setLoading(false);
            }
        } else {
            // Step 2: Reset password
            if (!newPassword.trim()) {
                Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัสผ่านใหม่');
                return;
            }

            if (!validatePassword(newPassword)) {
                Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
                return;
            }

            if (newPassword !== confirmPassword) {
                Alert.alert('ข้อผิดพลาด', 'รหัสผ่านใหม่ไม่ตรงกัน');
                return;
            }

            setLoading(true);

            try {
                const result = await authService.resetPassword({ email, petName, newPassword });

                if (result.success) {
                    setSuccessModalVisible(true);
                } else {
                    Alert.alert('ข้อผิดพลาด', result.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้');
                }
            } catch (error) {
                console.error('Reset password error:', error);
                Alert.alert('ข้อผิดพลาด', error.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else {
            navigation.goBack();
        }
    };

    const handleSuccessClose = () => {
        setSuccessModalVisible(false);
        navigation.navigate('SignIn');
    };

    const PasswordInput = ({ value, onChangeText, placeholder, showPassword, onToggleShow, label }) => (
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
                />
                <TouchableOpacity onPress={onToggleShow} style={styles.eyeIcon}>
                    <FontAwesome
                        name={showPassword ? 'eye' : 'eye-slash'}
                        size={20}
                        color={theme.textSecondary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

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

                        {/* Info Section */}
                        <View style={styles.infoContainer}>
                            <Icon name="lock-reset" size={60} color={theme.primary} />
                            <Text style={[styles.infoTitle, { color: theme.text }]}>
                                {step === 1 ? 'ยืนยันตัวตนด้วยชื่อสัตว์เลี้ยง' : 'ตั้งรหัสผ่านใหม่'}
                            </Text>
                            <Text style={[styles.infoSubtitle, { color: theme.textSecondary }]}>
                                {step === 1
                                    ? 'กรุณากรอกอีเมลและชื่อสัตว์เลี้ยงที่คุณใช้ตอนสมัคร'
                                    : 'กรุณาตั้งรหัสผ่านใหม่ของคุณ'}
                            </Text>
                        </View>

                        {step === 1 && (
                            <View style={styles.formContainer}>
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.inputLabel, { color: theme.text }]}>อีเมล</Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: theme.surface,
                                            borderColor: theme.border,
                                            color: theme.text,
                                        }]}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="กรุณากรอกอีเมล"
                                        placeholderTextColor={theme.textSecondary}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!loading}
                                    />
                                </View>

                                <PasswordInput
                                    value={petName}
                                    onChangeText={setPetName}
                                    placeholder="กรุณากรอกชื่อสัตว์เลี้ยง"
                                    showPassword={showPetName}
                                    onToggleShow={() => setShowPetName(!showPetName)}
                                    label="ชื่อสัตว์เลี้ยง"
                                />

                                <TouchableOpacity
                                    onPress={handleContinue}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={["#FF8C00", "#FFA500"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.continueButton}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.continueText}>ยืนยันตัวตน</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                        {step === 2 && (
                            <View style={styles.formContainer}>
                                <View style={styles.emailDisplayContainer}>
                                    <Icon name="email" size={20} color={theme.primary} />
                                    <Text style={[styles.emailDisplayText, { color: theme.text }]}>
                                        {email}
                                    </Text>
                                </View>

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
                                    placeholder="ยืนยันรหัสผ่าน"
                                    showPassword={showConfirmPassword}
                                    onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                                    label="ยืนยันรหัสผ่าน"
                                />

                                <View style={styles.validationContainer}>
                                    <Text style={[styles.validationTitle, { color: theme.text }]}>
                                        ✓ ต้องการเงื่อนไขรหัสผ่าน:
                                    </Text>
                                    <Text style={[styles.validationText, { color: theme.textSecondary }]}>
                                        • อย่างน้อย 6 ตัวอักษร
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={handleContinue}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient
                                        colors={["#FF8C00", "#FFA500"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.continueButton}
                                    >
                                        {loading ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.continueText}>รีเซ็ตรหัสผ่าน</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </ScrollView>

                {/* Success Modal */}
                <Modal
                    visible={successModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={handleSuccessClose}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.successIconContainer}>
                                <Icon name="check-circle" size={60} color="#4CAF50" />
                            </View>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>สำเร็จ!</Text>
                            <Text style={[styles.modalMessage, { color: theme.text }]}>
                                รีเซ็ตรหัสผ่านเรียบร้อยแล้ว
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
            </KeyboardAvoidingView>
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
        paddingHorizontal: 24,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    infoSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    formContainer: {
        gap: 20,
    },
    inputContainer: {
        marginBottom: 4,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    passwordInput: {
        flex: 1,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 4,
    },
    validationContainer: {
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
    },
    validationTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    validationText: {
        fontSize: 12,
    },
    emailDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        marginBottom: 8,
    },
    emailDisplayText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    continueButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    continueText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        width: '85%',
    },
    successIconContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButton: {
        width: '100%',
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ForgotPasswordScreen;

