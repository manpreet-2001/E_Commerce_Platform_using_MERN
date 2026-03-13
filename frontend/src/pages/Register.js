import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { getPasswordRuleResults, isPasswordStrong, getPasswordErrorMessage } from '../utils/passwordStrength';
import './Auth.css';
import './About.css';

const REGISTER_DRAFT_KEY = 'register_form_draft';

const getInitialFormData = () => {
  try {
    const saved = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        firstName: parsed.firstName || '',
        lastName: parsed.lastName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        role: parsed.role || 'customer',
        password: '',
        confirmPassword: '',
        agreeTerms: parsed.agreeTerms || false
      };
    }
  } catch {
    // ignore
  }
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'customer',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  };
};

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState(getInitialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // only for API / generic errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [accountCreated, setAccountCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [policyModal, setPolicyModal] = useState(null); // 'terms' | 'privacy' | null

  const { firstName, lastName, email, phone, role, password, confirmPassword, agreeTerms } = formData;

  const passwordRuleResults = useMemo(() => getPasswordRuleResults(password), [password]);
  const confirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Persist form draft when user navigates to Terms/Privacy and back (exclude passwords for security)
  useEffect(() => {
    const draft = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      agreeTerms: formData.agreeTerms
    };
    sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
  }, [formData.firstName, formData.lastName, formData.email, formData.phone, formData.role, formData.agreeTerms]);

  // Close policy modal on Escape
  useEffect(() => {
    if (!policyModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setPolicyModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [policyModal]);

  const getPhoneDigits = (value) => (value || '').replace(/\D/g, '');
  const isPhoneValid = (value) => getPhoneDigits(value).length === 10;
  const phoneInvalid = phone.length > 0 && !isPhoneValid(phone);

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
    setAccountCreated(false);
    setFieldErrors({});

    const err = {};

    if (!firstName.trim()) err.firstName = 'First name is required';
    if (!lastName.trim()) err.lastName = 'Last name is required';
    if (!email.trim()) err.email = 'Email is required';
    else if (!email.includes('@')) err.email = 'Please enter a valid email address';
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
      sessionStorage.removeItem(REGISTER_DRAFT_KEY);
      setAccountCreated(true);
    } else {
      const msg = result.message || '';
      const isEmailError = msg.toLowerCase().includes('email') || msg.toLowerCase().includes('already exists');
      if (isEmailError) {
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

          {error && <div className="form-error" role="alert">{error}</div>}

          {accountCreated ? (
            <div className="auth-success-panel">
              <div className="auth-success-icon">✓</div>
              <h2 className="auth-success-title">Account created successfully</h2>
              <p className="auth-success-text">You can now sign in with your email and password.</p>
              <button
                type="button"
                className="btn-submit"
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                Continue to Sign In
              </button>
            </div>
          ) : (
          <>
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
                {fieldErrors.firstName && <p className="form-field-error">{fieldErrors.firstName}</p>}
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
                {fieldErrors.lastName && <p className="form-field-error">{fieldErrors.lastName}</p>}
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
                  placeholder="Enter your email"
                  className={fieldErrors.email ? 'input-error' : ''}
                />
              </div>
              {fieldErrors.email && <p className="form-field-error">{fieldErrors.email}</p>}
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
                <p className="form-field-error">{fieldErrors.phone || 'Phone number must be exactly 10 digits'}</p>
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
              {fieldErrors.password && <p className="form-field-error">{fieldErrors.password}</p>}
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
                <p className="form-field-error">{fieldErrors.confirmPassword || 'Passwords do not match'}</p>
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
                I agree to the{' '}
                <button type="button" className="terms-label-link" onClick={() => setPolicyModal('terms')}>Terms of Service</button>
                {' '}and{' '}
                <button type="button" className="terms-label-link" onClick={() => setPolicyModal('privacy')}>Privacy Policy</button>
              </span>
            </label>
            {fieldErrors.agreeTerms && <p className="form-field-error">{fieldErrors.agreeTerms}</p>}

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
              Already have an account? <Link to={ROUTES.LOGIN}>Sign In</Link>
            </p>
          </div>
          </>
          )}
        </div>
      </div>

      {policyModal && (
        <div
          className="auth-policy-modal-backdrop"
          onClick={() => setPolicyModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-policy-modal-title"
        >
          <div
            className="auth-policy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-policy-modal-header">
              <h2 id="auth-policy-modal-title" className="auth-policy-modal-title">
                {policyModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <button
                type="button"
                className="auth-policy-modal-close"
                onClick={() => setPolicyModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="auth-policy-modal-body">
              {policyModal === 'terms' && (
                <div className="about-container auth-policy-modal-inner">
                  <p className="about-lead">Please read these terms before using CityTech Store.</p>
                  <section className="about-section">
                    <h2>Acceptance of terms</h2>
                    <p>By creating an account, placing an order, or using this website, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.</p>
                  </section>
                  <section className="about-section">
                    <h2>Use of the service</h2>
                    <p>You may use CityTech Store to browse products, create an account, place orders, and access order history. You must provide accurate information and keep your account secure. You may not use the site for any illegal purpose or to violate any applicable laws.</p>
                  </section>
                  <section className="about-section">
                    <h2>Orders and payment</h2>
                    <p>Orders are subject to availability and acceptance. We reserve the right to refuse or cancel orders. Payment terms (including Cash on Delivery or card) are as stated at checkout. Prices and promotions may change without notice.</p>
                  </section>
                  <section className="about-section">
                    <h2>Returns and refunds</h2>
                    <p>Our return and refund policy is described on the Returns page. By placing an order, you agree to that policy. Contact us for any questions about returns.</p>
                  </section>
                  <section className="about-section">
                    <h2>Contact</h2>
                    <p>For questions about these terms, visit our <Link to={ROUTES.CONTACT}>Contact</Link> page.</p>
                  </section>
                </div>
              )}
              {policyModal === 'privacy' && (
                <div className="about-container auth-policy-modal-inner">
                  <p className="about-lead">How CityTech Store collects, uses, and protects your information.</p>
                  <section className="about-section">
                    <h2>Information we collect</h2>
                    <p>When you register, place an order, or contact us, we may collect your name, email address, shipping address, and payment-related information as needed to process orders and provide customer support.</p>
                  </section>
                  <section className="about-section">
                    <h2>How we use your information</h2>
                    <p>We use your information to process orders, send order and account-related emails (e.g. order confirmation, status updates), improve our service, and comply with legal obligations. We do not sell your personal information to third parties for marketing.</p>
                  </section>
                  <section className="about-section">
                    <h2>Security</h2>
                    <p>We take reasonable steps to protect your data, including secure connections and secure storage of account and order information. Passwords are stored in encrypted form.</p>
                  </section>
                  <section className="about-section">
                    <h2>Cookies and usage data</h2>
                    <p>We may use cookies and similar technologies to keep you signed in and to improve site functionality. You can adjust your browser settings to limit or block cookies.</p>
                  </section>
                  <section className="about-section">
                    <h2>Contact</h2>
                    <p>For privacy-related questions, visit our <Link to={ROUTES.CONTACT}>Contact</Link> page.</p>
                  </section>
                </div>
              )}
            </div>
            <div className="auth-policy-modal-actions">
              <button type="button" className="auth-policy-modal-cancel" onClick={() => setPolicyModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
