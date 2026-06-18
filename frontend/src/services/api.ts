// frontend/src/services/api.ts
import axios from "axios";

export const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handler - if the token is invalid/expired, clear the
// stale session so the app can fall back to its normal routing (landing
// page for guests). We deliberately do NOT force-navigate here; that's
// a hard browser redirect that bypasses React Router and leaves no
// "back" history entry. AuthContext's own bootstrap/guard logic already
// handles showing the right screen once `user` becomes null.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("pp_token");
      localStorage.removeItem("pp_user");
    }
    return Promise.reject(error);
  }
);

export default api;