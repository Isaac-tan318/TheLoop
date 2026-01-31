// 401 Unauthorized Page

import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const originLocation = location.state?.from;

  const handleGoBack = () => {
    if (isAuthenticated) {
      // Redirect to appropriate dashboard based on role
      if (user?.role === 'organiser') {
        navigate('/organiser/dashboard');
      } else {
        navigate('/');
      }
    } else {
      handleSignIn();
    }
  };

  const handleSignIn = () => {
    if (originLocation) {
      navigate('/login', { state: { from: originLocation } });
    } else {
      navigate('/login');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(220, 38, 38, 0.1)',
            borderRadius: '50%',
            p: 3,
            mb: 3,
          }}
        >
          <LockOutlinedIcon
            sx={{
              fontSize: 80,
              color: '#dc2626',
            }}
          />
        </Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 700,
            color: '#dc2626',
            mb: 1,
          }}
        >
          401
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 2,
          }}
        >
          Unauthorized Access
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mb: 4,
            maxWidth: 400,
          }}
        >
          {isAuthenticated
            ? "You don't have permission to access this page. Please contact an administrator if you believe this is an error."
            : 'You need to be logged in to access this page. Please sign in to continue.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isAuthenticated ? (
            <Button
              variant="contained"
              onClick={handleGoBack}
              sx={{
                bgcolor: '#dc2626',
                '&:hover': { bgcolor: '#b91c1c' },
              }}
            >
              Go to Home
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSignIn}
              sx={{
                bgcolor: '#dc2626',
                '&:hover': { bgcolor: '#b91c1c' },
              }}
            >
              Sign In
            </Button>
          )}

        </Box>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;
