import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

// Context Providers
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ProgressProvider } from './src/contexts/ProgressContext';
import { UserProvider } from './src/contexts/UserContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { UserDataProvider } from './src/contexts/UserDataContext';
import { UnifiedStatsProvider } from './src/contexts/UnifiedStatsContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatus from './src/components/NetworkStatusSimple';

// Screens
import FirstScreen from './src/screens/FirstScreen';
import Onboarding1 from './src/screens/Onboarding1';
import Onboarding2 from './src/screens/Onboarding2';
import Onboarding3 from './src/screens/Onboarding3';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';

// Navigation
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

const Stack = createStackNavigator();

// Separate component to use theme hook
const AppNavigator = () => {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors?.background || '#f5f5f5' }]}>
      <NetworkStatus />
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="FirstScreen"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors?.primary || '#FF8000',
            },
            headerTintColor: theme.colors?.white || '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              color: theme.colors?.white || '#fff',
            },
          }}
        >
          <Stack.Screen 
            name="FirstScreen" 
            component={FirstScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Onboarding1" 
            component={Onboarding1} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Onboarding2" 
            component={Onboarding2} 
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Onboarding3"
            component={Onboarding3}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MainApp"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UserProvider>
            <UserDataProvider>
              <UnifiedStatsProvider>
                <ProgressProvider>
                  <AppNavigator />
                </ProgressProvider>
              </UnifiedStatsProvider>
            </UserDataProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
