/**
 * Reminder Notification Component
 * Displays popup notifications for upcoming events
 */

import { useNavigate } from 'react-router-dom';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useReminders } from '../../context/RemindersContext';

const ReminderNotification = () => {
  const navigate = useNavigate();
  const { activeReminder, showNotification, closeNotification } = useReminders();

  if (!activeReminder) return null;

  const handleViewEvent = () => {
    closeNotification();
    navigate(`/events/${activeReminder.eventId}`);
  };

  return (
    <Snackbar
      open={showNotification}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity="info"
        icon={<NotificationsIcon />}
        onClose={closeNotification}
        sx={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#fef2f2',
          border: '1px solid #dc2626',
          '& .MuiAlert-icon': {
            color: '#dc2626',
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 'bold' }}>Event Reminder</AlertTitle>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{activeReminder.eventTitle}</strong> starts in 24 hours!
          </Typography>
          {activeReminder.event && (
            <Typography variant="caption" color="textSecondary">
              {format(parseISO(activeReminder.eventStart), 'EEEE, MMM d \'at\' h:mm a')}
            </Typography>
          )}
        </Box>
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            startIcon={<EventIcon />}
            onClick={handleViewEvent}
            sx={{
              color: '#dc2626',
              '&:hover': { backgroundColor: '#fee2e2' },
            }}
          >
            View Event
          </Button>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default ReminderNotification;
