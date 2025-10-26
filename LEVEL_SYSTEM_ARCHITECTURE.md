# Level/Stage System Architecture - User Data Isolation

## Overview

ระบบ Level/Stage ของ Thai-Meow ถูกออกแบบให้ **ข้อมูลทั้งหมดจะเป็นของ user ที่ login อยู่เท่านั้น** โดยมีการตรวจสอบ JWT token อย่างเข้มงวดในทุก API endpoint

## Key Principles

### 1. **Data Isolation Per User**
- ข้อมูล Progress, Level Unlock, Stats ทั้งหมด จะเชื่อมโยงกับ `userId` ที่ได้จาก JWT token
- ไม่สามารถส่ง `userId` ผ่าน URL parameters หรือ request body ได้
- userId ถูกดึงมาจาก `req.user.id` (อ่านจาก JWT token เท่านั้น)

### 2. **Authentication Middleware**
ทุก endpoint ที่เกี่ยวข้องกับ user data ต้องใช้ `auth` middleware:

```javascript
// ✅ ถูก - มี auth middleware
router.get('/progress/session', auth, async (req, res) => {
  const userId = req.user.id; // ดึงจาก JWT token เท่านั้น
  // ...
});

// ❌ ผิด - ไม่มี auth middleware
router.get('/progress/session', async (req, res) => {
  const userId = req.query.userId; // SECURITY RISK!
  // ...
});
```

## Architecture

### Backend Routes - Protected Endpoints

#### Progress Management
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/progress/session` | POST | ✅ | Save/update lesson progress |
| `/progress/session` | GET | ✅ | Get single lesson progress |
| `/progress/all` | GET | ✅ | Get all user's progress |
| `/progress/session` | DELETE | ✅ | Delete lesson progress |
| `/progress/finish` | POST | ✅ | Finish lesson & award rewards |

#### Level Unlock System
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/lessons/unlocked` | GET | ✅ | Get unlocked levels for current user |
| `/lessons/check-unlock/:levelId` | POST | ✅ | Check & unlock next level |
| `/user/unlock-level` | POST | ✅ | Unlock specific level |

#### User Stats
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/user/stats` | GET | ✅ | Get current user stats |
| `/user/stats` | POST | ✅ | Update current user stats |

### Data Models

#### Progress Model
```javascript
{
  userId: String,        // ✅ REQUIRED - from JWT token
  lessonId: String,      // ✅ REQUIRED - identifies the lesson
  currentIndex: Number,
  total: Number,
  progress: Number,      // 0-100%
  accuracy: Number,      // 0-100%
  completed: Boolean,
  completedAt: Date,
  answers: Object,
  questionsSnapshot: Array,
  updatedAt: Date
}
```

#### User Model - Unlocked Levels
```javascript
{
  username: String,
  email: String,
  passwordHash: String,
  // ... other fields ...
  unlockedLevels: [String], // e.g., ['level1', 'level2', 'level3']
  // ... timestamps ...
}
```

## Frontend Integration

### Auth Flow
1. User logs in → JWT token saved in AsyncStorage
2. AuthContext stores user info
3. Every API call includes auth header: `Authorization: Bearer <JWT_TOKEN>`

### Services Architecture

#### Frontend Services
- `progressServicePerUser.js` - Uses JWT auth for all API calls
- `levelUnlockService.js` - Manages level unlocks with auth
- `realUserStatsService.js` - User stats management

#### Key Functions

**Get User Progress:**
```javascript
// Backend extracts userId from JWT
const response = await apiClient.get('/progress/session', {
  params: { lessonId }
});
// userId is NEVER sent as parameter
```

**Unlock Next Level:**
```javascript
// ✅ Correct - userId from JWT
await apiClient.post('/lessons/check-unlock/level2', {
  accuracy: 85,
  score: 100
});

// ❌ Wrong - sending userId explicitly
await apiClient.post('/lessons/check-unlock/user123/level2', {...});
```

**Check Unlocked Levels:**
```javascript
// GET /lessons/unlocked (userId from JWT token)
const response = await apiClient.get('/lessons/unlocked');
// Returns: { unlockedLevels: ['level1', 'level2'] }
```

## Database Indexes

### Progress Collection
```javascript
ProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
ProgressSchema.index({ userId: 1 }, { sparse: true });
```

### User Collection
```javascript
// username, email must be unique per system
// unlockedLevels tracked per user
```

## Security Checklist

- ✅ All user-data routes require `auth` middleware
- ✅ userId extracted ONLY from JWT token (`req.user.id`)
- ✅ No userId in URL parameters for data endpoints
- ✅ No userId in request body for identification
- ✅ All progress queries filter by authenticated userId
- ✅ Level unlock checks validate user ownership
- ✅ Stats endpoints use JWT for user identification

## Data Access Pattern

### Example: Complete Lesson Flow
```
1. Frontend - Player completes lesson
   └─> POST /progress/finish
       └─ Auth header: Bearer <JWT>
       └─ Body: { lessonId, score, accuracy, ... }

2. Backend
   └─ auth middleware extracts userId from JWT
   └─ Updates Progress where userId matches
   └─ Updates User stats where id matches
   └─ Checks unlock criteria
   └─ If qualified: adds level to user.unlockedLevels

3. Frontend
   └─ Receives response with updated stats
   └─ Caches locally
   └─ Displays achievements
```

## Migration Notes

If moving existing code to use this system:

1. **Remove userId parameters from URLs:**
   ```javascript
   // Before
   /lessons/unlocked/user123
   /lessons/check-unlock/user123/level2
   
   // After
   /lessons/unlocked          (userId from JWT)
   /lessons/check-unlock/level2 (userId from JWT)
   ```

2. **Add auth middleware to routes:**
   ```javascript
   // Before
   router.get('/progress', async (req, res) => { ... })
   
   // After
   router.get('/progress', auth, async (req, res) => { ... })
   ```

3. **Extract userId from JWT instead of body/params:**
   ```javascript
   // Before
   const userId = req.body.userId || req.query.userId;
   
   // After
   const userId = req.user.id;
   ```

## Testing Data Isolation

To verify each user sees only their own data:

```bash
# Test 1: User A gets their progress
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost/progress
# Should return only User A's progress

# Test 2: User B gets their progress
curl -H "Authorization: Bearer TOKEN_B" \
  http://localhost/progress
# Should return only User B's progress

# Test 3: Even if User A tries to access User B's data
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost/progress/user-b-id
# Should return empty or 403 (depends on implementation)
```

## Error Handling

### Common Issues

**Missing Auth Header:**
```json
{
  "error": "User ID required"
}
```
→ Ensure JWT token is in Authorization header

**Unauthorized Access:**
```json
{
  "error": "Failed to authenticate user"
}
```
→ Token may have expired, user needs to re-login

**User Not Found:**
```json
{
  "error": "User not found"
}
```
→ User record doesn't exist, may need to create profile first

## Performance Optimization

### Indexes
- `userId + lessonId` for Progress queries
- `userId` for bulk user queries
- `userId` for stats lookups

### Caching Strategy
- Frontend caches progress locally (with userId key)
- Syncs with server on app launch and after lesson completion
- Handles offline scenarios gracefully

## Future Enhancements

1. **Rate Limiting** - Limit API calls per user
2. **Audit Logging** - Track who accessed what data and when
3. **Data Encryption** - Encrypt sensitive fields at rest
4. **Cross-Device Sync** - Sync progress across devices per user
5. **Dispute Resolution** - Handle inconsistencies between client/server states
