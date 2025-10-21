import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import vaja9TtsService from '../../services/vaja9TtsService';

// Emoji mapping for greetings
const GREETING_EMOJI = {
  'สวัสดี': '👋',
  'ขอบคุณ': '🙏',
  'ขอโทษ': '😔',
  'ลาก่อน': '👋',
  'ฝันดี': '🌙',
  'สบายดีไหม': '🙂',
  'ยินดีที่ได้รู้จัก': '🤝',
  'ขอให้โชคดี': '🍀',
  'ขอให้มีความสุข': '😊',
  'ยินดีต้อนรับ': '🏠',
};

const ListenChooseGame = ({
  question,
  userAnswer,
  onAnswerChange,
  isAnswered,
  isCorrect,
  onPlayAudio,
}) => {
  if (!question) {
    return (
      <View style={styles.container}>
        <Text>Loading question...</Text>
      </View>
    );
  }

  const choices = question.choices || [];
  const emoji = GREETING_EMOJI[question.correctText] || '🗣️';

  const handlePlayAudio = () => {
    try {
      if (question.audioText) {
        vaja9TtsService.playThai(question.audioText);
      }
    } catch (error) {
      console.warn('TTS Error:', error?.message);
    }
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Instruction */}
      <View style={styles.instructionBox}>
        <FontAwesome name="headphones" size={20} color="#FF8000" />
        <Text style={styles.instruction}>{question.instruction}</Text>
      </View>

      {/* Audio Button */}
      <TouchableOpacity
        style={styles.audioButton}
        onPress={handlePlayAudio}
        disabled={isAnswered}
      >
        <LinearGradient
          colors={['#FF8000', '#FFB84D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.audioGradient}
        >
          <FontAwesome name="volume-up" size={24} color="#fff" />
          <Text style={styles.audioText}>ฟังเสียง</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Question Text */}
      <Text style={styles.questionText}>{question.questionText}</Text>

      {/* Choices Grid */}
      <View style={styles.choicesGrid}>
        {choices.map((choice, index) => {
          const choiceEmoji = GREETING_EMOJI[choice.text] || '🗣️';
          const isSelected = userAnswer === choice.text;
          const isChoiceCorrect = isAnswered && choice.text === question.correctText;
          const isChoiceWrong =
            isAnswered && isSelected && choice.text !== question.correctText;

          return (
            <TouchableOpacity
              key={choice.id}
              style={[
                styles.choiceButton,
                isSelected && styles.choiceButtonSelected,
                isChoiceCorrect && styles.choiceButtonCorrect,
                isChoiceWrong && styles.choiceButtonWrong,
              ]}
              onPress={() => onAnswerChange(choice.text)}
              disabled={isAnswered}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  isChoiceCorrect
                    ? ['#58cc02', '#7dd61d']
                    : isChoiceWrong
                    ? ['#ff4b4b', '#ff6b6b']
                    : isSelected
                    ? ['#FF8000', '#FFB84D']
                    : ['#fff', '#f9f9f9']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.choiceGradient}
              >
                <Text style={styles.choiceEmoji}>{choiceEmoji}</Text>
                <Text style={styles.choiceText}>{choice.text}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feedback */}
      {isAnswered && isCorrect && (
        <View style={styles.feedbackCorrect}>
          <LottieView
            source={require('../../assets/animations/Trophy.json')}
            autoPlay
            loop={false}
            style={styles.feedbackAnimation}
          />
          <Text style={styles.feedbackText}>ถูกต้อง! 🎉</Text>
        </View>
      )}

      {isAnswered && !isCorrect && (
        <View style={styles.feedbackWrong}>
          <FontAwesome name="times-circle" size={40} color="#ff4b4b" />
          <Text style={styles.feedbackText}>ลองอีกครั้ง 💪</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  instruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    flex: 1,
  },
  audioButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  audioGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  audioText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  choiceButton: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  choiceButtonSelected: {
    elevation: 6,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  choiceButtonCorrect: {
    elevation: 8,
    shadowColor: '#58cc02',
    shadowOpacity: 0.4,
  },
  choiceButtonWrong: {
    elevation: 8,
    shadowColor: '#ff4b4b',
    shadowOpacity: 0.4,
  },
  choiceGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  choiceEmoji: {
    fontSize: 32,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  feedbackCorrect: {
    alignItems: 'center',
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#58cc02',
    marginTop: 20,
  },
  feedbackWrong: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ff4b4b',
    marginTop: 20,
  },
  feedbackAnimation: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
});

export default ListenChooseGame;
