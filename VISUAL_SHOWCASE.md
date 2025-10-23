# 🔥 Fire Streak Alert - Visual Showcase

## Component Preview

### Alert Modal Design
```
┌─────────────────────────────────────────┐
│   ╔═══════════════════════════════════╗ │
│   ║  Semi-transparent Dark Overlay   ║ │
│   ║                                   ║ │
│   ║  ╭─────────────────────────────╮ ║ │
│   ║  │  Gradient Background Card   │ ║ │
│   ║  │  (Color-coded by tier)      │ ║ │
│   ║  │                             │ ║ │
│   ║  │      🔥 FIRE ANIMATION 🔥   │ ║ │
│   ║  │      (100x100px, looping)   │ ║ │
│   ║  │                             │ ║ │
│   ║  │         ░░░ CONTENT ░░░     │ ║ │
│   ║  │                             │ ║ │
│   ║  │     ╔═══════════════════╗   │ ║ │
│   ║  │     ║        42         ║   │ ║ │
│   ║  │     ║       DAYS        ║   │ ║ │
│   ║  │     ╚═══════════════════╝   │ ║ │
│   ║  │                             │ ║ │
│   ║  │   🎯 GREAT STREAK! 🎯        │ ║ │
│   ║  │                             │ ║ │
│   ║  │    ┌─────────────────────┐  │ ║ │
│   ║  │    │     RARE TIER       │  │ ║ │
│   ║  │    └─────────────────────┘  │ ║ │
│   ║  │                             │ ║ │
│   ║  │  ทำได้ดี! ไม่หยุด! ✨       │ ║ │
│   ║  │                             │ ║ │
│   ║  │      🔥 FIRE ANIMATION 🔥   │ ║ │
│   ║  │      (80x80px, looping)     │ ║ │
│   ║  │                             │ ║ │
│   ║  │        ╭──────────╮         │ ║ │
│   ║  │        │  CLOSE   │         │ ║ │
│   ║  │        ╰──────────╯         │ ║ │
│   ║  ╰─────────────────────────────╯ ║ │
│   ║                                   ║ │
│   ╚═══════════════════════════════════╝ │
└─────────────────────────────────────────┘
```

---

## Color Themes by Streak Level

### COMMON (5-9 Days)
```
Card Background:
┌─────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ Orange (#FF6B35)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ Bright Orange (#FF8C42)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ Orange (#FF6B35)
└─────────────────┘

Tier Badge: "COMMON" (white text)
Number Color: White
Message: 🔥 FIRE STREAK! 🔥
```

### UNCOMMON (10-19 Days)
```
Card Background:
┌─────────────────┐
│ ░░░░░░░░░░░░░░░ │ Cyan (#00D4FF)
│ ░░░░░░░░░░░░░░░ │ Blue (#0099FF)
│ ░░░░░░░░░░░░░░░ │ Cyan (#00D4FF)
└─────────────────┘

Tier Badge: "UNCOMMON" (white text)
Number Color: White
Message: ✨ GOOD STREAK! ✨
```

### RARE (20-29 Days)
```
Card Background:
┌─────────────────┐
│ ░▓░░▓░░░▓░░░▓░░ │ Teal (#4ECDC4)
│ ░▓░░▓░░░▓░░░▓░░ │ Dark Teal (#44B8A6)
│ ░▓░░▓░░░▓░░░▓░░ │ Teal (#4ECDC4)
└─────────────────┘

Tier Badge: "RARE" (white text)
Number Color: White
Message: 💪 GREAT STREAK! 💪
```

### EPIC (30-49 Days)
```
Card Background:
┌─────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │ Pink (#FF6B9D)
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │ Light Pink (#FF8FAB)
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │ Pink (#FF6B9D)
└─────────────────┘

Tier Badge: "EPIC" (white text)
Number Color: White
Message: 🎯 AWESOME STREAK! 🎯
```

### LEGENDARY (50-99 Days)
```
Card Background:
┌─────────────────┐
│ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │ Gold (#FFD700)
│ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │ Orange Gold (#FFA500)
│ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ │ Gold (#FFD700)
└─────────────────┘

Tier Badge: "LEGENDARY" (white text)
Number Color: White
Message: ⭐ AMAZING STREAK! ⭐
```

### LEGENDARY (100+ Days)
```
Card Background:
┌─────────────────┐
│ ███████████████ │ Red (#FF4444)
│ ███████████████ │ Light Red (#FF6B6B)
│ ███████████████ │ Red (#FF4444)
└─────────────────┘

Tier Badge: "LEGENDARY" (white text)
Number Color: White
Message: 🔥 LEGENDARY STREAK! 🔥
```

---

## Animation Flow

### Entrance Animation (Spring Physics)
```
Timeline:
├─ 0ms     → Scale: 0%, Opacity: 0%
├─ 100ms   → Scale: 15%, Opacity: 25%
├─ 200ms   → Scale: 40%, Opacity: 60%
├─ 300ms   → Scale: 70%, Opacity: 90%
├─ 400ms   → Scale: 95%, Opacity: 100%
└─ 500ms   → Scale: 100%, Opacity: 100% ✓

Visual Effect:
First 300ms: Fade in smoothly
Following: Bouncy spring to final position
```

### Exit Animation
```
Timeline:
├─ 0ms     → Scale: 100%, Opacity: 100%
├─ 50ms    → Scale: 90%, Opacity: 95%
├─ 100ms   → Scale: 50%, Opacity: 70%
├─ 150ms   → Scale: 20%, Opacity: 20%
└─ 200ms   → Scale: 0%, Opacity: 0% ✓

Visual Effect:
Smooth fade out with spring collapse
```

---

## Typography

### Streak Number
```
Font: Bold
Size: 72pt
Color: #FFFFFF
Style: Regular (not italic)
Shadow: 2px 2px 3px rgba(0,0,0,0.3)
Spacing: Letter-normal

Example: "42"
```

### "DAYS" Label
```
Font: Bold
Size: 16pt
Color: #FFFFFF
Letter-spacing: 3px
Style: Regular

Example: "DAYS"
```

### Main Message
```
Font: Bold
Size: 24pt
Color: #FFFFFF
Text-align: Center
Shadow: 1px 1px 2px rgba(0,0,0,0.3)

Examples:
🔥 FIRE STREAK! 🔥
✨ NICE STREAK! ✨
💪 GREAT STREAK! 💪
```

### Tier Badge
```
Font: Bold
Size: 14pt
Color: #FFFFFF
Letter-spacing: 2px
Background: rgba(255,255,255,0.25)
Border: 2px rgba(255,255,255,0.5)
Padding: 8px 20px
Border-radius: 20px

Examples:
COMMON
UNCOMMON
RARE
EPIC
LEGENDARY
```

### Encouragement Text (Thai)
```
Font: Regular
Size: 16pt
Color: #FFFFFF
Text-align: Center
Weight: 600
Shadow: 1px 1px 2px rgba(0,0,0,0.2)

Examples:
ดีเลย! ทำต่อไป! 🔥
วุ้ย! เก่งแล้ว! 🎯
ทำได้ดี! ไม่หยุด! ✨
อยู่ที่นี่! สืบต่อเลย! 🌟
เก่งมาก! ยังไงต่อไป! 💪
ยอด! เทพสตรีก! 🏆
```

---

## Interactive Elements

### Close Button
```
Style:
├─ Shape: Circle
├─ Diameter: 50px
├─ Background: rgba(0,0,0,0.3)
├─ Border: 2px #FFFFFF
├─ Icon: Close (X) - 28pt
├─ Icon Color: #FFFFFF
└─ Active Opacity: 0.7

Position: Bottom center (20px from card)

Tap Effect:
└─ Closes modal with exit animation
```

### Overlay Tap
```
Area: Entire semi-transparent overlay
Effect: Closes modal (same as close button)
Opacity Change: Smooth fade
```

---

## Responsive Layout

### Mobile (320-480px)
```
Card Width: 85% of screen
Max Width: 400px
Padding: 40px (internal)
```

### Tablet (600px+)
```
Card Width: 85% of screen
Max Width: 400px (maintained)
```

---

## Shadow & Depth

### Card Shadow
```
Color: #000000
Offset: 0, 20px (vertical)
Opacity: 0.35
Blur: 30px
Elevation: 15 (Android)
```

### Text Shadow
```
Streak Number:
└─ Offset: 2px, 2px
   Opacity: 0.3
   Blur: 3px

Message:
└─ Offset: 1px, 1px
   Opacity: 0.3
   Blur: 2px

Encouragement:
└─ Offset: 1px, 1px
   Opacity: 0.2
   Blur: 2px
```

---

## Lottie Animations

### Top Fire Animation
```
Size: 100x100px
Source: assets/animations/Streak-Fire1.json
Loop: Yes (continuous)
AutoPlay: Yes
Position: Top center of card
Margin: 20px bottom
```

### Bottom Fire Animation
```
Size: 80x80px
Source: assets/animations/Streak-Fire1.json
Loop: Yes (continuous)
AutoPlay: Yes
Position: Bottom center of card
Margin: 20px top
```

---

## Layout Spacing

```
┌─────────────────────────────┐
│  Modal Overlay (full screen)│
│                             │
│    ╔═══════════════════╗   │
│    ║ Card Border      ║   │
│    ║ ╭─────────────╮  ║   │
│    ║ │ Top Fire    │  ║   │ 20px margin
│    ║ ╰─────────────╯  ║   │
│    ║                  ║   │
│    ║ ┌──────────────┐ ║   │
│    ║ │ Streak: 42   │ ║   │ 12px margin
│    ║ │ DAYS         │ ║   │
│    ║ └──────────────┘ ║   │
│    ║                  ║   │
│    ║ 🎯 AWESOME... 🎯 ║   │ 16px margin
│    ║                  ║   │
│    ║ ┌──────────────┐ ║   │
│    ║ │ RARE TIER    │ ║   │ 12px margin
│    ║ └──────────────┘ ║   │
│    ║                  ║   │
│    ║ Thai message   ║   │ 20px margin
│    ║ ╭─────────────╮  ║   │
│    ║ │ Bottom Fire │  ║   │ 20px margin
│    ║ ╰─────────────╯  ║   │
│    ║ ╭─────────────╮  ║   │ 20px margin
│    ║ │ Close Btn   │  ║   │
│    ║ ╰─────────────╯  ║   │
│    ╚═══════════════════╝   │
│                             │
└─────────────────────────────┘
```

---

## User Experience Flow

```
Game Completion
    │
    ├─→ User reaches milestone streak (5, 10, 20, 30, 50, 100)
    │
    ├─→ Rewards animation plays (650ms)
    │
    ├─→ Delay (2000ms / 1500ms depending on screen)
    │
    ├─→ FireStreakAlert appears with spring animation
    │
    ├─→ Alert displays for user interaction
    │
    └─→ User can:
        ├─ Tap close button
        ├─ Tap outside overlay
        └─ Wait (auto-close possible)
```

---

## Accessibility Features

- ✅ High contrast colors (white on colorful backgrounds)
- ✅ Large text sizes (readable from distance)
- ✅ Clear visual hierarchy
- ✅ Responsive to user input (tap/close)
- ✅ Modal overlay prevents accidental clicks behind
- ✅ Clear tier indication (badge + color)
- ✅ Emoji and text both convey meaning
- ✅ Thai language localization

---

**Design System**: Complete and Production-Ready ✅

