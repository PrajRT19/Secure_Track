import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeAPI } from '../api';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
  'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'SQL',
  'Bash/Shell', 'Solidity', 'Other',
];

const SAMPLE_CODE = `// Sample vulnerable Node.js code
const express = require('express');
const mysql = require('mysql');
const app = express();

app.get('/user', (req, res) => {
  const userId = req.query.id;
  // SQL Injection vulnerability
  const query = "SELECT * FROM users WHERE id = " + userId;
  db.query(query, (err, results) => {
    res.json(results);
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Storing plain text password
  db.query(\`INSERT INTO users (username, password) VALUES ('\${username}', '\${password}')\`);
  res.send('User created');
});

// Hardcoded secret
const JWT_SECRET = "mysecret123";
`;

const CHECKS = [
  { icon: 'bi-database-x',        label: 'SQL / NoSQL Injection',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
  { icon: 'bi-braces-asterisk',   label: 'XSS Vulnerabilities',    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
  { icon: 'bi-key-fill',          label: 'Hardcoded Secrets',      color: '#ef4444', bg: 'rgba(239,68,68,0.08)'   },
  { icon: 'bi-person-x-fill',     label: 'Authentication Flaws',   color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
  { icon: 'bi-shield-x',          label: 'Insecure Dependencies',  color: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
  { icon: 'bi-lock-fill',         label: 'Cryptography Issues',    color: '#3b82f6', bg: 'rgba(59,130,246,0.08)'  },
  { icon: 'bi-arrow-repeat',      label: 'Race Conditions',        color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
  { icon: 'bi-clipboard-x-fill',  label: 'Input Validation',       color: '#f59e0b', bg: 'rgba(245,158,11,0.08)'  },
];

const AnalyzePage = () => {
  const navigate  = useNavigate();
  const [code,     setCode]     = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const charPct  = Math.min((code.length / 50000) * 100, 100);
  const charWarn = code.length > 45000;

  const handleAnalyze = async () => {
    if (!code.trim()) return setError('Please paste some code to analyze.');
    setError('');
    setLoading(true);
    try {
      const res = await analyzeAPI.analyze({ code, language });
      navigate('/analyze/results', {
        state: {
          result:          res.data.result,
          analysisId:      res.data.analysisId,
          code,
          language,
          processingTimeMs: res.data.processingTimeMs,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-4" style={{ minHeight: 'calc(100vh - 60px)' }}>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1">
            <i className="bi bi-cpu text-primary me-2" />
            AI Vulnerability Analyzer
          </h3>
          <p className="text-muted small mb-0">
            Paste your code below. AI will scan it for security vulnerabilities and provide detailed recommendations.
          </p>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary align-self-start"
          onClick={() => { setCode(SAMPLE_CODE); setLanguage('JavaScript'); setError(''); }}
        >
          <i className="bi bi-lightning-fill me-1 text-warning" />
          Load Sample
        </button>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-danger d-flex gap-2 py-2 mb-3">
          <i className="bi bi-exclamation-circle-fill flex-shrink-0 mt-1" />
          <span className="small">{error}</span>
        </div>
      )}

      <div className="row g-4" style={{ alignItems: 'stretch' }}>

        {/* ── Left: Code Editor ──────────────────────────────────────── */}
        <div className="col-lg-8 d-flex flex-column">
          <div className="card st-card flex-grow-1 d-flex flex-column" style={{ minHeight: 540 }}>

            {/* Card Header */}
            <div className="card-header d-flex justify-content-between align-items-center py-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3">
                <span className="fw-semibold">
                  <i className="bi bi-code-slash me-2 text-primary" />
                  Code Input
                </span>
                <select
                  className="form-select form-select-sm st-input"
                  style={{ width: 'auto', minWidth: 130 }}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loading}
                >
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>

              {/* Char counter bar */}
              <div className="d-flex align-items-center gap-2">
                <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${charPct}%`, height: '100%',
                    background: charWarn ? '#ef4444' : '#3b82f6',
                    borderRadius: 4, transition: 'width 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: charWarn ? '#ef4444' : '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {code.length.toLocaleString()} / 50,000
                </span>
              </div>
            </div>

            {/* Textarea */}
            <div className="position-relative flex-grow-1 d-flex flex-column">
              <textarea
                className="form-control st-code-editor flex-grow-1"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder={`Paste your ${language} code here…\n\nExample:\n  • JavaScript / TypeScript\n  • Python / Java / Go\n  • SQL queries, shell scripts, and more\n\nSupports up to 50,000 characters.`}
                spellCheck={false}
                disabled={loading}
                style={{ minHeight: 460, resize: 'vertical', borderRadius: '0 0 12px 12px' }}
              />

              {/* Paste hint — shown only when empty */}
              {!code && (
                <div
                  className="position-absolute d-flex flex-column align-items-center justify-content-center"
                  style={{
                    bottom: 32, right: 24,
                    pointerEvents: 'none',
                    opacity: 0.22,
                  }}
                >
                  <i className="bi bi-filetype-js" style={{ fontSize: 48, color: '#3b82f6' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────────────────── */}
        <div className="col-lg-4 d-flex flex-column gap-3">

          {/* Scan / Loading card */}
          <div className="card st-card">
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-2">
                  <div className="st-scan-animation mx-auto mb-3">
                    <div className="st-scan-ring" />
                    <i className="bi bi-shield-check text-primary" style={{ fontSize: 28 }} />
                  </div>
                  <div className="fw-semibold mb-1">Analyzing your code…</div>
                  <div className="text-muted small mb-3">AI is scanning for vulnerabilities</div>
                  <div className="progress st-progress" style={{ height: 4 }}>
                    <div className="progress-bar progress-bar-striped progress-bar-animated w-100" />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {/* Shield icon with glow */}
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                    <div style={{
                      position: 'absolute', inset: -8,
                      background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
                      borderRadius: '50%',
                    }} />
                    <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: 52, position: 'relative' }} />
                  </div>

                  <h6 className="fw-bold mb-1" style={{ fontSize: 15 }}>Ready to Scan</h6>
                  <p className="text-muted small mb-4" style={{ lineHeight: 1.6 }}>
                    Scans for OWASP Top 10, injection flaws,<br />authentication issues, and more.
                  </p>

                  <button
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    onClick={handleAnalyze}
                    disabled={!code.trim() || loading}
                    style={{ borderRadius: 8, fontSize: 14 }}
                  >
                    <i className="bi bi-cpu me-2" />
                    Analyze Code
                  </button>

                  {/* Code stats row */}
                  {code.trim() && (
                    <div className="d-flex justify-content-center gap-3 mt-3">
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        <i className="bi bi-file-code me-1" />
                        {code.split('\n').length} lines
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        <i className="bi bi-fonts me-1" />
                        {code.length.toLocaleString()} chars
                      </div>
                      <div style={{ fontSize: 11, color: '#3b82f6' }}>
                        <i className="bi bi-braces me-1" />
                        {language}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* What We Check */}
          <div className="card st-card flex-grow-1">
            <div className="card-header py-3">
              <span className="fw-semibold small">
                <i className="bi bi-patch-check-fill text-success me-2" />
                What We Check
              </span>
            </div>
            <div className="card-body p-3">
              <div className="row g-2">
                {CHECKS.map((item) => (
                  <div key={item.label} className="col-12">
                    <div
                      className="d-flex align-items-center gap-2 rounded px-2 py-2"
                      style={{
                        background: item.bg,
                        border: `1px solid ${item.color}22`,
                        borderRadius: 8,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: 26, height: 26,
                          background: `${item.color}20`,
                          borderRadius: 6,
                        }}
                      >
                        <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: 12 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;