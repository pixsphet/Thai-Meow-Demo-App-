import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Animated,
} from "react-native";
import { TextInput } from "react-native-paper";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import authService from "../services/authService";
import { useTheme } from "../contexts/ThemeContext";
import { useUser } from "../contexts/UserContext";

const logocat = require("../assets/images/logocat2.png")

// ----- CustomAlert Component -----
const CustomAlert = ({ title, message, visible, onClose, imageSource }) => {
  if (!visible) return null;

  return (
    <View style={customAlertStyles.overlay}>
      <View style={customAlertStyles.alertContainer}>
        {imageSource && (
          <Image source={imageSource} style={customAlertStyles.alertImage} />
        )}
        <Text style={customAlertStyles.alertTitle}>{title}</Text>
        <Text style={customAlertStyles.alertMessage}>{message}</Text>
        <TouchableOpacity
          onPress={onClose}
          style={customAlertStyles.alertButtonContainer}>
          <LinearGradient
            colors={["#FFA500", "#FE8305"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={customAlertStyles.alertButton}
          >
            <Text style={customAlertStyles.alertButtonText}>OK</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const customAlertStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 25,
    padding: 25,
    width: "80%",
    alignItems: "center",
    elevation: 10,
  },
  alertImage: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    color: "#808080",
    textAlign: "center",
    marginBottom: 20,
  },
  alertButton: {
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 25,
  },
  alertButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  alertButtonContainer: {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
  },
});

const SignUpScreen = ({ navigation }) => {
  const { login } = useUser();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [petName, setPetName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  // state alert custom
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const { theme, darkTheme } = useTheme();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;

  // Logo animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoRotation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotation, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleSignUp = async () => {
  if (!email || !username || !password || !confirmPassword || !petName) {
    showAlert("แจ้งเตือน", "กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }
  if (username.length < 3) {
    showAlert("ชื่อผู้ใช้ไม่ถูกต้อง", "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร");
    return;
  }
  if (password.length < 6) {
    showAlert("รหัสผ่านไม่ถูกต้อง", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    return;
  }
  if (password !== confirmPassword) {
    showAlert("รหัสผ่านไม่ถูกต้อง", "รหัสผ่านไม่ตรงกัน");
    return;
  }
  if (!petName.trim()) {
    showAlert("แจ้งเตือน", "กรุณากรอกชื่อสัตว์เลี้ยง");
    return;
  }
  if (!agree) {
    showAlert("แจ้งเตือน", "โปรดยอมรับนโยบายความเป็นส่วนตัว");
    return;
  }

  try {
    const result = await authService.register(email, password, username, petName);
    
    if (result.success) {
      // Update user context with registration data
      await login(result.user);
      
      console.log("สมัครสำเร็จ", result.user);
      showAlert("สำเร็จ", "สมัครสมาชิกเรียบร้อย! ไปเลือกระดับการเรียนรู้กันเลย");
      setTimeout(() => {
        setAlertVisible(false);
        navigation.navigate("MainApp");
      }, 2000);
    } else {
      // Parse error message to show user-friendly message
      let errorMessage = result.error || "ไม่สามารถสมัครสมาชิกได้";
      
      // Handle specific Thai error messages from backend
      if (result.error && result.error.includes("อีเมลนี้มีผู้ใช้งานแล้ว")) {
        errorMessage = "อีเมลนี้มีผู้ใช้งานแล้ว กรุณาใช้อีเมลอื่น";
      } else if (result.error && result.error.includes("ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว")) {
        errorMessage = "ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว กรุณาเลือกชื่ออื่น";
      } else if (result.error && result.error.includes("ชื่อสัตว์เลี้ยงนี้มีผู้ใช้งานแล้ว")) {
        errorMessage = "ชื่อสัตว์เลี้ยงนี้มีผู้ใช้งานแล้ว กรุณาเลือกชื่ออื่น";
      } else if (result.error && result.error.includes("กรุณากรอกข้อมูลให้ครบถ้วน")) {
        errorMessage = "กรุณากรอกข้อมูลให้ครบถ้วน";
      } else if (result.error && result.error.includes("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")) {
        errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ";
      }
      
      showAlert("เกิดข้อผิดพลาด", errorMessage);
    }
  } catch (error) {
    console.log("เกิดข้อผิดพลาด", error.message);
    
    // Parse error message to show user-friendly message
    let errorMessage = error.message;
    
    // Handle specific Thai error messages from backend
    if (error.message.includes("อีเมลนี้มีผู้ใช้งานแล้ว")) {
      errorMessage = "อีเมลนี้มีผู้ใช้งานแล้ว กรุณาใช้อีเมลอื่น";
    } else if (error.message.includes("ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว")) {
      errorMessage = "ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว กรุณาเลือกชื่ออื่น";
    } else if (error.message.includes("ชื่อสัตว์เลี้ยงนี้มีผู้ใช้งานแล้ว")) {
      errorMessage = "ชื่อสัตว์เลี้ยงนี้มีผู้ใช้งานแล้ว กรุณาเลือกชื่ออื่น";
    } else if (error.message.includes("กรุณากรอกข้อมูลให้ครบถ้วน")) {
      errorMessage = "กรุณากรอกข้อมูลให้ครบถ้วน";
    } else if (error.message.includes("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")) {
      errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ";
    } else if (error.message.includes("Network Error") || error.message.includes("AxiosError")) {
      errorMessage = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ";
    }
    
    showAlert("เกิดข้อผิดพลาด", errorMessage);
  }
};



  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.brand }]}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          {/* Decorative circles */}
          <View style={[styles.decorativeCircle1, { backgroundColor: theme.colors.brandLight + '40' }]} />
          <View style={[styles.decorativeCircle2, { backgroundColor: theme.colors.brand + '50' }]} />
          <View style={[styles.decorativeCircle3, { backgroundColor: theme.colors.brandDark + '60' }]} />
          
          <LinearGradient
            colors={[theme.colors.brandDark, theme.colors.brand, theme.colors.brandLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  transform: [
                    { scale: logoScale },
                    {
                      rotate: logoRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '5deg'],
                      }),
                    },
                  ],
                  opacity: logoOpacity,
                },
              ]}
            >
              <Image source={logocat} style={styles.logoCat} />
            </Animated.View>
          </LinearGradient>
        </View>

        <View style={[styles.bottomSection, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.brand }]}>Register</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Create your new account</Text>

          <View style={styles.inputContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              left={
                <TextInput.Icon
                  icon={() => (
                    <FontAwesome name="envelope" size={20} color="#808080" />
                  )}
                />
              }
              style={[styles.textInput, { backgroundColor: theme.colors.background }]}
              theme={inputTheme(theme)}
            />

            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              left={
                <TextInput.Icon
                  icon={() => (
                    <FontAwesome name="user" size={20} color="#808080" />
                  )}
                />
              }
              style={[styles.textInput, { backgroundColor: theme.colors.background }]}
              theme={inputTheme(theme)}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={
                <TextInput.Icon
                  icon={() => (
                    <FontAwesome name="lock" size={20} color="#808080" />
                  )}
                />
              }
              right={
                <TextInput.Icon
                  icon={() => (
                    <FontAwesome
                      name={showPassword ? "eye" : "eye-slash"}
                      size={20}
                      color="#808080"
                    />
                  )}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={[styles.textInput, { backgroundColor: theme.colors.background }]}
              theme={inputTheme(theme)}
            />

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              left={
                <TextInput.Icon
                  icon={() => (
                    <FontAwesome name="lock" size={20} color="#808080" />
                  )}
                />
              }
              right={
                <TextInput.Icon
                  icon={() => (
                    <FontAwesome
                      name={showConfirmPassword ? "eye" : "eye-slash"}
                      size={20}
                      color="#808080"
                    />
                  )}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              style={[styles.textInput, { backgroundColor: theme.colors.background }]}
              theme={inputTheme(theme)}
            />

            <TextInput
              label="ชื่อสัตว์เลี้ยงตัวแรกของคุณ?"
              value={petName}
              onChangeText={setPetName}
              mode="outlined"
              left={
                <TextInput.Icon
                  icon={() => (
                    <FontAwesome name="paw" size={20} color="#808080" />
                  )}
                />
              }
              style={[styles.textInput, { backgroundColor: theme.colors.background }]}
              theme={inputTheme(theme)}
              placeholder="เช่น มะลิ, โบโบ้"
              helper="จำง่าย ใช้ยืนยันตอนเปลี่ยนรหัสผ่าน"
            />
          </View>

          <View style={styles.privacyPolicyContainer}>
            <TouchableOpacity onPress={() => setAgree(!agree)}>
              <FontAwesome
                name={agree ? "check-circle" : "circle-thin"}
                size={20}
                color={agree ? theme.colors.brand : theme.colors.textSecondary}
              />
            </TouchableOpacity>
            <Text style={[styles.privacyPolicyText, { color: theme.colors.textSecondary }]}>
              I agree with privacy policy
            </Text>
          </View>

          {/* Social logins removed */}

          {!agree ? (
            <View style={[styles.glossyButton, { backgroundColor: "#FFB366" }]}>
              <Text style={[styles.glossyButtonText, { color: "#ffffff" }]}>
                SIGN UP
              </Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleSignUp} style={styles.fullWidth}>
              <LinearGradient
                colors={["#FF8C00", "#FFA500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glossyButton}>
                <Text style={styles.glossyButtonText}>SIGN UP</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.loginLinkContainer}>
            <Text style={[styles.signupLinkText, { color: theme.colors.textSecondary }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
              <Text style={[styles.loginLink, { color: theme.colors.brand }]}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Custom alert */}
      <CustomAlert
        title={alertTitle}
        message={alertMessage}
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const inputTheme = (theme) => ({
  roundness: 18,
  colors: {
    primary: theme.colors.brand,
    background: theme.colors.background,
    text: theme.colors.text,
    placeholder: theme.colors.textSecondary,
    outline: theme.colors.border,
  },
});

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#FF8000" // Thai Meow brand color
  },
  container: { 
    flex: 1, 
    justifyContent: "flex-end" 
  },
  topSection: {
    flex: 0.3,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -40,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
  },
  logoWrapper: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCat: {
    width: 280,
    height: 280,
    marginBottom: -60,
    resizeMode: "contain",
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 140, 0, 0.2)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.3)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 60,
    left: 50,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 179, 102, 0.4)',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#ffffff", // White for bottom section
    borderTopLeftRadius: 150,
    padding: 20,
    alignItems: "center",
    paddingTop: 40,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF8C00", // Orange
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 18,
    color: "#000000", // Black
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 10,
  },
  textInput: {
    marginBottom: 15,
    backgroundColor: "#ffffff",
    fontSize: 16,
    borderRadius: 18,
    shadowColor: "#aaaaaa",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  privacyPolicyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  privacyPolicyText: {
    fontSize: 14,
    color: "#000000", // Black
    marginLeft: 8,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    marginTop: -1,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#FF8C00", // Orange
  },
  separatorText: {
    marginHorizontal: 10,
    color: "#000000", // Black
    fontSize: 14,
  },
  circleSocialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20, // Reduced from 40 to 20 to move button up
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    backgroundColor: "#808080",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3.84,
    elevation: 5,
  },
  glossyButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
    shadowColor: "#aaaaaa",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  glossyButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  loginLinkContainer: {
    flexDirection: "row",
    marginBottom: 5,
  },
  loginLinkText: {
    color: "#000000", // Black
    fontSize: 14,
  },
  loginLink: {
    color: "#FF8C00", // Orange
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  fullWidth: {
    width: "100%",
  },
});

export default SignUpScreen;
