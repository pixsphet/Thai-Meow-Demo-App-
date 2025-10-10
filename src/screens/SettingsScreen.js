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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

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

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('TH');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [contactExpanded, setContactExpanded] = useState(false);

  const languageOptions = useMemo(() => ([
    { code: 'TH', label: 'ไทย', flag: '🇹🇭' },
    { code: 'EN', label: 'English', flag: '🇺🇸' },
  ]), []);

  const levelOptions = useMemo(() => (
    ['Basic Consonants', 'Beginner', 'Intermediate', 'Advanced']
  ), []);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <LinearGradient colors={['#FF8C00', '#FFB347']} style={styles.hero}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>ตั้งค่า</Text>
          <Text style={styles.heroSubtitle}>จัดการประสบการณ์การเรียนรู้ของคุณ</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="บัญชีผู้ใช้" theme={theme} isDark={isDarkMode}>
          <SettingsRow
            icon="account-circle"
            label="โปรไฟล์"
            value={<MaterialCommunityIcons name="chevron-right" size={22} color="#B0BEC5" />}
            onPress={() => navigation.navigate('Profile')}
            theme={theme}
          />
          <SettingsRow
            icon="key"
            label="ความปลอดภัย"
            value={<MaterialCommunityIcons name="chevron-right" size={22} color="#B0BEC5" />}
            onPress={() => alert('ฟีเจอร์กำลังพัฒนา')}
            theme={theme}
            isLast
          />
        </SectionCard>

        <SectionCard title="ภาษาและระดับการเรียน" theme={theme} isDark={isDarkMode}>
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
                    { backgroundColor: theme.card, borderColor: theme.border || '#E1E8ED' },
                    selected && { backgroundColor: 'rgba(255,140,0,0.12)', borderColor: theme.primary },
                  ]}
                  onPress={() => setSelectedLanguage(option.code)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.languageFlag}>{option.flag}</Text>
                  <Text
                    style={[
                      styles.languageLabel,
                      { color: theme.textSecondary },
                      selected && [{ color: theme.primary, fontWeight: '600' }],
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.levelGrid}>
          {levelOptions.map(level => {
            const selected = level === selectedLevel;
            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.levelCardButton,
                  { backgroundColor: theme.card, borderColor: theme.border || '#E1E8ED' },
                  selected && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setSelectedLevel(level)}
              >
                <MaterialCommunityIcons
                  name={selected ? 'star-circle' : 'star-circle-outline'}
                  size={22}
                  color={selected ? '#fff' : '#FF8C00'}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  style={[
                    styles.levelLabel,
                    { color: theme.textSecondary },
                    selected && styles.levelLabelSelected,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        </SectionCard>

        <SectionCard title="การแจ้งเตือนและธีม" theme={theme} isDark={isDarkMode}>
          <SettingsRow
            icon="bell"
            label="การแจ้งเตือน"
            value={(
              <AnimatedToggle
                value={notificationsEnabled}
                onToggle={() => setNotificationsEnabled(prev => !prev)}
                mode="notification"
              />
            )}
            theme={theme}
          />
          <SettingsRow
            icon="theme-light-dark"
            label="โหมดธีม"
            value={<AnimatedToggle value={isDarkMode} onToggle={toggleTheme} mode="theme" />}
            theme={theme}
            isLast
          />
        </SectionCard>

        <SectionCard title="ติดต่อและข้อมูลเพิ่มเติม" theme={theme} isDark={isDarkMode}>
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
            theme={theme}
            isLast
          />
          {contactExpanded && (
            <View style={styles.contactGrid}>
              {contactActions.map(action => (
                <TouchableOpacity
                  key={action.icon}
                  style={[
                    styles.contactButton,
                    { backgroundColor: theme.card, borderColor: theme.border || '#E1E8ED' },
                  ]}
                  onPress={action.action}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name={action.icon} size={22} color="#FF8C00" />
                  <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </SectionCard>

        <SectionCard title="ข้อมูลแอป" theme={theme} isDark={isDarkMode}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="alpha-t-circle" size={22} color="#FF8C00" />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>Thai Meow เวอร์ชัน 2.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="shield-check" size={22} color="#FF8C00" />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>นโยบายความเป็นส่วนตัว</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="file-document" size={22} color="#FF8C00" />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>ข้อกำหนดการใช้งาน</Text>
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
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
});

export default SettingsScreen;
