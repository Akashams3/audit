import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('iqac_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let msg = 'Authentication failed';
        try {
          const data = await response.json();
          msg = data.message || msg;
        } catch (e) {}
        throw new Error(msg);
      }

      const data = await response.json();
      localStorage.setItem('iqac_user', JSON.stringify(data));
      if (data.token || data.accessToken) {
        localStorage.setItem('token', data.token || data.accessToken);
      }
      setUser(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('iqac_user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    localStorage.setItem('iqac_user', JSON.stringify(updated));
    setUser(updated);
  };

  const authFetch = async (url, options = {}) => {
    let targetUrl = url;
    if (url.startsWith('http://localhost:8080')) {
      targetUrl = url.replace('http://localhost:8080', API_BASE_URL);
    } else if (url.startsWith('/api')) {
      targetUrl = `${API_BASE_URL}${url}`;
    }

    const headers = {
      ...options.headers,
    };

    // Read token from stored user object or standalone token key
    let token = null;
    try {
      const storedUser = JSON.parse(localStorage.getItem('iqac_user') || '{}');
      token = storedUser?.token || storedUser?.accessToken;
    } catch (e) {}
    if (!token) {
      token = localStorage.getItem('token');
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type header if sending FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(targetUrl, {
      ...options,
      headers,
    });

    if (response.status === 401 && token) {
      let isExpired = false;
      try {
        const clonedText = await response.clone().text();
        if (clonedText.toLowerCase().includes('expired') || clonedText.toLowerCase().includes('token')) {
          isExpired = true;
        }
      } catch (e) {}

      if (isExpired) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, authFetch, API_BASE_URL, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
