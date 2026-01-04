/**
 * Main App Component
 * Sets up routing, providers, and global components
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { EventsProvider } from './context/EventsContext';
import { RemindersProvider } from './context/RemindersContext';
import { InterestsProvider } from './context/InterestsContext';

// Components
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import ReminderNotification from './components/reminders/ReminderNotification';

// Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CalendarPage from './pages/CalendarPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import MyEventsPage from './pages/MyEventsPage';
import RemindersPage from './pages/RemindersPage';
import OrganiserDashboard from './pages/organiser/OrganiserDashboard';
import CreateEventPage from './pages/organiser/CreateEventPage';
import EditEventPage from './pages/organiser/EditEventPage';

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
          <EventsProvider>
            <InterestsProvider>
              <RemindersProvider>
                <AppContent />
              </RemindersProvider>
            </InterestsProvider>
          </EventsProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App
