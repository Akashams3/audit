import React from 'react';
import { useAuth } from '../context/AuthContext';
import FacultyDashboard from './FacultyDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import DirectorDashboard from './DirectorDashboard';
import { Navigate } from 'react-router-dom';

const DashboardHome = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user?.role || (Array.isArray(user?.roles) ? user.roles[0] : '') || '').toUpperCase();

  if (userRole.includes('DIRECTOR')) {
    return <DirectorDashboard />;
  }
  if (userRole.includes('FACULTY')) {
    return <FacultyDashboard />;
  }
  if (userRole.includes('INVIGILATOR') || userRole.includes('HOD') || userRole.includes('COORDINATOR')) {
    return <CoordinatorDashboard />;
  }

  return (
    <div className="p-8 text-center text-rose-500 font-bold">
      Unknown User Role: {userRole || JSON.stringify(user)}
    </div>
  );
};

export default DashboardHome;
