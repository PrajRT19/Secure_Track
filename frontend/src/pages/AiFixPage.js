import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../api';
import DiffViewer from '../components/diff/DiffViewer';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#',
  'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'SQL', 'Bash/Shell', 'Solidity', 'Other',
];

const SEVERITY_CONFIG = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
  High:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Medium:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
  Low:      { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)' },
};

/* ─── Step indicator ─────────────────────────────────────────────────────── */
const Steps = ({ current }) => {
  const steps = [
    { n: 1, label: 'Paste Code' },
    { n: 2, label: 'Analyze' },
    { n: 3, label: 'Review Fix' },
    { n: 4, label: 'Apply' },
  ];
  return (
    <div className="st-steps">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className={`st-step ${current >= s.n ? 'done' : ''} ${current === s.n ? 'active' : ''}`}>
            <div className="st-step-circle">
              {current > s.n ? <i className="bi bi-check2" /> : s.n}
            </div>
            <span className="st-step-label">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`st-step-line ${current > s.n ? 'done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─── Vulnerability summary cards ────────────────────────────────────────── */
const VulnSummary = ({ vulnerabilities }) => (
  <div className="st-vuln-summary">
    {vulnerabilities.map((v) => {
      const cfg = SEVERITY_CONFIG[v.severity] || SEVERITY_CONFIG.Low;
      return (
        <div
          key={v.id}
          className="st-vuln-chip"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          <span style={{ color: cfg.color, fontWeight: 700, fontSize: 10 }}>{v.severity}</span>
          <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 4 }}>{v.title}</span>
          {v.line > 0 && (
            <span style={{ color: '#475569', fontSize: 10, marginLeft: 6 }}>L{v.line}</span>
          )}
        </div>
      );
    })}
  </div>
);

/* ─── Score badge ────────────────────────────────────────────────────────── */
const ScoreBadge = ({ score }) => {
  const color = score >= 8 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';
  const label = score >= 8 ? 'Secure' : score >= 5 ? 'Moderate Risk' : 'High Risk';
  return (
    <div className="d-flex align-items-center gap-2">
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: `conic-gradient(${color} ${(score / 10) * 100}%, rgba(255,255,255,0.06) 0%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
      }}>
        <div style={{
          position: 'absolute', inset: 5, borderRadius: '50%',
          background: 'var(--st-bg-card, #131820)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color
        }}>
          {score.toFixed(1)}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color }}>{label}</div>
        <div style={{ fontSize: 10, color: '#64748b' }}>Security Score</div>
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const AiFixPage = () => {
  const navigate = useNavigate();

  // Step 1 — Input
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('JavaScript');

  // Step 2 — Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisId, setAnalysisId] = useState(null);

  // Step 3 — Fix
  const [fixing, setFixing] = useState(false);
  const [fixResult, setFixResult] = useState(null);

  // Step 4 — Applied
  const [applied, setApplied] = useState(false);

  const [error, setError] = useState('');

  // Determine current step
  const currentStep = applied ? 4 : fixResult ? 3 : analysisResult ? 2 : 1;

  /* ─── Step 1 → 2: Analyze ──────────────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (!code.trim()) return setError('Please paste some code to analyze.');
    setError('');
    setAnalyzing(true);
    setAnalysisResult(null);
    setFixResult(null);
    setApplied(false);

    try {
      const res = await aiAPI.analyze({ code, language });
      setAnalysisResult(res.data.result);
      setAnalysisId(res.data.analysisId);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  /* ─── Step 2 → 3: Fix ─────────────────────────────────────────────────── */
  const handleFix = async () => {
    setError('');
    setFixing(true);
    try {
      const res = await aiAPI.fix({
        code,
        language,
        vulnerabilities: analysisResult?.vulnerabilities || [],
        analysisId,
      });
      setFixResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Fix generation failed. Please try again.');
    } finally {
      setFixing(false);
    }
  };

  /* ─── Step 3 → 4: Apply ───────────────────────────────────────────────── */
  const handleApplyFix = (fixedCode) => {
    setCode(fixedCode);
    setApplied(true);
    setFixResult(null);
    setAnalysisResult(null);
  };

  const handleDiscard = () => {
    setFixResult(null);
  };

  const handleReset = () => {
    setCode('');
    setAnalysisResult(null);
    setFixResult(null);
    setApplied(false);
    setError('');
  };

  const vulns = analysisResult?.vulnerabilities || [];
  const hasCritical = vulns.some((v) => v.severity === 'Critical' || v.severity === 'High');

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page header */}
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/analyze')}>
          <i className="bi bi-arrow-left" />
        </button>
        <div className="flex-grow-1">
          <h4 className="fw-bold mb-0">
            <i className="bi bi-magic text-primary me-2" />
            AI Auto-Fix
          </h4>
          <p className="text-muted small mb-0">
            Claude analyzes your code, generates a secure version, and shows you exactly what changed.
          </p>
        </div>
        {(analysisResult || fixResult || applied) && (
          <button className="btn btn-sm btn-outline-secondary" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise me-1" />
            Start Over
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <Steps current={currentStep} />

      {error && (
        <div className="alert alert-danger d-flex gap-2 py-2 mt-3">
          <i className="bi bi-exclamation-circle-fill flex-shrink-0 mt-1" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Step 4: Applied ─────────────────────────────────────────────── */}
      {applied && (
        <div className="card st-card mt-4">
          <div className="card-body text-center py-5">
            <div style={{ fontSize: 56, marginBottom: 12 }}>🛡</div>
            <h5 className="fw-bold mb-2 text-success">Fix Successfully Applied!</h5>
            <p className="text-muted small mb-4">
              Your code editor has been updated with the secured version. You can now re-analyze to confirm.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <button className="btn btn-primary" onClick={() => { setApplied(false); setAnalysisResult(null); }}>
                <i className="bi bi-cpu me-2" />
                Re-Analyze Fixed Code
              </button>
              <button className="btn btn-outline-secondary" onClick={() => navigate('/issues/new', {
                state: { prefill: { title: 'Security fix applied via AI Auto-Fix', description: `Fixed ${vulns.length} vulnerabilities in ${language} code.`, priority: 'Medium' } }
              })}>
                <i className="bi bi-plus-circle me-2" />
                Create Issue Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Diff Viewer (Step 3) ─────────────────────────────────────────── */}
      {fixResult && !applied && (
        <div className="mt-4">
          <DiffViewer
            originalCode={code}
            fixedCode={fixResult.fixedCode}
            language={language}
            linesChanged={fixResult.linesChanged}
            onApplyFix={handleApplyFix}
            onDiscard={handleDiscard}
          />
        </div>
      )}

      {/* ─── Analysis Results + Fix Button (Step 2) ──────────────────────── */}
      {analysisResult && !fixResult && !applied && (
        <div className="row g-4 mt-1">
          <div className="col-lg-8">
            <div className="card st-card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <span className="fw-semibold">
                  <i className="bi bi-bug-fill text-danger me-2" />
                  Detected Vulnerabilities
                  <span className="badge bg-danger ms-2">{vulns.length}</span>
                </span>
                <ScoreBadge score={analysisResult.score || 0} />
              </div>
              <div className="card-body p-3">
                <p className="text-muted small mb-3">{analysisResult.summary}</p>
                {vulns.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-shield-check text-success" style={{ fontSize: 36 }} />
                    <p className="text-success mt-2 mb-0 fw-semibold">No vulnerabilities found!</p>
                    <p className="text-muted small">Your code looks clean.</p>
                  </div>
                ) : (
                  <VulnSummary vulnerabilities={vulns} />
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card st-card h-100">
              <div className="card-body d-flex flex-column align-items-center justify-content-center p-4 text-center gap-3">
                {fixing ? (
                  <>
                    <div className="st-scan-animation">
                      <div className="st-scan-ring" />
                      <i className="bi bi-magic text-primary" style={{ fontSize: 28 }} />
                    </div>
                    <div>
                      <div className="fw-semibold mb-1">Generating secure version…</div>
                      <div className="text-muted small">Claude is rewriting your code</div>
                    </div>
                    <div className="progress st-progress w-100" style={{ height: 4 }}>
                      <div className="progress-bar progress-bar-striped progress-bar-animated w-100" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <i
                        className={`bi ${hasCritical ? 'bi-shield-exclamation text-danger' : 'bi-shield-check text-success'}`}
                        style={{ fontSize: 48 }}
                      />
                    </div>
                    <div>
                      <div className="fw-semibold mb-1">
                        {vulns.length > 0
                          ? `${vulns.length} issue${vulns.length !== 1 ? 's' : ''} found`
                          : 'Code looks clean'}
                      </div>
                      <div className="text-muted small mb-3">
                        {vulns.length > 0
                          ? 'Claude will rewrite your code to fix all vulnerabilities and show you a side-by-side diff.'
                          : 'No fixes needed. Your code appears secure.'}
                      </div>
                    </div>
                    {vulns.length > 0 && (
                      <button
                        className="btn btn-primary w-100 py-2 fw-semibold"
                        onClick={handleFix}
                      >
                        <i className="bi bi-magic me-2" />
                        Generate Secure Version
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Code Input (Step 1 always visible unless applied) ───────────── */}
      {!applied && !fixResult && (
        <div className="row g-4 mt-0">
          <div className="col-lg-8">
            <div className="card st-card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <span className="fw-semibold">
                    <i className="bi bi-code-slash text-primary me-2" />
                    Code Editor
                  </span>
                  <select
                    className="form-select form-select-sm st-input"
                    style={{ width: 'auto' }}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={analyzing || fixing}
                  >
                    {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <span style={{ fontSize: 11, color: '#475569' }}>
                  {code.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                className="st-code-editor"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); setAnalysisResult(null); }}
                placeholder={`Paste your ${language} code here to scan for vulnerabilities and auto-fix them…`}
                spellCheck={false}
                disabled={analyzing || fixing}
                style={{ minHeight: analysisResult ? 280 : 400 }}
              />
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card st-card h-100">
              <div className="card-body d-flex flex-column gap-3 p-4">
                {analyzing ? (
                  <div className="text-center py-3">
                    <div className="st-scan-animation mx-auto mb-3">
                      <div className="st-scan-ring" />
                      <i className="bi bi-shield-check text-primary" style={{ fontSize: 28 }} />
                    </div>
                    <div className="fw-semibold mb-1">Scanning for vulnerabilities…</div>
                    <div className="text-muted small">Claude AI is analyzing your code</div>
                    <div className="progress st-progress mt-3" style={{ height: 4 }}>
                      <div className="progress-bar progress-bar-striped progress-bar-animated w-100" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <i className="bi bi-magic text-primary" style={{ fontSize: 44 }} />
                      <h6 className="fw-bold mt-2 mb-1">AI Auto-Fix</h6>
                      <p className="text-muted small mb-0">
                        Two-pass AI workflow: detect vulnerabilities, then auto-generate a secure rewrite with a live diff.
                      </p>
                    </div>

                    <div className="st-workflow-steps">
                      {[
                        { icon: 'bi-search', label: 'Detect all vulnerabilities', done: !!analysisResult },
                        { icon: 'bi-magic', label: 'Generate secured rewrite', done: !!fixResult },
                        { icon: 'bi-file-diff', label: 'Review side-by-side diff', done: applied },
                        { icon: 'bi-check-circle', label: 'Apply fix with one click', done: applied },
                      ].map((s) => (
                        <div key={s.label} className="st-workflow-step">
                          <div className={`st-workflow-icon ${s.done ? 'done' : ''}`}>
                            <i className={`bi ${s.done ? 'bi-check2' : s.icon}`} />
                          </div>
                          <span className={`st-workflow-label ${s.done ? 'done' : ''}`}>{s.label}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-primary w-100 py-2 fw-semibold"
                      onClick={handleAnalyze}
                      disabled={!code.trim() || analyzing}
                    >
                      <i className="bi bi-cpu me-2" />
                      Step 1: Analyze Code
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiFixPage;
