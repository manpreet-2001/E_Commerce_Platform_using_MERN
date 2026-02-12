import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios base URL: use env var or empty (empty = same origin, proxy in dev)
axios.defaults.baseURL = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios auth header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user when token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data.user);
        } catch (error) {
          // Token invalid or expired
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setLoading(false);
    };

    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Register user
  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      
      const { token: newToken, user: newUser } = res.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      
      return { success: true, message: res.data.message, user: newUser };
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
    hasRole
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
