/**
 * Fallback images for Thai letters
 * Provides placeholder images when actual letter images are not available
 */

// Fallback images
export const fallbackImages = {
  consonant: require('../images/logo.png'), // Use logo as fallback
  vowel: require('../images/logo.png'),
  tone: require('../images/logo.png'),
  letter: require('../images/logo.png')
};

// Get fallback image by type
export const getFallbackImage = (type = 'letter') => {
  return fallbackImages[type] || fallbackImages.letter;
};

// Check if we should use fallback
export const shouldUseFallback = (char, type) => {
  // For now, always use fallback since we don't have actual letter images
  return true;
};

export default fallbackImages;