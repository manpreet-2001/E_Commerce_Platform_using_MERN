import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from './PrivateRoute';

/**
 * Protects routes for vendor (and admin) only.
 * Requires authentication; redirects to / if user is not vendor or admin.
 */
const VendorRoute = ({ children }) => {
  const { hasRole } = useAuth();

  return (
    <PrivateRoute>
      {hasRole(['vendor', 'admin']) ? children : <Navigate to="/" replace />}
    </PrivateRoute>
  );
};

export default VendorRoute;
