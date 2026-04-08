import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { issuesAPI } from '../api';

const IssueForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);

  // Pre-fill from vulnerability "Convert to Issue"
  const prefill = location.state?.prefill || {};

  const [form, setForm] = useState({
    title: prefill.title || '',
    description: prefill.description || '',
    status: 'Open',
    priority: prefill.priority || 'Medium',
    assignedTo: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // If editing, load existing issue
  useEffect(() => {
    if (!isEdit) return;
    const loadIssue = async () => {
      try {
        const res = await issuesAPI.getAll();
        const issue = res.data.issues.find((i) => i._id === id);
        if (!issue) return navigate('/dashboard');
        setForm({
          title: issue.title,
          description: issue.description,
          status: issue.status,
          priority: issue.priority,
          assignedTo: issue.assignedTo || '',
          tags: issue.tags?.join(', ') || '',
        });
      } catch {
        setError('Failed to load issue.');
      } finally {
        setFetchLoading(false);
      }
    };
    loadIssue();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      assignedTo: form.assignedTo,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      ...(prefill.sourceVulnerability && { sourceVulnerability: prefill.sourceVulnerability }),
    };

    try {
      if (isEdit) {
        await issuesAPI.update(id, payload);
        setSuccess('Issue updated successfully!');
      } else {
        await issuesAPI.create(payload);
        setSuccess('Issue created successfully!');
      }
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save issue.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <div>
          <h4 className="fw-bold mb-0">
            {isEdit ? 'Edit Issue' : 'Create New Issue'}
          </h4>
          <p className="text-muted small mb-0">
            {isEdit ? 'Update the issue details below.' : 'Fill in the details to create a new issue.'}
          </p>
        </div>
      </div>

      {/* Prefill notice */}
      {prefill.title && !isEdit && (
        <div className="alert alert-info d-flex gap-2 py-2 mb-3">
          <i className="bi bi-lightning-charge-fill" />
          <span>Pre-filled from vulnerability analysis. Review and adjust as needed.</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger d-flex gap-2 py-2">
          <i className="bi bi-exclamation-circle-fill" />
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success d-flex gap-2 py-2">
          <i className="bi bi-check-circle-fill" />
          {success}
        </div>
      )}

      <div className="card st-card">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit} noValidate>
            {/* Title */}
            <div className="mb-3">
              <label className="form-label fw-medium">Title <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control st-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Brief descriptive title"
                required
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label fw-medium">Description <span className="text-danger">*</span></label>
              <textarea
                className="form-control st-input"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Detailed description of the issue…"
                required
                maxLength={5000}
              />
              <div className="form-text text-end">{form.description.length}/5000</div>
            </div>

            <div className="row g-3 mb-3">
              {/* Status */}
              <div className="col-md-4">
                <label className="form-label fw-medium">Status</label>
                <select className="form-select st-input" name="status" value={form.status} onChange={handleChange}>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Closed</option>
                </select>
              </div>

              {/* Priority */}
              <div className="col-md-4">
                <label className="form-label fw-medium">Priority</label>
                <select className="form-select st-input" name="priority" value={form.priority} onChange={handleChange}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>

              {/* Assigned To */}
              <div className="col-md-4">
                <label className="form-label fw-medium">Assigned To</label>
                <input
                  type="text"
                  className="form-control st-input"
                  name="assignedTo"
                  value={form.assignedTo}
                  onChange={handleChange}
                  placeholder="e.g. alice@dev.com"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="form-label fw-medium">Tags</label>
              <input
                type="text"
                className="form-control st-input"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="security, sql-injection, xss (comma separated)"
              />
              <div className="form-text">Separate tags with commas</div>
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving…
                  </>
                ) : (
                  <>
                    <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} />
                    {isEdit ? 'Update Issue' : 'Create Issue'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IssueForm;
