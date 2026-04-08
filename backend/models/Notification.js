const mongoose = require('mongoose');

/**
 * Notification types map 1:1 with issue events.
 * Stored in DB for persistence; also emitted via socket for real-time delivery.
 */
const NOTIFICATION_TYPES = {
  ISSUE_CREATED: 'ISSUE_CREATED',
  ISSUE_UPDATED: 'ISSUE_UPDATED',
  ISSUE_ASSIGNED: 'ISSUE_ASSIGNED',
  ISSUE_STATUS_CHANGED: 'ISSUE_STATUS_CHANGED',
  VULNERABILITY_FOUND: 'VULNERABILITY_FOUND',
};

const notificationSchema = new mongoose.Schema(
  {
    // The user who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The user who triggered the action (null for system events)
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    // Optional link to the related resource
    link: {
      type: String,
      default: null,
    },
    // Reference to the related issue (if any)
    relatedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast unread queries per user
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
