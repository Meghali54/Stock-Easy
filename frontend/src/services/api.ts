import axios from "axios";

// In development: falls back to localhost.
// In production (Vercel): reads VITE_API_BASE_URL from .env.production
// which points to the Render backend URL.
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000/api";

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

// Clear stale session on 401 but do NOT hard-navigate — let React
// Router's own guards handle showing the right screen once user is null.
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