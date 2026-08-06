import api from "../api/api";

export const testConnection = async () => {
  try {
    const response = await api.get("/iqac/department");
    console.log("✅ Backend connection successful!");
    return { success: true, message: "Connected to backend" };
  } catch (error) {
    if (error.code === "ERR_NETWORK") {
      console.error("❌ Backend not reachable. Is it running on http://localhost:8080?");
      return { success: false, message: "Backend not reachable" };
    } else if (error.response?.status === 401) {
      console.log("✅ Backend reachable but authentication required");
      return { success: true, message: "Backend reachable (auth required)" };
    } else {
      console.error("❌ Connection error:", error.message);
      return { success: false, message: error.message };
    }
  }
};

export const testLogin = async (username, password) => {
  try {
    const response = await api.post("/iqac/auth/login", { username, password });
    console.log("✅ Login successful!");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};
