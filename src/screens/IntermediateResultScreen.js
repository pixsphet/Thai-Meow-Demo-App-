import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#FF8000',
  cream: '#FFF5E5',
  white: '#FFFFFF',
  dark: '#2C3E50',
  success: '#58cc02',
  lightGray: '#f5f5f5',
};

export default function IntermediateResultScreen({ navigation, route }) {
  const { resultData, questions, answers } = route.params || {};
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    setTimeout(() => setShowCelebration(false), 3000);
  }, []);

  if (!resultData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>ไม่มีข้อมูลผลลัพธ์</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>กลับไป</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {
    score,
    maxScore,
    accuracyPercent,
    timeSpentSec,
    xpEarned,
    diamondsEarned,
    heartsRemaining,
    streakDayCount,
    questionTypes = {},
    unlockedNext,
  } = resultData;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRating = (percent) => {
    if (percent >= 90) return { emoji: '🌟', text: 'ยอดเยี่ยม!', color: '#FFD700' };
    if (percent >= 70) return { emoji: '⭐', text: 'ดีมาก!', color: '#FFC700' };
    if (percent >= 50) return { emoji: '👍', text: 'ผ่านแล้ว', color: '#FF8000' };
    return { emoji: '💪', text: 'พยายามต่อไป', color: '#FF6B6B' };
  };

  const rating = getRating(accuracyPercent);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#FFF5E5', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <LottieView
            source={require('../assets/animations/celebration.json')}
            autoPlay
            loop={false}
            style={styles.celebrationAnim}
            onAnimationFinish={() => setShowCelebration(false)}
          />
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreCard}>
          <LinearGradient
            colors={[COLORS.primary, '#FFA24D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreGradient}
          >
            <Text style={styles.ratingEmoji}>{rating.emoji}</Text>
            <Text style={styles.ratingText}>{rating.text}</Text>
            <Text style={styles.scoreDisplay}>{score}/{maxScore}</Text>
          </LinearGradient>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="star" label="XP" value={xpEarned.toString()} color="#FFD700" />
          <StatCard icon="diamond" label="เพชร" value={diamondsEarned.toString()} color="#00BCD4" />
          <StatCard icon="favorite" label="หัวใจ" value={heartsRemaining.toString()} color="#FF6B6B" />
          <StatCard icon="local-fire-department" label="Streak" value={streakDayCount.toString()} color={COLORS.primary} />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MaterialIcons name="show-chart" size={24} color={COLORS.primary} />
            <Text style={styles.infoLabel}>ความแม่นยำ</Text>
            <Text style={styles.infoValue}>{accuracyPercent}%</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="schedule" size={24} color={COLORS.primary} />
            <Text style={styles.infoLabel}>เวลา</Text>
            <Text style={styles.infoValue}>{formatTime(timeSpentSec)}</Text>
          </View>
        </View>

        {Object.keys(questionTypes).length > 0 && (
          <View style={styles.typesSection}>
            <Text style={styles.typesSectionTitle}>🔍 การแจกแจงโจทย์</Text>
            {Object.entries(questionTypes).map(([type, count]) => (
              <View key={type} style={styles.typeRow}>
                <Text style={styles.typeLabel}>{getTypeLabel(type)}</Text>
                <Text style={styles.typeCount}>{count} ข้อ</Text>
              </View>
            ))}
          </View>
        )}

        {unlockedNext !== undefined && (
          <View style={[styles.unlockedBox, unlockedNext ? styles.unlockedTrue : styles.unlockedFalse]}>
            <MaterialIcons
              name={unlockedNext ? 'lock-open' : 'lock'}
              size={20}
              color={unlockedNext ? COLORS.success : '#999'}
            />
            <Text style={styles.unlockedText}>
              {unlockedNext ? '✅ ปลดล็อกด่านถัดไปแล้ว!' : '❌ ยังต้องได้ 70% เพื่อปลดล็อกด่านถัดไป'}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('LevelStage2')}
        >
          <Text style={styles.actionBtnText}>🏠 กลับหน้าเลือกด่าน</Text>
        </TouchableOpacity>
        {unlockedNext && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => navigation.navigate('LevelStage2')}
          >
            <Text style={styles.actionBtnTextPrimary}>⏭️ ไปด่านถัดไป</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={styles.statCard}>
      <MaterialIcons name={icon} size={28} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function getTypeLabel(type) {
  const typeMap = {
    LISTEN_CHOOSE: '�� ฟังเสียง',
    PICTURE_MATCH: '🖼️ ดูรูป',
    TRANSLATE_MATCH: '🔤 จับคู่ภาษา',
    FILL_BLANK_DIALOG: '✏️ เติมคำ',
    ARRANGE_SENTENCE: '🔤 เรียงคำ',
    DIRECTION_FLOW: '🗺️ ทิศทาง',
    TIMELINE_ORDER: '⏱️ ลำดับเวลา',
    EMOJI_MATCH: '😊 จับคู่อีโมจิ',
    TONE_PICK: '🎵 เลือกเสียง',
  };
  return typeMap[type] || type;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.dark, marginBottom: 20 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
  backBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  content: { flex: 1, padding: 20 },
  celebrationOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  celebrationAnim: { width: 300, height: 300 },
  scoreCard: { marginBottom: 20, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  scoreGradient: { paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center' },
  ratingEmoji: { fontSize: 60, marginBottom: 10 },
  ratingText: { fontSize: 24, fontWeight: '700', color: COLORS.white, marginBottom: 10 },
  scoreDisplay: { fontSize: 32, fontWeight: '800', color: COLORS.white },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  statCard: { width: '48%', backgroundColor: COLORS.white, paddingVertical: 15, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.lightGray, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  statLabel: { fontSize: 12, color: '#999', marginTop: 8, fontWeight: '500' },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.dark, marginTop: 4 },
  infoSection: { backgroundColor: COLORS.cream, borderRadius: 12, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#FFE3CC' },
  infoLabel: { fontSize: 14, color: COLORS.dark, fontWeight: '600', marginHorizontal: 12, flex: 1 },
  infoValue: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  typesSection: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, marginBottom: 20 },
  typesSectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 12 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  typeLabel: { fontSize: 13, color: COLORS.dark, fontWeight: '500' },
  typeCount: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  unlockedBox: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  unlockedTrue: { backgroundColor: 'rgba(88, 204, 2, 0.1)', borderWidth: 1, borderColor: COLORS.success },
  unlockedFalse: { backgroundColor: 'rgba(153, 153, 153, 0.1)', borderWidth: 1, borderColor: '#CCC' },
  unlockedText: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginLeft: 10, flex: 1 },
  bottomActions: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  actionBtn: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: COLORS.cream, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFE3CC' },
  actionBtnPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  actionBtnTextPrimary: { fontSize: 14, fontWeight: '600', color: COLORS.white },
});
