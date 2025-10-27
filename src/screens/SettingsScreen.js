import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

import levelUnlockService from '../services/levelUnlockService';
import { resetAllLessonProgress, resetLessonProgress, resetEverything } from '../services/progressService';
import gameProgressService from '../services/gameProgressService';

import { useTheme } from '../contexts/ThemeContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedToggle = ({ value, onToggle, mode = 'default' }) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const knobTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 36],
  });

  const gradientColors = mode === 'theme'
    ? value
      ? ['#5257E5', '#7B8CFF']
      : ['#FFB347', '#FFCC33']
    : value
      ? ['#1DD1A1', '#10AC84']
      : ['#dfe4ea', '#ced6e0'];

  const leftIcon = mode === 'theme' ? 'white-balance-sunny' : 'bell-off';
  const rightIcon = mode === 'theme' ? 'weather-night' : 'bell-ring';

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={styles.toggleWrapper}>
      <LinearGradient colors={gradientColors} style={styles.toggleBackground}>
        <MaterialCommunityIcons name={leftIcon} size={16} color="#fff" style={styles.toggleIconLeft} />
        <MaterialCommunityIcons name={rightIcon} size={16} color="#fff" style={styles.toggleIconRight} />
        <Animated.View style={[styles.toggleKnob, { transform: [{ translateX: knobTranslate }] }]} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const SectionCard = ({ title, children, theme, isDark }) => (
  <View
    style={[
      styles.sectionCard,
      {
        backgroundColor: theme?.card || '#fff',
        shadowColor: isDark ? '#000' : '#1a1a1a',
      },
    ]}
  >
    <Text style={[styles.sectionTitle, { color: theme?.primary || '#FF8C00' }]}> 
      {title}
    </Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const SettingsRow = ({ icon, label, value, onPress, theme, isLast }) => (
  <TouchableOpacity
    style={[
      styles.row,
      { borderColor: theme?.border || 'rgba(0,0,0,0.06)' },
      isLast && { borderBottomWidth: 0, paddingBottom: 0 },
    ]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={styles.rowLeft}>
      <View style={[styles.rowIconWrapper, { backgroundColor: 'rgba(255,140,0,0.1)' }]}>
        <MaterialCommunityIcons name={icon} size={20} color="#FF8C00" />
      </View>
      <Text style={[styles.rowLabel, { color: theme?.text || '#333' }]}>{label}</Text>
    </View>
    {value}
  </TouchableOpacity>
);

const MetricCard = ({ metric, theme }) => (
  <View
    style={[
      styles.metricCard,
      {
        backgroundColor: theme?.card || '#fff',
        borderColor: theme?.border || 'rgba(0,0,0,0.05)',
      },
    ]}
  >
    <LottieView source={metric.icon} autoPlay loop style={styles.metricIcon} />
    <View style={styles.metricContent}>
      <Text style={[styles.metricLabel, { color: theme?.textSecondary || '#6B7280' }]}>
        {metric.label}
      </Text>
      <Text style={[styles.metricValue, { color: theme?.text || '#111827' }]}>
        {metric.value}
      </Text>
    </View>
  </View>
);

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const [selectedLanguage, setSelectedLanguage] = useState('TH');
  const [contactExpanded, setContactExpanded] = useState(false);

  // Create flattened theme object for easier access
  const flatTheme = {
    background: theme.colors?.background || '#fff',
    card: theme.colors?.surface || '#fff',
    text: theme.colors?.text || '#333',
    textSecondary: theme.colors?.textSecondary || '#666',
    primary: theme.colors?.primary || '#FF8C00',
    border: theme.colors?.border || 'rgba(0,0,0,0.06)',
  };

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
        }

        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          // If theme doesn't match, toggle it
          const savedIsDark = JSON.parse(savedTheme);
          if (savedIsDark !== isDarkMode) {
            // Note: toggleTheme should be called if needed
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Handle language change with persistence
  const handleLanguageChange = async (code) => {
    setSelectedLanguage(code);
    try {
      await AsyncStorage.setItem('selectedLanguage', code);
      console.log('Language changed to:', code);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  // Handle theme toggle with persistence
  const handleThemeToggle = async () => {
    toggleTheme();
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(!isDarkMode));
      console.log('Theme switched to:', !isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const languageOptions = useMemo(() => ([
    { code: 'TH', label: 'ไทย', flag: '🇹🇭' },
    { code: 'EN', label: 'English', flag: '🇺🇸' },
  ]), []);

  const contactActions = useMemo(() => ([
    { icon: 'phone', label: 'โทรหาเรา', action: () => Linking.openURL('tel:020000000') },
    { icon: 'facebook', label: 'Facebook', action: () => Linking.openURL('https://facebook.com') },
    { icon: 'email', label: 'อีเมล', action: () => Linking.openURL('mailto:hello@thaimeow.app') },
    { icon: 'book-information-variant', label: 'Help Center', action: () => Linking.openURL('https://thaimeow.help') },
  ]), []);

  const toggleContact = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setContactExpanded(prev => !prev);
  };

  // Reset handlers for each level
  const handleResetBeginnerProgress = async () => {
    Alert.alert(
      'รีเซ็ตความคืบหน้าระดับ Beginner',
      'คุณแน่ใจหรือว่าต้องการรีเซ็ตทั้งหมด? ข้อมูลทั้งหมดจะถูกลบและเป็นแบบเริ่มใหม่',
      [
        { text: 'ยกเลิก', onPress: () => {}, style: 'cancel' },
        {
          text: 'รีเซ็ต',
          onPress: async () => {
            try {
              await levelUnlockService.resetAllProgress();
              await resetLessonProgress(1);
              await resetLessonProgress(2);
              await resetLessonProgress(3);
              alert('✅ รีเซ็ต Beginner เสร็จสิ้น! เริ่มเล่นใหม่ได้เลย');
            } catch (error) {
              alert('❌ เกิดข้อผิดพลาด: ' + error.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleResetIntermediateProgress = async () => {
    Alert.alert(
      'รีเซ็ตความคืบหน้าระดับ Intermediate',
      'คุณแน่ใจหรือว่าต้องการรีเซ็ต? ข้อมูลทั้งหมดจะถูกลบ',
      [
        { text: 'ยกเลิก', onPress: () => {}, style: 'cancel' },
        {
          text: 'รีเซ็ต',
          onPress: async () => {
            try {
              await resetLessonProgress(4);
              await resetLessonProgress(5);
              await resetLessonProgress(6);
              alert('✅ รีเซ็ต Intermediate เสร็จสิ้น!');
            } catch (error) {
              alert('❌ เกิดข้อผิดพลาด: ' + error.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleResetAdvancedProgress = async () => {
    Alert.alert(
      'รีเซ็ตความคืบหน้าระดับ Advanced',
      'คุณแน่ใจหรือว่าต้องการรีเซ็ต? ข้อมูลทั้งหมดจะถูกลบ',
      [
        { text: 'ยกเลิก', onPress: () => {}, style: 'cancel' },
        {
          text: 'รีเซ็ต',
          onPress: async () => {
            try {
              await resetLessonProgress(7);
              await resetLessonProgress(8);
              await resetLessonProgress(9);
              await resetLessonProgress(10);
              alert('✅ รีเซ็ต Advanced เสร็จสิ้น!');
            } catch (error) {
              alert('❌ เกิดข้อผิดพลาด: ' + error.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleResetAllProgress = async () => {
    Alert.alert(
      'รีเซ็ตความคืบหน้าทั้งหมด',
      '⚠️ คำเตือน: การดำเนินการนี้จะลบข้อมูลทั้งหมดของคุณและเริ่มใหม่จากศูนย์\n\nคุณแน่ใจหรือ?',
      [
        { text: 'ยกเลิก', onPress: () => {}, style: 'cancel' },
        {
          text: 'ลบทั้งหมด',
          onPress: async () => {
            try {
              await levelUnlockService.resetAllProgress();
              await resetAllLessonProgress();
              alert('✅ รีเซ็ตทั้งหมดเสร็จสิ้น! เริ่มเล่นใหม่ได้เลย');
            } catch (error) {
              alert('❌ เกิดข้อผิดพลาด: ' + error.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleUltraReset = async () => {
    Alert.alert(
      '🔥 ULTRA RESET - เริ่มใหม่หมดเลย',
      '⚠️ ⚠️ คำเตือนสำคัญ ⚠️ ⚠️\n\n🗑️ การดำเนินการนี้จะลบข้อมูลทั้งหมด:\n• ความคืบหน้าทั้งหมด\n• สถิติการเล่น\n• คะแนน XP\n• เพชร\n• ด่านที่ปลดล็อก\n• ทุกอย่าง!\n\n🔄 ผลลัพธ์: เริ่มเล่นใหม่จากด่านแรก\n\nคุณแน่ใจว่าต้องการทำเช่นนี้?',
      [
        { text: 'ยกเลิก', onPress: () => {}, style: 'cancel' },
        {
          text: 'รีเซ็ตโลกใหม่!',
          onPress: async () => {
            try {
              console.log('🔥 ULTRA RESET INITIATED');
              await resetEverything();
              alert('🌟 ULTRA RESET เสร็จสิ้น!\n\nทุกอย่างถูกลบแล้ว\nเริ่มเล่นใหม่ได้เลย 🎮');
            } catch (error) {
              console.error('ULTRA RESET Error:', error);
              alert('❌ เกิดข้อผิดพลาด: ' + error.message);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: flatTheme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={styles.headerWithToggle}>
        <LinearGradient colors={['#FF8C00', '#FFB347']} style={styles.hero}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>ตั้งค่า</Text>
            <Text style={styles.heroSubtitle}>จัดการประสบการณ์การเรียนรู้ของคุณ</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="บัญชีผู้ใช้" theme={flatTheme} isDark={isDarkMode}>
          <SettingsRow
            icon="account-circle"
            label="โปรไฟล์"
            value={<MaterialCommunityIcons name="chevron-right" size={22} color="#B0BEC5" />}
            onPress={() => navigation.navigate('Profile')}
            theme={flatTheme}
          />
          <SettingsRow
            icon="key"
            label="ความปลอดภัย"
            value={<MaterialCommunityIcons name="chevron-right" size={22} color="#B0BEC5" />}
            onPress={() => navigation.navigate('ChangePassword')}
            theme={flatTheme}
            isLast
          />
        </SectionCard>

        <SectionCard title="ภาษาและระดับการเรียน" theme={flatTheme} isDark={isDarkMode}>
        <View style={styles.languageRow}>
          {languageOptions.map((option, index) => {
            const selected = option.code === selectedLanguage;
            return (
              <View
                key={option.code}
                style={[styles.languageChipWrapper, index === languageOptions.length - 1 && { marginRight: 0 }]}
              >
                <TouchableOpacity
                  style={[
                    styles.languageChip,
                    { backgroundColor: flatTheme.card, borderColor: flatTheme.border },
                    selected && { backgroundColor: 'rgba(255,140,0,0.12)', borderColor: flatTheme.primary },
                  ]}
                  onPress={() => handleLanguageChange(option.code)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.languageFlag}>{option.flag}</Text>
                  <Text
                    style={[
                      styles.languageLabel,
                      { color: flatTheme.textSecondary },
                      selected && [{ color: flatTheme.primary, fontWeight: '600' }],
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        </SectionCard>

        <SectionCard title="ธีม" theme={flatTheme} isDark={isDarkMode}>
          <SettingsRow
            icon="theme-light-dark"
            label="โหมดธีม"
            value={<AnimatedToggle value={isDarkMode} onToggle={handleThemeToggle} mode="theme" />}
            theme={flatTheme}
            isLast
          />
        </SectionCard>

        <SectionCard title="ติดต่อและข้อมูลเพิ่มเติม" theme={flatTheme} isDark={isDarkMode}>
          <SettingsRow
            icon="headset"
            label="ช่องทางติดต่อ"
            value={(
              <MaterialCommunityIcons
                name={contactExpanded ? 'chevron-up' : 'chevron-right'}
                size={22}
                color="#B0BEC5"
              />
            )}
            onPress={toggleContact}
            theme={flatTheme}
            isLast
          />
          {contactExpanded && (
            <View style={styles.contactGrid}>
              {contactActions.map(action => (
                <TouchableOpacity
                  key={action.icon}
                  style={[
                    styles.contactButton,
                    { backgroundColor: flatTheme.card, borderColor: flatTheme.border },
                  ]}
                  onPress={action.action}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name={action.icon} size={22} color="#FF8C00" />
                  <Text style={[styles.contactLabel, { color: flatTheme.textSecondary }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SectionCard>

        <SectionCard title="รีเซ็ตความคืบหน้า" theme={flatTheme} isDark={isDarkMode}>
          <View style={styles.resetButtonsContainer}>
            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: '#4CAF50' }]}
              onPress={handleResetBeginnerProgress}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#4CAF50" />
              <Text style={[styles.resetButtonText, { color: '#4CAF50' }]}>Beginner</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: 'rgba(33, 150, 243, 0.1)', borderColor: '#2196F3' }]}
              onPress={handleResetIntermediateProgress}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#2196F3" />
              <Text style={[styles.resetButtonText, { color: '#2196F3' }]}>Intermediate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: 'rgba(156, 39, 176, 0.1)', borderColor: '#9C27B0' }]}
              onPress={handleResetAdvancedProgress}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#9C27B0" />
              <Text style={[styles.resetButtonText, { color: '#9C27B0' }]}>Advanced</Text>
            </TouchableOpacity>

            <View style={{ height: 8 }} />

            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: 'rgba(244, 67, 54, 0.1)', borderColor: '#F44336' }]}
              onPress={handleResetAllProgress}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="alert" size={20} color="#F44336" />
              <Text style={[styles.resetButtonText, { color: '#F44336', fontWeight: '700' }]}>ลบทั้งหมด</Text>
            </TouchableOpacity>

            <View style={{ height: 8 }} />

            <TouchableOpacity 
              style={[styles.resetButton, { backgroundColor: 'rgba(255, 140, 0, 0.1)', borderColor: '#FF8C00' }]}
              onPress={handleUltraReset}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="delete-forever" size={20} color="#FF8C00" />
              <Text style={[styles.resetButtonText, { color: '#FF8C00', fontWeight: '700' }]}>ลบโลกใหม่!</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.resetHint, { color: flatTheme.textSecondary }]}>
            💡 เมื่อรีเซ็ต คุณจะต้องเล่นผ่านแต่ละด่านใหม่ และต้องได้ ≥70% เพื่อปลดล็อกด่านถัดไป
          </Text>
        </SectionCard>

        <SectionCard title="ข้อมูลแอป" theme={flatTheme} isDark={isDarkMode}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="alpha-t-circle" size={22} color="#FF8C00" />
          <Text style={[styles.infoText, { color: flatTheme.textSecondary }]}>Thai Meow เวอร์ชัน 2.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="shield-check" size={22} color="#FF8C00" />
          <Text style={[styles.infoText, { color: flatTheme.textSecondary }]}>นโยบายความเป็นส่วนตัว</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="file-document" size={22} color="#FF8C00" />
          <Text style={[styles.infoText, { color: flatTheme.textSecondary }]}>ข้อกำหนดการใช้งาน</Text>
        </View>
        </SectionCard>

        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('SignIn')}>
          <LinearGradient colors={['#FF512F', '#F09819']} style={styles.logoutGradient}>
            <MaterialCommunityIcons name="logout" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutLabel}>ออกจากระบบ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWithToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flex: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    marginLeft: 16,
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  heroSubtitle: {
    color: '#fff',
    marginTop: 4,
    fontSize: 14,
    opacity: 0.85,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -16,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8C00',
  },
  sectionBody: {
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,140,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleWrapper: {
    width: 64,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleBackground: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1,
    elevation: 2,
  },
  toggleIconLeft: {
    position: 'absolute',
    left: 8,
    color: '#fff',
  },
  toggleIconRight: {
    position: 'absolute',
    right: 8,
    color: '#fff',
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  languageChipWrapper: {
    marginRight: 12,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  languageFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  languageLabel: {
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricCard: {
    flexBasis: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 34,
    height: 34,
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  levelCardButton: {
    flexBasis: '48%',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelLabelSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  contactGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactButton: {
    flexBasis: '48%',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    marginTop: 8,
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutGradient: {
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButtonsContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  resetButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  resetHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default SettingsScreen;
