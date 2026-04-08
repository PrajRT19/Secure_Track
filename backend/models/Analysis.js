const mongoose = require('mongoose');

const vulnerabilitySchema = new mongoose.Schema({
  id: Number,
  title: String,
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
  },
  description: String,
  suggestion: String,
  line: Number,
});

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The submitted code (store truncated version for history display)
    codeSnippet: {
      type: String,
      required: true,
      maxlength: 50000,
    },
    language: {
      type: String,
      required: true,
      trim: true,
    },
    // AI analysis results
    result: {
      vulnerabilities: [vulnerabilitySchema],
      score: {
        type: Number,
        min: 0,
        max: 10,
      },
      summary: String,
      language: String,
    },
    // Metadata
    processingTimeMs: Number,
    modelUsed: {
      type: String,
      default: 'claude-sonnet-4-20250514',
    },
  },
  {
    timestamps: true,
  }
);

// Index for user history queries
analysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
