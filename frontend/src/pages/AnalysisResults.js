import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const SEVERITY_CONFIG = {
  Critical: { color: 'danger', icon: 'bi-exclamation-octagon-fill', bg: 'rgba(220,53,69,0.1)', border: '#dc3545' },
  High: { color: 'warning', icon: 'bi-exclamation-triangle-fill', bg: 'rgba(255,193,7,0.1)', border: '#ffc107' },
  Medium: { color: 'primary', icon: 'bi-exclamation-circle-fill', bg: 'rgba(13,110,253,0.1)', border: '#0d6efd' },
  Low: { color: 'secondary', icon: 'bi-info-circle-fill', bg: 'rgba(108,117,125,0.1)', border: '#6c757d' },
};

const ScoreMeter = ({ score }) => {
  const pct = (score / 10) * 100;
  const color = score >= 8 ? '#198754' : score >= 5 ? '#ffc107' : score >= 3 ? '#fd7e14' : '#dc3545';
  const label = score >= 8 ? 'Excellent' : score >= 5 ? 'Moderate' : score >= 3 ? 'Poor' : 'Critical';

  return (
    <div className="text-center">
      <div className="st-score-ring mx-auto mb-2" style={{ '--score-pct': `${pct}%`, '--score-color': color }}>
        <div className="st-score-inner">
          <span className="fs-2 fw-bold" style={{ color }}>{score.toFixed(1)}</span>
          <span className="small text-muted d-block">/10</span>
        </div>
      </div>
      <div className="fw-semibold" style={{ color }}>{label}</div>
      <div className="text-muted small">Security Score</div>
    </div>
  );
};

const VulnerabilityCard = ({ vuln, onConvert }) => {
  const cfg = SEVERITY_CONFIG[vuln.severity] || SEVERITY_CONFIG.Low;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="card mb-3 st-vuln-card"
      style={{ borderLeft: `4px solid ${cfg.border}`, background: cfg.bg }}
    >
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div className="d-flex align-items-start gap-2">
            <i className={`bi ${cfg.icon} text-${cfg.color} mt-1`} />
            <div>
              <div className="fw-semibold">
                {vuln.title}
                {vuln.line > 0 && (
                  <span className="badge bg-secondary ms-2 fw-normal" style={{ fontSize: '0.7rem' }}>
                    Line {vuln.line}
                  </span>
                )}
              </div>
              <span className={`badge bg-${cfg.color} mt-1`}>{vuln.severity}</span>
            </div>
          </div>
          <div className="d-flex gap-2 flex-shrink-0">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setExpanded((p) => !p)}
            >
              <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => onConvert(vuln)}
              title="Convert to Issue"
            >
              <i className="bi bi-plus-circle me-1" />
              Convert
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-top border-secondary border-opacity-25">
            <div className="mb-3">
              <div className="small fw-semibold text-muted text-uppercase mb-1 ls-wide">Description</div>
              <p className="small mb-0">{vuln.description}</p>
            </div>
            <div>
              <div className="small fw-semibold text-success text-uppercase mb-1">
                <i className="bi bi-lightbulb-fill me-1" />
                Recommendation
              </div>
              <p className="small mb-0 text-success">{vuln.suggestion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  if (!state?.result) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-exclamation-circle text-warning fs-1 d-block mb-3" />
        <h5>No analysis results found.</h5>
        <Link to="/analyze" className="btn btn-primary mt-2">Run New Analysis</Link>
      </div>
    );
  }

  const { result, analysisId, code, language, processingTimeMs } = state;
  const { vulnerabilities = [], score = 0, summary = '', language: detectedLang } = result;

  // Severity counts
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  vulnerabilities.forEach((v) => { if (counts[v.severity] !== undefined) counts[v.severity]++; });

  const handleConvert = (vuln) => {
    const priorityMap = { Critical: 'Critical', High: 'High', Medium: 'Medium', Low: 'Low' };
    navigate('/issues/new', {
      state: {
        prefill: {
          title: `[${vuln.severity}] ${vuln.title}`,
          description: `**Vulnerability:** ${vuln.title}\n\n**Description:** ${vuln.description}\n\n**Recommendation:** ${vuln.suggestion}\n\n**Detected in:** ${detectedLang || language} code\n**Line:** ${vuln.line > 0 ? vuln.line : 'Unknown'}`,
          priority: priorityMap[vuln.severity] || 'Medium',
          sourceVulnerability: { analysisId, vulnerabilityId: vuln.id, severity: vuln.severity },
        },
      },
    });
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/analyze')}>
          <i className="bi bi-arrow-left" />
        </button>
        <div className="flex-grow-1">
          <h4 className="fw-bold mb-0">Analysis Results</h4>
          <p className="text-muted small mb-0">
            {detectedLang || language} · {vulnerabilities.length} vulnerabilities found ·{' '}
            {processingTimeMs ? `${(processingTimeMs / 1000).toFixed(1)}s` : ''}
          </p>
        </div>
        <Link to="/analyze" className="btn btn-sm btn-primary">
          <i className="bi bi-arrow-repeat me-1" />
          New Scan
        </Link>
        <Link to="/history" className="btn btn-sm btn-outline-secondary">
          <i className="bi bi-clock-history me-1" />
          History
        </Link>
      </div>

      <div className="row g-4">
        {/* Left: Vulnerabilities */}
        <div className="col-lg-8">
          {/* Summary Card */}
          <div className="card st-card mb-4">
            <div className="card-body p-4">
              <h6 className="fw-semibold mb-2">
                <i className="bi bi-file-text text-primary me-2" />
                Summary
              </h6>
              <p className="text-muted mb-0">{summary}</p>
            </div>
          </div>

          {/* Vulnerability Cards */}
          <div className="card st-card">
            <div className="card-header py-3 d-flex justify-content-between align-items-center">
              <span className="fw-semibold">
                <i className="bi bi-bug me-2 text-danger" />
                Vulnerabilities
                <span className="badge bg-danger ms-2">{vulnerabilities.length}</span>
              </span>
              <small className="text-muted">Click a card to expand details</small>
            </div>
            <div className="card-body p-3">
              {vulnerabilities.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-shield-check text-success fs-1 d-block mb-2" />
                  <h6 className="text-success">No vulnerabilities detected!</h6>
                  <p className="text-muted small mb-0">Your code looks clean. Keep up the good work.</p>
                </div>
              ) : (
                <>
                  {/* Sort by severity */}
                  {['Critical', 'High', 'Medium', 'Low'].map((sev) =>
                    vulnerabilities
                      .filter((v) => v.severity === sev)
                      .map((v) => (
                        <VulnerabilityCard key={v.id} vuln={v} onConvert={handleConvert} />
                      ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Score + Stats */}
        <div className="col-lg-4">
          {/* Score */}
          <div className="card st-card mb-3">
            <div className="card-body p-4">
              <ScoreMeter score={score} />
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="card st-card mb-3">
            <div className="card-header py-3">
              <span className="fw-semibold small">
                <i className="bi bi-bar-chart me-2 text-primary" />
                Severity Breakdown
              </span>
            </div>
            <div className="card-body p-3">
              {Object.entries(counts).map(([sev, count]) => {
                const cfg = SEVERITY_CONFIG[sev];
                const pct = vulnerabilities.length > 0 ? (count / vulnerabilities.length) * 100 : 0;
                return (
                  <div key={sev} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${cfg.icon} text-${cfg.color} small`} />
                        <span className="small fw-medium">{sev}</span>
                      </div>
                      <span className={`badge bg-${cfg.color}`}>{count}</span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <div
                        className={`progress-bar bg-${cfg.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Code Preview */}
          {code && (
            <div className="card st-card">
              <div className="card-header py-3">
                <span className="fw-semibold small">
                  <i className="bi bi-code-slash me-2 text-primary" />
                  Scanned Code
                </span>
              </div>
              <div className="card-body p-0">
                <pre className="st-code-preview m-0 p-3">
                  <code>{code.substring(0, 500)}{code.length > 500 ? '\n\n… (truncated)' : ''}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
