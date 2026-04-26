import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor for authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Globally unwrap the StandardResponseMixin format
    if (response.data && response.data.data !== undefined && response.data.error === null) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const { status } = error.response || {};

    // Handle authentication errors
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Handle 403 Forbidden errors
    if (status === 403) {
      console.error("You do not have permission to perform this action");
    }

    return Promise.reject(error);
  }
);

export default api;
