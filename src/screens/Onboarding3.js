import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Onboarding3 = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/images/Onboarding3.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>"Track your progress!"</Text>
      <Text style={styles.description}>
        Monitor your learning journey with detailed progress tracking, achievements, and personalized recommendations.
      </Text>

      <View style={styles.bottomNav}>
            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.getStartedText}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
            </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 28,
    paddingTop: 80,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 100,
  },
  image: {
    width: 350,
    height: 350,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  description: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 48,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 50,
    width: '90%',
    alignItems: 'center',
  },
  getStartedBtn: {
    backgroundColor: '#FF8000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  arrowIcon: {
    marginLeft: 4,
  },
});

export default Onboarding3;