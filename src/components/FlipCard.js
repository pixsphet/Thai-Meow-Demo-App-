import React, { useRef, useState } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';

export default function FlipCard({ front, back, style }) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const rotateFront = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotateBack  = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const flipTo = (to) => {
    Animated.spring(anim, { toValue: to, useNativeDriver: true, friction: 8, tension: 12 }).start(() => {
      setFlipped(to === 1);
    });
  };

  const onPress = () => flipTo(flipped ? 0 : 1);

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={[style, { perspective: 1000 }]}>
        <Animated.View style={[styles.face, { transform: [{ rotateY: rotateFront }] }]}>
          {front}
        </Animated.View>
        <Animated.View style={[styles.face, styles.back, { transform: [{ rotateY: rotateBack }] }]}>
          {back}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  face: {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  back: { transform: [{ rotateY: '180deg' }] },
});

