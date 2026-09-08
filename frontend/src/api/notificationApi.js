import { API_BASE_URL, API_ENDPOINTS, getAuthHeader } from "../constants/apiConstants";

export const notificationApi = {
  getNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.GET}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load notifications");
    return response.json();
  },

  getUnreadCount: async () => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT}`, {
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to load unread count");
    return response.json();
  },

  markAsRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)}`, {
      method: "PUT",
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
    return response.json();
  },

  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ}`, {
      method: "PUT",
      headers: { ...getAuthHeader() }
    });
    if (!response.ok) throw new Error("Failed to mark all notifications as read");
    return response.json();
  }
};
