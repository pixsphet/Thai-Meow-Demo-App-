# Level System - Quick Reference Card 🎮

## The Golden Rule
```
ข้อมูลทั้งหมด = USER ที่ LOGIN อยู่ เท่านั้น
All data belongs to the authenticated user ONLY
```

## Key Changes Summary

### Backend Routes
| Before | After | Why |
|--------|-------|-----|
| `GET /lessons/unlocked/:userId` | `GET /lessons/unlocked` | userId from JWT |
| `POST /lessons/check-unlock/:userId/:levelId` | `POST /lessons/check-unlock/:levelId` | userId from JWT |
| No auth middleware | Auth middleware (all routes) | Security |
| userId from body/params | userId from JWT token only | Data isolation |

### Frontend API Calls
| Before | After | Why |
|--------|-------|-----|
| `getUnlockedLevels(userId)` | `getUnlockedLevels()` | JWT handles it |
| `checkAndUnlockNext(userId, levelId, {...})` | `checkAndUnlockNext(levelId, {...})` | JWT handles it |
| `isLevelUnlocked(userId, levelId)` | `isLevelUnlocked(levelId)` | JWT handles it |

## Implementation Checklist

### Backend Setup ✅
- [x] All progress routes have `auth` middleware
- [x] All level routes have `auth` middleware  
- [x] userId extracted from `req.user.id` (JWT) only
- [x] No userId in URL parameters for data endpoints
- [x] No userId validation from body

### Frontend Setup ✅
- [x] Removed userId from API function parameters
- [x] Updated unlock service to not send userId
- [x] Use apiClient (auto JWT in headers)

### Database ✅
- [x] Progress model has userId index
- [x] User model has unlockedLevels array
- [x] Compound index on (userId, lessonId)

## API Endpoints Reference

### 🎯 Protected Endpoints (All require JWT)

```bash
# GET - Get current user's progress
GET /progress/session?lessonId=lesson1
Authorization: Bearer <JWT>
→ Returns only THIS user's progress

# POST - Save current user's progress
POST /progress/session
Authorization: Bearer <JWT>
{ lessonId, progress, accuracy, ... }
→ Creates/updates progress for THIS user

# GET - Get all current user's progress
GET /progress/all
Authorization: Bearer <JWT>
→ Returns all lessons for THIS user

# POST - Finish lesson
POST /progress/finish
Authorization: Bearer <JWT>
{ lessonId, score, xpGain, ... }
→ Updates stats for THIS user

# GET - Get unlocked levels for current user
GET /lessons/unlocked
Authorization: Bearer <JWT>
→ Returns ["level1", "level2", ...] for THIS user

# POST - Check and unlock next level
POST /lessons/check-unlock/:levelId
Authorization: Bearer <JWT>
{ accuracy, score }
→ Unlocks level for THIS user if qualified

# POST - Unlock specific level
POST /user/unlock-level
Authorization: Bearer <JWT>
{ levelId }
→ Unlocks level for THIS user
```

## Frontend Code Template

### Minimal Game Screen
```javascript
import { useAuth } from '../contexts/AuthContext';
import progressServicePerUser from '../services/progressServicePerUser';
import unlockService from '../services/unlockService';

export default function GameScreen({ navigation }) {
  const { user, token } = useAuth();

  // Check auth
  if (!user?.id || !token) return <Text>Not authenticated</Text>;

  // Load progress
  useEffect(() => {
    progressServicePerUser.restoreProgress('lesson1');
  }, [user?.id]);

  // Save progress
  const save = async (data) => {
    await progressServicePerUser.saveProgress('lesson1', data);
  };

  // Finish & unlock
  const finish = async (results) => {
    await progressServicePerUser.finishLesson({
      lessonId: 'lesson1',
      score: results.score,
      accuracy: results.accuracy,
      xpGain: 10,
      diamonds: 5,
      correctAnswers: results.correct,
      wrongAnswers: results.wrong,
      timeSpent: results.time
    });

    const unlockResult = await unlockService.checkAndUnlockNext(
      'level2',
      { accuracy: results.accuracy, score: results.score }
    );

    if (unlockResult.shouldUnlock) {
      console.log('🎉 Level unlocked!');
    }
  };

  return (
    // ... game UI ...
  );
}
```

## Data Flow (Simplified)

```
User Login (AuthContext)
    ↓
JWT Token stored (AsyncStorage)
    ↓
Game Screen loads
    ↓
progressServicePerUser.restoreProgress()
    ↓
apiClient adds: Authorization: Bearer <JWT>
    ↓
Backend auth middleware: req.user = JWT payload
    ↓
Query DB: { userId: req.user.id, lessonId }
    ↓
Return: User's own data only
```

## Security Checklist 🔐

✅ **BEFORE making a request:**
- [ ] User is authenticated (`useAuth().user` exists)
- [ ] JWT token exists (`useAuth().token` exists)
- [ ] Using `apiClient` (auto-adds JWT header)

✅ **BACKEND validation:**
- [ ] Route has `auth` middleware
- [ ] Using `req.user.id` (from JWT)
- [ ] Never accepting userId from body/params
- [ ] Query filters by userId

✅ **DATA ISOLATION:**
- [ ] Each query includes `{ userId: req.user.id }`
- [ ] No user can see another user's progress
- [ ] No user can unlock another's levels

## Common Patterns

### Pattern: Load + Update + Save
```javascript
// 1. Load
const existing = await progressServicePerUser.restoreProgress(lessonId);

// 2. Update in memory
const updated = { ...existing, progress: 50 };

// 3. Save (userId automatic)
await progressServicePerUser.saveProgress(lessonId, updated);
```

### Pattern: Check Unlock
```javascript
const result = await unlockService.checkAndUnlockNext(
  levelId,
  { accuracy: 85 }
);

if (result.shouldUnlock) {
  // User qualified!
  console.log(`Next level: ${result.nextLevel}`);
}
```

### Pattern: Get Unlocked Levels
```javascript
const levels = await unlockService.getUnlockedLevels();
// ['level1', 'level2', 'level3']

const canPlayLevel4 = await unlockService.isLevelUnlocked('level4');
// false
```

## Troubleshooting

### ❌ "User not authenticated"
**Fix:** Make sure `useAuth()` returns user before calling APIs

### ❌ "Unauthorized access"
**Fix:** Token expired → User needs to re-login

### ❌ "User ID required"
**Fix:** Backend didn't extract userId from JWT → Check auth middleware

### ❌ "Missing userId in request"
**Fix:** Using old API signatures → Remove userId parameter

### ❌ "User seeing other's data"
**Fix:** Database query not filtering by userId → Check backend filters

## Files Modified

### Backend
- ✅ `backend/routes/progressPerUser.js` - Added auth to all routes
- ✅ `backend/routes/lessons.js` - Changed unlock routes to use JWT
- ✅ `backend/routes/user.routes.js` - Secured unlock-level endpoint

### Frontend
- ✅ `src/services/unlockService.js` - Removed userId parameters
- ✅ `src/services/levelUnlockService.js` - Updated sync function
- ✅ (Other services) - Auto-use JWT via apiClient

### Documentation
- ✅ `LEVEL_SYSTEM_ARCHITECTURE.md` - Full technical details
- ✅ `LEVEL_SYSTEM_FRONTEND_GUIDE.md` - Implementation guide
- ✅ `LEVEL_SYSTEM_QUICK_REFERENCE.md` - This file

## Performance Tips

🚀 **Optimize with:**
- Cache progress locally (until next sync)
- Batch progress updates (save every N questions)
- Use indexes: `{ userId, lessonId }`
- Lazy-load unlocked levels

## Next Steps

1. **Test data isolation** - Verify users can't see each other's data
2. **Setup CI/CD** - Auto-test auth on every deploy
3. **Monitor errors** - Watch for "unauthorized" errors
4. **Load testing** - Ensure DB indexes work under load

---

**Questions?** Check the full documentation:
- Architecture: `LEVEL_SYSTEM_ARCHITECTURE.md`
- Frontend guide: `LEVEL_SYSTEM_FRONTEND_GUIDE.md`
