const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────────
// FREE ALTERNATIVE: Groq API  (much higher limits than Gemini free tier)
// ✅ Free tier: 30 req/min, 6000 req/day — no credit card needed
// Get your free API key at: https://console.groq.com  → API Keys → Create
// Add to .env as: GROQ_API_KEY=gsk_...
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';   // Free, excellent at code analysis
const CLAUDE_MODEL = GROQ_MODEL;                   // Keeps rest of codebase unchanged

const SECURITY_SYSTEM_PROMPT = `You are an expert security code reviewer and vulnerability analyst.
Analyze the provided code and return ONLY valid JSON — no markdown, no explanations, no code blocks.
Schema: { "vulnerabilities": [{ "id": number, "title": string, "severity": "Critical"|"High"|"Medium"|"Low", "description": string, "suggestion": string, "line": number }], "score": number, "summary": string, "language": string }
If no vulnerabilities, return empty array and score 10. Always return valid parseable JSON only.`;

const callClaude = async ({ systemPrompt, userPrompt, maxTokens = 4096 }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Groq API key not configured. Get a free key at https://console.groq.com and add GROQ_API_KEY=gsk_... to your .env'
    );
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
      },
      {
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 120000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Groq API');
    return text;

  } catch (err) {
    if (err.response) {
      const status  = err.response.status;
      const groqMsg = err.response.data?.error?.message || 'Unknown Groq API error';

      if (status === 400) throw new Error(`Groq bad request: ${groqMsg}`);
      if (status === 401) throw new Error('Invalid Groq API key. Check GROQ_API_KEY in your .env');
      if (status === 404) throw new Error(`Groq model not found: ${GROQ_MODEL}`);
      if (status === 429) throw new Error(
        'Groq rate limit hit (30 req/min or 6000 req/day). Wait a moment and retry.'
      );
      if (status >= 500) throw new Error('Groq API server error. Please try again shortly.');
      throw new Error(`Groq API error (${status}): ${groqMsg}`);
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('Groq API request timed out. Try a shorter code snippet.');
    }
    throw err;
  }
};

const analyzeCodeWithClaude = async (code, language) => {
  const userPrompt = `Analyze this ${language} code for security vulnerabilities:\n\`\`\`${language}\n${code}\n\`\`\``;
  const rawText = await callClaude({ systemPrompt: SECURITY_SYSTEM_PROMPT, userPrompt, maxTokens: 4096 });
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.vulnerabilities)) throw new Error('Missing vulnerabilities array');
    if (typeof parsed.score !== 'number') parsed.score = 5;
    if (!parsed.summary) parsed.summary = 'Analysis complete.';
    if (!parsed.language) parsed.language = language;
    return parsed;
  } catch (e) {
    throw new Error(`Failed to parse AI response: ${e.message}`);
  }
};

module.exports = { callClaude, analyzeCodeWithClaude, CLAUDE_MODEL };