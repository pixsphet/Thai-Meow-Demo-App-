import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import friendService from '../services/friendService';

// Custom Tab Bar Component
const CustomTabBar = ({ navigation }) => {
  const tabBarStyle = {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 26,
    backgroundColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    borderTopWidth: 0,
    height: 72,
    borderRadius: 18,
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const tabItems = [
    {
      name: 'Home',
      label: 'หน้าแรก',
      icon: 'home',
      screen: 'HomeMain',
    },
    {
      name: 'Minigame',
      label: 'เกม',
      icon: 'gamepad',
      screen: 'Minigame',
    },
    {
      name: 'Progress',
      label: 'ความคืบหน้า',
      icon: 'trophy',
      screen: 'Progress',
    },
    {
      name: 'Profile',
      label: 'โปรไฟล์',
      icon: 'user',
      screen: 'Profile',
    },
    {
      name: 'AddFriend',
      label: 'เพิ่มเพื่อน',
      icon: 'user-plus',
      screen: 'AddFriend',
    },
  ];

  return (
    <View style={tabBarStyle}>
      {tabItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 6,
            paddingHorizontal: 2,
            minWidth: 60,
          }}
          onPress={() => navigation.navigate(item.screen)}
        >
        <FontAwesome 
          name={item.icon} 
          size={22} 
          color={item.name === 'AddFriend' ? '#FF8000' : '#666'}
        />
        <Text style={{
          fontSize: 11,
          fontWeight: '500',
          color: item.name === 'AddFriend' ? '#FF8000' : '#666',
          marginTop: 3,
          textAlign: 'center',
        }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const AddFriendScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load recent searches on component mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      // In a real app, you'd load from AsyncStorage
      const recent = ['john_doe', 'jane_smith', 'thai_learner'];
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อผู้ใช้หรืออีเมลเพื่อค้นหา');
      return;
    }

    try {
      setLoading(true);
      setShowSuggestions(false);
      const response = await friendService.searchUsers(query);
      
      if (response.success) {
        setSearchResults(response.data);
        // Add to recent searches
        if (!recentSearches.includes(query)) {
          setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
        }
      } else {
        Alert.alert('ข้อผิดพลาด', response.error || 'ไม่สามารถค้นหาผู้ใช้ได้');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการค้นหา');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (text) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      await handleSearch();
    }
    setRefreshing(false);
  };

  const handleAddFriend = async (userId, username) => {
    try {
      const response = await friendService.sendFriendRequest(userId);
      
      if (response.success) {
        Alert.alert('สำเร็จ', `ส่งคำขอเป็นเพื่อนไปยัง ${username} แล้ว!`);
        // Remove from search results
        setSearchResults(prev => prev.filter(user => user.id !== userId));
      } else {
        Alert.alert('ข้อผิดพลาด', response.error || 'ไม่สามารถส่งคำขอเป็นเพื่อนได้');
      }
    } catch (error) {
      console.error('Add friend error:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการส่งคำขอเป็นเพื่อน');
    }
  };

  const renderSearchResult = (user) => (
    <View key={user._id || user.id} style={[styles.searchResult, { backgroundColor: theme.surface }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: theme.lightGray }]}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color={theme.primary} />
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.username, { color: theme.text }]}>{user.username}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user.email}</Text>
          <Text style={[styles.joinDate, { color: theme.textSecondary }]}>
            เข้าร่วมเมื่อ {new Date(user.createdAt).toLocaleDateString('th-TH')}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => handleAddFriend(user._id || user.id, user.username)}
      >
        <Ionicons name="person-add" size={16} color={theme.white} />
        <Text style={[styles.addButtonText, { color: theme.white }]}>เพิ่ม</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecentSearch = (query, index) => (
    <TouchableOpacity
      key={index}
      style={[styles.recentSearchItem, { backgroundColor: theme.surface }]}
      onPress={() => {
        setSearchQuery(query);
        handleSearch(query);
      }}
    >
      <Ionicons name="time" size={16} color={theme.textSecondary} />
      <Text style={[styles.recentSearchText, { color: theme.text }]}>{query}</Text>
      <TouchableOpacity
        onPress={() => {
          setRecentSearches(prev => prev.filter((_, i) => i !== index));
        }}
      >
        <Ionicons name="close" size={16} color={theme.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.orangeAccent]}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: theme.white }]}>เพิ่มเพื่อน</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border 
              }]}
              placeholder="ค้นหาด้วยชื่อผู้ใช้หรืออีเมล..."
              value={searchQuery}
              onChangeText={handleInputChange}
              placeholderTextColor={theme.textSecondary}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                  setSearchResults([]);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.searchButton, { backgroundColor: theme.primary }]} 
            onPress={() => handleSearch()}
            disabled={loading || !searchQuery.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <Ionicons name="search" size={20} color={theme.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Searches */}
        {showSuggestions && recentSearches.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.suggestionsTitle, { color: theme.textSecondary }]}>การค้นหาล่าสุด</Text>
            {recentSearches.map(renderRecentSearch)}
          </View>
        )}

        <ScrollView 
          style={styles.resultsContainer}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {searchResults.length > 0 ? (
            <>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: theme.text }]}>
                  พบ {searchResults.length} คน
                </Text>
              </View>
              {searchResults.map(renderSearchResult)}
            </>
          ) : searchQuery.length > 0 ? (
            <View style={styles.emptyState}>
              <LottieView
                source={require('../assets/animations/Error animation.json')}
                autoPlay
                loop
                style={styles.emptyAnimation}
              />
              <Text style={[styles.emptyText, { color: theme.text }]}>ไม่พบผู้ใช้</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                ลองค้นหาด้วยชื่อผู้ใช้หรืออีเมลอื่น
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <LottieView
                source={require('../assets/animations/Cat sneaking.json')}
                autoPlay
                loop
                style={styles.emptyAnimation}
              />
              <Text style={[styles.emptyText, { color: theme.text }]}>ค้นหาเพื่อนเพื่อเพิ่ม</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                กรอกชื่อผู้ใช้หรืออีเมลเพื่อค้นหาเพื่อน
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* Custom Tab Bar */}
      <CustomTabBar navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginLeft: 15,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
    marginRight: 10,
  },
  searchButton: {
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsContainer: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 5,
  },
  recentSearchText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    marginBottom: 15,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchResult: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  avatarImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
  },
  addButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButtonText: {
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyAnimation: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

export default AddFriendScreen;
