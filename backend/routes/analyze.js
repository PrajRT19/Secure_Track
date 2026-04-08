const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { analyzeCode, getHistory, getAnalysisById } = require('../controllers/analyzeController');
const { protect } = require('../middleware/auth');
const { analyzeValidator } = require('../middleware/validators');

// Rate limiter: max 10 analyses per user per 15 minutes
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many analysis requests. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication
router.use(protect);

// POST /api/analyze
router.post('/', analyzeLimiter, analyzeValidator, analyzeCode);

// GET /api/analyze/history
router.get('/history', getHistory);

// GET /api/analyze/history/:id
router.get('/history/:id', getAnalysisById);

module.exports = router;
