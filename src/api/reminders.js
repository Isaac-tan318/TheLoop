/**
 * Reminders API (JSON Server)
 *
 * Routes:
 * GET    /reminders?userId=...            - List reminders for user
 * POST   /reminders                        - Create reminder
 * PATCH  /reminders/:id                    - Update reminder (sent/dismissed)
 * DELETE /reminders/:id                    - Delete reminder
 */

import api from './config';

// Create a reminder for a signup (24 hours before event start)
export const createReminderForSignup = async (eventId, user) => {
  const eventRes = await api.get(`/events/${eventId}`);
  if (!eventRes.success) return eventRes;

  const event = eventRes.data;
  const start = new Date(event.startDate);
  const reminderTime = new Date(start.getTime() - 24 * 60 * 60 * 1000);

  const reminder = {
    userId: user._id,
    eventId: event._id,
    eventTitle: event.title,
    eventStart: event.startDate,
    reminderTime: reminderTime.toISOString(),
    sent: false,
    dismissed: false,
    createdAt: new Date().toISOString(),
  };

  return await api.post('/reminders', reminder);
};

// Get all reminders for a user (enriched with event if available)
export const getUserReminders = async (userId) => {
  const res = await api.get(`/reminders?userId=${userId}`);
  if (!res.success) return res;

  const reminders = res.data || [];
  const enriched = [];
  for (const r of reminders) {
    const ev = await api.get(`/events/${r.eventId}`);
    enriched.push({
      ...r,
      event: ev.success ? ev.data : null,
    });
  }
  return { success: true, data: enriched };
};

// Dismiss a reminder (hide and prevent notification)
export const dismissReminder = async (reminderId) => {
  return await api.patch(`/reminders/${reminderId}`, { dismissed: true });
};

// Mark reminder as sent
export const markReminderSent = async (reminderId) => {
  return await api.patch(`/reminders/${reminderId}`, {
    sent: true,
    sentAt: new Date().toISOString(),
  });
};

// Delete reminders for a specific event + user
export const deleteUserEventReminders = async (eventId, userId) => {
  const res = await api.get(`/reminders?eventId=${eventId}&userId=${userId}`);
  if (!res.success) return res;
  for (const r of res.data) {
    await api.delete(`/reminders/${r._id}`);
  }
  return { success: true };
};

// Delete all reminders for an event (e.g., event deletion)
export const deleteEventReminders = async (eventId) => {
  const res = await api.get(`/reminders?eventId=${eventId}`);
  if (!res.success) return res;
  for (const r of res.data) {
    await api.delete(`/reminders/${r._id}`);
  }
  return { success: true };
};

// Poll for due reminders and trigger callback
export const startReminderPolling = (userId, onReminder) => {
  let timer = null;

  const tick = async () => {
    const now = new Date();
    const res = await api.get(`/reminders?userId=${userId}&dismissed=false&sent=false`);
    if (!res.success) return;
    const pending = res.data || [];

    for (const r of pending) {
      const dueAt = new Date(r.reminderTime);
      if (now >= dueAt) {
        // mark sent and emit with enriched event
        await markReminderSent(r._id);
        const ev = await api.get(`/events/${r.eventId}`);
        const enriched = { ...r, event: ev.success ? ev.data : null };
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
/**
 * Reminders API
 * 
 * ROUTES:
 * -------
 * GET    /api/reminders           - Get all user reminders
 * GET    /api/reminders/pending   - Get pending reminders (to be shown)
 * PUT    /api/reminders/:id/sent  - Mark reminder as sent
 * PUT    /api/reminders/:id/dismiss - Dismiss a reminder
 */


/**
 * Get user's pending reminders (reminders that should be shown)
 * 
 * Route: GET /api/reminders/pending
 * 
 * Request: Authorization header with JWT token
 * 
 * Response:
 * [
 *   {
 *     "id": "reminder-uuid",
 *     "eventId": "event-uuid",
 *     "userId": "user-uuid",
 *     "eventTitle": "Event Title",
 *     "eventStart": "2026-01-15T09:00:00.000Z",
 *     "reminderTime": "2026-01-14T09:00:00.000Z",
 *     "sent": false,
 *     "dismissed": false,
 *     "event": { ... full event object ... }
 *   }
 * ]
 */
/* removed legacy REST stubs for /api/reminders */

/**
 * Get all user reminders
 * 
 * Route: GET /api/reminders
 * 
 * Request: Authorization header with JWT token
 * 
 * Response: Array of reminder objects (same as pending)
 */
/* removed duplicate getUserReminders */

/**
 * Mark reminder as sent
 * 
 * Route: PUT /api/reminders/:id/sent
 * 
 * Request: Authorization header with JWT token
 * 
 * Response:
 * {
 *   "message": "Reminder marked as sent"
 * }
 */
/* removed legacy markReminderAsSent */

/**
 * Dismiss a reminder
 * 
 * Route: PUT /api/reminders/:id/dismiss
 * 
 * Request: Authorization header with JWT token
 * 
 * Response:
 * {
 *   "message": "Reminder dismissed"
 * }
 */
/* removed duplicate dismissReminder */

/**
 * Check for reminders that need to be shown (polling function)
 * @param {string} userId - User ID
 * @param {Function} onReminder - Callback when reminder should be shown
 * @returns {Function} Cleanup function to stop checking
 */
/* removed duplicate startReminderPolling */
