// src/services/auth.service.js
import api from "./api";

export const AuthService = {
  register: async (userData) => {
    const response = await api.post("customers/", userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("auth/token/", credentials);
    if (response.data.access) {
      localStorage.setItem("token", response.data.access);
      if (response.data.refresh) {
        localStorage.setItem("refreshToken", response.data.refresh);
      }
      await AuthService.getCurrentUser();
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: async () => {
    const response = await api.get("auth/user/");
    const userData = response.data;
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  isCustomer: () => {
    const user = AuthService.getUser();
    return user && user.is_customer;
  },

  isManager: () => {
    const user = AuthService.getUser();
    return (
      user &&
      user.is_employee &&
      user.employee &&
      user.employee.role === "manager"
    );
  },

  isAdmin: () => {
    const user = AuthService.getUser();
    return (
      user &&
      user.is_employee &&
      user.employee &&
      user.employee.role === "admin"
    );
  },

  isSupport: () => {
    const user = AuthService.getUser();
    return (
      user &&
      user.is_employee &&
      user.employee &&
      user.employee.role === "support"
    );
  },
};

export default AuthService;
