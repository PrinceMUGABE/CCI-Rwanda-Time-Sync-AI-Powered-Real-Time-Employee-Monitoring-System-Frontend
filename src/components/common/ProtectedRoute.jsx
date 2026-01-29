// components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user's role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to user's appropriate dashboard
    const roleRoutes = {
      admin: '/admin',
      employee: '/employee',
      supervisor: '/supervisor',
    };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  // All checks passed, render children
  return children;
};

export default ProtectedRoute;