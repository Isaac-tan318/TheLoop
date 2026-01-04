/**
 * Reminders Page
 */

import { Container, Box, Typography } from '@mui/material';
import { ReminderList } from '../components';

const RemindersPage = () => {
  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          My Reminders
        </Typography>
        <ReminderList />
      </Container>
    </Box>
  );
};

export default RemindersPage;
