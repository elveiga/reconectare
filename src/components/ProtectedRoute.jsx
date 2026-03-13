import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUsers } from '@/contexts/DataUser';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, authLoading } = useUsers();

  if (authLoading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.mustChangePassword) {
    return <Navigate to="/alterar-senha" replace />;
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
