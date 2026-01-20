 

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

    // Listen for unauthorized events from API layer to force re-login
    const onUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('theloop:unauthorized', onUnauthorized);
    }

    // Periodically check token expiry to proactively log out
    const interval = setInterval(() => {
      try {
        const token = localStorage.getItem('theloop_token');
        if (!token) return;
        const parts = token.split('.');
        if (parts.length !== 3) {
          localStorage.removeItem('theloop_token');
          localStorage.removeItem('theloop_user');
          onUnauthorized();
          return;
        }
        const pad = (s) => s + '='.repeat((4 - (s.length % 4)) % 4);
        const b64 = pad(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const decoded = typeof window !== 'undefined' ? window.atob(b64) : Buffer.from(b64, 'base64').toString('binary');
        const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
        const json = new TextDecoder('utf-8').decode(bytes);
        const payload = JSON.parse(json);
        const nowSec = Math.floor(Date.now() / 1000);
        if (!payload.exp || payload.exp <= nowSec) {
          localStorage.removeItem('theloop_token');
          localStorage.removeItem('theloop_user');
          onUnauthorized();
        }
      } catch {
        // Ignore decode errors
      }
    }, 30000); // 30s cadence

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('theloop:unauthorized', onUnauthorized);
      }
      clearInterval(interval);
    };
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
