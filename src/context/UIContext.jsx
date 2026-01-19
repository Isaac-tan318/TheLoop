import { createContext, useContext, useState, useMemo } from 'react';
import { Snackbar, Alert } from '@mui/material';

const UIContext = createContext(null);

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};

export const UIProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const notify = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const value = useMemo(() => ({ notify }), []);

  return (
    <UIContext.Provider value={value}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 9999, top: { xs: 16, sm: 24 } }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" elevation={6} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </UIContext.Provider>
  );
};
