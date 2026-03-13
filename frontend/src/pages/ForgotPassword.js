import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ROUTES } from '../constants/routes';
import Navbar from '../components/Navbar';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
    setFieldErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setFieldErrors({});

    const err = {};
    if (!email.trim()) err.email = 'Email is required';
    else if (!email.includes('@')) err.email = 'Please enter a valid email address';
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: email.trim() });
      if (res.data?.success) {
        setMessage(res.data.message || 'Check your email for a password reset link. The link expires in 1 hour.');
        setEmail('');
      } else {
        setError(res.data?.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Request failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-hero">
        <h1>Welcome to Store</h1>
        <p>Your trusted partner for quality electronics and accessories</p>
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Forgot password?</h2>
            <p>Enter your email and we&apos;ll send you a link to reset your password</p>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}
          {message && <div className="form-success" role="status">{message}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  id="forgot-email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={fieldErrors.email ? 'input-error' : ''}
                  disabled={loading}
                />
              </div>
              {fieldErrors.email && <p className="form-field-error">{fieldErrors.email}</p>}
            </div>

            <button
              type="submit"
              className={`btn-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : 'Send reset link'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Remember your password? <Link to={ROUTES.LOGIN}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
