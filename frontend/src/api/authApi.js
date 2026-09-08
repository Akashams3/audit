import { API_BASE_URL, API_ENDPOINTS } from "../constants/apiConstants";

export const authApi = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Invalid credentials" }));
      throw new Error(err.message || "Login failed");
    }
    return response.json();
  }
};
