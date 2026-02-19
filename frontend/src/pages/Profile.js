import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && isEditing) {
      setForm({ name: user.name || '', email: user.email || '' });
      setFormError('');
    }
  }, [user, isEditing]);

  if (!user) {
    return null;
  }

  const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'vendor' ? 'Vendor' : 'Customer';

  const handleStartEdit = () => {
    setForm({ name: user.name || '', email: user.email || '' });
    setFormError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const name = (form.name || '').trim();
    const email = (form.email || '').trim().toLowerCase();
    if (!name) {
      setFormError('Name is required.');
      return;
    }
    if (name.length < 2) {
      setFormError('Name must be at least 2 characters.');
      return;
    }
    if (name.length > 50) {
      setFormError('Name cannot exceed 50 characters.');
      return;
    }
    if (!email) {
      setFormError('Email is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put('/api/auth/profile', { name, email });
      if (res.data.user) {
        await refreshUser();
      }
      setIsEditing(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update profile.';
      setFormError(msg);
    } finally {
      setSaving(false);
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

          <section className="profile-card">
            <div className="profile-avatar" aria-hidden="true">
              {(isEditing ? form.name : user.name)?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {isEditing ? (
              <form className="profile-form" onSubmit={handleSubmit}>
                {formError && <p className="profile-form-error" role="alert">{formError}</p>}
                <div className="profile-form-group">
                  <label htmlFor="profile-name" className="profile-field-label">Name</label>
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    className="profile-input"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    autoComplete="name"
                    maxLength={50}
                    disabled={saving}
                  />
                </div>
                <div className="profile-form-group">
                  <label htmlFor="profile-email" className="profile-field-label">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    className="profile-input"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={saving}
                  />
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
        </div>
      </main>
    </div>
  );
};

export default Profile;
