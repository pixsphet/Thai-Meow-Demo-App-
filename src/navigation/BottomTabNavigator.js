import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import NewLessonGame from '../screens/NewLessonGame';
import LessonCompleteScreen from '../screens/LessonCompleteScreen';
import ConsonantLearnScreen from '../screens/ConsonantLearnScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AddFriendScreen from '../screens/AddFriendScreen';
import GameModeSelector from '../components/GameModeSelector';
import LevelStage1 from '../screens/LevelStage1';
import LevelStage2 from '../screens/LevelStage2';
import LevelStage3 from '../screens/LevelStage3';
import ThaiVowelGame from '../screens/ThaiVowelGame';
import ThaiTonesGame from '../screens/ThaiTonesGame';
import Lesson3Game from '../screens/Lesson3Game';


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Stack Navigator - Contains all screens
const MainStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Home Screen with Tab Bar */}
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{
          headerShown: false,
        }}
      />
      
      {/* All other screens without Tab Bar */}
      <Stack.Screen 
        name="Progress" 
        component={ProgressScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="AddFriend" 
        component={AddFriendScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ConsonantLearn" 
        component={ConsonantLearnScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LessonComplete" 
        component={LessonCompleteScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LevelStage1" 
        component={LevelStage1} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LevelStage2" 
        component={LevelStage2} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="LevelStage3" 
        component={LevelStage3} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NewLessonGame" 
        component={NewLessonGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BeginnerVowelsStage" 
        component={ThaiVowelGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GameMode" 
        component={GameModeSelector} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ThaiTones" 
        component={ThaiTonesGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Lesson3Game" 
        component={Lesson3Game} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Custom Tab Bar Component for HomeScreen
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
    height: 68,
    borderRadius: 18,
    paddingBottom: 8,
    paddingTop: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-around',
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
            paddingVertical: 8,
          }}
          onPress={() => navigation.navigate(item.screen)}
        >
          <FontAwesome 
            name={item.icon} 
            size={24} 
            color={item.name === 'Home' ? '#FF8000' : '#666'} 
          />
          <Text style={{
            fontSize: 12,
            fontWeight: '500',
            color: item.name === 'Home' ? '#FF8000' : '#666',
            marginTop: 4,
          }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const BottomTabNavigator = () => {
  return <MainStackNavigator />;
};

export default BottomTabNavigator;
