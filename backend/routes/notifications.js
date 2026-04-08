const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

// GET  /api/notifications          — list notifications (paginated)
router.get('/', getNotifications);

// GET  /api/notifications/unread-count
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/read-all  — mark all read
router.patch('/read-all', markAllAsRead);

// DELETE /api/notifications          — clear all
router.delete('/', clearAll);

// PATCH /api/notifications/:id/read  — mark single read
router.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id      — delete single
router.delete('/:id', deleteNotification);

module.exports = router;
