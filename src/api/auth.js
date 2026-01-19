/**
 * Authentication API (Backend Integration)
 */

import { API_BASE_URL, API_PREFIX } from './config';

/**
 * Register a new user
 */
export const register = async (userData) => {
  if (!userData.email || !userData.password || !userData.name || !userData.role) {
    return { success: false, error: 'All fields are required' };
  }

  if (userData.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        interests: userData.interests || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Registration failed' };
    }

    // Store token and user in localStorage
    localStorage.setItem('theloop_token', data.token);
    localStorage.setItem('theloop_user', JSON.stringify(data.user));

    return { success: true, data: data.user };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
};

/**
 * Login user
 */
export const login = async (email, password) => {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || 'Invalid credentials' };
    }

    // Store token and user in localStorage
    localStorage.setItem('theloop_token', data.token);
    localStorage.setItem('theloop_user', JSON.stringify(data.user));

    return { success: true, data: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  localStorage.removeItem('theloop_token');
  localStorage.removeItem('theloop_user');
  return { success: true };
};

/**
 * Get current user - uses cached data if available, otherwise fetches from backend
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem('theloop_token');
  const cachedUser = localStorage.getItem('theloop_user');
  
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  // If we have cached user data, return it immediately
  if (cachedUser) {
    try {
      const user = JSON.parse(cachedUser);
      return { success: true, data: user };
    } catch (e) {
      // Invalid JSON in cache, clear and continue to fetch
      localStorage.removeItem('theloop_user');
    }
  }

  // No cached user, fetch from backend
  try {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token is invalid or expired, clear storage
      localStorage.removeItem('theloop_token');
      localStorage.removeItem('theloop_user');
      return { success: false, error: 'Session expired. Please login again.' };
    }

    const user = await response.json();
    
    // Cache user data
    localStorage.setItem('theloop_user', JSON.stringify(user));
    
    return { success: true, data: user };
  } catch (error) {
    console.error('Get current user error:', error);
    // On network error, don't log the user out
    return { success: false, error: 'Network error. Please check your connection.' };
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, profileData) => {
  const token = localStorage.getItem('theloop_token');
  
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...profileData,
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.message || 'Failed to update profile' };
    }

    const updatedUser = await response.json();
    
    // Update cached user data
    localStorage.setItem('theloop_user', JSON.stringify(updatedUser));
    
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
};

/**
 * Change password (Note: Backend doesn't have this endpoint yet)
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    return { success: false, error: 'Both passwords are required' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters' };
  }
  
  // NOTE: Backend doesn't have a change password endpoint
  // This will need to be added to the backend
  return { success: false, error: 'Change password functionality not yet implemented on server' };
};

/**
 * Check if user is authenticated (based on token presence)
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('theloop_token');
};

/**
 * Get stored user from localStorage
 */
export const getStoredUser = () => {
  const user = localStorage.getItem('theloop_user');
  return user ? JSON.parse(user) : null;
};

/**
 * Get stored token from localStorage
 */
export const getStoredToken = () => {
  return localStorage.getItem('theloop_token');
};
