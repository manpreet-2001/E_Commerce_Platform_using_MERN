import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { getPasswordRuleResults, isPasswordStrong, getPasswordErrorMessage } from '../utils/passwordStrength';
import './Auth.css';

// Get token from URL so reset form shows when opening link from email (fallback if useSearchParams is empty)
function getTokenFromUrl(searchParams) {
  const fromParams = searchParams.get('token') || '';
  if (fromParams) return fromParams;
  if (typeof window !== 'undefined' && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  }
  return '';
}

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = getTokenFromUrl(searchParams);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { newPassword, confirmPassword } = formData;
  const confirmMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const err = {};
    if (!newPassword) err.newPassword = 'New password is required';
    else if (!isPasswordStrong(newPassword)) err.newPassword = getPasswordErrorMessage(newPassword) || 'Password does not meet requirements';
    if (!confirmPassword) err.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) err.confirmPassword = 'Passwords do not match';
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }

    if (!tokenFromUrl) {
      setError('Invalid or missing reset link. Please request a new password reset.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', {
        token: tokenFromUrl,
        newPassword: newPassword.trim()
      });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      } else {
        setError(res.data?.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenFromUrl && !success) {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-hero">
          <h1>Reset password</h1>
          <p>Use the link from your email to set a new password</p>
        </div>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-alert auth-alert-error">
              Invalid or missing reset link. Please use the link from your email or{' '}
              <Link to="/forgot-password">request a new password reset</Link>.
            </div>
            <div className="auth-footer">
              <p><Link to="/login">Back to Sign In</Link></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-hero">
          <h1>Password reset</h1>
          <p>Your password has been updated</p>
        </div>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-alert auth-alert-success">
              Password has been reset. Redirecting to sign in...
            </div>
            <p><Link to="/login">Sign in now</Link></p>
          </div>
        </div>
      </div>
    );
  }

  const passwordRuleResults = getPasswordRuleResults(newPassword);

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-hero">
        <h1>Reset password</h1>
        <p>Enter your new password and confirm it below</p>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Reset your password</h2>
            <p>Enter a new password below and confirm it. This link is valid for 1 hour.</p>
          </div>

          {error && <div className="auth-alert auth-alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword">New password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className={fieldErrors.newPassword ? 'input-error' : ''}
                  disabled={loading}
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
              {fieldErrors.newPassword && <p className="field-error">{fieldErrors.newPassword}</p>}
              {newPassword && (
                <ul className="password-rules">
                  {passwordRuleResults.map((r) => (
                    <li key={r.id} className={r.pass ? 'pass' : ''}>{r.label}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon">🔒</span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className={fieldErrors.confirmPassword || confirmMismatch ? 'input-error' : ''}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}
              {confirmMismatch && <p className="field-error">Passwords do not match</p>}
            </div>

            <button
              type="submit"
              className={`btn-submit ${loading ? 'loading' : ''}`}
              disabled={loading || confirmMismatch}
            >
              {loading ? <span className="spinner"></span> : 'Reset password'}
            </button>
          </form>

          <div className="auth-footer">
            <p><Link to="/login">Back to Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
