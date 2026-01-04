/**
 * Event Detail Page
 */

import { useParams } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import EventDetail from '../components/events/EventDetail';

const EventDetailPage = ({ eventsProps }) => {
  const { id } = useParams();
  const { signUpForEvent, cancelSignup, isSignedUp, deleteEvent, loading } = eventsProps;

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EventDetail
          eventId={id}
          signUpForEvent={signUpForEvent}
          cancelSignup={cancelSignup}
          isSignedUp={isSignedUp}
          deleteEvent={deleteEvent}
          loading={loading}
        />
      </Container>
    </Box>
  );
};

export default EventDetailPage;
