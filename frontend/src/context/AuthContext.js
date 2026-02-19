import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios base URL: use env var or empty (empty = same origin, proxy in dev)
axios.defaults.baseURL = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';

// Axios interceptor to always add token from localStorage to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios auth header when token changes (for backwards compatibility)
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user when token exists
  const loadUser = async () => {
    if (!token) return null;
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      return res.data.user;
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      loadUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Re-fetch current user (e.g. after profile update)
  const refreshUser = async () => {
    if (token) return loadUser();
    return null;
  };

  // Register user. Pass { skipLogin: true } to only create account and not log in (redirect to login page).
  const register = async (userData, options = {}) => {
    try {
      const res = await axios.post('/api/auth/register', userData);

      if (!options.skipLogin) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
      }

      return { success: true, message: res.data.message, user: res.data.user };
    } catch (error) {
      const data = error.response?.data;
      const message = data?.message || data?.error
        || (error.code === 'ERR_NETWORK' || !error.response
          ? 'Cannot connect to server. Make sure the backend is running (npm run dev in backend folder).'
          : `Registration failed${error.response?.status ? ` (${error.response.status})` : ''}`);
      return { success: false, message };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const trimmedPassword = (password || '').trim();
      const res = await axios.post('/api/auth/login', { email: normalizedEmail, password: trimmedPassword });
      
      const { token: newToken, user: newUser } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      
      return { success: true, message: res.data.message, user: newUser };
    } catch (error) {
      const message = error.response?.data?.message
        || (error.code === 'ERR_NETWORK' || !error.response
          ? 'Cannot connect to server. Make sure the backend is running (npm run dev in backend folder).'
          : 'Login failed');
      return { success: false, message };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    isAuthenticated,
    hasRole,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
