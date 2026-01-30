 

import api from './config';
import { calculateReminderTime } from './reminders';

 
export const getAllEvents = async (filters = {}) => {
  const result = await api.get('/events');
  
  if (!result.success) return result;
  
  let events = result.data;
  
  
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    events = events.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.location.toLowerCase().includes(query) ||
      (Array.isArray(e.interests) && e.interests.some((interest) => interest.toLowerCase().includes(query)))
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

 
export const getEventById = async (eventId) => {
  return await api.get(`/events/${eventId}`);
};

 
export const getEventsByOrganiser = async (organiserId) => {
  const result = await api.get(`/events?organiserId=${organiserId}`);
  return result;
};

 
export const createEvent = async (eventData, organiser) => {
  const newEvent = {
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    organiserId: organiser?._id,
    interests: eventData.interests || [],
    capacity: eventData.capacity || 50,
    signupCount: 0,
    signupsOpen: eventData.signupsOpen !== false, // Default to true
    imageUrl: eventData.imageUrl || null,
    additionalFields: eventData.additionalFields || [],
  };
  
  return await api.post('/events', newEvent);
};

 
export const updateEvent = async (eventId, updates, organiserId) => {
  return await api.patch(`/events/${eventId}`, updates);
};

/**
 * Toggle signups open/closed for an event
 */
export const toggleSignups = async (eventId, signupsOpen) => {
  return await api.patch(`/events/${eventId}`, { signupsOpen });
};

 
export const deleteEvent = async (eventId, organiserId) => {
  // Delete all signups for this event (reminders are embedded, so they're deleted too)
  const signupsResult = await api.get(`/signups?eventId=${eventId}`);
  if (signupsResult.success && signupsResult.data.length > 0) {
    for (const signup of signupsResult.data) {
      await api.delete(`/signups/${signup._id}`);
    }
  }
  
  return await api.delete(`/events/${eventId}`);
};

 
export const signUpForEvent = async (eventId, user, additionalInfo = null) => {
  // Check if already signed up
  const existingResult = await api.get(`/signups?eventId=${eventId}&userId=${user._id}`);
  if (existingResult.success && existingResult.data.length > 0) {
    return { success: false, error: 'Already signed up for this event' };
  }
  
  // Fetch event to calculate reminder time and check if signups are open
  const eventResult = await api.get(`/events/${eventId}`);
  if (!eventResult.success) {
    return { success: false, error: 'Event not found' };
  }
  const event = eventResult.data;
  
  // Check if signups are open (double-check against server state)
  if (event.signupsOpen === false) {
    return { success: false, error: 'Signups are closed for this event' };
  }
  
  // Create signup with embedded reminder (24h before event)
  const signup = {
    eventId,
    userId: user._id,
    signedUpAt: new Date().toISOString(),
    additionalInfo: additionalInfo || null,
    reminder: {
      sent: false,
      dismissed: false,
      time: calculateReminderTime(event.startDate).toISOString(),
    },
  };
  
  const result = await api.post('/signups', signup);
  
  // Update event signup count
  if (result.success) {
    await api.patch(`/events/${eventId}`, {
      signupCount: (event.signupCount || 0) + 1
    });
  }
  
  return result;
};

 
export const cancelSignup = async (eventId, userId) => {
  // Find the signup
  const signupsResult = await api.get(`/signups?eventId=${eventId}&userId=${userId}`);
  
  if (!signupsResult.success || signupsResult.data.length === 0) {
    return { success: false, error: 'Signup not found' };
  }
  
  const signup = signupsResult.data[0];
  // Deleting signup also removes embedded reminder
  const result = await api.delete(`/signups/${signup._id}`);
  
  // Update event signup count
  if (result.success) {
    const eventResult = await api.get(`/events/${eventId}`);
    if (eventResult.success) {
      await api.patch(`/events/${eventId}`, {
        signupCount: Math.max((eventResult.data.signupCount || 1) - 1, 0)
      });
    }
  }
  
  return result;
};

 
export const getUserSignups = async (userId) => {
  
  const signupsResult = await api.get(`/signups?userId=${userId}`);
  
  if (!signupsResult.success) return signupsResult;
  
  
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

 
export const isUserSignedUp = async (eventId, userId) => {
  const result = await api.get(`/signups?eventId=${eventId}&userId=${userId}`);
  if (result.success) {
    return { success: true, data: result.data.length > 0 };
  }
  return result;
};

 
export const getEventSignups = async (eventId, organiserId) => {
  return await api.get(`/signups?eventId=${eventId}`);
};

/**
 * Get personalized event recommendations for the current user
 * Returns popular events if user has no interests set
 */
export const getRecommendedEvents = async (limit = 6) => {
  const result = await api.get(`/suggestions?limit=${limit}`);
  if (!result.success) return result;
  
  // API returns { events: [...], recommendationType: 'personalized' | 'popular' }
  return {
    success: true,
    data: result.data.events || [],
    recommendationType: result.data.recommendationType || 'popular',
  };
};
