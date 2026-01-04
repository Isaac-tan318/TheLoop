/**
 * Event Detail Page
 */

import { useParams } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { EventDetail } from '../components';

const EventDetailPage = () => {
  const { id } = useParams();

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EventDetail eventId={id} />
      </Container>
    </Box>
  );
};

export default EventDetailPage;
