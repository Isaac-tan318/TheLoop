 

import { Container, Typography, Box, FormControl, Select, MenuItem, InputLabel, ListSubheader, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const EventsPage = ({ eventsProps, interestsProps }) => {
  const { events, allEvents, loading, filters, updateFilters, signUpForEvent, cancelSignup, isSignedUp } = eventsProps;
  const { userInterests, otherInterests } = interestsProps;
  const { user } = useAuth();

  const handleInterestFilter = (event) => {
    const value = event.target.value;
    updateFilters({ interests: value === 'All' ? [] : [value] });
  };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {filters.searchQuery && (
              <Button
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={() => window.history.back()}
                sx={{ color: '#dc2626', mr: 1, '&:hover': { backgroundColor: '#fef2f2' } }}
              >
                Back
              </Button>
            )}
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              All Events
            </Typography>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter by Interest</InputLabel>
            <Select
              value={filters.interests.length > 0 ? filters.interests[0] : 'All'}
              label="Filter by Interest"
              onChange={handleInterestFilter}
            >
              <MenuItem value="All">All</MenuItem>
              
              {userInterests.length > 0 && [
                <ListSubheader key="your-interests-header">Your Interests</ListSubheader>,
                ...userInterests.map((interest) => (
                  <MenuItem key={`user-${interest}`} value={interest}>
                    {interest}
                  </MenuItem>
                ))
              ]}
              
              {otherInterests.length > 0 && [
                <ListSubheader key="other-interests-header">Other Interests</ListSubheader>,
                ...otherInterests.map((interest) => (
                  <MenuItem key={`other-${interest}`} value={interest}>
                    {interest}
                  </MenuItem>
                ))
              ]}
            </Select>
          </FormControl>
        </Box>

        {(filters.searchQuery || (filters.interests && filters.interests.length > 0)) && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {filters.searchQuery ? (
              <>Results for "{filters.searchQuery}"</>
            ) : null}
            {filters.searchQuery && filters.interests && filters.interests.length > 0 ? ' • ' : ''}
            {filters.interests && filters.interests.length > 0 ? (
              <>Interest: {filters.interests[0]}</>
            ) : null}
          </Typography>
        )}
        
        {loading && events.length === 0 ? (
          <LoadingSpinner message="Loading events..." />
        ) : events.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              backgroundColor: 'white',
              borderRadius: 2,
            }}
          >
            <Typography color="textSecondary">No events found. Try adjusting your filters.</Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3 
          }}>
            {events.map((event) => (
              <Box key={event.id}>
                <EventCard
                  event={event}
                  signUpForEvent={signUpForEvent}
                  cancelSignup={cancelSignup}
                  isSignedUp={isSignedUp}
                  loading={loading}
                />
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default EventsPage;
