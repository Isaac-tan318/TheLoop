// Loading Spinner Component

import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        gap: 2,
      }}
    >
      <CircularProgress sx={{ color: '#dc2626' }} />
      <Typography variant="body2" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
