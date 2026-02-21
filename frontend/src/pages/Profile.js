import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { getPasswordErrorMessage, getPasswordRuleResults } from '../utils/passwordStrength';
import './Profile.css';

const SUCCESS_AUTO_HIDE_MS = 4000;

const NAME_MIN = 2;
const NAME_MAX = 50;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function validateName(name) {
  const t = (name || '').trim();
  if (!t) return 'Name is required.';
  if (t.length < NAME_MIN) return `Name must be at least ${NAME_MIN} characters.`;
  if (t.length > NAME_MAX) return `Name cannot exceed ${NAME_MAX} characters.`;
  return '';
}

function validateEmail(email) {
  const t = (email || '').trim().toLowerCase();
  if (!t) return 'Email is required.';
  if (!EMAIL_REGEX.test(t)) return 'Please enter a valid email address.';
  return '';
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, refreshUser, hasRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Vendors use Dashboard → Vendor Profile only; redirect to dashboard
  useEffect(() => {
    if (user && hasRole && hasRole(['vendor', 'admin'])) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, hasRole, navigate]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const nameInputRef = useRef(null);
  const successTimeoutRef = useRef(null);

  useEffect(() => {
    if (user && isEditing) {
      setForm({ name: user.name || '', email: user.email || '' });
      setFormError('');
      setFieldErrors({ name: '', email: '' });
    }
  }, [user, isEditing]);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage('');
      successTimeoutRef.current = null;
    }, SUCCESS_AUTO_HIDE_MS);
  };

  if (!user) {
    return null;
  }

  // Don't render profile page for vendors; they use Dashboard only
  if (hasRole && hasRole(['vendor', 'admin'])) {
    return null;
  }

  const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'vendor' ? 'Vendor' : 'Customer';

  const handleStartEdit = () => {
    setForm({ name: user.name || '', email: user.email || '' });
    setFormError('');
    setFieldErrors({ name: '', email: '' });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormError('');
    setFieldErrors({ name: '', email: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfileBlur = (e) => {
    const { name } = e.target;
    if (name === 'name') setFieldErrors((prev) => ({ ...prev, name: validateName(form.name) }));
    if (name === 'email') setFieldErrors((prev) => ({ ...prev, email: validateEmail(form.email) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const nameError = validateName(form.name);
    const emailError = validateEmail(form.email);
    setFieldErrors({ name: nameError, email: emailError });

    if (nameError || emailError) {
      const firstId = nameError ? 'profile-name' : 'profile-email';
      const el = document.getElementById(firstId);
      if (el) el.focus();
      return;
    }

    const name = (form.name || '').trim();
    const email = (form.email || '').trim().toLowerCase();
    setSaving(true);
    try {
      const res = await axios.put('/api/auth/profile', { name, email });
      if (res.data.user) {
        await refreshUser();
      }
      setIsEditing(false);
      showSuccess('Profile updated successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update profile.';
      setFormError(msg);
      setFieldErrors({ name: '', email: '' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordError('');
    setPasswordSuccess(false);
    if (passwordFieldErrors[name]) {
      setPasswordFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    const current = (passwordForm.currentPassword || '').trim();
    const newP = (passwordForm.newPassword || '').trim();
    const confirm = (passwordForm.confirmPassword || '').trim();

    const currentErr = !current ? 'Current password is required.' : '';
    const newErr = !newP ? 'New password is required.' : (getPasswordErrorMessage(newP) || '');
    const confirmErr = newP && newP !== confirm ? 'New password and confirmation do not match.' : '';

    setPasswordFieldErrors({
      currentPassword: currentErr,
      newPassword: newErr,
      confirmPassword: confirmErr,
    });

    if (currentErr || newErr || confirmErr) {
      const firstId = currentErr
        ? 'profile-current-password'
        : newErr
          ? 'profile-new-password'
          : 'profile-confirm-password';
      const el = document.getElementById(firstId);
      if (el) el.focus();
      return;
    }

    setPasswordSaving(true);
    try {
      await axios.put('/api/auth/password', { currentPassword: current, newPassword: newP });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordFieldErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(true);
      showSuccess('Password updated successfully.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      setPasswordError(msg);
      if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
        setPasswordFieldErrors((prev) => ({ ...prev, currentPassword: msg }));
      } else {
        setPasswordFieldErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <Navbar />
      <main className="profile-main">
        <div className="profile-container">
          <header className="profile-header">
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">View and manage your account information.</p>
          </header>

          {successMessage && (
            <div className="profile-success" role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          <section className="profile-card">
            <div className="profile-avatar" aria-hidden="true">
              {(isEditing ? form.name : user.name)?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {isEditing ? (
              <form
                className="profile-form"
                onSubmit={handleSubmit}
                aria-label="Edit profile"
                noValidate
              >
                <h2 className="profile-form-heading">Edit your profile</h2>
                {formError && <p className="profile-form-error" role="alert">{formError}</p>}
                <div className="profile-form-group">
                  <label htmlFor="profile-name" className="profile-field-label">
                    Name <span className="profile-required">*</span>
                  </label>
                  <p className="profile-field-hint-inline">2–50 characters</p>
                  <input
                    ref={nameInputRef}
                    id="profile-name"
                    type="text"
                    name="name"
                    className={`profile-input ${fieldErrors.name ? 'profile-input-invalid' : ''}`}
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleProfileBlur}
                    placeholder="Your name"
                    autoComplete="name"
                    minLength={NAME_MIN}
                    maxLength={NAME_MAX}
                    disabled={saving}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'profile-name-error' : undefined}
                  />
                  {fieldErrors.name && (
                    <p id="profile-name-error" className="profile-field-error" role="alert">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>
                <div className="profile-form-group">
                  <label htmlFor="profile-email" className="profile-field-label">
                    Email <span className="profile-required">*</span>
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    className={`profile-input ${fieldErrors.email ? 'profile-input-invalid' : ''}`}
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleProfileBlur}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={saving}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={fieldErrors.email ? 'profile-email-error' : undefined}
                  />
                  {fieldErrors.email && (
                    <p id="profile-email-error" className="profile-field-error" role="alert">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
                <p className="profile-field profile-role-readonly">
                  <span className="profile-field-label">Account type</span>
                  <span className="profile-field-value profile-role">{roleLabel}</span>
                  <span className="profile-field-hint">(cannot be changed)</span>
                </p>
                <div className="profile-actions">
                  <button type="submit" className="profile-btn profile-btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" className="profile-btn profile-btn-secondary" onClick={handleCancelEdit} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="profile-info">
                  <p className="profile-field">
                    <span className="profile-field-label">Name</span>
                    <span className="profile-field-value">{user.name || '—'}</span>
                  </p>
                  <p className="profile-field">
                    <span className="profile-field-label">Email</span>
                    <span className="profile-field-value">{user.email || '—'}</span>
                  </p>
                  <p className="profile-field">
                    <span className="profile-field-label">Account type</span>
                    <span className="profile-field-value profile-role">{roleLabel}</span>
                  </p>
                </div>
                <div className="profile-actions">
                  <button type="button" className="profile-btn profile-btn-primary" onClick={handleStartEdit}>
                    Edit profile
                  </button>
                  <Link to="/" className="profile-btn profile-btn-secondary">
                    Back to Home
                  </Link>
                </div>
              </>
            )}
          </section>

          <section className="profile-card profile-password-card">
            <h2 className="profile-password-heading">Change password</h2>
            <form className="profile-form profile-password-form" onSubmit={handlePasswordSubmit} aria-label="Change password">
              {passwordError && <p className="profile-form-error" role="alert">{passwordError}</p>}
              {passwordSuccess && (
                <p className="profile-success-inline" role="status">Password has been updated.</p>
              )}
              <div className="profile-form-group">
                <label htmlFor="profile-current-password" className="profile-field-label">
                  Current password <span className="profile-required">*</span>
                </label>
                <input
                  id="profile-current-password"
                  type="password"
                  name="currentPassword"
                  className={`profile-input ${passwordFieldErrors.currentPassword ? 'profile-input-invalid' : ''}`}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  disabled={passwordSaving}
                  aria-required="true"
                  aria-invalid={!!passwordFieldErrors.currentPassword}
                  aria-describedby={passwordFieldErrors.currentPassword ? 'profile-current-password-error' : undefined}
                />
                {passwordFieldErrors.currentPassword && (
                  <p id="profile-current-password-error" className="profile-field-error" role="alert">
                    {passwordFieldErrors.currentPassword}
                  </p>
                )}
              </div>
              <div className="profile-form-group">
                <label htmlFor="profile-new-password" className="profile-field-label">
                  New password <span className="profile-required">*</span>
                </label>
                <p className="profile-field-hint-inline">At least 8 characters, with uppercase, lowercase, number, and special character.</p>
                <input
                  id="profile-new-password"
                  type="password"
                  name="newPassword"
                  className={`profile-input ${passwordFieldErrors.newPassword ? 'profile-input-invalid' : ''}`}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  disabled={passwordSaving}
                  aria-required="true"
                  aria-invalid={!!passwordFieldErrors.newPassword}
                  aria-describedby={passwordFieldErrors.newPassword ? 'profile-new-password-error' : undefined}
                />
                {passwordFieldErrors.newPassword && (
                  <p id="profile-new-password-error" className="profile-field-error" role="alert">
                    {passwordFieldErrors.newPassword}
                  </p>
                )}
                {passwordForm.newPassword && (
                  <ul className="profile-password-rules" aria-live="polite">
                    {getPasswordRuleResults(passwordForm.newPassword).map((r) => (
                      <li key={r.id} className={r.pass ? 'profile-password-rule-pass' : 'profile-password-rule-fail'}>
                        {r.pass ? '✓' : '○'} {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="profile-form-group">
                <label htmlFor="profile-confirm-password" className="profile-field-label">
                  Confirm new password <span className="profile-required">*</span>
                </label>
                <input
                  id="profile-confirm-password"
                  type="password"
                  name="confirmPassword"
                  className={`profile-input ${passwordFieldErrors.confirmPassword ? 'profile-input-invalid' : ''}`}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={passwordSaving}
                  aria-required="true"
                  aria-invalid={!!passwordFieldErrors.confirmPassword}
                  aria-describedby={passwordFieldErrors.confirmPassword ? 'profile-confirm-password-error' : undefined}
                />
                {passwordFieldErrors.confirmPassword && (
                  <p id="profile-confirm-password-error" className="profile-field-error" role="alert">
                    {passwordFieldErrors.confirmPassword}
                  </p>
                )}
              </div>
              <div className="profile-actions">
                <button type="submit" className="profile-btn profile-btn-primary" disabled={passwordSaving}>
                  {passwordSaving ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;
