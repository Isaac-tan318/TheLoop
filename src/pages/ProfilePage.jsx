 

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Alert,
  Avatar,
} from '@mui/material';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import InterestTags from '../components/common/InterestTags';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { notify } = useUI();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    interests: user?.interests || [],
  });
  const [profileError, setProfileError] = useState('');

  const handleInterestsChange = async (interests) => {
    setProfileData(prev => ({ ...prev, interests }));
    setProfileError('');

    // Auto-save interests
    try {
      await updateProfile({ ...profileData, interests });
      notify('Interests updated', 'success');
    } catch (error) {
      console.error('ERROR in updateProfile:', error);
      setProfileError('Failed to update interests.');
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
            Your Interests
          </Typography>

          {profileError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {profileError}
            </Alert>
          )}

          <Box>
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
          </Box>
        </Paper>

        
        
      </Container>

      
    </Box>
  );
};

export default ProfilePage;
