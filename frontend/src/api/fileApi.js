import { API_BASE_URL, API_ENDPOINTS, getAuthHeader } from "../constants/apiConstants";

export const fileApi = {
  getFacultyFiles: async (academicYear, year, semester) => {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    if (year) params.append("year", year);
    if (semester) params.append("semester", semester);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FACULTY.FILES}?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load faculty files");
    return response.json();
  },

  getFacultyRequiredFiles: async (academicYear, year, semester) => {
    const params = new URLSearchParams();
    if (academicYear) params.append("academicYear", academicYear);
    if (year) params.append("year", year);
    if (semester) params.append("semester", semester);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FACULTY.REQUIRED_FILES}?${params.toString()}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load required files");
    return response.json();
  },

  uploadAcademicFile: async (formData) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FACULTY.UPLOAD_ACADEMIC}`, {
      method: "POST",
      headers: { ...getAuthHeader() }, // Browser automatically sets multipart boundary
      body: formData
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "File upload failed" }));
      throw new Error(err.message || "Failed to upload academic file");
    }
    return response.json();
  },

  uploadDepartmentFile: async (formData) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FACULTY.UPLOAD_DEPARTMENT}`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: formData
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "File upload failed" }));
      throw new Error(err.message || "Failed to upload department file");
    }
    return response.json();
  },

  deleteAcademicFile: async (id) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FILES.DELETE_ACADEMIC(id)}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to delete file");
    return response.json();
  },

  deleteDepartmentFile: async (id) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FILES.DELETE_DEPARTMENT(id)}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to delete file");
    return response.json();
  }
};
