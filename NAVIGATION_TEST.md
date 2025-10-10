# Navigation System Test Guide

This document provides a comprehensive test guide for the updated navigation system where the BottomTabNavigator only shows on HomeScreen.

## Navigation Structure

### Main Stack Navigator
- **HomeMain**: HomeScreen with custom tab bar overlay
- **Progress**: ProgressScreen (no tab bar)
- **Profile**: ProfileScreen (no tab bar)
- **AddFriend**: AddFriendScreen (no tab bar)
- **EditProfile**: EditProfileScreen (no tab bar)
- **Settings**: SettingsScreen (no tab bar)
- **ConsonantLearn**: ConsonantLearnScreen (no tab bar)
- **LessonComplete**: LessonCompleteScreen (no tab bar)
- **LevelStage1**: LevelStage1 (no tab bar)
- **LevelStage2**: LevelStage2 (no tab bar)
- **LevelStage3**: LevelStage3 (no tab bar)
- **NewLessonGame**: NewLessonGame (no tab bar)
- **BeginnerVowelsStage**: ThaiVowelsGame (no tab bar)
- **GameMode**: GameModeSelector (no tab bar)
- **ThaiTones**: ThaiTonesGame (no tab bar)

## Test Scenarios

### 1. HomeScreen Tab Bar Visibility
**Objective**: Verify tab bar only shows on HomeScreen

**Steps**:
1. Launch the app and navigate to HomeScreen
2. Verify: Tab bar is visible at the bottom with 4 tabs (หน้าแรก, ความคืบหน้า, โปรไฟล์, เพิ่มเพื่อน)
3. Verify: Home tab is highlighted in orange (#FF8000)
4. Verify: Other tabs are gray (#666)

**Expected Result**: Tab bar is visible and functional on HomeScreen only

### 2. Navigation from HomeScreen
**Objective**: Verify navigation from HomeScreen hides tab bar

**Steps**:
1. From HomeScreen, tap "ความคืบหน้า" tab
2. Verify: Navigate to ProgressScreen
3. Verify: Tab bar is hidden
4. Verify: Back button is visible in header
5. Tap back button
6. Verify: Return to HomeScreen
7. Verify: Tab bar is visible again

**Expected Result**: Tab bar hides when navigating away from HomeScreen

### 3. Navigation from ProgressScreen
**Objective**: Verify ProgressScreen navigation works correctly

**Steps**:
1. Navigate to ProgressScreen from HomeScreen
2. Tap "พยัญชนะ" quick action button
3. Verify: Navigate to ConsonantLearnScreen
4. Verify: Tab bar remains hidden
5. Use back navigation to return to ProgressScreen
6. Use back navigation to return to HomeScreen
7. Verify: Tab bar is visible again

**Expected Result**: All navigation flows work correctly without tab bar interference

### 4. Navigation from ProfileScreen
**Objective**: Verify ProfileScreen navigation works correctly

**Steps**:
1. Navigate to ProfileScreen from HomeScreen
2. Tap "แก้ไข" button
3. Verify: Navigate to EditProfileScreen
4. Verify: Tab bar remains hidden
5. Use back navigation to return to ProfileScreen
6. Use back navigation to return to HomeScreen
7. Verify: Tab bar is visible again

**Expected Result**: ProfileScreen navigation works correctly

### 5. Navigation from AddFriendScreen
**Objective**: Verify AddFriendScreen navigation works correctly

**Steps**:
1. Navigate to AddFriendScreen from HomeScreen
2. Verify: Tab bar is hidden
3. Verify: Back button is visible in header
4. Use back navigation to return to HomeScreen
5. Verify: Tab bar is visible again

**Expected Result**: AddFriendScreen navigation works correctly

### 6. Game Screen Navigation
**Objective**: Verify game screens don't show tab bar

**Steps**:
1. From HomeScreen, navigate to any level (Beginner, Intermediate, Advanced)
2. Start a game (NewLessonGame, ThaiVowelsGame, etc.)
3. Verify: Tab bar is hidden during gameplay
4. Complete or exit the game
5. Verify: Return to appropriate screen without tab bar
6. Navigate back to HomeScreen
7. Verify: Tab bar is visible again

**Expected Result**: Game screens never show tab bar

### 7. Tab Bar Functionality
**Objective**: Verify tab bar buttons work correctly

**Steps**:
1. On HomeScreen, tap each tab button:
   - หน้าแรก (Home) - should stay on HomeScreen
   - ความคืบหน้า (Progress) - should navigate to ProgressScreen
   - โปรไฟล์ (Profile) - should navigate to ProfileScreen
   - เพิ่มเพื่อน (AddFriend) - should navigate to AddFriendScreen
2. Verify: Each navigation works correctly
3. Verify: Tab bar disappears when navigating away from HomeScreen

**Expected Result**: All tab bar buttons work correctly

### 8. Back Navigation Consistency
**Objective**: Verify back navigation works consistently

**Steps**:
1. Navigate to any screen from HomeScreen
2. Use back button or gesture to navigate back
3. Verify: Return to previous screen
4. Continue navigating back until reaching HomeScreen
5. Verify: Tab bar appears when returning to HomeScreen

**Expected Result**: Back navigation works consistently across all screens

## Visual Verification Checklist

### HomeScreen
- [ ] Tab bar visible at bottom
- [ ] Tab bar has correct styling (rounded, shadow, etc.)
- [ ] Home tab highlighted in orange
- [ ] Other tabs in gray
- [ ] Tab bar doesn't overlap content (padding bottom: 100)

### Other Screens
- [ ] No tab bar visible
- [ ] Back button present in header
- [ ] Back button styled consistently
- [ ] Content not cut off by missing tab bar

### Navigation Flow
- [ ] Smooth transitions between screens
- [ ] No flickering of tab bar
- [ ] Consistent header styling
- [ ] Proper back navigation behavior

## Common Issues to Watch For

1. **Tab Bar Flickering**: Tab bar appears/disappears during navigation
2. **Missing Back Buttons**: Some screens don't have back navigation
3. **Content Overlap**: Content hidden behind tab bar on HomeScreen
4. **Inconsistent Styling**: Different header styles across screens
5. **Navigation Errors**: Screens not found or navigation fails
6. **Tab Bar on Wrong Screens**: Tab bar appears on non-HomeScreen screens

## Performance Considerations

1. **Memory Usage**: Custom tab bar doesn't cause memory leaks
2. **Rendering Performance**: Smooth animations and transitions
3. **State Management**: Navigation state is properly managed
4. **Screen Lifecycle**: Screens mount/unmount correctly

## Success Criteria

✅ **PASS**: Tab bar only shows on HomeScreen, all navigation works correctly
❌ **FAIL**: Tab bar appears on other screens or navigation fails

The navigation system should provide a clean, consistent experience where users can easily navigate between main sections using the tab bar on HomeScreen, and use standard navigation patterns for all other screens.
