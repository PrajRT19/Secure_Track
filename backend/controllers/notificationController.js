const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Fetch paginated notifications for the authenticated user
 */
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    const filter = { recipient: req.user._id };
    if (unreadOnly) filter.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('actor', 'name email')
        .populate('relatedIssue', 'title status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint for polling unread count
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch unread count.' });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark ALL notifications as read for the user
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    res.json({ message: 'All notifications marked as read.', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read.' });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notification.' });
  }
};

/**
 * DELETE /api/notifications
 * Clear all notifications for the user
 */
const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.json({ message: 'All notifications cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear notifications.' });
  }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll };
