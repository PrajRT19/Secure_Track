const Analysis = require('../models/Analysis');
const { analyzeCodeWithClaude, CLAUDE_MODEL } = require('../utils/claudeClient');

/**
 * POST /api/analyze
 * Analyze code for security vulnerabilities using Claude
 */
const analyzeCode = async (req, res) => {
  const startTime = Date.now();

  try {
    const { code, language } = req.body;

    // Call Claude API for analysis
    const result = await analyzeCodeWithClaude(code, language);

    const processingTimeMs = Date.now() - startTime;

    // Store analysis in MongoDB
    const analysis = await Analysis.create({
      userId: req.user._id,
      codeSnippet: code.substring(0, 10000), // Store first 10k chars
      language,
      result,
      processingTimeMs,
      modelUsed: CLAUDE_MODEL,
    });

    res.status(201).json({
      message: 'Analysis complete',
      analysisId: analysis._id,
      result,
      processingTimeMs,
    });
  } catch (error) {
    console.error('AnalyzeCode error:', error.message);

    // Handle specific API errors
    if (error.response?.status === 401) {
      return res.status(500).json({ message: 'AI service authentication failed. Please contact support.' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ message: 'AI service rate limit reached. Please try again in a moment.' });
    }
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'Analysis timed out. Please try with a smaller code snippet.' });
    }

    res.status(500).json({ message: error.message || 'Failed to analyze code. Please try again.' });
  }
};

/**
 * GET /api/analyze/history
 * Get past analyses for the authenticated user
 */
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      Analysis.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-codeSnippet') // Don't return full code in list
        .lean(),
      Analysis.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      analyses,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('GetHistory error:', error);
    res.status(500).json({ message: 'Failed to fetch analysis history.' });
  }
};

/**
 * GET /api/analyze/history/:id
 * Get a single analysis by ID (including the code snippet)
 */
const getAnalysisById = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found.' });
    }

    res.json({ analysis });
  } catch (error) {
    console.error('GetAnalysisById error:', error);
    res.status(500).json({ message: 'Failed to fetch analysis.' });
  }
};

module.exports = { analyzeCode, getHistory, getAnalysisById };
