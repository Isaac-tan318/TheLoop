/**
 * Event Detail Component
 * Full event information display
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { getEventById, getEventSignups } from '../../api/events';
import LoadingSpinner from '../common/LoadingSpinner';

const EventDetail = ({ eventId }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { signUpForEvent, cancelSignup, isSignedUp, deleteEvent, loading } = useEvents();
  
  const [event, setEvent] = useState(null);
  const [signups, setSignups] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showSignups, setShowSignups] = useState(false);

  const userSignedUp = event ? isSignedUp(event.id) : false;
  const isOrganiser = user?.id === event?.organiserId;

  useEffect(() => {
    const fetchEvent = async () => {
      setLoadingEvent(true);
      const result = await getEventById(eventId);
      if (result.success) {
        setEvent(result.data);
        
        // Fetch signups if organiser
        if (user && result.data.organiserId === user.id) {
          const signupsResult = await getEventSignups(eventId, user.id);
          if (signupsResult.success) {
            setSignups(signupsResult.data);
          }
        }
      } else {
        navigate('/events');
      }
      setLoadingEvent(false);
    };

    fetchEvent();
  }, [eventId, user, navigate]);

  const handleSignup = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } });
      return;
    }

    const result = await signUpForEvent(eventId);
    if (result.success) {
      setEvent(prev => ({
        ...prev,
        signupCount: (prev.signupCount || 0) + 1,
      }));
    } else {
      alert(result.error);
    }
  };

  const handleCancelSignup = async () => {
    const result = await cancelSignup(eventId);
    if (result.success) {
      setEvent(prev => ({
        ...prev,
        signupCount: Math.max((prev.signupCount || 1) - 1, 0),
      }));
      setConfirmCancelOpen(false);
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async () => {
    const result = await deleteEvent(eventId);
    if (result.success) {
      navigate('/organiser/dashboard');
    } else {
      alert(result.error);
    }
  };

  if (loadingEvent) {
    return <LoadingSpinner message="Loading event details..." />;
  }

  if (!event) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5">Event not found</Typography>
        <Button
          onClick={() => navigate('/events')}
          sx={{ mt: 2, color: '#dc2626' }}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero Image / Placeholder */}
      <Box
        sx={{
          height: 300,
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          mb: 4,
          position: 'relative',
        }}
      >
        {event.imageUrl ? (
          <Box
            component="img"
            src={event.imageUrl}
            alt={event.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }}
          />
        ) : (
          <ImageIcon sx={{ fontSize: 80, color: '#9ca3af' }} />
        )}
        
        {/* Interest Tags */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {event.interests.map((interest) => (
            <Chip
              key={interest}
              label={interest}
              sx={{
                backgroundColor: '#dc2626',
                color: 'white',
              }}
            />
          ))}
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            {event.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonIcon sx={{ color: '#6b7280', mr: 1 }} />
            <Typography color="textSecondary">
              Organised by {event.organiserName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationIcon sx={{ color: '#6b7280', mr: 1 }} />
            <Typography color="textSecondary">{event.location}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarIcon sx={{ color: '#6b7280', mr: 1 }} />
            <Typography color="textSecondary">
              {format(parseISO(event.startDate), 'EEEE, d MMMM yyyy')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TimeIcon sx={{ color: '#6b7280', mr: 1 }} />
            <Typography color="textSecondary">
              {format(parseISO(event.startDate), 'h:mm a')} - {format(parseISO(event.endDate), 'h:mm a')}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            About this Event
          </Typography>
          <Typography
            sx={{
              whiteSpace: 'pre-wrap',
              color: '#4b5563',
              lineHeight: 1.8,
            }}
          >
            {event.description}
          </Typography>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 80 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GroupIcon sx={{ color: '#6b7280', mr: 1 }} />
              <Typography>
                {event.signupCount || 0} / {event.capacity} registered
              </Typography>
            </Box>

            {!isOrganiser && (
              <>
                {userSignedUp ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setConfirmCancelOpen(true)}
                    sx={{
                      py: 1.5,
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      '&:hover': {
                        borderColor: '#b91c1c',
                        backgroundColor: '#fef2f2',
                      },
                    }}
                  >
                    Signed Up ✓ (Click to Cancel)
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSignup}
                    disabled={loading || event.isFull}
                    sx={{
                      py: 1.5,
                      backgroundColor: '#dc2626',
                      '&:hover': { backgroundColor: '#b91c1c' },
                    }}
                  >
                    {event.isFull ? 'Event Full' : 'Sign Up for Event'}
                  </Button>
                )}
              </>
            )}

            {isOrganiser && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  onClick={() => setShowSignups(true)}
                  sx={{
                    borderColor: '#dc2626',
                    color: '#dc2626',
                  }}
                >
                  View Signups ({signups.length})
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/organiser/events/${event.id}/edit`)}
                >
                  Edit Event
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  color="error"
                >
                  Delete Event
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Cancel Signup Dialog */}
      <Dialog open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)}>
        <DialogTitle>Cancel Signup?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your signup for this event?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancelOpen(false)}>No, Keep</Button>
          <Button onClick={handleCancelSignup} color="error" variant="contained">
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Event?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{event.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Signups Dialog */}
      <Dialog
        open={showSignups}
        onClose={() => setShowSignups(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Event Signups ({signups.length})</DialogTitle>
        <DialogContent>
          {signups.length === 0 ? (
            <Typography color="textSecondary" sx={{ py: 2 }}>
              No signups yet
            </Typography>
          ) : (
            <List>
              {signups.map((signup) => (
                <ListItem key={signup.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#dc2626' }}>
                      {signup.userName?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={signup.userName}
                    secondary={`${signup.userEmail} • Signed up ${format(parseISO(signup.signedUpAt), 'MMM d, yyyy')}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSignups(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventDetail;
