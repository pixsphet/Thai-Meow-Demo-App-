import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { clearAutosnap } from '../services/progressServicePerUser';

const UserSwitcher = ({ navigation }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { setUser } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบหรือไม่? ความคืบหน้าจะถูกบันทึกไว้',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel'
        },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Clear all autosave data for current user
              if (user?.id) {
                // Note: In a real app, you might want to clear all lesson autosaves
                // For now, we'll just clear the current session
                console.log('Clearing autosave data for user:', user.id);
              }
              
              // Logout from auth context
              await logout();
              
              // Clear user context
              setUser(null);
              
              // Navigate to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'FirstScreen' }]
              });
              
              console.log('✅ User logged out successfully');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้');
            } finally {
              setLoading(false);
              setShowModal(false);
            }
          }
        }
      ]
    );
  };

  const handleSwitchToDemo = () => {
    Alert.alert(
      'เปลี่ยนเป็นโหมดทดสอบ',
      'คุณต้องการเปลี่ยนเป็นโหมดทดสอบหรือไม่? ข้อมูลจะถูกแยกจากบัญชีปัจจุบัน',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel'
        },
        {
          text: 'เปลี่ยน',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Logout current user
              await logout();
              setUser(null);
              
              // Set demo user
              setUser({
                id: 'demo',
                username: 'Demo User',
                email: 'demo@example.com'
              });
              
              setShowModal(false);
              console.log('✅ Switched to demo mode');
            } catch (error) {
              console.error('Error switching to demo:', error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!isAuthenticated && !user) {
    return null; // Don't show switcher if no user
  }

  return (
    <>
      <TouchableOpacity
        style={styles.userButton}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.userInfo}>
          <FontAwesome name="user-circle" size={24} color="#FF8000" />
          <Text style={styles.userName}>
            {user?.username || 'Demo User'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>บัญชีผู้ใช้</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.userDetails}>
              <FontAwesome name="user-circle" size={48} color="#FF8000" />
              <Text style={styles.userEmail}>
                {user?.email || 'demo@example.com'}
              </Text>
              <Text style={styles.userId}>
                ID: {user?.id || 'demo'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              {isAuthenticated && (
                <TouchableOpacity
                  style={[styles.button, styles.logoutButton]}
                  onPress={handleLogout}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <FontAwesome name="sign-out" size={16} color="white" />
                      <Text style={styles.buttonText}>ออกจากระบบ</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, styles.demoButton]}
                onPress={handleSwitchToDemo}
                disabled={loading}
              >
                <FontAwesome name="play-circle" size={16} color="#FF8000" />
                <Text style={[styles.buttonText, styles.demoButtonText]}>
                  โหมดทดสอบ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  userButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    marginLeft: 8,
    marginRight: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  userDetails: {
    alignItems: 'center',
    marginBottom: 30,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  userId: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  logoutButton: {
    backgroundColor: '#F44336',
  },
  demoButton: {
    backgroundColor: 'rgba(255, 128, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#FF8000',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  demoButtonText: {
    color: '#FF8000',
  },
});

export default UserSwitcher;

