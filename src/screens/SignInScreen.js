import React, { useState, useRef, useEffect } from "react";
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
import { useNavigation } from "@react-navigation/native";
import authService from "../services/authService";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../contexts/ThemeContext";
import { useUser } from "../contexts/UserContext";
import { useProgress } from "../contexts/ProgressContext";
import dailyStreakService from "../services/dailyStreakService";

const happyImage = require("../assets/images/happy.png");
const cryImage = require("../assets/images/catcry.png");
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
          style={{ width: "100%", borderRadius: 25, overflow: "hidden" }}
        >
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
    color: "#333",
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
});

const SignInScreen = () => {
  const navigation = useNavigation();
  const { login } = useUser();
  const { updateStreak: setProgressStreak } = useProgress();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertImage, setAlertImage] = useState(null);

  const { theme, darkTheme } = useTheme();

  // สำหรับ animation ปุ่ม toggle theme เพิ่มไว้ก่อน
  const translateX = useRef(new Animated.Value(darkTheme ? 22 : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: darkTheme ? 22 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [darkTheme]);

  const handleLogin = async () => {
    if (!email || !password) {
      setAlertTitle("ข้อมูลไม่ครบ");
      setAlertMessage("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      setAlertImage({
        uri: "https://cdn-icons-png.flaticon.com/512/595/595067.png",
      });
      setShowAlert(true);
      return;
    }

    try {
      console.log('🔐 Attempting login with:', { email, password: '***' });
      const result = await authService.login(email, password);
      console.log('🔐 Login result:', result);
      
      if (result.success) {
        // Update user context with login data
        await login(result.user);

        // Update daily streak on login
        try {
          dailyStreakService.setUser(result.user?.id);
          const streakResult = await dailyStreakService.startStreak();
          if (typeof streakResult?.streak === 'number') {
            setProgressStreak(streakResult.streak);
          }
        } catch (streakError) {
          console.warn('⚠️ Failed to update streak on login:', streakError?.message);
        }
        
        setAlertTitle("เข้าสู่ระบบสำเร็จ");
        setAlertMessage("ยินดีต้อนรับกลับมา!");
        setAlertImage(happyImage);
        setShowAlert(true);
        
        // Navigate to main app after successful login
        setTimeout(() => {
          navigation.navigate("MainApp");
        }, 2000);
      } else {
        console.log('❌ Login failed:', result.error);
        setAlertTitle("เข้าสู่ระบบไม่สำเร็จ");
        setAlertMessage(result.error || "ไม่สามารถเข้าสู่ระบบได้");
        setAlertImage(cryImage);
        setShowAlert(true);
      }
    } catch (error) {
      console.log('❌ Login error:', error);
      setAlertTitle("เกิดข้อผิดพลาด");
      setAlertMessage(error.message);
      setAlertImage(cryImage);
      setShowAlert(true);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.brand }]}>
      <View style={styles.container}>
        <View style={styles.topSection}>
         <Image source={logocat} style={styles.logoCat} />
        </View>

        <View style={[styles.bottomSection, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.title, { color: theme.colors.brand }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Login to your account
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              left={<TextInput.Icon icon={() => <FontAwesome name="envelope" size={20} color={theme.colors.textSecondary} />} />}
              style={[styles.textInput, { backgroundColor: theme.colors.background }]}
              theme={{ 
                roundness: 18,
                colors: {
                  text: theme.colors.text,
                  placeholder: theme.colors.textSecondary,
                  background: theme.colors.background,
                  outline: theme.colors.border,
                  primary: theme.colors.brand
                }
              }}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.brand}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon={() => <FontAwesome name="lock" size={20} color={theme.colors.textSecondary} />} />}
              right={
                <TextInput.Icon
                  icon={() => <FontAwesome name={showPassword ? "eye" : "eye-slash"} size={20} color={theme.colors.textSecondary} />}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              style={[styles.textInput, { backgroundColor: theme.colors.background }]}
              theme={{ 
                roundness: 18,
                colors: {
                  text: theme.colors.text,
                  placeholder: theme.colors.textSecondary,
                  background: theme.colors.background,
                  outline: theme.colors.border,
                  primary: theme.colors.brand
                }
              }}
              outlineColor={theme.colors.border}
              activeOutlineColor={theme.colors.brand}
            />
          </View>

          <View style={styles.rowBetween}>
            <View style={styles.rowLeft}>
              <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
                <FontAwesome
                  name={rememberMe ? "check-circle" : "circle-thin"}
                  size={18}
                  color={rememberMe ? theme.colors.brand : theme.colors.textSecondary}
                />
              </TouchableOpacity>
              <Text style={[styles.privacyPolicyText, { color: theme.colors.textSecondary }]}>Remember me</Text>
            </View>

                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={[styles.forgotpasswordLink, { color: theme.colors.brand }]}>Forgot password?</Text>
                </TouchableOpacity>
          </View>

          {(!email || !password) ? (
            <View style={[styles.glossyButton, styles.disabledButton]}>
              <Text style={styles.glossyButtonText}>SIGN IN</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleLogin} style={styles.fullWidthButton}>
              <LinearGradient
                colors={["#FF8C00", "#FFA500"]} // สีส้ม
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glossyButton}
              >
                <Text style={styles.glossyButtonText}>SIGN IN</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={styles.signupLinkContainer}>
            <Text style={[styles.signupLinkText, { color: theme.colors.textSecondary }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.signupLink, { color: theme.colors.brand }]}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CustomAlert */}
      <CustomAlert
        title={alertTitle}
        message={alertMessage}
        visible={showAlert}
        onClose={() => {
          setShowAlert(false);
          if (alertTitle === "เข้าสู่ระบบสำเร็จ") {
            navigation.navigate("MainApp");
          }
        }}
        imageSource={alertImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FF8000" },
  container: { flex: 1, justifyContent: "flex-end" },
  topSection: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 20,
  },
  logoCat: {
    width: 350,
    height: 350,
    marginBottom: -80,
    resizeMode: "contain",
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 150,
    padding: 20,
    alignItems: "center",
    paddingTop: 40,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF8000",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 18,
    color: "#7F8C8D",
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
    shadowColor: "#aaa",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 80,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  privacyPolicyText: {
    fontSize: 14,
    color: "#808080",
    marginLeft: 8,
  },
  forgotpasswordLink: {
    fontSize: 14,
    color: "#FE8305",
  },
  signupLinkContainer: {
    flexDirection: "row",
    marginBottom: 30,
  },
  signupLinkText: {
    color: "#808080",
    fontSize: 14,
  },
  signupLink: {
    color: "#FE8305",
    fontSize: 14,
    fontWeight: "bold",
  },
  fullWidthButton: {
    width: "100%",
  },
  glossyButton: {
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    shadowColor: "#aaa",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  glossyButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default SignInScreen;
