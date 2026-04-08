const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../middleware/validators');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', registerValidator, register);

// POST /api/auth/login
router.post('/login', loginValidator, login);

// GET /api/auth/me (protected)
router.get('/me', protect, getMe);

module.exports = router;
