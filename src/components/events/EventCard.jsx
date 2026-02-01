 

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Image as ImageIcon,
  AutoAwesome as MatchIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { trackEventView } from '../../api/analytics';
import * as eventsApi from '../../api/events';

const EventCard = ({ event, showSignupButton = true, signUpForEvent, cancelSignup, isSignedUp, loading, showMatchScore = false, clearSearchOnBack = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userSignedUp, setUserSignedUp] = useState(false);

  // Handle card click - navigate and track view
  const handleCardClick = () => {
    // Track event view for personalized recommendations
    if (isAuthenticated) {
      trackEventView(event._id);
    }
    navigate(`/events/${event._id}`, {
      state: {
        from: location.pathname,
        clearSearchOnBack,
      },
    });
  };

  const isOrganiser = user?._id === event.organiserId;
  const isPast = (() => {
    try {
      return new Date(event.startDate) <= new Date();
    } catch {
      return false;
    }
  })();

  
  useEffect(() => {
    if (isSignedUp && user) {
      (async () => {
        const result = await isSignedUp(event._id);
        setUserSignedUp(result);
      })();
    }
  }, [event._id, isSignedUp, user]);

  const handleSignup = async () => {
    // Check signups closed first (before any navigation)
    if (event.signupsOpen === false) {
      alert('Signups are currently closed for this event.');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${event._id}` } } });
      return;
    }

    if (isPast) {
      alert('Signups are closed because this event has already started.');
      return;
    }

    if (Array.isArray(event.additionalFields) && event.additionalFields.length > 0) {
      // Fetch fresh event data to check if signups are still open and if additional fields still exist
      const freshResult = await eventsApi.getEventById(event._id);
      if (!freshResult.success || freshResult.data.signupsOpen === false) {
        alert('Signups are currently closed for this event.');
        return;
      }
      
      // Check if the event still has additional fields (it may have been edited)
      const freshEvent = freshResult.data;
      if (Array.isArray(freshEvent.additionalFields) && freshEvent.additionalFields.length > 0) {
        // Event still has additional fields, navigate to details page
        navigate(`/events/${event._id}`, { state: { openSignup: true } });
        return;
      }
      // Event no longer has additional fields, allow direct signup
    }

    const result = await signUpForEvent(event._id);
    if (result.success) {
      setUserSignedUp(true);
    } else if (result.requiresRefresh) {
      // Event was edited to add required fields - navigate to detail page to fill them
      navigate(`/events/${event._id}`, { state: { openSignup: true } });
    } else {
      alert(result.error);
    }
  };

  const handleCancelSignup = async () => {
    const result = await cancelSignup(event._id);
    if (result.success) {
      setUserSignedUp(false);
      setConfirmOpen(false);
    } else {
      alert(result.error);
    }
  };

  const formatEventDate = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    const startDateStr = format(start, 'd MMMM yyyy');
    const endDateStr = format(end, 'd MMMM yyyy');
    
    if (startDateStr === endDateStr) {
      return startDateStr;
    }
    return `${format(start, 'd')}-${format(end, 'd MMMM yyyy')}`;
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
          cursor: 'pointer',
        }}
        onClick={handleCardClick}
      >
        
        <Box
          sx={{
            height: 160,
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {event.imageUrl ? (
            <CardMedia
              component="img"
              height="160"
              image={event.imageUrl}
              alt={event.title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#9ca3af',
              }}
            >
              <ImageIcon sx={{ fontSize: 48 }} />
            </Box>
          )}
          
          
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
              flexWrap: 'wrap',
              maxWidth: '70%',
              justifyContent: 'flex-end',
            }}
          >
            {showMatchScore && event.similarityScore > 0 && (
              <Chip
                icon={<MatchIcon sx={{ fontSize: 14, color: 'white !important' }} />}
                label={`${Math.round(event.similarityScore * 100)}% match`}
                size="small"
                sx={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  fontSize: '0.7rem',
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
            )}
            {event.interests.slice(0, 2).map((interest) => (
              <Chip
                key={interest}
                label={interest}
                size="small"
                sx={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: '0.7rem',
                }}
              />
            ))}
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {event.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <LocationIcon sx={{ fontSize: 18, color: '#6b7280', mr: 0.5 }} />
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.location}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarIcon sx={{ fontSize: 18, color: '#6b7280', mr: 0.5 }} />
            <Typography variant="body2" color="textSecondary">
              {formatEventDate(event.startDate, event.endDate)}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {event.description}
          </Typography>
        </CardContent>

        {showSignupButton && !isOrganiser && (
          <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
            {userSignedUp ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmOpen(true);
                }}
                sx={{
                  borderColor: '#dc2626',
                  color: '#dc2626',
                  '&:hover': {
                    borderColor: '#b91c1c',
                    backgroundColor: '#fef2f2',
                  },
                }}
              >
                Signed Up ✓
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSignup();
                }}
                disabled={loading || event.isFull || isPast || event.signupsOpen === false}
                sx={{
                  borderColor: '#000',
                  color: '#000',
                  '&:hover': {
                    borderColor: '#dc2626',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', width: '100%' }}>
                    <CircularProgress size={18} />
                    Loading...
                  </Box>
                ) : (
                  isPast || event.signupsOpen === false ? 'Signups closed' : (event.isFull ? 'Event Full' : 'Sign up')
                )}
              </Button>
            )}
          </CardActions>
        )}
      </Card>

      
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Cancel Signup?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your signup for "{event.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>No, Keep</Button>
          <Button
            onClick={handleCancelSignup}
            color="error"
            variant="contained"
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EventCard;
