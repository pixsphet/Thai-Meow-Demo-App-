// ================================================
// 🐱 Thai-Meow Backend Server.js (FULL PRO VERSION)
// ================================================

require('dotenv').config({ path: './config.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chalk = require('chalk');
const moment = require('moment');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();

// ==============================
// 🧩 Middleware
// ==============================
app.use(cors());
app.use(express.json());

// ==============================
// 📜 HTTP Request Logger (Morgan)
// ==============================
const logFormat =
  chalk.gray('[:date[iso]]') + ' ' +
  chalk.cyan(':method') + ' ' +
  chalk.yellow(':url') + ' ' +
  chalk.green(':status') + ' ' +
  chalk.magenta(':response-time ms');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

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
// 🧩 Routes
// ==============================
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth');
const vocabRoutes = require('./routes/vocabRoutes');
const lessonsRoutes = require('./routes/lessons');
const progressRoutes = require('./routes/progress');
const progressPerUserRoutes = require('./routes/progressPerUser');
const auth = require('./middleware/auth');

app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/vocab', vocabRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/progress', progressRoutes); // Legacy routes (no auth)
app.use('/api/progress/user', auth, progressPerUserRoutes); // Per-user progress routes (with auth)

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Thai Meow API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});


// หน้าหลัก (สำหรับทดสอบ)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: '🐱 Thai-Meow Backend is running!',
    time: new Date().toLocaleString(),
  });
});

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

// ⚠️ Error Handler (Global)
app.use((err, req, res, next) => {
  const time = moment().format('YYYY-MM-DD HH:mm:ss');
  console.error(chalk.red.bold(`\n❌ [${time}] ERROR:`), chalk.yellow(err.message));
  res.status(500).json({ success: false, message: err.message });
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
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(chalk.red.bold(`⚠️  Port ${port} is already in use, trying ${port + 1}...`));
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
