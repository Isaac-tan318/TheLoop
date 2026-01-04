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

import api from './config';

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
export const getPendingReminders = async (userId) => {
  return await api.get('/reminders/pending');
};

/**
 * Get all user reminders
 * 
 * Route: GET /api/reminders
 * 
 * Request: Authorization header with JWT token
 * 
 * Response: Array of reminder objects (same as pending)
 */
export const getUserReminders = async (userId) => {
  return await api.get('/reminders');
};

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
export const markReminderAsSent = async (reminderId) => {
  return await api.put(`/reminders/${reminderId}/sent`, {});
};

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
export const dismissReminder = async (reminderId) => {
  return await api.put(`/reminders/${reminderId}/dismiss`, {});
};

/**
 * Check for reminders that need to be shown (polling function)
 * @param {string} userId - User ID
 * @param {Function} onReminder - Callback when reminder should be shown
 * @returns {Function} Cleanup function to stop checking
 */
export const startReminderPolling = (userId, onReminder) => {
  const checkReminders = async () => {
    const result = await getPendingReminders(userId);
    
    if (result.success && result.data?.length > 0) {
      result.data.forEach(reminder => {
        if (!reminder.sent) {
          onReminder(reminder);
          markReminderAsSent(reminder.id);
        }
      });
    }
  };

  // Check immediately
  checkReminders();

  // Then check every minute
  const intervalId = setInterval(checkReminders, 60000);

  // Return cleanup function
  return () => clearInterval(intervalId);
};
