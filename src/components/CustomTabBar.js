import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

const { width: screenWidth } = Dimensions.get("window");

const icons = {
  Home: { 
    active: "home", 
    inactive: "home-outline", 
    label: "หน้าแรก", 
    lib: Ionicons,
    color: "#FF8C00" // สีส้มหลัก
  },
  "Treasure Chest": {
    active: "trophy",
    inactive: "trophy-outline",
    label: "ความคืบหน้า",
    lib: Ionicons,
    color: "#FFA500" // สีส้มอ่อน
  },
  Profile: { 
    active: "person", 
    inactive: "person-outline", 
    label: "โปรไฟล์", 
    lib: Ionicons,
    color: "#FF6B35" // สีส้มแดง
  },
  "Add Friend": { 
    active: "account-plus", 
    inactive: "account-plus-outline", 
    label: "เพิ่มเพื่อน", 
    lib: MaterialCommunityIcons,
    color: "#E67300" // สีส้มเข้ม
  },
};

const TabItem = ({ route, isFocused, label, iconName, IconLib, onPress, theme, tabColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.15 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0.6,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: isFocused ? 1 : 0,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      android_ripple={{ color: tabColor + "20", radius: 30, borderless: true }}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -2]
              })}
            ],
            opacity: opacityAnim,
            backgroundColor: isFocused
              ? tabColor + "15"
              : "transparent",
            borderWidth: isFocused ? 2 : 0,
            borderColor: isFocused ? tabColor : "transparent",
          },
        ]}
      >
        <IconLib
          name={iconName}
          size={26}
          color={isFocused ? tabColor : theme.textSecondary || '#999'}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          {
            color: isFocused ? tabColor : theme.textSecondary || '#999',
            fontWeight: isFocused ? '700' : '500',
            transform: [{ scale: isFocused ? 1.05 : 1 }],
          },
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index,
      friction: 10,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  // Read per-route option to hide tab bar (e.g., via route params or options)
  try {
    const currentRoute = state.routes[state.index];
    const descriptor = descriptors[currentRoute.key];
    const options = descriptor?.options || {};
    const shouldHide = options.tabBarStyle?.display === 'none' || options.tabBarVisible === false;
    if (shouldHide) {
      return null;
    }
  } catch (_e) {
    // no-op
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.View
          style={[
            styles.slidingBackground,
            {
              backgroundColor: theme.primary + "10",
              borderColor: theme.primary + "30",
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: state.routes.map((_, i) => i),
                    outputRange: state.routes.map(
                      (_, i) => (screenWidth - 40) / state.routes.length * i + 10
                    ),
                  }),
                },
              ],
            },
          ]}
        />
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconConfig = icons[route.name] || icons.Home;
          const iconName = isFocused ? iconConfig.active : iconConfig.inactive;
          const label = iconConfig.label;
          const IconLib = iconConfig.lib || Ionicons;
          const tabColor = iconConfig.color || theme.primary;

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              label={label}
              iconName={iconName}
              IconLib={IconLib}
              onPress={() => navigation.navigate(route.name)}
              theme={theme}
              tabColor={tabColor}
            />
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { 
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: "row",
    height: 80,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 25,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  slidingBackground: {
    position: "absolute",
    width: (screenWidth - 32) / 4 - 8,
    height: 50,
    borderRadius: 20,
    borderWidth: 0,
    zIndex: -1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center",
    paddingVertical: 8,
  },
  iconContainer: { 
    alignItems: "center", 
    justifyContent: "center", 
    width: 44, 
    height: 44, 
    borderRadius: 22,
    marginBottom: 4,
  },
  label: { 
    fontSize: 11, 
    textAlign: "center", 
    fontWeight: "500",
    marginTop: 2,
  },
});

export default CustomTabBar;
