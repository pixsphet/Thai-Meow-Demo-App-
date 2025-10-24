import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { restoreProgress, saveProgress, saveLocal, loadLocal } from '../services/progressService';
import vaja9TtsService from '../services/vaja9TtsService';
import { charToImage } from '../assets/letters/map';
import { vowelToImage } from '../assets/vowels/map';

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
  { id: 'a-short', char: 'ะ', name: 'อะ', meaning: 'Short A', roman: 'a', category: 'thai-vowels', image: vowelToImage['ะ'] },
  { id: 'a-long', char: 'า', name: 'อา', meaning: 'Long A', roman: 'aa', category: 'thai-vowels', image: vowelToImage['า'] },
  { id: 'i-short', char: 'ิ', name: 'อิ', meaning: 'Short I', roman: 'i', category: 'thai-vowels', image: vowelToImage['ิ'] },
  { id: 'i-long', char: 'ี', name: 'อี', meaning: 'Long I', roman: 'ii', category: 'thai-vowels', image: vowelToImage['ี'] },
  { id: 'ue-short', char: 'ึ', name: 'อึ', meaning: 'Short Ue', roman: 'ue', category: 'thai-vowels', image: vowelToImage['ึ'] },
  { id: 'ue-long', char: 'ื', name: 'อือ', meaning: 'Long Ue', roman: 'uue', category: 'thai-vowels', image: vowelToImage['ื'] },
  { id: 'u-short', char: 'ุ', name: 'อุ', meaning: 'Short U', roman: 'u', category: 'thai-vowels', image: vowelToImage['ุ'] },
  { id: 'u-long', char: 'ู', name: 'อู', meaning: 'Long U', roman: 'uu', category: 'thai-vowels', image: vowelToImage['ู'] },
  { id: 'e-short', char: 'เ-ะ', name: 'เอะ', meaning: 'Short E', roman: 'e', category: 'thai-vowels', image: vowelToImage['เ-ะ'] },
  { id: 'e-long', char: 'เ-', name: 'เอ', meaning: 'Long E', roman: 'e', category: 'thai-vowels', image: vowelToImage['เ-'] },
  { id: 'ae-short', char: 'แ-ะ', name: 'แอะ', meaning: 'Short AE', roman: 'ae', category: 'thai-vowels', image: vowelToImage['แ-ะ'] },
  { id: 'ae-long', char: 'แ-', name: 'แอ', meaning: 'Long AE', roman: 'ae', category: 'thai-vowels', image: vowelToImage['แ-'] },
  { id: 'o-short', char: 'โ-ะ', name: 'โอะ', meaning: 'Short O', roman: 'o', category: 'thai-vowels', image: vowelToImage['โ-ะ'] },
  { id: 'o-long', char: 'โ-', name: 'โอ', meaning: 'Long O', roman: 'o', category: 'thai-vowels', image: vowelToImage['โ-'] },
  { id: 'o-ao', char: 'เ-าะ', name: 'เอาะ', meaning: 'AO', roman: 'ao', category: 'thai-vowels', image: vowelToImage['เ-าะ'] },
  { id: 'o-or', char: 'อ', name: 'ออ', meaning: 'OR', roman: 'or', category: 'thai-vowels', image: vowelToImage['อ'] },
  { id: 'oe-short', char: 'เ-อะ', name: 'เออะ', meaning: 'Short OE', roman: 'oe', category: 'thai-vowels', image: vowelToImage['เ-อะ'] },
  { id: 'oe-long', char: 'เ-อ', name: 'เออ', meaning: 'Long OE', roman: 'oe', category: 'thai-vowels', image: vowelToImage['เ-อ'] },
  { id: 'ia-short', char: 'เ-ียะ', name: 'เอียะ', meaning: 'Short IA', roman: 'ia', category: 'thai-vowels', image: vowelToImage['เ-ียะ'] },
  { id: 'ia-long', char: 'เ-ีย', name: 'เอีย', meaning: 'Long IA', roman: 'ia', category: 'thai-vowels', image: vowelToImage['เ-ีย'] },
  { id: 'uea-short', char: 'เ-ือะ', name: 'เอือะ', meaning: 'Short UEA', roman: 'uea', category: 'thai-vowels', image: vowelToImage['เ-ือะ'] },
  { id: 'uea-long', char: 'เ-ือ', name: 'เอือ', meaning: 'Long UEA', roman: 'uea', category: 'thai-vowels', image: vowelToImage['เ-ือ'] },
  { id: 'ua-short', char: '-ัวะ', name: 'อัวะ', meaning: 'Short UA', roman: 'ua', category: 'thai-vowels', image: vowelToImage['-ัวะ'] },
  { id: 'ua-long', char: '-ัว', name: 'อัว', meaning: 'Long UA', roman: 'ua', category: 'thai-vowels', image: vowelToImage['-ัว'] },
  { id: 'am', char: 'ำ', name: 'อำ', meaning: 'AM', roman: 'am', category: 'thai-vowels', image: vowelToImage['ำ'] },
  { id: 'ai-muan', char: 'ใ', name: 'ใอ', meaning: 'AI (Muan)', roman: 'ai', category: 'thai-vowels', image: vowelToImage['ใ'] },
  { id: 'ai-malai', char: 'ไ', name: 'ไอ', meaning: 'AI (Malai)', roman: 'ai', category: 'thai-vowels', image: vowelToImage['ไ'] },
  { id: 'ao', char: 'เ-า', name: 'เอา', meaning: 'AO', roman: 'ao', category: 'thai-vowels', image: vowelToImage['เ-า'] },
  { id: 'rue', char: 'ฤ', name: 'ฤ', meaning: 'RUE', roman: 'rue', category: 'thai-vowels', image: vowelToImage['ฤ'] },
  { id: 'rue-long', char: 'ฤๅ', name: 'ฤๅ', meaning: 'RUE Long', roman: 'rue', category: 'thai-vowels', image: vowelToImage['ฤๅ'] },
  { id: 'lue', char: 'ฦ', name: 'ฦ', meaning: 'LUE', roman: 'lue', category: 'thai-vowels', image: vowelToImage['ฦ'] },
  { id: 'lue-long', char: 'ฦๅ', name: 'ฦๅ', meaning: 'LUE Long', roman: 'lue', category: 'thai-vowels', image: vowelToImage['ฦๅ'] },
];

// ข้อมูลวรรณยุกต์ไทย
const thaiTones = [
  { id: 'mai-ek', char: '่', name: 'ไม้เอก', meaning: 'Low Tone', roman: 'mai ek', category: 'thai-tones', image: require('../assets/tones/ไม้เอก.png') },
  { id: 'mai-tho', char: '้', name: 'ไม้โท', meaning: 'Falling Tone', roman: 'mai tho', category: 'thai-tones', image: require('../assets/tones/ไม้โท.png') },
  { id: 'mai-tri', char: '๊', name: 'ไม้ตรี', meaning: 'High Tone', roman: 'mai tri', category: 'thai-tones', image: require('../assets/tones/ไม้ตรี.png') },
  { id: 'mai-chattawa', char: '๋', name: 'ไม้จัตวา', meaning: 'Rising Tone', roman: 'mai chattawa', category: 'thai-tones', image: require('../assets/tones/ไม้จัตวา.png') },
];

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
  const [activeTab, setActiveTab] = useState('consonants'); // consonants | vowels | tones

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // ใช้ข้อมูลพยัญชนะที่กำหนดไว้ (44 ตัว)
        setConsonants(thaiConsonants);
        
        // ใช้ข้อมูลสระและวรรณยุกต์ที่กำหนดไว้
        setVowels(thaiVowels);
        setTones(thaiTones);
        
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
    await vaja9TtsService.playThai(it.name || it.char);
    markSeen(it.char, true);
  };

  const header = useMemo(() => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Icon name="arrow-back" size={24} color="#2c3e50" />
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.title}>เรียนภาษาไทย</Text>
        <Text style={styles.subtitle}>พยัญชนะ • สระ • วรรณยุกต์</Text>
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
        <Text style={styles.sectionCount}>{data.length} ตัว</Text>
      </View>
      <View style={styles.cardsContainer}>
        {data.map((item, index) => (
          <TouchableOpacity 
            key={item.id || index} 
            activeOpacity={0.9} 
            onPress={() => onSpeak(item)} 
            style={styles.cardWrapper}
          >
            <LearnCard 
              item={item} 
              onSpeak={onSpeak} 
              seen={perLetter[item.char]} 
              category={category}
            />
          </TouchableOpacity>
        ))}
      </View>
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
        <Text style={styles.sectionTitle}>วรรณยุกต์</Text>
        <Text style={styles.sectionCount}>{toneItems.length} เสียง</Text>
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
          <Text style={[styles.tabText, activeTab === 'consonants' && styles.tabTextActive]}>พยัญชนะ</Text>
          <Text style={[styles.tabCount, activeTab === 'consonants' && styles.tabTextActive]}>{consonants.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'vowels' && styles.tabActive]}
          onPress={() => setActiveTab('vowels')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'vowels' && styles.tabTextActive]}>สระ</Text>
          <Text style={[styles.tabCount, activeTab === 'vowels' && styles.tabTextActive]}>{vowels.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tones' && styles.tabActive]}
          onPress={() => setActiveTab('tones')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'tones' && styles.tabTextActive]}>วรรณยุกต์</Text>
          <Text style={[styles.tabCount, activeTab === 'tones' && styles.tabTextActive]}>4</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'consonants' && renderSection('พยัญชนะไทย', consonants, 'thai-consonants', '#FF8C00')}
        {activeTab === 'vowels' && renderSection('สระไทย', vowels, 'thai-vowels', '#FFA500')}
        {activeTab === 'tones' && renderTonesSection()}
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
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  },
  cardWrapper: { width: '48%', marginBottom: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  consonantCard: { borderLeftWidth: 4, borderLeftColor: '#FF6B6B' },
  vowelCard: { borderLeftWidth: 4, borderLeftColor: '#4ECDC4' },
  toneCard: { borderLeftWidth: 4, borderLeftColor: '#45B7D1' },
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

});

export default ConsonantLearnScreen;
