const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../models/Notification');
const { emitToUser } = require('../sockets/socketServer');

/**
 * Central notification service.
 * All notification creation goes through here to ensure
 * both DB persistence and real-time socket delivery.
 */

/**
 * Create a notification, save to DB, and emit via socket.
 *
 * @param {Object} io - socket.io server instance
 * @param {Object} params
 * @param {string} params.recipientId - User who receives the notification
 * @param {string|null} params.actorId - User who triggered the action
 * @param {string} params.type - NOTIFICATION_TYPES value
 * @param {string} params.title - Short notification title
 * @param {string} params.message - Longer description
 * @param {string|null} params.link - Frontend route link
 * @param {string|null} params.relatedIssueId - Related issue ObjectId
 * @returns {Promise<Object>} The created notification document
 */
const createNotification = async (io, { recipientId, actorId = null, type, title, message, link = null, relatedIssueId = null }) => {
  // Don't notify users about their own actions
  if (actorId && actorId.toString() === recipientId.toString()) return null;

  try {
    const notification = await Notification.create({
      recipient: recipientId,
      actor: actorId,
      type,
      title,
      message,
      link,
      relatedIssue: relatedIssueId,
    });

    // Populate actor info for the real-time payload
    const populated = await notification.populate('actor', 'name email');

    // Emit to recipient in real-time (works across all their open tabs)
    emitToUser(io, recipientId, {
      _id: populated._id,
      type: populated.type,
      title: populated.title,
      message: populated.message,
      link: populated.link,
      actor: populated.actor,
      relatedIssue: populated.relatedIssue,
      read: false,
      createdAt: populated.createdAt,
    });

    return populated;
  } catch (err) {
    // Notification failure should never crash the main request
    console.error('Notification creation failed:', err.message);
    return null;
  }
};

// ─── Convenience Wrappers ─────────────────────────────────────────────────────

const notifyIssueCreated = (io, { issue, actorId }) =>
  createNotification(io, {
    recipientId: issue.createdBy,
    actorId,
    type: NOTIFICATION_TYPES.ISSUE_CREATED,
    title: 'New Issue Created',
    message: `Issue "${issue.title}" has been created.`,
    link: `/dashboard`,
    relatedIssueId: issue._id,
  });

const notifyIssueAssigned = (io, { issue, assigneeId, actorId }) =>
  createNotification(io, {
    recipientId: assigneeId,
    actorId,
    type: NOTIFICATION_TYPES.ISSUE_ASSIGNED,
    title: 'Issue Assigned to You',
    message: `You've been assigned to "${issue.title}".`,
    link: `/dashboard`,
    relatedIssueId: issue._id,
  });

const notifyStatusChanged = (io, { issue, recipientId, actorId, oldStatus, newStatus }) =>
  createNotification(io, {
    recipientId,
    actorId,
    type: NOTIFICATION_TYPES.ISSUE_STATUS_CHANGED,
    title: 'Issue Status Updated',
    message: `"${issue.title}" status changed from ${oldStatus} → ${newStatus}.`,
    link: `/dashboard`,
    relatedIssueId: issue._id,
  });

const notifyIssueUpdated = (io, { issue, recipientId, actorId }) =>
  createNotification(io, {
    recipientId,
    actorId,
    type: NOTIFICATION_TYPES.ISSUE_UPDATED,
    title: 'Issue Updated',
    message: `"${issue.title}" has been updated.`,
    link: `/dashboard`,
    relatedIssueId: issue._id,
  });

const notifyVulnerabilityFound = (io, { recipientId, language, criticalCount }) =>
  createNotification(io, {
    recipientId,
    actorId: null,
    type: NOTIFICATION_TYPES.VULNERABILITY_FOUND,
    title: '⚠️ Critical Vulnerabilities Found',
    message: `Analysis of your ${language} code found ${criticalCount} critical vulnerability${criticalCount !== 1 ? 'ies' : 'y'}.`,
    link: `/history`,
    relatedIssueId: null,
  });

module.exports = {
  createNotification,
  notifyIssueCreated,
  notifyIssueAssigned,
  notifyStatusChanged,
  notifyIssueUpdated,
  notifyVulnerabilityFound,
};
