// Minimal, clean MinigameScreen implementation
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import ThemedBackButton from '../components/ThemedBackButton';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';

const MinigameScreen = () => {
  const navigation = useNavigation();
  const { xp, diamonds, stats, loading: statsLoading } = useUnifiedStats();
  const [historyVisible, setHistoryVisible] = React.useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient colors={[ '#667eea', '#764ba2' ]} style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedBackButton style={styles.backButton} onPress={() => navigation.goBack()} />
          <View style={styles.headerTitleCentered}>
            <Text style={styles.headerTitleText}>Mini Games</Text>
            <Text style={styles.headerSubtitle}>เกมสนุก ๆ สำหรับฝึกภาษาไทย</Text>
            <View style={styles.headerStatsRow}>
              <View style={styles.statItemSmall}><Text style={styles.statValueSmall}>{statsLoading ? '...' : (xp || 0)}</Text><Text style={styles.statLabelSmall}>คะแนน</Text></View>
              <View style={styles.statItemSmall}><Text style={styles.statValueSmall}>{statsLoading ? '...' : (stats?.totalSessions || 0)}</Text><Text style={styles.statLabelSmall}>เกม</Text></View>
              <TouchableOpacity style={styles.statItemSmall} onPress={() => setHistoryVisible(true)}>
                <LottieView source={require('../assets/animations/Diamond.json')} autoPlay loop style={styles.diamondLottie} />
                <Text style={styles.statValueSmall}>{statsLoading ? '...' : (diamonds || 0)}</Text>
                <Text style={styles.statLabelSmall}>เพชรรวม</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.welcomeSection}>
          <LottieView source={require('../assets/animations/GameCat.json')} autoPlay loop style={styles.welcomeAnimation} />
          <Text style={styles.welcomeTitle}>🎮 ยินดีต้อนรับสู่ Mini Games! 🎮</Text>
          <Text style={styles.welcomeDescription}>เลือกเกมที่คุณชอบและสนุกไปกับการเรียนรู้ภาษาไทย</Text>
        </View>
      </ScrollView>

      <Modal transparent visible={historyVisible} animationType="fade">
        <View style={styles.modalBackdrop}><View style={styles.historyModal}><Text style={styles.historyTitle}>ประวัติรางวัลเพชร</Text></View></View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 36, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, minHeight: 150 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center' },
  headerTitleCentered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitleText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  headerStatsRow: { flexDirection: 'row', alignItems: 'center' },
  statItemSmall: { alignItems: 'center', minWidth: 68, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginHorizontal: 6 },
  statValueSmall: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLabelSmall: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  content: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  welcomeSection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginTop: -30, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  welcomeAnimation: { width: 120, height: 120 },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 8 },
  welcomeDescription: { color: '#6b7280', textAlign: 'center', marginTop: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  historyModal: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  historyTitle: { fontSize: 18, fontWeight: '800' },
  diamondLottie: { width: 26, height: 26 },
});

export default MinigameScreen;
