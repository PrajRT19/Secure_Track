import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-auth-wrapper">
      <div className="st-auth-bg" />
      <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
        <div className="st-auth-card card shadow-lg">
          {/* Header */}
          <div className="card-header text-center py-4 border-0">
            <div className="st-logo-wrap mb-3">
              <i className="bi bi-shield-lock-fill" />
            </div>
            <h2 className="fw-bold mb-1">
              Secure<span className="text-primary">Track</span>
            </h2>
            <p className="text-muted mb-0 small">Create your free account</p>
          </div>

          <div className="card-body p-4">
            <h5 className="fw-semibold mb-4">Register</h5>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2">
                <i className="bi bi-exclamation-circle-fill" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label fw-medium">Full Name</label>
                <div className="input-group">
                  <span className="input-group-text st-input-icon">
                    <i className="bi bi-person" />
                  </span>
                  <input
                    type="text"
                    className="form-control st-input"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Email address</label>
                <div className="input-group">
                  <span className="input-group-text st-input-icon">
                    <i className="bi bi-envelope" />
                  </span>
                  <input
                    type="email"
                    className="form-control st-input"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium">Password</label>
                <div className="input-group">
                  <span className="input-group-text st-input-icon">
                    <i className="bi bi-lock" />
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control st-input"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text st-input-icon"
                    onClick={() => setShowPass((p) => !p)}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium">Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text st-input-icon">
                    <i className="bi bi-lock-fill" />
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control st-input"
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating account…
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2" />
                    Create Account
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="card-footer text-center py-3 border-0">
            <span className="text-muted small">
              Already have an account?{' '}
              <Link to="/login" className="text-primary fw-medium">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
