import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicYearProvider } from './context/AcademicYearContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Lazy-loaded page components for high performance & clean code splitting
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const AcademicFileUpload = lazy(() => import('./pages/AcademicFileUpload'));
const DepartmentFileUpload = lazy(() => import('./pages/DepartmentFileUpload'));
const MyUploads = lazy(() => import('./pages/MyUploads'));
const FeedbackHistoryPage = lazy(() => import('./pages/FeedbackHistoryPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const CoordinatorDashboard = lazy(() => import('./pages/CoordinatorDashboard'));
const HODDashboard = lazy(() => import('./pages/HODDashboard'));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const DirectorDashboard = lazy(() => import('./pages/DirectorDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AuditStatusPage = lazy(() => import('./pages/AuditStatusPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const AuditorAccessPage = lazy(() => import('./pages/AuditorAccessPage'));
const DirectorSchedulePage = lazy(() => import('./pages/DirectorSchedulePage'));
const DirectorRequiredFilesPage = lazy(() => import('./pages/DirectorRequiredFilesPage'));
const FacultyRequiredFilesPage = lazy(() => import('./pages/FacultyRequiredFilesPage'));
const InvigilatorDueDatePage = lazy(() => import('./pages/InvigilatorDueDatePage'));
const InvigilatorAssignWorkPage = lazy(() => import('./pages/InvigilatorAssignWorkPage'));
const AddUserPage = lazy(() => import('./pages/AddUserPage'));
const DirectorProgressPage = lazy(() => import('./pages/DirectorProgressPage'));
const DirectorRolesPage = lazy(() => import('./pages/DirectorRolesPage'));
const InvigilatorAddUserPage = lazy(() => import('./pages/InvigilatorAddUserPage'));
const LateUploadRequestsPage = lazy(() => import('./pages/LateUploadRequestsPage'));
const DirectorAuditStagePage = lazy(() => import('./pages/DirectorAuditStagePage'));
const InvigilatorDashboard = lazy(() => import('./pages/InvigilatorDashboard'));
const DirectorAuditHistoryPage = lazy(() => import('./pages/DirectorAuditHistoryPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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

              {/* Role-Specific Dashboard Routes */}
              <Route
                path="/director"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invigilator"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <InvigilatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hod"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_DIRECTOR']}>
                    <HODDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Faculty Routes */}
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
              <Route
                path="/required-files"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <FacultyRequiredFilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/faculty-required-files"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <FacultyRequiredFilesPage />
                  </ProtectedRoute>
                }
              />

              {/* Invigilator Routes */}
              <Route
                path="/reminders"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <RemindersPage />
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
                path="/due-date"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <InvigilatorDueDatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/due-date-reminders"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <InvigilatorDueDatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assign-work"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <InvigilatorAssignWorkPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invigilator/assign-work"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <InvigilatorAssignWorkPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invigilator/add-user"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <InvigilatorAddUserPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/director/add-invigilator"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <InvigilatorAddUserPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hod/add-faculty"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_DIRECTOR']}>
                    <AddUserPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hod/roles"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_HOD', 'ROLE_DIRECTOR']}>
                    <DirectorRolesPage />
                  </ProtectedRoute>
                }
              />

              {/* Director Routes with Slash & Hyphen Aliases */}
              <Route
                path="/director-schedule"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorSchedulePage />
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
                path="/director-stage"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorAuditStagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/director/audit-stage"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorAuditStagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/director-required-files"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorRequiredFilesPage />
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
                path="/director-progress"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorProgressPage />
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
              <Route
                path="/director-roles"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorRolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/director/roles"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorRolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/director-history"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <DirectorAuditHistoryPage />
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
                path="/late-upload-requests"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_HOD', 'ROLE_INVIGILATOR']}>
                    <LateUploadRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/director/late-requests"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_HOD', 'ROLE_INVIGILATOR']}>
                    <LateUploadRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invigilator/late-requests"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_HOD', 'ROLE_INVIGILATOR']}>
                    <LateUploadRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hod/late-requests"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_HOD', 'ROLE_INVIGILATOR']}>
                    <LateUploadRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR']}>
                    <AuditLogPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Administrative & Utility Routes */}
              <Route
                path="/departments"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                    <DepartmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/coordinator"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <CoordinatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_FACULTY', 'ROLE_HOD', 'ROLE_INVIGILATOR', 'ROLE_DIRECTOR']}>
                    <FeedbackHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-status"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR', 'ROLE_HOD', 'ROLE_FACULTY']}>
                    <AuditStatusPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-user"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR', 'ROLE_HOD']}>
                    <AddUserPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_DIRECTOR', 'ROLE_INVIGILATOR']}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AcademicYearProvider>
    </AuthProvider>
  );
};

export default App;
