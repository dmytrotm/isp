// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AuthService from "../services/auth.service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const user =
            AuthService.getUser() || (await AuthService.getCurrentUser());
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        AuthService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await AuthService.login(credentials);
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await AuthService.register(userData);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!currentUser,
    isCustomer: currentUser?.is_customer || false,
    isManager: currentUser?.employee?.role === "manager" || false,
    isAdmin: currentUser?.employee?.role === "admin" || false,
    isSupport: currentUser?.employee?.role === "support" || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
