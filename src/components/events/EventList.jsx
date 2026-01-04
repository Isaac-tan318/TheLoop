/**
 * Event List Component
 * Displays a grid of event cards with filtering
 */

import { Box, Typography, FormControl, Select, MenuItem, InputLabel } from '@mui/material';
import EventCard from './EventCard';
import { useEvents } from '../../context/EventsContext';
import { useInterests } from '../../context/InterestsContext';
import LoadingSpinner from '../common/LoadingSpinner';

const EventList = ({ events, title, showFilter = false, emptyMessage = 'No events found' }) => {
  const { loading, filters, updateFilters } = useEvents();
  const { interests } = useInterests();

  const handleInterestFilter = (event) => {
    const value = event.target.value;
    updateFilters({ interests: value === 'All' ? [] : [value] });
  };

  if (loading && events.length === 0) {
    return <LoadingSpinner message="Loading events..." />;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>

        {showFilter && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>By Interest</InputLabel>
            <Select
              value={filters.interests.length > 0 ? filters.interests[0] : 'All'}
              label="By Interest"
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
        )}
      </Box>

      {events.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: '#f9fafb',
            borderRadius: 2,
          }}
        >
          <Typography color="textSecondary">{emptyMessage}</Typography>
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
    </Box>
  );
};

export default EventList;
