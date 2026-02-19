import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'vendor' ? 'Vendor' : 'Customer';

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
              {user.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
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
              <Link to="/profile" className="profile-btn profile-btn-primary">
                Edit profile
              </Link>
              <Link to="/" className="profile-btn profile-btn-secondary">
                Back to Home
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;
