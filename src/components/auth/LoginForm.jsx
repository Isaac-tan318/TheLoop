/**
 * Login Form Component
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { loginSchema, validateForm, validateField } from '../../utils/validation';

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    clearError();
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(loginSchema, name, value, formData);
    if (fieldError) {
      setErrors(prev => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(loginSchema, formData);
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Redirect based on role
      if (result.data.role === 'organiser') {
        navigate('/organiser/dashboard');
      } else {
        navigate('/');
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
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ mb: 1, fontWeight: 'bold', textAlign: 'center' }}
        >
          Welcome Back
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 3, textAlign: 'center' }}
        >
          Sign in to your account to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
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
            onBlur={handleBlur}
            error={!!errors.password}
            helperText={errors.password}
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
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              backgroundColor: '#dc2626',
              '&:hover': { backgroundColor: '#b91c1c' },
              '&:disabled': { backgroundColor: '#fca5a5' },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                <CircularProgress size={18} sx={{ color: 'white' }} />
                Signing in...
              </Box>
            ) : (
              'Sign In'
            )}
          </Button>

          <Typography
            variant="body2"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: '#dc2626', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;
