 

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
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { trackSearch } from '../../api/analytics';

const Navbar = ({ reminders = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
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
    const trimmed = searchQuery.trim();
    if (trimmed && isAuthenticated) {
      trackSearch(trimmed);
    }
    const target = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search';
    navigate(target);
  };

  const pendingReminders = reminders.filter(r => !r.sent && !r.dismissed);

  return (
    <AppBar position="sticky" sx={{ backgroundColor: 'white', color: 'black', boxShadow: 1 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        
        <Typography
          variant="h5"
          component={Link}
          to="/"
          sx={{
            textDecoration: 'none',
            color: '#dc2626',
            fontWeight: 'bold',
            border: 'none',
            outline: 'none',
            '&:hover': { opacity: 0.8 },
            '&:focus': { outline: 'none' },
          }}
        >
          TheLoop
        </Typography>

        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            to="/calendar"
            startIcon={<CalendarIcon />}
            sx={{ color: 'black', '&:hover': { backgroundColor: '#f3f4f6' } }}
          >
            Calendar
          </Button>

          
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

          
          {isAuthenticated && user?.role === 'organiser' && (
            <Button
              component={Link}
              to="/organiser/dashboard"
              startIcon={<DashboardIcon />}
              sx={{ 
                color: '#dc2626',
                '&:hover': { backgroundColor: '#fef2f2' },
              }}
            >
              Dashboard
            </Button>
          )}

          
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
                <MenuItem onClick={handleMyEvents}>Attending Events</MenuItem>
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
