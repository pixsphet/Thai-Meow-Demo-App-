import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import NewLessonGame from '../screens/NewLessonGame';
import LessonCompleteScreen from '../screens/LessonCompleteScreen';
import ConsonantLearnScreen from '../screens/ConsonantLearnScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GameModeSelector from '../components/GameModeSelector';
import LevelStage1 from '../screens/LevelStage1';
import LevelStage2 from '../screens/LevelStage2';
import LevelStage3 from '../screens/LevelStage3';
import ThaiVowelGame from '../screens/ThaiVowelGame';
import ConsonantStage1Game from '../screens/ConsonantStage1Game';
import VowelStage2Game from '../screens/VowelStage2Game';
import TestConsonantGame from '../screens/TestConsonantGame';
// Removed Lesson3Game/Lesson4Game imports (files not present)
import MinigameScreen from '../screens/MinigameScreen';
import Game1Screen from '../screens/Game1Screen';
import Game2Screen from '../screens/Game2Screen';
import MemoryMatchScreen from '../screens/MemoryMatchScreen';
import SpeedTypingScreen from '../screens/SpeedTypingScreen';
import GemShopScreen from '../screens/GemShopScreen';
import GreetingStage3Game from '../screens/GreetingStage3Game';
import Lesson4ObjectsGame from '../screens/Lesson4ObjectsGame';
import Lesson5BodyGame from '../screens/Lesson5BodyGame';
import Advanced5IdiomsGame from '../screens/Advanced5IdiomsGame';
import Advanced1OccupationsGame from '../screens/Advanced1OccupationsGame';
import Advanced2TopicsGame from '../screens/Advanced2TopicsGame';
import Advanced3DirectionsGame from '../screens/Advanced3DirectionsGame';
import Advanced4ComplexVerbsGame from '../screens/Advanced4ComplexVerbsGame';
import Intermediate1FoodDrinksGame from '../screens/Intermediate1FoodDrinksGame';
import IntermediateEmotionsGame from '../screens/IntermediateEmotionsGame';
import IntermediatePlacesGame from '../screens/IntermediatePlacesGame';
import IntermediateRoutinesGame from '../screens/IntermediateRoutinesGame';
import IntermediateTransportGame from '../screens/IntermediateTransportGame';


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
        name="ConsonantStage1Game" 
        component={ConsonantStage1Game} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TestConsonantGame" 
        component={TestConsonantGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="VowelStage2Game" 
        component={VowelStage2Game} 
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
        {/* Removed Lesson3Game/Lesson4Game screens */}
        <Stack.Screen 
          name="Minigame" 
          component={MinigameScreen} 
          options={{ headerShown: false }}
        />
      <Stack.Screen 
        name="Game1" 
        component={Game1Screen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Game2" 
        component={Game2Screen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MemoryMatch" 
        component={MemoryMatchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SpeedTyping" 
        component={SpeedTypingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GemShop" 
        component={GemShopScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GreetingStage3Game" 
        component={GreetingStage3Game} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Lesson4ObjectsGame" 
        component={Lesson4ObjectsGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Lesson5BodyGame" 
        component={Lesson5BodyGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Advanced5IdiomsGame" 
        component={Advanced5IdiomsGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Advanced1OccupationsGame" 
        component={Advanced1OccupationsGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Advanced2TopicsGame" 
        component={Advanced2TopicsGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Advanced3DirectionsGame" 
        component={Advanced3DirectionsGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Advanced4ComplexVerbsGame" 
        component={Advanced4ComplexVerbsGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Intermediate1FoodDrinksGame" 
        component={Intermediate1FoodDrinksGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="IntermediateEmotionsGame" 
        component={IntermediateEmotionsGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="IntermediatePlacesGame" 
        component={IntermediatePlacesGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="IntermediateRoutinesGame" 
        component={IntermediateRoutinesGame} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="IntermediateTransportGame" 
        component={IntermediateTransportGame} 
        options={{ headerShown: false }}
      />
      {/* Intermediate results removed; use LessonComplete screen universally */}
    </Stack.Navigator>
  );
};

// Custom Tab Bar Component for HomeScreen
const CustomTabBar = ({ navigation }) => {
  const { theme } = useTheme();
  const tabBarStyle = {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 26,
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

  const tabBarGradient = ['#FFF5E6', '#FFFFFF'];

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
      icon: 'gamepad2',
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
  ];

  return (
    <LinearGradient
      colors={tabBarGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={tabBarStyle}
    >
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
            color={item.name === 'Home' ? theme.colors.primary : item.name === 'Minigame' ? theme.colors.secondary : theme.colors.textSecondary} 
          />
          <Text style={{
            fontSize: 11,
            fontWeight: '500',
            color: item.name === 'Home' ? theme.colors.primary : item.name === 'Minigame' ? theme.colors.secondary : theme.colors.textSecondary,
            marginTop: 3,
            textAlign: 'center',
          }}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </LinearGradient>
  );
};

const BottomTabNavigator = () => {
  return <MainStackNavigator />;
};

export default BottomTabNavigator;
