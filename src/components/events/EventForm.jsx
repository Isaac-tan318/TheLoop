 

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

// Generate a valid 24-character hex ObjectId
const generateObjectId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return timestamp + random;
};
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
    imageUrl: '',
    interests: [],
    additionalFields: [],
    signupsOpen: true,
  });
  const [errors, setErrors] = useState({});
  const [additionalFieldErrors, setAdditionalFieldErrors] = useState({});
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
        imageUrl: event.imageUrl || '',
        interests: event.interests,
        additionalFields: event.additionalFields || [],
        signupsOpen: event.signupsOpen !== false, // Default to true for backwards compatibility
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || '' : value,
    }));
    
    // Validate imageUrl format on change
    if (name === 'imageUrl') {
      if (value && !/^https?:\/\/.+/.test(value)) {
        setErrors(prev => ({ ...prev, imageUrl: 'Please enter a valid URL starting with http:// or https://' }));
      } else if (value && value.length > 500) {
        setErrors(prev => ({ ...prev, imageUrl: 'URL must be less than 500 characters' }));
      } else {
        setErrors(prev => ({ ...prev, imageUrl: null }));
      }
    } else if (errors[name]) {
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
        { _id: generateObjectId(), label: '', type: 'text', required: false, options: '' },
      ],
    }));
  };

  const updateAdditionalField = (_id, key, value) => {
    setFormData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.map(f => f._id === _id ? { ...f, [key]: value } : f),
    }));
  };

  const removeAdditionalField = (_id) => {
    setFormData(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.filter(f => f._id !== _id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate additional fields
    const fieldErrors = {};
    (formData.additionalFields || []).forEach((field, index) => {
      const fieldErr = {};
      
      // Label is required
      if (!field.label || !field.label.trim()) {
        fieldErr.label = 'Question label is required';
      } else if (field.label.trim().length < 3) {
        fieldErr.label = 'Label must be at least 3 characters';
      } else if (field.label.trim().length > 100) {
        fieldErr.label = 'Label must be less than 100 characters';
      }
      
      // Options required for select type
      if (field.type === 'select') {
        const opts = String(field.options || '').split(',').map(s => s.trim()).filter(Boolean);
        if (opts.length < 2) {
          fieldErr.options = 'Please provide at least 2 comma-separated options';
        } else if (opts.length > 20) {
          fieldErr.options = 'Maximum 20 options allowed';
        }
      }
      
      if (Object.keys(fieldErr).length > 0) {
        fieldErrors[field._id] = fieldErr;
      }
    });
    
    setAdditionalFieldErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      setSubmitError('Please fix the errors in your signup form questions.');
      return;
    }
    
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
      // Validate that start date is before end date
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        setErrors({ startDate: 'Start date must be before end date' });
        setSubmitError('Please fix the highlighted fields before submitting.');
        return;
      }
    }

    const eventData = {
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      additionalFields: (formData.additionalFields || []).map(f => ({
        _id: f._id,
        label: f.label.trim(),
        type: f.type,
        required: !!f.required,
        options: f.type === 'select' ? String(f.options || '') : undefined,
      })),
    };

    let result;
    if (isEditing) {
      result = await updateEvent(event._id, eventData);
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

        <FormControlLabel
          control={
            <Checkbox
              checked={formData.signupsOpen !== false}
              onChange={(e) => setFormData(prev => ({ ...prev, signupsOpen: e.target.checked }))}
              sx={{
                color: '#dc2626',
                '&.Mui-checked': { color: '#dc2626' },
              }}
            />
          }
          label="Signups open"
          sx={{ mb: 3 }}
        />
        <Typography variant="caption" color="textSecondary" sx={{ mt: -2, mb: 3, ml: 4, display: 'block' }}>
          Uncheck to close signups for this event
        </Typography>

        <TextField
          fullWidth
          label="Image URL"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          error={!!errors.imageUrl}
          helperText={errors.imageUrl || 'URL for the event banner image (optional)'}
          sx={{ mb: 3 }}
          placeholder="https://example.com/image.jpg"
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
          <Paper 
            key={field._id} 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mb: 2,
              borderColor: additionalFieldErrors[field._id] ? 'error.main' : undefined,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Question label"
                  value={field.label}
                  onChange={(e) => updateAdditionalField(field._id, 'label', e.target.value)}
                  error={!!additionalFieldErrors[field._id]?.label}
                  helperText={additionalFieldErrors[field._id]?.label}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Select
                  fullWidth
                  value={field.type}
                  onChange={(e) => updateAdditionalField(field._id, 'type', e.target.value)}
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
                      onChange={(e) => updateAdditionalField(field._id, 'required', e.target.checked)}
                    />
                  }
                  label="Required"
                />
              </Grid>
              <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <IconButton color="error" onClick={() => removeAdditionalField(field._id)} aria-label="Remove question">
                  <DeleteIcon />
                </IconButton>
              </Grid>

              {field.type === 'select' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Options (comma-separated)"
                    value={field.options || ''}
                    onChange={(e) => updateAdditionalField(field._id, 'options', e.target.value)}
                    error={!!additionalFieldErrors[field._id]?.options}
                    helperText={additionalFieldErrors[field._id]?.options || 'e.g. Option 1, Option 2, Option 3'}
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
