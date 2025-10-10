import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ProgressSummary = ({ perLetter, totalSeen, totalLetters, avgAccuracy }) => {
  const masteredLetters = Object.values(perLetter).filter(letter => letter.mastered).length;
  const totalLettersToShow = totalLetters || Object.keys(perLetter).length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E3F2FD', '#BBDEFB']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>📊 ความคืบหน้า</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{masteredLetters}</Text>
              <Text style={styles.statLabel}>ตัวอักษรที่ชำนาญ</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalLettersToShow}</Text>
              <Text style={styles.statLabel}>ตัวอักษรทั้งหมด</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round(avgAccuracy)}%</Text>
              <Text style={styles.statLabel}>ความแม่นยำ</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 16,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#424242',
    textAlign: 'center',
  },
});

export default ProgressSummary;
