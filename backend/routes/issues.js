const express = require('express');
const router = express.Router();
const { getIssues, createIssue, updateIssue, deleteIssue } = require('../controllers/issueController');
const { protect } = require('../middleware/auth');
const { issueValidator } = require('../middleware/validators');

// All routes require authentication
router.use(protect);

// GET /api/issues
router.get('/', getIssues);

// POST /api/issues
router.post('/', issueValidator, createIssue);

// PUT /api/issues/:id
router.put('/:id', issueValidator, updateIssue);

// DELETE /api/issues/:id
router.delete('/:id', deleteIssue);

module.exports = router;
