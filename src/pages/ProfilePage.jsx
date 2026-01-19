 

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Divider,
  Avatar,
  Grid,
  Snackbar,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import InterestTags from '../components/common/InterestTags';
import { profileSchema, validateForm } from '../utils/validation';

const ProfilePage = () => {
  const { user, updateProfile, loading } = useAuth();
  const { notify } = useUI();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    interests: user?.interests || [],
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setProfileErrors(prev => ({ ...prev, [name]: null }));
    setProfileSuccess('');
    setProfileError('');
    setJustSaved(false);
  };

  const handleInterestsChange = (interests) => {
    setProfileData(prev => ({ ...prev, interests }));
    setProfileSuccess('');
    setProfileError('');
    setJustSaved(false);
  };


  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    console.log('1. Submit started');
    
    const validation = validateForm(profileSchema, profileData);
    console.log('2. Validation result:', validation);
    if (!validation.success) {
      console.log('STOP: Validation failed', validation.errors);
      setProfileErrors(validation.errors);
      setSnackbarOpen(false);
      return;
    }

    try {
      console.log('3. Calling updateProfile...');
      await updateProfile(profileData);
      console.log('4. updateProfile finished successfully');
      setProfileSuccess('Changes saved successfully!');
      setProfileError('');
      setJustSaved(true);
      console.log('5. Trigger global Snackbar');
      notify('Changes saved successfully!', 'success');
    } catch (error) {
      console.error('ERROR in updateProfile:', error);
      setProfileError('Failed to update profile.');
    }
  };

  

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          Profile Settings
        </Typography>

        
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: '#dc2626',
                fontSize: '2rem',
                mr: 3,
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {user?.name}
              </Typography>
              <Typography color="textSecondary">{user?.email}</Typography>
              <Typography variant="caption" sx={{ 
                backgroundColor: user?.role === 'organiser' ? '#fef3c7' : '#dcfce7',
                color: user?.role === 'organiser' ? '#92400e' : '#166534',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block',
                mt: 0.5,
              }}>
                {user?.role === 'organiser' ? 'Event Organiser' : 'Student'}
              </Typography>
            </Box>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Edit Profile
          </Typography>

          {profileSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {profileSuccess}
            </Alert>
          )}
          {profileError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {profileError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleProfileSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              error={!!profileErrors.name}
              helperText={profileErrors.name}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <InterestTags
                selected={profileData.interests}
                onChange={handleInterestsChange}
                label="Your Interests"
                maxSelections={10}
                allowCreate
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {user?.role === 'student'
                  ? 'Select interests to get personalized event recommendations'
                  : 'These will be your default interests for events you create'}
              </Typography>
            </Box>

            

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={justSaved ? <CheckIcon /> : undefined}
              sx={{
                backgroundColor: justSaved ? '#16a34a' : '#dc2626',
                '&:hover': { backgroundColor: justSaved ? '#15803d' : '#b91c1c' },
              }}
            >
              {loading
                ? 'Saving...'
                : justSaved
                ? 'Changes saved successfully'
                : 'Save Changes'}
            </Button>
          </Box>
        </Paper>

        
        
      </Container>

      
    </Box>
  );
};

export default ProfilePage;
