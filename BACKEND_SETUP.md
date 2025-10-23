# 🐱 Thai-Meow Backend Setup Guide

## 📋 Quick Start

### Prerequisites
```bash
Node.js >= 14.x
MongoDB (local or cloud)
npm or yarn
```

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp config.env.example config.env

# Edit config.env with your database and settings
nano config.env  # or use your editor
```

### Environment Variables (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/thai-meow
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## 🚀 Running the Backend

### Option 1: Local Machine
```bash
cd backend
npm start
```

Expected output:
```
✅ MongoDB connected successfully → Database: thai-meow
🚀 Server is running on port: 3000
📊 Health Check: http://localhost:3000/api/health
📚 API Docs: http://localhost:3000/
```

### Option 2: From Root Directory
```bash
npm run backend
```

### Option 3: Development Mode (auto-reload)
```bash
cd backend
npm install -g nodemon  # if not installed
nodemon server.js
```

## 🔌 API Endpoints

### Health Check
```
GET http://localhost:3000/api/health
```

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/reset-password-with-pet` - Reset password

### User Stats
- `GET /api/user/stats/:userId` - Get user stats
- `POST /api/user/stats` - Update user stats (requires auth)
- `GET /api/user/stats` - Get current user stats (requires auth)

### More Endpoints
See `backend/routes/` directory for all available routes

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Thai Meow API is running",
  "timestamp": "2025-10-22T05:33:54.441Z",
  "database": "Connected"
}
```

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 📊 MongoDB Connection

### Local MongoDB
```bash
# Start MongoDB service (macOS)
brew services start mongodb-community

# Or run directly
mongod

# Connect to database
mongo thai-meow
```

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Add to MONGODB_URI in .env

## 📝 Logs

Backend logs are saved in `backend/logs/`:
- `access.log` - All HTTP requests
- `error.log` - Errors and exceptions

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill process on port 3000
lsof -ti :3000 | xargs kill -9

# Or set different port
PORT=3001 npm start
```

### MongoDB Connection Error
- Check MongoDB is running
- Verify MONGODB_URI in .env
- Check database credentials

### CORS Issues
- Check `server.js` for allowed origins
- Add your frontend URL if needed

### Routes Not Found (404)
- Ensure all route files are imported in `server.js`
- Check route definitions in `backend/routes/`
- Verify middleware order

## 🔐 Security Notes

- Keep JWT_SECRET secure (use strong random string)
- Don't commit .env file
- Use HTTPS in production
- Implement rate limiting for production
- Validate all user inputs

## 📚 Project Structure

```
backend/
├── config/
│   ├── database.js
│   └── config.env
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   └── ...
├── models/
│   ├── User.js
│   ├── Progress.js
│   └── ...
├── routes/
│   ├── auth.js
│   ├── user.routes.js
│   └── ...
├── middleware/
│   └── auth.js
├── services/
│   └── userStats.js
├── logs/
│   ├── access.log
│   └── error.log
├── server.js
├── package.json
└── README.md
```

## ✅ Checklist

Before deploying to production:
- [ ] All environment variables set
- [ ] MongoDB connection verified
- [ ] CORS origins configured
- [ ] JWT_SECRET changed to strong random value
- [ ] Error handling implemented
- [ ] Rate limiting added
- [ ] HTTPS enabled
- [ ] Logging configured
- [ ] Database backups setup
- [ ] API documentation updated

## 📞 Support

For issues or questions:
1. Check logs in `backend/logs/`
2. Test endpoints with curl
3. Verify database connection
4. Check MongoDB for data

---
**Last Updated:** 2025-10-22
**Version:** 2.0.0-Pro

