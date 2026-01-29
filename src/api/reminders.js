2/**
 * Reminders API (now uses Signup model with embedded reminder fields)
 *
 * Reminders are embedded in signups - no separate /reminders endpoint needed.
 * Uses /signups with reminder.* fields:
 *   - reminder.enabled: Boolean
 *   - reminder.sent: Boolean  
 *   - reminder.dismissed: Boolean
 *   - reminder.time: Date (24h before event start)
 */

import api from './config';

// Get all signups with reminders for a user (enriched with event data)
export const getUserReminders = async (userId) => {
  // Get user's signups that have reminders enabled
  const res = await api.get(`/signups?userId=${userId}`);
  if (!res.success) return res;

  const signups = res.data || [];
  const enriched = [];
  
  for (const signup of signups) {
    // Skip signups without reminder data
    if (!signup.reminder?.time) continue;
    
    // Fetch event data for display
    const ev = await api.get(`/events/${signup.eventId}`);
    const event = ev.success ? ev.data : null;
    
    enriched.push({
      _id: signup._id,  // Use signup ID for dismiss/mark sent
      signupId: signup._id,
      userId: signup.userId,
      eventId: signup.eventId,
      eventTitle: event?.title || 'Unknown Event',
      eventStart: event?.startDate,
      reminderTime: signup.reminder.time,
      sent: signup.reminder.sent || false,
      dismissed: signup.reminder.dismissed || false,
      event,
    });
  }
  
  return { success: true, data: enriched };
};

// Dismiss a reminder (update signup's reminder.dismissed)
export const dismissReminder = async (signupId) => {
  return await api.patch(`/signups/${signupId}`, { 
    'reminder.dismissed': true 
  });
};

// Mark reminder as sent (update signup's reminder.sent)
export const markReminderSent = async (signupId) => {
  return await api.patch(`/signups/${signupId}`, {
    'reminder.sent': true,
  });
};

// Calculate reminder time (24 hours before event)
export const calculateReminderTime = (eventStartDate) => {
  const start = new Date(eventStartDate);
  return new Date(start.getTime() - 24 * 60 * 60 * 1000);
};

// Poll for due reminders and trigger callback
export const startReminderPolling = (userId, onReminder) => {
  let timer = null;

  const tick = async () => {
    const now = new Date();
    
    // Get user's signups
    const res = await api.get(`/signups?userId=${userId}`);
    if (!res.success) return;
    
    const signups = res.data || [];
    
    for (const signup of signups) {
      // Skip if no reminder time, already sent, or dismissed
      if (!signup.reminder?.time) continue;
      if (signup.reminder.sent || signup.reminder.dismissed) continue;
      
      const dueAt = new Date(signup.reminder.time);
      
      if (now >= dueAt) {
        // Mark as sent
        await markReminderSent(signup._id);
        
        // Fetch event for enriched notification
        const ev = await api.get(`/events/${signup.eventId}`);
        const event = ev.success ? ev.data : null;
        
        const enriched = {
          _id: signup._id,
          signupId: signup._id,
          userId: signup.userId,
          eventId: signup.eventId,
          eventTitle: event?.title || 'Unknown Event',
          eventStart: event?.startDate,
          reminderTime: signup.reminder.time,
          sent: true,
          dismissed: false,
          event,
        };
        
        onReminder(enriched);
      }
    }
  };

  // Run immediately then every 60s
  tick();
  timer = setInterval(tick, 60 * 1000);

  // Return cleanup
  return () => {
    if (timer) clearInterval(timer);
  };
};
