import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const lightTheme = {
    colors: {
      primary: '#FF8C00', // สีส้มหลัก
      secondary: '#FFA500', // สีส้มอ่อน
      accent: '#FF6B35', // สีส้มแดง
      background: '#FFFFFF', // ขาว
      surface: '#FFF8F0', // ขาวอมส้มอ่อน
      text: '#2C2C2C', // ดำเข้ม
      textSecondary: '#666666', // เทาเข้ม
      border: '#FFE0B3', // สีส้มอ่อนมาก
      success: '#FF8C00', // ใช้สีส้มแทนเขียว
      warning: '#FF6B35', // สีส้มแดง
      error: '#FF4444', // แดงเข้ม
      heart: '#FF6B35', // สีส้มแดง
      diamond: '#FF8C00', // สีส้ม
      xp: '#FFA500', // สีส้มอ่อน
      streak: '#FF6B35', // สีส้มแดง
      // Thai Meow brand colors - สีส้ม
      brand: '#FF8C00',
      brandLight: '#FFB366',
      brandDark: '#E67300',
      // สีเพิ่มเติม
      orange: '#FF8C00',
      orangeLight: '#FFB366',
      orangeDark: '#E67300',
      orangeAccent: '#FF6B35',
      white: '#FFFFFF',
      black: '#2C2C2C',
      gray: '#666666',
      lightGray: '#F5F5F5',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
    },
    typography: {
      h1: { fontSize: 32, fontWeight: 'bold' },
      h2: { fontSize: 24, fontWeight: 'bold' },
      h3: { fontSize: 20, fontWeight: '600' },
      body: { fontSize: 16 },
      caption: { fontSize: 14 },
      small: { fontSize: 12 },
    },
  };

  const darkTheme = {
    ...lightTheme,
    colors: {
      ...lightTheme.colors,
      background: '#1A1A1A', // ดำเข้ม
      surface: '#2C2C2C', // ดำอ่อน
      text: '#FFFFFF', // ขาว
      textSecondary: '#CCCCCC', // เทาอ่อน
      border: '#404040', // เทาเข้ม
      // Thai Meow brand colors for dark mode - ใช้สีส้มเหมือนเดิม
      brand: '#FF8C00',
      brandLight: '#FFB366',
      brandDark: '#E67300',
      // สีเพิ่มเติมสำหรับ dark mode
      orange: '#FF8C00',
      orangeLight: '#FFB366',
      orangeDark: '#E67300',
      orangeAccent: '#FF6B35',
      white: '#FFFFFF',
      black: '#1A1A1A',
      gray: '#CCCCCC',
      lightGray: '#404040',
    },
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    theme,
    isDarkMode,
    darkTheme: isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
