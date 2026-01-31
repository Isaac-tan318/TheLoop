// Register Form Component

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { registerSchema, validateForm } from '../../utils/validation';
import InterestTags from '../common/InterestTags';

const steps = ['Account Details', 'Role & Interests'];

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    interests: [],
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    clearError();
  };

  const handleInterestsChange = (interests) => {
    setFormData(prev => ({ ...prev, interests }));
    if (errors.interests) {
      setErrors(prev => ({ ...prev, interests: null }));
    }
  };

  const validateStep = (step) => {
    let stepErrors = {};
    
    if (step === 0) {
      if (!formData.name || formData.name.length < 2) {
        stepErrors.name = 'Name must be at least 2 characters';
      }
      if (!formData.email) {
        stepErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = 'Please enter a valid email';
      }
      if (!formData.password || formData.password.length < 6) {
        stepErrors.password = 'Password must be at least 6 characters';
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        stepErrors.password = 'Password must contain uppercase, lowercase, and number';
      }
      if (formData.password !== formData.confirmPassword) {
        stepErrors.confirmPassword = "Passwords don't match";
      }
    }
    if (step === 1) {
      if (!formData.role) {
        stepErrors.role = 'Please select a role';
      }
    }
    
    return stepErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(activeStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // If not on final step, validate current step and advance instead of submitting
    if (activeStep !== steps.length - 1) {
      const stepErrors = validateStep(activeStep);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
      setActiveStep((prev) => prev + 1);
      return;
    }
    
    const validation = validateForm(registerSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      if (result.data.role === 'organiser') {
        navigate('/organiser/dashboard');
      } else {
        navigate('/events');
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: '#f9fafb',
        px: 2,
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}
        >
          Create Account
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 3, textAlign: 'center' }}
        >
          Join TheLoop to discover amazing events
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-active': { color: '#dc2626' },
                    '&.Mui-completed': { color: '#dc2626' },
                  },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {activeStep === 0 && (
            <>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}

          {activeStep === 1 && (
            <>
              <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                <FormLabel
                  component="legend"
                  sx={{
                    '&.Mui-focused': { color: '#dc2626' },
                  }}
                >
                  I am a...
                </FormLabel>
                <RadioGroup
                  row
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <FormControlLabel
                    value="student"
                    control={
                      <Radio
                        sx={{
                          '&.Mui-checked': { color: '#dc2626' },
                        }}
                      />
                    }
                    label="Student"
                  />
                  <FormControlLabel
                    value="organiser"
                    control={
                      <Radio
                        sx={{
                          '&.Mui-checked': { color: '#dc2626' },
                        }}
                      />
                    }
                    label="Event Organiser"
                  />
                </RadioGroup>
                  {errors.role && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {errors.role}
                    </Typography>
                  )}
              </FormControl>

              <Box sx={{ mb: 3 }}>
                <InterestTags
                  selected={formData.interests}
                  onChange={handleInterestsChange}
                  label="Select Your Interests (Optional)"
                  maxSelections={10}
                />
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  {formData.role === 'student'
                    ? 'Select interests to get personalized event recommendations'
                    : 'These will be your default interests for events you create'}
                </Typography>
              </Box>
            </>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ color: '#dc2626' }}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
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
                    Creating Account...
                  </Box>
                ) : (
                  'Create Account'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                sx={{
                  backgroundColor: '#dc2626',
                  '&:hover': { backgroundColor: '#b91c1c' },
                }}
              >
                Next
              </Button>
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{ mt: 3, textAlign: 'center' }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#dc2626', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterForm;
