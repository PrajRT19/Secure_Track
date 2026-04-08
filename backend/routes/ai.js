const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const { analyzeValidator } = require('../middleware/validators');
const { body } = require('express-validator');
const { analyzeForFix, fixCode } = require('../controllers/aiFixController');

// Rate limiter: 10 requests per 15 min per user
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { message: 'Too many AI requests. Please wait 15 minutes.' },
});

router.use(protect);

// POST /api/ai/analyze — detect vulnerabilities, returns JSON analysis
router.post('/analyze', aiLimiter, analyzeValidator, analyzeForFix);

// POST /api/ai/fix — return fixed code + diff
router.post(
  '/fix',
  aiLimiter,
  [
    body('code').trim().notEmpty().withMessage('Code is required').isLength({ max: 50000 }),
    body('language').trim().notEmpty().withMessage('Language is required'),
  ],
  fixCode
);

module.exports = router;
