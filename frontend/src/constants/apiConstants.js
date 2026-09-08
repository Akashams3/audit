// API Constants & Endpoint Registry — Single Source of Truth

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const getAuthHeader = () => {
  const token = localStorage.getItem('iqac_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login'
  },
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile',
    AVATAR: '/api/profile/avatar'
  },
  DIRECTOR: {
    DASHBOARD: '/api/director/dashboard',
    DEPARTMENTS: '/api/director/departments-summary',
    PROGRESS: '/api/director/progress',
    SCHEDULES: '/api/director/schedules',
    ACTIVE_SCHEDULE: '/api/director/active-schedule',
    PUBLISH_SCHEDULE: (id) => `/api/director/schedules/${id}/publish`,
    DELETE_SCHEDULE: (id) => `/api/director/schedules/${id}`,
    REQUIRED_FILES: '/api/director/required-files',
    REQUIRED_FILE: (id) => `/api/director/required-files/${id}`,
    COMPLETE_AUDIT: (deptId) => `/api/director/complete-audit/${deptId}`,
    CLEAR_REQUIRED_FILES: '/api/director/clear-required-files',
    AUDIT_STAGE: '/api/director/audit-stage',
    TRIGGER_AUDIT_STAGE: '/api/director/trigger-audit-stage',
    AUDIT_HISTORY: '/api/director/audit-history',
    AUDIT_LOGS: '/api/director/audit-logs',
    AUDIT_STATUS: '/api/director/audit-status',
    LATE_REQUESTS: '/api/director/late-upload-requests',
    APPROVE_LATE: (id) => `/api/director/late-upload-requests/${id}/approve`,
    REJECT_LATE: (id) => `/api/director/late-upload-requests/${id}/reject`,
    FEEDBACK: '/api/director/feedback',
    ACADEMIC_FILES: '/api/director/academic-files',
    DEPT_FILES: '/api/director/department-files',
    USERS: '/api/director/users',
    CREATE_INVIGILATOR: '/api/director/create-invigilator',
    CALENDAR: '/api/director/academic-calendar',
    EXTRACT_DATES: '/api/director/academic-calendar/extract-dates',
    AUDITS: '/api/director/audits',
    AUDITS_BATCH: '/api/director/audits/batch',
    REPORTS_PDF: '/api/director/reports/pdf'
  },
  INVIGILATOR: {
    DASHBOARD: '/api/invigilator/dashboard',
    FACULTY_STATUS: '/api/invigilator/faculty-status',
    REQUIRED_FILES: '/api/invigilator/required-files',
    NOTIFY_AUDITOR: '/api/invigilator/notify-auditor',
    SEND_REMINDER: '/api/invigilator/send-reminder',
    CREATE_USER: '/api/invigilator/users',
    DUE_DATES: '/api/invigilator/due-dates',
    ASSIGN_WORK: '/api/invigilator/assign-work',
    LATE_REQUESTS: '/api/invigilator/late-upload-requests',
    ACADEMIC_FILES: '/api/invigilator/academic-files',
    DEPT_FILES: '/api/invigilator/department-files'
  },
  HOD: {
    DASHBOARD: '/api/hod/dashboard',
    FACULTY: '/api/hod/faculties',
    CREATE_FACULTY: '/api/hod/faculty',
    FACULTY_ROLES: '/api/hod/faculty-roles',
    FACULTY_ROLE: (id) => `/api/hod/faculty-roles/${id}`,
    ASSIGN_ROLE: (id) => `/api/hod/faculties/${id}/assign-role`,
    ASSIGNMENTS: '/api/hod/assignments',
    LATE_REQUESTS: '/api/hod/late-upload-requests'
  },
  FACULTY: {
    FILES: '/api/faculty/files',
    ACADEMIC_FILES: '/api/faculty/academic-files',
    DEPT_FILES: '/api/faculty/department-files',
    UPLOAD_ACADEMIC: '/api/faculty/academic-files',
    UPLOAD_DEPARTMENT: '/api/faculty/department-files',
    REQUIRED_FILES: '/api/faculty/required-files',
    UPLOAD_STATUS: '/api/faculty/upload-status',
    LATE_REQUEST: '/api/faculty/late-upload-request',
    FILE_VERSIONS: (category, id) => `/api/faculty/files/${category}/${id}/versions`,
    CALENDAR: '/api/faculty/academic-calendar'
  },
  FILES: {
    DOWNLOAD_ACADEMIC: (id) => `/api/files/download/academic/${id}?token=${localStorage.getItem('token')}`,
    DOWNLOAD_DEPARTMENT: (id) => `/api/files/download/department/${id}?token=${localStorage.getItem('token')}`,
    VIEW_ACADEMIC: (id) => `/api/files/view/academic/${id}?token=${localStorage.getItem('token')}`,
    VIEW_DEPARTMENT: (id) => `/api/files/view/department/${id}?token=${localStorage.getItem('token')}`
  },
  NOTIFICATIONS: {
    GET: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all'
  }
};
