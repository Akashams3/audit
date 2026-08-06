import React from 'react';
import { useAuth } from '../context/AuthContext';
import FacultyDashboard from './FacultyDashboard';
import IqacDashboard from './IqacDashboard';
import DirectorDashboard from './DirectorDashboard';
import { Navigate } from 'react-router-dom';

const DashboardHome = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'ROLE_FACULTY':
      return <FacultyDashboard />;
    case 'ROLE_INVIGILATOR':
    case 'ROLE_HOD':
      return <IqacDashboard />;
    case 'ROLE_DIRECTOR':
      return <DirectorDashboard />;
    default:
      return (
        <div className="p-8 text-center text-rose-500 font-bold">
          Unknown User Role: {user.role}
        </div>
      );
  }
};

export default DashboardHome;
