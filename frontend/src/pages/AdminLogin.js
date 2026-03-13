import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './Auth.css';
import './AdminLogin.css';

/**
 * Admin-only sign in. Shown at /admin when user is not logged in.
 * On success, only admins are allowed; others see "Admin access only" and can go to customer login.
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const { email, password, rememberMe } = formData;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    setError('');
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const err = {};
    if (!email.trim()) err.email = 'Email is required';
    else if (!email.includes('@')) err.email = 'Please enter a valid email address';
    if (!password) err.password = 'Password is required';

    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }

    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      if (result.user?.role === 'admin') {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
        return;
      }
      logout();
      setError('Please use the customer / vendor login page to sign in. This page is for administrators only.');
    } else {
      setError(result.message || 'Sign in failed');
    }

    setLoading(false);
  };

  return (
    <div className="auth-page admin-login-page">
      <Navbar />

      <div className="auth-hero admin-login-hero">
        <h1>Admin</h1>
        <p>Sign in to manage the platform</p>
      </div>

      <div className="auth-container">
        <div className="auth-card admin-login-card">
          <div className="auth-header">
            <h2>Admin Sign In</h2>
            <p>Administrator access only</p>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="admin-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  id="admin-email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Admin email"
                  className={fieldErrors.email ? 'input-error' : ''}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && <p className="form-field-error">{fieldErrors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  placeholder="Password"
                  className={fieldErrors.password ? 'input-error' : ''}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.password && <p className="form-field-error">{fieldErrors.password}</p>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className={`btn-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer admin-login-footer">
            <p>
              <Link to={ROUTES.LOGIN} className="admin-login-back">← Customer / Vendor login</Link>
            </p>
            <p className="admin-login-home">
              <Link to={ROUTES.HOME}>Back to store</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
