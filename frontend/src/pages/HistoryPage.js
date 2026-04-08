import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeAPI } from '../api';

const SEVERITY_COLOR = { Critical: 'danger', High: 'warning', Medium: 'primary', Low: 'secondary' };

const ScoreBadge = ({ score }) => {
  const color = score >= 8 ? 'success' : score >= 5 ? 'warning' : score >= 3 ? 'orange' : 'danger';
  return (
    <span className={`badge bg-${color === 'orange' ? 'warning' : color} fw-semibold`}>
      {score?.toFixed(1)}/10
    </span>
  );
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const res = await analyzeAPI.getHistory({ page, limit: 10 });
      setAnalyses(res.data.analyses);
      setPagination(res.data.pagination);
    } catch {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleExpand = async (analysis) => {
    if (expandedId === analysis._id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(analysis._id);
    setDetailLoading(true);
    try {
      const res = await analyzeAPI.getById(analysis._id);
      setDetail(res.data.analysis);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewResults = (analysis) => {
    if (!detail) return;
    navigate('/analyze/results', {
      state: {
        result: detail.result,
        analysisId: detail._id,
        code: detail.codeSnippet,
        language: detail.language,
      },
    });
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">
          <i className="bi bi-clock-history text-primary me-2" />
          Analysis History
        </h3>
        <p className="text-muted small mb-0">
          {pagination.total} total scan{pagination.total !== 1 ? 's' : ''} · Your past vulnerability analyses
        </p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex gap-2 py-2">
          <i className="bi bi-exclamation-circle-fill" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
          <p className="text-muted mt-2 small">Loading history…</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="card st-card">
          <div className="card-body text-center py-5 text-muted">
            <i className="bi bi-clock-history fs-1 d-block mb-3" />
            <h6>No analyses yet</h6>
            <p className="small mb-3">Run your first code scan to see results here.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/analyze')}>
              <i className="bi bi-cpu me-1" />
              Analyze Code
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card st-card">
            <div className="card-body p-0">
              {analyses.map((analysis, idx) => {
                const isExpanded = expandedId === analysis._id;
                const vulns = analysis.result?.vulnerabilities || [];
                const criticals = vulns.filter((v) => v.severity === 'Critical').length;
                const highs = vulns.filter((v) => v.severity === 'High').length;

                return (
                  <div key={analysis._id} className={`st-history-item ${idx !== analyses.length - 1 ? 'border-bottom border-secondary border-opacity-25' : ''}`}>
                    <div
                      className="d-flex align-items-center gap-3 p-3 cursor-pointer"
                      onClick={() => handleExpand(analysis)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Icon */}
                      <div className="st-history-icon">
                        <i className="bi bi-file-code text-primary" />
                      </div>

                      {/* Info */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="fw-medium">{analysis.language}</span>
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
                            {vulns.length} issues
                          </span>
                          {criticals > 0 && (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              {criticals} critical
                            </span>
                          )}
                          {highs > 0 && (
                            <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                              {highs} high
                            </span>
                          )}
                        </div>
                        <div className="text-muted small mt-1">
                          {new Date(analysis.createdAt).toLocaleString()}
                          {analysis.processingTimeMs && (
                            <span className="ms-2 opacity-75">
                              · {(analysis.processingTimeMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="d-flex align-items-center gap-3">
                        {analysis.result?.score !== undefined && (
                          <ScoreBadge score={analysis.result.score} />
                        )}
                        <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`} />
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="border-top border-secondary border-opacity-25 p-3 bg-dark bg-opacity-25">
                        {detailLoading ? (
                          <div className="text-center py-3">
                            <div className="spinner-border spinner-border-sm text-primary" />
                          </div>
                        ) : detail && detail._id === analysis._id ? (
                          <div>
                            {/* Summary */}
                            {detail.result?.summary && (
                              <p className="text-muted small mb-3">{detail.result.summary}</p>
                            )}

                            {/* Vulnerability mini-list */}
                            <div className="row g-2 mb-3">
                              {detail.result?.vulnerabilities?.slice(0, 6).map((v) => (
                                <div className="col-md-6" key={v.id}>
                                  <div className={`d-flex align-items-center gap-2 p-2 rounded border border-${SEVERITY_COLOR[v.severity]}-subtle`}>
                                    <span className={`badge bg-${SEVERITY_COLOR[v.severity]}`} style={{ fontSize: '0.65rem' }}>{v.severity}</span>
                                    <span className="small text-truncate">{v.title}</span>
                                  </div>
                                </div>
                              ))}
                              {detail.result?.vulnerabilities?.length > 6 && (
                                <div className="col-12">
                                  <span className="text-muted small">
                                    +{detail.result.vulnerabilities.length - 6} more vulnerabilities…
                                  </span>
                                </div>
                              )}
                            </div>

                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleViewResults(analysis)}
                            >
                              <i className="bi bi-eye me-1" />
                              View Full Results
                            </button>
                          </div>
                        ) : (
                          <p className="text-muted small mb-0">Could not load details.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => fetchHistory(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
