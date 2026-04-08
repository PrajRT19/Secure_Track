const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardAnalytics } = require('../controllers/analyticsController');

router.use(protect);

// GET /api/analytics — all dashboard chart data in one call
router.get('/', getDashboardAnalytics);

module.exports = router;
