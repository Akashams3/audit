import { API_BASE_URL, API_ENDPOINTS, getAuthHeader } from "../constants/apiConstants";

export const userApi = {
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.GET}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
  },

  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.UPDATE}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(profileData)
    });
    if (!response.ok) throw new Error("Failed to update profile");
    return response.json();
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.AVATAR}`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      body: formData
    });
    if (!response.ok) throw new Error("Failed to upload avatar image");
    return response.json();
  },

  getDirectorUsers: async () => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DIRECTOR.USERS}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load user list");
    return response.json();
  },

  createUser: async (userData) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.INVIGILATOR.CREATE_USER}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "User creation failed" }));
      throw new Error(err.message || "Failed to create user");
    }
    return response.json();
  }
};
