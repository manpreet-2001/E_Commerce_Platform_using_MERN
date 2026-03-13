import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants/routes';
import PrivateRoute from './PrivateRoute';

/**
 * Protects routes for vendor only. Admin has a separate dashboard.
 * If admin visits /dashboard, redirect to admin dashboard.
 */
const VendorRoute = ({ children }) => {
  const { hasRole } = useAuth();

  if (hasRole(['admin'])) {
    return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  }
  return (
    <PrivateRoute>
      {hasRole(['vendor']) ? children : <Navigate to={ROUTES.HOME} replace />}
    </PrivateRoute>
  );
};

export default VendorRoute;
