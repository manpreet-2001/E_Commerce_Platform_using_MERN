import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';

/**
 * Handles /admin route: show Admin Login when not authenticated,
 * Admin Dashboard when logged in as admin, otherwise redirect.
 */
const AdminGate = () => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <AdminLogin />;
  }

  if (hasRole(['admin'])) {
    return <AdminDashboard />;
  }

  if (hasRole(['vendor'])) {
    return <Navigate to={ROUTES.VENDOR_DASHBOARD} replace />;
  }

  return <Navigate to={ROUTES.HOME} replace />;
};

export default AdminGate;
