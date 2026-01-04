/**
 * Authentication Context
 * Manages user authentication state
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';
import { initializeStorage } from '../data/storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize storage and check for existing session
  useEffect(() => {
    const initAuth = async () => {
      initializeStorage();
      
      const result = await authApi.getCurrentUser();
      if (result.success) {
        setUser(result.data);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    const result = await authApi.login(email, password);
    
    if (result.success) {
      setUser(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    const result = await authApi.register(userData);
    
    if (result.success) {
      setUser(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    
    await authApi.logout();
    setUser(null);
    
    setLoading(false);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    setLoading(true);
    setError(null);
    
    const result = await authApi.updateProfile(user.id, updates);
    
    if (result.success) {
      setUser(result.data);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [user]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    setLoading(true);
    setError(null);
    
    const result = await authApi.changePassword(user.id, currentPassword, newPassword);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
    return result;
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isStudent: user?.role === 'student',
    isOrganiser: user?.role === 'organiser',
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
