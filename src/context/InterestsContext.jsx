/**
 * Interests Context
 * Manages available interests/tags
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as interestsApi from '../api/interests';

const InterestsContext = createContext(null);

export const useInterests = () => {
  const context = useContext(InterestsContext);
  if (!context) {
    throw new Error('useInterests must be used within an InterestsProvider');
  }
  return context;
};

export const InterestsProvider = ({ children }) => {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all interests on mount
  useEffect(() => {
    const fetchInterests = async () => {
      const result = await interestsApi.getAllInterests();
      if (result.success) {
        setInterests(result.data);
      }
      setLoading(false);
    };

    fetchInterests();
  }, []);

  const addInterest = useCallback(async (interest) => {
    const result = await interestsApi.addInterest(interest);
    if (result.success) {
      setInterests(result.data);
    }
    return result;
  }, []);

  const value = {
    interests,
    loading,
    addInterest,
  };

  return (
    <InterestsContext.Provider value={value}>
      {children}
    </InterestsContext.Provider>
  );
};
