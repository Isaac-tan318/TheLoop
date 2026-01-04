/**
 * Main App Component
 * Sets up routing, providers, and global components
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context Providers
import {
  AuthProvider,
  EventsProvider,
  RemindersProvider,
  InterestsProvider,
} from './context';

// Components
import { Navbar, ProtectedRoute, ReminderNotification } from './components';

// Pages
import {
  HomePage,
  EventsPage,
  EventDetailPage,
  CalendarPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  MyEventsPage,
  RemindersPage,
  OrganiserDashboard,
  CreateEventPage,
  EditEventPage,
} from './pages';

// MUI Theme with red primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    secondary: {
      main: '#6b7280',
    },
    background: {
      default: '#f9fafb',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#dc2626',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#dc2626',
          },
        },
      },
    },
  },
});

function AppContent() {
  return (
    <>
      <Navbar />
      <ReminderNotification />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes - Any Authenticated User */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-events"
          element={
            <ProtectedRoute>
              <MyEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <RemindersPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Organiser Only */}
        <Route
          path="/organiser/dashboard"
          element={
            <ProtectedRoute allowedRoles={['organiser']}>
              <OrganiserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/new"
          element={
            <ProtectedRoute allowedRoles={['organiser']}>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['organiser']}>
              <EditEventPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <InterestsProvider>
            <EventsProvider>
              <RemindersProvider>
                <AppContent />
              </RemindersProvider>
            </EventsProvider>
          </InterestsProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App
