/**
 * Create Event Page
 */

import { Container, Box, Typography } from '@mui/material';
import EventForm from '../../components/events/EventForm';

const CreateEventPage = ({ eventsProps, interestsProps }) => {
  const { createEvent, updateEvent, loading, error } = eventsProps;
  const { interests } = interestsProps;

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          Create New Event
        </Typography>
        <EventForm
          createEvent={createEvent}
          updateEvent={updateEvent}
          interests={interests}
          loading={loading}
          error={error}
        />
      </Container>
    </Box>
  );
};

export default CreateEventPage;
