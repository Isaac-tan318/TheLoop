/**
 * Reminders Page
 */

import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Paper, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip } from '@mui/material';
import { Delete as DeleteIcon, Event as EventIcon, CheckCircle as CheckCircleIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { format, parseISO, isPast, isFuture } from 'date-fns';

const RemindersPage = ({ remindersProps }) => {
  const navigate = useNavigate();
  const { reminders, dismissReminder } = remindersProps;

  const upcomingReminders = reminders.filter(
    r => !r.dismissed && r.eventStart && isFuture(parseISO(r.eventStart))
  );
  
  const pastReminders = reminders.filter(
    r => r.dismissed || (r.eventStart && isPast(parseISO(r.eventStart)))
  );

  const handleViewEvent = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const ReminderItem = ({ reminder, isPastItem = false }) => (
    <ListItem
      sx={{
        backgroundColor: isPastItem ? '#f9fafb' : 'white',
        borderRadius: 1,
        mb: 1,
        opacity: isPastItem ? 0.7 : 1,
      }}
    >
      <Box sx={{ mr: 2 }}>
        {isPastItem ? (
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
            {!isPastItem && !reminder.sent && (
              <Chip label="Pending" size="small" sx={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.7rem' }} />
            )}
            {reminder.sent && !isPastItem && (
              <Chip label="Sent" size="small" sx={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.7rem' }} />
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
        <IconButton edge="end" onClick={() => handleViewEvent(reminder.eventId)} sx={{ mr: 1 }}>
          <EventIcon />
        </IconButton>
        {!isPastItem && (
          <IconButton edge="end" onClick={() => dismissReminder(reminder.id)} color="error">
            <DeleteIcon />
          </IconButton>
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          My Reminders
        </Typography>

        {reminders.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <ScheduleIcon sx={{ fontSize: 60, color: '#9ca3af', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">No reminders yet</Typography>
            <Typography variant="body2" color="textSecondary">Sign up for events to receive reminders 24 hours before they start</Typography>
          </Paper>
        ) : (
          <>
            {upcomingReminders.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Upcoming Reminders</Typography>
                <List disablePadding>
                  {upcomingReminders.map(r => <ReminderItem key={r.id} reminder={r} />)}
                </List>
              </Paper>
            )}
            {pastReminders.length > 0 && (
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#6b7280' }}>Past Reminders</Typography>
                <List disablePadding>
                  {pastReminders.map(r => <ReminderItem key={r.id} reminder={r} isPastItem />)}
                </List>
              </Paper>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default RemindersPage;
