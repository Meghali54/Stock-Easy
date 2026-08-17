import axios from "axios";

// Determine the correct API base URL based on environment.
// Using window.location.hostname as a reliable runtime check
// so this works correctly regardless of build-time env vars.
const getApiBaseUrl = (): string => {
  // If running locally
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000/api";
  }
  // In production on Vercel - always use the correct Render backend
  return "https://stock-easy-jwhg.onrender.com/api";
};

export const API_BASE_URL = getApiBaseUrl();

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

// Clear stale session on 401 but do NOT hard-navigate
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
