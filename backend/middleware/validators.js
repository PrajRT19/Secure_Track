const { body, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth Validators ────────────────────────────────────────────────────────
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Issue Validators ───────────────────────────────────────────────────────
const issueValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('status').optional().isIn(['Open', 'In Progress', 'Closed']).withMessage('Invalid status value'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority value'),
  validate,
];

// ─── Analyze Validators ─────────────────────────────────────────────────────
const analyzeValidator = [
  body('code').trim().notEmpty().withMessage('Code is required').isLength({ min: 5, max: 50000 }).withMessage('Code must be between 5 and 50,000 characters'),
  body('language').trim().notEmpty().withMessage('Programming language is required'),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  issueValidator,
  analyzeValidator,
};
