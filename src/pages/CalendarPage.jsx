// Calendar Page

import { Container, Box, Typography } from '@mui/material';
import EventCalendar from '../components/calendar/EventCalendar';

const CalendarPage = ({ eventsProps }) => {
  const { events, userSignups } = eventsProps;
  const signedUpEventIds = (userSignups || []).map(e => e._id);
  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <EventCalendar events={events} signedUpEventIds={signedUpEventIds} />
      </Container>
    </Box>
  );
};

export default CalendarPage;
