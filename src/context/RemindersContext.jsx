/**
 * Reminders Context
 * Manages reminders state and notifications
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as remindersApi from '../api/reminders';
import { useAuth } from './AuthContext';

const RemindersContext = createContext(null);

export const useReminders = () => {
  const context = useContext(RemindersContext);
  if (!context) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return context;
};

export const RemindersProvider = ({ children }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Start polling for reminders when user is logged in
  useEffect(() => {
    if (!user) {
      setReminders([]);
      return;
    }

    const handleReminder = (reminder) => {
      setActiveReminder(reminder);
      setShowNotification(true);
      
      // Also request browser notification permission and show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Event Reminder: ${reminder.eventTitle}`, {
          body: `Your event "${reminder.eventTitle}" starts in 24 hours!`,
          icon: '/favicon.ico',
        });
      }
    };

    // Start polling
    const cleanup = remindersApi.startReminderPolling(user.id, handleReminder);

    // Fetch all reminders
    const fetchReminders = async () => {
      const result = await remindersApi.getUserReminders(user.id);
      if (result.success) {
        setReminders(result.data);
      }
    };
    fetchReminders();

    return cleanup;
  }, [user]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const dismissReminder = useCallback(async (reminderId) => {
    await remindersApi.dismissReminder(reminderId);
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    
    if (activeReminder?.id === reminderId) {
      setActiveReminder(null);
      setShowNotification(false);
    }
  }, [activeReminder]);

  const closeNotification = useCallback(() => {
    if (activeReminder) {
      dismissReminder(activeReminder.id);
    }
    setShowNotification(false);
  }, [activeReminder, dismissReminder]);

  const value = {
    reminders,
    activeReminder,
    showNotification,
    dismissReminder,
    closeNotification,
  };

  return (
    <RemindersContext.Provider value={value}>
      {children}
    </RemindersContext.Provider>
  );
};
