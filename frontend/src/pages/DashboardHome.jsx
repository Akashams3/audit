import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardHome = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'ROLE_DIRECTOR':    return <Navigate to="/director" replace />;
    case 'ROLE_INVIGILATOR': return <Navigate to="/invigilator" replace />;
    case 'ROLE_HOD':         return <Navigate to="/hod" replace />;
    case 'ROLE_FACULTY':     return <Navigate to="/faculty" replace />;
    default:                 return <Navigate to="/faculty" replace />;
  }
};

export default DashboardHome;
