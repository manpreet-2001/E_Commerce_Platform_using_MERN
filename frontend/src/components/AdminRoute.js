import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from './PrivateRoute';

/**
 * Protects routes for admin only. Vendors and customers are redirected to home.
 */
const AdminRoute = ({ children }) => {
  const { hasRole } = useAuth();

  return (
    <PrivateRoute>
      {hasRole(['admin']) ? children : <Navigate to="/" replace />}
    </PrivateRoute>
  );
};

export default AdminRoute;
