# 🔥 Fire Streak Alert Component Guide

## Overview
A beautiful, animated alert modal that celebrates user milestones when they reach Fire Streak achievements. The component shows an impressive visual celebration with Lottie animations, gradient backgrounds, and encouraging Thai messages.

## Features

### ✨ Visual Features
- **Gradient Backgrounds**: Color-coded gradients based on streak tier
- **Lottie Animations**: Fire animations at top and bottom
- **Spring Animations**: Smooth entrance and exit animations with spring physics
- **Tier Badges**: Visual indicators of streak achievement level (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
- **Text Shadows**: Professional-looking text with shadows for better readability

### 🎯 Streak Tiers & Colors
- **5-9 Days**: COMMON - Orange (#FF6B35)
- **10-19 Days**: UNCOMMON - Cyan (#00D4FF)
- **20-29 Days**: RARE - Teal (#4ECDC4)
- **30-49 Days**: EPIC - Pink (#FF6B9D)
- **50-99 Days**: LEGENDARY - Gold (#FFD700)
- **100+ Days**: LEGENDARY - Red (#FF4444)

### 🌍 Localization
All encouragement messages are in Thai:
- 100+ Days: "ยอด! เทพสตรีก! 🏆"
- 50+ Days: "เก่งมาก! ยังไงต่อไป! 💪"
- 30+ Days: "อยู่ที่นี่! สืบต่อเลย! 🌟"
- 20+ Days: "ทำได้ดี! ไม่หยุด! ✨"
- 10+ Days: "วุ้ย! เก่งแล้ว! 🎯"
- 5+ Days: "ดีเลย! ทำต่อไป! 🔥"
- Default: "ติดต่อกันต่อไป! 🚀"

## Usage

### Basic Implementation

```jsx
import FireStreakAlert from '../components/FireStreakAlert';

// In your component
const [showFireStreakAlert, setShowFireStreakAlert] = useState(false);

return (
  <>
    {/* Your content */}
    
    {/* Fire Streak Alert */}
    <FireStreakAlert
      visible={showFireStreakAlert}
      streak={currentStreak}
      onClose={() => setShowFireStreakAlert(false)}
    />
  </>
);
```

### In LessonCompleteScreen

The FireStreakAlert is automatically triggered when users reach milestone streaks (5, 10, 20, 30, 50, 100 days):

```jsx
// Show Fire Streak Alert for milestone streaks
useEffect(() => {
  if (showRewards && maxStreak > 0) {
    const milestones = [5, 10, 20, 30, 50, 100];
    if (milestones.includes(maxStreak)) {
      // Delay alert to show after rewards animation
      const timer = setTimeout(() => {
        setShowFireStreakAlert(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }
}, [showRewards, maxStreak]);
```

### Manually Showing Alert

```jsx
// When user reaches a milestone
if (userStreak === 10) {
  setShowFireStreakAlert(true);
}

// Trigger celebration
const celebrateStreakMilestone = (streakValue) => {
  // Custom milestone logic
  if (streakValue % 10 === 0) {
    setShowFireStreakAlert(true);
  }
};
```

## Component Props

```tsx
interface FireStreakAlertProps {
  /** Whether the alert is visible */
  visible: boolean;
  
  /** Current streak value to display */
  streak?: number;
  
  /** Callback when alert is closed */
  onClose: () => void;
}
```

## Styling & Customization

### Modify Colors
To change streak tier colors, edit the `getStreakColor()` function:

```jsx
const getStreakColor = () => {
  if (streak >= 100) return ['#FF4444', '#FF6B6B', '#FF4444'];
  // ... more conditions
};
```

### Modify Messages
To customize encouragement messages, edit the `getStreakMessage()` function:

```jsx
const getStreakMessage = () => {
  if (streak >= 100) return '🔥 LEGENDARY STREAK! 🔥';
  // ... more conditions
};
```

### Modify Animation Duration
Adjust the animation timing in the `useEffect` that handles animations:

```jsx
Animated.spring(scaleAnim, {
  toValue: 1,
  friction: 5,  // Lower = bouncier
  tension: 40,  // Higher = faster
  useNativeDriver: true,
}),
```

## Animation Details

### Entrance Animation
- Scale: 0 → 1 (spring physics)
- Opacity: 0 → 1 (timing)
- Duration: 300ms (opacity), spring (scale)

### Exit Animation
- Scale: 1 → 0 (spring physics)
- Opacity: 1 → 0 (timing)
- Duration: 200ms (opacity), spring (scale)

## Files Modified

1. **Created**: `/src/components/FireStreakAlert.js`
   - Main component file with full implementation
   
2. **Modified**: `/src/screens/LessonCompleteScreen.js`
   - Added import for FireStreakAlert
   - Added state management for showing/hiding alert
   - Added useEffect to trigger alert on milestone streaks
   - Added alert component to render tree

## Performance Considerations

- Uses `useNativeDriver: true` for animations (GPU accelerated)
- Lottie animations loop automatically
- Modal is only rendered when `visible={true}`
- Proper cleanup of timers in useEffect dependencies

## Testing the Component

### Test in LessonCompleteScreen
1. Complete a lesson with a streak that reaches 5, 10, 20, 30, 50, or 100
2. Watch the celebration alert appear after rewards animation
3. Verify the correct tier, color, and message display
4. Test closing the alert by tapping outside or the close button

### Manual Test
```jsx
// Temporarily in LessonCompleteScreen
useEffect(() => {
  // Force show alert for testing
  setTimeout(() => setShowFireStreakAlert(true), 1000);
}, []);
```

## Browser/Platform Support

- ✅ React Native (iOS & Android)
- ✅ Expo
- ✅ All devices with Expo Vector Icons support
- ✅ All devices with Lottie support

## Known Limitations

- Alert cannot be shown multiple times rapidly (debounced by milestone check)
- Custom Lottie animations must exist in `/assets/animations/`
- Theme colors are hardcoded (not theme-aware yet)

## Future Enhancements

- [ ] Add sound effect when alert appears
- [ ] Theme-aware color customization
- [ ] Custom animations per tier
- [ ] Particle effects on milestone reach
- [ ] Haptic feedback on mobile
- [ ] Share streak achievement to social media
- [ ] Unlock special badges for high streaks

## Troubleshooting

### Alert not showing?
- Check if `visible` prop is true
- Verify streak value is a milestone (5, 10, 20, 30, 50, 100)
- Check browser console for errors
- Ensure `maxStreak` is being passed correctly

### Animation not smooth?
- Ensure Lottie JSON files exist in assets/animations/
- Check if device animation settings are enabled
- Try reducing other animations on the screen

### Text rendering issues?
- Verify all Thai characters are supported
- Check font sizes in styles
- Ensure text shadows don't overlap with borders

## Credits

- Animation: Lottie React Native
- Styling: React Native StyleSheet + Linear Gradient
- Icons: Expo Vector Icons
