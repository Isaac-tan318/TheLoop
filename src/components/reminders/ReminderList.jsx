/**
 * Reminder List Component
 * Displays all reminders for the user
 */

import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, parseISO, isPast, isFuture } from 'date-fns';

const ReminderList = ({ reminders = [], dismissReminder = () => {} }) => {
  const navigate = useNavigate();

  const upcomingReminders = reminders.filter(
    r => !r.dismissed && r.event && isFuture(parseISO(r.eventStart))
  );
  
  const pastReminders = reminders.filter(
    r => r.dismissed || (r.event && isPast(parseISO(r.eventStart)))
  );

  const handleViewEvent = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const ReminderItem = ({ reminder, isPast = false }) => (
    <ListItem
      sx={{
        backgroundColor: isPast ? '#f9fafb' : 'white',
        borderRadius: 1,
        mb: 1,
        opacity: isPast ? 0.7 : 1,
      }}
    >
      <Box sx={{ mr: 2 }}>
        {isPast ? (
          <CheckCircleIcon sx={{ color: '#9ca3af' }} />
        ) : reminder.sent ? (
          <CheckCircleIcon sx={{ color: '#22c55e' }} />
        ) : (
          <ScheduleIcon sx={{ color: '#dc2626' }} />
        )}
      </Box>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              {reminder.eventTitle}
            </Typography>
            {!isPast && !reminder.sent && (
              <Chip
                label="Pending"
                size="small"
                sx={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.7rem',
                }}
              />
            )}
            {reminder.sent && !isPast && (
              <Chip
                label="Sent"
                size="small"
                sx={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="textSecondary">
              Event: {format(parseISO(reminder.eventStart), 'EEEE, MMM d, yyyy \'at\' h:mm a')}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Reminder scheduled for: {format(parseISO(reminder.reminderTime), 'MMM d, yyyy \'at\' h:mm a')}
            </Typography>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          onClick={() => handleViewEvent(reminder.eventId)}
          sx={{ mr: 1 }}
        >
          <EventIcon />
        </IconButton>
        {!isPast && (
          <IconButton
            edge="end"
            onClick={() => dismissReminder(reminder.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );

  if (reminders.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <ScheduleIcon sx={{ fontSize: 60, color: '#9ca3af', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No reminders yet
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Sign up for events to receive reminders 24 hours before they start
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {upcomingReminders.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Upcoming Reminders
          </Typography>
          <List disablePadding>
            {upcomingReminders.map((reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} />
            ))}
          </List>
        </Paper>
      )}

      {pastReminders.length > 0 && (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#6b7280' }}>
            Past Reminders
          </Typography>
          <List disablePadding>
            {pastReminders.map((reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} isPast />
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ReminderList;
