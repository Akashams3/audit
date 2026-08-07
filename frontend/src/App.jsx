import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicYearProvider } from './context/AcademicYearContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import AcademicFileUpload from './pages/AcademicFileUpload';
import DepartmentFileUpload from './pages/DepartmentFileUpload';
import MyUploads from './pages/MyUploads';
import FeedbackHistoryPage from './pages/FeedbackHistoryPage';
import DepartmentsPage from './pages/DepartmentsPage';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import Profile from './pages/Profile';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import AuditStatusPage from './pages/AuditStatusPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import RemindersPage from './pages/RemindersPage';
import AuditorAccessPage from './pages/AuditorAccessPage';
import DirectorSchedulePage from './pages/DirectorSchedulePage';
import DirectorRequiredFilesPage from './pages/DirectorRequiredFilesPage';
import FacultyRequiredFilesPage from './pages/FacultyRequiredFilesPage';
import InvigilatorDueDatePage from './pages/InvigilatorDueDatePage';
import InvigilatorAssignWorkPage from './pages/InvigilatorAssignWorkPage';
import AddUserPage from './pages/AddUserPage';
import DirectorProgressPage from './pages/DirectorProgressPage';
import DirectorRolesPage from './pages/DirectorRolesPage';
import InvigilatorAddUserPage from './pages/InvigilatorAddUserPage';
import LateUploadRequestsPage from './pages/LateUploadRequestsPage';
import DirectorAuditStagePage from './pages/DirectorAuditStagePage';
import DirectorAuditHistoryPage from './pages/DirectorAuditHistoryPage';
import AuditLogPage from './pages/AuditLogPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App = () => {
  return (
    <AuthProvider>
      <AcademicYearProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Secure Switcher Home Route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes (accessible by Faculty, HOD, Invigilator, Director) */}
          <Route
            path="/upload-academic"
            element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <AcademicFileUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-department"
            element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <DepartmentFileUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-uploads"
            element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <MyUploads />
              </ProtectedRoute>
            }
          />

          {/* Invigilator Routes (accessible by Invigilator, Director) */}
          <Route
            path="/reminders"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <RemindersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/auditor"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auditor-access"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <AuditorAccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dept-files"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Invigilator Add Faculty & HoD */}
          <Route
            path="/invigilator/add-user"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <InvigilatorAddUserPage />
              </ProtectedRoute>
            }
          />

          {/* Invigilator Assign Work */}
          <Route
            path="/invigilator/assign-work"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <InvigilatorAssignWorkPage />
              </ProtectedRoute>
            }
          />

          {/* Director Schedule & Required Files & Stage Control */}
          <Route
            path="/director/audit-stage"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <DirectorAuditStagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/audit-history"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <DirectorAuditHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/schedule"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <DirectorSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/required-files"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <DirectorRequiredFilesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/progress"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <DirectorProgressPage />
              </ProtectedRoute>
            }
          />

          {/* Faculty Required Files (read-only) */}
          <Route
            path="/required-files"
            element={
              <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <FacultyRequiredFilesPage />
              </ProtectedRoute>
            }
          />

          {/* Invigilator Due Date Reminders */}
          <Route
            path="/due-date-reminders"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <InvigilatorDueDatePage />
              </ProtectedRoute>
            }
          />

          {/* Director Only Routes */}
          <Route
            path="/departments"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/director/add-invigilator"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <AddUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/add-faculty"
            element={
              <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                <AddUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/roles"
            element={
              <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_DIRECTOR', 'ROLE_INVIGILATOR']}>
                <DirectorRolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <DashboardHome />
              </ProtectedRoute>
            }
          />

          {/* Common Feedback Logs History */}
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_FACULTY', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                <FeedbackHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_FACULTY', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Notifications Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_FACULTY', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Reports Route */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Audit Status Route */}
          <Route
            path="/audit-status"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                <AuditStatusPage />
              </ProtectedRoute>
            }
          />

          {/* Late Upload Requests Routes */}
          <Route
            path="/director/late-requests"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <LateUploadRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/due-requests"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <LateUploadRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/due-requests"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_HOD', 'ROLE_INVIGILATOR']}>
                <LateUploadRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/late-requests"
            element={
              <ProtectedRoute allowedRoles={['ROLE_HOD']}>
                <LateUploadRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invigilator/late-requests"
            element={
              <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR']}>
                <LateUploadRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* Users Route */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* Settings Route */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Audit Logs Route */}
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AcademicYearProvider>
    </AuthProvider>
  );
};

export default App;
