/**
 * Protected Route Component
 * Handles route protection based on authentication and role
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress sx={{ color: '#dc2626' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, reason: 'auth' }}
        replace
      />
    );
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to unauthorized page
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location, reason: 'role' }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
