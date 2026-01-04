/**
 * Events API
 * 
 * Uses JSON Server at localhost:3001
 * ROUTES:
 * -------
 * GET    /events          - Get all events
 * GET    /events/:id      - Get event by ID
 * POST   /events          - Create new event
 * PUT    /events/:id      - Update event
 * DELETE /events/:id      - Delete event
 * GET    /signups         - Get all signups
 * POST   /signups         - Create signup
 * DELETE /signups/:id     - Delete signup
 */

import api from './config';
import { v4 as uuidv4 } from 'uuid';
import { createReminderForSignup, deleteUserEventReminders, deleteEventReminders } from './reminders';

/**
 * Get all events with optional client-side filtering
 */
export const getAllEvents = async (filters = {}) => {
  const result = await api.get('/events');
  
  if (!result.success) return result;
  
  let events = result.data;
  
  // Client-side filtering
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    events = events.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query)
    );
  }
  
  if (filters.startDate) {
    events = events.filter(e => new Date(e.startDate) >= new Date(filters.startDate));
  }
  
  if (filters.endDate) {
    events = events.filter(e => new Date(e.startDate) <= new Date(filters.endDate));
  }
  
  return { success: true, data: events };
};

/**
 * Get event by ID
 */
export const getEventById = async (eventId) => {
  return await api.get(`/events/${eventId}`);
};

/**
 * Get events by organiser ID
 */
export const getEventsByOrganiser = async (organiserId) => {
  const result = await api.get(`/events?organiserId=${organiserId}`);
  return result;
};

/**
 * Create a new event
 */
export const createEvent = async (eventData, organiser) => {
  const newEvent = {
    id: uuidv4(),
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    organiserId: organiser.id,
    organiserName: organiser.name,
    interests: eventData.interests || [],
    capacity: eventData.capacity || 50,
    signupCount: 0,
    imageUrl: eventData.imageUrl || null,
    createdAt: new Date().toISOString(),
  };
  
  return await api.post('/events', newEvent);
};

/**
 * Update an event
 */
export const updateEvent = async (eventId, updates, organiserId) => {
  return await api.patch(`/events/${eventId}`, updates);
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId, organiserId) => {
  // Also delete related signups
  const signupsResult = await api.get(`/signups?eventId=${eventId}`);
  if (signupsResult.success && signupsResult.data.length > 0) {
    for (const signup of signupsResult.data) {
      await api.delete(`/signups/${signup.id}`);
    }
  }
  // Delete any associated reminders
  await deleteEventReminders(eventId);
  
  return await api.delete(`/events/${eventId}`);
};

/**
 * Sign up for an event
 */
export const signUpForEvent = async (eventId, user) => {
  // Check if already signed up
  const existingResult = await api.get(`/signups?eventId=${eventId}&userId=${user.id}`);
  if (existingResult.success && existingResult.data.length > 0) {
    return { success: false, error: 'Already signed up for this event' };
  }
  
  const signup = {
    id: uuidv4(),
    eventId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    signedUpAt: new Date().toISOString(),
  };
  
  const result = await api.post('/signups', signup);
  
  // Update event signup count
  if (result.success) {
    const eventResult = await api.get(`/events/${eventId}`);
    if (eventResult.success) {
      await api.patch(`/events/${eventId}`, {
        signupCount: (eventResult.data.signupCount || 0) + 1
      });
      // Create reminder for this signup
      await createReminderForSignup(eventId, user);
    }
  }
  
  return result;
};

/**
 * Cancel signup for an event
 */
export const cancelSignup = async (eventId, userId) => {
  // Find the signup
  const signupsResult = await api.get(`/signups?eventId=${eventId}&userId=${userId}`);
  
  if (!signupsResult.success || signupsResult.data.length === 0) {
    return { success: false, error: 'Signup not found' };
  }
  
  const signup = signupsResult.data[0];
  const result = await api.delete(`/signups/${signup.id}`);
  
  // Update event signup count
  if (result.success) {
    const eventResult = await api.get(`/events/${eventId}`);
    if (eventResult.success) {
      await api.patch(`/events/${eventId}`, {
        signupCount: Math.max((eventResult.data.signupCount || 1) - 1, 0)
      });
      // Remove any reminders for this user+event
      await deleteUserEventReminders(eventId, userId);
    }
  }
  
  return result;
};

/**
 * Get user's signed up events
 */
export const getUserSignups = async (userId) => {
  // Get all signups for this user
  const signupsResult = await api.get(`/signups?userId=${userId}`);
  
  if (!signupsResult.success) return signupsResult;
  
  // Get the full event details for each signup
  const events = [];
  for (const signup of signupsResult.data) {
    const eventResult = await api.get(`/events/${signup.eventId}`);
    if (eventResult.success) {
      events.push({
        ...eventResult.data,
        signedUpAt: signup.signedUpAt,
      });
    }
  }
  
  return { success: true, data: events };
};

/**
 * Check if user is signed up for an event
 */
export const isUserSignedUp = async (eventId, userId) => {
  const result = await api.get(`/signups?eventId=${eventId}&userId=${userId}`);
  if (result.success) {
    return { success: true, data: result.data.length > 0 };
  }
  return result;
};

/**
 * Get event signups (for organisers)
 */
export const getEventSignups = async (eventId, organiserId) => {
  return await api.get(`/signups?eventId=${eventId}`);
};
