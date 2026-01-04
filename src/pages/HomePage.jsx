/**
 * Home Page
 * Landing page with new and upcoming events
 */

import { useMemo } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';
import EventCard from '../components/events/EventCard';
import { useAuth } from "../context/AuthContext";
import { parseISO, isAfter, isBefore, addDays } from 'date-fns';

const HomePage = ({ eventsProps }) => {
  const { events, signUpForEvent, cancelSignup, isSignedUp, loading } = eventsProps;
  const { isAuthenticated, user } = useAuth();

  const isOrganiser = user?.role === 'organiser';

  const now = new Date();
  const oneWeekFromNow = addDays(now, 7);

  // New events (created in last 7 days or future events)
  const newEvents = useMemo(() => {
    return events
      .filter(event => isAfter(parseISO(event.startDate), now))
      .slice(0, 6);
  }, [events]);

  // Upcoming events (happening in next 7 days)
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
      {/* Hero Section */}
      {!isAuthenticated && (
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Create Event aligned with New events title */}

        {/* New Events Section */}
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
                  loading={loading}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Upcoming Events Section */}
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
                  loading={loading}
                />
              ))}
            </Box>
          </Box>
        )}

        {events.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, backgroundColor: 'white', borderRadius: 2 }}>
            <Typography color="textSecondary">No events at the moment. Check back later!</Typography>
          </Box>
        )}

        {/* CTA for non-authenticated users */}
        {!isAuthenticated && (
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
