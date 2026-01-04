/**
 * Events API
 * 
 * ROUTES:
 * -------
 * GET    /api/events              - Get all events (with filters)
 * GET    /api/events/:id          - Get event by ID
 * POST   /api/events              - Create new event (organiser only)
 * PUT    /api/events/:id          - Update event (organiser only)
 * DELETE /api/events/:id          - Delete event (organiser only)
 * GET    /api/events/organiser    - Get events by current organiser
 * POST   /api/events/:id/signup   - Sign up for event
 * DELETE /api/events/:id/signup   - Cancel signup
 * GET    /api/events/signups      - Get user's signed up events
 * GET    /api/events/:id/signups  - Get event signups (organiser only)
 */

import api from './config';

export const getAllEvents = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.interests?.length > 0) {
    params.append('interests', filters.interests.join(','));
  }
  if (filters.searchQuery) {
    params.append('searchQuery', filters.searchQuery);
  }
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/events?${queryString}` : '/events';
  
  return await api.get(endpoint);
};

/**
 * Get event by ID
 * 
 * Route: GET /api/events/:id
 * 
 * Response:
 * {
 *   "id": "uuid",
 *   "title": "Event Title",
 *   "description": "Event description",
 *   "location": "Event Location",
 *   "startDate": "2026-01-15T09:00:00.000Z",
 *   "endDate": "2026-01-15T17:00:00.000Z",
 *   "organiserId": "organiser-uuid",
 *   "organiserName": "Organiser Name",
 *   "interests": ["technology", "career"],
 *   "capacity": 100,
 *   "signupCount": 45,
 *   "isFull": false,
 *   "isSignedUp": true,
 *   "imageUrl": "https://example.com/image.jpg",
 *   "createdAt": "2026-01-01T10:00:00.000Z"
 * }
 */
export const getEventById = async (eventId) => {
  return await api.get(`/events/${eventId}`);
};

/**
 * Get events by current organiser
 * 
 * Route: GET /api/events/organiser
 * 
 * Request: Authorization header with JWT token
 * 
 * Response: Array of event objects (same as getAllEvents)
 */
export const getEventsByOrganiser = async (organiserId) => {
  return await api.get('/events/organiser');
};

/**
 * Create a new event
 * 
 * Route: POST /api/events
 * 
 * Request Payload:
 * {
 *   "title": "Event Title",
 *   "description": "Event description",
 *   "location": "Event Location",
 *   "startDate": "2026-01-15T09:00:00.000Z",
 *   "endDate": "2026-01-15T17:00:00.000Z",
 *   "interests": ["technology", "career"],
 *   "capacity": 100,
 *   "imageUrl": "https://example.com/image.jpg" (optional)
 * }
 * 
 * Response: Created event object
 */
export const createEvent = async (eventData, organiser) => {
  return await api.post('/events', {
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    interests: eventData.interests || [],
    capacity: eventData.capacity || 50,
    imageUrl: eventData.imageUrl || null,
  });
};

/**
 * Update an event
 * 
 * Route: PUT /api/events/:id
 * 
 * Request Payload: (all fields optional)
 * {
 *   "title": "Updated Title",
 *   "description": "Updated description",
 *   "location": "Updated Location",
 *   "startDate": "2026-01-15T09:00:00.000Z",
 *   "endDate": "2026-01-15T17:00:00.000Z",
 *   "interests": ["technology", "career"],
 *   "capacity": 150,
 *   "imageUrl": "https://example.com/new-image.jpg"
 * }
 * 
 * Response: Updated event object
 */
export const updateEvent = async (eventId, updates, organiserId) => {
  return await api.put(`/events/${eventId}`, updates);
};

/**
 * Delete an event
 * 
 * Route: DELETE /api/events/:id
 * 
 * Response:
 * {
 *   "message": "Event deleted successfully"
 * }
 */
export const deleteEvent = async (eventId, organiserId) => {
  return await api.delete(`/events/${eventId}`);
};

/**
 * Sign up for an event
 * 
 * Route: POST /api/events/:id/signup
 * 
 * Request: Authorization header with JWT token
 * 
 * Response:
 * {
 *   "id": "signup-uuid",
 *   "eventId": "event-uuid",
 *   "userId": "user-uuid",
 *   "signedUpAt": "2026-01-04T10:00:00.000Z"
 * }
 */
export const signUpForEvent = async (eventId, user) => {
  return await api.post(`/events/${eventId}/signup`, {});
};

/**
 * Cancel signup for an event
 * 
 * Route: DELETE /api/events/:id/signup
 * 
 * Request: Authorization header with JWT token
 * 
 * Response:
 * {
 *   "message": "Signup cancelled successfully"
 * }
 */
export const cancelSignup = async (eventId, userId) => {
  return await api.delete(`/events/${eventId}/signup`);
};

/**
 * Get user's signed up events
 * 
 * Route: GET /api/events/signups
 * 
 * Request: Authorization header with JWT token
 * 
 * Response: Array of event objects with signedUpAt field
 */
export const getUserSignups = async (userId) => {
  return await api.get('/events/signups');
};

/**
 * Check if user is signed up for an event
 * 
 * Route: GET /api/events/:id/signup/status
 * 
 * Request: Authorization header with JWT token
 * 
 * Response:
 * {
 *   "isSignedUp": true
 * }
 */
export const isUserSignedUp = async (eventId, userId) => {
  const result = await api.get(`/events/${eventId}/signup/status`);
  if (result.success) {
    return { success: true, data: result.data.isSignedUp };
  }
  return result;
};

/**
 * Get event signups (for organisers)
 * 
 * Route: GET /api/events/:id/signups
 * 
 * Request: Authorization header with JWT token (must be event organiser)
 * 
 * Response:
 * [
 *   {
 *     "id": "signup-uuid",
 *     "eventId": "event-uuid",
 *     "userId": "user-uuid",
 *     "userName": "User Name",
 *     "userEmail": "user@example.com",
 *     "signedUpAt": "2026-01-04T10:00:00.000Z"
 *   }
 * ]
 */
export const getEventSignups = async (eventId, organiserId) => {
  return await api.get(`/events/${eventId}/signups`);
};
