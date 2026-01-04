/**
 * Authentication API
 * 
 * NOTE: Currently using mock data - no actual API calls
 * 
 * ROUTES (for future backend):
 * -------
 * POST /users             - Register a new user
 * POST /users/login       - Login user
 * POST /users/logout      - Logout user
 * GET  /users/me          - Get current user profile
 * PUT  /users/profile     - Update user profile
 * PUT  /users/password    - Change password
 */

import api from './config';
import { v4 as uuidv4 } from 'uuid';

// Fake user for testing
const FAKE_USER = {
  id: 'fake-user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student',
  interests: ['technology', 'career', 'networking'],
  createdAt: new Date().toISOString(),
};

const FAKE_TOKEN = 'fake-jwt-token-for-testing';

/**
 * Register a new user
 * 
 * NOTE: Currently mock - validates but doesn't call API
 * Creates a fake user locally
 */
export const register = async (userData) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Validation is handled by the form, but we can do basic checks here
  if (!userData.email || !userData.password || !userData.name || !userData.role) {
    return { success: false, error: 'All fields are required' };
  }

  if (userData.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  // Create a mock user (no API call)
  const newUser = {
    id: uuidv4(),
    email: userData.email,
    name: userData.name,
    role: userData.role,
    interests: userData.interests || [],
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem('theloop_token', FAKE_TOKEN);
  localStorage.setItem('theloop_user', JSON.stringify(newUser));
  
  return { success: true, data: newUser };
};

/**
 * Login user
 * 
 * NOTE: Currently mock - accepts any credentials and returns fake user
 */
export const login = async (email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Basic validation
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  // Return fake user (no API call)
  const user = { ...FAKE_USER, email };
  
  localStorage.setItem('theloop_token', FAKE_TOKEN);
  localStorage.setItem('theloop_user', JSON.stringify(user));
  
  return { success: true, data: user };
};

/**
 * Logout user
 * NOTE: Mock - just clears localStorage
 */
export const logout = async () => {
  localStorage.removeItem('theloop_token');
  localStorage.removeItem('theloop_user');
  return { success: true };
};

/**
 * Get current user profile
 * NOTE: Mock - returns stored user from localStorage
 */
export const getCurrentUser = async () => {
  const storedUser = localStorage.getItem('theloop_user');
  if (storedUser) {
    return { success: true, data: JSON.parse(storedUser) };
  }
  return { success: false, error: 'Not authenticated' };
};

/**
 * Update user profile
 * NOTE: Mock - updates localStorage only
 */
export const updateProfile = async (userId, profileData) => {
  const storedUser = localStorage.getItem('theloop_user');
  if (!storedUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const user = JSON.parse(storedUser);
  const updatedUser = {
    ...user,
    ...profileData,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem('theloop_user', JSON.stringify(updatedUser));
  return { success: true, data: updatedUser };
};

/**
 * Change user password
 * NOTE: Mock - always succeeds
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!currentPassword || !newPassword) {
    return { success: false, error: 'Both passwords are required' };
  }
  if (newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters' };
  }
  
  return { success: true, data: { message: 'Password updated successfully' } };
};

/**
 * Check if user is authenticated (from localStorage)
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
