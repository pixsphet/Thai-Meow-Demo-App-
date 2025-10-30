import React, { useState, useEffect, useRef} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import { MOCK_LEVELS } from "../add/Data/DataMiniGame.js";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const gridSize = 8;

// ตัวอักษรไทย
const consonants =
  "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ";
const vowels = ["ะ", "า", "ิ", "ี", "ึ", "ื", "ุ", "ู", "เ", "แ", "โ", "ใ", "ไ", ""];
const tones = ["", "่", "้", "๊", "๋"];

// แยกคำไทยเป็นหน่วยตัวอักษร (พยัญชนะ + สระ + วรรณยุกต์)
const splitThaiWordForGrid = (word) => {
  const clusters = [];
  const consonants = "กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ";
  const combining = ["่", "้", "๊", "๋", "ิ", "ี", "ึ", "ื", "ุ", "ู", "ั"];
  const leadingVowels = ["เ", "แ", "โ", "ใ", "ไ"];
  let buffer = "";

  for (let char of word) {
    if (consonants.includes(char)) {
      if (buffer) clusters.push(buffer);
      buffer = char;
    } else if (combining.includes(char)) {
      buffer += char;
    } else if (leadingVowels.includes(char)) {
      if (buffer) clusters.push(buffer);
      buffer = char;
    } else {
      if (buffer) clusters.push(buffer);
      buffer = char;
    }
  }

  if (buffer) clusters.push(buffer);
  return clusters;
};

// สุ่มตัวอักษรไทย
const randomThaiChar = () => {
  const base = consonants[Math.floor(Math.random() * consonants.length)];
  const vowel = vowels[Math.floor(Math.random() * vowels.length)];
  const tone = tones[Math.floor(Math.random() * tones.length)];
  return base + vowel + tone;
};

// หาตำแหน่งของคำในกริด
const findWordCells = (grid, words) => {
  const wordLocations = {};

  words.forEach((item) => {
    const splitWord = splitThaiWordForGrid(item.word);
    let found = false;

    // แนวนอน
    for (let row = 0; row < gridSize && !found; row++) {
      for (let col = 0; col <= gridSize - splitWord.length; col++) {
        let match = true;
        for (let k = 0; k < splitWord.length; k++) {
          if (grid[row][col + k] !== splitWord[k]) {
            match = false;
            break;
          }
        }
        if (match) {
          wordLocations[item.id] = splitWord.map((_, k) => ({
            row: row,
            col: col + k,
          }));
          found = true;
          break;
        }
      }
    }

    // แนวตั้ง
    for (let col = 0; col < gridSize && !found; col++) {
      for (let row = 0; row <= gridSize - splitWord.length; row++) {
        let match = true;
        for (let k = 0; k < splitWord.length; k++) {
          if (grid[row + k][col] !== splitWord[k]) {
            match = false;
            break;
          }
        }
        if (match) {
          wordLocations[item.id] = splitWord.map((_, k) => ({
            row: row + k,
            col: col,
          }));
          found = true;
          break;
        }
      }
    }

    // แนวเฉียง
    for (let row = 0; row <= gridSize - splitWord.length && !found; row++) {
      for (let col = 0; col <= gridSize - splitWord.length; col++) {
        let match = true;
        for (let k = 0; k < splitWord.length; k++) {
          if (grid[row + k][col + k] !== splitWord[k]) {
            match = false;
            break;
          }
        }
        if (match) {
          wordLocations[item.id] = splitWord.map((_, k) => ({
            row: row + k,
            col: col + k,
          }));
          found = true;
          break;
        }
      }
    }

    if (!found) {
      wordLocations[item.id] = [];
    }
  });

  return wordLocations;
};

const Game1Screen = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [grid, setGrid] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [message, setMessage] = useState("");
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [wordLocations, setWordLocations] = useState({});
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showEndPopup, setShowEndPopup] = useState(false);

  const navigation = useNavigation();
  const currentLevel = MOCK_LEVELS[levelIndex];

  // Always use MOCK_LEVELS with Thai hints
  // useEffect(() => {
  //   let mounted = true;
  //   (async () => {
  //     try {
  //       const words = await getByCategory(category, { count: 8 });
  //       if (!mounted) return;
  //       if (Array.isArray(words) && words.length) {
  //         const normalized = words.map((w, idx) => ({ 
  //           id: idx + 1, 
  //           word: w.thai, 
  //           hint: w.hint || w.english || category 
  //         }));
  //         setCustomLevel({ level: 1, name: `${category}`, words: normalized });
  //         return;
  //       }
  //     } catch (_) {}
  //     setCustomLevel(null);
  //   })();
  //   return () => { mounted = false; };
  // }, [category]);

  const generateGrid = (words) => {
    const newGrid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => "")
    );

    words.forEach((item) => {
      const splitWord = splitThaiWordForGrid(item.word);
      if (splitWord.length > gridSize) return;

      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        const direction = Math.floor(Math.random() * 3);
        let row, col, canPlace;

        if (direction === 0) {
          row = Math.floor(Math.random() * gridSize);
          col = Math.floor(Math.random() * (gridSize - splitWord.length + 1));
          canPlace = splitWord.every(
            (char, idx) => !newGrid[row][col + idx] || newGrid[row][col + idx] === char
          );
          if (canPlace) splitWord.forEach((char, idx) => (newGrid[row][col + idx] = char));
        } else if (direction === 1) {
          row = Math.floor(Math.random() * (gridSize - splitWord.length + 1));
          col = Math.floor(Math.random() * gridSize);
          canPlace = splitWord.every(
            (char, idx) => !newGrid[row + idx][col] || newGrid[row + idx][col] === char
          );
          if (canPlace) splitWord.forEach((char, idx) => (newGrid[row + idx][col] = char));
        } else {
          row = Math.floor(Math.random() * (gridSize - splitWord.length + 1));
          col = Math.floor(Math.random() * (gridSize - splitWord.length + 1));
          canPlace = splitWord.every(
            (char, idx) => !newGrid[row + idx][col + idx] || newGrid[row + idx][col + idx] === char
          );
          if (canPlace) splitWord.forEach((char, idx) => (newGrid[row + idx][col + idx] = char));
        }

        if (canPlace) placed = true;
      }
    });

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!newGrid[i][j]) {
          newGrid[i][j] = consonants[Math.floor(Math.random() * consonants.length)];
        }
      }
    }

    return newGrid;
  };

  useEffect(() => {
    const newGrid = generateGrid(currentLevel.words);
    setGrid(newGrid);
    setSelectedCells([]);
    setFoundWords([]);
    setMessage("");
    setIsGameComplete(false);
    setAttempts(0);
    setWordLocations(findWordCells(newGrid, currentLevel.words));
  }, [levelIndex]);

  const handleCellPress = (rowIndex, colIndex) => {
    if (isGameComplete) return;

    const cellKey = `${rowIndex}-${colIndex}`;
    const isAlreadySelected = selectedCells.some((cell) => cell.key === cellKey);

    if (isAlreadySelected) {
      setSelectedCells([]);
      setMessage("");
      return;
    }

    if (selectedCells.length > 0) {
      const lastCell = selectedCells[selectedCells.length - 1];
      const rowDiff = Math.abs(rowIndex - lastCell.row);
      const colDiff = Math.abs(colIndex - lastCell.col);

      const isContinuous = rowDiff <= 1 && colDiff <= 1 && (rowDiff !== 0 || colDiff !== 0);

      if (selectedCells.length >= 2) {
        const firstCell = selectedCells[0];
        const secondCell = selectedCells[1];
        const dirRowDiff = secondCell.row - firstCell.row;
        const dirColDiff = secondCell.col - firstCell.col;

        const currentDirRowDiff = rowIndex - lastCell.row;
        const currentDirColDiff = colIndex - lastCell.col;

        const sameDirection =
          Math.sign(dirRowDiff) === Math.sign(currentDirRowDiff) &&
          Math.sign(dirColDiff) === Math.sign(currentDirColDiff);

        if (!sameDirection) {
          setMessage("⚠️ Keep the same direction");
          setTimeout(() => setMessage(""), 1500);
          return;
        }
      }

      if (!isContinuous) {
        setSelectedCells([{ row: rowIndex, col: colIndex, key: cellKey }]);
        setMessage("💡 New word: selections must be continuous");
        setTimeout(() => setMessage(""), 1500);
        return;
      }
    }

    const newSelectedCells = [...selectedCells, { row: rowIndex, col: colIndex, key: cellKey }];
    setSelectedCells(newSelectedCells);
    checkWord(newSelectedCells);
  };

  const checkWord = (cells) => {
    if (cells.length === 0) return;

    const selectedWord = cells.map((cell) => grid[cell.row][cell.col]).join("");
    const matchedWord = currentLevel.words.find(
      (item) =>
        splitThaiWordForGrid(item.word).join("") === selectedWord &&
        !foundWords.includes(item.id)
    );

    if (matchedWord) {
      const newFoundWords = [...foundWords, matchedWord.id];

      setFoundWords(newFoundWords);
      setScore(score + 100);
      setMessage(` Correct! Found "${matchedWord.word}" (+100 pts)`);
      setSelectedCells([]);

      if (newFoundWords.length === currentLevel.words.length) {
        setIsGameComplete(true);
        setTimeout(() => {
          if (levelIndex < MOCK_LEVELS.length - 1) {
            setLevelIndex((prev) => prev + 1);
            setMessage("");
            setIsGameComplete(false);
          } else {
            // 🎯 ด่านสุดท้ายแล้ว → แสดง Popup "ผ่านทุกด่าน"
            setShowEndPopup(true);
          }
        }, 3000); // แสดงอนิเมชัน 3 วิ ก่อนแสดง popup หรือไปด่านต่อไป
      }
    } else if (cells.length > 12) {
      setMessage("❌ Not correct, try again");
      setAttempts(attempts + 1);
      setSelectedCells([]);
      setTimeout(() => setMessage(""), 1500);
    }
  };

  const isCellSelected = (rowIndex, colIndex) => {
    return selectedCells.some(
      (cell) => cell.row === rowIndex && cell.col === colIndex
    );
  };

  const isCellInFoundWord = (rowIndex, colIndex) => {
    return foundWords.some((wordId) => {
      const locations = wordLocations[wordId];
      if (!locations) return false;
      return locations.some((loc) => loc.row === rowIndex && loc.col === colIndex);
    });
  };

  const getSelectionOrder = (rowIndex, colIndex) => {
    const index = selectedCells.findIndex(
      (cell) => cell.row === rowIndex && cell.col === colIndex
    );
    return index >= 0 ? index + 1 : null;
  };

  const nextLevel = () => {
    if (levelIndex < MOCK_LEVELS.length - 1) {
      // ไปด่านต่อไป
      setLevelIndex((prev) => prev + 1);
    } else {
      // ผ่านทุกด่านแล้ว แสดง popup จบเกม
      setShowEndPopup(true);
    }
  };

  const restartLevel = () => {
    const newGrid = generateGrid(currentLevel.words);
    setGrid(newGrid);
    setSelectedCells([]);
    setFoundWords([]);
    setMessage("");
    setIsGameComplete(false);
    setAttempts(0);
    setWordLocations(findWordCells(newGrid, currentLevel.words));
  };

  const clearSelection = () => {
    setSelectedCells([]);
    setMessage("");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{currentLevel.name}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeButtonInline}
            >
              <Ionicons name="close" size={34} color="#8f59c5ff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Tap letters in order to form the Thai word
          </Text>

          <View style={styles.statsContainer}>
            <Text style={styles.progress}>
              Found: {foundWords.length}/{currentLevel.words.length} words
            </Text>
            <Text style={styles.score}>🏆 {score} points</Text>
          </View>
        </View>

        {message !== "" && (
          <View
            style={[
              styles.messageBox,
              message.includes("🎉")
                ? styles.completeMessage
                : message.includes("⚠️") || message.includes("💡")
                ? styles.warningMessage
                : message.includes("❌")
                ? styles.errorMessage
                : styles.successMessage,
            ]}
          >
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        <View style={styles.gridWrapper}>
          <View style={styles.gridContainer}>
            {grid.map((row, i) => (
              <View key={i} style={styles.row}>
                {row.map((char, j) => {
                  const isSelected = isCellSelected(i, j);
                  const isFound = isCellInFoundWord(i, j);
                  const selectionOrder = getSelectionOrder(i, j);

                  return (
                    <TouchableOpacity
                      key={j}
                      onPress={() => handleCellPress(i, j)}
                      activeOpacity={0.7}
                      style={[
                        styles.cell,
                        isFound && styles.cellFound,
                        isSelected && styles.cellSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          (isFound || isSelected) && styles.cellTextHighlight,
                        ]}
                      >
                        {char}
                      </Text>
                      {isSelected && selectionOrder && (
                        <View style={styles.orderBadge}>
                          <Text style={styles.orderText}>{selectionOrder}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {selectedCells.length > 0 && (
          <View style={styles.selectedWordContainer}>
            <Text style={styles.selectedWordLabel}>Selected:</Text>
            <Text style={styles.selectedWord}>
              {selectedCells.map((cell) => grid[cell.row][cell.col]).join("")}
            </Text>
            <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>ล้างการเลือก</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.hintContainer}>
          <Text style={styles.hintTitle}>📝 Hints:</Text>
          {currentLevel.words.map((item) => {
            const isFound = foundWords.includes(item.id);
            const splitWordLength = splitThaiWordForGrid(item.word).length;

            return (
              <View
                key={item.id}
                style={[styles.hintItem, isFound && styles.hintItemFound]}
              >
                <Text style={styles.hintIcon}>{isFound ? "✅" : "🔍"}</Text>
                <View style={styles.hintTextContainer}>
                  <Text style={[styles.hintText, isFound && styles.hintTextFound]}>
                    {item.hint}
                  </Text>

                  {!isFound && (
                    <View style={styles.wordBoxesContainer}>
                      {Array.from({ length: splitWordLength }).map((_, index) => (
                        <View key={index} style={styles.wordBox}></View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {isGameComplete && (
          <View style={styles.lottieWrapper}>
            {levelIndex === MOCK_LEVELS.length - 1 ? (
              <Image
                source={require("../add/picture/แมวเสร็จภารกิจ.png")}
                style={styles.finalImage}
                resizeMode="contain"
              />
            ) : (
              <>
                <LottieView
                  source={require('../assets/animations/Star.json')}
                  autoPlay
                  loop={false}
                  style={styles.lottieAnimation}
                />
              </>
            )}
          </View>
        )}
      </View>

      {showEndPopup && (
        <View style={styles.endPopupOverlay}>
          <View style={styles.endPopupBox}>
            <Text style={styles.endPopupTitle}>🎉 Awesome! 🎉</Text>
            <Text style={styles.endPopupText}>You completed all levels!</Text>
            <Text style={styles.endPopupScore}>Total score: {score} pts</Text>

            <View style={styles.popupButtonRow}>
              {/* ปุ่ม เริ่มใหม่ */}
              <TouchableOpacity
                style={[styles.popupButton, { backgroundColor: "#FF6B9D" }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowEndPopup(false);       // ซ่อน popup
                  setLevelIndex(0);             // เริ่มด่านแรก
                  setScore(0);                  // รีเซ็ตคะแนน
                  setIsGameComplete(false);     // รีเซ็ตสถานะจบเกม → ทำให้แมวหาย
                  const newGrid = generateGrid(MOCK_LEVELS[0].words);  // สร้างกริดใหม่
                  setGrid(newGrid);
                  setSelectedCells([]);
                  setFoundWords([]);
                  setMessage("");
                  setAttempts(0);
                  setWordLocations(findWordCells(newGrid, MOCK_LEVELS[0].words));
                }}
              >
                <Text style={styles.popupButtonText}>Restart</Text>
              </TouchableOpacity>

              {/* ปุ่ม ออกเกม */}
              <TouchableOpacity
                style={[styles.popupButton, { backgroundColor: "#667eea" }]}
                activeOpacity={0.8}
                onPress={() => {
                  setShowEndPopup(false);
                  navigation.popToTop(); // กลับไปหน้าหลักของ stack ปัจจุบัน
                    navigation.navigate("MainTab", {
                      screen: "Profile",
                    });
                }}
              >
                <Text style={styles.popupButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FF6B9D",
  },
  content: {
    padding: 20,
    paddingBottom: 70,
    paddingTop: 50,
  },
  closeButtonInline: {
    position: "absolute",
    left: -15, 
    top: 2, 
    transform: [{ translateY: -17 }], 
    padding: 4,
    backgroundColor: "#FFFFFF", 
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#FF6B9D",
  },
  header: {
    alignItems: "center",
    marginBottom: 25,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: "#FF1744",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: "#FFD700",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    backgroundColor: "#667eea",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 5,
    transform: [{ rotate: "-2deg" }],
  },
  subtitle: {
    fontSize: 16,
    color: "#9253d1ff",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    gap: 40,
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#FFD700",
  },
  progress: { 
    fontSize: 18, 
    color: "#667eea", 
    fontWeight: "900",
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2
  },
  score: { 
    fontSize: 18, 
    color: "#FF6B9D", 
    fontWeight: "900",
    textShadowColor: 'rgba(255, 107, 157, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2
  },
  messageBox: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  successMessage: { 
    backgroundColor: "#4ECDC4",
    borderColor: "#26A69A",
  },
  completeMessage: { 
    backgroundColor: "#FFD700",
    borderColor: "#FFA000",
  },
  errorMessage: { 
    backgroundColor: "#FF6B9D",
    borderColor: "#E91E63",
  },
  warningMessage: { 
    backgroundColor: "#FFE66D",
    borderColor: "#FFC107",
  },
  messageText: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 0,
  },
  gridWrapper: { 
  alignItems: "center", 
  marginBottom: 18, 
},
gridContainer: {
  backgroundColor: "#FFFFFF",
  padding: 10,
  borderRadius: 20, 
  borderWidth: 4, 
  borderColor: "#667eea",
  shadowColor: "#667eea",
  shadowOffset: { width: 0, height: 8 }, 
  shadowOpacity: 0.3, 
  shadowRadius: 15, 
  elevation: 12, 
},

  row: { flexDirection: "row" },
  cell: {
    width: 45,
    height: 45,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    margin: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cellSelected: {
    backgroundColor: "#FFE66D",
    borderColor: "#FFD700",
    borderWidth: 4,
    elevation: 10,
    transform: [{ scale: 1.1 }],
    shadowColor: "#FFD700",
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  cellFound: {
    backgroundColor: "#4ECDC4",
    borderColor: "#26A69A",
    borderWidth: 3,
    elevation: 8,
    shadowColor: "#4ECDC4",
    shadowOpacity: 0.5,
  },
  cellText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4b63d1ff",
    textShadowColor: 'rgba(102, 126, 234, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  cellTextHighlight: { 
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  orderBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF6B9D",
    borderRadius: 15,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#FF1744",
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  orderText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  selectedWordContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 5,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 15,
    elevation: 12,
  },
  selectedWordLabel: { 
    fontSize: 14, 
    color: "#764ba2", 
    marginBottom: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  selectedWord: {
    fontSize: 32,
    fontWeight: "900",
    color: "#667eea",
    marginBottom: 15,
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 3,
  },
  clearButton: {
    backgroundColor: "#FF6B9D",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#FF1744",
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  clearButtonText: { 
    color: "#FFF", 
    fontSize: 16, 
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  hintContainer: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 25,
    marginBottom: 25,
    borderWidth: 4,
    borderColor: "#667eea",
    shadowColor: "#667eea",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 15,
    elevation: 10,
  },
  hintTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#667eea",
    marginBottom: 18,
    borderBottomWidth: 3,
    borderBottomColor: "#FFD700",
    paddingBottom: 12,
    textAlign: "center",
  },
  hintItem: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    marginBottom: 12,
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
  },
  hintItemFound: { 
    opacity: 0.5,
    borderLeftColor: "#E0E0E0",
  },
  hintIcon: { 
    fontSize: 18, 
    marginRight: 12, 
    color: "#FF6B9D",
    fontWeight: "900",
  },
  hintTextContainer: { flex: 1 },
  hintText: { 
    fontSize: 16, 
    color: "#333",
    fontWeight: "600",
  },
  hintTextFound: { 
    textDecorationLine: "line-through", 
    color: "#999",
  },
  wordBoxesContainer: {
    flexDirection: "row",
    marginTop: 12,
    gap: 5,
    justifyContent: "center",
  },
  wordBox: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: "#667eea",
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    shadowColor: "#667eea",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  lottieWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(137, 137, 137, 0.4)",
    zIndex: 1000, 
  },
  lottieAnimation: {
    width: 300,
    height: 300,
    transform: [{ translateY: -150 }],
  },
  finalImage: {
    width: 280,
    height: 280,
    marginBottom: 100,
  },
  endPopupOverlay: {
    position: "absolute",
    top: -450,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  endPopupBox: {
    backgroundColor: "#FFF",
    borderRadius: 30,
    padding: 25,
    width: "80%",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 15,
    elevation: 15,
  },
  endPopupLottie: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  endPopupTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FF6B9D",
    textAlign: "center",
    marginBottom: 8,
  },
  endPopupText: {
    fontSize: 18,
    color: "#555",
    marginBottom: 8,
    textAlign: "center",
  },
  endPopupScore: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 20,
  },
  restartButtonPopup: {
    backgroundColor: "#FF6B9D",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#FF1744",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  restartButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
  },
  popupButtonRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 25,
  width: "100%",
  gap: 15,
},
  popupButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: 0 }],
  },

  popupButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default Game1Screen;