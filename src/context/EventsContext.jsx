/**
 * Events Context
 * Manages events state and operations
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as eventsApi from '../api/events';
import { useAuth } from './AuthContext';

const EventsContext = createContext(null);

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};

export const EventsProvider = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [userSignups, setUserSignups] = useState([]);
  const [organiserEvents, setOrganiserEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    interests: [],
    searchQuery: '',
    startDate: null,
    endDate: null,
  });

  // Fetch all events
  const fetchEvents = useCallback(async (customFilters = null) => {
    setLoading(true);
    setError(null);

    const result = await eventsApi.getAllEvents(customFilters || filters);

    if (result.success) {
      setEvents(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, [filters]);

  // Fetch user signups
  const fetchUserSignups = useCallback(async () => {
    if (!user) return;

    const result = await eventsApi.getUserSignups(user.id);

    if (result.success) {
      setUserSignups(result.data);
    }

    return result;
  }, [user]);

  // Fetch organiser's events
  const fetchOrganiserEvents = useCallback(async () => {
    if (!user || user.role !== 'organiser') return;

    setLoading(true);
    const result = await eventsApi.getEventsByOrganiser(user.id);

    if (result.success) {
      setOrganiserEvents(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, [user]);

  // Create event
  const createEvent = useCallback(async (eventData) => {
    if (!user || user.role !== 'organiser') {
      return { success: false, error: 'Only organisers can create events' };
    }

    setLoading(true);
    const result = await eventsApi.createEvent(eventData, user);

    if (result.success) {
      setOrganiserEvents(prev => [result.data, ...prev]);
      // Refresh all events
      fetchEvents();
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, [user, fetchEvents]);

  // Update event
  const updateEvent = useCallback(async (eventId, updates) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    const result = await eventsApi.updateEvent(eventId, updates, user.id);

    if (result.success) {
      setOrganiserEvents(prev => 
        prev.map(e => e.id === eventId ? { ...e, ...result.data } : e)
      );
      setEvents(prev => 
        prev.map(e => e.id === eventId ? { ...e, ...result.data } : e)
      );
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, [user]);

  // Delete event
  const deleteEvent = useCallback(async (eventId) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    const result = await eventsApi.deleteEvent(eventId, user.id);

    if (result.success) {
      setOrganiserEvents(prev => prev.filter(e => e.id !== eventId));
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, [user]);

  // Sign up for event
  const signUpForEvent = useCallback(async (eventId) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    const result = await eventsApi.signUpForEvent(eventId, user);

    if (result.success) {
      fetchUserSignups();
      fetchEvents(); // Refresh to update signup counts
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, [user, fetchUserSignups, fetchEvents]);

  // Cancel signup
  const cancelSignup = useCallback(async (eventId) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    setLoading(true);
    const result = await eventsApi.cancelSignup(eventId, user.id);

    if (result.success) {
      setUserSignups(prev => prev.filter(e => e.id !== eventId));
      fetchEvents(); // Refresh to update signup counts
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  }, [user, fetchEvents]);

  // Check if user is signed up for an event
  const isSignedUp = useCallback((eventId) => {
    return userSignups.some(signup => signup.id === eventId);
  }, [userSignups]);

  // Get event signups (for organisers)
  const getEventSignups = useCallback(async (eventId) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    return eventsApi.getEventSignups(eventId, user.id);
  }, [user]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      interests: [],
      searchQuery: '',
      startDate: null,
      endDate: null,
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch events when filters change
  useEffect(() => {
    fetchEvents();
  }, [filters]);

  // Fetch user signups when user changes
  useEffect(() => {
    if (user) {
      fetchUserSignups();
      if (user.role === 'organiser') {
        fetchOrganiserEvents();
      }
    } else {
      setUserSignups([]);
      setOrganiserEvents([]);
    }
  }, [user]);

  const value = {
    events,
    userSignups,
    organiserEvents,
    loading,
    error,
    filters,
    fetchEvents,
    fetchUserSignups,
    fetchOrganiserEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    signUpForEvent,
    cancelSignup,
    isSignedUp,
    getEventSignups,
    updateFilters,
    clearFilters,
    clearError,
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};
