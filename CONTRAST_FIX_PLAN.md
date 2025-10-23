# 🔍 Text Visibility Issues - Analysis & Fix Plan

## Problems Found:

### 1. **SignInScreen.js** ❌
- Line 316: `backgroundColor: "#FF8000"` (hardcoded orange)
- Line 332: `backgroundColor: "#ffffff"` (white)
- But uses `theme.colors.background` which could be white
- **Issue**: White text on white background = invisible

### 2. **Game Screens** ❌
- Lines with `color: "#FFFFFF"` on potentially white backgrounds
- Game1Screen, VowelStage2Game, etc.

### 3. **SettingsScreen** ⚠️
- Uses theme.card which could be white or dark
- Need to ensure text color contrasts properly

---

## Solution:

### Create a Contrast-Safe Color System:

```javascript
// utils/contrastColors.js
export const getContrastText = (backgroundColor, isDarkMode) => {
  // If background is light, use dark text
  // If background is dark, use light text
  if (isDarkMode) {
    return '#FFFFFF'; // Light text on dark backgrounds
  } else {
    return '#2C2C2C'; // Dark text on light backgrounds
  }
};
```

### Fix Strategy:
1. Replace hardcoded colors with theme colors
2. Ensure text color always contrasts with background
3. Use helper functions for dynamic color selection

---

## Affected Files to Fix:

- [ ] SignInScreen.js
- [ ] Game1Screen.js
- [ ] ConsonantStage1Game.js
- [ ] VowelStage2Game.js
- [ ] Other Game Screens
- [ ] SettingsScreen.js

