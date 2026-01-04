/**
 * API Configuration
 */

// Base URL for the backend API
export const API_BASE_URL = 'http://localhost:3001';

// Default request options
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('theloop_token');
};

/**
 * Make an authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      localStorage.removeItem('theloop_token');
      localStorage.removeItem('theloop_user');
      window.location.href = '/login';
      return { success: false, error: 'Session expired. Please login again.' };
    }

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.message || data.error || 'An error occurred' 
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API Request Error:', error);
    return { 
      success: false, 
      error: error.message || 'Network error. Please check your connection.' 
    };
  }
};

/**
 * API helper methods
 */
export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  
  post: (endpoint, body) => apiRequest(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(body) 
  }),
  
  put: (endpoint, body) => apiRequest(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(body) 
  }),
  
  patch: (endpoint, body) => apiRequest(endpoint, { 
    method: 'PATCH', 
    body: JSON.stringify(body) 
  }),
  
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

export default api;
