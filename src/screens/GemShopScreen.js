import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native'; 
import { useNavigation } from '@react-navigation/native';
import { useUnifiedStats } from '../contexts/UnifiedStatsContext';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const GemShopScreen = () => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);

  const navigation = useNavigation();
  
  // Use unified stats as single source of truth
  const { 
    diamonds, 
    hearts, 
    loading: statsLoading,
    updateStats
  } = useUnifiedStats();

  const showModal = (title, message, confirmAction = null) => {
    setModalTitle(title);
    setModalMessage(message);
    setOnConfirm(() => confirmAction);
    setModalVisible(true);
    };


  const heartPacks = [
    {
      id: 1,
      hearts: 5,
      gemsNeeded: 10,
      description: 'แพ็คเล็ก',
      color: '#FF6B6B',
    },
    {
      id: 2,
      hearts: 15,
      gemsNeeded: 25,
      description: 'แพ็คกลาง',
      color: '#FF8E8E',
    },
    {
      id: 3,
      hearts: 35,
      gemsNeeded: 50,
      description: 'แพ็คใหญ่',
      color: '#FFB3BA',
      bestValue: true,
    },
    {
      id: 4,
      hearts: 80,
      gemsNeeded: 100,
      description: 'แพ็คสุดคุ้ม',
      color: '#FFCCCB',
      bestValue: false,
    },
  ];

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };


  const buyHearts = (pack) => {
    if (diamonds >= pack.gemsNeeded) {
      pulseAnimation();
      updateStats({ 
        diamonds: diamonds - pack.gemsNeeded,
        hearts: hearts + pack.hearts 
      });
      showModal('🎊 สำเร็จ!', `คุณได้หัวใจ ${pack.hearts} ลูก`);
    } else {
      Alert.alert('⚠️ เพชรไม่พอ', `คุณต้องการเพชร ${pack.gemsNeeded} เม็ด แต่คุณมีแค่ ${diamonds} เม็ด`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         {/* ปุ่มกากบาทวงกลม */}
        <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            >
            <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.headerHeartIcon}>
            <LottieView 
              source={require('../assets/animations/Heart.json')} 
              autoPlay 
              loop 
              style={styles.headerHeartAnimation}
            />
          </View>
          <Text style={styles.headerTitle}>Heart Shop</Text>
          <View style={styles.headerHeartIcon}>
            <LottieView 
              source={require('../assets/animations/Heart.json')} 
              autoPlay 
              loop 
              style={styles.headerHeartAnimation}
            />
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <Animated.View 
            style={[
              styles.statCard,
              styles.gemStat,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.statAnimationContainer}>
              <LottieView 
                source={require('../assets/animations/Diamond.json')} 
                autoPlay 
                loop 
                style={styles.statAnimation}
              />
            </View>
            <View>
              <Text style={styles.statLabel}>เพชร</Text>
              <Text style={styles.statValue}>{statsLoading ? '...' : diamonds}</Text>
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.statCard,
              styles.heartStat,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.statAnimationContainer}>
              <LottieView 
                source={require('../assets/animations/Heart.json')} 
                autoPlay 
                loop 
                style={styles.statAnimation}
              />
            </View>
            <View>
              <Text style={styles.statLabel}>หัวใจ</Text>
              <Text style={styles.statValue}>{statsLoading ? '...' : hearts}</Text>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIconContainer}>
          <LottieView 
            source={require('../assets/animations/Heart.json')} 
            autoPlay 
            loop 
            style={styles.welcomeIcon}
          />
        </View>
        <Text style={styles.welcomeTitle}>ร้านหัวใจ</Text>
        <Text style={styles.welcomeSubtitle}>แลกเพชรเป็นหัวใจเพื่อเล่นเกมต่อได้!</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เลือกแพ็คเกจหัวใจ</Text>
          <View style={styles.heartPacksGrid}>
            {heartPacks.map((pack) => (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.heartCard,
                  { borderColor: pack.color },
                  diamonds >= pack.gemsNeeded ? styles.heartCardActive : styles.heartCardDisabled,
                ]}
                onPress={() => buyHearts(pack)}
                disabled={diamonds < pack.gemsNeeded}
                activeOpacity={0.8}
              >
                {pack.bestValue && (
                  <View style={styles.ribbon}>
                    <Text style={styles.ribbonText}>⭐ คุ้มสุด</Text>
                  </View>
                )}

                <View style={styles.heartCardContent}>
                  <View style={[styles.heartIconContainer, { backgroundColor: pack.color + '20' }]}>
                    <LottieView 
                      source={require('../assets/animations/Heart.json')} 
                      autoPlay 
                      loop 
                      style={styles.heartCardLottie}
                    />
                  </View>
                  
                  <View style={styles.heartCardInfo}>
                    <Text style={styles.heartCardTitle}>{pack.description}</Text>
                    <View style={styles.heartAmountContainer}>
                      {Array(Math.min(pack.hearts, 8)).fill(0).map((_, i) => (
                        <LottieView 
                          key={i}
                          source={require('../assets/animations/Heart.json')} 
                          autoPlay 
                          loop 
                          style={[styles.heartIconSmall, { tintColor: pack.color }]}
                        />
                      ))}
                      {pack.hearts > 8 && (
                        <Text style={styles.heartMore}>+{pack.hearts - 8}</Text>
                      )}
                    </View>
                    <Text style={styles.heartAmountText}>{pack.hearts} หัวใจ</Text>
                    <View style={styles.diamondPriceContainer}>
                      <LottieView 
                        source={require('../assets/animations/Diamond.json')} 
                        autoPlay 
                        loop 
                        style={styles.diamondPriceIcon}
                      />
                      <Text style={styles.gemsPriceText}>{pack.gemsNeeded} เม็ด</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.exchangeButton,
                      { backgroundColor: pack.color },
                      diamonds < pack.gemsNeeded && styles.exchangeButtonDisabled,
                    ]}
                  >
                    <Text style={styles.exchangeButtonText}>
                      {diamonds >= pack.gemsNeeded ? '✓ แลก' : '✕ ไม่พอ'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tips Section */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsIconContainer}>
              <LottieView 
                source={require('../assets/animations/Star.json')} 
                autoPlay 
                loop 
                style={styles.tipsLottieIcon}
              />
            </View>
            <Text style={styles.tipsTitle}>เคล็ดลับการเล่น</Text>
            <Text style={styles.tipsText}>
              • หัวใจใช้เล่นเกมเรียนภาษาไทย{'\n'}
              • ใช้เพชรแลกหัวใจได้ตลอดเวลา{'\n'}
              • เลือกแพ็คใหญ่จะคุ้มกว่าค่ะ!
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
        >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <Text style={styles.modalMessage}>{modalMessage}</Text>

                <View style={styles.modalButtons}>
                    {onConfirm ? (
                    <>
                        <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={() => setModalVisible(false)}
                        >
                        <Text style={styles.cancelText}>ยกเลิก</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={() => {
                            setModalVisible(false);
                            onConfirm();
                        }}
                        >
                        <Text style={styles.confirmText}>ยืนยัน</Text>
                        </TouchableOpacity>
                    </>
                    ) : (
                    <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton]}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.confirmText}>ตกลง</Text>
                    </TouchableOpacity>
                    )}
                </View>
                </View>
            </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
        </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 55,
  },
  headerHeartIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerHeartAnimation: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    top: 40,
    marginBottom: 55,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    gap: 10,
  },
  gemStat: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heartStat: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statEmoji: {
    fontSize: 28,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  // Welcome Container
  welcomeContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#7c3aed',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  activeTabText: {
    color: '#7c3aed',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Heart Packs Grid
  heartPacksGrid: {
    gap: 15,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gemCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bestValueCard: {
    borderColor: '#ec4899',
    borderWidth: 3,
    backgroundColor: '#fff5f8',
  },
  ribbon: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },
  ribbonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardIcon: {
    fontSize: 40,
    marginVertical: 8,
  },
  gemAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  gemLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  cardFooter: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 5,
  },
  buyNow: {
    color: '#7c3aed',
    fontWeight: 'bold',
    fontSize: 12,
  },
  specialOffer: {
    backgroundColor: '#ec4899',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  offerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  offerText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  offerButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  offerButtonText: {
    color: '#ec4899',
    fontWeight: 'bold',
    fontSize: 14,
  },
  heartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heartCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  heartIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartCardIcon: {
    fontSize: 30,
  },
  heartCardLottie: {
    width: '100%',
    height: '100%',
  },
  heartCardInfo: {
    flex: 1,
  },
  heartCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  heartAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  heartIconSmall: {
    width: 20,
    height: 20,
  },
  heartCardActive: {
    backgroundColor: '#fff5f8',
    transform: [{ scale: 1.02 }],
  },
  heartCardDisabled: {
    opacity: 0.6,
  },
  heartIcon: {
    fontSize: 18,
  },
  heartMore: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  heartAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  gemsPriceText: {
    fontSize: 12,
    color: '#7c3aed',
    marginTop: 3,
  },
  diamondPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  diamondPriceIcon: {
    width: 15,
    height: 15,
    marginRight: 5,
  },
  exchangeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 80,
    alignItems: 'center',
  },
  exchangeButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  exchangeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Tips Card
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FFE4E1',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipsIcon: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
  },
  bonusCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
    marginTop: 15,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  bonusIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  bonusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 5,
  },
  bonusDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 15,
  },
  dailyRewards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    gap: 5,
  },
  rewardDay: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  rewardDayActive: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  rewardDayNumber: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  rewardDayGems: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginTop: 4,
  },
  bonusButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  bonusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalBox: {
  width: '80%',
  backgroundColor: '#fff',
  borderRadius: 20,
  padding: 20,
  alignItems: 'center',
  shadowColor: '#7c3aed',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#7c3aed',
  marginBottom: 8,
  textAlign: 'center',
},
modalMessage: {
  fontSize: 14,
  color: '#374151',
  textAlign: 'center',
  marginBottom: 20,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'center',
  gap: 10,
},
modalButton: {
  borderRadius: 10,
  paddingVertical: 10,
  paddingHorizontal: 20,
},
confirmButton: {
  backgroundColor: '#7c3aed',
},
cancelButton: {
  backgroundColor: '#e5e7eb',
},
confirmText: {
  color: '#fff',
  fontWeight: 'bold',
},
cancelText: {
  color: '#374151',
  fontWeight: 'bold',
},
closeButton: {
  position: 'absolute',
  top: 45,
  left: 20,
  zIndex: 10,
  width: 36,
  height: 36,
  borderRadius: 18, 
  backgroundColor: 'rgba(255, 255, 255, 0.37)',
  justifyContent: 'center',
  alignItems: 'center',

},
closeText: {
  fontSize: 20,
  color: '#fff',
  fontWeight: 'bold',
  marginTop: -1,
},
  statAnimationContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statAnimation: {
    width: '100%',
    height: '100%',
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcomeIcon: {
    width: '100%',
    height: '100%',
  },
  tipsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipsLottieIcon: {
    width: '100%',
    height: '100%',
  },
});

export default GemShopScreen;
