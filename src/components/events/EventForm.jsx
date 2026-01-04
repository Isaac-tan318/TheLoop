/**
 * Event Form Component
 * Form for creating and editing events (for organisers)
 */

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { eventSchema, validateForm } from '../../utils/validation';
import { useEvents } from '../../context/EventsContext';
import InterestTags from '../common/InterestTags';
import { format, parseISO } from 'date-fns';

const EventForm = ({ event = null, onSuccess }) => {
  const navigate = useNavigate();
  const { createEvent, updateEvent, loading, error } = useEvents();
  
  const isEditing = !!event;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: 50,
    interests: [],
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: format(parseISO(event.startDate), "yyyy-MM-dd'T'HH:mm"),
        endDate: format(parseISO(event.endDate), "yyyy-MM-dd'T'HH:mm"),
        capacity: event.capacity,
        interests: event.interests,
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || '' : value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    setSubmitError('');
  };

  const handleInterestsChange = (interests) => {
    setFormData(prev => ({ ...prev, interests }));
    if (errors.interests) {
      setErrors(prev => ({ ...prev, interests: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For editing, we skip the future date validation
    const dataToValidate = {
      ...formData,
      capacity: Number(formData.capacity),
    };

    // Custom validation for editing (skip future date check if date hasn't changed)
    if (!isEditing) {
      const validation = validateForm(eventSchema, dataToValidate);
      if (!validation.success) {
        setErrors(validation.errors);
        return;
      }
    } else {
      // Basic validation for editing
      if (!formData.title || formData.title.length < 3) {
        setErrors({ title: 'Title must be at least 3 characters' });
        return;
      }
      if (!formData.description || formData.description.length < 10) {
        setErrors({ description: 'Description must be at least 10 characters' });
        return;
      }
      if (!formData.interests || formData.interests.length === 0) {
        setErrors({ interests: 'Please select at least one interest' });
        return;
      }
    }

    const eventData = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };

    let result;
    if (isEditing) {
      result = await updateEvent(event.id, eventData);
    } else {
      result = await createEvent(eventData);
    }

    if (result.success) {
      if (onSuccess) {
        onSuccess(result.data);
      } else {
        navigate('/organiser/dashboard');
      }
    } else {
      setSubmitError(result.error);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
        {isEditing ? 'Edit Event' : 'Create New Event'}
      </Typography>

      {(submitError || error) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError || error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Event Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={!!errors.title}
          helperText={errors.title}
          sx={{ mb: 3 }}
          required
        />

        <TextField
          fullWidth
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          error={!!errors.description}
          helperText={errors.description}
          multiline
          rows={4}
          sx={{ mb: 3 }}
          required
        />

        <TextField
          fullWidth
          label="Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          error={!!errors.location}
          helperText={errors.location}
          sx={{ mb: 3 }}
          required
        />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Date & Time"
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              error={!!errors.startDate}
              helperText={errors.startDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Date & Time"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              error={!!errors.endDate}
              helperText={errors.endDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
        </Grid>

        <TextField
          fullWidth
          label="Capacity"
          name="capacity"
          type="number"
          value={formData.capacity}
          onChange={handleChange}
          error={!!errors.capacity}
          helperText={errors.capacity || 'Maximum number of participants'}
          sx={{ mb: 3 }}
          inputProps={{ min: 1, max: 10000 }}
          required
        />

        <Box sx={{ mb: 3 }}>
          <InterestTags
            selected={formData.interests}
            onChange={handleInterestsChange}
            label="Event Interest Tags"
            error={!!errors.interests}
            helperText={errors.interests}
            maxSelections={5}
            allowCreate
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Add tags to help students discover your event
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => navigate('/organiser/dashboard')}
            sx={{ color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#dc2626',
              '&:hover': { backgroundColor: '#b91c1c' },
            }}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default EventForm;
