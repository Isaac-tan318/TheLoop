/**
 * Authentication API
 * 
 * ROUTES:
 * -------
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login    - Login user
 * POST /api/auth/logout   - Logout user
 * GET  /api/auth/me       - Get current user profile
 * PUT  /api/auth/profile  - Update user profile
 * PUT  /api/auth/password - Change password
 */

import api from './config';

/**
 * Register a new user
 * 
 * Route: POST /api/auth/register
 * 
 * Request Payload:
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123",
 *   "name": "John Doe",
 *   "role": "student" | "organiser",
 *   "interests": ["technology", "career", "networking"]
 * }
 * 
 * Response:
 * {
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "role": "student",
 *     "interests": ["technology", "career"],
 *     "createdAt": "2026-01-04T10:00:00.000Z"
 *   },
 *   "token": "jwt_token_here"
 * }
 */
export const register = async (userData) => {
  const result = await api.post('/auth/register', {
    email: userData.email,
    password: userData.password,
    name: userData.name || userData.email.split('@')[0],
    role: userData.role,
    interests: userData.interests || [],
  });

  if (result.success) {
    localStorage.setItem('theloop_token', result.data.token);
    localStorage.setItem('theloop_user', JSON.stringify(result.data.user));
    return { success: true, data: result.data.user };
  }

  return result;
};

/**
 * Login user
 * 
 * Route: POST /api/auth/login
 * 
 * Request Payload:
 * {
 *   "email": "user@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * Response:
 * {
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "role": "student",
 *     "interests": ["technology", "career"],
 *     "createdAt": "2026-01-04T10:00:00.000Z"
 *   },
 *   "token": "jwt_token_here"
 * }
 */
export const login = async (email, password) => {
  const result = await api.post('/auth/login', { email, password });

  if (result.success) {
    localStorage.setItem('theloop_token', result.data.token);
    localStorage.setItem('theloop_user', JSON.stringify(result.data.user));
    return { success: true, data: result.data.user };
  }

  return result;
};

/**
 * Logout user
 * 
 * Route: POST /api/auth/logout
 * 
 * Request: Authorization header with JWT token
 * 
 * Response:
 * {
 *   "message": "Logged out successfully"
 * }
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout', {});
  } catch (error) {
    console.error('Logout API error:', error);
  }

  localStorage.removeItem('theloop_token');
  localStorage.removeItem('theloop_user');

  return { success: true };
};

/**
 * Get current user profile
 * 
 * Route: GET /api/auth/me
 * 
 * Request: Authorization header with JWT token
 * 
 * Response:
 * {
 *   "id": "uuid",
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "role": "student",
 *   "interests": ["technology", "career"],
 *   "eventsSignedUp": ["event-id-1", "event-id-2"],
 *   "createdAt": "2026-01-04T10:00:00.000Z"
 * }
 */
export const getCurrentUser = async () => {
  const result = await api.get('/auth/me');

  if (result.success) {
    localStorage.setItem('theloop_user', JSON.stringify(result.data));
  }

  return result;
};

/**
 * Update user profile
 * 
 * Route: PUT /api/auth/profile
 * 
 * Request Payload:
 * {
 *   "name": "Updated Name",
 *   "interests": ["technology", "career", "sports"]
 * }
 * 
 * Response:
 * {
 *   "id": "uuid",
 *   "email": "user@example.com",
 *   "name": "Updated Name",
 *   "role": "student",
 *   "interests": ["technology", "career", "sports"],
 *   "createdAt": "2026-01-04T10:00:00.000Z",
 *   "updatedAt": "2026-01-04T12:00:00.000Z"
 * }
 */
export const updateProfile = async (userId, profileData) => {
  const result = await api.put('/auth/profile', profileData);

  if (result.success) {
    localStorage.setItem('theloop_user', JSON.stringify(result.data));
  }

  return result;
};

/**
 * Change user password
 * 
 * Route: PUT /api/auth/password
 * 
 * Request Payload:
 * {
 *   "currentPassword": "oldPassword123",
 *   "newPassword": "newSecurePassword456"
 * }
 * 
 * Response:
 * {
 *   "message": "Password updated successfully"
 * }
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  return await api.put('/auth/password', { currentPassword, newPassword });
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
