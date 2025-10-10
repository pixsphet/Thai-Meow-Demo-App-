# Stats Consistency Test Checklist

This document provides a manual testing checklist to verify that Level, XP, Hearts, and Diamonds are consistent across all three screens (HomeScreen, ProgressScreen, and ProfileScreen) after stat updates.

## Prerequisites

1. Ensure the app is running with the unified stats system
2. Have a test user account with some existing progress
3. Ensure backend API is running (if testing with real backend)

## Test Scenarios

### Scenario 1: Initial Load Consistency
**Objective**: Verify all screens show the same initial values

**Steps**:
1. Launch the app and log in
2. Navigate to HomeScreen
3. Note down: Level, XP, Hearts, Diamonds
4. Navigate to ProgressScreen
5. Verify: Level, XP, Hearts, Diamonds match HomeScreen
6. Navigate to ProfileScreen
7. Verify: Level, XP, Hearts, Diamonds match previous screens

**Expected Result**: All three screens show identical values

### Scenario 2: Game Completion Update
**Objective**: Verify stats update consistently after completing a game

**Steps**:
1. Start a game (any level)
2. Complete the game with some correct/incorrect answers
3. Note the XP gained, hearts lost, diamonds earned
4. Navigate to HomeScreen
5. Verify: Updated values are displayed
6. Navigate to ProgressScreen
7. Verify: Values match HomeScreen
8. Navigate to ProfileScreen
9. Verify: Values match previous screens

**Expected Result**: All screens reflect the game completion changes

### Scenario 3: Level Unlock Update
**Objective**: Verify level progression is consistent

**Steps**:
1. Complete enough games to reach 70% accuracy threshold
2. Verify level unlock occurs
3. Check HomeScreen for new level
4. Check ProgressScreen for new level
5. Check ProfileScreen for new level

**Expected Result**: All screens show the same new level

### Scenario 4: Hearts Depletion
**Objective**: Verify hearts decrease consistently

**Steps**:
1. Start a game
2. Answer incorrectly multiple times to lose hearts
3. Check HomeScreen for updated hearts count
4. Check ProgressScreen for updated hearts count
5. Check ProfileScreen for updated hearts count

**Expected Result**: All screens show the same reduced hearts count

### Scenario 5: Diamonds Accumulation
**Objective**: Verify diamonds increase consistently

**Steps**:
1. Complete multiple games successfully
2. Earn diamonds from correct answers
3. Check HomeScreen for total diamonds
4. Check ProgressScreen for total diamonds
5. Check ProfileScreen for total diamonds

**Expected Result**: All screens show the same total diamonds

### Scenario 6: Offline/Online Sync
**Objective**: Verify stats sync when going offline and back online

**Steps**:
1. Complete a game while online
2. Note the updated stats
3. Turn off network connection
4. Complete another game (offline)
5. Check that stats are updated locally
6. Turn network back on
7. Wait for sync to complete
8. Verify all screens show the same synced values

**Expected Result**: All screens show the same values after sync

### Scenario 7: App Background/Foreground
**Objective**: Verify stats refresh when app comes to foreground

**Steps**:
1. Complete a game
2. Put app in background
3. Complete another game in background (if possible)
4. Bring app to foreground
5. Check that all screens refresh with latest values

**Expected Result**: All screens show the latest values after foreground

## Test Data Collection

For each test scenario, record:

| Screen | Level | XP | Hearts | Diamonds | Timestamp | Notes |
|--------|-------|----|---------|-----------|-----------|--------|
| HomeScreen | | | | | | |
| ProgressScreen | | | | | | |
| ProfileScreen | | | | | | |

## Expected Behavior

1. **Consistency**: All three screens should always show identical values for Level, XP, Hearts, and Diamonds
2. **Real-time Updates**: Changes should be reflected immediately across all screens
3. **Loading States**: Screens should show loading indicators while fetching data
4. **Error Handling**: Screens should gracefully handle network errors and show fallback values
5. **Offline Support**: Changes should be saved locally and synced when online

## Common Issues to Watch For

1. **Stale Data**: Screens showing outdated values
2. **Inconsistent Values**: Different screens showing different numbers
3. **Loading Loops**: Screens stuck in loading state
4. **Sync Failures**: Changes not persisting after app restart
5. **Race Conditions**: Updates being overwritten by older data

## Automated Test Commands

If you want to run automated tests, you can use these commands:

```bash
# Run the app in test mode
npm run test:stats-consistency

# Run specific test scenarios
npm run test:stats-consistency -- --grep "Scenario 1"
npm run test:stats-consistency -- --grep "Scenario 2"
```

## Reporting Issues

If you find inconsistencies, please report:

1. **Test Scenario**: Which scenario failed
2. **Expected vs Actual**: What you expected vs what you saw
3. **Steps to Reproduce**: Exact steps that led to the issue
4. **Screenshots**: If possible, include screenshots of different screens
5. **Console Logs**: Any error messages in the console
6. **Device Info**: Device type, OS version, app version

## Success Criteria

✅ **PASS**: All screens show identical values in all test scenarios
❌ **FAIL**: Any screen shows different values or fails to update

The unified stats system should ensure 100% consistency across all screens at all times.
