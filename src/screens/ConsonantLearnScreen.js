import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ThemedBackButton from '../components/ThemedBackButton';
import { restoreProgress, saveProgress, saveLocal, loadLocal } from '../services/progressService';
import vaja9TtsService from '../services/vaja9TtsService';
import { charToImage } from '../assets/letters/map';
import { vowelToImage } from '../assets/vowels/map';
import vocabFullData from '../data/vocab_full.json';

// --- CONFIG ---
const USER_ID = 'demo';
const LESSON_ID = 'thai-consonants-beginner-1';
const LESSON_KEY = 'consonants_basic';

// ข้อมูลพยัญชนะไทยพื้นฐาน 44 ตัว
const thaiConsonants = [
  { id: 'ko-kai', char: 'ก', name: 'กอ ไก่', meaning: 'Chicken', roman: 'Ko Kai', category: 'thai-consonants', image: charToImage['ก'] },
  { id: 'kho-khai', char: 'ข', name: 'ขอ ไข่', meaning: 'Egg', roman: 'Kho Khai', category: 'thai-consonants', image: charToImage['ข'] },
  { id: 'kho-khwat', char: 'ฃ', name: 'ฃอ ขวด', meaning: 'Bottle', roman: 'Kho Khwat', category: 'thai-consonants', image: charToImage['ฃ'] },
  { id: 'kho-khwai', char: 'ค', name: 'คอ ควาย', meaning: 'Buffalo', roman: 'Kho Khwai', category: 'thai-consonants', image: charToImage['ค'] },
  { id: 'kho-khon', char: 'ฅ', name: 'ฅอ คน', meaning: 'Person', roman: 'Kho Khon', category: 'thai-consonants', image: charToImage['ฅ'] },
  { id: 'kho-rakang', char: 'ฆ', name: 'ฆอ ระฆัง', meaning: 'Bell', roman: 'Kho Rakang', category: 'thai-consonants', image: charToImage['ฆ'] },
  { id: 'ngo-ngu', char: 'ง', name: 'งอ งู', meaning: 'Snake', roman: 'Ngo Ngu', category: 'thai-consonants', image: charToImage['ง'] },
  { id: 'cho-chan', char: 'จ', name: 'จอ จาน', meaning: 'Plate', roman: 'Cho Chan', category: 'thai-consonants', image: charToImage['จ'] },
  { id: 'cho-ching', char: 'ฉ', name: 'ฉอ ฉิ่ง', meaning: 'Cymbal', roman: 'Cho Ching', category: 'thai-consonants', image: charToImage['ฉ'] },
  { id: 'cho-chang', char: 'ช', name: 'ชอ ช้าง', meaning: 'Elephant', roman: 'Cho Chang', category: 'thai-consonants', image: charToImage['ช'] },
  { id: 'so-so', char: 'ซ', name: 'ซอ โซ่', meaning: 'Chain', roman: 'So So', category: 'thai-consonants', image: charToImage['ซ'] },
  { id: 'cho-cher', char: 'ฌ', name: 'ฌอ เฌอ', meaning: 'Tree', roman: 'Cho Cher', category: 'thai-consonants', image: charToImage['ฌ'] },
  { id: 'yo-ying', char: 'ญ', name: 'ญอ หญิง', meaning: 'Woman', roman: 'Yo Ying', category: 'thai-consonants', image: charToImage['ญ'] },
  { id: 'do-chada', char: 'ฎ', name: 'ฎอ ชฎา', meaning: 'Crown', roman: 'Do Chada', category: 'thai-consonants', image: charToImage['ฎ'] },
  { id: 'to-patak', char: 'ฏ', name: 'ฏอ ปฏัก', meaning: 'Spear', roman: 'To Patak', category: 'thai-consonants', image: charToImage['ฏ'] },
  { id: 'tho-than', char: 'ฐ', name: 'ฐอ ฐาน', meaning: 'Pedestal', roman: 'Tho Than', category: 'thai-consonants', image: charToImage['ฐ'] },
  { id: 'tho-montho', char: 'ฑ', name: 'ฑอ มณโฑ', meaning: 'Queen Montho', roman: 'Tho Montho', category: 'thai-consonants', image: charToImage['ฑ'] },
  { id: 'tho-phu-thao', char: 'ฒ', name: 'ฒอ ผู้เฒ่า', meaning: 'Elder', roman: 'Tho Phu Thao', category: 'thai-consonants', image: charToImage['ฒ'] },
  { id: 'no-nen', char: 'ณ', name: 'ณอ เณร', meaning: 'Novice Monk', roman: 'No Nen', category: 'thai-consonants', image: charToImage['ณ'] },
  { id: 'do-dek', char: 'ด', name: 'ดอ เด็ก', meaning: 'Child', roman: 'Do Dek', category: 'thai-consonants', image: charToImage['ด'] },
  { id: 'to-tao', char: 'ต', name: 'ตอ เต่า', meaning: 'Turtle', roman: 'To Tao', category: 'thai-consonants', image: charToImage['ต'] },
  { id: 'tho-thung', char: 'ถ', name: 'ถอ ถุง', meaning: 'Bag', roman: 'Tho Thung', category: 'thai-consonants', image: charToImage['ถ'] },
  { id: 'tho-thahan', char: 'ท', name: 'ทอ ทหาร', meaning: 'Soldier', roman: 'Tho Thahan', category: 'thai-consonants', image: charToImage['ท'] },
  { id: 'tho-thong', char: 'ธ', name: 'ธอ ธง', meaning: 'Flag', roman: 'Tho Thong', category: 'thai-consonants', image: charToImage['ธ'] },
  { id: 'no-nu', char: 'น', name: 'นอ หนู', meaning: 'Mouse', roman: 'No Nu', category: 'thai-consonants', image: charToImage['น'] },
  { id: 'bo-baimai', char: 'บ', name: 'บอ ใบไม้', meaning: 'Leaf', roman: 'Bo Baimai', category: 'thai-consonants', image: charToImage['บ'] },
  { id: 'po-pla', char: 'ป', name: 'ปอ ปลา', meaning: 'Fish', roman: 'Po Pla', category: 'thai-consonants', image: charToImage['ป'] },
  { id: 'pho-phueng', char: 'ผ', name: 'ผอ ผึ้ง', meaning: 'Bee', roman: 'Pho Phueng', category: 'thai-consonants', image: charToImage['ผ'] },
  { id: 'fo-fa', char: 'ฝ', name: 'ฝอ ฝา', meaning: 'Lid', roman: 'Fo Fa', category: 'thai-consonants', image: charToImage['ฝ'] },
  { id: 'pho-phan', char: 'พ', name: 'พอ พาน', meaning: 'Tray', roman: 'Pho Phan', category: 'thai-consonants', image: charToImage['พ'] },
  { id: 'fo-fan', char: 'ฟ', name: 'ฟอ ฟัน', meaning: 'Tooth', roman: 'Fo Fan', category: 'thai-consonants', image: charToImage['ฟ'] },
  { id: 'pho-samphao', char: 'ภ', name: 'ภอ สำเภา', meaning: 'Ship', roman: 'Pho Samphao', category: 'thai-consonants', image: charToImage['ภ'] },
  { id: 'mo-ma', char: 'ม', name: 'มอ ม้า', meaning: 'Horse', roman: 'Mo Ma', category: 'thai-consonants', image: charToImage['ม'] },
  { id: 'yo-yak', char: 'ย', name: 'ยอ ยักษ์', meaning: 'Giant', roman: 'Yo Yak', category: 'thai-consonants', image: charToImage['ย'] },
  { id: 'ro-ruea', char: 'ร', name: 'รอ เรือ', meaning: 'Boat', roman: 'Ro Ruea', category: 'thai-consonants', image: charToImage['ร'] },
  { id: 'lo-ling', char: 'ล', name: 'ลอ ลิง', meaning: 'Monkey', roman: 'Lo Ling', category: 'thai-consonants', image: charToImage['ล'] },
  { id: 'wo-waen', char: 'ว', name: 'วอ แหวน', meaning: 'Ring', roman: 'Wo Waen', category: 'thai-consonants', image: charToImage['ว'] },
  { id: 'so-sala', char: 'ศ', name: 'ศอ ศาลา', meaning: 'Pavilion', roman: 'So Sala', category: 'thai-consonants', image: charToImage['ศ'] },
  { id: 'so-ruesi', char: 'ษ', name: 'ษอ ฤาษี', meaning: 'Hermit', roman: 'So Ruesi', category: 'thai-consonants', image: charToImage['ษ'] },
  { id: 'so-suea', char: 'ส', name: 'สอ เสือ', meaning: 'Tiger', roman: 'So Suea', category: 'thai-consonants', image: charToImage['ส'] },
  { id: 'ho-hip', char: 'ห', name: 'หอ หีบ', meaning: 'Box', roman: 'Ho Hip', category: 'thai-consonants', image: charToImage['ห'] },
  { id: 'lo-chula', char: 'ฬ', name: 'ฬอ จุฬา', meaning: 'Kite', roman: 'Lo Chula', category: 'thai-consonants', image: charToImage['ฬ'] },
  { id: 'o-ang', char: 'อ', name: 'ออ อ่าง', meaning: 'Basin', roman: 'O Ang', category: 'thai-consonants', image: charToImage['อ'] },
  { id: 'ho-nok-huk', char: 'ฮ', name: 'ฮอ นกฮูก', meaning: 'Owl', roman: 'Ho Nok Huk', category: 'thai-consonants', image: charToImage['ฮ'] },
];

// ข้อมูลสระไทย 32 เสียง
const thaiVowels = [
  { id: 'a-short', char: 'ะ', name: 'อะ', audioText: 'สะหระ อะ', meaning: 'Short A', roman: 'a', category: 'thai-vowels', image: vowelToImage['ะ'] },
  { id: 'a-long', char: 'า', name: 'อา', audioText: 'สะหระ อา', meaning: 'Long A', roman: 'aa', category: 'thai-vowels', image: vowelToImage['า'] },
  { id: 'i-short', char: 'ิ', name: 'อิ', audioText: 'สะหระ อิ', meaning: 'Short I', roman: 'i', category: 'thai-vowels', image: vowelToImage['ิ'] },
  { id: 'i-long', char: 'ี', name: 'อี', audioText: 'สะหระ อี', meaning: 'Long I', roman: 'ii', category: 'thai-vowels', image: vowelToImage['ี'] },
  { id: 'ue-short', char: 'ึ', name: 'อึ', audioText: 'สะหระ อึ', meaning: 'Short Ue', roman: 'ue', category: 'thai-vowels', image: vowelToImage['ึ'] },
  { id: 'ue-long', char: 'ื', name: 'อือ', audioText: 'สะหระ อือ', meaning: 'Long Ue', roman: 'uue', category: 'thai-vowels', image: vowelToImage['ื'] },
  { id: 'u-short', char: 'ุ', name: 'อุ', audioText: 'สะหระ อุ', meaning: 'Short U', roman: 'u', category: 'thai-vowels', image: vowelToImage['ุ'] },
  { id: 'u-long', char: 'ู', name: 'อู', audioText: 'สะหระ อู', meaning: 'Long U', roman: 'uu', category: 'thai-vowels', image: vowelToImage['ู'] },
  { id: 'e-short', char: 'เ-ะ', name: 'เอะ', audioText: 'สะหระ เอะ', meaning: 'Short E', roman: 'e', category: 'thai-vowels', image: vowelToImage['เ-ะ'] },
  { id: 'e-long', char: 'เ-', name: 'เอ', audioText: 'สะหระ เอ', meaning: 'Long E', roman: 'e', category: 'thai-vowels', image: vowelToImage['เ-'] },
  { id: 'ae-short', char: 'แ-ะ', name: 'แอะ', audioText: 'สะหระ แอะ', meaning: 'Short AE', roman: 'ae', category: 'thai-vowels', image: vowelToImage['แ-ะ'] },
  { id: 'ae-long', char: 'แ-', name: 'แอ', audioText: 'สะหระ แอ', meaning: 'Long AE', roman: 'ae', category: 'thai-vowels', image: vowelToImage['แ-'] },
  { id: 'o-short', char: 'โ-ะ', name: 'โอะ', audioText: 'สะหระ โอะ', meaning: 'Short O', roman: 'o', category: 'thai-vowels', image: vowelToImage['โ-ะ'] },
  { id: 'o-long', char: 'โ-', name: 'โอ', audioText: 'สะหระ โอ', meaning: 'Long O', roman: 'o', category: 'thai-vowels', image: vowelToImage['โ-'] },
  { id: 'o-ao', char: 'เ-าะ', name: 'เอาะ', audioText: 'สะหระ เอาะ', meaning: 'AO', roman: 'ao', category: 'thai-vowels', image: vowelToImage['เ-าะ'] },
  { id: 'o-or', char: 'อ', name: 'ออ', audioText: 'สะหระ ออ', meaning: 'OR', roman: 'or', category: 'thai-vowels', image: vowelToImage['อ'] },
  { id: 'oe-short', char: 'เ-อะ', name: 'เออะ', audioText: 'สะหระ เออะ', meaning: 'Short OE', roman: 'oe', category: 'thai-vowels', image: vowelToImage['เ-อะ'] },
  { id: 'oe-long', char: 'เ-อ', name: 'เออ', audioText: 'สะหระ เออ', meaning: 'Long OE', roman: 'oe', category: 'thai-vowels', image: vowelToImage['เ-อ'] },
  { id: 'ia-short', char: 'เ-ียะ', name: 'เอียะ', audioText: 'สะหระ เอียะ', meaning: 'Short IA', roman: 'ia', category: 'thai-vowels', image: vowelToImage['เ-ียะ'] },
  { id: 'ia-long', char: 'เ-ีย', name: 'เอีย', audioText: 'สะหระ เอีย', meaning: 'Long IA', roman: 'ia', category: 'thai-vowels', image: vowelToImage['เ-ีย'] },
  { id: 'uea-short', char: 'เ-ือะ', name: 'เอือะ', audioText: 'สะหระ เอือะ', meaning: 'Short UEA', roman: 'uea', category: 'thai-vowels', image: vowelToImage['เ-ือะ'] },
  { id: 'uea-long', char: 'เ-ือ', name: 'เอือ', audioText: 'สะหระ เอือ', meaning: 'Long UEA', roman: 'uea', category: 'thai-vowels', image: vowelToImage['เ-ือ'] },
  { id: 'ua-short', char: '-ัวะ', name: 'อัวะ', audioText: 'สะหระ อัวะ', meaning: 'Short UA', roman: 'ua', category: 'thai-vowels', image: vowelToImage['-ัวะ'] },
  { id: 'ua-long', char: '-ัว', name: 'อัว', audioText: 'สะหระ อัว', meaning: 'Long UA', roman: 'ua', category: 'thai-vowels', image: vowelToImage['-ัว'] },
  { id: 'am', char: 'ำ', name: 'อำ', audioText: 'สะหระ อำ', meaning: 'AM', roman: 'am', category: 'thai-vowels', image: vowelToImage['ำ'] },
  { id: 'ai-muan', char: 'ใ', name: 'ใอ', audioText: 'สะหระ ใอ', meaning: 'AI (Muan)', roman: 'ai', category: 'thai-vowels', image: vowelToImage['ใ'] },
  { id: 'ai-malai', char: 'ไ', name: 'ไอ', audioText: 'สะหระ ไอ', meaning: 'AI (Malai)', roman: 'ai', category: 'thai-vowels', image: vowelToImage['ไ'] },
  { id: 'ao', char: 'เ-า', name: 'เอา', audioText: 'สะหระ เอา', meaning: 'AO', roman: 'ao', category: 'thai-vowels', image: vowelToImage['เ-า'] },
  { id: 'rue', char: 'ฤ', name: 'ฤ', audioText: 'สะหระ ฤ', meaning: 'RUE', roman: 'rue', category: 'thai-vowels', image: vowelToImage['ฤ'] },
  { id: 'rue-long', char: 'ฤๅ', name: 'ฤๅ', audioText: 'สะหระ ฤๅ', meaning: 'RUE Long', roman: 'rue', category: 'thai-vowels', image: vowelToImage['ฤๅ'] },
  { id: 'lue', char: 'ฦ', name: 'ฦ', audioText: 'สะหระ ฦ', meaning: 'LUE', roman: 'lue', category: 'thai-vowels', image: vowelToImage['ฦ'] },
  { id: 'lue-long', char: 'ฦๅ', name: 'ฦๅ', audioText: 'สะหระ ฦๅ', meaning: 'LUE Long', roman: 'lue', category: 'thai-vowels', image: vowelToImage['ฦๅ'] },
];

// ข้อมูลวรรณยุกต์ไทย
const thaiTones = [
  { id: 'mai-ek', char: '่', name: 'ไม้เอก', meaning: 'Low Tone', roman: 'mai ek', category: 'thai-tones', image: require('../assets/tones/ไม้เอก.png') },
  { id: 'mai-tho', char: '้', name: 'ไม้โท', meaning: 'Falling Tone', roman: 'mai tho', category: 'thai-tones', image: require('../assets/tones/ไม้โท.png') },
  { id: 'mai-tri', char: '๊', name: 'ไม้ตรี', meaning: 'High Tone', roman: 'mai tri', category: 'thai-tones', image: require('../assets/tones/ไม้ตรี.png') },
  { id: 'mai-chattawa', char: '๋', name: 'ไม้จัตวา', meaning: 'Rising Tone', roman: 'mai chattawa', category: 'thai-tones', image: require('../assets/tones/ไม้จัตวา.png') },
];

const VocabLearnCard = ({ item, onSpeak, seen }) => {
  const [showDescription, setShowDescription] = useState(false);
  const mastered = seen?.mastered;
  
  // Load image from ADD_IMAGES with fuzzy matching
  const getImageSource = () => {
    try {
      const ADD_IMAGES = require('../add/imageManifest').ADD_IMAGES;
      
      // Try exact match first
      let imagePath = ADD_IMAGES[item.imageKey];
      
      if (imagePath) {
        console.log(`✅ Found image: ${item.imageKey}`);
        return imagePath;
      }
      
      // If not found, search all keys for Thai name
      if (item.thai) {
        const category = item.imageKey?.split('/')[0] || '';
        
        // Get all keys with this category
        const categoryKeys = Object.keys(ADD_IMAGES).filter(k => k.startsWith(`${category}/`));
        
        console.log(`⚠️ Searching in category "${category}" for: ${item.thai}`);
        
        // Try to find similar Thai names (fuzzy match)
        for (const key of categoryKeys) {
          const filename = key.replace(`${category}/`, '').replace('.png', '');
          
          // Check if similar (handles typos like ๊ vs ์)
          if (filename.includes(item.thai) || item.thai.includes(filename)) {
            console.log(`✅ Found fuzzy match: ${key}`);
            imagePath = ADD_IMAGES[key];
            break;
          }
        }
      }
      
      if (!imagePath) {
        console.log(`❌ No image found for: ${item.thai} (${item.imageKey})`);
      }
      
      return imagePath;
    } catch (e) {
      console.log('Image loading error:', e);
      return null;
    }
  };

  const imageSource = getImageSource();

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => onSpeak(item)}
      style={[styles.card, styles.vocabCardLearn, mastered && styles.cardMastered]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.vocabChar}>{item.thai}</Text>
        <View style={styles.sound}>
          <Image source={require('../assets/icons/speaker.png')} style={styles.speakerIcon} />
        </View>
      </View>

      <View style={styles.imageBox}>
        {imageSource ? (
          <Image source={imageSource} style={styles.charImage} resizeMode="contain" />
        ) : (
          <Text style={styles.charEmoji}>{item.thai}</Text>
        )}
      </View>

      {/* English translation - always visible */}
      <View style={styles.englishContainer}>
        <Text style={styles.englishText}>{item.english || ''}</Text>
      </View>

      {/* Description Toggle Button */}
      <TouchableOpacity 
        style={styles.descriptionButton}
        onPress={(e) => {
          e.stopPropagation();
          setShowDescription(!showDescription);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.descriptionButtonText}>
          {showDescription ? 'ซ่อนคำอธิบาย' : 'ดูคำอธิบาย'}
        </Text>
      </TouchableOpacity>

      {/* Description Content */}
      {showDescription && (
        <View style={styles.descriptionContainer}>
          <View style={styles.backSection}>
            <Text style={styles.backLabel}>🇹🇭 คำอธิบาย</Text>
            <Text style={styles.backTextThai}>{item.descriptionTH}</Text>
          </View>
          
          <View style={styles.backSection}>
            <Text style={styles.backLabel}>🇬🇧 Description</Text>
            <Text style={styles.backTextEnglish}>{item.descriptionEN}</Text>
          </View>
        </View>
      )}

      <View style={styles.footerRow}>
        {seen ? (
          <Text style={[styles.meta, mastered && { color: '#2e7d32', fontWeight: '700' }]}>
            {mastered ? 'Mastered' : `Seen ${seen.correct + seen.wrong}x`}
          </Text>
        ) : (
          <Text style={styles.meta}>New</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const LearnCard = ({ item, onSpeak, seen, category }) => {
  const mastered = seen?.mastered;
  const getCardStyle = () => {
    switch (category) {
      case 'thai-consonants':
        return [styles.card, styles.consonantCard, mastered && styles.cardMastered];
      case 'thai-vowels':
        return [styles.card, styles.vowelCard, mastered && styles.cardMastered];
      case 'thai-tones':
        return [styles.card, styles.toneCard, mastered && styles.cardMastered];
      default:
        return [styles.card, mastered && styles.cardMastered];
    }
  };

  const getCharStyle = () => {
    switch (category) {
      case 'thai-consonants':
        return styles.consonantChar;
      case 'thai-vowels':
        return styles.vowelChar;
      case 'thai-tones':
        return styles.toneChar;
      default:
        return styles.char;
    }
  };

  return (
    <View style={getCardStyle()}>
      <View style={styles.cardHeader}>
        <Text style={getCharStyle()}>{item.char}</Text>
        <TouchableOpacity style={styles.sound} onPress={() => onSpeak(item)}>
          <Image source={require('../assets/icons/speaker.png')} style={styles.speakerIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.imageBox}>
        {item.image ? (
          <Image source={item.image} style={styles.charImage} resizeMode="contain" />
        ) : (
          <Text style={[styles.charEmoji, getCharStyle()]}>{item.char}</Text>
        )}
      </View>

      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.meaning}>{item.meaning}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.meta}>{item.roman || '-'}</Text>
        {seen ? (
          <Text style={[styles.meta, mastered && { color: '#2e7d32', fontWeight: '700' }]}>
            {mastered ? 'Mastered' : `Seen ${seen.correct + seen.wrong}x`}
          </Text>
        ) : (
          <Text style={styles.meta}>New</Text>
        )}
      </View>
    </View>
  );
};

const ConsonantLearnScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [consonants, setConsonants] = useState([]);
  const [vowels, setVowels] = useState([]);
  const [tones, setTones] = useState([]);
  const [perLetter, setPerLetter] = useState({});
  const [activeTab, setActiveTab] = useState('consonants'); // consonants | vowels | tones | vocab
  
  // Vocab states
  const [vocabCategories, setVocabCategories] = useState({});
  const [activeVocabCategory, setActiveVocabCategory] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // ใช้ข้อมูลพยัญชนะที่กำหนดไว้ (44 ตัว)
        setConsonants(thaiConsonants);
        
        // ใช้ข้อมูลสระและวรรณยุกต์ที่กำหนดไว้
        setVowels(thaiVowels);
        setTones(thaiTones);
        
        // โหลด vocab categories
        const categories = {};
        Object.keys(vocabFullData).forEach(cat => {
          categories[cat] = vocabFullData[cat];
        });
        setVocabCategories(categories);
        setActiveVocabCategory(Object.keys(vocabFullData)[0]); // Default to first category
        
        const server = await loadLocal(USER_ID, LESSON_ID);
        if (server?.perLetter) setPerLetter(server.perLetter);
      } catch (e) {
        console.log('Load learn page error:', e?.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const markSeen = async (char, correct = true) => {
    const prev = perLetter[char] || { correct: 0, wrong: 0, streak: 0, accuracy: 0, mastered: false, lastSeenAt: 0 };
    const next = {
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      streak: correct ? prev.streak + 1 : 0,
      accuracy: (prev.correct + (correct ? 1 : 0)) / Math.max(1, prev.correct + prev.wrong + 1),
      mastered: (prev.streak + 1) >= 3 || ((prev.correct + 1) / (prev.correct + prev.wrong + 1)) >= 0.8,
      lastSeenAt: Date.now(),
    };
    const updated = { ...perLetter, [char]: next };
    setPerLetter(updated);

    // fire-and-forget - save to local storage only
    try {
      await saveLocal(USER_ID, LESSON_ID, {
        userId: USER_ID,
        lessonId: LESSON_ID,
        category: LESSON_KEY,
        currentIndex: 0,
        total: consonants.length + vowels.length + tones.length,
        hearts: 5,
        score: 0,
        xp: 0,
        perLetter: updated,
        answers: {},
        questionsSnapshot: [],
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.log('Local save error:', error);
    }
  };

  const onSpeak = async (it) => {
    // Handle different item types (consonants, vowels, tones, vocab)
    const textToSpeak = it.audioText || it.name || it.thai || it.char || '';
    await vaja9TtsService.playThai(textToSpeak);
    
    const keyToMark = it.char || it.thai || it.id;
    if (keyToMark) markSeen(keyToMark, true);
  };

  const header = useMemo(() => (
    <View style={styles.header}>
      <ThemedBackButton style={styles.backButton} onPress={() => navigation.goBack()} />
      <View style={styles.headerContent}>
        <Text style={styles.title}>Learn Thai</Text>
        <Text style={styles.subtitle}>Consonants • Vowels • Tones</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  ), [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      </SafeAreaView>
    );
  }

  const renderSection = (title, data, category, color) => (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { backgroundColor: color }]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{data.length}</Text>
      </View>
      <FlatList
        data={data}
        numColumns={2}
        scrollEnabled={false}
        keyExtractor={(item, index) => `${category}-${item.id || item.char || index}-${index}`}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item, index }) => (
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => onSpeak(item)} 
            style={styles.gridCardWrapper}
          >
            <LearnCard 
              item={item} 
              onSpeak={onSpeak} 
              seen={perLetter[item.char]} 
              category={category}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderTonesSection = () => {
    // Map tones from state and attach display colors
    const getToneColor = (toneId) => {
      switch (toneId) {
        case 'mai-ek':
          return '#74C0FC';
        case 'mai-tho':
          return '#FFA8A8';
        case 'mai-tri':
          return '#FFD43B';
        case 'mai-chattawa':
          return '#B197FC';
        default:
          return '#FFEDEB';
      }
    };

    const toneItems = (tones || []).map((t) => ({
      id: t.id,
      char: t.char,
      name: t.name,
      image: t.image,
      color: getToneColor(t.id),
    }));

    const onTonePress = (tone) => {
      onSpeak({ char: tone.char, name: tone.name });
    };

    return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { backgroundColor: '#45B7D1' }]}> 
        <Text style={styles.sectionTitle}>Tones</Text>
        <Text style={styles.sectionCount}>{toneItems.length}</Text>
      </View>
      <View style={styles.tonesContainer}>
        <View style={styles.tonesGridImages}>
          {toneItems.map((tone) => (
            <View key={tone.id} style={styles.toneImageCard}>
              <Image source={tone.image} style={styles.toneImage} resizeMode="contain" />
              <Text style={styles.toneImageLabel}>{tone.name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.toneChipsGrid}>
          {toneItems.map((tone) => (
            <TouchableOpacity
              key={tone.id}
              activeOpacity={0.9}
              onPress={() => onTonePress(tone)}
              style={[styles.toneButton, { backgroundColor: tone.color }]}
            >
              <Text style={styles.toneButtonChar}>{tone.char}</Text>
              <Text style={styles.toneButtonLabel}>{tone.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
  };

  return (
    <SafeAreaView style={styles.container}>
      {header}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'consonants' && styles.tabActive]}
          onPress={() => setActiveTab('consonants')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'consonants' && styles.tabTextActive]}>Consonants</Text>
          <Text style={[styles.tabCount, activeTab === 'consonants' && styles.tabTextActive]}>{consonants.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'vowels' && styles.tabActive]}
          onPress={() => setActiveTab('vowels')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'vowels' && styles.tabTextActive]}>Vowels</Text>
          <Text style={[styles.tabCount, activeTab === 'vowels' && styles.tabTextActive]}>{vowels.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tones' && styles.tabActive]}
          onPress={() => setActiveTab('tones')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'tones' && styles.tabTextActive]}>Tones</Text>
          <Text style={[styles.tabCount, activeTab === 'tones' && styles.tabTextActive]}>4</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'vocab' && styles.tabActive]}
          onPress={() => setActiveTab('vocab')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'vocab' && styles.tabTextActive]}>Vocabulary</Text>
          <Text style={[styles.tabCount, activeTab === 'vocab' && styles.tabTextActive]}>273</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'consonants' && renderSection('Thai Consonants', consonants, 'thai-consonants', '#FF8C00')}
        {activeTab === 'vowels' && renderSection('Thai Vowels', vowels, 'thai-vowels', '#FFA500')}
        {activeTab === 'tones' && renderTonesSection()}
        
        {activeTab === 'vocab' && (
          <View style={styles.vocabContainer}>
            {/* Category Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabsContainer}>
              {Object.keys(vocabCategories).map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveVocabCategory(cat)}
                  style={[styles.categoryTab, activeVocabCategory === cat && styles.categoryTabActive]}
                >
                  <Text style={[styles.categoryTabText, activeVocabCategory === cat && styles.categoryTabTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Render active category */}
            {activeVocabCategory && vocabCategories[activeVocabCategory] && (
              <View style={styles.vocabSection}>
                <Text style={styles.vocabSectionTitle}>{activeVocabCategory}</Text>
                <Text style={styles.vocabSectionSubtitle}>
                  {vocabCategories[activeVocabCategory].length} words
                </Text>
                <FlatList
                  data={vocabCategories[activeVocabCategory]}
                  numColumns={2}
                  scrollEnabled={false}
                  keyExtractor={(item, index) => `${activeVocabCategory}-${item.thai}-${index}`}
                  columnWrapperStyle={styles.columnWrapper}
                  contentContainerStyle={styles.flatListContent}
                  renderItem={({ item, index }) => (
                    <View style={styles.gridCardWrapper}>
                      <VocabLearnCard 
                        item={item} 
                        onSpeak={onSpeak} 
                        seen={perLetter[item.thai]} 
                      />
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE6D4',
    borderWidth: 2,
    borderColor: '#FF8000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#FF8000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#2c3e50', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#7f8c8d', marginTop: 8, textAlign: 'center' },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FFEDEB',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  tabText: { color: '#6b7280', fontWeight: '700' },
  tabTextActive: { color: '#d9480f' },
  tabCount: { fontSize: 12, color: '#94a3b8', fontWeight: '700' },

  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  sectionCount: { fontSize: 14, color: '#fff', opacity: 0.9 },

  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 16,
  },
  cardWrapper: { 
    width: '48%', 
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  flatListContent: {
    paddingBottom: 24,
  },
  gridCardWrapper: {
    width: '48%',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  consonantCard: { borderLeftWidth: 4, borderLeftColor: '#FF6B6B' },
  vowelCard: { borderLeftWidth: 4, borderLeftColor: '#4ECDC4' },
  toneCard: { borderLeftWidth: 4, borderLeftColor: '#45B7D1' },
  vocabCardLearn: { borderLeftWidth: 4, borderLeftColor: '#FF8000' },
  cardMastered: { borderColor: '#28a745', backgroundColor: '#f8fff9' },
  
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12,
  },
  char: { fontSize: 32, fontWeight: '800', color: '#FF6B6B' },
  consonantChar: { fontSize: 32, fontWeight: '800', color: '#FF6B6B' },
  vowelChar: { fontSize: 32, fontWeight: '800', color: '#4ECDC4' },
  toneChar: { fontSize: 32, fontWeight: '800', color: '#45B7D1' },
  vocabChar: { fontSize: 32, fontWeight: '800', color: '#FF8000' },
  
  sound: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f8f9fa', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  speakerIcon: { width: 22, height: 22 },
  
  imageBox: { 
    height: 100, 
    marginVertical: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  charImage: { width: '100%', height: '100%' },
  charEmoji: { fontSize: 48, fontWeight: '800' },
  
  name: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#2c3e50', 
    textAlign: 'center',
    marginBottom: 4,
  },
  meaning: { 
    fontSize: 14, 
    color: '#6c757d', 
    textAlign: 'center',
    marginBottom: 8,
  },
  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  meta: { fontSize: 12, color: '#adb5bd' },

  /* Tones Section */
  tonesContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    padding: 12,
    alignItems: 'center',
  },
  tonesImage: {
    width: '80%',
    aspectRatio: 3 / 2,
    marginBottom: 16,
  },
  tonesGridImages: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 8,
  },
  toneImageCard: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 6,
    alignItems: 'center',
  },
  toneImage: {
    width: '100%',
    height: 110,
  },
  toneImageLabel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2d3d',
  },
  toneChipsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  toneButton: {
    flexBasis: '48%',
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toneButtonChar: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  toneButtonLabel: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2d3d',
  },
  
  // Vocab styles
  vocabContainer: {
    paddingVertical: 16,
  },
  categoryTabsContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryTabActive: {
    backgroundColor: '#FF8000',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  vocabSection: {
    paddingHorizontal: 16,
  },
  vocabSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#2c3e50',
  },
  vocabSectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    color: '#FF8000',
  },
  vocabGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  vocabCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFEDEB',
    marginBottom: 12,
    shadowColor: '#FF8000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    position: 'relative',
    minHeight: 140,
  },
  vocabSound: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5E5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  vocabThai: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF8000',
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  vocabEnglish: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  vocabDescription: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // English translation container
  englishContainer: {
    backgroundColor: '#FFF5E5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  englishText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8000',
    textAlign: 'center',
  },
  
  // Description Button
  descriptionButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  descriptionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Description Container
  descriptionContainer: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  backSection: {
    marginBottom: 12,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF8000',
    marginBottom: 4,
  },
  backTextThai: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    lineHeight: 20,
  },
  backTextEnglish: {
    fontSize: 13,
    fontWeight: '400',
    color: '#495057',
    lineHeight: 18,
    fontStyle: 'italic',
  },

});

export default ConsonantLearnScreen;
