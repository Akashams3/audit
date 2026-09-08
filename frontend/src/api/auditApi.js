import { API_BASE_URL, API_ENDPOINTS, getAuthHeader } from "../constants/apiConstants";

export const auditApi = {
  getDirectorDashboard: async (academicYear, year) => {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    if (year) params.append("year", year);
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DIRECTOR.DASHBOARD}?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load director dashboard");
    return response.json();
  },

  getDepartmentsSummary: async (academicYear, year) => {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    if (year) params.append("year", year);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DIRECTOR.DEPARTMENTS}?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load department summary");
    return response.json();
  },

  getInvigilatorDashboard: async (academicYear, year) => {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    if (year) params.append("year", year);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INVIGILATOR.DASHBOARD}?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load invigilator dashboard");
    return response.json();
  },

  getFacultyStatus: async (academicYear, year) => {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    if (year) params.append("year", year);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INVIGILATOR.FACULTY_STATUS}?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load faculty audit status");
    return response.json();
  },

  getSchedules: async () => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DIRECTOR.SCHEDULES}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load audit schedules");
    return response.json();
  },

  createSchedule: async (scheduleData) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DIRECTOR.SCHEDULES}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(scheduleData)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Schedule creation failed" }));
      throw new Error(err.message || "Failed to create schedule");
    }
    return response.json();
  },

  submitFeedback: async (feedbackData) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DIRECTOR.FEEDBACK}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(feedbackData)
    });
    if (!response.ok) throw new Error("Failed to submit feedback");
    return response.json();
  },

  completeAudit: async (deptId) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DIRECTOR.COMPLETE_AUDIT(deptId)}`, {
      method: "POST",
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to complete audit");
    return response.json();
  }
};
