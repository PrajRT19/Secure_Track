const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const { initSocket } = require('./sockets/socketServer');

// Routes
const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const analyzeRoutes = require('./routes/analyze');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ─── HTTP + Socket.io ─────────────────────────────────────────────────────────
// IMPORTANT: Use http.createServer so socket.io and express share the same port
const httpServer = http.createServer(app);
const io = initSocket(httpServer);

// Attach io to app so controllers can access it via req.app.get('io')
app.set('io', io);

// ─── DB + Start ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    httpServer.listen(PORT, () => {
      console.log(`🚀 SecureTrack API + WebSocket running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = { app, httpServer };
