/**
 * Events Page
 * Browse and search all events
 */

import { Container, Typography, Box, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import { EventCard } from '../components';
import { useEvents } from '../context/EventsContext';
import { useInterests } from '../context/InterestsContext';

const EventsPage = () => {
  const { events, loading, filters, updateFilters } = useEvents();
  const { interests } = useInterests();

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
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Interest</InputLabel>
            <Select
              value={filters.interests.length > 0 ? filters.interests[0] : 'All'}
              label="Filter by Interest"
              onChange={handleInterestFilter}
            >
              <MenuItem value="All">All</MenuItem>
              {interests.map((interest) => (
                <MenuItem key={interest} value={interest}>
                  {interest}
                </MenuItem>
              ))}
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
