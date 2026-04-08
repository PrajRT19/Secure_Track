const Issue = require('../models/Issue');
const User = require('../models/User');
const {
  notifyIssueCreated,
  notifyIssueAssigned,
  notifyStatusChanged,
  notifyIssueUpdated,
} = require('../services/notificationService');

const getIssues = async (req, res) => {
  try {
    const { status, priority, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = { createdBy: req.user._id };
    if (status && status !== 'All') filter.status = status;
    if (priority && priority !== 'All') filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
    const issues = await Issue.find(filter).sort(sort).lean();
    const [total, open, inProgress, closed] = await Promise.all([
      Issue.countDocuments({ createdBy: req.user._id }),
      Issue.countDocuments({ createdBy: req.user._id, status: 'Open' }),
      Issue.countDocuments({ createdBy: req.user._id, status: 'In Progress' }),
      Issue.countDocuments({ createdBy: req.user._id, status: 'Closed' }),
    ]);
    res.json({ issues, stats: { total, open, inProgress, closed } });
  } catch (err) {
    console.error('GetIssues error:', err);
    res.status(500).json({ message: 'Failed to fetch issues.' });
  }
};

const createIssue = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, tags, sourceVulnerability } = req.body;
    const issue = await Issue.create({
      title,
      description,
      status: status || 'Open',
      priority: priority || 'Medium',
      assignedTo: assignedTo || '',
      tags: tags || [],
      sourceVulnerability: sourceVulnerability || undefined,
      createdBy: req.user._id,
    });
    const io = req.app.get('io');
    notifyIssueCreated(io, { issue, actorId: req.user._id });
    if (assignedTo) {
      const assignee = await User.findOne({ email: assignedTo }).select('_id');
      if (assignee) notifyIssueAssigned(io, { issue, assigneeId: assignee._id, actorId: req.user._id });
    }
    res.status(201).json({ message: 'Issue created successfully', issue });
  } catch (err) {
    console.error('CreateIssue error:', err);
    res.status(500).json({ message: 'Failed to create issue.' });
  }
};

const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    const { title, description, status, priority, assignedTo, tags } = req.body;
    const io = req.app.get('io');
    const oldStatus = issue.status;
    const oldAssignedTo = issue.assignedTo;
    if (title !== undefined) issue.title = title;
    if (description !== undefined) issue.description = description;
    if (status !== undefined) issue.status = status;
    if (priority !== undefined) issue.priority = priority;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo;
    if (tags !== undefined) issue.tags = tags;
    await issue.save();
    if (status && status !== oldStatus) {
      notifyStatusChanged(io, { issue, recipientId: issue.createdBy, actorId: req.user._id, oldStatus, newStatus: status });
    }
    if (assignedTo && assignedTo !== oldAssignedTo) {
      const assignee = await User.findOne({ email: assignedTo }).select('_id');
      if (assignee) notifyIssueAssigned(io, { issue, assigneeId: assignee._id, actorId: req.user._id });
    }
    notifyIssueUpdated(io, { issue, recipientId: issue.createdBy, actorId: req.user._id });
    res.json({ message: 'Issue updated successfully', issue });
  } catch (err) {
    console.error('UpdateIssue error:', err);
    res.status(500).json({ message: 'Failed to update issue.' });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });
    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    console.error('DeleteIssue error:', err);
    res.status(500).json({ message: 'Failed to delete issue.' });
  }
};

module.exports = { getIssues, createIssue, updateIssue, deleteIssue };
