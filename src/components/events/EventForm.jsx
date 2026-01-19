 

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Grid,
  Select,
  MenuItem,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { eventSchema, validateForm } from '../../utils/validation';
import InterestTags from '../common/InterestTags';
import { format, parseISO } from 'date-fns';
import { useUI } from '../../context/UIContext';

const EventForm = ({ event = null, onSuccess, createEvent, updateEvent, interests = [], loading = false, error = null }) => {
  const navigate = useNavigate();
  const { notify } = useUI();
  
  const isEditing = !!event;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: 50,
    interests: [],
    additionalFields: [],
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
        additionalFields: event.additionalFields || [],
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

  const addAdditionalField = () => {
    setFormData(prev => ({
      ...prev,
      additionalFields: [
        ...prev.additionalFields,
        { id: Date.now().toString(), label: '', type: 'text', required: false, options: '' },
      ],
    }));
  };

  const updateAdditionalField = (id, key, value) => {
    setFormData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.map(f => f.id === id ? { ...f, [key]: value } : f),
    }));
  };

  const removeAdditionalField = (id) => {
    setFormData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.filter(f => f.id !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    const dataToValidate = {
      ...formData,
      capacity: Number(formData.capacity),
    };

    
    if (!isEditing) {
      const validation = validateForm(eventSchema, dataToValidate);
      if (!validation.success) {
        setErrors(validation.errors);
        setSubmitError('Please fix the highlighted fields before submitting.');
        return;
      }
    } else {
      
      if (!formData.title || formData.title.length < 3) {
        setErrors({ title: 'Title must be at least 3 characters' });
        setSubmitError('Please fix the highlighted fields before submitting.');
        return;
      }
      if (!formData.description || formData.description.length < 10) {
        setErrors({ description: 'Description must be at least 10 characters' });
        setSubmitError('Please fix the highlighted fields before submitting.');
        return;
      }
      if (!formData.interests || formData.interests.length === 0) {
        setErrors({ interests: 'Please select at least one interest' });
        setSubmitError('Please fix the highlighted fields before submitting.');
        return;
      }
    }

    const eventData = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      additionalFields: (formData.additionalFields || []).map(f => ({
        id: f.id,
        label: f.label.trim(),
        type: f.type,
        required: !!f.required,
        options: f.type === 'select' ? String(f.options || '') : undefined,
      })),
    };

    let result;
    if (isEditing) {
      result = await updateEvent(event.id, eventData);
    } else {
      result = await createEvent(eventData);
    }

    if (result.success) {
      notify(isEditing ? 'Event updated successfully!' : 'Event created successfully!', 'success');
      if (onSuccess) {
        onSuccess(result.data);
      } else {
        navigate('/organiser/dashboard');
      }
    } else {
      notify(result.error || (isEditing ? 'Failed to update event.' : 'Failed to create event.'), 'error');
      setSubmitError(result.error);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
        {isEditing ? 'Edit Event' : ''}
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
            interests={interests}
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

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Signup Form (optional)
        </Typography>
        <Typography color="textSecondary" sx={{ mb: 2 }}>
          Add questions to collect extra info from students when they sign up.
        </Typography>

        {formData.additionalFields?.map((field) => (
          <Paper key={field.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Question label"
                  value={field.label}
                  onChange={(e) => updateAdditionalField(field.id, 'label', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Select
                  fullWidth
                  value={field.type}
                  onChange={(e) => updateAdditionalField(field.id, 'type', e.target.value)}
                >
                  <MenuItem value="text">Short text</MenuItem>
                  <MenuItem value="textarea">Long text</MenuItem>
                  <MenuItem value="select">Select</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.required}
                      onChange={(e) => updateAdditionalField(field.id, 'required', e.target.checked)}
                    />
                  }
                  label="Required"
                />
              </Grid>
              <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <IconButton color="error" onClick={() => removeAdditionalField(field.id)} aria-label="Remove question">
                  <DeleteIcon />
                </IconButton>
              </Grid>

              {field.type === 'select' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Options (comma-separated)"
                    value={field.options || ''}
                    onChange={(e) => updateAdditionalField(field.id, 'options', e.target.value)}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        ))}

        <Box sx={{ mb: 4 }}>
          <Button startIcon={<AddIcon />} onClick={addAdditionalField}>
            Add question
          </Button>
        </Box>

        {/* Inline submit error above buttons */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

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
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} sx={{ color: 'white' }} />
                Saving...
              </Box>
            ) : (
              isEditing ? 'Update Event' : 'Create Event'
            )}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default EventForm;
