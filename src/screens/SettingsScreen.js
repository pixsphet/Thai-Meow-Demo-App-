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


import { useTheme } from '../contexts/ThemeContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


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
