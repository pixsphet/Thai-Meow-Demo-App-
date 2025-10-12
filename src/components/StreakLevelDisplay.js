import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import { getLevelRewards, getXpProgress } from '../utils/leveling';
import { useUser } from '../contexts/UserContext';
import levelUnlockService from '../services/levelUnlockService';
import gameProgressService from '../services/gameProgressService';

const StreakLevelDisplay = () => {
  const { user } = useUser();
  const { stats, streak, level, xp, diamonds, loading: statsLoading } = useUnifiedStats();
  const [showModal, setShowModal] = useState(false);
  const [nextLevelInfo, setNextLevelInfo] = useState(null);

  const userStats = useMemo(() => {
    if (!stats) {
      return {
        streak: streak || 0,
        level: level || 1,
        xp: xp || 0,
        diamonds: diamonds || 0,
        hearts: 5,
        nextLevelXP: 100,
      };
    }
    return {
      streak: stats.streak || 0,
      level: stats.level || 1,
      xp: stats.xp || 0,
      diamonds: stats.diamonds || 0,
      hearts: stats.hearts ?? 5,
      nextLevelXP: stats.nextLevelXP || 100,
    };
  }, [stats, streak, level, xp, diamonds]);

  if (statsLoading && !stats) {
    return (
      <View style={styles.loadingCard}>
        <Text style={styles.loadingText}>กำลังดึงสถานะเลเวล...</Text>
      </View>
    );
  }

  const xpProgress = useMemo(
    () => getXpProgress(userStats.xp, userStats.level),
    [userStats.xp, userStats.level]
  );
  const displayLevel = xpProgress.level;
  const nextRewards = useMemo(() => getLevelRewards(displayLevel + 1), [displayLevel]);

  useEffect(() => {
    let isMounted = true;

    const loadNextLevel = async () => {
      if (!user?.id) {
        setNextLevelInfo(null);
        return;
      }

      try {
        if (levelUnlockService.userId !== user.id) {
          await levelUnlockService.initialize(user.id);
        }
        if (gameProgressService.userId !== user.id) {
          await gameProgressService.initialize(user.id);
        }

        const levels = await levelUnlockService.getAllLevelsStatus();
        if (!isMounted) return;

        const nextLevel = levels.find((lvl) => lvl.status !== 'completed');
        setNextLevelInfo(nextLevel || levels[levels.length - 1] || null);
      } catch (error) {
        if (isMounted) {
          console.warn('⚠️ Failed to load level info:', error?.message || error);
          setNextLevelInfo(null);
        }
      }
    };

    loadNextLevel();

    return () => {
      isMounted = false;
    };
  }, [user?.id, stats?.lessonsCompleted, stats?.lastPlayed, displayLevel]);

  const nextLevelNumber = useMemo(() => {
    if (nextLevelInfo?.id && /^level\\d+/.test(nextLevelInfo.id)) {
      const parsed = Number(nextLevelInfo.id.replace('level', ''));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return displayLevel + 1;
  }, [nextLevelInfo, displayLevel]);

  const nextLevelTitle = useMemo(() => {
    const mappedName =
      (nextLevelInfo?.name) ||
      (levelUnlockService.getLevelName
        ? levelUnlockService.getLevelName(`level${nextLevelNumber}`)
        : null);

    if (mappedName) {
      return `เลเวลถัดไป: Lv.${nextLevelNumber} - ${mappedName}`;
    }
    return `เลเวลถัดไป Lv.${nextLevelNumber}`;
  }, [nextLevelInfo, nextLevelNumber]);

  const xpLabel = `${xpProgress.withinClamped.toLocaleString('th-TH')} / ${xpProgress.requirement.toLocaleString('th-TH')} XP`;
  const progressWidth = `${xpProgress.percent}%`;

  const toggleModal = () => setShowModal((prev) => !prev);

  return (
    <>
      <LinearGradient
        colors={['#FFF4E3', '#FFF9F2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <View style={styles.levelBadge}>
            <FontAwesome name="star" size={18} color="#FFFFFF" />
            <Text style={styles.levelText}>Lv.{displayLevel}</Text>
          </View>
          <TouchableOpacity style={styles.infoChip} onPress={toggleModal} activeOpacity={0.7}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FF7A00" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
            <Text style={styles.progressLabel}>{xpLabel}</Text>
          </View>
        </View>
      </LinearGradient>

      <Modal
        visible={showModal}
        animationType="fade"
        transparent
        onRequestClose={toggleModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={toggleModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <MaterialCommunityIcons name="gift" size={24} color="#FF7A00" />
              </View>
              <Text style={styles.modalTitle}>{nextLevelTitle}</Text>
            </View>
            <Text style={styles.modalSubtitle}>ของขวัญที่จะได้รับ</Text>
            <View style={styles.modalRewardsRow}>
              <View style={[styles.modalRewardChip, styles.modalHeartChip]}>
                <MaterialCommunityIcons name="heart" size={16} color="#FF4F64" />
                <Text style={styles.modalRewardText}>+{nextRewards.hearts.toLocaleString('th-TH')}</Text>
              </View>
              <View style={[styles.modalRewardChip, styles.modalDiamondChip]}>
                <FontAwesome name="diamond" size={14} color="#2196F3" />
                <Text style={styles.modalRewardText}>+{nextRewards.diamonds.toLocaleString('th-TH')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={toggleModal} activeOpacity={0.85}>
              <Text style={styles.modalButtonText}>รับทราบ</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loadingCard: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFF4E3',
    shadowColor: '#E8C8AA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#7D5A3B',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#E5C8A9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  levelText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD8AC',
    backgroundColor: '#FFF1E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 4,
  },
  progressBar: {
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    backgroundColor: '#3DA65C',
  },
  progressLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#2F2F2F',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B4C3B',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#7B5A3D',
    marginBottom: 18,
  },
  modalHighlight: {
    color: '#FF7A00',
    fontWeight: '700',
  },
  modalRewardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  modalRewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  modalHeartChip: {
    backgroundColor: '#FFE4EA',
  },
  modalDiamondChip: {
    backgroundColor: '#E4F2FF',
  },
  modalRewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C4630',
  },
  modalButton: {
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FF8C2A',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default StreakLevelDisplay;
