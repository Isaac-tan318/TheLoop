/**
 * Organiser Dashboard Page
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import EventCard from '../../components/events/EventCard';
import { useAuth } from '../../context/AuthContext';
import { parseISO, isPast, isFuture } from 'date-fns';

const OrganiserDashboard = ({ eventsProps }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organiserEvents, signUpForEvent, cancelSignup, isSignedUp, loading } = eventsProps;
  const [tab, setTab] = useState(0);

  const upcomingEvents = useMemo(() => {
    return organiserEvents.filter(event => isFuture(parseISO(event.startDate)));
  }, [organiserEvents]);

  const pastEvents = useMemo(() => {
    return organiserEvents.filter(event => isPast(parseISO(event.startDate)));
  }, [organiserEvents]);

  const totalSignups = useMemo(() => {
    return organiserEvents.reduce((sum, event) => sum + (event.signupCount || 0), 0);
  }, [organiserEvents]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Organiser Dashboard
            </Typography>
            <Typography color="textSecondary">
              Welcome back, {user?.name}!
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/organiser/events/new')}
            sx={{
              backgroundColor: '#dc2626',
              '&:hover': { backgroundColor: '#b91c1c' },
            }}
          >
            Create Event
          </Button>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ backgroundColor: '#fef2f2', borderRadius: '50%', p: 1.5 }}>
                  <EventIcon sx={{ color: '#dc2626' }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{organiserEvents.length}</Typography>
                  <Typography color="textSecondary" variant="body2">Total Events</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ backgroundColor: '#dcfce7', borderRadius: '50%', p: 1.5 }}>
                  <TrendingUpIcon sx={{ color: '#22c55e' }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{upcomingEvents.length}</Typography>
                  <Typography color="textSecondary" variant="body2">Upcoming Events</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ backgroundColor: '#dbeafe', borderRadius: '50%', p: 1.5 }}>
                  <GroupIcon sx={{ color: '#3b82f6' }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalSignups}</Typography>
                  <Typography color="textSecondary" variant="body2">Total Signups</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Events Tabs */}
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
            <Tab label={`All (${organiserEvents.length})`} />
          </Tabs>
        </Paper>

        {/* Events List */}
        {tab === 0 && renderEventGrid(upcomingEvents, "No upcoming events. Create one to get started!")}
        {tab === 1 && renderEventGrid(pastEvents, "No past events yet")}
        {tab === 2 && renderEventGrid(organiserEvents, "You haven't created any events yet")}
      </Container>
    </Box>
  );

  function renderEventGrid(events, emptyMsg) {
    return events.length === 0 ? (
      <Box sx={{ textAlign: 'center', py: 8, backgroundColor: 'white', borderRadius: 2 }}>
        <Typography color="textSecondary">{emptyMsg}</Typography>
      </Box>
    ) : (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
            showSignupButton={false}
            signUpForEvent={signUpForEvent}
            cancelSignup={cancelSignup}
            isSignedUp={isSignedUp}
            loading={loading}
          />
        ))}
      </Box>
    );
  }
};

export default OrganiserDashboard;
