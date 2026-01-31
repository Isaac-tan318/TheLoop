// Analytics API for tracking user behavior
// Used to improve personalized recommendations

import api from './config';

// Record a search query for recommendation improvement
export const trackSearch = async (query) => {
  if (!query || query.trim().length === 0) return { success: false };
  
  try {
    const result = await api.post('/analytics/search', { query: query.trim() });
    return result;
  } catch (err) {
    // Silently fail - analytics shouldn't break the app
    console.warn('Failed to track search:', err);
    return { success: false };
  }
};

// Record an event view/click for recommendation improvement
export const trackEventView = async (eventId) => {
  if (!eventId) return { success: false };
  
  try {
    const result = await api.post('/analytics/view', { eventId });
    return result;
  } catch (err) {
    // Silently fail - analytics shouldn't break the app
    console.warn('Failed to track event view:', err);
    return { success: false };
  }
};

// Get user's search and view history
export const getAnalyticsHistory = async () => {
  return await api.get('/analytics/history');
};

// Clear user's search and view history
export const clearAnalyticsHistory = async () => {
  return await api.delete('/analytics/history');
};
