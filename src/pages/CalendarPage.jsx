/**
 * Calendar Page
 */

import { Container, Box, Typography } from '@mui/material';
import EventCalendar from '../components/calendar/EventCalendar';

const CalendarPage = ({ eventsProps }) => {
  const { events } = eventsProps;
  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          Events Calendar
        </Typography>
        <EventCalendar events={events} />
      </Container>
    </Box>
  );
};

export default CalendarPage;
