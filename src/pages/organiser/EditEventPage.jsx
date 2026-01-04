/**
 * Edit Event Page
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, Typography } from '@mui/material';
import EventForm from '../../components/events/EventForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getEventById } from '../../api/events';
import { useAuth } from '../../context/AuthContext';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      const result = await getEventById(id);
      if (result.success) {
        // Check if user is the organiser
        if (result.data.organiserId !== user?.id) {
          navigate('/organiser/dashboard');
          return;
        }
        setEvent(result.data);
      } else {
        navigate('/organiser/dashboard');
      }
      setLoading(false);
    };

    fetchEvent();
  }, [id, user, navigate]);

  if (loading) {
    return <LoadingSpinner message="Loading event..." />;
  }

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          Edit Event
        </Typography>
        <EventForm event={event} />
      </Container>
    </Box>
  );
};

export default EditEventPage;
