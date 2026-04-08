const { createTwoFilesPatch } = require('diff');
const { analyzeCodeWithClaude, CLAUDE_MODEL } = require('../utils/claudeClient');
const { callClaude } = require('../utils/claudeClient');
const Analysis = require('../models/Analysis');
const { notifyVulnerabilityFound } = require('../services/notificationService');

// ─── AI Prompts ────────────────────────────────────────────────────────────────

const FIX_SYSTEM_PROMPT = `You are an expert security engineer and code reviewer.
Your job is to rewrite provided code to fix ALL security vulnerabilities.

Rules:
1. Return ONLY the complete fixed code — no explanation, no markdown fences, no comments about what you changed
2. Preserve the original code structure, variable names, and logic — only fix security issues
3. Add inline comments on changed lines prefixed with // FIXED: explaining what was fixed
4. If the language uses other comment syntax (Python: #, SQL: --), use that instead
5. The output must be valid, runnable code in the same language
6. Fix every vulnerability found — do not leave any security issues
7. Do not add unnecessary features or refactor beyond what is needed for security`;

/**
 * POST /api/ai/analyze
 * Detect vulnerabilities in submitted code
 */
const analyzeForFix = async (req, res) => {
  const startTime = Date.now();
  try {
    const { code, language } = req.body;
    const result = await analyzeCodeWithClaude(code, language);
    const processingTimeMs = Date.now() - startTime;

    const analysis = await Analysis.create({
      userId: req.user._id,
      codeSnippet: code.substring(0, 10000),
      language,
      result,
      processingTimeMs,
      modelUsed: CLAUDE_MODEL,
    });

    // Notify user if critical vulnerabilities found
    const criticals = result.vulnerabilities?.filter((v) => v.severity === 'Critical') || [];
    if (criticals.length > 0) {
      const io = req.app.get('io');
      notifyVulnerabilityFound(io, {
        recipientId: req.user._id,
        language,
        criticalCount: criticals.length,
      });
    }

    res.status(201).json({ analysisId: analysis._id, result, processingTimeMs });
  } catch (err) {
    console.error('analyzeForFix error:', err.message);
    // ✅ FIX 3: Pass the real error message to the frontend, not a generic 500.
    // Map known error types to appropriate HTTP status codes.
    if (err.message.includes('API key')) return res.status(500).json({ message: err.message });
    if (err.message.includes('rate limit')) return res.status(429).json({ message: err.message });
    if (err.message.includes('not found') || err.message.includes('bad request')) {
      return res.status(502).json({ message: err.message });
    }
    res.status(500).json({ message: err.message || 'Analysis failed.' });
  }
};

/**
 * POST /api/ai/fix
 * Takes original code + vulnerability list, returns fixed code + unified diff
 *
 * Body: { code, language, vulnerabilities, analysisId }
 * Response: { fixedCode, diff, hunks, summary }
 */
const fixCode = async (req, res) => {
  const startTime = Date.now();
  try {
    const { code, language, vulnerabilities = [], analysisId } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'code and language are required.' });
    }

    const vulnList = vulnerabilities.length > 0
      ? vulnerabilities
          .map((v, i) => `${i + 1}. [${v.severity}] ${v.title}${v.line ? ` (line ${v.line})` : ''}: ${v.description}`)
          .join('\n')
      : 'General security hardening';

    const userPrompt = `Fix all security vulnerabilities in this ${language} code.\n\nKnown vulnerabilities to fix:\n${vulnList}\n\nOriginal code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nReturn ONLY the complete fixed ${language} code.`;

    const fixedCode = await callClaude({
      systemPrompt: FIX_SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 8192,
    });

    const diffText = createTwoFilesPatch(
      `original.${getExtension(language)}`,
      `fixed.${getExtension(language)}`,
      code,
      fixedCode,
      'Original Code',
      'Fixed Code'
    );

    const hunks = parseDiffHunks(diffText, code, fixedCode);
    const processingTimeMs = Date.now() - startTime;

    res.json({
      fixedCode,
      diff: diffText,
      hunks,
      linesChanged: hunks.reduce((acc, h) => acc + h.changes.length, 0),
      processingTimeMs,
      analysisId,
    });
  } catch (err) {
    console.error('fixCode error:', err.message);
    // ✅ FIX 3: Same — pass the real error message through
    if (err.message.includes('rate limit')) return res.status(429).json({ message: err.message });
    if (err.message.includes('API key')) return res.status(500).json({ message: err.message });
    res.status(500).json({ message: err.message || 'Failed to generate fix.' });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getExtension = (language) => {
  const map = {
    javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
    'c#': 'cs', 'c++': 'cpp', c: 'c', php: 'php', ruby: 'rb',
    go: 'go', rust: 'rs', swift: 'swift', kotlin: 'kt', sql: 'sql',
    'bash/shell': 'sh', solidity: 'sol',
  };
  return map[language?.toLowerCase()] || 'txt';
};

const parseDiffHunks = (diffText, originalCode, fixedCode) => {
  const hunks = [];
  let currentHunk = null;
  let lineOld = 0;
  let lineNew = 0;

  for (const line of diffText.split('\n')) {
    if (line.startsWith('@@')) {
      if (currentHunk) hunks.push(currentHunk);
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (match) {
        lineOld = parseInt(match[1]) - 1;
        lineNew = parseInt(match[2]) - 1;
      }
      currentHunk = { header: line, changes: [] };
    } else if (currentHunk) {
      if (line.startsWith('-') && !line.startsWith('---')) {
        currentHunk.changes.push({ type: 'removed', content: line.slice(1), lineOld: ++lineOld, lineNew: null });
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        currentHunk.changes.push({ type: 'added', content: line.slice(1), lineOld: null, lineNew: ++lineNew });
      } else if (!line.startsWith('\\')) {
        currentHunk.changes.push({ type: 'context', content: line.slice(1), lineOld: ++lineOld, lineNew: ++lineNew });
      }
    }
  }

  if (currentHunk && currentHunk.changes.length > 0) hunks.push(currentHunk);
  return hunks;
};

module.exports = { analyzeForFix, fixCode };