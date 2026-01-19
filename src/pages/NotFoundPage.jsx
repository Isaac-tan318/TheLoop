/**
 * 404 Not Found Page
 */

import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage = () => {
  const navigate = useNavigate();

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
        <ErrorOutlineIcon
          sx={{
            fontSize: 120,
            color: '#dc2626',
            mb: 3,
          }}
        />
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 700,
            color: '#dc2626',
            mb: 1,
          }}
        >
          404
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            mb: 2,
          }}
        >
          Page Not Found
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mb: 4,
            maxWidth: 400,
          }}
        >
          Sorry, the page you're looking for doesn't exist or has been moved.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            Go Home
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{
              borderColor: '#dc2626',
              color: '#dc2626',
              '&:hover': {
                borderColor: '#b91c1c',
                bgcolor: 'rgba(220, 38, 38, 0.04)',
              },
            }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
