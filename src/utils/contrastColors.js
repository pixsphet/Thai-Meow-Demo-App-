/**
 * Contrast Color Utility
 * Ensures text is always visible by automatically selecting appropriate text color
 * based on background color and theme mode
 */

/**
 * Get contrasting text color for a given background
 * @param {string} backgroundColor - Background color hex code
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {string} - Appropriate text color (light or dark)
 */
export const getContrastText = (backgroundColor, isDarkMode) => {
  // If background is very light (like white or light gray), use dark text
  if (!backgroundColor || backgroundColor === '#FFFFFF' || backgroundColor === '#fff') {
    return '#2C2C2C'; // Dark text
  }

  // If background is very dark, use light text
  if (backgroundColor === '#1A1A1A' || backgroundColor === '#000000') {
    return '#FFFFFF'; // Light text
  }

  // For other colors, fall back to theme-based selection
  return isDarkMode ? '#FFFFFF' : '#2C2C2C';
};

/**
 * Get safe color based on theme mode
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} - Object with safe text and background colors
 */
export const getSafeColors = (isDarkMode) => {
  return {
    safeText: isDarkMode ? '#FFFFFF' : '#2C2C2C',
    lightBackground: '#FFFFFF',
    darkBackground: '#1A1A1A',
    safeBackground: isDarkMode ? '#1A1A1A' : '#FFFFFF',
  };
};

/**
 * Check if text is readable on background
 * @param {string} textColor - Text color hex code
 * @param {string} backgroundColor - Background color hex code
 * @returns {boolean} - Whether text is readable
 */
export const isReadable = (textColor, backgroundColor) => {
  // Simple check - avoid white on white and black on black
  const isWhiteText = textColor === '#FFFFFF' || textColor === '#fff';
  const isWhiteBg = backgroundColor === '#FFFFFF' || backgroundColor === '#fff';
  const isBlackText = textColor === '#2C2C2C' || textColor === '#000';
  const isBlackBg = backgroundColor === '#1A1A1A' || backgroundColor === '#000';

  // If white text on white background - not readable
  if (isWhiteText && isWhiteBg) return false;

  // If black text on black background - not readable
  if (isBlackText && isBlackBg) return false;

  return true;
};

export default {
  getContrastText,
  getSafeColors,
  isReadable,
};
