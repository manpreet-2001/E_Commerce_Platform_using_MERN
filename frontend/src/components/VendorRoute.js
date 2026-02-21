import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from './PrivateRoute';

/**
 * Protects routes for vendor only. Admin has a separate dashboard at /admin.
 * If admin visits /dashboard, redirect to /admin.
 */
const VendorRoute = ({ children }) => {
  const { hasRole } = useAuth();

  if (hasRole(['admin'])) {
    return <Navigate to="/admin" replace />;
  }
  return (
    <PrivateRoute>
      {hasRole(['vendor']) ? children : <Navigate to="/" replace />}
    </PrivateRoute>
  );
};

export default VendorRoute;
