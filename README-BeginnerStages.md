## Beginner Stages Architecture (Level 1)

This document summarizes the code structure and gameplay flow for Beginner level stages launched from `LevelStage1.js`:

- `ConsonantStage1Game.js`
- `VowelStage2Game.js`
- `GreetingStage3Game.js`
- `Lesson4ObjectsGame.js`
- `Lesson5BodyGame.js`

It details shared architecture, per-screen differences, unlock rules, progress storage, and the result handoff to `LessonCompleteScreen.js`.

### Stage Select: LevelStage1.js

- **Purpose**: Displays Beginner stages (lessons 1–5), shows progress, and navigates to the correct game screen.
- **Key metadata**: `CUSTOM_STAGE_META` maps lesson_id → title, key, category for lessons 1–5.
- **Progress sources**:
  - Local snapshot via `restoreProgress(lessonId)` (question snapshot and answer map)
  - Aggregated sessions via `gameProgressService.getLessonProgress(lessonId)`
- **Unlock rule**: First stage always available. To unlock next stage, the previous stage must be completed with ≥ 70% accuracy (first pass rule; approximated by available data).
- **Services initialized per user**: `gameProgressService`, `levelUnlockService`, `userStatsService`.
- **Navigation mapping**:
  - 1 → `ConsonantStage1Game`
  - 2 → `VowelStage2Game`
  - 3 → `GreetingStage3Game`
  - 4 → `Lesson4ObjectsGame`
  - 5 → `Lesson5BodyGame`
- **UI**: Progress ring per stage, chips for progress/accuracy, lock overlay if stage is locked.

### Shared Game Screen Architecture

All five screens follow the same high-level structure:

- **Imports**: React, RN components, `LottieView`, `LinearGradient`.
- **Services**: `vaja9TtsService`, `progressService` (`saveProgress`/`restoreProgress`/`clearProgress`), `gameProgressService`, `levelUnlockService`, `userStatsService`.
- **Contexts**: `useProgress` (apply deltas), `useUnifiedStats`, `useUserData`.
- **Core state**:
  - Content: `questions`, `currentIndex`, `answers` (via `answersRef` as well)
  - Player: `hearts`, `score`, `xpEarned`, `diamondsEarned`, `streak`, `maxStreak`
  - Flow: `gameStarted`, `gameFinished`, `loading`, `resumeData`
  - Type-specific: drag-match selection (`dmSelected`, `dmPairs`); some screens add memory/challenge state
- **Lifecycle**:
  - Load lesson data (local fallback JSON)
  - Generate questions for this lesson (per-screen question generators)
  - Attempt to restore snapshot (`restoreProgress`) and resume
  - Initialize services once per user
  - Auto-save snapshot on significant state changes
- **Answer handling**:
  - `checkAnswer(question, userAnswer)` per type
  - Persist current answer to `answersRef`
  - On correct: increment `score`, add XP and diamonds (per-question reward amounts vary by screen)
  - On wrong: decrement `hearts`; if 0, end early via `finishLesson`
- **Finish + save** (`finishLesson`):
  - Compute metrics: `totalQuestions`, `correctAnswers`, `wrongAnswers`, `accuracyRatio/%`, `timeSpent`
  - Build `lastResults` and `progressDelta`; call `applyDelta(progressDelta)`
  - Persist session (`gameProgressService.saveGameSession`)
  - Unlock next level when accuracy ≥ 70% (`levelUnlockService.checkAndUnlockNextLevel`)
  - Clear snapshot (`clearProgress`)
  - Navigate to `LessonComplete` with a comprehensive payload

### Result Handoff (LessonCompleteScreen params)

All screens navigate via `navigation.replace('LessonComplete', { ... })` with (superset) fields:

- Identity and meta: `lessonId`, `stageTitle`, `stageSelectRoute`, `replayRoute`, `replayParams`, `nextStageMeta`
- Scoring: `score`, `totalQuestions`, `timeSpent`, `accuracy`, `accuracyPercent`, `accuracyRatio`
- Rewards: `xpGained`, `diamondsGained`, `heartsRemaining`
- Streak: `streak`, `maxStreak`
- Unlocking: `isUnlocked` (≥ 70%), `nextStageUnlocked`
- Analytics: `questionTypeCounts`

### Question Types by Screen

- Shared types across most screens: `LISTEN_CHOOSE`, `PICTURE_MATCH`, `DRAG_MATCH`, `FILL_BLANK`, `ARRANGE_SENTENCE`
- Extra types (Consonants): `A_OR_B`, `MEMORY_MATCH`, `SYLLABLE_BUILDER`, `ORDER_TILES`, `CHALLENGE`
- Greeting-specific: `TRANSLATE_MATCH`, `FILL_BLANK_DIALOG`

### Per-Screen Details

#### 1) ConsonantStage1Game.js (Lesson 1)
- Data: `consonants_fallback.json`; image mapping via `letterImages`
- Question types: rich mix including `A_OR_B`, `MEMORY_MATCH`, `SYLLABLE_BUILDER`, `ORDER_TILES`, `CHALLENGE`
- Rewards (per question defaults): XP 15, Diamonds 1, Heart penalty 1
- Special UI: Progress header with type pill; sound buttons for DRAG_MATCH; memory grid; challenge sub-questions
- Finish payload includes `nextStageMeta` defaulting to Vowels (Lesson 2)

#### 2) VowelStage2Game.js (Lesson 2)
- Data: `vowels_fallback.json`; `vowelImages` mapping
- Question types: `LISTEN_CHOOSE`, `PICTURE_MATCH`, `DRAG_MATCH`, `FILL_BLANK`, `ARRANGE_SENTENCE`
- Rewards: XP 15, Diamonds 1, Heart penalty 1
- Finish payload: `gameMode: 'vowel_stage_2'`; unlock target `level2`

#### 3) GreetingStage3Game.js (Lesson 3)
- Data: `greetings_fallback.json`; `greetingImages` mapping
- Adds types: `TRANSLATE_MATCH` (ไทย ↔ English), `FILL_BLANK_DIALOG`
- Rewards: XP 15, Diamonds 1, Heart penalty 1
- Default `nextStageMeta` → `Lesson4ObjectsGame` (Lesson 4); `gameMode: 'greeting_stage_3'`; unlock `level3`

#### 4) Lesson4ObjectsGame.js (Lesson 4)
- Data: `lesson4_objects.json`; uses English gloss (`en`) for matching
- Types: standard set; DRAG_MATCH links ไทย ↔ English
- Rewards: XP 10, Diamonds 1, Heart penalty 1
- Default `nextStageMeta` → `Lesson5BodyGame`; `gameMode: 'objects_lesson_4'`; unlock `level4`

#### 5) Lesson5BodyGame.js (Lesson 5)
- Data: `lesson5_body.json`
- Types: standard set; DRAG_MATCH ไทย ↔ English
- Rewards: XP 10, Diamonds 1, Heart penalty 1
- No default next stage (`nextStageMeta` null to return to stage select); `gameMode: 'body_parts_stage'`; unlock `level5`

### Question Generation Patterns (examples)

- Each generator produces a typed question object with fields like: `id`, `type`, `instruction`, plus type-specific fields (e.g., `choices`, `leftItems/rightItems`, `cards`, `correctText`, etc.).
- Per-question reward hints are embedded on some screens (e.g., consonants) for XP/diamond/penalty; others apply fixed increments at answer time.

### Persistence and Resume

- Snapshots: saved frequently via `saveProgress(lessonId, snapshot)` including `questionsSnapshot`, `currentIndex`, core stats, and `answers`.
- On load, if a snapshot exists, the screen sets `resumeData` and restores key states to continue where the player left off.

### Unlock Flow

- After finishing a session, if `accuracyPercent >= 70`, the next level is considered unlocked. The screen calls `levelUnlockService.checkAndUnlockNextLevel('levelX', { accuracy, score, attempts })` and passes `nextStageUnlocked` to the result screen.

### Navigation Contracts (common)

- All screens accept route params including: `lessonId`, `category`, `stageTitle`, `level`, and optionally `nextStageMeta`, `stageSelectRoute`, `replayRoute`, `replayParams`.
- All screens end by replacing to `LessonComplete` with the payload described above, ensuring a consistent result UI and progression logic.

### Notes

- Hearts: gameplay decrements on wrong answers. Hearts can be replenished via shop outside these screens; the in-game flow prompts when hearts reach 0.
- TTS: most actions call `vaja9TtsService.playThai` for auditory feedback, especially in sound or matching tasks.


