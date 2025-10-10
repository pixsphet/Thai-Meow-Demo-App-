import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Animated, Easing, Image } from 'react-native';
import LottieView from 'lottie-react-native';

const FirstScreen = ({ navigation }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding1');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigation]);

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" 
      backgroundColor="#FF8000" />
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: opacityAnim,
            transform: [{ translateY }],
          }
        ]}>

        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <LottieView
          source={require('../assets/animations/cat_on_firstscreen.json')}
          autoPlay
          loop
          style={styles.lottie}
        />

        <Text style={styles.paw}>🐾</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF8000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 500,
    height: 220,
    marginBottom: 20,
  },
  lottie: {
    width: 250,
    height: 250,
    marginBottom: 10,
  },
  paw: {
    fontSize: 40,
    color: '#fff',
    marginTop: 10,
  },
});

export default FirstScreen;

