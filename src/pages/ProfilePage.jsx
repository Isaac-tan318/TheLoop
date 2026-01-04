/**
 * Profile Page
 * User profile management
 */

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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import InterestTags from '../components/common/InterestTags';
import { profileSchema, changePasswordSchema, validateForm } from '../utils/validation';

const ProfilePage = () => {
  const { user, updateProfile, changePassword, loading } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    interests: user?.interests || [],
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setProfileErrors(prev => ({ ...prev, [name]: null }));
    setProfileSuccess('');
    setProfileError('');
  };

  const handleInterestsChange = (interests) => {
    setProfileData(prev => ({ ...prev, interests }));
    setProfileSuccess('');
    setProfileError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordErrors(prev => ({ ...prev, [name]: null }));
    setPasswordSuccess('');
    setPasswordError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(profileSchema, profileData);
    if (!validation.success) {
      setProfileErrors(validation.errors);
      return;
    }

    const result = await updateProfile(profileData);
    if (result.success) {
      setProfileSuccess('Profile updated successfully!');
    } else {
      setProfileError(result.error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(changePasswordSchema, passwordData);
    if (!validation.success) {
      setPasswordErrors(validation.errors);
      return;
    }

    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (result.success) {
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } else {
      setPasswordError(result.error);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f9fafb', minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
          Profile Settings
        </Typography>

        {/* Profile Info */}
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
              sx={{
                backgroundColor: '#dc2626',
                '&:hover': { backgroundColor: '#b91c1c' },
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Paper>

        {/* Change Password */}
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Change Password
          </Typography>

          {passwordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {passwordSuccess}
            </Alert>
          )}
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          <Box component="form" onSubmit={handlePasswordSubmit}>
            <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              error={!!passwordErrors.currentPassword}
              helperText={passwordErrors.currentPassword}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirmNewPassword"
              type="password"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
              error={!!passwordErrors.confirmNewPassword}
              helperText={passwordErrors.confirmNewPassword}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="outlined"
              disabled={loading}
              sx={{
                borderColor: '#dc2626',
                color: '#dc2626',
                '&:hover': { borderColor: '#b91c1c', backgroundColor: '#fef2f2' },
              }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfilePage;
