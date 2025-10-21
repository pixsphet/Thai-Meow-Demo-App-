import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const GreetingGameHeader = ({
  currentIndex,
  totalRounds,
  xpEarned,
  diamondsEarned,
  accuracy,
  streak,
  hearts,
  onClose,
}) => {
  const progressPercent = totalRounds > 0 ? ((currentIndex + 1) / totalRounds) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Top row with back button and hearts */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <FontAwesome name="times" size={24} color="#FF8000" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Greeting Adventure</Text>
          <Text style={styles.subtitle}>
            {currentIndex + 1} / {totalRounds}
          </Text>
        </View>

        <View style={styles.heartsBox}>
          <FontAwesome name="heart" size={18} color="#d32f2f" />
          <Text style={styles.heartsText}>{hearts}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={['#FFB84D', '#FF8000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` },
            ]}
          />
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <LottieView
            source={require('../../assets/animations/Star.json')}
            autoPlay
            loop
            style={styles.statIcon}
          />
          <Text style={styles.statLabel}>XP</Text>
          <Text style={styles.statValue}>{xpEarned}</Text>
        </View>

        <View style={styles.statItem}>
          <LottieView
            source={require('../../assets/animations/Diamond.json')}
            autoPlay
            loop
            style={styles.statIcon}
          />
          <Text style={styles.statLabel}>💎</Text>
          <Text style={styles.statValue}>{diamondsEarned}</Text>
        </View>

        <View style={styles.statItem}>
          <FontAwesome name="bullseye" size={16} color="#4ECDC4" />
          <Text style={styles.statLabel}>Accuracy</Text>
          <Text style={styles.statValue}>{accuracy}%</Text>
        </View>

        <View style={styles.statItem}>
          <FontAwesome name="fire" size={16} color="#FF8C00" />
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={styles.statValue}>{streak}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  heartsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heartsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d32f2f',
    marginLeft: 6,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statIcon: {
    width: 20,
    height: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
    marginTop: 2,
  },
});

export default GreetingGameHeader;
