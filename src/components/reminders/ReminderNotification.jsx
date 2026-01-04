/**
 * Reminder Notification Component
 * Displays popup notifications for upcoming events
 */

import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Event as EventIcon,
  Close as CloseIcon,
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
    <Dialog open={showNotification} onClose={closeNotification} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotificationsIcon sx={{ color: '#dc2626' }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
          Event Reminder
        </Typography>
        <IconButton onClick={closeNotification} aria-label="close" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>{activeReminder.eventTitle}</strong> starts in 24 hours!
          </Typography>
          {activeReminder.event && (
            <Typography variant="body2" color="textSecondary">
              {format(parseISO(activeReminder.eventStart), 'EEEE, MMM d \'at\' h:mm a')}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeNotification} color="inherit">
          Dismiss
        </Button>
        <Button
          variant="contained"
          startIcon={<EventIcon />}
          onClick={handleViewEvent}
          sx={{
            backgroundColor: '#dc2626',
            '&:hover': { backgroundColor: '#b91c1c' },
          }}
        >
          View Event
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReminderNotification;
