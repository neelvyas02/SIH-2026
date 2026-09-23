import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await api.getCurrentUser();
          setUser(userData);
        } catch {
          clearAuthToken();
          setUser(null);
        }
      } else {
        // Auto-login default demo operator if desired or let user log in
        setUser({
          id: "demo-user-1",
          username: "admin",
          full_name: "Inspector V. Sharma (Lead)",
          role: "admin"
        });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.login(username, password);
      if (res.access_token) {
        setAuthToken(res.access_token);
      }
      setUser(res.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
