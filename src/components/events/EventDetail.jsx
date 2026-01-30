 

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Grid,
  Fab,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Image as ImageIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EventAvailable as SignUpIcon,
  Check as CheckIcon,
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import * as eventsApi from '../../api/events';
import LoadingSpinner from '../common/LoadingSpinner';

const EventDetail = ({ eventId, signUpForEvent, cancelSignup, isSignedUp, deleteEvent, loading, updateFilters }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { notify } = useUI();
  
  const [event, setEvent] = useState(null);
  const [signups, setSignups] = useState([]);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showSignups, setShowSignups] = useState(false);
  const [userSignedUp, setUserSignedUp] = useState(false);
  const [signupFormOpen, setSignupFormOpen] = useState(false);
  const [signupAnswers, setSignupAnswers] = useState({});
  const [signupErrors, setSignupErrors] = useState({});
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingSignups, setTogglingSignups] = useState(false);

  const isOrganiser = user?._id === event?.organiserId;
  const isPast = (() => {
    try {
      return event ? new Date(event.startDate) <= new Date() : false;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    const fetchEvent = async () => {
      setLoadingEvent(true);
      const result = await eventsApi.getEventById(eventId);
      if (result.success) {
        setEvent(result.data);
        
        
        if (user && isSignedUp) {
          const signedUp = await isSignedUp(eventId);
          setUserSignedUp(signedUp);
        }
        
        
        if (user && result.data.organiserId === user._id) {
          const signupsResult = await eventsApi.getEventSignups(eventId, user._id);
          if (signupsResult.success) {
            setSignups(signupsResult.data);
          }
        }

        
        if (location?.state?.openSignup && Array.isArray(result.data.additionalFields) && result.data.additionalFields.length > 0) {
          if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } });
          } else {
            const init = {};
            result.data.additionalFields.forEach(f => { init[f._id] = ''; });
            setSignupAnswers(init);
            setSignupErrors({});
            setSignupFormOpen(true);
          }
        }
      } else {
        navigate('/events');
      }
      setLoadingEvent(false);
    };

    fetchEvent();
  }, [eventId, user, navigate, isSignedUp]);
  
  useEffect(() => {}, [location?.state]);

  const handleSignup = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } });
      return;
    }

    if (isPast) {
      alert('Signups are closed because this event has already started.');
      return;
    }

    if (event?.signupsOpen === false) {
      alert('Signups are currently closed for this event.');
      return;
    }

    if (event?.additionalFields && event.additionalFields.length > 0) {
      const init = {};
      event.additionalFields.forEach(f => { init[f._id] = ''; });
      setSignupAnswers(init);
      setSignupErrors({});
      setSignupFormOpen(true);
      return;
    }

    const result = await signUpForEvent(eventId);
    if (result.success) {
      setUserSignedUp(true);
      setEvent(prev => ({
        ...prev,
        signupCount: (prev.signupCount || 0) + 1,
      }));
    } else {
      alert(result.error);
    }
  };

  const handleSubmitSignupForm = async () => {
    const errs = {};
    (event?.additionalFields || []).forEach(f => {
      const value = String(signupAnswers[f._id] ?? '').trim();
      
      // Required field validation
      if (f.required && !value) {
        errs[f._id] = 'This field is required';
        return;
      }
      
      // Skip further validation if field is empty and not required
      if (!value) return;
      
      // Type-specific validation
      switch (f.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errs[f._id] = 'Please enter a valid email address';
          }
          break;
        case 'tel':
          if (!/^[\d\s\-+()]{8,}$/.test(value)) {
            errs[f._id] = 'Please enter a valid phone number';
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errs[f._id] = 'Please enter a valid number';
          }
          break;
        case 'select':
          // Validate that selected value is one of the options
          const opts = String(f.options || '').split(',').map(s => s.trim()).filter(Boolean);
          if (opts.length > 0 && !opts.includes(value)) {
            errs[f._id] = 'Please select a valid option';
          }
          break;
        case 'text':
        case 'textarea':
          // Max length validation
          if (f.type === 'text' && value.length > 200) {
            errs[f._id] = 'Maximum 200 characters allowed';
          } else if (f.type === 'textarea' && value.length > 1000) {
            errs[f._id] = 'Maximum 1000 characters allowed';
          }
          break;
        default:
          break;
      }
    });
    setSignupErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const result = await signUpForEvent(eventId, signupAnswers);
    if (result.success) {
      setUserSignedUp(true);
      setEvent(prev => ({
        ...prev,
        signupCount: (prev.signupCount || 0) + 1,
      }));
      setSignupFormOpen(false);
    } else {
      alert(result.error);
    }
  };

  const handleCancelSignup = async () => {
    setCancelling(true);
    const result = await cancelSignup(eventId);
    if (result.success) {
      setUserSignedUp(false);
      setEvent(prev => ({
        ...prev,
        signupCount: Math.max((prev.signupCount || 1) - 1, 0),
      }));
      setConfirmCancelOpen(false);
    } else {
      alert(result.error);
    }
    setCancelling(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteEvent(eventId);
    if (result.success) {
      notify('Event deleted successfully!', 'success');
      navigate('/organiser/dashboard');
    } else {
      notify(result.error || 'Failed to delete event.', 'error');
    }
    setDeleting(false);
  };

  const handleToggleSignups = async () => {
    setTogglingSignups(true);
    // Handle undefined as true (signups open by default)
    const currentlyOpen = event.signupsOpen !== false;
    const newSignupsOpen = !currentlyOpen;
    const result = await eventsApi.toggleSignups(eventId, newSignupsOpen);
    if (result.success) {
      setEvent(prev => ({ ...prev, signupsOpen: newSignupsOpen }));
      notify(newSignupsOpen ? 'Signups are now open' : 'Signups are now closed', 'success');
    } else {
      notify(result.error || 'Failed to toggle signups', 'error');
    }
    setTogglingSignups(false);
  };

  const shouldClearSearch = Boolean(location.state?.clearSearchOnBack);

  useEffect(() => {
    return () => {
      if (shouldClearSearch && updateFilters) {
        updateFilters({ searchQuery: '' });
      }
    };
  }, [shouldClearSearch, updateFilters]);

  const handleBack = () => {
    if (shouldClearSearch && updateFilters) {
      updateFilters({ searchQuery: '' });
    }
    if (location?.state?.from) {
      navigate(-1);
    } else {
      navigate('/events');
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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2, color: '#dc2626', '&:hover': { backgroundColor: '#fef2f2' } }}
      >
        Back to events
      </Button>
      
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
          overflow: 'hidden',
        }}
      >
        {event.imageUrl ? (
          <Box
            component="img"
            src={event.imageUrl}
            alt={event.title}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <ImageIcon sx={{ fontSize: 80, color: '#9ca3af' }} />
        )}
        
        
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

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3, mb: 3 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', wordWrap: 'break-word', hyphens: 'auto', maxWidth: '60%' }}>
          {event.title}
        </Typography>

        <Paper elevation={2} sx={{ p: 2, borderRadius: 2, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ color: '#6b7280', mr: 1 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                  {event.signupCount || 0} / {event.capacity}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  capacity
                </Typography>
              </Box>
            </Box>

            {!isOrganiser && (
              <>
                {userSignedUp ? (
                  <Button
                    variant="outlined"
                    onClick={() => setConfirmCancelOpen(true)}
                    sx={{
                      py: 1,
                      px: 3,
                      borderRadius: 2,
                      borderColor: '#dc2626',
                      color: '#dc2626',
                      fontWeight: 'bold',
                      '&:hover': {
                        borderColor: '#b91c1c',
                        backgroundColor: '#fef2f2',
                      },
                    }}
                  >
                    Signed Up ✓
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {Array.isArray(event?.additionalFields) && event.additionalFields.length > 0 && (
                      <Chip label="Additional info required" color="default" size="small" />
                    )}
                    <Button
                    variant="contained"
                    onClick={handleSignup}
                    disabled={loading || event.isFull || isPast || event.signupsOpen === false}
                    sx={{
                      py: 1,
                      px: 3,
                      borderRadius: 2,
                      backgroundColor: '#dc2626',
                      fontWeight: 'bold',
                      '&:hover': { backgroundColor: '#b91c1c' },
                    }}
                    >
                      {isPast || event.signupsOpen === false ? 'Signups closed' : (event.isFull ? 'Event Full' : 'Sign Up')}
                    </Button>
                  </Box>
                )}
              </>
            )}

            {isOrganiser && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={event.signupsOpen !== false}
                      onChange={handleToggleSignups}
                      disabled={togglingSignups}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#22c55e',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#22c55e',
                        },
                      }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {event.signupsOpen !== false ? (
                        <>
                          <LockOpenIcon sx={{ fontSize: 18, color: '#22c55e' }} />
                          <Typography variant="body2" sx={{ color: '#22c55e' }}>Signups Open</Typography>
                        </>
                      ) : (
                        <>
                          <LockIcon sx={{ fontSize: 18, color: '#dc2626' }} />
                          <Typography variant="body2" sx={{ color: '#dc2626' }}>Signups Closed</Typography>
                        </>
                      )}
                    </Box>
                  }
                  sx={{ mr: 2 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<GroupIcon />}
                  onClick={() => setShowSignups(true)}
                  sx={{
                    borderColor: '#dc2626',
                    color: '#dc2626',
                  }}
                >
                  Signups ({signups.length})
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/organiser/events/${event._id}/edit`)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  color="error"
                >
                  Delete
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

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

      
      <Dialog open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)}>
        <DialogTitle>Cancel Signup?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your signup for this event?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancelOpen(false)}>No, Keep</Button>
          <Button onClick={handleCancelSignup} color="error" variant="contained" disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={18} sx={{ color: 'white' }} /> : undefined}>
            {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      
      <Dialog open={signupFormOpen} onClose={() => setSignupFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Signup form</DialogTitle>
        <DialogContent>
          {(event?.additionalFields || []).length === 0 ? (
            <Typography color="textSecondary">No additional information required.</Typography>
          ) : (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {event.additionalFields.map((field) => {
                if (field.type === 'textarea') {
                  return (
                    <TextField
                      key={field._id}
                      label={field.label}
                      value={signupAnswers[field._id] || ''}
                      onChange={(e) => setSignupAnswers(prev => ({ ...prev, [field._id]: e.target.value }))}
                      multiline
                      rows={4}
                      required={!!field.required}
                      error={!!signupErrors[field._id]}
                      helperText={signupErrors[field._id]}
                      fullWidth
                    />
                  );
                }
                if (field.type === 'select') {
                  const opts = String(field.options || '').split(',').map(s => s.trim()).filter(Boolean);
                  return (
                    <Box key={field._id}>
                      <Typography sx={{ mb: 1 }}>{field.label}{field.required ? ' *' : ''}</Typography>
                      <Select
                        fullWidth
                        value={signupAnswers[field._id] || ''}
                        onChange={(e) => setSignupAnswers(prev => ({ ...prev, [field._id]: e.target.value }))}
                        error={!!signupErrors[field._id]}
                      >
                        <MenuItem value="">
                          <em>Select...</em>
                        </MenuItem>
                        {opts.map(opt => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                      {signupErrors[field._id] && (
                        <Typography variant="caption" color="error">{signupErrors[field._id]}</Typography>
                      )}
                    </Box>
                  );
                }
                return (
                  <TextField
                    key={field._id}
                    label={field.label}
                    value={signupAnswers[field._id] || ''}
                    onChange={(e) => setSignupAnswers(prev => ({ ...prev, [field._id]: e.target.value }))}
                    required={!!field.required}
                    error={!!signupErrors[field._id]}
                    helperText={signupErrors[field._id]}
                    fullWidth
                  />
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignupFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitSignupForm} sx={{ backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Event?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{event.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}
            startIcon={deleting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : undefined}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      
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
                <ListItem key={signup._id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#dc2626' }}>
                      {signup.userName?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <Box sx={{ width: '100%' }}>
                    <ListItemText
                      primary={signup.userName}
                      secondary={`${signup.userEmail} • Signed up ${format(parseISO(signup.signedUpAt), 'MMM d, yyyy')}`}
                    />
                    {signup.additionalInfo && Object.keys(signup.additionalInfo).length > 0 && (
                      <Box sx={{ mt: 0.5, ml: 0.5 }}>
                        {event?.additionalFields?.map((field) => {
                          const answer = signup.additionalInfo[field._id];
                          if (answer == null || String(answer).trim() === '') return null;
                          return (
                            <Typography key={`${signup._id}-${field._id}`} variant="caption" sx={{ display: 'block', color: '#374151' }}>
                              {field.label}: {String(answer)}
                            </Typography>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
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
