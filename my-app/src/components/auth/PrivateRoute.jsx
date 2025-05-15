import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const PrivateRoute = ({ adminOnly = false }) => {
  const { currentUser, loading, isAdmin } = useAuth();
  
  console.log('PrivateRoute check:', {
    loading,
    authenticated: !!currentUser,
    user: currentUser,
    adminRequired: adminOnly,
    isAdmin
  });
  
  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Check if route requires admin access
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Render the protected content
  return <Outlet />;
}; 