/**
 * Events Page
 * Browse and search all events
 */

import { useMemo } from 'react';
import { Container, Typography, Box, FormControl, Select, MenuItem, InputLabel, ListSubheader } from '@mui/material';
import EventCard from '../components/events/EventCard';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { getInterestsFromEvents } from '../api/interests';

const EventsPage = () => {
  const { events, allEvents, loading, filters, updateFilters } = useEvents();
  const { user } = useAuth();

  // Get interests from ALL events (unfiltered) so filter options don't disappear
  const { userInterests, otherInterests } = useMemo(() => {
    const userInt = user?.interests || [];
    const eventInt = getInterestsFromEvents(allEvents);
    const other = eventInt.filter(i => !userInt.includes(i));
    return { userInterests: userInt.sort(), otherInterests: other };
  }, [user?.interests, allEvents]);

  const handleInterestFilter = (event) => {
    const value = event.target.value;
    updateFilters({ interests: value === 'All' ? [] : [value] });
  };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            All Events
          </Typography>
          
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
        
        {events.length === 0 ? (
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
                <EventCard event={event} />
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default EventsPage;
