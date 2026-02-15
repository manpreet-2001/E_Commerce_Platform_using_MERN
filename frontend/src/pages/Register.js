import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getPasswordRuleResults, isPasswordStrong, getPasswordErrorMessage } from '../utils/passwordStrength';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'customer',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // only for API / generic errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState('idle'); // 'idle' | 'checking' | 'taken' | 'available'
  const [emailCheckMessage, setEmailCheckMessage] = useState('');

  const { firstName, lastName, email, phone, role, password, confirmPassword, agreeTerms } = formData;

  const passwordRuleResults = useMemo(() => getPasswordRuleResults(password), [password]);
  const confirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const emailTaken = emailCheckStatus === 'taken';

  const getPhoneDigits = (value) => (value || '').replace(/\D/g, '');
  const isPhoneValid = (value) => getPhoneDigits(value).length === 10;
  const phoneInvalid = phone.length > 0 && !isPhoneValid(phone);

  const checkEmailAvailability = useCallback(async (emailValue) => {
    const trimmed = (emailValue || '').trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
      return;
    }
    setEmailCheckStatus('checking');
    setEmailCheckMessage('');
    try {
      const res = await axios.get('/api/auth/check-email', { params: { email: trimmed } });
      setEmailCheckStatus(res.data.available ? 'available' : 'taken');
      setEmailCheckMessage(res.data.message || '');
    } catch {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
    }
  }, []);

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
    if (name === 'email') setEmailCheckStatus('idle');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const err = {};

    if (!firstName.trim()) err.firstName = 'First name is required';
    if (!lastName.trim()) err.lastName = 'Last name is required';
    if (!email.trim()) err.email = 'Email is required';
    else if (emailTaken) err.email = emailCheckMessage || 'This email is already registered';
    if (!phone.trim()) err.phone = 'Phone number is required';
    else if (!isPhoneValid(phone)) err.phone = 'Phone number must be exactly 10 digits';
    if (!password) err.password = 'Password is required';
    else if (!isPasswordStrong(password)) err.password = getPasswordErrorMessage(password) || 'Password does not meet requirements';
    if (!confirmPassword) err.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) err.confirmPassword = 'Passwords do not match';
    if (!agreeTerms) err.agreeTerms = 'You must agree to the Terms of Service';

    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }

    setLoading(true);

    const result = await register(
      {
        name: `${firstName} ${lastName}`,
        email,
        password,
        role
      },
      { skipLogin: true }
    );

    if (result.success) {
      setSuccess('Successfully created new account. Redirecting to sign in…');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      const msg = result.message || '';
      if (msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: msg });
      } else {
        setError(msg);
      }
    }

    setLoading(false);
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
            <h2>Create Account</h2>
            <p>Join Store community today</p>
          </div>

          {error && <div className="auth-alert auth-alert-error">{error}</div>}
          {success && <div className="auth-alert auth-alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className={fieldErrors.firstName ? 'input-error' : ''}
                  />
                </div>
                {fieldErrors.firstName && <p className="field-error">{fieldErrors.firstName}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    className={fieldErrors.lastName ? 'input-error' : ''}
                  />
                </div>
                {fieldErrors.lastName && <p className="field-error">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  onBlur={() => checkEmailAvailability(email)}
                  placeholder="Enter your email"
                  className={fieldErrors.email || emailTaken ? 'input-error' : ''}
                />
              </div>
              {emailCheckStatus === 'checking' && <p className="field-hint">Checking email…</p>}
              {(fieldErrors.email || (emailCheckStatus === 'taken' && !fieldErrors.email)) && (
                <p className="field-error">{fieldErrors.email || emailCheckMessage || 'This email is already registered.'}</p>
              )}
              {emailCheckStatus === 'available' && !fieldErrors.email && (
                <p className="field-success">Email is available.</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number <span className="required-asterisk">*</span></label>
              <div className="input-wrapper has-prefix">
                <span className="input-icon input-icon-phone" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <span className="phone-prefix">+1 </span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className={fieldErrors.phone || phoneInvalid ? 'input-error' : ''}
                  maxLength={14}
                />
              </div>
              {(fieldErrors.phone || phoneInvalid) && (
                <p className="field-error">{fieldErrors.phone || 'Phone number must be exactly 10 digits'}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type</label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={handleChange}
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className={fieldErrors.password || (password.length > 0 && !isPasswordStrong(password)) ? 'input-error' : ''}
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
              {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
              <ul className="password-rules" aria-label="Password requirements">
                {passwordRuleResults.map((r) => (
                  <li key={r.id} className={r.pass ? 'password-rule-pass' : 'password-rule-fail'}>
                    <span className="password-rule-icon" aria-hidden>{r.pass ? '✓' : '○'}</span>
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper has-toggle">
                <span className="input-icon">🔒</span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={fieldErrors.confirmPassword || confirmMismatch ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {(fieldErrors.confirmPassword || confirmMismatch) && (
                <p className="field-error">{fieldErrors.confirmPassword || 'Passwords do not match'}</p>
              )}
            </div>

            <label className={`terms-label ${fieldErrors.agreeTerms ? 'terms-label-error' : ''}`}>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={agreeTerms}
                onChange={handleChange}
              />
              <span>
                I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
              </span>
            </label>
            {fieldErrors.agreeTerms && <p className="field-error">{fieldErrors.agreeTerms}</p>}

            <button
              type="submit"
              className={`btn-submit ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
