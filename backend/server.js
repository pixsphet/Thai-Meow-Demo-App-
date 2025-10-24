// ================================================
// 🐱 Thai-Meow Backend Server.js (FULL PRO VERSION)
// ================================================

require('dotenv').config({ path: './config.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chalk = require('chalk');       // ✅ สี log
const moment = require('moment');     // ✅ เวลา
const morgan = require('morgan');     // ✅ HTTP request logger
const fs = require('fs');
const path = require('path');

const app = express();

// ==============================
// 🧩 Middleware
// ==============================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:19006', 'http://localhost:19000', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:8084', 'http://localhost:8085', 'http://localhost:8086', 'http://localhost:8087', 'http://localhost:8088', 'http://localhost:8089', 'http://localhost:8090', 'http://localhost:8091', 'http://localhost:8092', 'http://localhost:8093', 'http://localhost:8094', 'http://localhost:8095', 'http://localhost:8096', 'http://localhost:8097', 'http://localhost:8098', 'http://localhost:8099', 'http://localhost:8100'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// ==============================
// 📜 HTTP Request Logger (Morgan)
// ==============================

// Log format สำหรับ console
const logFormat = chalk.gray('[:date[iso]]') + ' ' +
  chalk.cyan(':method') + ' ' +
  chalk.yellow(':url') + ' ' +
  chalk.green(':status') + ' ' +
  chalk.magenta(':response-time ms');

// สร้างโฟลเดอร์ logs ถ้าไม่มี
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log ลงไฟล์ (access.log)
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// ใช้ morgan ทั้ง console และ log file
app.use(morgan(logFormat));
app.use(morgan('combined', { stream: accessLogStream }));

// ==============================
// 🧠 Database Connection
// ==============================
const mongoURI = process.env.MONGODB_URI;
const dbName = mongoURI?.split('/').pop()?.split('?')[0] || 'UnknownDB';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log(
    chalk.green.bold(`✅ MongoDB connected successfully → Database:`),
    chalk.cyan(dbName)
  );
});

mongoose.connection.on('error', (err) => {
  console.error(chalk.red.bold('❌ MongoDB connection error:'), err.message);
  process.exit(1);
});

// ==============================
// 🧩 Import Routes
// ==============================
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const playerRoutes = require('./routes/player');
const vocabRoutes = require('./routes/vocabRoutes');
const lessonsRoutes = require('./routes/lessons');
const streakRoutes = require('./routes/streak');
const xpRoutes = require('./routes/xp');
const userRoutes = require('./routes/user.routes');
const friendsRoutes = require('./routes/friends');
const progressPerUserRoutes = require('./routes/progressPerUser');
const gameResultRoutes = require('./routes/gameResult');
const auth = require('./middleware/auth');
const lesson3Routes = require('./routes/lesson3');
const greetingsRoutes = require('./routes/greetings');
const ttsRoutes = require('./routes/tts');
const gameVocabRoutes = require('./routes/gameVocab');

// ==============================
// 🧩 Routes
// ==============================

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Thai Meow API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});


// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '🐱 Thai-Meow Backend is running!',
    time: new Date().toLocaleString(),
    version: '2.0.0-Pro'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes); // Legacy routes (no auth)
app.use('/api/progress/user', auth, progressPerUserRoutes); // Per-user progress routes (with auth)
app.use('/api/progress/user', progressPerUserRoutes); // Fallback without auth (userId from query or auth header)
app.use('/api', playerRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/xp', xpRoutes);
app.use('/api/user', userRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/game-results', gameResultRoutes);
app.use('/api', lesson3Routes);
app.use('/api/greetings', greetingsRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/game-vocab', gameVocabRoutes);

// ตัวอย่าง Route Error (สำหรับ test)
app.get('/error-test', (req, res, next) => {
  next(new Error('This is a manual test error! 😼'));
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// ==============================
// ⚠️ Error Handling Middleware
// ==============================
app.use((err, req, res, next) => {
  const time = moment().format('YYYY-MM-DD HH:mm:ss');
  console.error(
    chalk.red.bold(`\n❌ [${time}] ERROR:`),
    chalk.yellow(err.message)
  );
  
  // Log error to file
  const errorLog = `[${time}] ERROR: ${err.message}\n${err.stack}\n\n`;
  fs.appendFileSync(path.join(logsDir, 'error.log'), errorLog);
  
  res.status(500).json({
    success: false,
    message: err.message,
    timestamp: time
  });
});

// ==============================
// 🚀 Dynamic Port Handling
// ==============================
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

function startServer(port) {
  const server = app.listen(port, () => {
    const time = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log(
      chalk.yellow(`\n🕒 ${time}`),
      chalk.green.bold(`🚀 Server is running on port:`),
      chalk.cyan(port)
    );
    console.log(
      chalk.blue(`📊 Health Check:`),
      chalk.white(`http://localhost:${port}/api/health`)
    );
    console.log(
      chalk.blue(`📚 API Docs:`),
      chalk.white(`http://localhost:${port}/`)
    );
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(
        chalk.red.bold(`⚠️  Port ${port} is already in use, trying ${port + 1}...`)
      );
      startServer(port + 1);
    } else {
      console.error(chalk.red.bold('❌ Server error:'), err);
    }
  });
}

// ==============================
// 🏁 Start Server
// ==============================
startServer(DEFAULT_PORT);
