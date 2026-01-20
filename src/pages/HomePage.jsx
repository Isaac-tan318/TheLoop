 

import { useMemo, useState, useEffect } from 'react';
import { Box, Container, Typography, Button, CircularProgress, Alert, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import { Add as AddIcon, AutoAwesome as PersonalizedIcon } from '@mui/icons-material';
import EventCard from '../components/events/EventCard';
import { useAuth } from "../context/AuthContext";
import { parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { getRecommendedEvents } from '../api/events';

const HomePage = ({ eventsProps }) => {
  const { events, signUpForEvent, cancelSignup, isSignedUp, loading: eventsLoading = false } = eventsProps || {};
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationType, setRecommendationType] = useState('popular');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);

  const isOrganiser = user?.role === 'organiser';

  // Fetch recommendations when user is authenticated
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated || authLoading) return;
      
      setRecommendationsLoading(true);
      setRecommendationsError(null);
      
      try {
        const result = await getRecommendedEvents(6);
        if (result.success) {
          setRecommendations(result.data);
          setRecommendationType(result.recommendationType);
        } else {
          setRecommendationsError(result.error || 'Failed to load recommendations');
        }
      } catch (err) {
        setRecommendationsError('Failed to load recommendations');
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();
  }, [isAuthenticated, authLoading, user?.interests?.length]);

  const now = new Date();
  const oneWeekFromNow = addDays(now, 7);

  
  const newEvents = useMemo(() => {
    return events
      .filter(event => isAfter(parseISO(event.startDate), now))
      .slice(0, 6);
  }, [events]);

  
  const upcomingEvents = useMemo(() => {
    return events
      .filter(event => {
        const start = parseISO(event.startDate);
        return isAfter(start, now) && isBefore(start, oneWeekFromNow);
      })
      .slice(0, 6);
  }, [events]);

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      
      {!isAuthenticated && !authLoading && (
        <Box
          sx={{
            backgroundColor: '#dc2626',
            color: 'white',
            py: 8,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'left' }}>
              Discover Amazing Events
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join TheLoop to find and sign up for events that match your interests
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: 'white',
                  color: '#dc2626',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                }}
              >
                Get Started
              </Button>
              <Button
                component={Link}
                to="/events"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Browse Events
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      {/* Welcome section for logged-in users */}
      {isAuthenticated && !authLoading && (
        <Box
          sx={{
            backgroundColor: '#dc2626',
            color: 'white',
            py: 6,
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Welcome back, {user?.name || 'User'}!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {isOrganiser 
                ? 'Manage your events and connect with attendees'
                : 'Discover events and stay connected with your community'}
            </Typography>
          </Container>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: 4 }}>

        {/* Recommendations Section - Only for authenticated users */}
        {isAuthenticated && !authLoading && (
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <PersonalizedIcon sx={{ color: '#dc2626' }} />
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                Recommended for You
              </Typography>
              {recommendationType === 'personalized' && (
                <Chip 
                  label="Based on your activity" 
                  size="small" 
                  sx={{ ml: 1, backgroundColor: '#fef2f2', color: '#dc2626' }}
                />
              )}
            </Box>

            {recommendationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#dc2626' }} />
              </Box>
            ) : recommendationsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {recommendationsError}
              </Alert>
            ) : recommendations.length > 0 ? (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {recommendations.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      signUpForEvent={signUpForEvent}
                      cancelSignup={cancelSignup}
                      isSignedUp={isSignedUp}
                      loading={eventsLoading}
                      showMatchScore={recommendationType === 'personalized'}
                    />
                  ))}
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography color="textSecondary">No recommendations available at the moment.</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Loading state */}
        {eventsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#dc2626' }} />
          </Box>
        ) : events.length === 0 ? (
          /* Empty state */
          <Box sx={{ textAlign: 'center', py: 8, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography color="textSecondary">No events at the moment. Check back later!</Typography>
          </Box>
        ) : (
          /* Events content */
          <>
            {newEvents.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
                    New events
                  </Typography>
                  {isOrganiser && (
                    <Button
                      component={Link}
                      to="/organiser/events/new"
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        backgroundColor: '#dc2626',
                        '&:hover': { backgroundColor: '#b91c1c' },
                      }}
                    >
                      Create Event
                    </Button>
                  )}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {newEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      signUpForEvent={signUpForEvent}
                      cancelSignup={cancelSignup}
                      isSignedUp={isSignedUp}
                      loading={eventsLoading}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {upcomingEvents.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Upcoming events
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                  {upcomingEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      signUpForEvent={signUpForEvent}
                      cancelSignup={cancelSignup}
                      isSignedUp={isSignedUp}
                      loading={eventsLoading}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Show empty if no new/upcoming but events exist (all past) */}
            {newEvents.length === 0 && upcomingEvents.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8, backgroundColor: 'white', borderRadius: 2 }}>
                <Typography color="textSecondary">No upcoming events at the moment. Check back later!</Typography>
              </Box>
            )}
          </>
        )}

        
        {!isAuthenticated && !authLoading && (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              backgroundColor: 'white',
              borderRadius: 2,
              mt: 4,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              Ready to join the community?
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
              Create an account to sign up for events and receive reminders
            </Typography>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              sx={{
                backgroundColor: '#dc2626',
                '&:hover': { backgroundColor: '#b91c1c' },
              }}
            >
              Sign Up Now
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;
