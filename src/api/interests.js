/**
 * Interests API
 * 
 * ROUTES:
 * -------
 * GET  /api/interests     - Get all available interests
 * POST /api/interests     - Add a new interest
 */

import api from './config';

/**
 * Get all available interests
 * 
 * Route: GET /api/interests
 * 
 * Response:
 * [
 *   "technology",
 *   "career",
 *   "networking",
 *   "sports",
 *   "arts",
 *   "music",
 *   "business",
 *   "science",
 *   "health",
 *   "social"
 * ]
 */
export const getAllInterests = async () => {
  return await api.get('/interests');
};

/**
 * Add a new interest
 * 
 * Route: POST /api/interests
 * 
 * Request Payload:
 * {
 *   "name": "new-interest"
 * }
 * 
 * Response: Updated array of all interests
 */
export const addInterest = async (interest) => {
  const trimmed = interest.trim();
  if (!trimmed) {
    return { success: false, error: 'Interest cannot be empty' };
  }
  
  return await api.post('/interests', { name: trimmed });
};
