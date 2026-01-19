 

import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

 
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider } from './context/UIContext';

 
import * as eventsApi from './api/events';
import * as remindersApi from './api/reminders';
import { getInterestsFromEvents } from './api/interests';

 
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import ReminderNotification from './components/reminders/ReminderNotification';

 
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
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

 
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
  const { user } = useAuth();

  
  const [allEvents, setAllEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [userSignups, setUserSignups] = useState([]);
  const [organiserEvents, setOrganiserEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [filters, setFilters] = useState({ interests: [], searchQuery: '', startDate: null, endDate: null });

  
  const [reminders, setReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  
  const userInterests = (user?.interests || []).sort();
  const eventInterests = getInterestsFromEvents(allEvents);
  const otherInterests = eventInterests.filter(i => !userInterests.includes(i));

  
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    const result = await eventsApi.getAllEvents({
      searchQuery: filters.searchQuery,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });
    if (result.success) {
      setAllEvents(result.data);
    }
    setEventsLoading(false);
  }, [filters.searchQuery, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  
  useEffect(() => {
    if (filters.interests.length === 0) {
      setEvents(allEvents);
    } else {
      setEvents(allEvents.filter(e => e.interests?.some(i => filters.interests.includes(i))));
    }
  }, [allEvents, filters.interests]);

  
  const fetchUserSignups = useCallback(async () => {
    if (!user) return;
    const result = await eventsApi.getUserSignups(user.id);
    if (result.success) setUserSignups(result.data);
  }, [user]);

  useEffect(() => {
    fetchUserSignups();
  }, [fetchUserSignups]);

  
  const fetchOrganiserEvents = useCallback(async () => {
    if (!user || user.role !== 'organiser') return;
    const result = await eventsApi.getEventsByOrganiser(user.id);
    if (result.success) setOrganiserEvents(result.data);
  }, [user]);

  useEffect(() => {
    fetchOrganiserEvents();
  }, [fetchOrganiserEvents]);

  
  useEffect(() => {
    if (!user) {
      setReminders([]);
      return;
    }
    const handleReminder = (reminder) => {
      setActiveReminder(reminder);
      setShowNotification(true);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Event Reminder: ${reminder.eventTitle}`, {
          body: `Your event "${reminder.eventTitle}" starts in 24 hours!`,
          icon: '/favicon.ico',
        });
      }
    };
    const cleanup = remindersApi.startReminderPolling(user.id, handleReminder);
    (async () => {
      const res = await remindersApi.getUserReminders(user.id);
      if (res.success) setReminders(res.data);
    })();
    return cleanup;
  }, [user]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const dismissReminder = useCallback(async (id) => {
    await remindersApi.dismissReminder(id);
    setReminders(prev => prev.filter(r => r.id !== id));
    if (activeReminder?.id === id) {
      setActiveReminder(null);
      setShowNotification(false);
    }
  }, [activeReminder]);

  const closeNotification = useCallback(() => {
    if (activeReminder) dismissReminder(activeReminder.id);
    setShowNotification(false);
  }, [activeReminder, dismissReminder]);

  
  const signUpForEvent = useCallback(async (eventId, additionalInfo = null) => {
    if (!user) return { success: false, error: 'Not logged in' };
    const result = await eventsApi.signUpForEvent(eventId, user, additionalInfo);
    if (result.success) {
      await fetchEvents();
      await fetchUserSignups();
    }
    return result;
  }, [user, fetchEvents, fetchUserSignups]);

  const cancelSignup = useCallback(async (eventId) => {
    if (!user) return { success: false, error: 'Not logged in' };
    const result = await eventsApi.cancelSignup(eventId, user.id);
    if (result.success) {
      await fetchEvents();
      await fetchUserSignups();
    }
    return result;
  }, [user, fetchEvents, fetchUserSignups]);

  const isSignedUp = useCallback(async (eventId) => {
    if (!user) return false;
    const res = await eventsApi.isUserSignedUp(eventId, user.id);
    return res.success ? res.data : false;
  }, [user]);

  
  const createEvent = useCallback(async (data) => {
    if (!user) return { success: false };
    const res = await eventsApi.createEvent(data, user);
    if (res.success) {
      await fetchEvents();
      await fetchOrganiserEvents();
    }
    return res;
  }, [user, fetchEvents, fetchOrganiserEvents]);

  const updateEvent = useCallback(async (eventId, updates) => {
    const res = await eventsApi.updateEvent(eventId, updates, user?.id);
    if (res.success) {
      await fetchEvents();
      await fetchOrganiserEvents();
    }
    return res;
  }, [user, fetchEvents, fetchOrganiserEvents]);

  const deleteEvent = useCallback(async (eventId) => {
    const res = await eventsApi.deleteEvent(eventId, user?.id);
    if (res.success) {
      await fetchEvents();
      await fetchOrganiserEvents();
    }
    return res;
  }, [user, fetchEvents, fetchOrganiserEvents]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  
  const eventsProps = {
    events,
    allEvents,
    userSignups,
    organiserEvents,
    loading: eventsLoading,
    filters,
    updateFilters,
    fetchEvents,
    fetchUserSignups,
    fetchOrganiserEvents,
    signUpForEvent,
    cancelSignup,
    isSignedUp,
    createEvent,
    updateEvent,
    deleteEvent,
  };

  const remindersProps = {
    reminders,
    activeReminder,
    showNotification,
    dismissReminder,
    closeNotification,
  };

  const interestsProps = {
    interests: [...userInterests, ...otherInterests],
    userInterests,
    eventInterests,
    otherInterests,
  };

  return (
    <>
      <Navbar
        reminders={reminders}
        updateFilters={updateFilters}
      />
      <ReminderNotification
        activeReminder={activeReminder}
        showNotification={showNotification}
        closeNotification={closeNotification}
      />
      <Routes>
        
        <Route path="/" element={<HomePage eventsProps={eventsProps} />} />
        <Route path="/events" element={<EventsPage eventsProps={eventsProps} interestsProps={interestsProps} />} />
        <Route path="/events/:id" element={<EventDetailPage eventsProps={eventsProps} />} />
        <Route path="/calendar" element={<CalendarPage eventsProps={eventsProps} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        
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
              <MyEventsPage eventsProps={eventsProps} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <RemindersPage remindersProps={remindersProps} />
            </ProtectedRoute>
          }
        />

        
        <Route
          path="/organiser/dashboard"
          element={
            <ProtectedRoute allowedRoles={['organiser']}>
              <OrganiserDashboard eventsProps={eventsProps} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/new"
          element={
            <ProtectedRoute allowedRoles={['organiser']}>
              <CreateEventPage eventsProps={eventsProps} interestsProps={interestsProps} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organiser/events/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['organiser']}>
              <EditEventPage eventsProps={eventsProps} interestsProps={interestsProps} />
            </ProtectedRoute>
          }
        />

        
        {/* Error Pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
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
          <UIProvider>
            <AppContent />
          </UIProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App
