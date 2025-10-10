import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Onboarding1 = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/images/Onboarding1.png')} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>"Made thai fun & easy!"</Text>
      <Text style={styles.description}>
        An application that will help you practice Thai through images, sounds and games that are easy to understand.
      </Text>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.navigate('Onboarding2')}>
            <MaterialIcons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.skipText}>Skip</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    width: 48,
    height: 50,
    borderRadius: 24,
    backgroundColor: '#FF8000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 48, 
  },
  skipText: {
    color: '#FF8000',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});

export default Onboarding1;