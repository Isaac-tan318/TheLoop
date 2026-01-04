/**
 * My Events Page
 * Shows events the user has signed up for
 */

import { Container, Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useState, useMemo } from 'react';
import EventCard from '../components/events/EventCard';
import { parseISO, isPast, isFuture } from 'date-fns';

const MyEventsPage = ({ eventsProps }) => {
  const { userSignups, signUpForEvent, cancelSignup, isSignedUp, loading } = eventsProps;
  const [tab, setTab] = useState(0);

  const upcomingEvents = useMemo(() => {
    return userSignups.filter(event => isFuture(parseISO(event.startDate)));
  }, [userSignups]);

  const pastEvents = useMemo(() => {
    return userSignups.filter(event => isPast(parseISO(event.startDate)));
  }, [userSignups]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const renderEventGrid = (events, showSignup = true, emptyMsg) => (
    events.length === 0 ? (
      <Box sx={{ textAlign: 'center', py: 8, backgroundColor: 'white', borderRadius: 2 }}>
        <Typography color="textSecondary">{emptyMsg}</Typography>
      </Box>
    ) : (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            showSignupButton={showSignup}
            signUpForEvent={signUpForEvent}
            cancelSignup={cancelSignup}
            isSignedUp={isSignedUp}
            loading={loading}
          />
        ))}
      </Box>
    )
  );

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          My Events
        </Typography>

        <Paper sx={{ mb: 4, borderRadius: 2 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root.Mui-selected': { color: '#dc2626' },
              '& .MuiTabs-indicator': { backgroundColor: '#dc2626' },
            }}
          >
            <Tab label={`Upcoming (${upcomingEvents.length})`} />
            <Tab label={`Past (${pastEvents.length})`} />
          </Tabs>
        </Paper>

        {tab === 0 && renderEventGrid(upcomingEvents, true, "You haven't signed up for any upcoming events yet. Browse events to find something interesting!")}
        {tab === 1 && renderEventGrid(pastEvents, false, "No past events to show")}
      </Container>
    </Box>
  );
};

export default MyEventsPage;
