/**
 * Interests Context
 * Manages available interests/tags derived from user profile and events
 */

import { createContext, useContext, useMemo } from 'react';
import { getInterestsFromEvents } from '../api/interests';
import { useAuth } from './AuthContext';
import { useEvents } from './EventsContext';

const InterestsContext = createContext(null);

export const useInterests = () => {
  const context = useContext(InterestsContext);
  if (!context) {
    throw new Error('useInterests must be used within an InterestsProvider');
  }
  return context;
};

export const InterestsProvider = ({ children }) => {
  const { user } = useAuth();
  const { allEvents } = useEvents();
  
  // Compute interests from user profile and ALL events (not filtered)
  const interestsData = useMemo(() => {
    const userInterests = (user?.interests || []).sort();
    const eventInterests = getInterestsFromEvents(allEvents || []);
    // Other interests are from events that user doesn't have
    const otherInterests = eventInterests.filter(i => !userInterests.includes(i));
    // All combines both with user interests first
    const all = [...userInterests, ...otherInterests];
    
    return { userInterests, eventInterests, otherInterests, all };
  }, [user?.interests, allEvents]);

  const value = {
    interests: interestsData.all,
    userInterests: interestsData.userInterests,
    eventInterests: interestsData.eventInterests,
    otherInterests: interestsData.otherInterests,
    loading: false,
  };

  return (
    <InterestsContext.Provider value={value}>
      {children}
    </InterestsContext.Provider>
  );
};
