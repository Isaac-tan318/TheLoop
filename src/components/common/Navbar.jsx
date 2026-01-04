/**
 * Navbar Component
 * Main navigation header for the application
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  InputBase,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  CalendarMonth as CalendarIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useReminders } from '../../context/RemindersContext';
import { useEvents } from '../../context/EventsContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { reminders } = useReminders();
  const { updateFilters } = useEvents();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleMyEvents = () => {
    handleMenuClose();
    navigate('/my-events');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ searchQuery });
    if (location.pathname !== '/events') {
      navigate('/events');
    }
  };

  const pendingReminders = reminders.filter(r => !r.sent && !r.dismissed);

  return (
    <AppBar position="sticky" sx={{ backgroundColor: 'white', color: 'black', boxShadow: 1 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: '#dc2626',
            fontWeight: 'bold',
            '&:hover': { opacity: 0.8 },
          }}
        >
          TheLoop
        </Typography>

        {/* Navigation Links & Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/calendar"
            startIcon={<CalendarIcon />}
            sx={{ color: 'black', '&:hover': { backgroundColor: '#f3f4f6' } }}
          >
            Calendar
          </Button>

          {/* Search Bar */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f3f4f6',
              borderRadius: '20px',
              px: 2,
              py: 0.5,
            }}
          >
            <SearchIcon sx={{ color: 'gray', mr: 1 }} />
            <InputBase
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 150 }}
            />
          </Box>

          <Button
            component={Link}
            to="/events"
            startIcon={<EventIcon />}
            sx={{ color: 'black', '&:hover': { backgroundColor: '#f3f4f6' } }}
          >
            Events
          </Button>

          {/* Notifications */}
          {isAuthenticated && (
            <IconButton
              component={Link}
              to="/reminders"
              sx={{ color: 'black' }}
            >
              <Badge badgeContent={pendingReminders.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}

          {/* User Menu / Auth Buttons */}
          {isAuthenticated ? (
            <>
              <IconButton onClick={handleMenuOpen}>
                <Avatar
                  sx={{ bgcolor: '#dc2626', width: 32, height: 32 }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    {user?.email}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleProfile}>Profile</MenuItem>
                <MenuItem onClick={handleMyEvents}>My Events</MenuItem>
                {user?.role === 'organiser' && (
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/organiser/dashboard'); }}>
                    Organiser Dashboard
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout} sx={{ color: '#dc2626' }}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                sx={{
                  borderColor: '#dc2626',
                  color: '#dc2626',
                  '&:hover': { borderColor: '#b91c1c', backgroundColor: '#fef2f2' },
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                sx={{
                  backgroundColor: '#dc2626',
                  '&:hover': { backgroundColor: '#b91c1c' },
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
