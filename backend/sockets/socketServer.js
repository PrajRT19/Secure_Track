const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Map of userId -> Set of socket IDs (one user can have multiple tabs/devices)
const userSockets = new Map();

/**
 * Initialize Socket.io on the HTTP server.
 * Attaches JWT auth middleware so every socket connection is authenticated.
 *
 * @param {http.Server} httpServer - The Node.js http server
 * @returns {Server} io instance (attach to app for use in controllers)
 */
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Ping every 25s, disconnect after 60s of silence
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── JWT Auth Middleware ────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      // Client sends token via auth handshake: { auth: { token: '...' } }
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: User not found'));

      // Attach user to socket for later use
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ─── Connection Handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Socket connected: ${socket.user.name} [${socket.id}]`);

    // Register this socket under the user's ID
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Join a personal room so we can target this user easily
    socket.join(`user:${userId}`);

    // Acknowledge successful connection with user info
    socket.emit('connected', {
      message: 'Real-time connection established',
      userId,
      socketId: socket.id,
    });

    // ─── Client Events ────────────────────────────────────────────────────────
    // Client marks a notification as read via socket (alternative to REST)
    socket.on('notification:read', (notificationId) => {
      console.log(`📬 Notification ${notificationId} marked read by ${socket.user.name}`);
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
      console.log(`🔌 Socket disconnected: ${socket.user.name} — ${reason}`);
    });
  });

  return io;
};

/**
 * Emit a real-time notification to a specific user.
 * Works across all tabs/devices the user has open.
 *
 * @param {Server} io - The socket.io server instance
 * @param {string} userId - MongoDB ObjectId string of the recipient
 * @param {Object} notification - The notification payload
 */
const emitToUser = (io, userId, notification) => {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit('notification:new', notification);
  console.log(`📡 Emitted notification to user ${userId}:`, notification.type);
};

/**
 * Check if a specific user is currently connected
 * @param {string} userId
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
  const sockets = userSockets.get(userId?.toString());
  return sockets ? sockets.size > 0 : false;
};

/**
 * Get count of currently connected unique users
 */
const getOnlineUserCount = () => userSockets.size;

module.exports = { initSocket, emitToUser, isUserOnline, getOnlineUserCount };
